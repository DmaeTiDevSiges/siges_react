import React from 'react';

interface AssetLoanStatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
    analysis: {
        label: 'Em Análise',
        bgColor: 'bg-slate-100 dark:bg-slate-700',
        textColor: 'text-slate-700 dark:text-slate-200',
        icon: 'schedule',
    },
    pending: {
        label: 'Pendente',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        icon: 'handshake',
    },
    closed: {
        label: 'Encerrado',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        icon: 'check_circle',
    },
    overdue: {
        label: 'Atrasado',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        icon: 'warning',
    },
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
};

export const AssetLoanStatusBadge: React.FC<AssetLoanStatusBadgeProps> = ({ status, size = 'md' }) => {
    const config = statusConfig[status] || statusConfig.analysis;

    return (
        <span
            className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
        >
            <span className="material-symbols-outlined" style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px' }}>
                {config.icon}
            </span>
            {config.label}
        </span>
    );
};
