import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductoService } from '@/modules/productos/producto.service';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    producto: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    historialPrecio: { create: vi.fn() },
    historialNombre: { create: vi.fn() },
    kardex: { create: vi.fn() },
    $transaction: vi.fn(async (cb) => {
      return cb(mPrismaClient);
    }),
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('ProductoService (CRUD y Control de Errores)', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  describe('Inserción', () => {
    it('debe crear un producto correctamente (Camino feliz)', async () => {
      const dto = {
        usuarioId: 'uuid-user',
        nombre: 'Bujía',
        categoria: 'AUTOPARTE' as any,
        precioVenta: '25.00',
        stock: '10',
        detalles: {}
      };

      prismaMock.producto.create.mockResolvedValue({
        id: 'uuid-prod',
        nombreCifrado: cifrarTexto(dto.nombre),
        precioVentaCifrado: cifrarTexto(dto.precioVenta),
        stockCifrado: cifrarTexto(dto.stock),
      });

      const resultado = await ProductoService.crear(dto);

      expect(prismaMock.producto.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.historialPrecio.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.historialNombre.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.kardex.create).toHaveBeenCalledTimes(1);
      
      expect(resultado.nombre).toBe('Bujía');
    });

    it('debe propagar el error si ocurre una falla en Prisma (ej. Restricción Única)', async () => {
      const dto = {
        usuarioId: 'uuid-user',
        nombre: 'Bujía',
        categoria: 'AUTOPARTE' as any,
        precioVenta: '25.00',
        stock: '10',
        detalles: {}
      };

      prismaMock.producto.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(ProductoService.crear(dto)).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('Actualización', () => {
    it('debe actualizar solo el precio (Partial) y mantener el resto', async () => {
      prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
        id: 'uuid-prod',
        nombreCifrado: cifrarTexto('Bujía Antigua'),
        precioVentaCifrado: cifrarTexto('20.00'),
        stockCifrado: cifrarTexto('10')
      });

      prismaMock.producto.update.mockResolvedValue({});

      await ProductoService.actualizar('uuid-prod', {
        usuarioId: 'uuid-user',
        precioVenta: '30.00' // Solo cambia el precio
      });

      // Se debió actualizar el producto
      expect(prismaMock.producto.update).toHaveBeenCalledTimes(1);
      const updateArgs = prismaMock.producto.update.mock.calls[0][0];
      
      // La data enviada a update debe contener el precio cifrado, pero no el nombre
      expect(updateArgs.data.precioVentaCifrado).toBeDefined();
      expect(updateArgs.data.nombreCifrado).toBeUndefined();

      // Solo el historial de precio debió generarse
      expect(prismaMock.historialPrecio.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.historialNombre.create).toHaveBeenCalledTimes(0);
      expect(prismaMock.kardex.create).toHaveBeenCalledTimes(0);
    });

    it('debe arrojar error si el id no existe', async () => {
      prismaMock.producto.findUniqueOrThrow.mockRejectedValue(new Error('No Product found'));
      
      await expect(ProductoService.actualizar('non-existent', { usuarioId: 'uuid-user', precioVenta: '10' }))
        .rejects.toThrow('No Product found');
    });
  });

  describe('Eliminación (Soft Delete)', () => {
    it('debe cambiar isActive a false pero no eliminar los datos cifrados', async () => {
      prismaMock.producto.update.mockResolvedValue({
        id: 'uuid-prod',
        isActive: false,
        nombreCifrado: 'sometext'
      });

      const resultado = await ProductoService.desactivar('uuid-prod');

      expect(prismaMock.producto.update).toHaveBeenCalledWith({
        where: { id: 'uuid-prod' },
        data: { isActive: false }
      });
      expect(resultado.isActive).toBe(false);
      expect(resultado.nombreCifrado).toBe('sometext'); // Los datos cifrados se mantienen
    });
  });

  describe('Reabastecimiento (Restock / Reposición)', () => {
    it('debe registrar un ingreso de mercadería correctamente', async () => {
      prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
        id: 'uuid-prod',
        nombreCifrado: cifrarTexto('Bujía'),
        precioVentaCifrado: cifrarTexto('25.00'),
        stockCifrado: cifrarTexto('10'),
        detallesCifrados: cifrarTexto(JSON.stringify({ sku: 'BRK-990-22' }))
      });

      prismaMock.producto.update.mockResolvedValue({
        id: 'uuid-prod',
        nombreCifrado: cifrarTexto('Bujía'),
        precioVentaCifrado: cifrarTexto('25.00'),
        stockCifrado: cifrarTexto('60'),
        detallesCifrados: cifrarTexto(JSON.stringify({ sku: 'BRK-990-22' }))
      });

      prismaMock.kardex.create.mockResolvedValue({});

      const resultado = await ProductoService.registrarReposicion('uuid-prod', {
        cantidad: '50',
        motivo: 'Compra Lote 2',
        usuarioId: 'uuid-user'
      });

      expect(prismaMock.producto.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prismaMock.producto.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.kardex.create).toHaveBeenCalledTimes(1);

      expect(resultado.stock).toBe('60');
      
      const kardexArgs = prismaMock.kardex.create.mock.calls[0][0];
      expect(kardexArgs.data.tipoMovimiento).toBe('INGRESO');
      expect(descifrarTexto(kardexArgs.data.cantidadCifrada)).toBe('50');
      expect(descifrarTexto(kardexArgs.data.motivoCifrado)).toBe('Compra Lote 2');
    });
  });
});
