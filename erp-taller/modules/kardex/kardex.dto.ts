import { z } from 'zod';
import { TipoMovimientoKardex } from '@prisma/client';

export const RegistrarMovimientoSchema = z.object({
  productoId: z.string().uuid("El productoId debe ser un UUID válido"),
  usuarioId: z.string().uuid("El usuarioId debe ser un UUID válido"),
  tipoMovimiento: z.nativeEnum(TipoMovimientoKardex),
  cantidad: z.string().min(1, "La cantidad es requerida"),
  motivo: z.string().min(1, "El motivo es requerido"),
});

export type RegistrarMovimientoDTO = z.infer<typeof RegistrarMovimientoSchema>;
