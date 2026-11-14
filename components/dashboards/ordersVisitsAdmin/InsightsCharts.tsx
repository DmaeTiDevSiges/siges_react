import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const InsightsDoughnut: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
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

export const InsightsBar: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
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

export const InsightsTrend: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    if (data.length === 0) return null;

    const width = 300;
    const height = 100;
    const paddingX = 12;
    const paddingY = 22;

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

                <path d={areaPath} fill="url(#trendGradient)" className="transition-all duration-700" />

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

export const InsightsMovementsBar: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
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
