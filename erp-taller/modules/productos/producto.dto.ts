import { z } from 'zod';
import { CategoriaProducto } from '@prisma/client';

export const CrearProductoSchema = z.object({
  usuarioId: z.string().uuid("El usuarioId es requerido para el historial"),
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria: z.nativeEnum(CategoriaProducto),
  precioVenta: z.string().regex(/^\d+(\.\d+)?$/, "El precio de venta debe ser un número positivo"),
  stock: z.string().regex(/^\d+$/, "El stock debe ser un número entero positivo"),
  detalles: z.record(z.string(), z.any()).optional().default({}),
});

export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;

export const ActualizarProductoSchema = CrearProductoSchema.partial();
export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;
