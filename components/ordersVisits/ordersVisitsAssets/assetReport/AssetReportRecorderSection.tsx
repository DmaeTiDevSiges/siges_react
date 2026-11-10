/**
 * Registrador (leitura antes/depois) do ativo.
 */
import React from 'react';
import { parseRecorder, ReportSection, ReportSwitch, reportLabelClass } from './assetReportShared';

interface Props {
    id: string;
    className?: string;
    hasRecorder: boolean;
    before: string;
    after: string;
    isReadOnly: boolean;
    onToggle: (value: boolean) => void;
    onBeforeChange: (value: string) => void;
    onAfterChange: (value: string) => void;
    onCopyBeforeToAfter: () => void;
    onBlur: () => void;
}

const inputClass =
    'w-full h-12 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-base font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-center';

export const AssetReportRecorderSection: React.FC<Props> = ({ id, className, hasRecorder, before, after, isReadOnly, onToggle, onBeforeChange, onAfterChange, onCopyBeforeToAfter, onBlur }) => {
    const b = parseRecorder(before);
    const a = parseRecorder(after);
    const diff = b !== null && a !== null ? a - b : null;

    return (
        <ReportSection
            id={id}
            className={className}
            icon="speed"
            title="Registrador"
            summary={hasRecorder ? `${before || '—'} → ${after || '—'}` : 'Sem registrador'}
            action={<ReportSwitch checked={hasRecorder} onChange={onToggle} disabled={isReadOnly} label="Ativo tem registrador" />}
        >
            {hasRecorder ? (
                <>
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className={reportLabelClass} htmlFor={`${id}-before`}>Antes</label>
                            <input
                                id={`${id}-before`}
                                type="text"
                                inputMode="decimal"
                                value={before}
                                onChange={(e) => onBeforeChange(e.target.value)}
                                onBlur={onBlur}
                                disabled={isReadOnly}
                                placeholder="0"
                                className={inputClass}
                            />
                        </div>

                        <div className="flex h-12 w-14 flex-col items-center justify-center">
                            {b !== null && a === null ? (
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={onCopyBeforeToAfter}
                                    aria-label="Copiar valor de Antes para Depois"
                                    title="Copiar valor de Antes para Depois"
                                    className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                </button>
                            ) : diff !== null ? (
                                <>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dif.</span>
                                    <span className={`text-sm font-black ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {diff >= 0 ? '+' : ''}{diff.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                    </span>
                                </>
                            ) : null}
                        </div>

                        <div className="flex-1">
                            <label className={reportLabelClass} htmlFor={`${id}-after`}>Depois</label>
                            <input
                                id={`${id}-after`}
                                type="text"
                                inputMode="decimal"
                                value={after}
                                onChange={(e) => onAfterChange(e.target.value)}
                                onBlur={onBlur}
                                disabled={isReadOnly}
                                placeholder="0"
                                className={inputClass}
                            />
                        </div>
                    </div>
                    {diff !== null && diff < 0 && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <span className="material-symbols-outlined text-base">warning</span>
                            O valor de Depois está menor que o de Antes. Confira a leitura.
                        </p>
                    )}
                    {((before && b === null) || (after && a === null)) && (
                        <p className="mt-3 text-xs font-bold text-red-500">Use apenas números (ex.: 1234,5).</p>
                    )}
                </>
            ) : (
                <p className="text-xs text-slate-400">Ligue a chave se o ativo tem registrador.</p>
            )}
        </ReportSection>
    );
};
