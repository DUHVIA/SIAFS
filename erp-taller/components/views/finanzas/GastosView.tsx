"use client";

import React, { useState, useEffect } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Plus, Search, RefreshCw, Edit2, Trash2, Wallet,
  Calendar, DollarSign, TrendingDown, ClipboardList, Download, FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { CrearGastoModal } from './CrearGastoModal';
import { EditarGastoModal } from './EditarGastoModal';
import { ConfirmAnularGastoModal } from './ConfirmAnularGastoModal';
import { exportToCSV } from '@/lib/csvExport';
import { exportToExcel } from '@/lib/excelExport';
import { formatFechaDisplay } from '@/lib/dateUtils';

export function GastosView() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    totalGastadoMes: 0,
    gastoPromedioDiario: 0,
    totalTransacciones: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [isAnularOpen, setIsAnularOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<any | null>(null);

  // Debounce búsqueda
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [searchTerm]);

  // Fetch gastos
  useEffect(() => {
    const fetchGastos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: debouncedSearch,
        });
        const res = await fetch(`/api/gastos?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setPagination(data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
          setMetrics(data.metrics || {
            totalGastadoMes: 0,
            gastoPromedioDiario: 0,
            totalTransacciones: 0,
          });
        } else {
          toast.error('Error al cargar la lista de gastos');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de conexión al cargar gastos');
      } finally {
        setLoading(false);
      }
    };
    fetchGastos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, refreshTrigger]);

  const handleRefresh = () => setRefreshTrigger(t => t + 1);

  const handleSuccess = () => {
    handleRefresh();
  };

  const handleEditar = (gasto: any) => {
    setSelectedGasto(gasto);
    setIsEditarOpen(true);
  };

  const handleAnular = (gasto: any) => {
    setSelectedGasto(gasto);
    setIsAnularOpen(true);
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const renderSkeletonRows = () =>
    Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="border-b border-white/20">
        {Array.from({ length: 5 }).map((_, j) => (
          <td key={j} className="px-4 py-3">
            <Skeleton className="h-4 w-full rounded" />
          </td>
        ))}
      </tr>
    ));

  const handleExportGastosCSV = () => {
      const headers = ['Fecha', 'Motivo / Descripción', 'Monto (S/)', 'Registrado Por'];
      const rows = items.map(g => [
        formatFechaDisplay(g.fecha),
        g.motivo || '',
        parseFloat(g.monto || '0').toFixed(2),
        g.usuario?.nombre || 'Sistema'
      ]);
      exportToCSV(`Gastos_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    };

    const handleExportGastosExcel = () => {
      const headers = ['Fecha', 'Motivo / Descripción', 'Monto (S/)', 'Registrado por'];
      const rows = items.map(g => [
        formatFechaDisplay(g.fecha),
        g.motivo || '',
        parseFloat(g.monto || '0'),
        g.usuario?.nombre || 'Sistema'
      ]);
      exportToExcel(`Gastos_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Gastos');
    };

  return (
    <>
      <ModuleTemplate
        title="Gastos de Caja Chica"
        description="Lleva el control detallado de los gastos internos de la empresa."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} onClick={handleExportGastosCSV} disabled={loading || items.length === 0}>
              Exportar CSV
            </Button>
            <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExportGastosExcel} className="text-emerald-700 hover:text-emerald-800" disabled={loading || items.length === 0}>
              Exportar Excel
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsCrearOpen(true)}>
              Registrar Gasto
            </Button>
          </div>
        }
      >
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-body">
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Gastado en el Mes</span>
              <DollarSign className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {fmtCurrency(metrics.totalGastadoMes)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Gasto Diario Promedio</span>
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-28 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {fmtCurrency(metrics.gastoPromedioDiario)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Transacciones del Mes</span>
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              {loading ? <Skeleton className="h-7 w-16 rounded" /> : (
                <p className="font-headline text-2xl font-bold text-secondary">
                  {metrics.totalTransacciones}
                  <span className="text-sm font-normal text-tertiary ml-1">gastos</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl overflow-hidden">
          {/* Barra de búsqueda y controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-white/20">
            <h3 className="font-headline text-lg font-bold text-secondary">Historial de Gastos</h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <Input
                  placeholder="Buscar por motivo o usuario..."
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
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Motivo / Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Registrado Por</th>
                  <th className="px-4 py-3 text-right text-xs font-label uppercase tracking-wider text-tertiary">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeletonRows() : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-tertiary">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="w-8 h-8 text-tertiary/40" />
                        <p className="font-medium">No se encontraron gastos registrados</p>
                        {debouncedSearch && <p className="text-sm">para &ldquo;{debouncedSearch}&rdquo;</p>}
                      </div>
                    </td>
                  </tr>
                ) : items.map((gasto, idx) => (
                  <tr
                    key={gasto.id}
                    className={`border-b border-white/10 transition-colors hover:bg-primary/5 group ${idx % 2 === 0 ? '' : 'bg-neutral-light/20'}`}
                  >
                    <td className="px-4 py-3 text-secondary font-body font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-tertiary opacity-70" />
                        {formatFechaDisplay(gasto.fecha)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TruncatedCell text={gasto.motivo} maxWidthClass="max-w-[320px]" />
                    </td>
                    <td className="px-4 py-3 font-label font-bold text-red-500">
                      -{fmtCurrency(parseFloat(gasto.monto || '0'))}
                    </td>
                    <td className="px-4 py-3 text-tertiary font-body">
                      {gasto.usuario?.nombre || 'Sistema'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditar(gasto)}
                          className="opacity-80 group-hover:opacity-100 hover:text-primary transition-opacity"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(gasto)}
                          className="opacity-80 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                          title="Anular"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
                  Mostrando <span className="font-semibold text-secondary">{items.length}</span> de <span className="font-semibold text-secondary">{pagination.total}</span> gastos
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
        <CrearGastoModal
          isOpen={isCrearOpen}
          onClose={() => setIsCrearOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isEditarOpen && selectedGasto && (
        <EditarGastoModal
          isOpen={isEditarOpen}
          onClose={() => {
            setIsEditarOpen(false);
            setSelectedGasto(null);
          }}
          onSuccess={handleSuccess}
          gasto={selectedGasto}
        />
      )}

      {isAnularOpen && selectedGasto && (
        <ConfirmAnularGastoModal
          isOpen={isAnularOpen}
          onClose={() => {
            setIsAnularOpen(false);
            setSelectedGasto(null);
          }}
          onSuccess={handleSuccess}
          gasto={selectedGasto}
        />
      )}
    </>
  );
}
