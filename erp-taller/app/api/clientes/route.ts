import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearClienteSchema } from '@/modules/clientes/cliente.dto';
import { ClienteService } from '@/modules/clientes/cliente.service';

export async function GET() {
  try {
    const clientes = await ClienteService.obtenerTodos();
    return NextResponse.json(clientes, { status: 200 });
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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
