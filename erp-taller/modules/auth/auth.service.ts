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

    // Combinar permisos del rol base y permisos directos
    const permisosSet = new Set<string>();
    
    usuario.rol.permisos.forEach(rp => permisosSet.add(rp.permiso.codigo));
    usuario.permisos.forEach(up => permisosSet.add(up.permiso.codigo));

    const token = await new SignJWT({
      usuarioId: usuario.id,
      rolId: usuario.rolId,
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
