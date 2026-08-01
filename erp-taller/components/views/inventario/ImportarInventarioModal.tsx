"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface ImportarInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportarInventarioModal({ isOpen, onClose, onSuccess }: ImportarInventarioModalProps) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; tiposCreados: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        setError('Por favor selecciona un archivo con extensión .xlsx o .xls');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Debes seleccionar un archivo Excel para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/inventario/importar', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar la importación del inventario');
      }

      setResult({ count: json.count || 0, tiposCreados: json.tiposCreados || 0 });
      toast.success(`Importación masiva completada: ${json.count} productos guardados.`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setResult(null);
      }, 1800);
    } catch (err: any) {
      console.error('Error al importar:', err);
      setError(err.message || 'Ocurrió un error durante el proceso de importación.');
      toast.error('Error al importar el archivo Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Inventario desde Excel"
      maxWidth="md"
    >
      <div className="space-y-6 mt-4">
        {/* Zona de Drop & Pick de Archivo */}
        <div className="border-2 border-dashed border-primary/30 rounded-3xl p-8 text-center bg-neutral-light/40 hover:bg-neutral-light transition-all flex flex-col items-center justify-center cursor-pointer relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          {file ? (
            <div>
              <p className="font-headline font-bold text-secondary text-sm">{file.name}</p>
              <p className="text-xs text-tertiary mt-1">{(file.size / 1024).toFixed(1)} KB — Listo para importar</p>
            </div>
          ) : (
            <div>
              <p className="font-headline font-bold text-secondary text-sm">Haz clic o arrastra tu archivo Excel aquí</p>
              <p className="text-xs text-tertiary mt-1">Soporta formatos .xlsx y .xls (Control Inventario o Plantilla SIAFS)</p>
            </div>
          )}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs flex items-center gap-2 font-body">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resultado Exitoso */}
        {result && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2 font-body">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">¡Importación Completada!</p>
              <p>{result.count} productos registrados en catálogo, {result.tiposCreados} nuevos tipos de autoparte.</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              'Iniciar Importación'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
