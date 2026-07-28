import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requirePermission(permissionCode: string) {
    const headersList = await headers();
    const permissionsHeader = headersList.get('x-user-permissions');

    if (!permissionsHeader) {
        return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
    }

    try {
        const permissions: string[] = JSON.parse(permissionsHeader);
        if (!permissions.includes(permissionCode)) {
            return { error: NextResponse.json({ error: 'Permiso denegado' }, { status: 403 }) };
        }
        return { success: true };
    } catch (e) {
        return { error: NextResponse.json({ error: 'Error procesando permisos' }, { status: 500 }) };
    }
}

export async function getUserId() {
    const headersList = await headers();
    return headersList.get('x-user-id');
}
