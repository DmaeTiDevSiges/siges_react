import React from 'react';
import { OrderVisit } from '../../types';
import { Card } from '../ui/Card';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { OrderVisitProcessingButton } from './OrderVisitProcessingButton';
import { VisitReportPDFButton } from '../reports/VisitReportPDFButton';

interface OrderVisitCardListItemProps {
    visit: OrderVisit;
    onClick?: () => void;
}

export const OrderVisitCardListItem: React.FC<OrderVisitCardListItemProps> = ({ visit, onClick }) => {
    return (
        <Card
            id={`visit-item-${visit.id}`}
            onClick={onClick}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:shadow-md transition-shadow cursor-pointer rounded-2xl!"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none block">
                        {visit.ovMask}
                    </span>

                    <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-none truncate">
                            {visit.unitDescription || 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                        {formatDateTime(visit.ovStartedAt)} - {formatDateTime(visit.ovEndedAt)}
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-none">
                            {visit.teamCode || '---'} {visit.teamLeaderName && `| ${visit.teamLeaderName}`}
                        </span>
                    </div>
                </div>

                {/* Right Side: Status, Value+PDF, Progress */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {visit.processingDescription || visit.statusDescription}
                    </span>

                    <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                            <VisitReportPDFButton
                                visitId={visit.id}
                                visitMask={visit.ovMask}
                                variant="action"
                            />
                        </div>
                        {visit.totalValue !== undefined && visit.totalValue > 0 && (
                            <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                {formatCurrency(visit.totalValue)}
                            </span>
                        )}
                    </div>

                    {visit.progress !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${visit.progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white">{visit.progress}%</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
