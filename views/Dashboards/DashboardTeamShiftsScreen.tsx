import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { TeamShiftsMonthly, TeamShiftsMonthLock, TeamShiftsSaveEntry, User } from '../../types';
import { getBrazilDateInputValue, formatDateInBrazil } from '../../utils/formatters';
import { toast } from 'sonner';
import { TeamShiftsPDFButton } from '../../components/reports/TeamShiftsPDFButton';
import { TeamShiftsExcelButton } from '../../components/reports/TeamShiftsExcelButton';
import { TeamShiftsReportRow } from '../../components/reports/TeamShiftsDocument';

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
const draftHasContent = (d?: DraftEntry) =>
    !!d && ((Number(d.normalShifts) || 0) > 0 || (Number(d.extraShifts) || 0) > 0 || !!d.note.trim());
const emptyDraft: DraftEntry = { normalShifts: '0', extraShifts: '0', note: '' };

/* Classes canônicas do app (LeaderRankingDashboard / design system) */
const CARD = 'bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm';
const ROW_ITEM = 'rounded-xl border bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800';
const FIELD_SELECT =
    'px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors';
const BTN_SECONDARY =
    'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY =
    'flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
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
    // Escopo: departamento do usuário logado (fonte: cfg_teams.department_id via equipe)
    const departmentId = currentUser?.departmentId;
    const companyId = currentUser?.companyId;
    const isSuper = currentUser?.isAdminSuper === true;

    const [monthRef, setMonthRef] = useState<string>(() => `${getBrazilDateInputValue().substring(0, 7)}-01`);
    const [stats, setStats] = useState<TeamShiftsMonthly[]>([]);
    const [lock, setLock] = useState<TeamShiftsMonthLock | null>(null);
    const [drafts, setDrafts] = useState<DraftMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locking, setLocking] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [confirmLockOpen, setConfirmLockOpen] = useState(false);
    const reminderSentFor = useRef<string | null>(null);

    // Horas padrão do turno normal/extra — apenas REFERÊNCIA exibida na tela
    // (total estimado de horas lançadas). Não alimenta o % de ociosidade, que
    // continua baseado nas visitas aprovadas. Persistidas no navegador.
    const [normalShiftHours, setNormalShiftHours] = useState<string>(
        () => localStorage.getItem('team_shifts_hours_normal') || '10'
    );
    const [extraShiftHours, setExtraShiftHours] = useState<string>(
        () => localStorage.getItem('team_shifts_hours_extra') || '4'
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

    const load = useCallback(async () => {
        if (!departmentId) {
            setStats([]);
            setLock(null);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { year, month } = refToYM(monthRef);
            const [statsData, lockData] = await Promise.all([
                dataService.getTeamShiftsStats(companyId, departmentId, year, month, 6),
                dataService.getTeamShiftsMonthLock(monthRef, departmentId)
            ]);
            setStats(statsData);
            setLock(lockData);
            const initial: DraftMap = {};
            statsData.forEach(s => {
                initial[s.teamId] = {
                    normalShifts: String(s.normalShifts),
                    extraShifts: String(s.extraShifts),
                    note: s.note || ''
                };
            });
            setDrafts(initial);
            setDirty(false);
            setExpandedTeamId(null);
        } catch (error) {
            console.error('Erro ao carregar ociosidade:', error);
            toast.error('Erro ao carregar a ociosidade das equipes');
        } finally {
            setLoading(false);
        }
    }, [companyId, departmentId, monthRef]);

    useEffect(() => {
        load();
    }, [load]);

    const editable = isSuper && !lock;

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
            stats.length > 0
                ? Math.round((stats.reduce((acc, s) => acc + s.idlePercent, 0) / stats.length) * 10) / 10
                : 0;
        const normalHoursTotal = Math.round(normalShifts * normalHours);
        const extraHoursTotal = Math.round(extraShifts * extraHours);
        return { normalShifts, extraShifts, missing, avgIdle, normalHoursTotal, extraHoursTotal };
    }, [stats, drafts, normalHours, extraHours]);

    const reportRows: TeamShiftsReportRow[] = useMemo(
        () =>
            stats.map(s => {
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
        [stats, drafts]
    );

    const setDraftField = (teamId: string, field: keyof DraftEntry, rawValue: string) => {
        if (!editable) return;
        const value = field === 'note' ? rawValue : rawValue.replace(/\D/g, '');
        setDrafts(prev => ({
            ...prev,
            [teamId]: { ...(prev[teamId] ?? emptyDraft), [field]: value }
        }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!departmentId || !currentUser || !editable) return;
        try {
            setSaving(true);
            const records: TeamShiftsSaveEntry[] = stats.map(s => {
                const d = drafts[s.teamId] ?? emptyDraft;
                return {
                    teamId: s.teamId,
                    normalShifts: Number(d.normalShifts) || 0,
                    extraShifts: Number(d.extraShifts) || 0,
                    note: d.note?.trim() || null
                };
            });
            await dataService.saveTeamShiftsRecords(monthRef, departmentId, records, currentUser.id);
            toast.success('Lançamento de turnos salvo com sucesso!');
            await load();
        } catch (error) {
            console.error('Erro ao salvar turnos:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar o lançamento');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyPrevious = async () => {
        if (!editable) return;
        try {
            const prevRef = shiftRef(monthRef, -1);
            const prevRecords = await dataService.getTeamShiftsRecords(prevRef);
            if (prevRecords.length === 0) {
                toast.error(`Nenhum lançamento registrado em ${monthLabelOf(prevRef)}.`);
                return;
            }
            const prevByTeam = new Map(prevRecords.map(r => [r.teamId, r]));
            const next: DraftMap = {};
            stats.forEach(s => {
                const prev = prevByTeam.get(s.teamId);
                next[s.teamId] = prev
                    ? { normalShifts: String(prev.normalShifts), extraShifts: String(prev.extraShifts), note: prev.note || '' }
                    : { ...emptyDraft };
            });
            setDrafts(next);
            setDirty(true);
            toast.success(`Lançamento de ${monthLabelOf(prevRef)} pré-preenchido — revise e salve.`);
        } catch (error) {
            console.error('Erro ao copiar mês anterior:', error);
            toast.error('Erro ao copiar o lançamento do mês anterior');
        }
    };

    const handleLockMonth = async () => {
        if (!departmentId || !currentUser) return;
        try {
            setLocking(true);
            await dataService.lockTeamShiftsMonth(monthRef, departmentId, currentUser.id);
            toast.success(`Competência de ${monthLabelOf(monthRef)} fechada.`);
            setConfirmLockOpen(false);
            await load();
        } catch (error) {
            console.error('Erro ao fechar o mês:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao fechar o mês');
        } finally {
            setLocking(false);
        }
    };

    // ------------------------------------------------------------------
    // Guards de acesso
    // ------------------------------------------------------------------
    if (!isSuper) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className={`${CARD} max-w-md w-full p-8 text-center space-y-2`}>
                    <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
                    <h2 className="font-bold text-slate-900 dark:text-white">Acesso restrito</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        A aba Ociosidade está disponível apenas para administradores super.
                    </p>
                </div>
            </div>
        );
    }

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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ociosidade das Equipes</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Lançamento mensal de turnos e apuração de ociosidade por visitas aprovadas
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {lock ? (
                        <span className={`${FIELD_SELECT} flex items-center gap-2 text-slate-500 dark:text-slate-400`}>
                            <span className="material-symbols-outlined text-lg">lock</span>
                            Mês fechado em {lock.lockedAt ? formatDateInBrazil(lock.lockedAt, 'date', 'pt-BR') : '—'}
                        </span>
                    ) : (
                        <>
                            <button
                                onClick={handleCopyPrevious}
                                disabled={!editable}
                                className={BTN_SECONDARY}
                                title="Pré-preencher com o lançamento do mês anterior"
                            >
                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                Copiar mês anterior
                            </button>
                            <button
                                onClick={() => setConfirmLockOpen(true)}
                                disabled={!editable}
                                className={`${BTN_SECONDARY} !text-amber-600 dark:!text-amber-400 !border-amber-500/30 hover:!bg-amber-500/10`}
                                title="Fechar a competência do mês"
                            >
                                <span className="material-symbols-outlined text-lg">lock</span>
                                Fechar mês
                            </button>
                        </>
                    )}
                    <TeamShiftsPDFButton rows={reportRows} periodLabel={monthLabelOf(monthRef)} />
                    <TeamShiftsExcelButton rows={reportRows} />
                    <button
                        onClick={handleSave}
                        disabled={!editable || !dirty || saving}
                        className={BTN_PRIMARY}
                    >
                        <span className={`material-symbols-outlined text-lg ${saving ? 'animate-spin' : ''}`}>
                            {saving ? 'sync' : 'save'}
                        </span>
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Filtros: competência */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Competência:</span>
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

                {/* Horas padrão do turno (informativo) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase">Horas padrão do turno:</span>
                    <label className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Normal</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={normalShiftHours}
                            onChange={e => setHoursField('normal', e.target.value)}
                            title="Horas do turno normal — referência exibida na tela"
                            className={`${FIELD_SELECT} w-16 text-center cursor-pointer`}
                        />
                    </label>
                    <label className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Extra</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={extraShiftHours}
                            onChange={e => setHoursField('extra', e.target.value)}
                            title="Horas do turno extra — referência exibida na tela"
                            className={`${FIELD_SELECT} w-16 text-center cursor-pointer`}
                        />
                    </label>
                    <span
                        className="text-[10px] text-slate-400"
                        title="Só para estimativa de horas lançadas — o % de ociosidade usa as visitas aprovadas"
                    >
                        (h por turno · não altera o % de ociosidade)
                    </span>
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
                    icon="autorenew"
                    label="Turnos Normais"
                    value={summary.normalShifts}
                    color="text-blue-500"
                    subtext={summary.normalHoursTotal > 0 ? `≈ ${fmtNum(summary.normalHoursTotal)}h` : undefined}
                />
                <SummaryCard
                    icon="bolt"
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
                            Lançamento de Turnos
                        </h2>
                        <span className="text-xs text-slate-400 font-mono">{stats.length} equipes</span>
                    </div>

                    <div className="space-y-2">
                        {stats.map(s => {
                            const draft = drafts[s.teamId] ?? emptyDraft;
                            const expanded = expandedTeamId === s.teamId;
                            const visitCount = s.visits?.length || 0;
                            const showSuggestion = s.suggestedExtraShifts > 0 && (Number(draft.extraShifts) || 0) < s.suggestedExtraShifts;

                            return (
                                <div key={s.teamId} className={`p-4 ${ROW_ITEM}`}>
                                    {/* Cabeçalho do card */}
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                            {s.teamCode && (
                                                <span className="text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md shrink-0">
                                                    {s.teamCode}
                                                </span>
                                            )}
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{s.teamName}</h3>
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

                                    {/* Inputs de lançamento */}
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <label className="sm:col-span-3 flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Turnos normais
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={draft.normalShifts}
                                                onChange={e => setDraftField(s.teamId, 'normalShifts', e.target.value)}
                                                disabled={!editable}
                                                className={`${INPUT} text-center`}
                                            />
                                        </label>

                                        <label className="sm:col-span-3 flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Turnos extras
                                                {showSuggestion && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDraftField(s.teamId, 'extraShifts', String(s.suggestedExtraShifts))
                                                        }
                                                        disabled={!editable}
                                                        title="Preencher com base nas visitas aprovadas fora do turno (sugestão)"
                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold normal-case tracking-normal transition-colors cursor-pointer hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                                                        Sugerido: {s.suggestedExtraShifts}
                                                    </button>
                                                )}
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={draft.extraShifts}
                                                onChange={e => setDraftField(s.teamId, 'extraShifts', e.target.value)}
                                                disabled={!editable}
                                                className={`${INPUT} text-center`}
                                            />
                                        </label>

                                        <label className="sm:col-span-6 flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Observação
                                            </span>
                                            <input
                                                type="text"
                                                value={draft.note}
                                                onChange={e => setDraftField(s.teamId, 'note', e.target.value)}
                                                disabled={!editable}
                                                placeholder={editable ? 'Opcional (justificativa, turno extra, etc.)' : ''}
                                                className={`${INPUT} font-medium`}
                                            />
                                        </label>
                                    </div>

                                    {/* Total estimado de horas (informativo — padrão do topo da página) */}
                                    {(Number(draft.normalShifts) > 0 || Number(draft.extraShifts) > 0) &&
                                        (normalHours > 0 || extraHours > 0) && (
                                            <div className="mt-2 text-[11px] text-slate-400">
                                                ≈{' '}
                                                <b className="text-slate-600 dark:text-slate-300">
                                                    {fmtNum((Number(draft.normalShifts) || 0) * normalHours)}h
                                                </b>{' '}
                                                em turnos normais +{' '}
                                                <b className="text-slate-600 dark:text-slate-300">
                                                    {fmtNum((Number(draft.extraShifts) || 0) * extraHours)}h
                                                </b>{' '}
                                                em turnos extras (
                                                {fmtNum(
                                                    (Number(draft.normalShifts) || 0) * normalHours +
                                                        (Number(draft.extraShifts) || 0) * extraHours
                                                )}
                                                h no total)
                                            </div>
                                        )}

                                    {/* Linha auditável + drill-down */}
                                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                                        <span>
                                            <b className="text-slate-700 dark:text-slate-300">{fmtHours(s.approvedVisitMinutes)}h</b> em
                                            visitas aprovadas de{' '}
                                            <b className="text-slate-700 dark:text-slate-300">{fmtHours(s.shiftMinutesAvailable)}h</b>{' '}
                                            disponíveis · {s.businessDays} dias úteis
                                        </span>
                                        <button
                                            onClick={() => setExpandedTeamId(expanded ? null : s.teamId)}
                                            className="flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer transition-colors"
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
                                                            {v.minutes ?? 0} min
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
            {confirmLockOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`${CARD} rounded-2xl p-6 max-w-md w-full space-y-4`}>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">lock</span>
                            <h3 className="font-bold text-slate-900 dark:text-white">Fechar mês de {monthLabelOf(monthRef)}</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Confirmar o fechamento da competência? Depois disso, o lançamento de turnos deste mês não poderá
                            mais ser editado.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmLockOpen(false)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLockMonth}
                                disabled={locking}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {locking && <Loading size="xs" />}
                                {locking ? 'Fechando...' : 'Confirmar fechamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
