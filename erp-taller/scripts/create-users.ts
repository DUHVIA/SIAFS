import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

// Usamos la misma lógica de cifrado que en el servidor
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Lista de usuarios a crear
// Modifica esta lista según tus necesidades
const USERS_TO_CREATE = [
  { nombre: 'Administrador (Dueño)', email: 'afsamfor@gmail.com', rolNombre: 'DUEÑO' }
];

async function main() {
  // Leer la contraseña por defecto de las variables de entorno
  // Asegúrate de definir DEFAULT_USER_PASSWORD en tu archivo .env
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;

  if (!defaultPassword) {
    console.error("ERROR: No se ha definido DEFAULT_USER_PASSWORD en el archivo .env");
    console.error("Por seguridad, define esta variable antes de ejecutar el script.");
    process.exit(1);
  }

  console.log("Iniciando creación masiva de usuarios...");

  for (const userData of USERS_TO_CREATE) {
    // 1. Verificar si el usuario ya existe
    const existe = await prisma.usuario.findUnique({
      where: { email: userData.email }
    });

    if (existe) {
      console.log(`[SALTADO] El usuario ${userData.email} ya existe.`);
      continue;
    }

    // 2. Buscar el ID del rol por su nombre
    const rol = await prisma.rol.findFirst({
      where: { nombre: userData.rolNombre },
      include: { permisos: true }
    });

    if (!rol) {
      console.error(`[ERROR] Rol '${userData.rolNombre}' no encontrado para ${userData.email}.`);
      continue;
    }

    // 3. Crear el usuario
    const { hash, salt } = hashPassword(defaultPassword);
    
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: userData.nombre,
        email: userData.email,
        passwordHash: hash,
        salt,
        rolId: rol.id,
        accesoSistema: true,
        isActive: true,
      }
    });

    // 4. Clonar permisos del rol (Plantilla)
    if (rol.permisos.length > 0) {
      await prisma.usuarioPermiso.createMany({
        data: rol.permisos.map(rp => ({
          usuarioId: nuevoUsuario.id,
          permisoId: rp.permisoId
        }))
      });
    }

    // 5. Generar link de invitación
    const BASE_SECRET = process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!';
    const secretKey = new TextEncoder().encode(BASE_SECRET + hash);
    const token = await new SignJWT({ userId: nuevoUsuario.id, purpose: 'invitation' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-erp-en-railway.app';
    const invitationLink = `${baseUrl}/invitacion?token=${token}`;

    console.log(`[CREADO] Usuario: ${userData.nombre} | Email: ${userData.email} | Rol: ${userData.rolNombre}`);
    console.log(`\n======================================================`);
    console.log(`🔗 LINK DE INVITACIÓN (UN SOLO USO)`);
    console.log(`${invitationLink}`);
    console.log(`======================================================\n`);
  }

  console.log("Proceso finalizado.");
}

main()
  .catch((e) => {
    console.error("Ocurrió un error inesperado:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
