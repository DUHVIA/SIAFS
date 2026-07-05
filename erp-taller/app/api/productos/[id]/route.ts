import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActualizarProductoSchema } from '@/modules/productos/producto.dto';
import { ProductoService } from '@/modules/productos/producto.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = ActualizarProductoSchema.parse(json);
    
    const productoActualizado = await ProductoService.actualizar(resolvedParams.id, data);
    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en PATCH /api/productos/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    await ProductoService.desactivar(resolvedParams.id);
    return NextResponse.json({ message: 'Producto desactivado correctamente' }, { status: 200 });
  } catch (error) {
    console.error(`Error en DELETE /api/productos/[id]:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
