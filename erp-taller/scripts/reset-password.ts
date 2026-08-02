import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/crypto';

// ==========================================
// CONFIGURACIÓN
// ==========================================
// Define estas dos variables antes de ejecutar el script:
//
//   RESET_USER_EMAIL="<email>" RESET_USER_PASSWORD="<passwordnuevo>" npx tsx scripts/reset-password.ts
//
// O agrégalas temporalmente a tu .env y luego bórralas.
const EMAIL = process.env.RESET_USER_EMAIL;
const NUEVA_PASSWORD = process.env.RESET_USER_PASSWORD;

async function main() {
  if (!EMAIL || !NUEVA_PASSWORD) {
    console.error('ERROR: Debes definir RESET_USER_EMAIL y RESET_USER_PASSWORD.');
    console.error('Ejemplo:');
    console.error('  RESET_USER_EMAIL="<email>" RESET_USER_PASSWORD="<passwordnuevo>" npx tsx scripts/reset-password.ts');
    process.exit(1);
  }

  if (NUEVA_PASSWORD.length < 8) {
    console.error('ERROR: La nueva contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: EMAIL } });

  if (!usuario) {
    console.error(`[ERROR] No existe ningún usuario con el email: ${EMAIL}`);
    process.exit(1);
  }

  const { hash, salt } = hashPassword(NUEVA_PASSWORD);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      passwordHash: hash,
      salt,
      accesoSistema: true, // por si estaba deshabilitado, lo reactivamos al resetear
    },
  });

  console.log(`✅ Contraseña actualizada correctamente para: ${usuario.nombre} (${usuario.email})`);
  console.log('   Ya puede iniciar sesión con la nueva contraseña.');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error inesperado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });