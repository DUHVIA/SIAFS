"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShoppingCart, FileText, Ban, CheckCircle, User, Calendar, Package, Loader2, CreditCard, Download } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { generarCotizacionPDF } from '@/lib/pdfGenerator';

interface VerOrdenModalProps {
    isOpen: boolean;
    ordenId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function VerOrdenModal({ isOpen, ordenId, onClose, onSuccess }: VerOrdenModalProps) {
    const { user } = useAuth();
    const toast = useToast();

    const [orden, setOrden] = useState<any | null>(null);
    const [loadingOrden, setLoadingOrden] = useState(false);
    const [metodosPago, setMetodosPago] = useState<any[]>([]);
    const [metodoPagoId, setMetodoPagoId] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const [confirmarAnular, setConfirmarAnular] = useState(false);

    useEffect(() => {
        if (!isOpen || !ordenId) return;

        setOrden(null);
        setConfirmarAnular(false);
        setMetodoPagoId('');

        const fetchData = async () => {
            setLoadingOrden(true);
            try {
                const [oRes, mRes] = await Promise.all([
                    fetch(`/api/ordenes/${ordenId}`),
                    fetch('/api/metodos-pago'),
                ]);
                if (oRes.ok) setOrden(await oRes.json());
                if (mRes.ok) setMetodosPago(await mRes.json());
            } catch {
                toast.error('Error al cargar el detalle de la orden');
            } finally {
                setLoadingOrden(false);
            }
        };

        fetchData();
    }, [isOpen, ordenId]);

    const ejecutarAccion = async (action: 'anular' | 'convertirAVenta') => {
        if (!user || !ordenId) return;
        setLoadingAction(true);
        try {
            const body: any = { action, usuarioId: user.id };
            if (action === 'convertirAVenta' && metodoPagoId) {
                body.metodoPagoId = metodoPagoId;
            }

            const res = await fetch(`/api/ordenes/${ordenId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(
                    action === 'anular'
                        ? 'Orden anulada correctamente'
                        : 'Cotización convertida a venta exitosamente'
                );
                onSuccess();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Error al procesar la acción');
            }
        } catch {
            toast.error('Error de conexión con el servidor');
        } finally {
            setLoadingAction(false);
            setConfirmarAnular(false);
        }
    };

    const fmtCurrency = (v: string | number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
            .format(typeof v === 'string' ? parseFloat(v) : v);

    const ESTADO_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
        PENDIENTE:  { label: 'Pendiente',  dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
        COMPLETADA: { label: 'Completada', dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
        ANULADA:    { label: 'Anulada',    dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
    };

    const puedeAnular = orden && orden.estado === 'PENDIENTE';
    const puedeConvertir = orden && orden.tipo === 'COTIZACION' && orden.estado === 'PENDIENTE';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={orden ? `Orden #${String(orden.numeroOrden).padStart(4, '0')}` : 'Detalle de Orden'}
            maxWidth="2xl"
        >
            {loadingOrden || !orden ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-8 w-3/4 rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {/* Cabecera de la orden */}
                    <div className="bg-neutral-light/40 rounded-2xl border border-white/30 p-4 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                {orden.tipo === 'VENTA' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                        <ShoppingCart className="w-3 h-3" /> Venta
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                        <FileText className="w-3 h-3" /> Cotización
                                    </span>
                                )}
                                {(() => {
                                    const cfg = ESTADO_CFG[orden.estado] ?? ESTADO_CFG.PENDIENTE;
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <User className="w-4 h-4 text-tertiary" />
                                <span className="font-semibold">{orden.clienteNombre}</span>
                                {orden.clienteDocumento && (
                                    <span className="text-tertiary text-xs font-label">{orden.clienteDocumento}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-tertiary">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(orden.createdAt).toLocaleDateString('es-PE', {
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </div>

                            {orden.metodoPago && (
                                <div className="flex items-center gap-2 text-xs text-tertiary">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Pago: <span className="font-semibold text-secondary">{orden.metodoPago.nombre}</span>
                                </div>
                            )}
                        </div>

                        <div className="text-right flex flex-col justify-center">
                            <p className="text-xs text-tertiary uppercase tracking-wider font-label">Total</p>
                            <p className="font-headline text-3xl font-bold text-primary">
                                {fmtCurrency(orden.total)}
                            </p>
                        </div>
                    </div>

                    {/* Tabla de ítems */}
                    <div>
                        <h3 className="text-xs font-label uppercase tracking-wider text-tertiary mb-2 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> Productos ({orden.detalles.length})
                        </h3>
                        <div className="rounded-2xl border border-white/20 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-neutral-light/40 border-b border-white/20">
                                        <th className="px-3 py-2.5 text-left text-xs font-label uppercase tracking-wider text-tertiary">Producto</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-label uppercase tracking-wider text-tertiary">Cant.</th>
                                        <th className="px-3 py-2.5 text-right text-xs font-label uppercase tracking-wider text-tertiary">P. Unit.</th>
                                        <th className="px-3 py-2.5 text-right text-xs font-label uppercase tracking-wider text-tertiary">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orden.detalles.map((d: any, idx: number) => (
                                        <tr key={d.id} className={`border-b border-white/10 ${idx % 2 !== 0 ? 'bg-neutral-light/20' : ''}`}>
                                            <td className="px-3 py-2.5">
                                                <span className="font-medium text-secondary">{d.productoNombre}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="font-label text-xs bg-white/60 border border-white/20 px-2 py-0.5 rounded-lg">
                                                    {d.cantidad}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-secondary">
                                                {fmtCurrency(d.precioUnitario)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold text-secondary">
                                                {fmtCurrency(d.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-neutral-light/40 border-t border-white/20">
                                        <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-label uppercase tracking-wider text-tertiary">
                                            Total
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-headline font-bold text-primary">
                                            {fmtCurrency(orden.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Acciones */}
                    {(puedeConvertir || puedeAnular) && (
                        <div className="border-t border-white/20 pt-4 flex flex-col gap-3">
                            {puedeConvertir && (
                                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-blue-700">Convertir a Venta</p>
                                        <p className="text-xs text-blue-500 mt-0.5">El cliente acepta la cotización. Se descontará el stock.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {metodosPago.length > 0 && (
                                            <Select
                                                value={metodoPagoId}
                                                onChange={e => setMetodoPagoId(e.target.value)}
                                                options={[
                                                    { value: '', label: 'Sin método' },
                                                    ...metodosPago.map(m => ({ value: m.id, label: m.nombre }))
                                                ]}
                                            />
                                        )}
                                        <Button
                                            variant="primary"
                                            onClick={() => ejecutarAccion('convertirAVenta')}
                                            disabled={loadingAction}
                                        >
                                            {loadingAction ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <><CheckCircle className="w-4 h-4" /> Convertir a Venta</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {puedeAnular && (
                                <div className="flex justify-end">
                                    {!confirmarAnular ? (
                                        <Button
                                            variant="ghost"
                                            icon={Ban}
                                            onClick={() => setConfirmarAnular(true)}
                                            disabled={loadingAction}
                                        >
                                            Anular orden
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
                                            <span className="text-xs text-red-600 font-medium">¿Confirmar anulación?</span>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => ejecutarAccion('anular')}
                                                disabled={loadingAction}
                                            >
                                                {loadingAction ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí, anular'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfirmarAnular(false)}
                                                disabled={loadingAction}
                                            >
                                                No
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer de cierre */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                        <Button 
                            variant="outline" 
                            icon={Download}
                            onClick={() => {
                                generarCotizacionPDF({
                                    tipo: orden.tipo as 'COTIZACION' | 'VENTA',
                                    numeroOrden: orden.numeroOrden,
                                    clienteNombre: orden.clienteNombre,
                                    clienteDocumento: orden.clienteDocumento,
                                    fecha: orden.createdAt,
                                    detalles: orden.detalles,
                                    total: orden.total
                                });
                            }}
                        >
                            Exportar PDF
                        </Button>
                        <Button variant="secondary" onClick={onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
