import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { exportToExcel } from '@/lib/excelExport';

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

    const handleExportKardexCSV = () => {
        const headers = ['Fecha', 'Usuario', 'Movimiento', 'Cantidad', 'Motivo / Origen'];
        const rows = historial.map(m => [
            formatFecha(m.fechaMovimiento),
            m.usuario?.nombre || 'Sistema',
            m.tipoMovimiento || '',
            m.cantidad || '0',
            m.motivo || ''
        ]);
        exportToCSV(`Kardex_${(producto?.nombre || 'producto').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    };

    const handleExportKardexExcel = () => {
        const headers = ['Fecha', 'Usuario', 'Movimiento', 'Cantidad', 'Motivo / Origen'];
        const rows = historial.map(m => [
            formatFecha(m.fechaMovimiento),
            m.usuario?.nombre || 'Sistema',
            m.tipoMovimiento || '',
            parseInt(m.cantidad || '0', 10),
            m.motivo || ''
        ]);
        exportToExcel(`Kardex_${(producto?.nombre || 'producto').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Kardex');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Kardex: ${producto?.nombre || ''}`}
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
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-white/40">
                                            <td className="px-5 py-3"><Skeleton className="h-5 w-28" /></td>
                                            <td className="px-5 py-3"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-5 py-3"><Skeleton className="h-6 w-20" /></td>
                                            <td className="px-5 py-3 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                                            <td className="px-5 py-3"><Skeleton className="h-5 w-36" /></td>
                                        </tr>
                                    ))
                                ) : historial.length > 0 ? (
                                    historial.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-neutral-light/50 transition-colors">
                                            <td className="px-5 py-3 font-body text-xs text-tertiary whitespace-nowrap">
                                                {formatFecha(mov.fechaMovimiento)}
                                            </td>
                                            <td className="px-5 py-3 font-headline font-semibold text-xs text-secondary">
                                                {mov.usuario?.nombre || 'Sistema'}
                                            </td>
                                            <td className="px-5 py-3">
                                                {getTipoBadge(mov.tipoMovimiento)}
                                            </td>
                                            <td className={`px-5 py-3 font-label font-bold text-sm text-right ${
                                                mov.tipoMovimiento === 'INGRESO' ? 'text-green-600' :
                                                mov.tipoMovimiento === 'SALIDA' ? 'text-red-600' : 'text-orange-600'
                                            }`}>
                                                {mov.tipoMovimiento === 'INGRESO' ? `+${mov.cantidad}` :
                                                 mov.tipoMovimiento === 'SALIDA' ? `-${mov.cantidad}` : mov.cantidad}
                                            </td>
                                            <td className="px-5 py-3 font-body text-xs text-secondary max-w-xs truncate">
                                                {mov.motivo || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-tertiary">
                                            No hay movimientos registrados en el kardex para este producto.
                                        </td>
                                    </tr>
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
            
            <div className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                    <button
                        onClick={handleExportKardexCSV}
                        disabled={loading || historial.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-headline font-semibold text-xs bg-white text-secondary hover:bg-neutral-light transition-all border border-white/30 shadow-sm disabled:opacity-40"
                    >
                        <Download className="w-4 h-4 text-tertiary" /> CSV
                    </button>
                    <button
                        onClick={handleExportKardexExcel}
                        disabled={loading || historial.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-headline font-semibold text-xs bg-white text-emerald-700 hover:bg-emerald-50 transition-all border border-emerald-500/20 shadow-sm disabled:opacity-40"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                    </button>
                </div>
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
