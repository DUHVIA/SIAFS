import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CambiarRolSchema } from '@/modules/accesos/acceso.dto';
import { AccesoService } from '@/modules/accesos/acceso.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ usuarioId: string }> | { usuarioId: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = CambiarRolSchema.parse(json);
    
    const usuarioActualizado = await AccesoService.cambiarRolUsuario(resolvedParams.usuarioId, data.rolId);
    return NextResponse.json(usuarioActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en PATCH /api/accesos/usuarios/[usuarioId]/rol:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
