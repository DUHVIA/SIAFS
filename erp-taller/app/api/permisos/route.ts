import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const permisos = await prisma.permiso.findMany({
            orderBy: { codigo: 'asc' }
        });
        return NextResponse.json(permisos);
    } catch (error) {
        console.error('Error fetching permisos:', error);
        return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 });
    }
}
