import { prisma } from '../lib/prisma';
import { descifrarTexto } from '../lib/crypto';

/**
 * ============================================================================
 * SCRIPT PARA MOSTRAR EL HISTORIAL DE CAMBIOS DE PRECIOS EN PRODUCTOS
 * ============================================================================
 * Muestra el historial completo de cambios de precios (compra y venta),
 * indicando qué usuario realizó la modificación y en qué fecha.
 * 
 * Uso:
 *   npx tsx scripts/inspect-historial-precios.ts
 *   npx tsx scripts/inspect-historial-precios.ts "FiltroDeNombre"
 */

async function main() {
  const filtro = process.argv[2]?.toLowerCase() || '';

  console.log(`
============================================================================
📈 HISTORIAL DE CAMBIOS DE PRECIOS DE PRODUCTOS
============================================================================
  `);

  const historiales = await prisma.historialPrecio.findMany({
    include: {
      producto: { select: { id: true, nombreCifrado: true } },
      usuario: { select: { nombre: true, email: true } },
    },
    orderBy: { fechaCambio: 'desc' },
  });

  if (historiales.length === 0) {
    console.log('ℹ️ No hay registros en el historial de cambios de precio.');
    return;
  }

  // Agrupar por producto
  const agrupado: Record<string, { idProducto: string; nombreProducto: string; cambios: any[] }> = {};

  historiales.forEach((h) => {
    let nombreProducto = 'Producto Desconocido';
    try {
      if (h.producto?.nombreCifrado) {
        nombreProducto = descifrarTexto(h.producto.nombreCifrado);
      }
    } catch (e) {}

    // Si hay un filtro y no coincide con el producto, se descarta
    if (filtro && !nombreProducto.toLowerCase().includes(filtro) && !h.productoId.toLowerCase().includes(filtro)) {
      return;
    }

    let precioVenta = '0.00';
    let precioCompra = 'N/A';

    try { precioVenta = descifrarTexto(h.precioVentaCifrado); } catch (e) {}
    if (h.precioCompraCifrado) {
      try { precioCompra = descifrarTexto(h.precioCompraCifrado); } catch (e) {}
    }

    if (!agrupado[h.productoId]) {
      agrupado[h.productoId] = {
        idProducto: h.productoId,
        nombreProducto,
        cambios: [],
      };
    }

    agrupado[h.productoId].cambios.push({
      fecha: h.fechaCambio,
      precioVenta: parseFloat(precioVenta) || 0,
      precioCompra: precioCompra !== 'N/A' ? (parseFloat(precioCompra) || 0) : 'N/A',
      usuarioNombre: h.usuario?.nombre || 'Sistema',
      usuarioEmail: h.usuario?.email || '',
    });
  });

  const productos = Object.values(agrupado);

  if (productos.length === 0) {
    console.log(`ℹ️ No se encontraron cambios de precio que coincidan con el filtro '${filtro}'.`);
    return;
  }

  console.log(`Se encontraron ${historiales.length} cambio(s) de precio en ${productos.length} producto(s).\n`);

  productos.forEach((p, idx) => {
    console.log(`----------------------------------------------------------------------------`);
    console.log(`📦 [${idx + 1}] PRODUCTO: ${p.nombreProducto} (ID: ${p.idProducto})`);
    console.log(`----------------------------------------------------------------------------`);

    p.cambios.forEach((c, i) => {
      const fechaStr = new Date(c.fecha).toLocaleString('es-PE');
      const pVentaStr = typeof c.precioVenta === 'number' ? `S/ ${c.precioVenta.toFixed(2)}` : c.precioVenta;
      const pCompraStr = typeof c.precioCompra === 'number' ? `S/ ${c.precioCompra.toFixed(2)}` : c.precioCompra;

      console.log(`  🔹 Cambio #${p.cambios.length - i} | Fecha: ${fechaStr}`);
      console.log(`     - Precio Venta:  ${pVentaStr}`);
      console.log(`     - Precio Compra: ${pCompraStr}`);
      console.log(`     - Modificado por: ${c.usuarioNombre} (${c.usuarioEmail})`);
    });
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Error al consultar el historial de precios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
