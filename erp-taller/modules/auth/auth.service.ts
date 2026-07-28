import { prisma } from '@/lib/prisma';
import { verificarPassword } from '@/lib/crypto';
import { SignJWT } from 'jose';


const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

export const AuthService = {
  async login(email: string, passwordString: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
        permisos: { include: { permiso: true } }
      }
    });

    if (!usuario || !usuario.isActive || !usuario.accesoSistema) {
      throw new Error("Credenciales inválidas o usuario inactivo");
    }

    const isValido = verificarPassword(passwordString, usuario.salt, usuario.passwordHash);
    if (!isValido) {
      throw new Error("Credenciales inválidas o usuario inactivo");
    }

    // Los permisos se gestionan 100% desde los permisos individuales del usuario
    // (el rol actuó solo como plantilla inicial)
    const permisosSet = new Set<string>();
    usuario.permisos.forEach(up => permisosSet.add(up.permiso.codigo));

    const token = await new SignJWT({
      usuarioId: usuario.id,
      rolId: usuario.rolId,
      rolNombre: usuario.rol.nombre,
      nombre: usuario.nombre,
      permisos: Array.from(permisosSet)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(JWT_SECRET);

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rolId: usuario.rolId,
      }
    };
  }
};
