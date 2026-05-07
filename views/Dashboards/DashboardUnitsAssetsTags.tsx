import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabase';
import { User, System, OrderType, Priority } from '../../types';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { AvailabilityHistory } from '../../components/ui/AvailabilityHistory';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { AvailabilityExportModal } from './components/AvailabilityExportModal';
import { UnitsAvailabilityMap } from './components/UnitsAvailabilityMap';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Loading } from '../../components/ui/Loading';
import { CircularGauge } from '../../components/ui/CircularGauge';




// Scrollable row of asset cards with drag-to-scroll support
const AssetScrollRow: React.FC<{ assets: any[]; onAssetClick: (asset: any) => void; }> = ({ assets, onAssetClick }) => {
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
                        }`}
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
                            <div className={`absolute -top-2 -right-2 sm:-top-2.5 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm z-10 animate-in fade-in zoom-in duration-300 ${asset.isAvailable ? 'bg-amber-500' : 'bg-rose-600'
                                }`}>
                                <span className="text-[10px] sm:text-[12px] font-black text-white leading-none">
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
    const [allData, setAllData] = useState<any[]>([]);
    const [sectorsData, setSectorsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSectorName, setSelectedSectorName] = useState<string>(() => localStorage.getItem('siges_dashboard_sector_name') || '');
    const [sortMode, setSortMode] = useState<'disponibilidade' | 'alfabetica'>(() =>
        (localStorage.getItem('siges_dashboard_sort_mode') as 'disponibilidade' | 'alfabetica') || 'disponibilidade'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssetForModal, setSelectedAssetForModal] = useState<any | null>(null);
    const [modalData, setModalData] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [history7Days, setHistory7Days] = useState<{ date: string; isAvailable: boolean | null }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [activeOrdersForModal, setActiveOrdersForModal] = useState<any[]>([]);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

    // Inline SS Creation Form State
    const [showSSForm, setShowSSForm] = useState(false);
    const [ssFormStep, setSsFormStep] = useState(1);
    const [ssFormLoading, setSsFormLoading] = useState(false);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [ssFormData, setSsFormData] = useState({
        orderTypeId: '',
        priorityId: '',
        requestedServices: '',
        receiveNotifications: false
    });

    const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
        if (isFullscreenMapMode) return 'map';
        return (localStorage.getItem('dashboard_units_view_mode') as 'list' | 'map') || 'list';
    });

    // Accordion state for mobile
    const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);
    const [completingOrderId, setCompletingOrderId] = useState<string | number | null>(null);
    const [ratingOrderId, setRatingOrderId] = useState<string | number | null>(null);
    const [selectedRating, setSelectedRating] = useState<number>(0);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem('dashboard_units_view_mode', viewMode);
    }, [viewMode]);

    // Export Modal State
    const [unitForExport, setUnitForExport] = useState<any | null>(null);

    // Track unit selected via map
    const [selectedUnitIdFromMap, setSelectedUnitIdFromMap] = useState<number | null>(null);

    // Active Asset Tag ID based on selectedSectorName
    const activeAssetTagId = useMemo(() => {
        const row = allData.find(r => (r.tag_description || 'Geral') === selectedSectorName);
        return row?.asset_tag_id;
    }, [allData, selectedSectorName]);

    // Drag-to-scroll for the sector cards strip
    const { ref: sectorsScrollRef, dragHandlers: sectorsDragHandlers } = useDragToScroll<HTMLDivElement>();

    useEffect(() => {
        if (!selectedAssetForModal?.id) {
            setModalData(null);
            setHistory7Days([]);
            setActiveOrdersForModal([]);
            setHistoryOffset(0);
            setHistoryOffset(0);
            setCurrentOrderIndex(0);
            setRatingOrderId(null);
            setSelectedRating(0);
            setRatingOrderId(null);
            setSelectedRating(0);
            return;
        }

        setCurrentOrderIndex(0);
        const fetchAllInfo = async () => {
            setModalLoading(true);
            try {
                console.log('Fetching all info for selected asset ID:', selectedAssetForModal.id);
                // Fetch basic detail info
                const detailPromise = dataService.getUnitAssetTagItemById(selectedAssetForModal.id);
                // Fetch active orders (confirmed link: v_units_assets_tags.id = v_orders.unit_asset_tag_id)
                const ordersPromise = dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id);

                const [data, orders] = await Promise.all([detailPromise, ordersPromise]);

                console.log('Data fetched:', data ? 'Yes' : 'No');
                console.log('Orders fetched count:', orders?.length || 0);

                setModalData(data);
                setActiveOrdersForModal(orders || []);
            } catch (error) {
                console.error('Error fetching modal detailed info:', error);
                setModalData(null);
                setActiveOrdersForModal([]);
            } finally {
                setModalLoading(false);
            }
        };

        fetchAllInfo();
    }, [selectedAssetForModal?.id]);

    useEffect(() => {
        setRatingOrderId(null);
        setSelectedRating(0);
    }, [currentOrderIndex]);

    useEffect(() => {
        if (!selectedAssetForModal?.id) return;

        const fetchHistoryData = async () => {
            setHistoryLoading(true);
            try {
                const historyData = await dataService.getAssetAvailabilityHistory7Days(selectedAssetForModal.id, historyOffset);
                setHistory7Days(historyData);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistoryData();
    }, [selectedAssetForModal?.id, historyOffset]);


    useEffect(() => {
        loadSystems();
    }, []);

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

    useEffect(() => {
        localStorage.setItem('siges_dashboard_sort_mode', sortMode);
    }, [sortMode]);

    useEffect(() => {
        if (selectedSectorName) {
            localStorage.setItem('siges_dashboard_sector_name', selectedSectorName);
        }
    }, [selectedSectorName]);

    const loadSystems = async () => {
        const data = await dataService.getSystemsParent();
        setSystems(data);

        // If we have a persisted ID but it's not in the list, or if we don't have one, default to first
        if (data.length > 0) {
            const exists = data.find(s => s.id === selectedSystemId);
            if (!selectedSystemId || !exists) {
                setSelectedSystemId(data[0].id);
            }
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

    // Load order types and priorities for inline SS form
    useEffect(() => {
        if (!showSSForm) return;
        const load = async () => {
            try {
                const [types, prios] = await Promise.all([
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active')
                ]);
                setOrderTypes(types);
                setPriorities(prios);
            } catch (e) {
                console.error('Error loading SS form lists', e);
            }
        };
        load();
    }, [showSSForm]);

    const openSSForm = () => {
        const defaultDescription = `${modalData?.asset_tag_tag_sub_description || ''}: ${modalData?.last_asset_unavailable_reason_description || ''} ${modalData?.last_comments || ''}`;
        setSsFormData({ 
            orderTypeId: '', 
            priorityId: '', 
            requestedServices: defaultDescription.trim(), 
            receiveNotifications: false 
        });
        setSsFormStep(1);
        setShowSSForm(true);
    };

    const closeSSForm = () => {
        setShowSSForm(false);
        setSsFormStep(1);
    };

    const handleSSFormNext = () => {
        if (ssFormStep === 1) {
            if (!ssFormData.orderTypeId) {
                toast.error('Selecione o Tipo de OS');
                return;
            }
            setSsFormStep(2);
        } else if (ssFormStep === 2) {
            // Prioridade não é obrigatória? Pelo código original não parece ser.
            // Vou permitir seguir sem selecionar se desejar, ou validar se houver regra.
            setSsFormStep(3);
        } else if (ssFormStep === 3) {
            if (!ssFormData.requestedServices) {
                toast.error('Descreva o problema');
                return;
            }
            setSsFormStep(4);
        }
    };

    const handleSSFormSubmit = async () => {
        if (!modalData) return;
        if (!ssFormData.orderTypeId || !ssFormData.requestedServices) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setSsFormLoading(true);
        try {
            const createdOrder = await dataService.createServiceRequest({
                clientId: modalData.client_id?.toString(),
                unitId: modalData.unit_id?.toString(),
                typeId: ssFormData.orderTypeId,
                priorityId: ssFormData.priorityId || undefined,
                unitAssetTagId: modalData.id?.toString(),
                requestedServices: ssFormData.requestedServices,
            });

            if (ssFormData.receiveNotifications && createdOrder?.id) {
                try {
                    await supabase.from('orders_followers').insert({
                        o_id: parseInt(createdOrder.id),
                        user_id: parseInt(currentUser.id)
                    });
                } catch (followerErr) {
                    console.warn('Erro ao salvar seguidor:', followerErr);
                }
            }

            toast.success('Solicitação de Serviço criada com sucesso!');
            closeSSForm();

            // Refresh active orders
            if (selectedAssetForModal?.id) {
                const orders = await dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id);
                setActiveOrdersForModal(orders || []);
                setCurrentOrderIndex(0);
            }
            if (selectedSystemId) loadDashboardData(selectedSystemId, true);
        } catch (err) {
            console.error('Erro ao criar SS:', err);
            toast.error('Erro ao criar solicitação. Tente novamente.');
        } finally {
            setSsFormLoading(false);
        }
    };

    const handleCompleteOrder = async (orderId: string | number, rating: number = 0) => {
        setCompletingOrderId(orderId);
        try {
            const success = await dataService.completeServiceOrder(orderId, currentUser.id);
            if (success) {
                // Refresh modal data
                if (selectedAssetForModal?.id) {
                    const orders = await dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id);
                    setActiveOrdersForModal(orders);
                    setCurrentOrderIndex(0);

                    // Refresh main dashboard to update op_counter / order flag
                    if (selectedSystemId) {
                        loadDashboardData(selectedSystemId, true);
                    }
                }
                setRatingOrderId(null);
                setSelectedRating(0);
            } else {
                toast.error('Ocorreu um erro ao concluir o serviço.');
            }
        } catch (error) {
            console.error('Error completing service:', error);
            toast.error('Erro ao finalizar serviço');
        } finally {
            setCompletingOrderId(null);
        }
    };

    // Aggregate stats by tag_description (Top Cards)
    const sectorsStats = useMemo(() => {
        // Collect manual stats regardless of view data (for activity and fallback)
        const manualStats: Record<string, any> = {};
        allData.forEach(row => {
            const sName = row.tag_description || 'Geral';
            if (!manualStats[sName]) {
                manualStats[sName] = {
                    count: 0,
                    availableCount: 0,
                    lastReportedAt: null,
                    latestRow: null
                };
            }
            manualStats[sName].count++;
            if (row.last_is_available) manualStats[sName].availableCount++;

            if (row.last_reported_at && (!manualStats[sName].lastReportedAt || new Date(row.last_reported_at) > new Date(manualStats[sName].lastReportedAt))) {
                manualStats[sName].lastReportedAt = row.last_reported_at;
                manualStats[sName].latestRow = row;
            }
        });

        // Use precisely aggregated data from view if available
        if (sectorsData.length > 0) {
            return sectorsData.map(row => {
                const sName = row.asset_tag_description || 'Geral';
                const man = manualStats[sName] || { count: 0, availableCount: 0, latestRow: null };

                // If the sector doesn't have any specific visibility set, we fallback to general count availability
                const hasSpecificVisible = row.flow_rate_is_visible || row.power_is_visible || row.pressure_is_visible;

                return {
                    id: sName,
                    name: sName,
                    flow: {
                        visible: row.flow_rate_is_visible,
                        percentage: Math.round((row.pct_flow_rate_available_fraction || 0) * 100),
                        unit: row.flow_rate_unit || ''
                    },
                    power: {
                        visible: row.power_is_visible,
                        percentage: Math.round((row.pct_power_available_fraction || 0) * 100),
                        unit: row.power_unit || ''
                    },
                    pressure: {
                        visible: row.pressure_is_visible,
                        percentage: Math.round((row.pct_pressure_available_fraction || 0) * 100),
                        unit: row.pressure_unit || ''
                    },
                    general: {
                        visible: !hasSpecificVisible,
                        percentage: man.count > 0 ? Math.round((man.availableCount / man.count) * 100) : 0,
                        unit: ''
                    },
                    lastReportedAt: man.latestRow?.last_reported_at,
                    latestUnit: man.latestRow?.unit_description,
                    latestSubTag: man.latestRow?.tag_sub_description,
                    latestUser: man.latestRow?.last_reported_user_name_short || man.latestRow?.last_created_user_name_short,
                    latestAvatar: man.latestRow?.last_user_avatar_url
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
        }

        // Fallback to manual aggregation if view data is not loaded yet
        return Object.entries(manualStats).map(([sName, man]: [string, any]) => ({
            id: sName,
            name: sName,
            flow: { visible: true, percentage: Math.round((man.availableCount / man.count) * 100), unit: '' },
            power: { visible: false, percentage: 0, unit: '' },
            pressure: { visible: false, percentage: 0, unit: '' },
            general: { visible: false, percentage: 0, unit: '' },
            ...man,
            latestUnit: man.latestRow?.unit_description,
            latestSubTag: man.latestRow?.tag_sub_description,
            latestUser: man.latestRow?.last_reported_user_name_short || man.latestRow?.last_created_user_name_short,
            latestAvatar: man.latestRow?.last_user_avatar_url
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [allData, sectorsData]);

    // Group units and their specific assets for the active sector name
    const unitsRows = useMemo(() => {
        const rows: Record<string, any> = {};

        allData.forEach(row => {
            const uid = row.unit_id.toString();
            if (!rows[uid]) {
                rows[uid] = {
                    id: uid,
                    description: row.unit_description,
                    lastReportedAt: null,
                    totalRate: 0,
                    assets: [],
                    latitude: row.unit_latitude,
                    longitude: row.unit_longitude,
                    percentage: 0 // Placeholder
                };
            }

            const unit = rows[uid];

            if (row.last_reported_at && (!unit.lastReportedAt || new Date(row.last_reported_at) > new Date(unit.lastReportedAt))) {
                unit.lastReportedAt = row.last_reported_at;
                unit.lastUser = row.last_reported_user_name_short || row.last_created_user_name_short;
                unit.lastAvatar = row.last_user_avatar_url;
                unit.lastReportedImage = row.last_reported_image;
            }

            // Only add assets if they belong to the selected sector name
            if ((row.tag_description || 'Geral') === selectedSectorName) {
                // Sum the custom available rate for the selected sector
                unit.totalRate += (Number(row.last_asset_available_rate) || 0);

                // Determine which physical value and unit to display based on visibility flags
                let displayValue = row.last_flow_rate;
                let displayUnit = row.flow_rate_unit || '';

                if (row.flow_rate_is_visible) {
                    displayValue = row.flow_rate_max || row.total_flow_rate_max || row.last_flow_rate || 0;
                    displayUnit = row.flow_rate_unit || '';
                } else if (row.power_is_visible) {
                    displayValue = row.power_max || row.total_power_max || row.last_power || 0;
                    displayUnit = row.power_unit || '';
                } else if (row.pressure_is_visible) {
                    displayValue = row.pressure_max || row.total_pressure_max || row.last_pressure || 0;
                    displayUnit = row.pressure_unit || '';
                }

                unit.assets.push({
                    id: row.id,
                    unitId: row.unit_id,
                    assetTagId: row.asset_tag_id,
                    subId: row.asset_tag_sub_id,
                    description: row.tag_sub_description || 'Equip.',
                    isAvailable: row.last_is_available,
                    isActive: row.is_active ?? true,
                    value: displayValue,
                    unit: displayUnit,
                    reportedAt: row.last_reported_at,
                    orderId: row.last_o_id,
                    lastAssetAvailableId: row.last_asset_available_id,
                    suspendedReason: row.last_asset_unavailable_reason_description,
                    lastComments: row.last_comments,
                    reportedByUser: row.last_user_full_name || row.last_user_name,
                    reportedByAvatar: row.last_user_avatar_url,
                    reportedImage: row.last_reported_image,
                    unitDescription: row.unit_description,
                    sectorName: row.tag_description,
                    companyLogo: row.last_provider_company_logo,
                    clientId: row.client_id,
                    clientName: row.client_name,
                    opCounter: row.op_counter || 0
                });
            }
        });

        const finalRows = Object.values(rows).map((r: any) => ({
            ...r,
            assets: r.assets.sort((a: any, b: any) => a.description.localeCompare(b.description)),
            percentage: Math.max(0, Math.min(100, Math.round(r.totalRate * 100)))
        }));

        // Filter by search
        let filtered = finalRows;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = finalRows.filter(r => r.description.toLowerCase().includes(q));
        }

        // Sort
        if (sortMode === 'disponibilidade') {
            return filtered.sort((a, b) => a.percentage - b.percentage);
        } else {
            return filtered.sort((a, b) => a.description.localeCompare(b.description));
        }
    }, [allData, selectedSectorName, sortMode, searchQuery]);

    const systemSummary = useMemo(() => {
        if (allData.length === 0) return null;
        // Aggregate for the selected sector at the system level
        return sectorsStats.find(s => s.name === selectedSectorName) || sectorsStats[0];
    }, [allData, selectedSectorName, sectorsStats]);

    const sectorPercentage = useMemo(() => {
        if (!systemSummary) return 0;
        if (systemSummary.flow?.visible) return systemSummary.flow.percentage;
        if (systemSummary.power?.visible) return systemSummary.power.percentage;
        if (systemSummary.pressure?.visible) return systemSummary.pressure.percentage;
        return systemSummary.general?.percentage || 0;
    }, [systemSummary]);

    const systemOptions = useMemo(() =>
        systems.map(s => ({ value: s.id, label: s.description })),
        [systems]);


    return (
        <div className="flex flex-col bg-background-light dark:bg-background-dark">
            {isFullscreenMapMode ? (
                <div className="fixed inset-0 bg-background-light dark:bg-background-dark z-8000">
                    <UnitsAvailabilityMap
                        units={unitsRows}
                        unitTagDescription={selectedSectorName}
                        unitTagPercentage={sectorPercentage}
                        onUnitClick={(id) => {
                            setSelectedUnitIdFromMap(id);
                            if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                        }}
                        className="w-full h-full rounded-none!"
                    />

                    {selectedUnitIdFromMap && (
                        <div className="absolute bottom-6 left-6 right-6 z-8001 animate-in slide-in-from-bottom-4 fade-in duration-300">
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
                                                <IconButton
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
                    <header className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8 w-full sm:w-auto">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Sistema</h1>
                            <div className="flex items-center gap-3 w-full sm:w-[200px]">
                                <Select
                                    options={systemOptions}
                                    value={selectedSystemId}
                                    onChange={(e) => {
                                        const newId = e.target.value;
                                        setSelectedSystemId(newId);
                                        loadDashboardData(newId);
                                    }}
                                    className="h-11! shadow-sm border-none bg-slate-100 dark:bg-slate-800 w-full"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                            <div className="w-full sm:w-[240px]">
                                <SearchInput
                                    placeholder="Buscar unidade..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onClear={() => setSearchQuery('')}
                                    className="shadow-sm border-none bg-slate-100 dark:bg-slate-800 h-11! w-full"
                                />
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
                    <section className="shrink-0 mb-4 sm:mb-8 overflow-hidden px-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 px-1">
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
                                            <img
                                                src={systemSummary.latestAvatar}
                                                alt={systemSummary.latestUser}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-primary/60">schedule</span>
                                        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-tighter">
                                            {(() => {
                                                const diffHrs = Math.floor((new Date().getTime() - new Date(systemSummary.lastReportedAt).getTime()) / (1000 * 60 * 60));
                                                const diffMins = Math.floor((new Date().getTime() - new Date(systemSummary.lastReportedAt).getTime()) / (1000 * 60));
                                                return diffHrs > 0 ? `há ${diffHrs} h` : `há ${diffMins} min`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            ref={sectorsScrollRef}
                            {...sectorsDragHandlers}
                            className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2 sm:py-3 px-1 cursor-grab active:cursor-grabbing"
                        >
                            {/* Sector Cards only */}
                            {sectorsStats.map((sector) => (
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
                    <main className="pb-6 sm:pb-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-80 gap-3">
                                <Loading size="md" text="Sincronizando Ativos..." />
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
                                                        className={`shrink-0 w-full md:w-auto md:min-w-[256px] p-2.5 sm:p-3 rounded-[16px]! sm:rounded-[20px]! min-h-[76px] sm:min-h-[88px] h-auto flex items-center justify-between relative group overflow-hidden border-slate-200 dark:border-slate-800 transition-all ${isExpanded ? 'ring-2 ring-primary border-transparent' : 'cursor-pointer md:cursor-default active:scale-[0.99] md:active:scale-100'
                                                            }`}
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${unit.percentage >= 85 ? 'bg-emerald-500' : unit.percentage > 50 ? 'bg-amber-400' : 'bg-rose-500'} group-hover:w-1.5 transition-all`}></div>
                                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                                            <CircularGauge
                                                                percentage={unit.percentage}
                                                                size={40}
                                                                strokeWidth={3.5}
                                                                color={unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-400' : 'text-rose-500'}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-white uppercase leading-tight pr-2 truncate">{unit.description}</h3>
                                                                {unit.lastReportedAt ? (
                                                                    <p className="text-[8px] sm:text-[9px] font-black text-primary mt-0.5 uppercase tracking-tight">
                                                                        {(() => {
                                                                            const diffMs = new Date().getTime() - new Date(unit.lastReportedAt).getTime();
                                                                            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                                                            const diffMins = Math.floor(diffMs / (1000 * 60));
                                                                            return `há ${diffHrs > 0 ? `${diffHrs} h` : `${diffMins} min`}`;
                                                                        })()}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Sem registros</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
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
                                                    </Card>

                                                    {/* Assets Grid - Fixed on Desktop, Collapsible on Mobile */}
                                                    <div className={`${isExpanded ? 'flex animate-in slide-in-from-top-1 fade-in duration-300 mb-2' : 'hidden md:flex'} flex-1 w-full overflow-hidden`}>
                                                        <AssetScrollRow
                                                            assets={unit.assets}
                                                            onAssetClick={setSelectedAssetForModal}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="relative w-full h-[600px] lg:h-[calc(100vh-380px)] min-h-[500px]">
                                        <UnitsAvailabilityMap
                                            units={unitsRows}
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
                                            <div className="absolute bottom-4 left-4 right-4 z-3000 animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto">
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
                                                                    <IconButton
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

            {/* Asset Detail Modal */}
            <Modal
                isOpen={!!selectedAssetForModal}
                onClose={() => {
                    setSelectedAssetForModal(null);
                    closeSSForm();
                }}
                title="Detalhes da Disponibilidade"
                maxWidth="sm"
                fullScreenMobile
                draggable
            >
                {modalLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3">
                        <Loading size="md" text="Carregando dados..." />
                    </div>
                ) : modalData ? (
                    <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 pb-8 sm:pb-10">

                        {/* Header Info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                            <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] flex items-center justify-center shadow-lg transition-transform shrink-0 ${modalData.isAvailable ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                                    <span className="material-symbols-outlined text-2xl sm:text-3xl [font-variation-settings:'FILL'_1]">
                                        {modalData.isAvailable ? 'thumb_up' : 'thumb_down'}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
                                    <span className="text-[12px] sm:text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight truncate">
                                        {modalData.unit_description}
                                    </span>
                                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                                        {modalData.asset_tag_tag_sub_description}{modalData.asset_tag_item_description ? ` > ${modalData.asset_tag_item_description}` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3 items-start w-full sm:w-auto">
                                {modalData.last_provider_company_logo && (
                                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-center p-1.5 sm:p-2 shrink-0">
                                        <OptimizedImage
                                            src={modalData.last_provider_company_logo}
                                            alt="Empresa"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                <IconButton
                                    icon="engineering"
                                    onClick={() => {
                                        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                        openSSForm();
                                    }}
                                    className={`h-10 w-10 sm:h-11 sm:w-11 transition-all rounded-xl sm:rounded-2xl active:scale-95 shrink-0 ${
                                        showSSForm
                                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                    }`}
                                    title="Nova Solicitação de Serviço"
                                />
                            </div>
                        </div>



                        {/* Dedicated Image Section if available */}
                        {modalData.last_reported_image && (
                            <div
                                className="w-full h-40 sm:h-48 rounded-[24px] sm:rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800/50 shadow-sm cursor-pointer hover:opacity-95 transition-all group relative"
                                onClick={() => setLightboxImage(modalData.last_reported_image)}
                            >
                                <OptimizedImage
                                    src={modalData.last_reported_image}
                                    alt="Evidência"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-white text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                                </div>
                            </div>
                        )}

                        {/* Status Grid */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 space-y-2.5 sm:space-y-3 border border-slate-100 dark:border-slate-800/50">
                            {!modalData.isAvailable && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</span>
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase text-right truncate ml-2">
                                        {modalData.last_asset_unavailable_reason_description || 'NÃO INFORMADO'}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Operação</span>
                                <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-white">
                                    {modalData.isAvailable ? '1' : '0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Registro</span>
                                <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 tabular-nums">
                                    #{modalData.last_asset_available_id}
                                </span>
                            </div>
                        </div>

                        {/* Reporter Section */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="p-0.5">
                                    <CompanyAvatar
                                        src={modalData.last_reported_by_company_logo}
                                        name="Equipe"
                                        size="md"
                                        className="rounded-xl!"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {modalData.last_reported_user_name_short || modalData.last_reported_by_name || modalData.last_created_user_name_short || 'Desconhecido'}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                                        {modalData.last_reported_at ? formatDateTime(modalData.last_reported_at) : 'Sem data'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Inline SS Creation Form */}
                        {showSSForm && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                {/* Step indicator */}
                                <div className="flex items-center w-full mb-3 px-1 gap-1">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                        ssFormStep >= 1 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>1</div>
                                    <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                        ssFormStep >= 2 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>2</div>
                                    <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 3 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                        ssFormStep >= 3 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>3</div>
                                    <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 4 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                        ssFormStep >= 4 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>4</div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[20px] p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                                    {ssFormStep === 1 && (
                                        <Select
                                            label="Tipo de OS"
                                            required
                                            value={ssFormData.orderTypeId}
                                            onChange={(e) => setSsFormData(prev => ({ ...prev, orderTypeId: e.target.value }))}
                                            options={orderTypes.map(t => ({ value: t.id, label: t.description }))}
                                            placeholder="Selecione o Tipo"
                                        />
                                    )}

                                    {ssFormStep === 2 && (
                                        <Select
                                            label="Prioridade"
                                            value={ssFormData.priorityId}
                                            onChange={(e) => setSsFormData(prev => ({ ...prev, priorityId: e.target.value }))}
                                            options={priorities.map(p => ({ value: p.id, label: p.description }))}
                                            placeholder="Selecione a Prioridade"
                                        />
                                    )}

                                    {ssFormStep === 3 && (
                                        <Textarea
                                            label="Descrição do Problema"
                                            required
                                            rows={3}
                                            value={ssFormData.requestedServices}
                                            onChange={(e) => setSsFormData(prev => ({ ...prev, requestedServices: e.target.value }))}
                                            placeholder="Descreva a necessidade com detalhes..."
                                        />
                                    )}

                                    {ssFormStep === 4 && (
                                        <div className="py-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                        Receber notificações
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                                        Acompanhe as atualizações desta solicitação
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSsFormData(prev => ({ ...prev, receiveNotifications: !prev.receiveNotifications }))}
                                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
                                                        ssFormData.receiveNotifications ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                    }`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                        ssFormData.receiveNotifications ? 'translate-x-6' : 'translate-x-0'
                                                    }`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Actions */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={ssFormStep === 1 ? closeSSForm : () => setSsFormStep(prev => prev - 1)}
                                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                                        >
                                            {ssFormStep === 1 ? 'Cancelar' : 'Voltar'}
                                        </button>
                                        {ssFormStep < 4 ? (
                                            <button
                                                onClick={handleSSFormNext}
                                                disabled={(ssFormStep === 1 && !ssFormData.orderTypeId) || (ssFormStep === 3 && !ssFormData.requestedServices)}
                                                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Próximo
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSSFormSubmit}
                                                disabled={ssFormLoading}
                                                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {ssFormLoading ? (
                                                    <Loading size="xs" />
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm">send</span>
                                                        Enviar
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Active Order Card */}
                        {activeOrdersForModal.length > 0 && !showSSForm && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in zoom-in duration-300 mx-1 relative">
                                {/* Header Row: Arrow - Title - Arrow */}
                                <div className="flex items-center justify-between mb-4">
                                    {activeOrdersForModal.length > 1 ? (
                                        <button
                                            onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentOrderIndex === 0}
                                            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0 ${currentOrderIndex === 0 ? 'text-slate-200 dark:text-slate-800' : 'text-amber-700 bg-amber-200/50 hover:bg-amber-200 active:scale-90 shadow-sm'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                                        </button>
                                    ) : <div className="w-8" />}

                                    <div className="flex flex-col items-center">
                                        <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-[0.2em] text-center">
                                            {activeOrdersForModal.length === 1
                                                ? 'SOLICITAÇÃO ATIVA'
                                                : `${currentOrderIndex + 1}/${activeOrdersForModal.length} SOLICITAÇÕES ATIVAS`}
                                        </h4>
                                    </div>

                                    {activeOrdersForModal.length > 1 ? (
                                        <button
                                            onClick={() => setCurrentOrderIndex(prev => Math.min(activeOrdersForModal.length - 1, prev + 1))}
                                            disabled={currentOrderIndex === activeOrdersForModal.length - 1}
                                            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0 ${currentOrderIndex === activeOrdersForModal.length - 1 ? 'text-slate-200 dark:text-slate-800' : 'text-amber-700 bg-amber-200/50 hover:bg-amber-200 active:scale-90 shadow-sm'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                                        </button>
                                    ) : <div className="w-8" />}
                                </div>

                                {/* Body: SS Info - Left Aligned */}
                                <div className="flex flex-col items-start px-1">
                                    {activeOrdersForModal[currentOrderIndex] && (
                                        <div className="flex flex-col items-start gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300 w-full">
                                            <div className="flex items-center justify-between gap-2 mb-1 w-full">
                                                <span className="text-sm font-black text-white bg-amber-600 px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
                                                    {activeOrdersForModal[currentOrderIndex].order_mask || activeOrdersForModal[currentOrderIndex].id}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase tracking-tighter text-right">
                                                        {activeOrdersForModal[currentOrderIndex].status_description}
                                                    </span>
                                                    {activeOrdersForModal[currentOrderIndex].statusAt && (
                                                        <span className="text-[9px] font-bold text-amber-800/40 dark:text-amber-400/40 text-right">
                                                            {new Date(activeOrdersForModal[currentOrderIndex].statusAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-1 leading-snug max-w-[280px] text-left">
                                                {activeOrdersForModal[currentOrderIndex].requested_services || 'Sem descrição'}
                                            </p>

                                            {ratingOrderId === activeOrdersForModal[currentOrderIndex].id ? (
                                                <div className="mt-4 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
                                                    <span className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase tracking-widest">Avalie o Serviço</span>
                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setSelectedRating(prev => prev === star ? 0 : star)}
                                                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${selectedRating >= star ? 'text-amber-500 scale-110' : 'text-slate-300 dark:text-slate-700 hover:text-amber-200'}`}
                                                            >
                                                                <span className={`material-symbols-outlined text-2xl ${selectedRating >= star ? 'fill-1' : ''}`}>
                                                                    star
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4 w-full">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRatingOrderId(null);
                                                                setSelectedRating(0);
                                                            }}
                                                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCompleteOrder(activeOrdersForModal[currentOrderIndex].id, selectedRating);
                                                            }}
                                                            disabled={!!completingOrderId}
                                                            className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-4 px-4 whitespace-nowrap"
                                                        >
                                                            {completingOrderId ? (
                                                                <Loading size="xs" />
                                                            ) : (
                                                                <>
                                                                    <span className="material-symbols-outlined text-base">
                                                                        {selectedRating > 0 ? 'star' : 'done'}
                                                                    </span>
                                                                    {selectedRating > 0 ? `Confirmar (${selectedRating})` : 'Notificar sem avaliar'}
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRating(0);
                                                        setRatingOrderId(activeOrdersForModal[currentOrderIndex].id);
                                                    }}
                                                    disabled={!!completingOrderId}
                                                    className="mt-4 w-full py-2.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-xl text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-base">checklist</span>
                                                    Conclusão Serviço
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Availability History with period navigation */}
                        <AvailabilityHistory
                            history={history7Days}
                            loading={historyLoading}
                            offsetDays={historyOffset}
                            onOffsetChange={(dir) => {
                                setHistoryOffset(prev => dir === 'prev' ? prev + 7 : Math.max(0, prev - 7));
                            }}
                        />
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        Erro ao carregar detalhes
                    </div>
                )}
            </Modal>

            {lightboxImage && (
                <PhotoViewer
                    src={lightboxImage}
                    onClose={() => setLightboxImage(null)}
                    alt="Evidência Fotográfica"
                />
            )}

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
        </div>
    );
};
