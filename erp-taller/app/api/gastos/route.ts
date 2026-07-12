import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearGastoSchema } from '@/modules/gastos/gasto.dto';
import { GastoService } from '@/modules/gastos/gasto.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await GastoService.obtenerTodosFiltrados({
      search: search || undefined,
      page,
      limit,
    });
    return NextResponse.json(result, { status: 200 });
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
