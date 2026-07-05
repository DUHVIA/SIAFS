import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metricas = await DashboardService.obtenerMetricasGenerales();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-headline text-3xl font-bold text-secondary dark:text-neutral-light">
          Resumen General
        </h1>
        <p className="text-tertiary mt-1 font-body">
          Bienvenido al panel de control. Aquí tienes un vistazo rápido al estado del negocio.
        </p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas Totales" 
          value={`$${metricas.ingresosTotales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
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

      {/* Sección inferior (Gráficos o Tablas Recientes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo más grande (Gráfico) */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-secondary/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-white/20 dark:border-white/5 h-[400px] flex flex-col">
          <h3 className="font-headline font-semibold text-secondary dark:text-neutral-light mb-4">
            Evolución de Ingresos (Últimos 7 días)
          </h3>
          <div className="flex-1 w-full h-full">
            <SalesChart data={metricas.chartData} />
          </div>
        </div>

        {/* Panel Derecho (Lista reciente) */}
        <div className="bg-white/70 dark:bg-secondary/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-white/20 dark:border-white/5 h-[400px] flex flex-col">
          <h3 className="font-headline font-semibold text-secondary dark:text-neutral-light mb-4">
            Últimas Órdenes Creadas
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {metricas.ultimasOrdenes.length > 0 ? (
              metricas.ultimasOrdenes.map((orden) => (
                <div key={orden.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-light dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-headline font-medium text-sm text-secondary dark:text-neutral-light">Orden #{orden.numero}</p>
                      <p className="text-xs text-tertiary">{new Date(orden.fecha).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="font-body font-bold text-sm text-secondary dark:text-neutral-light">
                    ${orden.total.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-tertiary pt-10">
                No hay órdenes recientes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
