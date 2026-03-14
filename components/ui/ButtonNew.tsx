import React from 'react';

interface ButtonNewProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: string;
}

export const ButtonNew: React.FC<ButtonNewProps> = ({ className = '', icon = 'playlist_add', ...props }) => {
    return (
        <button
            type="button"
            className={`
                group
                w-[45px] h-[45px]
                shrink-0
                flex items-center justify-center 
                rounded-2xl 
                border border-emerald-200 dark:border-emerald-900/30
                bg-emerald-50 dark:bg-emerald-900/10 
                text-emerald-500 dark:text-emerald-400
                hover:bg-emerald-100 hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-900/50
                transition-all duration-200
                active:scale-95
                ${className}
            `}
            {...props}
        >
            <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'wght' 700" }}>
                {icon}
            </span>
        </button>
    );
};
