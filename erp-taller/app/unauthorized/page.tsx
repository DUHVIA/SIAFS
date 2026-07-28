import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { siteConfig } from '@/lib/config';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
      
      {/* Background gradients decorativos */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-400/20 blur-[100px] pointer-events-none" />
      
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 md:p-12 rounded-3xl shadow-soft max-w-md w-full text-center relative z-10 flex flex-col items-center">
        
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-headline font-bold text-secondary mb-3">
          Acceso Denegado
        </h1>
        
        <p className="text-tertiary mb-8 font-body leading-relaxed text-sm">
          No tienes los permisos necesarios para acceder a este módulo de <span className="font-semibold text-secondary">{siteConfig.name}</span>. 
          Si crees que esto es un error, por favor contacta al administrador del sistema.
        </p>

        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard principal
        </Link>
      </div>
    </div>
  );
}
