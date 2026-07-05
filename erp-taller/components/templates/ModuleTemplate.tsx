import React from 'react';

interface ModuleTemplateProps {
 title: string;
 description?: string;
 actions?: React.ReactNode;
 children: React.ReactNode;
}

export function ModuleTemplate({ title, description, actions, children }: ModuleTemplateProps) {
 return (
 <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Header del Módulo */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="font-headline text-3xl font-bold text-secondary ">
 {title}
 </h1>
 {description && (
 <p className="text-tertiary mt-1 font-body text-sm">
 {description}
 </p>
 )}
 </div>
 
 {actions && (
 <div className="flex items-center gap-3">
 {actions}
 </div>
 )}
 </div>

 {/* Contenido Principal (Usualmente la Tabla o Grid) */}
 <div className="w-full">
 {children}
 </div>

 </div>
 );
}
