"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: any | null;
}

export function RestockModal({ isOpen, onClose, onSuccess, producto }: RestockModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState('Reposición de mercadería');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCantidad('');
            setMotivo('Reposición de mercadería');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!cantidad.trim()) {
            setError('La cantidad es requerida');
            return;
        }
        if (!/^\d+$/.test(cantidad) || parseInt(cantidad, 10) <= 0) {
            setError('La cantidad debe ser un número entero mayor a 0');
            return;
        }
        if (!motivo.trim()) {
            setError('El motivo es requerido');
            return;
        }
        if (!user || !producto) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/productos/${producto.id}/restock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: user.id,
                    cantidad,
                    motivo: motivo.trim()
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                setError(errData.error || 'Error al registrar la reposición');
            }
        } catch (error) {
            console.error(error);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reabastecer Stock de Producto" maxWidth="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-xs text-tertiary uppercase tracking-wider font-semibold">Producto a reabastecer</p>
                    <p className="font-headline font-bold text-lg text-secondary mt-1">{producto?.nombre}</p>
                    <p className="text-sm text-tertiary">
                        Stock actual: <span className="font-bold text-secondary">{producto?.stock} unidades</span>
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                        Cantidad a Ingresar *
                    </label>
                    <Input
                        type="number"
                        placeholder="Ej. 50"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                        Motivo del Ingreso *
                    </label>
                    <Input
                        placeholder="Ej. Compra Lote 45"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-light/50">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading || !cantidad.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" /> Registrar Reposición
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
