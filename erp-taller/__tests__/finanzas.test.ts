import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearGastoSchema } from '@/modules/gastos/gasto.dto';
import { GastoService } from '@/modules/gastos/gasto.service';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    gastoInterno: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() }
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('Módulo de Finanzas (Gastos Internos)', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  describe('Gastos DTO', () => {
    it('debe rechazar montos negativos y conceptos vacíos', () => {
      const valid = { usuarioId: '123e4567-e89b-12d3-a456-426614174000', motivo: 'Suministros', monto: 100, fecha: new Date() };
      expect(() => CrearGastoSchema.parse({ ...valid, monto: -50 })).toThrow();
      expect(() => CrearGastoSchema.parse({ ...valid, motivo: '' })).toThrow();
    });
  });

  describe('GastoService', () => {
    it('debe cifrar al guardar y descifrar al obtener', async () => {
      const dto = { usuarioId: 'uuid-user', motivo: 'Internet', monto: 60, fecha: new Date() };
      
      prismaMock.gastoInterno.create.mockResolvedValue({ id: 'uuid-gasto' });

      await GastoService.crear(dto);
      
      const createArgs = prismaMock.gastoInterno.create.mock.calls[0][0];
      expect(createArgs.data.motivo).toBeUndefined();
      expect(createArgs.data.motivoCifrado).toBeDefined();

      prismaMock.gastoInterno.findMany.mockResolvedValue([{
        id: 'uuid-gasto',
        motivoCifrado: cifrarTexto('Luz'),
        montoCifrado: cifrarTexto('50')
      }]);

      const result = await GastoService.obtenerTodos();
      expect(result[0].motivo).toBe('Luz');
      expect(result[0].monto).toBe('50');
    });

    it('debe realizar un soft delete correcto', async () => {
      prismaMock.gastoInterno.update.mockResolvedValue({ isActive: false });
      
      await GastoService.anular('uuid-gasto');
      
      const updateArgs = prismaMock.gastoInterno.update.mock.calls[0][0];
      expect(updateArgs.where.id).toBe('uuid-gasto');
      expect(updateArgs.data.isActive).toBe(false);
    });
  });
});
