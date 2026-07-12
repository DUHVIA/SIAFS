import { NextResponse } from 'next/server';
import { IngresoService } from '@/modules/ingresos/ingreso.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const ingreso = await IngresoService.obtenerPorId(resolvedParams.id);
    return NextResponse.json(ingreso, { status: 200 });
  } catch (error: any) {
    console.error(`Error en GET /api/ingresos/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
