import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const METODOS_DEFAULT = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Cuotas'];

export async function GET() {
  try {
    let metodos = await prisma.metodoPago.findMany({
      where: { isActive: true },
      orderBy: { nombre: 'asc' },
    });

    // Auto-seed si la tabla está vacía
    if (metodos.length === 0) {
      await prisma.metodoPago.createMany({
        data: METODOS_DEFAULT.map(nombre => ({ nombre })),
        skipDuplicates: true,
      });
      metodos = await prisma.metodoPago.findMany({
        where: { isActive: true },
        orderBy: { nombre: 'asc' },
      });
    }

    return NextResponse.json(metodos, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/metodos-pago:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
