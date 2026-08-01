"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { Lock, Loader2, Save } from 'lucide-react';
import { UserSession } from '@/components/providers/AuthProvider';

interface MiPerfilModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserSession | null;
}

export function MiPerfilModal({ isOpen, onClose, user }: MiPerfilModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSave = async () => {
        if (!user) return;
        
        if (!password) {
            toast.error('La contraseña no puede estar vacía');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/usuarios/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                toast.success('Contraseña actualizada correctamente');
                setPassword('');
                setConfirmPassword('');
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al actualizar contraseña');
            }
        } catch (error) {
            toast.error('Error de conexión al servidor');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Mi Perfil" 
            maxWidth="md"
        >
            <div className="flex flex-col gap-6">
                
                {/* User Info Display */}
                <div className="bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center border border-primary/10">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner mb-4">
                        {user.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3 className="text-xl font-bold text-secondary text-center">{user.nombre}</h3>
                    <span className="text-sm text-tertiary bg-black/5 px-3 py-1 rounded-full mt-2">
                        {user.rolNombre}
                    </span>
                </div>

                {/* Password Change Form */}
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Cambiar Contraseña
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tertiary">Nueva Contraseña</label>
                        <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-secondary"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tertiary">Confirmar Contraseña</label>
                        <input
                            type="password"
                            placeholder="Repita su nueva contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-secondary"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        icon={loading ? Loader2 : Save} 
                        onClick={handleSave}
                        disabled={loading || !password || !confirmPassword}
                    >
                        {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
