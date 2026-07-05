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
 <aside className="fixed inset-y-0 left-0 w-64 m-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft z-50 flex flex-col overflow-hidden">
  {/* Header del Sidebar */}
  <div className="h-28 flex flex-col items-center justify-center gap-2 px-6 bg-primary rounded-t-3xl shadow-sm relative overflow-hidden">
    <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
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
 : 'text-tertiary hover:bg-neutral-light hover:text-primary '
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
