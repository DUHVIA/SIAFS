"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Wallet } from 'lucide-react';

interface CrearGastoModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function CrearGastoModal({ isOpen, onClose }: CrearGastoModalProps) {
 const [motivo, setMotivo] = useState('');
 const [monto, setMonto] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 alert(`Gasto por $${monto} registrado.`);
 onClose();
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="Registrar Gasto Interno" maxWidth="sm">
 <form onSubmit={handleSubmit} className="flex flex-col gap-6">
 <div>
 <label className="text-xs text-tertiary font-medium mb-1 block">Motivo del Gasto</label>
 <Input 
 required
 placeholder="Ej. Compra de suministros"
 value={motivo}
 onChange={(e) => setMotivo(e.target.value)}
 />
 </div>

 <div>
 <label className="text-xs text-tertiary font-medium mb-1 block">Monto ($)</label>
 <Input 
 required
 type="number"
 step="0.01"
 min="0"
 placeholder="0.00"
 value={monto}
 onChange={(e) => setMonto(e.target.value)}
 />
 </div>

 <div className="flex justify-end pt-4 border-t border-white/20 ">
 <div className="flex gap-3">
 <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
 <Button type="submit" variant="primary" icon={Wallet}>Registrar Gasto</Button>
 </div>
 </div>
 </form>
 </Modal>
 );
}
