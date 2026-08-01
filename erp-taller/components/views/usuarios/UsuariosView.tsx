"use client";

import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Shield, KeyRound, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { CrearUsuarioModal } from './CrearUsuarioModal';
import { GestionarPermisosModal } from './GestionarPermisosModal';
import { CambiarPasswordModal } from './CambiarPasswordModal';

interface UsuariosViewProps {
    usuarios: any[];
    roles: { id: string, nombre: string }[];
}

export function UsuariosView({ usuarios: initialUsuarios, roles }: UsuariosViewProps) {
    const { user: currentUser } = useAuth();
    const toast = useToast();

    const [usuariosList, setUsuariosList] = useState<any[]>(initialUsuarios);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingToggle, setLoadingToggle] = useState<string | null>(null);

    // Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermisosOpen, setIsPermisosOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<any>(null);

    const refreshUsuarios = async () => {
        try {
            const res = await fetch('/api/usuarios');
            if (res.ok) {
                const data = await res.json();
                setUsuariosList(data);
            }
        } catch (e) {
            console.error('Error al recargar usuarios:', e);
        }
    };

    /**
     * Valida si el usuario actual tiene permisos para modificar al usuario objetivo (Task 5).
     */
    const validarPermisoModificar = (targetUser: any): boolean => {
        if (!currentUser) return false;

        // 1. Un usuario no puede modificarse a sí mismo
        if (targetUser.id === currentUser.id) {
            toast.error("No puedes modificar tu propia cuenta, contraseña ni permisos desde este panel.");
            return false;
        }

        // 2. Solo un DUEÑO puede modificar a otro usuario con el rol DUEÑO
        if (targetUser.rol?.nombre === 'DUEÑO' && currentUser.rolNombre !== 'DUEÑO') {
            toast.error("No tienes autorización para modificar a un usuario con el rol DUEÑO.");
            return false;
        }

        return true;
    };

    const handleToggleAcceso = async (targetUser: any) => {
        if (!validarPermisoModificar(targetUser)) return;

        const nuevoAcceso = !targetUser.accesoSistema;
        setLoadingToggle(targetUser.id);
        try {
          const res = await fetch(`/api/usuarios/${targetUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accesoSistema: nuevoAcceso }),
          });

          if (res.ok) {
            toast.success(`Acceso ${nuevoAcceso ? 'concedido' : 'revocado'} para ${targetUser.nombre}`);
            refreshUsuarios();
          } else {
            const err = await res.json();
            toast.error(err.error || 'Error al cambiar estado de acceso');
          }
        } catch {
          toast.error('Error de conexión con el servidor');
        } finally {
          setLoadingToggle(null);
        }
    };

    const handleAbrirPermisos = (targetUser: any) => {
        if (!validarPermisoModificar(targetUser)) return;
        setSelectedUsuario(targetUser);
        setIsPermisosOpen(true);
    };

    const handleAbrirPassword = (targetUser: any) => {
        if (!validarPermisoModificar(targetUser)) return;
        setSelectedUsuario(targetUser);
        setIsPasswordOpen(true);
    };

    const filteredData = usuariosList.filter(u =>
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { key: 'nombre', header: 'Personal', render: (row: any) => <span className="font-bold">{row.nombre}</span> },
        { key: 'email', header: 'Correo Electrónico', render: (row: any) => row.email },
        {
            key: 'rol', header: 'Rol',
            render: (row: any) => (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-light border border-white/40 text-secondary">
                    {row.rol?.nombre || 'Sin Rol'}
                </span>
            )
        },
        {
            key: 'accesoSistema', header: 'Acceso ERP',
            render: (row: any) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.accesoSistema ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                    {row.accesoSistema ? 'Concedido' : 'Inhabilitado'}
                </span>
            )
        },
        {
            key: 'acciones', header: 'Acciones',
            render: (row: any) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={KeyRound}
                        onClick={() => handleAbrirPassword(row)}
                        title="Cambiar Contraseña"
                        className="hover:text-primary"
                    >
                        Contraseña
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Shield} 
                        onClick={() => handleAbrirPermisos(row)}
                        title="Configurar Permisos"
                    >
                        Permisos
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={row.accesoSistema ? UserX : UserCheck} 
                        onClick={() => handleToggleAcceso(row)}
                        disabled={loadingToggle === row.id}
                        title={row.accesoSistema ? 'Inhabilitar Acceso' : 'Habilitar Acceso'}
                        className={row.accesoSistema ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-green-600 hover:bg-green-50'}
                    >
                        {row.accesoSistema ? 'Inhabilitar' : 'Habilitar'}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <>
            <ModuleTemplate
                title="Personal y Accesos"
                description="Administra los usuarios del sistema, contraseñas y sus roles de seguridad."
                actions={
                    <Button icon={Plus} variant="primary" onClick={() => setIsModalOpen(true)}>
                        Nuevo Usuario
                    </Button>
                }
            >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex-1 max-w-md w-full">
                        <Input
                            icon={Search}
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={refreshUsuarios} title="Actualizar lista">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
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
                onSuccess={refreshUsuarios}
            />

            <GestionarPermisosModal
                isOpen={isPermisosOpen}
                usuario={selectedUsuario}
                onClose={() => {
                    setIsPermisosOpen(false);
                    setSelectedUsuario(null);
                }}
            />

            <CambiarPasswordModal
                isOpen={isPasswordOpen}
                usuario={selectedUsuario}
                onClose={() => {
                    setIsPasswordOpen(false);
                    setSelectedUsuario(null);
                }}
                onSuccess={refreshUsuarios}
            />
        </>
    );
}
