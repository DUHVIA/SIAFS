import { prisma } from '@/lib/prisma';
import { cifrarTexto, descifrarTexto, generarIndiceCiego } from '@/lib/crypto';
import { CrearProductoDTO, ActualizarProductoDTO } from './producto.dto';



export const ProductoService = {
  async obtenerTodos() {
    const productos = await prisma.producto.findMany({
      where: { isActive: true },
      include: {
        tipoAutoparte: true,
        detalleIngresos: {
          take: 1,
          orderBy: { ingreso: { fechaIngreso: 'desc' } },
          select: { costoUnitarioCifrado: true }
        },
        historialPrecios: {
          where: { NOT: { precioCompraCifrado: null } },
          take: 1,
          orderBy: { fechaCambio: 'desc' },
          select: { precioCompraCifrado: true }
        }
      },
    });

    return productos.map(producto => {
      let detallesParsed: any = {};
      try {
        detallesParsed = JSON.parse(descifrarTexto(producto.detallesCifrados));
      } catch (e) {
        detallesParsed = {};
      }

      let precioCosto = 0;

      // 1. Prioridad: Último costo en DetalleIngreso
      if (producto.detalleIngresos && producto.detalleIngresos.length > 0 && producto.detalleIngresos[0].costoUnitarioCifrado) {
        try {
          const val = parseFloat(descifrarTexto(producto.detalleIngresos[0].costoUnitarioCifrado));
          if (!isNaN(val) && val > 0) precioCosto = val;
        } catch (e) {}
      }

      // 2. Fallback: HistorialPrecio con precioCompraCifrado
      if (precioCosto === 0 && producto.historialPrecios && producto.historialPrecios.length > 0 && producto.historialPrecios[0].precioCompraCifrado) {
        try {
          const val = parseFloat(descifrarTexto(producto.historialPrecios[0].precioCompraCifrado));
          if (!isNaN(val) && val > 0) precioCosto = val;
        } catch (e) {}
      }

      // 3. Fallback: propiedad costo o precioCompra en JSON detalles
      if (precioCosto === 0) {
        const val = parseFloat(detallesParsed.costo || detallesParsed.precioCompra || '0');
        if (!isNaN(val)) precioCosto = val;
      }

      return {
        ...producto,
        nombre: descifrarTexto(producto.nombreCifrado),
        precioVenta: descifrarTexto(producto.precioVentaCifrado),
        stock: descifrarTexto(producto.stockCifrado),
        precioCosto,
        detalles: detallesParsed,
      };
    });
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
          tipoAutoparteId: data.tipoAutoparteId,
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
      if (data.tipoAutoparteId !== undefined) {
        updateData.tipoAutoparteId = data.tipoAutoparteId;
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

  async registrarReposicion(id: string, data: { cantidad: string; motivo: string; usuarioId: string }) {
    return await prisma.$transaction(async (tx) => {
      const productoActual = await tx.producto.findUniqueOrThrow({ where: { id } });
      const stockActual = parseInt(descifrarTexto(productoActual.stockCifrado), 10);
      const cantidadAnadir = parseInt(data.cantidad, 10);
      const nuevoStock = stockActual + cantidadAnadir;

      const stockCifrado = cifrarTexto(nuevoStock.toString());
      const productoActualizado = await tx.producto.update({
        where: { id },
        data: {
          stockCifrado,
          rangoStock: nuevoStock,
        },
      });

      await tx.kardex.create({
        data: {
          productoId: id,
          usuarioId: data.usuarioId,
          tipoMovimiento: 'INGRESO',
          cantidadCifrada: cifrarTexto(data.cantidad),
          motivoCifrado: cifrarTexto(data.motivo),
        }
      });

      return {
        ...productoActualizado,
        nombre: descifrarTexto(productoActualizado.nombreCifrado),
        precioVenta: descifrarTexto(productoActualizado.precioVentaCifrado),
        stock: nuevoStock.toString(),
        detalles: JSON.parse(descifrarTexto(productoActualizado.detallesCifrados)),
      };
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
