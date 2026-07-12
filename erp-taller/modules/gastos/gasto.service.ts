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

  async obtenerTodosFiltrados(params: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const todos = await prisma.gastoInterno.findMany({
      where: { isActive: true },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { nombre: true, email: true } } },
    });

    const descifrados = todos.map(gasto => ({
      ...gasto,
      motivo: descifrarTexto(gasto.motivoCifrado),
      monto: descifrarTexto(gasto.montoCifrado),
    }));

    // Métricas del mes en curso
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const gastosMes = descifrados.filter(g => new Date(g.fecha) >= inicioMes);
    const totalGastadoMes = gastosMes.reduce((s, g) => s + parseFloat(g.monto || '0'), 0);
    const totalTransacciones = gastosMes.length;
    const hoy = new Date();
    const diasPasados = hoy.getMonth() === inicioMes.getMonth() ? hoy.getDate() : 30;
    const gastoPromedioDiario = totalTransacciones > 0 ? totalGastadoMes / (diasPasados || 1) : 0;

    // Filtros
    let filtradas = [...descifrados];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtradas = filtradas.filter(g =>
        g.motivo?.toLowerCase().includes(q) ||
        g.usuario?.nombre?.toLowerCase().includes(q)
      );
    }

    // Paginación
    const total = filtradas.length;
    const totalPages = Math.ceil(total / params.limit) || 1;
    const offset = (params.page - 1) * params.limit;
    const items = filtradas.slice(offset, offset + params.limit);

    return {
      items,
      pagination: { total, page: params.page, limit: params.limit, totalPages },
      metrics: {
        totalGastadoMes,
        gastoPromedioDiario,
        totalTransacciones
      }
    };
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
