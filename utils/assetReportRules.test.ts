import {
    buildProgressSpecs, checkReport, hasMaintenancePlan, isMovementComplete, isSameMovementDestination,
    type MovementDestination, type ReportCheckInput,
} from './assetReportRules';
import type { OrderVisitAssetView } from '../types';

const asset = {
    clientId: 'C1', beforeUnitId: 'U1', beforeUnitAssetTagId: 'T1', beforePriorityId: 2, beforeStatusId: 'S1', beforeLocation: 'Sala 3',
} as unknown as OrderVisitAssetView;

const sameDest: MovementDestination = {
    afterClientId: 'C1', afterUnitId: 'U1', afterUnitAssetTagId: 'T1', afterPriorityId: 2, afterStatusId: 'S1', afterLocation: 'Sala 3',
};

describe('isMovementComplete', () => {
    const full = { afterClientId: 'C', afterUnitId: 'U', afterUnitAssetTagId: 'T', afterPriorityId: 1, afterStatusId: 'S' };
    it('completa quando cliente, unidade, setor, prioridade e status estão preenchidos', () => {
        expect(isMovementComplete(full)).toBe(true);
    });
    it.each(['afterClientId', 'afterUnitId', 'afterUnitAssetTagId', 'afterPriorityId', 'afterStatusId'] as const)(
        'incompleta sem %s', key => {
            expect(isMovementComplete({ ...full, [key]: key === 'afterPriorityId' ? undefined : '' })).toBe(false);
        });
    it('prioridade 0 não conta como preenchida (comportamento atual)', () => {
        expect(isMovementComplete({ ...full, afterPriorityId: 0 })).toBe(false);
    });
});

describe('isSameMovementDestination', () => {
    it('igual à origem em todos os campos', () => {
        expect(isSameMovementDestination(asset, sameDest)).toBe(true);
    });
    it.each([
        ['afterClientId', 'C2'], ['afterUnitId', 'U2'], ['afterUnitAssetTagId', 'T2'],
        ['afterPriorityId', 3], ['afterStatusId', 'S2'], ['afterLocation', 'Sala 4'],
    ] as const)('qualquer diferença em %s deixa de ser igual', (key, value) => {
        expect(isSameMovementDestination(asset, { ...sameDest, [key]: value })).toBe(false);
    });
    it('ativo ainda não carregado: só é igual se tudo estiver vazio', () => {
        const empty: MovementDestination = { afterClientId: '', afterUnitId: '', afterUnitAssetTagId: '', afterPriorityId: undefined, afterStatusId: '', afterLocation: '' };
        expect(isSameMovementDestination(null, empty)).toBe(true);
        expect(isSameMovementDestination(null, sameDest)).toBe(false);
    });
});

describe('hasMaintenancePlan', () => {
    it('"" e "0" significam sem plano', () => {
        expect(hasMaintenancePlan('')).toBe(false);
        expect(hasMaintenancePlan('0')).toBe(false);
        expect(hasMaintenancePlan(undefined)).toBe(false);
        expect(hasMaintenancePlan('12')).toBe(true);
    });
});

describe('checkReport', () => {
    const ok: ReportCheckInput = {
        uploadingCount: 0, beforeDone: true, afterDone: true, activitiesCount: 2,
        isMoved: false, movementComplete: false, sameDestination: () => false, verb: 'reportar',
    };

    it('tudo certo', () => {
        expect(checkReport(ok)).toEqual({ ok: true });
    });

    it('fotos em envio: aviso informativo, antes de qualquer outra cobrança', () => {
        const r = checkReport({ ...ok, uploadingCount: 2, beforeDone: false, activitiesCount: 0 });
        expect(r).toMatchObject({ ok: false, problem: 'uploading', level: 'info', message: 'Aguarde o envio das fotos terminar' });
    });

    it('falta condição/foto de antes ou de depois', () => {
        for (const patch of [{ beforeDone: false }, { afterDone: false }]) {
            expect(checkReport({ ...ok, ...patch })).toMatchObject({ ok: false, problem: 'incomplete', level: 'error' });
        }
    });

    it('a mensagem usa o verbo do caminho (reportar x confirmar)', () => {
        expect(checkReport({ ...ok, beforeDone: false, verb: 'reportar' })).toMatchObject({ message: 'Preencha as condições e adicione fotos antes de reportar' });
        expect(checkReport({ ...ok, beforeDone: false, verb: 'confirmar' })).toMatchObject({ message: 'Preencha as condições e adicione fotos antes de confirmar' });
    });

    it('sem nenhuma intervenção', () => {
        expect(checkReport({ ...ok, activitiesCount: 0 })).toMatchObject({
            ok: false, problem: 'no-activity', message: 'É necessário selecionar ao menos uma intervenção realizada',
        });
    });

    it('movido com campos faltando', () => {
        expect(checkReport({ ...ok, isMoved: true, movementComplete: false })).toMatchObject({
            ok: false, problem: 'movement-incomplete', message: 'Preencha todos os campos obrigatórios da movimentação',
        });
    });

    it('movido para o mesmo lugar: pede confirmação (sem toast)', () => {
        expect(checkReport({ ...ok, isMoved: true, movementComplete: true, sameDestination: () => true }))
            .toMatchObject({ ok: false, problem: 'same-destination', message: '' });
    });

    it('movido de verdade e completo passa; destino só é consultado quando preciso', () => {
        const same = jest.fn(() => false);
        expect(checkReport({ ...ok, isMoved: true, movementComplete: true, sameDestination: same })).toEqual({ ok: true });
        expect(same).toHaveBeenCalledTimes(1);
        const never = jest.fn(() => true);
        checkReport({ ...ok, isMoved: false, sameDestination: never });
        checkReport({ ...ok, isMoved: true, movementComplete: false, sameDestination: never });
        expect(never).not.toHaveBeenCalled();
    });
});

describe('buildProgressSpecs', () => {
    const base = { beforeDone: false, afterDone: false, hasPlan: false, maintenanceProgress: 0, activitiesCount: 0, isMoved: false, movementComplete: false };
    const keys = (i: Parameters<typeof buildProgressSpecs>[0]) => buildProgressSpecs(i).map(s => s.key);

    it('mínimo: antes, atividades, depois (nesta ordem)', () => {
        expect(keys(base)).toEqual(['before', 'activities', 'after']);
    });

    it('com plano entra o checklist com o percentual; só conclui em 100%', () => {
        const specs = buildProgressSpecs({ ...base, hasPlan: true, maintenanceProgress: 60 });
        expect(specs.map(s => s.key)).toEqual(['before', 'checklist', 'activities', 'after']);
        expect(specs[1]).toMatchObject({ label: 'Checklist 60%', done: false, section: 'checklist' });
        expect(buildProgressSpecs({ ...base, hasPlan: true, maintenanceProgress: 100 })[1].done).toBe(true);
    });

    it('movimentação só aparece quando movido, antes de "depois"', () => {
        expect(keys({ ...base, isMoved: true })).toEqual(['before', 'activities', 'movement', 'after']);
        expect(keys({ ...base, hasPlan: true, isMoved: true })).toEqual(['before', 'checklist', 'activities', 'movement', 'after']);
    });

    it('marca como feito o que está pronto', () => {
        const specs = buildProgressSpecs({ ...base, beforeDone: true, afterDone: true, activitiesCount: 1, isMoved: true, movementComplete: true });
        expect(specs.every(s => s.done)).toBe(true);
        expect(specs.map(s => s.section)).toEqual(['before', 'activities', 'movement', 'after']);
    });
});
