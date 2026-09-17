import React from 'react';

interface AssetLoanCustomChecklistItemProps {
    value: string;
    onChange: (value: string) => void;
    onRemove: () => void;
    readonly?: boolean;
}

export const AssetLoanCustomChecklistItem: React.FC<AssetLoanCustomChecklistItemProps> = ({
    value,
    onChange,
    onRemove,
    readonly = false,
}) => {
    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Descrição do item personalizado"
                disabled={readonly}
                className="flex-1 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            {!readonly && (
                <button
                    onClick={onRemove}
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            )}
        </div>
    );
};
