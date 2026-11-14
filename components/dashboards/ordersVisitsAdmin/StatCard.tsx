import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { BatchVisitReportPDFButton } from '../../../components/reports/BatchVisitReportPDFButton';
import { OrderVisitExtended } from './visitTypes';

export interface StatCardProps {
    icon: string;
    label: string;
    count: number;
    totalValue?: number;
    color: string;
    active?: boolean;
    onClick?: () => void;
    styleColor?: string;
    visits?: OrderVisitExtended[];
    /** Busca as visitas do card só no clique do PDF (lista paginada no servidor). */
    loadVisits?: () => Promise<OrderVisitExtended[]>;
}

export const AnimatedCount: React.FC<{ value: number; active?: boolean; color?: string }> = ({ value, active, color }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (value !== displayValue) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    return (
        <span
            className={`text-base font-black transition-all duration-300 ${isAnimating ? 'scale-125 text-primary brightness-150' : 'scale-100'} ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}
            style={!isAnimating && color && !active ? { color } : undefined}
        >
            {displayValue}
        </span>
    );
};

export const StatCard: React.FC<StatCardProps> = ({ icon, label, count, totalValue, color, active, onClick, styleColor, visits, loadVisits }) => {
    const getIconBgStyle = () => {
        if (styleColor) return { backgroundColor: `${styleColor} 1A` };
        return undefined;
    };

    const iconBgClass = !styleColor ? (color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50') : '';

    return (
        <div
            onClick={onClick}
            className={`backdrop-blur-sm p-4 rounded-[16px] border shadow-sm transition-all cursor-pointer group w-max min-w-[160px] lg:min-w-[180px] min-h-[110px] shrink-0 flex flex-col justify-between ${active
                ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start gap-5">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconBgClass}`}
                    style={getIconBgStyle()}
                >
                    <span
                        className={`material-symbols-outlined text-[20px] ${!styleColor ? color : ''}`}
                        style={styleColor ? { color: styleColor } : undefined}
                    >
                        {icon}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {totalValue !== undefined && (
                        <span className={`text-base font-black transition-all duration-300 ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`} style={color && !active ? { color } : undefined}>
                            {formatCurrency(totalValue)}
                        </span>
                    )}
                    {(loadVisits ? count > 0 : !!visits && visits.length > 0) && (
                        <BatchVisitReportPDFButton 
                            visits={visits} 
                            loadVisits={loadVisits}
                            count={loadVisits ? count : undefined}
                            filename={`relatorios-${label.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center gap-5 mt-4">
                <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{label}</p>
                <AnimatedCount value={count} active={active} color={styleColor} />
            </div>
        </div>
    );
};
