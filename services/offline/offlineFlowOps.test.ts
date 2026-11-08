// F4 — inclusões e fluxo offline.
const insertCalls: any[] = [];
let insertResponses: any[] = [];
jest.mock('../core/supabase', () => ({
    supabase: {
        from: () => ({
            insert: async (row: any) => {
                insertCalls.push(row);
                return insertResponses.shift() ?? { error: null };
            },
        }),
    },
}));

import { OFFLINE_FLOW_OPS, isTmpId, validateCloseVisitLocal, validateReportVisitLocal } from './offlineFlowOps';
import { OFFLINE_OPS, setOfflineOpsStore, type OfflineOpContext } from './offlineOps';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';
import { createMemoryOutboxStorage, createOutbox } from './outbox';
import { runSync, type SyncDeps } from './syncEngine';
import { networkFailureCount, resetNetworkFailures } from './networkFailures';
import { filterMaterials, searchMaterialsOffline } from './offlineCatalog';
import { insertWithClientUuid } from '../core/clientUuidInsert';

type Store = ReturnType<typeof createMemoryStore>;
const put = async (store: Store, method: string, args: unknown[], value: unknown) => {
    await store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: 1 });
    await registerReadKey(store, method, args);
};
const read = async (store: Store, method: string, args: unknown[]) => (await readCached<any>(store, method, args))?.value;
const ctxOf = (store: Store): OfflineOpContext => ({ store, now: () => 0, tempId: () => 'tmp:x' });

beforeEach(() => {
    resetReadIndex();
    resetNetworkFailures();
    insertCalls.length = 0;
    insertResponses = [];
});

describe('incluir/remover material offline', () => {
    it('inclui com id temporário e descrição do catálogo baixado', async () => {
        const store = createMemoryStore();
        await store.put(OFFLINE_COLLECTIONS.catalog, 'materials:3', [{ id: '88', code: 'TB50', description: 'Tubo PVC 50mm', unit: 'm' }]);
        await put(store, 'getOrderVisitAssetMaterials', ['7'], []);
        const args = await OFFLINE_FLOW_OPS.addMaterialToAsset.prepareArgs!(['7', '88', 1, 12.5, '1']);
        await OFFLINE_FLOW_OPS.addMaterialToAsset.applyLocal(ctxOf(store), args);
        const [item] = await read(store, 'getOrderVisitAssetMaterials', ['7']);
        expect(isTmpId(item.id)).toBe(true);
        expect(item.id).toBe(`tmp:${args[5].clientUuid}`);
        expect(item).toMatchObject({ materialDescription: 'Tubo PVC 50mm', materialUnit: 'm', amount: 1, valueTotal: 12.5 });
    });

    it('lista nunca baixada: cria a lista com o item novo', async () => {
        const store = createMemoryStore();
        const args = await OFFLINE_FLOW_OPS.addMaterialToAsset.prepareArgs!(['9', '88', 2, 1, '1']);
        await OFFLINE_FLOW_OPS.addMaterialToAsset.applyLocal(ctxOf(store), args);
        expect(await read(store, 'getOrderVisitAssetMaterials', ['9'])).toHaveLength(1);
    });

    it('alterar/remover o temporário usam a chave do insert (mesma ordem na fila)', async () => {
        const args = await OFFLINE_FLOW_OPS.addMaterialToAsset.prepareArgs!(['7', '88', 1, 1, '1']);
        const tmp = `tmp:${args[5].clientUuid}`;
        const key = OFFLINE_FLOW_OPS.addMaterialToAsset.entityKey(args);
        expect(OFFLINE_OPS.updateMaterialInAsset.entityKey([tmp, { amount: 3 }])).toBe(key);
        expect(OFFLINE_FLOW_OPS.removeMaterialFromAsset.entityKey([tmp, '1'])).toBe(key);
        expect(OFFLINE_OPS.updateMaterialInAsset.tmpIdTable).toBe('orders_visits_assets_materials');
    });

    it('remover antes de subir anula insert + alterações e não vai ao servidor', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const add = await OFFLINE_FLOW_OPS.addMaterialToAsset.prepareArgs!(['7', '88', 1, 1, '1']);
        const tmp = `tmp:${add[5].clientUuid}`;
        await outbox.enqueue({ method: 'addMaterialToAsset', args: add, userUuid: 'u' });
        await outbox.enqueue({ method: 'updateMaterialInAsset', args: [tmp, { amount: 4 }], userUuid: 'u' });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 5], userUuid: 'u' });

        const spec = OFFLINE_FLOW_OPS.removeMaterialFromAsset;
        const cancelled = await outbox.removeWhere(op => spec.cancelsPending!([tmp, '1'], op));
        expect(cancelled.map(c => c.method)).toEqual(['addMaterialToAsset', 'updateMaterialInAsset']);
        expect((spec.skipIfCancelled as Function)(cancelled)).toBe(true);
        expect((await outbox.list()).map(o => o.method)).toEqual(['updateVehicleKm']);
    });

    it('remover item que já subiu (só a alteração pendente) ainda vai ao servidor', () => {
        const spec = OFFLINE_FLOW_OPS.removeMaterialFromAsset;
        expect((spec.skipIfCancelled as Function)([{ method: 'updateMaterialInAsset', args: [] }])).toBe(false);
        expect(spec.cancelsPending!(['12', '1'], { method: 'updateMaterialInAsset', args: ['12'] })).toBe(false); // id real: não anula
    });

    it('remover material com id real marca isDeleted (igual ao servidor)', async () => {
        const store = createMemoryStore();
        await put(store, 'getOrderVisitAssetMaterials', ['7'], [{ id: '12' }, { id: '13' }]);
        await OFFLINE_FLOW_OPS.removeMaterialFromAsset.applyLocal(ctxOf(store), ['12', '1']);
        expect(await read(store, 'getOrderVisitAssetMaterials', ['7'])).toEqual([{ id: '12', isDeleted: true }, { id: '13' }]);
    });
});

describe('incluir/remover serviço offline', () => {
    it('usa o serviço do contrato em cache (valor, desconto, descrição)', async () => {
        const store = createMemoryStore();
        await put(store, 'getContractServices', ['10'], [{ id: '5', serviceId: '50', valueUnit: 100, discount: 1, serviceDescription: 'Limpeza' }]);
        await put(store, 'getOrderVisitServices', ['500'], []);
        const args = await OFFLINE_FLOW_OPS.addServiceToOrderVisit.prepareArgs!(['500', '5', '1']);
        expect(args[3]).toBe(1); // amount padrão
        await OFFLINE_FLOW_OPS.addServiceToOrderVisit.applyLocal(ctxOf(store), args);
        const [svc] = await read(store, 'getOrderVisitServices', ['500']);
        expect(svc).toMatchObject({ serviceId: '50', valueTotal: 100, serviceDescription: 'Limpeza', ovId: '500' });
        await OFFLINE_FLOW_OPS.removeServiceFromOrderVisit.applyLocal(ctxOf(store), [svc.id]);
        expect(await read(store, 'getOrderVisitServices', ['500'])).toEqual([]);
    });
});

describe('Relatar ativo / Relatar visita / Encerrar', () => {
    it('relatar ativo: processing 2, hora do aparelho, contador da visita', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);
        await put(store, 'getOrderVisitAssetById', ['7'], { id: '7', ovId: '500', processingId: 4 });
        await put(store, 'getActiveOrderVisit', ['500'], { id: '500', ovAssetsReportedAmount: 1, ovAssetsDisapprovedAmount: 1 });
        const args = await OFFLINE_FLOW_OPS.reportedOrderVisitAsset.prepareArgs!(['7', '1']);
        expect(args[2].reportedAt).toBeTruthy();
        await OFFLINE_FLOW_OPS.reportedOrderVisitAsset.applyLocal(ctxOf(store), args);
        expect(await read(store, 'getOrderVisitAssetById', ['7'])).toMatchObject({ processingId: 2, reportedUserId: '1' });
        expect(await read(store, 'getActiveOrderVisit', ['500'])).toMatchObject({ ovAssetsReportedAmount: 2, ovAssetsDisapprovedAmount: 0 });
        expect(OFFLINE_FLOW_OPS.reportedOrderVisitAsset.barrier).toBe('ova');
    });

    it('relatar visita: valida com o cache (todos os ativos relatados)', async () => {
        const store = createMemoryStore();
        await put(store, 'getActiveOrderVisit', ['500'], { id: '500', ovProcessingId: 1 });
        await put(store, 'getOrderVisitAssets', ['500'], [{ id: '7', processingId: 2 }, { id: '8', processingId: 1 }]);
        await expect(validateReportVisitLocal(store, '500')).rejects.toThrow('Todos os ativos devem estar reportados');
        await put(store, 'getOrderVisitAssets', ['500'], [{ id: '7', processingId: 2 }, { id: '8', processingId: 2 }]);
        await expect(validateReportVisitLocal(store, '500')).resolves.toBeUndefined();
    });

    it('encerrar: valida km com o cache; ociosidade não conta', async () => {
        const store = createMemoryStore();
        await put(store, 'getOrderVisitVehicles', ['500'], [
            { id: '1', costType: 'odometer', recorderStart: 100, recorderEnd: 90 },
            { id: '2', costType: 'idle' },
        ]);
        await expect(validateCloseVisitLocal(store, '500')).rejects.toThrow('Km Inicial >= Km Final');
        await put(store, 'getOrderVisitVehicles', ['500'], [{ id: '1', costType: 'odometer', recorderStart: 100, recorderEnd: 150 }, { id: '2', costType: 'idle' }]);
        await expect(validateCloseVisitLocal(store, '500')).resolves.toBeUndefined();
    });

    it('encerrar: id da operação + hora do aparelho; visita e perfil atualizados', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);
        await put(store, 'getActiveOrderVisit', ['500'], { id: '500', ovStatusId: 1 });
        await store.put(OFFLINE_COLLECTIONS.profile, 'uuid-1', { uuid: 'uuid-1', isOvInProgress: true, ovIdInProgress: '500' });
        const args = await OFFLINE_FLOW_OPS.closeOrderVisit.prepareArgs!(['500', '100', 8, 'Concluída', null, 1, 100, { uuid: 'uuid-1' }]);
        expect(args[9].clientOpId).toMatch(/^[0-9a-f-]{36}$/);
        expect(args[9].clientEndedAt).toMatch(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/);
        await OFFLINE_FLOW_OPS.closeOrderVisit.applyLocal(ctxOf(store), args);
        expect(await read(store, 'getActiveOrderVisit', ['500'])).toMatchObject({ ovStatusId: 2, ovOStatusId: 8 });
        expect(await store.get(OFFLINE_COLLECTIONS.profile, 'uuid-1')).toMatchObject({ isOvInProgress: false, isAvailable: true });
        expect(OFFLINE_FLOW_OPS.closeOrderVisit.barrier).toBe('visit');
    });
});

describe('barreiras no envio', () => {
    const deps = (outbox: ReturnType<typeof createOutbox>, fail: (m: string) => boolean, sent: string[]): SyncDeps => ({
        outbox,
        isOnline: () => true,
        sessionUserUuid: async () => 'u',
        execute: async op => {
            if (fail(op.method)) throw new Error('falhou');
            sent.push(op.method);
        },
        checkLock: async () => 'ok',
        failureCount: networkFailureCount,
        classifyError: () => 'error',
        barrier: op => OFFLINE_FLOW_OPS[op.method]?.barrier,
    });

    it('encerrar espera: alteração da visita com erro segura o encerramento', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 5], userUuid: 'u', visitId: '500' });
        await outbox.enqueue({ method: 'updateVehicleKm', args: ['2', 5], userUuid: 'u', visitId: '600' });
        await outbox.enqueue({ method: 'closeOrderVisit', args: ['500'], userUuid: 'u', visitId: '500' });
        await outbox.enqueue({ method: 'closeOrderVisit', args: ['600'], userUuid: 'u', visitId: '600' });
        const sent: string[] = [];
        let first = true;
        const r = await runSync(deps(outbox, m => m === 'updateVehicleKm' && (first ? !(first = false) : false), sent));
        // A 1ª alteração (visita 500) falhou → encerrar a 500 espera; a 600 encerra.
        expect(r).toMatchObject({ errors: 1, heldBack: 1 });
        expect(sent).toEqual(['updateVehicleKm', 'closeOrderVisit']);
        const left = await outbox.list();
        expect(left.map(o => [o.method, o.visitId, o.status])).toEqual([
            ['updateVehicleKm', '500', 'error'],
            ['closeOrderVisit', '500', 'pending'],
        ]);
    });

    it('relatar ativo espera as alterações do ativo; outro ativo segue', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['7', {}], userUuid: 'u', ovaId: '7', visitId: '500' });
        await outbox.enqueue({ method: 'reportedOrderVisitAsset', args: ['7', '1'], userUuid: 'u', ovaId: '7', visitId: '500' });
        await outbox.enqueue({ method: 'reportedOrderVisitAsset', args: ['8', '1'], userUuid: 'u', ovaId: '8', visitId: '500' });
        const sent: string[] = [];
        await runSync(deps(outbox, m => m === 'updateOrderVisitAsset', sent));
        expect(sent).toEqual(['reportedOrderVisitAsset']);
        expect((await outbox.list()).map(o => o.ovaId)).toEqual(['7', '7']);
    });

    it('tudo certo: envia na ordem e encerra por último', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        await outbox.enqueue({ method: 'updateOrderVisitAsset', args: ['7', {}], userUuid: 'u', ovaId: '7', visitId: '500' });
        await outbox.enqueue({ method: 'reportedOrderVisitAsset', args: ['7', '1'], userUuid: 'u', ovaId: '7', visitId: '500' });
        await outbox.enqueue({ method: 'closeOrderVisit', args: ['500'], userUuid: 'u', visitId: '500' });
        await outbox.enqueue({ method: 'reportOrderVisit', args: ['500', '1'], userUuid: 'u', visitId: '500' });
        const sent: string[] = [];
        await runSync(deps(outbox, () => false, sent));
        expect(sent).toEqual(['updateOrderVisitAsset', 'reportedOrderVisitAsset', 'closeOrderVisit', 'reportOrderVisit']);
        expect((await outbox.summary()).total).toBe(0);
    });
});

describe('catálogo de materiais offline', () => {
    const catalog = [
        { id: '1', code: 'TB50', description: 'Tubo PVC PBA DN 50MM' },
        { id: '2', code: 'TS50', description: 'Tubo de PVC Soldavel DN: 50 mm' },
        { id: '3', code: 'CB25', description: 'Cabo flexível 2,5mm' },
    ];
    it('mesmas regras da busca online (termos em qualquer ordem, "50mm" acha "50 mm")', () => {
        expect(filterMaterials(catalog, 'pvc 50mm').map(m => m.id)).toEqual(['1', '2']);
        expect(filterMaterials(catalog, 'cabo').map(m => m.id)).toEqual(['3']);
        expect(filterMaterials(catalog, '').map(m => m.id)).toEqual(['1', '2', '3']);
    });
    it('busca pelo fornecedor e pagina', async () => {
        const store = createMemoryStore();
        await store.put(OFFLINE_COLLECTIONS.catalog, 'materials:3', catalog);
        expect((await searchMaterialsOffline(store, 'pvc', 0, 1, '3')).map(m => m.id)).toEqual(['1']);
        expect((await searchMaterialsOffline(store, 'pvc', 1, 1, '3')).map(m => m.id)).toEqual(['2']);
        expect(await searchMaterialsOffline(store, 'pvc', 0, 20, '999')).toEqual([]);
    });
});

describe('insertWithClientUuid', () => {
    it('grava client_uuid; duplicata pelo client_uuid conta como sucesso', async () => {
        insertResponses = [{ error: { code: '23505', message: 'duplicate key value violates unique constraint "ux_orders_visits_services_client_uuid"' } }];
        await expect(insertWithClientUuid('orders_visits_services', { a: 1 }, 'uuid-1')).resolves.toBeUndefined();
        expect(insertCalls[0]).toEqual({ a: 1, client_uuid: 'uuid-1' });
    });
    it('outra duplicata (não client_uuid) continua erro', async () => {
        insertResponses = [{ error: { code: '23505', message: 'duplicate key value violates unique constraint "x_pkey"' } }];
        await expect(insertWithClientUuid('t', { a: 1 }, 'uuid-1')).rejects.toMatchObject({ code: '23505' });
    });
    it('sem a migration (coluna inexistente): grava sem client_uuid', async () => {
        insertResponses = [{ error: { code: 'PGRST204', message: "Could not find the 'client_uuid' column" } }, { error: null }];
        await insertWithClientUuid('t', { a: 1 }, 'uuid-1');
        expect(insertCalls).toEqual([{ a: 1, client_uuid: 'uuid-1' }, { a: 1 }]);
    });
    it('sem clientUuid: insert normal', async () => {
        await insertWithClientUuid('t', { a: 1 });
        expect(insertCalls).toEqual([{ a: 1 }]);
    });
});
