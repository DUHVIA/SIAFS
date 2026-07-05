"use client";

import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { CrearOrdenModal } from './CrearOrdenModal';

interface OrdenesViewProps {
 ordenes: any[];
 clientes: { id: string, nombre: string }[];
 productos: { id: string, nombre: string, precioVenta: string, stock: string }[];
}

export function OrdenesView({ ordenes, clientes, productos }: OrdenesViewProps) {
 const [isModalOpen, setIsModalOpen] = useState(false);

 const columns = [
 { key: 'numeroOrden', header: 'Orden #' },
 { key: 'tipo', header: 'Tipo', 
 render: (row: any) => (
 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.tipo === 'VENTA' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600 '}`}>
 {row.tipo}
 </span>
 )
 },
 { key: 'createdAt', header: 'Fecha', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
 { key: 'total', header: 'Total ($)', 
 render: (row: any) => <span className="font-bold">${row.total}</span> 
 }
 ];

 return (
 <>
 <ModuleTemplate
 title="Ventas y Cotizaciones"
 description="Registra y administra las ventas de repuestos y órdenes de servicio."
 actions={
 <Button icon={Plus} variant="primary" onClick={() => setIsModalOpen(true)}>
 Nueva Venta
 </Button>
 }
 >
 <Table 
 columns={columns} 
 data={ordenes}
 emptyMessage="No hay órdenes registradas aún."
 />
 </ModuleTemplate>

 <CrearOrdenModal 
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 clientes={clientes}
 productos={productos}
 />
 </>
 );
}
