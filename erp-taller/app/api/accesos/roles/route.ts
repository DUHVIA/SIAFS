import { NextResponse } from 'next/server';
import { AccesoService } from '@/modules/accesos/acceso.service';

export async function GET() {
  try {
    const roles = await AccesoService.listarRoles();
    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/accesos/roles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
