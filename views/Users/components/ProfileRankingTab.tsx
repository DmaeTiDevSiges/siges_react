import React from 'react';
import { LeaderMonthlyScore, LeaderScoreBadge } from '../../../types';
import { Loading } from '../../../components/ui/Loading';

interface ProfileRankingTabProps {
    isTeamLeader: boolean;
    loading: boolean;
    history: LeaderMonthlyScore[];
    badges: LeaderScoreBadge[];
}

/** Aba "Ranking" do perfil (JSX movido do ProfileScreen sem alteração de regra). */
export const ProfileRankingTab: React.FC<ProfileRankingTabProps> = ({ isTeamLeader, loading: rankingLoading, history: rankingHistory, badges: rankingBadges }) => (
    <div className="space-y-4">
        {rankingLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
                <Loading />
                <p className="text-[10px] text-center text-slate-400 mt-1 font-bold uppercase tracking-widest">
                    Carregando ranking...
                </p>
            </div>
        ) : isTeamLeader ? (
            <>
                {/* Current Position Card */}
                {rankingHistory.length > 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[20px]">emoji_events</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Posição Atual</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {rankingHistory[0]?.departmentName || 'Departamento'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-primary">
                                {rankingHistory[0]?.rankingPosition || '—'}
                            </span>
                            <span className="text-sm text-slate-400 mb-1">° lugar</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center">
                                <p className="text-lg font-black text-slate-900 dark:text-white">{rankingHistory[0]?.totalVisits || 0}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Visitas</p>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center">
                                <p className="text-lg font-black text-green-600 dark:text-green-400">{rankingHistory[0]?.avgComplianceScore || 0}%</p>
                                <p className="text-[10px] text-slate-400 uppercase">Compliance</p>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center">
                                <p className="text-lg font-black text-red-600 dark:text-red-400">{rankingHistory[0]?.failedEvaluations || 0}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Descumprimentos</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Badges */}
                {rankingBadges.length > 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-yellow-500 text-[20px]">workspace_premium</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Conquistas</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{rankingBadges.length} badge(s) ganho(s)</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {rankingBadges.slice(0, 10).map((badge) => {
                                const BADGE_ICONS: Record<string, { icon: string; color: string }> = {
                                    PERFECT_MONTH: { icon: 'emoji_events', color: 'text-yellow-500' },
                                    TOP_1: { icon: 'workspace_premium', color: 'text-yellow-500' },
                                    TOP_3: { icon: 'military_tech', color: 'text-amber-500' },
                                    STREAK_3: { icon: 'local_fire_department', color: 'text-orange-500' },
                                    IMPROVEMENT: { icon: 'trending_up', color: 'text-green-500' },
                                };
                                const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                const badgeStyle = BADGE_ICONS[badge.badgeCode] || { icon: 'star', color: 'text-slate-400' };
                                return (
                                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <span className={`material-symbols-outlined text-xl ${badgeStyle.color}`}>{badgeStyle.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{badge.badgeName}</p>
                                            <p className="text-[10px] text-slate-400">{MONTH_NAMES[badge.scoreMonth - 1]} {badge.scoreYear}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Monthly History */}
                {rankingHistory.length > 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-500 text-[20px]">history</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Histórico Mensal</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Últimos {rankingHistory.length} meses</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {rankingHistory.map((score) => {
                                const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                return (
                                    <div key={score.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {MONTH_NAMES[score.scoreMonth - 1]}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {MONTH_NAMES[score.scoreMonth - 1]} {score.scoreYear}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {score.totalVisits} visitas · {score.failedEvaluations} descumprimentos
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {score.rankingPosition && (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {score.rankingPosition}º
                                                </span>
                                            )}
                                            <span className={`text-sm font-black px-2 py-1 rounded-lg ${
                                                score.avgComplianceScore >= 90 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                score.avgComplianceScore >= 70 ? 'bg-yellow-50 text-black dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                                {score.avgComplianceScore}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {rankingHistory.length === 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-3xl text-slate-400">leaderboard</span>
                            </div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Sem dados de ranking</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ainda não há dados de avaliação para este líder.</p>
                        </div>
                    </div>
                )}
            </>
        ) : (
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-slate-400">leaderboard</span>
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Somente líderes</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Apenas líderes de equipe possuem dados de ranking.</p>
                </div>
            </div>
        )}
    </div>
);
