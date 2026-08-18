import { prisma } from '../lib/prisma';
import { descifrarTexto } from '../lib/crypto';

/**
 * ============================================================================
 * SCRIPT DE REPARACIÓN Y RELLENADO DE PRECIOS NULL DESDE HISTORIAL DE PRECIOS
 * ============================================================================
 * 1. Identifica valores NULL de precioCompraCifrado en [productos] y 
 *    costoUnitarioCongeladoCifrado en [detalle_ordenes].
 * 2. Busca el precio más actual disponible en [historial_precios] (o [detalle_ingresos]).
 * 3. Si lo encuentra, actualiza el campo correspondiente en la base de datos.
 * 4. Si tampoco existe en el historial, emite una ALERTA clara en pantalla.
 * 
 * Uso:
 *   npx tsx scripts/fix-null-prices.ts
 */

async function main() {
  console.log(`
============================================================================
🔧 SCRIPT DE REPARACIÓN DE PRECIOS NULL EN BASE DE DATOS
============================================================================
  `);

  let productosReparadosCompra = 0;
  let detallesReparadosCosto = 0;
  let alertasCount = 0;

  // ==========================================
  // PARTE 1: REPARACIÓN EN TABLA PRODUCTOS
  // ==========================================
  console.log('🔍 Auditando y rellenando precioCompraCifrado en la tabla [productos]...');
  const productosSinPrecioCompra = await prisma.producto.findMany({
    where: { precioCompraCifrado: null }
  });

  console.log(`   Se encontraron ${productosSinPrecioCompra.length} producto(s) con precio de compra NULL en la tabla productos.`);

  for (const p of productosSinPrecioCompra) {
    let nombreProd = 'Producto';
    try { nombreProd = descifrarTexto(p.nombreCifrado); } catch (e) {}

    let nuevoPrecioCompraCifrado: string | null = null;
    let fuenteEncontrada = '';

    // 1. Buscar en HistorialPrecio
    const hp = await prisma.historialPrecio.findFirst({
      where: { productoId: p.id, NOT: { precioCompraCifrado: null } },
      orderBy: { fechaCambio: 'desc' }
    });

    if (hp?.precioCompraCifrado) {
      nuevoPrecioCompraCifrado = hp.precioCompraCifrado;
      fuenteEncontrada = 'HistorialPrecio';
    } else {
      // 2. Fallback: Buscar en DetalleIngreso
      const di = await prisma.detalleIngreso.findFirst({
        where: { productoId: p.id },
        orderBy: { ingreso: { fechaIngreso: 'desc' } },
        select: { costoUnitarioCifrado: true }
      });

      if (di?.costoUnitarioCifrado) {
        nuevoPrecioCompraCifrado = di.costoUnitarioCifrado;
        fuenteEncontrada = 'DetalleIngreso';
      }
    }

    if (nuevoPrecioCompraCifrado) {
      await prisma.producto.update({
        where: { id: p.id },
        data: { precioCompraCifrado: nuevoPrecioCompraCifrado },
      });
      productosReparadosCompra++;
      let valDesc = '0.00';
      try { valDesc = descifrarTexto(nuevoPrecioCompraCifrado); } catch (e) {}
      console.log(`   ✅ [PRODUCTO] '${nombreProd}' (ID: ${p.id.slice(0, 8)}...) => Precio de compra restaurado desde ${fuenteEncontrada} (S/ ${valDesc}).`);
    } else {
      alertasCount++;
      console.log(`   ⚠️ [ALERTA PRODUCTO] '${nombreProd}' (ID: ${p.id}): No se encontró precio de compra en el historial de precios ni en ingresos.`);
    }
  }

  // ==========================================
  // PARTE 2: REPARACIÓN EN TABLA DETALLE_ORDENES
  // ==========================================
  console.log('\n🔍 Auditando y rellenando costoUnitarioCongeladoCifrado en la tabla [detalle_ordenes]...');
  const detallesSinCosto = await prisma.detalleOrden.findMany({
    where: { costoUnitarioCongeladoCifrado: null },
    include: {
      orden: { select: { numeroOrden: true } },
      producto: true
    }
  });

  console.log(`   Se encontraron ${detallesSinCosto.length} detalle(s) de órdenes con costo congelado NULL.`);

  for (const det of detallesSinCosto) {
    let nombreProd = 'Producto';
    try { nombreProd = descifrarTexto(det.productoNombreCifrado); } catch (e) {}

    let nuevoCostoCifrado: string | null = null;
    let fuenteEncontrada = '';

    if (det.productoId) {
      // 1. Probar desde producto actual
      if (det.producto?.precioCompraCifrado) {
        nuevoCostoCifrado = det.producto.precioCompraCifrado;
        fuenteEncontrada = 'Tabla Producto';
      } else {
        // 2. Probar desde HistorialPrecio
        const hp = await prisma.historialPrecio.findFirst({
          where: { productoId: det.productoId, NOT: { precioCompraCifrado: null } },
          orderBy: { fechaCambio: 'desc' }
        });

        if (hp?.precioCompraCifrado) {
          nuevoCostoCifrado = hp.precioCompraCifrado;
          fuenteEncontrada = 'HistorialPrecio';
        } else {
          // 3. Probar desde DetalleIngreso
          const di = await prisma.detalleIngreso.findFirst({
            where: { productoId: det.productoId },
            orderBy: { ingreso: { fechaIngreso: 'desc' } },
            select: { costoUnitarioCifrado: true }
          });

          if (di?.costoUnitarioCifrado) {
            nuevoCostoCifrado = di.costoUnitarioCifrado;
            fuenteEncontrada = 'DetalleIngreso';
          }
        }
      }
    }

    if (nuevoCostoCifrado) {
      await prisma.detalleOrden.update({
        where: { id: det.id },
        data: { costoUnitarioCongeladoCifrado: nuevoCostoCifrado },
      });
      detallesReparadosCosto++;
      let valDesc = '0.00';
      try { valDesc = descifrarTexto(nuevoCostoCifrado); } catch (e) {}
      console.log(`   ✅ [DETALLE ÓRDEN #${det.orden.numeroOrden}] Ítem '${nombreProd}' => Costo congelado asignado desde ${fuenteEncontrada} (S/ ${valDesc}).`);
    } else {
      alertasCount++;
      console.log(`   ⚠️ [ALERTA DETALLE ÓRDEN #${det.orden.numeroOrden}] Ítem '${nombreProd}' (ID Detalle: ${det.id}): No se encontró costo de compra en historial.`);
    }
  }

  console.log(`\n============================================================================`);
  console.log(`📊 RESUMEN DE LA REPARACIÓN DE DATOS`);
  console.log(`============================================================================`);
  console.log(`  • Productos con precio de compra reparado: ${productosReparadosCompra}`);
  console.log(`  • Detalles de orden con costo reparado:     ${detallesReparadosCosto}`);
  console.log(`  • Alertas emitidas (sin historial previo): ${alertasCount}`);
  console.log(`============================================================================\n`);
}

main()
  .catch((e) => {
    console.error('Error durante la reparación de precios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
