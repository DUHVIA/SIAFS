import { z } from 'zod';

export const DetalleIngresoSchema = z.object({
  productoId: z.string().uuid("El productoId debe ser un UUID"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  costoUnitario: z.number().positive("El costo unitario debe ser mayor a 0"),
  nuevoPrecioVenta: z.number().positive("El nuevo precio de venta debe ser mayor a 0").optional(),
});

export const CrearIngresoSchema = z.object({
  usuarioId: z.string().uuid("El usuarioId debe ser un UUID"),
  descripcion: z.string().optional(),
  detalles: z.array(DetalleIngresoSchema).min(1, "Debe incluir al menos un detalle de ingreso"),
});

export type CrearIngresoDTO = z.infer<typeof CrearIngresoSchema>;
