import React from 'react';

// Processing status configuration
export const PROCESSING_STATUSES = {
    RASCUNHO: {
        id: 1,
        label: 'Rascunho',
        icon: 'edit_note',
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/50',
        shadowColor: 'shadow-[0_0_10px_rgba(100,116,139,0.2)]'
    },
    REPORTADAS: {
        id: 2,
        label: 'Reportada',
        icon: 'assignment_turned_in',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/50',
        shadowColor: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]'
    },
    REVISADAS: {
        id: 3,
        label: 'Revisada',
        icon: 'done_all',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/50',
        shadowColor: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]'
    },
    REPROVADAS: {
        id: 4,
        label: 'Rejeitada',
        icon: 'thumb_down',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/50',
        shadowColor: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]'
    },
    APROVADAS: {
        id: 5,
        label: 'Aprovada',
        icon: 'verified',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/50',
        shadowColor: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]'
    }
} as const;

interface OrderVisitProcessingButtonProps {
    processingId: number;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showLabel?: boolean;
}

export const OrderVisitProcessingButton: React.FC<OrderVisitProcessingButtonProps> = ({
    processingId,
    onClick,
    size = 'md',
    className = '',
    showLabel = false
}) => {
    // Get status configuration
    const status = Object.values(PROCESSING_STATUSES).find(s => s.id === processingId) || PROCESSING_STATUSES.RASCUNHO;

    // Determine if button is interactive
    const isInteractive = !!onClick;

    // Size configurations
    const sizeConfig = {
        sm: {
            container: showLabel ? 'h-8 px-2.5' : 'w-8 h-8',
            icon: 'text-lg',
            border: 'border',
            label: 'text-[10px]'
        },
        md: {
            container: showLabel ? 'h-10 px-3' : 'w-12 h-12',
            icon: 'text-xl',
            border: 'border-2',
            label: 'text-xs'
        },
        lg: {
            container: showLabel ? 'h-12 px-4' : 'w-16 h-16',
            icon: 'text-2xl',
            border: 'border-2',
            label: 'text-sm'
        },
        xl: {
            container: showLabel ? 'h-14 px-5' : 'w-20 h-20',
            icon: 'text-3xl',
            border: 'border-2',
            label: 'text-base'
        }
    };

    const config = sizeConfig[size];

    return (
        <div
            onClick={isInteractive ? onClick : undefined}
            className={`
                ${config.container} rounded-[16px] flex items-center justify-center shrink-0 transition-all gap-1.5
                ${status.bgColor}
                ${isInteractive ? `${config.border} ${status.borderColor} ${status.shadowColor} cursor-pointer hover:scale-105` : 'border-0'}
                ${className}
            `}
            title={status.label}
        >
            <span className={`material-symbols-outlined ${config.icon} ${status.color}`}>
                {status.icon}
            </span>
            {showLabel && (
                <span className={`font-black uppercase tracking-widest ${status.color} ${'label' in config ? (config as any).label : 'text-[10px]'}`}>
                    {status.label}
                </span>
            )}
        </div>
    );
};

// Helper function to get status by ID
export const getProcessingStatus = (processingId: number) => {
    return Object.values(PROCESSING_STATUSES).find(s => s.id === processingId) || PROCESSING_STATUSES.RASCUNHO;
};
