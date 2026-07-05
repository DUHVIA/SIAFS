import { PrismaClient } from '@prisma/client';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { CrearOrdenDTO } from './orden.dto';

const prisma = new PrismaClient();

export const OrdenService = {
  async crearOrden(data: CrearOrdenDTO) {
    return await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      
      const detallesProcesados = await Promise.all(
        data.detalles.map(async (detalle) => {
          const sub = detalle.cantidad * detalle.precioUnitario;
          subtotal += sub;
          
          const producto = await tx.producto.findUniqueOrThrow({
            where: { id: detalle.productoId }
          });
          
          const nombreDecifrado = descifrarTexto(producto.nombreCifrado);

          return {
            productoId: detalle.productoId,
            productoNombreCifrado: cifrarTexto(nombreDecifrado),
            precioUnitarioCongeladoCifrado: cifrarTexto(detalle.precioUnitario.toString()),
            cantidadCifrada: cifrarTexto(detalle.cantidad.toString()),
            subtotalCifrado: cifrarTexto(sub.toString()),
            // Metadata temporal para actualización de stock
            stockActualDecifrado: parseInt(descifrarTexto(producto.stockCifrado), 10),
            cantidadVendida: detalle.cantidad
          };
        })
      );

      const total = subtotal;

      const nuevaOrden = await tx.orden.create({
        data: {
          tipo: data.tipo,
          clienteId: data.clienteId,
          usuarioId: data.usuarioId,
          metodoPagoId: data.metodoPagoId,
          subtotalCifrado: cifrarTexto(subtotal.toString()),
          totalCifrado: cifrarTexto(total.toString()),
          detalles: {
            create: detallesProcesados.map(d => ({
              productoId: d.productoId,
              productoNombreCifrado: d.productoNombreCifrado,
              precioUnitarioCongeladoCifrado: d.precioUnitarioCongeladoCifrado,
              cantidadCifrada: d.cantidadCifrada,
              subtotalCifrado: d.subtotalCifrado,
            }))
          }
        },
        include: { detalles: true }
      });

      if (data.tipo === 'VENTA') {
        for (const detalle of detallesProcesados) {
          const nuevoStock = detalle.stockActualDecifrado - detalle.cantidadVendida;
          
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: {
              stockCifrado: cifrarTexto(nuevoStock.toString()),
              rangoStock: isNaN(nuevoStock) ? 0 : nuevoStock,
            }
          });

          await tx.kardex.create({
            data: {
              productoId: detalle.productoId,
              usuarioId: data.usuarioId,
              tipoMovimiento: 'SALIDA',
              cantidadCifrada: cifrarTexto(detalle.cantidadVendida.toString()),
              motivoCifrado: cifrarTexto(`Venta - Orden #${nuevaOrden.numeroOrden}`)
            }
          });
        }
      }

      return nuevaOrden;
    });
  },

  async obtenerTodas() {
    const ordenes = await prisma.orden.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true
      }
    });

    return ordenes.map(orden => ({
      ...orden,
      total: descifrarTexto(orden.totalCifrado),
      subtotal: descifrarTexto(orden.subtotalCifrado),
      clienteNombre: orden.cliente ? descifrarTexto(orden.cliente.nombreCifrado) : 'Consumidor Final'
    }));
  }
};
