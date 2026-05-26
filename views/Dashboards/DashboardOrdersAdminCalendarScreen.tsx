import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, OrderVisit } from '../../types';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { getInitials, formatCurrency } from '../../utils/formatters';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { OrderFilters } from '../../types';

interface DashboardOrdersAdminCalendarScreenProps {
    currentUser: User;
    onSelectVisit?: (visit: OrderVisit) => void;
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
    planDescription?: string;
    ovProcessingId: number;
    processingDescription?: string;
    processingIcon?: string;
    processingIconColor?: string;
    processingBgColor?: string;
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

const getVisitDate = (visit: CalendarVisit): string =>
    (visit.ovStartedAt || visit.ovCreatedAt || '').split('T')[0];

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; dot: string }> = {
    1: { label: 'Em Aberto',    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500' },
    2: { label: 'Em Execução',  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20',   dot: 'bg-blue-500'   },
    3: { label: 'Concluída',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    7: { label: 'Cancelada',    color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500/10 border-red-200 dark:border-red-500/20',     dot: 'bg-red-500'    },
};

const getStatusConfig = (id: number) =>
    STATUS_CONFIG[id] ?? { label: 'Indefinido', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' };

// ─── Sub-components ─────────────────────────────────────────────────────────────

const VisitCard: React.FC<{
    visit: CalendarVisit;
    onClick: () => void;
    isSelected: boolean;
}> = ({ visit, onClick, isSelected }) => {
    const cfg = getStatusConfig(visit.ovStatusId);

    return (
        <div
            onClick={onClick}
            className={`
                relative group rounded-xl border p-2.5 cursor-pointer
                transition-all duration-200 select-none
                hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]
                ${isSelected
                    ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-800 shadow-md shadow-primary/10'
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }
                ${cfg.bg}
            `}
        >
            {/* Status dot */}
            <div className="flex items-start justify-between gap-1 mb-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest truncate flex-1 ${cfg.color}`}>
                    {visit.ovMask}
                </span>
            </div>

            {/* Unit */}
            <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1">
                {visit.unitDescription || visit.clientName}
            </p>

            {/* Leader */}
            <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    <span className="text-[7px] font-black text-slate-500 uppercase">
                        {getInitials(visit.teamLeaderName || 'NI')}
                    </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    {visit.teamLeaderName}
                </span>
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

    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className={`p-5 border-b border-slate-100 dark:border-slate-800 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                            {cfg.label}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {visit.unitDescription}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                    {visit.clientName}
                </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
                {/* Masks */}
                <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visita</p>
                        <p className="text-sm font-black text-primary">{visit.ovMask}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OS</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{visit.orderMask}</p>
                    </div>
                </div>

                {/* Leader */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Líder</p>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-slate-500 uppercase">
                                {getInitials(visit.teamLeaderName || 'NI')}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{visit.teamLeaderName}</span>
                    </div>
                </div>

                {/* Services */}
                {visit.requestedServices && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços</p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                            {visit.requestedServices}
                        </p>
                    </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Iniciada</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            {visit.ovStartedAt
                                ? new Date(visit.ovStartedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : '—'}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plano</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-2">
                            {visit.planDescription || '—'}
                        </p>
                    </div>
                </div>

                {/* Value */}
                {visit.totalValue !== undefined && visit.totalValue > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20">
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Valor Total</p>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
                            {formatCurrency(visit.totalValue)}
                        </p>
                    </div>
                )}

                {/* Progress */}
                {visit.progress !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso</p>
                            <span className="text-[11px] font-black text-primary">{visit.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${visit.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Abrir Visita Button */}
                {onOpenVisit && (
                    <button
                        onClick={onOpenVisit}
                        disabled={isOpenLoading}
                        className="mt-4 w-full py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isOpenLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        )}
                        {isOpenLoading ? 'Carregando...' : 'Abrir Visita'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────────

export const DashboardOrdersAdminCalendarScreen: React.FC<DashboardOrdersAdminCalendarScreenProps> = ({
    currentUser,
    onSelectVisit
}) => {
    const [visits, setVisits] = useState<CalendarVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const [selectedStatusIds, setSelectedStatusIds] = useState<Set<number>>(new Set());
    const [isOpenLoading, setIsOpenLoading] = useState(false);
    const [hasOsFilters, setHasOsFilters] = useState(false);

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
            const raw = await dataService.getOrdersVisitsView({
                startDate: weekStart,
                endDate: weekEnd,
                pageSize: 1000,
                contractId: appliedFilters.contractId,
                systemParentId: appliedFilters.systemParentId,
                systemId: appliedFilters.systemId,
                unitTypeParentId: appliedFilters.unitTypeParentId,
                unitTypeId: appliedFilters.unitTypeId,
                unitId: appliedFilters.unitId,
                orderObjectId: appliedFilters.orderObjectId,
                orderTypeId: appliedFilters.orderTypeId,
                orderTypeSubId: appliedFilters.orderTypeSubId,
                assetTagId: appliedFilters.assetTagId,
                assetTagSubId: appliedFilters.assetTagSubId,
                orderPlanId: appliedFilters.orderPlanId,
                orderTeamId: appliedFilters.orderTeamId,
            });

            const visitsList = Array.isArray(raw) ? raw : (raw?.data || []);
            const mapped: CalendarVisit[] = visitsList.map((row: any) => ({
                id: row.id?.toString(),
                ovMask: row.ov_mask || '',
                ovStatusId: row.ov_status_id || 1,
                statusDescription: row.ov_status_description || '',
                unitDescription: row.unit_description || row.o_unit_description || '',
                clientName: row.client_name || row.o_client_name || '',
                teamLeaderName: row.team_leader_name_short || row.team_leader_name || '',
                teamLeaderId: row.team_leader_id?.toString() || '',
                ovStartedAt: row.ov_started_at || undefined,
                ovCreatedAt: row.ov_created_at || row.o_requested_at || '',
                orderMask: row.order_mask || row.o_mask || '',
                totalValue: row.ov_total_value ? parseFloat(row.ov_total_value) : undefined,
                progress: row.ov_progress !== undefined ? row.ov_progress : undefined,
                requestedServices: row.requested_services || '',
                systemParentId: row.o_system_parent_id?.toString(),
                unitTypeParentId: row.o_unit_type_parent_id?.toString(),
                orderTypeId: row.o_type_id?.toString(),
                planDescription: row.o_plan_description || row.plan_description || '',
                ovProcessingId: row.ov_processing_id || 0,
                processingDescription: row.processing_description || '',
                processingIcon: row.processing_icon || '',
                processingIconColor: row.processing_icon_color || '',
                processingBgColor: row.processing_bg_color || '',
            }));

            setVisits(mapped);
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
                    dataService.getTeams(),
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
        return visits.filter(v => {
            if (selectedLeaderId && v.teamLeaderId !== selectedLeaderId) return false;
            if (selectedStatusIds.size > 0 && !selectedStatusIds.has(v.ovStatusId)) return false;
            return true;
        });
    }, [visits, selectedLeaderId, selectedStatusIds]);

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

    const handleVisitClick = (visit: CalendarVisit) => {
        setSelectedVisit(prev => prev?.id === visit.id ? null : visit);
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
                    <div className="flex items-center gap-2 min-w-full pb-0.5">
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
                            disabled={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)}
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
                            disabled={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)}
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
                            disabled={filterOptions.positions.length === 0}
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
                            disabled={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)}
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
                        <FilterSelect
                            label="EQUIPE"
                            value={advancedFilters.orderTeamId || []}
                            onClick={() => openSelectionModal('orderTeamId', 'EQUIPE', filterOptions.teams.map((opt: any) => ({ value: String(opt.id), label: opt.name || opt.description })))}
                            onClear={() => setAdvancedFilters((prev: OrderFilters) => ({ ...prev, orderTeamId: [] }))}
                        />
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
                            {/* Filtrar Button */}
                        <button
                            onClick={handleApplyFilters}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none group cursor-pointer"
                        >
                            <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                                {isLoading ? 'progress_activity' : 'filter_list'}
                            </span>
                            <span className="text-[12px] uppercase tracking-wide whitespace-nowrap">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
                        </button>

                        {/* Limpar Filtros Button */}
                        {Object.values(advancedFilters).some(v => Array.isArray(v) && v.length > 0) && (
                            <button
                                onClick={clearOsFilters}
                                className="inline-flex items-center justify-center w-10 h-10 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                                title="Limpar todos os filtros de OS"
                            >
                                <span className="material-symbols-outlined text-xl">filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: Status pills + Leader filter + Stats */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filters */}
                    {[
                        { id: 1, label: 'Em Aberto',   dotColor: 'bg-orange-500',  activeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30' },
                        { id: 2, label: 'Em Execução', dotColor: 'bg-blue-500',    activeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30' },
                        { id: 3, label: 'Concluída',   dotColor: 'bg-emerald-500', activeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' },
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => toggleStatus(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                selectedStatusIds.has(s.id)
                                    ? s.activeBg
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${s.dotColor}`} />
                            {s.label}
                        </button>
                    ))}

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

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
                            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto no-scrollbar">
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
                                                        className={`flex-1 min-w-[120px] p-2.5 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 flex flex-col gap-2 justify-center ${
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

                {/* ── Detail Panel ─────────────────────────────────────────── */}
                <div className={`
                    flex-shrink-0 border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${selectedVisit ? 'w-72' : 'w-0'}
                `}>
                    <VisitDetailPanel
                        visit={selectedVisit}
                        onClose={() => setSelectedVisit(null)}
                        onOpenVisit={onSelectVisit ? () => handleOpenVisit(selectedVisit!) : undefined}
                        isOpenLoading={isOpenLoading}
                    />
                </div>
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
