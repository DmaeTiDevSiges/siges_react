import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabase';
import { User, System } from '../../types';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { AvailabilityHistory } from '../../components/ui/AvailabilityHistory';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { AvailabilityExportModal } from './components/AvailabilityExportModal';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { ServiceRequestForm } from '../ServiceRequest/ServiceRequestForm';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';


// Subcomponent for Circular Gauge
const CircularGauge: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string; labelSize?: string }> = ({
    percentage,
    size = 48,
    strokeWidth = 4,
    color = 'text-emerald-500',
    labelSize = 'text-[10px]'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${color} transition-all duration-700 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`absolute ${labelSize} font-black ${color} tracking-tighter`}>
                {percentage}%
            </span>
        </div>
    );
};

// Scrollable row of asset cards with drag-to-scroll support
const AssetScrollRow: React.FC<{ assets: any[]; onAssetClick: (asset: any) => void; onSSClick: (asset: any) => void }> = ({ assets, onAssetClick, onSSClick }) => {
    const { ref, dragHandlers } = useDragToScroll<HTMLDivElement>();
    return (
        <div
            ref={ref}
            {...dragHandlers}
            className="flex-1 flex gap-3 overflow-x-auto no-scrollbar py-1.5 px-1 cursor-grab active:cursor-grabbing"
        >
            {assets.map((asset: any) => (
                <Card
                    key={asset.id}
                    onClick={() => asset.isActive && onAssetClick(asset)}
                    className={`shrink-0 min-w-[120px] w-fit p-2.5 rounded-[16px]! flex flex-col items-center justify-between text-center relative transition-all min-h-[88px] h-auto border-slate-200 dark:border-slate-800 ${
                        asset.isActive
                            ? 'hover:shadow-lg active:scale-[0.98] cursor-pointer group'
                            : 'opacity-40 grayscale cursor-default'
                    }`}
                >
                    <div className="w-full px-1">
                        <span className={`text-[10px] font-black uppercase tracking-tight whitespace-nowrap block transition-colors ${
                            asset.isActive
                                ? 'text-slate-800 dark:text-slate-300 group-hover:text-primary'
                                : 'text-slate-500 dark:text-slate-500'
                        }`}>
                            {asset.description}
                        </span>
                    </div>

                    <div className="relative my-1 flex items-center justify-center">
                        {asset.isActive ? (
                            <span className={`material-symbols-outlined text-2xl transition-transform group-hover:scale-110 ${asset.isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
                                {asset.isAvailable ? 'thumb_up' : 'thumb_down'}
                            </span>
                        ) : (
                            <span className="material-symbols-outlined text-2xl text-slate-400">block</span>
                        )}
                        {asset.isActive && asset.orderId && !asset.isAvailable && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm">
                                <span className="text-[8px] font-black text-white leading-none">!</span>
                            </div>
                        )}
                        {asset.isActive && asset.reportedImage && (
                            <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[10px] text-slate-400">photo_camera</span>
                            </div>
                        )}
                    </div>


                    <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{asset.value || '0'}<span className="text-[8px] opacity-60 ml-0.5">{asset.unit}</span></p>

                    {/* Quick SS Action (Visible on Hover/Always on Mobile) */}
                    {asset.isActive && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                onSSClick(asset);
                            }}
                            className={`absolute -top-1 -right-1 w-7 h-7 bg-primary dark:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-10 hover:scale-110 active:scale-90 ${
                                Capacitor.isNativePlatform() ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Solicitar SS"
                        >
                            <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                        </button>
                    )}
                </Card>
            ))}
        </div>
    );
};


interface DashboardUnitsAssetsTagsProps {
    currentUser: User | null;
}

export const DashboardUnitsAssetsTags: React.FC<DashboardUnitsAssetsTagsProps> = ({ currentUser }) => {
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
    const [selectedAssetForSS, setSelectedAssetForSS] = useState<any | null>(null);

    // Accordion state for mobile
    const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);

    // Export Modal State
    const [unitForExport, setUnitForExport] = useState<any | null>(null);

    // Active Asset Tag ID based on selectedSectorName
    const activeAssetTagId = useMemo(() => {
        const row = allData.find(r => (r.tag_description || 'Geral') === selectedSectorName);
        return row?.asset_tag_id;
    }, [allData, selectedSectorName]);

    // Drag-to-scroll for the sector cards strip
    const { ref: sectorsScrollRef, dragHandlers: sectorsDragHandlers } = useDragToScroll<HTMLDivElement>();

    useEffect(() => {
        if (!selectedAssetForModal?.id) return;
        
        const fetchDetailInfo = async () => {
            setModalLoading(true);
            try {
                const data = await dataService.getUnitAssetTagItemById(selectedAssetForModal.id);
                setModalData(data);
            } catch (error) {
                console.error('Error fetching detail info:', error);
                setModalData(null);
            } finally {
                setModalLoading(false);
            }
        };

        fetchDetailInfo();
    }, [selectedAssetForModal?.id]);

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

    // Reset history offset when modal closes or asset changes
    useEffect(() => {
        if (!selectedAssetForModal) {
            setHistoryOffset(0);
        }
    }, [selectedAssetForModal?.id]);

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
            
            // Group by description to find first sector name
            if (data && data.length > 0) {
                const firstSector = data[0].tag_description || 'Geral';
                setSelectedSectorName(prev => prev && data.some((d: any) => d.tag_description === prev) ? prev : firstSector);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            if (!silent) toast.error('Erro ao carregar dados do dashboard');
        } finally {
            if (!silent) setLoading(false);
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
                    assets: []
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
                    displayValue = row.total_flow_rate_max ?? row.flow_rate_max ?? row.last_flow_rate;
                    displayUnit = row.flow_rate_unit || '';
                } else if (row.power_is_visible) {
                    displayValue = row.total_power_max ?? row.power_max ?? row.last_power_last;
                    displayUnit = row.power_unit || '';
                } else if (row.pressure_is_visible) {
                    displayValue = row.total_pressure_max ?? row.pressure_max ?? row.last_pressure_last;
                    displayUnit = row.pressure_unit || '';
                }

                unit.assets.push({
                    id: row.id,
                    subId: row.asset_tag_sub_id,
                    description: row.tag_sub_description || 'Equip.',
                    isAvailable: row.last_is_available,
                    isActive: row.is_active,
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
                    unitId: row.unit_id,
                    unitDescription: row.unit_description,
                    sectorName: row.tag_description,
                    companyLogo: row.last_provider_company_logo,
                    clientId: row.client_id,
                    clientName: row.client_name
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

    const systemOptions = useMemo(() => 
        systems.map(s => ({ value: s.id, label: s.description })),
    [systems]);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden px-6 py-4">
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Sistema</h1>
                    <div className="flex items-center gap-3 min-w-[300px]">
                        <Select 
                            options={systemOptions}
                            value={selectedSystemId}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setSelectedSystemId(newId);
                                loadDashboardData(newId);
                            }}
                            className="h-11! shadow-sm border-none bg-slate-100 dark:bg-slate-800"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[240px]">
                        <SearchInput 
                            placeholder="Buscar unidade..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClear={() => setSearchQuery('')}
                            className="shadow-sm border-none bg-slate-100 dark:bg-slate-800 h-11!"
                        />
                    </div>

                    <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-full border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm">
                        <button 
                            onClick={() => setSortMode('disponibilidade')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${sortMode === 'disponibilidade' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Disponibilidade
                        </button>
                        <button 
                            onClick={() => setSortMode('alfabetica')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${sortMode === 'alfabetica' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Alfabética
                        </button>
                    </div>
                </div>
            </header>

            {/* Top Cards: Disponibilidades por Setores */}
            <section className="shrink-0 mb-8 overflow-hidden px-1">
                <div className="flex items-center justify-between gap-4 mb-4 px-1">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">Disponibilidade por Setores</h3>
                    
                    {/* Latest Activity Line */}
                    {systemSummary?.lastReportedAt && (
                        <div className="flex items-center gap-3 px-1">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">Última Atividade:</span>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{systemSummary.latestUnit}</p>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <p className="text-[10px] font-black text-primary uppercase tracking-tight">{systemSummary.latestSubTag}</p>
                            </div>
                            
                            {systemSummary.latestAvatar && (
                                <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm" title={systemSummary.latestUser}>
                                    <img 
                                        src={systemSummary.latestAvatar} 
                                        alt={systemSummary.latestUser} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 ml-1 pl-3 border-l border-slate-200 dark:border-slate-700">
                                <span className="material-symbols-outlined text-[14px] text-primary/60">schedule</span>
                                <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
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
                    className="flex gap-3 overflow-x-auto no-scrollbar py-3 px-1 cursor-grab active:cursor-grabbing"
                >
                    {/* Sector Cards only */}
                    {sectorsStats.map((sector) => (
                        <Card
                            key={sector.name}
                            onClick={() => setSelectedSectorName(sector.name)}
                            className={`shrink-0 min-w-[176px] w-fit p-3 px-4 rounded-[20px]! cursor-pointer transition-all flex items-center justify-between gap-4 h-[70px]! ${
                                selectedSectorName === sector.name 
                                ? 'ring-2 ring-primary border-transparent shadow-xl shadow-primary/10' 
                                : 'hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="text-left min-w-0 pr-2">
                                <p className={`text-[11px] font-black uppercase whitespace-nowrap leading-tight tracking-tight ${selectedSectorName === sector.name ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {sector.name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1">
                                    {sector.flow.visible ? sector.flow.unit : sector.power.visible ? sector.power.unit : sector.pressure.visible ? sector.pressure.unit : sector.general.unit}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {sector.flow.visible && (
                                    <CircularGauge 
                                        percentage={sector.flow.percentage} 
                                        size={44} 
                                        strokeWidth={3.5}
                                        color={sector.flow.percentage >= 85 ? 'text-emerald-500' : sector.flow.percentage > 50 ? 'text-amber-500' : 'text-rose-500'} 
                                    />
                                )}
                                {sector.power.visible && (
                                    <CircularGauge 
                                        percentage={sector.power.percentage} 
                                        size={44} 
                                        strokeWidth={3.5}
                                        color={sector.power.percentage >= 85 ? 'text-emerald-500' : sector.power.percentage > 50 ? 'text-amber-500' : 'text-rose-500'} 
                                    />
                                )}
                                {sector.pressure.visible && (
                                    <CircularGauge 
                                        percentage={sector.pressure.percentage} 
                                        size={44} 
                                        strokeWidth={3.5}
                                        color={sector.pressure.percentage >= 85 ? 'text-emerald-500' : sector.pressure.percentage > 50 ? 'text-amber-500' : 'text-rose-500'} 
                                    />
                                )}
                                {sector.general.visible && (
                                    <CircularGauge 
                                        percentage={sector.general.percentage} 
                                        size={44} 
                                        strokeWidth={3.5}
                                        color={sector.general.percentage >= 85 ? 'text-emerald-500' : sector.general.percentage > 50 ? 'text-amber-500' : 'text-rose-500'} 
                                    />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
            <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Ativos...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {unitsRows.map(unit => {
                            const isExpanded = expandedUnitId === unit.id;
                            
                            return (
                                <div key={unit.id} className="flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-center">
                                    {/* Unit Info Card */}
                                    <Card 
                                        onClick={() => {
                                            if (window.innerWidth < 768) {
                                                if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                                setExpandedUnitId(isExpanded ? null : unit.id);
                                            }
                                        }}
                                        className={`shrink-0 w-full md:w-auto md:min-w-[256px] p-3 rounded-[20px]! min-h-[88px] h-auto flex items-center justify-between relative group overflow-hidden border-slate-200 dark:border-slate-800 transition-all ${
                                            isExpanded ? 'ring-2 ring-primary border-transparent' : 'cursor-pointer md:cursor-default active:scale-[0.99] md:active:scale-100'
                                        }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${unit.percentage >= 85 ? 'bg-emerald-500' : unit.percentage > 50 ? 'bg-amber-400' : 'bg-rose-500'} group-hover:w-1.5 transition-all`}></div>
                                        <div className="flex items-center gap-2.5">
                                            <CircularGauge 
                                                percentage={unit.percentage} 
                                                size={44} 
                                                strokeWidth={3.5}
                                                color={unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-500' : 'text-rose-500'} 
                                            />
                                            <div className="min-w-0">
                                                <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase leading-tight pr-2">{unit.description}</h3>
                                                {unit.lastReportedAt ? (
                                                    <p className="text-[9px] font-black text-primary mt-0.5 uppercase tracking-tight">
                                                        {(() => {
                                                            const diffMs = new Date().getTime() - new Date(unit.lastReportedAt).getTime();
                                                            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                                            const diffMins = Math.floor(diffMs / (1000 * 60));
                                                            return `há ${diffHrs > 0 ? `${diffHrs} h` : `${diffMins} min`}`;
                                                        })()}
                                                    </p>
                                                ) : (
                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Sem registros</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUnitForExport(unit);
                                                }}
                                                className="h-8 w-8 items-center justify-center rounded-full text-primary/30 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hidden md:flex"
                                                title="Exportar Excel"
                                            >
                                                <RiFileExcel2Fill size={18} />
                                            </button>
                                            
                                            <span className={`material-symbols-outlined text-slate-400 transition-transform md:hidden ${isExpanded ? 'rotate-180 text-primary' : ''}`}>
                                                expand_more
                                            </span>
                                        </div>
                                    </Card>

                                    {/* Assets Grid - Fixed on Desktop, Collapsible on Mobile */}
                                    <div className={`${isExpanded ? 'flex animate-in slide-in-from-top-1 fade-in duration-300 mb-2' : 'hidden md:flex'} flex-1 w-full overflow-hidden`}>
                                        <AssetScrollRow
                                            assets={unit.assets}
                                            onAssetClick={setSelectedAssetForModal}
                                            onSSClick={setSelectedAssetForSS}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Asset Detail Modal */}
            <Modal
                isOpen={!!selectedAssetForModal}
                onClose={() => {
                    setSelectedAssetForModal(null);
                }}
                title="Detalhes da Disponibilidade"
                maxWidth="sm"
            >
                {modalLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando dados...</p>
                    </div>
                ) : modalData ? (
                    <div className="flex flex-col gap-3 p-2">
                        {/* Header Info */}
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg transition-transform ${modalData.isAvailable ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                                    <span className="material-symbols-outlined text-3xl [font-variation-settings:'FILL'_1]">
                                        {modalData.isAvailable ? 'thumb_up' : 'thumb_down'}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center gap-0.5">
                                    <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                                        {modalData.unit_description}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {modalData.asset_tag_tag_sub_description}{modalData.asset_tag_item_description ? ` > ${modalData.asset_tag_item_description}` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                {modalData.last_provider_company_logo && (
                                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-center p-2">
                                        <OptimizedImage 
                                            src={modalData.last_provider_company_logo} 
                                            alt="Empresa" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                <IconButton 
                                    icon="add" 
                                    onClick={() => {
                                        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                        setSelectedAssetForSS(modalData);
                                    }}
                                    className="h-11 w-11 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-2xl active:scale-95"
                                    title="Nova Solicitação de Serviço"
                                />
                            </div>
                        </div>

                        {/* Dedicated Image Section if available */}
                        {modalData.last_reported_image && (
                            <div 
                                className="w-full h-48 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800/50 shadow-sm cursor-pointer hover:opacity-95 transition-all group relative"
                                onClick={() => setLightboxImage(modalData.last_reported_image)}
                            >
                                <OptimizedImage 
                                    src={modalData.last_reported_image} 
                                    alt="Evidência" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                                </div>
                            </div>
                        )}

                        {/* Status Grid */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-4 space-y-3 border border-slate-100 dark:border-slate-800/50">
                            {!modalData.isAvailable && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                        {modalData.last_asset_unavailable_reason_description || 'NÃO INFORMADO'}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operação</span>
                                <span className="text-xs font-black text-slate-800 dark:text-white">
                                    {modalData.isAvailable ? '1' : '0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Registro</span>
                                <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                                    #{modalData.last_asset_available_id}
                                </span>
                            </div>
                        </div>

                        {/* Reporter Section */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className="p-0.5">
                                    <CompanyAvatar 
                                        src={modalData.last_reported_by_company_logo} 
                                        name="Equipe" 
                                        size="md"
                                        className="rounded-xl!"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {modalData.last_reported_user_name_short || modalData.last_reported_by_name || modalData.last_created_user_name_short || 'Desconhecido'}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                                        {modalData.last_reported_at ? formatDateTime(modalData.last_reported_at) : 'Sem data'}
                                    </span>
                                </div>
                            </div>
                        </div>

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
            {/* SS Form Bottom Sheet - Integrated Suggestion 2 & 3 */}
            <BottomSheet
                isOpen={!!selectedAssetForSS}
                onClose={() => setSelectedAssetForSS(null)}
                showCloseButton={false}
            >
                {selectedAssetForSS && (
                    <ServiceRequestForm 
                        onBack={() => setSelectedAssetForSS(null)}
                        initialData={{
                            clientId: selectedAssetForSS.clientId || selectedAssetForSS.client_id,
                            unitId: selectedAssetForSS.unit_id || selectedAssetForSS.unitId,
                            unitAssetTagId: selectedAssetForSS.id,
                            requestedServices: `${selectedAssetForSS.description}: ${selectedAssetForSS.suspendedReason || ''} ${selectedAssetForSS.lastComments || ''}`.trim()
                        }}
                        initialContext={{
                            clientName: selectedAssetForSS.clientName || selectedAssetForSS.client_name,
                            unitDescription: selectedAssetForSS.unitDescription || selectedAssetForSS.unit_description,
                            assetTagDescription: `${selectedAssetForSS.sectorName || selectedAssetForSS.asset_tag_tag_sub_description} > ${selectedAssetForSS.description || selectedAssetForSS.asset_tag_item_description}`,
                            companyLogo: selectedAssetForSS.companyLogo || selectedAssetForSS.last_provider_company_logo
                        }}
                        onSubmit={() => {
                            setSelectedAssetForSS(null);
                            setSelectedAssetForModal(null);
                            loadDashboardData(selectedSystemId, true);
                        }}
                    />
                )}
            </BottomSheet>
        </div>
    );
};
