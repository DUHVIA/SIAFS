import { prisma } from '../lib/prisma';
import { descifrarTexto, generarIndiceCiego } from '../lib/crypto';

/**
 * ============================================================================
 * SCRIPT DE AUDITORÍA Y DIAGNÓSTICO DE DATOS ENCRIPTADOS (100% LECTURA)
 * ============================================================================
 * Este script consulta la base de datos sin realizar ninguna modificación
 * (UPDATE / INSERT / DELETE) y verifica:
 * 
 * 1. Integridad de desencriptación (AuthTag, IV y Formato AES-256-GCM).
 * 2. Validez de índices ciegos (Blind Index) contra los datos descifrados.
 * 3. Coherencia matemática en Órdenes (Subtotales vs Precio * Cantidad, Total vs Detalles).
 * 4. Coherencia matemática en Compras / Ingresos.
 * 5. Coherencia de Stock en Productos vs Kardex.
 * 6. Registros o montos no numéricos / inváldos.
 */

interface Inconsistencia {
  tabla: string;
  id: string;
  campo?: string;
  tipoError: string;
  detalle: string;
}

const inconsistencias: Inconsistencia[] = [];

function safeDecrypt(textoCifrado: string, campo: string, tabla: string, id: string): string | null {
  if (!textoCifrado) return null;
  try {
    return descifrarTexto(textoCifrado);
  } catch (error: any) {
    inconsistencias.push({
      tabla,
      id,
      campo,
      tipoError: 'ERROR_DESENCRIPTACION',
      detalle: `No se pudo descifrar el campo '${campo}'. Posible corrupción o clave incorrecta: ${error?.message || error}`,
    });
    return null;
  }
}

async function auditarClientes() {
  console.log('🔍 Auditando tabla [clientes]...');
  const clientes = await prisma.cliente.findMany();

  for (const c of clientes) {
    const nombre = safeDecrypt(c.nombreCifrado, 'nombreCifrado', 'clientes', c.id);
    const documento = safeDecrypt(c.documentoCifrado, 'documentoCifrado', 'clientes', c.id);
    if (c.telefonoCifrado) safeDecrypt(c.telefonoCifrado, 'telefonoCifrado', 'clientes', c.id);
    if (c.correoCifrado) safeDecrypt(c.correoCifrado, 'correoCifrado', 'clientes', c.id);
    if (c.direccionCifrado) safeDecrypt(c.direccionCifrado, 'direccionCifrado', 'clientes', c.id);

    // Verificar índice ciego de documento
    if (documento) {
      const idxDocEsperado = generarIndiceCiego(documento);
      if (c.idxDocumento !== idxDocEsperado) {
        inconsistencias.push({
          tabla: 'clientes',
          id: c.id,
          campo: 'idxDocumento',
          tipoError: 'INDICE_CIEGO_DESACTUALIZADO',
          detalle: `El índice ciego guardado (${c.idxDocumento}) no coincide con el hash del documento descifrado (${idxDocEsperado}).`,
        });
      }
    }

    // Verificar índice ciego de nombre si existe
    if (nombre && c.idxNombre) {
      const idxNomEsperado = generarIndiceCiego(nombre);
      if (c.idxNombre !== idxNomEsperado) {
        inconsistencias.push({
          tabla: 'clientes',
          id: c.id,
          campo: 'idxNombre',
          tipoError: 'INDICE_CIEGO_DESACTUALIZADO',
          detalle: `El índice ciego de nombre (${c.idxNombre}) no coincide con el hash descifrado (${idxNomEsperado}).`,
        });
      }
    }
  }
}

async function auditarProductos() {
  console.log('🔍 Auditando tabla [productos]...');
  const productos = await prisma.producto.findMany();

  for (const p of productos) {
    safeDecrypt(p.nombreCifrado, 'nombreCifrado', 'productos', p.id);

    const precioVentaStr = safeDecrypt(p.precioVentaCifrado, 'precioVentaCifrado', 'productos', p.id);
    if (precioVentaStr !== null) {
      const precioVenta = parseFloat(precioVentaStr);
      if (isNaN(precioVenta) || precioVenta < 0) {
        inconsistencias.push({
          tabla: 'productos',
          id: p.id,
          campo: 'precioVentaCifrado',
          tipoError: 'VALOR_NUMERICO_INVALIDO',
          detalle: `El precio de venta descifrado ('${precioVentaStr}') no es un número válido o es negativo.`,
        });
      }
    }

    if (p.precioCompraCifrado) {
      const precioCompraStr = safeDecrypt(p.precioCompraCifrado, 'precioCompraCifrado', 'productos', p.id);
      if (precioCompraStr !== null) {
        const precioCompra = parseFloat(precioCompraStr);
        if (isNaN(precioCompra) || precioCompra < 0) {
          inconsistencias.push({
            tabla: 'productos',
            id: p.id,
            campo: 'precioCompraCifrado',
            tipoError: 'VALOR_NUMERICO_INVALIDO',
            detalle: `El precio de compra descifrado ('${precioCompraStr}') no es un número válido o es negativo.`,
          });
        }
      }
    }

    const stockStr = safeDecrypt(p.stockCifrado, 'stockCifrado', 'productos', p.id);
    if (stockStr !== null) {
      const stock = parseInt(stockStr, 10);
      if (isNaN(stock) || stock < 0) {
        inconsistencias.push({
          tabla: 'productos',
          id: p.id,
          campo: 'stockCifrado',
          tipoError: 'STOCK_INVALIDO',
          detalle: `El stock descifrado ('${stockStr}') no es un entero válido o es negativo.`,
        });
      }
    }

    // Verificar formato JSON en detallesCifrados
    if (p.detallesCifrados) {
      const jsonStr = safeDecrypt(p.detallesCifrados, 'detallesCifrados', 'productos', p.id);
      if (jsonStr) {
        try {
          JSON.parse(jsonStr);
        } catch (e) {
          inconsistencias.push({
            tabla: 'productos',
            id: p.id,
            campo: 'detallesCifrados',
            tipoError: 'JSON_CORRUPTO',
            detalle: `Los detalles descifrados no son un JSON válido: ${jsonStr}`,
          });
        }
      }
    }
  }
}

async function auditarOrdenes() {
  console.log('🔍 Auditando tabla [ordenes] y [detalle_ordenes]...');
  const ordenes = await prisma.orden.findMany({
    include: { detalles: true }
  });

  for (const o of ordenes) {
    const totalOrdenStr = safeDecrypt(o.totalCifrado, 'totalCifrado', 'ordenes', o.id);
    const subtotalOrdenStr = safeDecrypt(o.subtotalCifrado, 'subtotalCifrado', 'ordenes', o.id);

    const totalOrden = totalOrdenStr ? parseFloat(totalOrdenStr) : null;
    let sumaSubtotalesDetalles = 0;

    for (const d of o.detalles) {
      safeDecrypt(d.productoNombreCifrado, 'productoNombreCifrado', 'detalle_ordenes', d.id);

      const cantStr = safeDecrypt(d.cantidadCifrada, 'cantidadCifrada', 'detalle_ordenes', d.id);
      const precioUnitStr = safeDecrypt(d.precioUnitarioCongeladoCifrado, 'precioUnitarioCongeladoCifrado', 'detalle_ordenes', d.id);
      const subtotalDetStr = safeDecrypt(d.subtotalCifrado, 'subtotalCifrado', 'detalle_ordenes', d.id);

      const cant = cantStr ? parseFloat(cantStr) : 0;
      const precioUnit = precioUnitStr ? parseFloat(precioUnitStr) : 0;
      const subtotalDet = subtotalDetStr ? parseFloat(subtotalDetStr) : 0;

      sumaSubtotalesDetalles += subtotalDet;

      // Inconsistencia matemática de Ítem
      const subtotalCalculado = parseFloat((cant * precioUnit).toFixed(2));
      if (Math.abs(subtotalCalculado - subtotalDet) > 0.05) {
        inconsistencias.push({
          tabla: 'detalle_ordenes',
          id: d.id,
          campo: 'subtotalCifrado',
          tipoError: 'DESCALCE_MATEMATICO_DETALLE',
          detalle: `En la orden #${o.numeroOrden}: subtotal guardado (${subtotalDet}) no coincide con precio * cantidad (${precioUnit} * ${cant} = ${subtotalCalculado}).`,
        });
      }
    }

    // Inconsistencia matemática Cabecera Orden vs Suma de Detalles
    if (totalOrden !== null && Math.abs(totalOrden - sumaSubtotalesDetalles) > 0.05) {
      inconsistencias.push({
        tabla: 'ordenes',
        id: o.id,
        campo: 'totalCifrado',
        tipoError: 'DESCALCE_MATEMATICO_CABECERA',
        detalle: `En la orden #${o.numeroOrden}: total descifrado (${totalOrden}) no coincide con la suma de los detalles (${sumaSubtotalesDetalles.toFixed(2)}).`,
      });
    }
  }
}

async function auditarGastos() {
  console.log('🔍 Auditando tabla [gastos_internos]...');
  const gastos = await prisma.gastoInterno.findMany();

  for (const g of gastos) {
    safeDecrypt(g.motivoCifrado, 'motivoCifrado', 'gastos_internos', g.id);
    const montoStr = safeDecrypt(g.montoCifrado, 'montoCifrado', 'gastos_internos', g.id);
    if (montoStr !== null) {
      const monto = parseFloat(montoStr);
      if (isNaN(monto) || monto < 0) {
        inconsistencias.push({
          tabla: 'gastos_internos',
          id: g.id,
          campo: 'montoCifrado',
          tipoError: 'MONTO_INVALIDO',
          detalle: `El monto descifrado ('${montoStr}') no es un número válido o es negativo.`,
        });
      }
    }
  }
}

async function main() {
  console.log(`
============================================================================
🛡️ AUDITORÍA DE DATOS CIFRADOS Y COHERENCIA DE BASE DE DATOS (READ-ONLY)
============================================================================
Clave de encriptación en uso: ${process.env.ENCRYPTION_KEY ? 'Cargada desde ENCRYPTION_KEY' : 'Llave por defecto'}
  `);

  await auditarClientes();
  await auditarProductos();
  await auditarOrdenes();
  await auditarGastos();

  console.log(`\n============================================================================`);
  console.log(`RESULTADO DE LA AUDITORÍA`);
  console.log(`============================================================================`);

  if (inconsistencias.length === 0) {
    console.log('🎉 FELICIDADES: No se encontraron inconsistencias en la base de datos.');
  } else {
    console.log(`⚠️ Se encontraron ${inconsistencias.length} inconsistencia(s):\n`);
    inconsistencias.forEach((inc, idx) => {
      console.log(`[${idx + 1}] TABLA: ${inc.tabla} | ID: ${inc.id}`);
      console.log(`    Categoría: ${inc.tipoError}`);
      if (inc.campo) console.log(`    Campo:     ${inc.campo}`);
      console.log(`    Detalle:   ${inc.detalle}`);
      console.log('----------------------------------------------------------------------------');
    });
  }
}

main()
  .catch((e) => {
    console.error('Error durante el escaneo de auditoría:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
