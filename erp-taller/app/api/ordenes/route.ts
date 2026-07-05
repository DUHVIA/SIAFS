import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearOrdenSchema } from '@/modules/ordenes/orden.dto';
import { OrdenService } from '@/modules/ordenes/orden.service';

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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
