import React, { useState } from 'react';
import { Calendar } from './Calendar';

export interface DateRange { start: string; end: string }

type Field = 'start' | 'end';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "Mês passado", "Mês atual" e "Hoje" a partir de uma data (YYYY-MM-DD, horário local). */
export const getPeriodShortcuts = (now: Date = new Date()): { label: string; icon: string; range: DateRange }[] => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const today = toDateStr(now);
    return [
        { label: 'Mês passado', icon: 'calendar_month', range: { start: toDateStr(new Date(y, m - 1, 1)), end: toDateStr(new Date(y, m, 0)) } },
        { label: 'Mês atual', icon: 'calendar_today', range: { start: toDateStr(new Date(y, m, 1)), end: toDateStr(new Date(y, m + 1, 0)) } },
        { label: 'Hoje', icon: 'today', range: { start: today, end: today } },
    ];
};

const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
};

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

/**
 * Corpo do modal "Informar período": atalhos, campos Início/Fim e calendário.
 * Tudo cabe na largura do modal (sem rolagem horizontal). O título e o botão
 * "Aplicar" ficam por conta de quem usa. O campo ativo (Início/Fim) é interno.
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
    const [active, setActive] = useState<Field>('start');
    const shortcuts = getPeriodShortcuts();

    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div role="group" aria-label="Atalhos de período" className="grid grid-cols-3 gap-2">
                {shortcuts.map(({ label, icon, range }) => {
                    const selected = value.start === range.start && value.end === range.end;
                    return (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => { onChange(range); setActive('start'); }}
                            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all ${selected
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black'
                                : 'border border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
                            <span className="w-full break-words text-center text-[10px] uppercase leading-tight tracking-wide">{label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {(['start', 'end'] as const).map(field => (
                    <button
                        key={field}
                        type="button"
                        aria-pressed={active === field}
                        onClick={() => setActive(field)}
                        className={`flex min-w-0 flex-col gap-1.5 rounded-xl border-2 p-3 text-left transition-all ${active === field
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                            }`}
                    >
                        <span className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${active === field ? 'text-primary' : 'text-slate-400'}`}>
                                {field === 'start' ? 'Início' : 'Fim'}
                            </span>
                            <span className="material-symbols-outlined shrink-0 text-sm text-slate-400" aria-hidden="true">
                                {field === 'start' ? 'calendar_today' : 'event'}
                            </span>
                        </span>
                        <span className={`truncate text-sm font-bold ${value[field] ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                            {formatDateDisplay(value[field]) || 'Selecionar'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-3 shadow-sm sm:p-4">
                <Calendar
                    value={value[active]}
                    onChange={date => {
                        onChange({ ...value, [active]: date });
                        if (active === 'start') setActive('end');
                    }}
                    rangeStart={value.start}
                    rangeEnd={value.end}
                />
            </div>
        </div>
    );
};
