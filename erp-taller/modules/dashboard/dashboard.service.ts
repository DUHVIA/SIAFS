import { prisma } from '@/lib/prisma';
import { descifrarTexto } from '@/lib/crypto';



export const DashboardService = {
  async obtenerMetricasGenerales() {
    // 1. Órdenes Activas
    const ordenesActivas = await prisma.orden.count({
      where: { estado: 'PENDIENTE' }
    });

    // 2. Productos en Stock Total (contar únicos)
    const productosEnStock = await prisma.producto.count({
      where: { isActive: true, rangoStock: { gt: 0 } }
    });

    // 3. Nuevos Clientes (últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const nuevosClientes = await prisma.cliente.count({
      where: { createdAt: { gte: hace30Dias } }
    });

    // 4. Ingresos Totales y Datos para Gráfico (últimos 7 días)
    const ordenesCompletadas = await prisma.orden.findMany({
      where: { estado: 'COMPLETADA' },
      select: { totalCifrado: true, createdAt: true }
    });

    let ingresosTotales = 0;
    const ingresosPorDia: Record<string, number> = {};
    
    // Inicializar últimos 7 días en 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-ES', { weekday: 'short' });
      ingresosPorDia[key] = 0;
    }

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    ordenesCompletadas.forEach((orden) => {
      const total = parseFloat(descifrarTexto(orden.totalCifrado));
      ingresosTotales += total;

      if (orden.createdAt >= hace7Dias) {
        const diaStr = orden.createdAt.toLocaleDateString('es-ES', { weekday: 'short' });
        if (ingresosPorDia[diaStr] !== undefined) {
          ingresosPorDia[diaStr] += total;
        }
      }
    });

    const chartData = Object.keys(ingresosPorDia).map(dia => ({
      name: dia,
      total: ingresosPorDia[dia]
    }));

    // 5. Últimas 5 órdenes
    const ultimasOrdenesRaw = await prisma.orden.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, numeroOrden: true, createdAt: true, totalCifrado: true, estado: true }
    });

    const ultimasOrdenes = ultimasOrdenesRaw.map(o => ({
      id: o.id,
      numero: o.numeroOrden,
      fecha: o.createdAt,
      total: parseFloat(descifrarTexto(o.totalCifrado)),
      estado: o.estado
    }));

    return {
      ingresosTotales,
      ordenesActivas,
      productosEnStock,
      nuevosClientes,
      chartData,
      ultimasOrdenes
    };
  }
};
