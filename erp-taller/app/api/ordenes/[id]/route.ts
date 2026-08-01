import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PatchOrdenSchema, ActualizarCotizacionSchema } from '@/modules/ordenes/orden.dto';
import { OrdenService } from '@/modules/ordenes/orden.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const orden = await OrdenService.obtenerPorId(id);
    return NextResponse.json(orden, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    console.error('Error en GET /api/ordenes/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const data = PatchOrdenSchema.parse(json);

    let result;
    if (data.action === 'anular') {
      result = await OrdenService.anular(id, data);
    } else {
      result = await OrdenService.convertirAVenta(id, data);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    console.error('Error en PATCH /api/ordenes/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const data = ActualizarCotizacionSchema.parse(json);
    const result = await OrdenService.actualizarCotizacion(id, data);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    console.error('Error en PUT /api/ordenes/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
