"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-red-50">
        <ShieldAlert className="w-12 h-12 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold text-secondary mb-2">
        Acceso Denegado
      </h1>
      <p className="text-tertiary text-center max-w-md font-body mb-8">
        No tienes los permisos necesarios para ver esta página. Si crees que esto es un error, por favor contacta al administrador del sistema.
      </p>
      
      <Link href="/">
        <Button variant="primary" icon={ArrowLeft}>
          Volver al Dashboard
        </Button>
      </Link>
    </div>
  );
}
