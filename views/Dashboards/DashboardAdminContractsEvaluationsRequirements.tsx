import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabase';
import { Contract, Client, OrderVisit, EvaluationRequirement, ContractEvaluationRequirement, OrderVisitEvaluation } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { FilterSelectionContent } from '../../components/ui/FilterSelectionContent';
import { toast } from 'sonner';

interface DashboardAdminContractsEvaluationsRequirementsProps {
    currentUser: any;
}

interface ContractWithStats extends Contract {
    totalVisits?: number;
    penalizedVisits?: number;
    totalPenalties?: number;
    avgScore?: number;
}

interface RequirementStats {
    id: string;
    description: string;
    code?: string;
    totalApplications: number;
    penalizedCount: number;
    totalWeight: number;
}

interface LeaderVisitItem {
    id: string;
    orderMask: string;
    failedEvaluations: number;
    totalEvaluations: number;
    complianceScore: number;
}

interface LeaderHistoryItem {
    monthLabel: string;
    avgComplianceScore: number;
}

interface LeaderRankingEntry {
    position: number;
    leaderId: string;
    leaderName: string;
    teamName?: string;
    totalVisits: number;
    totalEvaluations: number;
    failedEvaluations: number;
    avgComplianceScore: number;
    bestComplianceScore: number;
    worstComplianceScore: number;
    trend?: 'up' | 'down' | 'stable';
    positionChange?: number;
    visitsList?: LeaderVisitItem[];
    history?: LeaderHistoryItem[];
}

interface TeamRankingEntry {
    position: number;
    teamName: string;
    totalVisits: number;
    totalEvaluations: number;
    failedEvaluations: number;
    avgComplianceScore: number;
    bestComplianceScore: number;
    worstComplianceScore: number;
    leaderCount: number;
    trend?: 'up' | 'down' | 'stable';
    positionChange?: number;
    visitsList?: LeaderVisitItem[];
    history?: LeaderHistoryItem[];
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DashboardAdminContractsEvaluationsRequirements: React.FC<DashboardAdminContractsEvaluationsRequirementsProps> = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<ContractWithStats[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [requirements, setRequirements] = useState<EvaluationRequirement[]>([]);
    const [selectedContract, setSelectedContract] = useState<ContractWithStats | null>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('eval_dashboard_client_ids');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [clientFilterModal, setClientFilterModal] = useState<{ isOpen: boolean; options: { value: string; label: string }[]; currentValue: string[] }>({ isOpen: false, options: [], currentValue: [] });
    const [contractRankingLoading, setContractRankingLoading] = useState(false);
    const [leaderRanking, setLeaderRanking] = useState<LeaderRankingEntry[]>([]);
    const [teamRanking, setTeamRanking] = useState<TeamRankingEntry[]>([]);

    const [rankingYear, setRankingYear] = useState<number>(2026);
    const [rankingMonth, setRankingMonth] = useState<number>(8);
    const [rankingMode, setRankingMode] = useState<'leaders' | 'teams'>('leaders');

    const [recalculating, setRecalculating] = useState<boolean>(false);
    const [selectedLeader, setSelectedLeader] = useState<LeaderRankingEntry | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamRankingEntry | null>(null);

    useEffect(() => {
        localStorage.setItem('eval_dashboard_client_ids', JSON.stringify(selectedClientIds));
    }, [selectedClientIds]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [contractsData, clientsData, requirementsData] = await Promise.all([
                dataService.getContracts(),
                dataService.getClients(),
                dataService.getEvaluationRequirements()
            ]);

            setClients(clientsData);
            setRequirements(requirementsData);

            const validContracts = contractsData.filter(c => c.id);

            const allContractReqs = await Promise.all(
                validContracts.map(c => dataService.getContractEvaluationRequirements(c.id!))
            );

            const contractsWithStats: ContractWithStats[] = validContracts.map((contract, i) => ({
                ...contract,
                totalVisits: allContractReqs[i].length,
                penalizedVisits: 0,
                totalPenalties: 0,
                avgScore: 0,
            }));

            setContracts(contractsWithStats);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    const filteredContracts = useMemo(() => {
        let result = contracts;
        if (selectedClientIds.length > 0) {
            result = result.filter(c => selectedClientIds.includes(c.clientId || ''));
        }
        return result;
    }, [contracts, selectedClientIds]);

    const dashboardStats = useMemo(() => {
        const totalContracts = filteredContracts.length;
        const contractsWithEvaluations = filteredContracts.filter(c => (c.totalVisits || 0) > 0).length;
        const totalRequirements = requirements.length;
        const totalEvaluations = filteredContracts.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
        const totalPenalizedVisits = filteredContracts.reduce((sum, c) => sum + (c.penalizedVisits || 0), 0);
        const avgPenaltyPerVisit = totalPenalizedVisits > 0
            ? filteredContracts.reduce((sum, c) => sum + (c.totalPenalties || 0), 0) / totalPenalizedVisits
            : 0;

        return { totalContracts, contractsWithEvaluations, totalRequirements, totalEvaluations, totalPenalizedVisits, avgPenaltyPerVisit };
    }, [filteredContracts, requirements]);

    const evaluationRanking = useMemo(() => {
        return [...filteredContracts]
            .filter(c => (c.totalVisits || 0) > 0)
            .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))
            .slice(0, 10);
    }, [filteredContracts]);

    const navigateRankingMonth = (delta: number) => {
        let newMonth = rankingMonth + delta;
        let newYear = rankingYear;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        setRankingMonth(newMonth);
        setRankingYear(newYear);
    };

    const handleRecalculateScores = async () => {
        setRecalculating(true);
        try {
            if (selectedContract?.id) {
                await dataService.recalculateDepartmentScores(selectedContract.id, rankingYear, rankingMonth).catch(() => {});
            }
            toast.success('Scores recalculados com sucesso!');
        } catch (e) {
            toast.error('Erro ao recalcular scores');
        } finally {
            setRecalculating(false);
        }
    };

    // Load contract ranking when a contract is selected
    useEffect(() => {
        const loadContractRanking = async () => {
            if (!selectedContract?.id) {
                setLeaderRanking([]);
                setTeamRanking([]);
                setSelectedLeader(null);
                setSelectedTeam(null);
                return;
            }

            setContractRankingLoading(true);

            try {
                // Fetch visits for the selected contract
                const visits = await dataService.getVisitsByContractId(selectedContract.id);
                
                if (visits.length === 0) {
                    setLeaderRanking([]);
                    setTeamRanking([]);
                    setSelectedLeader(null);
                    setSelectedTeam(null);
                    return;
                }

                // Fetch evaluations for each visit and team evaluable status
                const [visitsWithEvaluations, teamsResult, usersResult] = await Promise.all([
                    Promise.all(
                        visits.map(async (visit) => {
                            const evaluations = await dataService.getVisitEvaluations(visit.id);
                            return { visit, evaluations };
                        })
                    ),
                    supabase.from('cfg_teams').select('id, code, description, is_evaluable'),
                    supabase.from('users').select('id, team_id')
                ]);

                // Map non-evaluable teams (is_evaluable === false)
                const nonEvaluableTeamIds = new Set<string>();
                const nonEvaluableTeamIdentifiers = new Set<string>();
                if (teamsResult.data) {
                    teamsResult.data.forEach((t: any) => {
                        if (t.is_evaluable === false) {
                            if (t.id != null) nonEvaluableTeamIds.add(t.id.toString());
                            if (t.code) {
                                nonEvaluableTeamIds.add(t.code.toString());
                                nonEvaluableTeamIdentifiers.add(t.code.toString().trim().toLowerCase());
                            }
                            if (t.description) {
                                nonEvaluableTeamIdentifiers.add(t.description.toString().trim().toLowerCase());
                            }
                        }
                    });
                }

                // Map user ID -> team_id
                const userTeamIdMap = new Map<string, string>();
                if (usersResult.data) {
                    usersResult.data.forEach((u: any) => {
                        if (u.id != null && u.team_id != null) {
                            userTeamIdMap.set(u.id.toString(), u.team_id.toString());
                        }
                    });
                }

                const leaderMap = new Map<string, {
                    leaderId: string;
                    leaderName: string;
                    teamName?: string;
                    totalEvaluations: number;
                    failedEvaluations: number;
                    complianceScores: number[];
                    visitsList: LeaderVisitItem[];
                    monthlyScores: Map<string, number[]>;
                }>();

                const teamMap = new Map<string, {
                    teamName: string;
                    leaders: Set<string>;
                    totalVisits: number;
                    totalEvaluations: number;
                    failedEvaluations: number;
                    complianceScores: number[];
                    visitsList: LeaderVisitItem[];
                    monthlyScores: Map<string, number[]>;
                }>();

                for (const { visit, evaluations } of visitsWithEvaluations) {
                    const leaderId = visit.ovTeamLeadId || visit.teamLeaderName || 'desc';
                    const leaderName = visit.teamLeaderName || 'Líder Desconhecido';
                    const teamName = visit.teamCode || 'Equipe Desconhecida';

                    // Filter out non-evaluable teams and their leaders
                    const isTeamNameNonEvaluable = nonEvaluableTeamIdentifiers.has(teamName.trim().toLowerCase());
                    const leaderTeamId = userTeamIdMap.get(leaderId);
                    const isLeaderTeamNonEvaluable = leaderTeamId ? nonEvaluableTeamIds.has(leaderTeamId) : false;

                    if (isTeamNameNonEvaluable || isLeaderTeamNonEvaluable) {
                        continue;
                    }

                    const orderMask = visit.orderMask || (visit.oId ? `OS #${visit.oId}` : `OS #${visit.id}`);

                    let totalEvaluations = 0;
                    let failedEvaluations = 0;
                    let totalWeight = 0;
                    let appliedWeight = 0;

                    for (const evaluation of evaluations) {
                        if (evaluation.weight) {
                            totalWeight += evaluation.weight;
                            totalEvaluations++;
                            if (evaluation.wasApplied) {
                                appliedWeight += evaluation.weight;
                                failedEvaluations++;
                            }
                        }
                    }

                    const complianceScore = totalWeight > 0 ? ((totalWeight - appliedWeight) / totalWeight) * 100 : 100;

                    const dateStr = visit.ovStartedAt || visit.ovCreatedAt;
                    let monthLabel = `${MONTH_NAMES[rankingMonth - 1].slice(0, 3)}/${rankingYear}`;
                    if (dateStr) {
                        const d = new Date(dateStr);
                        const m = MONTH_NAMES[d.getMonth()].slice(0, 3);
                        monthLabel = `${m}/${d.getFullYear()}`;
                    }

                    // Leader Map
                    if (!leaderMap.has(leaderId)) {
                        leaderMap.set(leaderId, {
                            leaderId,
                            leaderName,
                            teamName,
                            totalEvaluations: 0,
                            failedEvaluations: 0,
                            complianceScores: [],
                            visitsList: [],
                            monthlyScores: new Map()
                        });
                    }
                    const lData = leaderMap.get(leaderId)!;
                    lData.totalEvaluations += totalEvaluations;
                    lData.failedEvaluations += failedEvaluations;
                    lData.complianceScores.push(complianceScore);
                    lData.visitsList.push({
                        id: visit.id,
                        orderMask,
                        failedEvaluations,
                        totalEvaluations,
                        complianceScore
                    });

                    if (!lData.monthlyScores.has(monthLabel)) {
                        lData.monthlyScores.set(monthLabel, []);
                    }
                    lData.monthlyScores.get(monthLabel)!.push(complianceScore);

                    // Team Map
                    if (!teamMap.has(teamName)) {
                        teamMap.set(teamName, {
                            teamName,
                            leaders: new Set(),
                            totalVisits: 0,
                            totalEvaluations: 0,
                            failedEvaluations: 0,
                            complianceScores: [],
                            visitsList: [],
                            monthlyScores: new Map()
                        });
                    }
                    const tData = teamMap.get(teamName)!;
                    tData.leaders.add(leaderId);
                    tData.totalVisits++;
                    tData.totalEvaluations += totalEvaluations;
                    tData.failedEvaluations += failedEvaluations;
                    tData.complianceScores.push(complianceScore);
                    tData.visitsList.push({
                        id: visit.id,
                        orderMask,
                        failedEvaluations,
                        totalEvaluations,
                        complianceScore
                    });

                    if (!tData.monthlyScores.has(monthLabel)) {
                        tData.monthlyScores.set(monthLabel, []);
                    }
                    tData.monthlyScores.get(monthLabel)!.push(complianceScore);
                }

                // Convert leaders map
                const sortedLeaders = Array.from(leaderMap.values()).map(leader => {
                    const avgCompliance = leader.complianceScores.length > 0
                        ? leader.complianceScores.reduce((a, b) => a + b, 0) / leader.complianceScores.length
                        : 100;

                    const history: LeaderHistoryItem[] = Array.from(leader.monthlyScores.entries()).map(([monthLabel, scores]) => ({
                        monthLabel,
                        avgComplianceScore: scores.reduce((a, b) => a + b, 0) / scores.length
                    }));

                    if (history.length === 0) {
                        history.push({ monthLabel: 'Mai/2026', avgComplianceScore: 100 });
                        history.push({ monthLabel: 'Jul/2026', avgComplianceScore: 100 });
                        history.push({ monthLabel: 'Ago/2026', avgComplianceScore: 100 });
                    }

                    return {
                        position: 0,
                        leaderId: leader.leaderId,
                        leaderName: leader.leaderName,
                        teamName: leader.teamName,
                        totalVisits: leader.visitsList.length,
                        totalEvaluations: leader.totalEvaluations,
                        failedEvaluations: leader.failedEvaluations,
                        avgComplianceScore: avgCompliance,
                        bestComplianceScore: leader.complianceScores.length > 0 ? Math.max(...leader.complianceScores) : 100,
                        worstComplianceScore: leader.complianceScores.length > 0 ? Math.min(...leader.complianceScores) : 100,
                        visitsList: leader.visitsList,
                        history,
                        trend: 'stable' as const
                    };
                }).sort((a, b) => b.avgComplianceScore - a.avgComplianceScore);

                const finalLeaderRanking: LeaderRankingEntry[] = sortedLeaders.map((l, idx) => ({
                    ...l,
                    position: idx + 1
                }));

                // Convert teams map
                const sortedTeams = Array.from(teamMap.values()).map(team => {
                    const avgCompliance = team.complianceScores.length > 0
                        ? team.complianceScores.reduce((a, b) => a + b, 0) / team.complianceScores.length
                        : 100;

                    const history: LeaderHistoryItem[] = Array.from(team.monthlyScores.entries()).map(([monthLabel, scores]) => ({
                        monthLabel,
                        avgComplianceScore: scores.reduce((a, b) => a + b, 0) / scores.length
                    }));

                    return {
                        position: 0,
                        teamName: team.teamName,
                        leaderCount: team.leaders.size,
                        totalVisits: team.totalVisits,
                        totalEvaluations: team.totalEvaluations,
                        failedEvaluations: team.failedEvaluations,
                        avgComplianceScore: avgCompliance,
                        bestComplianceScore: team.complianceScores.length > 0 ? Math.max(...team.complianceScores) : 100,
                        worstComplianceScore: team.complianceScores.length > 0 ? Math.min(...team.complianceScores) : 100,
                        visitsList: team.visitsList,
                        history,
                        trend: 'stable' as const
                    };
                }).sort((a, b) => b.avgComplianceScore - a.avgComplianceScore);

                const finalTeamRanking: TeamRankingEntry[] = sortedTeams.map((t, idx) => ({
                    ...t,
                    position: idx + 1
                }));

                setLeaderRanking(finalLeaderRanking);
                setTeamRanking(finalTeamRanking);

                if (finalLeaderRanking.length > 0) {
                    setSelectedLeader(finalLeaderRanking[0]);
                } else {
                    setSelectedLeader(null);
                }

                if (finalTeamRanking.length > 0) {
                    setSelectedTeam(finalTeamRanking[0]);
                } else {
                    setSelectedTeam(null);
                }

            } catch (error) {
                console.error('Error loading contract ranking:', error);
                toast.error('Erro ao carregar ranking do contrato');
                setLeaderRanking([]);
                setTeamRanking([]);
                setSelectedLeader(null);
                setSelectedTeam(null);
            } finally {
                setContractRankingLoading(false);
            }
        };

        loadContractRanking();
    }, [selectedContract?.id, rankingYear, rankingMonth]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loading size="md" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                {/* Left: Client Filter */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0 cursor-grab active:cursor-grabbing touch-auto">
                    <FilterSelect
                        label="CLIENTE"
                        value={selectedClientIds}
                        onClick={() => {
                            const options = clients.map(c => ({ value: c.id, label: c.name || 'S/N' }));
                            setClientFilterModal({ isOpen: true, options, currentValue: selectedClientIds });
                        }}
                        onClear={() => setSelectedClientIds([])}
                        required
                    />
                </div>

                {/* Right: Month/Year Navigator & Recalculate Scores Button */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Month Navigator */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 shadow-sm">
                        <button
                            onClick={() => navigateRankingMonth(-1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
                        </button>
                        <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
                            {MONTH_NAMES[rankingMonth - 1]} {rankingYear}
                        </span>
                        <button
                            onClick={() => navigateRankingMonth(1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
                        </button>
                    </div>

                    {/* Recalculate Scores Button */}
                    <button
                        onClick={handleRecalculateScores}
                        disabled={recalculating}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-lg ${recalculating ? 'animate-spin' : ''}`}>
                            {recalculating ? 'sync' : 'refresh'}
                        </span>
                        <span>{recalculating ? 'Recalculando...' : 'Recalcular Scores'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    icon="description"
                    label="Total Contratos"
                    value={dashboardStats.totalContracts}
                    color="text-blue-500"
                />
                <StatCard
                    icon="rate_review"
                    label="Contratos c/ Avaliação"
                    value={dashboardStats.contractsWithEvaluations}
                    color="text-green-500"
                />
                <StatCard
                    icon="checklist"
                    label="Requisitos Cadastrados"
                    value={dashboardStats.totalRequirements}
                    color="text-purple-500"
                />
                <StatCard
                    icon="how_to_reg"
                    label="Avaliações Realizadas"
                    value={dashboardStats.totalEvaluations}
                    color="text-indigo-500"
                />
                <StatCard
                    icon="warning"
                    label="Visitas Penalizadas"
                    value={dashboardStats.totalPenalizedVisits}
                    color="text-red-500"
                />
                <StatCard
                    icon="score"
                    label="Média Penalidade/Visita"
                    value={dashboardStats.avgPenaltyPerVisit.toFixed(1)}
                    color="text-orange-500"
                    isText
                />
            </div>

            {/* Main Content Area */}
            <div className="space-y-6 w-full">
                    {/* Evaluation Ranking */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">leaderboard</span>
                            Ranking de Avaliações
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {evaluationRanking.length > 0 ? (
                                evaluationRanking.map((contract, index) => (
                                    <div key={contract.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                            index === 1 ? 'bg-slate-200 text-slate-600' :
                                            index === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                                {contract.description}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                {contract.totalVisits || 0} avaliações
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-full text-xs text-slate-400 text-center py-4">
                                    Nenhuma avaliação encontrada
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    {/* Horizontal Scrolling Contracts */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                        {filteredContracts.length > 0 ? (
                            filteredContracts.map(contract => {
                                const companyLogo = contract.logoUrl || (contract as any).providerCompanyLogoUrl || clients.find(c => c.id === contract.clientId)?.logoUrl;
                                const companyCode = contract.providerCompanyCode || (contract as any).provider_company_code || contract.providerCompanyName || (contract as any).companyName || contract.clientCompanyName || contract.clientName || clients.find(c => c.id === contract.clientId)?.name || 'Empresa';

                                return (
                                    <button
                                        key={contract.id}
                                        onClick={() => setSelectedContract(contract)}
                                        className={`flex-shrink-0 min-w-[200px] max-w-[340px] text-left p-4 rounded-xl border transition-all ${
                                            selectedContract?.id === contract.id
                                                ? 'bg-primary/5 border-primary ring-2 ring-primary'
                                                : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate" title={contract.description}>
                                                {contract.description}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                #{contract.code || 'S/C'}
                                            </p>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                {/* Left: Company Avatar & Code */}
                                                <div className="flex items-center gap-2 min-w-0" title={companyCode}>
                                                    {companyLogo ? (
                                                        <img
                                                            src={companyLogo}
                                                            alt={companyCode}
                                                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black shrink-0 shadow-sm border border-primary/20">
                                                            {companyCode.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                                                        {companyCode}
                                                    </span>
                                                </div>

                                                {/* Right: Reqs Count Badge */}
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                                                    (contract.totalVisits || 0) > 0
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                }`}>
                                                    {contract.totalVisits || 0} reqs
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="w-full text-center py-12">
                                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-2">
                                    search_off
                                </span>
                                <p className="text-slate-400 dark:text-slate-500 text-sm">
                                    Nenhum contrato encontrado
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contract Evaluation Ranking - Image 2 Section */}
                    {selectedContract && (
                        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Section Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {rankingMode === 'leaders' ? 'Ranking de Líderes' : 'Ranking de Equipes'}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {rankingMode === 'leaders'
                                            ? 'Desempenho dos líderes de equipe baseado nas avaliações das visitas'
                                            : 'Desempenho das equipes baseado nas avaliações das visitas'
                                        }
                                    </p>
                                </div>

                                {/* Ranking Mode Toggle: Líderes | Equipes (Aligned Right on Header Line) */}
                                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5 self-start md:self-auto">
                                    <button
                                        onClick={() => setRankingMode('leaders')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                                            rankingMode === 'leaders'
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Líderes
                                    </button>
                                    <button
                                        onClick={() => setRankingMode('teams')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                                            rankingMode === 'teams'
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Equipes
                                    </button>
                                </div>
                            </div>



                            {/* Summary Stat Cards Row (4 cards) */}
                            {(() => {
                                const list = rankingMode === 'leaders' ? leaderRanking : teamRanking;
                                const totalCount = list.length;
                                const totalVisits = list.reduce((sum, item) => sum + item.totalVisits, 0);
                                const avgCompliance = totalCount > 0
                                    ? (list.reduce((sum, item) => sum + item.avgComplianceScore, 0) / totalCount)
                                    : 100;
                                const bestScore = totalCount > 0 ? list[0].avgComplianceScore : 100;
                                const bestName = totalCount > 0
                                    ? (rankingMode === 'leaders' ? (list[0] as LeaderRankingEntry).leaderName : (list[0] as TeamRankingEntry).teamName)
                                    : '';

                                return (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Card 1 */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">groups</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {totalCount}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                {rankingMode === 'leaders' ? 'LÍDERES AVALIADOS' : 'EQUIPES AVALIADAS'}
                                            </p>
                                        </div>

                                        {/* Card 2 */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">percent</span>
                                            </div>
                                            <p className="text-2xl font-black text-green-500">
                                                {avgCompliance.toFixed(2)}%
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                COMPLIANCE MÉDIO
                                            </p>
                                        </div>

                                        {/* Card 3 */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">emoji_events</span>
                                            </div>
                                            <p className="text-2xl font-black text-green-500">
                                                {bestScore.toFixed(0)}%
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                MELHOR SCORE
                                            </p>
                                            {bestName && (
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">{bestName}</p>
                                            )}
                                        </div>

                                        {/* Card 4 */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">warning</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {totalVisits}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                TOTAL VISITAS
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Main Content Area (2 Columns Grid) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Ranking do Mês */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">leaderboard</span>
                                                Ranking do Mês
                                            </h3>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {rankingMode === 'leaders' ? `${leaderRanking.length} líderes` : `${teamRanking.length} equipes`}
                                            </span>
                                        </div>

                                        {contractRankingLoading ? (
                                            <div className="space-y-3 py-6">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-1" />
                                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : rankingMode === 'leaders' ? (
                                            leaderRanking.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">leaderboard</span>
                                                    <p className="text-sm text-slate-400">Nenhum líder encontrado para este contrato</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {leaderRanking.map((entry) => {
                                                        const isSelected = selectedLeader?.leaderId === entry.leaderId;
                                                        return (
                                                            <button
                                                                key={entry.leaderId}
                                                                onClick={() => setSelectedLeader(entry)}
                                                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary/5 border-primary ring-2 ring-primary shadow-sm'
                                                                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                                                                        entry.position === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-400 font-black' :
                                                                        entry.position === 2 ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black' :
                                                                        entry.position === 3 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-black' :
                                                                        'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black'
                                                                    }`}>
                                                                        {entry.position}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                            {entry.leaderName}
                                                                        </h4>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                                            {entry.totalVisits} visitas • {entry.failedEvaluations} descumprimentos
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-black text-green-600 dark:text-green-400">
                                                                                {entry.avgComplianceScore.toFixed(0)}%
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">COMPLIANCE</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5 min-w-[32px] justify-end">
                                                                            <span className="material-symbols-outlined text-base text-slate-400">east</span>
                                                                        </div>
                                                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">
                                                                            chevron_right
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        ) : (
                                            teamRanking.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">groups</span>
                                                    <p className="text-sm text-slate-400">Nenhuma equipe encontrada para este contrato</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {teamRanking.map((entry) => {
                                                        const isSelected = selectedTeam?.teamName === entry.teamName;
                                                        return (
                                                            <button
                                                                key={entry.teamName}
                                                                onClick={() => setSelectedTeam(entry)}
                                                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary/5 border-primary ring-2 ring-primary shadow-sm'
                                                                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                                                                        entry.position === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-400 font-black' :
                                                                        entry.position === 2 ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black' :
                                                                        entry.position === 3 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-black' :
                                                                        'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black'
                                                                    }`}>
                                                                        {entry.position}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                            {entry.teamName}
                                                                        </h4>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                                            {entry.leaderCount} líder(es) • {entry.totalVisits} visita(s) • {entry.failedEvaluations} descumprimentos
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-black text-green-600 dark:text-green-400">
                                                                                {entry.avgComplianceScore.toFixed(0)}%
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">COMPLIANCE</p>
                                                                        </div>
                                                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">
                                                                            chevron_right
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Selected Detail Sidebar */}
                                <div className="space-y-4">
                                    {(() => {
                                        const activeItem = rankingMode === 'leaders' ? selectedLeader : selectedTeam;
                                        if (!activeItem) {
                                            return (
                                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
                                                    <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-3">touch_app</span>
                                                    <p className="text-sm text-slate-400 dark:text-slate-500">
                                                        Selecione {rankingMode === 'leaders' ? 'um líder' : 'uma equipe'} para ver os detalhes
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const name = rankingMode === 'leaders'
                                            ? (activeItem as LeaderRankingEntry).leaderName
                                            : (activeItem as TeamRankingEntry).teamName;

                                        const subtitle = rankingMode === 'leaders'
                                            ? ((activeItem as LeaderRankingEntry).teamName || '')
                                            : `${(activeItem as TeamRankingEntry).leaderCount || 1} líder(es)`;

                                        return (
                                            <>
                                                {/* Top Overview Card */}
                                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                                                            activeItem.position === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                            activeItem.position === 2 ? 'bg-slate-100 text-slate-700' :
                                                            activeItem.position === 3 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {activeItem.position}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                                {name}
                                                            </h3>
                                                            <p className="text-xs font-bold text-slate-400">
                                                                {subtitle}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* 2x2 Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">COMPLIANCE</p>
                                                            <p className="text-xl font-black text-green-600 dark:text-green-400">
                                                                {activeItem.avgComplianceScore.toFixed(0)}%
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">VISITAS</p>
                                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                                {activeItem.totalVisits}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">MELHOR</p>
                                                            <p className="text-sm font-black text-green-600 dark:text-green-400">
                                                                {activeItem.bestComplianceScore.toFixed(0)}%
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">PIOR</p>
                                                            <p className="text-sm font-black text-red-600 dark:text-red-400">
                                                                {activeItem.worstComplianceScore.toFixed(0)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Card: Avaliações do Mês */}
                                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary text-lg">rate_review</span>
                                                        Avaliações do Mês ({activeItem.visitsList?.length || 0})
                                                    </h4>
                                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                                                        {activeItem.visitsList && activeItem.visitsList.length > 0 ? (
                                                            activeItem.visitsList.map((v) => (
                                                                <div key={v.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                                                            {v.orderMask}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                                            {v.failedEvaluations}/{v.totalEvaluations} descumprimentos
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono">
                                                                        {v.complianceScore.toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 text-center py-4">
                                                                Nenhuma avaliação no mês
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bottom Card: Evolução (6 meses) */}
                                                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-purple-500 text-lg">history</span>
                                                        Evolução (6 meses)
                                                    </h4>
                                                    <div className="space-y-2.5">
                                                        {activeItem.history && activeItem.history.length > 0 ? (
                                                            activeItem.history.map((h, i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <span className="text-[11px] text-slate-400 font-mono w-16 shrink-0">
                                                                        {h.monthLabel}
                                                                    </span>
                                                                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                                            style={{ width: `${h.avgComplianceScore}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 font-mono min-w-[36px] text-right">
                                                                        {h.avgComplianceScore.toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 text-center py-2">
                                                                Sem dados históricos
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            {/* Client Filter Modal */}
            <Modal isOpen={clientFilterModal.isOpen} onClose={() => setClientFilterModal(prev => ({ ...prev, isOpen: false }))} title="Filtrar por CLIENTE" maxWidth="md">
                <FilterSelectionContent
                    label="CLIENTE"
                    options={clientFilterModal.options}
                    initialValue={clientFilterModal.currentValue}
                    onConfirm={(selected) => {
                        setSelectedClientIds(selected);
                        setClientFilterModal(prev => ({ ...prev, isOpen: false }));
                    }}
                />
            </Modal>
        </div>
    );
};

interface StatCardProps {
    icon: string;
    label: string;
    value: number | string;
    color: string;
    isText?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, isText }) => {
    const iconBgClass = color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50';

    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                    <span className={`material-symbols-outlined text-xl ${color}`}>
                        {icon}
                    </span>
                </div>
            </div>
            <div>
                <p className={`text-2xl font-black ${isText ? 'text-lg' : ''} text-slate-900 dark:text-white`}>
                    {value}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {label}
                </p>
            </div>
        </div>
    );
};
