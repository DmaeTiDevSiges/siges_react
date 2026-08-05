import React from 'react';
import { OrderVisitAssetView } from '../../../types';
import { OrderVisitProcessingButton } from '../OrderVisitProcessingButton';

// Extend the existing type to include the specific 'after_*' fields expected for this view
// This ensures we can use the fields even if they aren't strictly in the global OrderVisitAssetView yet
interface ExtendedOrderVisitAssetView extends OrderVisitAssetView {
    beforeTagDescription?: string;
    beforeTagSubDescription?: string;
    beforeStatusAt?: string;
    beforeStatusColor?: string;
    clientName?: string;
    processingId?: number;
}

interface OrderVisitAssetCardDetailProps {
    asset: ExtendedOrderVisitAssetView;
    onClick?: () => void;
}

export const OrderVisitAssetCardListItem: React.FC<OrderVisitAssetCardDetailProps> = ({ asset, onClick }) => {
    // Format date: 01/06/2024
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    // Fallback values similar to the image
    const statusColor = asset.beforeStatusColor || asset.afterStatusColor || '#22c55e'; // Green-500 fallback
    const statusDate = formatDate(asset.beforeStatusAt);

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative cursor-pointer active:scale-[0.98] transition-all"
        >
            {/* Header: Status Badge and Processing status */}
            <div className="flex justify-between items-start mb-3">
                <div
                    className="rounded-2xl px-4 py-2 flex flex-col items-start min-w-[110px] relative"
                    style={{ backgroundColor: statusColor }}
                >
                    <div className="flex items-center justify-between w-full gap-3 mb-1">
                        <span className="text-white font-black text-lg leading-none">
                            {asset.code || 'CODE'}
                        </span>
                        {asset.isMoved && (
                            <div className="flex items-center gap-1 bg-white/25 text-white px-2 py-0.5 rounded-lg shadow-2xs" title="Ativo Movimentado">
                                <span className="material-symbols-outlined text-xs font-bold">local_shipping</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-[10px] font-bold uppercase">
                        <span>{asset.beforeStatusDescription || 'STATUS'}</span>
                        <span>{statusDate}</span>
                    </div>
                </div>

                {asset.processingId && (
                    <OrderVisitProcessingButton
                        processingId={asset.processingId}
                        size="sm"
                        showLabel={true}
                    />
                )}
            </div>

            {/* Main Description */}
            <div className="mb-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight uppercase line-clamp-2">
                    {asset.description}
                </h3>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
                {/* Unit */}
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        UNIDADE
                    </p>
                    <div className="flex flex-col">
                        {asset.clientName && (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                {asset.clientName}
                            </span>
                        )}
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {asset.beforeUnitDescription || 'Sem Unidade'}
                        </span>
                    </div>
                </div>

                {/* Sector > Position & Location */}
                <div className="flex justify-between items-end">
                    <div className="flex-1 pr-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            SETOR {'>'} POSIÇÃO
                        </p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {asset.beforeTagDescription || 'Sem Setor'}
                            {asset.beforeTagSubDescription ? ` > ${asset.beforeTagSubDescription}` : ''}
                        </p>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            LOCALIZAÇÃO
                        </p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">
                            {asset.location || 'N/I'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rejection Reason */}
            {asset.processingId === 4 && asset.disapprovedNotes && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">
                        MOTIVO DA REJEIÇÃO
                    </p>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                        {asset.disapprovedNotes}
                    </p>
                </div>
            )}
        </div>
    );
};
