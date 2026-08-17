import { SignJWT } from 'jose';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/crypto';

// ==========================================
// 1. CATÁLOGO DE PERMISOS BASE DEL SISTEMA
// ==========================================
const CODIGOS_PERMISOS = [
  'VER_DASHBOARD',
  'GESTIONAR_USUARIOS',
  'EDITAR_PERMISOS',
  'VER_PRODUCTOS',
  'CREAR_PRODUCTO',
  'EDITAR_PRODUCTO',
  'ELIMINAR_PRODUCTO',
  'VER_CLIENTES',
  'CREAR_CLIENTE',
  'EDITAR_CLIENTE',
  'VER_ORDENES',
  'CREAR_COTIZACION',
  'CREAR_VENTA_DIRECTA',
  'COMPLETAR_ORDEN',
  'ANULAR_ORDEN',
  'VER_INGRESOS',
  'REGISTRAR_INGRESO',
  'VER_GASTOS',
  'REGISTRAR_GASTO',
  'ANULAR_GASTO',
];

const ROLES_BASE: { nombre: string; codigosPermisos: string[] | 'ALL' }[] = [
  { nombre: 'DUEÑO', codigosPermisos: 'ALL' },
  { nombre: 'ADMIN', codigosPermisos: 'ALL' },
  {
    nombre: 'VENDEDOR',
    codigosPermisos: [
      'VER_DASHBOARD', 'VER_PRODUCTOS', 'VER_CLIENTES', 'CREAR_CLIENTE',
      'EDITAR_CLIENTE', 'VER_ORDENES', 'CREAR_COTIZACION', 'CREAR_VENTA_DIRECTA',
    ],
  },
];

async function seedPermisosYRoles() {
  console.log('🌱 Verificando/creando permisos base...');
  const permisosCreados = [];
  for (const codigo of CODIGOS_PERMISOS) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo },
      update: {},
      create: { codigo },
    });
    permisosCreados.push(permiso);
  }

  console.log('🌱 Verificando/creando roles base y sus plantillas de permisos...');
  const rolesCreados: Record<string, { id: string }> = {};

  for (const rolDef of ROLES_BASE) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolDef.nombre },
      update: {},
      create: { nombre: rolDef.nombre },
    });
    rolesCreados[rolDef.nombre] = rol;

    const permisosDelRol =
      rolDef.codigosPermisos === 'ALL'
        ? permisosCreados
        : permisosCreados.filter((p) => (rolDef.codigosPermisos as string[]).includes(p.codigo));

    for (const permiso of permisosDelRol) {
      await prisma.rolPermisoBase.upsert({
        where: { rolId_permisoId: { rolId: rol.id, permisoId: permiso.id } },
        update: {},
        create: { rolId: rol.id, permisoId: permiso.id },
      });
    }
  }

  return { permisosCreados, rolesCreados };
}

function parseArgs() {
  const args = process.argv.slice(2);
  let nombre: string | undefined = process.env.USER_NOMBRE;
  let email: string | undefined = process.env.USER_EMAIL;
  let rol: string | undefined = process.env.USER_ROL || process.env.USER_ROLE;

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--nombre' || arg === '--name' || arg === '-n') {
      nombre = args[++i];
    } else if (arg.startsWith('--nombre=')) {
      nombre = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--name=')) {
      nombre = arg.split('=').slice(1).join('=');
    } else if (arg === '--email' || arg === '-e') {
      email = args[++i];
    } else if (arg.startsWith('--email=')) {
      email = arg.split('=').slice(1).join('=');
    } else if (arg === '--rol' || arg === '--role' || arg === '-r') {
      rol = args[++i];
    } else if (arg.startsWith('--rol=')) {
      rol = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--role=')) {
      rol = arg.split('=').slice(1).join('=');
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (!nombre && positional[0]) nombre = positional[0];
  if (!email && positional[1]) email = positional[1];
  if (!rol && positional[2]) rol = positional[2];

  return { nombre, email, rol };
}

function printUsage() {
  console.log(`
======================================================
👤 SCRIPT DE CREACIÓN DE USUARIO (SIAFS)
======================================================

Uso mediante argumentos posicionales:
  npx tsx scripts/create-user.ts "Nombre Completo" "email@ejemplo.com" "ROL"

Uso mediante flags nombradas:
  npx tsx scripts/create-user.ts --nombre "Juan Perez" --email "juan@ejemplo.com" --rol "ADMIN"
  npx tsx scripts/create-user.ts --name "Maria Lopez" --email "maria@ejemplo.com" --role "VENDEDOR"

Uso mediante variables de entorno:
  USER_NOMBRE="Carlos Gomez" USER_EMAIL="carlos@ejemplo.com" USER_ROL="DUEÑO" npx tsx scripts/create-user.ts

Roles válidos: DUEÑO, ADMIN, VENDEDOR (o cualquier rol existente en la BD)
  `);
}

async function main() {
  const { nombre, email, rol: inputRol } = parseArgs();

  if (!nombre || !email || !inputRol) {
    console.error('❌ Faltan parámetros obligatorios para crear el usuario.\n');
    if (!nombre) console.error('   • Falta el NOMBRE del usuario.');
    if (!email) console.error('   • Falta el EMAIL del usuario.');
    if (!inputRol) console.error('   • Falta el ROL del usuario.');
    printUsage();
    process.exit(1);
  }

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
  if (!defaultPassword) {
    console.error('ERROR: No se ha definido DEFAULT_USER_PASSWORD en el archivo .env');
    console.error('Por seguridad, define esta variable antes de ejecutar el script.');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  }

  // 1. Asegurar roles y permisos base
  await seedPermisosYRoles();

  // 2. Verificar si el email ya está registrado
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
  if (usuarioExistente) {
    console.error(`\n❌ [ERROR] El usuario con email '${email}' ya existe en la base de datos.`);
    process.exit(1);
  }

  // 3. Buscar rol (coincidencia exacta o Mayúsculas)
  const rolNormalizado = inputRol.toUpperCase();
  let rol = await prisma.rol.findFirst({
    where: { OR: [{ nombre: inputRol }, { nombre: rolNormalizado }] },
    include: { permisos: true },
  });

  if (!rol) {
    const rolesDisponibles = await prisma.rol.findMany({ select: { nombre: true } });
    console.error(`\n❌ [ERROR] El rol '${inputRol}' no fue encontrado.`);
    console.error(`   Roles disponibles en el sistema: ${rolesDisponibles.map((r) => r.nombre).join(', ')}`);
    process.exit(1);
  }

  // 4. Hash de contraseña temporal
  const { hash, salt } = hashPassword(defaultPassword);

  // 5. Crear usuario
  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash: hash,
      salt,
      rolId: rol.id,
      accesoSistema: true,
      isActive: true,
    },
  });

  // 6. Asignar copia de permisos de rol a UsuarioPermiso
  if (rol.permisos.length > 0) {
    await prisma.usuarioPermiso.createMany({
      data: rol.permisos.map((rp) => ({
        usuarioId: nuevoUsuario.id,
        permisoId: rp.permisoId,
      })),
    });
  }

  // 7. Generar token de invitación (7 días)
  const BASE_SECRET = process.env.JWT_SECRET as string;
  const secretKey = new TextEncoder().encode(BASE_SECRET + hash);
  const token = await new SignJWT({ userId: nuevoUsuario.id, purpose: 'invitation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tu-erp-en-railway.app').replace(/\/+$/, '');
  const invitationLink = `${baseUrl}/invitacion?token=${token}`;

  console.log(`\n======================================================`);
  console.log(`✅ USUARIO CREADO EXITOSAMENTE`);
  console.log(`======================================================`);
  console.log(`👤 Nombre:  ${nuevoUsuario.nombre}`);
  console.log(`📧 Email:   ${nuevoUsuario.email}`);
  console.log(`🛡️ Rol:     ${rol.nombre} (${rol.permisos.length} permisos asignados)`);
  console.log(`\n🔗 LINK DE INVITACIÓN (UN SOLO USO - VÁLIDO 7 DÍAS):`);
  console.log(`${invitationLink}`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('Ocurrió un error inesperado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
