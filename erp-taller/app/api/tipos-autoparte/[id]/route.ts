import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const EditarTipoAutoparteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const json = await request.json();
    const data = EditarTipoAutoparteSchema.parse(json);

    const nombreNormalizado = data.nombre.trim();

    // Verificar que el tipo existe y está activo
    const tipo = await prisma.tipoAutoparte.findUnique({ where: { id } });
    if (!tipo || !tipo.isActive) {
      return NextResponse.json({ error: 'Tipo de autoparte no encontrado' }, { status: 404 });
    }

    // Verificar que no exista otro con el mismo nombre (excluyendo el actual)
    const duplicado = await prisma.tipoAutoparte.findFirst({
      where: {
        nombre: { equals: nombreNormalizado, mode: 'insensitive' },
        isActive: true,
        NOT: { id },
      },
    });
    if (duplicado) {
      return NextResponse.json({ error: 'Ya existe un tipo de autoparte con ese nombre' }, { status: 400 });
    }

    const actualizado = await prisma.tipoAutoparte.update({
      where: { id },
      data: { nombre: nombreNormalizado },
    });

    return NextResponse.json(actualizado, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error en PATCH /api/tipos-autoparte/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const tipo = await prisma.tipoAutoparte.findUnique({ where: { id } });
    if (!tipo || !tipo.isActive) {
      return NextResponse.json({ error: 'Tipo de autoparte no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.tipoAutoparte.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Tipo de autoparte eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/tipos-autoparte/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
