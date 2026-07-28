import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PermisosArraySchema = z.array(z.string());

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const usuarioPermisos = await prisma.usuarioPermiso.findMany({
            where: { usuarioId: id },
            include: { permiso: true }
        });
        
        const permisos = usuarioPermisos.map(up => up.permiso);
        return NextResponse.json(permisos);
    } catch (error) {
        console.error('Error fetching usuario permisos:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const json = await request.json();
        const permisosIds = PermisosArraySchema.parse(json.permisosIds);

        // Transaction para borrar todos y reinsertar
        await prisma.$transaction(async (tx) => {
            // Eliminar los permisos actuales del usuario
            await tx.usuarioPermiso.deleteMany({
                where: { usuarioId: id }
            });

            // Insertar los nuevos permisos
            if (permisosIds.length > 0) {
                await tx.usuarioPermiso.createMany({
                    data: permisosIds.map(permisoId => ({
                        usuarioId: id,
                        permisoId: permisoId
                    }))
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating usuario permisos:', error);
        return NextResponse.json({ error: 'Error al guardar permisos' }, { status: 500 });
    }
}
