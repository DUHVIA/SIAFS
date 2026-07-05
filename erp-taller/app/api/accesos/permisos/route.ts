import { NextResponse } from 'next/server';
import { AccesoService } from '@/modules/accesos/acceso.service';

export async function GET() {
  try {
    const permisos = await AccesoService.listarPermisos();
    return NextResponse.json(permisos, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/accesos/permisos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
