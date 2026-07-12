import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngresoService } from '@/modules/ingresos/ingreso.service';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    producto: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    ingreso: { create: vi.fn(), findMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    historialPrecio: { create: vi.fn() },
    kardex: { create: vi.fn() },
    $transaction: vi.fn(async (cb) => cb(mPrismaClient)),
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('IngresoService (Transacciones y Rollbacks)', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  it('debe completar un ingreso exitosamente sumando el stock y registrando en Kardex', async () => {
    const dto = {
      usuarioId: 'uuid-user',
      detalles: [{ productoId: 'uuid-prod', cantidad: 5, costoUnitario: 100 }]
    };

    prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
      id: 'uuid-prod',
      stockCifrado: cifrarTexto('10'),
      precioVentaCifrado: cifrarTexto('150')
    });

    prismaMock.ingreso.create.mockResolvedValue({ id: 'uuid-ingreso' });

    await IngresoService.crearIngreso(dto);

    expect(prismaMock.ingreso.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.producto.update).toHaveBeenCalledTimes(1);
    const updateArgs = prismaMock.producto.update.mock.calls[0][0];
    expect(descifrarTexto(updateArgs.data.stockCifrado)).toBe('15'); // 10 + 5
    expect(prismaMock.kardex.create).toHaveBeenCalledTimes(1);
  });

  it('debe abortar (Rollback) si falla la creación del HistorialPrecio', async () => {
    const dto = {
      usuarioId: 'uuid-user',
      detalles: [{ productoId: 'uuid-prod', cantidad: 5, costoUnitario: 100, nuevoPrecioVenta: 200 }]
    };

    prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
      id: 'uuid-prod',
      stockCifrado: cifrarTexto('10'),
      precioVentaCifrado: cifrarTexto('150')
    });

    prismaMock.ingreso.create.mockResolvedValue({ id: 'uuid-ingreso' });
    prismaMock.historialPrecio.create.mockRejectedValue(new Error('Fallo al guardar historial'));

    await expect(IngresoService.crearIngreso(dto)).rejects.toThrow('Fallo al guardar historial');

    expect(prismaMock.ingreso.create).toHaveBeenCalled();
    expect(prismaMock.producto.update).not.toHaveBeenCalled(); 
    expect(prismaMock.kardex.create).not.toHaveBeenCalled();
  });

  describe('Lectura de Ingresos', () => {
    it('debe obtener todos los ingresos filtrados y desencriptados con métricas', async () => {
      const mockIngresos = [
        {
          id: 'uuid-ingreso-1',
          usuarioId: 'uuid-user',
          descripcionCifrada: cifrarTexto('Compra Lote 1'),
          totalCifrado: cifrarTexto('500'),
          fechaIngreso: new Date(),
          usuario: { nombre: 'Administrador' },
          detalles: [
            {
              id: 'det-1',
              productoId: 'uuid-prod',
              cantidadCifrada: cifrarTexto('5'),
              costoUnitarioCifrado: cifrarTexto('100'),
              producto: { nombreCifrado: cifrarTexto('Bujía NGK') }
            }
          ]
        }
      ];

      prismaMock.ingreso.findMany.mockResolvedValue(mockIngresos);

      const res = await IngresoService.obtenerTodosFiltrados({
        page: 1,
        limit: 15
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].total).toBe('500');
      expect(res.items[0].descripcion).toBe('Compra Lote 1');
      expect(res.items[0].usuarioNombre).toBe('Administrador');
      
      expect(res.metrics.totalComprasMes).toBe(500);
      expect(res.metrics.cantidadLotes).toBe(1);
      expect(res.metrics.lotePromedio).toBe(500);
      expect(res.metrics.totalProductosIngresados).toBe(5);
    });

    it('debe obtener un ingreso por ID con detalles desencriptados', async () => {
      const mockIngreso = {
        id: 'uuid-ingreso-1',
        usuarioId: 'uuid-user',
        descripcionCifrada: cifrarTexto('Lote Proveedor A'),
        totalCifrado: cifrarTexto('200'),
        fechaIngreso: new Date(),
        usuario: { nombre: 'Admin' },
        detalles: [
          {
            id: 'det-1',
            productoId: 'prod-1',
            cantidadCifrada: cifrarTexto('2'),
            costoUnitarioCifrado: cifrarTexto('100'),
            producto: { nombreCifrado: cifrarTexto('Filtro Aceite') }
          }
        ]
      };

      prismaMock.ingreso.findUniqueOrThrow.mockResolvedValue(mockIngreso);

      const res = await IngresoService.obtenerPorId('uuid-ingreso-1');

      expect(res.id).toBe('uuid-ingreso-1');
      expect(res.total).toBe('200');
      expect(res.descripcion).toBe('Lote Proveedor A');
      expect(res.usuarioNombre).toBe('Admin');
      expect(res.detalles).toHaveLength(1);
      expect(res.detalles[0].productoNombre).toBe('Filtro Aceite');
      expect(res.detalles[0].cantidad).toBe(2);
      expect(res.detalles[0].costoUnitario).toBe(100);
      expect(res.detalles[0].subtotal).toBe(200);
    });
  });
});
