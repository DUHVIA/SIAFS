"use client";

import React, { useState, useEffect } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
    Plus, Search, Filter, Cpu, Wrench, Edit3, Trash2, ArrowUpRight, 
    AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Info, Download
} from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';

import { CrearProductoModal } from './CrearProductoModal';
import { EditarProductoModal } from './EditarProductoModal';
import { RestockModal } from './RestockModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { VerKardexModal } from './VerKardexModal';

interface TipoAutoparte {
    id: string;
    nombre: string;
}

export function InventarioView() {
    // Estados para paginación y filtros
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState<'ALL' | 'AUTOPARTE' | 'MOTOR'>('ALL');
    const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESTOCKING'>('ALL');
    const [tipoAutoparteId, setTipoAutoparteId] = useState('');

    // Datos cargados de la API
    const [items, setItems] = useState<any[]>([]);
    const [tiposAutoparte, setTiposAutoparte] = useState<TipoAutoparte[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });
    const [metrics, setMetrics] = useState({
        totalSkus: 0,
        outOfStock: 0,
        lowStock: 0,
        totalValue: 0
    });

    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Estados para modales
    const [isCrearOpen, setIsCrearOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState<any | null>(null);

    // Efecto para el debounce de la búsqueda (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Resetear a la primera página al buscar
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Cargar tipos de autopartes para el dropdown
    const fetchTiposAutoparte = async () => {
        try {
            const res = await fetch('/api/tipos-autoparte');
            if (res.ok) {
                const data = await res.json();
                setTiposAutoparte(data);
            }
        } catch (error) {
            console.error('Error al cargar tipos de autopartes:', error);
        }
    };

    useEffect(() => {
        fetchTiposAutoparte();
    }, []);

    // Cargar productos de la API
    useEffect(() => {
        const fetchProductos = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search: debouncedSearch,
                    categoria: categoriaFilter === 'ALL' ? '' : categoriaFilter,
                    stockStatus: stockStatusFilter === 'ALL' ? '' : stockStatusFilter,
                    tipoAutoparteId
                });

                const res = await fetch(`/api/productos?${queryParams.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items);
                    setPagination(data.pagination);
                    setMetrics(data.metrics);
                }
            } catch (error) {
                console.error('Error al cargar productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, [page, limit, debouncedSearch, categoriaFilter, stockStatusFilter, tipoAutoparteId, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Cambiar a pestaña de reabastecimiento desde el banner
    const handleTriggerRestockingTab = () => {
        setCategoriaFilter('ALL');
        setStockStatusFilter('RESTOCKING');
        setTipoAutoparteId('');
        setPage(1);
    };

    // Estilo de badge según el stock
    const getStockLevelBadge = (row: any) => {
        const stock = parseInt(row.stock || '0', 10);
        if (stock === 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold border border-red-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Agotado
                </span>
            );
        }

        const isLow = row.categoria === 'MOTOR' ? stock <= 2 : stock <= 10;
        if (isLow) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-xs font-bold border border-orange-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Crítico ({stock})
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {stock} unidades
            </span>
        );
    };

    // Definición de columnas de la tabla de inventario
    const columns = [
        {
            key: 'nombre',
            header: 'Producto',
            render: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-light flex items-center justify-center border border-white/40 shadow-sm flex-shrink-0">
                        {row.categoria === 'MOTOR' ? (
                            <Cpu className="w-5 h-5 text-secondary" />
                        ) : (
                            <Wrench className="w-5 h-5 text-secondary" />
                        )}
                    </div>
                    <div>
                        <p className="font-headline font-bold text-sm text-secondary truncate max-w-[200px]">{row.nombre}</p>
                        {row.categoria === 'AUTOPARTE' && row.tipoAutoparte && (
                            <span className="text-[10px] text-tertiary uppercase font-label tracking-wider bg-white/60 px-1.5 py-0.5 rounded border border-white/20">
                                {row.tipoAutoparte.nombre}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'sku',
            header: 'SKU / Código',
            render: (row: any) => (
                <span className="font-label text-xs bg-white/60 text-secondary border border-white/20 px-2 py-1 rounded-lg">
                    {row.detalles?.sku || 'S/N'}
                </span>
            )
        },
        {
            key: 'categoria',
            header: 'Categoría',
            render: (row: any) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    row.categoria === 'MOTOR' 
                        ? 'bg-blue-500/10 text-blue-600' 
                        : 'bg-primary/10 text-primary'
                }`}>
                    {row.categoria === 'MOTOR' ? 'Motor' : 'Autoparte'}
                </span>
            )
        },
        {
            key: 'stock',
            header: 'Nivel de Stock',
            render: (row: any) => getStockLevelBadge(row)
        },
        {
            key: 'precioVenta',
            header: 'Precio Venta',
            render: (row: any) => (
                <span className="font-body font-bold text-secondary">
                    ${parseFloat(row.precioVenta || '0').toFixed(2)}
                </span>
            )
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (row: any) => {
                const stock = parseInt(row.stock || '0', 10);
                const isLow = stock === 0 || (row.categoria === 'MOTOR' ? stock <= 2 : stock <= 10);

                return (
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isLow && (
                            <Button 
                                size="sm" 
                                variant="primary" 
                                className="px-3 py-1 text-xs"
                                onClick={() => {
                                    setSelectedProducto(row);
                                    setIsRestockOpen(true);
                                }}
                            >
                                RESTOCK
                            </Button>
                        )}
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1.5 rounded-full hover:bg-blue-500/10 text-blue-500"
                            onClick={() => {
                                setSelectedProducto(row);
                                setIsKardexOpen(true);
                            }}
                            title="Ver Kardex"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1.5 rounded-full hover:bg-neutral-light"
                            onClick={() => {
                                setSelectedProducto(row);
                                setIsEditarOpen(true);
                            }}
                            title="Editar producto"
                        >
                            <Edit3 className="w-4 h-4 text-tertiary hover:text-secondary" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="p-1.5 rounded-full hover:bg-red-500/10 text-red-500"
                            onClick={() => {
                                setSelectedProducto(row);
                                setIsDeleteOpen(true);
                            }}
                            title="Archivar producto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    // Cargar skeletons de filas de tabla en carga
    const renderTableSkeletons = () => {
        return Array.from({ length: 5 }).map((_, idx) => (
            <tr key={idx} className="border-b border-white/40">
                <td className="px-6 py-4"><Skeleton className="h-10 w-44" /></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
            </tr>
        ));
    };

    const handleExportCSV = () => {
        const headers = ['SKU', 'Producto', 'Categoría', 'Tipo Autoparte', 'Stock', 'Precio Venta (S/)'];
        // Cambiado de 'productos' a 'items'
        const rows = items.map(p => [
            p.detalles?.sku || '',
            p.nombre || '',
            p.categoria || '',
            p.tipoAutoparte?.nombre || '-',
            p.stock || '0',
            parseFloat(p.precioVenta || '0').toFixed(2)
        ]);
        exportToCSV(`Inventario_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    };

    return (
        <ModuleTemplate
            title="Inventario de Productos"
            description="Gestiona y monitorea el catálogo encriptado de motores y autopartes de repuesto."
            actions={
                <div className="flex gap-2">
                    <Button 
                        icon={Download} 
                        variant="secondary" 
                        onClick={handleExportCSV} 
                        className="rounded-full shadow-soft"
                        // Cambiado de 'productos' a 'items'
                        disabled={loading || items.length === 0}
                    >
                        Exportar CSV
                    </Button>
                    <Button 
                        icon={RefreshCw} 
                        variant="secondary" 
                        onClick={handleRefresh} 
                        className="rounded-full shadow-soft"
                        disabled={loading}
                    />
                    <Button 
                        icon={Plus} 
                        variant="primary" 
                        onClick={() => setIsCrearOpen(true)}
                        className="rounded-full shadow-soft font-bold"
                    >
                        Agregar Producto
                    </Button>
                </div>
            }
        >
            {/* Bento Grid de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-soft">
                            <Skeleton className="h-4 w-28 mb-4" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard 
                            title="Total SKUs" 
                            value={metrics.totalSkus.toLocaleString()} 
                            icon={Wrench} 
                        />
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-headline font-semibold text-tertiary text-sm uppercase tracking-wider">Agotados</h3>
                                <div className={`w-10 h-10 rounded-full ${metrics.outOfStock > 0 ? 'bg-red-500/10' : 'bg-primary/10'} flex items-center justify-center`}>
                                    <AlertTriangle className={`w-5 h-5 ${metrics.outOfStock > 0 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                                </div>
                            </div>
                            <p className={`font-body font-bold text-3xl ${metrics.outOfStock > 0 ? 'text-red-600' : 'text-secondary'}`}>
                                {metrics.outOfStock}
                            </p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-headline font-semibold text-tertiary text-sm uppercase tracking-wider">Stock Bajo</h3>
                                <div className={`w-10 h-10 rounded-full ${metrics.lowStock > 0 ? 'bg-orange-500/10' : 'bg-primary/10'} flex items-center justify-center`}>
                                    <Info className={`w-5 h-5 ${metrics.lowStock > 0 ? 'text-orange-500' : 'text-primary'}`} />
                                </div>
                            </div>
                            <p className={`font-body font-bold text-3xl ${metrics.lowStock > 0 ? 'text-orange-500' : 'text-secondary'}`}>
                                {metrics.lowStock}
                            </p>
                        </div>
                        <StatCard 
                            title="Valor Total" 
                            value={`$${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            icon={Cpu} 
                        />
                    </>
                )}
            </div>

            {/* Controles de Búsqueda y Pestañas */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-soft border border-white/20 p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1.5 bg-neutral-light/50 p-1.5 rounded-2xl border border-white/20">
                        <button
                            onClick={() => {
                                setCategoriaFilter('ALL');
                                setStockStatusFilter('ALL');
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300 ${
                                categoriaFilter === 'ALL' && stockStatusFilter === 'ALL'
                                    ? 'bg-primary text-white shadow-soft'
                                    : 'text-tertiary hover:text-secondary'
                            }`}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => {
                                setCategoriaFilter('AUTOPARTE');
                                setStockStatusFilter('ALL');
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300 ${
                                categoriaFilter === 'AUTOPARTE' && stockStatusFilter !== 'RESTOCKING'
                                    ? 'bg-primary text-white shadow-soft'
                                    : 'text-tertiary hover:text-secondary'
                            }`}
                        >
                            Autopartes
                        </button>
                        <button
                            onClick={() => {
                                setCategoriaFilter('MOTOR');
                                setStockStatusFilter('ALL');
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300 ${
                                categoriaFilter === 'MOTOR' && stockStatusFilter !== 'RESTOCKING'
                                    ? 'bg-primary text-white shadow-soft'
                                    : 'text-tertiary hover:text-secondary'
                            }`}
                        >
                            Motores
                        </button>
                        <button
                            onClick={() => {
                                setCategoriaFilter('ALL');
                                setStockStatusFilter('RESTOCKING');
                                setTipoAutoparteId('');
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                stockStatusFilter === 'RESTOCKING'
                                    ? 'bg-primary text-white shadow-soft'
                                    : 'text-tertiary hover:text-secondary'
                            }`}
                        >
                            Reabastecimiento
                            {metrics.lowStock + metrics.outOfStock > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            )}
                        </button>
                    </div>

                    {/* Buscador y Dropdowns */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
                        <div className="flex-1">
                            <Input
                                icon={Search}
                                placeholder="Buscar SKU, producto, marca, combustible..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {categoriaFilter === 'AUTOPARTE' && (
                            <div className="w-full sm:w-48 animate-in fade-in duration-300">
                                <Select
                                    icon={Filter}
                                    options={[
                                        { value: '', label: 'Todos los tipos' },
                                        ...tiposAutoparte.map(t => ({ value: t.id, label: t.nombre }))
                                    ]}
                                    value={tipoAutoparteId}
                                    onChange={(e) => {
                                        setTipoAutoparteId(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado / Tabla */}
            <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-soft border border-white/20 overflow-hidden mb-6">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/40 bg-neutral-light/30">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="px-6 py-4 font-headline text-xs font-bold text-tertiary uppercase tracking-wider"
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40">
                            {loading ? (
                                renderTableSkeletons()
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                                        <AlertTriangle className="w-8 h-8 text-tertiary mx-auto mb-3" />
                                        <p className="font-headline font-bold text-secondary text-base">
                                            No se encontraron productos en el inventario
                                        </p>
                                        <p className="text-xs text-tertiary mt-1">
                                            Intenta cambiar los filtros de búsqueda o registra un nuevo componente.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => {
                                            setSelectedProducto(row);
                                            setIsEditarOpen(true);
                                        }}
                                        className="group transition-colors duration-200 cursor-pointer hover:bg-white/40"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className="px-6 py-4 font-body text-sm text-secondary whitespace-nowrap"
                                            >
                                                {col.render ? col.render(row) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer de Paginación */}
                {!loading && items.length > 0 && (
                    <div className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-light/30 border-t border-white/40">
                        <p className="text-xs text-tertiary font-body">
                            Mostrando <span className="font-bold text-secondary">{items.length}</span> de <span className="font-bold text-secondary">{pagination.total}</span> productos
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 rounded-full"
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            
                            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                                const pNum = idx + 1;
                                // Limitar paginación visible en UI si hay demasiadas
                                if (pagination.totalPages > 5 && Math.abs(pNum - page) > 2) {
                                    if (pNum === 1 || pNum === pagination.totalPages) {
                                        return <span key={pNum} className="text-xs text-tertiary px-1">...</span>;
                                    }
                                    return null;
                                }

                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setPage(pNum)}
                                        className={`w-8 h-8 text-xs font-bold rounded-full transition-all duration-300 ${
                                            page === pNum
                                                ? 'bg-primary text-white shadow-soft'
                                                : 'text-tertiary hover:bg-neutral-light hover:text-secondary'
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}

                            <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 rounded-full"
                                onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                disabled={page === pagination.totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Low Stock Advisory Banner */}
            {!loading && metrics.lowStock + metrics.outOfStock > 0 && stockStatusFilter !== 'RESTOCKING' && (
                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500 shadow-soft">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 md:mt-0" />
                        <div>
                            <h4 className="font-headline font-bold text-sm text-secondary">Aviso de Stock Crítico / Bajo</h4>
                            <p className="text-xs text-tertiary mt-0.5">
                                Hay <span className="font-bold text-secondary">{metrics.outOfStock} items agotados</span> y <span className="font-bold text-secondary">{metrics.lowStock} productos en stock bajo</span>. Se recomienda revisar el listado para prevenir quiebres de inventario.
                            </p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="primary" 
                        className="px-4 py-2 font-bold text-xs"
                        onClick={handleTriggerRestockingTab}
                    >
                        Revisar Recomendaciones
                    </Button>
                </div>
            )}

            {/* Modales */}
            <CrearProductoModal
                isOpen={isCrearOpen}
                onClose={() => setIsCrearOpen(false)}
                onSuccess={handleRefresh}
                tiposAutoparte={tiposAutoparte}
                onRefreshTipos={fetchTiposAutoparte}
            />

            <EditarProductoModal
                isOpen={isEditarOpen}
                onClose={() => {
                    setIsEditarOpen(false);
                    setSelectedProducto(null);
                }}
                onSuccess={handleRefresh}
                producto={selectedProducto}
                tiposAutoparte={tiposAutoparte}
                onRefreshTipos={fetchTiposAutoparte}
            />

            <RestockModal
                isOpen={isRestockOpen}
                onClose={() => {
                    setIsRestockOpen(false);
                    setSelectedProducto(null);
                }}
                onSuccess={handleRefresh}
                producto={selectedProducto}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setSelectedProducto(null);
                }}
                onSuccess={handleRefresh}
                producto={selectedProducto}
            />

            <VerKardexModal
                isOpen={isKardexOpen}
                onClose={() => {
                    setIsKardexOpen(false);
                    setSelectedProducto(null);
                }}
                producto={selectedProducto}
            />
        </ModuleTemplate>
    );
}
