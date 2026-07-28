"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/config';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowDownToLine,
  Users,
  Wallet,
  UserCog,
  X,
  LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'VER_DASHBOARD' },
  { name: 'Inventario', href: '/inventario', icon: Package, permission: 'VER_PRODUCTOS' },
  { name: 'Ventas', href: '/ordenes', icon: ShoppingCart, permission: 'VER_ORDENES' },
  { name: 'Compras', href: '/ingresos', icon: ArrowDownToLine, permission: 'VER_INGRESOS' },
  { name: 'Clientes', href: '/clientes', icon: Users, permission: 'VER_CLIENTES' },
  { name: 'Gastos', href: '/finanzas', icon: Wallet, permission: 'VER_GASTOS' },
  { name: 'Personal', href: '/usuarios', icon: UserCog, permission: 'GESTIONAR_USUARIOS' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, permisos } = useAuth();

  return (
    <>
      {/* Backdrop para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-45 bg-secondary/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 m-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft z-50 flex flex-col overflow-hidden transition-all duration-300
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-80 lg:translate-x-0'}
        `}
      >
        {/* Header del Sidebar */}
        <div className="h-28 flex flex-col items-center justify-center gap-2 px-6 bg-primary rounded-t-3xl shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors lg:hidden z-20"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={siteConfig.logo}
            alt={siteConfig.name}
            className="w-12 h-12 object-contain rounded-full shadow-md border-2 border-white/20 bg-white z-10"
          />
          <h1 className="font-headline font-bold text-lg text-white tracking-tight z-10">
            {siteConfig.name}
          </h1>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.filter(item => !item.permission || permisos.includes(item.permission)).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-body text-sm font-medium
   ${isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-tertiary hover:bg-primary/5 hover:text-primary '
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
        <div className="p-5 flex flex-col gap-4 border-t border-black/5 bg-white/50">
          
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                {user.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-secondary truncate">{user.nombre}</span>
                <span className="text-xs text-tertiary bg-black/5 px-2 py-0.5 rounded-full w-max">{user.rolNombre}</span>
              </div>
            </div>
          )}

          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-headline font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
          <div className="text-center text-xs text-tertiary opacity-60">
            v1.0.0
          </div>
        </div>
      </aside>
    </>
  );
}
