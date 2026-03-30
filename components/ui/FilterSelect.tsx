import React from 'react';

export const FilterSelect: React.FC<{
    label: string;
    value: string | string[];
    onClick: () => void;
    onClear: () => void;
    disabled?: boolean;
}> = ({ label, value, onClick, onClear, disabled }) => {
    const count = Array.isArray(value) ? value.length : (value ? 1 : 0);

    return (
        <div className={`relative flex items-center w-auto min-w-[110px] h-[42px] transition-opacity shrink-0 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden transition-all ${count > 0 ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div
                    onClick={onClick}
                    className="flex-1 px-3 flex flex-col justify-center border-r border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-0"
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none mb-0.5">{label}</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold ${count > 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                            {count > 0 ? `${count} ${count === 1 ? 'item' : 'itens'}` : 'Todos'}
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
