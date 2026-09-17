import React from 'react';
import { AssetLoan } from '../../types';
import { AssetLoanStatusBadge } from './AssetLoanStatusBadge';
import { formatDate } from '../../utils/formatters';

interface AssetLoanCardProps {
    loan: AssetLoan;
    onViewDetails: () => void;
    onStatusChange?: () => void;
}

export const AssetLoanCard: React.FC<AssetLoanCardProps> = ({ loan, onViewDetails, onStatusChange }) => {
    const isOverdue = loan.computedStatus === 'overdue';
    const isActive = loan.status === 'pending';
    const isPending = loan.status === 'analysis';

    return (
        <div
            className={`bg-white dark:bg-card-dark rounded-[12px] border p-4 transition-all hover:shadow-lg cursor-pointer ${
                isOverdue 
                    ? 'border-red-300 dark:border-red-700 border-l-4 border-l-red-500' 
                    : isActive 
                        ? 'border-blue-200 dark:border-blue-800 border-l-4 border-l-blue-500' 
                        : 'border-slate-100 dark:border-slate-800'
            }`}
            onClick={onViewDetails}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 text-xs mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {loan.borrowerName || 'Mutuário não informado'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
                            <span className={`font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                {formatDate(loan.expectedReturnDate)}
                            </span>
                        </div>
                        {loan.actualReturnDate && (
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    {formatDate(loan.actualReturnDate)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <AssetLoanStatusBadge status={loan.computedStatus || loan.status} size="sm" />
                        {(loan.itemsChecklistsDivergentCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">difference</span>
                                {loan.itemsChecklistsDivergentCount}
                            </span>
                        )}
                    </div>

                    {loan.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {loan.notes}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-xl">
                        chevron_right
                    </span>
                </div>
            </div>
        </div>
    );
};
