import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { dataService } from '../../services/dataService';
import { Loading } from './Loading';

const MONTH_NAMES = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

const getComplianceBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
};

interface MonthData {
    month: number;
    year: number;
    compliance: number;
    position: number;
    totalTeams: number;
    trend: 'up' | 'down' | 'stable';
}

interface GamificationHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: string;
    teamId: string;
}

export const GamificationHistoryModal: React.FC<GamificationHistoryModalProps> = ({
    isOpen,
    onClose,
    departmentId,
    teamId,
}) => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<MonthData[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        loadHistory();
    }, [isOpen, departmentId, teamId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const results: MonthData[] = [];

            for (let i = 0; i < 6; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;

                const teamRanking = await dataService.getTeamRanking(departmentId, year, month);
                const myTeam = teamRanking.find(t => t.teamId === teamId);

                if (myTeam) {
                    results.push({
                        month,
                        year,
                        compliance: myTeam.avgComplianceScore,
                        position: myTeam.position,
                        totalTeams: teamRanking.length,
                        trend: myTeam.trend,
                    });
                }
            }

            setHistory(results.reverse());
        } catch (error) {
            console.error('Error loading gamification history:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxCompliance = history.length > 0 ? Math.max(...history.map(h => h.compliance), 100) : 100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historico da Equipe" maxWidth="md">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loading size="md" />
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-3">history</span>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum dado encontrado nos ultimos 6 meses</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={`${item.month}-${item.year}`} className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {MONTH_NAMES[item.month - 1]} {item.year}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}>
                                        #{item.position}/{item.totalTeams}
                                    </span>
                                    <span className={`text-sm font-black ${getComplianceColor(item.compliance)}`}>
                                        {item.compliance.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${getComplianceBg(item.compliance)}`}
                                    style={{ width: `${(item.compliance / maxCompliance) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};
