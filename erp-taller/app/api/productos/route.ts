import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearProductoSchema } from '@/modules/productos/producto.dto';
import { ProductoService } from '@/modules/productos/producto.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const categoria = searchParams.get('categoria') || '';
    const stockStatus = searchParams.get('stockStatus') || '';
    const tipoAutoparteId = searchParams.get('tipoAutoparteId') || '';

    // Obtener todos los productos activos
    const todosLosProductos = await ProductoService.obtenerTodos();

    // Calcular métricas agregadas globales
    let totalSkus = todosLosProductos.length;
    let outOfStock = 0;
    let lowStock = 0;
    let totalValue = 0;

    todosLosProductos.forEach(p => {
      const stock = parseInt(p.stock || '0', 10);
      const precio = parseFloat(p.precioVenta || '0');

      if (stock === 0) {
        outOfStock++;
      } else if (p.categoria === 'MOTOR' ? stock <= 1 : stock <= 5) {
        lowStock++;
      }
      totalValue += precio * stock;
    });

    // Aplicar filtros en memoria
    let productosFiltrados = todosLosProductos;

    if (categoria) {
      productosFiltrados = productosFiltrados.filter(p => p.categoria === categoria);
    }

    if (tipoAutoparteId) {
      productosFiltrados = productosFiltrados.filter(p => p.tipoAutoparteId === tipoAutoparteId);
    }

    if (stockStatus === 'OUT_OF_STOCK') {
      productosFiltrados = productosFiltrados.filter(p => parseInt(p.stock || '0', 10) === 0);
    } else if (stockStatus === 'LOW_STOCK') {
      productosFiltrados = productosFiltrados.filter(p => {
        const stock = parseInt(p.stock || '0', 10);
        return stock > 0 && (p.categoria === 'MOTOR' ? stock <= 1 : stock <= 5);
      });
    } else if (stockStatus === 'RESTOCKING') {
      productosFiltrados = productosFiltrados.filter(p => {
        const stock = parseInt(p.stock || '0', 10);
        return stock === 0 || (p.categoria === 'MOTOR' ? stock <= 1 : stock <= 5);
      });
    }

    if (search) {
      const query = search.toLowerCase();
      productosFiltrados = productosFiltrados.filter(p => {
        const matchNombre = p.nombre?.toLowerCase().includes(query);
        const matchSku = p.detalles?.sku?.toLowerCase().includes(query);
        const matchMarca = p.detalles?.marca?.toLowerCase().includes(query);
        const matchTipo = p.detalles?.tipo?.toLowerCase().includes(query);
        const matchCombustible = p.detalles?.combustible?.toLowerCase().includes(query);
        const matchTipoRel = p.tipoAutoparte?.nombre?.toLowerCase().includes(query);
        const matchCompatibles = Array.isArray(p.detalles?.marcasCompatibles) && 
          p.detalles.marcasCompatibles.some((m: string) => m.toLowerCase().includes(query));

        return matchNombre || matchSku || matchMarca || matchTipo || matchCombustible || matchCompatibles || matchTipoRel;
      });
    }

    // Paginación
    const totalItems = productosFiltrados.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = productosFiltrados.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages
      },
      metrics: {
        totalSkus,
        outOfStock,
        lowStock,
        totalValue
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearProductoSchema.parse(json);
    
    const nuevoProducto = await ProductoService.crear(data);
    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
