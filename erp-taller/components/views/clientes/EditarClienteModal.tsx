"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface EditarClienteModalProps {
    isOpen: boolean;
    cliente: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditarClienteModal({ isOpen, cliente, onClose, onSuccess }: EditarClienteModalProps) {
    const toast = useToast();
    const [form, setForm] = useState({ nombre: '', documento: '', telefono: '', correo: '', direccion: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-llenar formulario cuando llega el cliente
    useEffect(() => {
        if (isOpen && cliente) {
            setForm({
                nombre:    cliente.nombre    || '',
                documento: cliente.documento || '',
                telefono:  cliente.telefono  || '',
                correo:    cliente.correo    || '',
                direccion: cliente.direccion || '',
            });
            setError(null);
        }
    }, [isOpen, cliente]);

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
        if (!form.documento.trim()) { setError('El documento es requerido'); return; }
        if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
            setError('El correo electrónico no tiene un formato válido');
            return;
        }
        if (!cliente) return;

        setLoading(true);
        try {
            const body: any = {
                nombre:    form.nombre.trim(),
                documento: form.documento.trim(),
                telefono:  form.telefono.trim() || null,
                correo:    form.correo.trim()    || null,
                direccion: form.direccion.trim() || null,
            };

            const res = await fetch(`/api/clientes/${cliente.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success('Cliente actualizado correctamente');
                onSuccess();
            } else {
                const err = await res.json();
                if (err.errors) {
                    setError(err.errors.map((e: any) => e.message).join(', '));
                } else {
                    setError(err.error || 'Error al actualizar el cliente');
                }
            }
        } catch {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente" maxWidth="2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {cliente && (
                    <div className="px-3 py-2 bg-neutral-light/60 rounded-xl border border-white/20">
                        <p className="text-xs text-tertiary">Editando cliente:</p>
                        <p className="font-headline font-bold text-secondary">{cliente.nombre}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Razón Social / Nombre Completo *
                        </label>
                        <Input
                            required
                            value={form.nombre}
                            onChange={set('nombre')}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Documento (DNI / RUC) *
                        </label>
                        <Input
                            required
                            value={form.documento}
                            onChange={set('documento')}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Teléfono
                        </label>
                        <Input
                            type="tel"
                            placeholder="Opcional"
                            value={form.telefono}
                            onChange={set('telefono')}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Correo Electrónico
                        </label>
                        <Input
                            type="email"
                            placeholder="Opcional"
                            value={form.correo}
                            onChange={set('correo')}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Dirección
                        </label>
                        <Input
                            placeholder="Opcional"
                            value={form.direccion}
                            onChange={set('direccion')}
                            disabled={loading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Guardar Cambios</>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
