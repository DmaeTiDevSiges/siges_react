import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { Select } from '../../components/ui/Select';
import { TeamShiftsCalendarEntry, TeamShiftsMonthly, TeamShiftsMonthLock, User } from '../../types';
import { getBrazilDateInputValue, formatDateInBrazil } from '../../utils/formatters';
import { toast } from 'sonner';
import { TeamShiftsPDFButton } from '../../components/reports/TeamShiftsPDFButton';
import { TeamShiftsExcelButton } from '../../components/reports/TeamShiftsExcelButton';
import { TeamShiftsReportRow } from '../../components/reports/TeamShiftsDocument';
import { calculateIdlePercent } from '../../utils/teamShifts';
import { TeamShiftsCalendarModal } from '../../components/dashboards/TeamShiftsCalendarModal';
import { usePermissions } from '../../contexts/PermissionsContext';

/**
 * ABA OCIOSIDADE (Gestão) — visível apenas para isAdminSuper.
 *
 * - Seletor de mês (competência).
 * - Lançamento manual por equipe: turnos normais / extras + observação.
 * - % de ociosidade automática: 1 − (visitas aprovadas ÷ turno disponível),
 *   com drill-down auditável, sugestão de turno extra, comparação com o mês
 *   anterior, evolução de 6 meses, fechamento de competência e exports.
 * - Escopo: equipes do departamento do usuário logado (cfg_teams.department_id
 *   via equipe do usuário — currentUser.departmentId).
 * - Design: tokens do design system do app (design-system/siges/MASTER.md +
 *   padrões das telas de dashboard — LeaderRankingDashboard).
 */

interface DashboardTeamShiftsScreenProps {
    currentUser: User;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type DraftEntry = { normalShifts: string; extraShifts: string; note: string };
type DraftMap = Record<string, DraftEntry>;
type TeamShiftsSortMode = 'name' | 'idle-desc' | 'idle-asc';

const pad = (n: number) => String(n).padStart(2, '0');
const refToYM = (ref: string) => {
    const [y, m] = ref.split('-');
    return { year: Number(y), month: Number(m) };
};
const monthToRef = (year: number, month: number) => `${year}-${pad(month)}-01`;
const monthLabelOf = (ref: string) => {
    const { year, month } = refToYM(ref);
    return `${MONTH_NAMES[month - 1]}/${year}`;
};
const shiftRef = (ref: string, delta: number) => {
    const { year, month } = refToYM(ref);
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    return monthToRef(d.getUTCFullYear(), d.getUTCMonth() + 1);
};
const fmtNum = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtHours = (minutes: number) => fmtNum(minutes / 60);
const fmtVisitHours = (minutes: number) => (minutes / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const draftHasContent = (d?: DraftEntry) =>
    !!d && ((Number(d.normalShifts) || 0) > 0 || (Number(d.extraShifts) || 0) > 0 || !!d.note.trim());
const emptyDraft: DraftEntry = { normalShifts: '0', extraShifts: '0', note: '' };

/* Classes canônicas do app (LeaderRankingDashboard / design system) */
const CARD = 'bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm';
const ROW_ITEM = 'rounded-xl border bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800';
const BTN_SECONDARY =
    'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const INPUT =
    'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** Card de resumo com ícone — padrão SummaryCard do app. */
interface SummaryCardProps {
    icon: string;
    label: string;
    value: React.ReactNode;
    color: string;
    subtext?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color, subtext }) => {
    const iconBgClass = color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50';

    return (
        <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                    <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
                </div>
            </div>
            <div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                {subtext && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtext}</p>}
            </div>
        </div>
    );
};

export const DashboardTeamShiftsScreen: React.FC<DashboardTeamShiftsScreenProps> = ({ currentUser }) => {
    const { canCreate, canView } = usePermissions();
    const canOpenTeamShiftsCalendar = canView('dashboard_teams_shifts_calendar');
    const canConfirmTeamShiftsCalendar = canCreate('dashboard_teams_shifts_calendar');
    const canCloseTeamShiftsMonth = canCreate('dashboard_teams_shifts_calendar_close');
    const canReopenTeamShiftsMonth = canCreate('dashboard_teams_shifts_calendar_reopen');
    // Escopo: departamento do usuário logado (fonte: cfg_teams.department_id via equipe)
    const departmentId = currentUser?.departmentId;
    const companyId = currentUser?.companyId;

    const [monthRef, setMonthRef] = useState<string>(() => `${getBrazilDateInputValue().substring(0, 7)}-01`);
    const [stats, setStats] = useState<TeamShiftsMonthly[]>([]);
    const [lock, setLock] = useState<TeamShiftsMonthLock | null>(null);
    const [drafts, setDrafts] = useState<DraftMap>({});
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [lockAction, setLockAction] = useState<'close' | 'reopen' | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [calendarEntries, setCalendarEntries] = useState<TeamShiftsCalendarEntry[]>([]);
    const [sortMode, setSortMode] = useState<TeamShiftsSortMode>('name');
    const reminderSentFor = useRef<string | null>(null);
    const approvedVisitIds = useRef<Set<string>>(new Set());

    // Horas padrão usadas junto às quantidades lançadas para calcular a
    // disponibilidade mensal. Persistidas no navegador.
    const [normalShiftHours, setNormalShiftHours] = useState<string>(
        () => localStorage.getItem('team_shifts_hours_normal') || '11'
    );
    const [extraShiftHours, setExtraShiftHours] = useState<string>(
        () => localStorage.getItem('team_shifts_hours_extra') || '11'
    );

    const parseHours = (value: string) => {
        const parsed = parseFloat((value || '').replace(',', '.'));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };
    const normalHours = parseHours(normalShiftHours);
    const extraHours = parseHours(extraShiftHours);

    const setHoursField = (field: 'normal' | 'extra', rawValue: string) => {
        const clean = rawValue.replace(/[^\d.,]/g, '');
        if (field === 'normal') {
            setNormalShiftHours(clean);
            localStorage.setItem('team_shifts_hours_normal', clean);
        } else {
            setExtraShiftHours(clean);
            localStorage.setItem('team_shifts_hours_extra', clean);
        }
    };

    const load = useCallback(async (preserveDrafts = false) => {
        if (!departmentId) {
            setStats([]);
            setLock(null);
            approvedVisitIds.current.clear();
            setLoading(false);
            return;
        }
        try {
            if (!preserveDrafts) setLoading(true);
            const { year, month } = refToYM(monthRef);
            const [statsData, lockData] = await Promise.all([
                dataService.getTeamShiftsStats(companyId, departmentId, year, month, 6),
                dataService.getTeamShiftsMonthLock(monthRef, departmentId)
            ]);
            setStats(statsData);
            setLock(lockData);
            approvedVisitIds.current = new Set(
                statsData.flatMap(team => team.visits ?? []).map(visit => visit.id)
            );
            const initial: DraftMap = {};
            statsData.forEach(s => {
                initial[s.teamId] = {
                    normalShifts: String(s.normalShifts),
                    extraShifts: String(s.extraShifts),
                    note: s.note || ''
                };
            });
            setDrafts(previous => preserveDrafts ? { ...initial, ...previous } : initial);
            if (!preserveDrafts) setExpandedTeamId(null);
        } catch (error) {
            console.error('Erro ao carregar ociosidade:', error);
            toast.error('Erro ao carregar a ociosidade das equipes');
        } finally {
            if (!preserveDrafts) setLoading(false);
        }
    }, [companyId, departmentId, monthRef]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!companyId || !departmentId) return;

        const subscription = dataService.subscribeToVisits(payload => {
            const visitId = payload.new?.id ?? payload.old?.id;
            const wasApproved = visitId != null && approvedVisitIds.current.has(String(visitId));
            const isApproved = Number(payload.new?.ov_processing_id) === 5;
            if (wasApproved || isApproved) {
                void load(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [companyId, departmentId, load]);

    const currentStats = useMemo(() => {
        const { year, month } = refToYM(monthRef);

        return stats.map(s => {
            const draft = drafts[s.teamId] ?? emptyDraft;
            const normalShifts = Number(draft.normalShifts) || 0;
            const extraShifts = Number(draft.extraShifts) || 0;
            const shiftMinutesAvailable = (normalShifts * normalHours + extraShifts * extraHours) * 60;
            const idlePercent = calculateIdlePercent(s.approvedVisitMinutes, shiftMinutesAvailable);
            const evolution = s.evolution?.map(point =>
                point.year === year && point.month === month
                    ? { ...point, idlePercent }
                    : point
            );
            const targetIndex = evolution?.findIndex(point => point.year === year && point.month === month) ?? -1;
            const previousIdle = targetIndex > 0 && evolution
                ? evolution[targetIndex - 1].idlePercent
                : s.idlePercentPrevious;

            return {
                ...s,
                shiftMinutesAvailable,
                idlePercent,
                evolution,
                idleDelta: previousIdle !== null && previousIdle !== undefined
                    ? Math.round((idlePercent - previousIdle) * 10) / 10
                    : null
            };
        });
    }, [stats, drafts, normalHours, extraHours, monthRef]);

    // Lembrete de lançamento (≤3 dias do fim do mês, mês aberto, sem registros)
    const reminderVisible = useMemo(() => {
        if (loading || lock || stats.length === 0) return false;
        const today = getBrazilDateInputValue();
        if (!today.startsWith(monthRef.substring(0, 7))) return false;
        const { year, month } = refToYM(monthRef);
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const day = Number(today.substring(8, 10));
        if (day <= lastDay - 3) return false;
        return !stats.some(s => s.recordId);
    }, [loading, lock, stats, monthRef]);

    useEffect(() => {
        if (!reminderVisible) return;
        const key = monthRef.substring(0, 7);
        if (reminderSentFor.current === key) return;
        reminderSentFor.current = key;
        dataService
            .ensureMonthlyShiftsReminder(
                key,
                'Lançar turnos das equipes:',
                'Faltam poucos dias para o fim do mês. Acesse Gestão → Ociosidade para informar os turnos normais e extras de cada equipe.'
            )
            .catch(() => undefined);
    }, [reminderVisible, monthRef]);

    const summary = useMemo(() => {
        let normalShifts = 0;
        let extraShifts = 0;
        let missing = 0;
        stats.forEach(s => {
            const d = drafts[s.teamId] ?? emptyDraft;
            normalShifts += Number(d.normalShifts) || 0;
            extraShifts += Number(d.extraShifts) || 0;
            if (!s.recordId && !draftHasContent(d)) missing++;
        });
        const avgIdle =
            currentStats.length > 0
                ? Math.round((currentStats.reduce((acc, s) => acc + s.idlePercent, 0) / currentStats.length) * 10) / 10
                : 0;
        const normalHoursTotal = Math.round(normalShifts * normalHours);
        const extraHoursTotal = Math.round(extraShifts * extraHours);
        return { normalShifts, extraShifts, missing, avgIdle, normalHoursTotal, extraHoursTotal };
    }, [stats, currentStats, drafts, normalHours, extraHours]);

    const orderedStats = useMemo(() => [...currentStats].sort((a, b) => {
        if (sortMode === 'idle-desc') {
            return b.idlePercent - a.idlePercent ||
                a.teamName.localeCompare(b.teamName, 'pt-BR', { sensitivity: 'base' });
        }
        if (sortMode === 'idle-asc') {
            return a.idlePercent - b.idlePercent ||
                a.teamName.localeCompare(b.teamName, 'pt-BR', { sensitivity: 'base' });
        }
        return a.teamName.localeCompare(b.teamName, 'pt-BR', { sensitivity: 'base' });
    }), [currentStats, sortMode]);

    const reportRows: TeamShiftsReportRow[] = useMemo(
        () =>
            orderedStats.map(s => {
                const d = drafts[s.teamId] ?? emptyDraft;
                return {
                    teamCode: s.teamCode,
                    teamName: s.teamName,
                    normalShifts: Number(d.normalShifts) || 0,
                    extraShifts: Number(d.extraShifts) || 0,
                    businessDays: s.businessDays,
                    approvedVisitHours: fmtHours(s.approvedVisitMinutes),
                    availableHours: fmtHours(s.shiftMinutesAvailable),
                    idlePercent: s.idlePercent,
                    note: d.note || undefined
                };
            }),
        [orderedStats, drafts]
    );

    const handleOpenCalendar = async () => {
        if (!canOpenTeamShiftsCalendar || calendarLoading || !departmentId || lock) return;
        try {
            setCalendarLoading(true);
            const entries = await dataService.getTeamShiftsCalendar(monthRef, departmentId);
            setCalendarEntries(entries);
            setCalendarOpen(true);
        } catch (error) {
            console.error('Erro ao carregar calendário de turnos:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar o calendário de turnos');
        } finally {
            setCalendarLoading(false);
        }
    };

    const handleSaveCalendar = async (entries: TeamShiftsCalendarEntry[]) => {
        if (!departmentId || !canConfirmTeamShiftsCalendar || lock) return;
        await dataService.saveTeamShiftsCalendar(monthRef, departmentId, entries);

        const countsByTeam = new Map<string, { normalShifts: number; extraShifts: number }>();
        entries.forEach(entry => {
            const counts = countsByTeam.get(entry.teamId) ?? { normalShifts: 0, extraShifts: 0 };
            if (entry.shiftType === 'TN') counts.normalShifts++;
            else counts.extraShifts++;
            countsByTeam.set(entry.teamId, counts);
        });

        setCalendarEntries(entries);
        setStats(previous => previous.map(team => {
            const counts = countsByTeam.get(team.teamId) ?? { normalShifts: 0, extraShifts: 0 };
            const hasRecord = counts.normalShifts > 0 || counts.extraShifts > 0 || !!team.note;
            return {
                ...team,
                ...counts,
                recordId: hasRecord ? team.recordId || `calendar-${team.teamId}` : undefined
            };
        }));
        setDrafts(previous => Object.fromEntries(
            Object.entries(previous).map(([teamId, draft]) => {
                const counts = countsByTeam.get(teamId) ?? { normalShifts: 0, extraShifts: 0 };
                return [teamId, {
                    ...draft,
                    normalShifts: String(counts.normalShifts),
                    extraShifts: String(counts.extraShifts)
                }];
            })
        ));
        setCalendarOpen(false);
        toast.success('Contagem diária salva e totais mensais atualizados.');
    };

    const handleLoadCalendarCompetence = async (referenceMonth: string) => {
        if (!departmentId) throw new Error('Departamento não encontrado.');
        return dataService.getTeamShiftsCalendar(referenceMonth, departmentId);
    };

    const handleLockMonth = async () => {
        if (!departmentId || !currentUser || !canCloseTeamShiftsMonth) return;
        try {
            setLocking(true);
            await dataService.lockTeamShiftsMonth(monthRef, departmentId, currentUser.id);
            toast.success(`Competência de ${monthLabelOf(monthRef)} fechada.`);
            setLockAction(null);
            setCalendarOpen(false);
            await load();
        } catch (error) {
            console.error('Erro ao fechar o mês:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao fechar o mês');
        } finally {
            setLocking(false);
        }
    };

    const handleUnlockMonth = async () => {
        if (!departmentId || !currentUser || !canReopenTeamShiftsMonth || !lock) return;
        try {
            setLocking(true);
            await dataService.unlockTeamShiftsMonth(monthRef, departmentId);
            toast.success(`Competência de ${monthLabelOf(monthRef)} reaberta.`);
            setLockAction(null);
            await load();
        } catch (error) {
            console.error('Erro ao reabrir o mês:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao reabrir o mês');
        } finally {
            setLocking(false);
        }
    };

    // ------------------------------------------------------------------
    // Guards de acesso
    // ------------------------------------------------------------------
    if (!departmentId) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className={`${CARD} max-w-md w-full p-8 text-center space-y-2`}>
                    <span className="material-symbols-outlined text-3xl text-slate-400">groups</span>
                    <h2 className="font-bold text-slate-900 dark:text-white">Sem departamento</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Seu usuário não está vinculado a uma equipe com departamento, então não há equipes para exibir.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loading size="md" />
            </div>
        );
    }

    const idleTone = (idle: number) =>
        idle < 30
            ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
            : idle <= 60
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';

    const idleValueColor = (idle: number) =>
        idle < 30 ? 'text-green-500' : idle <= 60 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Competência e ações */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
                        <button
                            onClick={() => setMonthRef(shiftRef(monthRef, -1))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Mês anterior"
                        >
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_left</span>
                        </button>
                        <div className="relative min-w-[140px] text-center">
                            <input
                                type="month"
                                value={monthRef.substring(0, 7)}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val) setMonthRef(`${val}-01`);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                title="Selecionar competência"
                            />
                            <span className="text-sm font-bold text-slate-900 dark:text-white block pointer-events-none">
                                {monthLabelOf(monthRef)}
                            </span>
                        </div>
                        <button
                            onClick={() => setMonthRef(shiftRef(monthRef, 1))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Próximo mês"
                        >
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {lock ? (
                        canReopenTeamShiftsMonth && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (canReopenTeamShiftsMonth) setLockAction('reopen');
                                }}
                                disabled={locking}
                                className={`${BTN_SECONDARY} !text-amber-600 dark:!text-amber-400 !border-amber-500/30 hover:!bg-amber-500/10`}
                                title="Reabrir a competência do mês"
                            >
                                <span className="material-symbols-outlined text-lg">lock_open</span>
                                Reabrir mês
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={handleOpenCalendar}
                            disabled={!canOpenTeamShiftsCalendar || calendarLoading}
                            className={BTN_SECONDARY}
                            title="Contar turnos normais e extras por equipe em cada dia do mês"
                        >
                            <span className={`material-symbols-outlined text-lg ${calendarLoading ? 'animate-spin' : ''}`}>
                                {calendarLoading ? 'sync' : 'calendar_month'}
                            </span>
                            {calendarLoading ? 'Carregando...' : 'DISPONIBILIDADE'}
                        </button>
                    )}
                    <TeamShiftsPDFButton rows={reportRows} periodLabel={monthLabelOf(monthRef)} />
                    <TeamShiftsExcelButton rows={reportRows} />
                </div>
            </div>

            {/* Lembrete de lançamento */}
            {reminderVisible && (
                <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
                    <span className="material-symbols-outlined text-lg shrink-0">notifications_active</span>
                    <span>
                        <b>Faltam poucos dias para o fim do mês</b> e ainda não há lançamentos em {monthLabelOf(monthRef)}.
                        Acesse <b>Gestão → Ociosidade</b> para informar os turnos de cada equipe.
                    </span>
                </div>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    icon="calendar_month"
                    label="Turnos Normais"
                    value={summary.normalShifts}
                    color="text-blue-500"
                    subtext={summary.normalHoursTotal > 0 ? `≈ ${fmtNum(summary.normalHoursTotal)}h` : undefined}
                />
                <SummaryCard
                    icon="calendar_add_on"
                    label="Turnos Extras"
                    value={summary.extraShifts}
                    color="text-purple-500"
                    subtext={summary.extraHoursTotal > 0 ? `≈ ${fmtNum(summary.extraHoursTotal)}h` : undefined}
                />
                <SummaryCard icon="percent" label="Ociosidade Média" value={`${fmtNum(summary.avgIdle)}%`} color={idleValueColor(summary.avgIdle)} />
                <SummaryCard
                    icon="pending_actions"
                    label="Sem Lançamento"
                    value={summary.missing}
                    color={summary.missing > 0 ? 'text-amber-500' : 'text-green-500'}
                    subtext={summary.missing > 0 ? 'equipes sem registro no mês' : 'todas as equipes registradas'}
                />
            </div>

            {/* Lançamento por equipe */}
            {stats.length === 0 ? (
                <div className={`${CARD} p-8 text-center text-sm text-slate-500 dark:text-slate-400`}>
                    Nenhuma equipe avaliável disponível no seu departamento.
                </div>
            ) : (
                <div className={`${CARD} p-4`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">groups</span>
                            Equipes
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                Ordenar
                                <div className="w-40">
                                    <Select
                                        value={sortMode}
                                        onChange={event => {
                                            const value = event.target.value;
                                            if (value === 'name' || value === 'idle-desc' || value === 'idle-asc') {
                                                setSortMode(value);
                                            }
                                        }}
                                        className="!h-9 !px-3 !rounded-lg !shadow-none text-sm font-bold"
                                        aria-label="Ordenar equipes"
                                    >
                                        <option value="name">Equipe A–Z</option>
                                        <option value="idle-desc">Maior ociosidade</option>
                                        <option value="idle-asc">Menor ociosidade</option>
                                    </Select>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{stats.length} equipes</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {orderedStats.map(s => {
                            const draft = drafts[s.teamId] ?? emptyDraft;
                            const expanded = expandedTeamId === s.teamId;
                            const visitCount = s.visits?.length || 0;
                            const normalShifts = Number(draft.normalShifts) || 0;
                            const extraShifts = Number(draft.extraShifts) || 0;

                            return (
                                <div
                                    key={s.teamId}
                                    className={`p-4 ${ROW_ITEM}`}
                                >
                                    {/* Cabeçalho do card */}
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex min-w-0 flex-col items-start gap-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{s.teamName}</h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                    TN {normalShifts} · {fmtNum(normalShifts * normalHours)}h
                                                </span>
                                                <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                                    TE {extraShifts} · {fmtNum(extraShifts * extraHours)}h
                                                </span>
                                                <span className="rounded-lg bg-slate-500/10 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    Visitas {fmtHours(s.approvedVisitMinutes)}h
                                                </span>
                                                {s.idleDelta !== null && s.idleDelta !== undefined && (
                                                    <span
                                                        className={`text-[10px] font-bold shrink-0 ${
                                                            s.idleDelta > 0
                                                                ? 'text-red-500'
                                                                : s.idleDelta < 0
                                                                    ? 'text-green-500'
                                                                    : 'text-slate-400'
                                                        }`}
                                                        title="Variação da ociosidade em relação ao mês anterior"
                                                    >
                                                        {s.idleDelta > 0 ? '▲' : s.idleDelta < 0 ? '▼' : '•'} {fmtNum(Math.abs(s.idleDelta))}pp
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Evolução 6 meses */}
                                            {s.evolution && s.evolution.length > 0 && (
                                                <div
                                                    className="flex items-end gap-0.5 h-7"
                                                    title={s.evolution
                                                        .map(e => `${MONTH_NAMES[e.month - 1].substring(0, 3)}/${String(e.year).slice(2)}: ${fmtNum(e.idlePercent)}%`)
                                                        .join(' · ')}
                                                >
                                                    {s.evolution.map(e => {
                                                        const isTarget = e.year === refToYM(monthRef).year && e.month === refToYM(monthRef).month;
                                                        return (
                                                            <div
                                                                key={`${e.year}-${e.month}`}
                                                                className={`w-2.5 rounded-t-sm transition-all ${isTarget ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                                style={{ height: `${Math.max(6, Math.min(100, e.idlePercent))}%` }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <span className={`px-2.5 py-1 rounded-lg border text-xs font-black ${idleTone(s.idlePercent)}`}>
                                                {fmtNum(s.idlePercent)}% ocioso
                                            </span>
                                        </div>
                                    </div>

                                    {/* Linha auditável + drill-down */}
                                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                                        <button
                                            onClick={() => setExpandedTeamId(expanded ? null : s.teamId)}
                                            className="ml-auto flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">
                                                {expanded ? 'expand_less' : 'expand_more'}
                                            </span>
                                            Ver visitas aprovadas ({visitCount})
                                        </button>
                                    </div>

                                    {expanded && (
                                        <div className="mt-2 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                            {visitCount === 0 ? (
                                                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                                                    Nenhuma visita aprovada em {monthLabelOf(monthRef)}.
                                                </div>
                                            ) : (
                                                s.visits!.map((v, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                                                    >
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0 w-24 truncate">
                                                            {v.orderMask || '—'}
                                                        </span>
                                                        <span className="text-slate-500 dark:text-slate-400 truncate flex-1">
                                                            {v.unitDescription || ''}
                                                        </span>
                                                        <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                                            {v.ovStartedAt
                                                                ? formatDateInBrazil(v.ovStartedAt, 'dateTime', 'pt-BR', {
                                                                      day: '2-digit',
                                                                      month: '2-digit',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit'
                                                                  })
                                                                : '—'}{' '}
                                                            →{' '}
                                                            {v.ovEndedAt
                                                                ? formatDateInBrazil(v.ovEndedAt, 'dateTime', 'pt-BR', {
                                                                      day: '2-digit',
                                                                      month: '2-digit',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit'
                                                                  })
                                                                : '—'}
                                                        </span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                                            {fmtVisitHours(v.minutes ?? 0)} h
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Confirmação de fechamento */}
            {((lockAction === 'close' && canCloseTeamShiftsMonth) ||
                (lockAction === 'reopen' && canReopenTeamShiftsMonth)) && (
                createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm pad-safe-4">
                    <div className={`${CARD} rounded-2xl p-6 max-w-md w-full space-y-4`}>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">
                                {lockAction === 'close' ? 'lock' : 'lock_open'}
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {lockAction === 'close' ? 'Fechar' : 'Reabrir'} mês de {monthLabelOf(monthRef)}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {lockAction === 'close'
                                ? 'Confirmar o fechamento da competência? Depois disso, o lançamento de turnos deste mês não poderá mais ser editado.'
                                : 'Confirmar a reabertura da competência? Os turnos deste mês poderão ser editados novamente.'}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setLockAction(null)}
                                disabled={locking}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            {(lockAction === 'close'
                                ? canCloseTeamShiftsMonth
                                : canReopenTeamShiftsMonth) && (
                                <button
                                    onClick={lockAction === 'close' ? handleLockMonth : handleUnlockMonth}
                                    disabled={locking}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {locking && <Loading size="xs" />}
                                    {locking
                                        ? lockAction === 'close' ? 'Fechando...' : 'Reabrindo...'
                                        : lockAction === 'close' ? 'Confirmar fechamento' : 'Confirmar reabertura'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
                )
            )}
            {calendarOpen && (
                <TeamShiftsCalendarModal
                    monthRef={monthRef}
                    teams={currentStats}
                    entries={calendarEntries}
                    normalShiftHours={normalShiftHours}
                    extraShiftHours={extraShiftHours}
                    isMonthLocked={!!lock}
                    canSaveCalendar={canConfirmTeamShiftsCalendar}
                    canCloseMonth={canCloseTeamShiftsMonth}
                    onClose={() => setCalendarOpen(false)}
                    onRequestCloseMonth={() => {
                        if (canCloseTeamShiftsMonth && !lock) setLockAction('close');
                    }}
                    onHoursChange={setHoursField}
                    onCopyCompetence={handleLoadCalendarCompetence}
                    onSave={handleSaveCalendar}
                />
            )}
        </div>
    );
};
