import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { OrderVisit, User, OrderFilters, OrderVisitTeam } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DashboardOrdersVisitsAdminListItem } from '../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import { Calendar } from '../../components/ui/Calendar';
import { VisitsListPDFButton } from '../../components/reports/VisitsListPDFButton';
import { FilterSelect } from '../../components/ui/FilterSelect';

interface DashboardOrdersVisitsAdminScreenProps {
    currentUser: User;
    onSelectVisit: (visit: OrderVisit) => void;
    currentFilters?: OrderFilters;
    onFiltersChange?: (filters: OrderFilters) => void;
}

interface VisitStats {
    avaliacao: number;
    autorizadas: number;
    agendadas: number;
    execucao: number;
    suspensas: number;
}

// Extend OrderVisit type locally to include filter fields if they are missing in the main type
interface OrderVisitExtended extends OrderVisit {
    systemId?: string;
    systemParentId?: string;
    unitTypeId?: string;
    unitTypeParentId?: string;
    orderObjectId?: string;
    orderTypeId?: string;
    orderTypeSubId?: string;
    contractId?: string;
    planId?: string;
    teamId?: string;
    parentId?: number | null;
    o_plan_description?: string;
    // Extra fields for visits list PDF
    typeCode?: string;
    typeSubCode?: string;
    sectorDescription?: string;
}

// Helper Components

interface StatCardProps {
    icon: string;
    label: string;
    count: number;
    totalValue?: number;
    color: string;
    active?: boolean;
    onClick?: () => void;
    styleColor?: string;
}

// Helper Component for Animated Count
const AnimatedCount: React.FC<{ value: number; active?: boolean; color?: string }> = ({ value, active, color }) => {
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

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, totalValue, color, active, onClick, styleColor }) => {
    // Helper to get translucent background from HEX or tailwind
    const getIconBgStyle = () => {
        if (styleColor) return { backgroundColor: `${styleColor} 1A` }; // 10% opacity
        return undefined;
    };

    const iconBgClass = !styleColor ? (color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50') : '';

    return (
        <div
            onClick={onClick}
            className={`backdrop-blur-sm p-4 rounded-[16px] border shadow-sm transition-all cursor-pointer group flex-1 min-w-[160px] lg:min-w-[180px] shrink-0 ${active
                ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
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
                {totalValue !== undefined && (
                    <span className={`text-base font-black transition-all duration-300 ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`} style={color && !active ? { color } : undefined}>
                        {formatCurrency(totalValue)}
                    </span>
                )}
            </div>
            <div className="flex justify-between items-center">
                <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{label}</p>
                <AnimatedCount value={count} active={active} color={styleColor} />
            </div>
        </div>
    );
};

interface VisitCardProps {
    visit: OrderVisit;
    onClick: () => void;
    formatDate: (date?: string) => string;
    getStatusColor: (statusId: number) => string;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onClick, formatDate, getStatusColor }) => (
    <div
        onClick={onClick}
        className="group relative bg-slate-100/5 dark:bg-slate-800/40 rounded-[16px] p-5 hover:bg-slate-200/10 dark:hover:bg-slate-800/60 transition-all cursor-pointer border border-slate-200 dark:border-white/5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 flex flex-col h-full active:scale-[0.98]"
    >
        {/* Header - Prominent Badge like Order Card */}
        <div className="flex justify-between items-start mb-4">
            <div className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white ${getStatusColor(visit.ovStatusId)}`}>
                <span className="text-[18px] font-black leading-none tracking-tight">{visit.ovMask}</span>
                <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">{visit.statusDescription}</span>
                    <span className="text-[9px] font-black opacity-80">{visit.ovStatusId}</span>
                </div>
            </div>
            {/* Action Icon */}
            <button className="text-slate-400 hover:text-yellow-400 transition-colors shrink-0">
                <span className="material-symbols-outlined">star</span>
            </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
            {visit.clientName && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none truncate">{visit.clientName}</p>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                {visit.unitDescription}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 leading-none truncate">
                {visit.orderMask} • {visit.teamCode || 'Sem equipe'}
            </p>

            {/* Description Box */}
            <div className="relative mb-4 group/desc">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight line-clamp-2 pr-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    {visit.requestedServices || 'Sem descrição'}
                </p>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 group-hover/desc:translate-x-1 transition-transform">chevron_right</span>
            </div>
        </div>

        {/* Footer Info Info Grid */}
        <div className="grid grid-cols-2 gap-y-1 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-0">
                <span className="material-symbols-outlined text-sm shrink-0">person</span>
                <span className="truncate">{visit.teamLeaderName || 'Sem líder'}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">
                {formatDate(visit.ovStartedAt)}
            </div>
        </div>

        {/* Progress Section */}
        <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(var(--color-primary),0.5)]"
                    style={{ width: `${visit.progress || 0}% ` }}
                />
            </div>
            <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">
                {visit.progress || 0}%
            </span>
        </div>

        {/* Bottom Processing Badge */}
        <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="material-symbols-outlined text-xl text-primary">engineering</span>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">
                    {(visit as any).processingDescription || 'PROCESSAMENTO'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    EM ANDAMENTO
                </span>
            </div>
        </div>
    </div>
);


const AppropriationTable: React.FC<{ items: any[] }> = ({ items }) => {
    if (!items.length) {
        return (
            <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-3xl">inbox</span>
                </div>
                <div>
                    <p className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Sem Registros</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-tighter mt-1">Apropriação não disponível para estes filtros</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto no-scrollbar min-w-full">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/50">
                        <th className="px-5 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                        <th className="px-5 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Unid</th>
                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Vlr Unit</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">A/D</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Qtd</th>
                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Vlr Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                    {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-5 py-3.5">
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-primary border border-slate-200 dark:border-slate-700/50">{item.code}</span>
                            </td>
                            <td className="px-5 py-3.5">
                                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white transition-colors line-clamp-1">{item.description}</p>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{item.unit || item.material_unit || '-'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">{formatCurrency(item.value_unit || 0)}</span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className={`text-[10px] font-black ${item.discount < 1 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {item.discount?.toFixed(3) || '1.000'}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px] font-black text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50">
                                    {item.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                                <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{formatCurrency(item.value_total || 0)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Cost Appropriation Section Component
 */
interface AppropriationSectionProps {
    title: string;
    icon: string;
    items: any[];
    isExpanded: boolean;
    onToggle: () => void;
    total: number;
    loading?: boolean;
}

const AppropriationSection: React.FC<AppropriationSectionProps> = ({
    title,
    icon,
    items,
    isExpanded,
    onToggle,
    total,
    loading
}) => {
    return (
        <div className="flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none transition-all duration-300">
            {/* Header Bar - Styled like the 'financialTotals' bar */}
            <div
                onClick={onToggle}
                className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.99] group ${isExpanded ? 'bg-primary/10 dark:bg-primary/20 border-b border-primary/20' : 'bg-transparent'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary'}`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">{title}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Resumo Consolidado</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[9px] font-bold text-primary">{items.length} itens</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    {loading && (
                        <span className="material-symbols-outlined animate-spin text-sm text-primary/50">
                            autorenew
                        </span>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none mb-1">Total {title}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[16px] font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                {formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-primary/10 dark:bg-primary/20 text-primary rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-0 border-t border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/40">
                    <AppropriationTable items={items} />
                </div>
            </div>
        </div>
    );
};

// --- CHART HELPERS (SVG BASED) ---

const InsightsDoughnut: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="relative flex items-center justify-center">
            <svg viewBox="-1 -1 2 2" className="w-32 h-32 -rotate-90 transform group-hover:scale-105 transition-transform duration-500">
                {data.map((slice, i) => {
                    if (total === 0) return null;
                    const percent = slice.value / total;
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += percent;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');
                    return <path key={i} d={pathData} fill={slice.color} className="opacity-80 hover:opacity-100 transition-opacity cursor-help" />;
                })}
                <circle cx="0" cy="0" r="0.75" fill="currentColor" className="text-white dark:text-slate-800" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5">Total</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(total).split(',')[0]}</span>
            </div>
        </div>
    );
};

const InsightsBar: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex flex-col gap-3 w-full">
            {data.slice(0, 5).map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 group/bar">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase truncate pr-4">{item.label}</span>
                        <span className="text-[10px] font-black text-slate-400 font-mono italic">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const InsightsTrend: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    if (data.length === 0) return null;

    // Build SVG points for an Area Chart with internal padding
    const width = 300;
    const height = 100;
    const paddingX = 12; // Prevents labels on extremes from being cut
    const paddingY = 22; // Space for labels above points

    // Calculate internal width available for data
    const chartWidth = width - (paddingX * 2);
    const chartHeight = height - paddingY;

    const stepX = chartWidth / (data.length - 1 || 1);
    const points = data.map((d, i) => `${paddingX + (i * stepX)},${height - (d.value / maxVal) * chartHeight}`).join(' ');

    const areaPath = `M ${paddingX},${height} L ${points} L ${width - paddingX},${height} Z`;
    const linePath = `M ${points}`;

    return (
        <div className="w-full flex flex-col gap-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
                <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Background */}
                <path d={areaPath} fill="url(#trendGradient)" className="transition-all duration-700" />

                {/* Trend Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-primary transition-all duration-700"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {data.map((d, i) => {
                    const x = paddingX + (i * stepX);
                    const y = height - (d.value / maxVal) * chartHeight;

                    return (
                        <g key={i} className="group/point">
                            {/* Value Label with High-Contrast Halo */}
                            <text
                                x={x}
                                y={y - 10}
                                textAnchor="middle"
                                className="text-[10px] font-black fill-slate-900 dark:fill-white select-none pointer-events-none transition-all duration-300 group-hover/point:scale-125"
                                stroke="currentColor"
                                strokeWidth="3"
                                style={{ stroke: 'white', paintOrder: 'stroke', strokeOpacity: 0.9 }}
                            >
                                {d.value}
                            </text>

                            {/* Point */}
                            <circle
                                cx={x}
                                cy={y}
                                r={i === data.length - 1 ? 4.5 : 2.5}
                                className="fill-primary transition-all duration-300 group-hover/point:r-5"
                            />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest pt-1 px-1 border-t border-slate-100 dark:border-slate-800/50">
                <span>{data[0]?.label}</span>
                <span>{data[Math.floor(data.length / 2)]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
            </div>
        </div>
    );
};

const InsightsMovementsBar: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl">moving</span>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sem movimentações</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-2.5 w-full">
            {data.slice(0, 5).map((item, i) => (
                <div key={i} className="flex flex-col gap-1 group/bar">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase truncate pr-2 max-w-[70%]">{item.label}</span>
                        <span className="text-[10px] font-black text-slate-400 font-mono">{item.value} ativo{item.value !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                                width: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: item.color
                            }}
                        />
                    </div>
                </div>
            ))}
            {data.length > 5 && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center pt-1">
                    +{data.length - 5} tipo{data.length - 5 !== 1 ? 's' : ''} adicionais
                </p>
            )}
        </div>
    );
};

export const DashboardOrdersVisitsAdminScreen: React.FC<DashboardOrdersVisitsAdminScreenProps> = ({ currentUser, onSelectVisit, currentFilters, onFiltersChange }) => {
    // Advanced Filters State
    const [advancedFilters, setAdvancedFilters] = useState<OrderFilters>(() => {
        if (currentFilters) return currentFilters;
        try {
            const saved = localStorage.getItem('advancedDashboardFilters');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Sync from Parent (Prop) -> Local State
    useEffect(() => {
        if (currentFilters) {
            setAdvancedFilters(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(currentFilters)) {
                    return currentFilters;
                }
                return prev;
            });
        }
    }, [currentFilters]);

    // Sync from Local State -> Parent (Callback)
    useEffect(() => {
        if (onFiltersChange) {
            onFiltersChange(advancedFilters);
        }
        localStorage.setItem('advancedDashboardFilters', JSON.stringify(advancedFilters));
    }, [advancedFilters, onFiltersChange]);
    const [visits, setVisits] = useState<OrderVisitExtended[]>([]);

    // Date Range Filter State
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const lastMonthRange = useMemo(() => {
        const d = new Date();
        const firstDayOfPrevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const lastDayOfPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        return {
            start: `${firstDayOfPrevMonth.getFullYear()}-${pad(firstDayOfPrevMonth.getMonth() + 1)}-${pad(firstDayOfPrevMonth.getDate())}`,
            end: `${lastDayOfPrevMonth.getFullYear()}-${pad(lastDayOfPrevMonth.getMonth() + 1)}-${pad(lastDayOfPrevMonth.getDate())}`
        };
    }, []);

    const currentMonthRange = useMemo(() => {
        const d = new Date();
        const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        return {
            start: `${firstDayOfMonth.getFullYear()}-${pad(firstDayOfMonth.getMonth() + 1)}-${pad(firstDayOfMonth.getDate())}`,
            end: `${lastDayOfMonth.getFullYear()}-${pad(lastDayOfMonth.getMonth() + 1)}-${pad(lastDayOfMonth.getDate())}`
        };
    }, []);

    // Date Range Filter State with persistence
    // NOTE: Using 'visits_dashboard_date_*' keys (separate from OS dashboard keys)
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const savedStart = localStorage.getItem('visits_dashboard_date_start');
        const savedEnd = localStorage.getItem('visits_dashboard_date_end');
        if (savedStart && savedEnd) {
            return { start: savedStart, end: savedEnd };
        }
        // Default: last 6 months (broad range to show historical data)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const firstDay = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
        return { start: firstDay, end: lastDay };
    });

    // Update persistence when dateRange changes
    useEffect(() => {
        localStorage.setItem('visits_dashboard_date_start', dateRange.start);
        localStorage.setItem('visits_dashboard_date_end', dateRange.end);
    }, [dateRange]);

    // Date Range Modal State
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempDateRange, setTempDateRange] = useState<{ start: string; end: string }>(dateRange);
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end'>('start');

    // All Units Modal State
    const [isAllUnitsModalOpen, setIsAllUnitsModalOpen] = useState(false);

    // Sync temp range when modal opens
    useEffect(() => {
        if (isDateModalOpen) {
            setTempDateRange(dateRange);
        }
    }, [isDateModalOpen, dateRange]);

    // Dynamic Stats and Processing Stages
    const [processingStages, setProcessingStages] = useState<{ id: number, description: string, icon: string, icon_color: string, bg_color: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const initialLoadDone = React.useRef(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visitTeams, setVisitTeams] = useState<Record<string, OrderVisitTeam[]>>({});
    const [appropriationData, setAppropriationData] = useState<{
        services: any[];
        materials: any[];
        vehicles: any[];
        movedAssets: any[];
    }>({
        services: [],
        materials: [],
        vehicles: [],
        movedAssets: []
    });
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        services: false,
        materials: false,
        vehicles: false
    });
    const [isFetchingAppropriation, setIsFetchingAppropriation] = useState(false);

    // Pagination/Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(20);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    // Advanced Filters State (Managed above)
    const [filterOptions, setFilterOptions] = useState({
        systems: [] as any[],
        subSystems: [] as any[],
        unitTypes: [] as any[],
        units: [] as any[],
        orderObjects: [] as any[],
        orderTypes: [] as any[],
        contracts: [] as any[],
        plans: [] as any[],
        teams: [] as any[]
    });
    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);

    // Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        filterKey: keyof OrderFilters;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        filterKey: 'orderTypeId',
        label: '',
        options: [],
        currentValue: []
    });
    const [selectionSearch, setSelectionSearch] = useState('');



    const loadFilterOptions = React.useCallback(async () => {
        try {
            const results = await Promise.allSettled([
                dataService.getSystemsParent(),
                dataService.getUnitTypesParent(),
                dataService.getOrdersObjects(),
                dataService.getOrderTypes(),
                dataService.getPlans(),
                dataService.getManagedContracts(currentUser.id.toString()),
                dataService.getTeams(),
                dataService.getUnits('active')
            ]);

            const getVal = (res: any) => (res.status === 'fulfilled' ? res.value : []);

            setFilterOptions(prev => ({
                ...prev,
                systems: getVal(results[0]),
                unitTypes: getVal(results[1]),
                orderObjects: getVal(results[2]),
                orderTypes: getVal(results[3]),
                plans: getVal(results[4]),
                contracts: getVal(results[5]),
                teams: getVal(results[6]),
                units: getVal(results[7])
            }));
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }, [currentUser.id]);

    const loadData = React.useCallback(async (forceLoading = false) => {
        try {
            if (forceLoading || !initialLoadDone.current) {
                setLoading(true);
            }

            // 2. Load processing stages
            const stages = await dataService.getProcessingConfigurations();
            setProcessingStages(stages);

            // 3. Load all visits from v_orders_visits via dataService
            const data = await dataService.getOrdersVisitsView();

            const mappedVisits: OrderVisitExtended[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                oId: row.o_id?.toString(),
                ovMask: row.ov_mask,
                ovStatusId: row.ov_status_id,
                ovProcessingId: row.ov_processing_id,
                ovCreatedAt: row.ov_created_at,
                ovCreatedUserId: row.ov_created_user_id?.toString(),
                ovTeamLeadId: row.ov_team_leader_id?.toString(),
                ovStartedAt: row.ov_started_at,
                ovEndedAt: row.ov_ended_at,
                unitDescription: row.o_unit_description,
                systemDescription: row.o_system_description,
                clientName: row.o_client_name,
                teamLeaderName: row.ov_team_leader_name_short,
                statusDescription: row.ov_status_description,
                processingDescription: row.ov_processing_description,
                unitId: row.o_unit_id?.toString(),
                orderMask: row.o_mask,
                teamCode: row.o_team_code,
                requestedServices: row.o_requested_services,
                progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
                ovDurationHours: row.ov_duration_hours ? parseFloat(row.ov_duration_hours) : 0,

                // Value fields
                servicesValue: row.ov_services_value ? parseFloat(row.ov_services_value) : 0,
                materialsValue: row.ov_materials_value ? parseFloat(row.ov_materials_value) : 0,
                vehiclesValue: row.ov_vehicles_value ? parseFloat(row.ov_vehicles_value) : 0,
                totalValue: row.ov_total_value ? parseFloat(row.ov_total_value) : 0,

                // Filter fields mapping
                systemId: row.o_system_id?.toString(),
                systemParentId: row.o_system_parent_id?.toString(),
                unitTypeId: row.o_unit_type_id?.toString(),
                unitTypeParentId: row.o_unit_type_parent_id?.toString(),
                orderObjectId: row.o_object_id?.toString(),
                orderTypeId: row.o_type_id?.toString(),
                orderTypeSubId: row.o_type_sub_id?.toString(),
                contractId: row.o_contract_id?.toString(),
                planId: row.o_plan_id?.toString(),
                teamId: row.o_team_id?.toString(),
                companyId: row.o_provider_company_id?.toString(),
                parentId: row.o_parent_id ? Number(row.o_parent_id) : null,
                o_plan_description: row.o_plan_description || row.plan_description,
                priorityId: row.o_priority_id?.toString(),
                priorityCode: row.o_priority_code,
                priorityColor: row.o_priority_color,
                ovAssetsAmount: row.ov_assets_amount,
                ovAssetsReportedAmount: row.ov_assets_reported_amount,
                ovAssetsDraftAmount: row.ov_assets_draft_amount,
                ovAssetsRevisedAmount: row.ov_assets_revised_amount,
                ovAssetsDisapprovedAmount: row.ov_assets_disapproved_amount,
                ovAssetsApprovedNoFiledAmount: row.ov_assets_approved_no_filed_amount,
                ovAssetsApprovedFiledAmount: row.ov_assets_approved_filed_amount,
                // Extra fields for visits list PDF
                typeCode: row.o_type_code || row.type_code,
                typeSubCode: row.o_type_sub_code || row.type_sub_code,
                sectorDescription: row.o_asset_tag_description || row.asset_tag_description || row.o_system_description,
                contractDescription: row.o_contract_description || row.contract_description,
            }));

            setVisits(mappedVisits);

            // 4. Load teams for all visible visits
            loadTeamsForVisits(mappedVisits);
        } catch (error) {
            console.error('Error loading visits:', error);
        } finally {
            setLoading(false);
            initialLoadDone.current = true;
        }
    }, [currentUser.id]); // currentUser is stable usually

    useEffect(() => {
        // Clean up old shared localStorage keys
        localStorage.removeItem('dashboard_admin_date_start');
        localStorage.removeItem('dashboard_admin_date_end');

        loadData(true);
        loadFilterOptions();

         const handleRefresh = () => loadData(true);
         window.addEventListener('refresh_dashboard', handleRefresh);
 
         // Realtime updates
         const orderSub = dataService.subscribeToOrders(() => {
             loadData(false);
         });
         const visitSub = dataService.subscribeToVisits(() => {
             loadData(false);
         });
 
         return () => {
             window.removeEventListener('refresh_dashboard', handleRefresh);
             orderSub.unsubscribe();
             visitSub.unsubscribe();
         };
     }, [loadData, loadFilterOptions]);

    const loadTeamsForVisits = async (visitsToLoad: OrderVisitExtended[]) => {
        try {
            if (!visitsToLoad.length) return;
            const visitIds = visitsToLoad.map(v => v.id);
            const teamResults = await dataService.getOrdersVisitsTeamsBulk(visitIds);
            setVisitTeams(prev => ({ ...prev, ...teamResults }));
        } catch (error) {
            console.error('Error loading visit teams:', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateDisplay = (dateString?: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 1: return 'bg-yellow-500';
            case 2: return 'bg-blue-500';
            case 3: return 'bg-green-500';
            case 4: return 'bg-purple-500';
            case 7: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Filter Logic
    const handleSystemChange = async (systemId: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
            setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, unitTypeParentId: id, unitTypeId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
            setUnitSubTypes(results.flat());
        } else {
            setUnitSubTypes([]);
        }
    };

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const openSelectionModal = (key: keyof OrderFilters, label: string, options: { value: string; label: string }[]) => {
        const value = advancedFilters[key];
        const currentValue = Array.isArray(value)
            ? (value as any[]).map(String)
            : (value !== undefined && value !== null ? [String(value)] : []);
        setSelectionModal({
            isOpen: true,
            filterKey: key,
            label,
            options,
            currentValue
        });
        setSelectionSearch('');
    };

    const handleModalConfirm = (value: string[]) => {
        const key = selectionModal.filterKey;
        const finalValue = value; // Keep purely as string array

        if (key === 'systemParentId') {
            handleSystemChange(finalValue);
        } else if (key === 'unitTypeParentId') {
            handleParentUnitTypeChange(finalValue);
        } else if (key === 'orderTypeId') {
            handleOrderTypeChange(finalValue);
        } else {
            setAdvancedFilters(prev => ({ ...prev, [key]: finalValue }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleDateModalOpen = () => {
        setTempDateRange(dateRange);
        setActiveDateInput('start');
        setIsDateModalOpen(true);
    };

    const handleDateModalApply = () => {
        const start = tempDateRange.start || todayStr;
        const end = tempDateRange.end || todayStr;

        if (start > end) {
            toast.error('A data inicial deve ser menor ou igual à final');
            return;
        }

        setDateRange({ start, end });
        setIsDateModalOpen(false);
    };

    // -------------------------------------------------------------------------
    // REACTIVE FILTERING LOGIC
    // -------------------------------------------------------------------------

    // 1. Base Filter (Search + Advanced Filters) - Used to calculate CARD COUNTS
    const baseFilteredVisits = useMemo(() => {
        return visits.filter(visit => {
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matches = (
                    visit.ovMask?.toLowerCase().includes(query) ||
                    visit.unitDescription?.toLowerCase().includes(query) ||
                    visit.clientName?.toLowerCase().includes(query) ||
                    visit.orderMask?.toLowerCase().includes(query) ||
                    visit.teamLeaderName?.toLowerCase().includes(query)
                );
                if (!matches) return false;
            }

            // Date Range Filter
            if (dateRange.start || dateRange.end) {
                // Use ovStartedAt first, fallback to ovCreatedAt
                const visitDateStr = visit.ovStartedAt || visit.ovCreatedAt;
                if (!visitDateStr) {
                    // Visits with no date at all pass through (e.g., drafts)
                    // to avoid hiding them; they will appear at the top
                    return true;
                }

                const visitDate = new Date(visitDateStr);

                if (dateRange.start) {
                    const [y, m, d] = dateRange.start.split('-').map(Number);
                    const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
                    if (visitDate < startDate) return false;
                }

                if (dateRange.end) {
                    const [y, m, d] = dateRange.end.split('-').map(Number);
                    const endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                    if (visitDate > endDate) return false;
                }
            }

            // Advanced Filters helper
            const checkFilter = (filterKey: keyof OrderFilters, visitKey: keyof OrderVisitExtended) => {
                const filterValue = (advancedFilters as any)[filterKey];
                if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

                const visitValue = (visit as any)[visitKey]?.toString();
                if (!visitValue) return false;

                if (Array.isArray(filterValue)) {
                    return filterValue.map(String).includes(visitValue);
                }
                return String(filterValue) === visitValue;
            };

            if (!checkFilter('systemParentId', 'systemParentId')) return false;
            if (!checkFilter('systemId', 'systemId')) return false;
            if (!checkFilter('unitTypeParentId', 'unitTypeParentId')) return false;
            if (!checkFilter('unitTypeId', 'unitTypeId')) return false;
            if (!checkFilter('unitId', 'unitId')) return false;
            if (!checkFilter('orderObjectId', 'orderObjectId')) return false;
            if (!checkFilter('orderTypeId', 'orderTypeId')) return false;
            if (!checkFilter('orderTypeSubId', 'orderTypeSubId')) return false;
            if (!checkFilter('contractId', 'contractId')) return false;
            if (!checkFilter('orderPlanId', 'planId')) return false;
            if (!checkFilter('orderTeamId', 'teamId')) return false;

            // Global Filter: parent_id > 0 (removed as it was too restrictive for this dashboard)
            // if (!(visit.parentId && visit.parentId > 0)) return false;

            return true;
        });
    }, [visits, searchQuery, advancedFilters, dateRange]);

    // 2. Dynamic Stats - Calculated directly from Base Filter
    const stats = useMemo(() => {
        const newStats: Record<number, { count: number; total: number }> = {};
        processingStages.forEach(stage => {
            const filtered = baseFilteredVisits.filter(v => v.ovProcessingId === stage.id);
            newStats[stage.id] = {
                count: filtered.length,
                total: filtered.reduce((acc, v) => acc + (v.totalValue || 0), 0)
            };
        });
        return newStats;
    }, [baseFilteredVisits, processingStages]);

    // 3. Final Filtered List - Base Filter + Active Card Filter
    const filteredVisits = useMemo(() => {
        return baseFilteredVisits
            .filter(visit => {
                if (activeFilter !== 'all') {
                    if (visit.ovProcessingId !== parseInt(activeFilter)) return false;
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = a.ovStartedAt ? new Date(a.ovStartedAt).getTime() : 0;
                const dateB = b.ovStartedAt ? new Date(b.ovStartedAt).getTime() : 0;
                return dateA - dateB; // Oldest first (Ascending)
            });
    }, [baseFilteredVisits, activeFilter]);

    // 4. Global Financial Totals - Sum of all visits in the filtered list
    const financialTotals = useMemo(() => {
        return {
            services: appropriationData.services.reduce((acc, i) => acc + (i.value_total || 0), 0),
            materials: appropriationData.materials.reduce((acc, i) => acc + (i.value_total || 0), 0),
            vehicles: appropriationData.vehicles.reduce((acc, i) => acc + (i.value_total || 0), 0)
        };
    }, [appropriationData]);

    const totalSumValue = financialTotals.services + financialTotals.materials + financialTotals.vehicles;

    // --- PRE-CALCULATE INSIGHT DATA ---
    const insightData = useMemo(() => {
        // 1. Composition by Plan
        const planMap = new Map();
        filteredVisits.forEach(v => {
            const plan = v.o_plan_description || 'Sem Plano';
            planMap.set(plan, (planMap.get(plan) || 0) + (v.totalValue || 0));
        });

        const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#64748b', '#f43f5e', '#ec4899', '#8b5cf6'];
        const composition = Array.from(planMap.entries())
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length]
            }))
            .sort((a, b) => b.value - a.value);

        const totalComposition = composition.reduce((acc, c) => acc + c.value, 0);

        // 2. Daily Trend (Visits per day)
        const dailyMap = new Map();
        filteredVisits.forEach(v => {
            if (!v.ovStartedAt) return;
            const day = v.ovStartedAt.split('T')[0];
            dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        });
        const trend = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-10) // Last 10 days found
            .map(([day, count]) => ({
                label: day.split('-').slice(1).reverse().join('/'),
                value: count
            }));

        // 3. Top 3 Units by Value
        const unitMap = new Map();
        filteredVisits.forEach(v => {
            const unit = v.unitDescription || 'Sem Unidade';
            unitMap.set(unit, (unitMap.get(unit) || 0) + (v.totalValue || 0));
        });
        const allUnits = Array.from(unitMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

        const topUnits = allUnits.slice(0, 3);

        // 4. Asset Movements by Type
        const movementMap = new Map();
        appropriationData.movedAssets.forEach(a => {
            const type = a.assetTypeDescription || 'N/A';
            movementMap.set(type, (movementMap.get(type) || 0) + 1);
        });
        const movements = Array.from(movementMap.entries())
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { composition, trend, units: topUnits, allUnits, movements, totalComposition };
    }, [financialTotals, filteredVisits, appropriationData.movedAssets]);

    // 4. Visible Slice for Infinite Scroll
    const displayedVisits = useMemo(() => {
        return filteredVisits.slice(0, visibleCount);
    }, [filteredVisits, visibleCount]);

    // Fetch Appropriation Data when filtered visits change
    useEffect(() => {
        if (!loading && filteredVisits.length > 0) {
            fetchAppropriationData();
        } else if (filteredVisits.length === 0) {
            setAppropriationData({ services: [], materials: [], vehicles: [], movedAssets: [] });
        }
    }, [filteredVisits, loading]);

    const fetchAppropriationData = async () => {
        try {
            setIsFetchingAppropriation(true);
            const ovIds = filteredVisits.map(v => v.id);
            if (!ovIds.length) return;

            const [servicesRaw, materialsRaw, vehiclesRaw, movedAssetsRaw] = await Promise.all([
                dataService.getOrdersVisitsServicesMerged(ovIds),
                dataService.getOrdersVisitsMaterialsMerged(ovIds),
                dataService.getOrdersVisitsVehiclesMerged(ovIds),
                dataService.getOrdersVisitsAssetsMovedMerged(ovIds)
            ]);

            // Aggregate helper - Groups by: description, code, unit value, and discount
            const aggregate = (items: any[], codeKey: string, descKey: string) => {
                const map = new Map<string, any>();
                items.forEach(item => {
                    const code = item[codeKey] || 'N/A';
                    const desc = item[descKey] || item.description || 'Sem descrição';
                    const valueUnit = Number(item.value_unit || 0).toFixed(2);
                    const discount = Number(item.discount || 1).toFixed(3);

                    // Group by: code + description + unit value + discount
                    const key = `${code}_${desc}_${valueUnit}_${discount}`;

                    if (map.has(key)) {
                        const existing = map.get(key);
                        existing.amount = (existing.amount || 0) + Number(item.amount || 0);
                        existing.value_total = (existing.value_total || 0) + Number(item.value_total || 0);
                    } else {
                        map.set(key, {
                            ...item,
                            code,
                            description: desc,
                            amount: Number(item.amount || 0),
                            value_total: Number(item.value_total || 0),
                            value_unit: Number(item.value_unit || 0),
                            discount: Number(item.discount || 1)
                        });
                    }
                });
                return Array.from(map.values()).sort((a, b) =>
                    (a.description || '').localeCompare(b.description || '', 'pt-BR')
                );
            };

            setAppropriationData({
                services: aggregate(servicesRaw, 'code', 'description'),
                materials: aggregate(materialsRaw, 'material_code', 'material_description'),
                vehicles: aggregate(vehiclesRaw, 'code', 'vehicle_description'),
                movedAssets: movedAssetsRaw
            });
        } catch (error) {
            console.error('Error fetching appropriation data:', error);
        } finally {
            setIsFetchingAppropriation(false);
        }
    };

    // Reset pagination when filters change
    useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, searchQuery, advancedFilters, dateRange]);

    // Setup Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredVisits.length) {
                    setVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [filteredVisits.length, visibleCount]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white animate-in fade-in duration-500 relative">

                {/* Horizontal Filter Bar */}
                <div className="z-30 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex flex-col p-3 gap-1">
                        {/* Filters Row (Scrollable) */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-1">
                            <FilterSelect
                                label="SISTEMA"
                                value={advancedFilters.systemParentId || []}
                                onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => handleSystemChange([])}
                            />
                            <FilterSelect
                                label="SUB-SISTEMA"
                                value={advancedFilters.systemId || []}
                                onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, systemId: [] }))}
                                disabled={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)}
                            />
                            <FilterSelect
                                label="TIPO UNIDADE"
                                value={advancedFilters.unitTypeParentId || []}
                                onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => handleParentUnitTypeChange([])}
                            />
                            <FilterSelect
                                label="SUB-TIPO UNIDADE"
                                value={advancedFilters.unitTypeId || []}
                                onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, unitTypeId: [] }))}
                                disabled={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)}
                            />
                            <FilterSelect
                                label="UNIDADES"
                                value={advancedFilters.unitId || []}
                                onClick={() => openSelectionModal('unitId', 'UNIDADES', filterOptions.units.map(opt => ({ value: String(opt.id), label: opt.description_full || opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, unitId: [] }))}
                            />
                            <FilterSelect
                                label="FINALIDADE"
                                value={advancedFilters.orderObjectId || []}
                                onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterOptions.orderObjects.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, orderObjectId: [] }))}
                            />
                            <FilterSelect
                                label="TIPO OS"
                                value={advancedFilters.orderTypeId || []}
                                onClick={() => openSelectionModal('orderTypeId', 'TIPO OS', filterOptions.orderTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => handleOrderTypeChange([])}
                            />
                            <FilterSelect
                                label="SUB-TIPO OS"
                                value={advancedFilters.orderTypeSubId || []}
                                onClick={() => openSelectionModal('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, orderTypeSubId: [] }))}
                                disabled={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)}
                            />
                            <FilterSelect
                                label="CONTRATO"
                                value={advancedFilters.contractId || []}
                                onClick={() => openSelectionModal('contractId', 'CONTRATO', filterOptions.contracts.map(opt => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, contractId: [] }))}
                            />
                            <FilterSelect
                                label="PLANO"
                                value={advancedFilters.orderPlanId || []}
                                onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterOptions.plans.map(opt => ({ value: String(opt.id), label: opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, orderPlanId: [] }))}
                            />
                            <FilterSelect
                                label="EQUIPE"
                                value={advancedFilters.orderTeamId || []}
                                onClick={() => openSelectionModal('orderTeamId', 'EQUIPE', filterOptions.teams.map(opt => ({ value: String(opt.id), label: opt.name || opt.description })))}
                                onClear={() => setAdvancedFilters(prev => ({ ...prev, orderTeamId: [] }))}
                            />
                        </div>

                        {/* Action Row (Date Inputs + Buttons) */}
                        <div className="flex items-center justify-between gap-3 pb-1 pt-0 mt-0">
                            {/* Date Range Selector Button - Precise Size */}
                            <div
                                onClick={handleDateModalOpen}
                                className="group w-auto flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 shrink-0 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-400">
                                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none opacity-80" style={{ marginBottom: '-2px' }}>Período</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                                            {formatDateDisplay(dateRange.start)}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                                            {formatDateDisplay(dateRange.end)}
                                        </span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-lg group-hover:text-primary transition-colors shrink-0">edit_calendar</span>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-3">
                                {/* Clear all shortcut */}
                                {(Object.values(advancedFilters).some(v => Array.isArray(v) && v.length > 0)) && (
                                    <button
                                        onClick={() => { setAdvancedFilters({}); setUnitSubTypes([]); setOrderSubTypes([]); }}
                                        className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 group active:scale-95"
                                        title="Limpar todos os filtros"
                                    >
                                        <span className="material-symbols-outlined text-xl group-hover:rotate-[-10deg]">filter_alt_off</span>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Limpar Filtros</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => loadData(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
                                >
                                    <span className="material-symbols-outlined text-xl">filter_list</span>
                                    <span className="text-[13px] uppercase tracking-wide">FILTRAR</span>
                                </button>
                            </div>
                        </div>
                    </div>    {/* Action Row */}

                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                    {/* Stats Cards - Dynamic Fluid Grid/Scroll */}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 mb-2 pt-2 w-full">
                        <StatCard
                            icon="apps"
                            label="Todos"
                            count={baseFilteredVisits.length}
                            totalValue={baseFilteredVisits.reduce((acc, v) => acc + (v.totalValue || 0), 0)}
                            color="text-slate-400"
                            active={activeFilter === 'all'}
                            onClick={() => setActiveFilter('all')}
                        />
                        {processingStages.map(stage => {
                            const isHex = stage.icon_color && stage.icon_color.startsWith('#');
                            return (
                                <StatCard
                                    key={stage.id}
                                    icon={stage.icon || 'circle'}
                                    label={stage.description}
                                    count={stats[stage.id]?.count || 0}
                                    totalValue={stats[stage.id]?.total || 0}
                                    color={!isHex ? stage.icon_color : ''}
                                    styleColor={isHex ? stage.icon_color : undefined}
                                    active={activeFilter === String(stage.id)}
                                    onClick={() => setActiveFilter(String(stage.id))}
                                />
                            );
                        })}
                    </div>

                    {/* --- INSIGHTS SECTION (NEW) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 px-1 py-2 bg-slate-50/50 dark:bg-slate-800/10 rounded-[16px]">
                        {/* Cost Composition Doughnut */}
                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md group">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Distribuição por Plano</h3>
                            </div>
                            <div className="flex flex-col xl:flex-row items-center gap-8">
                                <InsightsDoughnut data={insightData.composition} />
                                <div className="flex flex-col gap-3 w-full">
                                    {insightData.composition.slice(0, 6).map((c, i) => (
                                        <div key={i} className="flex items-center justify-between group/item">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 min-w-[10px] h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{c.label}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">{insightData.totalComposition > 0 ? ((c.value / insightData.totalComposition) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Performance Daily Trend */}
                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Tendência Diária</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Visitas iniciadas nos últimos dias</p>
                            <div className="flex-1 flex items-center">
                                <InsightsTrend data={insightData.trend} />
                            </div>
                        </div>

                        {/* Ranking das Unidades Top 3 */}
                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Maiores Gastos (Unidades)</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Top 3 unidades com maiores gastos</p>
                            <InsightsBar data={insightData.units} />
                            
                            <button 
                                onClick={() => setIsAllUnitsModalOpen(true)}
                                className="mt-auto pt-6 text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center justify-center gap-1 group/btn border-t border-slate-100 dark:border-slate-800/50"
                            >
                                Ver Todos os Gastos
                                <span className="material-symbols-outlined text-[14px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </div>

                        {/* Ativos Movimentados por Tipo */}
                        <div className="flex flex-col bg-white dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">precision_manufacturing</span>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Movimentação por Tipo</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">
                                {insightData.movements.reduce((acc: number, m: any) => acc + m.value, 0)} ativo{insightData.movements.reduce((acc: number, m: any) => acc + m.value, 0) !== 1 ? 's' : ''} movimentados
                            </p>
                            <div className="flex-1">
                                <InsightsMovementsBar data={insightData.movements} />
                            </div>
                        </div>
                    </div>

                    {/* Appropriation Sections */}
                    <div className="flex flex-col gap-4 mb-8 px-1">
                        <AppropriationSection
                            title="Serviços"
                            icon="home_repair_service"
                            items={appropriationData.services}
                            isExpanded={expandedSections.services}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, services: !prev.services }))}
                            total={financialTotals.services}
                            loading={isFetchingAppropriation}
                        />
                        <AppropriationSection
                            title="Materiais"
                            icon="inventory_2"
                            items={appropriationData.materials}
                            isExpanded={expandedSections.materials}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, materials: !prev.materials }))}
                            total={financialTotals.materials}
                            loading={isFetchingAppropriation}
                        />
                        <AppropriationSection
                            title="Transportes"
                            icon="local_shipping"
                            items={appropriationData.vehicles}
                            isExpanded={expandedSections.vehicles}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, vehicles: !prev.vehicles }))}
                            total={financialTotals.vehicles}
                            loading={isFetchingAppropriation}
                        />
                    </div>

                    {/* Visits List */}
                    <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    Visitas
                                </h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-8">
                                    {filteredVisits.length} registros encontrados
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                                {/* Search */}
                                <div className="relative w-full md:w-64">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar visitas..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border-2 cursor-text border-slate-200 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                                    />
                                </div>

                                {/* Detailed Totals - Cost Composition & Total */}
                                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-lg dark:shadow-2xl backdrop-blur-md">
                                    {/* PDF Export Button */}
                                    <VisitsListPDFButton
                                        className="shrink-0"
                                        visits={filteredVisits.map(v => ({
                                            ovMask: v.ovMask,
                                            ovStartedAt: v.ovStartedAt,
                                            ovEndedAt: v.ovEndedAt,
                                            contractDescription: (v as OrderVisitExtended).contractDescription || v.contractDescription,
                                            orderMask: v.orderMask,
                                            typeCode: (v as OrderVisitExtended).typeCode,
                                            typeSubCode: (v as OrderVisitExtended).typeSubCode,
                                            unitDescription: v.unitDescription,
                                            sectorDescription: (v as OrderVisitExtended).sectorDescription,
                                            statusDescription: v.statusDescription,
                                            processingDescription: v.processingDescription,
                                            materialsValue: v.materialsValue,
                                            vehiclesValue: v.vehiclesValue,
                                            servicesValue: v.servicesValue,
                                            totalValue: v.totalValue,
                                        }))}
                                        totalCount={filteredVisits.length}
                                        filename="relatorio-visitas"
                                    />

                                    {/* Composition Stats (Percentages) */}
                                    <div className="hidden md:flex items-center gap-4 px-4 py-1 border-l border-slate-200 dark:border-slate-700/50">
                                        {/* Services % */}
                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Serviços</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.services / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Materials % */}
                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Materiais</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.materials / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Vehicles % */}
                                        <div className="flex flex-col items-center group/item cursor-help relative">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-0.5">Transportes</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                    {totalSumValue > 0 ? ((financialTotals.vehicles / totalSumValue) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Geral */}
                                    <div className="flex flex-col px-4 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm min-w-[140px]">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">TOTAL GERAL</span>
                                            <span className="material-symbols-outlined text-[14px] text-emerald-500">payments</span>
                                        </div>
                                        <span className="text-[15px] font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight leading-none text-right">
                                            {formatCurrency(totalSumValue)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedVisits.map((visit) => (
                            <DashboardOrdersVisitsAdminListItem
                                key={visit.id}
                                visit={visit}
                                teamMembers={visitTeams[visit.id] || []}
                                onClick={() => onSelectVisit(visit)}
                            />
                        ))}
                    </div>

                    {/* Sentinel for Infinite Scroll */}
                    {filteredVisits.length > visibleCount && (
                        <div ref={loadMoreRef} className="py-10 flex justify-center">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 shadow-sm">
                                <span className="material-symbols-outlined animate-spin text-primary">autorenew</span>
                                <span className="text-sm font-bold uppercase tracking-widest">Carregando mais visitas ({filteredVisits.length - visibleCount} restantes)</span>
                            </div>
                        </div>
                    )}

                    {filteredVisits.length === 0 && (
                        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">inbox</span>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma visita encontrada</p>
                            <p className="text-sm opacity-70 mt-1">Tente ajustar os filtros de busca</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Modal for Filters */}
            <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                <div className="flex flex-col gap-4 text-slate-800 dark:text-gray-100">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder={`Pesquisar ${selectionModal.label}...`}
                            value={selectionSearch}
                            onChange={(e) => setSelectionSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
                        {selectionModal.options
                            .filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase()))
                            .map(opt => {
                                const isSelected = selectionModal.currentValue.includes(opt.value);
                                return (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => {
                                                const newVal = isSelected
                                                    ? selectionModal.currentValue.filter(v => v !== opt.value)
                                                    : [...selectionModal.currentValue, opt.value];
                                                setSelectionModal(prev => ({ ...prev, currentValue: newVal }));
                                            }}
                                        />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        {selectionModal.options.filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase())).length === 0 && (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => handleModalConfirm(selectionModal.currentValue)}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm"
                        >
                            Confirmar ({selectionModal.currentValue.length})
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Date Range Selection Modal */}
            <Modal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                title="INFORMAR PERÍODO"
                maxWidth="sm"
                draggable
            >
                <div className="flex flex-col gap-4 px-2 pb-2 -mt-4">
                    {/* Shortcuts */}
                    <div className="flex w-full mb-1 relative">
                        {/* Indicadores visuais de scroll para mobile (fades) */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-linear-to-r from-white dark:from-(--bg-card-dark,#1e293b) to-transparent pointer-events-none z-10 sm:hidden" />
                        <div className="absolute right-0 top-0 bottom-0 w-3 bg-linear-to-l from-white dark:from-(--bg-card-dark,#1e293b) to-transparent pointer-events-none z-10 sm:hidden" />
                        
                        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 w-full justify-start sm:justify-center items-center snap-x snap-mandatory px-2">
                            {(() => {
                                const isLastMonth = tempDateRange.start === lastMonthRange.start && tempDateRange.end === lastMonthRange.end;
                                const isCurrentMonth = tempDateRange.start === currentMonthRange.start && tempDateRange.end === currentMonthRange.end;
                                const isToday = tempDateRange.start === todayStr && tempDateRange.end === todayStr;

                                return (
                                    <>
                                        <button
                                            onClick={() => {
                                                setTempDateRange(lastMonthRange);
                                                setActiveDateInput('start');
                                            }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isLastMonth ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isLastMonth && 'text-primary'}`}>calendar_month</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Mês Passado</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTempDateRange(currentMonthRange);
                                                setActiveDateInput('start');
                                            }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isCurrentMonth ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isCurrentMonth && 'text-primary'}`}>calendar_today</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Mês Atual</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTempDateRange({ start: todayStr, end: todayStr });
                                                setActiveDateInput('start');
                                            }}
                                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all group snap-center ${isToday ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'}`}
                                        >
                                            <span className={`material-symbols-outlined text-sm group-hover:scale-110 transition-transform ${isToday && 'text-primary'}`}>today</span>
                                            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Hoje</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Top Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setActiveDateInput('start')}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${activeDateInput === 'start' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDateInput === 'start' ? 'text-primary' : 'text-slate-400'}`}>Início</span>
                                <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                            </div>
                            <span className={`text-sm font-bold ${tempDateRange.start ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                                {formatDateDisplay(tempDateRange.start) || 'Selecionar'}
                            </span>
                        </div>

                        <div
                            onClick={() => setActiveDateInput('end')}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${activeDateInput === 'end' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDateInput === 'end' ? 'text-primary' : 'text-slate-400'}`}>Fim</span>
                                <span className="material-symbols-outlined text-sm text-slate-400">event</span>
                            </div>
                            <span className={`text-sm font-bold ${tempDateRange.end ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                                {formatDateDisplay(tempDateRange.end) || 'Selecionar'}
                            </span>
                        </div>
                    </div>

                    {/* Calendar Component */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 shadow-sm">
                        <Calendar
                            value={tempDateRange[activeDateInput]}
                            onChange={(date) => {
                                setTempDateRange(prev => ({ ...prev, [activeDateInput]: date }));
                                if (activeDateInput === 'start') {
                                    setActiveDateInput('end');
                                }
                            }}
                            rangeStart={tempDateRange.start}
                            rangeEnd={tempDateRange.end}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handleDateModalApply}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            Aplicar Período
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Modal for All Units Expenses */}
            <Modal
                isOpen={isAllUnitsModalOpen}
                onClose={() => setIsAllUnitsModalOpen(false)}
                title="GASTOS POR UNIDADE"
                maxWidth="lg"
                draggable
            >
                <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                        Listagem completa de gastos acumulados por unidade no período selecionado
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
                            <div className="flex flex-col gap-6">
                                {(() => {
                                    const allUnits = (insightData as any).allUnits || [];
                                    const maxValue = Math.max(...allUnits.map((d: any) => d.value), 1);
                                    
                                    return allUnits.map((item: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-2 group/bar">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono w-6 text-right shrink-0">{i + 1}º</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{item.label}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary font-mono shrink-0">{formatCurrency(item.value)}</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--color-primary),0.3)]"
                                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ));
                                })()}
                          </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {(insightData as any).allUnits?.length || 0} UNIDADES ENCONTRADAS
                        </span>
                        <button
                            onClick={() => setIsAllUnitsModalOpen(false)}
                            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-['Inter']"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};


