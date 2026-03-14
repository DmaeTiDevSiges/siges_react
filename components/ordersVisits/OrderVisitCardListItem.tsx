import React from 'react';
import { OrderVisit } from '../../types';
import { Card } from '../ui/Card';
import { formatDateTime } from '../../utils/formatters';
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
            <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            {visit.ovMask}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {visit.statusDescription}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-none truncate">
                            {visit.unitDescription || 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                        {formatDateTime(visit.ovStartedAt)} - {formatDateTime(visit.ovEndedAt)}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-none">
                                {visit.teamCode || '---'} {visit.teamLeaderName && `| ${visit.teamLeaderName}`}
                            </span>
                        </div>

                        {visit.progress !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <div onClick={(e) => e.stopPropagation()}>
                        <VisitReportPDFButton
                            visitId={visit.id}
                            visitMask={visit.ovMask}
                            compact
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};
