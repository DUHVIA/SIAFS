"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UserPlus, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';

interface CrearUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    roles: { id: string, nombre: string }[];
}

export function CrearUsuarioModal({ isOpen, onClose, roles }: CrearUsuarioModalProps) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [rolId, setRolId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSelectOpen, setIsSelectOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí se conectaría la Server Action para crear el usuario
        alert(`Usuario ${nombre} creado existosamente.`);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Miembro del Personal" maxWidth="2xl">
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

                    <div className="md:col-span-2 relative">
                        <label className="text-xs text-tertiary font-medium mb-1 block">Rol de Sistema</label>
                        <div className="relative">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm px-4 py-3 font-body text-sm text-secondary outline-none focus:border-primary/50"
                                onClick={() => setIsSelectOpen(!isSelectOpen)}
                            >
                                {rolId ? roles.find(r => r.id === rolId)?.nombre : <span className="text-tertiary">Seleccionar rol...</span>}
                                <ChevronDown className="w-4 h-4 text-tertiary" />
                            </button>
                            {isSelectOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden z-50 p-1">
                                    {roles.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl flex items-center justify-between transition-colors ${rolId === r.id ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-neutral-light'}`}
                                            onClick={() => { setRolId(r.id); setIsSelectOpen(false); }}
                                        >
                                            {r.nombre}
                                            {rolId === r.id && <Check className="w-4 h-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Hidden input to ensure required validation passes if using native form submission */}
                        <input type="hidden" required value={rolId} onChange={() => {}} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/20 ">
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" variant="primary" icon={UserPlus}>Crear Usuario</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
