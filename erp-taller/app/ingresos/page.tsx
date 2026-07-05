import React from 'react';
import { ArrowDownToLine } from 'lucide-react';

export default function IngresosPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <ArrowDownToLine className="w-12 h-12 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold text-secondary mb-2">
        Módulo de Compras (Ingresos)
      </h1>
      <p className="text-tertiary text-center max-w-md font-body">
        Esta sección se encuentra actualmente en construcción. Pronto podrás gestionar las compras, facturas de proveedores y entradas al almacén desde aquí.
      </p>
    </div>
  );
}
