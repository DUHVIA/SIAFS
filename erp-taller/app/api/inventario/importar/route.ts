import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cifrarTexto, generarIndiceCiego } from '@/lib/crypto';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usuarioId = (formData.get('usuarioId') as string) || (request.headers.get('x-usuario-id') as string);

    if (!file) {
      return NextResponse.json({ error: 'No se ha adjuntado ningún archivo Excel' }, { status: 400 });
    }

    // Buscar usuario auditor activo
    let adminUser = null;
    if (usuarioId) {
      adminUser = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    }
    if (!adminUser) {
      adminUser = await prisma.usuario.findFirst({ where: { isActive: true } });
    }
    if (!adminUser) {
      return NextResponse.json({ error: 'No existe usuario activo para registrar la importación' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = workbook.SheetNames.includes('Inventario') ? 'Inventario' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío o no tiene formato válido' }, { status: 400 });
    }

    let creadosCount = 0;
    let tiposCreadosCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();
      const col3 = String(row[3] || '').trim();
      const col4 = String(row[4] || '').trim();

      // Ignorar encabezados y títulos
      if (col0.includes('INVENTARIO') || col0.includes('Escribe') || col0.includes('Código') || col0 === 'Nombre del Producto') {
        continue;
      }

      const nombreProducto = col0 === 'Nombre del Producto' ? col1 : (col1 || col0);
      if (!nombreProducto || nombreProducto.length < 2) continue;

      let categoria: 'AUTOPARTE' | 'MOTOR' = 'AUTOPARTE';
      let tipoNombre = 'General';
      let precioCompraNum = 0;
      let precioVentaNum = 0;
      let stockNum = 1;
      let descripcion = '';

      // Formato 1: Plantilla estandarizada (Nombre | Categoría | Tipo | [Precio Compra] | Precio Venta | Stock | Descripción)
      if (col0 && col1 && (col1.toUpperCase() === 'AUTOPARTE' || col1.toUpperCase() === 'MOTOR')) {
        categoria = col1.toUpperCase() as 'AUTOPARTE' | 'MOTOR';
        tipoNombre = col2 || 'General';
        if (row.length >= 7 && !isNaN(parseFloat(col3))) {
          precioCompraNum = parseFloat(col3) || 0;
          precioVentaNum = parseFloat(row[4]) || 0;
          stockNum = parseInt(row[5], 10) || 1;
          descripcion = String(row[6] || nombreProducto).trim();
        } else {
          precioVentaNum = parseFloat(col3) || 0;
          stockNum = parseInt(col4, 10) || 1;
          descripcion = String(row[5] || nombreProducto).trim();
        }
      } else {
        // Formato 2: Control_Inventario_Automotores.xlsx (Código | Modelo | Serie | Descripción | Precio Compra | Precio Venta | ...)
        descripcion = col3 || nombreProducto;
        precioCompraNum = parseFloat(row[4]) || 0;
        precioVentaNum = parseFloat(row[5]) || (precioCompraNum > 0 ? precioCompraNum * 1.3 : 100);
        stockNum = Math.max(parseInt(row[8] ?? row[6] ?? '1', 10) || 0, 0);

        const isMotor = nombreProducto.toUpperCase().includes('MOTOR') || 
                        descripcion.toUpperCase().includes('MOTOR') ||
                        nombreProducto.toUpperCase().includes('CULATA');
        categoria = isMotor ? 'MOTOR' : 'AUTOPARTE';
        
        if (nombreProducto.toUpperCase().includes('CULATA')) tipoNombre = 'Motor';
        else if (nombreProducto.toUpperCase().includes('CAJA')) tipoNombre = 'Transmisión';
        else if (isMotor) tipoNombre = 'Motor';
        else tipoNombre = 'Repuestos';
      }

      // Buscar o crear TipoAutoparte
      let tipoObj = await prisma.tipoAutoparte.findUnique({ where: { nombre: tipoNombre } });
      if (!tipoObj) {
        tipoObj = await prisma.tipoAutoparte.create({ data: { nombre: tipoNombre } });
        tiposCreadosCount++;
      }

      // Cifrar datos de producto
      const nombreCifrado = cifrarTexto(nombreProducto);
      const idxNombre = generarIndiceCiego(nombreProducto);
      const precioVentaCifrado = cifrarTexto(precioVentaNum.toFixed(2));
      const stockCifrado = cifrarTexto(stockNum.toString());
      const detallesJSON = JSON.stringify({
        sku: col0 || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        descripcion,
        precioCompra: precioCompraNum.toFixed(2),
        origenImportacion: 'Carga Excel Web'
      });
      const detallesCifrados = cifrarTexto(detallesJSON);

      // Crear Producto en transacción con Kardex e Ingreso inicial
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

        // Historial de Precio inicial
        await tx.historialPrecio.create({
          data: {
            productoId: nuevoProd.id,
            usuarioId: adminUser.id,
            precioCompraCifrado: cifrarTexto(precioCompraNum.toFixed(2)),
            precioVentaCifrado,
          }
        });

        // Registro Kardex
        await tx.kardex.create({
          data: {
            productoId: nuevoProd.id,
            usuarioId: adminUser.id,
            tipoMovimiento: 'INGRESO',
            cantidadCifrada: stockCifrado,
            motivoCifrado: cifrarTexto('Migración Inicial desde Excel'),
          }
        });

        // Registro Lote Ingreso
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

    return NextResponse.json({
      success: true,
      mensaje: `Migración exitosa: ${creadosCount} productos importados.`,
      count: creadosCount,
      tiposCreados: tiposCreadosCount
    });

  } catch (error: any) {
    console.error('Error al importar archivo de inventario:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el archivo Excel' },
      { status: 500 }
    );
  }
}
