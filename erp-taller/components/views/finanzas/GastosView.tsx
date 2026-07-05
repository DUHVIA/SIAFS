"use client";
import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search } from 'lucide-react';
import { CrearGastoModal } from './CrearGastoModal';

interface GastosViewProps {
 gastos: any[];
}

export function GastosView({ gastos }: GastosViewProps) {
 const [searchTerm, setSearchTerm] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);

 const filteredData = gastos.filter(g => 
 g.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const columns = [
 { key: 'fecha', header: 'Fecha', render: (row: any) => new Date(row.fecha).toLocaleDateString() },
 { key: 'motivo', header: 'Motivo / Descripción', render: (row: any) => <span className="font-medium text-secondary ">{row.motivo}</span> },
 { key: 'monto', header: 'Monto ($)', render: (row: any) => <span className="font-bold text-red-500">-${row.monto}</span> },
 { key: 'usuario', header: 'Registrado por', render: (row: any) => <span className="text-sm text-tertiary">{row.usuario?.nombre || 'Sistema'}</span> }
 ];

 return (
 <>
 <ModuleTemplate
 title="Gastos de Caja Chica"
 description="Lleva el control de los gastos internos de la empresa."
 actions={
 <Button icon={Plus} variant="primary" onClick={() => setIsModalOpen(true)}>
 Registrar Gasto
 </Button>
 }
 >
 <div className="flex flex-col sm:flex-row gap-4 mb-6">
 <div className="flex-1 max-w-md">
 <Input 
 icon={Search} 
 placeholder="Buscar por motivo..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <Table 
 columns={columns} 
 data={filteredData}
 emptyMessage="No hay gastos registrados en el sistema."
 />
 </ModuleTemplate>

 <CrearGastoModal 
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 />
 </>
 );
}
