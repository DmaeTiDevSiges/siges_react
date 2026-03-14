import React from 'react';

interface ButtonDeleteProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: string;
}

export const ButtonDelete: React.FC<ButtonDeleteProps> = ({ className = '', icon = 'remove', ...props }) => {
    return (
        <button
            type="button"
            className={`
                group
                w-[45px] h-[45px]
                min-w-[45px] min-h-[45px]
                max-w-[45px] max-h-[45px]
                shrink-0
                flex items-center justify-center 
                rounded-xl 
                border border-red-200 dark:border-red-900/30
                bg-red-50 dark:bg-red-900/10 
                text-red-500 dark:text-red-400
                hover:bg-red-100 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-900/50
                transition-all duration-200
                active:scale-95
                overflow-hidden
                ${className}
            `}
            {...props}
        >
            <span className="material-symbols-outlined text-xl font-bold">
                {icon}
            </span>
        </button>
    );
};
