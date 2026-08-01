import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActualizarUsuarioSchema } from '@/modules/usuarios/usuario.dto';
import { UsuarioService } from '@/modules/usuarios/usuario.service';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const requestingUserId = request.headers.get('x-usuario-id');

    // 1. Restricción: No auto-deshabilitarse o auto-cambiarse el rol
    if (requestingUserId && requestingUserId === resolvedParams.id) {
      const jsonPeek = await request.clone().json();
      if (jsonPeek.accesoSistema === false || jsonPeek.isActive === false || jsonPeek.rolId) {
        return NextResponse.json(
          { error: 'No puedes inhabilitar ni modificar el rol de tu propia cuenta de usuario' },
          { status: 403 }
        );
      }
    }

    // 2. Restricción de Jerarquía: Solo DUEÑO puede modificar a un usuario con rol DUEÑO
    const targetUsuario = await prisma.usuario.findUnique({
      where: { id: resolvedParams.id },
      include: { rol: true },
    });

    if (targetUsuario && targetUsuario.rol?.nombre === 'DUEÑO') {
      if (requestingUserId) {
        const requestingUsuario = await prisma.usuario.findUnique({
          where: { id: requestingUserId },
          include: { rol: true },
        });
        if (requestingUsuario?.rol?.nombre !== 'DUEÑO') {
          return NextResponse.json(
            { error: 'No tienes autorización para modificar a un usuario con el rol DUEÑO' },
            { status: 403 }
          );
        }
      }
    }

    const json = await request.json();
    const data = ActualizarUsuarioSchema.parse(json);
    
    const usuarioActualizado = await UsuarioService.actualizar(resolvedParams.id, data);
    return NextResponse.json(usuarioActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en PATCH /api/usuarios/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const requestingUserId = request.headers.get('x-usuario-id');

    if (requestingUserId && requestingUserId === resolvedParams.id) {
      return NextResponse.json(
        { error: 'No puedes inhabilitar tu propia cuenta de usuario' },
        { status: 403 }
      );
    }

    const targetUsuario = await prisma.usuario.findUnique({
      where: { id: resolvedParams.id },
      include: { rol: true },
    });

    if (targetUsuario && targetUsuario.rol?.nombre === 'DUEÑO') {
      if (requestingUserId) {
        const requestingUsuario = await prisma.usuario.findUnique({
          where: { id: requestingUserId },
          include: { rol: true },
        });
        if (requestingUsuario?.rol?.nombre !== 'DUEÑO') {
          return NextResponse.json(
            { error: 'No tienes autorización para inhabilitar a un usuario con el rol DUEÑO' },
            { status: 403 }
          );
        }
      }
    }

    await UsuarioService.desactivar(resolvedParams.id);
    return NextResponse.json({ message: 'Usuario desactivado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/usuarios/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
