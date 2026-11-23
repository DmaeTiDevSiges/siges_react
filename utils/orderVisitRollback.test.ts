import { planOrderAfterVisitDeletion, RemainingVisit } from './orderVisitRollback';

const v = (id: number, ovOStatusId: number, ovEndedAt: string, progress = 0.5): RemainingVisit => ({
    id, ovStatusId: 2, ovOStatusId, ovOProgress: progress, ovEndedAt,
});
const v1 = v(1, 6, '2026-11-24T09:00:00');
const v2 = v(2, 6, '2026-11-24T11:00:00');

describe('planOrderAfterVisitDeletion', () => {
    it('apaga a 3ª (concluída): OS vira Suspensa com o encerramento da 2ª', () => {
        expect(planOrderAfterVisitDeletion(8, [v1, v2])).toEqual({
            statusId: 6, statusAt: '2026-11-24T11:00:00', progress: 0.5, clearCause: false,
        });
    });

    it('apaga a 2ª: continua Suspensa e nada muda', () => {
        expect(planOrderAfterVisitDeletion(6, [v1])).toBeNull();
    });

    it('sem visitas: volta a Autorizada, progresso 0 e data do log', () => {
        expect(planOrderAfterVisitDeletion(6, [])).toEqual({
            statusId: 3, statusAt: null, progress: 0, clearCause: true,
        });
        expect(planOrderAfterVisitDeletion(8, [])?.statusId).toBe(3);
    });

    it('visita ainda em andamento: não mexe na OS', () => {
        expect(planOrderAfterVisitDeletion(6, [{ ...v1, ovStatusId: 1, ovEndedAt: null }])).toBeNull();
    });

    it('OS cancelada ou já autorizada não é tocada', () => {
        expect(planOrderAfterVisitDeletion(7, [])).toBeNull();
        expect(planOrderAfterVisitDeletion(3, [])).toBeNull();
    });

    it('sobrou concluída e a OS estava Suspensa: vira Concluída com progresso 1', () => {
        expect(planOrderAfterVisitDeletion(6, [v(9, 8, '2026-11-24T15:00:00', 1)])?.progress).toBe(1);
    });
});
