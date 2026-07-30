import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialDashboardView } from '@/components/dashboard/FinancialDashboardView';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const metricas = await DashboardService.obtenerMetricasGenerales();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="font-headline text-3xl font-bold text-secondary">
                    Resumen General y Análisis Financiero
                </h1>
                <p className="text-tertiary mt-1 font-body">
                    Bienvenido al panel de control de SIAFS. Monitorea el estado operativo y financiero en tiempo real.
                </p>
            </div>

            {/* Grid de Tarjetas Operativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas Totales"
                    value={`S/ ${metricas.ingresosTotales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                />
                <StatCard
                    title="Órdenes Pendientes"
                    value={metricas.ordenesActivas.toString()}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Productos en Stock"
                    value={metricas.productosEnStock.toString()}
                    icon={Package}
                />
                <StatCard
                    title="Nuevos Clientes (30d)"
                    value={metricas.nuevosClientes.toString()}
                    icon={Users}
                />
            </div>

            {/* Grid Principal: Módulo Financiero Interactivo + Últimas Órdenes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Izquierdo (Módulo Financiero con Gráfico por Periodo y Exportación) */}
                <div className="lg:col-span-2">
                    <FinancialDashboardView 
                        initialChartData={metricas.chartData}
                        metricasFinancieras={{
                            ingresosTotales: metricas.ingresosTotales,
                            gastosTotales: metricas.gastosTotales,
                            gananciasTotales: metricas.gananciasTotales,
                            margenGanancia: metricas.margenGanancia
                        }}
                    />
                </div>

                {/* Panel Derecho (Últimas Órdenes) */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 h-[520px] flex flex-col">
                    <h3 className="font-headline font-bold text-lg text-secondary mb-4">
                        Últimas Órdenes Creadas
                    </h3>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                        {metricas.ultimasOrdenes.length > 0 ? (
                            metricas.ultimasOrdenes.map((orden) => (
                                <div key={orden.id} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-light/80 transition-colors border border-white/40 bg-white/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            #{orden.numero}
                                        </div>
                                        <div>
                                            <p className="font-headline font-semibold text-sm text-secondary">
                                                Orden Nº {orden.numero}
                                            </p>
                                            <p className="text-xs text-tertiary">
                                                {new Date(orden.fecha).toLocaleDateString('es-PE')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-label font-bold text-sm text-secondary block">
                                            S/ {orden.total.toFixed(2)}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                            orden.estado === 'COMPLETADA' ? 'bg-emerald-500/10 text-emerald-600' :
                                            orden.estado === 'ANULADA' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                            {orden.estado}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-tertiary pt-16">
                                No hay órdenes recientes registradas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
