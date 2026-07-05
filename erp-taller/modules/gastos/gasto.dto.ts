import { z } from 'zod';

export const CrearGastoSchema = z.object({
  usuarioId: z.string().uuid("El usuarioId debe ser un UUID"),
  motivo: z.string().min(1, "El motivo es requerido"),
  monto: z.number().positive("El monto debe ser positivo"),
  fecha: z.coerce.date({
    message: "Formato de fecha inválido",
  }),
});

export type CrearGastoDTO = z.infer<typeof CrearGastoSchema>;

export const ActualizarGastoSchema = CrearGastoSchema.partial();
export type ActualizarGastoDTO = z.infer<typeof ActualizarGastoSchema>;
