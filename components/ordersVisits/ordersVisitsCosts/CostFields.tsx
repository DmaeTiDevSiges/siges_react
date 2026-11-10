/**
 * Campos de custo compartilhados (materiais do ativo, serviços da visita):
 * Input padrão do app, passo de quantidade e o aviso de desconto/acréscimo do A/D.
 */
import React from 'react';
import { Input } from '../../ui/Input';

export const brl = (value?: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Mesmo estilo do rótulo do Input padrão do app (components/ui/Input). */
export const appLabelClass = 'block mb-1.5 ml-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest';

export const AD_TOOLTIP = 'Fator: 1 = sem ajuste, 0,9 = desconto de 10%, 1,15 = acréscimo de 15%';

/**
 * A/D é um fator multiplicador do total: 1 = sem ajuste, 0,9 = desconto de 10%,
 * 1,15 = acréscimo de 15%.
 */
export const AdjustHint: React.FC<{ factor?: number }> = ({ factor }) => {
    const f = factor ?? 1;
    const pct = Math.round((f - 1) * 10000) / 100;
    const label = pct === 0
        ? 'Sem ajuste'
        : pct < 0
            ? `Desconto ${Math.abs(pct).toLocaleString('pt-BR')}%`
            : `Acréscimo ${pct.toLocaleString('pt-BR')}%`;
    const color = pct === 0
        ? 'text-slate-400'
        : pct < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
    return <span className={`block mt-1 text-center text-[11px] font-bold ${color}`}>{label}</span>;
};

/** Campo numérico com o Input padrão do app. `label` visível; `ariaLabel` quando não há rótulo. */
export const NumberInput: React.FC<{
    value: string;
    label?: string;
    ariaLabel?: string;
    disabled?: boolean;
    onChange: (text: string) => void;
    onBlur: () => void;
    className?: string;
}> = ({ value, label, ariaLabel, disabled, onChange, onBlur, className = '' }) => (
    <Input
        label={label}
        aria-label={ariaLabel || label}
        type="text"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`text-center font-bold tabular-nums disabled:opacity-60 ${className}`}
    />
);

const stepBtn = 'w-12 h-12 shrink-0 rounded-xl shadow-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

/** Quantidade com − e +; `extra` aparece depois do + (ex.: calculadora). */
export const QtyStepper: React.FC<{
    value: string;
    amount: number;
    unit?: string;
    disabled?: boolean;
    onChange: (text: string) => void;
    onBlur: () => void;
    onStep: (delta: number) => void;
    extra?: React.ReactNode;
}> = ({ value, amount, unit, disabled, onChange, onBlur, onStep, extra }) => (
    <div className="flex items-center gap-1.5">
        {!disabled && (
            <button
                type="button"
                onClick={() => onStep(-1)}
                disabled={amount <= 0}
                aria-label="Diminuir quantidade"
                className={`${stepBtn} border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary`}
            >
                <span className="material-symbols-outlined">remove</span>
            </button>
        )}
        <div className="relative flex-1 min-w-[64px]">
            <NumberInput value={value} ariaLabel="Quantidade" disabled={disabled} onChange={onChange} onBlur={onBlur} className={unit ? 'pr-10' : ''} />
            {unit && (
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase">{unit}</span>
            )}
        </div>
        {!disabled && (
            <button
                type="button"
                onClick={() => onStep(1)}
                aria-label="Aumentar quantidade"
                className={`${stepBtn} border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20`}
            >
                <span className="material-symbols-outlined">add</span>
            </button>
        )}
        {!disabled && extra}
    </div>
);

/** Estado do salvamento automático (texto curto). */
export const CostSaveStatus: React.FC<{ state: 'idle' | 'saving' | 'saved' | 'error'; align?: 'left' | 'right' }> = ({ state, align = 'left' }) => (
    <p className={`text-[11px] flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''} ${state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
        <span className={`material-symbols-outlined text-sm ${state === 'saving' ? 'animate-spin' : ''}`}>
            {state === 'saving' ? 'progress_activity' : state === 'error' ? 'error' : 'cloud_done'}
        </span>
        {state === 'saving' ? 'Salvando...' : state === 'error' ? 'Erro ao salvar' : 'Salvo automaticamente'}
    </p>
);
