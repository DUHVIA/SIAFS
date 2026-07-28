import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearUsuarioSchema } from '@/modules/usuarios/usuario.dto';
import { UsuarioService } from '@/modules/usuarios/usuario.service';
import { requirePermission } from '@/lib/serverAuth';

export async function GET() {
  try {
    const usuarios = await UsuarioService.obtenerTodos();
    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePermission('GESTIONAR_USUARIOS');
    if (auth.error) return auth.error;

    const json = await request.json();
    const data = CrearUsuarioSchema.parse(json);
    
    const nuevoUsuario = await UsuarioService.crear(data);
    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
