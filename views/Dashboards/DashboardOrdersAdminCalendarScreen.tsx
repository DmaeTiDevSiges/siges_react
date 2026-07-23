import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, OrderVisit, OrderVisitTeam, Order } from '../../types';
import { dataService } from '../../services/dataService';
import DashboardOrdersVisitsAdminListItem from '../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem';
import { OrderRequestCardListItem } from '../../components/orderRequests/OrderRequestCardListItem';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { getInitials, formatCurrency } from '../../utils/formatters';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { TreeFilterSelect } from '../../components/ui/TreeFilterSelect';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { OrderFilters } from '../../types';

interface DashboardOrdersAdminCalendarScreenProps {
    currentUser: User;
    onSelectVisit?: (visit: OrderVisit) => void;
    onOrderSelect?: (order: Order) => void;
    onEdit?: (order: Order) => void;
}

interface CalendarVisit {
    id: string;
    ovMask: string;
    ovStatusId: number;
    statusDescription: string;
    unitDescription: string;
    clientName: string;
    teamLeaderName: string;
    teamLeaderId: string;
    ovStartedAt?: string;
    ovCreatedAt: string;
    orderMask: string;
    totalValue?: number;
    progress?: number;
    requestedServices?: string;
    systemParentId?: string;
    unitTypeParentId?: string;
    orderTypeId?: string;
    typeCode?: string;
    typeSubCode?: string;
    planDescription?: string;
    ovEndedAt?: string;
    ovServicesValue?: number;
    ovMaterialsValue?: number;
    ovVehiclesValue?: number;
    teamNamesShort?: string;
    ovProcessingId: number;
    processingDescription?: string;
    processingIcon?: string;
    processingIconColor?: string;
    processingBgColor?: string;
    ovOStatusId?: number;
    ovOStatusDescription?: string;
    teamCode?: string;
    ovDurationHours?: number;
    isOsCard?: boolean;
}

interface WeekDay {
    date: Date;
    dateStr: string;
    label: string;
    shortLabel: string;
    isToday: boolean;
    isWeekend: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getVisitDate = (visit: CalendarVisit): string => {
    const val = visit.ovStartedAt || visit.ovCreatedAt || '';
    return val.split('T')[0].split(' ')[0];
};

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; dot: string }> = {
    1: { label: 'Em Aberto',    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500' },
    2: { label: 'Em Execução',  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20',   dot: 'bg-blue-500'   },
    3: { label: 'Concluída',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    7: { label: 'Cancelada',    color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500/10 border-red-200 dark:border-red-500/20',     dot: 'bg-red-500'    },
};

const getStatusConfig = (id: number) =>
    STATUS_CONFIG[id] ?? { label: 'Indefinido', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' };

const getOStatusIcon = (statusId: number): { icon: string; bgColor: string; textColor: string; title: string } => {
    switch (statusId) {
        case 4: // Agendada
            return {
                icon: 'calendar_today',
                bgColor: 'bg-blue-50 dark:bg-blue-900/30',
                textColor: 'text-blue-500 dark:text-blue-400',
                title: 'Agendada'
            };
        case 5: // Execução
            return {
                icon: 'play_arrow',
                bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
                textColor: 'text-emerald-500 dark:text-emerald-400',
                title: 'Execução'
            };
        case 6: // Suspensa
            return {
                icon: 'pause',
                bgColor: 'bg-amber-50 dark:bg-amber-900/30',
                textColor: 'text-amber-500 dark:text-amber-400',
                title: 'Suspensa'
            };
        case 8: // Concluída
            return {
                icon: 'stop_circle',
                bgColor: 'bg-slate-50 dark:bg-slate-900/30',
                textColor: 'text-slate-500 dark:text-slate-400',
                title: 'Concluída'
            };
        default:
            return {
                icon: 'circle',
                bgColor: 'bg-slate-50 dark:bg-slate-900/30',
                textColor: 'text-slate-500 dark:text-slate-400',
                title: 'Status desconhecido'
            };
    }
};

// ─── Sub-components ─────────────────────────────────────────────────────────────

const VisitCard: React.FC<{
    visit: CalendarVisit;
    onClick: () => void;
    isSelected: boolean;
    hoveredOsMask: string | null;
    onHoverEnter: (osMask: string) => void;
    onHoverLeave: () => void;
}> = ({ visit, onClick, isSelected, hoveredOsMask, onHoverEnter, onHoverLeave }) => {
    const cfg = getStatusConfig(visit.ovStatusId);
    const osStatus = visit.ovOStatusId ? getOStatusIcon(visit.ovOStatusId) : null;
    const isOs = !!visit.isOsCard;

    if (isOs) {
        return (
            <div
                data-visit-card-id={visit.id}
                data-os-mask={visit.orderMask}
                className={`relative w-full rounded-xl border border-dashed p-3 shadow-sm transition-all duration-200 
                border-purple-300 dark:border-purple-500/50 bg-purple-50 dark:bg-purple-900/10 hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                onMouseEnter={() => onHoverEnter && visit.orderMask && onHoverEnter(visit.orderMask)}
                onMouseLeave={() => onHoverLeave && onHoverLeave()}
                onClick={onClick}
            >
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                        {visit.orderMask || 'S/N'}
                    </span>
                    {visit.typeCode && visit.typeSubCode && (
                        <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mt-0.5 mb-1">
                            {`${visit.typeCode}/${visit.typeSubCode}`}
                        </p>
                    )}
                    {visit.planDescription && (
                        <span className="text-[10px] font-bold text-slate-500 line-clamp-2 leading-tight">
                            {visit.planDescription}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => visit.orderMask && onHoverEnter(visit.orderMask)}
            onMouseLeave={onHoverLeave}
            data-visit-card-id={visit.id}
            data-os-mask={visit.orderMask}
            className={`
                relative group rounded-xl border p-2.5 cursor-pointer
                transition-all duration-200 select-none
                hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]
                ${isSelected
                    ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-800 shadow-md shadow-primary/10'
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }
                ${cfg.bg}
                ${hoveredOsMask && visit.orderMask !== hoveredOsMask ? 'opacity-35 scale-[0.98]' : 'opacity-100'}
            `}
        >
            {/* Status icon or dot */}
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <span className={`text-[11px] font-black uppercase tracking-widest truncate flex-1 ${cfg.color}`}>
                    {visit.ovMask}
                </span>
                {osStatus ? (
                    <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${osStatus.bgColor}`}
                        title={osStatus.title}
                    >
                        <span className={`material-symbols-outlined text-[14px] ${osStatus.textColor}`}>
                            {osStatus.icon}
                        </span>
                    </div>
                ) : (
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                )}
            </div>

            {visit.typeCode && visit.typeSubCode && (
                <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mt-0.5 mb-1">
                    {`${visit.typeCode}/${visit.typeSubCode}`}
                </p>
            )}

            {/* Leader */}
            <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate mb-1">
                {visit.teamLeaderName}
            </div>

            {/* Progress bar (only for in-execution) */}
            {visit.ovStatusId === 2 && visit.progress !== undefined && (
                <div className="mt-1.5 h-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, visit.progress ?? 0)}%` }}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Detail Panel ───────────────────────────────────────────────────────────────

const VisitDetailPanel: React.FC<{
    visit: CalendarVisit | null;
    onClose: () => void;
    onOpenVisit?: () => void;
    isOpenLoading?: boolean;
}> = ({ visit, onClose, onOpenVisit, isOpenLoading }) => {
    if (!visit) return null;

    const cfg = getStatusConfig(visit.ovStatusId);
    const members = (visit.teamNamesShort || visit.teamLeaderName || '')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean);

    const formatVisitDate = (date?: string) =>
        date
            ? new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '—';

    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
            <div className="rounded-[32px] border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
                <div className="relative bg-slate-900 px-5 pb-5 pt-6">
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                        <button className="grid h-10 w-10 place-content-center rounded-2xl border border-white/10 bg-slate-800/80 text-white/80 hover:bg-slate-800 transition">
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        </button>
                        <button className="grid h-10 w-10 place-content-center rounded-2xl border border-white/10 bg-slate-800/80 text-white/80 hover:bg-slate-800 transition">
                            <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                        </button>
                        <button className="grid h-10 w-10 place-content-center rounded-2xl border border-white/10 bg-slate-800/80 text-white/80 hover:bg-slate-800 transition">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="grid h-10 w-10 place-content-center rounded-2xl border border-white/10 bg-slate-800/80 text-white/80 hover:bg-red-950/80 hover:text-red-400 transition"
                            title="Fechar"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex flex-col rounded-[24px] bg-rose-500 px-4 py-3 text-white shadow-lg shadow-rose-500/20">
                                    <span className="text-xl font-black tracking-tight">{visit.ovMask}</span>
                                    <span className="text-[10px] uppercase tracking-[0.26em] font-black text-white/90 mt-1">
                                        {visit.typeSubCode || visit.typeCode || 'AT'}
                                    </span>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{visit.ovOStatusDescription || cfg.label}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-right">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">OS</p>
                                <div className="text-xl font-black text-white">{visit.orderMask || '—'}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{visit.clientName || 'DMAE PLUVIAL'}</p>
                            <h3 className="text-3xl font-black text-white leading-tight">{visit.unitDescription || 'Unidade não informada'}</h3>
                            {visit.processingDescription && (
                                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{visit.processingDescription}</p>
                            )}
                            <p className="text-sm leading-6 text-slate-300">{visit.requestedServices || 'Sem descrição do serviço'}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
                        <div className="flex flex-wrap gap-3">
                            {members.length > 0 ? members.slice(0, 3).map((member, index) => (
                                <div key={`${member}-${index}`} className="flex flex-col items-center gap-2">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-sm font-black uppercase text-white border border-white/10">
                                        {getInitials(member)}
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300 text-center truncate max-w-[80px]">
                                        {member}
                                    </p>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-sm font-black uppercase text-white border border-white/10">
                                        {getInitials(visit.teamLeaderName || 'NI')}
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300 text-center">{visit.teamLeaderName || 'Líder'}</p>
                                </div>
                            )}
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-right">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{visit.teamCode ? visit.teamCode.toUpperCase() : 'MAN IND PLUVIAL'}</p>
                            <p className="mt-2 text-sm font-black text-white">{visit.teamCode ? visit.teamCode : 'MAN IND PLUVIAL'}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Início</p>
                            <p className="mt-2 text-sm font-black text-white">{formatVisitDate(visit.ovStartedAt)}</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Duração</p>
                            <p className="mt-2 text-sm font-black text-white">{visit.ovDurationHours !== undefined ? `${visit.ovDurationHours.toFixed(1)} h` : '—'}</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-right">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Término</p>
                            <p className="mt-2 text-sm font-black text-white">{formatVisitDate(visit.ovEndedAt || visit.ovCreatedAt)}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Serviços</p>
                            <p className="mt-2 text-sm font-black text-white">{visit.ovServicesValue !== undefined ? formatCurrency(visit.ovServicesValue) : 'R$ 0,00'}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Materiais</p>
                            <p className="mt-2 text-sm font-black text-white">{visit.ovMaterialsValue !== undefined ? formatCurrency(visit.ovMaterialsValue) : 'R$ 0,00'}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Transp.</p>
                            <p className="mt-2 text-sm font-black text-white">{visit.ovVehiclesValue !== undefined ? formatCurrency(visit.ovVehiclesValue) : 'R$ 0,00'}</p>
                        </div>
                        <div className="rounded-3xl bg-emerald-950/80 border border-emerald-500/10 px-4 py-3 text-center">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-emerald-300">Total</p>
                            <p className="mt-2 text-sm font-black text-emerald-300">{visit.totalValue !== undefined ? formatCurrency(visit.totalValue) : 'R$ 0,00'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────────

export const DashboardOrdersAdminCalendarScreen: React.FC<DashboardOrdersAdminCalendarScreenProps> = ({
    currentUser,
    onSelectVisit,
    onOrderSelect,
    onEdit
}) => {
    const [visits, setVisits] = useState<CalendarVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const [selectedStatusIds, setSelectedStatusIds] = useState<Set<number>>(new Set());
    const [isOpenLoading, setIsOpenLoading] = useState(false);
    const [hasOsFilters, setHasOsFilters] = useState(false);
    const [selectedFullVisit, setSelectedFullVisit] = useState<OrderVisit | null>(null);
    const [selectedFullOrder, setSelectedFullOrder] = useState<Order | null>(null);
    const [selectedVisitTeam, setSelectedVisitTeam] = useState<OrderVisitTeam[]>([]);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Refs e Estados para Conexão de Visitas de mesma OS
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredOsMask, setHoveredOsMask] = useState<string | null>(null);
    const [connections, setConnections] = useState<{ osMask: string; path: string; color: string }[]>([]);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    // Draggable scroll for horizontal filter bar
    const filtersScroll = useDraggableScroll();

    // Week navigation — default to current week
    const [weekOffset, setWeekOffset] = useState(0);

    // Advanced Filters State
    const [advancedFilters, setAdvancedFilters] = useState<OrderFilters>(() => {
        const saved = localStorage.getItem('advancedOrdersFilters');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return { contractId: [] };
    });

    // Applied Filters State
    const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(() => {
        const saved = localStorage.getItem('appliedOrdersFilters');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return { contractId: [] };
    });

    // Filter Options State
    const [filterOptions, setFilterOptions] = useState<any>({
        systems: [],
        subSystems: [],
        unitTypes: [],
        orderObjects: [],
        orderTypes: [],
        plans: [],
        contracts: [],
        teams: [],
        units: [],
        sectors: [],
        positions: []
    });

    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);

    // Modal de Seleção
    const [selectionModal, setSelectionModal] = useState<any>({
        isOpen: false,
        filterKey: 'contractId',
        label: '',
        options: [],
        currentValue: []
    });
    const [selectionSearch, setSelectionSearch] = useState('');

    // ── Compute week days ─────────────────────────────────────────────────────
    const weekDays = useMemo((): WeekDay[] => {
        const today = new Date();
        const todayStr = toDateStr(today);

        // Find Monday of the current (offset) week
        const dayOfWeek = today.getDay(); // 0=Sun
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = toDateStr(d);
            return {
                date: d,
                dateStr,
                label: `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()}`,
                shortLabel: `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()}`,
                isToday: dateStr === todayStr,
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
            };
        });
    }, [weekOffset]);

    const weekStart = weekDays[0]?.dateStr ?? '';
    const weekEnd = weekDays[6]?.dateStr ?? '';

    const weekLabel = useMemo(() => {
        if (!weekDays.length) return '';
        const first = weekDays[0].date;
        const last = weekDays[6].date;
        if (first.getMonth() === last.getMonth()) {
            return `${first.getDate()} – ${last.getDate()} de ${MONTH_NAMES[first.getMonth()]} de ${first.getFullYear()}`;
        }
        return `${first.getDate()} de ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} de ${MONTH_NAMES[last.getMonth()]} de ${last.getFullYear()}`;
    }, [weekDays]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOpenVisit = useCallback(async (cVisit: CalendarVisit) => {
        if (!onSelectVisit || !cVisit.id) return;
        setIsOpenLoading(true);
        try {
            const fullVisit = await dataService.getOrderVisitById(cVisit.id);
            if (fullVisit) {
                onSelectVisit(fullVisit);
            } else {
                alert('Não foi possível carregar os detalhes completos desta visita.');
            }
        } catch (err) {
            console.error('Error fetching full visit details:', err);
            alert('Ocorreu um erro ao carregar os detalhes da visita.');
        } finally {
            setIsOpenLoading(false);
        }
    }, [onSelectVisit]);

    const handleSystemChange = async (systemId: string | string[]) => {
        setAdvancedFilters((prev: OrderFilters) => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
            setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions((prev: any) => ({ ...prev, subSystems: [] }));
        }
    };

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedFilters((prev: OrderFilters) => ({ ...prev, unitTypeParentId: id, unitTypeId: [], unitId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
            setUnitSubTypes(results.flat());
        } else {
            setUnitSubTypes([]);
        }
    };

    const handleSectorsChange = (assetTagId: string | string[]) => {
        const value = Array.isArray(assetTagId) ? assetTagId : assetTagId ? [assetTagId] : [];
        setAdvancedFilters((prev: OrderFilters) => ({ ...prev, assetTagId: value, assetTagSubId: [] }));
    };

    const openSelectionModal = (key: keyof OrderFilters, label: string, options: { value: string; label: string }[]) => {
        const value = advancedFilters[key];
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
            handleSectorsChange(finalValue as string | string[]);
        } else {
            setAdvancedFilters((prev: OrderFilters) => ({ ...prev, [key]: finalValue }));
        }
        setSelectionModal((prev: any) => ({ ...prev, isOpen: false }));
    };

    const handleApplyFilters = () => {
        const selectedContracts = Array.isArray(advancedFilters.contractId) ? advancedFilters.contractId : [];
        if (selectedContracts.length === 0) {
            alert('Selecione ao menos um contrato para filtrar');
            return;
        }
        setAppliedFilters({ ...advancedFilters });
    };

    const clearOsFilters = useCallback(() => {
        const defaultContractIds = filterOptions.contracts.map((c: any) => String(c.id));
        const resetFilters = { contractId: defaultContractIds, assetTagId: [], assetTagSubId: [] };
        setAdvancedFilters(resetFilters);
        setAppliedFilters(resetFilters);
        setUnitSubTypes([]);
        setOrderSubTypes([]);
        setHasOsFilters(false);
    }, [filterOptions.contracts]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchVisits = useCallback(async () => {
        setIsLoading(true);
        try {
            const sharedFilters = {
                startDate: weekStart,
                endDate: weekEnd,
                contractId: appliedFilters.contractId,
                systemParentId: appliedFilters.systemParentId,
                systemId: appliedFilters.systemId,
                unitTypeParentId: appliedFilters.unitTypeParentId,
                unitTypeId: appliedFilters.unitTypeId,
                unitId: appliedFilters.unitId,
                orderObjectId: appliedFilters.orderObjectId,
                orderTypeId: appliedFilters.orderTypeId,
                orderPlanId: appliedFilters.orderPlanId,
                orderTeamId: appliedFilters.orderTeamId,
            };

            // Busca visitas e OSs em paralelo
            const [rawVisits, rawOrders] = await Promise.all([
                dataService.getOrdersVisitsView({
                    ...sharedFilters,
                    pageSize: 1000,
                    orderTypeSubId: appliedFilters.orderTypeSubId,
                    assetTagId: appliedFilters.assetTagId,
                    assetTagSubId: appliedFilters.assetTagSubId,
                }),
                dataService.getOrdersForCalendar(sharedFilters),
            ]);

            const visitsList = Array.isArray(rawVisits) ? rawVisits : (rawVisits?.data || []);
            const mapped: CalendarVisit[] = visitsList.map((row: any) => ({
                id: row.id?.toString(),
                ovMask: row.ov_mask || '',
                ovStatusId: row.ov_status_id || 1,
                statusDescription: row.ov_status_description || '',
                unitDescription: row.unit_description || row.o_unit_description || '',
                clientName: row.client_name || row.o_client_name || '',
                teamLeaderName: row.team_leader_name_short || row.team_leader_name || row.ov_team_leader_name_short || row.ov_team_leader_name || '',
                teamLeaderId: row.team_leader_id?.toString() || row.ov_team_leader_id?.toString() || '',
                ovStartedAt: row.ov_started_at || undefined,
                ovEndedAt: row.ov_ended_at || undefined,
                ovCreatedAt: row.ov_created_at || row.o_requested_at || '',
                orderMask: row.order_mask || row.o_mask || '',
                totalValue: row.ov_total_value ? parseFloat(row.ov_total_value) : undefined,
                ovServicesValue: row.ov_services_value !== undefined ? parseFloat(row.ov_services_value) : 0,
                ovMaterialsValue: row.ov_materials_value !== undefined ? parseFloat(row.ov_materials_value) : 0,
                ovVehiclesValue: row.ov_vehicles_value !== undefined ? parseFloat(row.ov_vehicles_value) : 0,
                requestedServices: row.requested_services || '',
                teamNamesShort: row.ov_team_names_short || row.o_team_names_short || '',
                systemParentId: row.o_system_parent_id?.toString(),
                unitTypeParentId: row.o_unit_type_parent_id?.toString(),
                orderTypeId: row.o_type_id?.toString(),
                typeCode: row.o_type_code || row.type_code || '',
                typeSubCode: row.o_type_sub_code || row.type_sub_code || '',
                planDescription: row.o_plan_description || row.plan_description || '',
                ovProcessingId: row.ov_processing_id || 0,
                processingDescription: row.processing_description || '',
                processingIcon: row.processing_icon || '',
                processingIconColor: row.processing_icon_color || '',
                processingBgColor: row.processing_bg_color || '',
                ovOStatusId: row.ov_o_status_id || undefined,
                ovOStatusDescription: row.ov_o_status_description || '',
                teamCode: row.o_team_code || row.team_code || '',
                ovDurationHours: row.ov_duration_hours ? parseFloat(row.ov_duration_hours) : 0,
            }));

            // Mapear OSs vindas diretamente da v_orders
            const osCards: CalendarVisit[] = (rawOrders || []).map((row: any) => ({
                id: `os-${row.id}`,
                ovMask: '',
                isOsCard: true,
                ovStatusId: row.status_id ? Number(row.status_id) : 1,
                statusDescription: row.status_description || 'OS',
                unitDescription: row.unit_description || '',
                clientName: row.client_name || '',
                teamLeaderName: '',
                teamLeaderId: '',
                ovCreatedAt: row.requested_at || '',
                ovStartedAt: row.requested_at || '', // usa requested_at para posicionamento no calendário
                orderMask: row.order_mask || '',
                typeCode: row.type_code || '',
                typeSubCode: row.type_sub_code || '',
                planDescription: row.plan_description || '',
                ovProcessingId: 0,
            } as CalendarVisit));

            setVisits([...mapped, ...osCards]);
        } catch (err) {
            console.error('Error fetching calendar visits:', err);
        } finally {
            setIsLoading(false);
        }
    }, [weekStart, weekEnd, appliedFilters]);

    useEffect(() => {
        fetchVisits();
    }, [fetchVisits]);

    // Persist Advanced Filters
    useEffect(() => {
        localStorage.setItem('advancedOrdersFilters', JSON.stringify(advancedFilters));
    }, [advancedFilters]);

    // Persist Applied Query State
    useEffect(() => {
        localStorage.setItem('appliedOrdersFilters', JSON.stringify(appliedFilters));
        const active = Object.keys(appliedFilters).filter(k => k !== 'activeFilter' && k !== 'useGeneralView').some(k => {
            const val = (appliedFilters as any)[k];
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== null && val !== '';
        });
        setHasOsFilters(active);
    }, [appliedFilters]);

    // Recover options on mount
    useEffect(() => {
        const recoverOptions = async () => {
            if (advancedFilters.unitTypeParentId) {
                const ids = Array.isArray(advancedFilters.unitTypeParentId)
                    ? advancedFilters.unitTypeParentId
                    : [advancedFilters.unitTypeParentId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
                    setUnitSubTypes(results.flat());
                }
            }
            if (advancedFilters.systemParentId) {
                const ids = Array.isArray(advancedFilters.systemParentId)
                    ? advancedFilters.systemParentId
                    : [advancedFilters.systemParentId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
                    setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
                }
            }
            if (advancedFilters.orderTypeId) {
                const ids = Array.isArray(advancedFilters.orderTypeId)
                    ? advancedFilters.orderTypeId
                    : [advancedFilters.orderTypeId];
                if (ids.length > 0) {
                    const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
                    setOrderSubTypes(results.flat());
                }
            }
        };
        recoverOptions();
    }, []);

    // Load filter options
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
                    dataService.getAssetTags('active'),
                    dataService.getAssetTagSubs(undefined, 'active')
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
                    positions: getVal(results[9], 'positions')
                }));

                if (contracts.length > 0) {
                    const defaultContractIds = contracts.map((c: any) => String(c.id));
                    setAdvancedFilters((prev: OrderFilters) => {
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
            } catch (err) {
                console.error("Failed to load filter options", err);
            }
        };
        loadOptions();
    }, [currentUser]);

    const assetTagSubOptions = useMemo(() => {
        const allPositions = filterOptions.positions || [];
        const selectedSectors = Array.isArray(advancedFilters.assetTagId)
            ? advancedFilters.assetTagId
            : advancedFilters.assetTagId ? [advancedFilters.assetTagId] : [];

        if (selectedSectors.length === 0) {
            return allPositions;
        }

        return allPositions.filter((position: any) => selectedSectors.includes(position.parentId));
    }, [filterOptions.positions, advancedFilters.assetTagId]);

    // ── Derived leaders list ──────────────────────────────────────────────────
    const leaders = useMemo(() => {
        const seen = new Set<string>();
        const result: { id: string; name: string }[] = [];
        visits.forEach(v => {
            if (v.teamLeaderId && !seen.has(v.teamLeaderId)) {
                seen.add(v.teamLeaderId);
                result.push({ id: v.teamLeaderId, name: v.teamLeaderName });
            }
        });
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [visits]);

    // ── Filter ────────────────────────────────────────────────────────────────
    const filteredVisits = useMemo(() => {
        const filtered = visits.filter(v => {
            if (selectedLeaderId && v.teamLeaderId !== selectedLeaderId) return false;
            if (selectedStatusIds.size > 0 && !selectedStatusIds.has(v.ovStatusId)) return false;
            return true;
        });

        return filtered.sort((a, b) => {
            const valA = a.ovStartedAt || '';
            const valB = b.ovStartedAt || '';
            if (!valA && !valB) return 0;
            if (!valA) return 1;
            if (!valB) return -1;
            return valA.localeCompare(valB);
        });
    }, [visits, selectedLeaderId, selectedStatusIds]);

    // Função para calcular conexões ortogonais entre visitas da mesma OS
    const calculateConnections = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        // Dimensões totais do conteúdo rolável
        setSvgDimensions({
            width: container.scrollWidth,
            height: container.scrollHeight
        });

        const cards = container.querySelectorAll<HTMLElement>('[data-visit-card-id]');
        if (cards.length === 0) { setConnections([]); return; }

        // Rect do container na viewport (ponto de referência)
        const containerRect = container.getBoundingClientRect();

        // Agrupa elementos DOM por osMask
        const osGroups: Record<string, HTMLElement[]> = {};
        cards.forEach(el => {
            const osMask = el.getAttribute('data-os-mask');
            if (osMask) {
                if (!osGroups[osMask]) osGroups[osMask] = [];
                osGroups[osMask].push(el);
            }
        });

        const newConnections: { osMask: string; path: string; color: string }[] = [];

        Object.entries(osGroups).forEach(([osMask, elements]) => {
            if (elements.length < 2) return;

            // Centro do card em coordenadas absolutas do conteúdo rolável do container
            const points = elements.map(el => {
                const r = el.getBoundingClientRect();
                return {
                    // posição relativa à borda esquerda visível do container + scroll acumulado
                    x: r.left - containerRect.left + container.scrollLeft + r.width / 2,
                    y: r.top  - containerRect.top  + container.scrollTop  + r.height / 2
                };
            });

            // Ordena da esquerda para a direita (ordem cronológica)
            points.sort((a, b) => a.x - b.x);

            // Gera path SVG ortogonal em "L" com ponto médio entre pares consecutivos
            let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
            for (let i = 1; i < points.length; i++) {
                const midX = ((points[i - 1].x + points[i].x) / 2).toFixed(1);
                path += ` H ${midX} V ${points[i].y.toFixed(1)} H ${points[i].x.toFixed(1)}`;
            }

            // Cor consistente via hash do osMask
            const hash = osMask.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const hue = hash % 360;
            newConnections.push({ osMask, path, color: `hsl(${hue}, 75%, 55%)` });
        });

        setConnections(newConnections);
    }, [filteredVisits]);

    // Recalcula conexões após render e em resize
    useEffect(() => {
        const timer = setTimeout(() => calculateConnections(), 200);
        window.addEventListener('resize', calculateConnections);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateConnections);
        };
    }, [filteredVisits, calculateConnections]);

    // ── Visits by day ─────────────────────────────────────────────────────────
    const visitsByDay = useMemo(() => {
        const map: Record<string, CalendarVisit[]> = {};
        weekDays.forEach(day => { map[day.dateStr] = []; });
        filteredVisits.forEach(v => {
            const d = getVisitDate(v);
            if (map[d]) map[d].push(v);
        });
        return map;
    }, [filteredVisits, weekDays]);

    // ── Active Units ──────────────────────────────────────────────────────────
    const activeUnits = useMemo(() => {
        const map = new Map<string, { id: string; description: string; clientName: string }>();
        filteredVisits.forEach(v => {
            const uId = v.unitDescription || v.clientName || 'indefinida';
            if (!map.has(uId)) {
                map.set(uId, {
                    id: uId,
                    description: v.unitDescription || 'Unidade Indefinida',
                    clientName: v.clientName || ''
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.description.localeCompare(b.description));
    }, [filteredVisits]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: filteredVisits.length,
        open: filteredVisits.filter(v => v.ovStatusId === 1).length,
        executing: filteredVisits.filter(v => v.ovStatusId === 2).length,
        done: filteredVisits.filter(v => v.ovStatusId === 3).length,
    }), [filteredVisits]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleStatus = (id: number) => {
        setSelectedStatusIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Mapeia os dados snake_case retornados pela view v_orders_visits para o formato
    // camelCase esperado pelo componente DashboardOrdersVisitsAdminListItem
    const mapRawToOrderVisit = (raw: any): OrderVisit => ({
        id: raw.id?.toString() ?? '',
        oId: raw.o_id?.toString() ?? '',
        ovMask: raw.ov_mask ?? '',
        ovStatusId: raw.ov_status_id ?? 1,
        ovStatusAt: raw.ov_status_at,
        ovCreatedAt: raw.ov_created_at ?? '',
        ovCreatedUserId: raw.ov_created_user_id?.toString() ?? '',
        ovUpdatedAt: raw.ov_updated_at,
        ovUpdatedUserId: raw.ov_updated_user_id?.toString(),
        ovStartedAt: raw.ov_started_at,
        ovEndedAt: raw.ov_ended_at,
        ovTeamLeadId: raw.ov_team_lead_id?.toString() ?? '',
        ovComments: raw.ov_comments,
        ovProcessingId: raw.ov_processing_id ?? 0,
        ovOStatusId: raw.ov_o_status_id,
        ovOStatusDescription: raw.ov_o_status_description,
        ovOSuspendedReasonId: raw.ov_o_suspended_reason_id,
        ovOSuspendedReasonDescription: raw.ov_o_suspended_reason_description,
        processingIcon: raw.processing_icon,
        processingIconColor: raw.processing_icon_color,
        processingBgColor: raw.processing_bg_color,
        orderMask: raw.order_mask ?? raw.o_mask,
        statusDescription: raw.ov_status_description,
        processingDescription: raw.processing_description,
        teamLeaderName: raw.ov_team_leader_name_short ?? raw.ov_team_leader_name ?? raw.team_leader_name,
        teamLeadAvatarUrl: raw.team_lead_avatar_url,
        unitDescription: raw.unit_description ?? raw.o_unit_description,
        unitId: raw.unit_id?.toString() ?? raw.o_unit_id?.toString(),
        systemDescription: raw.system_description ?? raw.o_system_description,
        clientName: raw.client_name ?? raw.o_client_name,
        assetTagDescription: raw.asset_tag_description ?? raw.o_asset_tag_description,
        assetTagSubDescription: raw.asset_tag_sub_description ?? raw.o_asset_tag_sub_description,
        requestedServices: raw.requested_services ?? raw.o_requested_services,
        progress: raw.ov_progress ? parseFloat(raw.ov_progress) : undefined,
        ovDurationHours: raw.ov_duration_hours ? parseFloat(raw.ov_duration_hours) : undefined,
        contractId: raw.contract_id?.toString() ?? raw.o_contract_id?.toString(),
        servicesValue: raw.ov_services_value !== undefined ? parseFloat(raw.ov_services_value) : 0,
        materialsValue: raw.ov_materials_value !== undefined ? parseFloat(raw.ov_materials_value) : 0,
        vehiclesValue: raw.ov_vehicles_value !== undefined ? parseFloat(raw.ov_vehicles_value) : 0,
        totalValue: raw.ov_total_value !== undefined ? parseFloat(raw.ov_total_value) : undefined,
        companyId: raw.company_id?.toString(),
        providerCompanyId: raw.provider_company_id?.toString(),
        isFiled: raw.is_filed,
        teamCode: raw.o_team_code ?? raw.team_code,
        priorityId: raw.o_priority_id?.toString() ?? raw.priority_id?.toString(),
        priorityCode: raw.o_priority_code ?? raw.priority_code,
        priorityColor: raw.o_priority_color ?? raw.priority_color,
        priorityDescription: raw.o_priority_description ?? raw.priority_description,
        oRequesterName: raw.o_requester_name,
        oRequesterPhone: raw.o_requester_phone,
        contractDescription: raw.contract_description,
        planDescription: raw.plan_description ?? raw.o_plan_description,
        oReasonDescription: raw.o_reason_description,
        oCauseDescription: raw.o_cause_description,
        ovAssetsAmount: raw.ov_assets_amount,
        ovAssetsReportedAmount: raw.ov_assets_reported_amount,
        ovAssetsDraftAmount: raw.ov_assets_draft_amount,
        ovAssetsRevisedAmount: raw.ov_assets_revised_amount,
        ovAssetsDisapprovedAmount: raw.ov_assets_disapproved_amount,
        ovAssetsApprovedNoFiledAmount: raw.ov_assets_approved_no_filed_amount,
        ovAssetsApprovedFiledAmount: raw.ov_assets_approved_filed_amount,
        ovAssetsApprovedAmount: raw.ov_assets_approved_amount,
        reportedAt: raw.reported_at,
        reportedUserId: raw.reported_user_id?.toString(),
        reportedUserNameShort: raw.reported_user_name_short,
        revisedAt: raw.revised_at,
        revisedUserId: raw.revised_user_id?.toString(),
        revisedUserNameShort: raw.revised_user_name_short,
        disapprovedAt: raw.disapproved_at,
        disapprovedUserId: raw.disapproved_user_id?.toString(),
        disapprovedUserNameShort: raw.disapproved_user_name_short,
        approvedAt: raw.approved_at,
        approvedUserId: raw.approved_user_id?.toString(),
        approvedUserNameShort: raw.approved_user_name_short,
        approvedFiledAt: raw.approved_filed_at,
        approvedFiledUserId: raw.approved_filed_user_id?.toString(),
        approvedFiledUserNameShort: raw.approved_filed_user_name_short,
        ovSignatureLeaderPath: raw.ov_signature_leader_path,
        ovSignatureLeaderName: raw.ov_signature_leader_name,
        ovSignatureLeaderAt: raw.ov_signature_leader_at,
        ovSignatureRequesterPath: raw.ov_signature_requester_path,
        ovSignatureRequesterName: raw.ov_signature_requester_name,
        ovSignatureRequesterAt: raw.ov_signature_requester_at,
    });

    const handleVisitClick = async (visit: CalendarVisit) => {
        if (selectedVisit?.id === visit.id) {
            setSelectedVisit(null);
            setSelectedFullVisit(null);
            setSelectedVisitTeam([]);
            return;
        }

        setSelectedVisit(visit);
        setIsDetailLoading(true);
        setSelectedFullVisit(null);
        setSelectedFullOrder(null);
        setSelectedVisitTeam([]);
        try {
            if (visit.ovProcessingId === 0) {
                // OS Card
                const realOrderId = visit.id.toString().replace('os-', '');
                const rawOrder = await dataService.getOrderById(realOrderId);
                if (rawOrder) {
                    setSelectedFullOrder(rawOrder);
                } else {
                    setSelectedFullOrder({ error: `Ordem ${visit.id} não retornada pelo getOrderById.` } as any);
                }
            } else {
                // Visit Card
                const [rawVisit, teamResult] = await Promise.all([
                    dataService.getOrderVisitById(visit.id),
                    dataService.getOrdersVisitsTeamsBulk([visit.id])
                ]);
                if (rawVisit) {
                    // Mapeia snake_case da view para camelCase do componente
                    const mapped = mapRawToOrderVisit(rawVisit as any);
                    setSelectedFullVisit(mapped);
                }
                if (teamResult && teamResult[visit.id]) {
                    setSelectedVisitTeam(teamResult[visit.id]);
                }
            }
        } catch (err: any) {
            console.error('Error loading full visit details for modal:', err);
            // Salvar erro no state
            setSelectedFullOrder({ error: err?.message || 'Erro desconhecido' } as any);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">

            {/* ── Top Bar ───────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">

                {/* Row 0: Horizontal Filter Bar (Replicated from OS Dashboard) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full cursor-grab active:cursor-grabbing touch-auto border-b border-slate-100 dark:border-slate-800/50 pb-2.5"
                    ref={filtersScroll.ref}
                    onMouseDown={filtersScroll.onMouseDown}
                    onTouchStart={filtersScroll.onTouchStart}
                    onClickCapture={filtersScroll.onClickCapture}>
                    <div className="flex items-center gap-2 min-w-full pb-0.5 flex-1 min-w-0">
                        <FilterSelect
                            label="SISTEMA"
                            value={advancedFilters.systemParentId || []}
                            onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleSystemChange([])}
                        />
                        <FilterSelect
                            label="SUB-SISTEMA"
                            value={advancedFilters.systemId || []}
                            onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, systemId: [] }))}
                            hidden={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)}
                        />
                        <FilterSelect
                            label="TIPO UNIDADE"
                            value={advancedFilters.unitTypeParentId || []}
                            onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleParentUnitTypeChange([])}
                        />
                        <FilterSelect
                            label="SUB-TIPO UNIDADE"
                            value={advancedFilters.unitTypeId || []}
                            onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, unitTypeId: [] }))}
                            hidden={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)}
                        />
                        <FilterSelect
                            label="UNIDADES"
                            value={advancedFilters.unitId || []}
                            onClick={() => openSelectionModal('unitId', 'UNIDADES', filterOptions.units.map((opt: any) => ({ value: String(opt.id), label: opt.description_full || opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, unitId: [] }))}
                        />
                        <FilterSelect
                            label="SETORES"
                            value={advancedFilters.assetTagId || []}
                            onClick={() => openSelectionModal('assetTagId', 'SETORES', filterOptions.sectors.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, assetTagId: [], assetTagSubId: [] }))}
                        />
                        <FilterSelect
                            label="POSIÇÕES"
                            value={advancedFilters.assetTagSubId || []}
                            onClick={() => openSelectionModal('assetTagSubId', 'POSIÇÕES', assetTagSubOptions.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, assetTagSubId: [] }))}
                            hidden={filterOptions.positions.length === 0}
                        />
                        <FilterSelect
                            label="FINALIDADE"
                            value={advancedFilters.orderObjectId || []}
                            onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterOptions.orderObjects.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderObjectId: [] }))}
                        />
                        <FilterSelect
                            label="TIPO OS"
                            value={advancedFilters.orderTypeId || []}
                            onClick={() => openSelectionModal('orderTypeId', 'TIPO OS', filterOptions.orderTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleOrderTypeChange([])}
                        />
                        <FilterSelect
                            label="SUB-TIPO OS"
                            value={advancedFilters.orderTypeSubId || []}
                            onClick={() => openSelectionModal('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderTypeSubId: [] }))}
                            hidden={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)}
                        />
                        <FilterSelect
                            label="CONTRATO"
                            value={advancedFilters.contractId || []}
                            onClick={() => openSelectionModal('contractId', 'CONTRATO', filterOptions.contracts.map((opt: any) => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, contractId: [] }))}
                            required
                        />
                        <FilterSelect
                            label="PLANO"
                            value={advancedFilters.orderPlanId || []}
                            onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterOptions.plans.map((opt: any) => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderPlanId: [] }))}
                        />
                        <TreeFilterSelect
                            label="EQ.RESPONSAVEL"
                            value={advancedFilters.orderTeamId || []}
                            options={filterOptions.teams.map((opt: any) => ({ value: String(opt.id), label: opt.name || opt.description, parentId: opt.parentId }))}
                            onChange={(vals) => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderTeamId: vals }))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderTeamId: [] }))}
                        />
                        <button
                            onClick={handleApplyFilters}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none group cursor-pointer shrink-0"
                        >
                            <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                                {isLoading ? 'progress_activity' : 'filter_list'}
                            </span>
                            <span className="text-[12px] uppercase tracking-wide whitespace-nowrap">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
                        </button>
                    </div>
                </div>

                {/* Row 1: Week Nav + Search & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Navigation */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                        <button
                            onClick={() => setWeekOffset(w => w - 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            className={`px-3 h-8 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                                weekOffset === 0
                                    ? 'bg-primary text-white shadow shadow-primary/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                            }`}
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setWeekOffset(w => w + 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>

                    {/* Week label */}
                    <div className="flex-1 min-w-[120px]">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{weekLabel}</p>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                    </div>
                </div>

                {/* Row 2: Leader filter + Stats */}
                <div className="flex flex-wrap items-center gap-2">

                    {/* Leaders filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setSelectedLeaderId(null)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${
                                !selectedLeaderId
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">groups</span>
                            Todos
                        </button>
                        {leaders.map(leader => (
                            <button
                                key={leader.id}
                                onClick={() => setSelectedLeaderId(selectedLeaderId === leader.id ? null : leader.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${
                                    selectedLeaderId === leader.id
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                                }`}
                            >
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                    <span className="text-[7px] font-black text-slate-500 uppercase">
                                        {getInitials(leader.name)}
                                    </span>
                                </div>
                                <span className="truncate max-w-[80px]">{leader.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    {/* Stats summary */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white">{stats.total}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{stats.open}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{stats.executing}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{stats.done}</span>
                        </div>
                        <button
                            onClick={fetchVisits}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Atualizar"
                        >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Calendar Grid (Matrix Layout) ─────────────────────────── */}
                <div className="flex-1 overflow-auto min-w-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loading size="md" text="Carregando calendário..." />
                        </div>
                    ) : (
                        <div className="min-w-[1100px] flex flex-col h-full">
                            {/* Table Header */}
                            <div className="flex sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-850 shadow-sm shrink-0">
                                {/* Unidades Column Header (Sticky top-left) */}
                                <div className="w-56 shrink-0 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-30 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Unidades</span>
                                    <span className="text-[9px] font-bold text-slate-400">({activeUnits.length})</span>
                                </div>
                                {/* Days Columns Headers */}
                                {weekDays.map(day => (
                                    <div
                                        key={day.dateStr}
                                        className={`flex-1 min-w-[120px] px-3 py-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 text-center flex flex-col items-center justify-center ${
                                            day.isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                                        }`}
                                    >
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${day.isToday ? 'text-primary' : 'text-slate-400'}`}>
                                            {DAY_NAMES_SHORT[day.date.getDay()]}
                                        </p>
                                        <p className="text-xs font-black mt-0.5 text-slate-700 dark:text-slate-300">
                                            {day.date.getDate()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Table Body Rows */}
                            <div ref={containerRef} className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto no-scrollbar relative">
                                {/* SVG de Conexões - posicionado absolutamente dentro do scroll container */}
                                {connections.length > 0 && (
                                    <svg
                                        className="pointer-events-none"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: svgDimensions.width || '100%',
                                            height: svgDimensions.height || '100%',
                                            zIndex: 2,
                                            overflow: 'visible',
                                        }}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {connections.map(conn => {
                                            const isHighlighted = hoveredOsMask === conn.osMask;
                                            const isAnyHovered = hoveredOsMask !== null;
                                            return (
                                                <path
                                                    key={conn.osMask}
                                                    d={conn.path}
                                                    fill="none"
                                                    stroke={conn.color}
                                                    strokeWidth={isHighlighted ? 3 : 1.5}
                                                    strokeDasharray={isHighlighted ? '0' : '5 4'}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    opacity={isAnyHovered ? (isHighlighted ? 1 : 0.08) : 0.4}
                                                    style={{ transition: 'opacity 0.25s, stroke-width 0.2s' }}
                                                />
                                            );
                                        })}
                                    </svg>
                                )}
                                {activeUnits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] opacity-40">
                                        <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">event_busy</span>
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Nenhuma visita programada para esta semana</p>
                                    </div>
                                ) : (
                                    activeUnits.map(unit => (
                                        <div key={unit.id} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors min-h-[85px]">
                                            {/* Row Header: Unidade name (Sticky Left) */}
                                            <div className="w-56 shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 sticky left-0 z-10 flex flex-col justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
                                                <p className="text-xs font-black text-slate-900 dark:text-white leading-snug break-words">
                                                    {unit.description}
                                                </p>
                                                {unit.clientName && (
                                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate" title={unit.clientName}>
                                                        {unit.clientName}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Cells for each day */}
                                            {weekDays.map(day => {
                                                const cellVisits = filteredVisits.filter(
                                                    v => (v.unitDescription || v.clientName || 'indefinida') === unit.id && getVisitDate(v) === day.dateStr
                                                );
                                                return (
                                                    <div
                                                        key={day.dateStr}
                                                        className={`relative z-[3] flex-1 min-w-[120px] p-2.5 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 flex flex-col gap-2 justify-start ${
                                                            day.isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                                                        }`}
                                                    >
                                                        {cellVisits.length === 0 ? (
                                                            <div className="h-full min-h-[45px] rounded-lg border border-dashed border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150">
                                                                <span className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-wider">Livre</span>
                                                            </div>
                                                        ) : (
                                                            cellVisits.map(visit => (
                                                                <VisitCard
                                                                    key={visit.id}
                                                                    visit={visit}
                                                                    isSelected={selectedVisit?.id === visit.id}
                                                                    onClick={() => handleVisitClick(visit)}
                                                                    hoveredOsMask={hoveredOsMask}
                                                                    onHoverEnter={setHoveredOsMask}
                                                                    onHoverLeave={() => setHoveredOsMask(null)}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Detail Panel Modal ─────────────────────────────────────── */}
                <Modal
                    isOpen={!!selectedVisit}
                    onClose={() => {
                        setSelectedVisit(null);
                        setSelectedFullVisit(null);
                        setSelectedFullOrder(null);
                        setSelectedVisitTeam([]);
                    }}
                    title={selectedVisit?.ovProcessingId === 0 ? "DETALHE DA OS" : "DETALHE DA VISITA"}
                    maxWidth="xl"
                    noPadding
                    draggable
                >
                    {isDetailLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loading size="md" text="Carregando detalhes..." />
                        </div>
                    ) : selectedFullVisit ? (
                        <div className="p-4">
                            <DashboardOrdersVisitsAdminListItem
                                visit={selectedFullVisit}
                                teamMembers={selectedVisitTeam}
                                onClick={onSelectVisit ? () => {
                                    onSelectVisit(selectedFullVisit);
                                    setSelectedVisit(null);
                                    setSelectedFullVisit(null);
                                    setSelectedFullOrder(null);
                                    setSelectedVisitTeam([]);
                                } : undefined}
                            />
                        </div>
                    ) : selectedFullOrder ? (
                        <div className="p-4">
                            {(selectedFullOrder as any).error ? (
                                <div className="text-red-500 text-center py-4">Erro: {(selectedFullOrder as any).error}</div>
                            ) : (
                                <OrderRequestCardListItem
                                    order={selectedFullOrder}
                                    currentUser={currentUser}
                                    onClick={() => onOrderSelect && onOrderSelect(selectedFullOrder as any)}
                                    noBorder
                                    noShadow
                                    onEdit={onEdit}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
                            <span className="material-symbols-outlined text-4xl opacity-40">event_busy</span>
                            <p className="text-sm">Nenhum detalhe disponível</p>
                        </div>
                    )}
                </Modal>
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
                            .filter((opt: any) => opt.label.toLowerCase().includes(selectionSearch.toLowerCase()))
                            .map((opt: any) => {
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
                                                    ? selectionModal.currentValue.filter((v: any) => v !== opt.value)
                                                    : [...selectionModal.currentValue, opt.value];
                                                setSelectionModal((prev: any) => ({ ...prev, currentValue: newVal }));
                                            }}
                                        />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        {selectionModal.options.filter((opt: any) => opt.label.toLowerCase().includes(selectionSearch.toLowerCase())).length === 0 && (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setSelectionModal((prev: any) => ({ ...prev, isOpen: false }))}
                            className="flex-1 py-3 items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleModalConfirm(selectionModal.currentValue)}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm cursor-pointer"
                        >
                            Confirmar ({selectionModal.currentValue.length})
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardOrdersAdminCalendarScreen;
