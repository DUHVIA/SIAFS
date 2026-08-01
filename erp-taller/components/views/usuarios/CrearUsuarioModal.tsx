"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserPlus, Eye, EyeOff, Loader2, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useRouter } from 'next/navigation';

interface CrearUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    roles: { id: string, nombre: string }[];
}

export function CrearUsuarioModal({ isOpen, onClose, onSuccess, roles }: CrearUsuarioModalProps) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [rolId, setRolId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados post-creación
    const [createdUser, setCreatedUser] = useState<any>(null);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    
    const toast = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!rolId) {
            toast.error('Por favor, selecciona un rol');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    email,
                    password,
                    rolId,
                    accesoSistema: true,
                    isActive: true
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                toast.error(errData.error || 'Error al crear el usuario');
            } else {
                const data = await res.json();
                toast.success(`Usuario ${nombre} creado exitosamente.`);
                
                // Generar el enlace de invitación
                try {
                    const inviteRes = await fetch(`/api/usuarios/${data.id}/invitacion`);
                    if (inviteRes.ok) {
                        const inviteData = await inviteRes.json();
                        setInviteLink(inviteData.link);
                    }
                } catch (e) {
                    console.error('Error al generar enlace:', e);
                }

                setCreatedUser(data);
                onSuccess?.();
                router.refresh();
            }
        } catch (error) {
            toast.error('Error de conexión al crear usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteLink) return;
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Enlace copiado");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        // Reset states
        setNombre('');
        setEmail('');
        setPassword('');
        setRolId('');
        setCreatedUser(null);
        setInviteLink('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={createdUser ? "¡Usuario Creado!" : "Nuevo Miembro del Personal"} maxWidth="2xl">
            {createdUser ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-2">{createdUser.nombre} está listo</h3>
                    <p className="text-tertiary text-sm mb-6 max-w-md">
                        El usuario ha sido creado. Copia este enlace de invitación de un solo uso y envíaselo para que establezca su propia contraseña de forma segura.
                    </p>
                    
                    {inviteLink ? (
                        <div className="w-full flex items-center gap-2 mb-6 bg-primary/5 border border-primary/20 p-2 rounded-xl">
                            <Input 
                                value={inviteLink} 
                                readOnly 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-primary truncate"
                            />
                            <Button 
                                variant={copied ? "primary" : "ghost"} 
                                onClick={handleCopy}
                                icon={copied ? Check : Copy}
                                className={copied ? "bg-green-500 hover:bg-green-600 text-white" : "text-primary"}
                            >
                                {copied ? 'Copiado' : 'Copiar'}
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-500/10 text-yellow-600 rounded-xl mb-6 text-sm">
                            No se pudo generar el enlace de invitación automáticamente.
                        </div>
                    )}
                    
                    <Button variant="primary" onClick={handleClose} className="w-full sm:w-auto">
                        Cerrar y Continuar
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-tertiary font-medium mb-1 block">Nombre Completo</label>
                            <Input
                                required
                                placeholder="Ej. Juan Pérez"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-tertiary font-medium mb-1 block">Correo (Usuario de Acceso)</label>
                            <Input
                                required
                                type="email"
                                autoComplete="new-password"
                                placeholder="Ej. juan@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-tertiary font-medium mb-1 block">Contraseña Temporal</label>
                            <div className="relative">
                                <Input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs text-tertiary font-medium mb-3 block">Rol de Sistema (Permisos Base)</label>
                            <div className="flex flex-wrap gap-3">
                                {roles.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRolId(r.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                                            rolId === r.id 
                                            ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20' 
                                            : 'bg-white/50 border-white/40 text-tertiary hover:bg-white/80 hover:text-secondary'
                                        }`}
                                    >
                                        {r.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/20 ">
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" variant="primary" icon={isSubmitting ? Loader2 : UserPlus} disabled={isSubmitting}>
                                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
}
