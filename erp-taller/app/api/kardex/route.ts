import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RegistrarMovimientoSchema } from '@/modules/kardex/kardex.dto';
import { KardexService } from '@/modules/kardex/kardex.service';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = RegistrarMovimientoSchema.parse(json);
    
    const nuevoMovimiento = await KardexService.registrarMovimiento(data);
    return NextResponse.json(nuevoMovimiento, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/kardex:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
