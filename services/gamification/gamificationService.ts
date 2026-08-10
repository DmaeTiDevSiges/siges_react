import { supabase } from '../supabase';
import { getPublicImageUrl } from '../imageUtils';
import type { LeaderMonthlyScore, LeaderScoreHistory, LeaderScoreBadge, LeaderRankingEntry, TeamRankingEntry, OrderVisitScore } from '../../types';

const BADGE_DEFINITIONS = {
    PERFECT_MONTH: {
        name: 'Mes Perfeito',
        description: 'Compliance de 100% no mes (zero descumprimentos)',
    },
    TOP_1: {
        name: '1o Lugar',
        description: 'Primeiro lugar no ranking do departamento',
    },
    TOP_3: {
        name: 'Top 3',
        description: 'Entre os 3 primeiros do ranking do departamento',
    },
    STREAK_3: {
        name: 'Sequencia de 3',
        description: '3 meses seguidos com compliance >= 90%',
    },
    IMPROVEMENT: {
        name: 'Melhoria',
        description: 'Melhoria de >= 10% vs mes anterior',
    },
} as const;

export const gamificationService = {

    // -------------------------------------------------------------------------
    // CONSULTAS DE SCORE POR VISITA
    // -------------------------------------------------------------------------

    async getVisitScores(filters?: {
        leaderId?: string;
        departmentId?: string;
        year?: number;
        month?: number;
    }): Promise<OrderVisitScore[]> {
        let query = supabase
            .from('v_order_visit_scores')
            .select('*')
            .order('ov_ended_at', { ascending: false });

        if (filters?.leaderId) query = query.eq('leader_id', filters.leaderId);
        if (filters?.departmentId) query = query.eq('leader_department_id', filters.departmentId);
        if (filters?.year) query = query.eq('score_year', filters.year);
        if (filters?.month) query = query.eq('score_month', filters.month);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching visit scores:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            ovId: row.ov_id?.toString(),
            orderId: row.order_id?.toString(),
            leaderId: row.leader_id?.toString(),
            leaderName: row.leader_name,
            leaderTeamId: row.leader_team_id?.toString(),
            teamName: row.team_name,
            leaderDepartmentId: row.leader_department_id?.toString(),
            departmentName: row.department_name,
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,
            scoreYear: row.score_year,
            scoreMonth: row.score_month,
            totalEvaluations: row.total_evaluations,
            failedEvaluations: row.failed_evaluations,
            penaltyScore: parseFloat(row.penalty_score) || 0,
            maxPossibleScore: parseFloat(row.max_possible_score) || 0,
            complianceScore: parseFloat(row.compliance_score) || 100,
        }));
    },

    // -------------------------------------------------------------------------
    // RANKING DE LIDERES POR DEPARTAMENTO
    // -------------------------------------------------------------------------

    async getLeaderRanking(
        departmentId: string,
        year: number,
        month: number
    ): Promise<LeaderRankingEntry[]> {
        // Busca o ranking com dados do mes atual
        const { data: rankings, error } = await supabase
            .from('v_leader_ranking')
            .select('*')
            .eq('department_id', departmentId)
            .eq('score_year', year)
            .eq('score_month', month)
            .order('ranking_position', { ascending: true });

        if (error) {
            console.error('Error fetching leader ranking:', error);
            return [];
        }

        if (!rankings || rankings.length === 0) return [];

        const leaderIds = rankings.map((r: any) => r.leader_id);

        // Busca badges e avatares em paralelo
        const [badgesResult, usersResult] = await Promise.all([
            supabase
                .from('leader_score_badges')
                .select('*')
                .in('leader_id', leaderIds)
                .eq('score_year', year)
                .eq('score_month', month),
            supabase
                .from('users')
                .select('id, img_file_path, img_file_name')
                .in('id', leaderIds)
        ]);

        // Agrupa badges por leader_id
        const badgesByLeader: Record<string, LeaderScoreBadge[]> = {};
        (badgesResult.data || []).forEach((b: any) => {
            const lid = b.leader_id?.toString();
            if (!badgesByLeader[lid]) badgesByLeader[lid] = [];
            badgesByLeader[lid].push({
                id: b.id?.toString(),
                leaderId: lid,
                badgeCode: b.badge_code,
                badgeName: b.badge_name,
                badgeDescription: b.badge_description,
                scoreYear: b.score_year,
                scoreMonth: b.score_month,
                earnedAt: b.earned_at,
            });
        });

        // Mapeia avatares por leader_id
        const avatarByLeader: Record<string, string> = {};
        (usersResult.data || []).forEach((u: any) => {
            avatarByLeader[u.id?.toString()] = getPublicImageUrl(
                u.img_file_path,
                u.img_file_name || 'noImageUser.png',
                { width: 80, height: 80, resize: 'cover' }
            );
        });

        return rankings.map((r: any) => ({
            position: r.ranking_position || 0,
            leaderId: r.leader_id?.toString(),
            leaderName: r.leader_name,
            departmentId: r.department_id?.toString(),
            departmentName: r.department_name,
            totalVisits: r.total_visits || 0,
            totalEvaluations: r.total_evaluations || 0,
            failedEvaluations: r.failed_evaluations || 0,
            avgComplianceScore: parseFloat(r.avg_compliance_score) || 0,
            bestComplianceScore: parseFloat(r.best_compliance_score) || 0,
            worstComplianceScore: parseFloat(r.worst_compliance_score) || 0,
            trend: (r.trend || 'stable') as 'up' | 'down' | 'stable',
            positionChange: r.position_change || undefined,
            prevMonthCompliance: r.prev_month_compliance ? parseFloat(r.prev_month_compliance) : undefined,
            prevRankingPosition: r.prev_ranking_position || undefined,
            avatarUrl: avatarByLeader[r.leader_id?.toString()],
            badges: badgesByLeader[r.leader_id?.toString()] || [],
        }));
    },

    // -------------------------------------------------------------------------
    // HISTORICO DE SCORES DO LIDER
    // -------------------------------------------------------------------------

    async getLeaderHistory(
        leaderId: string,
        months: number = 12
    ): Promise<LeaderMonthlyScore[]> {
        const { data, error } = await supabase
            .from('leader_monthly_scores')
            .select('*')
            .eq('leader_id', leaderId)
            .order('score_year', { ascending: false })
            .order('score_month', { ascending: false })
            .limit(months);

        if (error) {
            console.error('Error fetching leader history:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id?.toString(),
            leaderId: row.leader_id?.toString(),
            leaderName: row.leader_name,
            departmentId: row.department_id?.toString(),
            departmentName: row.department_name,
            scoreYear: row.score_year,
            scoreMonth: row.score_month,
            totalVisits: row.total_visits || 0,
            totalEvaluations: row.total_evaluations || 0,
            failedEvaluations: row.failed_evaluations || 0,
            totalPenaltyScore: parseFloat(row.total_penalty_score) || 0,
            avgComplianceScore: parseFloat(row.avg_compliance_score) || 0,
            bestComplianceScore: parseFloat(row.best_compliance_score) || 0,
            worstComplianceScore: parseFloat(row.worst_compliance_score) || 0,
            rankingPosition: row.ranking_position,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    // -------------------------------------------------------------------------
    // DETALHE DAS VISITAS DO LIDER NO MES
    // -------------------------------------------------------------------------

    async getLeaderVisitHistory(
        leaderId: string,
        year: number,
        month: number
    ): Promise<LeaderScoreHistory[]> {
        const { data, error } = await supabase
            .from('leader_scores_history')
            .select('*')
            .eq('leader_id', leaderId)
            .eq('score_year', year)
            .eq('score_month', month)
            .order('compliance_score', { ascending: true });

        if (error) {
            console.error('Error fetching leader visit history:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id?.toString(),
            leaderId: row.leader_id?.toString(),
            ovId: row.ov_id?.toString(),
            orderId: row.order_id?.toString(),
            scoreYear: row.score_year,
            scoreMonth: row.score_month,
            totalEvaluations: row.total_evaluations || 0,
            failedEvaluations: row.failed_evaluations || 0,
            penaltyScore: parseFloat(row.penalty_score) || 0,
            maxPossibleScore: parseFloat(row.max_possible_score) || 0,
            complianceScore: parseFloat(row.compliance_score) || 100,
            evaluatedAt: row.evaluated_at,
            createdAt: row.created_at,
        }));
    },

    // -------------------------------------------------------------------------
    // BADGES DO LIDER
    // -------------------------------------------------------------------------

    async getLeaderBadges(leaderId: string): Promise<LeaderScoreBadge[]> {
        const { data, error } = await supabase
            .from('leader_score_badges')
            .select('*')
            .eq('leader_id', leaderId)
            .order('score_year', { ascending: false })
            .order('score_month', { ascending: false });

        if (error) {
            console.error('Error fetching leader badges:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id?.toString(),
            leaderId: row.leader_id?.toString(),
            badgeCode: row.badge_code,
            badgeName: row.badge_name,
            badgeDescription: row.badge_description,
            scoreYear: row.score_year,
            scoreMonth: row.score_month,
            earnedAt: row.earned_at,
        }));
    },

    // -------------------------------------------------------------------------
    // RESUMO DO DEPARTAMENTO
    // -------------------------------------------------------------------------

    async getDepartmentSummary(
        departmentId: string,
        year: number,
        month: number
    ): Promise<{
        totalLeaders: number;
        avgCompliance: number;
        bestScore: number;
        worstScore: number;
        bestLeader?: string;
        worstLeader?: string;
        totalVisits: number;
        totalEvaluations: number;
    }> {
        const { data, error } = await supabase
            .from('leader_monthly_scores')
            .select('*')
            .eq('department_id', departmentId)
            .eq('score_year', year)
            .eq('score_month', month);

        if (error || !data || data.length === 0) {
            return {
                totalLeaders: 0,
                avgCompliance: 0,
                bestScore: 0,
                worstScore: 0,
                totalVisits: 0,
                totalEvaluations: 0,
            };
        }

        const scores = data.map((r: any) => parseFloat(r.avg_compliance_score) || 0);
        const bestIdx = scores.indexOf(Math.max(...scores));
        const worstIdx = scores.indexOf(Math.min(...scores));

        return {
            totalLeaders: data.length,
            avgCompliance: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
            bestScore: Math.max(...scores),
            worstScore: Math.min(...scores),
            bestLeader: data[bestIdx]?.leader_name,
            worstLeader: data[worstIdx]?.leader_name,
            totalVisits: data.reduce((sum: number, r: any) => sum + (r.total_visits || 0), 0),
            totalEvaluations: data.reduce((sum: number, r: any) => sum + (r.total_evaluations || 0), 0),
        };
    },

    // -------------------------------------------------------------------------
    // RECALCULO DE SCORES
    // -------------------------------------------------------------------------

    async recalculateLeaderScore(leaderId: string, year: number, month: number): Promise<boolean> {
        const { error } = await supabase.rpc('recalculate_leader_monthly_score', {
            p_leader_id: leaderId,
            p_year: year,
            p_month: month,
        });

        if (error) {
            console.error('Error recalculating leader score:', error);
            return false;
        }
        return true;
    },

    async recalculateDepartmentScores(departmentId: string, year: number, month: number): Promise<boolean> {
        const { error } = await supabase.rpc('recalculate_department_scores', {
            p_department_id: departmentId,
            p_year: year,
            p_month: month,
        });

        if (error) {
            console.error('Error recalculating department scores:', error);
            return false;
        }
        return true;
    },

    async recalculateAllScores(year: number, month: number): Promise<boolean> {
        const { error } = await supabase.rpc('recalculate_all_scores', {
            p_year: year,
            p_month: month,
        });

        if (error) {
            console.error('Error recalculating all scores:', error);
            return false;
        }
        return true;
    },

    // -------------------------------------------------------------------------
    // BADGES: VERIFICAR E CONCEDER
    // -------------------------------------------------------------------------

    async checkAndGrantBadges(leaderId: string, year: number, month: number): Promise<LeaderScoreBadge[]> {
        const grantedBadges: LeaderScoreBadge[] = [];

        // Buscar score do mes
        const { data: currentScore } = await supabase
            .from('leader_monthly_scores')
            .select('*')
            .eq('leader_id', leaderId)
            .eq('score_year', year)
            .eq('score_month', month)
            .maybeSingle();

        if (!currentScore) return grantedBadges;

        // 1. PERFECT_MONTH: compliance = 100
        if (parseFloat(currentScore.avg_compliance_score) === 100 && currentScore.total_visits > 0) {
            const badge = await this.grantBadge(leaderId, 'PERFECT_MONTH', year, month);
            if (badge) grantedBadges.push(badge);
        }

        // 2. TOP_1: 1o lugar no ranking
        if (currentScore.ranking_position === 1) {
            const badge = await this.grantBadge(leaderId, 'TOP_1', year, month);
            if (badge) grantedBadges.push(badge);
        }

        // 3. TOP_3: entre os 3 primeiros
        if (currentScore.ranking_position !== null && currentScore.ranking_position <= 3 && currentScore.ranking_position > 1) {
            const badge = await this.grantBadge(leaderId, 'TOP_3', year, month);
            if (badge) grantedBadges.push(badge);
        }

        // 4. STREAK_3: 3 meses seguidos com compliance >= 90
        const { data: history } = await supabase
            .from('leader_monthly_scores')
            .select('avg_compliance_score, score_year, score_month')
            .eq('leader_id', leaderId)
            .lte('score_year', year)
            .order('score_year', { ascending: false })
            .order('score_month', { ascending: false })
            .limit(4);

        if (history && history.length >= 3) {
            const last3 = history.slice(0, 3);
            const allAbove90 = last3.every((h: any) => parseFloat(h.avg_compliance_score) >= 90);
            if (allAbove90) {
                const badge = await this.grantBadge(leaderId, 'STREAK_3', year, month);
                if (badge) grantedBadges.push(badge);
            }
        }

        // 5. IMPROVEMENT: melhoria >= 10% vs mes anterior
        if (currentScore.prev_month_compliance || currentScore.prev_month_compliance === 0) {
            const prevScore = parseFloat(currentScore.prev_month_compliance);
            const currScore = parseFloat(currentScore.avg_compliance_score);
            if (prevScore > 0 && ((currScore - prevScore) / prevScore) >= 0.10) {
                const badge = await this.grantBadge(leaderId, 'IMPROVEMENT', year, month);
                if (badge) grantedBadges.push(badge);
            }
        }

        return grantedBadges;
    },

    async grantBadge(leaderId: string, badgeCode: string, year: number, month: number): Promise<LeaderScoreBadge | null> {
        const def = BADGE_DEFINITIONS[badgeCode as keyof typeof BADGE_DEFINITIONS];
        if (!def) return null;

        // Verificar se ja possui este badge no mes
        const { data: existing } = await supabase
            .from('leader_score_badges')
            .select('id')
            .eq('leader_id', leaderId)
            .eq('badge_code', badgeCode)
            .eq('score_year', year)
            .eq('score_month', month)
            .maybeSingle();

        if (existing) return null; // ja concedido

        const { data, error } = await supabase
            .from('leader_score_badges')
            .insert({
                leader_id: leaderId,
                badge_code: badgeCode,
                badge_name: def.name,
                badge_description: def.description,
                score_year: year,
                score_month: month,
            })
            .select()
            .single();

        if (error) {
            console.error('Error granting badge:', error);
            return null;
        }

        return {
            id: data.id?.toString(),
            leaderId: data.leader_id?.toString(),
            badgeCode: data.badge_code,
            badgeName: data.badge_name,
            badgeDescription: data.badge_description,
            scoreYear: data.score_year,
            scoreMonth: data.score_month,
            earnedAt: data.earned_at,
        };
    },

    // -------------------------------------------------------------------------
    // LISTA DE DEPARTAMENTOS COM LIDERES
    // -------------------------------------------------------------------------

    async getDepartmentsWithLeaders(): Promise<{ departmentId: string; departmentName: string; leaderCount: number }[]> {
        const { data, error } = await supabase
            .from('users')
            .select('team_id, cfg_teams!inner(department_id)')
            .eq('is_team_leader', true)
            .eq('status_id', 2);

        if (error) {
            console.error('Error fetching departments with leaders:', error);
            return [];
        }

        const deptIds = [...new Set((data || []).map((row: any) => row.cfg_teams?.department_id).filter(Boolean))];

        if (deptIds.length === 0) return [];

        const { data: deptData } = await supabase
            .from('cfg_departments')
            .select('id, description')
            .in('id', deptIds);

        const deptMap = new Map<string, string>();
        (deptData || []).forEach((d: any) => deptMap.set(d.id.toString(), d.description));

        const map = new Map<string, { departmentId: string; departmentName: string; leaderCount: number }>();
        (data || []).forEach((row: any) => {
            const deptId = row.cfg_teams?.department_id?.toString();
            if (!deptId) return;
            const existing = map.get(deptId);
            if (existing) {
                existing.leaderCount++;
            } else {
                map.set(deptId, { departmentId: deptId, departmentName: deptMap.get(deptId) || '', leaderCount: 1 });
            }
        });

        return Array.from(map.values()).sort((a, b) => a.departmentName.localeCompare(b.departmentName));
    },

    // -------------------------------------------------------------------------
    // RANKING POR EQUIPES
    // -------------------------------------------------------------------------

    async getTeamRanking(
        departmentId: string,
        year: number,
        month: number
    ): Promise<TeamRankingEntry[]> {
        // Busca líderes do departamento com suas equipes
        const { data: leaders, error: leadersError } = await supabase
            .from('cfg_users')
            .select('id, name_full, team_id, cfg_teams(id, description)')
            .eq('cfg_teams.department_id', departmentId)
            .eq('is_leader', true);

        if (leadersError || !leaders || leaders.length === 0) return [];

        // Busca scores dos líderes
        const leaderIds = leaders.map((l: any) => l.id.toString());
        const { data: scores } = await supabase
            .from('leader_monthly_scores')
            .select('*')
            .in('leader_id', leaderIds)
            .eq('score_year', year)
            .eq('score_month', month);

        if (!scores || scores.length === 0) return [];

        // Agrupa por equipe
        const teamMap = new Map<string, {
            teamId: string;
            teamName: string;
            leaders: any[];
            scores: any[];
        }>();

        leaders.forEach((leader: any) => {
            const teamId = leader.team_id?.toString();
            if (!teamId) return;
            const teamName = leader.cfg_teams?.description || 'Sem equipe';
            if (!teamMap.has(teamId)) {
                teamMap.set(teamId, { teamId, teamName, leaders: [], scores: [] });
            }
            const team = teamMap.get(teamId)!;
            team.leaders.push(leader);

            const leaderScore = scores.find((s: any) => s.leader_id?.toString() === leader.id.toString());
            if (leaderScore) {
                team.scores.push(leaderScore);
            }
        });

        // Calcula métricas por equipe
        const teamRanking: TeamRankingEntry[] = [];
        teamMap.forEach((team) => {
            if (team.scores.length === 0) return;

            const complianceScores = team.scores.map((s: any) => parseFloat(s.avg_compliance_score) || 0);
            const avgCompliance = complianceScores.reduce((a: number, b: number) => a + b, 0) / complianceScores.length;
            const bestScore = Math.max(...complianceScores);
            const worstScore = Math.min(...complianceScores);

            const bestIdx = complianceScores.indexOf(bestScore);
            const worstIdx = complianceScores.indexOf(worstScore);

            teamRanking.push({
                position: 0,
                teamId: team.teamId,
                teamName: team.teamName,
                departmentId,
                leaderCount: team.leaders.length,
                totalVisits: team.scores.reduce((sum: number, s: any) => sum + (s.total_visits || 0), 0),
                totalEvaluations: team.scores.reduce((sum: number, s: any) => sum + (s.total_evaluations || 0), 0),
                failedEvaluations: team.scores.reduce((sum: number, s: any) => sum + (s.failed_evaluations || 0), 0),
                avgComplianceScore: Math.round(avgCompliance * 100) / 100,
                bestComplianceScore: bestScore,
                worstComplianceScore: worstScore,
                trend: 'stable',
                bestLeader: team.leaders[bestIdx]?.name_full,
                worstLeader: team.leaders[worstIdx]?.name_full,
            });
        });

        // Ordena por compliance e atribui posições
        teamRanking.sort((a, b) => b.avgComplianceScore - a.avgComplianceScore);
        teamRanking.forEach((entry, idx) => {
            entry.position = idx + 1;
        });

        return teamRanking;
    },

    async getTeamSummary(
        departmentId: string,
        year: number,
        month: number
    ): Promise<{
        totalTeams: number;
        avgCompliance: number;
        bestScore: number;
        worstScore: number;
        bestTeam?: string;
        worstTeam?: string;
        totalVisits: number;
        totalEvaluations: number;
    }> {
        const teamRanking = await this.getTeamRanking(departmentId, year, month);

        if (teamRanking.length === 0) {
            return {
                totalTeams: 0,
                avgCompliance: 0,
                bestScore: 0,
                worstScore: 0,
                totalVisits: 0,
                totalEvaluations: 0,
            };
        }

        const scores = teamRanking.map(t => t.avgComplianceScore);
        const bestTeam = teamRanking.find(t => t.avgComplianceScore === Math.max(...scores));
        const worstTeam = teamRanking.find(t => t.avgComplianceScore === Math.min(...scores));

        return {
            totalTeams: teamRanking.length,
            avgCompliance: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
            bestScore: Math.max(...scores),
            worstScore: Math.min(...scores),
            bestTeam: bestTeam?.teamName,
            worstTeam: worstTeam?.teamName,
            totalVisits: teamRanking.reduce((sum, t) => sum + t.totalVisits, 0),
            totalEvaluations: teamRanking.reduce((sum, t) => sum + t.totalEvaluations, 0),
        };
    },
};
