"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface EditarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto: any | null;
}

export function EditarGastoModal({ isOpen, onClose, onSuccess, gasto }: EditarGastoModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [motivo, setMotivo] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del gasto al abrir
  useEffect(() => {
    if (isOpen && gasto) {
      setMotivo(gasto.motivo || '');
      setMonto(gasto.monto || '');
      setError(null);
      
      const gastoDate = new Date(gasto.fecha);
      const yyyy = gastoDate.getFullYear();
      const mm = String(gastoDate.getMonth() + 1).padStart(2, '0');
      const dd = String(gastoDate.getDate()).padStart(2, '0');
      setFecha(`${yyyy}-${mm}-${dd}`);
    }
  }, [isOpen, gasto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gasto) return;

    if (!user) {
      setError('Sesión de usuario no válida');
      return;
    }

    const valorMonto = parseFloat(monto);
    if (isNaN(valorMonto) || valorMonto <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    setLoading(true);
    try {
      const [yyyy, mm, dd] = fecha.split('-').map(Number);
      const fechaLocal = new Date(yyyy, mm - 1, dd, 12, 0, 0);

      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: user.id,
          motivo: motivo.trim(),
          monto: valorMonto,
          fecha: fechaLocal.toISOString(),
        }),
      });

      if (res.ok) {
        toast.success('Gasto actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al actualizar el gasto');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Gasto Interno" maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-tertiary font-medium mb-1.5 block">Motivo del Gasto</label>
          <Input
            required
            placeholder="Ej. Compra de suministros de limpieza"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-tertiary font-medium mb-1.5 block">Monto (S/.)</label>
            <Input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1.5 block">Fecha</label>
            <Input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-primary font-medium font-body">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/20">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={loading ? undefined : Wallet} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
