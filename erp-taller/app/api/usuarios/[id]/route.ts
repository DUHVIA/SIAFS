import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActualizarUsuarioSchema } from '@/modules/usuarios/usuario.dto';
import { UsuarioService } from '@/modules/usuarios/usuario.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = ActualizarUsuarioSchema.parse(json);
    
    const usuarioActualizado = await UsuarioService.actualizar(resolvedParams.id, data);
    return NextResponse.json(usuarioActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en PATCH /api/usuarios/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    await UsuarioService.desactivar(resolvedParams.id);
    return NextResponse.json({ message: 'Usuario desactivado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/usuarios/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
