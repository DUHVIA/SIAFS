import { prisma } from '../lib/prisma';
import { descifrarTexto } from '../lib/crypto';

/**
 * ============================================================================
 * SCRIPT DE TRAZABILIDAD Y DETALLE DE MÉTRICAS DEL DASHBOARD (READ-ONLY)
 * ============================================================================
 * Desglosa registro por registro los datos exactos de la base de datos que
 * alimentan cada una de las tarjetas (cards) del Dashboard de SIAFS.
 */

async function main() {
  console.log(`
============================================================================
📊 TRAZABILIDAD DETALLADA DE MÉTRICAS DEL DASHBOARD
============================================================================
  `);

  // 1. ÓRDENES COMPLETADAS Y SUS INGRESOS
  const ordenesCompletadas = await prisma.orden.findMany({
    where: { estado: 'COMPLETADA' },
    select: {
      id: true,
      numeroOrden: true,
      createdAt: true,
      fechaOrden: true,
      totalCifrado: true,
      cliente: { select: { nombreCifrado: true } },
      detalles: {
        select: {
          id: true,
          productoNombreCifrado: true,
          precioUnitarioCongeladoCifrado: true,
          costoUnitarioCongeladoCifrado: true,
          cantidadCifrada: true,
          subtotalCifrado: true,
          producto: { select: { precioCompraCifrado: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  let ingresosTotales = 0;
  let gananciaVentasTotales = 0;

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`1. CARD: INGRESOS TOTALES Y GANANCIA EN VENTAS (UTILIDAD BRUTA)`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`Órdenes con estado 'COMPLETADA': ${ordenesCompletadas.length} órdenes en total.\n`);

  ordenesCompletadas.forEach((o, index) => {
    let totalOrden = 0;
    try {
      totalOrden = parseFloat(descifrarTexto(o.totalCifrado)) || 0;
      ingresosTotales += totalOrden;
    } catch (e) {
      console.error(`  [Error] No se pudo descifrar total de la Orden #${o.numeroOrden}`);
    }

    let clienteNombre = 'Desconocido';
    try {
      if (o.cliente?.nombreCifrado) clienteNombre = descifrarTexto(o.cliente.nombreCifrado);
    } catch (e) {}

    console.log(`  🔹 Orden #${o.numeroOrden} | Fecha: ${o.fechaOrden.toISOString().slice(0, 10)} | Cliente: ${clienteNombre} | Total: S/ ${totalOrden.toFixed(2)}`);

    let gananciaOrden = 0;
    o.detalles.forEach((det) => {
      let prodNombre = 'Producto';
      let cantidad = 0;
      let precioVentaUnit = 0;
      let costoUnit = 0;

      try { prodNombre = descifrarTexto(det.productoNombreCifrado); } catch (e) {}
      try { cantidad = parseFloat(descifrarTexto(det.cantidadCifrada)) || 0; } catch (e) {}
      try { precioVentaUnit = parseFloat(descifrarTexto(det.precioUnitarioCongeladoCifrado)) || 0; } catch (e) {}

      if (det.costoUnitarioCongeladoCifrado) {
        try { costoUnit = parseFloat(descifrarTexto(det.costoUnitarioCongeladoCifrado)) || 0; } catch (e) {}
      } else if (det.producto?.precioCompraCifrado) {
        try { costoUnit = parseFloat(descifrarTexto(det.producto.precioCompraCifrado)) || 0; } catch (e) {}
      }

      const gananciaItem = (precioVentaUnit - costoUnit) * cantidad;
      gananciaOrden += gananciaItem;
      gananciaVentasTotales += gananciaItem;

      console.log(`      • [Detalle] ${prodNombre} | Cant: ${cantidad} | P.Venta: S/ ${precioVentaUnit.toFixed(2)} | Costo: S/ ${costoUnit.toFixed(2)} => Ganancia Ítem: S/ ${gananciaItem.toFixed(2)}`);
    });
    console.log(`      └─> Utilidad Bruta Orden #${o.numeroOrden}: S/ ${gananciaOrden.toFixed(2)}\n`);
  });

  console.log(`  👉 TOTAL CARD INGRESOS TOTALES: S/ ${ingresosTotales.toFixed(2)}`);
  console.log(`  👉 TOTAL CARD GANANCIA EN VENTAS: S/ ${gananciaVentasTotales.toFixed(2)}`);

  // 2. GASTOS TOTALES
  const gastosInternos = await prisma.gastoInterno.findMany({
    where: { isActive: true },
    select: { id: true, motivoCifrado: true, montoCifrado: true, fecha: true },
    orderBy: { fecha: 'desc' }
  });

  let gastosTotales = 0;
  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`2. CARD: GASTOS TOTALES`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`Gastos internos activos: ${gastosInternos.length} registros.\n`);

  gastosInternos.forEach((g) => {
    let monto = 0;
    let motivo = 'Sin motivo';
    try { monto = parseFloat(descifrarTexto(g.montoCifrado)) || 0; } catch (e) {}
    try { motivo = descifrarTexto(g.motivoCifrado); } catch (e) {}
    gastosTotales += monto;

    console.log(`  🔹 Gasto ID: ${g.id.slice(0, 8)}... | Fecha: ${g.fecha.toISOString().slice(0, 10)} | Motivo: ${motivo} | Monto: S/ ${monto.toFixed(2)}`);
  });

  console.log(`  👉 TOTAL CARD GASTOS TOTALES: S/ ${gastosTotales.toFixed(2)}`);

  // 3. GANANCIA NETA Y MARGEN
  const gananciasTotales = ingresosTotales - gastosTotales;
  const margenGanancia = ingresosTotales > 0 ? (gananciasTotales / ingresosTotales) * 100 : 0;

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`3. CARDS: GANANCIA NETA Y MARGEN DE GANANCIA`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`  Formula Ganancia Neta: Ingresos (S/ ${ingresosTotales.toFixed(2)}) - Gastos (S/ ${gastosTotales.toFixed(2)})`);
  console.log(`  👉 TOTAL CARD GANANCIA NETA: S/ ${gananciasTotales.toFixed(2)}`);
  console.log(`  Formula Margen: (Ganancia Neta / Ingresos Totales) * 100`);
  console.log(`  👉 TOTAL CARD MARGEN DE GANANCIA: ${margenGanancia.toFixed(1)}%`);

  // 4. INVERSIÓN EN COMPRAS E INGRESOS DE INVENTARIO
  const ingresosInventario = await prisma.ingreso.findMany({
    select: { id: true, descripcionCifrada: true, totalCifrado: true, fechaIngreso: true },
    orderBy: { fechaIngreso: 'desc' }
  });

  let totalInvertidoCompras = 0;
  let totalComprasMes = 0;
  let cantidadLotesMes = 0;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`4. CARDS: INVERSIÓN EN COMPRAS, COMPRAS DEL MES Y LOTES RECIBIDOS`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`Lotes de compra de inventario registrados: ${ingresosInventario.length} lotes.\n`);

  ingresosInventario.forEach((ing) => {
    let total = 0;
    let descripcion = 'Sin notas';
    try { total = parseFloat(descifrarTexto(ing.totalCifrado)) || 0; } catch (e) {}
    try { if (ing.descripcionCifrada) descripcion = descifrarTexto(ing.descripcionCifrada); } catch (e) {}

    totalInvertidoCompras += total;

    const fecha = new Date(ing.fechaIngreso);
    const esDelMes = fecha >= inicioMes;
    if (esDelMes) {
      totalComprasMes += total;
      cantidadLotesMes++;
    }

    console.log(`  🔹 Ingreso Lote ID: ${ing.id.slice(0, 8)}... | Fecha: ${fecha.toISOString().slice(0, 10)} | Notas: ${descripcion} | Total: S/ ${total.toFixed(2)} ${esDelMes ? '[DEL MES ACTUAL]' : ''}`);
  });

  console.log(`  👉 TOTAL CARD INVERSIÓN EN COMPRAS (HISTÓRICO): S/ ${totalInvertidoCompras.toFixed(2)}`);
  console.log(`  👉 TOTAL CARD COMPRAS DEL MES: S/ ${totalComprasMes.toFixed(2)}`);
  console.log(`  👉 TOTAL CARD LOTES RECIBIDOS (MES): ${cantidadLotesMes} lotes`);

  // 5. ÓRDENES PENDIENTES
  const ordenesPendientes = await prisma.orden.findMany({
    where: { estado: 'PENDIENTE' },
    select: { id: true, numeroOrden: true, createdAt: true, cliente: { select: { nombreCifrado: true } } }
  });

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`5. CARD: ÓRDENES PENDIENTES`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`  👉 TOTAL CARD ÓRDENES PENDIENTES: ${ordenesPendientes.length}`);
  ordenesPendientes.forEach((o) => {
    let clienteNombre = 'Cliente';
    try { if (o.cliente?.nombreCifrado) clienteNombre = descifrarTexto(o.cliente.nombreCifrado); } catch (e) {}
    console.log(`  🔹 Orden #${o.numeroOrden} | Fecha: ${o.createdAt.toISOString().slice(0, 10)} | Cliente: ${clienteNombre}`);
  });

  // 6. PRODUCTOS EN STOCK TOTAL
  const productosEnStock = await prisma.producto.findMany({
    where: { isActive: true, rangoStock: { gt: 0 } },
    select: { id: true, nombreCifrado: true, stockCifrado: true, rangoStock: true }
  });

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`6. CARD: PRODUCTOS EN STOCK`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`  👉 TOTAL CARD PRODUCTOS EN STOCK: ${productosEnStock.length}`);
  productosEnStock.forEach((p) => {
    let nombre = 'Producto';
    let stockStr = '0';
    try { nombre = descifrarTexto(p.nombreCifrado); } catch (e) {}
    try { stockStr = descifrarTexto(p.stockCifrado); } catch (e) {}
    console.log(`  🔹 ${nombre} | Stock descifrado: ${stockStr} (Rango: ${p.rangoStock})`);
  });

  // 7. NUEVOS CLIENTES (30 DÍAS)
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const nuevosClientes = await prisma.cliente.findMany({
    where: { createdAt: { gte: hace30Dias } },
    select: { id: true, nombreCifrado: true, createdAt: true }
  });

  console.log(`\n----------------------------------------------------------------------------`);
  console.log(`7. CARD: NUEVOS CLIENTES (ÚLTIMOS 30 DÍAS)`);
  console.log(`----------------------------------------------------------------------------`);
  console.log(`  👉 TOTAL CARD NUEVOS CLIENTES: ${nuevosClientes.length}`);
  nuevosClientes.forEach((c) => {
    let nombre = 'Cliente';
    try { nombre = descifrarTexto(c.nombreCifrado); } catch (e) {}
    console.log(`  🔹 ${nombre} | Fecha Registro: ${c.createdAt.toISOString().slice(0, 10)}`);
  });

  console.log(`\n============================================================================`);
  console.log(`✅ TRAZABILIDAD COMPLETADA`);
  console.log(`============================================================================\n`);
}

main()
  .catch((e) => {
    console.error('Error durante la trazabilidad:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
