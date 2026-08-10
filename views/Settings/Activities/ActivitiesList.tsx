import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Activity } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { LoadMore } from '../../../components/ui/LoadMore';

interface ActivitiesListProps {
    onSelect: (activity: Activity) => void;
    onAdd: () => void;
}

interface OrderType {
    id: string;
    code: string;
    description: string;
}

// Simple in-memory cache to persist state when navigating away
let listCache: {
    activities: Activity[];
    orderTypes: OrderType[];
    visibleCount: number;
    search: string;
    statusFilter: 'all' | 'active' | 'inactive';
    timestamp: number;
    scrollTop: number;
} | null = null;

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ onSelect, onAdd }) => {
    // Initialize with cached data if available
    const [search, setSearch] = useState(listCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(listCache?.statusFilter || 'all');
    const [activities, setActivities] = useState<Activity[]>(listCache?.activities || []);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>(listCache?.orderTypes || []);
    const [loading, setLoading] = useState(!listCache); // Don't show loading if cached
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(listCache?.visibleCount || 5);
    const PAGE_SIZE = 5;

    // Ref to track if it's the initial mount to prevent resetting cache
    const isFirstRun = useRef(true);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(listCache?.scrollTop || 0);

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Keep refs to state for use in cleanup function
    const stateRef = useRef({ activities, orderTypes, visibleCount, search, statusFilter });
    useEffect(() => {
        stateRef.current = { activities, orderTypes, visibleCount, search, statusFilter };
    }, [activities, orderTypes, visibleCount, search, statusFilter]);

    // Aggressive scroll restoration
    useLayoutEffect(() => {
        if (isFirstRun.current && listCache?.scrollTop && listContainerRef.current) {
            const targetScroll = listCache.scrollTop;
            let attempts = 0;

            const attemptScroll = () => {
                const container = listContainerRef.current;
                if (!container) return;

                container.scrollTop = targetScroll;
                if (Math.abs(container.scrollTop - targetScroll) < 10) return;

                attempts++;
                if (attempts < 40) {
                    requestAnimationFrame(() => setTimeout(attemptScroll, 50));
                }
            };
            attemptScroll();
        }
    }, [activities.length]);

    // Persist to cache ONLY on unmount (or page hide)
    useEffect(() => {
        return () => {
            // Updated cache on exit
            if (stateRef.current.activities.length > 0) {
                listCache = {
                    activities: stateRef.current.activities,
                    orderTypes: stateRef.current.orderTypes,
                    visibleCount: stateRef.current.visibleCount,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    timestamp: Date.now(),
                    scrollTop: scrollTopRef.current
                };
            }
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            // Show loading if we don't have cached data OR if queries changed significantly
            // But we try to avoid flickering if we just have a small update.
            // If changing filters effectively, letting the user know is good.
            if (!listCache && activities.length === 0) setLoading(true);

            try {
                setError(null);

                // Fetch activities with server-side filtering AND searching
                const [activitiesData, orderTypesData] = await Promise.all([
                    dataService.getActivities(statusFilter, debouncedSearch),
                    dataService.getOrderTypes()
                ]);

                setActivities(activitiesData);
                setOrderTypes(orderTypesData);

            } catch (error) {
                console.error('Failed to load data', error);
                setError('Erro ao carregar dados. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, debouncedSearch]); // Refetch on filter or debounced search change

    // Update cache when state changes
    // Cache update logic moved to unmount cleanup

    useEffect(() => {
        // Skip the first run if we loaded from cache to avoid resetting visibleCount
        if (isFirstRun.current) {
            isFirstRun.current = false;
            // Only return if we actually have a cache, otherwise we might want the default behavior
            if (listCache) return;
        }
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, statusFilter]); // Reset visible count on new queries

    // Since we filter on server, activities ARE the filtered activities
    const filteredActivities = activities;

    const visibleActivities = filteredActivities.slice(0, visibleCount);
    const hasMore = visibleCount < filteredActivities.length;

    const handleLoadMore = () => {
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredActivities.length));
        }, 500);
    };

    // We use the LoadMore component which handles IntersectionObserver internally

    if (loading && !listCache) return <div className="p-8 text-center text-slate-500">Carregando atividades...</div>;

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar atividades..."
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title="Nova Atividade"
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
                {visibleActivities.map((activity) => (
                    <div
                        key={activity.id}
                        onClick={() => onSelect(activity)}
                        className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white mt-1">
                                    {activity.description}
                                </h3>
                                <div
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const newStatus = !activity.isAvailable;

                                        // Optimistic update
                                        setActivities(prev => prev.map(a =>
                                            a.id === activity.id
                                                ? { ...a, isAvailable: newStatus }
                                                : a
                                        ));

                                        try {
                                            await dataService.updateActivity(activity.id, { isAvailable: newStatus });
                                        } catch (error) {
                                            console.error('Error updating status:', error);
                                            // Revert on error
                                            setActivities(prev => prev.map(a =>
                                                a.id === activity.id
                                                    ? { ...a, isAvailable: !newStatus }
                                                    : a
                                            ));
                                            toast.error('Erro ao atualizar status');
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <StatusBadge status={activity.isAvailable ? 'active' : 'inactive'} size="sm" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {orderTypes.map((orderType) => {
                                    const isLinked = activity.linkedOrderTypeIds?.includes(orderType.id);
                                    return (
                                        <span
                                            key={orderType.id}
                                            onClick={async (e) => {
                                                e.stopPropagation();

                                                // Optimistic update
                                                const newLinkedIds = isLinked
                                                    ? activity.linkedOrderTypeIds?.filter(id => id !== orderType.id)
                                                    : [...(activity.linkedOrderTypeIds || []), orderType.id];

                                                setActivities(prev => prev.map(a =>
                                                    a.id === activity.id
                                                        ? { ...a, linkedOrderTypeIds: newLinkedIds }
                                                        : a
                                                ));

                                                try {
                                                    if (isLinked) {
                                                        await dataService.unlinkActivityFromOrderType(activity.id, orderType.id);
                                                    } else {
                                                        await dataService.linkActivityToOrderType(activity.id, orderType.id);
                                                    }
                                                } catch (error) {
                                                    console.error('Error toggling link:', error);
                                                    // Revert on error
                                                    setActivities(prev => prev.map(a =>
                                                        a.id === activity.id
                                                            ? { ...a, linkedOrderTypeIds: activity.linkedOrderTypeIds }
                                                            : a
                                                    ));
                                                    toast.error('Erro ao vincular/desvincular atividade');
                                                }
                                            }}
                                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded cursor-pointer transition-all duration-300 active:scale-90 hover:scale-110 shadow-sm ${isLinked
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                                }`}
                                        >
                                            {orderType.code}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 shrink-0">
                            chevron_right
                        </span>
                    </div>
                ))}

                {visibleActivities.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {search ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade cadastrada'}
                    </div>
                )}

                {visibleActivities.length > 0 && (
                    <LoadMore
                        current={visibleActivities.length}
                        total={filteredActivities.length}
                        onLoadMore={handleLoadMore}
                        pageSize={PAGE_SIZE}
                    />
                )}
            </div>
        </div>
    );
};
