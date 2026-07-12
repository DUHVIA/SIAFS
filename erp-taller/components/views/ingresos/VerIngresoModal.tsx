"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';
import { ArrowDownToLine, Clock, User, FileText, Loader2 } from 'lucide-react';

interface DetalleItem {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface IngresoDetalle {
  id: string;
  fechaIngreso: string;
  usuarioNombre: string;
  descripcion: string;
  total: string;
  detalles: DetalleItem[];
}

interface VerIngresoModalProps {
  isOpen: boolean;
  ingresoId: string;
  onClose: () => void;
}

export function VerIngresoModal({ isOpen, ingresoId, onClose }: VerIngresoModalProps) {
  const toast = useToast();
  const [ingreso, setIngreso] = useState<IngresoDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !ingresoId) return;

    const fetchIngresoDetalle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ingresos/${ingresoId}`);
        if (res.ok) {
          const data = await res.json();
          setIngreso(data);
        } else {
          toast.error('Error al cargar detalles del lote de compra');
          onClose();
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de conexión con el servidor');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchIngresoDetalle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ingresoId]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Lote de Compra"
      maxWidth="2xl"
    >
      {loading ? (
        <div className="flex flex-col gap-4 py-4">
          <Skeleton className="h-6 w-1/3 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : ingreso ? (
        <div className="flex flex-col gap-5">
          {/* Cabecera Técnica */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-light/50 border border-white/20 rounded-2xl shadow-sm">
            <div>
              <p className="text-[10px] text-tertiary font-label uppercase tracking-wider">Código del Lote</p>
              <p className="font-label text-xs text-secondary font-bold select-all">{ingreso.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-tertiary font-label uppercase tracking-wider">Total de Compra</p>
              <p className="text-xl font-headline font-bold text-secondary">{fmtCurrency(parseFloat(ingreso.total || '0'))}</p>
            </div>
          </div>

          {/* Información del Lote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white/40 border border-white/10 rounded-xl">
              <Clock className="w-5 h-5 text-blue-500 opacity-80" />
              <div>
                <p className="text-[10px] text-tertiary font-body font-semibold uppercase tracking-wider">Fecha y Hora</p>
                <p className="text-xs text-secondary font-body font-medium">
                  {new Date(ingreso.fechaIngreso).toLocaleString('es-PE')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/40 border border-white/10 rounded-xl">
              <User className="w-5 h-5 text-primary opacity-80" />
              <div>
                <p className="text-[10px] text-tertiary font-body font-semibold uppercase tracking-wider">Registrado por</p>
                <p className="text-xs text-secondary font-body font-medium">{ingreso.usuarioNombre}</p>
              </div>
            </div>
          </div>

          {/* Notas / Descripción */}
          <div className="p-3 bg-white/40 border border-white/10 rounded-xl flex gap-3">
            <FileText className="w-5 h-5 text-tertiary opacity-80 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-tertiary font-body font-semibold uppercase tracking-wider">Notas / Proveedor</p>
              <p className="text-xs text-secondary font-body mt-0.5 whitespace-pre-line leading-relaxed">
                {ingreso.descripcion || 'Sin notas descriptivas en este lote.'}
              </p>
            </div>
          </div>

          {/* Tabla de Productos del Lote */}
          <div>
            <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2 font-headline">
              Productos Ingresados
            </h4>
            <div className="border border-white/20 rounded-2xl overflow-hidden bg-white/40 shadow-soft">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-light/40 border-b border-white/20 font-label uppercase tracking-wider text-tertiary">
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5 w-24 text-center">Cantidad</th>
                    <th className="px-4 py-2.5 w-28 text-right">Costo Unit.</th>
                    <th className="px-4 py-2.5 w-28 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {ingreso.detalles.map(d => (
                    <tr key={d.id} className="border-b border-white/10 hover:bg-white/40 transition-colors">
                      <td className="px-4 py-2.5 text-secondary font-body font-medium">
                        {d.productoNombre}
                      </td>
                      <td className="px-4 py-2.5 text-center text-secondary font-label">
                        {d.cantidad}
                      </td>
                      <td className="px-4 py-2.5 text-right text-secondary font-label">
                        {fmtCurrency(d.costoUnitario)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-label font-semibold text-secondary">
                        {fmtCurrency(d.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end pt-2 border-t border-white/20 mt-1">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-tertiary">
          No se pudo encontrar la información del lote.
        </div>
      )}
    </Modal>
  );
}
