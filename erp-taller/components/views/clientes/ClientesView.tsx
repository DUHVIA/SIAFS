"use client";

import React, { useState } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search } from 'lucide-react';
import { CrearClienteModal } from './CrearClienteModal';

interface ClientesViewProps {
  clientes: any[];
}

export function ClientesView({ clientes }: ClientesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento?.includes(searchTerm)
  );

  const columns = [
    { key: 'documento', header: 'RUC/DNI', render: (row: any) => <span className="font-medium text-tertiary">{row.documento}</span> },
    { key: 'nombre', header: 'Nombre / Razón Social', render: (row: any) => <span className="font-bold">{row.nombre}</span> },
    { key: 'telefono', header: 'Teléfono', render: (row: any) => row.telefono || '-' },
    { key: 'correo', header: 'Correo', render: (row: any) => row.correo || '-' },
    { key: 'isActive', header: 'Estado', 
      render: (row: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    }
  ];

  return (
    <>
      <ModuleTemplate
        title="Cartera de Clientes"
        description="Administra los datos de facturación y contacto de tus clientes."
        actions={
          <Button icon={Plus} variant="primary" onClick={() => setIsModalOpen(true)}>
            Nuevo Cliente
          </Button>
        }
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input 
              icon={Search} 
              placeholder="Buscar por nombre o documento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredData}
          emptyMessage="No se encontraron clientes en el sistema."
        />
      </ModuleTemplate>

      <CrearClienteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
