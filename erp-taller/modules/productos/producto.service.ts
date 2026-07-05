import { PrismaClient } from '@prisma/client';
import { cifrarTexto, descifrarTexto, generarIndiceCiego } from '@/lib/crypto';
import { CrearProductoDTO, ActualizarProductoDTO } from './producto.dto';

const prisma = new PrismaClient();

export const ProductoService = {
  async obtenerTodos() {
    const productos = await prisma.producto.findMany({
      where: { isActive: true },
    });

    return productos.map(producto => ({
      ...producto,
      nombre: descifrarTexto(producto.nombreCifrado),
      precioVenta: descifrarTexto(producto.precioVentaCifrado),
      stock: descifrarTexto(producto.stockCifrado),
      detalles: JSON.parse(descifrarTexto(producto.detallesCifrados)),
    }));
  },

  async crear(data: CrearProductoDTO) {
    return await prisma.$transaction(async (tx) => {
      const nombreCifrado = cifrarTexto(data.nombre);
      const idxNombre = generarIndiceCiego(data.nombre);
      const precioVentaCifrado = cifrarTexto(data.precioVenta);
      const stockCifrado = cifrarTexto(data.stock);
      const detallesCifrados = cifrarTexto(JSON.stringify(data.detalles || {}));
      
      const rangoStock = parseInt(data.stock, 10);

      const nuevoProducto = await tx.producto.create({
        data: {
          nombreCifrado,
          idxNombre,
          categoria: data.categoria,
          precioVentaCifrado,
          stockCifrado,
          rangoStock: isNaN(rangoStock) ? 0 : rangoStock,
          detallesCifrados,
        },
      });

      // Registro en Historial Precio
      await tx.historialPrecio.create({
        data: {
          productoId: nuevoProducto.id,
          usuarioId: data.usuarioId,
          precioVentaCifrado: precioVentaCifrado,
        }
      });

      // Registro en Historial Nombre
      await tx.historialNombre.create({
        data: {
          productoId: nuevoProducto.id,
          usuarioId: data.usuarioId,
          nombreAntiguoCifrado: nombreCifrado,
          nombreNuevoCifrado: nombreCifrado,
        }
      });

      // Registro en Kardex de inventario inicial
      await tx.kardex.create({
        data: {
          productoId: nuevoProducto.id,
          usuarioId: data.usuarioId,
          tipoMovimiento: 'INGRESO',
          cantidadCifrada: cifrarTexto(data.stock),
          motivoCifrado: cifrarTexto('Stock Inicial'),
        }
      });

      return {
        ...nuevoProducto,
        nombre: data.nombre,
        precioVenta: data.precioVenta,
        stock: data.stock,
        detalles: data.detalles,
      };
    });
  },

  async actualizar(id: string, data: ActualizarProductoDTO) {
    return await prisma.$transaction(async (tx) => {
      const productoActual = await tx.producto.findUniqueOrThrow({ where: { id } });
      const nombreActual = descifrarTexto(productoActual.nombreCifrado);
      const precioActual = descifrarTexto(productoActual.precioVentaCifrado);
      const stockActual = descifrarTexto(productoActual.stockCifrado);

      const updateData: any = {};
      
      let nombreCambio = false;
      let precioCambio = false;
      let stockCambio = false;

      if (data.nombre !== undefined && data.nombre !== nombreActual) {
        updateData.nombreCifrado = cifrarTexto(data.nombre);
        updateData.idxNombre = generarIndiceCiego(data.nombre);
        nombreCambio = true;
      }
      if (data.categoria !== undefined) {
        updateData.categoria = data.categoria;
      }
      if (data.precioVenta !== undefined && data.precioVenta !== precioActual) {
        updateData.precioVentaCifrado = cifrarTexto(data.precioVenta);
        precioCambio = true;
      }
      if (data.stock !== undefined && data.stock !== stockActual) {
        updateData.stockCifrado = cifrarTexto(data.stock);
        const rangoStock = parseInt(data.stock, 10);
        updateData.rangoStock = isNaN(rangoStock) ? 0 : rangoStock;
        stockCambio = true;
      }
      if (data.detalles !== undefined) {
        updateData.detallesCifrados = cifrarTexto(JSON.stringify(data.detalles));
      }

      if ((nombreCambio || precioCambio || stockCambio) && !data.usuarioId) {
        throw new Error("El campo usuarioId es requerido para mantener el historial de cambios.");
      }

      const productoActualizado = await tx.producto.update({
        where: { id },
        data: updateData,
      });

      if (data.usuarioId) {
        if (nombreCambio) {
          await tx.historialNombre.create({
            data: {
              productoId: id,
              usuarioId: data.usuarioId,
              nombreAntiguoCifrado: productoActual.nombreCifrado,
              nombreNuevoCifrado: updateData.nombreCifrado,
            }
          });
        }
        if (precioCambio) {
          await tx.historialPrecio.create({
            data: {
              productoId: id,
              usuarioId: data.usuarioId,
              precioVentaCifrado: updateData.precioVentaCifrado,
            }
          });
        }
        if (stockCambio) {
          const diferenciaStock = parseInt(data.stock as string, 10) - parseInt(stockActual, 10);
          await tx.kardex.create({
            data: {
              productoId: id,
              usuarioId: data.usuarioId,
              tipoMovimiento: diferenciaStock >= 0 ? 'AJUSTE' : 'SALIDA',
              cantidadCifrada: cifrarTexto(Math.abs(diferenciaStock).toString()),
              motivoCifrado: cifrarTexto('Ajuste Manual'),
            }
          });
        }
      }

      return productoActualizado;
    });
  },

  async desactivar(id: string) {
    const productoDesactivado = await prisma.producto.update({
      where: { id },
      data: { isActive: false },
    });
    return productoDesactivado;
  }
};
