import { z } from 'zod';
import { CategoriaProducto } from '@prisma/client';

export const CrearProductoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria: z.nativeEnum(CategoriaProducto),
  precioVenta: z.string().min(1, "El precio de venta es requerido"),
  stock: z.string().min(1, "El stock es requerido"),
  detalles: z.record(z.string(), z.any()).optional().default({}),
});

export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;

export const ActualizarProductoSchema = CrearProductoSchema.partial();
export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;
