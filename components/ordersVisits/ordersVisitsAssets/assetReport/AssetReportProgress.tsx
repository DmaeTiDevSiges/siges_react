/**
 * Progresso do relatório: o que é obrigatório para reportar e o que falta.
 * Tocar num item rola até a seção (e a abre, se estiver recolhida).
 */
import React from 'react';
import { ReportSaveState } from '../../../../hooks/useReportAutosave';
import { scrollToReportSection } from './assetReportShared';

export interface ReportProgressItem {
    key: string;
    label: string;
    done: boolean;
    sectionId: string;
    /** Não impede o reporte (só avisa). */
    optional?: boolean;
}

interface Props {
    items: ReportProgressItem[];
    variant: 'compact' | 'list';
    /** Título quando tudo está completo (depende da etapa: reportar, revisar, aprovar). */
    readyLabel?: string;
}

export const AssetReportProgress: React.FC<Props> = ({ items, variant, readyLabel = 'Pronto para reportar' }) => {
    const required = items.filter(i => !i.optional);
    const doneCount = required.filter(i => i.done).length;
    const allDone = doneCount === required.length;

    const chip = (item: ReportProgressItem) => (
        <button
            key={item.key}
            type="button"
            onClick={() => scrollToReportSection(item.sectionId)}
            className={`inline-flex min-h-[36px] items-center gap-1 rounded-full border px-3 text-[11px] font-bold transition-colors ${item.done
                ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : item.optional
                    ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                }`}
        >
            <span className="material-symbols-outlined text-sm">{item.done ? 'check' : item.optional ? 'priority_high' : 'close'}</span>
            {item.label}
        </button>
    );

    const header = (
        <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {allDone ? readyLabel : 'Falta preencher'}
            </span>
            <span className={`text-xs font-black ${allDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {doneCount}/{required.length}
            </span>
        </div>
    );

    const bar = (
        <div className="mt-2 flex gap-1" aria-hidden="true">
            {required.map(i => (
                <span key={i.key} className={`h-1.5 flex-1 rounded-full ${i.done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
        </div>
    );

    if (variant === 'compact') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                {header}
                {bar}
                <div className="mt-3 flex flex-wrap gap-2">{items.map(chip)}</div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            {header}
            {bar}
            <ul className="mt-3 space-y-1">
                {items.map(item => (
                    <li key={item.key}>
                        <button
                            type="button"
                            onClick={() => scrollToReportSection(item.sectionId)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <span className={`material-symbols-outlined text-base ${item.done ? 'text-emerald-500' : item.optional ? 'text-amber-500' : 'text-red-500'}`}>
                                {item.done ? 'check_circle' : item.optional ? 'error' : 'radio_button_unchecked'}
                            </span>
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const AssetReportSaveStatus: React.FC<{ state: ReportSaveState; onRetry: () => void }> = ({ state, onRetry }) => {
    if (state === 'idle') return null;
    return (
        <div
            role="status"
            className={`flex items-center justify-between gap-2 text-[11px] font-bold ${state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
            <span className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-base ${state === 'saving' ? 'animate-spin' : ''}`}>
                    {state === 'saving' ? 'progress_activity' : state === 'saved' ? 'cloud_done' : 'error'}
                </span>
                {state === 'saving' ? 'Salvando...' : state === 'saved' ? 'Salvo' : 'Não salvo'}
            </span>
            {state === 'error' && (
                <button type="button" onClick={onRetry} className="min-h-[32px] px-3 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase">
                    Tentar de novo
                </button>
            )}
        </div>
    );
};
