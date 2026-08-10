import React from 'react';

interface CircularGaugeProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    labelSize?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
    percentage,
    size = 48,
    strokeWidth = 4,
    color = 'text-emerald-500',
    labelSize = 'text-[10px]'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${color} transition-all duration-700 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`absolute ${labelSize} font-black ${color} tracking-tighter`}>
                {percentage}%
            </span>
        </div>
    );
};
