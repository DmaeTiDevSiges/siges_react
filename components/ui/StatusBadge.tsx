import React from 'react';

export type StatusType = 'active' | 'inactive' | 'pending' | 'expiring';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
    size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '', size = 'md' }) => {
    const getStyle = (s: StatusType) => {
        switch (s) {
            case 'active':
                return 'bg-[#e6fcf5] text-[#099268] dark:bg-green-500/10 dark:text-green-400 border border-green-200/60 dark:border-green-500/20';
            case 'expiring':
            case 'pending':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20';
            case 'inactive':
                return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200/60 dark:border-slate-500/20';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    const getLabel = (s: StatusType) => {
        if (label) return label;
        switch (s) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'pending': return 'Pendente';
            case 'expiring': return 'Expirando';
            default: return s;
        }
    };

    const getIcon = (s: StatusType) => {
        switch (s) {
            case 'active':
                return <span className="w-1.5 h-1.5 rounded-full bg-[#12b886] shadow-[0_0_8px_rgba(18,184,134,0.4)]" />;
            case 'inactive':
                return <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]" />;
            case 'expiring':
                return <span className="material-symbols-outlined text-[14px]">warning</span>;
            case 'pending':
                return <span className="material-symbols-outlined text-[14px]">pending</span>;
            default:
                return null;
        }
    };

    const baseClasses = "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all";
    const sizeClasses = size === 'sm' ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

    return (
        <span className={`${baseClasses} ${sizeClasses} ${getStyle(status)} ${className}`}>
            {getIcon(status)}
            {getLabel(status)}
        </span>
    );
};
