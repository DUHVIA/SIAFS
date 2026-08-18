"use client";

import React, { useState } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Download, FileSpreadsheet, Calendar, TrendingUp, TrendingDown, DollarSign, PieChart, ShoppingBag, RefreshCw } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { exportToExcel } from '@/lib/excelExport';
import { PuntoFinanciero, PeriodoFinanciero } from '@/modules/dashboard/dashboard.service';

interface FinancialDashboardViewProps {
  initialChartData: PuntoFinanciero[];
  metricasFinancieras: {
    ingresosTotales: number;
    gastosTotales: number;
    gananciasTotales: number;
    gananciaVentasTotales: number;
    margenGanancia: number;
    totalInvertidoCompras: number;
  };
}

const PERIODOS: { id: PeriodoFinanciero; label: string }[] = [
  { id: '7d', label: 'Últimos 7 días' },
  { id: 'mensual', label: 'Mensual' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' }
];

export function FinancialDashboardView({ initialChartData, metricasFinancieras }: FinancialDashboardViewProps) {
  const [periodo, setPeriodo] = useState<PeriodoFinanciero>('7d');
  const [chartData, setChartData] = useState<PuntoFinanciero[]>(initialChartData);
  const [loading, setLoading] = useState(false);

  const cambiarPeriodo = async (nuevoPeriodo: PeriodoFinanciero) => {
    setPeriodo(nuevoPeriodo);
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/financiero?periodo=${nuevoPeriodo}`);
      if (res.ok) {
        const json = await res.json();
        if (json.chartData) {
          setChartData(json.chartData);
        }
      }
    } catch (e) {
      console.error('Error al cambiar periodo financiero:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Periodo / Fecha', 'Ingresos Ventas (S/)', 'Ganancia en Ventas (S/)', 'Gastos (S/)', 'Ganancia Neta (S/)', 'Compras Inventario (S/)'];
    const rows = chartData.map(p => [
      p.periodoLabel,
      p.ingresos.toFixed(2),
      (p.gananciaVentas || 0).toFixed(2),
      p.gastos.toFixed(2),
      p.ganancias.toFixed(2),
      p.compras.toFixed(2),
    ]);
    exportToCSV(`Historico_Financiero_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Periodo / Fecha', 'Ingresos Ventas (S/)', 'Ganancia en Ventas (S/)', 'Gastos (S/)', 'Ganancia Neta (S/)', 'Compras Inventario (S/)'];
    const rows = chartData.map(p => [
      p.periodoLabel,
      p.ingresos,
      p.gananciaVentas || 0,
      p.gastos,
      p.ganancias,
      p.compras,
    ]);
    exportToExcel(`Historico_Financiero_${periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Histórico Financiero');
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Financiero: Métricas Claves */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Ingresos Totales */}
        <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-emerald-700">Ingresos Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-emerald-900">
              S/ {metricasFinancieras.ingresosTotales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-emerald-700 mt-1 font-body">Ventas cerradas y cobradas</p>
          </div>
        </div>

        {/* Ganancia en Ventas (Bruta) */}
        <div className="bg-teal-500/10 backdrop-blur-xl border border-teal-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-teal-700">Ganancia en Ventas</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-teal-900">
              S/ {(metricasFinancieras.gananciaVentasTotales || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-teal-700 mt-1 font-body">Utilidad bruta comercial</p>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-rose-700">Gastos Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-rose-900">
              S/ {metricasFinancieras.gastosTotales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-rose-700 mt-1 font-body">Egresos y caja chica</p>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-blue-700">Ganancia Neta</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-blue-900">
              S/ {metricasFinancieras.gananciasTotales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-blue-700 mt-1 font-body">Utilidad Bruta - Gastos Totales</p>
          </div>
        </div>

        {/* Margen de Ganancia */}
        <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-amber-700">Margen de Ganancia</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-amber-900">
              {metricasFinancieras.margenGanancia}%
            </span>
            <p className="text-xs text-amber-700 mt-1 font-body">Eficiencia sobre ventas</p>
          </div>
        </div>

        {/* Compras / Adquisición de Inventario */}
        <div className="bg-violet-500/10 backdrop-blur-xl border border-violet-500/20 shadow-soft rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-violet-700">Inversión en Compras</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-label font-bold text-2xl text-violet-900">
              S/ {metricasFinancieras.totalInvertidoCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-violet-700 mt-1 font-body">Adquisición de mercadería</p>
          </div>
        </div>
      </div>

      {/* Gráfico Financiero de Evolución Temporal */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-headline font-bold text-lg text-secondary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolución Financiera Histórica
            </h3>
            <p className="text-xs text-tertiary font-body">
              Comparativa de Ingresos, Gastos, Ganancias y Compras de Inventario
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Periodo */}
            <div className="bg-neutral-light p-1 rounded-2xl flex gap-1 border border-white/40 shadow-inner">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => cambiarPeriodo(p.id)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-headline font-bold transition-all ${
                    periodo === p.id
                      ? 'bg-white text-secondary shadow-sm'
                      : 'text-tertiary hover:text-secondary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Botones de Exportación */}
            <div className="flex gap-1">
              <button
                onClick={handleExportCSV}
                disabled={chartData.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-semibold text-xs bg-white text-secondary hover:bg-neutral-light border border-white/40 shadow-xs disabled:opacity-40"
                title="Exportar gráfico histórico a CSV"
              >
                <Download className="w-3.5 h-3.5 text-tertiary" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={chartData.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-semibold text-xs bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-500/20 shadow-xs disabled:opacity-40"
                title="Exportar gráfico histórico a Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor del Gráfico Recharts */}
        <div className="w-full h-[320px] pt-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-tertiary text-sm gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>Cargando periodo financiero...</span>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="periodoLabel"
                  stroke="#747474"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#747474"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `S/ ${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any, name: any) => {
                    const labels: Record<string, string> = {
                      ingresos: 'Ingresos Ventas',
                      gananciaVentas: 'Ganancia en Ventas',
                      gastos: 'Gastos Internos',
                      ganancias: 'Ganancia Neta',
                      compras: 'Compras Inventario',
                    };
                    return [`S/ ${Number(value).toFixed(2)}`, labels[name] ?? name];
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  formatter={(val) => {
                    const labels: Record<string, string> = {
                      ingresos: 'Ingresos Ventas',
                      gananciaVentas: 'Ganancia en Ventas',
                      gastos: 'Gastos Internos',
                      ganancias: 'Ganancia Neta',
                      compras: 'Compras Inventario',
                    };
                    return (
                      <span className="text-xs font-headline font-medium text-secondary">
                        {labels[val] ?? val}
                      </span>
                    );
                  }}
                />
                <Bar dataKey="ingresos" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Bar dataKey="gananciaVentas" fill="#0D9488" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Bar dataKey="gastos" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Bar dataKey="compras" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="ganancias" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-tertiary text-sm">
              No hay suficientes datos financieros en el periodo seleccionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
