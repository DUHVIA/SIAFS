"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Trash2, ShoppingCart, FileText, Search, Loader2, User, Package, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface DetalleLinea {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    precioCosto: number;
    stockDisponible: number;
}

interface CrearOrdenModalProps {
    isOpen: boolean;
    tipoInicial: 'VENTA' | 'COTIZACION';
    onClose: () => void;
    onSuccess: () => void;
}

export function CrearOrdenModal({ isOpen, tipoInicial, onClose, onSuccess }: CrearOrdenModalProps) {
    const { user } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState<'VENTA' | 'COTIZACION'>(tipoInicial);

    // Clientes
    const [clientes, setClientes] = useState<any[]>([]);
    const [clienteQuery, setClienteQuery] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
    const [showClienteDropdown, setShowClienteDropdown] = useState(false);
    const clienteRef = useRef<HTMLDivElement>(null);

    // Productos
    const [productos, setProductos] = useState<any[]>([]);
    const [productoQuery, setProductoQuery] = useState('');
    const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
    const [showProductoDropdown, setShowProductoDropdown] = useState(false);
    const productoRef = useRef<HTMLDivElement>(null);

    // Detalles / líneas de la orden
    const [detalles, setDetalles] = useState<DetalleLinea[]>([]);

    // Métodos de pago
    const [metodosPago, setMetodosPago] = useState<any[]>([]);
    const [metodoPagoId, setMetodoPagoId] = useState('');

    const [error, setError] = useState<string | null>(null);

    // Actualizar tipo cuando cambia tipoInicial
    useEffect(() => {
        if (isOpen) {
            setTipo(tipoInicial);
            setDetalles([]);
            setClienteQuery('');
            setClienteSeleccionado(null);
            setProductoQuery('');
            setMetodoPagoId('');
            setError(null);
        }
    }, [isOpen, tipoInicial]);

    // Cargar catálogos al abrir
    useEffect(() => {
        if (!isOpen) return;
        const fetchCatalogos = async () => {
            try {
                const [cRes, pRes, mRes] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/productos?limit=999'),
                    fetch('/api/metodos-pago'),
                ]);
                // ==== CORRECION (Validación inteligente):
                if (cRes.ok) {
                    const cData = await cRes.json();
                    // Si es un array directo, lo guarda. Si es un objeto, busca la propiedad '.items' o '.clientes'
                    const arrayClientes = Array.isArray(cData) ? cData : (cData.items || cData.clientes || []);
                    setClientes(arrayClientes);
                }
                if (pRes.ok) { const d = await pRes.json(); setProductos(d.items || []); }
                if (mRes.ok) setMetodosPago(await mRes.json());
            } catch {
                toast.error('Error al cargar catálogos');
            }
        };
        fetchCatalogos();
    }, [isOpen]);

    // Filtro clientes
    useEffect(() => {
        if (!clienteQuery.trim()) { setClientesFiltrados(clientes.slice(0, 8)); return; }
        const q = clienteQuery.toLowerCase();
        setClientesFiltrados(
            clientes.filter(c =>
                c.nombre?.toLowerCase().includes(q) ||
                c.documento?.toLowerCase().includes(q)
            ).slice(0, 8)
        );
    }, [clienteQuery, clientes]);

    // Filtro productos
    useEffect(() => {
        if (!productoQuery.trim()) { setProductosFiltrados(productos.slice(0, 8)); return; }
        const q = productoQuery.toLowerCase();
        setProductosFiltrados(
            productos.filter(p =>
                p.nombre?.toLowerCase().includes(q) ||
                p.detalles?.sku?.toLowerCase().includes(q)
            ).slice(0, 8)
        );
    }, [productoQuery, productos]);

    // Cerrar dropdowns al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) {
                setShowClienteDropdown(false);
            }
            if (productoRef.current && !productoRef.current.contains(e.target as Node)) {
                setShowProductoDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const seleccionarCliente = (cliente: any) => {
        setClienteSeleccionado(cliente);
        setClienteQuery(cliente.nombre);
        setShowClienteDropdown(false);
    };

    const agregarProducto = (producto: any) => {
        const yaEsta = detalles.find(d => d.productoId === producto.id);
        const costo = typeof producto.precioCosto === 'number' && producto.precioCosto > 0
            ? producto.precioCosto
            : parseFloat(producto.detalles?.costo || producto.detalles?.precioCompra || producto.precioCosto || '0');
        if (yaEsta) {
            setDetalles(detalles.map(d =>
                d.productoId === producto.id
                    ? { ...d, cantidad: d.cantidad + 1 }
                    : d
            ));
        } else {
            setDetalles([...detalles, {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: parseFloat(producto.precioVenta || '0'),
                precioCosto: costo,
                stockDisponible: parseInt(producto.stock || '0', 10),
            }]);
        }
        setProductoQuery('');
        setShowProductoDropdown(false);
    };

    const actualizarDetalle = (idx: number, field: 'cantidad' | 'precioUnitario' | 'precioCosto', value: number) => {
        setDetalles(detalles.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    };

    const eliminarDetalle = (idx: number) => {
        setDetalles(detalles.filter((_, i) => i !== idx));
    };

    const subtotal = detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
    const costoTotal = detalles.reduce((s, d) => s + d.cantidad * (d.precioCosto || 0), 0);
    const gananciaEstimada = subtotal - costoTotal;
    const margenPorcentaje = subtotal > 0 ? (gananciaEstimada / subtotal) * 100 : 0;

    const fmtCurrency = (v: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!clienteSeleccionado) { setError('Debes seleccionar un cliente'); return; }
        if (detalles.length === 0) { setError('Agrega al menos un producto a la orden'); return; }
        if (!user) return;

        for (const d of detalles) {
            if (d.cantidad <= 0) { setError(`Cantidad inválida para "${d.nombre}"`); return; }
            if (d.precioUnitario <= 0) { setError(`Precio inválido para "${d.nombre}"`); return; }
            if (tipo === 'VENTA' && d.cantidad > d.stockDisponible) {
                setError(`Stock insuficiente para "${d.nombre}" (disponible: ${d.stockDisponible})`);
                return;
            }
        }

        setLoading(true);
        try {
            const body: any = {
                tipo,
                clienteId: clienteSeleccionado.id,
                usuarioId: user.id,
                detalles: detalles.map(d => ({
                    productoId: d.productoId,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                })),
            };
            if (tipo === 'VENTA' && metodoPagoId) {
                body.metodoPagoId = metodoPagoId;
            }

            const res = await fetch('/api/ordenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(tipo === 'VENTA' ? 'Venta registrada exitosamente' : 'Cotización creada exitosamente');
                onSuccess();
            } else {
                const err = await res.json();
                setError(err.error || 'Error al guardar la orden');
            }
        } catch {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={tipo === 'VENTA' ? 'Registrar Nueva Venta' : 'Crear Nueva Cotización'}
            maxWidth="3xl"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Tipo de orden */}
                <div className="flex gap-2">
                    {(['VENTA', 'COTIZACION'] as const).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTipo(t)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                                tipo === t
                                    ? t === 'VENTA'
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white/60 text-tertiary border-white/30 hover:border-white/60'
                            }`}
                        >
                            {t === 'VENTA' ? <ShoppingCart className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            {t === 'VENTA' ? 'Venta Directa' : 'Cotización'}
                        </button>
                    ))}
                </div>

                {/* Selector de cliente */}
                <div ref={clienteRef} className="relative">
                    <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                        Cliente *
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <Input
                            placeholder="Buscar por nombre o documento..."
                            value={clienteQuery}
                            onChange={e => { setClienteQuery(e.target.value); setClienteSeleccionado(null); setShowClienteDropdown(true); }}
                            onFocus={() => setShowClienteDropdown(true)}
                            className="pl-9"
                        />
                    </div>
                    {showClienteDropdown && clientesFiltrados.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-white/20 shadow-xl rounded-2xl overflow-hidden">
                            {clientesFiltrados.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onMouseDown={() => seleccionarCliente(c)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-neutral-light/60 transition-colors"
                                >
                                    <p className="font-semibold text-secondary text-sm">{c.nombre}</p>
                                    <p className="text-xs text-tertiary">{c.documento}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    {clienteSeleccionado && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Seleccionado: {clienteSeleccionado.nombre}
                        </div>
                    )}
                </div>

                {/* Método de pago (solo para VENTA) */}
                {tipo === 'VENTA' && metodosPago.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
                            Método de Pago
                        </label>
                        <Select
                            value={metodoPagoId}
                            onChange={e => setMetodoPagoId(e.target.value)}
                            options={[
                                { value: '', label: 'Sin especificar' },
                                ...metodosPago.map(m => ({ value: m.id, label: m.nombre }))
                            ]}
                        />
                    </div>
                )}

                <hr className="border-white/20" />

                {/* Buscador de productos */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-headline font-semibold text-sm text-secondary uppercase tracking-wide">
                            Productos ({detalles.length})
                        </h3>
                    </div>

                    <div ref={productoRef} className="relative mb-3">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <Input
                            placeholder="Buscar y agregar producto..."
                            value={productoQuery}
                            onChange={e => { setProductoQuery(e.target.value); setShowProductoDropdown(true); }}
                            onFocus={() => setShowProductoDropdown(true)}
                            className="pl-9"
                        />
                        {showProductoDropdown && productosFiltrados.length > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-white/20 shadow-xl rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                                {productosFiltrados.map(p => {
                                    const stock = parseInt(p.stock || '0', 10);
                                    const sinStock = stock === 0;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={sinStock}
                                            onMouseDown={() => !sinStock && agregarProducto(p)}
                                            className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                                                sinStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-light/60'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-semibold text-secondary text-sm">{p.nombre}</p>
                                                <p className="text-xs text-tertiary">
                                                    {p.detalles?.sku ? `SKU: ${p.detalles.sku} · ` : ''}
                                                    Stock: {stock}
                                                </p>
                                            </div>
                                            <span className="font-label text-sm font-bold text-secondary whitespace-nowrap">
                                                S/ {parseFloat(p.precioVenta || '0').toFixed(2)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Líneas de detalle */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {detalles.length === 0 ? (
                            <p className="text-center text-tertiary text-sm py-6">
                                Usa el buscador de arriba para agregar productos.
                            </p>
                        ) : detalles.map((det, idx) => (
                            <div key={det.productoId} className="flex items-center gap-2 bg-neutral-light/40 rounded-2xl p-3 border border-white/30">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-secondary truncate">{det.nombre}</p>
                                    <p className="text-xs text-tertiary">Stock: {det.stockDisponible}</p>
                                </div>
                                <div className="w-20">
                                    <label className="text-[10px] text-tertiary block mb-0.5">Cant.</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={tipo === 'VENTA' ? det.stockDisponible : undefined}
                                        value={det.cantidad}
                                        onChange={e => actualizarDetalle(idx, 'cantidad', parseInt(e.target.value, 10) || 1)}
                                        className="text-center"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-[10px] text-tertiary block mb-0.5">P. Costo (S/)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={det.precioCosto}
                                        onChange={e => actualizarDetalle(idx, 'precioCosto', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-[10px] text-tertiary block mb-0.5">P. Venta (S/)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={det.precioUnitario}
                                        onChange={e => actualizarDetalle(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="w-24 text-right">
                                    <label className="text-[10px] text-tertiary block mb-0.5">Subtotal</label>
                                    <p className="font-body font-bold text-sm text-secondary">
                                        {fmtCurrency(det.cantidad * det.precioUnitario)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => eliminarDetalle(idx)}
                                    className="p-1.5 rounded-xl text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card de Ganancia Estimada y Margen % en tiempo real */}
                {detalles.length > 0 && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4 font-body shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                                gananciaEstimada >= 0 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'
                            }`}>
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Ganancia Estimada Proyectada</p>
                                <p className={`font-headline text-xl font-bold ${gananciaEstimada >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {fmtCurrency(gananciaEstimada)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[10px] text-tertiary uppercase tracking-wider font-medium">Costo Total Productos</p>
                                <p className="font-label text-sm font-semibold text-secondary">{fmtCurrency(costoTotal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-tertiary uppercase tracking-wider font-medium mb-0.5">Margen de Ganancia</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    margenPorcentaje >= 20 ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' :
                                    margenPorcentaje > 0 ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' :
                                    'bg-red-500/20 text-red-700 border border-red-500/30'
                                }`}>
                                    {margenPorcentaje.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                {/* Total + Submit */}
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-tertiary uppercase tracking-wider font-semibold">
                            Total a {tipo === 'VENTA' ? 'Cobrar' : 'Cotizar'}:
                        </span>
                        <span className="font-body text-3xl font-bold text-primary">
                            {fmtCurrency(subtotal)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || detalles.length === 0 || !clienteSeleccionado}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                            ) : tipo === 'VENTA' ? (
                                <><ShoppingCart className="w-4 h-4" /> Completar Venta</>
                            ) : (
                                <><FileText className="w-4 h-4" /> Guardar Cotización</>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
