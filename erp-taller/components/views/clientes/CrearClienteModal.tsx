"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface CrearClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (nuevoCliente?: any) => void;
}

const EMPTY = { nombre: '', documento: '', telefono: '', correo: '', direccion: '' };

export function CrearClienteModal({ isOpen, onClose, onSuccess }: CrearClienteModalProps) {
    const toast = useToast();
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) { setForm(EMPTY); setError(null); }
    }, [isOpen]);

    const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
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

        setLoading(true);
        try {
            const body: any = {
                nombre: form.nombre.trim(),
                documento: form.documento.trim(),
            };
            if (form.telefono.trim()) body.telefono = form.telefono.trim();
            if (form.correo.trim()) body.correo = form.correo.trim();
            if (form.direccion.trim()) body.direccion = form.direccion.trim();

            const res = await fetch('/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const nuevoCliente = await res.json();
                toast.success(`Cliente "${form.nombre}" registrado exitosamente`);
                onSuccess(nuevoCliente);
            } else {
                const err = await res.json();
                if (err.errors) {
                    setError(err.errors.map((e: any) => e.message).join(', '));
                } else {
                    setError(err.error || 'Error al guardar el cliente');
                }
            }
        } catch {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Cliente" maxWidth="2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Razón Social / Nombre Completo *
                        </label>
                        <Input
                            required
                            placeholder="Ej. A&F Samfor S.A.C."
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
                            placeholder="Ej. 20123456789"
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
                            placeholder="Ej. 999 888 777"
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
                            placeholder="Ej. contacto@empresa.com"
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
                            placeholder="Ej. Av. Principal 123, Arequipa"
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
                            <><UserPlus className="w-4 h-4" /> Guardar Cliente</>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
