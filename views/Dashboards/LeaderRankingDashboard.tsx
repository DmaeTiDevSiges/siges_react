import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { LeaderRankingEntry, TeamRankingEntry, LeaderMonthlyScore, LeaderScoreHistory, LeaderScoreBadge } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { Avatar } from '../../components/ui/Avatar';
import { toast } from 'sonner';

interface LeaderRankingDashboardProps {
    currentUser: any;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const BADGE_ICONS: Record<string, { icon: string; color: string }> = {
    PERFECT_MONTH: { icon: 'emoji_events', color: 'text-yellow-500' },
    TOP_1: { icon: 'workspace_premium', color: 'text-yellow-500' },
    TOP_3: { icon: 'military_tech', color: 'text-amber-500' },
    STREAK_3: { icon: 'local_fire_department', color: 'text-orange-500' },
    IMPROVEMENT: { icon: 'trending_up', color: 'text-green-500' },
};

export const LeaderRankingDashboard: React.FC<LeaderRankingDashboardProps> = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [departments, setDepartments] = useState<{ departmentId: string; departmentName: string; leaderCount: number }[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [rankingMode, setRankingMode] = useState<'leaders' | 'teams'>('leaders');
    const [ranking, setRanking] = useState<LeaderRankingEntry[]>([]);
    const [teamRanking, setTeamRanking] = useState<TeamRankingEntry[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [teamSummary, setTeamSummary] = useState<any>(null);
    const [selectedLeader, setSelectedLeader] = useState<LeaderRankingEntry | null>(null);
    const [leaderHistory, setLeaderHistory] = useState<LeaderMonthlyScore[]>([]);
    const [leaderVisitHistory, setLeaderVisitHistory] = useState<LeaderScoreHistory[]>([]);
    const [leaderBadges, setLeaderBadges] = useState<LeaderScoreBadge[]>([]);

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        if (selectedDept) {
            loadRankingData();
        }
    }, [selectedDept, currentYear, currentMonth, rankingMode]);

    const loadDepartments = async () => {
        try {
            const depts = await dataService.getDepartmentsWithLeaders();
            setDepartments(depts);
            if (depts.length > 0 && !selectedDept) {
                setSelectedDept(depts[0].departmentId);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            toast.error('Erro ao carregar departamentos');
        }
    };

    const loadRankingData = async () => {
        try {
            setLoading(true);

            if (rankingMode === 'leaders') {
                let [rankingData, summaryData] = await Promise.all([
                    dataService.getLeaderRanking(selectedDept, currentYear, currentMonth),
                    dataService.getDepartmentSummary(selectedDept, currentYear, currentMonth),
                ]);

                if (rankingData.length === 0 && summaryData.totalLeaders === 0) {
                    await dataService.recalculateDepartmentScores(selectedDept, currentYear, currentMonth);
                    [rankingData, summaryData] = await Promise.all([
                        dataService.getLeaderRanking(selectedDept, currentYear, currentMonth),
                        dataService.getDepartmentSummary(selectedDept, currentYear, currentMonth),
                    ]);
                }

                setRanking(rankingData);
                setSummary(summaryData);
                setTeamRanking([]);
                setTeamSummary(null);
            } else {
                let [teamRankingData, teamSummaryData] = await Promise.all([
                    dataService.getTeamRanking(selectedDept, currentYear, currentMonth),
                    dataService.getTeamSummary(selectedDept, currentYear, currentMonth),
                ]);

                if (teamRankingData.length === 0 && teamSummaryData.totalTeams === 0) {
                    await dataService.recalculateDepartmentScores(selectedDept, currentYear, currentMonth);
                    [teamRankingData, teamSummaryData] = await Promise.all([
                        dataService.getTeamRanking(selectedDept, currentYear, currentMonth),
                        dataService.getTeamSummary(selectedDept, currentYear, currentMonth),
                    ]);
                }

                setTeamRanking(teamRankingData);
                setTeamSummary(teamSummaryData);
                setRanking([]);
                setSummary(null);
                setSelectedLeader(null);
            }
        } catch (error) {
            console.error('Error loading ranking data:', error);
            toast.error('Erro ao carregar ranking');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        try {
            setRecalculating(true);
            await dataService.recalculateDepartmentScores(selectedDept, currentYear, currentMonth);
            toast.success('Scores recalculados com sucesso!');
            await loadRankingData();
        } catch (error) {
            console.error('Error recalculating:', error);
            toast.error('Erro ao recalcular scores');
        } finally {
            setRecalculating(false);
        }
    };

    const handleLeaderClick = async (entry: LeaderRankingEntry) => {
        setSelectedLeader(entry);
        try {
            const [history, visitHistory, badges] = await Promise.all([
                dataService.getLeaderHistory(entry.leaderId, 6),
                dataService.getLeaderVisitHistory(entry.leaderId, currentYear, currentMonth),
                dataService.getLeaderBadges(entry.leaderId),
            ]);
            setLeaderHistory(history);
            setLeaderVisitHistory(visitHistory);
            setLeaderBadges(badges);
        } catch (error) {
            console.error('Error loading leader details:', error);
        }
    };

    const navigateMonth = (delta: number) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const getComplianceColor = (score: number) => {
        if (score >= 90) return 'text-green-600 dark:text-green-400';
        if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 50) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getComplianceBg = (score: number) => {
        if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
        if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
        if (score >= 50) return 'bg-orange-100 dark:bg-orange-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return { icon: 'trending_up', color: 'text-green-500' };
            case 'down': return { icon: 'trending_down', color: 'text-red-500' };
            default: return { icon: 'trending_flat', color: 'text-slate-400' };
        }
    };

    const getPositionStyle = (position: number) => {
        switch (position) {
            case 1: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-400';
            case 2: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
            case 3: return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
            default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400';
        }
    };

    if (loading && ranking.length === 0 && teamRanking.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loading size="md" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Ranking de Lideres
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Desempenho dos lideres de equipe baseado nas avaliacoes das visitas
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Department Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Departamento:</span>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        {departments.map(dept => (
                            <option key={dept.departmentId} value={dept.departmentId}>
                                {dept.departmentName} ({dept.leaderCount} lideres)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ranking Mode Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setRankingMode('leaders')}
                        className={`px-4 py-2 text-sm font-bold transition-colors ${
                            rankingMode === 'leaders'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        Lideres
                    </button>
                    <button
                        onClick={() => setRankingMode('teams')}
                        className={`px-4 py-2 text-sm font-bold transition-colors ${
                            rankingMode === 'teams'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        Equipes
                    </button>
                </div>

                {/* Month Navigator + Recalculate Button */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_left</span>
                        </button>
                        <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                        </button>
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={handleRecalculate}
                        disabled={recalculating || !selectedDept}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className={`material-symbols-outlined text-lg ${recalculating ? 'animate-spin' : ''}`}>
                            {recalculating ? 'sync' : 'refresh'}
                        </span>
                        {recalculating ? 'Recalculando...' : 'Recalcular Scores'}
                    </button>
                </div>
            </div>

            {/* Summary Cards - Leaders Mode */}
            {rankingMode === 'leaders' && summary && summary.totalLeaders > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard icon="groups" label="Lideres Avaliados" value={summary.totalLeaders} color="text-blue-500" />
                    <SummaryCard icon="percent" label="Compliance Medio" value={`${summary.avgCompliance}%`} color={getComplianceColor(summary.avgCompliance)} isText />
                    <SummaryCard icon="emoji_events" label="Melhor Score" value={`${summary.bestScore}%`} color="text-green-500" subtext={summary.bestLeader} isText />
                    <SummaryCard icon="warning" label="Total Visitas" value={summary.totalVisits} color="text-purple-500" />
                </div>
            )}

            {/* Summary Cards - Teams Mode */}
            {rankingMode === 'teams' && teamSummary && teamSummary.totalTeams > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard icon="groups" label="Equipes" value={teamSummary.totalTeams} color="text-blue-500" />
                    <SummaryCard icon="percent" label="Compliance Medio" value={`${teamSummary.avgCompliance}%`} color={getComplianceColor(teamSummary.avgCompliance)} isText />
                    <SummaryCard icon="emoji_events" label="Melhor Score" value={`${teamSummary.bestScore}%`} color="text-green-500" subtext={teamSummary.bestTeam} isText />
                    <SummaryCard icon="warning" label="Total Visitas" value={teamSummary.totalVisits} color="text-purple-500" />
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">leaderboard</span>
                                Ranking do Mes
                            </h2>
                            <span className="text-xs text-slate-400 font-mono">
                                {rankingMode === 'leaders' ? `${ranking.length} lideres` : `${teamRanking.length} equipes`}
                            </span>
                        </div>

                        {/* Leaders Ranking */}
                        {rankingMode === 'leaders' && (
                            <>
                                {ranking.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    <div className="space-y-2">
                                        {ranking.map((entry) => {
                                            const trend = getTrendIcon(entry.trend);
                                            const hasPositionChanged = entry.positionChange !== undefined && entry.positionChange !== 0;
                                            return (
                                                <button
                                                    key={entry.leaderId}
                                                    onClick={() => handleLeaderClick(entry)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                        selectedLeader?.leaderId === entry.leaderId
                                                            ? 'bg-primary/5 border-primary ring-2 ring-primary'
                                                            : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <Avatar
                                                                src={entry.avatarUrl}
                                                                alt={entry.leaderName}
                                                                size="sm"
                                                                shape="circle"
                                                            />
                                                            {hasPositionChanged && entry.prevRankingPosition && (
                                                                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-800 ${
                                                                    entry.positionChange! > 0 ? 'bg-green-500' : 'bg-red-500'
                                                                }`}>
                                                                    {entry.prevRankingPosition}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{entry.leaderName}</h3>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                {entry.totalVisits} visitas · {entry.failedEvaluations} descumprimentos
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className={`text-sm font-black ${getComplianceColor(entry.avgComplianceScore)}`}>
                                                                    {entry.avgComplianceScore.toFixed(0)}%
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 uppercase">Compliance</p>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <span className={`material-symbols-outlined text-lg ${trend.color}`}>{trend.icon}</span>
                                                                {entry.positionChange && (
                                                                    <span className={`text-[10px] font-bold ${entry.positionChange > 0 ? 'text-green-500' : entry.positionChange < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {entry.positionChange > 0 ? '+' : ''}{entry.positionChange}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Teams Ranking */}
                        {rankingMode === 'teams' && (
                            <>
                                {teamRanking.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    <div className="space-y-2">
                                        {teamRanking.map((entry) => (
                                            <div key={entry.teamId} className="w-full text-left p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${getPositionStyle(entry.position)}`}>
                                                        {entry.position}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{entry.teamName}</h3>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {entry.leaderCount} lideres · {entry.totalVisits} visitas · {entry.failedEvaluations} descumprimentos
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className={`text-sm font-black ${getComplianceColor(entry.avgComplianceScore)}`}>
                                                                {entry.avgComplianceScore.toFixed(0)}%
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 uppercase">Compliance</p>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className={`material-symbols-outlined text-lg ${getTrendIcon(entry.trend).color}`}>
                                                                {getTrendIcon(entry.trend).icon}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="space-y-4">
                    {selectedLeader ? (
                        <>
                            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="relative flex-shrink-0">
                                        <Avatar
                                            src={selectedLeader.avatarUrl}
                                            alt={selectedLeader.leaderName}
                                            size="md"
                                            shape="circle"
                                        />
                                        {selectedLeader.positionChange !== undefined && selectedLeader.positionChange !== 0 && selectedLeader.prevRankingPosition && (
                                            <span className={`absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-card-dark ${
                                                selectedLeader.positionChange > 0 ? 'bg-green-500' : 'bg-red-500'
                                            }`}>
                                                {selectedLeader.prevRankingPosition}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedLeader.leaderName}</h3>
                                        <p className="text-xs text-slate-400">{selectedLeader.departmentName}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Compliance</p>
                                        <p className={`text-xl font-black ${getComplianceColor(selectedLeader.avgComplianceScore)}`}>{selectedLeader.avgComplianceScore}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Visitas</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{selectedLeader.totalVisits}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Melhor</p>
                                        <p className="text-sm font-black text-green-600 dark:text-green-400">{selectedLeader.bestComplianceScore}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pior</p>
                                        <p className="text-sm font-black text-red-600 dark:text-red-400">{selectedLeader.worstComplianceScore}%</p>
                                    </div>
                                </div>
                            </div>

                            {leaderBadges.length > 0 && (
                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-yellow-500 text-lg">emoji_events</span>
                                        Conquistas
                                    </h3>
                                    <div className="space-y-2">
                                        {leaderBadges.map((badge) => {
                                            const badgeStyle = BADGE_ICONS[badge.badgeCode] || { icon: 'star', color: 'text-slate-400' };
                                            return (
                                                <div key={badge.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                                    <span className={`material-symbols-outlined text-xl ${badgeStyle.color}`}>{badgeStyle.icon}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{badge.badgeName}</p>
                                                        <p className="text-[10px] text-slate-400">{MONTH_NAMES[badge.scoreMonth - 1]} {badge.scoreYear}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {leaderVisitHistory.length > 0 && (
                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">rate_review</span>
                                        Avaliacoes do Mes ({leaderVisitHistory.length})
                                    </h3>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {leaderVisitHistory.map((visit) => (
                                            <div key={visit.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-mono text-slate-500">OS #{visit.orderId || '—'}</p>
                                                    <p className="text-[10px] text-slate-400">{visit.failedEvaluations}/{visit.totalEvaluations} descumpridos</p>
                                                </div>
                                                <span className={`text-sm font-black px-2 py-1 rounded-lg ${getComplianceBg(visit.complianceScore)} ${getComplianceColor(visit.complianceScore)}`}>
                                                    {visit.complianceScore}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {leaderHistory.length > 1 && (
                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-500 text-lg">history</span>
                                        Evolucao (6 meses)
                                    </h3>
                                    <div className="space-y-2">
                                        {leaderHistory.slice().reverse().map((h) => (
                                            <div key={h.id} className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 font-mono w-16">
                                                    {MONTH_NAMES[h.scoreMonth - 1].slice(0, 3)}/{h.scoreYear}
                                                </span>
                                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            h.avgComplianceScore >= 90 ? 'bg-green-500' :
                                                            h.avgComplianceScore >= 70 ? 'bg-yellow-500' :
                                                            h.avgComplianceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${h.avgComplianceScore}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold min-w-[40px] text-right ${getComplianceColor(h.avgComplianceScore)}`}>
                                                    {h.avgComplianceScore}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-3">touch_app</span>
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                {rankingMode === 'leaders' ? 'Selecione um lider para ver os detalhes' : 'Selecione uma equipe para ver os detalhes'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC = () => (
    <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-3">leaderboard</span>
        <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum dado de avaliacao disponivel para este periodo</p>
        <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Clique em "Recalcular Scores" para atualizar os dados</p>
    </div>
);

interface SummaryCardProps {
    icon: string;
    label: string;
    value: number | string;
    color: string;
    subtext?: string;
    isText?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color, subtext, isText }) => {
    const iconBgClass = color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50';

    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                    <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
                </div>
            </div>
            <div>
                <p className={`text-2xl font-black ${isText ? 'text-lg' : ''} ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                {subtext && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtext}</p>}
            </div>
        </div>
    );
};
