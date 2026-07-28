"use client";

import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Shield } from 'lucide-react';
import { CrearUsuarioModal } from './CrearUsuarioModal';
import { GestionarPermisosModal } from './GestionarPermisosModal';

interface UsuariosViewProps {
    usuarios: any[];
    roles: { id: string, nombre: string }[];
}

export function UsuariosView({ usuarios, roles }: UsuariosViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermisosOpen, setIsPermisosOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<any>(null);

    const filteredData = usuarios.filter(u =>
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { key: 'nombre', header: 'Personal', render: (row: any) => <span className="font-bold">{row.nombre}</span> },
        { key: 'email', header: 'Correo Electrónico', render: (row: any) => row.email },
        {
            key: 'rol', header: 'Rol',
            render: (row: any) => (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-neutral-light text-secondary ">
                    {row.rol?.nombre || 'Sin Rol'}
                </span>
            )
        },
        {
            key: 'accesoSistema', header: 'Acceso ERP',
            render: (row: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.accesoSistema ? 'bg-green-100 text-green-700 ' : 'bg-red-100 text-red-700 '}`}>
                    {row.accesoSistema ? 'Concedido' : 'Revocado'}
                </span>
            )
        },
        {
            key: 'permisos', header: 'Permisos',
            render: (row: any) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Shield} 
                    onClick={() => {
                        setSelectedUsuario(row);
                        setIsPermisosOpen(true);
                    }}
                >
                    Configurar
                </Button>
            )
        }
    ];

    return (
        <>
            <ModuleTemplate
                title="Personal y Accesos"
                description="Administra los usuarios del sistema y sus roles de seguridad."
                actions={
                    <Button icon={Plus} variant="primary" onClick={() => setIsModalOpen(true)}>
                        Nuevo Usuario
                    </Button>
                }
            >
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 max-w-md">
                        <Input
                            icon={Search}
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredData}
                    emptyMessage="No se encontró personal en el sistema."
                />
            </ModuleTemplate>

            <CrearUsuarioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roles={roles}
            />

            <GestionarPermisosModal
                isOpen={isPermisosOpen}
                usuario={selectedUsuario}
                onClose={() => {
                    setIsPermisosOpen(false);
                    setSelectedUsuario(null);
                }}
            />
        </>
    );
}
