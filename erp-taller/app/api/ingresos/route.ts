import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearIngresoSchema } from '@/modules/ingresos/ingreso.dto';
import { IngresoService } from '@/modules/ingresos/ingreso.service';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearIngresoSchema.parse(json);
    
    const nuevoIngreso = await IngresoService.crearIngreso(data);
    return NextResponse.json(nuevoIngreso, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/ingresos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
