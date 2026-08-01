import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

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
      // Validar el JWT en el Edge Runtime con jose
      const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
      
      // Verificación en tiempo real contra la base de datos para revocar sesiones inmediatamente
      const verifyRes = await fetch(new URL('/api/auth/verify', request.url).toString(), {
        headers: {
          'Authorization': `Bearer ${tokenCookie.value}`
        },
        // No cachear esta petición
        cache: 'no-store'
      });

      if (!verifyRes.ok) {
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
      requestHeaders.set('x-usuario-id', payload.usuarioId as string);
      requestHeaders.set('x-rol-id', payload.rolId as string);
      requestHeaders.set('x-user-permissions', JSON.stringify(permisosUsuario));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Error verificando JWT:', error);
      if (isApiRoute) {
        return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
}

export const config = {
  // Proteger toda la aplicación excepto los assets estáticos de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|LOGO.png).*)'],
};
