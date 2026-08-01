import { z } from 'zod';
import { TipoOrden } from '@prisma/client';

export const DetalleOrdenSchema = z.object({
  productoId: z.string().uuid("El productoId debe ser un UUID"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.number().positive("El precio unitario debe ser mayor a 0"),
});

export const CrearOrdenSchema = z.object({
  tipo: z.nativeEnum(TipoOrden),
  clienteId: z.string().uuid("El clienteId debe ser un UUID"),
  usuarioId: z.string().uuid("El usuarioId debe ser un UUID"),
  metodoPagoId: z.string().uuid("El metodoPagoId debe ser un UUID").optional(),
  detalles: z.array(DetalleOrdenSchema).min(1, "Debe incluir al menos un detalle en la orden"),
});

export const AnularOrdenSchema = z.object({
  action: z.literal('anular'),
  usuarioId: z.string().uuid("El usuarioId es requerido"),
});

export const ConvertirAVentaSchema = z.object({
  action: z.literal('convertirAVenta'),
  usuarioId: z.string().uuid("El usuarioId es requerido"),
  metodoPagoId: z.string().uuid().optional(),
});

export const ActualizarCotizacionSchema = z.object({
  tipo: z.literal('COTIZACION').optional(),
  clienteId: z.string().uuid("El clienteId debe ser un UUID"),
  usuarioId: z.string().uuid("El usuarioId debe ser un UUID"),
  detalles: z.array(DetalleOrdenSchema).min(1, "Debe incluir al menos un detalle"),
});

export const PatchOrdenSchema = z.discriminatedUnion('action', [
  AnularOrdenSchema,
  ConvertirAVentaSchema,
]);

export type CrearOrdenDTO = z.infer<typeof CrearOrdenSchema>;
export type ActualizarCotizacionDTO = z.infer<typeof ActualizarCotizacionSchema>;
export type AnularOrdenDTO = z.infer<typeof AnularOrdenSchema>;
export type ConvertirAVentaDTO = z.infer<typeof ConvertirAVentaSchema>;
