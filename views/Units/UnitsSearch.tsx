import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Unit, Client, User } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { UnitCardListItem } from '../../components/units/UnitCardListItem';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Loading } from '../../components/ui/Loading';
import { UnitsListPDFButton } from '../../components/reports/UnitsListPDFButton';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Modal } from '../../components/ui/Modal';

interface SelectedFilters {
    systemParentId?: string | string[];
    systemId?: string | string[];
    unitTypeParentId?: string | string[];
    unitTypeId?: string | string[];
    statusId?: string | string[];
}

interface UnitsSearchProps {
    currentUser: User;
    onSelectUnit?: (unit: Unit & { clientName?: string }) => void;
    onAdd?: () => void;
}

export const UnitsSearch: React.FC<UnitsSearchProps> = ({ currentUser, onSelectUnit, onAdd }) => {
    const { canSearch, canCreate } = usePermissions();
    const hasSearchPermission = canSearch('units');
    // ... hook logic ...
    const [search, setSearch] = useState(() => localStorage.getItem('units_search') || '');
    const [appliedSearch, setAppliedSearch] = useState(search);
    const [units, setUnits] = useState<(Unit & { clientName?: string })[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);
    const PAGE_SIZE = 20;

    const defaultFilters: SelectedFilters = {
        systemParentId: [],
        systemId: [],
        unitTypeParentId: [],
        unitTypeId: [],
        statusId: ['3']
    };

    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(() => {
        try {
            const saved = sessionStorage.getItem('units_selected_filters');
            return saved ? JSON.parse(saved) : defaultFilters;
        } catch { return defaultFilters; }
    });

    const [appliedFilters, setAppliedFilters] = useState<SelectedFilters>(() => {
        try {
            const saved = sessionStorage.getItem('units_applied_filters');
            return saved ? JSON.parse(saved) : defaultFilters;
        } catch { return defaultFilters; }
    });

    const [filterOptions, setFilterOptions] = useState<{
        systems: any[];
        subSystems: any[];
        unitTypes: any[];
        unitSubTypes: any[];
        statuses: any[];
    }>({
        systems: [],
        subSystems: [],
        unitTypes: [],
        unitSubTypes: [],
        statuses: []
    });

    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        filterKey: keyof SelectedFilters;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        filterKey: 'systemParentId',
        label: '',
        options: [],
        currentValue: []
    });

    // Load parent options on mount
    useEffect(() => {
        const loadInitialFilterOptions = async () => {
            try {
                const [systemsParent, unitTypesParent, unitStatuses] = await Promise.all([
                    dataService.getSystemsParent(),
                    dataService.getUnitTypesParent(),
                    dataService.getUnitsStatuses()
                ]);
                setFilterOptions(prev => ({
                    ...prev,
                    systems: systemsParent || [],
                    unitTypes: unitTypesParent || [],
                    statuses: unitStatuses || []
                }));
            } catch (error) {
                console.error('Error loading initial filter options:', error);
            }
        };
        loadInitialFilterOptions();
    }, []);

    // Persist filters to sessionStorage so they survive navigation
    useEffect(() => {
        try {
            sessionStorage.setItem('units_selected_filters', JSON.stringify(selectedFilters));
        } catch { /* ignore */ }
    }, [selectedFilters]);

    const handleSystemParentChange = useCallback(async (systemParentId: string | string[]) => {
        setSelectedFilters(prev => ({ ...prev, systemParentId, systemId: [] }));
        
        const ids = Array.isArray(systemParentId) 
            ? systemParentId 
            : (systemParentId ? [systemParentId] : []);

        if (ids.length > 0) {
            try {
                const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
                setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
            } catch (err) {
                console.error('Error loading subSystems:', err);
            }
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    }, []);

    const handleUnitTypeParentChange = useCallback(async (unitTypeParentId: string | string[]) => {
        setSelectedFilters(prev => ({ ...prev, unitTypeParentId, unitTypeId: [] }));
        
        const ids = Array.isArray(unitTypeParentId) 
            ? unitTypeParentId 
            : (unitTypeParentId ? [unitTypeParentId] : []);

        if (ids.length > 0) {
            try {
                const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
                setFilterOptions(prev => ({ ...prev, unitSubTypes: results.flat() }));
            } catch (err) {
                console.error('Error loading unitSubTypes:', err);
            }
        } else {
            setFilterOptions(prev => ({ ...prev, unitSubTypes: [] }));
        }
    }, []);

    const openSelectionModal = useCallback((key: keyof SelectedFilters, label: string, options: { value: string; label: string }[]) => {
        const value = selectedFilters[key];
        const currentValue = Array.isArray(value)
            ? (value as any[]).map(String)
            : (value !== undefined && value !== null ? [String(value)] : []);

        setSelectionModal({
            isOpen: true,
            filterKey: key,
            label,
            options,
            currentValue
        });
    }, [selectedFilters]);

    const handleModalConfirm = useCallback((value: string[]) => {
        const key = selectionModal.filterKey;
        if (key === 'systemParentId') {
            handleSystemParentChange(value);
        } else if (key === 'unitTypeParentId') {
            handleUnitTypeParentChange(value);
        } else {
            setSelectedFilters(prev => ({ ...prev, [key]: value }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    }, [selectionModal.filterKey, handleSystemParentChange, handleUnitTypeParentChange]);

    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedFilters(selectedFilters);
        try {
            sessionStorage.setItem('units_applied_filters', JSON.stringify(selectedFilters));
        } catch { /* ignore */ }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const hasActiveFilters = useMemo(() => {
        return (
            (selectedFilters.systemParentId && selectedFilters.systemParentId.length > 0) ||
            (selectedFilters.systemId && selectedFilters.systemId.length > 0) ||
            (selectedFilters.unitTypeParentId && selectedFilters.unitTypeParentId.length > 0) ||
            (selectedFilters.unitTypeId && selectedFilters.unitTypeId.length > 0) ||
            (selectedFilters.statusId && (selectedFilters.statusId.length !== 1 || !selectedFilters.statusId.includes('3')))
        );
    }, [selectedFilters]);

    const hasActiveAppliedFilters = useMemo(() => {
        return (
            (appliedFilters.systemParentId && appliedFilters.systemParentId.length > 0) ||
            (appliedFilters.systemId && appliedFilters.systemId.length > 0) ||
            (appliedFilters.unitTypeParentId && appliedFilters.unitTypeParentId.length > 0) ||
            (appliedFilters.unitTypeId && appliedFilters.unitTypeId.length > 0) ||
            (appliedFilters.statusId && (appliedFilters.statusId.length !== 1 || !appliedFilters.statusId.includes('3')))
        );
    }, [appliedFilters]);

    const appliedFiltersKey = JSON.stringify(appliedFilters);

    useEffect(() => {
        const mapRawUnit = (item: any): Unit => {
            if ('clientId' in item && 'statusId' in item && 'statusName' in item && item.statusName) return item;
            const rawId = item.status_id || item.statusId;
            const statusObj = filterOptions.statuses.find(s => s.id?.toString() === rawId?.toString());
            const statusName = statusObj ? statusObj.description : (item.status_description || item.statusName);

            return {
                id: (item.id || item.id)?.toString(),
                clientId: (item.client_id || item.clientId)?.toString() || '',
                description: item.description,
                code: item.code,
                installationCodePowerSupply: item.installation_code_power_supply || item.installationCodePowerSupply,
                addressFull: item.address_full || item.addressFull,
                latitude: item.latitude,
                longitude: item.longitude,
                unitTypeParentId: (item.unit_type_parent_id || item.unitTypeParentId)?.toString(),
                unitTypeId: (item.unit_type_id || item.unitTypeId)?.toString(),
                typeName: item.typeName || item.type_name,
                subTypeName: item.subTypeName || item.sub_type_name,
                systemParentId: (item.system_parent_id || item.systemParentId)?.toString(),
                systemId: (item.system_id || item.systemId)?.toString(),
                systemParentName: item.systemParentName || item.system_parent_name,
                systemName: item.systemName || item.system_name,
                imgFilePath: item.img_file_path || item.imgFilePath,
                imgFileName: item.img_file_name || item.imgFileName,
                logoUrl: item.logoUrl,
                statusId: rawId?.toString() || '3',
                statusName: statusName,
                descriptionFull: item.description_full || item.descriptionFull
            };
        };

        const fetchData = async () => {
            const shouldFetch = (appliedSearch && appliedSearch.trim().length > 0) || hasActiveAppliedFilters;

            if (!shouldFetch) {
                setUnits([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Ensure clients are loaded for name mapping
                let currentClients = clients;
                if (currentClients.length === 0) {
                    const clientsData = await dataService.getClients();
                    currentClients = clientsData.filter(c => c.status === 'active');
                    setClients(currentClients);
                }

                const allUnitsMap = new Map();

                if (appliedSearch && appliedSearch.trim().length > 0) {
                    const searchNorm = appliedSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    // 1. Search Units directly (Server-Side)
                    const textSearchResults = await dataService.searchUnits(appliedSearch);

                    // 2. Search Units by Client Name (Server-Side via getUnitsByClient for matching clients)
                    const matchingClients = currentClients.filter(c =>
                        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNorm)
                    );

                    const limitClients = matchingClients.slice(0, 5);
                    const clientUnitsPromises = limitClients.map(client =>
                        dataService.getUnitsByClient(client.id)
                    );

                    const clientUnitsArrays = await Promise.all(clientUnitsPromises);
                    const clientUnits = clientUnitsArrays.flat();

                    // Add text search results
                    textSearchResults.forEach(u => allUnitsMap.set(u.id, mapRawUnit(u)));

                    // Add client search results
                    clientUnits.forEach(u => allUnitsMap.set(u.id, mapRawUnit(u)));
                } else {
                    // No text search, but filters are active -> Fetch units based on status filter
                    let statusParam: 'all' | 'active' | 'inactive' = 'active';
                    if (appliedFilters.statusId && appliedFilters.statusId.length > 0) {
                        const hasActive = appliedFilters.statusId.includes('3');
                        const hasInactive = appliedFilters.statusId.includes('4');
                        if (hasActive && hasInactive) {
                            statusParam = 'all';
                        } else if (hasActive) {
                            statusParam = 'active';
                        } else if (hasInactive) {
                            statusParam = 'inactive';
                        }
                    } else {
                        statusParam = 'all';
                    }

                    const dbUnits = await dataService.getUnits(statusParam);
                    dbUnits.forEach(u => allUnitsMap.set(u.id, mapRawUnit(u)));
                }

                const mergedUnits = Array.from(allUnitsMap.values()).map((unit: any) => ({
                    ...unit,
                    clientName: currentClients.find(c => c.id === unit.clientId)?.name
                }));

                setUnits(mergedUnits);
            } catch (error) {
                console.error('Failed to load units', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [appliedSearch, appliedFiltersKey, hasActiveAppliedFilters]);

    // Apply filters client-side and sort alphabetically by description
    const filteredUnits = useMemo(() => {
        const filtered = units.filter(unit => {
            // Filter by systemParentId (SISTEMA)
            if (appliedFilters.systemParentId && appliedFilters.systemParentId.length > 0) {
                const parentIdStr = String(unit.systemParentId);
                const matches = Array.isArray(appliedFilters.systemParentId)
                    ? appliedFilters.systemParentId.includes(parentIdStr)
                    : appliedFilters.systemParentId === parentIdStr;
                if (!matches) return false;
            }
            // Filter by systemId (SUB-SISTEMA)
            if (appliedFilters.systemId && appliedFilters.systemId.length > 0) {
                const idStr = String(unit.systemId);
                const matches = Array.isArray(appliedFilters.systemId)
                    ? appliedFilters.systemId.includes(idStr)
                    : appliedFilters.systemId === idStr;
                if (!matches) return false;
            }
            // Filter by unitTypeParentId (TIPO UNIDADE)
            if (appliedFilters.unitTypeParentId && appliedFilters.unitTypeParentId.length > 0) {
                const parentIdStr = String(unit.unitTypeParentId);
                const matches = Array.isArray(appliedFilters.unitTypeParentId)
                    ? appliedFilters.unitTypeParentId.includes(parentIdStr)
                    : appliedFilters.unitTypeParentId === parentIdStr;
                if (!matches) return false;
            }
            // Filter by unitTypeId (SUB-TIPO UNIDADE)
            if (appliedFilters.unitTypeId && appliedFilters.unitTypeId.length > 0) {
                const idStr = String(unit.unitTypeId);
                const matches = Array.isArray(appliedFilters.unitTypeId)
                    ? appliedFilters.unitTypeId.includes(idStr)
                    : appliedFilters.unitTypeId === idStr;
                if (!matches) return false;
            }
            // Filter by statusId (SITUAÇÃO)
            if (appliedFilters.statusId && appliedFilters.statusId.length > 0) {
                const statusStr = String(unit.statusId);
                const matches = Array.isArray(appliedFilters.statusId)
                    ? appliedFilters.statusId.includes(statusStr)
                    : appliedFilters.statusId === statusStr;
                if (!matches) return false;
            }
            return true;
        });

        // Sort alphabetically by description/name
        return filtered.sort((a, b) => {
            const descA = a.descriptionFull || a.description || '';
            const descB = b.descriptionFull || b.description || '';
            return descA.localeCompare(descB, 'pt-BR', { sensitivity: 'base' });
        });
    }, [units, appliedFiltersKey]);

    const visibleUnits = useMemo(() => filteredUnits.slice(0, visibleCount), [filteredUnits, visibleCount]);
    const hasMore = visibleCount < filteredUnits.length;

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
        <div className="flex flex-col h-full relative bg-background-light dark:bg-background-dark">
            
            {/* ── Filtering overlay ── */}
            {loading && (
                <div className="absolute inset-0 z-40 pointer-events-none flex flex-col">
                    {/* Top progress bar */}
                    <div className="h-[3px] w-full shrink-0 overflow-hidden bg-primary/10">
                        <div
                            className="h-full w-[40%]"
                            style={{
                                animation: 'loading-bar 1.5s infinite linear',
                                background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)'
                            }}
                        />
                    </div>
                    {/* Content dimming + centered banner */}
                    <div className="flex-1 bg-slate-900/10 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                            <div className="relative flex items-center justify-center w-10 h-10">
                                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                                <img
                                    src="/siges_logo.png"
                                    alt="SIGES"
                                    className="w-10 h-10 object-contain animate-spin"
                                    style={{ animationDuration: '1.2s', animationTimingFunction: 'linear' }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Atualizando dados</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide">Aplicando filtros selecionados...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="px-4 pt-4 pb-3 bg-linear-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b border-primary/10 dark:border-primary/20 flex flex-col gap-3">
                {/* Filter Select Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-1">
                    <FilterSelect
                        label="SISTEMA"
                        value={selectedFilters.systemParentId || []}
                        onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => handleSystemParentChange([])}
                    />
                    <FilterSelect
                        label="SUB-SISTEMA"
                        value={selectedFilters.systemId || []}
                        onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, systemId: [] }))}
                        disabled={!selectedFilters.systemParentId || (Array.isArray(selectedFilters.systemParentId) && selectedFilters.systemParentId.length === 0)}
                    />
                    <FilterSelect
                        label="TIPO UNIDADE"
                        value={selectedFilters.unitTypeParentId || []}
                        onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => handleUnitTypeParentChange([])}
                    />
                    <FilterSelect
                        label="SUB-TIPO UNIDADE"
                        value={selectedFilters.unitTypeId || []}
                        onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', filterOptions.unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, unitTypeId: [] }))}
                        disabled={!selectedFilters.unitTypeParentId || (Array.isArray(selectedFilters.unitTypeParentId) && selectedFilters.unitTypeParentId.length === 0)}
                    />
                    <FilterSelect
                        label="SITUAÇÃO"
                        value={selectedFilters.statusId || []}
                        onClick={() => openSelectionModal('statusId', 'SITUAÇÃO', filterOptions.statuses.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, statusId: [] }))}
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Nome e/ou código"
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                localStorage.setItem('units_search', val);
                            }}
                            onKeyDown={handleKeyDown}
                            onClear={() => {
                                setSearch('');
                                setAppliedSearch('');
                                localStorage.setItem('units_search', '');
                            }}
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

            {/* Actions Bar (PDF Export) */}
            {filteredUnits.length > 0 && !loading && (
                <div className="px-4 py-2 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {filteredUnits.length} unidade(s) encontrada(s)
                    </span>
                    <UnitsListPDFButton
                        units={filteredUnits}
                        searchQuery={appliedSearch}
                    />
                </div>
            )}

            {/* Units List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24">
                {/* ... loading/empty states same as before ... */}
                {filteredUnits.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-[40px]">
                                {(search || hasActiveFilters) ? 'search_off' : 'search'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-center text-sm font-medium mb-1">
                            {(search || hasActiveFilters) ? 'Nenhuma unidade encontrada' : 'Digite ou selecione filtros para buscar unidades'}
                        </p>
                        {!(search || hasActiveFilters) && (
                            <p className="text-slate-500 dark:text-slate-600 text-center text-xs max-w-xs">
                                Busque por nome/código ou utilize os filtros do cabeçalho
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3">
                            {visibleUnits.map(unit => (
                                <UnitCardListItem
                                    key={unit.id}
                                    unit={unit}
                                    onClick={(u) => onSelectUnit?.(u)}
                                />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                                    className="px-6 py-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary transition-all active:scale-95 shadow-sm"
                                >
                                    Carregar mais ({filteredUnits.length - visibleCount} restantes)
                                </button>
                            </div>
                        )}
                    </>
                )}
                {/* Floating Action Button */}
                {onAdd && canCreate('units') && (
                    <button
                        onClick={onAdd}
                        className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all z-20"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </button>
                )}
            </div>

            {/* Filter Selection Modal */}
            <Modal
                isOpen={selectionModal.isOpen}
                onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))}
                title={`Filtrar por ${selectionModal.label}`}
                maxWidth="md"
            >
                <FilterSelectionContent
                    label={selectionModal.label}
                    options={selectionModal.options}
                    initialValue={selectionModal.currentValue}
                    onConfirm={handleModalConfirm}
                />
            </Modal>
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
                    className="w-full py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 hover:brightness-110"
                >
                    Confirmar Seleção ({currentValue.length})
                </button>
            </div>
        </div>
    );
};
