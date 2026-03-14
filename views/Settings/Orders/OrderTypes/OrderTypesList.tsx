import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { OrderType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { IconButton } from '../../../../components/ui/IconButton';

interface OrderTypesListProps {
    onSelect: (orderType: OrderType) => void;
    onAdd: () => void;
}



let listCache: {
    orderTypes: OrderType[];
    search: string;
    statusFilter: 'all' | 'active' | 'inactive';
    timestamp: number;
    scrollTop: number;
    expandedNodes: string[];
} | null = null;

// ... (previous imports)

export const OrderTypesList: React.FC<OrderTypesListProps> = ({ onSelect, onAdd }) => {
    // ... (cache logic can remain or be simplified)
    const [search, setSearch] = useState(listCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(listCache?.statusFilter || 'all');
    const [orderTypes, setOrderTypes] = useState<OrderType[]>(listCache?.orderTypes || []);
    const [loading, setLoading] = useState(!listCache);
    const [error, setError] = useState<string | null>(null);

    const isFirstRun = useRef(true);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(listCache?.scrollTop || 0);

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const stateRef = useRef({ orderTypes, search, statusFilter });
    useEffect(() => {
        stateRef.current = { orderTypes, search, statusFilter };
    }, [orderTypes, search, statusFilter]);

    useLayoutEffect(() => {
        if (isFirstRun.current && listCache?.scrollTop && listContainerRef.current) {
            listContainerRef.current.scrollTop = listCache.scrollTop;
        }
    }, [orderTypes.length]);

    useEffect(() => {
        return () => {
            // ... (cache logic)
            if (stateRef.current.orderTypes.length > 0) {
                listCache = {
                    orderTypes: stateRef.current.orderTypes,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    timestamp: Date.now(),
                    scrollTop: scrollTopRef.current,
                    expandedNodes: [] // Removed
                };
            }
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!listCache && orderTypes.length === 0) setLoading(true);

            try {
                setError(null);
                const data = await dataService.getOrderTypes(statusFilter, debouncedSearch);
                setOrderTypes(data);
            } catch (error) {
                console.error('Failed to load order types', error);
                setError('Erro ao carregar dados. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
        }
    }, []);

    const renderItem = (item: OrderType) => {
        return (
            <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4 mb-3"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                            {item.description}
                        </h3>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                            {item.code}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.departmentName || 'Departamento Desconhecido'}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        onClick={async (e) => {
                            e.stopPropagation();
                            const newStatus = !item.isAvailable;
                            setOrderTypes(prev => prev.map(p =>
                                p.id === item.id ? { ...p, isAvailable: newStatus } : p
                            ));
                            try {
                                await dataService.updateOrderType(item.id, { isAvailable: newStatus });
                            } catch (error) {
                                console.error('Error updating status:', error);
                                setOrderTypes(prev => prev.map(p =>
                                    p.id === item.id ? { ...p, isAvailable: !newStatus } : p
                                ));
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <StatusBadge status={item.isAvailable ? 'active' : 'inactive'} size="sm" />
                    </div>
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">
                        chevron_right
                    </span>
                </div>
            </div>
        );
    };

    if (loading && !listCache) return <div className="p-8 text-center text-slate-500">Carregando tipos de OS...</div>;

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipos de OS..."
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title="Novo Tipo de OS"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'active', label: 'Ativos' },
                        { id: 'inactive', label: 'Inativos' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === filter.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={listContainerRef}
                onScroll={(e) => scrollTopRef.current = e.currentTarget.scrollTop}
                className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar"
            >
                {orderTypes.map(item => renderItem(item))}

                {orderTypes.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {search ? 'Nenhum tipo de OS encontrado' : 'Nenhum tipo de OS cadastrado'}
                    </div>
                )}
            </div>
        </div>
    );
};
