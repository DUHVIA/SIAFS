import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface VerKardexModalProps {
    isOpen: boolean;
    onClose: () => void;
    producto: any | null;
}

export function VerKardexModal({ isOpen, onClose, producto }: VerKardexModalProps) {
    const [historial, setHistorial] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKardex = async () => {
            if (!producto || !isOpen) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/kardex?productoId=${producto.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setHistorial(data);
                } else {
                    console.error('Error al cargar kardex');
                }
            } catch (error) {
                console.error('Error de red al cargar kardex:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchKardex();
    }, [producto, isOpen]);

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'INGRESO':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Ingreso</span>;
            case 'SALIDA':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Salida</span>;
            case 'AJUSTE':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Ajuste</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-light text-tertiary">{tipo}</span>;
        }
    };

    const formatFecha = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleString('es-PE', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Kardex: ${producto?.nombre || ''}`}
            description={`Historial de movimientos y trazabilidad del producto. Stock actual: ${producto?.stock || 0}`}
            icon={Activity}
            maxWidth="4xl"
        >
            <div className="mt-4">
                <div className="w-full border border-white/20 rounded-2xl overflow-hidden bg-neutral-light/30">
                    <div className="overflow-x-auto custom-scrollbar max-h-[75vh]">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm">
                                <tr className="border-b border-white/40">
                                    <th className="px-5 py-3 font-headline text-xs font-bold text-tertiary uppercase tracking-wider">Fecha</th>
                                    <th className="px-5 py-3 font-headline text-xs font-bold text-tertiary uppercase tracking-wider">Usuario</th>
                                    <th className="px-5 py-3 font-headline text-xs font-bold text-tertiary uppercase tracking-wider">Movimiento</th>
                                    <th className="px-5 py-3 font-headline text-xs font-bold text-tertiary uppercase tracking-wider text-right">Cantidad</th>
                                    <th className="px-5 py-3 font-headline text-xs font-bold text-tertiary uppercase tracking-wider">Motivo / Origen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/40">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-5 py-4"><Skeleton className="h-5 w-32" /></td>
                                            <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-5 py-4"><Skeleton className="h-6 w-20" /></td>
                                            <td className="px-5 py-4 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                                            <td className="px-5 py-4"><Skeleton className="h-5 w-48" /></td>
                                        </tr>
                                    ))
                                ) : historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center">
                                            <AlertTriangle className="w-8 h-8 text-tertiary mx-auto mb-3" />
                                            <p className="font-headline font-bold text-secondary">Sin movimientos registrados</p>
                                            <p className="text-sm text-tertiary mt-1">Este producto aún no tiene movimientos en el Kardex.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    historial.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-white/40 transition-colors">
                                            <td className="px-5 py-3 font-label text-xs text-secondary whitespace-nowrap flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-tertiary" />
                                                {formatFecha(mov.fechaMovimiento)}
                                            </td>
                                            <td className="px-5 py-3 font-body text-sm text-secondary truncate max-w-[120px]" title={mov.usuario?.nombre || 'Sistema'}>
                                                {mov.usuario?.nombre || 'Sistema'}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {getTipoBadge(mov.tipoMovimiento)}
                                            </td>
                                            <td className="px-5 py-3 font-label font-bold text-sm text-right">
                                                <span className={
                                                    mov.tipoMovimiento === 'INGRESO' ? 'text-green-600' : 
                                                    mov.tipoMovimiento === 'SALIDA' ? 'text-red-600' : 'text-orange-600'
                                                }>
                                                    {mov.tipoMovimiento === 'SALIDA' ? '-' : '+'}{mov.cantidad}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-body text-sm text-tertiary">
                                                {mov.motivo}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md shadow-[0_-2px_4px_rgba(0,0,0,0.02)] border-t border-white/60">
                                <tr>
                                    <td colSpan={3} className="px-5 py-4 font-headline text-sm font-bold text-secondary text-right">
                                        Stock Actual Total:
                                    </td>
                                    <td className="px-5 py-4 font-headline text-lg font-bold text-blue-600 text-right">
                                        {producto?.stock || 0}
                                    </td>
                                    <td className="px-5 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end mt-6">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full font-headline font-bold text-sm bg-neutral-light text-secondary hover:bg-neutral-light/80 transition-all border border-white/20 shadow-sm"
                >
                    Cerrar
                </button>
            </div>
        </Modal>
    );
}
