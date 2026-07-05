"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface CrearClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CrearClienteModal({ isOpen, onClose }: CrearClienteModalProps) {
  const { success } = useToast();
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se conectaría la Server Action para crear el cliente
    success(`Cliente ${nombre} registrado exitosamente.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Cliente" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-tertiary font-medium mb-1 block">Razón Social / Nombre Completo</label>
            <Input 
              required
              placeholder="Ej. A&F Samfor S.A.C"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Documento (DNI/RUC)</label>
            <Input 
              required
              placeholder="Ej. 20123456789"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Teléfono</label>
            <Input 
              type="tel"
              placeholder="Ej. +51 999 888 777"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Correo Electrónico</label>
            <Input 
              type="email"
              placeholder="Ej. contacto@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Dirección</label>
            <Input 
              placeholder="Ej. Av. Principal 123"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/20 dark:border-white/5">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" icon={Users}>Guardar Cliente</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
