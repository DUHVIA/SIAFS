import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActualizarGastoSchema } from '@/modules/gastos/gasto.dto';
import { GastoService } from '@/modules/gastos/gasto.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = ActualizarGastoSchema.parse(json);
    
    const gastoActualizado = await GastoService.actualizar(resolvedParams.id, data);
    return NextResponse.json(gastoActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en PATCH /api/gastos/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    await GastoService.anular(resolvedParams.id);
    return NextResponse.json({ message: 'Gasto anulado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/gastos/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
