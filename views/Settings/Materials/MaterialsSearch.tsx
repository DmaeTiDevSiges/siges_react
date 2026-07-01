import React, { useState, useRef, useEffect } from 'react';
import { Material, User } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadMore } from '../../../components/ui/LoadMore';
import { usePermissions } from '../../../contexts/PermissionsContext';

interface MaterialsSearchProps {
    currentUser?: User;
    onSelectMaterial?: (material: Material) => void;
    onAdd?: () => void;
    onDashboard?: () => void;
}

const PAGE_SIZE = 50;

let materialsSearchCache: {
    materials: Material[];
    total: number;
    search: string;
    statusFilter: number | 'all';
    hasSearched: boolean;
} | null = null;

export const MaterialsSearch: React.FC<MaterialsSearchProps> = ({ currentUser, onSelectMaterial, onAdd, onDashboard }) => {
    const { canSearch, canCreate } = usePermissions();
    const hasSearchPermission = canSearch('materials_search');
    const canCreateMaterial = canCreate('materials_create_edit_delete');

    const [search, setSearch] = useState(materialsSearchCache?.search || '');
    const [statusFilter, setStatusFilter] = useState<number | 'all'>(materialsSearchCache?.statusFilter ?? 'all');
    const [materials, setMaterials] = useState<Material[]>(materialsSearchCache?.materials || []);
    const [total, setTotal] = useState(materialsSearchCache?.total || 0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(materialsSearchCache?.hasSearched || false);
    const [statuses, setStatuses] = useState<{ id: number; code: string; description: string }[]>([]);

    useEffect(() => {
        dataService.getMaterialsStatuses().then(setStatuses).catch(console.error);
    }, []);

    const stateRef = useRef({ materials, total, search, statusFilter, hasSearched });
    React.useEffect(() => {
        stateRef.current = { materials, total, search, statusFilter, hasSearched };
    }, [materials, total, search, statusFilter, hasSearched]);

    React.useEffect(() => {
        return () => {
            if (stateRef.current.materials.length > 0 || stateRef.current.hasSearched) {
                materialsSearchCache = {
                    materials: stateRef.current.materials,
                    total: stateRef.current.total,
                    search: stateRef.current.search,
                    statusFilter: stateRef.current.statusFilter,
                    hasSearched: stateRef.current.hasSearched
                };
            }
        };
    }, []);

    React.useEffect(() => {
        if (hasSearched && search.trim()) {
            const refresh = async () => {
                try {
                    const result = await dataService.getMaterials(statusFilter, search.trim(), currentUser?.companyId, 1, PAGE_SIZE);
                    setMaterials(result.materials);
                    setTotal(result.total);
                } catch (error) {
                    console.error('Failed to refresh materials', error);
                }
            };
            refresh();
        }
    }, []);

    const handleSearch = async () => {
        if (!search.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const result = await dataService.getMaterials(statusFilter, search.trim(), currentUser?.companyId, 1, PAGE_SIZE);
            setMaterials(result.materials);
            setTotal(result.total);
            setHasSearched(true);
        } catch (error) {
            console.error('Failed to load materials', error);
            setError('Erro ao carregar materiais. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleFilterChange = (filter: number | 'all') => {
        setStatusFilter(filter);
        if (hasSearched) {
            const doSearch = async () => {
                try {
                    setLoading(true);
                    const result = await dataService.getMaterials(filter, search.trim(), currentUser?.companyId, 1, PAGE_SIZE);
                    setMaterials(result.materials);
                    setTotal(result.total);
                } catch (error) {
                    console.error('Failed to load materials', error);
                } finally {
                    setLoading(false);
                }
            };
            doSearch();
        }
    };

    const handleLoadMore = async () => {
        const nextPage = Math.floor(materials.length / PAGE_SIZE) + 1;
        try {
            setLoadingMore(true);
            const result = await dataService.getMaterials(statusFilter, search.trim(), currentUser?.companyId, nextPage, PAGE_SIZE);
            setMaterials(prev => [...prev, ...result.materials]);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to load more materials', error);
        } finally {
            setLoadingMore(false);
        }
    };

    if (!hasSearchPermission) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <span className="material-symbols-outlined text-5xl mb-4">lock</span>
                <p className="text-lg font-medium">Sem permissão</p>
                <p className="text-sm">Você não tem permissão para acessar esta funcionalidade.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar material..."
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={!search.trim() || loading}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            search.trim() && !loading
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-600'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        Buscar
                    </button>
                    {onAdd && canCreateMaterial && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                        >
                            Novo
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => handleFilterChange('all')}
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
                            onClick={() => handleFilterChange(status.id)}
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

            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar">
                {loading && materials.length === 0 && (
                    <div className="p-8 text-center text-slate-500">Carregando materiais...</div>
                )}

                {error && (
                    <div className="p-8 text-center text-red-500">{error}</div>
                )}

                {!loading && !error && hasSearched && materials.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Nenhum material encontrado
                    </div>
                )}

                {!hasSearched && !loading && materials.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-6xl mb-4">search</span>
                        <p className="text-sm font-medium">Digite um termo e clique em Buscar</p>
                    </div>
                )}

                {materials.map((material) => (
                    <div
                        key={material.id}
                        onClick={() => onSelectMaterial?.(material)}
                        className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-500 dark:text-slate-400">
                                {material.code}
                            </span>
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
                            <StatusBadge status={(material.statusDescription || '').toLowerCase().includes('ativo') && !(material.statusDescription || '').toLowerCase().includes('inativo') ? 'active' : 'inactive'} label={material.statusDescription || (material.isAvailable ? 'Ativo' : 'Inativo')} size="sm" />
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">
                                chevron_right
                            </span>
                        </div>
                    </div>
                ))}

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
