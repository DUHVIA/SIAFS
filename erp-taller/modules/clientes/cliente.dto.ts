import { z } from 'zod';

export const CrearClienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  documento: z.string().min(1, "El documento es requerido"),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal('')),
  direccion: z.string().optional(),
});

export type CrearClienteDTO = z.infer<typeof CrearClienteSchema>;

export const ActualizarClienteSchema = CrearClienteSchema.partial();
export type ActualizarClienteDTO = z.infer<typeof ActualizarClienteSchema>;
