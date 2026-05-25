import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, User } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { LoadMore } from '../../components/ui/LoadMore';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { scanBarcode, IS_NATIVE } from '../../utils/scanner';
import { IconButton } from '../../components/ui/IconButton';
import { BarcodeScannerModal } from '../../components/ui/BarcodeScannerModal';
import { AssetCard } from '../../components/assets/AssetCard';
import { Loading } from '../../components/ui/Loading';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Modal } from '../../components/ui/Modal';
import { AssetsSearchPDFButton } from '../../components/reports/AssetsSearchPDFButton';
import { AssetsSearchExcelButton } from '../../components/reports/AssetsSearchExcelButton';

interface AssetsSearchProps {
    currentUser?: User;
    onSelectAsset?: (asset: Asset) => void;
    onAdd?: () => void;
}

export const AssetsSearch: React.FC<AssetsSearchProps> = ({ currentUser, onSelectAsset, onAdd }) => {
    const { canCreate, canSearch, permissions, loading: permissionsLoading } = usePermissions();
    const hasSearchPermission = canSearch('assets');

    const [search, setSearch] = useState(() => localStorage.getItem('assets_search') || '');
    const [activeSearch, setActiveSearch] = useState(search);

    const handleSearch = () => {
        setActiveSearch(search);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(20);
    const PAGE_SIZE = 20;
    const [followedAssetIds, setFollowedAssetIds] = useState<Set<string>>(new Set());
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleScanResult = async (result: string) => {
        setSearch(result);
        setActiveSearch(result);
        localStorage.setItem('assets_search', result);

        try {
            // Try to find exact match immediately
            const exactAssets = await dataService.getAssets('all', result);
            const exactMatch = exactAssets.find(a =>
                a.code?.toLowerCase() === result.toLowerCase() ||
                a.id === result
            );
            if (exactMatch && onSelectAsset) {
                onSelectAsset(exactMatch);
            }
        } catch (err: any) {
            console.error('Error finding asset after scan:', err);
        }
    };

    // DEBUG: Verificar estado das permissões
    useEffect(() => {
        console.log('🔍 DEBUG PERMISSIONS:', {
            currentUser: currentUser?.id,
            profileId: currentUser?.profileId,
            isAdminSuper: currentUser?.isAdminSuper,
            permissionsLoading,
            permissionsCount: permissions.length,
            canCreateAssets: canCreate('assets'),
            canSearchAssets: hasSearchPermission,
            onAddExists: !!onAdd,
            allPermissions: permissions
        });
    }, [currentUser, permissions, permissionsLoading, onAdd, hasSearchPermission]);

    useEffect(() => {
        const fetchFollowed = async () => {
            try {
                const ids = await dataService.getFollowedAssetIds();
                setFollowedAssetIds(new Set(ids));
            } catch (err) {
                console.error('Error fetching followed assets:', err);
            }
        };
        if (hasSearchPermission) fetchFollowed();
    }, [hasSearchPermission]);

    const toggleFavorite = async (assetId: string) => {
        const isCurrentlyFavorite = followedAssetIds.has(assetId);

        // Optimistic update
        setFollowedAssetIds(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyFavorite) newSet.delete(assetId);
            else newSet.add(assetId);
            return newSet;
        });

        try {
            const isNowFollowing = await dataService.toggleAssetFollow(assetId);
            // Verify if the result matches our optimistic state, update if different
            if (isNowFollowing !== !isCurrentlyFavorite) {
                setFollowedAssetIds(prev => {
                    const newSet = new Set(prev);
                    if (isNowFollowing) newSet.add(assetId);
                    else newSet.delete(assetId);
                    return newSet;
                });
            }
            toast.success(isNowFollowing ? 'Ativo adicionado aos favoritos' : 'Ativo removido dos favoritos');
        } catch (err) {
            console.error('Error toggling favorite:', err);
            // Rollback on error
            setFollowedAssetIds(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyFavorite) newSet.add(assetId);
                else newSet.delete(assetId);
                return newSet;
            });
            toast.error('Erro ao atualizar favorito');
        }
    };

    const [advancedFilters, setAdvancedFilters] = useState<any>(() => {
        try {
            const saved = localStorage.getItem('assets_filters');
            return saved ? JSON.parse(saved) : {
                systemParentId: [],
                systemId: [],
                unitTypeParentId: [],
                unitTypeId: [],
                unitId: [],
                tagId: [],
                tagSubId: [],
                typeId: [],
                statusId: []
            };
        } catch {
            return {
                systemParentId: [],
                systemId: [],
                unitTypeParentId: [],
                unitTypeId: [],
                unitId: [],
                tagId: [],
                tagSubId: [],
                typeId: [],
                statusId: []
            };
        }
    });

    const [filterSelectOptions, setFilterSelectOptions] = useState<any>({
        systems: [],
        subSystems: [],
        unitTypes: [],
        unitSubTypes: [],
        units: [],
        tags: [],
        tagSubs: [],
        assetTypes: [],
        statuses: []
    });

    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        field: string;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        field: '',
        label: '',
        options: [],
        currentValue: []
    });

    const initializedDefaults = useRef(false);

    useEffect(() => {
        if (!hasSearchPermission) return;
        
        const fetchFilters = async () => {
            try {
                const [systems, subSystems, unitTypes, unitSubTypes, units, tags, tagSubs, assetTypes, statuses] = await Promise.all([
                    dataService.getSystemsParent(),
                    dataService.getSystems(),
                    dataService.getUnitTypesParent(),
                    dataService.getUnitTypes(),
                    dataService.getUnits('active'),
                    dataService.getAssetsTags(),
                    dataService.getAssetTagSubs(),
                    dataService.getAssetTypes('all'),
                    dataService.getAssetStatuses()
                ]);

                setFilterSelectOptions({
                    systems,
                    subSystems,
                    unitTypes,
                    unitSubTypes,
                    units,
                    tags,
                    tagSubs,
                    assetTypes,
                    statuses
                });

                if (!initializedDefaults.current) {
                     // Only set default status if not already set from localStorage
                     const hasStoredStatusId = advancedFilters.statusId && Array.isArray(advancedFilters.statusId) && advancedFilters.statusId.length > 0;
                     
                     if (!hasStoredStatusId) {
                         const usoStatus = statuses.find((s: any) => s.description?.toUpperCase() === 'USO' || s.description?.toUpperCase() === 'EM USO' || s.code?.toUpperCase() === 'USO');
                         if (usoStatus) {
                             setAdvancedFilters((prev: any) => ({ ...prev, statusId: [usoStatus.id] }));
                         }
                     }
                     initializedDefaults.current = true;
                }
            } catch (err) {
                console.error("Error loading filters", err);
            }
        };

        fetchFilters();
    }, [hasSearchPermission]);

    // Persist filters to localStorage
    useEffect(() => {
        localStorage.setItem('assets_filters', JSON.stringify(advancedFilters));
    }, [advancedFilters]);

    const openSelectionModal = (field: string, label: string, options: { value: string; label: string }[]) => {
        setSelectionModal({
            isOpen: true,
            field,
            label,
            options,
            currentValue: advancedFilters[field] || []
        });
    };

    const handleModalConfirm = (value: string[]) => {
        setAdvancedFilters((prev: any) => ({ ...prev, [selectionModal.field]: value }));
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleSystemChange = (value: string[]) => {
        setAdvancedFilters((prev: any) => ({
            ...prev,
            systemParentId: value,
            systemId: [] // clear child when parent changes
        }));
    };

    const handleParentUnitTypeChange = (value: string[]) => {
        setAdvancedFilters((prev: any) => ({
            ...prev,
            unitTypeParentId: value,
            unitTypeId: [] // clear child when parent changes
        }));
    };

    useEffect(() => {
        if (!hasSearchPermission) return;
        setVisibleCount(PAGE_SIZE);

        const fetchData = async () => {
            const hasAdvancedFilters = Object.values(advancedFilters).some((v: any) => Array.isArray(v) ? v.length > 0 : !!v);

            if (!activeSearch.trim() && !hasAdvancedFilters) {
                setAssets([]);
                setLoading(false);
                setError(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await dataService.getFilteredAssets({
                    search: activeSearch,
                    ...advancedFilters
                });
                setAssets(data);
            } catch (err: any) {
                console.error('AssetsSearch: ERRO no fetchData:', err);
                setError(err.message || 'Erro inesperado ao carregar ativos.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeSearch, advancedFilters, hasSearchPermission]);

    // Use server-side filtered assets directly
    const filteredAssets = assets;

    const visibleAssets = filteredAssets.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAssets.length;

    if (!hasSearchPermission) {
        return (
            <div className="flex flex-col h-full bg-background-light dark:bg-background-dark items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-slate-400 text-[40px]">lock</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">Acesso Negado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Você não tem permissão para realizar buscas neste módulo.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header Section */}
            <div className="px-4 pt-4 pb-3 bg-linear-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b border-primary/10 dark:border-primary/20">
                {/* Advanced Filters */}
                <div className="mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-1">
                    <FilterSelect label="SISTEMA" value={advancedFilters.systemParentId || []} onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterSelectOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleSystemChange([])} />
                    <FilterSelect label="SUB-SISTEMA" value={advancedFilters.systemId || []} onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterSelectOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, systemId: [] }))} disabled={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)} />
                    <FilterSelect label="TIPO UNIDADE" value={advancedFilters.unitTypeParentId || []} onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterSelectOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleParentUnitTypeChange([])} />
                    <FilterSelect label="SUB-TIPO UNIDADE" value={advancedFilters.unitTypeId || []} onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', filterSelectOptions.unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitTypeId: [] }))} disabled={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)} />
                    <FilterSelect label="UNIDADES" value={advancedFilters.unitId || []} onClick={() => openSelectionModal('unitId', 'UNIDADES', filterSelectOptions.units.map((opt: any) => ({ value: String(opt.id), label: opt.description_full || opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitId: [] }))} />
                    <FilterSelect label="SETOR" value={advancedFilters.tagId || []} onClick={() => openSelectionModal('tagId', 'SETOR', filterSelectOptions.tags.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, tagId: [] }))} />
                    <FilterSelect label="POSIÇÃO" value={advancedFilters.tagSubId || []} onClick={() => openSelectionModal('tagSubId', 'POSIÇÃO', filterSelectOptions.tagSubs.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, tagSubId: [] }))} />
                    <FilterSelect label="TIPO" value={advancedFilters.typeId || []} onClick={() => openSelectionModal('typeId', 'TIPO', filterSelectOptions.assetTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, typeId: [] }))} />
                    <FilterSelect label="SITUAÇÃO" value={advancedFilters.statusId || []} onClick={() => openSelectionModal('statusId', 'SITUAÇÃO', filterSelectOptions.statuses.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, statusId: [] }))} />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Código, descrição, marca, modelo, serial"
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                localStorage.setItem('assets_search', val);
                            }}
                            onKeyDown={handleKeyDown}
                            onClear={() => {
                                setSearch('');
                                setActiveSearch('');
                                localStorage.setItem('assets_search', '');
                            }}
                            rightAction={
                                <IconButton
                                    icon="barcode_scanner"
                                    size="sm"
                                    variant="ghost"
                                    className="text-primary"
                                    onClick={async () => {
                                        if (IS_NATIVE) {
                                            try {
                                                const result = await scanBarcode();
                                                if (result) handleScanResult(result);
                                            } catch (err: any) {
                                                toast.error(err.message || 'Erro ao escanear');
                                            }
                                        } else {
                                            setIsScannerOpen(true);
                                        }
                                    }}
                                />
                            }
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 bg-primary text-white rounded-[12px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center hover:bg-primary-dark"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                <FilterSelectionContent label={selectionModal.label} options={selectionModal.options} initialValue={selectionModal.currentValue} onConfirm={handleModalConfirm} />
            </Modal>

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
            />

            {/* Actions Bar (PDF/XLS Export) */}
            {filteredAssets.length > 0 && !loading && !error && (
                <div className="px-4 py-2 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {filteredAssets.length} ativo(s) encontrado(s)
                    </span>
                    <div className="flex items-center gap-2">
                        <AssetsSearchExcelButton assets={filteredAssets} searchQuery={activeSearch} />
                        <AssetsSearchPDFButton assets={filteredAssets} searchQuery={activeSearch} />
                    </div>
                </div>
            )}

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loading size="md" text="Carregando ativos..." />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-500">
                            <span className="material-symbols-outlined text-[40px]">error</span>
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2">Falha no Carregamento</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-[40px]">search_off</span>
                        </div>
                        <p className="text-slate-400 text-center text-sm">
                            {search ? 'Nenhum ativo encontrado para esta busca' : 'Nenhum ativo cadastrado'}
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleAssets.map(asset => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                isFavorite={followedAssetIds.has(asset.id)}
                                onToggleFavorite={() => toggleFavorite(asset.id)}
                                onClick={() => onSelectAsset?.(asset)}
                            />
                        ))}

                        <LoadMore
                            current={visibleAssets.length}
                            total={filteredAssets.length}
                            onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            pageSize={PAGE_SIZE}
                        />
                    </>
                )}
            </div>

            {/* Floating Action Button */}
            {onAdd && canCreate('assets') && (
                <button
                    onClick={onAdd}
                    className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all z-20"
                >
                    <span className="material-symbols-outlined text-3xl font-bold">add</span>
                </button>
            )}
        </div>
    );
};

// Memoized Item for Filter Selection List
const FilterOptionItem = React.memo(({ 
    opt, 
    isSelected, 
    onToggle 
}: { 
    opt: { value: string; label: string }; 
    isSelected: boolean; 
    onToggle: (value: string) => void;
}) => {
    return (
        <label
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
        >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
            </div>
            <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => onToggle(opt.value)}
            />
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
        </label>
    );
});

// Modal Content Component for Filters
const FilterSelectionContent: React.FC<{
    label: string;
    options: { value: string; label: string }[];
    initialValue: string[];
    onConfirm: (value: string[]) => void;
}> = ({ label, options, initialValue, onConfirm }) => {
    const [selectionSearch, setSelectionSearch] = useState('');
    const [currentValue, setCurrentValue] = useState<string[]>(initialValue);

    const filteredOptions = useMemo(() => {
        const query = selectionSearch.toLowerCase().trim();
        if (!query) return options;
        return options.filter(opt => opt.label.toLowerCase().includes(query));
    }, [options, selectionSearch]);

    const selectedSet = useMemo(() => new Set(currentValue), [currentValue]);

    const handleToggle = useCallback((value: string) => {
        setCurrentValue(prev => 
            prev.includes(value) 
                ? prev.filter(v => v !== value) 
                : [...prev, value]
        );
    }, []);

    return (
        <div className="flex flex-col gap-4 text-slate-800 dark:text-gray-100">
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                    type="text"
                    placeholder={`Pesquisar ${label}...`}
                    value={selectionSearch}
                    onChange={(e) => setSelectionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    autoFocus
                />
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(opt => (
                        <FilterOptionItem
                            key={opt.value}
                            opt={opt}
                            isSelected={selectedSet.has(opt.value)}
                            onToggle={handleToggle}
                        />
                    ))
                ) : (
                    <div className="py-10 text-center flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                        <p className="text-slate-400 text-sm font-medium">Nenhum resultado encontrado</p>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => onConfirm(currentValue)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase hover:brightness-110 transition-all"
                >
                    Confirmar Seleção ({currentValue.length})
                </button>
            </div>
        </div>
    );
};


