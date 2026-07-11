import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductoService } from '@/modules/productos/producto.service';

const RestockSchema = z.object({
  usuarioId: z.string().uuid("El usuarioId es requerido para registrar el movimiento"),
  cantidad: z.string().regex(/^\d+$/, "La cantidad debe ser un número entero positivo"),
  motivo: z.string().min(1, "El motivo es requerido"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const json = await request.json();
    const data = RestockSchema.parse(json);

    const productoActualizado = await ProductoService.registrarReposicion(resolvedParams.id, data);
    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error(`Error en POST /api/productos/[id]/restock:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
