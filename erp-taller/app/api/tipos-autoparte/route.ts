import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CrearTipoAutoparteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
});

export async function GET() {
  try {
    const tipos = await prisma.tipoAutoparte.findMany({
      where: { isActive: true },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(tipos, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/tipos-autoparte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = CrearTipoAutoparteSchema.parse(json);

    const nombreNormalizado = data.nombre.trim();

    // Validar si ya existe
    const existente = await prisma.tipoAutoparte.findFirst({
      where: { 
        nombre: {
          equals: nombreNormalizado,
          mode: 'insensitive'
        }
      }
    });

    if (existente) {
      if (existente.isActive) {
        return NextResponse.json({ error: 'El tipo de autoparte ya existe' }, { status: 400 });
      } else {
        // Reactivar
        const reactivado = await prisma.tipoAutoparte.update({
          where: { id: existente.id },
          data: { isActive: true }
        });
        return NextResponse.json(reactivado, { status: 200 });
      }
    }

    const nuevoTipo = await prisma.tipoAutoparte.create({
      data: { nombre: nombreNormalizado },
    });

    return NextResponse.json(nuevoTipo, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/tipos-autoparte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
