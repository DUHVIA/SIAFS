"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface TipoAutoparte {
    id: string;
    nombre: string;
}

interface EditarProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: any | null;
    tiposAutoparte: TipoAutoparte[];
    onRefreshTipos: () => Promise<void>;
}

export function EditarProductoModal({
    isOpen,
    onClose,
    onSuccess,
    producto,
    tiposAutoparte,
    onRefreshTipos
}: EditarProductoModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Campos del formulario
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState<'AUTOPARTE' | 'MOTOR'>('AUTOPARTE');
    const [precioVenta, setPrecioVenta] = useState('');
    const [stock, setStock] = useState('');

    // Detalles específicos para Autoparte
    const [tipoAutoparteId, setTipoAutoparteId] = useState('');
    const [estadoFisico, setEstadoFisico] = useState('Nuevo');
    const [marca, setMarca] = useState('');
    const [origen, setOrigen] = useState('');
    const [sku, setSku] = useState('');

    // Detalles específicos para Motor
    const [marcasCompatibles, setMarcasCompatibles] = useState('');
    const [combustible, setCombustible] = useState('Gasolina');
    const [estadoMotor, setEstadoMotor] = useState('Nuevo');

    // Cargar datos del producto seleccionado
    useEffect(() => {
        if (isOpen && producto) {
            setNombre(producto.nombre || '');
            setCategoria(producto.categoria || 'AUTOPARTE');
            setPrecioVenta(producto.precioVenta || '');
            setStock(producto.stock || '');

            const d = producto.detalles || {};
            setSku(d.sku || '');

            if (producto.categoria === 'AUTOPARTE') {
                setTipoAutoparteId(producto.tipoAutoparteId || '');
                setEstadoFisico(d.estado_fisico || 'Nuevo');
                setMarca(d.marca || '');
                setOrigen(d.origen || '');
            } else {
                setEstadoMotor(d.estado || 'Nuevo');
                setCombustible(d.combustible || 'Gasolina');
                setMarcasCompatibles(Array.isArray(d.marcasCompatibles) ? d.marcasCompatibles.join(', ') : '');
            }
            setErrors({});
        }
    }, [isOpen, producto]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (!precioVenta.trim()) {
            newErrors.precioVenta = 'El precio de venta es requerido';
        } else if (!/^\d+(\.\d+)?$/.test(precioVenta)) {
            newErrors.precioVenta = 'El precio debe ser un número positivo (ej: 45 o 45.50)';
        }

        if (!stock.trim()) {
            newErrors.stock = 'El stock es requerido';
        } else if (!/^\d+$/.test(stock)) {
            newErrors.stock = 'El stock debe ser un número entero positivo';
        }

        if (categoria === 'AUTOPARTE') {
            if (!tipoAutoparteId) newErrors.tipoAutoparteId = 'El tipo de autoparte es requerido';
            if (!sku.trim()) newErrors.sku = 'El SKU es requerido';
        } else {
            if (!sku.trim()) newErrors.sku = 'El SKU/Código es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !user || !producto) return;

        setLoading(true);
        try {
            let detalles: any = {};
            if (categoria === 'AUTOPARTE') {
                detalles = {
                    sku: sku.trim(),
                    estado_fisico: estadoFisico,
                    marca: marca.trim(),
                    origen: origen.trim()
                };
            } else {
                detalles = {
                    sku: sku.trim(),
                    estado: estadoMotor,
                    combustible,
                    marcasCompatibles: marcasCompatibles
                        .split(',')
                        .map(m => m.trim())
                        .filter(m => m.length > 0)
                };
            }

            const payload = {
                usuarioId: user.id,
                nombre: nombre.trim(),
                categoria,
                precioVenta,
                stock,
                tipoAutoparteId: categoria === 'AUTOPARTE' ? tipoAutoparteId : null,
                detalles
            };

            const res = await fetch(`/api/productos/${producto.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error(error);
            alert('Error de red al actualizar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Datos de Producto" maxWidth="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre y Categoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                            Nombre del Producto *
                        </label>
                        <Input
                            placeholder="Ej. Bujía Iridium NGK"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            error={errors.nombre}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2 font-body">
                            Categoría (No editable)
                        </label>
                        <select
                            className="w-full bg-neutral-light border border-white/40 rounded-2xl px-4 py-3 font-body text-sm text-tertiary outline-none cursor-not-allowed opacity-75"
                            value={categoria}
                            disabled
                        >
                            <option value="AUTOPARTE">Autoparte (Repuesto)</option>
                            <option value="MOTOR">Motor</option>
                        </select>
                    </div>
                </div>

                {/* Campos Dinámicos según Categoría */}
                {categoria === 'AUTOPARTE' ? (
                    <div className="space-y-4 p-4 bg-neutral-light rounded-2xl border border-white/40">
                        <h4 className="font-headline font-bold text-sm text-secondary uppercase tracking-wider mb-2">
                            Detalles de la Autoparte
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo de Autoparte */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Tipo de Autoparte *
                                </label>
                                <Select
                                    options={tiposAutoparte.map(t => ({ value: t.id, label: t.nombre }))}
                                    value={tipoAutoparteId}
                                    onChange={(e) => setTipoAutoparteId(e.target.value)}
                                    error={errors.tipoAutoparteId}
                                    disabled={loading}
                                />
                            </div>

                            {/* SKU */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    SKU / Código *
                                </label>
                                <Input
                                    placeholder="Ej. BRK-990-22"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    error={errors.sku}
                                    disabled={loading}
                                />
                            </div>

                            {/* Estado Físico */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Estado Físico *
                                </label>
                                <Select
                                    options={[
                                        { value: 'Nuevo', label: 'Nuevo' },
                                        { value: 'Usado', label: 'Usado' },
                                        { value: 'Reconstruido', label: 'Reconstruido' }
                                    ]}
                                    value={estadoFisico}
                                    onChange={(e) => setEstadoFisico(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Marca */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Marca
                                </label>
                                <Input
                                    placeholder="Ej. NGK"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Origen */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Origen
                                </label>
                                <Input
                                    placeholder="Ej. Japón"
                                    value={origen}
                                    onChange={(e) => setOrigen(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 p-4 bg-neutral-light rounded-2xl border border-white/40">
                        <h4 className="font-headline font-bold text-sm text-secondary uppercase tracking-wider mb-2">
                            Detalles del Motor
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SKU / Código del Motor */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    SKU / Código del Motor *
                                </label>
                                <Input
                                    placeholder="Ej. MTR-TOY-221"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    error={errors.sku}
                                    disabled={loading}
                                />
                            </div>

                            {/* Tipo de Combustible */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Tipo de Combustible *
                                </label>
                                <Select
                                    options={[
                                        { value: 'Gasolina', label: 'Gasolina' },
                                        { value: 'Diésel', label: 'Diésel' },
                                        { value: 'GLP', label: 'GLP' },
                                        { value: 'GNV', label: 'GNV' }
                                    ]}
                                    value={combustible}
                                    onChange={(e) => setCombustible(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Estado del Motor */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Estado *
                                </label>
                                <Select
                                    options={[
                                        { value: 'Nuevo', label: 'Nuevo' },
                                        { value: 'Usado', label: 'Usado' },
                                        { value: 'Reconstruido', label: 'Reconstruido' }
                                    ]}
                                    value={estadoMotor}
                                    onChange={(e) => setEstadoMotor(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Marcas Compatibles */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                                    Marcas Compatibles (separadas por comas)
                                </label>
                                <Input
                                    placeholder="Ej. Toyota, Nissan, Lexus"
                                    value={marcasCompatibles}
                                    onChange={(e) => setMarcasCompatibles(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Precios y Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                            Precio de Venta ($) *
                        </label>
                        <Input
                            placeholder="Ej. 189.50"
                            value={precioVenta}
                            onChange={(e) => setPrecioVenta(e.target.value)}
                            error={errors.precioVenta}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                            Stock *
                        </label>
                        <Input
                            placeholder="Ej. 15"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            error={errors.stock}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-light/50">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
