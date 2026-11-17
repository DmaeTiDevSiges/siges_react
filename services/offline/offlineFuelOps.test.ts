// Abastecimento de combustível sem internet (comprovante + despesa na fila).
const savedFiles = new Map<string, { size: number; as: string }>();
jest.mock('./offlineFiles', () => ({
    compressForOffline: async (file: any) => ({ blob: { type: 'image/webp', size: 300, src: file }, ext: 'webp' }),
    saveOfflineFile: async (name: string, blob: any, as: string) => {
        savedFiles.set(name, { size: blob.size, as });
        return { ref: { __offlineFile: true, name, mime: blob.type, size: blob.size, as }, url: `local://${name}` };
    },
}));
jest.mock('../core/supabase', () => ({ supabase: { from: () => ({ insert: async () => ({ error: null }) }) } }));

import { OFFLINE_FUEL_OPS } from './offlineFuelOps';
import { setOfflineOpsStore, type OfflineOpContext } from './offlineOps';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';

type Store = ReturnType<typeof createMemoryStore>;
const put = async (store: Store, method: string, args: unknown[], value: unknown) => {
    await store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: 1 });
    await registerReadKey(store, method, args);
};
const read = async (store: Store, method: string, args: unknown[]) => (await readCached<any>(store, method, args))?.value;
const ctxOf = (store: Store): OfflineOpContext => ({ store, now: () => Date.parse('2026-11-17T15:00:00Z'), tempId: () => 'tmp:x' });

const { uploadFuelExpenseImages: upload, saveRentalExpense: save } = OFFLINE_FUEL_OPS;

const fuelInput = (extra: Record<string, unknown> = {}) => ({
    vehicleId: '9',
    referenceMonth: '2026-11',
    costTypeId: '2',
    value: 250,
    description: 'Abastecimento ABC1D23 — 40 L',
    odometer: 12345,
    fuelQuantity: 40,
    invoiceImgPath: 'companies/1/vehicles/9/fuel/1_a_invoice.webp',
    invoiceImgName: '1_a_invoice.webp',
    userId: '7',
    ...extra,
});

beforeEach(() => {
    resetReadIndex();
    savedFiles.clear();
});

describe('comprovante do abastecimento offline', () => {
    it('salva o comprovante no aparelho com o nome final e devolve o caminho que o R2 terá', async () => {
        const args = await upload.prepareArgs!(['9', '3', { invoice: new Blob(['x']) }, () => undefined]);
        const fileName = args[4].fileName as string;

        expect(fileName).toMatch(/^\d+_[a-z0-9]+_invoice\.webp$/);
        expect(savedFiles.get(fileName)).toEqual({ size: 300, as: 'file' });
        // Arquivo no 1º nível; o callback de progresso não vai para a fila.
        expect(args.slice(0, 4)).toEqual(['9', '3', expect.objectContaining({ __offlineFile: true, name: fileName }), null]);

        const refs: any = await upload.applyLocal(ctxOf(createMemoryStore()), args);
        expect(refs).toMatchObject({
            invoiceImgPath: `companies/3/vehicles/9/fuel/${fileName}`,
            invoiceImgName: fileName,
        });
    });

    it('aceita o arquivo direto (reenvio da fila) e usa a empresa 1 quando não há empresa', async () => {
        const args = await upload.prepareArgs!(['9', null, new Blob(['x'])]);
        const refs: any = await upload.applyLocal(ctxOf(createMemoryStore()), args);
        expect(refs.invoiceImgPath).toBe(`companies/1/vehicles/9/fuel/${args[4].fileName}`);
    });

    it('sem foto do comprovante recusa antes de entrar na fila', async () => {
        await expect(upload.prepareArgs!(['9', '1', {}])).rejects.toThrow('comprovante');
    });

    it('comprovante e despesa usam a mesma chave (a despesa espera o upload)', async () => {
        const args = await upload.prepareArgs!(['9', '1', { invoice: new Blob(['x']) }]);
        const refs: any = await upload.applyLocal(ctxOf(createMemoryStore()), args);
        expect(save.entityKey([fuelInput(refs)])).toBe(upload.entityKey(args));
    });
});

describe('despesa de combustível offline', () => {
    it('gera offline_uuid e mantém o que já veio (reenvio não duplica)', async () => {
        const [fresh] = await save.prepareArgs!([fuelInput()]);
        expect(fresh.offlineUuid).toMatch(/^[0-9a-f-]{36}$/);

        const [kept] = await save.prepareArgs!([fuelInput({ offlineUuid: 'u-1' })]);
        expect(kept.offlineUuid).toBe('u-1');
    });

    it('recusa editar ou lançar despesa que não é abastecimento novo', async () => {
        await expect(save.prepareArgs!([fuelInput({ id: '55' })])).rejects.toThrow('novo abastecimento');
        await expect(save.prepareArgs!([fuelInput({ odometer: null })])).rejects.toThrow('novo abastecimento');
        await expect(save.prepareArgs!([fuelInput({ invoiceImgName: null })])).rejects.toThrow('novo abastecimento');
        await expect(save.prepareArgs!([{ vehicleId: '9', referenceMonth: '2026-11', costTypeId: '1', value: 10 }]))
            .rejects.toThrow('novo abastecimento');
    });

    it('entra no topo da lista do mês em cache, com o veículo do catálogo, sem duplicar', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);
        await store.put(OFFLINE_COLLECTIONS.catalog, 'vehicles:1', [{ id: '9', description: 'Strada', plates: 'ABC1D23' }]);
        await put(store, 'getFuelExpensesByUser', ['7', '2026-11'], [{ id: '40', value: 100 }]);

        const args = [fuelInput({ offlineUuid: 'u-1' })];
        await save.applyLocal(ctxOf(store), args);
        await save.applyLocal(ctxOf(store), args);

        const list = await read(store, 'getFuelExpensesByUser', ['7', '2026-11']);
        expect(list).toHaveLength(2);
        expect(list[0]).toMatchObject({
            id: 'tmp:u-1',
            referenceMonth: '2026-11-01',
            value: 250,
            odometer: 12345,
            fuelQuantity: 40,
            vehicleDescription: 'Strada',
            vehiclePlates: 'ABC1D23',
            createdAt: '2026-11-17T15:00:00.000Z',
        });
        expect(list[1]).toEqual({ id: '40', value: 100 });
    });

    it('mês sem lista baixada: cria a lista só com o lançamento novo', async () => {
        const store = createMemoryStore();
        setOfflineOpsStore(store);

        await save.applyLocal(ctxOf(store), [fuelInput({ offlineUuid: 'u-2', createdAt: '2026-11-10T12:00:00.000Z' })]);

        expect(await read(store, 'getFuelExpensesByUser', ['7', '2026-11'])).toEqual([
            expect.objectContaining({ id: 'tmp:u-2', createdAt: '2026-11-10T12:00:00.000Z' }),
        ]);
    });
});
