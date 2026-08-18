import { prisma } from '../lib/prisma';
import { descifrarTexto } from '../lib/crypto';

/**
 * ============================================================================
 * SCRIPT PARA MOSTRAR EL HISTORIAL DE CAMBIOS DE NOMBRES DE PRODUCTOS
 * ============================================================================
 * Muestra el historial completo de nombres anteriores y nuevos de productos,
 * indicando el usuario responsable de cada renombre y la fecha exacta.
 * 
 * Uso:
 *   npx tsx scripts/inspect-historial-nombres.ts
 *   npx tsx scripts/inspect-historial-nombres.ts "FiltroDeNombre"
 */

async function main() {
  const filtro = process.argv[2]?.toLowerCase() || '';

  console.log(`
============================================================================
🏷️ HISTORIAL DE CAMBIOS DE NOMBRES DE PRODUCTOS
============================================================================
  `);

  const historiales = await prisma.historialNombre.findMany({
    include: {
      producto: { select: { id: true, nombreCifrado: true } },
      usuario: { select: { nombre: true, email: true } },
    },
    orderBy: { fechaCambio: 'desc' },
  });

  if (historiales.length === 0) {
    console.log('ℹ️ No hay registros en el historial de re-nombres de producto.');
    return;
  }

  // Agrupar por producto
  const agrupado: Record<string, { idProducto: string; nombreActual: string; cambios: any[] }> = {};

  historiales.forEach((h) => {
    let nombreActual = 'Producto Desconocido';
    try {
      if (h.producto?.nombreCifrado) {
        nombreActual = descifrarTexto(h.producto.nombreCifrado);
      }
    } catch (e) {}

    let nombreAntiguo = 'Desconocido';
    let nombreNuevo = 'Desconocido';

    try { nombreAntiguo = descifrarTexto(h.nombreAntiguoCifrado); } catch (e) {}
    try { nombreNuevo = descifrarTexto(h.nombreNuevoCifrado); } catch (e) {}

    // Aplicar filtro si existe
    if (
      filtro &&
      !nombreActual.toLowerCase().includes(filtro) &&
      !nombreAntiguo.toLowerCase().includes(filtro) &&
      !nombreNuevo.toLowerCase().includes(filtro) &&
      !h.productoId.toLowerCase().includes(filtro)
    ) {
      return;
    }

    if (!agrupado[h.productoId]) {
      agrupado[h.productoId] = {
        idProducto: h.productoId,
        nombreActual,
        cambios: [],
      };
    }

    agrupado[h.productoId].cambios.push({
      fecha: h.fechaCambio,
      nombreAntiguo,
      nombreNuevo,
      usuarioNombre: h.usuario?.nombre || 'Sistema',
      usuarioEmail: h.usuario?.email || '',
    });
  });

  const productos = Object.values(agrupado);

  if (productos.length === 0) {
    console.log(`ℹ️ No se encontraron cambios de nombre que coincidan con el filtro '${filtro}'.`);
    return;
  }

  console.log(`Se encontraron ${historiales.length} cambio(s) de nombre en ${productos.length} producto(s).\n`);

  productos.forEach((p, idx) => {
    console.log(`----------------------------------------------------------------------------`);
    console.log(`📦 [${idx + 1}] PRODUCTO (Nombre Actual): ${p.nombreActual} (ID: ${p.idProducto})`);
    console.log(`----------------------------------------------------------------------------`);

    p.cambios.forEach((c, i) => {
      const fechaStr = new Date(c.fecha).toLocaleString('es-PE');

      console.log(`  🔹 Renombre #${p.cambios.length - i} | Fecha: ${fechaStr}`);
      console.log(`     - Nombre Anterior: "${c.nombreAntiguo}"`);
      console.log(`     - Nombre Nuevo:    "${c.nombreNuevo}"`);
      console.log(`     - Modificado por:  ${c.usuarioNombre} (${c.usuarioEmail})`);
    });
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Error al consultar el historial de nombres:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
