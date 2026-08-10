import React from 'react';
import { IconButton } from './IconButton';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string;
    onClear?: () => void;
    rightAction?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({ containerClassName = '', className = '', onClear, rightAction, ...props }) => {
    return (
        <div className={`relative group ${containerClassName} ${props.disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
                type="text"
                className={`
                    block w-full h-12 pl-11 ${props.value && onClear ? 'pr-20' : rightAction ? 'pr-14' : 'pr-4'} 
                    text-sm rounded-[12px] border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-[#1e293b] 
                    text-slate-900 dark:text-slate-100 
                    placeholder-slate-400 dark:placeholder-slate-600 
                    focus:ring-2 focus:ring-primary/20 focus:border-primary
                    shadow-sm outline-none transition-all
                    ${className}
                `}
                {...props}
            />

            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                {props.value && onClear && (
                    <IconButton
                        icon="close"
                        size="sm"
                        variant="ghost"
                        onClick={onClear}
                        title="Limpar pesquisa"
                    />
                )}
                {rightAction}
            </div>
        </div>
    );
};
