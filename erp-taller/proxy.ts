import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ENCODED_JWT_SECRET } from './lib/secrets';
import { prisma } from './lib/prisma';

const ROUTE_PERMISSIONS = [
  { prefix: '/inventario', permission: 'VER_PRODUCTOS' },
  { prefix: '/ordenes', permission: 'VER_ORDENES' },
  { prefix: '/clientes', permission: 'VER_CLIENTES' },
  { prefix: '/usuarios', permission: 'GESTIONAR_USUARIOS' },
  { prefix: '/finanzas', permission: 'VER_GASTOS' },
  { prefix: '/ingresos', permission: 'VER_INGRESOS' },
  { prefix: '/api/productos', permission: 'VER_PRODUCTOS' },
  { prefix: '/api/ordenes', permission: 'VER_ORDENES' },
  { prefix: '/api/clientes', permission: 'VER_CLIENTES' },
  { prefix: '/api/usuarios', permission: 'GESTIONAR_USUARIOS' },
  { prefix: '/api/gastos', permission: 'VER_GASTOS' },
  { prefix: '/api/ingresos', permission: 'VER_INGRESOS' },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (Estáticas, Login e Invitación)
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/invitacion') ||
    pathname.startsWith('/api/auth/verify') ||
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/invitacion')
  ) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');
  const tokenCookie = request.cookies.get('auth_token');

  // Si no hay token, rechazar el acceso INMEDIATAMENTE para CUALQUIER ruta
  if (!tokenCookie || !tokenCookie.value) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autorizado - Falta token' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  try {
    // Validar el JWT (firma + expiración)
    const { payload } = await jwtVerify(tokenCookie.value, ENCODED_JWT_SECRET);
    const usuarioId = payload.usuarioId as string;

    // Verificación de revocación de sesión EN TIEMPO REAL, consultando la BD
    // directamente (ya no vía fetch a /api/auth/verify — ver nota de la migración
    // a runtime 'nodejs' más abajo en `config`). Esto evita el antipatrón de que
    // el middleware se llame a sí mismo por HTTP.
    const usuarioActivo = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { isActive: true, accesoSistema: true },
    });

    if (!usuarioActivo || !usuarioActivo.isActive || !usuarioActivo.accesoSistema) {
      throw new Error('Sesión revocada o usuario inhabilitado');
    }

    const permisosUsuario = (payload.permisos as string[]) || [];

    // Validar el permiso si la ruta tiene un prefijo en ROUTE_PERMISSIONS
    // Si la ruta es '/', y el usuario NO tiene VER_DASHBOARD, buscar la primera ruta permitida
    if (pathname === '/' && !permisosUsuario.includes('VER_DASHBOARD')) {
      const fallbackRoute = ROUTE_PERMISSIONS.find(
        (route) => !route.prefix.startsWith('/api') && permisosUsuario.includes(route.permission)
      );
      if (fallbackRoute) {
        return NextResponse.redirect(new URL(fallbackRoute.prefix, request.url));
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    const requiredPermissionMatch = ROUTE_PERMISSIONS.find(route => pathname.startsWith(route.prefix));
    if (requiredPermissionMatch && !permisosUsuario.includes(requiredPermissionMatch.permission)) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Permisos insuficientes para esta acción' }, { status: 403 });
      } else {
        // Redirigir a pantalla de acceso denegado si intenta ver una pantalla prohibida
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Adjuntar info limpia a los headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-usuario-id', usuarioId);
    requestHeaders.set('x-rol-id', payload.rolId as string);
    requestHeaders.set('x-user-permissions', JSON.stringify(permisosUsuario));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Error verificando JWT/sesión:', error);
    if (isApiRoute) {
      return NextResponse.json({ error: 'Token inválido, expirado o sesión revocada' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}

export const config = {
  // Runtime Node.js (estable desde Next.js 15.5): permite usar Prisma/pg
  // directamente en el middleware, sin el antipatrón de fetch interno que
  // causaba ERR_SSL_WRONG_VERSION_NUMBER en Railway.
  runtime: 'nodejs',
  // Proteger toda la aplicación excepto los assets estáticos de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|LOGO.png).*)'],
};