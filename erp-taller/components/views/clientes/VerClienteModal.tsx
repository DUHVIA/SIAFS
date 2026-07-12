"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    User, Phone, Mail, MapPin, Edit3, ShoppingCart, FileText,
    Calendar, Hash, Package
} from 'lucide-react';

interface VerClienteModalProps {
    isOpen: boolean;
    cliente: any | null;
    onClose: () => void;
    onEditarClick: () => void;
}

const ESTADO_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    PENDIENTE:  { label: 'Pendiente',  dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    COMPLETADA: { label: 'Completada', dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    ANULADA:    { label: 'Anulada',    dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
};

export function VerClienteModal({ isOpen, cliente, onClose, onEditarClick }: VerClienteModalProps) {
    const [ordenes, setOrdenes] = useState<any[]>([]);
    const [loadingOrdenes, setLoadingOrdenes] = useState(false);
    const [totalGastado, setTotalGastado] = useState(0);

    useEffect(() => {
        if (!isOpen || !cliente) return;
        setOrdenes([]);

        const fetchOrdenes = async () => {
            setLoadingOrdenes(true);
            try {
                const res = await fetch(`/api/ordenes?clienteId=${cliente.id}&limit=100`);
                if (res.ok) {
                    const data = await res.json();
                    const items = data.items || [];
                    setOrdenes(items);
                    const total = items
                        .filter((o: any) => o.tipo === 'VENTA' && o.estado === 'COMPLETADA')
                        .reduce((s: number, o: any) => s + parseFloat(o.total || '0'), 0);
                    setTotalGastado(total);
                }
            } catch {
                // No-op: tabla quedará vacía
            } finally {
                setLoadingOrdenes(false);
            }
        };

        fetchOrdenes();
    }, [isOpen, cliente]);

    const fmtCurrency = (v: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

    if (!cliente) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha del Cliente"
            maxWidth="2xl"
        >
            <div className="flex flex-col gap-5">
                {/* Perfil del cliente */}
                <div className="bg-neutral-light/40 rounded-2xl border border-white/30 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-headline font-bold text-xl text-secondary">{cliente.nombre}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Hash className="w-3.5 h-3.5 text-tertiary" />
                                    <span className="font-label text-sm text-tertiary">{cliente.documento}</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" icon={Edit3} onClick={onEditarClick}>
                            Editar
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        {cliente.telefono && (
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <Phone className="w-4 h-4 text-tertiary flex-shrink-0" />
                                <span>{cliente.telefono}</span>
                            </div>
                        )}
                        {cliente.correo && (
                            <div className="flex items-center gap-2 text-sm text-secondary truncate">
                                <Mail className="w-4 h-4 text-tertiary flex-shrink-0" />
                                <span className="truncate">{cliente.correo}</span>
                            </div>
                        )}
                        {cliente.direccion && (
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <MapPin className="w-4 h-4 text-tertiary flex-shrink-0" />
                                <span className="truncate">{cliente.direccion}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-tertiary">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>
                                Cliente desde {new Date(cliente.createdAt).toLocaleDateString('es-PE', {
                                    month: 'long', year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/70 border border-white/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-tertiary uppercase tracking-wider font-label">Órdenes</p>
                        <p className="font-headline text-2xl font-bold text-secondary mt-1">
                            {loadingOrdenes ? '—' : ordenes.length}
                        </p>
                    </div>
                    <div className="bg-white/70 border border-white/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-tertiary uppercase tracking-wider font-label">Ventas</p>
                        <p className="font-headline text-2xl font-bold text-secondary mt-1">
                            {loadingOrdenes ? '—' : ordenes.filter(o => o.tipo === 'VENTA').length}
                        </p>
                    </div>
                    <div className="bg-white/70 border border-white/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-tertiary uppercase tracking-wider font-label">Total Comprado</p>
                        <p className="font-headline text-lg font-bold text-primary mt-1">
                            {loadingOrdenes ? '—' : fmtCurrency(totalGastado)}
                        </p>
                    </div>
                </div>

                {/* Historial de órdenes */}
                <div>
                    <h3 className="text-xs font-label uppercase tracking-wider text-tertiary mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> Historial de Órdenes
                    </h3>

                    <div className="rounded-2xl border border-white/20 overflow-hidden">
                        {loadingOrdenes ? (
                            <div className="p-4 space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : ordenes.length === 0 ? (
                            <div className="py-10 text-center text-tertiary">
                                <ShoppingCart className="w-8 h-8 text-tertiary/30 mx-auto mb-2" />
                                <p className="text-sm">Este cliente aún no tiene órdenes</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-neutral-light/40 border-b border-white/20">
                                        <th className="px-3 py-2.5 text-left text-xs font-label uppercase tracking-wider text-tertiary">Orden #</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-label uppercase tracking-wider text-tertiary">Tipo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-label uppercase tracking-wider text-tertiary">Fecha</th>
                                        <th className="px-3 py-2.5 text-right text-xs font-label uppercase tracking-wider text-tertiary">Total</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-label uppercase tracking-wider text-tertiary">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordenes.map((o: any, idx: number) => {
                                        const cfg = ESTADO_CFG[o.estado] ?? ESTADO_CFG.PENDIENTE;
                                        return (
                                            <tr key={o.id} className={`border-b border-white/10 ${idx % 2 !== 0 ? 'bg-neutral-light/20' : ''}`}>
                                                <td className="px-3 py-2.5">
                                                    <span className="font-label text-xs font-bold text-primary">
                                                        #{String(o.numeroOrden).padStart(4, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {o.tipo === 'VENTA' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                                                            <ShoppingCart className="w-3 h-3" /> Venta
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                                                            <FileText className="w-3 h-3" /> Cotización
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-tertiary font-label">
                                                    {new Date(o.createdAt).toLocaleDateString('es-PE', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-bold text-secondary">
                                                    {fmtCurrency(parseFloat(o.total || '0'))}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
}
