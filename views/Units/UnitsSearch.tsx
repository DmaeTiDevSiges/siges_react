import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Unit, Client, User } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { UnitCardListItem } from '../../components/units/UnitCardListItem';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useClientScope } from '../../hooks/useClientScope';
import { unitScopeQueryIds } from '../../utils/unitEditScope';
import { normalizeSystemParentFilterIds, resolveSystemParentFilterIds, systemsScopeOption } from '../../utils/clientScope';
import { Loading } from '../../components/ui/Loading';
import { UnitsListPDFButton } from '../../components/reports/UnitsListPDFButton';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Modal } from '../../components/ui/Modal';
import { haversineDistance, formatDistance } from '../../utils/geo';

interface SelectedFilters {
    systemParentId?: string | string[];
    systemId?: string | string[];
    unitTypeParentId?: string | string[];
    unitTypeId?: string | string[];
    statusId?: string | string[];
}

const getFilterDisplayValue = (
    value: string | string[] | undefined,
    options: { id: string | number }[]
): string | string[] => {
    const optionIds = options.map(option => String(option.id));
    const selectedIds = new Set(
        Array.isArray(value) ? value.map(String) : value ? [String(value)] : []
    );
    const allOptionsSelected = optionIds.length > 0 && optionIds.every(id => selectedIds.has(id));

    return allOptionsSelected ? 'Todos' : (value || []);
};

interface UnitsSearchProps {
    currentUser: User;
    onSelectUnit?: (unit: Unit & { clientName?: string }) => void;
    onAdd?: () => void;
}

export const UnitsSearch: React.FC<UnitsSearchProps> = ({ currentUser, onSelectUnit, onAdd }) => {
    const { canSearch, canCreate } = usePermissions();
    const hasSearchPermission = canSearch('units');
    // Escopo de cliente: units.clients_ids ∩ cfg_departments.clients_ids do usuário
    const { clientIds, isAdminSuper, scopeReady, inScope } = useClientScope();
    const systemsScope = useMemo(() => systemsScopeOption(clientIds), [clientIds]);
    const scopeClientsIds = useMemo(
        () => unitScopeQueryIds(isAdminSuper, clientIds),
        [isAdminSuper, clientIds]
    );
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
    const [hasStoredSelectedFilters] = useState(() => {
        try {
            return sessionStorage.getItem('units_selected_filters') !== null;
        } catch { return false; }
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
    const visibleSystemIds = useMemo(
        () => filterOptions.systems.map(system => String(system.id)),
        [filterOptions.systems]
    );
    const systemFilterDisplayValue = getFilterDisplayValue(selectedFilters.systemParentId, filterOptions.systems);
    const subSystemFilterDisplayValue = getFilterDisplayValue(selectedFilters.systemId, filterOptions.subSystems);
    const unitTypeFilterDisplayValue = getFilterDisplayValue(selectedFilters.unitTypeParentId, filterOptions.unitTypes);
    const unitSubTypeFilterDisplayValue = getFilterDisplayValue(selectedFilters.unitTypeId, filterOptions.unitSubTypes);
    const statusFilterDisplayValue = getFilterDisplayValue(selectedFilters.statusId, filterOptions.statuses);
    const normalizeSystemSelection = useCallback(
        (value: unknown) => resolveSystemParentFilterIds(value, visibleSystemIds),
        [visibleSystemIds]
    );

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

    // Proximity filter state
    const [nearbyEnabled, setNearbyEnabled] = useState(false);
    const [nearbyRadius, setNearbyRadius] = useState<number>(5000); // meters
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [unitDistances, setUnitDistances] = useState<Map<string, number>>(new Map());
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const [showSystemRequiredModal, setShowSystemRequiredModal] = useState(false);
    const [showStatusRequiredModal, setShowStatusRequiredModal] = useState(false);

    // Load parent options after the user's client scope is resolved.
    useEffect(() => {
        if (!scopeReady) return;

        let active = true;
        const loadInitialFilterOptions = async () => {
            try {
                const [systemsParent, unitTypesParent, unitStatuses] = await Promise.all([
                    dataService.getSystemsParent(systemsScope),
                    dataService.getUnitTypesParent(),
                    dataService.getUnitsStatuses()
                ]);
                if (!active) return;

                const systems = systemsParent || [];
                setFilterOptions(prev => ({
                    ...prev,
                    systems,
                    unitTypes: unitTypesParent || [],
                    statuses: unitStatuses || []
                }));
                const visibleIds = systems.map(system => String(system.id));
                setSelectedFilters(prev => ({
                    ...prev,
                    systemParentId: hasStoredSelectedFilters
                        ? resolveSystemParentFilterIds(prev.systemParentId, visibleIds)
                        : visibleIds
                }));
                setAppliedFilters(prev => {
                    return {
                        ...prev,
                        systemParentId: resolveSystemParentFilterIds(prev.systemParentId, visibleIds)
                    };
                });
            } catch (error) {
                console.error('Error loading initial filter options:', error);
            }
        };
        loadInitialFilterOptions();
        return () => { active = false; };
    }, [scopeReady, systemsScope, hasStoredSelectedFilters]);

    // Persist filters to sessionStorage so they survive navigation
    useEffect(() => {
        try {
            sessionStorage.setItem('units_selected_filters', JSON.stringify(selectedFilters));
        } catch { /* ignore */ }
    }, [selectedFilters]);

    // Request user location when nearby filter is enabled
    useEffect(() => {
        if (!nearbyEnabled || userLocation) return;

        // Try to use stored user location first (from tracker)
        if (currentUser.latitude && currentUser.longitude) {
            setUserLocation({
                lat: currentUser.latitude,
                lng: currentUser.longitude
            });
            return;
        }

        // Fallback: request GPS location
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationLoading(false);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
                setLocationLoading(false);
                // Don't disable nearby — user can still see all units without distance
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
    }, [nearbyEnabled, userLocation, currentUser.latitude, currentUser.longitude]);

    const handleSystemParentChange = useCallback(async (systemParentId: string | string[]) => {
        const selectedSystemIds = normalizeSystemSelection(systemParentId);
        setSelectedFilters(prev => ({ ...prev, systemParentId: selectedSystemIds, systemId: [] }));
        
        const ids = selectedSystemIds;

        if (ids.length > 0) {
            try {
                const results = await Promise.all(ids.map(id => dataService.getSystems(id, systemsScope)));
                setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
            } catch (err) {
                console.error('Error loading subSystems:', err);
            }
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    }, [systemsScope, normalizeSystemSelection]);

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
        const selectedValues = Array.isArray(value)
            ? (value as any[]).map(String)
            : (value !== undefined && value !== null ? [String(value)] : []);
        const normalizedSelectedValues = key === 'systemParentId'
            ? resolveSystemParentFilterIds(selectedValues, options.map(option => option.value))
            : selectedValues;
        const currentValue = normalizedSelectedValues;

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
        if (normalizeSystemParentFilterIds(selectedFilters.systemParentId, visibleSystemIds).length === 0) {
            setShowSystemRequiredModal(true);
            return;
        }

        const selectedStatuses = Array.isArray(selectedFilters.statusId)
            ? selectedFilters.statusId
            : selectedFilters.statusId ? [selectedFilters.statusId] : [];
        if (selectedStatuses.length === 0) {
            setShowStatusRequiredModal(true);
            return;
        }

        setAppliedSearch(search);
        setAppliedFilters(selectedFilters);
        setSearchTrigger(prev => prev + 1);
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

            const clientsIds = Array.isArray(item.clients_ids) ? item.clients_ids : (item.clients_ids ? [item.clients_ids] : []);

            return {
                id: (item.id || item.id)?.toString(),
                clientId: clientsIds[0]?.toString() || (item.client_id || item.clientId)?.toString() || '',
                clientsIds: clientsIds.map(String),
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
            const shouldFetch = (appliedSearch && appliedSearch.trim().length > 0) || hasActiveAppliedFilters || nearbyEnabled;

            if (!shouldFetch) {
                setUnits([]);
                setLoading(false);
                return;
            }

            // Escopo de cliente ainda resolvendo → não consulta "às cegas"
            // (o efeito roda de novo quando scopeReady virar true).
            if (!scopeReady) {
                setLoading(true);
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

                if (nearbyEnabled && userLocation) {
                    // Nearby mode: fetch all units with coordinates and calculate distances
                    // (text search is applied client-side in filteredUnits)
                    let statusParam: 'all' | 'active' | 'inactive' = 'active';
                    if (appliedFilters.statusId && appliedFilters.statusId.length > 0) {
                        const hasActive = appliedFilters.statusId.includes('3');
                        const hasInactive = appliedFilters.statusId.includes('4');
                        if (hasActive && hasInactive) statusParam = 'all';
                        else if (hasActive) statusParam = 'active';
                        else if (hasInactive) statusParam = 'inactive';
                    } else {
                        statusParam = 'all';
                    }

                    const dbUnits = await dataService.getUnitsWithCoordinates(statusParam, scopeClientsIds);
                    const distances = new Map<string, number>();

                    dbUnits.forEach((u: any) => {
                        const mapped = mapRawUnit(u);
                        if (mapped.latitude && mapped.longitude) {
                            const dist = haversineDistance(
                                userLocation.lat,
                                userLocation.lng,
                                mapped.latitude,
                                mapped.longitude
                            );
                            distances.set(mapped.id, dist);
                        }
                        allUnitsMap.set(mapped.id, mapped);
                    });

                    setUnitDistances(distances);
                } else if (appliedSearch && appliedSearch.trim().length > 0) {
                    const searchNorm = appliedSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    // 1. Search Units directly (Server-Side)
                    const textSearchResults = await dataService.searchUnits(appliedSearch, 50, undefined, scopeClientsIds);

                    // 2. Search Units by Client Name (Server-Side via getUnitsByClient for matching clients)
                    // Escopo de cliente: só clientes em cfg_departments.clients_ids do usuário
                    const matchingClients = currentClients.filter(c =>
                        inScope([c.id]) &&
                        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNorm)
                    );

                    const limitClients = matchingClients.slice(0, 5);
                    const clientUnitsPromises = limitClients.map(client =>
                        dataService.searchUnitsByClient(client.id, scopeClientsIds)
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

                    const dbUnits = await dataService.getUnitsForSearch(statusParam, '', scopeClientsIds);
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
    }, [appliedSearch, appliedFiltersKey, hasActiveAppliedFilters, nearbyEnabled, userLocation, searchTrigger, scopeReady, scopeClientsIds]);

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

        // Apply text search filter when nearby is enabled (search is client-side in nearby mode)
        const textFiltered = nearbyEnabled && appliedSearch && appliedSearch.trim().length > 0
            ? (() => {
                const searchNorm = appliedSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const terms = searchNorm.split(/\s+/).filter(Boolean);
                return filtered.filter(unit => {
                    const desc = (unit.descriptionFull || unit.description || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const code = (unit.code || '').toLowerCase();
                    const client = (unit.clientName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return terms.every(term => desc.includes(term) || code.includes(term) || client.includes(term));
                });
            })()
            : filtered;

        // Filter by proximity radius when nearby is enabled
        const proximityFiltered = nearbyEnabled && userLocation
            ? textFiltered.filter(unit => {
                const dist = unitDistances.get(unit.id);
                if (dist == null) return false; // Exclude units without coordinates
                return dist <= nearbyRadius;
            })
            : textFiltered;

        // Sort: by distance when nearby, alphabetically otherwise
        if (nearbyEnabled && userLocation) {
            return proximityFiltered.sort((a, b) => {
                const distA = unitDistances.get(a.id) ?? Infinity;
                const distB = unitDistances.get(b.id) ?? Infinity;
                return distA - distB;
            });
        }

        return filtered.sort((a, b) => {
            const descA = a.descriptionFull || a.description || '';
            const descB = b.descriptionFull || b.description || '';
            return descA.localeCompare(descB, 'pt-BR', { sensitivity: 'base' });
        });
    }, [units, appliedFiltersKey, nearbyEnabled, userLocation, nearbyRadius, unitDistances, appliedSearch]);

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
                    {/* Nearby Button */}
                    <div
                        onClick={() => {
                            if (nearbyEnabled) {
                                setShowRadiusModal(true);
                            } else {
                                setNearbyEnabled(true);
                                setShowRadiusModal(true);
                            }
                        }}
                        className={`relative flex items-center w-auto shrink-0 min-w-[110px] h-[42px] cursor-pointer transition-opacity`}
                    >
                        <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden transition-all ${
                            nearbyEnabled
                                ? 'border-primary ring-1 ring-primary/20'
                                : 'border-slate-200 dark:border-slate-700'
                        }`}>
                            <div className="flex-1 px-3 flex flex-col justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none whitespace-nowrap">RAIO (KM)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[11px] font-bold whitespace-nowrap ${
                                        nearbyEnabled ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {nearbyEnabled ? `${nearbyRadius >= 1000 ? `${nearbyRadius / 1000}km` : `${nearbyRadius}m`}` : 'Todos'}
                                    </span>
                                </div>
                            </div>

                            {nearbyEnabled && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNearbyEnabled(false);
                                        setUserLocation(null);
                                        setUnitDistances(new Map());
                                    }}
                                    className="px-3 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                        {locationLoading && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                        )}
                    </div>
                    <FilterSelect
                        label="SISTEMA"
                        value={systemFilterDisplayValue}
                        onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => handleSystemParentChange([])}
                        required
                    />
                    <FilterSelect
                        label="SUB-SISTEMA"
                        value={subSystemFilterDisplayValue}
                        onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, systemId: [] }))}
                        disabled={!selectedFilters.systemParentId || (Array.isArray(selectedFilters.systemParentId) && selectedFilters.systemParentId.length === 0)}
                    />
                    <FilterSelect
                        label="TIPO UNIDADE"
                        value={unitTypeFilterDisplayValue}
                        onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => handleUnitTypeParentChange([])}
                    />
                    <FilterSelect
                        label="SUB-TIPO UNIDADE"
                        value={unitSubTypeFilterDisplayValue}
                        onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', filterOptions.unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, unitTypeId: [] }))}
                        disabled={!selectedFilters.unitTypeParentId || (Array.isArray(selectedFilters.unitTypeParentId) && selectedFilters.unitTypeParentId.length === 0)}
                    />
                    <FilterSelect
                        label="SITUAÇÃO"
                        value={statusFilterDisplayValue}
                        onClick={() => openSelectionModal('statusId', 'SITUAÇÃO', filterOptions.statuses.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                        onClear={() => setSelectedFilters(prev => ({ ...prev, statusId: [] }))}
                        required
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
                                    distance={unitDistances.get(unit.id)}
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
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all z-20"
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

            <Modal
                isOpen={showSystemRequiredModal}
                onClose={() => setShowSystemRequiredModal(false)}
                title="Atenção"
                message="Selecione ao menos um Sistema para realizar a busca."
                type="warning"
                confirmLabel="Entendi"
                onConfirm={() => setShowSystemRequiredModal(false)}
                hideCancelButton
            />

            <Modal
                isOpen={showStatusRequiredModal}
                onClose={() => setShowStatusRequiredModal(false)}
                title="Atenção"
                message="Selecione ao menos uma Situação para realizar a busca."
                type="warning"
                confirmLabel="Entendi"
                onConfirm={() => setShowStatusRequiredModal(false)}
                hideCancelButton
            />

            {/* Radius Selection Modal */}
            <Modal
                isOpen={showRadiusModal}
                onClose={() => setShowRadiusModal(false)}
                title="Selecionar Raio"
                maxWidth="sm"
            >
                <div className="flex flex-col gap-3 p-2">
                    {locationLoading && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">location_searching</span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Obtendo localização...</span>
                        </div>
                    )}
                    {[
                        { value: 1000, label: '1 km', desc: 'Muito próximo' },
                        { value: 3000, label: '3 km', desc: 'Próximo' },
                        { value: 5000, label: '5 km', desc: 'Padrão' },
                        { value: 10000, label: '10 km', desc: 'Médio alcance' },
                        { value: 25000, label: '25 km', desc: 'Longo alcance' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setNearbyRadius(opt.value);
                                setShowRadiusModal(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                nearbyRadius === opt.value
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-800'
                            }`}
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className={`text-sm font-bold ${nearbyRadius === opt.value ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                    {opt.label}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">{opt.desc}</span>
                            </div>
                            {nearbyRadius === opt.value && (
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
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
    const allOptionsSelected = options.length > 0 && options.every(option => selectedSet.has(option.value));

    const handleToggleAll = useCallback(() => {
        setCurrentValue(allOptionsSelected ? [] : options.map(option => option.value));
    }, [allOptionsSelected, options]);

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

            <label className="flex items-center gap-2 px-1 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                    type="checkbox"
                    aria-label={`Selecionar ou desmarcar todas as opções de ${label.toLowerCase()}`}
                    checked={allOptionsSelected}
                    disabled={options.length === 0}
                    onChange={handleToggleAll}
                    className="h-4 w-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <span>Selecionar todas as opções</span>
            </label>

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
                    className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 hover:brightness-110"
                >
                    Confirmar Seleção ({currentValue.length})
                </button>
            </div>
        </div>
    );
};
