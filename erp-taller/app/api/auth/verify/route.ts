import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { ENCODED_JWT_SECRET } from '@/lib/secrets';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ active: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
    
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
