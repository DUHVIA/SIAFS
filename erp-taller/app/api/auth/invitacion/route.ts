import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify, decodeJwt } from 'jose';
import crypto from 'crypto';
import { BASE_SECRET } from '@/lib/secrets';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    // 1. Decodificar sin verificar para obtener el userId
    let payload;
    try {
      payload = decodeJwt(token);
    } catch (e) {
      return NextResponse.json({ error: 'Token con formato inválido' }, { status: 400 });
    }

    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // 2. Buscar al usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'El usuario ya no existe' }, { status: 404 });
    }

    // 3. Verificar el token usando la firma combinada (secreto + passwordHash actual)
    const secretKey = new TextEncoder().encode(BASE_SECRET + user.passwordHash);
    
    try {
      await jwtVerify(token, secretKey);
    } catch (e: any) {
      if (e.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ error: 'El enlace ha expirado' }, { status: 400 });
      }
      return NextResponse.json({ error: 'El enlace es inválido o ya ha sido utilizado' }, { status: 400 });
    }

    // 4. Si la verificación fue exitosa, generar el nuevo hash
    const { hash, salt } = hashPassword(password);

    // 5. Actualizar al usuario en la base de datos
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        passwordHash: hash,
        salt: salt
      }
    });

    // Al haber cambiado el passwordHash, el token anterior automáticamente
    // dejará de ser válido, asegurando un uso único.

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error en POST /api/auth/invitacion:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
