import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdenService } from '@/modules/ordenes/orden.service';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    producto: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    orden: {
      create: vi.fn(),
    },
    kardex: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(mPrismaClient);
    }),
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('OrdenService (Transacciones y Rollbacks)', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  it('debe completar una venta exitosamente (Camino feliz)', async () => {
    const dto = {
      tipo: 'VENTA' as any,
      clienteId: 'uuid-client',
      usuarioId: 'uuid-user',
      detalles: [
        {
          productoId: 'uuid-prod',
          cantidad: 2,
          precioUnitario: 100
        }
      ]
    };

    // Mockeamos la búsqueda del producto (necesita stock y nombre)
    prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
      id: 'uuid-prod',
      nombreCifrado: cifrarTexto('Aceite'),
      stockCifrado: cifrarTexto('10') // Stock actual: 10
    });

    prismaMock.orden.create.mockResolvedValue({
      id: 'uuid-orden',
      numeroOrden: 123
    });

    await OrdenService.crearOrden(dto);

    // Verificaciones
    expect(prismaMock.producto.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(prismaMock.orden.create).toHaveBeenCalledTimes(1);
    
    // Al ser VENTA, debe actualizar el stock (10 - 2 = 8)
    expect(prismaMock.producto.update).toHaveBeenCalledTimes(1);
    const updateArgs = prismaMock.producto.update.mock.calls[0][0];
    expect(descifrarTexto(updateArgs.data.stockCifrado)).toBe('8');

    // Debe registrar la salida en el Kardex
    expect(prismaMock.kardex.create).toHaveBeenCalledTimes(1);
  });

  it('debe atrapar la excepción y abortar (Rollback) si falla la actualización del stock', async () => {
    const dto = {
      tipo: 'VENTA' as any,
      clienteId: 'uuid-client',
      usuarioId: 'uuid-user',
      detalles: [
        {
          productoId: 'uuid-prod',
          cantidad: 5,
          precioUnitario: 50
        }
      ]
    };

    // La búsqueda del producto funciona bien
    prismaMock.producto.findUniqueOrThrow.mockResolvedValue({
      id: 'uuid-prod',
      nombreCifrado: cifrarTexto('Llanta'),
      stockCifrado: cifrarTexto('20') 
    });

    // La creación de la orden funciona bien
    prismaMock.orden.create.mockResolvedValue({
      id: 'uuid-orden',
      numeroOrden: 124
    });

    // ¡Pero falla al actualizar el stock (Error simulado de DB/Conexión)!
    prismaMock.producto.update.mockRejectedValue(new Error('Fallo crítico al actualizar stock'));

    // Esperamos que el servicio rechace la promesa y el error burbujee
    await expect(OrdenService.crearOrden(dto)).rejects.toThrow('Fallo crítico al actualizar stock');

    // Comprobamos que el Kardex NUNCA se registró debido a la excepción disparada por la falla de producto.update
    // Nota: Como estamos mockeando la DB, las promesas subsiguientes no se ejecutan. En un entorno real,
    // Prisma realiza un rollback automático gracias al $transaction.
    expect(prismaMock.producto.findUniqueOrThrow).toHaveBeenCalled();
    expect(prismaMock.orden.create).toHaveBeenCalled();
    expect(prismaMock.producto.update).toHaveBeenCalled(); // Se llamó y falló
    expect(prismaMock.kardex.create).not.toHaveBeenCalled(); // No debe haberse ejecutado
  });
});
