"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/config';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ArrowDownToLine, 
  Users, 
  Wallet, 
  UserCog 
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Ventas', href: '/ordenes', icon: ShoppingCart },
  { name: 'Compras', href: '/ingresos', icon: ArrowDownToLine },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Gastos', href: '/finanzas', icon: Wallet },
  { name: 'Personal', href: '/usuarios', icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 m-4 bg-white/80 dark:bg-secondary/80 backdrop-blur-xl rounded-3xl shadow-soft dark:shadow-soft-dark z-50 flex flex-col overflow-hidden">
      {/* Header del Sidebar */}
      <div className="h-24 flex items-center justify-center gap-3 px-6">
        <img 
          src={siteConfig.logo} 
          alt={siteConfig.name} 
          className="w-10 h-10 object-contain rounded-full shadow-sm"
        />
        <h1 className="font-headline font-bold text-xl text-primary tracking-tight">
          {siteConfig.name}
        </h1>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-body text-sm font-medium
                ${isActive 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'text-tertiary hover:bg-neutral-light dark:hover:bg-white/5 hover:text-primary dark:text-gray-300'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
              {item.name}
              
              {/* Indicador lateral sutil para el estado activo */}
              {isActive && (
                <div className="ml-auto w-1.5 h-6 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-6 text-center text-xs text-tertiary opacity-60">
        v1.0.0
      </div>
    </aside>
  );
}
