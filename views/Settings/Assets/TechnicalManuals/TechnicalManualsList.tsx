import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { TechnicalManual, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { IconButton } from '../../../../components/ui/IconButton';
import { Loading } from '../../../../components/ui/Loading';
import { LoadMore } from '../../../../components/ui/LoadMore';

interface TechnicalManualsListProps {
    onSelect: (item: TechnicalManual) => void;
    onAdd: () => void;
}

let listCache: {
    items: TechnicalManual[];
    visibleCount: number;
    search: string;
    assetTypeFilter: string;
    timestamp: number;
    scrollTop: number;
} | null = null;

export const TechnicalManualsList: React.FC<TechnicalManualsListProps> = ({ onSelect, onAdd }) => {
    const [search, setSearch] = useState(listCache?.search || '');
    const [assetTypeFilter, setAssetTypeFilter] = useState(listCache?.assetTypeFilter || '');
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [items, setItems] = useState<TechnicalManual[]>(listCache?.items || []);
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

    const stateRef = useRef({ items, visibleCount, search, assetTypeFilter });
    useEffect(() => {
        stateRef.current = { items, visibleCount, search, assetTypeFilter };
    }, [items, visibleCount, search, assetTypeFilter]);

    useLayoutEffect(() => {
        if (isFirstRun.current && listCache?.scrollTop && listContainerRef.current) {
            const container = listContainerRef.current;
            container.scrollTop = listCache.scrollTop;
        }
    }, [items.length]);

    useEffect(() => {
        return () => {
            if (stateRef.current.items.length > 0) {
                listCache = {
                    items: stateRef.current.items,
                    visibleCount: stateRef.current.visibleCount,
                    search: stateRef.current.search,
                    assetTypeFilter: stateRef.current.assetTypeFilter,
                    timestamp: Date.now(),
                    scrollTop: scrollTopRef.current
                };
            }
        };
    }, []);

    // Load asset types for filter
    useEffect(() => {
        const loadAssetTypes = async () => {
            try {
                const types = await dataService.getAssetTypes('active');
                setAssetTypes(types);
            } catch (error) {
                console.error('Failed to load asset types', error);
            }
        };
        loadAssetTypes();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!listCache && items.length === 0) setLoading(true);

            try {
                setError(null);
                const data = await dataService.getTechnicalManuals('all', debouncedSearch, assetTypeFilter || undefined);
                setItems(data);
            } catch (error) {
                console.error('Failed to load technical manuals', error);
                setError('Erro ao carregar dados. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [assetTypeFilter, debouncedSearch]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            if (listCache) return;
        }
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, assetTypeFilter]);

    const visibleItems = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, items.length));
    };

    if (loading && !listCache) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando manuais..." />
            </div>
        );
    }

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar manuais..."
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title="Novo Manual"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setAssetTypeFilter('')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${!assetTypeFilter
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        Todos
                    </button>
                    {assetTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setAssetTypeFilter(type.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${assetTypeFilter === type.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {type.description}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={listContainerRef}
                onScroll={(e) => scrollTopRef.current = e.currentTarget.scrollTop}
                className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar"
            >
                {visibleItems.map((item) => {
                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-1 min-w-0">
                                    {item.code && (
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            {item.code}
                                        </h3>
                                    )}
                                    <h3 className="font-bold text-slate-900 dark:text-white leading-snug">
                                        {item.description}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-primary font-medium">{item.assetTypeDescription}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>link</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {item.assetsAmount} {item.assetsAmount === 1 ? 'ativo' : 'ativos'}
                                        </span>
                                    </div>
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
                        {search ? 'Nenhum manual encontrado' : 'Nenhum manual cadastrado'}
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
};
