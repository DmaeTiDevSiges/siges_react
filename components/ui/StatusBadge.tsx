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
                return 'bg-[#0f172a] text-[#10b981] border border-[#10b981]/40 shadow-lg shadow-black/20';
            case 'expiring':
            case 'pending':
                return 'bg-[#0f172a] text-amber-500 border border-amber-500/40 shadow-lg shadow-black/20';
            case 'inactive':
                return 'bg-[#0f172a] text-slate-500 border border-slate-700/50 shadow-lg shadow-black/20';
            default:
                return 'bg-[#0f172a] text-slate-400 border border-slate-700/50';
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
                return <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse-slow" />;
            case 'inactive':
                return <span className="w-2 h-2 rounded-full bg-slate-600" />;
            case 'expiring':
                return <span className="material-symbols-outlined text-[14px]">warning</span>;
            case 'pending':
                return <span className="material-symbols-outlined text-[14px]">pending</span>;
            default:
                return null;
        }
    };

    const baseClasses = "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all";
    const sizeClasses = size === 'sm' ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs";

    return (
        <span className={`${baseClasses} ${sizeClasses} ${getStyle(status)} ${className}`}>
            {getIcon(status)}
            {getLabel(status)}
        </span>
    );
};
