import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
// Importas las funciones que acabamos de crear (ajusta la ruta según tu estructura)
import { cifrarTexto, generarIndiceCiego, hashPassword } from '../lib/crypto';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando la inicialización de la base de datos...');

  // ==========================================
  // 1. CREACIÓN DE PERMISOS BASE
  // ==========================================
  const codigosPermisos = [
    // Dashboard y Métricas
    'VER_DASHBOARD',
    
    // Módulo de Usuarios y Configuración
    'GESTIONAR_USUARIOS',
    'EDITAR_PERMISOS',
    
    // Módulo de Inventario / Catálogo
    'VER_PRODUCTOS',
    'CREAR_PRODUCTO',
    'EDITAR_PRODUCTO',
    'ELIMINAR_PRODUCTO',
    
    // Módulo de Clientes
    'VER_CLIENTES',
    'CREAR_CLIENTE',
    'EDITAR_CLIENTE',
    
    // Módulo de Órdenes (Cotizaciones y Ventas)
    'VER_ORDENES',
    'CREAR_COTIZACION',
    'CREAR_VENTA_DIRECTA',
    'COMPLETAR_ORDEN',
    'ANULAR_ORDEN',
    
    // Módulo de Compras (Ingreso de Lotes)
    'VER_INGRESOS',
    'REGISTRAR_INGRESO',
    
    // Módulo de Finanzas / Caja Chica
    'VER_GASTOS',
    'REGISTRAR_GASTO',
    'ANULAR_GASTO'
  ];

  console.log(`Creating/updating ${codigosPermisos.length} permisos...`);
  const permisosCreados = [];
  
  for (const codigo of codigosPermisos) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo },
      update: {}, // Si ya existe, no hace nada
      create: { codigo },
    });
    permisosCreados.push(permiso);
  }

  // ==========================================
  // 2. CREACIÓN DE ROLES
  // ==========================================
  console.log('Creando roles base...');
  
  const rolDueno = await prisma.rol.upsert({
    where: { nombre: 'DUEÑO' },
    update: {},
    create: { nombre: 'DUEÑO' },
  });

  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN' },
  });

  const rolVendedor = await prisma.rol.upsert({
    where: { nombre: 'VENDEDOR' },
    update: {},
    create: { nombre: 'VENDEDOR' },
  });

  // ==========================================
  // 3. ASIGNACIÓN DE PLANTILLAS DE PERMISOS (RolPermisoBase)
  // ==========================================
  console.log('Asignando plantillas de permisos a los roles...');

  // El DUEÑO tiene absolutamente todos los permisos del sistema
  for (const permiso of permisosCreados) {
    await prisma.rolPermisoBase.upsert({
      where: {
        rolId_permisoId: { rolId: rolDueno.id, permisoId: permiso.id }
      },
      update: {},
      create: { rolId: rolDueno.id, permisoId: permiso.id }
    });
  }

  // El VENDEDOR solo tiene un set operativo limitado
  const codigosVendedor = [
    'VER_DASHBOARD', 'VER_PRODUCTOS', 'VER_CLIENTES', 'CREAR_CLIENTE', 
    'EDITAR_CLIENTE', 'VER_ORDENES', 'CREAR_COTIZACION', 'CREAR_VENTA_DIRECTA'
  ];
  
  for (const permiso of permisosCreados.filter(p => codigosVendedor.includes(p.codigo))) {
    await prisma.rolPermisoBase.upsert({
      where: {
        rolId_permisoId: { rolId: rolVendedor.id, permisoId: permiso.id }
      },
      update: {},
      create: { rolId: rolVendedor.id, permisoId: permiso.id }
    });
  }

  // ==========================================
  // 4. CREACIÓN DEL USUARIO DUEÑO MAESTRO
  // ==========================================
  console.log('Creando usuario maestro (Dueño)...');
  
  const emailDueno = 'admin@duhvia.com';
  const contrasenaInicial = 'DuhviaMaster2026!'; // Contraseña temporal segura
  const { salt, hash } = hashPassword(contrasenaInicial);

  const usuarioDueno = await prisma.usuario.upsert({
    where: { email: emailDueno },
    update: {}, // Si ya existe, preservamos sus datos intactos
    create: {
      email: emailDueno,
      nombre: 'Administrador General',
      passwordHash: hash,
      salt: salt,
      rolId: rolDueno.id,
      accesoSistema: true,
      isActive: true
    },
  });

  // ==========================================
  // 5. COPIAR PERMISOS BASE AL USUARIO (Independencia total)
  // ==========================================
  console.log('Inyectando los permisos independientes al usuario maestro...');
  for (const permiso of permisosCreados) {
    await prisma.usuarioPermiso.upsert({
      where: {
        usuarioId_permisoId: { usuarioId: usuarioDueno.id, permisoId: permiso.id }
      },
      update: {},
      create: { usuarioId: usuarioDueno.id, permisoId: permiso.id }
    });
  }

// ... (código anterior de roles y usuario dueño) ...

console.log('📦 Insertando datos de prueba encriptados...');

// 1. Crear un Cliente Encriptado
const nombreCliente = 'Juan Pérez';
const dniCliente = '70123456';

const clienteTest = await prisma.cliente.create({
  data: {
    nombreCifrado: cifrarTexto(nombreCliente),
    idxNombre: generarIndiceCiego(nombreCliente),
    documentoCifrado: cifrarTexto(dniCliente),
    idxDocumento: generarIndiceCiego(dniCliente),
    telefonoCifrado: cifrarTexto('987654321'),
    direccionCifrado: cifrarTexto('Av. Ejército 123, Arequipa'),
  }
});

// 2. Crear un Producto Encriptado
const nombreProducto = 'Bujía Iridium NGK';

const productoTest = await prisma.producto.create({
  data: {
    categoria: 'AUTOPARTE',
    nombreCifrado: cifrarTexto(nombreProducto),
    idxNombre: generarIndiceCiego(nombreProducto),
    precioVentaCifrado: cifrarTexto('45.50'),
    stockCifrado: cifrarTexto('100'),
    rangoStock: 100, // No cifrado para poder filtrar si stock > 0
    detallesCifrados: cifrarTexto(JSON.stringify({ marca: 'NGK', origen: 'Japón' })),
    isActive: true
  }
});

// 3. Crear el Movimiento en el Kardex
await prisma.kardex.create({
  data: {
    productoId: productoTest.id,
    usuarioId: usuarioDueno.id,
    tipoMovimiento: 'INGRESO',
    cantidadCifrada: cifrarTexto('100'),
    motivoCifrado: cifrarTexto('Inventario Inicial')
  }
});

console.log('✅ Datos de prueba insertados con éxito.');

  console.log('\n🚀 Base de datos inicializada con éxito.');
  console.log('--------------------------------------------------');
  console.log(`📧 Usuario Administrador: ${emailDueno}`);
  console.log(`🔑 Contraseña Temporal:   ${contrasenaInicial}`);
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });