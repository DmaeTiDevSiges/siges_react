import React from 'react';

interface ChevronButtonProps {
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ChevronButton: React.FC<ChevronButtonProps> = ({
    isOpen,
    onToggle,
    className = '',
    size = 'md',
}) => {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
    };

    const iconSizes = {
        sm: 'text-base',
        md: 'text-xl',
        lg: 'text-2xl',
    };

    return (
        <button
            onClick={onToggle}
            className={`flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 ${sizes[size]} ${className}`}
        >
            <span className={`material-symbols-outlined ${iconSizes[size]} text-slate-500 dark:text-slate-400`}>
                {isOpen ? 'expand_less' : 'expand_more'}
            </span>
        </button>
    );
};
