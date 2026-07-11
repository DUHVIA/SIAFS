"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: any | null;
}

export function ConfirmDeleteModal({ isOpen, onClose, onSuccess, producto }: ConfirmDeleteModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!producto) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/productos/${producto.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                setError(errData.error || 'Error al archivar el producto');
            }
        } catch (error) {
            console.error(error);
            setError('Error de red al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Archivar Producto" maxWidth="md">
            <div className="space-y-4">
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-headline font-bold text-sm text-secondary">¿Estás seguro de archivar este producto?</p>
                        <p className="text-xs text-tertiary mt-1">
                            El producto <span className="font-bold text-secondary">"{producto?.nombre}"</span> será retirado del catálogo activo y no aparecerá en nuevas cotizaciones. Su historial de ventas pasadas permanecerá intacto en el sistema.
                        </p>
                    </div>
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
                    <Button type="button" variant="danger" onClick={handleConfirm} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Archivando...
                            </>
                        ) : (
                            <>
                                Archivar Producto
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
