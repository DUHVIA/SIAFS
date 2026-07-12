"use client";

import React, { useState, useEffect } from 'react';
import { ModuleTemplate } from '@/components/templates/ModuleTemplate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Plus, Search, Users, UserCheck, UserPlus, RefreshCw,
    ChevronLeft, ChevronRight, Eye, Edit3, Trash2, Phone, Mail
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { CrearClienteModal } from './CrearClienteModal';
import { EditarClienteModal } from './EditarClienteModal';
import { VerClienteModal } from './VerClienteModal';

export function ClientesView() {
    const toast = useToast();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
    const [metrics, setMetrics] = useState({ totalClientes: 0, nuevosEsteMes: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modales
    const [isCrearOpen, setIsCrearOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isVerOpen, setIsVerOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    // Debounce
    useEffect(() => {
        const h = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
        return () => clearTimeout(h);
    }, [searchTerm]);

    // Fetch clientes
    useEffect(() => {
        const fetchClientes = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '15',
                    search: debouncedSearch,
                });
                const res = await fetch(`/api/clientes?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items);
                    setPagination(data.pagination);
                    setMetrics(data.metrics);
                }
            } catch {
                toast.error('Error al cargar los clientes');
            } finally {
                setLoading(false);
            }
        };
        fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, refreshTrigger]);

    const handleRefresh = () => setRefreshTrigger(t => t + 1);

    const handleEditar = (cliente: any) => {
        setSelectedCliente(cliente);
        setIsEditarOpen(true);
    };

    const handleVer = (cliente: any) => {
        setSelectedCliente(cliente);
        setIsVerOpen(true);
    };

    const handleDesactivar = async (id: string) => {
        setLoadingDelete(true);
        try {
            const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Cliente desactivado correctamente');
                handleRefresh();
            } else {
                toast.error('Error al desactivar el cliente');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoadingDelete(false);
            setConfirmDelete(null);
        }
    };

    const renderSkeletonRows = () =>
        Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-white/20">
                {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                    </td>
                ))}
            </tr>
        ));

    return (
        <>
            <ModuleTemplate
                title="Cartera de Clientes"
                description="Administra los datos de contacto e historial de órdenes de tus clientes."
                actions={
                    <Button variant="primary" icon={Plus} onClick={() => setIsCrearOpen(true)}>
                        Nuevo Cliente
                    </Button>
                }
            >
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Total Clientes</p>
                            {loading
                                ? <Skeleton className="h-7 w-16 rounded mt-1" />
                                : <p className="font-headline text-2xl font-bold text-secondary mt-0.5">{metrics.totalClientes}</p>
                            }
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Activos</p>
                            {loading
                                ? <Skeleton className="h-7 w-16 rounded mt-1" />
                                : <p className="font-headline text-2xl font-bold text-secondary mt-0.5">{pagination.total}</p>
                            }
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-tertiary uppercase tracking-wider font-label font-semibold">Nuevos este mes</p>
                            {loading
                                ? <Skeleton className="h-7 w-16 rounded mt-1" />
                                : <p className="font-headline text-2xl font-bold text-secondary mt-0.5">{metrics.nuevosEsteMes}</p>
                            }
                        </div>
                    </div>
                </div>

                {/* Tabla principal */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft rounded-3xl overflow-hidden">
                    {/* Barra de búsqueda */}
                    <div className="flex items-center justify-between gap-3 p-4 border-b border-white/20">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                            <Input
                                placeholder="Buscar por nombre, documento o correo..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleRefresh} title="Actualizar">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-light/40 border-b border-white/20">
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">DNI / RUC</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Nombre / Razón Social</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Contacto</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Dirección</th>
                                    <th className="px-4 py-3 text-left text-xs font-label uppercase tracking-wider text-tertiary">Registro</th>
                                    <th className="px-4 py-3 text-right text-xs font-label uppercase tracking-wider text-tertiary">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? renderSkeletonRows() : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-tertiary">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-8 h-8 text-tertiary/40" />
                                                <p className="font-medium">No hay clientes registrados</p>
                                                {debouncedSearch && <p className="text-sm">para &ldquo;{debouncedSearch}&rdquo;</p>}
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.map((cliente, idx) => (
                                    <tr
                                        key={cliente.id}
                                        className={`border-b border-white/10 transition-colors hover:bg-primary/5 ${idx % 2 !== 0 ? 'bg-neutral-light/20' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="font-label text-xs bg-white/60 text-secondary border border-white/20 px-2 py-1 rounded-lg">
                                                {cliente.documento}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-headline font-bold text-sm text-secondary">{cliente.nombre}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                {cliente.telefono && (
                                                    <span className="flex items-center gap-1.5 text-xs text-tertiary">
                                                        <Phone className="w-3 h-3" /> {cliente.telefono}
                                                    </span>
                                                )}
                                                {cliente.correo && (
                                                    <span className="flex items-center gap-1.5 text-xs text-tertiary truncate max-w-[180px]">
                                                        <Mail className="w-3 h-3 flex-shrink-0" /> {cliente.correo}
                                                    </span>
                                                )}
                                                {!cliente.telefono && !cliente.correo && (
                                                    <span className="text-xs text-tertiary/50">Sin datos de contacto</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-tertiary truncate max-w-[160px] block">
                                                {cliente.direccion || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-tertiary font-label">
                                            {new Date(cliente.createdAt).toLocaleDateString('es-PE', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleVer(cliente)} title="Ver historial">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEditar(cliente)} title="Editar">
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                {confirmDelete === cliente.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDesactivar(cliente.id)}
                                                            disabled={loadingDelete}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                        >
                                                            Sí
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(null)}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold text-tertiary hover:text-secondary transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setConfirmDelete(cliente.id)}
                                                        title="Desactivar"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-tertiary hover:text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/20">
                            <span className="text-xs text-tertiary">
                                Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                            </span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" icon={ChevronLeft}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={pagination.page <= 1}
                                />
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === pagination.page ? 'bg-primary text-white' : 'text-tertiary hover:bg-neutral-light'}`}
                                        >{p}</button>
                                    );
                                })}
                                <Button variant="ghost" size="sm" icon={ChevronRight}
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={pagination.page >= pagination.totalPages}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ModuleTemplate>

            <CrearClienteModal
                isOpen={isCrearOpen}
                onClose={() => setIsCrearOpen(false)}
                onSuccess={() => { setIsCrearOpen(false); handleRefresh(); }}
            />

            <EditarClienteModal
                isOpen={isEditarOpen}
                cliente={selectedCliente}
                onClose={() => { setIsEditarOpen(false); setSelectedCliente(null); }}
                onSuccess={() => { setIsEditarOpen(false); setSelectedCliente(null); handleRefresh(); }}
            />

            <VerClienteModal
                isOpen={isVerOpen}
                cliente={selectedCliente}
                onClose={() => { setIsVerOpen(false); setSelectedCliente(null); }}
                onEditarClick={() => { setIsVerOpen(false); setIsEditarOpen(true); }}
            />
        </>
    );
}
