import { SignJWT } from 'jose';
import { prisma } from '../lib/prisma';
// Usamos la MISMA función de hash que usa el resto del sistema (auth, seed de dev)
// para garantizar que el login funcione igual en producción.
import { hashPassword } from '../lib/crypto';

// ==========================================
// 0. CONFIGURACIÓN — Usuario(s) a crear
// ==========================================
// Solo agrega aquí el/los usuario(s) reales que necesitas crear en PRODUCCIÓN.
// El seed de datos de prueba (cliente ficticio, producto ficticio, kardex, etc.)
// del seed.ts de desarrollo NO se incluye a propósito.
const USERS_TO_CREATE = [
  { nombre: 'Administrador (Dueño)', email: 'afsamfor@gmail.com', rolNombre: 'DUEÑO' },
];

// ==========================================
// 1. CATÁLOGO DE PERMISOS BASE DEL SISTEMA
// ==========================================
// Debe mantenerse en paralelo con prisma/seed.ts (dev). Si agregas un permiso
// nuevo allá, agrégalo también aquí.
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

// Roles base y qué permisos recibe cada uno como plantilla (RolPermisoBase).
// - DUEÑO y ADMIN: acceso total (todos los permisos del catálogo).
// - VENDEDOR: set operativo limitado.
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
  console.log(`   → ${permisosCreados.length} permisos listos.`);

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
    console.log(`   → Rol '${rolDef.nombre}' con ${permisosDelRol.length} permisos.`);
  }

  return { permisosCreados, rolesCreados };
}

async function main() {
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;

  if (!defaultPassword) {
    console.error('ERROR: No se ha definido DEFAULT_USER_PASSWORD en el archivo .env');
    console.error('Por seguridad, define esta variable antes de ejecutar el script.');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  }

  // Paso 1: datos por defecto del sistema (permisos + roles + plantillas)
  const { permisosCreados } = await seedPermisosYRoles();

  // Paso 2: usuario(s) reales de producción — NINGÚN dato de prueba adicional
  console.log('\n👤 Creando usuario(s) de producción...');

  for (const userData of USERS_TO_CREATE) {
    const existe = await prisma.usuario.findUnique({ where: { email: userData.email } });
    if (existe) {
      console.log(`[SALTADO] El usuario ${userData.email} ya existe.`);
      continue;
    }

    const rol = await prisma.rol.findFirst({
      where: { nombre: userData.rolNombre },
      include: { permisos: true },
    });

    if (!rol) {
      console.error(`[ERROR] Rol '${userData.rolNombre}' no encontrado para ${userData.email}.`);
      continue;
    }

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
      },
    });

    // Copia independiente de permisos del rol al usuario (UsuarioPermiso)
    if (rol.permisos.length > 0) {
      await prisma.usuarioPermiso.createMany({
        data: rol.permisos.map((rp) => ({
          usuarioId: nuevoUsuario.id,
          permisoId: rp.permisoId,
        })),
      });
    }

    const BASE_SECRET = process.env.JWT_SECRET as string;
    const secretKey = new TextEncoder().encode(BASE_SECRET + hash);
    const token = await new SignJWT({ userId: nuevoUsuario.id, purpose: 'invitation' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tu-erp-en-railway.app').replace(/\/+$/, '');
    const invitationLink = `${baseUrl}/invitacion?token=${token}`;

    console.log(`[CREADO] Usuario: ${userData.nombre} | Email: ${userData.email} | Rol: ${userData.rolNombre}`);
    console.log(`\n======================================================`);
    console.log(`🔗 LINK DE INVITACIÓN (UN SOLO USO)`);
    console.log(`${invitationLink}`);
    console.log(`======================================================\n`);
  }

  console.log('✅ Proceso finalizado.');
  console.log(`   Permisos en catálogo: ${permisosCreados.length}`);
  console.log('   Sin datos de prueba (clientes, productos, kardex, órdenes, gastos, ingresos): base limpia.');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error inesperado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });