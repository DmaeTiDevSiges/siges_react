import type { DailyScheduleTeam } from './dailyScheduleService';

const byLeaderName = (a: DailyScheduleTeam, b: DailyScheduleTeam) =>
    a.leaderName.localeCompare(b.leaderName, 'pt-BR', { sensitivity: 'base' })
    || a.code.localeCompare(b.code, 'pt-BR', { sensitivity: 'base' });

/**
 * Ordem de exibição das colunas de líderes na programação diária: primeiro quem tem OS
 * programada, depois quem não tem; cada grupo em ordem alfabética pelo nome do líder
 * (desempate pelo código da equipe). Não altera a lista de origem.
 */
export const sortTeamsByScheduledLoad = (
    teams: DailyScheduleTeam[],
    columns: Record<string, unknown[] | undefined>,
): DailyScheduleTeam[] => {
    const hasOrders = (t: DailyScheduleTeam) => (columns[t.id]?.length ?? 0) > 0;
    return [...teams].sort((a, b) => Number(hasOrders(b)) - Number(hasOrders(a)) || byLeaderName(a, b));
};
