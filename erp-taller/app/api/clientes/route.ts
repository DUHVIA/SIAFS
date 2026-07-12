import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearClienteSchema } from '@/modules/clientes/cliente.dto';
import { ClienteService } from '@/modules/clientes/cliente.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const todos = await ClienteService.obtenerTodos();

    // Métricas calculadas sobre el total
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const nuevosEsteMes = todos.filter(c => new Date(c.createdAt) >= inicioMes).length;

    // Filtro en memoria
    let filtrados = todos;
    if (search) {
      const q = search.toLowerCase();
      filtrados = todos.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.documento?.toLowerCase().includes(q) ||
        c.correo?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      );
    }

    // Paginación
    const total = filtrados.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = filtrados.slice(offset, offset + limit);

    return NextResponse.json({
      items,
      pagination: { total, page, limit, totalPages },
      metrics: { totalClientes: todos.length, nuevosEsteMes }
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/clientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearClienteSchema.parse(json);

    const nuevoCliente = await ClienteService.crear(data);
    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/clientes:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
