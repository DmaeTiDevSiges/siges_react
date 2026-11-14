// Associar ativo sem internet: inclusão com id temporário, relatório offline,
// remoção antes do envio e ordem/troca de id no envio.
jest.mock('../core/supabase', () => ({ supabase: { from: () => ({ insert: async () => ({ error: null }) }) } }));

import { OFFLINE_FLOW_OPS, isTmpId, ovaTmpIdOf } from './offlineFlowOps';
import { OFFLINE_OPS, setOfflineOpsStore, type OfflineOpContext } from './offlineOps';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';
import { createMemoryOutboxStorage, createOutbox, type OutboxOp } from './outbox';
import { replaceDeep, runSync, type SyncDeps } from './syncEngine';
import { networkFailureCount, resetNetworkFailures } from './networkFailures';
import { filterAssets, searchAssetsOffline, searchUnitsOffline } from './offlineCatalog';

type Store = ReturnType<typeof createMemoryStore>;
const put = async (store: Store, method: string, args: unknown[], value: unknown) => {
    await store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: 1 });
    await registerReadKey(store, method, args);
};
const read = async (store: Store, method: string, args: unknown[]) => (await readCached<any>(store, method, args))?.value;
const ctxOf = (store: Store): OfflineOpContext => ({ store, now: () => 0, tempId: () => 'tmp:x' });

const UNIT_ASSETS = [
    { id: '501', code: 'MTR-01', description: 'Motor bomba', unitId: '13', unitDescriptionFull: 'EBAP 13', typeId: '7', clientId: '2', clientName: 'DMAE', statusId: '1', statusDescription: 'Uso', tagName: 'Bombeamento', tagSubName: 'GMB 02' },
    { id: '502', code: 'QDR-02', description: 'Quadro de comando', unitId: '13', unitDescriptionFull: 'EBAP 13' },
];

const seed = async () => {
    const store = createMemoryStore();
    setOfflineOpsStore(store);
    await store.put(OFFLINE_COLLECTIONS.catalog, 'assets:unit:13', UNIT_ASSETS);
    await put(store, 'getOrderVisitAssets', ['70'], [
        { id: '900', ovId: '70', assetId: '400', oCompanyId: '3', oContractId: '8', orderTypeId: '5', ovMask: 'OS1.01' },
    ]);
    await put(store, 'getActiveOrderVisit', ['70'], { id: '70', ovAssetsAmount: 1, providerCompanyId: '3' });
    return store;
};

beforeEach(() => {
    resetReadIndex();
    resetNetworkFailures();
});

describe('busca offline de ativos e unidades', () => {
    it('filtra o catálogo das unidades sem acento e por todos os termos', async () => {
        const store = await seed();
        expect((await searchAssetsOffline(store, 'motor', '13')).map(a => a.id)).toEqual(['501']);
        expect((await searchAssetsOffline(store, 'ebap quadro')).map(a => a.id)).toEqual(['502']);
        expect(filterAssets([{ description: 'Válvula' }], 'valvula')).toHaveLength(1);
        const units = await searchUnitsOffline(store, 'ebap');
        expect(units).toEqual([expect.objectContaining({ id: '13', description: 'EBAP 13' })]);
    });
});

describe('associar ativo sem internet', () => {
    it('cria o ativo "tmp:" na visita com os dados do catálogo e da visita', async () => {
        const store = await seed();
        const args = await OFFLINE_FLOW_OPS.addAssetToOrderVisit.prepareArgs!(['70', '501', '1']);
        const id = ovaTmpIdOf(args[3]);
        expect(isTmpId(id)).toBe(true);
        expect(await OFFLINE_FLOW_OPS.addAssetToOrderVisit.ovaId!(args)).toBe(id);

        await OFFLINE_FLOW_OPS.addAssetToOrderVisit.applyLocal(ctxOf(store), args);

        const list = await read(store, 'getOrderVisitAssets', ['70']);
        expect(list).toHaveLength(2);
        expect(list[1]).toMatchObject({
            id, ovId: '70', assetId: '501', code: 'MTR-01', assetTypeId: '7', beforeUnitDescription: 'EBAP 13',
            beforeTagDescription: 'Bombeamento', processingId: 1, oCompanyId: '3', oContractId: '8', orderTypeId: '5',
        });
        // Relatório do ativo novo abre offline
        expect(await read(store, 'getOrderVisitAssetById', [id])).toMatchObject({ id, code: 'MTR-01' });
        expect(await read(store, 'getOrderVisitAssetActivities', [id])).toEqual([]);
        expect(await read(store, 'getOrderVisitAssetMaterials', [id])).toEqual([]);
        expect(await read(store, 'getProviderCompanyByOvAssetId', [id])).toBe('3');
        expect((await read(store, 'getActiveOrderVisit', ['70'])).ovAssetsAmount).toBe(2);
    });

    it('1º ativo da visita: tipo da OS vem da OS baixada (atividades abrem offline)', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);
        await store.put(OFFLINE_COLLECTIONS.catalog, 'assets:unit:13', UNIT_ASSETS);
        await put(store, 'getOrderVisitAssets', ['71'], []);
        await put(store, 'getActiveOrderVisit', ['71'], { id: '71', oId: '44', providerCompanyId: '3' });
        await put(store, 'getOrderById', ['44'], { id: '44', typeId: '6' });

        const args = await OFFLINE_FLOW_OPS.addAssetToOrderVisit.prepareArgs!(['71', '501', '1']);
        await OFFLINE_FLOW_OPS.addAssetToOrderVisit.applyLocal(ctxOf(store), args);

        const id = ovaTmpIdOf(args[3]);
        expect((await read(store, 'getOrderVisitAssetById', [id])).orderTypeId).toBe('6');
    });

    it('remover o ativo temporário anula a inclusão e tudo dele na fila', async () => {
        const store = await seed();
        const outbox = createOutbox(createMemoryOutboxStorage());
        const add = await OFFLINE_FLOW_OPS.addAssetToOrderVisit.prepareArgs!(['70', '501', '1']);
        const id = ovaTmpIdOf(add[3]);
        await OFFLINE_FLOW_OPS.addAssetToOrderVisit.applyLocal(ctxOf(store), add);
        await outbox.enqueue({ method: 'addAssetToOrderVisit', args: add, userUuid: 'u', ovaId: id, visitId: '70' });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: [id, { before_comments: 'ok' }], userUuid: 'u', ovaId: id, visitId: '70' });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['33', 10], userUuid: 'u', visitId: '70' });

        const spec = OFFLINE_FLOW_OPS.removeAssetFromOrderVisit;
        const removed = await outbox.removeWhere(op => spec.cancelsPending!([id], op));
        expect(removed.map(o => o.method).sort()).toEqual(['addAssetToOrderVisit', 'updateOrderVisitAsset']);
        expect((spec.skipIfCancelled as (c: { method: string }[]) => boolean)(removed)).toBe(true);
        expect((await outbox.list()).map(o => o.method)).toEqual(['updateVehicleKm']);

        await spec.applyLocal(ctxOf(store), [id]);
        expect((await read(store, 'getOrderVisitAssets', ['70'])).map((a: any) => a.id)).toEqual(['900']);
        expect((await read(store, 'getActiveOrderVisit', ['70'])).ovAssetsAmount).toBe(1);
    });

    it('remover sem internet um ativo que já está no servidor é recusado', async () => {
        await expect(OFFLINE_FLOW_OPS.removeAssetFromOrderVisit.prepareArgs!(['900'])).rejects.toThrow(/só pode ser feito com conexão/);
    });

    it('alerta resolvido no ativo temporário fica no escopo dele', () => {
        expect(OFFLINE_OPS.updateAssetAlert.ovaId!(['5', { ovaId: 'tmp:abc', isDone: true }])).toBe('tmp:abc');
        expect(OFFLINE_OPS.updateAssetAlert.ovaId!(['5', { ovaId: '900', isDone: true }])).toBeUndefined();
    });
});

describe('envio do ativo temporário', () => {
    const makeDeps = (overrides: Partial<SyncDeps> = {}) => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const executed: OutboxOp[] = [];
        const locks: string[] = [];
        const deps: SyncDeps = {
            outbox,
            isOnline: () => true,
            sessionUserUuid: async () => 'u',
            execute: async op => { executed.push(op); },
            checkLock: async ovaId => { locks.push(ovaId); return 'ok'; },
            failureCount: networkFailureCount,
            classifyError: (_e, net) => (net ? 'network' : 'error'),
            isTemporaryId: isTmpId,
            ...overrides,
        };
        return { deps, outbox, executed, locks };
    };

    it('não confere trava de ativo temporário e envia na ordem', async () => {
        const { deps, outbox, executed, locks } = makeDeps();
        await outbox.enqueue({ method: 'addAssetToOrderVisit', args: ['70', '501', '1', { offlineUuid: 'abc' }], userUuid: 'u', ovaId: 'tmp:abc', visitId: '70' });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['tmp:abc', {}], userUuid: 'u', ovaId: 'tmp:abc', visitId: '70' });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['900', {}], userUuid: 'u', ovaId: '900', visitId: '70' });
        await runSync(deps);
        expect(executed.map(o => o.method)).toEqual(['addAssetToOrderVisit', 'updateOrderVisitAsset', 'updateOrderVisitAsset']);
        expect(locks).toEqual(['900']);
    });

    it('se a inclusão falhar, as operações do ativo esperam (não viram erro)', async () => {
        const { deps, outbox, executed } = makeDeps({
            execute: async op => {
                if (op.method === 'addAssetToOrderVisit') throw new Error('falhou');
                executed.push(op);
            },
        });
        await outbox.enqueue({ method: 'addAssetToOrderVisit', args: ['70', '501', '1', { offlineUuid: 'abc' }], userUuid: 'u', ovaId: 'tmp:abc', visitId: '70' });
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['tmp:abc', {}], userUuid: 'u', ovaId: 'tmp:abc', visitId: '70' });
        const result = await runSync(deps);
        expect(executed).toEqual([]);
        expect(result.heldBack).toBe(1);
        const ops = await outbox.list();
        expect(ops.map(o => o.status)).toEqual(['error', 'pending']);
    });

    it('replaceDeep troca o id temporário em argumentos e objetos', () => {
        expect(replaceDeep(['tmp:abc', { ovaId: 'tmp:abc', n: 1 }, ['tmp:abc'], 'x'], 'tmp:abc', '901'))
            .toEqual(['901', { ovaId: '901', n: 1 }, ['901'], 'x']);
    });
});
