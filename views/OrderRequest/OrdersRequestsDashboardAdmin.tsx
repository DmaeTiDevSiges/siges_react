import React, { useState, useEffect, useCallback } from 'react';
import { User, OrderFilters, Order, Company } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
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

interface OrdersRequestsDashboardAdminProps {
    currentUser: User | null;
    onSelectOrder?: (order: Order) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onTrackUsers?: (company: Company) => void;
    onCreateServiceRequest?: () => void;
    activeTab?: 'OS' | 'VISITAS';
}

export const OrdersRequestsDashboardAdmin: React.FC<OrdersRequestsDashboardAdminProps> = ({ currentUser, onSelectOrder, onSelectVisit, onTrackUsers, onCreateServiceRequest, activeTab = 'OS' }) => {

    // We removed the internal activeTab state and the header tabs. activeTab is now controlled by props.
    const filtersScroll = useDraggableScroll();
    const unscheduledSSScroll = useDraggableScroll();
    const openOSScroll = useDraggableScroll();
    const leadersScroll = useDraggableScroll();

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
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

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

    const [stats, setStats] = useState(() => {
        try {
            const saved = localStorage.getItem('cachedStats');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.warn('Error reading stats from cache', e); }

        return {
            unscheduled: [
                { label: 'Hoje', count: 0 },
                { label: 'Ontem', count: 0 },
                { label: '< 7 dias', count: 0 },
                { label: '< 15 dias', count: 0 },
            ],
            openOS: [
                { id: 2, label: 'Avaliação', count: 0, icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
                { id: 3, label: 'Autorizadas', count: 0, icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                { id: 4, label: 'Agendadas', count: 0, icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
                { id: 5, label: 'Execução', count: 0, icon: 'engineering', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                { id: 6, label: 'Suspensas', count: 0, icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10' },
            ]
        };
    });

    useEffect(() => {
        localStorage.setItem('cachedStats', JSON.stringify(stats));
    }, [stats]);

    // Persist Data State (Moved here to ensure all state vars are declared)
    useEffect(() => {
        try {
            localStorage.setItem('cachedRecentRequests_v3', JSON.stringify(recentRequests));
            localStorage.setItem('cachedCurrentPage_v2', String(currentPage));
            localStorage.setItem('cachedHasMore_v2', String(hasMore));
            localStorage.setItem('cachedTotalOrders_v2', String(totalOrders));
            localStorage.setItem('cachedUnscheduledSS_v3', JSON.stringify(unscheduledSS));
            localStorage.setItem('cachedTeams', JSON.stringify(teams));
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            localStorage.setItem('cachedFilterOptions', JSON.stringify(filterOptions));
        } catch (e) {
            console.error('💾 Dashboard: Erro ao salvar cache no localStorage', e);
        }
    }, [recentRequests, currentPage, hasMore, totalOrders, unscheduledSS, teams, users, filterOptions]);

    const leadersByCompany = React.useMemo(() => {
        const leaders = users
            .filter(u => u.isTeamLeader && u.statusId === 2)
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
    }, [users]);



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

        return recentRequests.filter(o => {
            // Apply Period filter (Mostly for SS's)
            if (selectedPeriod) {
                if (o.parentId || o.statusId !== 1) return false;
                const date = parseDateString(o.date || o.createdDate || '');
                if (!date) return false;
                if (selectedPeriod === 'Hoje') return date >= today;
                if (selectedPeriod === 'Ontem') return date >= yesterday && date < today;
                if (selectedPeriod === '< 7 dias') return date >= sevenDaysAgo;
                if (selectedPeriod === '< 15 dias') return date >= fifteenDaysAgo;
                return true;
            }
            return true;
        });
    }, [recentRequests, selectedStatusId, selectedPeriod]);

    // Effective filters for reports - combining persisted filters with interactive dashboard filters
    const effectiveFilters = React.useMemo(() => {
        return {
            ...appliedFilters,
            statusId: selectedStatusId || appliedFilters.statusId,
            period: selectedPeriod || appliedFilters.period
        };
    }, [appliedFilters, selectedStatusId, selectedPeriod]);

    const fetchData = useCallback(async (
        loadMore: boolean = false,
        isManual: boolean = false,
        overrideFilters?: OrderFilters
    ) => {
        const filtersToUse = overrideFilters || appliedFilters;

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

             const restrictedSSFilters = {
                 systemParentId: filtersToUse.systemParentId,
                 systemId: filtersToUse.systemId,
                 unitTypeParentId: filtersToUse.unitTypeParentId,
                 unitTypeId: filtersToUse.unitTypeId,
                 unitId: filtersToUse.unitId,
                 period: filtersToUse.period
             };
 
             if (loadMore) {
                 // When loading more, we ONLY need the next page of orders
                 ordersResult = await dataService.getOrdersFilters({
                     search: searchQuery,
                     ...filtersToUse,
                     page: pageToFetch,
                     pageSize: 50
                 });
             } else {
                 // When filtering/loading initial, we execute ALL requests in parallel for maximum speed
                 const [pOrders, pStats, pUnscheduled] = await Promise.all([
                     dataService.getOrdersFilters({
                         search: searchQuery,
                         ...filtersToUse,
                         page: 0, // Always page 0 for new filter
                         pageSize: 50
                     }),
                     dataService.getDashboardStats({
                         search: searchQuery,
                         ...filtersToUse
                     }, restrictedSSFilters),
                     dataService.getUnscheduledSS(restrictedSSFilters)
                 ]);

                ordersResult = pOrders;
                statsResult = pStats;
                unscheduledSSResult = pUnscheduled;
            }

            const { data: orders, hasMore: moreAvailable, total } = ordersResult;

            if (loadMore) {
                const currentList = recentRequestsRef.current;
                const existingIds = new Set(currentList.map(r => r.id));
                const newItems = orders.filter(item => !existingIds.has(item.id));

                if (newItems.length > 0) {
                    setRecentRequests(prev => [...prev, ...newItems]);
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
                            { label: '< 7 dias', count: statsResult.ssCounts.sevenDays },
                            { label: '< 15 dias', count: statsResult.ssCounts.fifteenDays },
                        ],
                        openOS: [
                            { id: 2, label: 'Avaliação', count: statsResult.osCounts[2] || 0, icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
                            { id: 3, label: 'Autorizadas', count: statsResult.osCounts[3] || 0, icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                            { id: 4, label: 'Agendadas', count: statsResult.osCounts[4] || 0, icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
                            { id: 5, label: 'Execução', count: statsResult.osCounts[5] || 0, icon: 'engineering', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                            { id: 6, label: 'Suspensas', count: statsResult.osCounts[6] || 0, icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10' },
                        ]
                    });
                }

                // 2. Update Unscheduled SS
                setUnscheduledSS(unscheduledSSResult);

                // 3. Update Main List
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
            isLoadingMoreRef.current = false;
        }
    }, [searchQuery, appliedFilters, selectedStatusId, selectedPeriod, hasAppliedFilters, recentRequests.length]);

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
                    dataService.getTeams(),
                    dataService.getUnits('active')
                ]);

                const getVal = (res: any, name: string) => {
                    if (res.status === 'rejected') {
                        console.error(`Failed to load ${name}:`, res.reason);
                        return [];
                    }
                    return res.value;
                };

                setFilterOptions(prev => ({
                    ...prev,
                    systems: getVal(results[0], 'systems'),
                    unitTypes: getVal(results[1], 'unitTypes'),
                    orderObjects: getVal(results[2], 'orderObjects'),
                    orderTypes: getVal(results[3], 'orderTypes'),
                    plans: getVal(results[4], 'plans'),
                    contracts: getVal(results[5], 'contracts'),
                    teams: getVal(results[6], 'teams'),
                    units: getVal(results[7], 'units')
                }));

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
 
         // 2. Realtime subscription for orders
         const subscription = dataService.subscribeToOrders((payload) => {
             fetchDataRef.current(false, false);
         });
 
         // 3. Realtime subscription for visits
         const visitSubscription = dataService.subscribeToVisits((payload) => {
             fetchDataRef.current(false, false);
         });
 
         // 4. Realtime subscription for users (to update status borders)
         const userSubscription = dataService.subscribeToUsers(async () => {
             try {
                 // Limpar cache de líderes para garantir dados atualizados
                 dataService.clearMetadataCache();
 
                 const usersData = await dataService.getUsers();
                 setUsers(usersData);
             } catch (err) {
                 console.error("Failed to refresh users in realtime", err);
             }
         });
 
         // 🛡️ CONTROLLED INITIAL LOAD - Always fetch on mount for REALTIME consistency
         fetchDataRef.current(false, false);
         setIsLoading(false);
 
         return () => {
             window.removeEventListener('refresh_dashboard', handleRefresh);
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
                    setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
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
        setAdvancedOrdersFilters(prev => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
            setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    };

    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedOrdersFilters(prev => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedOrdersFilters(prev => ({ ...prev, unitTypeParentId: id, unitTypeId: [], unitId: [] }));
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
        } else {
            setAdvancedOrdersFilters(prev => ({ ...prev, [key]: finalValue }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] animate-in fade-in duration-500 relative">

            {/* Unified Header with Tabs has been moved to the Main Layout Header in App.tsx */}

            {/* VISITS VIEW */}
            {activeTab === 'VISITAS' && currentUser && (
                <div className="flex-1 overflow-hidden">
                    <DashboardOrdersVisitsAdminScreen
                        currentUser={currentUser}
                        onSelectVisit={onSelectVisit || (() => { })}
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
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full cursor-grab active:cursor-grabbing touch-auto"
                                ref={filtersScroll.ref}
                                onMouseDown={filtersScroll.onMouseDown}
                                onTouchStart={filtersScroll.onTouchStart}
                                onClickCapture={filtersScroll.onClickCapture}>
                                <div className="flex items-center gap-2 min-w-full pb-1">
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
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, systemId: [] }))}
                                        disabled={!advancedOrdersFilters.systemParentId || (Array.isArray(advancedOrdersFilters.systemParentId) && advancedOrdersFilters.systemParentId.length === 0)}
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
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, unitTypeId: [] }))}
                                        disabled={!advancedOrdersFilters.unitTypeParentId || (Array.isArray(advancedOrdersFilters.unitTypeParentId) && advancedOrdersFilters.unitTypeParentId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="UNIDADES"
                                        value={advancedOrdersFilters.unitId || []}
                                        onClick={() => openSelectionModal('unitId', 'UNIDADES', filterOptions.units.map(opt => ({ value: String(opt.id), label: opt.description_full || opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, unitId: [] }))}
                                    />
                                    <FilterSelect
                                        label="FINALIDADE"
                                        value={advancedOrdersFilters.orderObjectId || []}
                                        onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterOptions.orderObjects.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, orderObjectId: [] }))}
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
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, orderTypeSubId: [] }))}
                                        disabled={!advancedOrdersFilters.orderTypeId || (Array.isArray(advancedOrdersFilters.orderTypeId) && advancedOrdersFilters.orderTypeId.length === 0)}
                                    />
                                    <FilterSelect
                                        label="CONTRATO"
                                        value={advancedOrdersFilters.contractId || []}
                                        onClick={() => openSelectionModal('contractId', 'CONTRATO', filterOptions.contracts.map(opt => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))}
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, contractId: [] }))}
                                    />
                                    <FilterSelect
                                        label="PLANO"
                                        value={advancedOrdersFilters.orderPlanId || []}
                                        onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterOptions.plans.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, orderPlanId: [] }))}
                                    />
                                    <FilterSelect
                                        label="EQUIPE"
                                        value={advancedOrdersFilters.orderTeamId || []}
                                        onClick={() => openSelectionModal('orderTeamId', 'EQUIPE', filterOptions.teams.map(opt => ({ value: String(opt.id), label: opt.name || opt.description })))}
                                        onClear={() => setAdvancedOrdersFilters(prev => ({ ...prev, orderTeamId: [] }))}
                                    />
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between gap-3 pb-1">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onCreateServiceRequest?.()}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
                                        title="Nova Solicitação de Serviço"
                                    >
                                        <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-12">add_task</span>
                                        <span className="text-[13px] uppercase tracking-wide whitespace-nowrap">Nova SS</span>
                                    </button>

                                    {/* Quick Search Field */}
                                    <form onSubmit={handleQuickSearch} className="relative hidden md:flex items-center">
                                        <input
                                            type="text"
                                            value={quickSearchValue}
                                            onChange={(e) => setQuickSearchValue(e.target.value)}
                                            placeholder="Buscar SS/OS (Ex: 123.1.2026)"
                                            className="w-48 lg:w-64 pl-4 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-[13px] focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
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
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Clear all shortcut */}
                                    {Object.values(advancedOrdersFilters).some(v => Array.isArray(v) && v.length > 0) && (
                                        <button
                                            onClick={() => { setAdvancedOrdersFilters({}); setAppliedFilters({}); setUnitSubTypes([]); setOrderSubTypes([]); setHasAppliedFilters(false); }}
                                            className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 group active:scale-95"
                                            title="Limpar todos os filtros"
                                        >
                                            <span className="material-symbols-outlined text-xl group-hover:rotate-[-10deg]">filter_alt_off</span>
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Limpar Filtros</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            const newFilters = { ...advancedOrdersFilters };
                                            setAppliedFilters(newFilters);
                                            setHasAppliedFilters(true);
                                            fetchData(false, true, newFilters);
                                        }}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none group"
                                    >
                                        <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                                            {isLoading ? 'progress_activity' : 'filter_list'}
                                        </span>
                                        <span className="text-[13px] uppercase tracking-wide">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-20 md:pb-6">
                        <section className="px-4 pt-4 pb-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h2 className="font-bold text-slate-900 dark:text-white text-sm">SS's Não Programadas</h2>
                                <div className="flex items-center gap-2">
                                    <RequestsListPDFButton
                                        filters={effectiveFilters}
                                        searchQuery={searchQuery}
                                        totalCount={
                                            selectedPeriod
                                                ? (stats.unscheduled.find(p => p.label === selectedPeriod)?.count || 0)
                                                : stats.unscheduled.reduce((acc, curr) => acc + curr.count, 0)
                                        }
                                    />
                                    <RequestsExcelExportButton
                                        filters={effectiveFilters}
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
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto">
                                {stats.unscheduled.map((item, idx) => (
                                    <div key={idx} onClick={() => {
                                        const newPeriod = selectedPeriod === item.label ? null : item.label;
                                        setSelectedPeriod(newPeriod);
                                        setSelectedStatusId(null);
                                        fetchData(false, true, { ...appliedFilters, period: newPeriod });
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
                        </section>

                        {unscheduledSS.length > 0 && (
                            <section className="px-4 py-0">

                                <div className="flex gap-4 overflow-x-auto no-scrollbar pt-0 pb-[15px] px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                    ref={unscheduledSSScroll.ref}
                                    onMouseDown={unscheduledSSScroll.onMouseDown}
                                    onTouchStart={unscheduledSSScroll.onTouchStart}
                                    onClickCapture={unscheduledSSScroll.onClickCapture}>
                                    {unscheduledSS.map((ss) => (
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
                            <div className="flex items-center justify-between mb-0.5">
                                <h2 className="font-bold text-slate-900 dark:text-white text-sm">OS's Abertas</h2>
                                {stats.openOS.reduce((acc, curr) => acc + curr.count, 0) === 0 && (
                                    <span className="text-[11px] font-bold text-slate-400 cursor-default select-none">Sem registros</span>
                                )}
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                ref={openOSScroll.ref}
                                onMouseDown={openOSScroll.onMouseDown}
                                onTouchStart={openOSScroll.onTouchStart}
                                onClickCapture={openOSScroll.onClickCapture}>

                                {stats.openOS.map((item, idx) => (
                                    <div key={idx} onClick={() => {
                                        const newStatusId = selectedStatusId === item.id ? null : item.id;
                                        setSelectedStatusId(newStatusId);
                                        setSelectedPeriod(null);
                                        // Trigger a reload through fetchData
                                        fetchData(false, true, { ...appliedFilters, statusId: newStatusId });
                                    }}
                                        className={`backdrop-blur-sm p-3.5 rounded-[12px] border shadow-sm hover:shadow-md transition-all group shrink-0 w-[140px] md:w-[160px] cursor-pointer
                                ${selectedStatusId === item.id ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}
                            `}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`w-9 h-9 ${item.bgColor} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                                <span className={`material-symbols-outlined text-[20px] ${item.color}`}>{item.icon}</span>
                                            </div>
                                            <span className="text-xl font-black text-slate-900 dark:text-white">{item.count}</span>
                                        </div>
                                        <p className={`text-[13px] font-bold ${selectedStatusId === item.id ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="px-4 py-1.5">
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 cursor-grab active:cursor-grabbing touch-auto"
                                ref={leadersScroll.ref}
                                onMouseDown={leadersScroll.onMouseDown}
                                onTouchStart={leadersScroll.onTouchStart}
                                onClickCapture={leadersScroll.onClickCapture}>

                                {leadersByCompany.map((group) => (
                                    <div key={group.companyId} className="flex flex-col gap-2 shrink-0 p-3 bg-white dark:bg-slate-800/40 rounded-[12px] border border-slate-100 dark:border-white/5 shadow-sm min-w-[200px] max-w-[calc(100vw-32px)] md:max-w-[600px]">
                                        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-white/5 pb-1.5 relative">
                                            <CompanyAvatar src={group.companyLogoUrl} name={group.companyName} size="xs" className="scale-75 -ml-1 text-[10px]" />
                                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate flex-1 leading-tight pr-6">
                                                {group.companyName}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Rastrear clicked for:', group.companyId);
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
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 px-1">
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
                        </section>

                        <section className="px-4 py-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-900 dark:text-white">Ordens de Serviços</h2>
                                <div className="flex items-center gap-2">
                                    <OrdersListPDFButton
                                        filters={effectiveFilters}
                                        searchQuery={searchQuery}
                                        totalCount={
                                            selectedStatusId
                                                ? (stats.openOS.find(s => s.id === selectedStatusId)?.count || 0)
                                                : selectedPeriod
                                                    ? (stats.unscheduled.find(p => p.label === selectedPeriod)?.count || 0)
                                                    : totalOrders
                                        }
                                    />
                                    <ExcelExportButton
                                        filters={effectiveFilters}
                                        searchQuery={searchQuery}
                                        filename="relatorio-os"
                                        title="EXCEL"
                                        totalCount={
                                            selectedStatusId
                                                ? (stats.openOS.find(s => s.id === selectedStatusId)?.count || 0)
                                                : selectedPeriod
                                                    ? (stats.unscheduled.find(p => p.label === selectedPeriod)?.count || 0)
                                                    : totalOrders
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-slate-400 font-medium">Carregando solicitações...</p>
                                    </div>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((req) => (
                                        <OrderRequestCardListItem
                                            key={req.id}
                                            order={req}
                                            onClick={() => onSelectOrder?.(req)}
                                            onSuccess={() => fetchData(false, true)}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                        <span className="material-symbols-outlined text-6xl text-slate-200">order_approve</span>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">Nenhuma solicitação encontrada</p>
                                            <p className="text-slate-400 text-sm">Tente ajustar sua busca ou filtros.</p>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && recentRequests.length > 0 && <div ref={sentinelRef} className="h-4" />}
                                {isLoadingMore && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-slate-400 text-sm font-medium">Carregando mais solicitações...</p>
                                    </div>
                                )}
                                {!isLoading && !isLoadingMore && !hasMore && filteredOrders.length > 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                                        <span className="material-symbols-outlined text-3xl text-slate-300">check_circle</span>
                                        <p className="text-slate-400 text-sm font-medium">Todas as solicitações foram carregadas</p>
                                        <p className="text-slate-300 text-xs">
                                            Total: {filteredOrders.length} de {
                                                (selectedStatusId || selectedPeriod)
                                                    ? filteredOrders.length
                                                    : totalOrders
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>



                    {/* Selection Modal for Filters */}
                    <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
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
                                                        setSelectionModal(prev => ({ ...prev, currentValue: newVal }));
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
                                    onClick={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))}
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
        </div>
    );
};

/**
 * Compact Filter Select Wrapper for the Horizontal Bar
 */
const FilterSelect: React.FC<{
    label: string;
    value: string | string[];
    onClick: () => void;
    onClear: () => void;
    disabled?: boolean;
}> = ({ label, value, onClick, onClear, disabled }) => {
    const count = Array.isArray(value) ? value.length : (value ? 1 : 0);

    return (
        <div className={`relative flex items-center flex-1 min-w-[110px] h-[42px] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden transition-all ${count > 0 ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div
                    onClick={onClick}
                    className="flex-1 px-3 flex flex-col justify-center border-r border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-0"
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none mb-0.5">{label}</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold ${count > 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                            {count > 0 ? `${count} ${count === 1 ? 'item' : 'itens'}` : 'Todos'}
                        </span>
                    </div>
                </div>

                {count > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="px-3 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};
