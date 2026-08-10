import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Service } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { LoadMore } from '../../../components/ui/LoadMore';

interface ServicesListProps {
    onSelect: (service: Service) => void;
    onAdd: () => void;
}

// Simple in-memory cache to persist state when navigating away
let serviceListCache: {
    services: Service[];
    visibleCount: number;
    search: string;
    statusFilter: 'all' | 'active' | 'inactive';
    scrollTop: number;
} | null = null;

export const ServicesList: React.FC<ServicesListProps> = ({ onSelect, onAdd }) => {
    // Initialize with cached data if available
    const [search, setSearch] = useState(serviceListCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(serviceListCache?.statusFilter || 'all');
    const [services, setServices] = useState<Service[]>(serviceListCache?.services || []);
    const [loading, setLoading] = useState(!serviceListCache);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(serviceListCache?.visibleCount || 20);
    const PAGE_SIZE = 20;

    // Ref to track if it's the initial mount to prevent resetting cache
    const isFirstRun = useRef(true);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(serviceListCache?.scrollTop || 0);

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Keep refs to state for use in cleanup function
    const stateRef = useRef({ services, visibleCount, search, statusFilter });
    useEffect(() => {
        stateRef.current = { services, visibleCount, search, statusFilter };
    }, [services, visibleCount, search, statusFilter]);

    // Aggressive scroll restoration
    useLayoutEffect(() => {
        if (isFirstRun.current && serviceListCache?.scrollTop && listContainerRef.current) {
            const targetScroll = serviceListCache.scrollTop;
            let attempts = 0;

            const attemptScroll = () => {
                const container = listContainerRef.current;
                if (!container) return;

                container.scrollTop = targetScroll;
                // Success threshold
                if (Math.abs(container.scrollTop - targetScroll) < 10) return;

                attempts++;
                if (attempts < 40) {
                    requestAnimationFrame(() => setTimeout(attemptScroll, 50));
                }
            };
            attemptScroll();
        }
    }, [services.length]);

    // Persist to cache on unmount
    useEffect(() => {
        return () => {
            if (stateRef.current.services.length > 0) {
                serviceListCache = {
                    services: stateRef.current.services,
                    visibleCount: stateRef.current.visibleCount,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    scrollTop: scrollTopRef.current
                };
            }
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!serviceListCache && services.length === 0) setLoading(true);

            try {
                setError(null);
                const servicesData = await dataService.getServices(statusFilter, debouncedSearch);
                setServices(servicesData);
            } catch (error) {
                console.error('Failed to load services', error);
                setError('Erro ao carregar serviços. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            if (serviceListCache) return;
        }
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, statusFilter]);

    const visibleServices = services.slice(0, visibleCount);
    const hasMore = visibleCount < services.length;

    const handleLoadMore = () => {
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, services.length));
        }, 300);
    };

    // We use the LoadMore component which handles IntersectionObserver internally

    if (loading && !serviceListCache) return <div className="p-8 text-center text-slate-500">Carregando serviços...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar serviços..."
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title="Novo Serviço"
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
                className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar"
            >
                {visibleServices.map((service) => (
                    <div
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white mt-1">
                                    {service.description}
                                </h3>
                                <div
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const newStatus = !service.isAvailable;
                                        setServices(prev => prev.map(s => s.id === service.id ? { ...s, isAvailable: newStatus } : s));
                                        try {
                                            await dataService.updateService(service.id, { isAvailable: newStatus });
                                        } catch (error) {
                                            console.error('Error updating service status:', error);
                                            setServices(prev => prev.map(s => s.id === service.id ? { ...s, isAvailable: !newStatus } : s));
                                        }
                                    }}
                                    className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                                >
                                    <StatusBadge status={service.isAvailable ? 'active' : 'inactive'} size="sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                {service.unit && (
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                                        {service.unit}
                                    </span>
                                )}
                                {service.code && (
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-auto">
                                        {service.code}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 flex-shrink-0">
                            chevron_right
                        </span>
                    </div>
                ))}

                {visibleServices.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        {search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                    </div>
                )}

                {visibleServices.length > 0 && (
                    <LoadMore
                        current={visibleServices.length}
                        total={services.length}
                        onLoadMore={handleLoadMore}
                        pageSize={PAGE_SIZE}
                    />
                )}

            </div>
        </div>
    );
};
