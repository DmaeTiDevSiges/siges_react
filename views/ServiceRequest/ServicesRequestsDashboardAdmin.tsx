import React, { useState, useEffect, useCallback } from 'react';
import { User, OrderFilters, Order, Company } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderRequestCardListItem } from '../../components/orderRequests/OrderRequestCardListItem';
import { ServiceRequestCardListItem } from '../../components/serviceRequests/ServiceRequestCardListItem';
import { Avatar } from '../../components/ui/Avatar';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { useOrderFollow } from '../../hooks/useOrderFollow';
import { DashboardOrdersVisitsAdminScreen } from '../../views/Dashboards/DashboardOrdersVisitsAdminScreen';
import { OrderVisit } from '../../types';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { OrdersListPDFButton } from '../../components/reports/OrdersListPDFButton';
import { ExcelExportButton } from '../../components/reports/ExcelExportButton';
import { RequestsListPDFButton } from '../../components/reports/RequestsListPDFButton';
import { RequestsExcelExportButton } from '../../components/reports/RequestsExcelExportButton';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { TreeFilterSelect } from '../../components/ui/TreeFilterSelect';
import { Loading } from '../../components/ui/Loading';


interface ServicesRequestsDashboardAdminProps {
    currentUser: User | null;
    onSelectOrder?: (order: Order) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onTrackUsers?: (company: Company) => void;
    onCreateServiceRequest?: () => void;
    onNavigate?: (path: string) => void;
    onEdit?: (order: Order) => void;
    activeTab?: 'OS' | 'VISITAS';
}

export const ServicesRequestsDashboardAdmin: React.FC<ServicesRequestsDashboardAdminProps> = ({ currentUser, onSelectOrder, onSelectVisit, onTrackUsers, onCreateServiceRequest, onNavigate, onEdit, activeTab = 'OS' }) => {

    // We removed the internal activeTab state and the header tabs. activeTab is now controlled by props.
    const filtersScroll = useDraggableScroll();
    const unscheduledSSScroll = useDraggableScroll();
    const openOSScroll = useDraggableScroll();
    const osSectorScroll = useDraggableScroll();
    const openOSCarouselScroll = useDraggableScroll();
    const leadersScroll = useDraggableScroll();
    const ssSectorScroll = useDraggableScroll();

    const { canCreate, canView } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [quickSearchValue, setQuickSearchValue] = useState('');
    const [isSearchingQuickly, setIsSearchingQuickly] = useState(false);
    // Data Cache (Persisted)
    const [recentRequests, setRecentRequests] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('cachedRecentRequests_v3');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [isLoading, setIsLoading] = useState(() => {
        // Only start loading if we have no cache to show
        const saved = localStorage.getItem('cachedRecentRequests_v3');
        return !(saved && JSON.parse(saved).length > 0);
    });
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
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>('Hoje');

    // Use the custom hook for follow functionality
    const { followedOrderIds, isOrderFollowed, toggleFollow } = useOrderFollow(currentUser?.id);

    // Pagination state for infinite scroll
    const [currentPage, setCurrentPage] = useState(() => {
        return Number(localStorage.getItem('cachedCurrentPage_v2')) || 0;
    });
    const [hasMore, setHasMore] = useState(() => {
        const saved = localStorage.getItem('cachedHasMore_v2');
        return saved ? saved === 'true' : true;
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [totalOrders, setTotalOrders] = useState(() => {
        return Number(localStorage.getItem('cachedTotalOrders_v2')) || 0;
    });


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
            teams: [] as any[]
        };
    });

    // Create SS State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        filterKey: keyof OrderFilters;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        filterKey: 'orderTypeId',
        label: '',
        options: [],
        currentValue: []
    });
    const [selectionSearch, setSelectionSearch] = useState('');
    const [unscheduledSS, setUnscheduledSS] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('cachedUnscheduledSS_v3');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [openOS, setOpenOS] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('cachedOpenOS_v1');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [osAssetTagId, setOsAssetTagId] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('cachedOsAssetTagId_v1');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [stats, setStats] = useState(() => {
        try {
            const saved = localStorage.getItem('cachedStats');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.warn('Error reading stats from cache', e); }

        return {
            unscheduled: [
                { label: 'Hoje', count: 0 },
                { label: 'Ontem', count: 0 },
                { label: '2-7 dias', count: 0 },
                { label: '8-15 dias', count: 0 },
                { label: '16-30 dias', count: 0 },
                { label: '> 30 dias', count: 0 },
            ],
            openOS: [
                { id: 2, label: 'AvaliaÃ§Ã£o', count: 0, icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
                { id: 3, label: 'Autorizadas', count: 0, icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                { id: 4, label: 'Agendadas', count: 0, icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
                { id: 5, label: 'ExecuÃ§Ã£o', count: 0, icon: 'engineering', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                { id: 6, label: 'Suspensas', count: 0, icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10' },
            ],
            ssSectorCounts: [] as Array<{ id: string, label: string, count: number }>,
            osSectorCounts: [] as Array<{ id: string, label: string, count: number }>
        };
    });

    useEffect(() => {
        localStorage.setItem('cachedStats', JSON.stringify(stats));
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

    // Persist Data State (Moved here to ensure all state vars are declared)
    useEffect(() => {
        try {
            localStorage.setItem('cachedRecentRequests_v3', JSON.stringify(recentRequests));
            localStorage.setItem('cachedCurrentPage_v2', String(currentPage));
            localStorage.setItem('cachedHasMore_v2', String(hasMore));
            localStorage.setItem('cachedTotalOrders_v2', String(totalOrders));
            localStorage.setItem('cachedUnscheduledSS_v3', JSON.stringify(unscheduledSS));
            localStorage.setItem('cachedOpenOS_v1', JSON.stringify(openOS));
            localStorage.setItem('cachedOsAssetTagId_v1', JSON.stringify(osAssetTagId));
            localStorage.setItem('cachedTeams', JSON.stringify(teams));
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            localStorage.setItem('cachedFilterOptions', JSON.stringify(filterOptions));
        } catch (e) {
            console.error('ðŸ’¾ Dashboard: Erro ao salvar cache no localStorage', e);
        }
    }, [recentRequests, currentPage, hasMore, totalOrders, unscheduledSS, openOS, osAssetTagId, teams, users, filterOptions]);

    const leadersByCompany = React.useMemo(() => {
        const selectedContractIds = Array.isArray(appliedFilters.contractId)
            ? appliedFilters.contractId
            : appliedFilters.contractId ? [appliedFilters.contractId] : [];

        const relevantCompanyIds = new Set<string>();
        if (selectedContractIds.length > 0 && filterOptions.contracts.length > 0) {
            filterOptions.contracts
                .filter((c: any) => selectedContractIds.includes(String(c.id)))
                .forEach((c: any) => {
                    if (c.providerCompanyId) relevantCompanyIds.add(c.providerCompanyId);
                });
        }

        const leaders = users
            .filter(u => u.isTeamLeader && u.statusId === 2)
            .filter(u => relevantCompanyIds.size === 0 || relevantCompanyIds.has(u.companyId || ''))
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

    // Local Filtered list derived from cached full list
    const filteredOrders = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const sixteenDaysAgo = new Date(today);
        sixteenDaysAgo.setDate(today.getDate() - 16);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return recentRequests.filter(o => {
            // Apply Period filter (Mostly for SS's)
            if (selectedPeriod) {
                if (o.parentId || o.statusId !== 1) return false;
                const date = parseDateString(o.date || o.createdDate || '');
                if (!date) return false;
                if (selectedPeriod === 'Hoje') return date >= today;
                if (selectedPeriod === 'Ontem') return date >= yesterday && date < today;
                if (selectedPeriod === '2-7 dias') return date >= sevenDaysAgo && date < yesterday;
                if (selectedPeriod === '8-15 dias') return date >= fifteenDaysAgo && date < sevenDaysAgo;
                if (selectedPeriod === '16-30 dias') return date >= thirtyDaysAgo && date < fifteenDaysAgo;
                if (selectedPeriod === '> 30 dias') return date < thirtyDaysAgo;
                return true;
            }
            return true;
        });
    }, [recentRequests, selectedStatusId, selectedPeriod]);

    // Client-side filter for the unscheduled SS carousel by selected sector (assetTagId)
    const displayedUnscheduledSS = React.useMemo(() => {
        const activeTagIds = Array.isArray(appliedFilters.assetTagId)
            ? appliedFilters.assetTagId
            : appliedFilters.assetTagId
                ? [appliedFilters.assetTagId]
                : [];
        if (activeTagIds.length === 0) return unscheduledSS;
        return unscheduledSS.filter(ss =>
            ss.assetTagId != null && activeTagIds.includes(ss.assetTagId.toString())
        );
    }, [unscheduledSS, appliedFilters.assetTagId]);

    const displayedOpenOS = React.useMemo(() => {
        if (osAssetTagId.length === 0) return openOS;
        return openOS.filter(os =>
            os.assetTagId != null && osAssetTagId.includes(os.assetTagId.toString())
        );
    }, [openOS, osAssetTagId]);

    // Effective filters for reports - combining persisted filters with interactive dashboard filters
    const effectiveFilters = React.useMemo(() => {
        return {
            ...appliedFilters,
            statusId: selectedStatusId || appliedFilters.statusId,
            period: selectedPeriod || appliedFilters.period
        };
    }, [appliedFilters, selectedStatusId, selectedPeriod]);

    // Restricted filters specifically for Unscheduled SS's (to match dashboard widgets behavior)
    const ssEffectiveFilters = React.useMemo(() => {
        return {
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
        };
    }, [appliedFilters, selectedPeriod]);

    const osEffectiveFilters = React.useMemo(() => {
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
            priorityId: appliedFilters.priorityId,
            statusId: selectedStatusId ?? undefined,
            assetTagId: osAssetTagId.length > 0 ? osAssetTagId : appliedFilters.assetTagId,
            assetTagSubId: appliedFilters.assetTagSubId,
        };
    }, [appliedFilters, selectedStatusId, osAssetTagId]);

    const fetchData = useCallback(async (
        loadMore: boolean = false,
        isManual: boolean = false,
        overrideFilters?: any
    ) => {
        const statusIdFromOverride = overrideFilters?.statusId !== undefined
            ? overrideFilters.statusId
            : selectedStatusId;
        const periodFromOverride = overrideFilters?.period !== undefined
            ? overrideFilters.period
            : selectedPeriod;
        const ssAssetTagFromOverride = overrideFilters?.assetTagId !== undefined
            ? overrideFilters.assetTagId
            : appliedFilters.assetTagId;
        const osAssetTagFromOverride = overrideFilters?.osAssetTagId !== undefined
            ? overrideFilters.osAssetTagId
            : osAssetTagId;

        const ordersListFilters: any = {
            ...appliedFilters,
            ...overrideFilters,
            statusId: statusIdFromOverride ?? undefined,
            period: statusIdFromOverride ? undefined : (periodFromOverride ?? undefined),
            assetTagId: statusIdFromOverride ? undefined : ssAssetTagFromOverride,
        };
        delete ordersListFilters.osAssetTagId;

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

            let ordersResult: { data: Order[], hasMore: boolean, total: number };
            let statsResult: any = null;
            let unscheduledSSResult: Order[] = [];
            let openOSResult: Order[] = [];

             const restrictedSSFilters = {
                 systemParentId: ordersListFilters.systemParentId,
                 systemId: ordersListFilters.systemId,
                 unitTypeParentId: ordersListFilters.unitTypeParentId,
                 unitTypeId: ordersListFilters.unitTypeId,
                 unitId: ordersListFilters.unitId,
                 orderTypeId: ordersListFilters.orderTypeId,
                 orderTypeSubId: ordersListFilters.orderTypeSubId,
                 period: periodFromOverride ?? undefined,
                 search: searchQuery || undefined,
             };

             const unscheduledSSFilters = {
                 ...restrictedSSFilters,
                 assetTagId: ssAssetTagFromOverride,
                 assetTagSubId: ordersListFilters.assetTagSubId,
             };

             // statsOSFilters: WITHOUT assetTagId so sector cards always show all sectors
             const statsOSFilters = {
                 systemParentId: ordersListFilters.systemParentId,
                 systemId: ordersListFilters.systemId,
                 unitTypeParentId: ordersListFilters.unitTypeParentId,
                 unitTypeId: ordersListFilters.unitTypeId,
                 unitId: ordersListFilters.unitId,
                 orderObjectId: ordersListFilters.orderObjectId,
                 orderTypeId: ordersListFilters.orderTypeId,
                 orderTypeSubId: ordersListFilters.orderTypeSubId,
                 contractId: ordersListFilters.contractId,
                 orderPlanId: ordersListFilters.orderPlanId,
                 orderTeamId: ordersListFilters.orderTeamId,
                 priorityId: ordersListFilters.priorityId,
                 statusId: statusIdFromOverride ?? undefined,
                 // assetTagId intentionally omitted â€” sector cards must always show all sectors
                 search: searchQuery || undefined,
             };

             // openOSFilters: WITH assetTagId and assetTagSubId to filter the carousel by selected sector/position
             const openOSFilters = {
                 ...statsOSFilters,
                 assetTagId: osAssetTagFromOverride?.length ? osAssetTagFromOverride : ordersListFilters.assetTagId,
                 assetTagSubId: ordersListFilters.assetTagSubId,
             };
 
             if (loadMore) {
                 // When loading more, we ONLY need the next page of orders
                 ordersResult = await dataService.getOrdersFilters({
                     search: searchQuery,
                     ...ordersListFilters,
                     page: pageToFetch,
                     pageSize: 50
                 });
             } else {
                 // When filtering/loading initial, we execute ALL requests in parallel for maximum speed
                 const [pOrders, pStats, pUnscheduled, pOpenOS] = await Promise.all([
                     dataService.getOrdersFilters({
                         search: searchQuery,
                         ...ordersListFilters,
                         page: 0,
                         pageSize: 50
                     }),
                     dataService.getDashboardStats(
                         { search: searchQuery, ...appliedFilters },
                         restrictedSSFilters,
                         statsOSFilters   // uses filters WITHOUT assetTagId â†’ all sectors always visible
                     ),
                     dataService.getUnscheduledSS(unscheduledSSFilters),
                     dataService.getOpenOS(openOSFilters)
                 ]);

                ordersResult = pOrders;
                statsResult = pStats;
                unscheduledSSResult = pUnscheduled;
                openOSResult = pOpenOS;
            }

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
                // Logic for initial load / filter update

                // 1. Update Stats
                if (statsResult) {
                    setStats({
                        unscheduled: [
                            { label: 'Hoje', count: statsResult.ssCounts.today },
                            { label: 'Ontem', count: statsResult.ssCounts.yesterday },
                            { label: '2-7 dias', count: statsResult.ssCounts.sevenDays },
                            { label: '8-15 dias', count: statsResult.ssCounts.fifteenDays },
                            { label: '16-30 dias', count: statsResult.ssCounts.between16And30 },
                            { label: '> 30 dias', count: statsResult.ssCounts.moreThan30 },
                        ],
                        openOS: [
                            { id: 2, label: 'AvaliaÃ§Ã£o', count: statsResult.osCounts[2] || 0, icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
                            { id: 3, label: 'Autorizadas', count: statsResult.osCounts[3] || 0, icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                            { id: 4, label: 'Agendadas', count: statsResult.osCounts[4] || 0, icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
                            { id: 5, label: 'ExecuÃ§Ã£o', count: statsResult.osCounts[5] || 0, icon: 'engineering', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                            { id: 6, label: 'Suspensas', count: statsResult.osCounts[6] || 0, icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10' },
                        ],
                        ssSectorCounts: statsResult.ssSectorCounts || [],
                        osSectorCounts: statsResult.osSectorCounts || []
                    });
                }

                // 2. Update Unscheduled SS
                setUnscheduledSS(unscheduledSSResult);

                // 3. Update Open OS carousel
                setOpenOS(openOSResult);

                // 4. Update Main List
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
    }, [searchQuery, appliedFilters, selectedStatusId, selectedPeriod, osAssetTagId, hasAppliedFilters, recentRequests.length]);

    useEffect(() => {
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
                    dataService.getAssetTags('active')
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
                    sectors: getVal(results[8], 'sectors')
                }));

                // PrÃ©-selecionar todos os contratos gerenciados se o usuÃ¡rio nÃ£o definiu nenhum
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
    }, []);

    // Track if we have already handled the initial cache check
    const initialCacheSkipDone = React.useRef(false);

     useEffect(() => {
         // 1. Refresh dashboard event
         const handleRefresh = () => fetchDataRef.current(false, false);
         window.addEventListener('refresh_dashboard', handleRefresh);
 
         // Debounced user refresh to avoid excessive calls when orders/visits fire rapidly
         let userRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
         const debouncedRefreshUsers = () => {
             if (userRefreshTimeout) clearTimeout(userRefreshTimeout);
             userRefreshTimeout = setTimeout(async () => {
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
         const subscription = dataService.subscribeToOrders((payload) => {
             fetchDataRef.current(false, false);
             debouncedRefreshUsers();
         });
 
         // 3. Realtime subscription for visits
         const visitSubscription = dataService.subscribeToVisits((payload) => {
             fetchDataRef.current(false, false);
             debouncedRefreshUsers();
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
 
         // 5. Periodic polling fallback (every 30s) — refreshes dashboard data + users even if Realtime is down
         const pollingInterval = setInterval(() => {
             try {
                 fetchDataRef.current(false, false);
                 debouncedRefreshUsers();
             } catch (err) {
                 // Silent fail for polling
             }
         }, 30000);
 
         // 6. Refresh immediately when user returns to the tab (fixes browser throttling of setInterval in background tabs)
         let lastRefreshTime = 0;
         const handleVisibilityChange = () => {
             if (document.visibilityState === 'visible') {
                 const now = Date.now();
                 if (now - lastRefreshTime > 5000) {
                     lastRefreshTime = now;
                     fetchDataRef.current(false, false);
                     debouncedRefreshUsers();
                 }
             }
         };
         document.addEventListener('visibilitychange', handleVisibilityChange);
 
         // CONTROLLED INITIAL LOAD - Always fetch on mount for REALTIME consistency
         fetchDataRef.current(false, false);
         setIsLoading(false);
 
         return () => {
             window.removeEventListener('refresh_dashboard', handleRefresh);
             document.removeEventListener('visibilitychange', handleVisibilityChange);
             if (userRefreshTimeout) clearTimeout(userRefreshTimeout);
             if (subscription) subscription.unsubscribe();
             if (visitSubscription) visitSubscription.unsubscribe();
             if (userSubscription) userSubscription.unsubscribe();
             clearInterval(pollingInterval);
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

    // Recover unitSubTypes if unitTypeParentId exists on mount
    useEffect(() => {
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
    }, []);

    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const fetchDataRef = React.useRef(fetchData);

    useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) fetchDataRef.current(true);
        }, { root: null, rootMargin: '100px', threshold: 0.1 });
        observer.observe(sentinel);
        return () => { if (sentinel) observer.unobserve(sentinel); };
    }, [hasMore, isLoadingMore, isLoading]);

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

    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);
    const [assetTagSubs, setAssetTagSubs] = useState<any[]>([]);

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

    const openSelectionModal = (key: keyof OrderFilters, label: string, options: { value: string; label: string }[]) => {
        const value = advancedOrdersFilters[key];
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
        setSelectionSearch('');
    };

    const handleModalConfirm = (value: string[]) => {
        const key = selectionModal.filterKey;
        const finalValue = key === 'statusId' ? (value[0] ? Number(value[0]) : null) : value;

        if (key === 'systemParentId') {
            handleSystemChange(finalValue as string | string[]);
        } else if (key === 'unitTypeParentId') {
            handleParentUnitTypeChange(finalValue as string | string[]);
        } else if (key === 'orderTypeId') {
            handleOrderTypeChange(finalValue as string | string[]);
        } else if (key === 'assetTagId') {
            handleAssetTagChange(finalValue as string | string[]);
        } else {
            setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, [key]: finalValue }));
        }
        setSelectionModal((prev: any) => ({ ...prev, isOpen: false }));
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
                toast.error(`Nenhuma SS ou OS encontrada com a mÃ¡scara: ${quickSearchValue}`);
            }
        } catch (error) {
            console.error('Quick search error:', error);
            toast.error('Erro ao realizar busca rÃ¡pida');
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
                    <DashboardOrdersVisitsAdminScreen
                        currentUser={currentUser}
                        onSelectVisit={onSelectVisit || (() => { })}
                        currentFilters={advancedOrdersFilters}
                        onFiltersChange={setAdvancedOrdersFilters}
                        appliedFilters={appliedFilters}
                        onAppliedFiltersChange={setAppliedFilters}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                    />
                </div>
            )}

            {/* OS VIEW (Existing Content) */}
            {activeTab === 'OS' && (
                <>
                    {/* Horizontal Filter Bar */}
                    <div className="z-30 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                        <div className="flex flex-col p-4 gap-2">
                            {/* Filters Row */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={filtersScroll.ref}
                                    onMouseDown={filtersScroll.onMouseDown}
                                    onTouchStart={filtersScroll.onTouchStart}
                                    onClickCapture={filtersScroll.onClickCapture}>
                                    <FilterSelect
                                        label="SISTEMA"
                                        value={advancedOrdersFilters.systemParentId || []}
                                        onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => handleSystemChange([])}
                                    />
                                    <FilterSelect
                                        label="SUB-SISTEMA"
                                        value={advancedOrdersFilters.systemId || []}
                                        onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, systemId: [] }))}
                                        hidden={!advancedOrdersFilters.systemParentId || (Array.isArray(advancedOrdersFilters.systemParentId) && advancedOrdersFilters.systemParentId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="TIPO UNIDADE"
                                        value={advancedOrdersFilters.unitTypeParentId || []}
                                        onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => handleParentUnitTypeChange([])}
                                    />
                                    <FilterSelect
                                        label="SUB-TIPO UNIDADE"
                                        value={advancedOrdersFilters.unitTypeId || []}
                                        onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, unitTypeId: [] }))}
                                        hidden={!advancedOrdersFilters.unitTypeParentId || (Array.isArray(advancedOrdersFilters.unitTypeParentId) && advancedOrdersFilters.unitTypeParentId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="UNIDADES"
                                        value={advancedOrdersFilters.unitId || []}
                                        onClick={() => openSelectionModal('unitId', 'UNIDADES', filterOptions.units.map(opt => ({ value: String(opt.id), label: opt.description_full || opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, unitId: [] }))}
                                    />
                                    <FilterSelect
                                        label="SETORES"
                                        value={advancedOrdersFilters.assetTagId || []}
                                        onClick={() => openSelectionModal('assetTagId', 'SETORES', filterOptions.sectors.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => {
                                            handleAssetTagChange([]);
                                        }}
                                    />
                                    <FilterSelect
                                        label="POSIÇÕES"
                                        value={advancedOrdersFilters.assetTagSubId || []}
                                        onClick={() => openSelectionModal('assetTagSubId', 'POSIÇÕES', assetTagSubs.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagSubId: [] }))}
                                        hidden={!advancedOrdersFilters.assetTagId || (Array.isArray(advancedOrdersFilters.assetTagId) && advancedOrdersFilters.assetTagId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="FINALIDADE"
                                        value={advancedOrdersFilters.orderObjectId || []}
                                        onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterOptions.orderObjects.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderObjectId: [] }))}
                                    />
                                    <FilterSelect
                                        label="TIPO OS"
                                        value={advancedOrdersFilters.orderTypeId || []}
                                        onClick={() => openSelectionModal('orderTypeId', 'TIPO OS', filterOptions.orderTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => handleOrderTypeChange([])}
                                    />
                                    <FilterSelect
                                        label="SUB-TIPO OS"
                                        value={advancedOrdersFilters.orderTypeSubId || []}
                                        onClick={() => openSelectionModal('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderTypeSubId: [] }))}
                                        hidden={!advancedOrdersFilters.orderTypeId || (Array.isArray(advancedOrdersFilters.orderTypeId) && advancedOrdersFilters.orderTypeId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="CONTRATO"
                                        value={advancedOrdersFilters.contractId || []}
                                        onClick={() => openSelectionModal('contractId', 'CONTRATO', filterOptions.contracts.map(opt => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, contractId: [] }))}
                                        required
                                    />
                                    <FilterSelect
                                        label="PLANO"
                                        value={advancedOrdersFilters.orderPlanId || []}
                                        onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterOptions.plans.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderPlanId: [] }))}
                                    />
                                    <TreeFilterSelect
                                        label="EQ.RESPONSAVEL"
                                        value={advancedOrdersFilters.orderTeamId || []}
                                        options={filterOptions.teams.map(opt => ({ value: String(opt.id), label: opt.name || opt.description, parentId: opt.parentId }))}
                                        onChange={(vals) => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderTeamId: vals }))}
                                        onClear={() => setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderTeamId: [] }))}
                                    />
                                </div>

                                {/* Filtrar — fixo à direita */}
                                <div className="flex items-center gap-2 shrink-0 ml-auto">
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
                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none group"
                                    >
                                        <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                                            {isLoading ? 'progress_activity' : 'filter_list'}
                                        </span>
                                        <span className="text-[13px] uppercase tracking-wide">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Cards de Empresas / Líderes — dentro do header */}
                            <div
                                className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                ref={leadersScroll.ref}
                                onMouseDown={leadersScroll.onMouseDown}
                                onTouchStart={leadersScroll.onTouchStart}
                                onClickCapture={leadersScroll.onClickCapture}>

                                {leadersByCompany.map((group) => (
                                    <div key={group.companyId} className="flex flex-col gap-2 shrink-0 p-3 bg-white dark:bg-slate-800/40 rounded-[12px] border border-slate-100 dark:border-white/5 shadow-sm min-w-[200px] w-max max-w-none">
                                        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-white/5 pb-1.5 relative">
                                            <CompanyAvatar src={group.companyLogoUrl} name={group.companyName} size="xs" className="scale-75 -ml-1 text-[10px]" />
                                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate flex-1 leading-tight pr-6">
                                                {group.companyName}
                                            </p>
                                            {canView('dashboard_orders_users_tracker') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTrackUsers?.({
                                                        id: group.companyId,
                                                        name: group.companyName,
                                                        logoUrl: group.companyLogoUrl || '',
                                                        emailSuffix: '',
                                                        logoPath: '',
                                                        logoName: '',
                                                        status: 'active',
                                                        category: '',
                                                        phone: '',
                                                        location: '',
                                                        cnpj: '',
                                                        contractCount: 0,
                                                        code: ''
                                                    });
                                                }}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors z-10"
                                                title="Rastrear Usuários"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                            </button>
                                            )}
                                        </div>
                                        <div className="flex gap-4 overflow-visible py-1 px-1">
                                            {group.leaders.map((leader) => (
                                                <div key={leader.id} className="flex flex-col items-center gap-1 group cursor-default shrink-0">
                                                    <UserAvatar
                                                        src={leader.avatarUrl}
                                                        name={leader.nameShort || leader.nameFull || ''}
                                                        size="sm"
                                                        status={(leader.ovIdInProgress && Number(leader.ovIdInProgress) > 0) ? 'busy' : (leader.isAvailable ? 'available' : 'unavailable')}
                                                        className="shadow-sm transition-transform group-hover:scale-110"
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight truncate max-w-[56px]">
                                                        {leader.nameShort || leader.nameFull}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* â”€â”€ Filtering overlay â”€â”€ */}
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
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide">Aplicando filtros selecionados...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6">
                        <section className="px-4 pt-1 pb-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-xl">SS's NÃ£o Programadas</h2>
                                <div className="flex items-center gap-2">
                                    <RequestsListPDFButton
                                        filters={ssEffectiveFilters}
                                        searchQuery={searchQuery}
                                        totalCount={
                                            selectedPeriod
                                                ? (stats.unscheduled.find(p => p.label === selectedPeriod)?.count || 0)
                                                : stats.unscheduled.reduce((acc, curr) => acc + curr.count, 0)
                                        }
                                    />
                                    <RequestsExcelExportButton
                                        filters={ssEffectiveFilters}
                                        searchQuery={searchQuery}
                                        filename="relatorio-ss"
                                        title="EXCEL"
                                        totalCount={
                                            selectedPeriod
                                                ? (stats.unscheduled.find(p => p.label === selectedPeriod)?.count || 0)
                                                : stats.unscheduled.reduce((acc, curr) => acc + curr.count, 0)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 pb-3 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto">
                                {stats.unscheduled.map((item, idx) => (
                                    <div key={idx} onClick={() => {
                                        // Period cards are exclusive selectors (no toggle/deselect to null).
                                        // Clicking any period always sets it as active.
                                        // Clicking the already-active period just clears the sector filter.
                                        const clickedPeriod = item.label;
                                        setSelectedPeriod(clickedPeriod);
                                        setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagId: [] }));
                                        setAppliedFilters((prev: OrderFilters) => ({ ...prev, assetTagId: [] }));
                                        fetchData(false, true, { ...appliedFilters, period: clickedPeriod, assetTagId: [] });
                                    }}
                                        className={`backdrop-blur-sm p-3 rounded-[12px] border shadow-sm hover:shadow-md transition-all group shrink-0 w-[110px] cursor-pointer
                                    ${selectedPeriod === item.label ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}
                                `}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{item.count}</span>
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                                        </div>
                                        <p className={`text-[10px] font-bold ${selectedPeriod === item.label ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            {stats.ssSectorCounts && stats.ssSectorCounts.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 pb-3 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={ssSectorScroll.ref}
                                    onMouseDown={ssSectorScroll.onMouseDown}
                                    onTouchStart={ssSectorScroll.onTouchStart}
                                    onClickCapture={ssSectorScroll.onClickCapture}>
                                    {stats.ssSectorCounts.map((item, idx) => {
                                        const currentAssetTagIds = Array.isArray(advancedOrdersFilters.assetTagId)
                                            ? advancedOrdersFilters.assetTagId
                                            : advancedOrdersFilters.assetTagId
                                                ? [advancedOrdersFilters.assetTagId]
                                                : [];
                                        const isSelected = currentAssetTagIds.includes(item.id);
                                        
                                        return (
                                            <div key={idx} onClick={() => {
                                                const newAssetTagId = isSelected
                                                    ? currentAssetTagIds.filter((id) => id !== item.id)
                                                    : [...currentAssetTagIds, item.id];
                                                setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagId: newAssetTagId }));
                                                setAppliedFilters((prev: OrderFilters) => ({ ...prev, assetTagId: newAssetTagId }));
                                                // Pass period explicitly so it is not lost in the override merge
                                                fetchData(false, true, { ...appliedFilters, period: selectedPeriod, assetTagId: newAssetTagId });
                                            }}
                                                className={`backdrop-blur-sm p-3 rounded-[12px] border shadow-sm hover:shadow-md transition-all group shrink-0 w-auto min-w-[140px] max-w-[200px] cursor-pointer
                                                    ${isSelected ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}
                                                `}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className={`text-[11px] font-bold truncate flex-1 ${isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} title={item.label}>
                                                        {item.label}
                                                    </p>
                                                    <span className="text-[16px] font-black text-slate-900 dark:text-white shrink-0">{item.count}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {displayedUnscheduledSS.length > 0 && (
                            <section className="px-4 py-0">

                                <div className="flex gap-4 overflow-x-auto no-scrollbar pt-2 pb-[15px] px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={unscheduledSSScroll.ref}
                                    onMouseDown={unscheduledSSScroll.onMouseDown}
                                    onTouchStart={unscheduledSSScroll.onTouchStart}
                                    onClickCapture={unscheduledSSScroll.onClickCapture}>
                                    {displayedUnscheduledSS.map((ss) => (
                                        <div key={ss.id} className="min-w-[352px] max-w-[352px] shrink-0 h-[420px]">
                                            <ServiceRequestCardListItem
                                                order={ss}
                                                onClick={() => onSelectOrder?.(ss)}
                                                isFollowed={followedOrderIds.includes(ss.id)}
                                                onToggleFollow={() => toggleFollow(ss.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="px-4 py-0 mt-0">
                            {(() => {
                                // Priority: selected sectors > selected status > total
                                // osSectorCounts is fetched with statusId but WITHOUT assetTagId,
                                // so sector counts already reflect the active status filter.
                                const osTotalCount = osAssetTagId.length > 0
                                    ? stats.osSectorCounts
                                        .filter(s => osAssetTagId.includes(s.id))
                                        .reduce((acc, s) => acc + s.count, 0)
                                    : selectedStatusId
                                        ? (stats.openOS.find(s => s.id === selectedStatusId)?.count || 0)
                                        : stats.openOS.reduce((acc, curr) => acc + curr.count, 0);

                                return (
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-xl">OS's Abertas</h2>
                                        <div className="flex items-center gap-2">
                                            <OrdersListPDFButton
                                                filters={osEffectiveFilters}
                                                searchQuery={searchQuery}
                                                totalCount={osTotalCount}
                                            />
                                            <ExcelExportButton
                                                filters={osEffectiveFilters}
                                                searchQuery={searchQuery}
                                                filename="relatorio-os"
                                                title="EXCEL"
                                                totalCount={osTotalCount}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 pb-3 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                ref={openOSScroll.ref}
                                onMouseDown={openOSScroll.onMouseDown}
                                onTouchStart={openOSScroll.onTouchStart}
                                onClickCapture={openOSScroll.onClickCapture}>

                                {stats.openOS.map((item, idx) => (
                                    <div key={idx} onClick={() => {
                                        const newStatusId = selectedStatusId === item.id ? null : item.id;
                                        setSelectedStatusId(newStatusId);
                                        setOsAssetTagId([]);
                                        fetchData(false, true, { ...appliedFilters, statusId: newStatusId, osAssetTagId: [] });
                                    }}
                                        className={`backdrop-blur-sm p-3 rounded-[12px] border shadow-sm hover:shadow-md transition-all group shrink-0 w-[110px] cursor-pointer
                                ${selectedStatusId === item.id ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}
                            `}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{item.count}</span>
                                            <span className={`material-symbols-outlined text-slate-400 text-[18px] ${item.color}`}>{item.icon}</span>
                                        </div>
                                        <p className={`text-[10px] font-bold ${selectedStatusId === item.id ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            {stats.osSectorCounts && stats.osSectorCounts.length > 0 && (
                                <div
                                    className="flex gap-3 overflow-x-auto no-scrollbar py-1 pb-3 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={osSectorScroll.ref}
                                    onMouseDown={osSectorScroll.onMouseDown}
                                    onTouchStart={osSectorScroll.onTouchStart}
                                    onClickCapture={osSectorScroll.onClickCapture}
                                >
                                    {stats.osSectorCounts.map((item, idx) => {
                                        const isSelected = osAssetTagId.includes(item.id);
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    const newOsAssetTagId = isSelected
                                                        ? osAssetTagId.filter((id) => id !== item.id)
                                                        : [...osAssetTagId, item.id];
                                                    setOsAssetTagId(newOsAssetTagId);
                                                    fetchData(false, true, {
                                                        ...appliedFilters,
                                                        statusId: selectedStatusId,
                                                        osAssetTagId: newOsAssetTagId,
                                                    });
                                                }}
                                                        className={`backdrop-blur-sm p-3 rounded-[12px] border shadow-sm hover:shadow-md transition-all group shrink-0 w-auto min-w-[110px] max-w-[200px] cursor-pointer
                                                    ${isSelected ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className={`text-[11px] font-bold truncate flex-1 ${isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} title={item.label}>
                                                        {item.label}
                                                    </p>
                                                    <span className="text-[16px] font-black text-slate-900 dark:text-white shrink-0">{item.count}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {displayedOpenOS.length > 0 && (
                            <section className="px-4 py-0">
                                <div
                                    className="flex gap-4 overflow-x-auto no-scrollbar pt-2 pb-[15px] px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={openOSCarouselScroll.ref}
                                    onMouseDown={openOSCarouselScroll.onMouseDown}
                                    onTouchStart={openOSCarouselScroll.onTouchStart}
                                    onClickCapture={openOSCarouselScroll.onClickCapture}
                                >
                                    {displayedOpenOS.length > 0 ? (
                                        displayedOpenOS.map((os) => (
                                            <div key={os.id} className="min-w-[352px] max-w-[352px] shrink-0 h-[420px]">
                                                <OrderRequestCardListItem
                                                    order={os}
                                                    currentUser={currentUser}
                                                    onClick={() => onSelectOrder?.(os)}
                                                    onSuccess={() => fetchData(false, true)}
                                                    onEdit={onEdit}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full flex items-center justify-center py-10">
                                            <div className="flex flex-col items-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">inventory_2</span>
                                                <h3 className="font-black text-slate-200 text-lg mb-2">Nenhuma Ordem de ServiÃ§o encontrada</h3>
                                                <p className="text-slate-400">Tente ajustar sua busca ou filtros.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        
                    </div>



                    {/* Selection Modal for Filters */}
                    <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal((prev: any) => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    placeholder={`Pesquisar ${selectionModal.label}...`}
                                    value={selectionSearch}
                                    onChange={(e) => setSelectionSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
                                {selectionModal.options
                                    .filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase()))
                                    .map(opt => {
                                        const isSelected = selectionModal.currentValue.includes(opt.value);
                                        return (
                                            <label
                                                key={opt.value}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        const newVal = isSelected
                                                            ? selectionModal.currentValue.filter(v => v !== opt.value)
                                                            : [...selectionModal.currentValue, opt.value];
                                                        setSelectionModal((prev: any) => ({ ...prev, currentValue: newVal }));
                                                    }}
                                                />
                                                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                            </label>
                                        );
                                    })}
                                {selectionModal.options.filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase())).length === 0 && (
                                    <div className="py-10 text-center flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                        <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSelectionModal((prev: any) => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleModalConfirm(selectionModal.currentValue)}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm"
                                >
                                    Confirmar ({selectionModal.currentValue.length})
                                </button>
                            </div>
                        </div>
                    </Modal>
                </>
            )}

            {/* Floating Action Button + Busca — fixos à direita inferior */}
            {activeTab === 'OS' && (
                <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-50 flex items-center gap-3">
                    <form onSubmit={handleQuickSearch} className="relative flex items-center">
                        <input
                            type="text"
                            value={quickSearchValue}
                            onChange={(e) => setQuickSearchValue(e.target.value)}
                            placeholder="Buscar SS/OS (Ex: 123.1.2026)"
                            className="w-48 lg:w-64 pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[13px] shadow-lg focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isSearchingQuickly || !quickSearchValue.trim()}
                            className="absolute right-2 p-1 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-xl ${isSearchingQuickly ? 'animate-spin' : ''}`}>
                                {isSearchingQuickly ? 'progress_activity' : 'search'}
                            </span>
                        </button>
                    </form>

                    {canCreate('services_requests_create') && (
                        <button
                            onClick={() => onCreateServiceRequest?.()}
                            className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/40 active:scale-95 transition-all duration-200 group"
                            title="Nova Solicitação de Serviço"
                        >
                            <span className="text-sm uppercase tracking-wide">Nova SS</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};


