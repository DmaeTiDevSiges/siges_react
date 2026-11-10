/**
 * Peças compartilhadas do relatório do ativo (OrderVisitAssetReport):
 * tipos, constantes de status, cartão de seção, switch e estilos de campo.
 */
import React, { useState } from 'react';

/** orders_visits_assets.processing_id */
export const OVA_PROCESSING = {
    DRAFT: 1,
    REPORTED: 2,
    REVIEWED: 3,
    REJECTED: 4,
    APPROVED: 5,
} as const;

export const MAX_REPORT_PHOTOS = 3;

export type ReportPhotoSide = 'initial' | 'final';

/** Foto do relatório: a URL exibida anda junto com o nome do arquivo no servidor. */
export interface ReportPhoto {
    key: string;
    url: string;
    filename?: string;
    /** Enviando ou removendo: não pode editar/excluir e o reporte espera. */
    pending?: boolean;
}

export const toReportPhotos = (urls?: (string | undefined)[], names?: string[]): ReportPhoto[] =>
    (urls || []).map((url, i) => ({
        key: names?.[i] || `${i}-${url}`,
        url: url || '',
        filename: names?.[i],
    }));

/** Registrador: aceita vírgula decimal; vazio ou inválido vira null. */
export const parseRecorder = (value: string): number | null => {
    const s = value.trim().replace(',', '.');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
};

/** Ids das seções (âncoras do progresso). */
export const REPORT_SECTION_IDS = {
    before: 'ova-report-before',
    checklist: 'ova-report-checklist',
    activities: 'ova-report-activities',
    materials: 'ova-report-materials',
    movement: 'ova-report-movement',
    after: 'ova-report-after',
    recorder: 'ova-report-recorder',
    alerts: 'ova-report-alerts',
} as const;

export const scrollToReportSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.dispatchEvent(new CustomEvent('ova-report-open'));
};

export const reportTextareaClass =
    'w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed';

export const reportLabelClass =
    'block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1.5';

export const ReportSwitch: React.FC<{
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
    label: string;
}> = ({ checked, onChange, disabled, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => { if (!disabled) onChange(!checked); }}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

export type ReportSectionStatus = 'done' | 'missing';

interface ReportSectionProps {
    id?: string;
    icon: string;
    title: string;
    required?: boolean;
    /** Selo ao lado do título (obrigatório preenchido / faltando). */
    status?: ReportSectionStatus;
    /** Texto curto exibido quando a seção está recolhida (ex.: "2 atividades"). */
    summary?: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

/** Cartão de seção; o título recolhe/expande o conteúdo. */
export const ReportSection: React.FC<ReportSectionProps> = ({ id, icon, title, required, status, summary, action, className = '', children }) => {
    const [open, setOpen] = useState(true);
    const ref = React.useRef<HTMLElement>(null);

    // O progresso abre a seção ao rolar até ela.
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handler = () => setOpen(true);
        el.addEventListener('ova-report-open', handler);
        return () => el.removeEventListener('ova-report-open', handler);
    }, []);

    return (
        <section
            id={id}
            ref={ref}
            className={`scroll-mt-4 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${status === 'missing' ? 'border-red-200 dark:border-red-500/30' : 'border-slate-100 dark:border-slate-800'} ${className}`}
        >
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left min-h-[44px]"
                >
                    <span className="w-9 h-9 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                    </span>
                    <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                            <span className="truncate">{title}</span>
                            {required && <span className="text-red-500 text-base leading-none" aria-label="obrigatório">*</span>}
                            {status === 'done' && <span className="material-symbols-outlined text-base text-emerald-500" aria-label="preenchido">check_circle</span>}
                            {status === 'missing' && <span className="material-symbols-outlined text-base text-red-500" aria-label="faltando">error</span>}
                        </span>
                        {!open && summary && (
                            <span className="block truncate text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{summary}</span>
                        )}
                    </span>
                    <span className="material-symbols-outlined ml-auto shrink-0 text-slate-400 transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
                        expand_more
                    </span>
                </button>
                {action}
            </div>
            {open && <div className="mt-4">{children}</div>}
        </section>
    );
};

export const ReportEmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl text-center">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{children}</p>
    </div>
);

/** Botão "+" do cabeçalho das seções. */
export const ReportAddButton: React.FC<{ onClick: () => void; label: string; icon?: string }> = ({ onClick, label, icon = 'add' }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className="w-11 h-11 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all active:scale-95"
    >
        <span className="material-symbols-outlined">{icon}</span>
    </button>
);
