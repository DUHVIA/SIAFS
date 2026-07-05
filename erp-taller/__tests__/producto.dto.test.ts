import { describe, it, expect } from 'vitest';
import { CrearProductoSchema, ActualizarProductoSchema } from '@/modules/productos/producto.dto';

describe('Producto DTO (Validaciones Zod)', () => {
  const validData = {
    usuarioId: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Filtro',
    categoria: 'AUTOPARTE',
    precioVenta: '100.50',
    stock: '50'
  };

  it('debe aceptar un payload válido', () => {
    expect(() => CrearProductoSchema.parse(validData)).not.toThrow();
  });

  it('debe rechazar si falta un campo requerido', () => {
    const { nombre, ...missingNombre } = validData;
    expect(() => CrearProductoSchema.parse(missingNombre)).toThrow();
  });

  it('debe rechazar UUIDs inválidos', () => {
    const invalidData = { ...validData, usuarioId: 'no-es-un-uuid' };
    expect(() => CrearProductoSchema.parse(invalidData)).toThrow('El usuarioId es requerido para el historial');
  });

  it('debe rechazar strings vacíos en nombre', () => {
    const invalidData = { ...validData, nombre: '' };
    expect(() => CrearProductoSchema.parse(invalidData)).toThrow('El nombre es requerido');
  });

  it('debe rechazar precios negativos o letras', () => {
    const invalidData1 = { ...validData, precioVenta: '-50' };
    const invalidData2 = { ...validData, precioVenta: 'abc' };
    expect(() => CrearProductoSchema.parse(invalidData1)).toThrow('El precio de venta debe ser un número positivo');
    expect(() => CrearProductoSchema.parse(invalidData2)).toThrow('El precio de venta debe ser un número positivo');
  });

  it('debe rechazar stock negativo o decimal', () => {
    const invalidData1 = { ...validData, stock: '-10' };
    const invalidData2 = { ...validData, stock: '5.5' };
    expect(() => CrearProductoSchema.parse(invalidData1)).toThrow('El stock debe ser un número entero positivo');
    expect(() => CrearProductoSchema.parse(invalidData2)).toThrow('El stock debe ser un número entero positivo');
  });
});
