import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Company, User, OrderVisit, OrderVisitTeam, OrderFilters, Asset, Order } from '../../types';
import { dataService } from '../../services/dataService';
import { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { getInitials } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { Calendar } from '../../components/ui/Calendar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { formatCurrency } from '../../utils/formatters';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';

interface DashboardOrdersVisitsTodayScreenProps {
    company: Company;
    onBack?: () => void;
}

interface DashboardVisit {
    id: string;
    ovMask?: string;
    ovStatusId: number;
    statusDescription?: string;
    unitDescription?: string;
    unitLatitude?: number;
    unitLongitude?: number;
    requestedServices?: string;
    ovStartedAt?: string;
    ovCreatedAt?: string;
    progress?: number;
    teamLeaderId?: string;
    teamLeaderName?: string;
    clientName?: string;
    orderMask?: string;
    totalValue?: number;
    systemParentId?: string;
    unitTypeParentId?: string;
    orderTypeId?: string;
}

interface DashboardFilters {
    statusId: string[];
    systemParentId: string[];
    unitTypeParentId: string[];
    orderTypeId: string[];
}

interface VisitStats {
    total: number;
    open: number;
    closed: number;
    totalValue?: number;
}

// Helper Component for Animated Count
const AnimatedCount: React.FC<{ value: number; active?: boolean; color?: string }> = ({ value, active, color }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (value !== displayValue) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    return (
        <span
            className={`text-base font-black transition-all duration-300 ${isAnimating ? 'scale-125 text-primary brightness-150' : 'scale-100'} ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}
        >
            {displayValue}
        </span>
    );
};

interface StatCardProps {
    icon: string;
    label: string;
    count: number;
    totalValue?: number;
    color: string;
    active?: boolean;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, totalValue, color, active, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`backdrop-blur-sm p-4 rounded-[16px] border shadow-sm transition-all cursor-pointer flex-1 min-w-[140px] shrink-0 ${active
                ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-')}/10`}>
                    <span className={`material-symbols-outlined text-[20px] ${color}`}>
                        {icon}
                    </span>
                </div>
                {totalValue !== undefined && (
                    <span className={`text-base font-black transition-all duration-300 ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(totalValue)}
                    </span>
                )}
            </div>
            <div className="flex justify-between items-center">
                <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{label}</p>
                <AnimatedCount value={count} active={active} />
            </div>
        </div>
    );
};

export const DashboardOrdersVisitsTodayScreen: React.FC<DashboardOrdersVisitsTodayScreenProps> = ({ company, onBack }) => {
    // --- States ---
    const [users, setUsers] = useState<User[]>([]);
    const [leaders, setLeaders] = useState<User[]>([]);
    const [visits, setVisits] = useState<DashboardVisit[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const [selectedVisitIds, setSelectedVisitIds] = useState<Set<string>>(new Set());
    const [unitsData, setUnitsData] = useState<Record<string, { lat: number, lng: number, imageUrl?: string }>>({});
    const [visitsTeams, setVisitsTeams] = useState<Record<string, OrderVisitTeam[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Filter States
    const [filters, setFilters] = useState<DashboardFilters>({
        statusId: [],
        systemParentId: [],
        unitTypeParentId: [],
        orderTypeId: []
    });
    
    const [filterOptions, setFilterOptions] = useState({
        systems: [] as any[],
        unitTypes: [] as any[],
        orderTypes: [] as any[]
    });

    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return { start: dateStr, end: dateStr };
    });

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'open' | 'closed'>('all');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});

    // --- Memos & Helpers ---
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const formatDateDisplay = (dateString?: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 1: return 'bg-orange-500'; // Em aberlo
            case 2: return 'bg-blue-500';   // Em execução
            case 3: return 'bg-green-500';  // Concluído
            case 7: return 'bg-red-500';    // Cancelado
            default: return 'bg-slate-500';
        }
    };

    // Filter Logic
    const filteredVisits = useMemo(() => {
        return visits.filter(visit => {
            // Stat Filter
            if (activeStatFilter === 'open' && visit.ovStatusId !== 1) return false;
            if (activeStatFilter === 'closed' && visit.ovStatusId !== 3) return false;

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    visit.ovMask?.toLowerCase().includes(query) ||
                    visit.unitDescription?.toLowerCase().includes(query) ||
                    visit.clientName?.toLowerCase().includes(query) ||
                    visit.teamLeaderName?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Leader Filter
            if (selectedLeaderId && visit.teamLeaderId !== selectedLeaderId) return false;

            // Advanced Filters
            if (filters.statusId?.length && !filters.statusId.includes(String(visit.ovStatusId))) return false;
            if (filters.systemParentId?.length && !filters.systemParentId.includes(String(visit.systemParentId))) return false;
            if (filters.unitTypeParentId?.length && !filters.unitTypeParentId.includes(String(visit.unitTypeParentId))) return false;
            if (filters.orderTypeId?.length && !filters.orderTypeId.includes(String(visit.orderTypeId))) return false;

            return true;
        });
    }, [visits, activeStatFilter, searchQuery, selectedLeaderId, filters]);

    const stats = useMemo(() => {
        const base = visits;
        return {
            total: base.length,
            open: base.filter(v => v.ovStatusId === 1).length,
            closed: base.filter(v => v.ovStatusId === 3).length,
            totalValue: base.reduce((acc, v) => acc + (parseFloat(String(v.totalValue || 0)) || 0), 0)
        };
    }, [visits]);

    // --- Data Loading ---
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // Load Visits using the new view and date range
            const visitsData = await dataService.getOrdersVisitsView();
            // Filter by date range (naive filter for now as getOrdersVisitsView doesn't take params)
            const filteredByDate = visitsData.filter(v => {
                const date = (v.ov_started_at || v.ov_created_at || '').split('T')[0];
                return date >= dateRange.start && date <= dateRange.end;
            });

            // Map visits to our structure
            const mappedVisits: DashboardVisit[] = filteredByDate.map(row => ({
                id: row.id.toString(),
                ovMask: row.ov_mask,
                ovStatusId: row.ov_status_id,
                statusDescription: row.ov_status_description,
                unitDescription: row.unit_description,
                unitLatitude: row.unit_latitude,
                unitLongitude: row.unit_longitude,
                requestedServices: row.requested_services,
                ovStartedAt: row.ov_started_at,
                ovCreatedAt: row.ov_created_at,
                progress: row.ov_progress,
                teamLeaderId: row.team_leader_id?.toString(),
                teamLeaderName: row.team_leader_name_short,
                clientName: row.client_name,
                orderMask: row.order_mask,
                totalValue: row.ov_total_value,
                systemParentId: row.o_system_parent_id?.toString(),
                unitTypeParentId: row.o_unit_type_parent_id?.toString(),
                orderTypeId: row.o_type_id?.toString()
            }));

            setVisits(mappedVisits);

            // Load Metadata for filters if not already loaded
            if (filterOptions.systems.length === 0) {
                const [systems, unitTypes, orderTypes] = await Promise.all([
                    dataService.getSystemsParent(),
                    dataService.getUnitTypesParent(),
                    dataService.getOrderTypes()
                ]);
                setFilterOptions({
                    systems: systems.map(s => ({ value: s.id, label: s.description })),
                    unitTypes: unitTypes.map(u => ({ value: u.id, label: u.description })),
                    orderTypes: orderTypes.map(o => ({ value: o.id, label: o.description }))
                });
            }

            // Load Leaders
            const [usersData] = await Promise.all([
                dataService.getUsers()
            ]);
            setUsers(usersData);
            const leadersList = usersData.filter(u => u.profileId === '3' || u.profileId === 'Líder'); // Adjust condition based on how profile is returned
            setLeaders(leadersList);
            // loadTeams(mappedVisits.map(v => v.id));
        } catch (error) {
            console.error('Error loading analytics data:', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [dateRange]);

    // --- Map Logic ---
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const leafletMap = L.map(mapContainerRef.current, {
            center: [-3.1019, -60.025],
            zoom: 12,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);
        mapRef.current = leafletMap;

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        // Add markers for filtered visits
        filteredVisits.forEach(visit => {
            if (visit.unitLatitude && visit.unitLongitude) {
                const statusColor = visit.ovStatusId === 1 ? '#f97316' : '#3b82f6';
                const markerIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                        <div class="relative group">
                            <div class="w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-110" style="background-color: ${statusColor}">
                                <span class="material-symbols-outlined text-white text-[20px]">person</span>
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" style="background-color: ${visit.ovStatusId === 1 ? '#ef4444' : '#22c55e'}"></div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });

                const marker = L.marker([visit.unitLatitude, visit.unitLongitude], { icon: markerIcon })
                    .addTo(mapRef.current!)
                    .bindPopup(`
                        <div class="p-2">
                            <p class="font-bold text-sm mb-1">${visit.unitDescription || 'Unidade'}</p>
                            <p class="text-xs text-slate-500 mb-2">${visit.ovMask || ''}</p>
                            <p class="text-xs font-bold ${visit.ovStatusId === 1 ? 'text-orange-500' : 'text-blue-500'}">${visit.statusDescription || ''}</p>
                        </div>
                    `);

                markersRef.current[visit.id] = marker;
            }
        });

        // Fit bounds if markers exist
        const markersArray = Object.values(markersRef.current);
        if (markersArray.length > 0) {
            const group = L.featureGroup(markersArray);
            mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }, [filteredVisits]);

    // --- Handlers ---
    const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleVisitSelection = (id: string) => {
        setSelectedVisitIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDateSelect = (date: string) => {
        setDateRange({ start: date, end: date });
        setIsCalendarOpen(false);
    };

    // --- Render Parts ---
    
    const Header = () => (
        <div className="bg-white/90 dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-white/5 backdrop-blur-md sticky top-0 z-60 px-6 py-4">
            <div className="max-w-[2000px] mx-auto space-y-4">
                {/* Top Row: Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                Monitoramento <span className="text-primary italic">Tempo Real</span>
                            </h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {company.name} • {filteredVisits.length} visitas encontradas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        {/* Search */}
                        <div className="relative group min-w-[200px] md:min-w-[300px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Buscar visita, unidade, líder..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Date Picker Trigger */}
                        <button
                            onClick={() => setIsCalendarOpen(true)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-3 hover:border-primary/50 transition-all group shrink-0"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Período</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                                    {dateRange.start === dateRange.end ? formatDateDisplay(dateRange.start) : `${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        multiple
                        label="Sistema"
                        leftIcon={<span className="material-symbols-outlined">settings</span>}
                        options={filterOptions.systems}
                        value={filters.systemParentId || []}
                        onChange={(e) => handleFilterChange('systemParentId', e.target.value)}
                        placeholder="Todos os sistemas"
                        className="w-[180px]"
                    />
                    <Select
                        multiple
                        label="Tipo Unidade"
                        leftIcon={<span className="material-symbols-outlined">home</span>}
                        options={filterOptions.unitTypes}
                        value={filters.unitTypeParentId || []}
                        onChange={(e) => handleFilterChange('unitTypeParentId', e.target.value)}
                        placeholder="Todos os tipos"
                        className="w-[180px]"
                    />
                    <Select
                        multiple
                        label="Tipo OS"
                        leftIcon={<span className="material-symbols-outlined">task</span>}
                        options={filterOptions.orderTypes}
                        value={filters.orderTypeId || []}
                        onChange={(e) => handleFilterChange('orderTypeId', e.target.value)}
                        placeholder="Todos os tipos"
                        className="w-[180px]"
                    />
                    <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block" />
                    <button 
                        onClick={() => setFilters({ statusId: [], systemParentId: [], unitTypeParentId: [], orderTypeId: [] })}
                        className="text-[11px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors px-2 py-2"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>
    );

    const StatsSection = () => (
        <div className="flex gap-4 p-6 overflow-x-auto scrollbar-hide bg-slate-50 dark:bg-slate-900/50">
            <StatCard
                icon="dashboard"
                label="Total de Visitas"
                count={stats.total}
                totalValue={stats.totalValue}
                color="text-slate-500"
                active={activeStatFilter === 'all'}
                onClick={() => setActiveStatFilter('all')}
            />
            <StatCard
                icon="pending"
                label="Vistas em Aberto"
                count={stats.open}
                color="text-orange-500"
                active={activeStatFilter === 'open'}
                onClick={() => setActiveStatFilter('open')}
            />
            <StatCard
                icon="check_circle"
                label="Visitas Concluídas"
                count={stats.closed}
                color="text-green-500"
                active={activeStatFilter === 'closed'}
                onClick={() => setActiveStatFilter('closed')}
            />
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loading size="xl" text="Iniciando Monitoramento..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Cabecalho */}
            <Header />

            {/* Area de Stats */}
            <StatsSection />

            {/* Conteudo Principal com Mapa */}
            <div className="flex-1 relative">
                <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
                
                {/* Leader Floating List */}
                <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 max-w-[calc(100%-2rem)]">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {leaders.map(leader => (
                            <button
                                key={leader.id}
                                onClick={() => setSelectedLeaderId(selectedLeaderId === leader.id ? null : leader.id)}
                                className={`flex items-center gap-2 p-1 pr-3 rounded-full backdrop-blur-md transition-all border shrink-0 ${
                                    selectedLeaderId === leader.id
                                        ? 'bg-primary border-primary text-white scale-105 shadow-lg ring-2 ring-primary/20'
                                        : 'bg-white/80 dark:bg-slate-800/80 border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                                    {leader.imgFilePath ? (
                                        <OptimizedImage
                                            src={dataService.getPublicImageUrl(leader.imgFilePath, leader.imgFileName || '', { width: 64, height: 64, resize: 'cover' })}
                                            alt={leader.nameShort || ''}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                            {getInitials(leader.nameFull || leader.nameShort || '')}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-black whitespace-nowrap">{leader.nameShort}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer List Display (Drawer implementation) */}
                <div className="absolute bottom-6 left-6 right-6 z-40">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-[24px] shadow-2xl p-4 max-h-[300px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 px-2">
                             <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">list</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Visitas do Período</h3>
                             </div>
                             <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">
                                {filteredVisits.length} encontradas
                             </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredVisits.map(visit => (
                                <div 
                                    key={visit.id}
                                    onClick={() => {
                                        if (visit.unitLatitude && visit.unitLongitude && mapRef.current) {
                                            mapRef.current.setView([visit.unitLatitude, visit.unitLongitude], 15);
                                            markersRef.current[visit.id]?.openPopup();
                                        }
                                    }}
                                    className="bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 p-3 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-12 rounded-full shrink-0 ${getStatusColor(visit.ovStatusId)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight line-clamp-1">{visit.clientName}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{formatDateDisplay((visit.ovStartedAt || visit.ovCreatedAt || '').split('T')[0])}</span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                                {visit.unitDescription || 'Unidade não identificada'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">{getInitials(visit.teamLeaderName || 'NI')}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{visit.teamLeaderName}</span>
                                                <div className="flex-1" />
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white italic">{visit.ovMask}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredVisits.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nenhuma visita nesta região</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                title="Selecionar Período"
            >
                <div className="p-4">
                    <Calendar
                        onChange={(date) => date && handleDateSelect(date.toString())}
                        className="mx-auto"
                    />
                </div>
            </Modal>
        </div>
    );
};
