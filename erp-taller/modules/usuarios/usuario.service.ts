import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';
import { CrearUsuarioDTO, ActualizarUsuarioDTO } from './usuario.dto';



export const UsuarioService = {
  async obtenerTodos() {
    const usuarios = await prisma.usuario.findMany({
      where: { isActive: true },
      include: { rol: true },
    });

    return usuarios.map((usuario) => {
      const { passwordHash, salt, ...safeUser } = usuario;
      return safeUser;
    });
  },

  async crear(data: CrearUsuarioDTO) {
    const { hash, salt } = hashPassword(data.password);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        passwordHash: hash,
        salt,
        rolId: data.rolId,
        accesoSistema: true,
        isActive: true,
      },
      include: { 
        rol: {
          include: { permisos: true }
        }
      },
    });

    // Clonar los permisos del rol como permisos individuales del usuario (Rol como plantilla)
    if (nuevoUsuario.rol.permisos.length > 0) {
      await prisma.usuarioPermiso.createMany({
        data: nuevoUsuario.rol.permisos.map(rp => ({
          usuarioId: nuevoUsuario.id,
          permisoId: rp.permisoId
        }))
      });
    }

    const { passwordHash: _ph, salt: _s, ...safeUser } = nuevoUsuario;
    return safeUser;
  },

  async actualizar(id: string, data: ActualizarUsuarioDTO) {
    const updateData: any = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.rolId !== undefined) updateData.rolId = data.rolId;
    
    if (data.password) {
      const { hash, salt } = hashPassword(data.password);
      updateData.passwordHash = hash;
      updateData.salt = salt;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      include: { rol: true },
    });

    const { passwordHash, salt, ...safeUser } = usuarioActualizado;
    return safeUser;
  },

  async desactivar(id: string) {
    const usuarioDesactivado = await prisma.usuario.update({
      where: { id },
      data: { 
        isActive: false, 
        accesoSistema: false 
      },
    });

    const { passwordHash, salt, ...safeUser } = usuarioDesactivado;
    return safeUser;
  }
};
