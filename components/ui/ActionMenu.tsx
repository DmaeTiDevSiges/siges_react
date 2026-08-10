import React, { useState, useRef, useEffect } from 'react';
import { OrderAction } from '../../hooks/useOrderActions';

interface ActionMenuProps {
    actions: OrderAction[];
    onAction: (actionId: string) => void;
    className?: string;
}

/**
 * Reusable action menu triggered by a 3-dots icon
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({ actions, onAction, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (actions.length === 0) return null;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`
                    w-9 h-9 flex items-center justify-center rounded-xl 
                    transition-all duration-200
                    ${isOpen
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10'}
                `}
                title="Mais ações"
            >
                <span className="material-symbols-outlined text-[20px] leading-none">
                    {isOpen ? 'close' : 'more_vert'}
                </span>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 bottom-full mb-3 min-w-[200px] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="py-1.5 backdrop-blur-xl bg-white/80 dark:bg-[#1e293b]/80">
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onAction(action.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left
                                    ${action.variant === 'danger'
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                        : action.variant === 'primary'
                                            ? 'text-primary font-bold hover:bg-primary/5'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                `}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${action.variant === 'primary' ? 'font-bold' : ''}`}>
                                    {action.icon}
                                </span>
                                <span className="flex-1">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
