import { NextResponse } from 'next/server';
import { KardexService } from '@/modules/kardex/kardex.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productoId: string }> | { productoId: string } }
) {
  try {
    const resolvedParams = await params;
    const historial = await KardexService.obtenerHistorialPorProducto(resolvedParams.productoId);
    return NextResponse.json(historial, { status: 200 });
  } catch (error) {
    console.error(`Error en GET /api/kardex/producto/[productoId]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
