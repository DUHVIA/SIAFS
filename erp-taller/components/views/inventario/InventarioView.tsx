"use client";

import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Filter } from 'lucide-react';

interface InventarioViewProps {
 data: any[]; 
}

export function InventarioView({ data }: InventarioViewProps) {
 const [searchTerm, setSearchTerm] = useState('');

 // Lógica de filtrado local sencilla (SRP)
 const filteredData = data.filter(item => 
 item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
 item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const columns = [
 { key: 'nombre', header: 'Nombre del Producto' },
 { key: 'categoria', header: 'Categoría', 
 render: (row: any) => (
 <span className="px-2 py-1 bg-neutral-light rounded-full text-xs font-semibold">
 {row.categoria}
 </span>
 )
 },
 { key: 'precioVenta', header: 'Precio ($)', 
 render: (row: any) => <span className="font-bold">${row.precioVenta}</span> 
 },
 { key: 'stock', header: 'Stock',
 render: (row: any) => {
 const stock = parseInt(row.stock || '0');
 const isLow = stock < 5;
 return (
 <span className={`font-bold ${isLow ? 'text-red-500' : 'text-green-500'}`}>
 {row.stock}
 </span>
 );
 }
 }
 ];

 return (
 <ModuleTemplate
 title="Inventario de Productos"
 description="Gestiona el catálogo de repuestos y autopartes de tu negocio."
 actions={
 <Button icon={Plus} variant="primary">
 Nuevo Producto
 </Button>
 }
 >
 <div className="flex flex-col sm:flex-row gap-4 mb-6">
 <div className="flex-1 max-w-md">
 <Input 
 icon={Search} 
 placeholder="Buscar por nombre o categoría..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <Button icon={Filter} variant="secondary">
 Filtros
 </Button>
 </div>

 <Table 
 columns={columns} 
 data={filteredData}
 emptyMessage="No se encontraron productos en el inventario."
 />
 </ModuleTemplate>
 );
}
