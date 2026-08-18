"use client";

import React, { useState, useEffect } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Plus, Search, RefreshCw, Eye, ArrowDownToLine,
  TrendingUp, Clock, Package, DollarSign, Download
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { CrearIngresoModal } from './CrearIngresoModal';
import { VerIngresoModal } from './VerIngresoModal';
import { ExportarIngresosModal } from './ExportarIngresosModal';

export function IngresosView() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    totalComprasMes: 0,
    cantidadLotes: 0,
    lotePromedio: 0,
    totalProductosIngresados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isVerOpen, setIsVerOpen] = useState(false);
  const [selectedIngresoId, setSelectedIngresoId] = useState<string | null>(null);
  const [isExportarOpen, setIsExportarOpen] = useState(false);

  // Debounce búsqueda
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [searchTerm]);

  // Fetch ingresos
  useEffect(() => {
    const fetchIngresos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: debouncedSearch,
        });
        const res = await fetch(`/api/ingresos?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setPagination(data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
          setMetrics(data.metrics || {
            totalComprasMes: 0,
            cantidadLotes: 0,
            lotePromedio: 0,
            totalProductosIngresados: 0,
          });
        } else {
          toast.error('Error al cargar la lista de ingresos');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de conexión al cargar ingresos');
      } finally {
        setLoading(false);
      }
    };
    fetchIngresos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, refreshTrigger]);

  const handleRefresh = () => setRefreshTrigger(t => t + 1);

  const handleSuccess = () => {
    setIsCrearOpen(false);
    handleRefresh();
  };

  const handleVerIngreso = (id: string) => {
    setSelectedIngresoId(id);
    setIsVerOpen(true);
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

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

  const handleExportarClick = () => setIsExportarOpen(true);

  return (
    <>
      <ModuleTemplate
        title="Compras y Reabastecimiento"
        description="Gestiona las compras por lotes, registra facturas de proveedores y actualiza el stock."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportarClick}
              disabled={loading}
            >
              Exportar
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsCrearOpen(true)}>
              Registrar Compra
            </Button>
          </div>
        }
      >
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Compras del Mes</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {fmtCurrency(metrics.totalComprasMes)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Lotes Recibidos</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-16 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {metrics.cantidadLotes}
                  <span className="text-sm font-normal text-tertiary ml-1">lotes</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Lote Promedio</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {fmtCurrency(metrics.lotePromedio)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Productos Ingresados</span>
              <Package className="w-4 h-4 text-tertiary" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {metrics.totalProductosIngresados}
                  <span className="text-sm font-normal text-tertiary ml-1">unidades</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl overflow-hidden">
          {/* Barra de búsqueda y controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-white/20">
            <h3 className="font-headline text-lg font-bold text-secondary">Historial de Ingresos</h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <Input
                  placeholder="Buscar por notas, usuario o producto..."
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
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">ID Lote</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Registrado Por</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Notas / Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-label uppercase tracking-wider text-tertiary">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeletonRows() : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-tertiary">
                      <div className="flex flex-col items-center gap-2">
                        <ArrowDownToLine className="w-8 h-8 text-tertiary/40" />
                        <p className="font-medium">No se encontraron lotes de ingreso</p>
                        {debouncedSearch && <p className="text-sm">para &ldquo;{debouncedSearch}&rdquo;</p>}
                      </div>
                    </td>
                  </tr>
                ) : items.map((ingreso, idx) => (
                  <tr
                    key={ingreso.id}
                    className={`border-b border-white/10 transition-colors hover:bg-primary/5 group ${idx % 2 === 0 ? '' : 'bg-neutral-light/20'}`}
                  >
                    <td className="px-4 py-3 font-label text-xs">
                      <span className="bg-neutral-light border border-white/40 px-2.5 py-1 rounded-full text-secondary font-medium shadow-sm">
                        {ingreso.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary font-body">
                      {new Date(ingreso.fechaIngreso).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-secondary font-body font-medium">
                      {ingreso.usuarioNombre}
                    </td>
                    <td className="px-4 py-3">
                      <TruncatedCell text={ingreso.descripcion || 'Sin notas'} maxWidthClass="max-w-[240px]" />
                    </td>
                    <td className="px-4 py-3 text-secondary font-body">
                      {ingreso.cantidadItems} {ingreso.cantidadItems === 1 ? 'producto' : 'productos'}
                    </td>
                    <td className="px-4 py-3 font-label font-bold text-secondary">
                      {fmtCurrency(parseFloat(ingreso.total || '0'))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerIngreso(ingreso.id)}
                        className="opacity-80 group-hover:opacity-100 hover:text-primary transition-opacity"
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && items.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-white/20 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-tertiary font-body">
                  Mostrando <span className="font-semibold text-secondary">{items.length}</span> de <span className="font-semibold text-secondary">{pagination.total}</span> compras
                </span>
                <div className="flex items-center gap-2 text-xs text-tertiary font-body">
                  <span>Filas por página:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white/80 border border-white/40 rounded-xl px-2.5 py-1 text-xs font-semibold text-secondary outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModuleTemplate>

      {isCrearOpen && (
        <CrearIngresoModal
          isOpen={isCrearOpen}
          onClose={() => setIsCrearOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isVerOpen && selectedIngresoId && (
        <VerIngresoModal
          isOpen={isVerOpen}
          ingresoId={selectedIngresoId}
          onClose={() => {
            setIsVerOpen(false);
            setSelectedIngresoId(null);
          }}
        />
      )}

      <ExportarIngresosModal
        isOpen={isExportarOpen}
        onClose={() => setIsExportarOpen(false)}
      />
    </>
  );
}
