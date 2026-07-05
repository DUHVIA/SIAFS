import { PrismaClient } from '@prisma/client';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { RegistrarMovimientoDTO } from './kardex.dto';

const prisma = new PrismaClient();

export const KardexService = {
  async registrarMovimiento(data: RegistrarMovimientoDTO) {
    const cantidadCifrada = cifrarTexto(data.cantidad);
    const motivoCifrado = cifrarTexto(data.motivo);

    const nuevoMovimiento = await prisma.kardex.create({
      data: {
        productoId: data.productoId,
        usuarioId: data.usuarioId,
        tipoMovimiento: data.tipoMovimiento,
        cantidadCifrada,
        motivoCifrado,
      }
    });

    return {
      ...nuevoMovimiento,
      cantidad: data.cantidad,
      motivo: data.motivo,
    };
  },

  async obtenerHistorialPorProducto(productoId: string) {
    const historial = await prisma.kardex.findMany({
      where: { productoId },
      orderBy: { fechaMovimiento: 'desc' },
    });

    return historial.map((movimiento) => ({
      ...movimiento,
      cantidad: descifrarTexto(movimiento.cantidadCifrada),
      motivo: descifrarTexto(movimiento.motivoCifrado),
    }));
  }
};
