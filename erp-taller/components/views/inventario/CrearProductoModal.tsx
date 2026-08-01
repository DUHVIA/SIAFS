"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Save, Loader2, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface TipoAutoparte {
    id: string;
    nombre: string;
}

interface CrearProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tiposAutoparte: TipoAutoparte[];
    onRefreshTipos: () => Promise<void>;
}

export function CrearProductoModal({
    isOpen,
    onClose,
    onSuccess,
    tiposAutoparte,
    onRefreshTipos
}: CrearProductoModalProps) {
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

    // Estado para creación rápida de tipo de autoparte
    const [showNewTipoForm, setShowNewTipoForm] = useState(false);
    const [newTipoNombre, setNewTipoNombre] = useState('');
    const [newTipoLoading, setNewTipoLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Limpiar formulario al cerrar
            setNombre('');
            setCategoria('AUTOPARTE');
            setPrecioVenta('');
            setStock('');
            setTipoAutoparteId('');
            setEstadoFisico('Nuevo');
            setMarca('');
            setOrigen('');
            setSku('');
            setMarcasCompatibles('');
            setCombustible('Gasolina');
            setEstadoMotor('Nuevo');
            setShowNewTipoForm(false);
            setNewTipoNombre('');
            setErrors({});
        }
    }, [isOpen]);

    const handleCreateTipo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTipoNombre.trim()) return;

        setNewTipoLoading(true);
        try {
            const res = await fetch('/api/tipos-autoparte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: newTipoNombre.trim() }),
            });

            const data = await res.json();
            if (res.ok) {
                await onRefreshTipos();
                setTipoAutoparteId(data.id);
                setShowNewTipoForm(false);
                setNewTipoNombre('');
            } else {
                alert(data.error || 'Error al crear el tipo de autoparte');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setNewTipoLoading(false);
        }
    };

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
        if (!validateForm() || !user) return;

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

            const res = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al guardar el producto');
            }
        } catch (error) {
            console.error(error);
            alert('Error de red al guardar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Producto" maxWidth="xl">
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
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
                            Categoría *
                        </label>
                        <Select
                            options={[
                                { value: 'AUTOPARTE', label: 'Autoparte (Repuesto)' },
                                { value: 'MOTOR', label: 'Motor' }
                            ]}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value as 'AUTOPARTE' | 'MOTOR')}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Campos Dinámicos según Categoría */}
                {categoria === 'AUTOPARTE' ? (
                    <div className="space-y-4 p-4 bg-neutral-light rounded-2xl border border-white/40">
                        <h4 className="font-headline font-bold text-sm text-secondary uppercase tracking-wider mb-2">
                            Detalles de la Autoparte
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo de Autoparte con creación rápida */}
                            <div>
                                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Tipo de Autoparte *</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTipoForm(!showNewTipoForm)}
                                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                        {showNewTipoForm ? 'Cancelar' : '+ Agregar Nuevo'}
                                    </button>
                                </label>

                                {showNewTipoForm ? (
                                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                        <input
                                            type="text"
                                            placeholder="Nuevo tipo (ej. Culata)"
                                            value={newTipoNombre}
                                            onChange={(e) => setNewTipoNombre(e.target.value)}
                                            className="flex-1 bg-white border border-white/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 text-secondary"
                                            disabled={newTipoLoading}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleCreateTipo}
                                            size="sm"
                                            disabled={newTipoLoading || !newTipoNombre.trim()}
                                        >
                                            {newTipoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        options={tiposAutoparte.map(t => ({ value: t.id, label: t.nombre }))}
                                        value={tipoAutoparteId}
                                        onChange={(e) => setTipoAutoparteId(e.target.value)}
                                        error={errors.tipoAutoparteId}
                                        disabled={loading}
                                    />
                                )}
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
                            Precio de Venta (S/) *
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
                            Stock Inicial *
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
                                <Save className="w-4 h-4" /> Guardar Producto
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
