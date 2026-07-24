import React from 'react';

export const FilterSelect: React.FC<{
    label: string;
    value: string | string[];
    onClick: () => void;
    onClear: () => void;
    disabled?: boolean;
    required?: boolean;
    hidden?: boolean;
    variant?: 'horizontal' | 'vertical';
}> = ({ label, value, onClick, onClear, disabled, required, hidden, variant = 'horizontal' }) => {
    const count = Array.isArray(value) ? value.length : (value ? 1 : 0);
    const isEmpty = count === 0;
    const showRequiredError = required && isEmpty;

    if (hidden) return null;

    if (variant === 'vertical') {
        return (
            <div className={`relative flex items-center w-full transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className={`flex items-stretch w-full h-[52px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all ${
                    showRequiredError
                        ? '!border-red-400'
                        : count > 0
                            ? '!border-primary'
                            : ''
                }`}>
                    <div
                        onClick={onClick}
                        className="flex-1 px-4 flex flex-col justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none whitespace-nowrap">{label}</span>
                            {required && <span className="text-red-500 text-[10px] font-black leading-none">*</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold whitespace-nowrap truncate max-w-[280px] ${
                                showRequiredError
                                    ? 'text-red-400'
                                    : count > 0
                                        ? 'text-primary'
                                        : 'text-slate-500 dark:text-slate-400'
                            }`}>
                                {count > 0
                                    ? (typeof value === 'string' ? value : `${count} ${count === 1 ? 'item' : 'itens'}`)
                                    : (required ? 'Obrigatório' : 'Todos')}
                            </span>
                        </div>
                    </div>

                    {count > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="px-4 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative flex items-center w-auto shrink-0 min-w-[110px] h-[42px] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all ${
                showRequiredError
                    ? '!border-red-400'
                    : count > 0
                        ? '!border-primary'
                        : ''
            }`}>
                <div
                    onClick={onClick}
                    className="flex-1 px-3 flex flex-col justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none whitespace-nowrap">{label}</span>
                        {required && <span className="text-red-500 text-[10px] font-black leading-none">*</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold whitespace-nowrap truncate max-w-[120px] ${
                            showRequiredError
                                ? 'text-red-400'
                                : count > 0
                                    ? 'text-primary'
                                    : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            {count > 0
                                ? (typeof value === 'string' ? value : `${count} ${count === 1 ? 'item' : 'itens'}`)
                                : (required ? 'Obrigatório' : 'Todos')}
                        </span>
                    </div>
                </div>

                {count > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="px-3 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};
