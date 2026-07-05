import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearGastoSchema } from '@/modules/gastos/gasto.dto';
import { GastoService } from '@/modules/gastos/gasto.service';

export async function GET() {
  try {
    const gastos = await GastoService.obtenerTodos();
    return NextResponse.json(gastos, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearGastoSchema.parse(json);
    
    const nuevoGasto = await GastoService.crear(data);
    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
