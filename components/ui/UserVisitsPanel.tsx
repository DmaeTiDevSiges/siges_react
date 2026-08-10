import React, { useState } from 'react';
import { OrderVisitProcessingButton, PROCESSING_STATUSES } from '../ordersVisits/OrderVisitProcessingButton';

interface VisitCardProps {
    processingId: number;
    label: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
}

interface UserVisitsPanelProps {
    rascunhoCount?: number;
    reportadasCount?: number;
    revisadasCount?: number;
    reprovadasCount?: number;
    chatPendentesCount?: number;
    selectedStatus?: string;
    onStatusSelect?: (status: string) => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ processingId, label, count, isSelected, onClick }) => {
    const isChatCard = processingId === -1;

    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-card-dark rounded-[16px] p-4 shadow-sm border-2 transition-all cursor-pointer shrink-0 w-[160px] md:w-full ${isSelected
                ? 'border-primary dark:border-primary'
                : 'border-slate-200 dark:border-slate-700'
                }`}
        >
            <div className="flex flex-col gap-3">
                {/* Label */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {label}
                </p>

                {/* Icon and Count */}
                <div className="flex items-center justify-between">
                    {isChatCard ? (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/40">
                            <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">forum</span>
                        </div>
                    ) : (
                        <OrderVisitProcessingButton
                            processingId={processingId}
                            size="md"
                        />
                    )}

                    {/* Count */}
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {count}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const UserVisitsPanel: React.FC<UserVisitsPanelProps> = ({
    rascunhoCount = 0,
    reportadasCount = 0,
    revisadasCount = 0,
    reprovadasCount = 0,
    chatPendentesCount = 0,
    selectedStatus: externalSelectedStatus,
    onStatusSelect
}) => {
    const [internalSelectedStatus, setInternalSelectedStatus] = useState<string>(externalSelectedStatus || 'rascunho');

    // Sync with external status if it changes
    React.useEffect(() => {
        if (externalSelectedStatus && externalSelectedStatus !== internalSelectedStatus) {
            setInternalSelectedStatus(externalSelectedStatus);
        }
    }, [externalSelectedStatus]);


    const statuses = [
        ...(chatPendentesCount > 0 ? [{
            id: 'chats',
            processingId: -1,
            label: 'Chats Pendentes',
            count: chatPendentesCount
        }] : []),
        {
            id: 'rascunho',
            processingId: PROCESSING_STATUSES.RASCUNHO.id,
            label: PROCESSING_STATUSES.RASCUNHO.label,
            count: rascunhoCount
        },
        {
            id: 'reprovadas',
            processingId: PROCESSING_STATUSES.REPROVADAS.id,
            label: PROCESSING_STATUSES.REPROVADAS.label,
            count: reprovadasCount
        },
        {
            id: 'reportadas',
            processingId: PROCESSING_STATUSES.REPORTADAS.id,
            label: PROCESSING_STATUSES.REPORTADAS.label,
            count: reportadasCount
        },
        {
            id: 'revisadas',
            processingId: PROCESSING_STATUSES.REVISADAS.id,
            label: PROCESSING_STATUSES.REVISADAS.label,
            count: revisadasCount
        }
    ];

    const handleStatusClick = (statusId: string) => {
        setInternalSelectedStatus(statusId);
        if (onStatusSelect) {
            onStatusSelect(statusId);
        }
    };

    return (
        <div className="py-3">
            {/* Horizontal Scroll */}
            <div className="overflow-x-auto no-scrollbar md:overflow-visible">
                <div className="flex md:grid md:grid-cols-5 gap-3 px-4 pb-2">
                    {statuses.map((status) => (
                        <VisitCard
                            key={status.id}
                            processingId={status.processingId}
                            label={status.label}
                            count={status.count}
                            isSelected={internalSelectedStatus === status.id}
                            onClick={() => handleStatusClick(status.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
