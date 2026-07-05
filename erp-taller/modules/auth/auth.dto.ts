import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "El password es requerido"),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
