import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { TechnicalManual, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { IconButton } from '../../../../components/ui/IconButton';
import { Loading } from '../../../../components/ui/Loading';
import { LoadMore } from '../../../../components/ui/LoadMore';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { FilterSelect } from '../../../../components/ui/FilterSelect';
import { Modal } from '../../../../components/ui/Modal';

interface TechnicalManualsListProps {
    onSelect: (item: TechnicalManual) => void;
    onAdd: () => void;
}

let listCache: {
    items: TechnicalManual[];
    visibleCount: number;
    search: string;
    assetTypeFilter: string[];
    timestamp: number;
    scrollTop: number;
} | null = null;

export const TechnicalManualsList: React.FC<TechnicalManualsListProps> = ({ onSelect, onAdd }) => {
    const { canCreate } = usePermissions();
    const canCreateManual = canCreate('technicals_manuals_create_edit_delete');
    const [search, setSearch] = useState(listCache?.search || '');
    const [assetTypeFilter, setAssetTypeFilter] = useState<string[]>(listCache?.assetTypeFilter || []);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [items, setItems] = useState<TechnicalManual[]>(listCache?.items || []);
    const [loading, setLoading] = useState(!listCache);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(listCache?.visibleCount || 10);
    const [selectionModal, setSelectionModal] = useState<{ isOpen: boolean; label: string; options: { value: string; label: string }[]; currentValue: string[] }>({
        isOpen: false,
        label: '',
        options: [],
        currentValue: []
    });
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
                const data = await dataService.getTechnicalManuals('all', debouncedSearch, assetTypeFilter[0] || undefined);
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

    const openSelectionModal = useCallback((label: string, options: { value: string; label: string }[]) => {
        setSelectionModal({
            isOpen: true,
            label,
            options,
            currentValue: assetTypeFilter
        });
    }, [assetTypeFilter]);

    const handleModalConfirm = useCallback((value: string[]) => {
        setAssetTypeFilter(value);
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    const assetTypeOptions = useMemo(() =>
        assetTypes.map(t => ({ value: t.id, label: t.description })),
        [assetTypes]
    );

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
                    {canCreateManual && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAdd}
                            title="Novo Manual"
                        />
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <FilterSelect
                        label="TIPO"
                        value={assetTypeFilter}
                        onClick={() => openSelectionModal('TIPO', assetTypeOptions)}
                        onClear={() => setAssetTypeFilter([])}
                    />
                </div>
            </div>

            <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                <FilterSelectionContent label={selectionModal.label} options={selectionModal.options} initialValue={selectionModal.currentValue} onConfirm={handleModalConfirm} />
            </Modal>

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
