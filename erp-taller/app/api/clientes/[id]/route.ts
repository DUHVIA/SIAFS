import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActualizarClienteSchema } from '@/modules/clientes/cliente.dto';
import { ClienteService } from '@/modules/clientes/cliente.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = ActualizarClienteSchema.parse(json);
    
    const clienteActualizado = await ClienteService.actualizar(resolvedParams.id, data);
    return NextResponse.json(clienteActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en PATCH /api/clientes/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    await ClienteService.desactivar(resolvedParams.id);
    return NextResponse.json({ message: 'Cliente desactivado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/clientes/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
