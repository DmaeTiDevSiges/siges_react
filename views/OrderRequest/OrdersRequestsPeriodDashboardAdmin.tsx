import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import { User, OrderFilters, Order, Company } from '../../types';
import { dataService } from '../../services/dataService';
import { getDashboardRefreshRequestedAt } from '../../services/core/dashboardRefresh';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderRequestCardListItem } from '../../components/orderRequests/OrderRequestCardListItem';
import { Avatar } from '../../components/ui/Avatar';
import { useOrderFollow } from '../../hooks/useOrderFollow';
import { OrdersVisitsDashboardAdmin } from '../Dashboards/OrdersVisitsDashboardAdmin';
import { OrderVisit, OrderVisitTeam } from '../../types';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { OrdersListPDFButton } from '../../components/reports/OrdersListPDFButton';
import { ExcelExportButton } from '../../components/reports/ExcelExportButton';
import { FilterBarResponsive, FilterBarResponsiveHandle } from '../../components/ui/FilterBarResponsive';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Calendar } from '../../components/ui/Calendar';
import DashboardOrdersVisitsAdminListItem from '../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem';

// Sessão do app: busca automática só na primeira entrada; retornos usam cache + realtime.
let osDashboardSessionLoaded = false;
// Última carga deste dashboard — comparado com o carimbo de invalidação
// (ex: cancelamento feito na tela de detalhe) para forçar refetch no retorno.
let osDashboardLastLoadedAt = 0;

interface OrdersRequestsPeriodDashboardAdminProps {
    currentUser: User | null;
    onSelectOrder?: (order: Order) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onTrackUsers?: (company: Company) => void;
    onCreateServiceRequest?: () => void;
    onNavigate?: (path: string) => void;
    onEdit?: (order: Order) => void;
    activeTab?: 'OS' | 'VISITAS';
    onFilterBarRef?: (ref: FilterBarResponsiveHandle | null) => void;
    onMobileFilterCountChange?: (tab: 'OS' | 'VISITAS', count: number) => void;
    /** Filtro por empresa provedora. Quando definido, todas as queries filtram por provider_company_id. */
    providerCompanyId?: string;
    /** Tela de destino do lado "Online" do switch Online x Período (ex.: 'services-history'). */
    onlineScreenKey?: string;
}

export const OrdersRequestsPeriodDashboardAdmin: React.FC<OrdersRequestsPeriodDashboardAdminProps> = ({ currentUser, onSelectOrder, onSelectVisit, onTrackUsers, onCreateServiceRequest, onNavigate, onEdit, activeTab = 'OS', onFilterBarRef, onMobileFilterCountChange, providerCompanyId, onlineScreenKey = 'orders-dashboard' }) => {

    // We removed the internal activeTab state and the header tabs. activeTab is now controlled by props.
    const isProviderMode = !!providerCompanyId;
    // Frozen for this mount: true on first entry of the app session and when a
    // mutation happened while this dashboard was unmounted (see dashboardRefresh).
    const [shouldInitialLoad] = React.useState(() => {
        // Escopo de empresa: se o snapshot em localStorage pertence a outra empresa
        // (ex.: logout/login sem reload da página), descarta o cache e força o
        // reload inicial com o filtro providerCompanyId da empresa atual.
        const cacheCompanyScope = localStorage.getItem('osdash_cacheCompanyScope');
        const currentCompanyScope = providerCompanyId || '1';
        if (cacheCompanyScope !== currentCompanyScope) {
            [
                'cachedRecentRequests_v4', 'cachedCurrentPage_v2', 'cachedHasMore_v2', 'cachedTotalOrders_v2',
                'osdash_cachedCompletedOS_v2', 'osdash_cachedCompletedOSCounts',
                'osdash_cachedUnscheduledSS_v2', 'osdash_cachedOpenOS_v2', 'osdash_cachedStats',
                'osdash_cachedOsAssetTagId',
                'advancedOrdersFilters', 'appliedOrdersFilters', 'hasAppliedOrdersFilters'
            ].forEach(k => localStorage.removeItem(k));
            return true;
        }
        return !osDashboardSessionLoaded || getDashboardRefreshRequestedAt() > osDashboardLastLoadedAt;
    });
    const unscheduledSSScroll = useDraggableScroll();
    const openOSScroll = useDraggableScroll();
    const osSectorScroll = useDraggableScroll();
    const openOSCarouselScroll = useDraggableScroll();
    const leadersScroll = useDraggableScroll();
    const ssSectorScroll = useDraggableScroll();

    const { canCreate, canView } = usePermissions();

    const filterBarRef = useRef<FilterBarResponsiveHandle>(null);
    const visitsFilterBarRef = useRef<FilterBarResponsiveHandle>(null);

    useEffect(() => {
        const activeRef = activeTab === 'VISITAS' ? visitsFilterBarRef.current : filterBarRef.current;
        onFilterBarRef?.(activeRef);
        return () => onFilterBarRef?.(null);
    }, [onFilterBarRef, activeTab]);

    const [searchQuery, setSearchQuery] = useState('');
    const [osFilterCount, setOsFilterCount] = useState(0);
    const [quickSearchValue, setQuickSearchValue] = useState('');
    const [isSearchingQuickly, setIsSearchingQuickly] = useState(false);
    // Data Cache — a página de período NÃO usa o cache da página Online:
    // a query muda com o range e os caches são compartilhados.
    const [recentRequests, setRecentRequests] = useState<Order[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    // --- Completed OS ---
    type CompletedTemporalFilter = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';
    const [completedTemporalFilter, setCompletedTemporalFilter] = useState<CompletedTemporalFilter>(() => {
        const saved = localStorage.getItem('orders_dashboard_completed_temporal_filter');
        return (saved as CompletedTemporalFilter) || 'thisMonth';
    });
    const [completedOS, setCompletedOS] = useState<{ data: Order[]; total: number }>(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedCompletedOS_v2');
            return saved ? JSON.parse(saved) : { data: [], total: 0 };
        } catch { return { data: [], total: 0 }; }
    });
    const [completedOSCounts, setCompletedOSCounts] = useState<Record<CompletedTemporalFilter, number>>(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedCompletedOSCounts');
            if (saved) return JSON.parse(saved);
        } catch { }
        return {
            today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0
        };
    });
    const completedOSScroll = useDraggableScroll();
    const completedOSCardsScroll = useDraggableScroll();
    const [teams, setTeams] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cachedTeams');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [users, setUsers] = useState<User[]>(() => {
        try {
            const saved = localStorage.getItem('cachedUsers');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>('Todas');
    const [unitSubTypes, setUnitSubTypes] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cachedUnitSubTypes');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cachedOrderSubTypes');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [assetTagSubs, setAssetTagSubs] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cachedAssetTagSubs');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [isOsAbertasOpen, setIsOsAbertasOpen] = useState(() => {
        const saved = localStorage.getItem('ordersSection_osAbertasOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isOsConcluidasOpen, setIsOsConcluidasOpen] = useState(() => {
        const saved = localStorage.getItem('ordersSection_osConcluidasOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isNaoProgramadasOpen, setIsNaoProgramadasOpen] = useState(() => {
        const saved = localStorage.getItem('ordersSection_naoProgramadasOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Use the custom hook for follow functionality
    const { followedOrderIds, isOrderFollowed, toggleFollow } = useOrderFollow(currentUser?.id);

    // Pagination state for infinite scroll (sem cache — ver Data Cache acima)
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [modalVisit, setModalVisit] = useState<OrderVisit | null>(null);
    const [modalVisitTeam, setModalVisitTeam] = useState<OrderVisitTeam[]>([]);
    const [loadingLeaderId, setLoadingLeaderId] = useState<string | null>(null);
    const [totalOrders, setTotalOrders] = useState(0);


    // Refs to access state inside stable useCallback without adding dependencies
    const recentRequestsRef = React.useRef<Order[]>(recentRequests);
    const currentPageRef = React.useRef(currentPage);

    // Sync refs with state
    useEffect(() => {
        recentRequestsRef.current = recentRequests;
    }, [recentRequests]);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    // Scroll preservation
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const isLoadingMoreRef = React.useRef(false);

    // Advanced Filters State
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

    // UI Filters State (Persisted so user doesn't lose their selection)
    const [advancedOrdersFilters, setAdvancedOrdersFilters] = useState<OrderFilters>(() => {
        try {
            const saved = localStorage.getItem('advancedOrdersFilters');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Applied Filters State (Persisted to restore view on return)
    const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(() => {
        try {
            const saved = localStorage.getItem('appliedOrdersFilters');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Control flag (Persisted)
    const [hasAppliedFilters, setHasAppliedFilters] = useState<boolean>(() => {
        // If we have applied and saved filters, we assume the user wants to see them
        const text = localStorage.getItem('hasAppliedOrdersFilters');
        return text === 'true';
    });

    const [filterOptions, setFilterOptions] = useState(() => {
        try {
            const saved = localStorage.getItem('cachedFilterOptions');
            if (saved) return JSON.parse(saved);
        } catch { }
        return {
            systems: [] as any[],
            subSystems: [] as any[],
            unitTypes: [] as any[],
            units: [] as any[],
            sectors: [] as any[],
            purposes: [] as any[],
            orderTypes: [] as any[],
            orderObjects: [] as any[],
            contracts: [] as any[],
            plans: [] as any[],
            teams: [] as any[],
            causeReasons: [] as any[]
        };
    });

    // Create SS State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Selection Modal State
    const [unscheduledSS, setUnscheduledSS] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedUnscheduledSS_v2');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [openOS, setOpenOS] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedOpenOS_v2');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [osAssetTagId, setOsAssetTagId] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedOsAssetTagId');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [ssAssetTagId, setSsAssetTagId] = useState<string[]>([]);

    const [stats, setStats] = useState(() => {
        try {
            const saved = localStorage.getItem('osdash_cachedStats');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.warn('Error reading stats from cache', e); }

        return {
            unscheduled: [
                { label: 'Hoje', count: 0, icon: 'today', color: 'text-primary' },
                { label: 'Ontem', count: 0, icon: 'history', color: 'text-primary' },
                { label: '2-7 dias', count: 0, icon: 'date_range', color: 'text-primary' },
                { label: '8-15 dias', count: 0, icon: 'date_range', color: 'text-primary' },
                { label: '16-30 dias', count: 0, icon: 'date_range', color: 'text-primary' },
                { label: '> 30 dias', count: 0, icon: 'calendar_month', color: 'text-primary' },
                { label: 'Todas', count: 0, icon: 'select_all', color: 'text-slate-500' },
            ],
            openOS: [
                { id: 2, label: 'Avaliação', count: 0, icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
                { id: 3, label: 'Autorizadas', count: 0, icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                { id: 4, label: 'Agendadas', count: 0, icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
                { id: 5, label: 'Execução', count: 0, icon: 'play_circle', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                { id: 6, label: 'Suspensas', count: 0, icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10' },
            ],
            ssSectorCounts: [] as Array<{ id: string, label: string, count: number }>,
            osSectorCounts: [] as Array<{ id: string, label: string, count: number }>
        };
    });

    useEffect(() => {
        localStorage.setItem('osdash_cachedStats', JSON.stringify(stats));
    }, [stats]);

    // Persist Filter State
    useEffect(() => {
        localStorage.setItem('advancedOrdersFilters', JSON.stringify(advancedOrdersFilters));
    }, [advancedOrdersFilters]);

    useEffect(() => {
        localStorage.setItem('appliedOrdersFilters', JSON.stringify(appliedFilters));
    }, [appliedFilters]);

    useEffect(() => {
        localStorage.setItem('hasAppliedOrdersFilters', String(hasAppliedFilters));
    }, [hasAppliedFilters]);

    // Persist Data State — só metadata compartilhada; os caches de OS/SS são
    // exclusivos da página Online e não são gravados aqui.
    useEffect(() => {
        try {
            localStorage.setItem('cachedTeams', JSON.stringify(teams));
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            localStorage.setItem('cachedFilterOptions', JSON.stringify(filterOptions));
            localStorage.setItem('cachedUnitSubTypes', JSON.stringify(unitSubTypes));
            localStorage.setItem('cachedOrderSubTypes', JSON.stringify(orderSubTypes));
            localStorage.setItem('cachedAssetTagSubs', JSON.stringify(assetTagSubs));
        } catch (e) {
            console.error('💾 Dashboard: Erro ao salvar cache no localStorage', e);
        }
    }, [teams, users, filterOptions, unitSubTypes, orderSubTypes, assetTagSubs]);

    // --- Completed OS: Temporal Helper & Load ---
    const getCompletedTemporalDateRange = useCallback((filter: CompletedTemporalFilter): { start: string; end: string } => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59, 999); return e.toISOString(); };

        switch (filter) {
            case 'today':
                return { start: today.toISOString(), end: endOfDay(today) };
            case 'yesterday': {
                const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday.toISOString(), end: endOfDay(yesterday) };
            }
            case 'thisWeek': {
                const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
                return { start: monday.toISOString(), end: endOfDay(today) };
            }
            case 'lastWeek': {
                const lastMonday = new Date(today); lastMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7);
                const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6);
                return { start: lastMonday.toISOString(), end: endOfDay(lastSunday) };
            }
            case 'thisMonth': {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                return { start: firstDay.toISOString(), end: endOfDay(today) };
            }
            case 'lastMonth': {
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start: firstDayLastMonth.toISOString(), end: endOfDay(lastDayLastMonth) };
            }
            default:
                return { start: today.toISOString(), end: endOfDay(today) };
        }
    }, []);

    const [isPendingCompleted, startCompletedTransition] = useTransition();

    const loadCompletedOS = useCallback(async () => {
        startCompletedTransition(async () => {
            try {
                const range = getCompletedTemporalDateRange(completedTemporalFilter);
                const result = await dataService.getCompletedOS({
                    startDate: range.start,
                    endDate: range.end,
                    pageSize: 200,
                    systemParentId: appliedFilters.systemParentId,
                    systemId: appliedFilters.systemId,
                    unitTypeParentId: appliedFilters.unitTypeParentId,
                    unitTypeId: appliedFilters.unitTypeId,
                    unitId: appliedFilters.unitId,
                    orderObjectId: appliedFilters.orderObjectId,
                    orderTypeId: appliedFilters.orderTypeId,
                    orderTypeSubId: appliedFilters.orderTypeSubId,
                    contractId: appliedFilters.contractId,
                    orderPlanId: appliedFilters.orderPlanId,
                    orderTeamId: appliedFilters.orderTeamId,
                    responsibleTeamId: appliedFilters.responsibleTeamId,
                    assetTagId: appliedFilters.assetTagId,
                    assetTagSubId: appliedFilters.assetTagSubId,
                    causeReasonId: appliedFilters.causeReasonId,
                    ...(providerCompanyId ? { providerCompanyId } : {}),
                });
                setCompletedOS(result);
            } catch (error) {
                console.error('Error loading completed OS:', error);
            }
        });
    }, [completedTemporalFilter, getCompletedTemporalDateRange, appliedFilters, providerCompanyId, startCompletedTransition]);

    useEffect(() => {
        localStorage.setItem('orders_dashboard_completed_temporal_filter', completedTemporalFilter);
    }, [completedTemporalFilter]);

    const completedOSMountHandled = React.useRef(false);

    // Load counts on mount (first entry only) and when filters change
    const completedOSCountsMountHandled = React.useRef(false);
    const loadCompletedOSCounts = useCallback(async () => {
        try {
            const periods: CompletedTemporalFilter[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];
            const countResults = await Promise.all(
                periods.map(async (p) => {
                    const r = getCompletedTemporalDateRange(p);
                    const res = await dataService.getCompletedOS({
                        startDate: r.start,
                        endDate: r.end,
                        pageSize: 1,
                        systemParentId: appliedFilters.systemParentId,
                        systemId: appliedFilters.systemId,
                        unitTypeParentId: appliedFilters.unitTypeParentId,
                        unitTypeId: appliedFilters.unitTypeId,
                        unitId: appliedFilters.unitId,
                        orderObjectId: appliedFilters.orderObjectId,
                        orderTypeId: appliedFilters.orderTypeId,
                        orderTypeSubId: appliedFilters.orderTypeSubId,
                        contractId: appliedFilters.contractId,
                        orderPlanId: appliedFilters.orderPlanId,
                        orderTeamId: appliedFilters.orderTeamId,
                        responsibleTeamId: appliedFilters.responsibleTeamId,
                        assetTagId: appliedFilters.assetTagId,
                        assetTagSubId: appliedFilters.assetTagSubId,
                        causeReasonId: appliedFilters.causeReasonId,
                        ...(providerCompanyId ? { providerCompanyId } : {}),
                    });
                    return { period: p, count: res.total };
                })
            );
            const counts: Record<CompletedTemporalFilter, number> = { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 };
            countResults.forEach(c => { counts[c.period] = c.count; });
            setCompletedOSCounts(counts);
        } catch (error) {
            console.error('Error loading completed OS counts:', error);
        }
    }, [getCompletedTemporalDateRange, appliedFilters, providerCompanyId]);

    const leadersByCompany = React.useMemo(() => {
        const selectedContractIds = Array.isArray(appliedFilters.contractId)
            ? appliedFilters.contractId
            : appliedFilters.contractId ? [appliedFilters.contractId] : [];

        const relevantCompanyIds = new Set<string>();
        if (selectedContractIds.length > 0 && filterOptions.contracts.length > 0) {
            filterOptions.contracts
                .filter((c: any) => selectedContractIds.includes(String(c.id)))
                .forEach((c: any) => {
                    if (c.providerCompanyId) relevantCompanyIds.add(String(c.providerCompanyId));
                });
        }

        const leaders = users
            .filter(u => u.isTeamLeader && u.statusId === 2)
            .filter(u => relevantCompanyIds.size === 0 || relevantCompanyIds.has(String(u.companyId || '')))
            .filter(u => u.isAvailable || (u.ovIdInProgress && Number(u.ovIdInProgress) > 0))
            .sort((a, b) => (a.nameShort || a.nameFull || "").localeCompare(b.nameShort || b.nameFull || ""));

        const grouped: Record<string, { companyId: string; companyName: string; companyLogoUrl?: string; leaders: User[] }> = {};

        leaders.forEach(leader => {
            const companyId = leader.companyId || 'unknown';
            if (!grouped[companyId]) {
                grouped[companyId] = {
                    companyId,
                    companyName: leader.companyName || 'Outras',
                    companyLogoUrl: leader.companyLogoUrl,
                    leaders: []
                };
            }
            grouped[companyId].leaders.push(leader);
        });

        return Object.values(grouped);
    }, [users, appliedFilters.contractId, filterOptions.contracts]);

    const handleBusyLeaderClick = useCallback(async (leader: User) => {
        const visitId = leader.ovIdInProgress?.toString();
        if (!visitId) return;
        setLoadingLeaderId(leader.id);
        try {
            const raw = await dataService.getOrderVisitById(visitId);
            if (raw) {
                const row = raw as any;
                const mapped: OrderVisit = {
                    id: row.id?.toString() || visitId,
                    oId: row.o_id?.toString() || '',
                    ovMask: row.ov_mask || '',
                    ovStatusId: row.ov_status_id || 1,
                    ovCreatedAt: row.ov_created_at || '',
                    ovCreatedUserId: row.ov_created_user_id?.toString() || '',
                    ovProcessingId: row.ov_processing_id || 1,
                    ovTeamLeadId: row.ov_team_leader_id?.toString() || '',
                    ovStartedAt: row.ov_started_at,
                    ovEndedAt: row.ov_ended_at,
                    unitDescription: row.o_unit_description,
                    systemDescription: row.o_system_description,
                    clientName: row.client_name || row.o_client_name,
                    teamLeaderName: row.ov_team_leader_name_short,
                    statusDescription: row.ov_status_description,
                    processingDescription: row.ov_processing_description,
                    ovOStatusId: row.ov_o_status_id,
                    ovOStatusDescription: row.ov_o_status_description,
                    ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
                    unitId: row.o_unit_id?.toString(),
                    orderMask: row.o_mask,
                    teamCode: row.o_team_code,
                    requestedServices: row.o_requested_services,
                    progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
                    ovDurationHours: row.ov_duration_hours ? parseFloat(row.ov_duration_hours) : 0,
                    servicesValue: row.ov_services_value ? parseFloat(row.ov_services_value) : 0,
                    materialsValue: row.ov_materials_value ? parseFloat(row.ov_materials_value) : 0,
                    vehiclesValue: row.ov_vehicles_value ? parseFloat(row.ov_vehicles_value) : 0,
                    totalValue: row.ov_total_value ? parseFloat(row.ov_total_value) : 0,
                    priorityId: row.o_priority_id?.toString(),
                    priorityCode: row.o_priority_code,
                    priorityColor: row.o_priority_color,
                    contractDescription: row.o_contract_description || row.contract_description,
                    planDescription: row.o_plan_description || row.plan_description,
                    assetTagDescription: row.o_asset_tag_description || row.asset_tag_description,
                    assetTagSubDescription: row.o_asset_tag_sub_description || row.asset_tag_sub_description,
                    typeCode: row.o_type_code,
                    typeSubCode: row.o_type_sub_code,
                } as OrderVisit;
                setModalVisit(mapped);
                const teams = await dataService.getOrderVisitTeam(visitId);
                setModalVisitTeam(teams || []);
            }
        } catch (err) {
            console.error('Error loading visit for busy leader:', err);
        } finally {
            setLoadingLeaderId(null);
        }
    }, []);



    const parseDateString = (dateStr: string | Date) => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        if (dateStr.includes('-')) return new Date(dateStr);
        const normalized = dateStr.replace(/,/g, '');
        const parts = normalized.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        return new Date(year, month - 1, day, hours, minutes, seconds);
    };

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const lastMonthRange = useMemo(() => {
        const d = new Date();
        const firstDayOfPrevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const lastDayOfPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        return {
            start: `${firstDayOfPrevMonth.getFullYear()}-${pad(firstDayOfPrevMonth.getMonth() + 1)}-${pad(firstDayOfPrevMonth.getDate())}`,
            end: `${lastDayOfPrevMonth.getFullYear()}-${pad(lastDayOfPrevMonth.getMonth() + 1)}-${pad(lastDayOfPrevMonth.getDate())}`
        };
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

    // Período padrão: mês atual (persistido por página)
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const savedStart = localStorage.getItem('orders_period_dashboard_date_start');
        const savedEnd = localStorage.getItem('orders_period_dashboard_date_end');
        if (savedStart && savedEnd) {
            return { start: savedStart, end: savedEnd };
        }
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
        const lastDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
        return { start: firstDay, end: lastDay };
    });

    useEffect(() => {
        localStorage.setItem('orders_period_dashboard_date_start', dateRange.start);
        localStorage.setItem('orders_period_dashboard_date_end', dateRange.end);
    }, [dateRange]);

    // Requery quando o período do card muda (a primeira render já busca no mount)
    const dateRangeChangedRef = React.useRef(false);
    useEffect(() => {
        if (!dateRangeChangedRef.current) {
            dateRangeChangedRef.current = true;
            return;
        }
        setCurrentPage(0);
        setHasMore(true);
        setIsFiltering(true);
        // Usa o callback do closure: o ref é atualizado por um efeito declarado
        // depois deste, então ainda estaria defasado aqui.
        fetchData(false, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempDateRange, setTempDateRange] = useState<{ start: string; end: string }>(dateRange);
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end'>('start');

    const formatDateDisplay = (dateString?: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const handleDateModalOpen = () => {
        setTempDateRange(dateRange);
        setActiveDateInput('start');
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

    // Lista filtrada localmente pelo range do card de período (bordas 00:00 / 23:59)
    const filteredOrders = React.useMemo(() => {
        const start = new Date(`${dateRange.start}T00:00:00`);
        const end = new Date(`${dateRange.end}T23:59:59`);
        return recentRequests.filter(o => {
            const date = parseDateString(o.date || o.createdDate || '');
            if (!date) return false;
            return date >= start && date <= end;
        });
    }, [recentRequests, dateRange]);

    // Client-side filter for the unscheduled SS carousel by selected sector (assetTagId)
    const displayedUnscheduledSS = React.useMemo(() => {
        if (ssAssetTagId.length === 0) return unscheduledSS;
        return unscheduledSS.filter(ss =>
            ss.assetTagId != null && ssAssetTagId.includes(ss.assetTagId.toString())
        );
    }, [unscheduledSS, ssAssetTagId]);

    const displayedOpenOS = React.useMemo(() => {
        if (osAssetTagId.length === 0) return openOS;
        return openOS.filter(os =>
            os.assetTagId != null && osAssetTagId.includes(os.assetTagId.toString())
        );
    }, [openOS, osAssetTagId]);

    // Effective filters for reports - combining persisted filters with interactive dashboard filters
    const effectiveFilters = React.useMemo(() => {
        const filters: any = {
            ...appliedFilters,
            statusId: selectedStatusId || appliedFilters.statusId,
            period: selectedPeriod || appliedFilters.period,
            causeReasonId: appliedFilters.causeReasonId,
            ...(providerCompanyId ? { providerCompanyId } : {}),
        };
        return filters;
    }, [appliedFilters, selectedStatusId, selectedPeriod]);

    // Restricted filters specifically for Unscheduled SS's (to match dashboard widgets behavior)
    const ssEffectiveFilters = React.useMemo(() => {
        const filters: any = {
            systemParentId: appliedFilters.systemParentId,
            systemId: appliedFilters.systemId,
            unitTypeParentId: appliedFilters.unitTypeParentId,
            unitTypeId: appliedFilters.unitTypeId,
            unitId: appliedFilters.unitId,
            orderTypeId: appliedFilters.orderTypeId,
            orderTypeSubId: appliedFilters.orderTypeSubId,
            assetTagId: appliedFilters.assetTagId,
            assetTagSubId: appliedFilters.assetTagSubId,
            period: selectedPeriod || appliedFilters.period,
            causeReasonId: appliedFilters.causeReasonId,
            ...(providerCompanyId ? { providerCompanyId } : {}),
        };
        return filters;
    }, [appliedFilters, selectedPeriod]);

    const osEffectiveFilters = React.useMemo(() => {
        const filters: any = {
            systemParentId: appliedFilters.systemParentId,
            systemId: appliedFilters.systemId,
            unitTypeParentId: appliedFilters.unitTypeParentId,
            unitTypeId: appliedFilters.unitTypeId,
            unitId: appliedFilters.unitId,
            orderObjectId: appliedFilters.orderObjectId,
            orderTypeId: appliedFilters.orderTypeId,
            orderTypeSubId: appliedFilters.orderTypeSubId,
            contractId: appliedFilters.contractId,
            orderPlanId: appliedFilters.orderPlanId,
            orderTeamId: appliedFilters.orderTeamId,
            responsibleTeamId: appliedFilters.responsibleTeamId,
            priorityId: appliedFilters.priorityId,
            statusId: selectedStatusId ?? undefined,
            assetTagId: osAssetTagId.length > 0 ? osAssetTagId : appliedFilters.assetTagId,
            assetTagSubId: appliedFilters.assetTagSubId,
            causeReasonId: appliedFilters.causeReasonId,
            ...(providerCompanyId ? { providerCompanyId } : {}),
        };
        return filters;
    }, [appliedFilters, selectedStatusId, osAssetTagId]);

    const completedOSEffectiveFilters = React.useMemo(() => {
        const range = getCompletedTemporalDateRange(completedTemporalFilter);
        return {
            systemParentId: appliedFilters.systemParentId,
            systemId: appliedFilters.systemId,
            unitTypeParentId: appliedFilters.unitTypeParentId,
            unitTypeId: appliedFilters.unitTypeId,
            unitId: appliedFilters.unitId,
            orderObjectId: appliedFilters.orderObjectId,
            orderTypeId: appliedFilters.orderTypeId,
            orderTypeSubId: appliedFilters.orderTypeSubId,
            contractId: appliedFilters.contractId,
            orderPlanId: appliedFilters.orderPlanId,
            orderTeamId: appliedFilters.orderTeamId,
            responsibleTeamId: appliedFilters.responsibleTeamId,
            priorityId: appliedFilters.priorityId,
            statusId: 7,
            assetTagId: appliedFilters.assetTagId,
            assetTagSubId: appliedFilters.assetTagSubId,
            startDate: range.start,
            endDate: range.end,
            causeReasonId: appliedFilters.causeReasonId,
            ...(providerCompanyId ? { providerCompanyId } : {}),
        };
    }, [appliedFilters, completedTemporalFilter, getCompletedTemporalDateRange]);

    // Filtros da lista principal — usados pela query E pelos botões de exportação,
    // para garantir que PDF/Excel reflitam exatamente o que está na tela.
    const buildOrdersListFilters = React.useCallback((overrideFilters?: any) => {
        const statusIdFromOverride = overrideFilters?.statusId !== undefined
            ? overrideFilters.statusId
            : selectedStatusId;
        const ssAssetTagFromOverride = overrideFilters?.assetTagId !== undefined
            ? overrideFilters.assetTagId
            : appliedFilters.assetTagId;

        const ordersListFilters: any = {
            ...appliedFilters,
            ...overrideFilters,
            statusId: statusIdFromOverride ?? undefined,
            assetTagId: statusIdFromOverride ? undefined : ssAssetTagFromOverride,
            ...(providerCompanyId ? { providerCompanyId } : {}),
            // Página de período: só OS (parent_id not null), todos os status,
            // limitadas ao range de requested_at do card de período,
            // em ordem crescente de requested_at (mais antigas primeiro).
            activeFilter: 'OS',
            useGeneralView: true,
            sortAscending: true,
            dateFrom: dateRange.start,
            dateTo: dateRange.end,
        };
        delete ordersListFilters.osAssetTagId;
        delete ordersListFilters.period;
        return ordersListFilters;
    }, [appliedFilters, selectedStatusId, providerCompanyId, dateRange]);

    const fetchData = useCallback(async (
        loadMore: boolean = false,
        isManual: boolean = false,
        overrideFilters?: any
    ) => {
        const ordersListFilters = buildOrdersListFilters(overrideFilters);

        try {
            let pageToFetch = 0;
            if (loadMore) {
                setIsLoadingMore(true);
                isLoadingMoreRef.current = true;
                pageToFetch = currentPageRef.current + 1;
            } else {
                if (isManual || recentRequests.length === 0) {
                    setIsLoading(true);
                }
                pageToFetch = 0;
            }

            const ordersResult: { data: Order[], hasMore: boolean, total: number } =
                await dataService.getOrdersFilters({
                    ...ordersListFilters,
                    search: searchQuery,
                    page: pageToFetch,
                    pageSize: 50
                });

            const { data: orders, hasMore: moreAvailable, total } = ordersResult;

            if (loadMore) {
                const currentList = recentRequestsRef.current;
                const existingIds = new Set(currentList.map(r => r.id));
                const newItems = orders.filter(item => !existingIds.has(item.id));

                if (newItems.length > 0) {
                    setRecentRequests((prev: any[]) => [...prev, ...newItems]);
                    setCurrentPage(pageToFetch);
                    setHasMore(moreAvailable);
                } else {
                    setHasMore(false);
                }
                isLoadingMoreRef.current = false;
            } else {
                setRecentRequests(orders);
                setHasMore(moreAvailable);
            }
            setTotalOrders(total);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setIsFiltering(false);
            isLoadingMoreRef.current = false;
        }
    }, [searchQuery, appliedFilters, selectedStatusId, hasAppliedFilters, recentRequests.length, providerCompanyId, dateRange, buildOrdersListFilters]);

    useEffect(() => {
        if (!shouldInitialLoad) return;
        const loadOptions = async () => {
            try {
                const results = await Promise.allSettled([
                    dataService.getSystemsParent(),
                    dataService.getUnitTypesParent(),
                    dataService.getOrdersObjects(),
                    dataService.getOrderTypes(),
                    dataService.getPlans(),
                    currentUser ? dataService.getManagedContracts(currentUser.id.toString()) : dataService.getContracts(),
                    dataService.getTeams(undefined, currentUser?.departmentId),
                    dataService.getUnits('active'),
                    dataService.getAssetTags('active'),
                    dataService.getOrderCauseReasons()
                ]);

                const getVal = (res: any, name: string) => {
                    if (res.status === 'rejected') {
                        console.error(`Failed to load ${name}:`, res.reason);
                        return [];
                    }
                    return res.value;
                };

                const contracts = getVal(results[5], 'contracts');

                setFilterOptions((prev: any) => ({
                    ...prev,
                    systems: getVal(results[0], 'systems'),
                    unitTypes: getVal(results[1], 'unitTypes'),
                    orderObjects: getVal(results[2], 'orderObjects'),
                    orderTypes: getVal(results[3], 'orderTypes'),
                    plans: getVal(results[4], 'plans'),
                    contracts,
                    teams: getVal(results[6], 'teams'),
                    units: getVal(results[7], 'units'),
                    sectors: getVal(results[8], 'sectors'),
                    causeReasons: getVal(results[9], 'causeReasons')
                }));

                // Pré-selecionar todos os contratos gerenciados se o usuário não definiu nenhum
                if (contracts.length > 0) {
                    const defaultContractIds = contracts.map((c: any) => String(c.id));
                    setAdvancedOrdersFilters((prev: OrderFilters) => {
                        const hasContracts = Array.isArray(prev.contractId) && prev.contractId.length > 0;
                        if (!hasContracts) return { ...prev, contractId: defaultContractIds };
                        return prev;
                    });
                    setAppliedFilters((prev: OrderFilters) => {
                        const hasContracts = Array.isArray(prev.contractId) && prev.contractId.length > 0;
                        if (!hasContracts) return { ...prev, contractId: defaultContractIds };
                        return prev;
                    });
                }

                // Populate dashboard widgets with static data
                const teamsData = getVal(results[6], 'teams');
                setTeams(teamsData.slice(0, 8));

                // Fetch users separately if not in the initial batch, or add to the batch
                const usersData = await dataService.getUsers();
                setUsers(usersData);
            } catch (err) {
                console.error("Failed to load filter options", err);
            }
        };
        loadOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldInitialLoad]);

    useEffect(() => {
        // 1. Refresh dashboard event
        const handleRefresh = () => fetchDataRef.current(false, false);
        window.addEventListener('refresh_dashboard', handleRefresh);

        // Debounced refresh: users + completed sections when orders/visits fire rapidly
        let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
        const debouncedRefreshSecondary = () => {
            if (refreshTimeout) clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(async () => {
                try {
                    dataService.clearMetadataCache();
                    const usersData = await dataService.getUsers();
                    setUsers(usersData);
                } catch (err) {
                    console.error("Failed to refresh users (debounced)", err);
                }
            }, 1000);
        };

        // 2. Realtime subscription for orders
        const subscription = dataService.subscribeToOrders(() => {
            fetchDataRef.current(false, false);
            debouncedRefreshSecondary();
        });

        // 3. Realtime subscription for visits
        const visitSubscription = dataService.subscribeToVisits(() => {
            fetchDataRef.current(false, false);
            debouncedRefreshSecondary();
        });

        // 4. Realtime subscription for users (to update status borders)
        const userSubscription = dataService.subscribeToUsers(async () => {
            try {
                dataService.clearMetadataCache();
                const usersData = await dataService.getUsers();
                setUsers(usersData);
            } catch (err) {
                console.error("Failed to refresh users in realtime", err);
            }
        });

        // Busca sempre: a query depende do range e não há cache próprio.
        // As flags de sessão (osDashboardSessionLoaded) ficam com a página Online.
        setIsFiltering(true);
        fetchDataRef.current(false, false);
        setIsLoading(false);

        return () => {
            window.removeEventListener('refresh_dashboard', handleRefresh);
            if (refreshTimeout) clearTimeout(refreshTimeout);
            if (subscription) subscription.unsubscribe();
            if (visitSubscription) visitSubscription.unsubscribe();
            if (userSubscription) userSubscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount

    useEffect(() => {
        setCurrentPage(0);
        setHasMore(true);
    }, [searchQuery, selectedPeriod, selectedStatusId, appliedFilters]);

    // Persist Advanced Filters
    useEffect(() => {
        localStorage.setItem('advancedOrdersFilters', JSON.stringify(advancedOrdersFilters));
    }, [advancedOrdersFilters]);

    // Persist Applied Query State
    useEffect(() => {
        localStorage.setItem('appliedOrdersFilters', JSON.stringify(appliedFilters));
        localStorage.setItem('hasAppliedOrdersFilters', String(hasAppliedFilters));
    }, [appliedFilters, hasAppliedFilters]);

    // Recover unitSubTypes if unitTypeParentId exists on mount (first entry only; cached later)
    useEffect(() => {
        if (!shouldInitialLoad) return;
        const recoverOptions = async () => {
            if (advancedOrdersFilters.unitTypeParentId) {
                const ids = Array.isArray(advancedOrdersFilters.unitTypeParentId)
                    ? advancedOrdersFilters.unitTypeParentId
                    : [advancedOrdersFilters.unitTypeParentId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
                    setUnitSubTypes(results.flat());
                }
            }
            if (advancedOrdersFilters.systemParentId) {
                const ids = Array.isArray(advancedOrdersFilters.systemParentId)
                    ? advancedOrdersFilters.systemParentId
                    : [advancedOrdersFilters.systemParentId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
                    setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
                }
            }
            if (advancedOrdersFilters.orderTypeId) {
                const ids = Array.isArray(advancedOrdersFilters.orderTypeId)
                    ? advancedOrdersFilters.orderTypeId
                    : [advancedOrdersFilters.orderTypeId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
                    setOrderSubTypes(results.flat());
                }
            }
        };
        recoverOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldInitialLoad]);

    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const fetchDataRef = React.useRef(fetchData);
    const loadCompletedOSRef = React.useRef(loadCompletedOS);
    const loadCompletedOSCountsRef = React.useRef(loadCompletedOSCounts);

    useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);
    useEffect(() => { loadCompletedOSRef.current = loadCompletedOS; }, [loadCompletedOS]);
    useEffect(() => { loadCompletedOSCountsRef.current = loadCompletedOSCounts; }, [loadCompletedOSCounts]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            // isFiltering: não dar loadMore enquanto a busca inicial/período está em voo
            // (senão a página 1 se misturaria com a página 0 que ainda vai chegar).
            if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading && !isFiltering) fetchDataRef.current(true);
        }, { root: null, rootMargin: '100px', threshold: 0.1 });
        observer.observe(sentinel);
        return () => { if (sentinel) observer.unobserve(sentinel); };
    }, [hasMore, isLoadingMore, isLoading, isFiltering]);

    const handleSystemChange = async (systemId: string | string[]) => {
        setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
            setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions((prev: any) => ({ ...prev, subSystems: [] }));
        }
    };

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const handleAssetTagChange = async (id: string | string[]) => {
        setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagId: id, assetTagSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map((tagId) => dataService.getAssetTagSubs(tagId, 'active')));
            setAssetTagSubs(results.flat());
        } else {
            setAssetTagSubs([]);
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, unitTypeParentId: id, unitTypeId: [], unitId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
            setUnitSubTypes(results.flat());
        } else {
            setUnitSubTypes([]);
        }
    };

    const handleQuickSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!quickSearchValue.trim()) return;

        setIsSearchingQuickly(true);
        try {
            const order = await dataService.getOrderByMask(quickSearchValue.trim());
            if (order) {
                onSelectOrder?.(order);
                setQuickSearchValue('');
            } else {
                toast.error(`Nenhuma SS ou OS encontrada com a máscara: ${quickSearchValue}`);
            }
        } catch (error) {
            console.error('Quick search error:', error);
            toast.error('Erro ao realizar busca rápida');
        } finally {
            setIsSearchingQuickly(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-[#0f172a] animate-in fade-in duration-500 relative">

            {/* Unified Header with Tabs has been moved to the Main Layout Header in App.tsx */}

            {/* VISITS VIEW */}
            {activeTab === 'VISITAS' && currentUser && (
                <div className="flex-1 overflow-hidden">
                    <OrdersVisitsDashboardAdmin
                        currentUser={currentUser}
                        onSelectVisit={onSelectVisit || (() => { })}
                        currentFilters={advancedOrdersFilters}
                        onFiltersChange={setAdvancedOrdersFilters}
                        appliedFilters={appliedFilters}
                        onAppliedFiltersChange={setAppliedFilters}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        filterBarRef={visitsFilterBarRef}
                        onActiveFiltersChange={(count) => onMobileFilterCountChange?.('VISITAS', count)}
                    />
                </div>
            )}

            {/* OS VIEW (Existing Content) */}
            {activeTab === 'OS' && (
                <>
                    {/* Horizontal Filter Bar */}
                    <div className="z-30 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                        <div className="flex flex-col p-4">
                            {/* Filters Row */}
                            <div className="flex items-center gap-2 pb-2">
                                {/* Modo de pesquisa: Período (ativo) x Online */}
                                <div className="flex items-stretch h-[42px] bg-white dark:bg-slate-800 border !border-primary rounded-xl shadow-sm overflow-hidden shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onNavigate?.('orders-dashboard-period')}
                                        title="Pesquisar por período"
                                        className="flex items-center justify-center px-3 transition-colors bg-primary/10 text-primary"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onNavigate?.(onlineScreenKey)}
                                        title="Exibir serviços em aberto com os filtros rápidos"
                                        className="flex items-center justify-center px-3 transition-colors border-l border-primary/30 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                                    </button>
                                </div>
                                <FilterBarResponsive
                                    ref={filterBarRef}
                                    advancedFilters={advancedOrdersFilters}
                                    setAdvancedFilters={setAdvancedOrdersFilters}
                                    filterSelectOptions={filterOptions}
                                    handleSystemChange={handleSystemChange}
                                    handleParentUnitTypeChange={handleParentUnitTypeChange}
                                    handleOrderTypeChange={handleOrderTypeChange}
                                    handleSectorChange={handleAssetTagChange}
                                    unitSubTypes={unitSubTypes}
                                    assetTagSubOptions={assetTagSubs}
                                    orderSubTypes={orderSubTypes}
                                    onActiveFiltersChange={(count) => { setOsFilterCount(count); onMobileFilterCountChange?.('OS', count); }}
                                    onApply={() => {
                                        const selectedContracts = Array.isArray(advancedOrdersFilters.contractId) ? advancedOrdersFilters.contractId : [];
                                        if (selectedContracts.length === 0) {
                                            toast.error('Selecione ao menos um contrato para filtrar');
                                            return;
                                        }
                                        const newFilters = { ...advancedOrdersFilters };
                                        setAppliedFilters(newFilters);
                                        setHasAppliedFilters(true);
                                        setIsFiltering(true);
                                        fetchData(false, true, newFilters);
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const selectedContracts = Array.isArray(advancedOrdersFilters.contractId) ? advancedOrdersFilters.contractId : [];
                                        if (selectedContracts.length === 0) {
                                            toast.error('Selecione ao menos um contrato para filtrar');
                                            return;
                                        }
                                        const newFilters = { ...advancedOrdersFilters };
                                        setAppliedFilters(newFilters);
                                        setHasAppliedFilters(true);
                                        setIsFiltering(true);
                                        fetchData(false, true, newFilters);
                                    }}
                                    disabled={isLoading}
                                    className="hidden md:inline-flex items-center justify-center gap-2 h-12 px-6 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                                >
                                    <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
                                        {isLoading ? 'progress_activity' : 'filter_list'}
                                    </span>
                                    <span className="tracking-wide text-sm font-bold uppercase">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
                                </button>
                            </div>

                            {/* Período Selector */}
                            <div className="flex items-center gap-3 pb-1 pt-0 mt-0">
                                <div
                                    onClick={handleDateModalOpen}
                                    className="group w-auto flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 shrink-0 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                    </div>
                                    <div className="flex flex-col items-start justify-center">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none opacity-80" style={{ marginBottom: '-2px' }}>Período de Solicitação</span>
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
                            </div>
                        </div>
                    </div>

                    {/* ── Filtering overlay ── */}
                    {isFiltering && (
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
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide">Carregando dados...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6">
                        {/* Listagem de OS's do período */}
                        <div className="mx-4 mb-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 p-4">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-lg shrink-0">OS's</h2>

                                <div className="flex items-center gap-2 shrink-0 ml-auto">
                                    <OrdersListPDFButton
                                        filters={buildOrdersListFilters()}
                                        searchQuery={searchQuery}
                                        totalCount={totalOrders}
                                    />
                                    <ExcelExportButton
                                        filters={buildOrdersListFilters()}
                                        searchQuery={searchQuery}
                                        filename="relatorio-os"
                                        title="EXCEL"
                                        totalCount={totalOrders}
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col gap-3">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-[420px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredOrders.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {filteredOrders.map((os) => (
                                        <OrderRequestCardListItem
                                            key={os.id}
                                            order={os}
                                            currentUser={currentUser}
                                            onClick={() => onSelectOrder?.(os)}
                                            onSuccess={() => fetchData(false, true)}
                                            onEdit={onEdit}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full flex items-center justify-center py-10">
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">search_off</span>
                                        <h3 className="font-black text-slate-200 text-lg mb-2">Nenhuma OS no período selecionado</h3>
                                        <p className="text-slate-400">Ajuste o período ou os filtros para visualizar resultados.</p>
                                    </div>
                                </div>
                            )}

                            {hasMore && !isLoading && (
                                <div ref={sentinelRef} className="flex items-center justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>


                    </div>

                </>
            )}

            {/* Floating Action Button + Busca — fixos à direita inferior */}
            {activeTab === 'OS' && (
                <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-50 flex items-center gap-3">
                    <form onSubmit={handleQuickSearch} className="relative group flex items-center">
                        <input
                            type="text"
                            value={quickSearchValue}
                            onChange={(e) => setQuickSearchValue(e.target.value)}
                            placeholder="Buscar SS/OS"
                            className="block w-40 lg:w-48 h-12 pl-3.5 pr-10 text-sm rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isSearchingQuickly || !quickSearchValue.trim()}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            title="Pesquisar SS/OS"
                        >
                            <span className={`material-symbols-outlined text-[20px] ${isSearchingQuickly ? 'animate-spin' : ''}`}>
                                {isSearchingQuickly ? 'progress_activity' : 'search'}
                            </span>
                        </button>
                    </form>

                    <button
                        onClick={() => filterBarRef.current?.openMobileFilters()}
                        className="relative md:hidden flex items-center justify-center h-12 w-12 bg-primary text-white hover:bg-blue-600 shadow-md rounded-full transition-all duration-200 active:scale-[0.97] active:brightness-95 font-bold flex-shrink-0 cursor-pointer select-none"
                    >
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        {osFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-sm">
                                {osFilterCount}
                            </span>
                        )}
                    </button>

                    {canCreate('services_requests_create') && !isProviderMode && (
                        <button
                            onClick={() => onCreateServiceRequest?.()}
                            className="inline-flex items-center justify-center h-12 px-4 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 active:scale-[0.98]"
                            title="Nova Solicitação de Serviço"
                        >
                            <span className="tracking-wide text-sm font-bold uppercase">Nova SS</span>
                        </button>
                    )}
                </div>
            )}

            {/* Modal: card da visita do líder ocupado */}
            <Modal
                isOpen={!!modalVisit}
                onClose={() => setModalVisit(null)}
                title="DETALHE DA VISITA"
                maxWidth="xl"
                noPadding
                draggable
            >
                {modalVisit && (
                    <div className="p-4">
                        <DashboardOrdersVisitsAdminListItem
                            visit={modalVisit}
                            teamMembers={modalVisitTeam}
                        />
                    </div>
                )}
            </Modal>

            {/* Date Range Selection Modal */}
            <Modal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                title="INFORMAR PERÍODO"
                maxWidth="sm"
                draggable
            >
                <div className="flex flex-col gap-4 px-2 pb-2 -mt-4">
                    <div className="flex w-full mb-1 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-linear-to-r from-white dark:from-slate-900 to-transparent pointer-events-none z-10 sm:hidden" />
                        <div className="absolute right-0 top-0 bottom-0 w-3 bg-linear-to-l from-white dark:from-slate-900 to-transparent pointer-events-none z-10 sm:hidden" />
                        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 w-full justify-start sm:justify-center items-center snap-x snap-mandatory px-2">
                            {(() => {
                                const isLastMonth = tempDateRange.start === lastMonthRange.start && tempDateRange.end === lastMonthRange.end;
                                const isCurrentMonth = tempDateRange.start === currentMonthRange.start && tempDateRange.end === currentMonthRange.end;
                                const isToday = tempDateRange.start === todayStr && tempDateRange.end === todayStr;
                                return (
                                    <>
                                        <button
                                            onClick={() => { setTempDateRange(lastMonthRange); setActiveDateInput('start'); }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isLastMonth ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isLastMonth && 'text-primary'}`}>calendar_month</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Mês Passado</span>
                                        </button>
                                        <button
                                            onClick={() => { setTempDateRange(currentMonthRange); setActiveDateInput('start'); }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isCurrentMonth ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isCurrentMonth && 'text-primary'}`}>calendar_today</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Mês Atual</span>
                                        </button>
                                        <button
                                            onClick={() => { setTempDateRange({ start: todayStr, end: todayStr }); setActiveDateInput('start'); }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isToday ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isToday && 'text-primary'}`}>today</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Hoje</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setActiveDateInput('start')}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${activeDateInput === 'start' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDateInput === 'start' ? 'text-primary' : 'text-slate-400'}`}>Início</span>
                                <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                            </div>
                            <span className={`text-sm font-bold ${tempDateRange.start ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                                {formatDateDisplay(tempDateRange.start) || 'Selecionar'}
                            </span>
                        </div>
                        <div
                            onClick={() => setActiveDateInput('end')}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${activeDateInput === 'end' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDateInput === 'end' ? 'text-primary' : 'text-slate-400'}`}>Fim</span>
                                <span className="material-symbols-outlined text-sm text-slate-400">event</span>
                            </div>
                            <span className={`text-sm font-bold ${tempDateRange.end ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                                {formatDateDisplay(tempDateRange.end) || 'Selecionar'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 shadow-sm">
                        <Calendar
                            value={tempDateRange[activeDateInput]}
                            onChange={(date) => {
                                setTempDateRange(prev => ({ ...prev, [activeDateInput]: date }));
                                if (activeDateInput === 'start') setActiveDateInput('end');
                            }}
                            rangeStart={tempDateRange.start}
                            rangeEnd={tempDateRange.end}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handleDateModalApply}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            Aplicar Período de Solicitação
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
