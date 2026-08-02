import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const BASE_SECRET = process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const requestingUserId = request.headers.get('x-usuario-id');
    const userPermissions = JSON.parse(request.headers.get('x-user-permissions') || '[]');

    // Verificar permisos
    if (!userPermissions.includes('GESTIONAR_USUARIOS')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // Buscar al usuario
    const targetUser = await prisma.usuario.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true, passwordHash: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Crear un secreto combinando el JWT_SECRET base con el hash de contraseña actual
    // Si la contraseña cambia, este secreto será inválido automáticamente
    const secretKey = new TextEncoder().encode(BASE_SECRET + targetUser.passwordHash);

    // Firmar el JWT
    const token = await new SignJWT({
      userId: targetUser.id,
      purpose: 'invitation'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Expira en 7 días
      .sign(secretKey);

    // Obtener la URL base
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const invitationLink = `${baseUrl}/invitacion?token=${token}`;

    return NextResponse.json({ link: invitationLink }, { status: 200 });
  } catch (error: any) {
    console.error(`Error generando link de invitación:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
