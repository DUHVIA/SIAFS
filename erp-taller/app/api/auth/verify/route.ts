import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ active: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (!payload || !payload.usuarioId) {
      return NextResponse.json({ active: false }, { status: 401 });
    }

    // Consulta ultrarrápida solo seleccionando accesoSistema
    const user = await prisma.usuario.findUnique({
      where: { id: payload.usuarioId as string },
      select: { accesoSistema: true, isActive: true }
    });

    if (!user || !user.isActive || !user.accesoSistema) {
      return NextResponse.json({ active: false }, { status: 401 });
    }

    return NextResponse.json({ active: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ active: false }, { status: 401 });
  }
}
