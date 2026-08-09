"use client";

import React from 'react';
import { Package, Download, FileSpreadsheet, Trophy } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { exportToExcel } from '@/lib/excelExport';
import { ProductoMasVendido } from '@/modules/dashboard/dashboard.service';

interface ProductosMasVendidosWidgetProps {
  topProductos: ProductoMasVendido[];
  otrosProductos: ProductoMasVendido | null;
}

export function ProductosMasVendidosWidget({
  topProductos,
  otrosProductos,
}: ProductosMasVendidosWidgetProps) {
  const todosLosItems = [...topProductos];
  if (otrosProductos && otrosProductos.cantidadVendida > 0) {
    todosLosItems.push(otrosProductos);
  }

  const maxCantidad = Math.max(...todosLosItems.map((p) => p.cantidadVendida), 1);

  const handleExportCSV = () => {
    const headers = ['Posicion', 'SKU', 'Producto', 'Cantidad Vendida (Unid.)', 'Total Ventas (S/)'];
    const rows = todosLosItems.map((p, idx) => [
      p.id === 'otros' ? '-' : (idx + 1).toString(),
      p.sku,
      p.nombre,
      p.cantidadVendida,
      p.totalVendido.toFixed(2),
    ]);
    exportToCSV(`Productos_Mas_Vendidos_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Posicion', 'SKU', 'Producto', 'Cantidad Vendida (Unid.)', 'Total Ventas (S/)'];
    const rows = todosLosItems.map((p, idx) => [
      p.id === 'otros' ? '-' : (idx + 1).toString(),
      p.sku,
      p.nombre,
      p.cantidadVendida,
      p.totalVendido,
    ]);
    exportToExcel(`Productos_Mas_Vendidos_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Top Productos');
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-headline font-bold text-lg text-secondary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Productos Más Vendidos
          </h3>
          <p className="text-xs text-tertiary font-body">
            Top 5 productos con mayor rotación en ventas cerradas + acumulado de otros productos
          </p>
        </div>

        <div className="flex gap-1.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={todosLosItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-semibold text-xs bg-white text-secondary hover:bg-neutral-light border border-white/40 shadow-xs disabled:opacity-40"
            title="Exportar ranking a CSV"
          >
            <Download className="w-3.5 h-3.5 text-tertiary" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={todosLosItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-semibold text-xs bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-500/20 shadow-xs disabled:opacity-40"
            title="Exportar ranking a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {todosLosItems.length === 0 ? (
        <div className="py-12 text-center text-tertiary text-sm flex flex-col items-center gap-2">
          <Package className="w-8 h-8 opacity-40" />
          <p>No se han registrado ventas cerradas aun</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todosLosItems.map((prod, idx) => {
            const porcentaje = Math.min(100, Math.round((prod.cantidadVendida / maxCantidad) * 100));
            const esOtros = prod.id === 'otros';

            return (
              <div
                key={prod.id + idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  esOtros
                    ? 'bg-neutral-light/50 border-white/30'
                    : idx === 0
                    ? 'bg-amber-50/60 border-amber-200/50 shadow-xs'
                    : 'bg-white/50 border-white/40 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-label shrink-0 ${
                        esOtros
                          ? 'bg-neutral-light text-tertiary'
                          : idx === 0
                          ? 'bg-amber-500 text-white'
                          : idx === 1
                          ? 'bg-slate-400 text-white'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-neutral-light text-secondary'
                      }`}
                    >
                      {esOtros ? '•' : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-headline font-semibold text-sm text-secondary truncate">
                        {prod.nombre}
                      </p>
                      <p className="text-[11px] text-tertiary font-body">
                        SKU: {prod.sku}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-label font-bold text-sm text-secondary block">
                      {prod.cantidadVendida} {prod.cantidadVendida === 1 ? 'unid.' : 'unids.'}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      S/ {prod.totalVendido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      esOtros
                        ? 'bg-slate-400'
                        : idx === 0
                        ? 'bg-amber-500'
                        : idx === 1
                        ? 'bg-primary'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
