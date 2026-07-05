import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngresoService } from '@/modules/ingresos/ingreso.service';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    producto: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    ingreso: { create: vi.fn() },
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
});
