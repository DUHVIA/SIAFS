"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface GestionarPermisosModalProps {
    isOpen: boolean;
    usuario: any | null;
    onClose: () => void;
}

export function GestionarPermisosModal({ isOpen, usuario, onClose }: GestionarPermisosModalProps) {
    const toast = useToast();
    
    const [permisosGlobales, setPermisosGlobales] = useState<any[]>([]);
    const [permisosUsuario, setPermisosUsuario] = useState<string[]>([]);
    
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !usuario) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch todos los permisos
                const resAll = await fetch('/api/permisos');
                const allPermisos = await resAll.json();
                
                // Fetch permisos del usuario
                const resUser = await fetch(`/api/usuarios/${usuario.id}/permisos`);
                const userPermisos = await resUser.json();
                
                setPermisosGlobales(allPermisos);
                setPermisosUsuario(userPermisos.map((p: any) => p.id));
            } catch (error) {
                toast.error('Error al cargar los permisos');
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [isOpen, usuario]);

    const handleToggle = (permisoId: string) => {
        setPermisosUsuario(prev => 
            prev.includes(permisoId) 
                ? prev.filter(id => id !== permisoId)
                : [...prev, permisoId]
        );
    };

    const handleSave = async () => {
        if (!usuario) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/usuarios/${usuario.id}/permisos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permisosIds: permisosUsuario })
            });

            if (res.ok) {
                toast.success('Permisos actualizados correctamente');
                onClose();
            } else {
                toast.error('No se pudieron guardar los permisos');
            }
        } catch (error) {
            toast.error('Error de conexión al guardar permisos');
        } finally {
            setSaving(false);
        }
    };

    // Agrupar permisos de forma sencilla adivinando el prefijo del código (ej. VER_DASHBOARD -> DASHBOARD)
    const agrupados = permisosGlobales.reduce((acc, permiso) => {
        const partes = permiso.codigo.split('_');
        const modulo = partes.length > 1 ? partes[partes.length - 1] : 'GENERAL';
        
        if (!acc[modulo]) acc[modulo] = [];
        acc[modulo].push(permiso);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={usuario ? `Permisos: ${usuario.nombre}` : 'Gestionar Permisos'} 
            maxWidth="3xl"
        >
            {loadingData ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <p className="text-sm text-tertiary">
                        Activa o desactiva los módulos a los que este usuario tiene acceso. 
                        Estos permisos son individuales y sobrescriben las reglas de su rol.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {Object.entries(agrupados).map(([modulo, permisosLista]) => (
                            <div key={modulo} className="bg-neutral-light/30 border border-white/20 rounded-2xl p-4">
                                <h3 className="font-headline font-bold text-secondary mb-3 pb-2 border-b border-white/30 text-sm">
                                    MÓDULO: {modulo}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {permisosLista.map(permiso => {
                                        const hasPerm = permisosUsuario.includes(permiso.id);
                                        return (
                                            <label key={permiso.id} className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                                                    {permiso.codigo.replace(/_/g, ' ')}
                                                </span>
                                                
                                                <div className="relative inline-flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={hasPerm}
                                                        onChange={() => handleToggle(permiso.id)}
                                                    />
                                                    <div className="w-11 h-6 bg-white/60 border border-white/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            icon={saving ? Loader2 : Shield} 
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Permisos'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
