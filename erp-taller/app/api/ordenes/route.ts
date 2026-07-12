import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearOrdenSchema } from '@/modules/ordenes/orden.dto';
import { OrdenService } from '@/modules/ordenes/orden.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const estado = searchParams.get('estado') || '';
    const search = searchParams.get('search') || '';
    const clienteId = searchParams.get('clienteId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await OrdenService.obtenerTodasFiltradas({
      tipo: tipo || undefined,
      estado: estado || undefined,
      search: search || undefined,
      clienteId: clienteId || undefined,
      page,
      limit,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/ordenes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearOrdenSchema.parse(json);

    const nuevaOrden = await OrdenService.crearOrden(data);
    return NextResponse.json(nuevaOrden, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/ordenes:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
