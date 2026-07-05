import { describe, it, expect } from 'vitest';
import { CrearIngresoSchema } from '@/modules/ingresos/ingreso.dto';

describe('Ingreso DTO (Validaciones Zod)', () => {
  const validData = {
    usuarioId: '123e4567-e89b-12d3-a456-426614174000',
    descripcion: 'Compra a proveedor',
    detalles: [
      {
        productoId: '123e4567-e89b-12d3-a456-426614174001',
        cantidad: 10,
        costoUnitario: 50.5
      }
    ]
  };

  it('debe aceptar un payload válido', () => {
    expect(() => CrearIngresoSchema.parse(validData)).not.toThrow();
  });

  it('debe rechazar cantidades o costos negativos', () => {
    const invalidCant = { ...validData, detalles: [{ ...validData.detalles[0], cantidad: -5 }] };
    const invalidCost = { ...validData, detalles: [{ ...validData.detalles[0], costoUnitario: -10 }] };
    
    expect(() => CrearIngresoSchema.parse(invalidCant)).toThrow();
    expect(() => CrearIngresoSchema.parse(invalidCost)).toThrow();
  });

  it('debe rechazar arreglos de detalles vacíos', () => {
    const invalidData = { ...validData, detalles: [] };
    expect(() => CrearIngresoSchema.parse(invalidData)).toThrow();
  });
});
