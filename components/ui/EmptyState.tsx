import React from 'react';

interface EmptyStateProps {
    message: string;
    icon?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    message,
    icon = 'search_off', // Default icon
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[32px]">
                    {icon}
                </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto mb-4">
                {message}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
