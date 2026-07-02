import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Material } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { LoadMore } from '../../../components/ui/LoadMore';
import { usePermissions } from '../../../contexts/PermissionsContext';

interface MaterialsListProps {
    onSelect: (material: Material) => void;
    onAdd: () => void;
    onDashboard?: () => void;
}

const PAGE_SIZE = 50;

let materialListCache: {
    materials: Material[];
    total: number;
    search: string;
    statusFilter: number | 'all';
    scrollTop: number;
} | null = null;

export const MaterialsList: React.FC<MaterialsListProps> = ({ onSelect, onAdd, onDashboard }) => {
    const { canCreate } = usePermissions();
    const canCreateMaterial = canCreate('materials_create_edit_delete');
    const [search, setSearch] = useState(materialListCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<number | 'all'>(materialListCache?.statusFilter ?? 'all');
    const [materials, setMaterials] = useState<Material[]>(materialListCache?.materials || []);
    const [total, setTotal] = useState(materialListCache?.total || 0);
    const [loading, setLoading] = useState(!materialListCache);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<{ id: number; code: string; description: string }[]>([]);

    const isFirstRun = useRef(true);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(materialListCache?.scrollTop || 0);

    useEffect(() => {
        dataService.getMaterialsStatuses().then(setStatuses).catch(console.error);
    }, []);

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const stateRef = useRef({ materials, total, search, statusFilter });
    useEffect(() => {
        stateRef.current = { materials, total, search, statusFilter };
    }, [materials, total, search, statusFilter]);

    useLayoutEffect(() => {
        if (isFirstRun.current && materialListCache?.scrollTop && listContainerRef.current) {
            const targetScroll = materialListCache.scrollTop;
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
    }, [materials.length]);

    useEffect(() => {
        return () => {
            if (stateRef.current.materials.length > 0) {
                materialListCache = {
                    materials: stateRef.current.materials,
                    total: stateRef.current.total,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    scrollTop: scrollTopRef.current
                };
            }
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!materialListCache && materials.length === 0) setLoading(true);

            try {
                setError(null);
                const result = await dataService.getMaterials(statusFilter, debouncedSearch, undefined, 1, PAGE_SIZE);
                setMaterials(result.materials);
                setTotal(result.total);
            } catch (error) {
                console.error('Failed to load materials', error);
                setError('Erro ao carregar materiais. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            if (materialListCache) return;
        }
    }, [debouncedSearch, statusFilter]);

    const handleLoadMore = async () => {
        const nextPage = Math.floor(materials.length / PAGE_SIZE) + 1;
        try {
            setLoadingMore(true);
            const result = await dataService.getMaterials(statusFilter, debouncedSearch, undefined, nextPage, PAGE_SIZE);
            setMaterials(prev => [...prev, ...result.materials]);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to load more materials', error);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading && !materialListCache) return <div className="p-8 text-center text-slate-500">Carregando materiais...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar materiais..."
                        />
                    </div>
                    {canCreateMaterial && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAdd}
                            title="Novo Material"
                        />
                    )}
                    {onDashboard && (
                        <button
                            onClick={onDashboard}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">dashboard</span>
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            statusFilter === 'all'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        Todos
                    </button>
                    {statuses.map(status => (
                        <button
                            key={status.id}
                            onClick={() => setStatusFilter(status.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                statusFilter === status.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {status.description}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={listContainerRef}
                onScroll={(e) => scrollTopRef.current = e.currentTarget.scrollTop}
                className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar"
            >
                {materials.map((material) => (
                    <div
                        key={material.id}
                        onClick={() => onSelect(material)}
                        className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-500 dark:text-slate-400">
                                    {material.code}
                                </span>
                                {material.typeDescription && (
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                                        {material.typeDescription}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mt-0.5">
                                {material.description}
                            </h3>
                            {material.unit && (
                                <span className="font-bold text-slate-500 dark:text-slate-400 mt-0.5 inline-block">
                                    {material.unit}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const newStatus = !material.isAvailable;
                                    setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, isAvailable: newStatus } : m));
                                    try {
                                        await dataService.updateMaterial(material.id, { isAvailable: newStatus });
                                    } catch (error) {
                                        console.error('Error updating material status:', error);
                                        setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, isAvailable: !newStatus } : m));
                                    }
                                }}
                                className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                            >
                                <StatusBadge status={(material.statusDescription || '').toLowerCase().includes('ativo') && !(material.statusDescription || '').toLowerCase().includes('inativo') ? 'active' : 'inactive'} label={material.statusDescription || (material.isAvailable ? 'Ativo' : 'Inativo')} size="sm" />
                            </div>
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">
                                chevron_right
                            </span>
                        </div>
                    </div>
                ))}

                {materials.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        {search ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
                    </div>
                )}

                {materials.length > 0 && materials.length < total && (
                    <LoadMore
                        current={materials.length}
                        total={total}
                        onLoadMore={handleLoadMore}
                        pageSize={PAGE_SIZE}
                    />
                )}

                {loadingMore && (
                    <div className="p-4 text-center text-slate-500">Carregando mais...</div>
                )}
            </div>
        </div>
    );
};
