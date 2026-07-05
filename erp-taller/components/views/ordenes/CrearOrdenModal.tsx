"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

interface CrearOrdenModalProps {
 isOpen: boolean;
 onClose: () => void;
 clientes: { id: string, nombre: string }[];
 productos: { id: string, nombre: string, precioVenta: string, stock: string }[];
}

export function CrearOrdenModal({ isOpen, onClose, clientes, productos }: CrearOrdenModalProps) {
 const [clienteId, setClienteId] = useState('');
 const [tipo, setTipo] = useState<'VENTA' | 'COTIZACION'>('VENTA');
 const [detalles, setDetalles] = useState<{ productoId: string, cantidad: number, precioUnitario: number }[]>([]);

 const handleAddDetalle = () => {
 setDetalles([...detalles, { productoId: '', cantidad: 1, precioUnitario: 0 }]);
 };

 const handleRemoveDetalle = (index: number) => {
 const newDetalles = [...detalles];
 newDetalles.splice(index, 1);
 setDetalles(newDetalles);
 };

 const handleDetalleChange = (index: number, field: string, value: any) => {
 const newDetalles = [...detalles];
 const detalle = newDetalles[index] as any;
 detalle[field] = value;

 // Si cambia el producto, auto-asignamos su precio
 if (field === 'productoId') {
 const prod = productos.find(p => p.id === value);
 if (prod) {
 detalle.precioUnitario = parseFloat(prod.precioVenta);
 }
 }
 
 setDetalles(newDetalles);
 };

 const totalOrden = detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 // Aquí se conectaría la Server Action para crear la orden
 alert(`Órden a crear por un total de $${totalOrden.toFixed(2)}`);
 onClose();
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nueva Venta" maxWidth="3xl">
 <form onSubmit={handleSubmit} className="flex flex-col gap-6">
 
 {/* Cabecera de la Orden */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Select 
 required
 value={tipo}
 onChange={(e) => setTipo(e.target.value as 'VENTA' | 'COTIZACION')}
 options={[
 { value: 'VENTA', label: 'Venta Directa' },
 { value: 'COTIZACION', label: 'Cotización' }
 ]}
 />
 
 <Select 
 required
 value={clienteId}
 onChange={(e) => setClienteId(e.target.value)}
 options={clientes.map(c => ({ value: c.id, label: c.nombre }))}
 />
 </div>

 <hr className="border-white/20 " />

 {/* Detalles (Productos) */}
 <div>
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-headline font-semibold text-secondary ">Líneas de Detalle</h3>
 <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={handleAddDetalle}>
 Agregar Producto
 </Button>
 </div>

 <div className="space-y-3">
 {detalles.map((det, index) => (
 <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-neutral-light/50 p-4 rounded-2xl border border-white/20 ">
 <div className="flex-1 w-full">
 <label className="text-xs text-tertiary font-medium mb-1 block">Producto</label>
 <Select 
 required
 value={det.productoId}
 onChange={(e) => handleDetalleChange(index, 'productoId', e.target.value)}
 options={productos.map(p => ({ value: p.id, label: `${p.nombre} (Disp: ${p.stock})` }))}
 />
 </div>
 
 <div className="w-full md:w-32">
 <label className="text-xs text-tertiary font-medium mb-1 block">Cant.</label>
 <Input 
 type="number"
 min="1"
 required
 value={det.cantidad || ''}
 onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value))}
 />
 </div>
 
 <div className="w-full md:w-40">
 <label className="text-xs text-tertiary font-medium mb-1 block">P. Unit ($)</label>
 <Input 
 type="number"
 step="0.01"
 min="0"
 required
 value={det.precioUnitario || ''}
 onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value))}
 />
 </div>
 
 <div className="pb-1">
 <Button type="button" variant="danger" size="md" icon={Trash2} onClick={() => handleRemoveDetalle(index)} />
 </div>
 </div>
 ))}
 
 {detalles.length === 0 && (
 <p className="text-center text-tertiary text-sm py-4">No has agregado productos a esta venta.</p>
 )}
 </div>
 </div>

 {/* Totales y Submit */}
 <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
 <div className="flex items-center gap-2">
 <span className="text-tertiary text-sm uppercase tracking-wider font-semibold">Total a Cobrar:</span>
 <span className="font-body text-3xl font-bold text-primary">${totalOrden.toFixed(2)}</span>
 </div>
 
 <Button type="submit" variant="primary" icon={ShoppingCart} disabled={detalles.length === 0 || !clienteId}>
 Completar Venta
 </Button>
 </div>
 
 </form>
 </Modal>
 );
}
