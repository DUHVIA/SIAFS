import { prisma } from '@/lib/prisma';



export const AccesoService = {
  async listarRoles() {
    return await prisma.rol.findMany({
      where: { isActive: true },
      include: { permisos: { include: { permiso: true } } },
    });
  },

  async listarPermisos() {
    return await prisma.permiso.findMany();
  },

  async cambiarRolUsuario(usuarioId: string, rolId: string) {
    return await prisma.usuario.update({
      where: { id: usuarioId },
      data: { rolId },
      select: { id: true, rolId: true, nombre: true, email: true }
    });
  },

  async asignarPermisoIndividual(usuarioId: string, permisoId: string) {
    return await prisma.usuarioPermiso.create({
      data: { usuarioId, permisoId },
      include: { permiso: true }
    });
  },

  async revocarPermisoIndividual(usuarioId: string, permisoId: string) {
    return await prisma.usuarioPermiso.delete({
      where: { usuarioId_permisoId: { usuarioId, permisoId } }
    });
  },

  async setearPermisosUsuario(usuarioId: string, permisosIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      // 1. Revocar permisos actuales
      await tx.usuarioPermiso.deleteMany({
        where: { usuarioId },
      });

      // 2. Asignar los nuevos permisos provistos
      if (permisosIds.length > 0) {
        await tx.usuarioPermiso.createMany({
          data: permisosIds.map((permisoId) => ({
            usuarioId,
            permisoId,
          })),
          skipDuplicates: true,
        });
      }

      // 3. Retornar los permisos frescos del usuario
      return await tx.usuarioPermiso.findMany({
        where: { usuarioId },
        include: { permiso: true },
      });
    });
  }
};
