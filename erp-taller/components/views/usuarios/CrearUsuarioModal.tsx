"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UserPlus } from 'lucide-react';

interface CrearUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: { id: string, nombre: string }[];
}

export function CrearUsuarioModal({ isOpen, onClose, roles }: CrearUsuarioModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rolId, setRolId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se conectaría la Server Action para crear el usuario
    alert(`Usuario ${nombre} creado existosamente.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Miembro del Personal" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-tertiary font-medium mb-1 block">Nombre Completo</label>
            <Input 
              required
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Correo (Usuario de Acceso)</label>
            <Input 
              required
              type="email"
              placeholder="Ej. juan@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-tertiary font-medium mb-1 block">Contraseña Temporal</label>
            <Input 
              required
              type="password"
              placeholder="Min 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-tertiary font-medium mb-1 block">Rol de Sistema</label>
            <Select 
              required
              value={rolId}
              onChange={(e) => setRolId(e.target.value)}
              options={roles.map(r => ({ value: r.id, label: r.nombre }))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/20 dark:border-white/5">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" icon={UserPlus}>Crear Usuario</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
