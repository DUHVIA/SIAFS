import { PrismaClient, CategoriaProducto } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { cifrarTexto, generarIndiceCiego } from '../lib/crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL no está definida en .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, '../../docs/data/Control_Inventario_Automotores.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`No se encontró el archivo fuente en: ${filePath}`);
    process.exit(1);
  }

  console.log(`Cargando archivo de inventario: ${filePath}...`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes('Plantilla Inventario') 
    ? 'Plantilla Inventario' 
    : (workbook.SheetNames.includes('Inventario') ? 'Inventario' : workbook.SheetNames[0]);
    
  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Buscar el usuario admin para asociar los registros de Kardex e Historial
  let adminUser = await prisma.usuario.findFirst({
    where: { isActive: true },
    select: { id: true, email: true }
  });

  if (!adminUser) {
    console.error('No se encontró ningún usuario activo para registrar la importación.');
    process.exit(1);
  }

  console.log(`Usuario auditor asignado: ${adminUser.email} (${adminUser.id})`);

  let creadosCount = 0;
  let tiposCreadosCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Extracción directa según la estructura exacta de la plantilla Excel:
    // row[0] -> Nombre del Producto
    // row[1] -> SKU / Codigo
    // row[2] -> Categoría
    // row[3] -> Tipo de Autoparte
    // row[4] -> Precio Compra
    // row[5] -> Precio Venta
    // row[6] -> Stock Inicial
    // row[7] -> Descripción / Detalles

    const colNombre = String(row[0] || '').trim();
    const colSku = String(row[1] || '').trim();
    const colCategoria = String(row[2] || '').trim();
    const colTipo = String(row[3] || '').trim();

    // Ignorar encabezados o filas vacías
    if (
      !colNombre || 
      colNombre.toUpperCase().includes('NOMBRE') || 
      colNombre.toUpperCase().includes('INVENTARIO')
    ) {
      continue;
    }

    const nombreProducto = colNombre;
    if (nombreProducto.length < 2) continue;

    // Asignación correcta de SKU y Nombre
    const skuProducto = colSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    const precioCompraNum = parseFloat(row[4]) || 0;
    const precioVentaNum = parseFloat(row[5]) || (precioCompraNum > 0 ? precioCompraNum * 1.3 : 100);
    const stockNum = Math.max(parseInt(row[6] ?? '0', 10) || 0, 0);
    const descripcion = String(row[7] || nombreProducto).trim();

    // Determinar Categoría (MOTOR / AUTOPARTE)
    let categoria: CategoriaProducto = colCategoria.toUpperCase() === 'MOTOR' 
      ? CategoriaProducto.MOTOR 
      : CategoriaProducto.AUTOPARTE;

    if (colCategoria.toUpperCase() !== 'MOTOR' && colCategoria.toUpperCase() !== 'AUTOPARTE') {
      const isMotor = nombreProducto.toUpperCase().includes('MOTOR') || 
                      descripcion.toUpperCase().includes('MOTOR') ||
                      nombreProducto.toUpperCase().includes('CULATA') ||
                      nombreProducto.toUpperCase().includes('CIGÜEÑAL');
      categoria = isMotor ? CategoriaProducto.MOTOR : CategoriaProducto.AUTOPARTE;
    }

    // Determinar Nombre de Tipo de Autoparte
    let tipoNombre = colTipo;
    if (!tipoNombre || tipoNombre === 'General') {
      if (nombreProducto.toUpperCase().includes('CULATA')) tipoNombre = 'Motor';
      else if (nombreProducto.toUpperCase().includes('CAJA')) tipoNombre = 'Transmisión';
      else if (nombreProducto.toUpperCase().includes('CIGÜEÑAL')) tipoNombre = 'Motor';
      else if (categoria === 'MOTOR') tipoNombre = 'Motor';
      else tipoNombre = 'Repuestos';
    }

    // Buscar o crear TipoAutoparte
    let tipoObj = await prisma.tipoAutoparte.findUnique({
      where: { nombre: tipoNombre }
    });

    if (!tipoObj) {
      tipoObj = await prisma.tipoAutoparte.create({
        data: { nombre: tipoNombre }
      });
      tiposCreadosCount++;
    }

    // Cifrar datos de producto para cumplimiento de arquitectura SIAFS
    const nombreCifrado = cifrarTexto(nombreProducto);
    const idxNombre = generarIndiceCiego(nombreProducto);
    const precioVentaCifrado = cifrarTexto(precioVentaNum.toFixed(2));
    const stockCifrado = cifrarTexto(stockNum.toString());

    // JSON cifrado en detalles con el SKU asignado correctamente
    const detallesJSON = JSON.stringify({
      sku: skuProducto,
      descripcion,
      precioCompra: precioCompraNum.toFixed(2),
      origenImportacion: 'Migración Inicial Excel'
    });
    const detallesCifrados = cifrarTexto(detallesJSON);

    // Guardar en Base de Datos con transacción de Kardex e Historial
    await prisma.$transaction(async (tx) => {
      const nuevoProd = await tx.producto.create({
        data: {
          nombreCifrado,
          idxNombre,
          categoria,
          precioVentaCifrado,
          stockCifrado,
          rangoStock: stockNum,
          detallesCifrados,
          tipoAutoparteId: tipoObj.id
        }
      });

      // Historial de Precio
      await tx.historialPrecio.create({
        data: {
          productoId: nuevoProd.id,
          usuarioId: adminUser.id,
          precioCompraCifrado: cifrarTexto(precioCompraNum.toFixed(2)),
          precioVentaCifrado,
        }
      });

      // Registro en Kardex
      await tx.kardex.create({
        data: {
          productoId: nuevoProd.id,
          usuarioId: adminUser.id,
          tipoMovimiento: 'INGRESO',
          cantidadCifrada: stockCifrado,
          motivoCifrado: cifrarTexto('Migración Inicial desde Excel'),
        }
      });

      // Registro en Lote de Ingreso
      const nuevoIngreso = await tx.ingreso.create({
        data: {
          usuarioId: adminUser.id,
          descripcionCifrada: cifrarTexto(`Lote de Migración Inicial: ${nombreProducto}`),
          totalCifrado: cifrarTexto((precioCompraNum * Math.max(stockNum, 1)).toFixed(2)),
        }
      });

      await tx.detalleIngreso.create({
        data: {
          ingresoId: nuevoIngreso.id,
          productoId: nuevoProd.id,
          cantidadCifrada: cifrarTexto(Math.max(stockNum, 1).toString()),
          costoUnitarioCifrado: cifrarTexto(precioCompraNum.toFixed(2)),
        }
      });
    });

    creadosCount++;
  }

  console.log(`\nImportación completada con éxito:`);
  console.log(` - Productos importados: ${creadosCount}`);
  console.log(` - Tipos de autoparte creados: ${tiposCreadosCount}`);
}

main()
  .catch((e) => {
    console.error('Error durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });