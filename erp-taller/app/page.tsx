import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  // Simulación de una carga de datos inicial
  const isLoading = false;

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
        {isLoading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : (
          <>
            <StatCard 
              title="Ventas Totales" 
              value="$124,500" 
              icon={DollarSign} 
              trend={{ value: 12.5, isPositive: true }} 
            />
            <StatCard 
              title="Órdenes Activas" 
              value="45" 
              icon={ShoppingCart} 
              trend={{ value: 2.4, isPositive: false }} 
            />
            <StatCard 
              title="Productos en Stock" 
              value="1,204" 
              icon={Package} 
            />
            <StatCard 
              title="Nuevos Clientes" 
              value="89" 
              icon={Users} 
              trend={{ value: 18.2, isPositive: true }} 
            />
          </>
        )}
      </div>

      {/* Sección inferior (Gráficos o Tablas Recientes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo más grande (Gráfico simulado) */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-secondary/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-white/20 dark:border-white/5 h-96 flex flex-col">
          <h3 className="font-headline font-semibold text-secondary dark:text-neutral-light mb-4">
            Evolución de Ingresos
          </h3>
          <div className="flex-1 rounded-2xl bg-neutral-light/50 dark:bg-white/5 border border-dashed border-tertiary/20 flex items-center justify-center">
            <span className="text-tertiary font-medium">Gráfico en construcción...</span>
          </div>
        </div>

        {/* Panel Derecho (Lista reciente simulada) */}
        <div className="bg-white/70 dark:bg-secondary/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-white/20 dark:border-white/5 h-96 flex flex-col">
          <h3 className="font-headline font-semibold text-secondary dark:text-neutral-light mb-4">
            Últimas Órdenes
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-light dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-headline font-medium text-sm text-secondary dark:text-neutral-light">Orden #{1000 + i}</p>
                    <p className="text-xs text-tertiary">Hace {i} horas</p>
                  </div>
                </div>
                <span className="font-body font-bold text-sm text-secondary dark:text-neutral-light">
                  ${(Math.random() * 500).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
