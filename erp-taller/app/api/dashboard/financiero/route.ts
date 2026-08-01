import { NextResponse } from 'next/server';
import { DashboardService, PeriodoFinanciero } from '@/modules/dashboard/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = (searchParams.get('periodo') as PeriodoFinanciero) || '7d';

    const validos: PeriodoFinanciero[] = ['7d', 'mensual', 'trimestral', 'anual'];
    const periodoSeleccionado = validos.includes(periodo) ? periodo : '7d';

    const chartData = await DashboardService.obtenerDatosFinancierosHistoricos(periodoSeleccionado);

    return NextResponse.json({ chartData });
  } catch (error: any) {
    console.error('Error al obtener datos financieros del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos financieros del dashboard' },
      { status: 500 }
    );
  }
}
