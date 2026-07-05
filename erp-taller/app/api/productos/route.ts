import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CrearProductoSchema } from '@/modules/productos/producto.dto';
import { ProductoService } from '@/modules/productos/producto.service';

export async function GET() {
  try {
    const productos = await ProductoService.obtenerTodos();
    return NextResponse.json(productos, { status: 200 });
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
