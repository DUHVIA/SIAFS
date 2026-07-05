import { z } from 'zod';

export const CambiarRolSchema = z.object({
  rolId: z.string().uuid("El rolId debe ser un UUID válido"),
});

export const AsignarPermisosSchema = z.object({
  permisosIds: z.array(z.string().uuid("Cada permisoId debe ser un UUID válido")),
});

export const PermisoIndividualSchema = z.object({
  permisoId: z.string().uuid("El permisoId debe ser un UUID válido"),
});
