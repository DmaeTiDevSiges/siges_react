import React from 'react';

interface GamificationBadgeProps {
    complianceScore: number;
    position: number;
    totalTeams: number;
    trend: 'up' | 'down' | 'stable';
    onClick?: () => void;
}

const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

export const GamificationBadge: React.FC<GamificationBadgeProps> = ({
    complianceScore,
    position,
    totalTeams,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark hover:border-primary dark:hover:border-primary transition-all cursor-pointer group"
            title="Ver ranking da equipe"
        >
            <span className="material-symbols-outlined text-base text-yellow-500">
                workspace_premium
            </span>
            <span className={`text-xs font-bold ${getComplianceColor(complianceScore)}`}>
                {complianceScore.toFixed(0)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                · #{position}/{totalTeams}
            </span>
        </button>
    );
};
