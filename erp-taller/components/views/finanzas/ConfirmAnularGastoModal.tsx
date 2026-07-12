"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2 } from 'lucide-react';

interface ConfirmAnularGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto: any | null;
}

export function ConfirmAnularGastoModal({ isOpen, onClose, onSuccess, gasto }: ConfirmAnularGastoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!gasto) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error al anular el gasto');
      }
    } catch (error) {
      console.error(error);
      setError('Error de red al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anular Gasto de Caja Chica" maxWidth="md">
      <div className="space-y-4">
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-headline font-bold text-sm text-secondary">¿Estás seguro de anular este gasto?</p>
            <p className="text-xs text-tertiary mt-1">
              El gasto por motivo <span className="font-bold text-secondary">"{gasto?.motivo}"</span> de monto <span className="font-bold text-secondary">{fmtCurrency(parseFloat(gasto?.monto || '0'))}</span> será marcado como inactivo. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-light/50">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Anulando...
              </>
            ) : (
              'Anular Gasto'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
