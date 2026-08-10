import React from 'react';

interface ButtonSearchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: string;
}

export const ButtonSearch: React.FC<ButtonSearchProps> = ({ className = '', icon = 'search', ...props }) => {
    return (
        <button
            type="button"
            className={`
                group
                w-12 h-12 
                flex items-center justify-center 
                rounded-2xl 
                bg-indigo-500 
                text-white
                hover:bg-indigo-600
                hover:shadow-lg hover:shadow-indigo-200
                active:scale-90 active:brightness-110
                transition-all duration-200
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
