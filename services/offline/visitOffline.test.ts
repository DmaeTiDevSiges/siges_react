// Etapa 3 — iniciar visita sem internet.
import { OFFLINE_FLOW_OPS, visitTmpIdOf } from './offlineFlowOps';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';
import { createMemoryOutboxStorage, createOutbox, type OutboxOp } from './outbox';
import { runSync, type SyncDeps } from './syncEngine';
import { networkFailureCount, resetNetworkFailures } from './networkFailures';
import { dependentsOf } from './pendingOps';
import type { OfflineOpContext } from './offlineOps';

type Store = ReturnType<typeof createMemoryStore>;
const read = async (store: Store, method: string, args: unknown[]) => (await readCached<any>(store, method, args))?.value;
const ctxOf = (store: Store): OfflineOpContext => ({ store, now: () => 0, tempId: () => 'tmp:x' });

const order = { id: '100', parentId: 99, orderMask: 'OS-100', statusId: 2, teamLeaderId: '1', unitId: '5', unitDescription: 'Unidade A', clientName: 'Cliente', contractId: '10' };
const user = { id: '1', uuid: 'uuid-1', nameShort: 'Líder', isAvailable: true, isOvInProgress: false, vehicleId: '77', permissions: [{ big: true }] };
const spec = OFFLINE_FLOW_OPS.startOrderVisit;

beforeEach(() => {
    resetReadIndex();
    resetNetworkFailures();
});

describe('Iniciar visita offline — preparo', () => {
    it('fila leva só os ids + offline_uuid, hora do aparelho e uuid do veículo', async () => {
        const args = await spec.prepareArgs!([order, user, undefined]);
        expect(args[0]).toEqual({ id: '100', parentId: 99 });
        expect(args[1]).toEqual({ id: '1' });
        expect(args[3].offlineUuid).toMatch(/^[0-9a-f-]{36}$/);
        expect(args[3].vehicleOfflineUuid).toMatch(/^[0-9a-f-]{36}$/);
        expect(args[3].clientStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/);
        expect(JSON.stringify(args)).not.toContain('permissions'); // perfil completo não vai para a fila
        expect(spec.visitId!(args)).toBe(visitTmpIdOf(args[3]));
    });

    it('sem veículo: sem uuid de veículo', async () => {
        const args = await spec.prepareArgs!([order, { ...user, vehicleId: undefined }]);
        expect(args[3].vehicleOfflineUuid).toBeUndefined();
    });

    it.each([
        ['OS concluída', { ...order, statusId: 8 }, user, 'concluída ou cancelada'],
        ['OS cancelada', { ...order, statusId: 7 }, user, 'concluída ou cancelada'],
        ['outro líder', { ...order, teamLeaderId: '2' }, user, 'Só o líder'],
        ['já em visita', order, { ...user, isOvInProgress: true }, 'já está em uma visita'],
    ])('recusa no aparelho: %s', async (_n, o, u, msg) => {
        await expect(spec.prepareArgs!([o, u])).rejects.toThrow(msg);
    });
});

describe('Iniciar visita offline — aparelho', () => {
    it('monta visita, equipe (só o líder), veículo tmp, OS em andamento e perfil "em visita"', async () => {
        const store = createMemoryStore();
        await store.put(OFFLINE_COLLECTIONS.catalog, 'vehicles:3', [{ id: '77', plates: 'ABC1D23', description: 'Strada' }]);
        await store.put(OFFLINE_COLLECTIONS.reads, cacheKey('getOrderById', ['100']), { value: { id: '100', statusId: 2 }, savedAt: 1 });
        await registerReadKey(store, 'getOrderById', ['100']);
        await store.put(OFFLINE_COLLECTIONS.profile, 'uuid-1', { uuid: 'uuid-1', isAvailable: true, isOvInProgress: false });

        const args = await spec.prepareArgs!([order, user]);
        await spec.applyLocal(ctxOf(store), args);
        const visitId = visitTmpIdOf(args[3]);

        expect(await read(store, 'getActiveOrderVisit', [visitId])).toMatchObject({
            id: visitId, oId: '100', ovStatusId: 1, ovProcessingId: 1, ovTeamLeadId: '1', clientName: 'Cliente', contractId: '10',
        });
        expect(await read(store, 'getOrderVisitTeam', [visitId])).toEqual([expect.objectContaining({ userId: '1', isLeader: true })]);
        expect(await read(store, 'getOrderVisitVehicles', [visitId])).toEqual([
            expect.objectContaining({ id: `tmp:${args[3].vehicleOfflineUuid}`, vehicleId: '77', plates: 'ABC1D23' }),
        ]);
        expect(await read(store, 'getOrderVisitAssets', [visitId])).toEqual([]);
        expect(await read(store, 'getOrderById', ['100'])).toMatchObject({ statusId: 5 });
        expect(await store.get(OFFLINE_COLLECTIONS.profile, 'uuid-1')).toMatchObject({
            isOvInProgress: true, isAvailable: false, ovIdInProgress: visitId,
        });
    });
});

describe('Iniciar visita offline — envio', () => {
    let seq = 0;
    const deps = (outbox: ReturnType<typeof createOutbox>, fail: (op: OutboxOp) => boolean, sent: string[]): SyncDeps => ({
        outbox,
        isOnline: () => true,
        sessionUserUuid: async () => 'u',
        execute: async op => {
            if (fail(op)) throw new Error('falhou');
            sent.push(op.method);
        },
        checkLock: async () => 'ok',
        failureCount: networkFailureCount,
        classifyError: () => 'conflict',
        barrier: op => OFFLINE_FLOW_OPS[op.method]?.barrier,
        isTemporaryId: (v: string) => v.startsWith('tmp:'),
    });

    it('tudo da visita nova espera o "Iniciar"; recusado → nada dela sobe; outra visita segue', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const args = await spec.prepareArgs!([order, user]);
        const v = visitTmpIdOf(args[3]);
        await outbox.enqueue({ method: 'startOrderVisit', args, userUuid: 'u', visitId: v });
        await outbox.enqueue({ method: 'updateVehicleKm', args: [`tmp:${args[3].vehicleOfflineUuid}`, 10, 20], userUuid: 'u', visitId: v });
        await outbox.enqueue({ method: 'closeOrderVisit', args: [v], userUuid: 'u', visitId: v });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['9', 1, 2], userUuid: 'u', visitId: '600' });
        const sent: string[] = [];
        const r = await runSync(deps(outbox, op => op.method === 'startOrderVisit', sent));
        expect(r).toMatchObject({ conflicts: 1, heldBack: 2, sent: 1 });
        expect(sent).toEqual(['updateVehicleKm']); // só a da visita 600
        const left = await outbox.list();
        expect(left.map(o => [o.method, o.status])).toEqual([
            ['startOrderVisit', 'conflict'],
            ['updateVehicleKm', 'pending'],
            ['closeOrderVisit', 'pending'],
        ]);
        seq++;
    });

    it('"Iniciar" aceito: o resto da visita sobe em ordem', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const args = await spec.prepareArgs!([order, user]);
        const v = visitTmpIdOf(args[3]);
        await outbox.enqueue({ method: 'startOrderVisit', args, userUuid: 'u', visitId: v });
        await outbox.enqueue({ method: 'addServiceToOrderVisit', args: [v, '5', '1', 1, { offlineUuid: 's1' }], userUuid: 'u', visitId: v });
        await outbox.enqueue({ method: 'closeOrderVisit', args: [v], userUuid: 'u', visitId: v });
        const sent: string[] = [];
        await runSync(deps(outbox, () => false, sent));
        expect(sent).toEqual(['startOrderVisit', 'addServiceToOrderVisit', 'closeOrderVisit']);
    });

    it('descartar o "Iniciar" recusado leva tudo da visita (inclusive o Km do veículo tmp)', async () => {
        const args = await spec.prepareArgs!([order, user]);
        const v = visitTmpIdOf(args[3]);
        const mk = (id: string, method: string, a: unknown[], visitId?: string): OutboxOp => ({
            id, seq: Number(id.slice(1)), method, args: a, createdAt: 0, userUuid: 'u', status: 'pending', attempts: 0, visitId,
        });
        const start = mk('o1', 'startOrderVisit', args, v);
        const km = mk('o2', 'updateVehicleKm', [`tmp:${args[3].vehicleOfflineUuid}`, 1, 2]);
        const svc = mk('o3', 'addServiceToOrderVisit', [v, '5', '1', 1, { offlineUuid: 's1' }], v);
        const svcQty = mk('o4', 'updateOrderVisitService', ['tmp:s1', { amount: 2 }]);
        const other = mk('o5', 'updateVehicleKm', ['9', 1, 2], '600');
        expect(dependentsOf(start, [start, km, svc, svcQty, other]).map(o => o.id)).toEqual(['o2', 'o3', 'o4']);
    });
});
