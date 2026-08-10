import React from 'react';

interface ButtonNewProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: string;
    isLoading?: boolean;
    isSuccess?: boolean;
}

export const ButtonNew: React.FC<ButtonNewProps> = ({ className = '', icon = 'playlist_add', isLoading, isSuccess, disabled, ...props }) => {
    return (
        <div className="relative shrink-0">
            {isLoading && (
                <div className="absolute inset-0 rounded-2xl bg-emerald-400 animate-ping-button z-0" />
            )}
            <button
                type="button"
                className={`
                group
                relative
                w-[45px] h-[45px]
                shrink-0
                flex items-center justify-center 
                rounded-2xl 
                border transition-all duration-200
                active:scale-95 z-10
                ${isSuccess
                        ? 'bg-emerald-500 border-emerald-600 text-white animate-success-pop'
                        : isLoading
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                            : 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-100 hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-900/50'
                    }
                ${disabled || isLoading ? 'opacity-80 cursor-not-allowed' : ''}
                ${className}
            `}
                disabled={disabled || isLoading || isSuccess}
                {...props}
            >
                {isSuccess ? (
                    <span className="material-symbols-outlined text-2xl font-bold animate-success-pop">
                        check
                    </span>
                ) : (
                    <span className={`material-symbols-outlined text-2xl font-bold ${isLoading ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'wght' 700" }}>
                        {isLoading ? 'progress_activity' : icon}
                    </span>
                )}
            </button>
        </div>
    );
};
