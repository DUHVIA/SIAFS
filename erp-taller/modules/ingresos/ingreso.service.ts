import { prisma } from '@/lib/prisma';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { CrearIngresoDTO } from './ingreso.dto';



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
        const precioCompraCifrado = cifrarTexto(detalle.costoUnitario.toString());
        
        const updateData: any = {
          stockCifrado: cifrarTexto(nuevoStock.toString()),
          rangoStock: isNaN(nuevoStock) ? 0 : nuevoStock,
          precioCompraCifrado: precioCompraCifrado,
        };

        let precioVentaAActualizar = detalle.precioVentaActualCifrado;

        if (detalle.nuevoPrecioVenta !== undefined && !isNaN(detalle.nuevoPrecioVenta) && detalle.nuevoPrecioVenta > 0) {
          precioVentaAActualizar = cifrarTexto(detalle.nuevoPrecioVenta.toString());
          updateData.precioVentaCifrado = precioVentaAActualizar;
        }

        // Siempre registrar en HistorialPrecio el cambio de costo de compra
        await tx.historialPrecio.create({
          data: {
            productoId: detalle.productoId,
            usuarioId: data.usuarioId,
            precioCompraCifrado: precioCompraCifrado,
            precioVentaCifrado: precioVentaAActualizar,
          }
        });

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
  },

  async obtenerTodosFiltrados(params: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const todas = await prisma.ingreso.findMany({
      orderBy: { fechaIngreso: 'desc' },
      include: {
        usuario: { select: { nombre: true } },
        detalles: {
          include: { producto: true }
        }
      }
    });

    const descifradas = todas.map(ingreso => {
      const total = descifrarTexto(ingreso.totalCifrado);
      const descripcion = ingreso.descripcionCifrada ? descifrarTexto(ingreso.descripcionCifrada) : '';
      
      const detallesDescifrados = ingreso.detalles.map(d => {
        const cantidad = parseInt(descifrarTexto(d.cantidadCifrada), 10);
        const costoUnitario = parseFloat(descifrarTexto(d.costoUnitarioCifrado));
        const productoNombre = descifrarTexto(d.producto.nombreCifrado);
        let sku = 'N/A';
        if (d.producto?.detallesCifrados) {
          try {
            const parsed = JSON.parse(descifrarTexto(d.producto.detallesCifrados));
            if (parsed && parsed.sku) sku = parsed.sku;
          } catch (e) {}
        }
        return {
          ...d,
          cantidad,
          costoUnitario,
          productoNombre,
          sku,
        };
      });

      return {
        ...ingreso,
        total,
        descripcion,
        usuarioNombre: ingreso.usuario.nombre,
        detalles: detallesDescifrados,
        cantidadItems: detallesDescifrados.length,
      };
    });

    // Calcular métricas del mes en curso
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosMes = descifradas.filter(i => new Date(i.fechaIngreso) >= inicioMes);
    const totalComprasMes = ingresosMes.reduce((s, i) => s + parseFloat(i.total || '0'), 0);
    const cantidadLotes = ingresosMes.length;
    const lotePromedio = cantidadLotes > 0 ? totalComprasMes / cantidadLotes : 0;
    
    const totalProductosIngresados = ingresosMes.reduce((s, i) => 
      s + i.detalles.reduce((sd, d) => sd + d.cantidad, 0)
    , 0);

    // Filtros
    let filtradas = [...descifradas];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtradas = filtradas.filter(i =>
        i.descripcion?.toLowerCase().includes(q) ||
        i.usuarioNombre?.toLowerCase().includes(q) ||
        i.detalles.some(d => d.productoNombre.toLowerCase().includes(q)) ||
        i.id.toLowerCase().includes(q)
      );
    }

    // Paginación
    const total = filtradas.length;
    const totalPages = Math.ceil(total / params.limit) || 1;
    const offset = (params.page - 1) * params.limit;
    const items = filtradas.slice(offset, offset + params.limit);

    // Simplificamos los items para la lista para evitar transferir payloads muy pesados
    const itemsSimplificados = items.map(i => ({
      id: i.id,
      fechaIngreso: i.fechaIngreso,
      usuarioNombre: i.usuarioNombre,
      descripcion: i.descripcion,
      total: i.total,
      cantidadItems: i.cantidadItems,
    }));

    return {
      items: itemsSimplificados,
      pagination: { total, page: params.page, limit: params.limit, totalPages },
      metrics: { totalComprasMes, cantidadLotes, lotePromedio, totalProductosIngresados }
    };
  },

  async obtenerPorId(id: string) {
    const ingreso = await prisma.ingreso.findUniqueOrThrow({
      where: { id },
      include: {
        usuario: { select: { nombre: true } },
        detalles: {
          include: { producto: true }
        }
      }
    });

    const total = descifrarTexto(ingreso.totalCifrado);
    const descripcion = ingreso.descripcionCifrada ? descifrarTexto(ingreso.descripcionCifrada) : '';

    const detallesDescifrados = ingreso.detalles.map(d => {
      const cantidad = parseInt(descifrarTexto(d.cantidadCifrada), 10);
      const costoUnitario = parseFloat(descifrarTexto(d.costoUnitarioCifrado));
      const productoNombre = descifrarTexto(d.producto.nombreCifrado);
      let sku = 'N/A';
      if (d.producto?.detallesCifrados) {
        try {
          const parsed = JSON.parse(descifrarTexto(d.producto.detallesCifrados));
          if (parsed && parsed.sku) sku = parsed.sku;
        } catch (e) {}
      }
      return {
        id: d.id,
        productoId: d.productoId,
        cantidad,
        costoUnitario,
        productoNombre,
        sku,
        subtotal: cantidad * costoUnitario,
      };
    });

    return {
      id: ingreso.id,
      fechaIngreso: ingreso.fechaIngreso,
      usuarioNombre: ingreso.usuario.nombre,
      descripcion,
      total,
      detalles: detallesDescifrados,
    };
  }
};

