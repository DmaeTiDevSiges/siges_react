// Situação da OS depois que uma visita é excluída (soft delete).
// A OS não pode ficar na situação que a visita apagada lhe deu: vale a da visita
// encerrada mais recente que sobrou; sem nenhuma, volta a "Autorizada" (3), com a
// data/hora da autorização (vem do log de situações, resolvida por quem chama).

export const ORDER_STATUS_AUTHORIZED = 3;
export const ORDER_STATUS_CANCELED = 7;

/** Situações que uma visita pode ter dado à OS (4, 5, 6 e 8). Fora disso a OS não é tocada. */
const ROLLBACK_FROM = [4, 5, 6, 8];

export interface RemainingVisit {
    id: number | string;
    /** Situação da visita (1 = em andamento, 2 = encerrada). */
    ovStatusId: number | null;
    /** Situação que a visita deu à OS ao encerrar. */
    ovOStatusId: number | null;
    ovOProgress: number | null;
    ovEndedAt: string | null;
}

export interface OrderRollbackPlan {
    statusId: number;
    /** null = usar a data/hora da autorização (log). */
    statusAt: string | null;
    progress: number;
    clearCause: boolean;
}

export function planOrderAfterVisitDeletion(
    currentOrderStatusId: number,
    remainingVisits: RemainingVisit[],
): OrderRollbackPlan | null {
    if (!ROLLBACK_FROM.includes(Number(currentOrderStatusId))) return null;
    // Outra visita ainda aberta: a OS segue como está.
    if (remainingVisits.some(v => Number(v.ovStatusId) === 1 || !v.ovEndedAt)) return null;

    if (remainingVisits.length === 0) {
        return { statusId: ORDER_STATUS_AUTHORIZED, statusAt: null, progress: 0, clearCause: true };
    }

    const latest = [...remainingVisits].sort((a, b) => {
        const byEnd = String(b.ovEndedAt).localeCompare(String(a.ovEndedAt));
        return byEnd !== 0 ? byEnd : Number(b.id) - Number(a.id);
    })[0];
    const target = Number(latest.ovOStatusId);
    if (!target || target === Number(currentOrderStatusId)) return null;
    return {
        statusId: target,
        statusAt: latest.ovEndedAt,
        progress: target === 8 ? 1 : Number(latest.ovOProgress ?? 0),
        clearCause: false,
    };
}
