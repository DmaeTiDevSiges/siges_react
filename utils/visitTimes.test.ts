import { canEditVisitTimes, validateVisitTimes } from './visitTimes';

const visit = (over: Record<string, unknown> = {}) =>
    ({ ovStatusId: 2, approvedAt: null, isFiled: false, ...over }) as never;

describe('canEditVisitTimes', () => {
    const base = { isAdminSuper: true, visit: visit(), isOnline: true };

    it('permite admin super online em visita encerrada não aprovada', () => {
        expect(canEditVisitTimes(base)).toBe(true);
    });
    it('permite em visita aberta', () => {
        expect(canEditVisitTimes({ ...base, visit: visit({ ovStatusId: 1 }) })).toBe(true);
    });
    it('nega quem não é admin super', () => {
        expect(canEditVisitTimes({ ...base, isAdminSuper: false })).toBe(false);
        expect(canEditVisitTimes({ ...base, isAdminSuper: undefined })).toBe(false);
    });
    it('nega offline', () => {
        expect(canEditVisitTimes({ ...base, isOnline: false })).toBe(false);
    });
    it('nega visita aprovada', () => {
        expect(canEditVisitTimes({ ...base, visit: visit({ approvedAt: '2026-11-10T12:00:00' }) })).toBe(false);
    });
    it('nega visita arquivada', () => {
        expect(canEditVisitTimes({ ...base, visit: visit({ isFiled: true }) })).toBe(false);
    });
    it('nega visita fora dos status aberta/encerrada', () => {
        expect(canEditVisitTimes({ ...base, visit: visit({ ovStatusId: 3 }) })).toBe(false);
    });
});

describe('validateVisitTimes', () => {
    const now = '2026-11-19T12:00';
    const ok = { startedAt: '2026-11-10T09:00', endedAt: '2026-11-10T11:00', isClosed: true, nowInput: now };

    it('devolve null no caso válido', () => {
        expect(validateVisitTimes(ok)).toBeNull();
    });
    it('exige o início', () => {
        expect(validateVisitTimes({ ...ok, startedAt: '' })).toBe('Informe a data/hora de início');
    });
    it('exige o fim na visita encerrada', () => {
        expect(validateVisitTimes({ ...ok, endedAt: '' })).toBe('Informe a data/hora de fim');
        expect(validateVisitTimes({ ...ok, endedAt: null })).toBe('Informe a data/hora de fim');
    });
    it('visita aberta ignora o fim', () => {
        expect(validateVisitTimes({ ...ok, isClosed: false, endedAt: null })).toBeNull();
    });
    it('recusa fim anterior ao início', () => {
        expect(validateVisitTimes({ ...ok, endedAt: '2026-11-10T08:59' })).toBe('O fim não pode ser anterior ao início');
    });
    it('aceita fim igual ao início', () => {
        expect(validateVisitTimes({ ...ok, endedAt: '2026-11-10T09:00' })).toBeNull();
    });
    it('recusa início ou fim no futuro', () => {
        expect(validateVisitTimes({ ...ok, startedAt: '2026-11-19T12:01', endedAt: '2026-11-19T12:30' }))
            .toBe('Não é permitido informar data/hora futura');
        expect(validateVisitTimes({ ...ok, endedAt: '2026-11-19T12:01' }))
            .toBe('Não é permitido informar data/hora futura');
    });
});
