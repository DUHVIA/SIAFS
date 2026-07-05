import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas de API, excepto auth/login y auth/logout
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const tokenCookie = request.cookies.get('auth_token');
    
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'No autorizado - Falta token' }, { status: 401 });
    }

    try {
      // Validar el JWT en el Edge Runtime con jose
      const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
      
      // Opcional: Validación de permisos por ruta (ejemplo)
      // const permisos = payload.permisos as string[];
      // if (pathname === '/api/ventas' && !permisos.includes('CREAR_VENTA')) {
      //   return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
      // }
      
      // Pasar data al request header si el backend interno lo requiere
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
      return NextResponse.json({ error: 'No autorizado - Token inválido o expirado' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
