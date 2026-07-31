"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Pencil, Trash2, Save, X, Loader2, Tag } from 'lucide-react';

interface TipoAutoparte {
  id: string;
  nombre: string;
}

interface GestionarTiposModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function GestionarTiposModal({ isOpen, onClose, onRefresh }: GestionarTiposModalProps) {
  const [tipos, setTipos] = useState<TipoAutoparte[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  // Creación de nuevo tipo
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  // Edición inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [errorEditar, setErrorEditar] = useState('');

  // Eliminación
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cargarTipos = useCallback(async () => {
    setLoadingTipos(true);
    try {
      const res = await fetch('/api/tipos-autoparte');
      if (res.ok) {
        const data = await res.json();
        setTipos(data);
      }
    } catch (e) {
      console.error('Error al cargar tipos:', e);
    } finally {
      setLoadingTipos(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarTipos();
      setNuevoNombre('');
      setErrorCrear('');
      setEditandoId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen, cargarTipos]);

  // --- CREAR ---
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    if (!nombre) { setErrorCrear('El nombre es requerido'); return; }
    setCreando(true);
    setErrorCrear('');
    try {
      const res = await fetch('/api/tipos-autoparte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorCrear(json.error || 'Error al crear el tipo');
      } else {
        setNuevoNombre('');
        await cargarTipos();
        await onRefresh();
      }
    } catch {
      setErrorCrear('Error de conexión');
    } finally {
      setCreando(false);
    }
  };

  // --- EDITAR ---
  const iniciarEdicion = (tipo: TipoAutoparte) => {
    setEditandoId(tipo.id);
    setEditNombre(tipo.nombre);
    setErrorEditar('');
    setConfirmDeleteId(null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditNombre('');
    setErrorEditar('');
  };

  const handleGuardarEdicion = async (id: string) => {
    const nombre = editNombre.trim();
    if (!nombre) { setErrorEditar('El nombre es requerido'); return; }
    setGuardandoId(id);
    setErrorEditar('');
    try {
      const res = await fetch(`/api/tipos-autoparte/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorEditar(json.error || 'Error al editar');
      } else {
        setEditandoId(null);
        await cargarTipos();
        await onRefresh();
      }
    } catch {
      setErrorEditar('Error de conexión');
    } finally {
      setGuardandoId(null);
    }
  };

  // --- ELIMINAR ---
  const handleEliminar = async (id: string) => {
    setEliminandoId(id);
    try {
      const res = await fetch(`/api/tipos-autoparte/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDeleteId(null);
        await cargarTipos();
        await onRefresh();
      }
    } catch {
      console.error('Error al eliminar tipo');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Tipos de Autoparte">
      <div className="space-y-6">
        {/* --- Formulario de creación --- */}
        <div className="bg-neutral-light/60 rounded-2xl p-4 border border-white/40">
          <h4 className="font-headline font-bold text-sm text-secondary mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Nuevo Tipo de Autoparte
          </h4>
          <form onSubmit={handleCrear} className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Ej: Filtros, Frenos, Embrague..."
                value={nuevoNombre}
                onChange={(e) => { setNuevoNombre(e.target.value); setErrorCrear(''); }}
                disabled={creando}
              />
              {errorCrear && (
                <p className="text-xs text-primary mt-1 font-body">{errorCrear}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={creando || !nuevoNombre.trim()}
              className="shrink-0"
            >
              {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="ml-1">Crear</span>
            </Button>
          </form>
        </div>

        {/* --- Tabla de tipos existentes --- */}
        <div>
          <h4 className="font-headline font-bold text-sm text-secondary mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-tertiary" />
            Tipos Registrados
            <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-light text-xs font-label text-tertiary">
              {tipos.length}
            </span>
          </h4>

          {loadingTipos ? (
            <div className="flex items-center justify-center py-8 text-tertiary text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando tipos...
            </div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-8 text-tertiary text-sm font-body">
              No hay tipos de autoparte registrados.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-white/40 backdrop-blur-sm transition-all hover:bg-white/80"
                >
                  {editandoId === tipo.id ? (
                    /* --- Fila en modo edición --- */
                    <div className="flex-1 flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={editNombre}
                          onChange={(e) => { setEditNombre(e.target.value); setErrorEditar(''); }}
                          autoFocus
                          disabled={guardandoId === tipo.id}
                        />
                        {errorEditar && (
                          <p className="text-xs text-primary mt-1 font-body">{errorEditar}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleGuardarEdicion(tipo.id)}
                        disabled={guardandoId === tipo.id || !editNombre.trim()}
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        title="Guardar cambios"
                      >
                        {guardandoId === tipo.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Save className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        disabled={guardandoId === tipo.id}
                        className="p-2 rounded-xl bg-neutral-light text-tertiary hover:bg-white transition-colors disabled:opacity-50"
                        title="Cancelar edición"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : confirmDeleteId === tipo.id ? (
                    /* --- Fila en modo confirmación de eliminación --- */
                    <div className="flex-1 flex items-center gap-3">
                      <p className="flex-1 text-sm font-body text-secondary">
                        ¿Eliminar <span className="font-bold text-primary">"{tipo.nombre}"</span>?
                      </p>
                      <button
                        onClick={() => handleEliminar(tipo.id)}
                        disabled={eliminandoId === tipo.id}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-headline font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {eliminandoId === tipo.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />
                        }
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-light text-tertiary text-xs font-headline font-bold hover:bg-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    /* --- Fila normal --- */
                    <>
                      <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="flex-1 font-body text-sm text-secondary">{tipo.nombre}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => iniciarEdicion(tipo)}
                          className="p-1.5 rounded-lg text-tertiary hover:bg-neutral-light hover:text-secondary transition-colors"
                          title="Editar nombre"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(tipo.id); setEditandoId(null); }}
                          className="p-1.5 rounded-lg text-tertiary hover:bg-rose-50 hover:text-primary transition-colors"
                          title="Eliminar tipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Acciones del footer --- */}
        <div className="flex justify-end pt-2 border-t border-white/20">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
