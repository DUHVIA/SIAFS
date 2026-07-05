import { prisma } from '@/lib/prisma';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { CrearGastoDTO, ActualizarGastoDTO } from './gasto.dto';



export const GastoService = {
  async obtenerTodos() {
    const gastos = await prisma.gastoInterno.findMany({
      where: { isActive: true },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { nombre: true, email: true } } },
    });

    return gastos.map(gasto => ({
      ...gasto,
      motivo: descifrarTexto(gasto.motivoCifrado),
      monto: descifrarTexto(gasto.montoCifrado),
    }));
  },

  async crear(data: CrearGastoDTO) {
    const motivoCifrado = cifrarTexto(data.motivo);
    const montoCifrado = cifrarTexto(data.monto.toString());

    const nuevoGasto = await prisma.gastoInterno.create({
      data: {
        usuarioId: data.usuarioId,
        motivoCifrado,
        montoCifrado,
        fecha: data.fecha,
      }
    });

    return {
      ...nuevoGasto,
      motivo: data.motivo,
      monto: data.monto,
    };
  },

  async actualizar(id: string, data: ActualizarGastoDTO) {
    const updateData: any = {};

    if (data.usuarioId !== undefined) updateData.usuarioId = data.usuarioId;
    if (data.motivo !== undefined) updateData.motivoCifrado = cifrarTexto(data.motivo);
    if (data.monto !== undefined) updateData.montoCifrado = cifrarTexto(data.monto.toString());
    if (data.fecha !== undefined) updateData.fecha = data.fecha;

    const gastoActualizado = await prisma.gastoInterno.update({
      where: { id },
      data: updateData,
    });

    return {
      ...gastoActualizado,
      motivo: descifrarTexto(gastoActualizado.motivoCifrado),
      monto: descifrarTexto(gastoActualizado.montoCifrado),
    };
  },

  async anular(id: string) {
    return await prisma.gastoInterno.update({
      where: { id },
      data: { isActive: false },
    });
  }
};
