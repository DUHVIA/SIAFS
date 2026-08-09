import { SignJWT } from 'jose';
import { prisma } from '../lib/prisma';

// ==========================================
// USO
// ==========================================
//   GENERATE_INVITATION_EMAIL="afsamfor@gmail.com" npx tsx scripts/generate-invitation-link.ts
//
// Regenera el link de invitación (cambio de contraseña por primera vez / reseteo)
// para un usuario que YA EXISTE en la base de datos. No crea usuarios nuevos,
// no toca roles ni permisos, y no cambia la contraseña actual del usuario —
// solo emite un nuevo token de invitación válido por 7 días.

async function main() {
  const email = process.env.GENERATE_INVITATION_EMAIL;

  if (!email) {
    console.error('ERROR: Debes definir GENERATE_INVITATION_EMAIL.');
    console.error('Ejemplo:');
    console.error('  GENERATE_INVITATION_EMAIL="tu-email@example.com" npx tsx scripts/generate-invitation-link.ts');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    console.error(`[ERROR] No existe ningún usuario con el email: ${email}`);
    process.exit(1);
  }

  if (!usuario.isActive || !usuario.accesoSistema) {
    console.warn(
      `[ADVERTENCIA] El usuario ${email} está inhabilitado (isActive=${usuario.isActive}, accesoSistema=${usuario.accesoSistema}).`
    );
    console.warn('El link se generará igual, pero el usuario no podrá iniciar sesión hasta ser reactivado.');
  }

  // Misma construcción de secreto que en create-users.ts: JWT_SECRET + passwordHash actual.
  // Esto hace que el token quede invalidado automáticamente en cuanto el usuario
  // cambie su contraseña (el hash cambia, y con él la clave de firma).
  const BASE_SECRET = process.env.JWT_SECRET as string;
  const secretKey = new TextEncoder().encode(BASE_SECRET + usuario.passwordHash);

  const token = await new SignJWT({ userId: usuario.id, purpose: 'invitation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tu-erp-en-railway.app').replace(/\/+$/, '');
  const invitationLink = `${baseUrl}/invitacion?token=${token}`;

  console.log(`Usuario: ${usuario.nombre} | Email: ${usuario.email}`);
  console.log(`\n======================================================`);
  console.log(`🔗 NUEVO LINK DE INVITACIÓN (UN SOLO USO, válido 7 días)`);
  console.log(`${invitationLink}`);
  console.log(`======================================================\n`);
  console.log('Nota: cualquier link de invitación generado ANTES de este queda inválido');
  console.log('automáticamente en cuanto se use este (porque cambia la contraseña/hash).');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error inesperado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });