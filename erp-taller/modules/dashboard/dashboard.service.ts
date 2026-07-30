import { prisma } from '@/lib/prisma';
import { descifrarTexto } from '@/lib/crypto';

export type PeriodoFinanciero = '7d' | 'mensual' | 'trimestral' | 'anual';

export interface PuntoFinanciero {
  periodoLabel: string;
  ingresos: number;
  gastos: number;
  ganancias: number;
}

export const DashboardService = {
  async obtenerMetricasGenerales() {
    // 1. Órdenes Activas
    const ordenesActivas = await prisma.orden.count({
      where: { estado: 'PENDIENTE' }
    });

    // 2. Productos en Stock Total
    const productosEnStock = await prisma.producto.count({
      where: { isActive: true, rangoStock: { gt: 0 } }
    });

    // 3. Nuevos Clientes (últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const nuevosClientes = await prisma.cliente.count({
      where: { createdAt: { gte: hace30Dias } }
    });

    // 4. Ingresos Totales por Órdenes completadas
    const ordenesCompletadas = await prisma.orden.findMany({
      where: { estado: 'COMPLETADA' },
      select: { totalCifrado: true, createdAt: true }
    });

    let ingresosTotales = 0;
    ordenesCompletadas.forEach((orden) => {
      try {
        const total = parseFloat(descifrarTexto(orden.totalCifrado));
        if (!isNaN(total)) ingresosTotales += total;
      } catch (e) {
        console.error('Error al descifrar total de orden:', e);
      }
    });

    // 5. Gastos Totales
    const gastosInternos = await prisma.gastoInterno.findMany({
      where: { isActive: true },
      select: { montoCifrado: true, fecha: true }
    });

    let gastosTotales = 0;
    gastosInternos.forEach((gasto) => {
      try {
        const monto = parseFloat(descifrarTexto(gasto.montoCifrado));
        if (!isNaN(monto)) gastosTotales += monto;
      } catch (e) {
        console.error('Error al descifrar monto de gasto:', e);
      }
    });

    const gananciasTotales = ingresosTotales - gastosTotales;
    const margenGanancia = ingresosTotales > 0 ? (gananciasTotales / ingresosTotales) * 100 : 0;

    // 6. Cargar historial financiero inicial para últimos 7 días
    const chartData = await this.obtenerDatosFinancierosHistoricos('7d');

    // 7. Últimas 5 órdenes
    const ultimasOrdenesRaw = await prisma.orden.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, numeroOrden: true, createdAt: true, totalCifrado: true, estado: true }
    });

    const ultimasOrdenes = ultimasOrdenesRaw.map(o => {
      let total = 0;
      try {
        total = parseFloat(descifrarTexto(o.totalCifrado));
      } catch (e) {}
      return {
        id: o.id,
        numero: o.numeroOrden,
        fecha: o.createdAt,
        total,
        estado: o.estado
      };
    });

    return {
      ingresosTotales,
      gastosTotales,
      gananciasTotales,
      margenGanancia: parseFloat(margenGanancia.toFixed(1)),
      ordenesActivas,
      productosEnStock,
      nuevosClientes,
      chartData,
      ultimasOrdenes
    };
  },

  async obtenerDatosFinancierosHistoricos(periodo: PeriodoFinanciero): Promise<PuntoFinanciero[]> {
    const ordenesCompletadas = await prisma.orden.findMany({
      where: { estado: 'COMPLETADA' },
      select: { totalCifrado: true, createdAt: true }
    });

    const gastosInternos = await prisma.gastoInterno.findMany({
      where: { isActive: true },
      select: { montoCifrado: true, fecha: true, createdAt: true }
    });

    // Mapear ingresos y gastos con fechas descifradas
    const listaIngresos = ordenesCompletadas.map(o => ({
      monto: parseFloat(descifrarTexto(o.totalCifrado)) || 0,
      fecha: new Date(o.createdAt)
    }));

    const listaGastos = gastosInternos.map(g => ({
      monto: parseFloat(descifrarTexto(g.montoCifrado)) || 0,
      fecha: new Date(g.fecha || g.createdAt)
    }));

    const hoy = new Date();
    const result: PuntoFinanciero[] = [];

    if (periodo === '7d') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
        
        const sumIngresos = listaIngresos
          .filter(item => item.fecha.toDateString() === d.toDateString())
          .reduce((acc, item) => acc + item.monto, 0);

        const sumGastos = listaGastos
          .filter(item => item.fecha.toDateString() === d.toDateString())
          .reduce((acc, item) => acc + item.monto, 0);

        result.push({
          periodoLabel: dayStr.charAt(0).toUpperCase() + dayStr.slice(1),
          ingresos: parseFloat(sumIngresos.toFixed(2)),
          gastos: parseFloat(sumGastos.toFixed(2)),
          ganancias: parseFloat((sumIngresos - sumGastos).toFixed(2))
        });
      }
    } else if (periodo === 'mensual') {
      // Últimos 30 días agrupados en 6 periodos de 5 días
      for (let i = 5; i >= 0; i--) {
        const dStart = new Date(hoy);
        dStart.setDate(dStart.getDate() - (i * 5 + 4));
        dStart.setHours(0, 0, 0, 0);

        const dEnd = new Date(dStart);
        dEnd.setDate(dEnd.getDate() + 4);
        dEnd.setHours(23, 59, 59, 999);

        const label = `${dStart.getDate()}/${dStart.getMonth() + 1} - ${dEnd.getDate()}/${dEnd.getMonth() + 1}`;

        const sumIngresos = listaIngresos
          .filter(item => item.fecha >= dStart && item.fecha <= dEnd)
          .reduce((acc, item) => acc + item.monto, 0);

        const sumGastos = listaGastos
          .filter(item => item.fecha >= dStart && item.fecha <= dEnd)
          .reduce((acc, item) => acc + item.monto, 0);

        result.push({
          periodoLabel: label,
          ingresos: parseFloat(sumIngresos.toFixed(2)),
          gastos: parseFloat(sumGastos.toFixed(2)),
          ganancias: parseFloat((sumIngresos - sumGastos).toFixed(2))
        });
      }
    } else if (periodo === 'trimestral') {
      // 4 Trimestres del año actual
      const year = hoy.getFullYear();
      const trimestres = [
        { label: 'Q1 (Ene-Mar)', months: [0, 1, 2] },
        { label: 'Q2 (Abr-Jun)', months: [3, 4, 5] },
        { label: 'Q3 (Jul-Sep)', months: [6, 7, 8] },
        { label: 'Q4 (Oct-Dic)', months: [9, 10, 11] },
      ];

      trimestres.forEach(q => {
        const sumIngresos = listaIngresos
          .filter(item => item.fecha.getFullYear() === year && q.months.includes(item.fecha.getMonth()))
          .reduce((acc, item) => acc + item.monto, 0);

        const sumGastos = listaGastos
          .filter(item => item.fecha.getFullYear() === year && q.months.includes(item.fecha.getMonth()))
          .reduce((acc, item) => acc + item.monto, 0);

        result.push({
          periodoLabel: q.label,
          ingresos: parseFloat(sumIngresos.toFixed(2)),
          gastos: parseFloat(sumGastos.toFixed(2)),
          ganancias: parseFloat((sumIngresos - sumGastos).toFixed(2))
        });
      });
    } else if (periodo === 'anual') {
      // 12 Meses del año actual
      const year = hoy.getFullYear();
      const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      mesesLabels.forEach((mesLabel, monthIdx) => {
        const sumIngresos = listaIngresos
          .filter(item => item.fecha.getFullYear() === year && item.fecha.getMonth() === monthIdx)
          .reduce((acc, item) => acc + item.monto, 0);

        const sumGastos = listaGastos
          .filter(item => item.fecha.getFullYear() === year && item.fecha.getMonth() === monthIdx)
          .reduce((acc, item) => acc + item.monto, 0);

        result.push({
          periodoLabel: mesLabel,
          ingresos: parseFloat(sumIngresos.toFixed(2)),
          gastos: parseFloat(sumGastos.toFixed(2)),
          ganancias: parseFloat((sumIngresos - sumGastos).toFixed(2))
        });
      });
    }

    return result;
  }
};
