import type { OrderVisit } from '../types';

/**
 * Quem pode editar início/fim da visita: apenas isAdminSuper, online, visita
 * aberta (1) ou encerrada (2), sem aprovação e sem arquivamento.
 * A regra definitiva fica no banco (flow_order_visit_update_times_v1).
 */
export const canEditVisitTimes = (params: {
    isAdminSuper?: boolean;
    visit: Pick<OrderVisit, 'ovStatusId' | 'approvedAt' | 'isFiled'>;
    isOnline: boolean;
}): boolean => {
    const { isAdminSuper, visit, isOnline } = params;
    return (
        isAdminSuper === true &&
        isOnline &&
        [1, 2].includes(Number(visit.ovStatusId)) &&
        !visit.approvedAt &&
        !visit.isFiled
    );
};

/**
 * Valida início/fim no formato `YYYY-MM-DDTHH:mm` (datetime-local).
 * `nowInput` vem de `getBrazilDateTimeInputValue()`. Devolve a mensagem ou null.
 */
export const validateVisitTimes = (params: {
    startedAt: string;
    endedAt: string | null;
    isClosed: boolean;
    nowInput: string;
}): string | null => {
    const { startedAt, endedAt, isClosed, nowInput } = params;
    if (!startedAt) return 'Informe a data/hora de início';
    if (isClosed && !endedAt) return 'Informe a data/hora de fim';
    if (startedAt > nowInput || (isClosed && endedAt && endedAt > nowInput)) {
        return 'Não é permitido informar data/hora futura';
    }
    if (isClosed && endedAt && endedAt < startedAt) return 'O fim não pode ser anterior ao início';
    return null;
};

/**
 * Depois de salvar os horários, as telas que guardaram OS, visitas ou o painel do
 * líder em cache (TanStack Query) devem rebuscar — senão mostram o horário antigo.
 */
export const invalidateVisitTimesQueries = (client: { invalidateQueries: (filters: { queryKey: readonly unknown[] }) => unknown }): void => {
    (['orders', 'visits', 'leaderDashboard'] as const).forEach(key => {
        void client.invalidateQueries({ queryKey: [key] });
    });
};
