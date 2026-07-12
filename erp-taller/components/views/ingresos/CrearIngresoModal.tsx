"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Search, Plus, Trash2, Loader2, Package } from 'lucide-react';

interface DetalleLinea {
  productoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  nuevoPrecioVenta?: number;
  stockActual: number;
  precioVentaActual: number;
}

interface CrearIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CrearIngresoModal({ isOpen, onClose, onSuccess }: CrearIngresoModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [descripcion, setDescripcion] = useState('');

  // Catálogo de Productos
  const [productos, setProductos] = useState<any[]>([]);
  const [productoQuery, setProductoQuery] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const productoRef = useRef<HTMLDivElement>(null);

  // Líneas del lote de ingreso
  const [detalles, setDetalles] = useState<DetalleLinea[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setDescripcion('');
      setDetalles([]);
      setProductoQuery('');
      setError(null);
    }
  }, [isOpen]);

  // Cargar productos
  useEffect(() => {
    if (!isOpen) return;
    const fetchProductos = async () => {
      try {
        const res = await fetch('/api/productos?limit=999');
        if (res.ok) {
          const data = await res.json();
          setProductos(data.items || []);
        } else {
          toast.error('Error al cargar catálogo de productos');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al conectar con la base de datos de productos');
      }
    };
    fetchProductos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Filtrar productos
  useEffect(() => {
    if (!productoQuery.trim()) {
      setProductosFiltrados(productos.slice(0, 8));
      return;
    }
    const q = productoQuery.toLowerCase();
    setProductosFiltrados(
      productos.filter(p =>
        p.nombre?.toLowerCase().includes(q) ||
        p.detalles?.sku?.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [productoQuery, productos]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productoRef.current && !productoRef.current.contains(e.target as Node)) {
        setShowProductoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const agregarProducto = (producto: any) => {
    const yaEsta = detalles.find(d => d.productoId === producto.id);
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
        costoUnitario: 0,
        stockActual: parseInt(producto.stock || '0', 10),
        precioVentaActual: parseFloat(producto.precioVenta || '0'),
      }]);
    }
    setProductoQuery('');
    setShowProductoDropdown(false);
  };

  const actualizarDetalle = (idx: number, field: keyof DetalleLinea, value: any) => {
    setDetalles(detalles.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const eliminarDetalle = (idx: number) => {
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

  const total = detalles.reduce((s, d) => s + d.cantidad * d.costoUnitario, 0);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (detalles.length === 0) {
      setError('Debes agregar al menos un producto al lote de compra');
      return;
    }

    if (!user) {
      setError('Sesión de usuario no válida');
      return;
    }

    // Validar líneas
    for (const d of detalles) {
      if (d.cantidad <= 0 || !Number.isInteger(d.cantidad)) {
        setError(`Cantidad inválida para "${d.nombre}". Debe ser un entero positivo.`);
        return;
      }
      if (d.costoUnitario <= 0) {
        setError(`Costo unitario inválido para "${d.nombre}". Debe ser mayor a 0.`);
        return;
      }
      if (d.nuevoPrecioVenta !== undefined && d.nuevoPrecioVenta <= 0) {
        setError(`El nuevo precio de venta para "${d.nombre}" debe ser mayor a 0.`);
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        usuarioId: user.id,
        descripcion: descripcion.trim() || undefined,
        detalles: detalles.map(d => ({
          productoId: d.productoId,
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitario,
          nuevoPrecioVenta: d.nuevoPrecioVenta !== undefined && !isNaN(d.nuevoPrecioVenta) ? d.nuevoPrecioVenta : undefined,
        })),
      };

      const res = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Lote de compra registrado exitosamente');
        onSuccess();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al guardar el lote de compra');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Lote de Compra (Ingreso)"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Descripción / Notas */}
        <div>
          <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
            Notas del Ingreso / Proveedor / Factura
          </label>
          <textarea
            placeholder="Ej: Compra de Bujías a Distribuidora Autopartes SAC - Factura F001-12345"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="w-full min-h-[70px] px-4 py-2.5 bg-neutral-light/50 border border-white/20 rounded-2xl text-secondary placeholder-tertiary/60 focus:outline-none focus:border-primary/50 text-sm font-body transition-colors"
          />
        </div>

        {/* Buscador de productos */}
        <div ref={productoRef} className="relative">
          <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
            Buscar Producto para Agregar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={productoQuery}
              onChange={e => {
                setProductoQuery(e.target.value);
                setShowProductoDropdown(true);
              }}
              onFocus={() => setShowProductoDropdown(true)}
              className="pl-9"
            />
          </div>
          {showProductoDropdown && productosFiltrados.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-white/20 shadow-xl rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar">
              {productosFiltrados.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => agregarProducto(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-neutral-light/60 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-secondary text-sm">{p.nombre}</p>
                    <p className="text-xs text-tertiary">
                      SKU: {p.detalles?.sku || 'N/A'} | Categoria: {p.categoria}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-secondary">Stock: {p.stock}</p>
                    <p className="text-xs text-tertiary">Venta: {fmtCurrency(parseFloat(p.precioVenta || '0'))}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle del Lote (Tabla) */}
        <div>
          <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
            Productos en el Lote ({detalles.length})
          </label>
          {detalles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-neutral-light/30 border border-dashed border-white/20 rounded-2xl text-tertiary text-sm">
              <Package className="w-8 h-8 opacity-40 mb-2" />
              <p>Agrega productos usando el buscador superior</p>
            </div>
          ) : (
            <div className="border border-white/20 rounded-2xl overflow-hidden bg-white/40">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-light/40 border-b border-white/20 font-label uppercase tracking-wider text-tertiary">
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5 w-20 text-center">Stock Act.</th>
                      <th className="px-4 py-2.5 w-24 text-center">Cantidad</th>
                      <th className="px-4 py-2.5 w-28">Costo Unit. (S/.)</th>
                      <th className="px-4 py-2.5 w-32">Nvo. P. Venta (S/.)</th>
                      <th className="px-4 py-2.5 w-24 text-right">Subtotal</th>
                      <th className="px-3 py-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d, idx) => (
                      <tr key={d.productoId} className="border-b border-white/10 hover:bg-white/40 transition-colors">
                        <td className="px-4 py-2 text-secondary font-body font-medium">
                          {d.nombre}
                          <div className="text-[10px] text-tertiary font-normal">
                            P. Venta actual: {fmtCurrency(d.precioVentaActual)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-secondary font-label">
                          {d.stockActual}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={d.cantidad}
                            onChange={e => actualizarDetalle(idx, 'cantidad', parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 text-center bg-white border border-white/30 rounded-lg text-secondary focus:outline-none focus:border-primary/50 font-label"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={d.costoUnitario || ''}
                            placeholder="0.00"
                            onChange={e => actualizarDetalle(idx, 'costoUnitario', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white border border-white/30 rounded-lg text-secondary focus:outline-none focus:border-primary/50 font-label"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={d.nuevoPrecioVenta || ''}
                            placeholder="Mantener"
                            onChange={e => actualizarDetalle(idx, 'nuevoPrecioVenta', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-24 px-2 py-1 bg-white border border-white/30 rounded-lg text-secondary focus:outline-none focus:border-primary/50 font-label"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-label font-semibold text-secondary">
                          {fmtCurrency(d.cantidad * d.costoUnitario)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarDetalle(idx)}
                            className="text-tertiary hover:text-primary transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-primary font-medium font-body">
            {error}
          </div>
        )}

        {/* Footer del Modal */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs text-tertiary font-body">Total Estimado del Lote</p>
            <p className="text-2xl font-headline font-bold text-secondary">{fmtCurrency(total)}</p>
          </div>
          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Registrando...
                </>
              ) : (
                'Registrar Compra'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
