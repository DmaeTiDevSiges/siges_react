import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TeamShiftsCalendarEntry, TeamShiftsMonthly } from '../../types';
import { getTeamShiftsCalendarWeeks, mapTeamShiftsCalendarEntriesToMonth } from '../../utils/teamShiftsCalendar';
import { TeamShiftsCalendarPDFButton } from '../reports/TeamShiftsCalendarPDFButton';

interface TeamShiftsCalendarModalProps {
    monthRef: string;
    teams: TeamShiftsMonthly[];
    entries: TeamShiftsCalendarEntry[];
    normalShiftHours: string;
    extraShiftHours: string;
    isMonthLocked: boolean;
    canSaveCalendar: boolean;
    canCloseMonth: boolean;
    onClose: () => void;
    onRequestCloseMonth: () => void;
    onHoursChange: (field: 'normal' | 'extra', value: string) => void;
    onCopyCompetence: (referenceMonth: string) => Promise<TeamShiftsCalendarEntry[]>;
    onSave: (entries: TeamShiftsCalendarEntry[]) => Promise<void>;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_NAMES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];
const pad = (value: number) => String(value).padStart(2, '0');
const monthLabel = (year: number, month: number) => `${MONTH_NAMES[month - 1]} de ${year}`;

export const TeamShiftsCalendarModal: React.FC<TeamShiftsCalendarModalProps> = ({
    monthRef,
    teams,
    entries,
    normalShiftHours,
    extraShiftHours,
    isMonthLocked,
    canSaveCalendar,
    canCloseMonth,
    onClose,
    onRequestCloseMonth,
    onHoursChange,
    onCopyCompetence,
    onSave
}) => {
    const [draftEntries, setDraftEntries] = useState(entries);
    const [weekIndex, setWeekIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyPanelOpen, setCopyPanelOpen] = useState(false);
    const [sourceMonth, setSourceMonth] = useState(() => {
        const [sourceYear, sourceMonthNumber] = monthRef.split('-').map(Number);
        const previousMonth = new Date(Date.UTC(sourceYear, sourceMonthNumber - 2, 1));
        return `${previousMonth.getUTCFullYear()}-${pad(previousMonth.getUTCMonth() + 1)}`;
    });
    const [errorMessage, setErrorMessage] = useState('');
    const weeks = useMemo(() => getTeamShiftsCalendarWeeks(monthRef), [monthRef]);
    const [year, month] = monthRef.split('-').map(Number);
    const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const maxCopyMonth = `${previousMonthDate.getUTCFullYear()}-${pad(previousMonthDate.getUTCMonth() + 1)}`;
    const dates = weeks[weekIndex] ?? [];
    const markedCells = useMemo(
        () => new Set(draftEntries.map(entry => `${entry.teamId}:${entry.date}:${entry.shiftType}`)),
        [draftEntries]
    );
    const sortedTeams = useMemo(
        () => [...teams].sort((a, b) => a.teamName.localeCompare(b.teamName, 'pt-BR', { sensitivity: 'base' })),
        [teams]
    );
    const countsByTeam = useMemo(() => {
        const counts = new Map<string, { TN: number; TE: number }>();
        draftEntries.forEach(entry => {
            const count = counts.get(entry.teamId) ?? { TN: 0, TE: 0 };
            count[entry.shiftType]++;
            counts.set(entry.teamId, count);
        });
        return counts;
    }, [draftEntries]);

    const toggleCell = (teamId: string, date: string, shiftType: TeamShiftsCalendarEntry['shiftType']) => {
        if (!canSaveCalendar || isMonthLocked || saving || copying) return;

        setDraftEntries(previous => {
            const isMarked = previous.some(entry =>
                entry.teamId === teamId && entry.date === date && entry.shiftType === shiftType
            );
            const withoutCell = previous.filter(entry =>
                entry.teamId !== teamId || entry.date !== date || entry.shiftType !== shiftType
            );
            return isMarked ? withoutCell : [...withoutCell, { teamId, date, shiftType }];
        });
    };

    const handleHoursChange = (field: 'normal' | 'extra', value: string) => {
        if (!canSaveCalendar || isMonthLocked || saving || copying) return;
        onHoursChange(field, value);
    };

    const handleSave = async () => {
        if (!canSaveCalendar || isMonthLocked) return;
        setSaving(true);
        setErrorMessage('');
        try {
            await onSave(draftEntries);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar o calendário.');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyCompetence = async () => {
        if (!canSaveCalendar || isMonthLocked) return;

        const sourceReferenceMonth = `${sourceMonth}-01`;
        if (!sourceMonth || sourceMonth > monthRef.slice(0, 7)) {
            setErrorMessage('Selecione uma competência anterior à atual.');
            return;
        }

        setCopying(true);
        setErrorMessage('');
        try {
            const sourceEntries = await onCopyCompetence(sourceReferenceMonth);
            if (sourceEntries.length === 0) {
                setErrorMessage('Não há marcações no calendário da competência selecionada.');
                return;
            }

            const copiedEntries = mapTeamShiftsCalendarEntriesToMonth(
                sourceEntries,
                monthRef,
                teams.map(team => team.teamId)
            );
            if (copiedEntries.length === 0) {
                setErrorMessage('Não há marcações compatíveis para copiar para esta competência.');
                return;
            }

            setDraftEntries(copiedEntries);
            setCopyPanelOpen(false);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível copiar o calendário.');
        } finally {
            setCopying(false);
        }
    };

    const totalsMismatch = teams.some(team => {
        const counts = countsByTeam.get(team.teamId) ?? { TN: 0, TE: 0 };
        return counts.TN !== team.normalShifts || counts.TE !== team.extraShifts;
    });

    return createPortal((
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
            role="presentation"
            onMouseDown={event => {
                if (event.target === event.currentTarget && !saving && !copying) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="team-shifts-calendar-title"
                className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-dark"
            >
                <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 p-4 sm:p-5 dark:border-slate-700">
                    <div>
                        <h2 id="team-shifts-calendar-title" className="text-lg font-bold text-slate-900 dark:text-white">
                            Disponibilidade das Equipes
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {monthLabel(year, month)}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center justify-end gap-2">
                        {canCloseMonth && !isMonthLocked && (
                            <button
                                type="button"
                                onClick={onRequestCloseMonth}
                                disabled={!canCloseMonth || isMonthLocked || saving || copying}
                                className="flex items-center gap-2 rounded-xl border border-amber-500/30 px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                                title="Fechar a competência do mês"
                            >
                                <span className="material-symbols-outlined text-lg">lock</span>
                                Fechar mês
                            </button>
                        )}
                        <TeamShiftsCalendarPDFButton
                            monthRef={monthRef}
                            teams={teams}
                            entries={draftEntries}
                            normalShiftHours={normalShiftHours}
                            extraShiftHours={extraShiftHours}
                            disabled={saving || copying}
                        />
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving || copying}
                            aria-label="Fechar calendário"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setWeekIndex(index => Math.max(0, index - 1))}
                            disabled={weekIndex === 0 || saving || copying}
                            aria-label="Semana anterior"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="min-w-32 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                            Semana {weekIndex + 1} de {weeks.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setWeekIndex(index => Math.min(weeks.length - 1, index + 1))}
                            disabled={weekIndex >= weeks.length - 1 || saving || copying}
                            aria-label="Próxima semana"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                        {canSaveCalendar && !isMonthLocked && (
                            <button
                                type="button"
                                onClick={() => {
                                    setErrorMessage('');
                                    setCopyPanelOpen(open => !open);
                                }}
                                disabled={saving || copying}
                                aria-label="Copiar calendário de outra competência"
                                aria-expanded={copyPanelOpen}
                                title="Copiar calendário de outra competência"
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-lg">content_copy</span>
                            </button>
                        )}
                        {canSaveCalendar && !isMonthLocked && copyPanelOpen && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                                <label className="sr-only" htmlFor="team-shifts-copy-month">Competência de origem</label>
                                <input
                                    id="team-shifts-copy-month"
                                    type="month"
                                    value={sourceMonth}
                                    max={maxCopyMonth}
                                    onChange={event => setSourceMonth(event.target.value)}
                                    disabled={copying || saving}
                                    aria-label="Competência de origem"
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyCompetence}
                                    disabled={!sourceMonth || copying || saving || isMonthLocked}
                                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                >
                                    <span className={`material-symbols-outlined text-base ${copying ? 'animate-spin' : ''}`}>
                                        {copying ? 'sync' : 'content_copy'}
                                    </span>
                                    {copying ? 'Copiando...' : 'Copiar'}
                                </button>
                                <p className="w-full text-[11px] text-slate-500 dark:text-slate-400">
                                    Substitui o rascunho atual, copiando pelo mesmo dia do mês. Confirme para salvar.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">TN</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={normalShiftHours}
                                onChange={event => handleHoursChange('normal', event.target.value)}
                                disabled={!canSaveCalendar || isMonthLocked || saving || copying}
                                aria-label="Quantidade de horas por turno normal"
                                className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            h
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 font-black text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">TE</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={extraShiftHours}
                                onChange={event => handleHoursChange('extra', event.target.value)}
                                disabled={!canSaveCalendar || isMonthLocked || saving || copying}
                                aria-label="Quantidade de horas por turno extra"
                                className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            h
                        </label>
                    </div>
                </div>

                {totalsMismatch && (
                    <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        Os totais atuais não correspondem às marcações por dia. Ao salvar o calendário, os totais mensais serão atualizados com esta contagem.
                    </p>
                )}

                <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[980px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="sticky left-0 z-20 min-w-48 border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-bold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                                    Equipe avaliável
                                </th>
                                {dates.map((date, index) => (
                                    <th key={WEEKDAYS[index]} className="min-w-20 border-b border-slate-200 px-2 py-3 text-center dark:border-slate-700">
                                        {date ? (
                                            <>
                                                <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">{WEEKDAYS[index]}</span>
                                                <span className="block text-[11px] font-normal text-slate-400">{pad(Number(date.slice(8, 10)))}/{pad(month)}</span>
                                            </>
                                        ) : <span className="text-slate-300">—</span>}
                                    </th>
                                ))}
                                <th className="min-w-16 border-b border-slate-200 px-2 py-3 text-center text-xs font-bold text-blue-700 dark:border-slate-700 dark:text-blue-300">TN total</th>
                                <th className="min-w-16 border-b border-slate-200 px-2 py-3 text-center text-xs font-bold text-purple-700 dark:border-slate-700 dark:text-purple-300">TE total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map(team => {
                                const counts = countsByTeam.get(team.teamId) ?? { TN: 0, TE: 0 };
                                return (
                                    <tr key={team.teamId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <th className="sticky left-0 border-b border-slate-100 bg-white px-3 py-2 text-left font-semibold text-slate-800 dark:border-slate-800 dark:bg-surface-dark dark:text-slate-100">
                                            {team.teamName}
                                        </th>
                                        {dates.map((date, index) => {
                                            if (!date) {
                                                return <td key={WEEKDAYS[index]} className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/20" />;
                                            }
                                            const key = date;
                                            return (
                                                <td key={key} className="border-b border-slate-100 px-2 py-1.5 text-center dark:border-slate-800">
                                                    <div className="flex justify-center gap-1">
                                                        {(['TN', 'TE'] as const).map(shiftType => {
                                                            const isMarked = markedCells.has(`${team.teamId}:${key}:${shiftType}`);
                                                            const normal = shiftType === 'TN';
                                                            return (
                                                                <button
                                                                    key={shiftType}
                                                                    type="button"
                                                                    onClick={() => toggleCell(team.teamId, key, shiftType)}
                                                                    disabled={!canSaveCalendar || isMonthLocked || saving || copying}
                                                                    aria-pressed={isMarked}
                                                                    aria-label={`${team.teamName}, ${WEEKDAYS[index]} ${key}: ${shiftType} ${isMarked ? 'marcado' : 'desmarcado'}`}
                                                                    className={`h-8 w-9 rounded-md border text-[10px] font-black transition-colors disabled:opacity-50 ${
                                                                        isMarked
                                                                            ? normal
                                                                                ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                                                : 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                                                            : 'border-slate-200 bg-white text-slate-300 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                                                                    }`}
                                                                >
                                                                    {shiftType}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-slate-100 text-center font-bold text-blue-700 dark:border-slate-800 dark:text-blue-300">{counts.TN}</td>
                                        <td className="border-b border-slate-100 text-center font-bold text-purple-700 dark:border-slate-800 dark:text-purple-300">{counts.TE}</td>
                                    </tr>
                                );
                            })}
                            {teams.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-sm text-slate-500">Nenhuma equipe avaliável encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {errorMessage && (
                    <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {errorMessage}
                    </p>
                )}

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><b className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">TN</b> Turno normal</span>
                        <span className="flex items-center gap-1"><b className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">TE</b> Turno extra</span>
                    </div>
                    {canSaveCalendar && !isMonthLocked && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || copying}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-lg ${saving ? 'animate-spin' : ''}`}>{saving ? 'sync' : 'save'}</span>
                            {saving ? 'CONFIRMANDO...' : 'CONFIRMAR'}
                        </button>
                    )}
                </footer>
            </section>
        </div>
    ), document.body);
};
