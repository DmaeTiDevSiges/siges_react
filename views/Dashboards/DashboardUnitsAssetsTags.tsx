import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/core/supabase';
import { useAppNotices } from '../../hooks/useAppNotices';
import { useClientScope } from '../../hooks/useClientScope';
import { systemsScopeOption } from '../../utils/clientScope';
import { pickActivePeriodsAt } from '../../utils/appNoticePeriod';
import { noticeAppliesToUnitSystemParent, resolveNoticeSystemParentIds } from '../../utils/appNoticeSystemScope';
import { User, System, UnitType } from '../../types';
import { useAssetModal } from '../../hooks/useAssetModal';
import { computeMoExtraByUnit, computeMoExtraSummary, computeSectorsStats, computeUnitsRows, computeSectorPercentage, filterByUnitTypes } from '../../utils/unitsAssetsTagsDashboard';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { FilterSelectionContent } from '../../components/ui/FilterSelectionContent';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { useRecentlyChanged } from '../../hooks/useRecentlyChanged';
import { AvailabilityExportModal } from './components/AvailabilityExportModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { UnitsAvailabilityMap } from './components/UnitsAvailabilityMap';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Skeleton } from '../../components/ui/Skeleton';
import { CircularGauge } from '../../components/ui/CircularGauge';




const formatDashboardRelativeTime = (dateValue: string | Date) => {
    const diffMs = Math.max(0, new Date().getTime() - new Date(dateValue).getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`;
    if (diffMonths > 0) return `há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    if (diffWeeks > 0) return `há ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    if (diffDays > 0) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    if (diffHrs > 0) return `há ${diffHrs} h`;

    return `há ${diffMins} min`;
};

// Scrollable row of asset cards with drag-to-scroll support
// Card recém-atualizado (realtime): só os campos que aparecem no card contam.
const assetRowId = (row: any) => row.id;
const assetRowSignature = (row: any) => [
    row.last_asset_available_id, row.last_is_available, row.last_reported_at,
    row.last_asset_available_rate, row.last_flow_rate, row.last_power, row.last_pressure,
    row.is_active, row.last_o_id,
].join('|');
const UPDATED_HIGHLIGHT_MS = 1000;

const AssetScrollRow: React.FC<{ assets: any[]; onAssetClick: (asset: any) => void; highlightedIds?: ReadonlySet<string>; }> = ({ assets, onAssetClick, highlightedIds }) => {
    const { ref, dragHandlers } = useDragToScroll<HTMLDivElement>();
    return (
        <div
            ref={ref}
            {...dragHandlers}
            className="flex-1 flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 sm:py-1.5 px-1 cursor-grab active:cursor-grabbing"
        >
            {assets.map((asset: any) => (
                <Card
                    key={asset.id}
                    onClick={() => asset.isActive && onAssetClick(asset)}
                    className={`shrink-0 min-w-[100px] sm:min-w-[120px] w-fit p-2 sm:p-2.5 rounded-[14px]! sm:rounded-[16px]! flex flex-col items-center justify-between text-center relative transition-all min-h-[80px] sm:min-h-[88px] h-auto border-slate-200 dark:border-slate-800 ${asset.isActive
                            ? 'hover:shadow-lg active:scale-[0.98] cursor-pointer group'
                            : 'opacity-40 grayscale cursor-default'
                        } ${highlightedIds?.has(String(asset.id))
                            ? (asset.isAvailable ? 'animate-card-updated-available' : 'animate-card-updated-unavailable')
                            : ''}`}
                >
                    <div className="w-full px-0.5 sm:px-1">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight whitespace-nowrap block transition-colors ${asset.isActive
                                ? 'text-slate-800 dark:text-slate-300 group-hover:text-primary'
                                : 'text-slate-500 dark:text-slate-500'
                            }`}>
                            {asset.description}
                        </span>
                    </div>

                    <div className="relative my-0.5 sm:my-1 flex items-center justify-center">
                        {asset.isActive ? (
                            <span className={`material-symbols-outlined text-xl sm:text-2xl transition-transform group-hover:scale-110 ${asset.isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
                                {asset.isAvailable ? 'thumb_up' : 'thumb_down'}
                            </span>
                        ) : (
                            <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-400">block</span>
                        )}
                        {asset.isActive && Number(asset.opCounter) > 0 ? (
                            <div className={`absolute -top-2 -right-2 sm:-top-2.5 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm z-10 animate-in fade-in zoom-in duration-300 ${asset.isAvailable ? 'bg-amber-500 text-black' : 'bg-rose-600 text-white'
                                }`}>
                                <span className="text-[10px] sm:text-[12px] font-black leading-none">
                                    {asset.opCounter}
                                </span>
                            </div>
                        ) : null}
                        {asset.isActive && asset.reportedImage && (
                            <div className="absolute -top-2 -left-2 sm:-top-2.5 sm:-left-3 w-5 h-5 sm:w-6 sm:h-6 bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm z-10">
                                <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-slate-400">photo_camera</span>
                            </div>
                        )}
                    </div>


                    <p className="text-[9px] sm:text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{asset.value}<span className="text-[7px] sm:text-[8px] opacity-60 ml-0.5">{asset.unit}</span></p>

                </Card>
            ))}
        </div>
    );
};


interface DashboardUnitsAssetsTagsProps {
    currentUser: User;
    onSelectVisit: (visit: any) => void;
    onCreateServiceRequest?: (initialData: any) => void;
    isFullscreenMapMode?: boolean;
}

export const DashboardUnitsAssetsTags: React.FC<DashboardUnitsAssetsTagsProps> = ({ 
    currentUser, 
    onSelectVisit, 
    onCreateServiceRequest,
    isFullscreenMapMode = false 
}) => {
    const [selectedSystemId, setSelectedSystemId] = useState<string>(() => localStorage.getItem('siges_dashboard_system_id') || '');
    const [systems, setSystems] = useState<System[]>([]);
    // Filtro TIPO DE UNIDADE ('' = todos): units.unit_type_parent_id → cfg_units_types.
    const [selectedUnitTypeIds, setSelectedUnitTypeIds] = useState<string[]>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('siges_dashboard_unit_type_ids') || '[]');
            return Array.isArray(saved) ? saved.map(String) : [];
        } catch {
            return [];
        }
    });
    const [filterModal, setFilterModal] = useState<null | 'system' | 'unitType'>(null);
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);

    // Escopo de cliente do filtro SISTEMA (Fase 1D): undefined = sem corte
    // (super admin); lista = clients_ids do departamento do usuário.
    const { clientIds, scopeReady } = useClientScope();
    const systemsScope = systemsScopeOption(clientIds);
    const [rawData, setAllData] = useState<any[]>([]);
    // Linhas visíveis: aplica o filtro de tipo de unidade (units.unit_type_parent_id).
    const allData = useMemo(
        () => filterByUnitTypes(rawData, selectedUnitTypeIds),
        [rawData, selectedUnitTypeIds]
    );
    // Setores alterados pelo realtime: destaque de 1 s (troca de sistema não destaca).
    const recentlyChangedIds = useRecentlyChanged(rawData, assetRowId, assetRowSignature, selectedSystemId, UPDATED_HIGHLIGHT_MS);
    const [sectorsData, setSectorsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSectorName, setSelectedSectorName] = useState<string>(() => localStorage.getItem('siges_dashboard_sector_name') || '');
    const [sortMode, setSortMode] = useState<'disponibilidade' | 'alfabetica'>(() =>
        (localStorage.getItem('siges_dashboard_sort_mode') as 'disponibilidade' | 'alfabetica') || 'disponibilidade'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
    const [activeSearchSuggestion, setActiveSearchSuggestion] = useState(-1);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);


    const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
        if (isFullscreenMapMode) return 'map';
        return (localStorage.getItem('dashboard_units_view_mode') as 'list' | 'map') || 'list';
    });

    // Accordion state for mobile
    const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem('dashboard_units_view_mode', viewMode);
    }, [viewMode]);

    // Export Modal State
    const [unitForExport, setUnitForExport] = useState<any | null>(null);

    // Track unit selected via map
    const [selectedUnitIdFromMap, setSelectedUnitIdFromMap] = useState<number | null>(null);

    // MO Extra: considera TODOS os avisos ativos (soma e identifica por aviso)
    // A contagem só considera o PERÍODO vigente do momento (data/hora atual
    // do app em São Paulo entre period_start e o fim efetivo do período).
    const { notices: activeNotices } = useAppNotices();
    const [noticeWorkersAll, setNoticeWorkersAll] = useState<any[]>([]);

    const loadAllNoticeWorkers = useCallback(async () => {
        if (!activeNotices || activeNotices.length === 0 || !selectedSystemId) {
            setNoticeWorkersAll([]);
            return;
        }

        try {
            const allWorkers: any[] = [];

            await Promise.all(
                activeNotices.map(async (notice: any) => {
                    const noticeId = notice.id;
                    if (!noticeId) return;

                    const noticeSystemParentIds = resolveNoticeSystemParentIds(notice.systemParentIds);
                    if (!noticeAppliesToUnitSystemParent(noticeSystemParentIds, selectedSystemId)) {
                        return;
                    }

                    const periods = await dataService.getNoticeWorkerPeriods(noticeId);
                    const windowEnd = notice.viewEndDate || notice.endDate;
                    const activePeriods = pickActivePeriodsAt(periods, new Date(), windowEnd);

                    if (activePeriods.length === 0) {
                        return;
                    }

                    const periodIds = activePeriods.map((p: any) => p.id);
                    const workersLists = await Promise.all(
                        periodIds.map((pid) => dataService.getNoticeWorkers(noticeId, undefined, pid))
                    );

                    const workers = workersLists.flat();
                    workers.forEach((w: any) => {
                        allWorkers.push({
                            ...w,
                            noticeId,
                            noticeSystemParentIds,
                            noticeTitle: notice.title,
                            noticeColor: notice.color || notice.categoryColor,
                            noticeCategoryLabel: notice.categoryLabel || notice.categoryName
                        });
                    });
                })
            );

            setNoticeWorkersAll(allWorkers);
        } catch (err) {
            console.error('Erro ao carregar MO Extra de todos os avisos:', err);
            setNoticeWorkersAll([]);
        }
    }, [activeNotices, selectedSystemId]);

    useEffect(() => {
        void loadAllNoticeWorkers();
    }, [loadAllNoticeWorkers]);

    // Agrupa workers por unitId: soma geral + breakdown por aviso + rateio por empresa
    const moExtraByUnit = useMemo(() => computeMoExtraByUnit(noticeWorkersAll, activeNotices), [noticeWorkersAll, activeNotices]);

    // Unidades do sistema exibido — o total de MO Extra do topo reflete apenas
    // as unidades visíveis (e já filtradas pelos sistemas dos avisos).
    const dashboardUnitIds = useMemo(
        () => new Set(allData.map(row => Number(row.unit_id)).filter(id => Number.isFinite(id))),
        [allData]
    );

    // Resumo de MO Extra (total + por empresa) das unidades do sistema exibido
    const moExtraSummary = useMemo(() => computeMoExtraSummary(noticeWorkersAll, dashboardUnitIds), [noticeWorkersAll, dashboardUnitIds]);

    // Active Asset Tag ID based on selectedSectorName
    const activeAssetTagId = useMemo(() => {
        const row = allData.find(r => (r.tag_description || 'Geral') === selectedSectorName);
        return row?.asset_tag_id;
    }, [allData, selectedSectorName]);

    // Drag-to-scroll for the sector cards strip
    const { ref: sectorsScrollRef, dragHandlers: sectorsDragHandlers } = useDragToScroll<HTMLDivElement>();



    useEffect(() => {
        if (!scopeReady) return;
        loadSystems();
    }, [scopeReady]);

    useEffect(() => {
        if (selectedSystemId) {
            loadDashboardData(selectedSystemId);
            localStorage.setItem('siges_dashboard_system_id', selectedSystemId);

            // Supabase Realtime Subscription: Update on changes to the base table
            const channel = supabase
                .channel(`realtime_dashboard_${selectedSystemId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'cfg_units_assets_tags'
                    },
                    () => {
                        loadDashboardData(selectedSystemId, true);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedSystemId]);

    // Tipos de unidade (descrições para o filtro TIPO DE UNIDADE)
    useEffect(() => {
        let cancelled = false;
        dataService.getUnitTypes().then(data => {
            if (!cancelled) setUnitTypes(data);
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('siges_dashboard_unit_type_ids', JSON.stringify(selectedUnitTypeIds));
        } catch { /* storage indisponível */ }
    }, [selectedUnitTypeIds]);

    useEffect(() => {
        localStorage.setItem('siges_dashboard_sort_mode', sortMode);
    }, [sortMode]);

    useEffect(() => {
        if (selectedSectorName) {
            localStorage.setItem('siges_dashboard_sector_name', selectedSectorName);
        }
    }, [selectedSectorName]);

    const loadSystems = async () => {
        const data = await dataService.getSystemsParent(systemsScope);
        setSystems(data);

        // If we have a persisted ID but it's not in the list, or if we don't have one, default to first
        if (data.length > 0) {
            const exists = data.find(s => s.id === selectedSystemId);
            if (!selectedSystemId || !exists) {
                setSelectedSystemId(data[0].id);
            }
        } else if (selectedSystemId) {
            // Sistema persistido fora do escopo do usuário: limpa a seleção para
            // não carregar dados de um sistema que não está nas opções.
            setSelectedSystemId('');
        }
    };

    const loadDashboardData = async (systemId: string, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [data, sectorsAgg] = await Promise.all([
                dataService.getUnitsAssetsTagsDashboard(systemId),
                dataService.getSystemsParentAssetsTagsAvailableRate(systemId)
            ]);
            setAllData(data || []);
            setSectorsData(sectorsAgg || []);

            // Check if selected sector is valid for new data
            if (data && data.length > 0) {
                const firstSector = data[0].tag_description || 'Geral';
                setSelectedSectorName(prev => {
                    if (prev && data.some((d: any) => (d.tag_description || 'Geral') === prev)) return prev;
                    return firstSector;
                });
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            if (!silent) toast.error('Erro ao carregar dados do dashboard');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const assetModal = useAssetModal(currentUser, selectedSystemId, loadDashboardData);
    const { setSelectedAssetForModal } = assetModal;

    // Aggregate stats by tag_description (Top Cards)
    const sectorsStats = useMemo(() => computeSectorsStats(allData, sectorsData, selectedUnitTypeIds), [allData, sectorsData, selectedUnitTypeIds]);

    // Group units and their specific assets for the active sector name
    const unitsRows = useMemo(() => computeUnitsRows(allData, selectedSectorName, sortMode, debouncedSearchQuery), [allData, selectedSectorName, sortMode, debouncedSearchQuery]);

    // Unidade pisca junto quando algum setor dela mudou (lista e marcador no mapa).
    const highlightedUnitIds = useMemo(() => {
        const ids = new Set<string>();
        if (recentlyChangedIds.size === 0) return ids;
        for (const unit of unitsRows as any[]) {
            if (unit.assets?.some((a: any) => recentlyChangedIds.has(String(a.id)))) ids.add(String(unit.id));
        }
        return ids;
    }, [unitsRows, recentlyChangedIds]);

    const unitSearchSuggestions = useMemo(
        () => unitsRows.slice(0, 6),
        [unitsRows]
    );

    const selectSearchSuggestion = (description: string) => {
        setSearchQuery(description);
        setIsSearchSuggestionsOpen(false);
        setActiveSearchSuggestion(-1);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            setIsSearchSuggestionsOpen(false);
            setActiveSearchSuggestion(-1);
            return;
        }

        if (event.key === 'ArrowDown' && unitSearchSuggestions.length > 0) {
            event.preventDefault();
            setIsSearchSuggestionsOpen(true);
            setActiveSearchSuggestion(index => index < 0 ? 0 : (index + 1) % unitSearchSuggestions.length);
            return;
        }

        if (event.key === 'ArrowUp' && unitSearchSuggestions.length > 0) {
            event.preventDefault();
            setIsSearchSuggestionsOpen(true);
            setActiveSearchSuggestion(index => index <= 0 ? unitSearchSuggestions.length - 1 : index - 1);
            return;
        }

        if (event.key === 'Enter' && isSearchSuggestionsOpen && activeSearchSuggestion >= 0) {
            event.preventDefault();
            const selectedSuggestion = unitSearchSuggestions[activeSearchSuggestion];
            if (selectedSuggestion) selectSearchSuggestion(selectedSuggestion.description);
        }
    };

    const systemSummary = useMemo(() => {
        if (allData.length === 0) return null;
        // Aggregate for the selected sector at the system level
        return sectorsStats.find(s => s.name === selectedSectorName) || sectorsStats[0];
    }, [allData, selectedSectorName, sectorsStats]);

    const sectorPercentage = useMemo(() => computeSectorPercentage(systemSummary), [systemSummary]);

    const systemOptions = useMemo(() =>
        systems.map(s => ({ value: s.id, label: s.description })),
        [systems]);

    // Tipos presentes nas unidades carregadas (units.unit_type_parent_id),
    // com descrição de cfg_units_types quando disponível.
    const unitTypeOptions = useMemo(() => {
        const names = new Map(unitTypes.map(t => [t.id, t.description]));
        const ids = new Set<string>();
        rawData.forEach(row => {
            const id = row.units?.unit_type_parent_id;
            if (id != null) ids.add(String(id));
        });
        const opts = Array.from(ids)
            .map(id => ({ value: id, label: names.get(id) || `Tipo ${id}` }))
            .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
        return opts;
    }, [unitTypes, rawData]);

    // Seleção persistida que não existe mais nas opções é descartada
    useEffect(() => {
        if (selectedUnitTypeIds.length === 0 || rawData.length === 0) return;
        const valid = selectedUnitTypeIds.filter(id => unitTypeOptions.some(o => o.value === id));
        if (valid.length !== selectedUnitTypeIds.length) setSelectedUnitTypeIds(valid);
    }, [unitTypeOptions, selectedUnitTypeIds, rawData.length]);

    // Rótulos exibidos nos chips de filtro (padrão FilterSelect)
    const selectedSystemLabel = systemOptions.find(o => o.value === selectedSystemId)?.label || '';
    const unitTypeFilterValue: string | string[] = selectedUnitTypeIds.length === 1
        ? (unitTypeOptions.find(o => o.value === selectedUnitTypeIds[0])?.label || selectedUnitTypeIds)
        : selectedUnitTypeIds;

    const handleSystemSelect = (newId: string) => {
        setFilterModal(null);
        if (!newId || newId === selectedSystemId) return;
        setSelectedSystemId(newId);
        setSelectedUnitTypeIds([]);
    };


    return (
        <div className="flex flex-col flex-1 h-full w-full overflow-y-auto no-scrollbar bg-background-light dark:bg-background-dark">
            {isFullscreenMapMode ? (
                <div className="fixed inset-0 bg-background-light dark:bg-background-dark z-8000 screen-safe">
                    <UnitsAvailabilityMap
highlightedUnitIds={highlightedUnitIds}
                        units={unitsRows.filter((u: any) => u.assets.some((a: any) => a.isActive))}
                        unitTagDescription={selectedSectorName}
                        unitTagPercentage={sectorPercentage}
                        onUnitClick={(id) => {
                            setSelectedUnitIdFromMap(id);
                            if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                        }}
                        className="w-full h-full rounded-none!"
                    />

                    {selectedUnitIdFromMap && (
                        <div className="absolute bottom-[calc(var(--bottom-nav-h,calc(4.5rem+env(safe-area-inset-bottom,0px)))+1rem)] md:bottom-6 left-6 right-6 z-8001 animate-in slide-in-from-bottom-4 fade-in duration-300">
                            {(() => {
                                const unit = unitsRows.find(u => Number(u.id) === selectedUnitIdFromMap);
                                if (!unit) return null;
                                return (
                                    <Card className="p-4 rounded-[28px]! bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] w-fit min-w-[320px] max-w-full transition-all mx-auto">
                                        <div className="flex items-center justify-between mb-4 px-1 gap-8">
                                            <div className="flex items-center gap-4">
                                                <CircularGauge 
                                                    percentage={unit.percentage} 
                                                    size={56}
                                                    strokeWidth={4.5}
                                                    color={unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-400' : 'text-rose-500'}
                                                    labelSize="text-[12px]"
                                                />
                                                <div>
                                                    <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{unit.description}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={`h-2 w-2 rounded-full ${unit.percentage >= 85 ? 'bg-emerald-500' : unit.percentage > 50 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                                                        <p className="text-[11px] font-black text-primary uppercase tracking-tight">Disponibilidade: {unit.percentage}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IconButton
                                                    icon="download"
                                                    size="md"
                                                    onClick={() => setUnitForExport(unit)}
                                                    className="bg-slate-100/80 dark:bg-slate-700/80 text-primary hover:bg-slate-200 transition-colors"
                                                    title="Exportar"
                                                />
                                                <IconButton ariaLabel="Fechar detalhes da unidade"
                                                    icon="close"
                                                    size="md"
                                                    onClick={() => setSelectedUnitIdFromMap(null)}
                                                    className="bg-slate-100/80 dark:bg-slate-700/80 hover:bg-slate-200 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <AssetScrollRow
                                            assets={unit.assets}
                                            onAssetClick={setSelectedAssetForModal}
highlightedIds={recentlyChangedIds}
                                        />
                                    </Card>
                                );
                            })()}
                        </div>
                    )}

                    {/* Exit Button for Fullscreen */}
                    <button
                        onClick={() => window.close()}
                        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-8005 h-10 w-10 sm:h-12 sm:w-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-primary pointer-events-auto"
                        title="Fechar Mapa"
                    >
                        <span className="material-symbols-outlined text-[24px] sm:text-[28px]">close</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col px-4 sm:px-6 py-3 sm:py-4">
                    {/* Header */}
                    <header className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5">
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <FilterSelect
                                label="SISTEMA"
                                value={selectedSystemLabel}
                                onClick={() => setFilterModal('system')}
                                required
                            />
                            <FilterSelect
                                label="TIPO UNIDADE"
                                value={unitTypeFilterValue}
                                onClick={() => setFilterModal('unitType')}
                                onClear={() => setSelectedUnitTypeIds([])}
                                hidden={unitTypeOptions.length === 0}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[240px]">
                                <SearchInput
                                    placeholder="Buscar unidade..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setActiveSearchSuggestion(-1);
                                        setIsSearchSuggestionsOpen(true);
                                    }}
                                    onFocus={() => setIsSearchSuggestionsOpen(true)}
                                    onBlur={() => setIsSearchSuggestionsOpen(false)}
                                    onKeyDown={handleSearchKeyDown}
                                    onClear={() => {
                                        setSearchQuery('');
                                        setIsSearchSuggestionsOpen(false);
                                        setActiveSearchSuggestion(-1);
                                    }}
                                    role="combobox"
                                    aria-autocomplete="list"
                                    aria-controls="unit-search-suggestions"
                                    aria-expanded={isSearchSuggestionsOpen && searchQuery === debouncedSearchQuery && unitSearchSuggestions.length > 0}
                                    aria-activedescendant={activeSearchSuggestion >= 0 ? `unit-search-suggestion-${activeSearchSuggestion}` : undefined}
                                    className="shadow-sm border-none bg-slate-100 dark:bg-slate-800 h-11! w-full"
                                />
                                {isSearchSuggestionsOpen &&
                                    searchQuery.trim() &&
                                    searchQuery === debouncedSearchQuery &&
                                    unitSearchSuggestions.length > 0 && (
                                        <ul
                                            id="unit-search-suggestions"
                                            role="listbox"
                                            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            {unitSearchSuggestions.map((unit, index) => (
                                                <li
                                                    key={unit.id}
                                                    id={`unit-search-suggestion-${index}`}
                                                    role="option"
                                                    aria-selected={activeSearchSuggestion === index}
                                                >
                                                    <button
                                                        type="button"
                                                        onMouseDown={event => event.preventDefault()}
                                                        onMouseEnter={() => setActiveSearchSuggestion(index)}
                                                        onClick={() => selectSearchSuggestion(unit.description)}
                                                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                                                            activeSearchSuggestion === index
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        <span className="truncate font-semibold">{unit.description}</span>
                                                        <span className="shrink-0 text-xs text-slate-400">{unit.percentage}%</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                            </div>


                            <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-full border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm w-full sm:w-auto">
                                <button
                                    onClick={() => setSortMode('disponibilidade')}
                                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${sortMode === 'disponibilidade' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    Disponibilidade
                                </button>
                                <button
                                    onClick={() => setSortMode('alfabetica')}
                                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${sortMode === 'alfabetica' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    Alfabética
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Top Cards: Disponibilidades por Setores */}
                    <section className="shrink-0 overflow-hidden px-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-[14px] px-1">
                            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                <h3 className="text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">Disponibilidade por Setores</h3>

                                {/* View Mode Switcher */}
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-slate-200/50 dark:bg-white/5 p-0.5 rounded-full border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm scale-90 origin-left">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-all uppercase tracking-wider flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualizar em lista"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">view_list</span>
                                            <span className="hidden sm:inline">Lista</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('map')}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-all uppercase tracking-wider flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualizar no mapa"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">map</span>
                                            <span className="hidden sm:inline">Mapa</span>
                                        </button>
                                    </div>


                                </div>
                            </div>

                            {/* Latest Activity Line */}
                            {systemSummary?.lastReportedAt && (
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-1 w-full sm:w-auto">
                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Última Atividade:</span>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{systemSummary.latestUnit}</p>
                                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                                        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-tight">{systemSummary.latestSubTag}</p>
                                    </div>

                                    {systemSummary.latestAvatar && (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm" title={systemSummary.latestUser}>
                                            <OptimizedImage
                                                src={systemSummary.latestAvatar}
                                                alt={systemSummary.latestUser}
                                                preset="thumbnail"
                                                className="w-full h-full object-cover"
                                                useSrcSet={false}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-primary/60">schedule</span>
                                        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-tighter">
                                            {formatDashboardRelativeTime(systemSummary.lastReportedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            ref={sectorsScrollRef}
                            {...sectorsDragHandlers}
                            className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1.5 px-1.5 cursor-grab active:cursor-grabbing"
                        >
                            {/* Sector Cards only */}
                            {loading ? (
                                <div className="flex gap-2 sm:gap-3 overflow-hidden py-1.5 px-1.5" role="status" aria-label="Carregando setores">
                                    {[0, 1, 2, 3].map(sector => (
                                        <div
                                            key={sector}
                                            className="flex h-[60px] min-w-[150px] shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3 dark:border-white/5 dark:bg-slate-800/40 sm:h-[70px] sm:min-w-[176px] sm:px-4"
                                        >
                                            <div className="flex-1 space-y-2">
                                                <Skeleton variant="text" width="82%" />
                                                <Skeleton variant="text" width="58%" />
                                            </div>
                                            <Skeleton variant="circular" width={36} height={36} />
                                        </div>
                                    ))}
                                </div>
                            ) : sectorsStats.map((sector) => (
                                <Card
                                    key={sector.name}
                                    onClick={() => setSelectedSectorName(sector.name)}
                                    className={`shrink-0 min-w-[150px] sm:min-w-[176px] w-fit p-2.5 sm:p-3 px-3 sm:px-4 rounded-[16px]! sm:rounded-[20px]! cursor-pointer transition-all flex items-center justify-between gap-2 sm:gap-4 h-[60px]! sm:h-[70px]! ${selectedSectorName === sector.name
                                            ? 'ring-2 ring-primary border-transparent shadow-xl shadow-primary/10'
                                            : 'hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="text-left min-w-0 pr-1 sm:pr-2">
                                        <p className={`text-[10px] sm:text-[11px] font-black uppercase whitespace-nowrap leading-tight tracking-tight ${selectedSectorName === sector.name ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {sector.name}
                                        </p>
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5 sm:mt-1 truncate">
                                            {sector.flow.visible ? sector.flow.unit : sector.power.visible ? sector.power.unit : sector.pressure.visible ? sector.pressure.unit : sector.general.unit}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        {sector.flow.visible && (
                                            <CircularGauge
                                                percentage={sector.flow.percentage}
                                                size={36}
                                                strokeWidth={3.5}
                                                color={sector.flow.percentage >= 85 ? 'text-emerald-500' : sector.flow.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        )}
                                        {sector.power.visible && (
                                            <CircularGauge
                                                percentage={sector.power.percentage}
                                                size={36}
                                                strokeWidth={3.5}
                                                color={sector.power.percentage >= 85 ? 'text-emerald-500' : sector.power.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        )}
                                        {sector.pressure.visible && (
                                            <CircularGauge
                                                percentage={sector.pressure.percentage}
                                                size={36}
                                                strokeWidth={3.5}
                                                color={sector.pressure.percentage >= 85 ? 'text-emerald-500' : sector.pressure.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        )}
                                        {sector.general.visible && (
                                            <CircularGauge
                                                percentage={sector.general.percentage}
                                                size={36}
                                                strokeWidth={3.5}
                                                color={sector.general.percentage >= 85 ? 'text-emerald-500' : sector.general.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* MO Extra summary bar */}
                    {moExtraSummary.total > 0 && (
                        <div className="px-3 sm:px-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                                {/* Total pill */}
                                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 text-black shadow-sm">
                                    <span className="material-symbols-outlined text-[14px]">engineering</span>
                                    <span className="text-[11px] font-black whitespace-nowrap">{moExtraSummary.total} MO Extra</span>
                                </div>
                                {/* Divider */}
                                <div className="shrink-0 w-px h-5 bg-slate-200 dark:bg-slate-700" />
                                {/* Per-company: só avatar + quantidade */}
                                {moExtraSummary.companies.map((c, i) => (
                                    <div key={i} className="shrink-0 flex items-center gap-1.5" title={c.name ?? 'Empresa'}>
                                        {c.logoUrl ? (
                                            <img
                                                src={c.logoUrl}
                                                alt={c.name ?? ''}
                                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase leading-none">
                                                    {(c.name ?? '?')[0]}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">{c.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <main className="pb-6 sm:pb-10">
                        {loading ? (
                            <div className="flex flex-col gap-2 sm:gap-3" role="status" aria-label="Carregando unidades">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-2 md:gap-3">
                                        <div className="flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:w-[256px] md:shrink-0">
                                            <Skeleton variant="circular" width={36} height={36} />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton variant="text" width="78%" />
                                                <Skeleton variant="text" width="52%" />
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                                            {[0, 1, 2, 3, 4].map(asset => (
                                                <div key={asset} className="flex h-[58px] min-w-[100px] flex-col items-center justify-between rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40 sm:min-w-[120px]">
                                                    <Skeleton variant="text" width="75%" />
                                                    <Skeleton variant="circular" width={20} height={20} />
                                                    <Skeleton variant="text" width="40%" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 sm:gap-2">
                                {viewMode === 'list' ? (
                                    <div className="flex flex-col gap-1 sm:gap-2">
                                        {unitsRows.map(unit => {
                                            const isExpanded = expandedUnitId === unit.id;

                                            return (
                                                <div key={unit.id} className="flex flex-col md:flex-row gap-1.5 sm:gap-2 md:gap-3 items-stretch md:items-center">
                                                    {/* Unit Info Card */}
                                                    <Card
                                                        onClick={() => {
                                                            if (window.innerWidth < 768) {
                                                                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                                                setExpandedUnitId(isExpanded ? null : unit.id);
                                                            }
                                                        }}
                                                        className={`shrink-0 w-full md:w-[340px] p-2.5 sm:p-3 rounded-[16px]! sm:rounded-[20px]! min-h-[76px] sm:min-h-[88px] h-auto flex flex-col justify-center relative group overflow-hidden border-slate-200 dark:border-slate-800 transition-all ${isExpanded ? 'ring-2 ring-primary border-transparent' : 'cursor-pointer md:cursor-default active:scale-[0.99] md:active:scale-100'
                                                            } ${highlightedUnitIds.has(String(unit.id)) ? 'animate-card-updated-unit' : ''}`}
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${unit.percentage >= 85 ? 'bg-emerald-500' : unit.percentage > 50 ? 'bg-amber-400' : 'bg-rose-500'} group-hover:w-1.5 transition-all`}></div>

                                                        {/* Linha Principal: Ícone do percentual + Coluna (Descrição + Tempo) + Ícone de exportação */}
                                                        <div className="flex items-center justify-between gap-2 w-full min-w-0">
                                                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                                                <CircularGauge
                                                                    percentage={unit.percentage}
                                                                    size={36}
                                                                    strokeWidth={3.5}
                                                                    color={unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-400' : 'text-rose-500'}
                                                                />
                                                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                    <h3 className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-white uppercase leading-tight wrap-break-word">{unit.description}</h3>
                                                                    {unit.lastReportedAt ? (
                                                                        <p className="text-[8px] sm:text-[9px] font-black text-primary mt-0.5 uppercase tracking-tight">
                                                                            {formatDashboardRelativeTime(unit.lastReportedAt)}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Sem registros</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setUnitForExport(unit);
                                                                    }}
                                                                    className="h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-primary/30 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hidden! md:flex!"
                                                                    title="Exportar"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
                                                                </button>

                                                                <span className={`material-symbols-outlined text-slate-400 transition-transform md:hidden! text-[20px] sm:text-[24px] ${isExpanded ? 'rotate-180 text-primary' : ''}`}>
                                                                    expand_more
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* MO Extra badge */}
                                                        {(() => {
                                                            const mo = moExtraByUnit.get(Number(unit.id));
                                                            if (!mo || mo.total <= 0) return null;
                                                            const hasMultipleNotices = mo.notices.length > 1;

                                                            const tooltipLines = mo.notices.map((n) => {
                                                                const companiesTxt = n.companies.length > 0
                                                                    ? n.companies.map(c => `${c.name || 'Empresa'}: ${c.amount}`).join(' • ')
                                                                    : '';
                                                                return `• ${n.title || 'Aviso'}: ${n.total}${companiesTxt ? ` (${companiesTxt})` : ''}`;
                                                            });
                                                            const tooltipContent = tooltipLines.join('\n');

                                                            return (
                                                                <div
                                                                    className="flex items-center gap-1.5 mt-1.5 pl-[44px] sm:pl-[46px]"
                                                                    title={hasMultipleNotices ? tooltipContent : `${mo.total} MO Extra`}
                                                                >
                                                                    <span className="material-symbols-outlined text-[13px] text-amber-500">engineering</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                                                            MO Extra: {mo.total}
                                                                        </span>
                                                                        {hasMultipleNotices && (
                                                                            <span className="text-[8px] font-black text-amber-500/80 dark:text-amber-400/70 uppercase tracking-tight">
                                                                                (+{mo.notices.length} avisos)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center -space-x-2.5">
                                                                        {mo.companies.map((c, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className="relative shrink-0"
                                                                                title={hasMultipleNotices ? tooltipContent : `${c.name ?? 'Empresa'}: ${c.amount}`}
                                                                            >
                                                                                {c.logoUrl ? (
                                                                                    <img
                                                                                        src={c.logoUrl}
                                                                                        alt={c.name ?? ''}
                                                                                        className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover bg-slate-100 dark:bg-slate-800"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                                                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase leading-none">
                                                                                            {(c.name ?? '?')[0]}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-amber-500 text-black border-[1.5px] border-white dark:border-slate-900 flex items-center justify-center">
                                                                                    <span className="text-[8px] font-black leading-none">{c.amount}</span>
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </Card>

                                                    {/* Assets Grid - Fixed on Desktop, Collapsible on Mobile */}
                                                    <div className={`${isExpanded ? 'flex animate-in slide-in-from-top-1 fade-in duration-300 mb-2' : 'hidden md:flex'} flex-1 w-full overflow-hidden`}>
                                                        <AssetScrollRow
                                                            assets={unit.assets}
                                                            onAssetClick={setSelectedAssetForModal}
highlightedIds={recentlyChangedIds}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="relative w-full h-[600px] lg:h-[calc(100vh-380px)] min-h-[500px]">
                                        <UnitsAvailabilityMap
highlightedUnitIds={highlightedUnitIds}
                                            units={unitsRows.filter((u: any) => u.assets.some((a: any) => a.isActive))}
                                            unitTagDescription={selectedSectorName}
                                            unitTagPercentage={sectorPercentage}
                                            onUnitClick={(id) => {
                                                setSelectedUnitIdFromMap(id);
                                                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                            }}
                                            className="w-full h-full"
                                        />

                                        <button
                                            onClick={() => {
                                                const url = new URL(window.location.href);
                                                url.searchParams.set('fullscreenMap', 'true');
                                                window.open(url.toString(), '_blank');
                                            }}
                                            className="absolute top-4 right-4 z-4000 h-12 w-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-primary pointer-events-auto"
                                            title="Abrir Mapa em Tela Cheia"
                                        >
                                            <span className="material-symbols-outlined text-[28px]">open_in_full</span>
                                        </button>

                                        {selectedUnitIdFromMap && (
                                            <div className="absolute bottom-[calc(var(--bottom-nav-h,calc(4.5rem+env(safe-area-inset-bottom,0px)))+1rem)] md:bottom-4 left-4 right-4 z-3000 animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto">
                                                {(() => {
                                                    const unit = unitsRows.find(u => Number(u.id) === selectedUnitIdFromMap);
                                                    if (!unit) return null;
                                                    return (
                                                        <Card className="p-4 rounded-[28px]! bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                                            <div className="flex items-center justify-between mb-3 px-1">
                                                                <div className="flex items-center gap-3">
                                                                    <CircularGauge 
                                                                        percentage={unit.percentage} 
                                                                        size={48}
                                                                        strokeWidth={4}
                                                                        color={unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-400' : 'text-rose-500'}
                                                                        labelSize="text-[10px]"
                                                                    />
                                                                    <div>
                                                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{unit.description}</h4>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <div className={`h-1.5 w-1.5 rounded-full ${unit.percentage >= 85 ? 'bg-emerald-500' : unit.percentage > 50 ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                                                                            <p className="text-[10px] font-black text-primary uppercase tracking-tight">Disponibilidade: {unit.percentage}%</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <IconButton
                                                                        icon="download"
                                                                        size="sm"
                                                                        onClick={() => setUnitForExport(unit)}
                                                                        className="bg-slate-100/50 dark:bg-slate-700/50 text-primary hover:bg-slate-200 transition-colors"
                                                                        title="Exportar"
                                                                    />
                                                                    <IconButton ariaLabel="Fechar detalhes da unidade"
                                                                        icon="close"
                                                                        size="sm"
                                                                        onClick={() => setSelectedUnitIdFromMap(null)}
                                                                        className="bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <AssetScrollRow
                                                                assets={unit.assets}
                                                                onAssetClick={setSelectedAssetForModal}
highlightedIds={recentlyChangedIds}
                                                            />
                                                        </Card>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            )}

            <AssetDetailModal modal={assetModal} loading={loading} lightboxImage={lightboxImage} setLightboxImage={setLightboxImage} />

            {/* Availability Export Modal */}
            {unitForExport && (
                <AvailabilityExportModal
                    isOpen={!!unitForExport}
                    onClose={() => setUnitForExport(null)}
                    unitId={unitForExport.id}
                    unitDescription={unitForExport.description}
                    assetTagId={activeAssetTagId?.toString()}
                    assetTagDescription={selectedSectorName}
                    availableSubTags={Array.from(
                        new Map(
                            allData
                                .filter((r: any) =>
                                    r.unit_id.toString() === unitForExport.id &&
                                    (activeAssetTagId ? r.asset_tag_id === activeAssetTagId : true)
                                )
                                .map((r: any) => [
                                    r.asset_tag_sub_id?.toString() || 'null',
                                    { id: r.asset_tag_sub_id?.toString() || 'null', description: r.tag_sub_description || 'Geral' }
                                ])
                        ).values()
                    ).sort((a: any, b: any) => a.description.localeCompare(b.description))}
                />
            )}
            {/* Modal de seleção: SISTEMA (escolha única — o dashboard carrega um sistema por vez) */}
            <Modal
                isOpen={filterModal === 'system'}
                onClose={() => setFilterModal(null)}
                title="Filtrar por SISTEMA"
                maxWidth="md"
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1 text-slate-800 dark:text-gray-100">
                    {systemOptions.map(opt => {
                        const isSelected = opt.value === selectedSystemId;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSystemSelect(opt.value)}
                                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Modal de seleção: TIPO UNIDADE (múltipla) */}
            <Modal
                isOpen={filterModal === 'unitType'}
                onClose={() => setFilterModal(null)}
                title="Filtrar por TIPO UNIDADE"
                maxWidth="md"
            >
                {filterModal === 'unitType' && (
                    <FilterSelectionContent
                        label="TIPO UNIDADE"
                        options={unitTypeOptions}
                        initialValue={selectedUnitTypeIds}
                        onConfirm={(values) => {
                            setSelectedUnitTypeIds(values);
                            setFilterModal(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};
