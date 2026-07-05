import { describe, it, expect } from 'vitest';
import { CrearOrdenSchema } from '@/modules/ordenes/orden.dto';

describe('Orden DTO (Validaciones Zod)', () => {
  const validData = {
    tipo: 'VENTA',
    clienteId: '123e4567-e89b-12d3-a456-426614174000',
    usuarioId: '123e4567-e89b-12d3-a456-426614174001',
    detalles: [
      {
        productoId: '123e4567-e89b-12d3-a456-426614174002',
        cantidad: 2,
        precioUnitario: 15.5
      }
    ]
  };

  it('debe aceptar un payload válido', () => {
    expect(() => CrearOrdenSchema.parse(validData)).not.toThrow();
  });

  it('debe rechazar si falta un campo requerido maestro', () => {
    const { tipo, ...missingTipo } = validData;
    expect(() => CrearOrdenSchema.parse(missingTipo)).toThrow();
  });

  it('debe rechazar UUIDs inválidos en maestro', () => {
    const invalidData = { ...validData, clienteId: 'cliente-123' };
    expect(() => CrearOrdenSchema.parse(invalidData)).toThrow('El clienteId debe ser un UUID');
  });

  it('debe rechazar cantidades negativas o cero en detalles', () => {
    const invalidData1 = { ...validData, detalles: [{ ...validData.detalles[0], cantidad: 0 }] };
    const invalidData2 = { ...validData, detalles: [{ ...validData.detalles[0], cantidad: -5 }] };
    expect(() => CrearOrdenSchema.parse(invalidData1)).toThrow('La cantidad debe ser mayor a 0');
    expect(() => CrearOrdenSchema.parse(invalidData2)).toThrow('La cantidad debe ser mayor a 0');
  });

  it('debe rechazar precios negativos en detalles', () => {
    const invalidData = { ...validData, detalles: [{ ...validData.detalles[0], precioUnitario: -10 }] };
    expect(() => CrearOrdenSchema.parse(invalidData)).toThrow('El precio unitario debe ser mayor a 0');
  });

  it('debe rechazar si el arreglo de detalles está vacío', () => {
    const invalidData = { ...validData, detalles: [] };
    expect(() => CrearOrdenSchema.parse(invalidData)).toThrow('Debe incluir al menos un detalle en la orden');
  });
});
