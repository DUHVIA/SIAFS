import { prisma } from '@/lib/prisma';
import { cifrarTexto, descifrarTexto } from '@/lib/crypto';
import { CrearOrdenDTO, ActualizarCotizacionDTO, AnularOrdenDTO, ConvertirAVentaDTO } from './orden.dto';



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

          // Congelar el costo unitario actual del producto al momento de la venta
          const costoCongelado = producto.precioCompraCifrado
            ? producto.precioCompraCifrado
            : null;

          return {
            productoId: detalle.productoId,
            productoNombreCifrado: cifrarTexto(nombreDecifrado),
            precioUnitarioCongeladoCifrado: cifrarTexto(detalle.precioUnitario.toString()),
            costoUnitarioCongeladoCifrado: costoCongelado,
            cantidadCifrada: cifrarTexto(detalle.cantidad.toString()),
            subtotalCifrado: cifrarTexto(sub.toString()),
            stockActualDecifrado: parseInt(descifrarTexto(producto.stockCifrado), 10),
            cantidadVendida: detalle.cantidad
          };
        })
      );

      const total = subtotal;

      // Parsear fecha local para evitar desfasaje UTC
      let fechaOrden: Date = new Date();
      if (data.fecha) {
        const [year, month, day] = data.fecha.split('-').map(Number);
        fechaOrden = new Date(year, month - 1, day, 12, 0, 0);
      }

      const nuevaOrden = await tx.orden.create({
        data: {
          tipo: data.tipo,
          estado: data.tipo === 'VENTA' ? 'COMPLETADA' : 'PENDIENTE',
          clienteId: data.clienteId,
          usuarioId: data.usuarioId,
          metodoPagoId: data.metodoPagoId,
          fechaOrden,
          subtotalCifrado: cifrarTexto(subtotal.toString()),
          totalCifrado: cifrarTexto(total.toString()),
          detalles: {
            create: detallesProcesados.map(d => ({
              productoId: d.productoId,
              productoNombreCifrado: d.productoNombreCifrado,
              precioUnitarioCongeladoCifrado: d.precioUnitarioCongeladoCifrado,
              costoUnitarioCongeladoCifrado: d.costoUnitarioCongeladoCifrado,
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

  async actualizarCotizacion(id: string, data: ActualizarCotizacionDTO) {
    return await prisma.$transaction(async (tx) => {
      const orden = await tx.orden.findUniqueOrThrow({
        where: { id },
        include: { detalles: true }
      });

      if (orden.tipo !== 'COTIZACION') {
        throw new Error('Solo se pueden editar cotizaciones');
      }
      if (orden.estado !== 'PENDIENTE') {
        throw new Error('Solo se pueden editar cotizaciones en estado PENDIENTE');
      }

      // Eliminar detalles anteriores
      await tx.detalleOrden.deleteMany({ where: { ordenId: id } });

      // Calcular nuevos detalles
      let subtotal = 0;
      const detallesProcesados = await Promise.all(
        data.detalles.map(async (detalle) => {
          const sub = detalle.cantidad * detalle.precioUnitario;
          subtotal += sub;
          const producto = await tx.producto.findUniqueOrThrow({
            where: { id: detalle.productoId }
          });
          const nombreDecifrado = descifrarTexto(producto.nombreCifrado);
          const costoCongelado = producto.precioCompraCifrado ?? null;
          return {
            productoId: detalle.productoId,
            productoNombreCifrado: cifrarTexto(nombreDecifrado),
            precioUnitarioCongeladoCifrado: cifrarTexto(detalle.precioUnitario.toString()),
            costoUnitarioCongeladoCifrado: costoCongelado,
            cantidadCifrada: cifrarTexto(detalle.cantidad.toString()),
            subtotalCifrado: cifrarTexto(sub.toString()),
          };
        })
      );

      // Parsear fecha local si se provee
      const updateData: any = {
        clienteId: data.clienteId,
        subtotalCifrado: cifrarTexto(subtotal.toString()),
        totalCifrado: cifrarTexto(subtotal.toString()),
        detalles: {
          create: detallesProcesados.map(d => ({
            productoId: d.productoId,
            productoNombreCifrado: d.productoNombreCifrado,
            precioUnitarioCongeladoCifrado: d.precioUnitarioCongeladoCifrado,
            costoUnitarioCongeladoCifrado: d.costoUnitarioCongeladoCifrado,
            cantidadCifrada: d.cantidadCifrada,
            subtotalCifrado: d.subtotalCifrado,
          }))
        }
      };

      if (data.fecha) {
        const [year, month, day] = data.fecha.split('-').map(Number);
        updateData.fechaOrden = new Date(year, month - 1, day, 12, 0, 0);
      }

      // Crear nuevos detalles y actualizar totales
      return await tx.orden.update({
        where: { id },
        data: updateData,
        include: { detalles: true }
      });
    });
  },

  async obtenerTodasFiltradas(params: {
    tipo?: string;
    estado?: string;
    search?: string;
    clienteId?: string;
    page: number;
    limit: number;
  }) {
    const todas = await prisma.orden.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        metodoPago: true,
        detalles: {
          include: { producto: true }
        },
      }
    });

    const descifradas = todas.map(orden => {
      const detallesDescifrados = orden.detalles.map(d => {
        let sku = 'N/A';
        if (d.producto?.detallesCifrados) {
          try {
            const parsed = JSON.parse(descifrarTexto(d.producto.detallesCifrados));
            if (parsed && parsed.sku) sku = parsed.sku;
          } catch (e) {}
        }
        return {
          ...d,
          sku,
          productoNombre: descifrarTexto(d.productoNombreCifrado),
          precioUnitario: descifrarTexto(d.precioUnitarioCongeladoCifrado),
          cantidad: descifrarTexto(d.cantidadCifrada),
          subtotal: descifrarTexto(d.subtotalCifrado),
        };
      });

      return {
        ...orden,
        total: descifrarTexto(orden.totalCifrado),
        subtotal: descifrarTexto(orden.subtotalCifrado),
        clienteNombre: orden.cliente ? descifrarTexto(orden.cliente.nombreCifrado) : 'Consumidor Final',
        cantidadItems: orden.detalles.length,
        detalles: detallesDescifrados,
      };
    });

    // Métricas del mes en curso
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ventasMes = descifradas.filter(o =>
      o.tipo === 'VENTA' && o.estado === 'COMPLETADA' && new Date(o.createdAt) >= inicioMes
    );
    const totalVentasMes = ventasMes.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
    const ticketPromedio = ventasMes.length > 0 ? totalVentasMes / ventasMes.length : 0;

    const cotizacionesPendientes = descifradas.filter(o =>
      o.tipo === 'COTIZACION' && o.estado === 'PENDIENTE'
    ).length;

    const cotizacionesMes = descifradas.filter(o =>
      o.tipo === 'COTIZACION' && new Date(o.createdAt) >= inicioMes
    ).length;
    const ventasMesCount = descifradas.filter(o =>
      o.tipo === 'VENTA' && new Date(o.createdAt) >= inicioMes
    ).length;
    const tasaConversion = cotizacionesMes > 0
      ? Math.round((ventasMesCount / cotizacionesMes) * 100)
      : 0;

    // Filtros
    let filtradas = [...descifradas];

    if (params.clienteId) filtradas = filtradas.filter(o => o.clienteId === params.clienteId);
    if (params.tipo) filtradas = filtradas.filter(o => o.tipo === params.tipo);
    if (params.estado) filtradas = filtradas.filter(o => o.estado === params.estado);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtradas = filtradas.filter(o =>
        o.clienteNombre?.toLowerCase().includes(q) ||
        o.numeroOrden.toString().includes(q)
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
      metrics: { totalVentasMes, cotizacionesPendientes, tasaConversion, ticketPromedio }
    };
  },

  async obtenerPorId(id: string) {
    const orden = await prisma.orden.findUniqueOrThrow({
      where: { id },
      include: {
        cliente: true,
        metodoPago: true,
        usuario: { select: { nombre: true } },
        detalles: {
          include: { producto: true }
        },
      }
    });

    const detallesDescifrados = orden.detalles.map(d => {
      let sku = 'N/A';
      if (d.producto?.detallesCifrados) {
        try {
          const parsed = JSON.parse(descifrarTexto(d.producto.detallesCifrados));
          if (parsed && parsed.sku) sku = parsed.sku;
        } catch (e) {}
      }
      return {
        ...d,
        sku,
        productoNombre: descifrarTexto(d.productoNombreCifrado),
        precioUnitario: descifrarTexto(d.precioUnitarioCongeladoCifrado),
        cantidad: descifrarTexto(d.cantidadCifrada),
        subtotal: descifrarTexto(d.subtotalCifrado),
      };
    });

    return {
      ...orden,
      total: descifrarTexto(orden.totalCifrado),
      subtotal: descifrarTexto(orden.subtotalCifrado),
      clienteNombre: orden.cliente ? descifrarTexto(orden.cliente.nombreCifrado) : 'Consumidor Final',
      clienteDocumento: orden.cliente ? descifrarTexto(orden.cliente.documentoCifrado) : null,
      detalles: detallesDescifrados,
    };
  },

  async anular(id: string, data: AnularOrdenDTO) {
    return await prisma.$transaction(async (tx) => {
      const orden = await tx.orden.findUniqueOrThrow({
        where: { id },
        include: { detalles: true }
      });

      if (orden.estado === 'ANULADA') {
        throw new Error('La orden ya está anulada');
      }

      // Reponer stock si era una VENTA (el stock se descontó al crearla)
      if (orden.tipo === 'VENTA') {
        for (const detalle of orden.detalles) {
          if (!detalle.productoId) continue;

          const cantidad = parseInt(descifrarTexto(detalle.cantidadCifrada), 10);
          const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } });
          if (!producto) continue;

          const stockActual = parseInt(descifrarTexto(producto.stockCifrado), 10);
          const nuevoStock = stockActual + cantidad;

          await tx.producto.update({
            where: { id: detalle.productoId },
            data: {
              stockCifrado: cifrarTexto(nuevoStock.toString()),
              rangoStock: nuevoStock,
            }
          });

          await tx.kardex.create({
            data: {
              productoId: detalle.productoId,
              usuarioId: data.usuarioId,
              tipoMovimiento: 'INGRESO',
              cantidadCifrada: cifrarTexto(cantidad.toString()),
              motivoCifrado: cifrarTexto(`Anulación - Orden #${orden.numeroOrden}`),
            }
          });
        }
      }

      return await tx.orden.update({
        where: { id },
        data: { estado: 'ANULADA' }
      });
    });
  },

  async convertirAVenta(id: string, data: ConvertirAVentaDTO) {
    return await prisma.$transaction(async (tx) => {
      const orden = await tx.orden.findUniqueOrThrow({
        where: { id },
        include: { detalles: true }
      });

      if (orden.tipo !== 'COTIZACION') {
        throw new Error('Solo se pueden convertir cotizaciones a venta');
      }
      if (orden.estado !== 'PENDIENTE') {
        throw new Error('Solo se pueden convertir cotizaciones en estado PENDIENTE');
      }

      // Descontar stock por cada ítem de la cotización
      for (const detalle of orden.detalles) {
        if (!detalle.productoId) continue;

        const cantidad = parseInt(descifrarTexto(detalle.cantidadCifrada), 10);
        const producto = await tx.producto.findUniqueOrThrow({ where: { id: detalle.productoId } });
        const stockActual = parseInt(descifrarTexto(producto.stockCifrado), 10);
        const nuevoStock = stockActual - cantidad;

        if (nuevoStock < 0) {
          const nombreProducto = descifrarTexto(detalle.productoNombreCifrado);
          throw new Error(`Stock insuficiente para "${nombreProducto}" (disponible: ${stockActual}, solicitado: ${cantidad})`);
        }

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: {
            stockCifrado: cifrarTexto(nuevoStock.toString()),
            rangoStock: nuevoStock,
          }
        });

        await tx.kardex.create({
          data: {
            productoId: detalle.productoId,
            usuarioId: data.usuarioId,
            tipoMovimiento: 'SALIDA',
            cantidadCifrada: cifrarTexto(cantidad.toString()),
            motivoCifrado: cifrarTexto(`Venta (conv. cotización) - Orden #${orden.numeroOrden}`),
          }
        });
      }

      return await tx.orden.update({
        where: { id },
        data: {
          tipo: 'VENTA',
          estado: 'COMPLETADA',
          ...(data.metodoPagoId ? { metodoPagoId: data.metodoPagoId } : {}),
        }
      });
    });
  },

  // Mantener retrocompatibilidad con dashboard.service.ts si lo usa
  async obtenerTodas() {
    const ordenes = await prisma.orden.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cliente: true }
    });

    return ordenes.map(orden => ({
      ...orden,
      total: descifrarTexto(orden.totalCifrado),
      subtotal: descifrarTexto(orden.subtotalCifrado),
      clienteNombre: orden.cliente ? descifrarTexto(orden.cliente.nombreCifrado) : 'Consumidor Final'
    }));
  }
};
