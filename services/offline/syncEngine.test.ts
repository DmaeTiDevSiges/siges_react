import { createMemoryOutboxStorage, createOutbox, type OutboxOp } from './outbox';
import { backoffMs, runSync, type SyncDeps } from './syncEngine';
import { markNetworkFailure, networkFailureCount, resetNetworkFailures } from './networkFailures';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';
import { OFFLINE_OPS, opEntityKey, setOfflineOpsStore, type OfflineOpContext } from './offlineOps';

const UID = 'user-uuid-1';

const makeDeps = (overrides: Partial<SyncDeps> = {}) => {
    const outbox = createOutbox(createMemoryOutboxStorage());
    const executed: OutboxOp[] = [];
    const deps: SyncDeps = {
        outbox,
        isOnline: () => true,
        sessionUserUuid: async () => UID,
        execute: async op => {
            executed.push(op);
        },
        checkLock: async () => 'ok',
        failureCount: networkFailureCount,
        classifyError: (_e, networkFailed) => (networkFailed ? 'network' : 'error'),
        entityKey: op => opEntityKey(op.method, op.args),
        ...overrides,
    };
    return { deps, outbox, executed };
};

beforeEach(() => {
    resetNetworkFailures();
    resetReadIndex();
});

describe('outbox', () => {
    it('enfileira em ordem, persiste e resume', async () => {
        const storage = createMemoryOutboxStorage();
        const outbox = createOutbox(storage);
        await outbox.enqueue({ method: 'a', args: [1], userUuid: UID });
        await outbox.enqueue({ method: 'b', args: [2], userUuid: UID });
        expect((await outbox.list()).map(o => [o.seq, o.method])).toEqual([[1, 'a'], [2, 'b']]);
        expect(storage.data).toHaveLength(2);
        // Reabrir o app: a fila volta igual.
        const reopened = createOutbox(storage);
        expect((await reopened.summary()).pending).toBe(2);
    });

    it('enqueue simultâneos não se perdem', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        await Promise.all(Array.from({ length: 20 }, (_, i) => outbox.enqueue({ method: 'm', args: [i], userUuid: UID })));
        const ops = await outbox.list();
        expect(ops).toHaveLength(20);
        expect(new Set(ops.map(o => o.seq)).size).toBe(20);
    });

    it('retryErrors e discard', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const a = await outbox.enqueue({ method: 'a', args: [], userUuid: UID });
        const b = await outbox.enqueue({ method: 'b', args: [], userUuid: UID });
        await outbox.update(a.id, { status: 'error' });
        await outbox.update(b.id, { status: 'conflict' });
        expect(await outbox.retryErrors()).toBe(1);
        expect(await outbox.discard('conflict')).toBe(1);
        expect((await outbox.list()).map(o => o.status)).toEqual(['pending']);
    });
});

describe('runSync', () => {
    it('envia na ordem e esvazia a fila', async () => {
        const { deps, outbox, executed } = makeDeps();
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 10], userUuid: UID });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 20], userUuid: UID });
        const r = await runSync(deps);
        expect(r.sent).toBe(2);
        expect(executed.map(o => o.args[1])).toEqual([10, 20]);
        expect((await outbox.summary()).total).toBe(0);
    });

    it('offline: não envia nada', async () => {
        const { deps, outbox, executed } = makeDeps({ isOnline: () => false });
        await outbox.enqueue({ method: 'm', args: [], userUuid: UID });
        expect((await runSync(deps)).stoppedByNetwork).toBe(true);
        expect(executed).toHaveLength(0);
    });

    it('falha de rede: para a rodada e mantém as pendentes', async () => {
        let calls = 0;
        const { deps, outbox } = makeDeps({
            execute: async () => {
                calls++;
                if (calls === 2) {
                    markNetworkFailure();
                    throw new TypeError('Failed to fetch');
                }
            },
        });
        for (let i = 0; i < 3; i++) await outbox.enqueue({ method: 'updateVehicleKm', args: [String(i), i], userUuid: UID });
        const r = await runSync(deps);
        expect(r).toMatchObject({ sent: 1, stoppedByNetwork: true });
        const left = await outbox.list();
        expect(left.map(o => o.args[0])).toEqual(['1', '2']);
        expect(left[0]).toMatchObject({ status: 'pending', attempts: 1 });
    });

    it('serviço "engole" a falha de rede: não remove (reenviar)', async () => {
        const { deps, outbox } = makeDeps({
            execute: async () => {
                markNetworkFailure(); // ex.: toggleOrderVisitAssetActivity não lança
            },
        });
        await outbox.enqueue({ method: 'toggleOrderVisitAssetActivity', args: ['5', '9', '1', true], userUuid: UID });
        const r = await runSync(deps);
        expect(r.stoppedByNetwork).toBe(true);
        expect((await outbox.summary()).pending).toBe(1);
    });

    it('erro comum: marca erro, segue com outros registros e segura os do mesmo registro', async () => {
        const { deps, outbox, executed } = makeDeps({
            execute: async op => {
                if (op.args[1] === 'boom') throw new Error('violates check constraint');
                executed.push(op);
            },
        });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['7', 'boom'], userUuid: UID });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['3', 50], userUuid: UID });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['7', { after_comments: 'novo' }], userUuid: UID });
        const r = await runSync(deps);
        expect(r).toMatchObject({ sent: 1, errors: 1, heldBack: 1 });
        expect(executed.map(o => o.method)).toEqual(['updateVehicleKm']);
        const left = await outbox.list();
        expect(left.map(o => o.status)).toEqual(['error', 'pending']);
        expect(left[0].lastError).toContain('check constraint');

        // Próxima rodada sem resolver o erro: a do mesmo registro continua esperando.
        expect((await runSync(deps)).heldBack).toBe(1);
    });

    it('trava perdida: todas as operações do ativo viram conflito; outros ativos seguem', async () => {
        const checked: string[] = [];
        const { deps, outbox, executed } = makeDeps({
            checkLock: async ovaId => {
                checked.push(ovaId);
                return ovaId === '10' ? 'conflict' : 'ok';
            },
        });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['10', {}], userUuid: UID, ovaId: '10' });
        await outbox.enqueue({ method: 'updateOrderVisitAssetProgress', args: ['10', 50], userUuid: UID, ovaId: '10' });
        await outbox.enqueue({ method: 'updateOrderVisitAssetProgress', args: ['11', 80], userUuid: UID, ovaId: '11' });
        const r = await runSync(deps);
        expect(r).toMatchObject({ sent: 1, conflicts: 2 });
        expect(checked).toEqual(['10', '11']); // uma checagem por ativo
        expect(executed.map(o => o.ovaId)).toEqual(['11']);
        expect((await outbox.list()).every(o => o.status === 'conflict')).toBe(true);
    });

    it('só envia operações do usuário da sessão', async () => {
        const { deps, outbox, executed } = makeDeps();
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 1], userUuid: 'outro' });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['2', 2], userUuid: UID });
        const r = await runSync(deps);
        expect(r).toMatchObject({ sent: 1, skippedOtherUser: 1 });
        expect(executed.map(o => o.args[0])).toEqual(['2']);
    });

    it('sem sessão: não envia', async () => {
        const { deps, outbox, executed } = makeDeps({ sessionUserUuid: async () => null });
        await outbox.enqueue({ method: 'm', args: [], userUuid: UID });
        await runSync(deps);
        expect(executed).toHaveLength(0);
    });

    it('não conseguiu renovar a sessão: não envia', async () => {
        const { deps, outbox, executed } = makeDeps({
            ensureSession: async () => {
                throw new Error('refresh failed');
            },
        });
        await outbox.enqueue({ method: 'm', args: [], userUuid: UID });
        expect((await runSync(deps)).stoppedByNetwork).toBe(true);
        expect(executed).toHaveLength(0);
    });

    it('backoff: 5 s, 10 s, 20 s… até 5 min', () => {
        expect(backoffMs(1)).toBe(5000);
        expect(backoffMs(2)).toBe(10000);
        expect(backoffMs(3)).toBe(20000);
        expect(backoffMs(20)).toBe(300000);
    });
});

describe('offlineOps.applyLocal', () => {
    const put = async (store: ReturnType<typeof createMemoryStore>, method: string, args: unknown[], value: unknown) => {
        await store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: 1 });
        await registerReadKey(store, method, args);
    };
    const ctxOf = (store: ReturnType<typeof createMemoryStore>): OfflineOpContext => {
        let n = 0;
        return { store, now: () => 0, tempId: () => `tmp:${++n}` };
    };
    const read = async (store: ReturnType<typeof createMemoryStore>, method: string, args: unknown[]) =>
        (await readCached<any>(store, method, args))?.value;

    it('updateOrderVisitAsset: campos snake → camel no ativo e na lista da visita', async () => {
        const store = createMemoryStore();
        await put(store, 'getOrderVisitAssetById', ['7'], { id: '7', ovId: '500', afterComments: 'velho' });
        await put(store, 'getOrderVisitAssets', ['500'], [{ id: '7', afterComments: 'velho' }, { id: '8' }]);
        await OFFLINE_OPS.updateOrderVisitAsset.applyLocal(ctxOf(store), ['7', { after_comments: 'novo', after_status_id: 3, is_moved: true }]);
        expect(await read(store, 'getOrderVisitAssetById', ['7'])).toMatchObject({ afterComments: 'novo', afterStatusId: '3', isMoved: true });
        expect((await read(store, 'getOrderVisitAssets', ['500']))[0]).toMatchObject({ afterComments: 'novo' });
    });

    it('toggleOrderVisitAssetActivity: marca (com descrição do catálogo) e desmarca', async () => {
        const store = createMemoryStore();
        await put(store, 'getActivitiesByOrderType', ['2'], [{ id: '9', description: 'Limpeza', code: 'L1' }]);
        await put(store, 'getOrderVisitAssetActivities', ['7'], []);
        const ctx = ctxOf(store);
        await OFFLINE_OPS.toggleOrderVisitAssetActivity.applyLocal(ctx, ['7', '9', '1', true]);
        expect(await read(store, 'getOrderVisitAssetActivities', ['7'])).toEqual([
            expect.objectContaining({ activityId: '9', activityDescription: 'Limpeza', isDeleted: false }),
        ]);
        await OFFLINE_OPS.toggleOrderVisitAssetActivity.applyLocal(ctx, ['7', '9', '1', false]);
        expect(await read(store, 'getOrderVisitAssetActivities', ['7'])).toEqual([]);
    });

    it('upsertMaintenanceChecklistItem: cria, depois atualiza o mesmo item e devolve-o', async () => {
        const store = createMemoryStore();
        await put(store, 'getMaintenanceChecklistItems', ['7', '3'], []);
        const ctx = ctxOf(store);
        const first: any = await OFFLINE_OPS.upsertMaintenanceChecklistItem.applyLocal(ctx, ['7', '3', '40', '1', { status: 'OK' }]);
        expect(first).toMatchObject({ activityId: '40', status: 'OK', maintenancePlanId: '3' });
        const second: any = await OFFLINE_OPS.upsertMaintenanceChecklistItem.applyLocal(ctx, ['7', '3', '40', '1', { comments: 'ok' }]);
        expect(second).toMatchObject({ id: first.id, status: 'OK', comments: 'ok' });
        expect(await read(store, 'getMaintenanceChecklistItems', ['7', '3'])).toHaveLength(1);
        await OFFLINE_OPS.deleteMaintenanceChecklistItem.applyLocal(ctx, ['7', '3', '40']);
        expect(await read(store, 'getMaintenanceChecklistItems', ['7', '3'])).toEqual([]);
    });

    it('updateMaterialInAsset: acha a lista pelo id do material e descobre o ativo', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);
        await put(store, 'getOrderVisitAssetMaterials', ['7'], [{ id: '12', amount: 1, valueUnit: 10, discount: 0 }]);
        await put(store, 'getOrderVisitAssetMaterials', ['8'], [{ id: '13', amount: 1, valueUnit: 5 }]);
        await OFFLINE_OPS.updateMaterialInAsset.applyLocal(ctxOf(store), ['12', { amount: 3 }]);
        expect((await read(store, 'getOrderVisitAssetMaterials', ['7']))[0]).toMatchObject({ amount: 3, valueTotal: 30 });
        expect((await read(store, 'getOrderVisitAssetMaterials', ['8']))[0]).toMatchObject({ amount: 1 });
        expect(await OFFLINE_OPS.updateMaterialInAsset.ovaId!(['12'])).toBe('7');
    });

    it('updateVehicleKm e updateOrderVisitService', async () => {
        const store = createMemoryStore();
        await put(store, 'getOrderVisitVehicles', ['500'], [{ id: '4', recorderStart: 1, recorderEnd: 2 }]);
        await put(store, 'getOrderVisitServices', ['500'], [{ id: '6', amount: 1, valueUnit: 100, discount: 1 }]);
        await OFFLINE_OPS.updateVehicleKm.applyLocal(ctxOf(store), ['4', undefined, 99]);
        await OFFLINE_OPS.updateOrderVisitService.applyLocal(ctxOf(store), ['6', { amount: 2 }]);
        expect((await read(store, 'getOrderVisitVehicles', ['500']))[0]).toMatchObject({ recorderStart: 1, recorderEnd: 99 });
        expect((await read(store, 'getOrderVisitServices', ['500']))[0]).toMatchObject({ amount: 2, valueTotal: 200 });
    });

    it('updateAssetAlert devolve o alerta atualizado', async () => {
        const store = createMemoryStore();
        await put(store, 'getAssetAlerts', ['55'], [{ id: '1', isCompleted: false, description: 'x' }]);
        const r = await OFFLINE_OPS.updateAssetAlert.applyLocal(ctxOf(store), ['1', { isCompleted: true }]);
        expect(r).toMatchObject({ id: '1', isCompleted: true, description: 'x' });
    });
});
