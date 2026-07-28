import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

// Mapa de rutas base con sus respectivos permisos requeridos
const routePermissions: Record<string, string> = {
  '/inventario': 'VER_PRODUCTOS',
  '/ordenes': 'VER_ORDENES',
  '/ingresos': 'VER_INGRESOS',
  '/clientes': 'VER_CLIENTES',
  '/finanzas': 'VER_GASTOS',
  '/usuarios': 'GESTIONAR_USUARIOS',
  '/': 'VER_DASHBOARD'
};

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir acceso directo a recursos estáticos, imágenes y rutas públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Extraer y verificar el token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Si no hay token y quiere acceder a la API, devolver 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Si es una ruta de vista, redirigir al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const permisosUsuario = (payload.permisos as string[]) || [];

    // 3. Validación de acceso a Vistas (Rutas UI)
    // No bloqueamos rutas de API aquí, dejaremos que la API valide sus acciones específicas.
    if (!pathname.startsWith('/api/') && pathname !== '/unauthorized') {
      // Encontrar a qué módulo base pertenece esta ruta (ej. /usuarios/crear -> /usuarios)
      let requiredPermission = null;
      
      // Chequear coincidencia exacta para la raíz
      if (pathname === '/') {
        requiredPermission = routePermissions['/'];
      } else {
        const basePath = '/' + pathname.split('/')[1]; // ej: "/usuarios"
        requiredPermission = routePermissions[basePath];
      }

      // Si la ruta requiere un permiso y el usuario no lo tiene
      if (requiredPermission && !permisosUsuario.includes(requiredPermission)) {
        // Redirigir a unauthorized
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 4. Inyectar los permisos en los headers para que la API los lea fácilmente sin volver a parsear el JWT
    const response = NextResponse.next();
    response.headers.set('x-user-permissions', JSON.stringify(permisosUsuario));
    response.headers.set('x-user-id', payload.usuarioId as string);
    return response;

  } catch (error) {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }
    return response;
  }
}

// Configurar el Matcher para atrapar todo, excepto rutas excluidas explícitamente arriba
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
