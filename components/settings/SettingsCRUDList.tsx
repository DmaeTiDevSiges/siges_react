import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { StatusBadge } from '../ui/StatusBadge';
import { IconButton } from '../ui/IconButton';
import { LoadMore } from '../ui/LoadMore';

export interface SettingsCRUDItem {
    id: string;
    description?: string;
    name?: string;
    isAvailable?: boolean;
    isActive?: boolean;
    [key: string]: any;
}

export interface SettingsCRUDListProps<T extends SettingsCRUDItem> {
    titleSingular: string;
    titlePlural: string;
    fetchItems: (status: 'all' | 'active' | 'inactive', search: string) => Promise<T[]>;
    onSelect: (item: T) => void;
    onAdd: () => void;
    onToggleStatus?: (item: T, newStatus: boolean) => Promise<void>;
    getItemTitle?: (item: T) => string;
    getItemStatus?: (item: T) => boolean;
    renderExtra?: (item: T) => React.ReactNode;
    cacheKey?: string;
}

interface CacheEntry<T> {
    items: T[];
    visibleCount: number;
    search: string;
    statusFilter: 'all' | 'active' | 'inactive';
    timestamp: number;
    scrollTop: number;
}

const globalCache: Record<string, CacheEntry<any>> = {};

export function SettingsCRUDList<T extends SettingsCRUDItem>({
    titleSingular,
    titlePlural,
    fetchItems,
    onSelect,
    onAdd,
    onToggleStatus,
    getItemTitle,
    getItemStatus,
    renderExtra,
    cacheKey = titlePlural
}: SettingsCRUDListProps<T>) {
    const listCache = globalCache[cacheKey] as CacheEntry<T> | undefined;

    const [search, setSearch] = useState(listCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(listCache?.statusFilter || 'all');
    const [items, setItems] = useState<T[]>(listCache?.items || []);
    const [loading, setLoading] = useState(!listCache);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(listCache?.visibleCount || 10);
    const PAGE_SIZE = 10;

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

    const stateRef = useRef({ items, visibleCount, search, statusFilter });
    useEffect(() => {
        stateRef.current = { items, visibleCount, search, statusFilter };
    }, [items, visibleCount, search, statusFilter]);

    useLayoutEffect(() => {
        if (isFirstRun.current && listCache?.scrollTop && listContainerRef.current) {
            const container = listContainerRef.current;
            container.scrollTop = listCache.scrollTop;
        }
    }, [items.length]);

    useEffect(() => {
        return () => {
            if (stateRef.current.items.length > 0) {
                globalCache[cacheKey] = {
                    items: stateRef.current.items,
                    visibleCount: stateRef.current.visibleCount,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    timestamp: Date.now(),
                    scrollTop: scrollTopRef.current
                };
            }
        };
    }, [cacheKey]);

    useEffect(() => {
        const fetchData = async () => {
            if (!listCache && items.length === 0) setLoading(true);

            try {
                setError(null);
                const data = await fetchItems(statusFilter, debouncedSearch);
                setItems(data);
            } catch (err) {
                console.error(`Failed to load ${titlePlural}`, err);
                setError('Erro ao carregar dados. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, debouncedSearch, fetchItems, titlePlural]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            if (listCache) return;
        }
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, statusFilter]);

    const visibleItems = items.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, items.length));
    };

    const resolveItemTitle = (item: T): string => {
        if (getItemTitle) return getItemTitle(item);
        return item.description || item.name || '';
    };

    const resolveItemStatus = (item: T): boolean => {
        if (getItemStatus) return getItemStatus(item);
        if (typeof item.isAvailable === 'boolean') return item.isAvailable;
        if (typeof item.isActive === 'boolean') return item.isActive;
        return true;
    };

    if (loading && !listCache) {
        return <div className="p-8 text-center text-slate-500">Carregando {titlePlural.toLowerCase()}...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar ${titlePlural.toLowerCase()}...`}
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title={`Novo ${titleSingular}`}
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
                onScroll={(e) => { scrollTopRef.current = e.currentTarget.scrollTop; }}
                className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar"
            >
                {visibleItems.map((item) => {
                    const status = resolveItemStatus(item);
                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                            {resolveItemTitle(item)}
                                        </h3>
                                        {onToggleStatus && (
                                            <div
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const newStatus = !status;

                                                    // Optimistic update
                                                    setItems(prev => prev.map(p => {
                                                        if (p.id !== item.id) return p;
                                                        if ('isAvailable' in p) return { ...p, isAvailable: newStatus };
                                                        return { ...p, isActive: newStatus };
                                                    }));

                                                    try {
                                                        await onToggleStatus(item, newStatus);
                                                    } catch (err) {
                                                        console.error('Error updating status:', err);
                                                        setItems(prev => prev.map(p => {
                                                            if (p.id !== item.id) return p;
                                                            if ('isAvailable' in p) return { ...p, isAvailable: status };
                                                            return { ...p, isActive: status };
                                                        }));
                                                    }
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <StatusBadge status={status ? 'active' : 'inactive'} size="sm" />
                                            </div>
                                        )}
                                    </div>
                                    {renderExtra && renderExtra(item)}
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">
                                chevron_right
                            </span>
                        </div>
                    );
                })}

                {visibleItems.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {search ? `Nenhum registro encontrado` : `Nenhum item cadastrado`}
                    </div>
                )}

                {visibleItems.length > 0 && (
                    <LoadMore
                        current={visibleItems.length}
                        total={items.length}
                        onLoadMore={handleLoadMore}
                        pageSize={PAGE_SIZE}
                    />
                )}
            </div>
        </div>
    );
}
