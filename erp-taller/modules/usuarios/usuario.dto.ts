import { z } from 'zod';

export const CrearUsuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "El password debe tener al menos 8 caracteres"),
  rolId: z.string().uuid("El rolId debe ser un UUID válido"),
});

export type CrearUsuarioDTO = z.infer<typeof CrearUsuarioSchema>;

export const ActualizarUsuarioSchema = CrearUsuarioSchema.partial().extend({
  accesoSistema: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type ActualizarUsuarioDTO = z.infer<typeof ActualizarUsuarioSchema>;
