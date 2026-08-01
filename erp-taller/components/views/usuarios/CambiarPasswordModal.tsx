"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface CambiarPasswordModalProps {
  isOpen: boolean;
  usuario: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CambiarPasswordModal({ isOpen, usuario, onClose, onSuccess }: CambiarPasswordModalProps) {
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usuario) return;

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success(`Contraseña actualizada para ${usuario.nombre}`);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al actualizar la contraseña');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cambiar Contraseña - ${usuario?.nombre || ''}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-body">
        <div>
          <label className="text-xs text-tertiary font-medium mb-1.5 block">Nueva Contraseña</label>
          <Input
            required
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs text-tertiary font-medium mb-1.5 block">Confirmar Nueva Contraseña</label>
          <Input
            required
            type="password"
            placeholder="Repita la nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-primary font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" icon={loading ? undefined : KeyRound} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Actualizando...
              </>
            ) : (
              'Guardar Contraseña'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
