import { PrismaClient } from '@prisma/client';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { CrearIngresoDTO } from './ingreso.dto';

const prisma = new PrismaClient();

export const IngresoService = {
  async crearIngreso(data: CrearIngresoDTO) {
    return await prisma.$transaction(async (tx) => {
      let total = 0;
      
      const detallesProcesados = await Promise.all(
        data.detalles.map(async (detalle) => {
          const sub = detalle.cantidad * detalle.costoUnitario;
          total += sub;
          
          const producto = await tx.producto.findUniqueOrThrow({
            where: { id: detalle.productoId }
          });
          
          return {
            productoId: detalle.productoId,
            cantidadCifrada: cifrarTexto(detalle.cantidad.toString()),
            costoUnitarioCifrado: cifrarTexto(detalle.costoUnitario.toString()),
            stockActualDecifrado: parseInt(descifrarTexto(producto.stockCifrado), 10),
            cantidadIngresada: detalle.cantidad,
            precioVentaActualCifrado: producto.precioVentaCifrado,
            nuevoPrecioVenta: detalle.nuevoPrecioVenta,
            costoUnitario: detalle.costoUnitario,
          };
        })
      );

      const nuevoIngreso = await tx.ingreso.create({
        data: {
          usuarioId: data.usuarioId,
          descripcionCifrada: data.descripcion ? cifrarTexto(data.descripcion) : null,
          totalCifrado: cifrarTexto(total.toString()),
          detalles: {
            create: detallesProcesados.map(d => ({
              productoId: d.productoId,
              cantidadCifrada: d.cantidadCifrada,
              costoUnitarioCifrado: d.costoUnitarioCifrado,
            }))
          }
        },
        include: { detalles: true }
      });

      for (const detalle of detallesProcesados) {
        const nuevoStock = detalle.stockActualDecifrado + detalle.cantidadIngresada;
        
        const updateData: any = {
          stockCifrado: cifrarTexto(nuevoStock.toString()),
          rangoStock: isNaN(nuevoStock) ? 0 : nuevoStock,
        };

        if (detalle.nuevoPrecioVenta !== undefined) {
          const precioVentaAActualizar = cifrarTexto(detalle.nuevoPrecioVenta.toString());
          updateData.precioVentaCifrado = precioVentaAActualizar;
          
          await tx.historialPrecio.create({
            data: {
              productoId: detalle.productoId,
              usuarioId: data.usuarioId,
              precioCompraCifrado: cifrarTexto(detalle.costoUnitario.toString()),
              precioVentaCifrado: precioVentaAActualizar,
            }
          });
        }

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: updateData
        });

        await tx.kardex.create({
          data: {
            productoId: detalle.productoId,
            usuarioId: data.usuarioId,
            tipoMovimiento: 'INGRESO',
            cantidadCifrada: cifrarTexto(detalle.cantidadIngresada.toString()),
            motivoCifrado: cifrarTexto(`Ingreso a inventario (ID: ${nuevoIngreso.id})`)
          }
        });
      }

      return nuevoIngreso;
    });
  }
};
