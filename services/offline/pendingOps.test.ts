import { dependentsOf, friendlyError, groupByVisit, opLabel, OP_LABELS, statusInfo } from './pendingOps';
import type { OutboxOp } from './outbox';
import { OFFLINE_OPS } from './offlineOps';
import { OFFLINE_FLOW_OPS } from './offlineFlowOps';

let seq = 0;
const op = (method: string, args: unknown[], extra: Partial<OutboxOp> = {}): OutboxOp => ({
    id: `op${++seq}`,
    seq,
    method,
    args,
    createdAt: 0,
    userUuid: 'u',
    status: 'pending',
    attempts: 0,
    ...extra,
});

beforeEach(() => {
    seq = 0;
});

describe('nomes das operações', () => {
    it('toda operação que vai para a fila tem nome em português', () => {
        const queueable = [...Object.keys(OFFLINE_OPS), ...Object.keys(OFFLINE_FLOW_OPS)];
        const missing = queueable.filter(m => !OP_LABELS[m]);
        expect(missing).toEqual([]);
    });
    it('método desconhecido mostra o próprio nome', () => {
        expect(opLabel('xyz')).toBe('xyz');
    });
    it('estado', () => {
        expect(statusInfo('pending').label).toBe('Aguardando envio');
        expect(statusInfo('error').tone).toBe('error');
        expect(statusInfo('conflict').label).toBe('Recusada');
    });
    it('erro de permissão vira texto legível; recusa sem mensagem ganha explicação', () => {
        expect(friendlyError({ status: 'error', lastError: 'new row violates row-level security policy' })).toContain('Sem permissão');
        expect(friendlyError({ status: 'conflict' })).toContain('sem internet');
        expect(friendlyError({ status: 'pending' })).toBeUndefined();
    });
});

describe('dependentsOf', () => {
    it('descartar a inclusão de material leva junto as alterações do item temporário', () => {
        const add = op('addMaterialToAsset', ['7', '88', 1, 1, '1', { offlineUuid: 'aaa' }]);
        const qty = op('updateMaterialInAsset', ['tmp:aaa', { amount: 3 }]);
        const other = op('updateMaterialInAsset', ['12', { amount: 2 }]);
        expect(dependentsOf(add, [add, qty, other]).map(o => o.id)).toEqual([qty.id]);
    });

    it('em cadeia: ativo criado offline → material incluído nele → quantidade', () => {
        const asset = op('addAssetToOrderVisit', ['500', '9', '1', { offlineUuid: 'ova1' }]);
        const report = op('updateOrderVisitAsset', ['tmp:ova1', {}], { ovaId: 'tmp:ova1' });
        const mat = op('addMaterialToAsset', ['tmp:ova1', '88', 1, 1, '1', { offlineUuid: 'mat1' }], { ovaId: 'tmp:ova1' });
        const qty = op('updateMaterialInAsset', ['tmp:mat1', { amount: 2 }]);
        const unrelated = op('updateVehicleKm', ['4', 10]);
        expect(dependentsOf(asset, [asset, report, mat, qty, unrelated]).map(o => o.id).sort()).toEqual(
            [report.id, mat.id, qty.id].sort(),
        );
    });

    it('operação que não cria nada não tem dependentes', () => {
        const a = op('updateOrderVisitAsset', ['7', {}]);
        const b = op('updateOrderVisitAsset', ['7', {}]);
        expect(dependentsOf(a, [a, b])).toEqual([]);
    });

    it('não confunde prefixo de id (tmp:aaa x tmp:aaab)', () => {
        const add = op('addServiceToOrderVisit', ['500', '5', '1', 1, { offlineUuid: 'aaa' }]);
        const other = op('updateOrderVisitService', ['tmp:aaab', { amount: 2 }]);
        expect(dependentsOf(add, [add, other])).toEqual([]);
    });
});

describe('groupByVisit', () => {
    it('agrupa por visita na ordem da fila; sem visita vai no fim', () => {
        const a = op('updateVehicleKm', ['1', 1], { visitId: '600' });
        const b = op('updateAssetAlert', ['3', {}]);
        const c = op('updateOrderVisitAsset', ['7', {}], { visitId: '500' });
        const d = op('closeOrderVisit', ['600'], { visitId: '600' });
        const groups = groupByVisit([d, c, b, a]);
        expect(groups.map(g => [g.visitId, g.ops.map(o => o.id)])).toEqual([
            ['600', [a.id, d.id]],
            ['500', [c.id]],
            [null, [b.id]],
        ]);
    });
});

describe('fila de APK anterior (chaves clientUuid / vehicleClientUuid)', () => {
    it('dependentes também saem com as chaves antigas', () => {
        const start = op('startOrderVisit', [{ id: '1' }, { id: '1' }, undefined, { clientUuid: 'v1', vehicleClientUuid: 'veh1' }], { visitId: 'tmp:v1' });
        const km = op('updateVehicleKm', ['tmp:veh1', 1, 2]);
        const svc = op('addServiceToOrderVisit', ['tmp:v1', '5', '1', 1, { clientUuid: 's1' }], { visitId: 'tmp:v1' });
        expect(dependentsOf(start, [start, km, svc]).map(o => o.id).sort()).toEqual([km.id, svc.id].sort());
    });
});

