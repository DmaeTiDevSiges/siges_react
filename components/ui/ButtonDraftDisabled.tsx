import React from 'react';

interface ButtonDraftDisabledProps {
    className?: string;
}

export const ButtonDraftDisabled: React.FC<ButtonDraftDisabledProps> = ({ className = '' }) => {
    return (
        <button
            disabled
            className={`
                w-[50px] h-[50px] 
                rounded-xl 
                bg-blue-50 dark:bg-blue-500/10 
                flex items-center justify-center 
                opacity-50 cursor-not-allowed
                shadow-sm
                ${className}
            `}
        >
            <span className="material-symbols-outlined text-blue-500 text-xl font-bold">
                draft
            </span>
        </button>
    );
};
