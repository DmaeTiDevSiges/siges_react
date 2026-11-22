import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { formatDateInBrazil } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { OrderVisit, User, OrderFilters, OrderVisitTeam } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { AssetMovementListItem } from '../../components/assets/AssetMovementListItem';
import DashboardOrdersVisitsAdminListItem from '../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem';
import { toast } from 'sonner';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency } from '../../utils/formatters';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { VisitsListPDFButton } from '../../components/reports/VisitsListPDFButton';
import { VisitsListExcelButton } from '../../components/reports/VisitsListExcelButton';
import { FilterBarResponsive, FilterBarResponsiveHandle } from '../../components/ui/FilterBarResponsive';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { AssetMovementsDocument } from '../../components/reports/AssetMovementsDocument';
import { pdf } from '@react-pdf/renderer';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { PDFButton } from '../../components/ui/PDFButton';
import { useMovedAssetsExport } from '../../hooks/useMovedAssetsExport';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { useClientScope } from '../../hooks/useClientScope';
import { systemsScopeOption } from '../../utils/clientScope';
import { computeFinancialTotals, computeVisitsInsights, computeVisitsSummary, EMPTY_VISITS_SUMMARY, matchesProcessingSelection, toProcessingSelection, VisitsDashboardSummary } from '../../utils/visitsDashboardSummary';
import { OrderVisitExtended } from '../../components/dashboards/ordersVisitsAdmin/visitTypes';
import { VisitsDashboardSkeleton } from '../../components/dashboards/ordersVisitsAdmin/VisitsDashboardSkeleton';
import { mapVisitRow } from '../../components/dashboards/ordersVisitsAdmin/mapVisitRow';
import { StatCard } from '../../components/dashboards/ordersVisitsAdmin/StatCard';
import { AppropriationSection } from '../../components/dashboards/ordersVisitsAdmin/AppropriationSection';
import { InsightsDoughnut, InsightsBar, InsightsTrend, InsightsMovementsBar } from '../../components/dashboards/ordersVisitsAdmin/InsightsCharts';


interface OrdersVisitsDashboardAdminProps {
    currentUser: User;
    onSelectVisit: (visit: OrderVisit) => void;
    currentFilters?: OrderFilters;
    onFiltersChange?: (filters: OrderFilters) => void;
    appliedFilters?: OrderFilters;
    onAppliedFiltersChange?: (filters: OrderFilters) => void;
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    filterBarRef?: React.RefObject<FilterBarResponsiveHandle>;
    onActiveFiltersChange?: (count: number) => void;
}

const PROVIDER_HIDDEN_VISIT_FILTERS = [
    'systemParentId',
    'systemId',
    'unitTypeParentId',
    'unitTypeId',
    'orderObjectId',
    'causeReasonId',
    'orderPlanId',
];

const clearProviderVisitFilters = (filters: OrderFilters): OrderFilters => ({
    ...filters,
    systemParentId: [],
    systemId: [],
    unitTypeParentId: [],
    unitTypeId: [],
    orderObjectId: [],
    causeReasonId: [],
    orderPlanId: [],
});









export const OrdersVisitsDashboardAdmin: React.FC<OrdersVisitsDashboardAdminProps> = ({ 
    currentUser, 
    onSelectVisit, 
    currentFilters, 
    onFiltersChange,
    appliedFilters: appliedFiltersProp,
    onAppliedFiltersChange,
    searchQuery: searchQueryProp,
    onSearchQueryChange,
    filterBarRef,
    onActiveFiltersChange
}) => {
    const companyId = Number(currentUser.companyId);
    const isProviderMode = currentUser.companyId != null
        && Number.isFinite(companyId)
        && companyId !== 1;
    const hiddenVisitFilters = isProviderMode
        ? ['orderTeamId', ...PROVIDER_HIDDEN_VISIT_FILTERS]
        : ['orderTeamId'];

    const [advancedFilters, setAdvancedFilters] = useState<OrderFilters>(() => {
        if (currentFilters) return isProviderMode ? clearProviderVisitFilters(currentFilters) : currentFilters;
        try {
            const saved = localStorage.getItem('advancedOrdersFilters');
            const filters = saved ? JSON.parse(saved) : {};
            return isProviderMode ? clearProviderVisitFilters(filters) : filters;
        } catch (e) { return {}; }
    });

    const [searchQuery, setSearchQuery] = useState(() => {
        if (searchQueryProp !== undefined) return searchQueryProp;
        return '';
    });

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    useEffect(() => {
        if (searchQueryProp !== undefined) {
            setSearchQuery(searchQueryProp);
        }
    }, [searchQueryProp]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        if (onSearchQueryChange) {
            onSearchQueryChange(debouncedSearchQuery);
        }
    }, [debouncedSearchQuery, onSearchQueryChange]);

    const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(() => {
        if (appliedFiltersProp) return isProviderMode ? clearProviderVisitFilters(appliedFiltersProp) : appliedFiltersProp;
        try {
            const saved = localStorage.getItem('appliedOrdersFilters');
            const filters = saved ? JSON.parse(saved) : {};
            return isProviderMode ? clearProviderVisitFilters(filters) : filters;
        } catch (e) { return {}; }
    });

    useEffect(() => {
        if (currentFilters) {
            const nextFilters = isProviderMode ? clearProviderVisitFilters(currentFilters) : currentFilters;
            setAdvancedFilters(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(nextFilters)) {
                    return nextFilters;
                }
                return prev;
            });
        }
    }, [currentFilters, isProviderMode]);

    useEffect(() => {
        if (appliedFiltersProp) {
            const nextFilters = isProviderMode ? clearProviderVisitFilters(appliedFiltersProp) : appliedFiltersProp;
            setAppliedFilters(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(nextFilters)) {
                    return nextFilters;
                }
                return prev;
            });
        }
    }, [appliedFiltersProp, isProviderMode]);

    useEffect(() => {
        if (onFiltersChange && currentFilters) {
            if (JSON.stringify(advancedFilters) !== JSON.stringify(currentFilters)) {
                onFiltersChange(advancedFilters);
            }
        }
        localStorage.setItem('advancedOrdersFilters', JSON.stringify(advancedFilters));
    }, [advancedFilters, onFiltersChange]);

    useEffect(() => {
        if (onAppliedFiltersChange && appliedFiltersProp) {
            if (JSON.stringify(appliedFilters) !== JSON.stringify(appliedFiltersProp)) {
                onAppliedFiltersChange(appliedFilters);
            }
        }
        localStorage.setItem('appliedOrdersFilters', JSON.stringify(appliedFilters));
    }, [appliedFilters, onAppliedFiltersChange]);
    // Página(s) carregadas da lista (paginação no servidor) e resumo do RPC.
    const [visits, setVisits] = useState<OrderVisitExtended[]>([]);
    const [summary, setSummary] = useState<VisitsDashboardSummary>(EMPTY_VISITS_SUMMARY);
    // Fallback (RPC ainda não aplicado): todas as visitas da seleção, ordenadas.
    const fallbackRowsRef = useRef<OrderVisitExtended[] | null>(null);

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const currentMonthRange = useMemo(() => {
        const d = new Date();
        const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        return {
            start: `${firstDayOfMonth.getFullYear()}-${pad(firstDayOfMonth.getMonth() + 1)}-${pad(firstDayOfMonth.getDate())}`,
            end: `${lastDayOfMonth.getFullYear()}-${pad(lastDayOfMonth.getMonth() + 1)}-${pad(lastDayOfMonth.getDate())}`
        };
    }, []);

    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const savedStart = localStorage.getItem('visits_dashboard_date_start_v2');
        const savedEnd = localStorage.getItem('visits_dashboard_date_end_v2');
        if (savedStart && savedEnd) {
            return { start: savedStart, end: savedEnd };
        }
        return currentMonthRange;
    });

    useEffect(() => {
        localStorage.setItem('visits_dashboard_date_start_v2', dateRange.start);
        localStorage.setItem('visits_dashboard_date_end_v2', dateRange.end);
    }, [dateRange]);

    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempDateRange, setTempDateRange] = useState<{ start: string; end: string }>(dateRange);

    const [isAllUnitsModalOpen, setIsAllUnitsModalOpen] = useState(false);
    const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
    const [visitFilterCount, setVisitFilterCount] = useState(0);

    useEffect(() => {
        if (isDateModalOpen) {
            setTempDateRange(dateRange);
        }
    }, [isDateModalOpen, dateRange]);

    const [processingStages, setProcessingStages] = useState<{ id: number, description: string, icon: string, icon_color: string, bg_color: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const initialLoadDone = React.useRef(false);
    const fetchIdRef = useRef(0);
    const [activeOrderVisitProcessingIdSelected, setActiveOrderVisitProcessingIdSelected] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('visits_dashboard_processing_id');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { /* fallback */ }
        return ['all'];
    });

    const allStageIds = React.useMemo(() => {
        return ['all', ...processingStages.map(s => String(s.id)), 'costs-rejected', 'costs-pending'];
    }, [processingStages]);

    const toggleProcessingSelection = (value: string) => {
        setActiveOrderVisitProcessingIdSelected(prev => {
            if (value === 'all') {
                const allSelected = prev.includes('all') || prev.length === allStageIds.length;
                return allSelected ? [] : [...allStageIds];
            }
            const isSelected = prev.includes(value);
            let next = isSelected ? prev.filter(v => v !== value) : [...prev, value];
            const specificIds = allStageIds.filter(id => id !== 'all');
            if (next.length === 0) {
                next = ['all'];
            } else if (specificIds.every(id => next.includes(id))) {
                next = ['all'];
            } else if (next.includes('all')) {
                next = next.filter(v => v !== 'all');
            }
            return next;
        });
    };

    useEffect(() => {
        localStorage.setItem('visits_dashboard_processing_id', JSON.stringify(activeOrderVisitProcessingIdSelected));
    }, [activeOrderVisitProcessingIdSelected]);
    const [visitTeams, setVisitTeams] = useState<Record<string, OrderVisitTeam[]>>({});
    const [appropriationData, setAppropriationData] = useState<{
        services: any[];
        materials: any[];
        vehicles: any[];
        movedAssets: any[];
    }>({
        services: [],
        materials: [],
        vehicles: [],
        movedAssets: []
    });
    const { handleExportExcel, handleExportPDF, isExportingExcel, isExportingPDF } = useMovedAssetsExport(appropriationData.movedAssets);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        services: false,
        materials: false,
        vehicles: false
    });
    const [isFetchingAppropriation, setIsFetchingAppropriation] = useState(false);

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
        const saved = localStorage.getItem('visits_dashboard_sort_order');
        return (saved === 'asc' || saved === 'desc') ? saved : 'asc';
    });

    useEffect(() => {
        localStorage.setItem('visits_dashboard_sort_order', sortOrder);
    }, [sortOrder]);

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isLoadingMoreRef = useRef(false);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);
    const processingCardsScroll = useDraggableScroll();

    const [filterOptions, setFilterOptions] = useState({
        systems: [] as any[],
        subSystems: [] as any[],
        unitTypes: [] as any[],
        units: [] as any[],
        orderObjects: [] as any[],
        orderTypes: [] as any[],
        contracts: [] as any[],
        plans: [] as any[],
        teams: [] as any[],
        sectors: [] as any[],
        causeReasons: [] as any[]
    });
    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [assetTagSubOptions, setAssetTagSubOptions] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);

    // Escopo de cliente do filtro SISTEMA (Fase 1D): undefined = sem corte
    // (super admin); lista = clients_ids do departamento do usuário.
    const { clientIds, scopeReady } = useClientScope();
    const systemsScope = systemsScopeOption(clientIds);

    const loadFilterOptions = React.useCallback(async () => {
        // Só carrega depois que o escopo resolver — antes disso a lista vazia
        // seria interpretada como "sem acesso".
        if (!scopeReady) return;
        try {
            const results = await Promise.allSettled([
                dataService.getSystemsParent(systemsScope),
                dataService.getUnitTypesParent(),
                dataService.getOrdersObjects(),
                dataService.getOrderTypes(),
                dataService.getPlans(),
                dataService.getManagedContracts(currentUser.id.toString()),
                dataService.getTeams(undefined, currentUser?.departmentId),
                dataService.getAssetTags('active'),
                dataService.getCauseReasons()
            ]);

            const getVal = (res: any) => (res.status === 'fulfilled' ? res.value : []);

            const contracts = getVal(results[5]);

            setFilterOptions(prev => ({
                ...prev,
                systems: getVal(results[0]),
                unitTypes: getVal(results[1]),
                orderObjects: getVal(results[2]),
                orderTypes: getVal(results[3]),
                plans: getVal(results[4]),
                contracts,
                teams: getVal(results[6]),
                units: [],
                sectors: getVal(results[7]),
                causeReasons: getVal(results[8])
            }));

            setAssetTagSubOptions(await dataService.getAssetTagSubs(undefined, 'active'));

            if (contracts.length > 0) {
                const defaultContractIds = contracts.map((c: any) => String(c.id));
                setAdvancedFilters(prev => {
                    const hasContracts = Array.isArray(prev.contractId) && prev.contractId.length > 0;
                    if (!hasContracts) return { ...prev, contractId: defaultContractIds };
                    return prev;
                });
                setAppliedFilters(prev => {
                    const hasContracts = Array.isArray(prev.contractId) && prev.contractId.length > 0;
                    if (!hasContracts) return { ...prev, contractId: defaultContractIds };
                    return prev;
                });
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }, [currentUser.id, scopeReady, systemsScope]);

    useEffect(() => {
        let active = true;
        const selectedContractIds = Array.isArray(advancedFilters.contractId)
            ? advancedFilters.contractId.map(String)
            : advancedFilters.contractId != null && advancedFilters.contractId !== ''
                ? [String(advancedFilters.contractId)]
                : [];
        const selectedContractClientIds = [...new Set<string>(
            filterOptions.contracts
                .filter((contract: any) =>
                    selectedContractIds.length === 0 || selectedContractIds.includes(String(contract.id))
                )
                .map((contract: any) => contract.clientId)
                .filter((clientId: any) => clientId !== null && clientId !== undefined)
                .map((clientId: any) => String(clientId))
        )];

        if (!scopeReady || selectedContractClientIds.length === 0) {
            setFilterOptions(prev => prev.units.length === 0 ? prev : { ...prev, units: [] });
            return () => { active = false; };
        }

        dataService.getUnits('active', '', selectedContractClientIds)
            .then(units => {
                if (active) setFilterOptions(prev => ({ ...prev, units }));
            })
            .catch(error => {
                console.error('Error loading units for selected contracts:', error);
                if (active) setFilterOptions(prev => ({ ...prev, units: [] }));
            });

        return () => { active = false; };
    }, [advancedFilters.contractId, filterOptions.contracts, scopeReady]);

    const [isFetchingAll, setIsFetchingAll] = useState(false);

    // ── Paginação no servidor ────────────────────────────────────────────
    // Lista: página de 50 já filtrada por etapa e ordenada no banco.
    // Contadores, totais, gráficos e ids de apropriação: RPC
    // fn_orders_visits_dashboard_summary. Sem o RPC (migration 20261114 não
    // aplicada), cai no modo antigo: baixa tudo e calcula no navegador com as
    // MESMAS regras (utils/visitsDashboardSummary).
    const LIST_PAGE_SIZE = 50;
    const EXPORT_PAGE_SIZE = 500;
    const visitsRef = useRef<OrderVisitExtended[]>([]);
    useEffect(() => { visitsRef.current = visits; }, [visits]);

    /** Seleção de etapas atual no formato do RPC/consulta. */
    const getSelection = React.useCallback((stages: any[]) => {
        const allIds = ['all', ...stages.map((st: any) => String(st.id)), 'costs-rejected', 'costs-pending'];
        return toProcessingSelection(activeOrderVisitProcessingIdSelected, allIds);
    }, [activeOrderVisitProcessingIdSelected]);

    const listParams = React.useCallback(() => ({
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...appliedFilters,
        searchQuery: debouncedSearchQuery,
    }), [dateRange, appliedFilters, debouncedSearchQuery]);

    /** Modo fallback: todas as visitas do período (sem filtro de etapa). */
    const fetchAllVisitsUnfiltered = React.useCallback(async (): Promise<OrderVisitExtended[]> => {
        const all: OrderVisitExtended[] = [];
        const first = await dataService.getOrdersVisitsView({ ...listParams(), page: 0, pageSize: EXPORT_PAGE_SIZE });
        all.push(...(first.data || []).map(mapVisitRow));
        const pages = Math.ceil((first.count ?? 0) / EXPORT_PAGE_SIZE);
        for (let page = 1; page < pages; page++) {
            const r = await dataService.getOrdersVisitsView({ ...listParams(), page, pageSize: EXPORT_PAGE_SIZE, withCount: false });
            all.push(...(r.data || []).map(mapVisitRow));
        }
        return all;
    }, [listParams]);

    const sortVisits = React.useCallback((rows: OrderVisitExtended[]) => [...rows].sort((a, b) => {
        const dateA = a.ovStartedAt ? new Date(a.ovStartedAt).getTime() : (a.ovCreatedAt ? new Date(a.ovCreatedAt).getTime() : 0);
        const dateB = b.ovStartedAt ? new Date(b.ovStartedAt).getTime() : (b.ovCreatedAt ? new Date(b.ovCreatedAt).getTime() : 0);
        if (dateA !== dateB) return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        return sortOrder === 'asc'
            ? String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
            : String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
    }), [sortOrder]);

    /**
     * Carrega resumo + 1ª página. Em recarga silenciosa (Realtime/polling)
     * mantém a quantidade de linhas já carregadas.
     */
    const loadData = React.useCallback(async (forceLoading = false, resetList = false) => {
        const currentFetchId = ++fetchIdRef.current;
        try {
            if (forceLoading || !initialLoadDone.current) {
                setLoading(true);
            }

            const stages = await dataService.getProcessingConfigurations();
            if (currentFetchId !== fetchIdRef.current) return;
            setProcessingStages(stages);

            const selection = getSelection(stages);
            const keepCount = forceLoading || resetList ? LIST_PAGE_SIZE : Math.max(LIST_PAGE_SIZE, visitsRef.current.length);

            const [summaryResult, pageResult] = await Promise.all([
                dataService.getOrdersVisitsDashboardSummary({
                    filters: appliedFilters as Record<string, unknown>,
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    searchQuery: debouncedSearchQuery,
                    processingSelection: selection,
                }),
                dataService.getOrdersVisitsView({
                    ...listParams(),
                    page: 0,
                    pageSize: keepCount,
                    withCount: false,
                    processingSelection: selection,
                    sortAscending: sortOrder === 'asc',
                }),
            ]);
            if (currentFetchId !== fetchIdRef.current) return;

            if (summaryResult) {
                fallbackRowsRef.current = null;
                setSummary(summaryResult);
                setVisits((pageResult.data || []).map(mapVisitRow));
            } else {
                // Fallback: RPC ausente → mesmo cálculo no navegador.
                setIsFetchingAll(true);
                try {
                    const all = await fetchAllVisitsUnfiltered();
                    if (currentFetchId !== fetchIdRef.current) return;
                    setSummary(computeVisitsSummary(all.map(v => ({
                        id: v.id,
                        ovProcessingId: v.ovProcessingId,
                        ovCostsStatus: v.ovCostsStatus,
                        totalValue: v.totalValue,
                        planLabel: v.o_plan_description,
                        unitLabel: v.unitDescription,
                        ovStartedAt: v.ovStartedAt,
                    })), selection));
                    const selected = sortVisits(all.filter(v => matchesProcessingSelection(v, selection)));
                    fallbackRowsRef.current = selected;
                    setVisits(selected.slice(0, keepCount));
                } finally {
                    if (currentFetchId === fetchIdRef.current) setIsFetchingAll(false);
                }
            }

            setLoading(false);
            initialLoadDone.current = true;
        } catch (error) {
            console.error('Error loading visits:', error);
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
                initialLoadDone.current = true;
            }
        }
    }, [appliedFilters, dateRange, debouncedSearchQuery, getSelection, listParams, sortOrder, fetchAllVisitsUnfiltered, sortVisits]);

    /** Próxima página (rolagem infinita). */
    const loadMoreVisits = React.useCallback(async () => {
        const offset = visitsRef.current.length;
        if (fallbackRowsRef.current) {
            setVisits(fallbackRowsRef.current.slice(0, offset + LIST_PAGE_SIZE));
            return;
        }
        const fetchId = fetchIdRef.current;
        const result = await dataService.getOrdersVisitsView({
            ...listParams(),
            offset,
            pageSize: LIST_PAGE_SIZE,
            withCount: false,
            processingSelection: getSelection(processingStages),
            sortAscending: sortOrder === 'asc',
        });
        if (fetchId !== fetchIdRef.current) return; // filtros mudaram no meio
        const batch = (result.data || []).map(mapVisitRow);
        setVisits(prev => {
            const ids = new Set(prev.map(v => v.id));
            return [...prev, ...batch.filter(v => !ids.has(v.id))];
        });
    }, [listParams, getSelection, processingStages, sortOrder]);

    /**
     * Todas as visitas de uma seleção (exportações e PDFs em lote) — buscadas
     * só no clique, em páginas de 500.
     */
    const loadAllVisitsFor = React.useCallback(async (selected: string[]): Promise<OrderVisitExtended[]> => {
        const allIds = ['all', ...processingStages.map((st: any) => String(st.id)), 'costs-rejected', 'costs-pending'];
        const selection = toProcessingSelection(selected, allIds);
        if (fallbackRowsRef.current) {
            const all = await fetchAllVisitsUnfiltered();
            return sortVisits(all.filter(v => matchesProcessingSelection(v, selection)));
        }
        const rows: OrderVisitExtended[] = [];
        for (let page = 0; ; page++) {
            const r = await dataService.getOrdersVisitsView({
                ...listParams(),
                page,
                pageSize: EXPORT_PAGE_SIZE,
                withCount: false,
                processingSelection: selection,
                sortAscending: sortOrder === 'asc',
            });
            const batch = (r.data || []).map(mapVisitRow);
            rows.push(...batch);
            if (batch.length < EXPORT_PAGE_SIZE) break;
        }
        return rows;
    }, [processingStages, listParams, sortOrder, fetchAllVisitsUnfiltered, sortVisits]);

    const loadDataRef = useRef(loadData);
    const loadFilterOptionsRef = useRef(loadFilterOptions);
    const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadDataRef.current = loadData;
    }, [loadData]);

    useEffect(() => {
        loadFilterOptionsRef.current = loadFilterOptions;
    }, [loadFilterOptions]);

    useEffect(() => {
        loadDataRef.current(true);

        const handleRefresh = () => loadDataRef.current(true);
        window.addEventListener('refresh_dashboard', handleRefresh);

        // Recarga por Realtime (OS/visitas), agrupada e econômica:
        //  • debounce de 2,5 s: rajadas de eventos (OS + visita na mesma
        //    mudança, vários membros) viram 1 recarga;
        //  • com a aba/app em segundo plano não consulta — marca pendente e
        //    recarrega uma vez ao voltar a ficar visível;
        //  • polling só como reserva (Realtime desconectado), a cada 60 s e
        //    apenas com a página visível.
        let refreshPending = false;
        const runRefresh = () => {
            refreshPending = false;
            loadDataRef.current(false);
        };
        const scheduledRealtimeRefresh = () => {
            if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
            realtimeDebounceRef.current = setTimeout(() => {
                realtimeDebounceRef.current = null;
                if (document.visibilityState === 'hidden') {
                    refreshPending = true;
                    return;
                }
                runRefresh();
            }, 2500);
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && refreshPending) runRefresh();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const orderSub = dataService.subscribeToOrders(() => {
            scheduledRealtimeRefresh();
        });
        const visitSub = dataService.subscribeToVisits(() => {
            scheduledRealtimeRefresh();
        });

        const POLL_INTERVAL = 60000;
        const pollTimer = setInterval(() => {
            if (document.visibilityState === 'visible') loadDataRef.current(false);
        }, POLL_INTERVAL);

        return () => {
            window.removeEventListener('refresh_dashboard', handleRefresh);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
            clearInterval(pollTimer);
            orderSub.unsubscribe();
            visitSub.unsubscribe();
        };
    }, []); // Run ONLY once on mount!

    // Opções de filtro (inclui o SISTEMA escopado): carregam exatamente uma
    // vez, quando o escopo de cliente do usuário resolver.
    useEffect(() => {
        if (!scopeReady) return;
        loadFilterOptionsRef.current();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopeReady]);

    // Recarrega (lista desde o início + resumo) quando período, filtros, busca,
    // etapas selecionadas ou ordenação mudam — loadData muda junto com eles.
    useEffect(() => {
        if (initialLoadDone.current) {
            loadData(false, true);
        }
    }, [loadData]);

    const visitTeamsRef = useRef<Record<string, OrderVisitTeam[]>>({})

    const loadTeamsForVisits = React.useCallback(async (visitsToLoad: OrderVisitExtended[]) => {
        try {
            if (!visitsToLoad.length) return;
            // Use ref to check loaded IDs to avoid stale closure / re-render loop
            const visitIds = visitsToLoad
                .map(v => v.id)
                .filter(id => !visitTeamsRef.current[id]);
                
            if (visitIds.length === 0) return;

            const teamResults = await dataService.getOrdersVisitsTeamsBulk(visitIds);
            visitTeamsRef.current = { ...visitTeamsRef.current, ...teamResults };
            setVisitTeams(prev => ({ ...prev, ...teamResults }));
        } catch (error) {
            console.error('Error loading visit teams:', error);
        }
    }, []);


    const formatDateDisplay = (dateString?: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const handleSystemChange = async (systemId: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id, systemsScope)));
            setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, unitTypeParentId: id, unitTypeId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
            setUnitSubTypes(results.flat());
        } else {
            setUnitSubTypes([]);
        }
    };

    const handleSectorChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, assetTagId: id, assetTagSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getAssetTagSubs(id, 'active')));
            setAssetTagSubOptions(results.flat());
        } else {
            setAssetTagSubOptions(await dataService.getAssetTagSubs(undefined, 'active'));
        }
    };

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const handleDateModalOpen = () => {
        setTempDateRange(dateRange);
        setIsDateModalOpen(true);
    };

    const handleDateModalApply = () => {
        const start = tempDateRange.start || todayStr;
        const end = tempDateRange.end || todayStr;

        if (start > end) {
            toast.error('A data inicial deve ser menor ou igual à final');
            return;
        }

        setDateRange({ start, end });
        setIsDateModalOpen(false);
    };

    // Resumo vindo do banco (RPC) — antes calculado sobre a lista completa.
    const stats = useMemo(() => {
        const newStats: Record<number, { count: number; total: number }> = {};
        processingStages.forEach(stage => {
            newStats[stage.id] = summary.stages[String(stage.id)] || { count: 0, total: 0 };
        });
        return newStats;
    }, [summary, processingStages]);

    /** Total de visitas das etapas selecionadas (a lista carrega por páginas). */
    const selectedTotalCount = summary.selection.count;

    // Apropriações: refaz as consultas só quando o conjunto/valores mudam.
    const appropriationVisitsKey = useMemo(() => JSON.stringify([
        summary.appropriationIds,
        summary.all,
        summary.stages,
    ]), [summary]);

    const financialTotals = useMemo(
        () => computeFinancialTotals(appropriationData),
        [appropriationData.services, appropriationData.materials, appropriationData.vehicles]
    );

    const totalSumValue = financialTotals.services + financialTotals.materials + financialTotals.vehicles;

    const insightData = useMemo(
        () => computeVisitsInsights(summary, appropriationData.movedAssets),
        [summary, appropriationData.movedAssets]
    );

    // Linhas já carregadas (páginas do servidor).
    const displayedVisits = visits;

    useEffect(() => {
        if (displayedVisits.length > 0) {
            loadTeamsForVisits(displayedVisits);
        }
    }, [displayedVisits, loadTeamsForVisits]);

    /** Lista das etapas selecionadas para PDF/Excel — buscada só no clique. */
    const loadPdfVisitsData = React.useCallback(async () => {
        const rows = await loadAllVisitsFor(activeOrderVisitProcessingIdSelected);
        return rows.map(v => ({
            ovMask: v.ovMask,
            ovStartedAt: v.ovStartedAt,
            ovEndedAt: v.ovEndedAt,
            contractDescription: (v as OrderVisitExtended).contractDescription || v.contractDescription,
            orderMask: v.orderMask,
            typeCode: (v as OrderVisitExtended).typeCode,
            typeSubCode: (v as OrderVisitExtended).typeSubCode,
            unitDescription: v.unitDescription,
            sectorDescription: (v as OrderVisitExtended).sectorDescription,
            statusDescription: v.statusDescription,
            processingDescription: v.processingDescription,
            materialsValue: v.materialsValue,
            vehiclesValue: v.vehiclesValue,
            servicesValue: v.servicesValue,
            totalValue: v.totalValue,
        }));
    }, [loadAllVisitsFor, activeOrderVisitProcessingIdSelected]);

    const fetchDebounceRef = useRef<any>(null);

    useEffect(() => {
        // Espera todas as páginas de visitas (isFetchingAll): antes, as 4
        // consultas de apropriação se repetiam a cada página carregada.
        if (isFetchingAll) return;
        if (!loading && summary.appropriationIds.length > 0) {
            if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
            fetchDebounceRef.current = setTimeout(() => {
                fetchAppropriationData();
            }, 600);
        } else if (summary.appropriationIds.length === 0) {
            if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
            setAppropriationData({ services: [], materials: [], vehicles: [], movedAssets: [] });
        }
        return () => {
            if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
        };
    }, [appropriationVisitsKey, loading, isFetchingAll, activeOrderVisitProcessingIdSelected]);

    const fetchAppropriationData = async () => {
        try {
            setIsFetchingAppropriation(true);
            // Mesma regra de antes (aprovados / pendentes / rejeitados / todas),
            // agora calculada no banco (summary.appropriationIds).
            const ovIds = summary.appropriationIds;
            if (!ovIds.length) return;

            const [servicesRaw, materialsRaw, vehiclesRaw, movedAssetsRaw] = await Promise.all([
                dataService.getOrdersVisitsServicesMerged(ovIds),
                dataService.getOrdersVisitsMaterialsMerged(ovIds),
                dataService.getOrdersVisitsVehiclesMerged(ovIds),
                dataService.getOrdersVisitsAssetsMovedMerged(ovIds)
            ]);

            const aggregate = (items: any[], codeKey: string, descKey: string) => {
                const map = new Map<string, any>();
                items.forEach(item => {
                    const code = item[codeKey] || 'N/A';
                    const desc = item[descKey] || item.description || 'Sem descrição';
                    const valueUnit = Number(item.value_unit || 0).toFixed(2);
                    const discount = Number(item.discount || 1).toFixed(3);
                    const key = `${code}_${desc}_${valueUnit}_${discount}`;

                    if (map.has(key)) {
                        const existing = map.get(key);
                        existing.amount = (existing.amount || 0) + Number(item.amount || 0);
                        existing.value_total = (existing.value_total || 0) + Number(item.value_total || 0);
                    } else {
                        map.set(key, {
                            ...item,
                            code,
                            description: desc,
                            amount: Number(item.amount || 0),
                            value_total: Number(item.value_total || 0),
                            value_unit: Number(item.value_unit || 0),
                            discount: Number(item.discount || 1)
                        });
                    }
                });
                return Array.from(map.values()).sort((a, b) => (a.description || '').localeCompare(b.description || '', 'pt-BR'));
            };

            setAppropriationData({
                services: aggregate(servicesRaw, 'code', 'description'),
                materials: aggregate(materialsRaw, 'material_code', 'material_description'),
                vehicles: aggregate(vehiclesRaw, 'code', 'vehicle_description'),
                movedAssets: movedAssetsRaw
            });
        } catch (error) {
            console.error('Error fetching appropriation data:', error);
        } finally {
            setIsFetchingAppropriation(false);
        }
    };


    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    visits.length < selectedTotalCount &&
                    !isLoadingMoreRef.current
                ) {
                    isLoadingMoreRef.current = true;
                    setIsLoadingMore(true);
                    loadMoreVisits()
                        .catch(err => console.error('Error loading more visits:', err))
                        .finally(() => {
                            setIsLoadingMore(false);
                            isLoadingMoreRef.current = false;
                        });
                }
            },
            { threshold: 0, rootMargin: '300px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [visits.length, selectedTotalCount, loadMoreVisits]);

    if (loading) {
        return <VisitsDashboardSkeleton />;
    }

    return (
        <>
            <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white animate-in fade-in duration-500 relative">
                <div className="z-30 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex flex-col p-4 gap-2">
                        <div className="flex items-center gap-2 pb-1 pt-0 mt-0">
                            <FilterBarResponsive
                                ref={filterBarRef}
                                advancedFilters={advancedFilters}
                                setAdvancedFilters={setAdvancedFilters}
                                filterSelectOptions={filterOptions}
                                handleSystemChange={handleSystemChange}
                                onClearSystem={() => handleSystemChange(filterOptions.systems.map((system: any) => String(system.id)))}
                                handleParentUnitTypeChange={handleParentUnitTypeChange}
                                handleOrderTypeChange={handleOrderTypeChange}
                                handleSectorChange={handleSectorChange}
                                unitSubTypes={unitSubTypes}
                                assetTagSubOptions={assetTagSubOptions}
                                orderSubTypes={orderSubTypes}
                                hiddenFilters={hiddenVisitFilters}
                                requireContract
                                onActiveFiltersChange={(count) => { setVisitFilterCount(count); onActiveFiltersChange?.(count); }}
                                onApply={() => {
                                    const selectedContracts = Array.isArray(advancedFilters.contractId) ? advancedFilters.contractId : [];
                                    if (selectedContracts.length === 0) {
                                        toast.error('Selecione ao menos um contrato para filtrar');
                                        return;
                                    }
                                    setAppliedFilters({ ...advancedFilters });
                                    loadData(true);
                                }}
                            />
                                <button
                                    onClick={() => {
                                        const selectedContracts = Array.isArray(advancedFilters.contractId) ? advancedFilters.contractId : [];
                                        if (selectedContracts.length === 0) {
                                            toast.error('Selecione ao menos um contrato para filtrar');
                                            return;
                                        }
                                        setAppliedFilters({ ...advancedFilters });
                                        loadData(true);
                                    }}
                                    disabled={loading}
                                    className="hidden md:inline-flex items-center justify-center gap-2 h-12 px-6 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                                >
                                    <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>
                                        {loading ? 'progress_activity' : 'filter_list'}
                                    </span>
                                    <span className="tracking-wide text-sm font-bold uppercase">{loading ? 'Filtrando...' : 'Filtrar'}</span>
                                </button>
                        </div>
                        <div className="flex items-center gap-3 pb-1 pt-0 mt-0">
                            <div
                                onClick={handleDateModalOpen}
                                className="group w-auto flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 shrink-0 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-400">
                                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none opacity-80" style={{ marginBottom: '-2px' }}>Período</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                                            {formatDateDisplay(dateRange.start)}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                                            {formatDateDisplay(dateRange.end)}
                                        </span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-lg group-hover:text-primary transition-colors shrink-0">edit_calendar</span>
                            </div>
                            <button
                                onClick={() => filterBarRef?.current?.openMobileFilters()}
                                className="relative md:hidden flex items-center justify-center h-11 w-11 bg-primary text-white hover:bg-blue-600 shadow-md rounded-full transition-all duration-200 active:scale-[0.97] active:brightness-95 font-bold flex-shrink-0 cursor-pointer select-none ml-auto"
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                {visitFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-sm">
                                        {visitFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                    <div
                        ref={processingCardsScroll.ref}
                        onMouseDown={processingCardsScroll.onMouseDown}
                        onTouchStart={processingCardsScroll.onTouchStart}
                        onClickCapture={processingCardsScroll.onClickCapture}
                        className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 mb-2 pt-2 w-full cursor-grab active:cursor-grabbing touch-auto"
                    >
                        <StatCard
                            icon="apps"
                            label="Todos"
                            count={summary.all.count}
                            totalValue={summary.all.total}
                            color="text-slate-400"
                            active={activeOrderVisitProcessingIdSelected.includes('all') || activeOrderVisitProcessingIdSelected.length === allStageIds.length}
                            onClick={() => toggleProcessingSelection('all')}
                            loadVisits={() => loadAllVisitsFor(['all'])}
                        />
                        {processingStages.map(stage => {
                            const isHex = stage.icon_color && stage.icon_color.startsWith('#');
                            return (
                                <React.Fragment key={stage.id}>
                                    {stage.id === 5 && (
                                        <>
                                            {/* Card especial: Custos Rejeitados (antes de Custos Pendentes e Aprovada) */}
                                            {(() => {

                                                return (
                                                    <StatCard
                                                        key="costs-rejected"
                                                        icon="receipt_long"
                                                        label="Custos Rejeitados"
                                                        count={summary.costsRejected.count}
                                                        totalValue={summary.costsRejected.total}
                                                        color="text-rose-500"
                                                        active={activeOrderVisitProcessingIdSelected.includes('costs-rejected')}
                                                        onClick={() => toggleProcessingSelection('costs-rejected')}
                                                        loadVisits={() => loadAllVisitsFor(['costs-rejected'])}
                                                    />
                                                );
                                            })()}
                                            {/* Card especial: Custos Pendentes (antes de Aprovada) */}
                                            {(() => {

                                                return (
                                                    <StatCard
                                                        key="costs-pending"
                                                        icon="receipt_long"
                                                        label="Custos Pendentes"
                                                        count={summary.costsPending.count}
                                                        totalValue={summary.costsPending.total}
                                                        color="text-slate-500"
                                                        active={activeOrderVisitProcessingIdSelected.includes('costs-pending')}
                                                        onClick={() => toggleProcessingSelection('costs-pending')}
                                                        loadVisits={() => loadAllVisitsFor(['costs-pending'])}
                                                    />
                                                );
                                            })()}
                                        </>
                                    )}
                                    <StatCard
                                        icon={stage.icon || 'circle'}
                                        label={stage.description}
                                        count={stats[stage.id]?.count || 0}
                                        totalValue={stats[stage.id]?.total || 0}
                                        color={!isHex ? stage.icon_color : ''}
                                        styleColor={isHex ? stage.icon_color : undefined}
                                        active={activeOrderVisitProcessingIdSelected.includes(String(stage.id))}
                                        onClick={() => toggleProcessingSelection(String(stage.id))}
                                        loadVisits={() => loadAllVisitsFor([String(stage.id)])}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {!isProviderMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 px-1 py-2 bg-slate-50/50 dark:bg-slate-800/10 rounded-[16px]">
                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md group">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Distribuição por Plano</h3>
                            </div>
                            <div className="flex flex-col xl:flex-row items-center gap-8">
                                <InsightsDoughnut data={insightData.composition} />
                                <div className="flex flex-col gap-3 w-full">
                                    {insightData.composition.slice(0, 6).map((c, i) => (
                                        <div key={i} className="flex items-center justify-between group/item">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 min-w-[10px] h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{c.label}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">{insightData.totalComposition > 0 ? ((c.value / insightData.totalComposition) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Tendência Diária</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Visitas iniciadas nos últimos dias</p>
                            <div className="flex-1 flex items-center">
                                <InsightsTrend data={insightData.trend} />
                            </div>
                        </div>

                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Maiores Gastos (Unidades)</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Top 3 unidades com maiores gastos</p>
                            <InsightsBar data={insightData.units} />
                            
                            <button 
                                onClick={() => setIsAllUnitsModalOpen(true)}
                                className="mt-auto pt-6 text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center justify-center gap-1 group/btn border-t border-slate-100 dark:border-slate-800/50"
                            >
                                Ver Todos os Gastos
                                <span className="material-symbols-outlined text-[14px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </div>

                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">precision_manufacturing</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Movimentação por Tipo</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">
                                {insightData.movements.reduce((acc: number, m: any) => acc + m.value, 0)} ativo{insightData.movements.reduce((acc: number, m: any) => acc + m.value, 0) !== 1 ? 's' : ''} movimentados
                            </p>
                            <div className="flex-1">
                                <InsightsMovementsBar data={insightData.movements} />
                            </div>
                            <button
                                onClick={() => setIsMovementsModalOpen(true)}
                                className="mt-auto pt-6 text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center justify-center gap-1 group/btn border-t border-slate-100 dark:border-slate-800/50"
                            >
                                VER DETALHES
                                <span className="material-symbols-outlined text-[14px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    )}

                    <div className="flex flex-col gap-4 mb-8 px-1">
                        <AppropriationSection
                            title="Serviços"
                            icon="home_repair_service"
                            items={appropriationData.services}
                            isExpanded={expandedSections.services}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, services: !prev.services }))}
                            total={financialTotals.services}
                            loading={isFetchingAppropriation}
                        />
                        <AppropriationSection
                            title="Materiais"
                            icon="inventory_2"
                            items={appropriationData.materials}
                            isExpanded={expandedSections.materials}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, materials: !prev.materials }))}
                            total={financialTotals.materials}
                            loading={isFetchingAppropriation}
                        />
                        <AppropriationSection
                            title="Transportes"
                            icon="local_shipping"
                            items={appropriationData.vehicles}
                            isExpanded={expandedSections.vehicles}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, vehicles: !prev.vehicles }))}
                            total={financialTotals.vehicles}
                            loading={isFetchingAppropriation}
                        />
                    </div>

                    <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    Visitas
                                </h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-8">
                                    {selectedTotalCount} registros encontrados
                                    {isFetchingAll && (
                                        <span className="ml-2 text-primary animate-pulse">· sincronizando...</span>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-col items-end md:flex-row md:items-center justify-end gap-3 md:gap-5 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        search
                                    </span>
                                    <input aria-label="Buscar visitas..."
                                        type="text"
                                        placeholder="Buscar visitas..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border-2 cursor-text border-slate-200 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                                    />
                                </div>

                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/40 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-all active:scale-[0.98] text-[10px] font-bold uppercase tracking-wider shadow-sm shrink-0"
                                    title={sortOrder === 'asc' ? 'Ordenado por data de início (Crescente)' : 'Ordenado por data de início (Decrescente)'}
                                >
                                    <span 
                                        className={`material-symbols-outlined text-[14px] text-primary transition-transform duration-300 select-none ${
                                            sortOrder === 'desc' ? 'rotate-180' : ''
                                        }`}
                                    >
                                        arrow_upward
                                    </span>
                                    <span>
                                        Início
                                    </span>
                                </button>

                                <VisitsListPDFButton
                                    className="shrink-0"
                                    loadVisits={loadPdfVisitsData}
                                    totalCount={selectedTotalCount}
                                    filename="relatorio-visitas"
                                />

                                <VisitsListExcelButton
                                    className="shrink-0"
                                    loadVisits={loadPdfVisitsData}
                                    totalCount={selectedTotalCount}
                                    filename="relatorio-visitas"
                                />

                                    <div className="flex items-center gap-4 px-2 py-1">
                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Serviços</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.services / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Materiais</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.materials / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Transportes</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.vehicles / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col px-4 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm min-w-[140px]">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">TOTAL GERAL</span>
                                            <span className="material-symbols-outlined text-[14px] text-emerald-500">payments</span>
                                        </div>
                                        <span className="text-[15px] font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight leading-none text-right">
                                            {formatCurrency(totalSumValue)}
                                        </span>
                                    </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedVisits.map((visit) => (
                            <DashboardOrdersVisitsAdminListItem
                                key={visit.id}
                                visit={visit}
                                teamMembers={visitTeams[visit.id] || []}
                                onClick={() => onSelectVisit(visit)}
                            />
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    {visits.length < selectedTotalCount && (
                        <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-3">
                            {isLoadingMore ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {selectedTotalCount - visits.length} visitas restantes
                                    </span>
                                </>
                            ) : (
                                <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            )}
                        </div>
                    )}

                    {selectedTotalCount === 0 && (
                        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">inbox</span>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma visita encontrada</p>
                            <p className="text-sm opacity-70 mt-1">Tente ajustar os filtros de busca</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Range Selection Modal */}
            <Modal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                title="INFORMAR PERÍODO"
                maxWidth="sm"
                draggable
            >
                <div className="flex flex-col gap-4 px-2 pb-2 -mt-4">
                    <DateRangePicker value={tempDateRange} onChange={setTempDateRange} />

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handleDateModalApply}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            Aplicar Período
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal for All Units Expenses */}
            <Modal
                isOpen={isAllUnitsModalOpen}
                onClose={() => setIsAllUnitsModalOpen(false)}
                title="GASTOS POR UNIDADE"
                maxWidth="lg"
                draggable
            >
                <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                        Listagem completa de gastos acumulados por unidade no período selecionado
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
                            <div className="flex flex-col gap-6">
                                {(() => {
                                    const allUnits = (insightData as any).allUnits || [];
                                    const maxValue = Math.max(...allUnits.map((d: any) => d.value), 1);
                                    
                                    return allUnits.map((item: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-2 group/bar">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono w-6 text-right shrink-0">{i + 1}º</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{item.label}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary font-mono shrink-0">{formatCurrency(item.value)}</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--color-primary),0.3)]"
                                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {(insightData as any).allUnits?.length || 0} UNIDADES ENCONTRADAS
                        </span>
                        <button
                            onClick={() => setIsAllUnitsModalOpen(false)}
                            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-['Inter']"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isMovementsModalOpen}
                onClose={() => setIsMovementsModalOpen(false)}
                title="MOVIMENTAÇÕES ATIVOS"
                maxWidth="lg"
                draggable
            >
                <div className="flex flex-col gap-4">
                    <div className="flex justify-end items-center px-1">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                disabled={isExportingExcel}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 text-green-500 hover:bg-green-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs"
                                title="Exportar Movimentações para Excel"
                            >
                                {isExportingExcel ? <Loading size="xs" /> : <RiFileExcel2Fill className="text-[14px]" />}
                                <span>XLS ({(appropriationData as any)?.movedAssets?.length || 0})</span>
                            </button>
                            <PDFButton
                                onClick={handleExportPDF}
                                loading={isExportingPDF}
                                count={(appropriationData as any)?.movedAssets?.length || 0}
                                title="Exportar Movimentações para PDF"
                            />
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-1 no-scrollbar">
                        <div className="flex flex-col gap-6">
                            {((appropriationData as any)?.movedAssets || []).length === 0 ? (
                                <div className="text-sm text-slate-500">Nenhuma movimentação encontrada</div>
                            ) : (
                                (appropriationData as any)?.movedAssets?.map((item: any, i: number) => (
                                    <AssetMovementListItem key={i} asset={item} />
                                ))
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {(appropriationData as any)?.movedAssets?.length || 0} MOVIMENTAÇÕES ENCONTRADAS
                        </span>
                        <button
                            onClick={() => setIsMovementsModalOpen(false)}
                            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-['Inter']"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
