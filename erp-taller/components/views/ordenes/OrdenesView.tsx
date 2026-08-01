"use client";

import React, { useState, useEffect } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Plus, Search, ShoppingCart, FileText, RefreshCw,
    ChevronLeft, ChevronRight, Eye, Ban, TrendingUp,
    Clock, BarChart2, DollarSign, Download, Loader2, FileSpreadsheet, Pencil
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { CrearOrdenModal } from './CrearOrdenModal';
import { VerOrdenModal } from './VerOrdenModal';
import { generarCotizacionPDF } from '@/lib/pdfGenerator';
import { exportToCSV } from '@/lib/csvExport';
import { exportToExcel } from '@/lib/excelExport';

type Tab = 'ventas' | 'cotizaciones' | 'anuladas';

const TAB_FILTERS: Record<Tab, { tipo?: string; estado?: string }> = {
    ventas:       { tipo: 'VENTA' },
    cotizaciones: { tipo: 'COTIZACION', estado: 'PENDIENTE' },
    anuladas:     { estado: 'ANULADA' },
};

const ESTADO_BADGE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    PENDIENTE:  { label: 'Pendiente',  dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    COMPLETADA: { label: 'Completada', dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    ANULADA:    { label: 'Anulada',    dot: 'bg-tertiary',   text: 'text-tertiary',   bg: 'bg-neutral-light border-white/40' },
};

export function OrdenesView() {
    const toast = useToast();

    const [tab, setTab] = useState<Tab>('ventas');
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
    const [metrics, setMetrics] = useState({
        totalVentasMes: 0,
        cotizacionesPendientes: 0,
        tasaConversion: 0,
        ticketPromedio: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modales
    const [isCrearOpen, setIsCrearOpen] = useState(false);
    const [tipoNueva, setTipoNueva] = useState<'VENTA' | 'COTIZACION'>('VENTA');
    const [isVerOpen, setIsVerOpen] = useState(false);
    const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(null);
    const [editarOrdenId, setEditarOrdenId] = useState<string | null>(null);
    const [isEditarOpen, setIsEditarOpen] = useState(false);

    // Debounce búsqueda
    useEffect(() => {
        const h = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
        return () => clearTimeout(h);
    }, [searchTerm]);

    // Reset página al cambiar de tab
    useEffect(() => { setPage(1); }, [tab]);

    // Fetch órdenes
    useEffect(() => {
        const fetchOrdenes = async () => {
            setLoading(true);
            try {
                const filters = TAB_FILTERS[tab];
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '15',
                    search: debouncedSearch,
                    ...(filters.tipo  ? { tipo:   filters.tipo  } : {}),
                    ...(filters.estado ? { estado: filters.estado } : {}),
                });
                const res = await fetch(`/api/ordenes?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items);
                    setPagination(data.pagination);
                    setMetrics(data.metrics);
                }
            } catch {
                toast.error('Error al cargar las órdenes');
            } finally {
                setLoading(false);
            }
        };
        fetchOrdenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, page, debouncedSearch, refreshTrigger]);

    const handleRefresh = () => setRefreshTrigger(t => t + 1);

    const handleVerOrden = (id: string) => {
        setSelectedOrdenId(id);
        setIsVerOpen(true);
    };

    const handleNueva = (tipo: 'VENTA' | 'COTIZACION') => {
        setTipoNueva(tipo);
        setIsCrearOpen(true);
    };

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleEditarCotizacion = (id: string) => {
        setEditarOrdenId(id);
        setIsEditarOpen(true);
    };

    const handleDescargarPDF = async (id: string) => {
        setDownloadingId(id);
        try {
            const res = await fetch(`/api/ordenes/${id}`);
            if (res.ok) {
                const orden = await res.json();
                await generarCotizacionPDF({
                    tipo: orden.tipo as 'COTIZACION' | 'VENTA',
                    numeroOrden: orden.numeroOrden,
                    clienteNombre: orden.clienteNombre,
                    clienteDocumento: orden.clienteDocumento,
                    fecha: orden.createdAt,
                    detalles: orden.detalles,
                    total: orden.total
                });
            } else {
                toast.error('Error al descargar la orden');
            }
        } catch {
            toast.error('Error de conexión al descargar PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const fmtCurrency = (v: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

    const renderTipoBadge = (tipo: string) => {
        if (tipo === 'VENTA') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    <ShoppingCart className="w-3 h-3" /> Venta
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                <FileText className="w-3 h-3" /> Cotización
            </span>
        );
    };

    const renderEstadoBadge = (estado: string) => {
        const cfg = ESTADO_BADGE[estado] ?? ESTADO_BADGE.PENDIENTE;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>
        );
    };

    const renderSkeletonRows = () =>
        Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-white/20">
                {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                    </td>
                ))}
            </tr>
        ));

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'ventas',       label: 'Ventas',        icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'cotizaciones', label: 'Cotizaciones',   icon: <FileText className="w-4 h-4" /> },
        { id: 'anuladas',     label: 'Anuladas',       icon: <Ban className="w-4 h-4" /> },
    ];

    const handleExportOrdenesCSV = () => {
        const headers = ['Nº Orden', 'Tipo', 'Cliente', 'Estado', 'Monto Total (S/)', 'Fecha'];
        const rows = items.map(o => [
            `ORD-${String(o.numeroOrden || 0).padStart(4, '0')}`,
            o.tipo || '',
            o.cliente?.nombre || '',
            o.estado || '',
            parseFloat(o.total || '0').toFixed(2),
            new Date(o.createdAt).toLocaleDateString('es-PE')
        ]);
        exportToCSV(`Ordenes_${tab}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    };

    const handleExportOrdenesExcel = () => {
        const headers = ['Nº Orden', 'Tipo', 'Cliente', 'Estado', 'Monto Total (S/)', 'Fecha'];
        const rows = items.map(o => [
            `ORD-${String(o.numeroOrden || 0).padStart(4, '0')}`,
            o.tipo || '',
            o.cliente?.nombre || '',
            o.estado || '',
            parseFloat(o.total || '0'),
            new Date(o.createdAt).toLocaleDateString('es-PE')
        ]);
        exportToExcel(`Ordenes_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Ordenes');
    };

    return (
        <>
            <ModuleTemplate
                title="Ventas y Cotizaciones"
                description="Registra y administra ventas directas y cotizaciones de clientes."
                actions={
                    <>
                        <Button variant="secondary" icon={Download} onClick={handleExportOrdenesCSV} disabled={loading || items.length === 0}>
                            Exportar CSV
                        </Button>
                        <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExportOrdenesExcel} className="text-emerald-700 hover:text-emerald-800" disabled={loading || items.length === 0}>
                            Exportar Excel
                        </Button>
                        <Button variant="secondary" icon={FileText} onClick={() => handleNueva('COTIZACION')}>
                            Nueva Cotización
                        </Button>
                        <Button variant="primary" icon={ShoppingCart} onClick={() => handleNueva('VENTA')}>
                            Nueva Venta
                        </Button>
                    </>
                }
            >
                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Ventas del Mes</span>
                            <DollarSign className="w-4 h-4 text-primary" />
                        </div>
                        <div className="mt-3">
                            {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                                <p className="font-headline text-2xl font-bold text-secondary">
                                    {fmtCurrency(metrics.totalVentasMes)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Cotizaciones Activas</span>
                            <Clock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="mt-3">
                            {loading ? <Skeleton className="h-7 w-16 rounded" /> : (
                                <p className="font-headline text-2xl font-bold text-secondary">
                                    {metrics.cotizacionesPendientes}
                                    <span className="text-sm font-normal text-tertiary ml-1">pendientes</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Tasa de Conversión</span>
                            <BarChart2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="mt-3 flex items-end gap-3">
                            {loading ? <Skeleton className="h-7 w-16 rounded" /> : (
                                <>
                                    <p className="font-headline text-2xl font-bold text-secondary">
                                        {metrics.tasaConversion}%
                                    </p>
                                    <div className="flex-1 h-2 bg-neutral-light rounded-full overflow-hidden mb-1">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(metrics.tasaConversion, 100)}%` }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Ticket Promedio</span>
                            <TrendingUp className="w-4 h-4 text-tertiary" />
                        </div>
                        <div className="mt-3">
                            {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                                <p className="font-headline text-2xl font-bold text-secondary">
                                    {fmtCurrency(metrics.ticketPromedio)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla principal */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl overflow-hidden">
                    {/* Barra de tabs + búsqueda */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-white/20">
                        <div className="flex gap-1 bg-neutral-light/60 rounded-2xl p-1">
                            {TABS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        tab === t.id
                                            ? 'bg-white text-primary shadow-sm border border-white/60'
                                            : 'text-tertiary hover:text-secondary'
                                    }`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                <Input
                                    placeholder="Buscar orden o cliente..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRefresh} title="Actualizar">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-light/40 border-b border-white/20">
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Orden #</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Ítems</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-label uppercase tracking-wider text-tertiary">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? renderSkeletonRows() : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-tertiary">
                                            <div className="flex flex-col items-center gap-2">
                                                {tab === 'ventas' ? <ShoppingCart className="w-8 h-8 text-tertiary/40" /> : <FileText className="w-8 h-8 text-tertiary/40" />}
                                                <p className="font-medium">No hay {tab === 'ventas' ? 'ventas' : tab === 'cotizaciones' ? 'cotizaciones' : 'registros anulados'}</p>
                                                {debouncedSearch && <p className="text-sm">para &ldquo;{debouncedSearch}&rdquo;</p>}
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.map((orden, idx) => (
                                    <tr
                                        key={orden.id}
                                        className={`border-b border-white/10 transition-colors hover:bg-primary/5 group ${idx % 2 === 0 ? '' : 'bg-neutral-light/20'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-label text-sm font-bold text-primary">
                                                    #{String(orden.numeroOrden).padStart(4, '0')}
                                                </span>
                                                {tab === 'anuladas' && renderTipoBadge(orden.tipo)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-body text-secondary font-medium truncate max-w-[180px] block">
                                                {orden.clienteNombre}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-tertiary text-xs font-label">
                                            {new Date(orden.createdAt).toLocaleDateString('es-PE', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-label text-xs bg-white/60 text-secondary border border-white/20 px-2 py-0.5 rounded-lg">
                                                {orden.cantidadItems} ítem{orden.cantidadItems !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-body font-bold text-secondary">
                                                {fmtCurrency(parseFloat(orden.total || '0'))}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {renderEstadoBadge(orden.estado)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={downloadingId === orden.id ? Loader2 : Download}
                                                    onClick={() => handleDescargarPDF(orden.id)}
                                                    title="Descargar PDF"
                                                    disabled={downloadingId === orden.id}
                                                />
                                                {orden.tipo === 'COTIZACION' && orden.estado === 'PENDIENTE' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={Pencil}
                                                        onClick={() => handleEditarCotizacion(orden.id)}
                                                        title="Editar cotización"
                                                    />
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Eye}
                                                    onClick={() => handleVerOrden(orden.id)}
                                                    title="Ver detalle"
                                                >
                                                    Ver
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/20">
                            <span className="text-xs text-tertiary">
                                Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost" size="sm"
                                    icon={ChevronLeft}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={pagination.page <= 1}
                                />
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                                p === pagination.page
                                                    ? 'bg-primary text-white'
                                                    : 'text-tertiary hover:bg-neutral-light'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <Button
                                    variant="ghost" size="sm"
                                    icon={ChevronRight}
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={pagination.page >= pagination.totalPages}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ModuleTemplate>

            <CrearOrdenModal
                isOpen={isCrearOpen}
                tipoInicial={tipoNueva}
                onClose={() => setIsCrearOpen(false)}
                onSuccess={() => { setIsCrearOpen(false); handleRefresh(); }}
            />

            {isEditarOpen && editarOrdenId && (
                <CrearOrdenModal
                    isOpen={isEditarOpen}
                    tipoInicial="COTIZACION"
                    editarOrdenId={editarOrdenId}
                    onClose={() => { setIsEditarOpen(false); setEditarOrdenId(null); }}
                    onSuccess={() => { setIsEditarOpen(false); setEditarOrdenId(null); handleRefresh(); }}
                />
            )}

            <VerOrdenModal
                isOpen={isVerOpen}
                ordenId={selectedOrdenId}
                onClose={() => { setIsVerOpen(false); setSelectedOrdenId(null); }}
                onSuccess={() => { setIsVerOpen(false); setSelectedOrdenId(null); handleRefresh(); }}
            />
        </>
    );
}
