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
    const nombreCifrado = cifrarTexto(data.nombre);
    const idxNombre = generarIndiceCiego(data.nombre);
    const precioVentaCifrado = cifrarTexto(data.precioVenta);
    const stockCifrado = cifrarTexto(data.stock);
    const detallesCifrados = cifrarTexto(JSON.stringify(data.detalles || {}));
    
    const rangoStock = parseInt(data.stock, 10);

    const nuevoProducto = await prisma.producto.create({
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

    return {
      ...nuevoProducto,
      nombre: data.nombre,
      precioVenta: data.precioVenta,
      stock: data.stock,
      detalles: data.detalles,
    };
  },

  async actualizar(id: string, data: ActualizarProductoDTO) {
    const updateData: any = {};
    if (data.nombre) {
      updateData.nombreCifrado = cifrarTexto(data.nombre);
      updateData.idxNombre = generarIndiceCiego(data.nombre);
    }
    if (data.categoria) {
      updateData.categoria = data.categoria;
    }
    if (data.precioVenta) {
      updateData.precioVentaCifrado = cifrarTexto(data.precioVenta);
    }
    if (data.stock) {
      updateData.stockCifrado = cifrarTexto(data.stock);
      const rangoStock = parseInt(data.stock, 10);
      updateData.rangoStock = isNaN(rangoStock) ? 0 : rangoStock;
    }
    if (data.detalles) {
      updateData.detallesCifrados = cifrarTexto(JSON.stringify(data.detalles));
    }

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    return productoActualizado;
  },

  async desactivar(id: string) {
    const productoDesactivado = await prisma.producto.update({
      where: { id },
      data: { isActive: false },
    });
    return productoDesactivado;
  }
};
