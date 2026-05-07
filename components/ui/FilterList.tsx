import React from 'react';

interface FilterListProps {
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    className?: string;
}

export const FilterList: React.FC<FilterListProps> = ({ options, selected, onSelect, className = '' }) => {
    return (
        <div className={`flex gap-3 overflow-x-auto no-scrollbar items-center ${className}`}>
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className={`flex shrink-0 h-9 items-center justify-center px-5 rounded-xl text-sm font-medium transition-all ${selected === option
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-slate-200 dark:bg-surface-dark text-slate-600 dark:text-white border border-transparent dark:border-slate-800'
                        }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};
