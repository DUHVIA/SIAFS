import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AsignarPermisosSchema, PermisoIndividualSchema } from '@/modules/accesos/acceso.dto';
import { AccesoService } from '@/modules/accesos/acceso.service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ usuarioId: string }> | { usuarioId: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = AsignarPermisosSchema.parse(json);
    
    const permisos = await AccesoService.setearPermisosUsuario(resolvedParams.usuarioId, data.permisosIds);
    return NextResponse.json(permisos, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en PUT /api/accesos/usuarios/[usuarioId]/permisos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ usuarioId: string }> | { usuarioId: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = PermisoIndividualSchema.parse(json);
    
    const permisoAsignado = await AccesoService.asignarPermisoIndividual(resolvedParams.usuarioId, data.permisoId);
    return NextResponse.json(permisoAsignado, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/accesos/usuarios/[usuarioId]/permisos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ usuarioId: string }> | { usuarioId: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = PermisoIndividualSchema.parse(json); // Asumiendo que se pasa en el body o query
    
    await AccesoService.revocarPermisoIndividual(resolvedParams.usuarioId, data.permisoId);
    return NextResponse.json({ message: 'Permiso revocado' }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en DELETE /api/accesos/usuarios/[usuarioId]/permisos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
