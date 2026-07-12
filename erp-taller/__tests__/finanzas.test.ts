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

    it('debe obtener todos los gastos filtrados y descifrados con métricas', async () => {
      const mockGastos = [
        {
          id: 'uuid-gasto-1',
          motivoCifrado: cifrarTexto('Suministros'),
          montoCifrado: cifrarTexto('120'),
          fecha: new Date(),
          isActive: true,
          usuario: { nombre: 'Colaborador A', email: 'colab@a.com' }
        },
        {
          id: 'uuid-gasto-2',
          motivoCifrado: cifrarTexto('Servicio de Luz'),
          montoCifrado: cifrarTexto('280'),
          fecha: new Date(),
          isActive: true,
          usuario: { nombre: 'Admin', email: 'admin@duhvia.com' }
        }
      ];

      prismaMock.gastoInterno.findMany.mockResolvedValue(mockGastos);

      const res = await GastoService.obtenerTodosFiltrados({
        page: 1,
        limit: 15
      });

      expect(res.items).toHaveLength(2);
      expect(res.items[0].motivo).toBe('Suministros');
      expect(res.items[1].motivo).toBe('Servicio de Luz');
      expect(res.items[0].monto).toBe('120');

      expect(res.metrics.totalGastadoMes).toBe(400); // 120 + 280
      expect(res.metrics.totalTransacciones).toBe(2);
      expect(res.metrics.gastoPromedioDiario).toBeGreaterThan(0);
    });

    it('debe filtrar los gastos correctamente en memoria', async () => {
      const mockGastos = [
        {
          id: 'uuid-gasto-1',
          motivoCifrado: cifrarTexto('Servicios básicos'),
          montoCifrado: cifrarTexto('100'),
          fecha: new Date(),
          isActive: true,
          usuario: { nombre: 'Vendedor' }
        },
        {
          id: 'uuid-gasto-2',
          motivoCifrado: cifrarTexto('Movilidad'),
          montoCifrado: cifrarTexto('30'),
          fecha: new Date(),
          isActive: true,
          usuario: { nombre: 'Repartidor' }
        }
      ];

      prismaMock.gastoInterno.findMany.mockResolvedValue(mockGastos);

      const res = await GastoService.obtenerTodosFiltrados({
        search: 'movilidad',
        page: 1,
        limit: 15
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].motivo).toBe('Movilidad');
    });
  });
});
