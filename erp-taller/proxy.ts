import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/inventario': 'VER_PRODUCTOS',
  '/ordenes': 'VER_ORDENES',
  '/clientes': 'VER_CLIENTES',
  '/usuarios': 'GESTIONAR_USUARIOS',
  '/finanzas': 'VER_GASTOS',
  '/api/productos': 'VER_PRODUCTOS',
  '/api/ordenes': 'VER_ORDENES',
  '/api/clientes': 'VER_CLIENTES',
  '/api/usuarios': 'GESTIONAR_USUARIOS',
  '/api/gastos': 'VER_GASTOS',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (Estáticas y de Login)
  if (pathname.startsWith('/api/auth/login') || pathname === '/login') {
    return NextResponse.next();
  }

  // Comprobar si es una ruta protegida
  const isApiRoute = pathname.startsWith('/api/');
  const isProtectedAppRoute = ['/inventario', '/ordenes', '/clientes', '/usuarios', '/finanzas', '/'].includes(pathname);

  if (isApiRoute || isProtectedAppRoute) {
    const tokenCookie = request.cookies.get('auth_token');
    
    if (!tokenCookie || !tokenCookie.value) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'No autorizado - Falta token' }, { status: 401 });
      } else {
        // En un escenario real, redirigir al /login. Por ahora redirigiremos a /login (el usuario tendrá que crearlo).
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    try {
      // Validar el JWT en el Edge Runtime con jose
      const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
      
      const permisosUsuario = (payload.permisos as string[]) || [];

      // Validar el permiso si la ruta está en el diccionario ROUTE_PERMISSIONS
      const requiredPermission = ROUTE_PERMISSIONS[pathname];
      if (requiredPermission && !permisosUsuario.includes(requiredPermission)) {
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

  return NextResponse.next();
}

export const config = {
  // Proteger toda la aplicación excepto los assets estáticos de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|LOGO.png).*)'],
};
