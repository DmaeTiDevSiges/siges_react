// F3 — operações com arquivo. O armazenamento real (Capacitor Filesystem +
// compressão em canvas) é substituído por um falso em memória.
const savedFiles = new Map<string, { size: number; as: string }>();
const deleted: string[] = [];

jest.mock('./offlineFiles', () => {
    const { setLocalOfflineFileUrl, removeLocalOfflineFileUrl } = jest.requireActual('./offlineFileUrls');
    return {
        compressForOffline: async (file: any) => ({ blob: { type: 'image/webp', size: 300, src: file }, ext: 'webp' }),
        dataUrlToBlob: async () => ({ type: 'image/png', size: 50 }),
        extForMime: (m: string) => (m === 'image/png' ? 'png' : 'webp'),
        saveOfflineFile: async (name: string, blob: any, as: string) => {
            savedFiles.set(name, { size: blob.size, as });
            const url = `https://localhost/_capacitor_file_/offline-files/${name}`;
            setLocalOfflineFileUrl(name, url);
            return { ref: { __offlineFile: true, name, mime: blob.type, size: blob.size, as }, url };
        },
        deleteOfflineFile: async (name: string) => {
            deleted.push(name);
            removeLocalOfflineFileUrl(name);
        },
    };
});

import { OFFLINE_FILE_OPS } from './offlineFileOps';
import { createMemoryStore } from './store/memoryStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, readCached, registerReadKey, resetReadIndex } from './readCache';
import { getLocalOfflineFileUrl, isLocalImageUrl } from './offlineFileUrls';
import { createMemoryOutboxStorage, createOutbox } from './outbox';
import type { OfflineOpContext } from './offlineOps';

const put = async (store: ReturnType<typeof createMemoryStore>, method: string, args: unknown[], value: unknown) => {
    await store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: 1 });
    await registerReadKey(store, method, args);
};
const read = async (store: ReturnType<typeof createMemoryStore>, method: string, args: unknown[]) =>
    (await readCached<any>(store, method, args))?.value;
const ctxOf = (store: ReturnType<typeof createMemoryStore>): OfflineOpContext => ({ store, now: () => 0, tempId: () => 'tmp:1' });

beforeEach(() => {
    savedFiles.clear();
    deleted.length = 0;
    resetReadIndex();
});

describe('foto do ativo', () => {
    it('prepareArgs: comprime, salva com nome final e troca o File pela referência', async () => {
        const args = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.prepareArgs!(['7', { big: true }, 'before', () => undefined]);
        const fileName = args[4].fileName as string;
        expect(fileName).toMatch(/^before_\d+_[a-z0-9]+\.webp$/);
        expect(args[1]).toMatchObject({ __offlineFile: true, name: fileName, as: 'file' });
        expect(args[3]).toBeNull(); // onProgress (função) não vai para a fila
        expect(JSON.parse(JSON.stringify(args))).toEqual(args); // serializável
        expect(savedFiles.get(fileName)).toMatchObject({ size: 300 });
    });

    it('applyLocal: foto aparece no ativo e na lista, com URL local; remover tira e apaga o arquivo', async () => {
        const store = createMemoryStore();
        await put(store, 'getOrderVisitAssetById', ['7'], { id: '7', ovId: '500', beforeImgFilesNames: ['a.webp'], initialPhotoUrls: ['https://r2/a.webp'] });
        await put(store, 'getOrderVisitAssets', ['500'], [{ id: '7', beforeImgFilesNames: ['a.webp'], initialPhotoUrls: ['https://r2/a.webp'] }]);
        const args = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.prepareArgs!(['7', {}, 'before', null]);
        const name = args[4].fileName;

        const result: any = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.applyLocal(ctxOf(store), args);
        expect(result.filename).toBe(name);
        const ova = await read(store, 'getOrderVisitAssetById', ['7']);
        expect(ova.beforeImgFilesNames).toEqual(['a.webp', name]);
        expect(ova.initialPhotoUrls[1]).toContain('_capacitor_file_');
        expect(isLocalImageUrl(ova.initialPhotoUrls[1])).toBe(true);
        expect((await read(store, 'getOrderVisitAssets', ['500']))[0].beforeImgFilesNames).toHaveLength(2);

        await OFFLINE_FILE_OPS.removeOrderVisitAssetPhoto.applyLocal(ctxOf(store), ['7', 'before', name]);
        const after = await read(store, 'getOrderVisitAssetById', ['7']);
        expect(after.beforeImgFilesNames).toEqual(['a.webp']);
        expect(after.initialPhotoUrls).toEqual(['https://r2/a.webp']);
        expect(deleted).toContain(name);
        expect(getLocalOfflineFileUrl(name)).toBeUndefined();
    });

    it('remover foto que nem subiu anula o envio (e não vai ao servidor)', async () => {
        const outbox = createOutbox(createMemoryOutboxStorage());
        const up = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.prepareArgs!(['7', {}, 'after', null]);
        await outbox.enqueue({ method: 'uploadOrderVisitAssetPhoto', args: up, userUuid: 'u' });
        const other = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.prepareArgs!(['7', {}, 'after', null]);
        await outbox.enqueue({ method: 'uploadOrderVisitAssetPhoto', args: other, userUuid: 'u' });

        const spec = OFFLINE_FILE_OPS.removeOrderVisitAssetPhoto;
        const removed = await outbox.removeWhere(op => spec.cancelsPending!(['7', 'after', up[4].fileName], op));
        expect(removed).toHaveLength(1);
        expect(spec.skipIfCancelled).toBe(true);
        expect((await outbox.list()).map(o => (o.args[4] as any).fileName)).toEqual([other[4].fileName]);
    });

    it('upload e remoção da mesma foto usam a mesma chave (ordem na fila)', async () => {
        const up = await OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.prepareArgs!(['7', {}, 'after', null]);
        expect(OFFLINE_FILE_OPS.uploadOrderVisitAssetPhoto.entityKey(up)).toBe(
            OFFLINE_FILE_OPS.removeOrderVisitAssetPhoto.entityKey(['7', 'after', up[4].fileName]),
        );
    });
});

describe('foto do checklist', () => {
    it('upload devolve a pasta e o nome finais; mesma chave do item do checklist', async () => {
        const args = await OFFLINE_FILE_OPS.uploadChecklistImage.prepareArgs!(['7', '40', {}, '3', '99', null]);
        const r: any = await OFFLINE_FILE_OPS.uploadChecklistImage.applyLocal(ctxOf(createMemoryStore()), args);
        expect(r.path).toBe('companies/3/assets/99');
        expect(r.filename).toMatch(/^checklist_7_40_\d+_\w+\.webp$/);
        expect(OFFLINE_FILE_OPS.uploadChecklistImage.entityKey(args)).toBe(
            OFFLINE_FILE_OPS.removeChecklistImage.entityKey(['7', '3', '40', r.filename, '1']),
        );
    });

    it('remover foto do checklist tira da lista do item e ainda vai ao servidor', async () => {
        const store = createMemoryStore();
        await put(store, 'getMaintenanceChecklistItems', ['7', '3'], [
            { id: '1', activityId: '40', maintenancePlanId: '3', imgFilesNames: ['x.webp', 'y.webp'] },
        ]);
        const r: any = await OFFLINE_FILE_OPS.removeChecklistImage.applyLocal(ctxOf(store), ['7', '3', '40', 'x.webp', '1']);
        expect(r.imgFilesNames).toEqual(['y.webp']);
        expect((await read(store, 'getMaintenanceChecklistItems', ['7', '3']))[0].imgFilesNames).toEqual(['y.webp']);
        expect(OFFLINE_FILE_OPS.removeChecklistImage.skipIfCancelled).toBeFalsy();
    });
});

describe('assinatura', () => {
    it('salva como data URL com hora do aparelho e aparece na visita em cache', async () => {
        const store = createMemoryStore();
        await put(store, 'getActiveOrderVisit', ['500'], { id: '500' });
        const args = await OFFLINE_FILE_OPS.saveOrderVisitSignature.prepareArgs!(['500', 'requester', 'data:image/png;base64,AAAA', null]);
        expect(args[2]).toMatchObject({ __offlineFile: true, as: 'dataUrl' });
        expect(args[4].fileName).toMatch(/^requester_\d+\.png$/);
        expect(args[4].signedAt).toBeTruthy();
        await OFFLINE_FILE_OPS.saveOrderVisitSignature.applyLocal(ctxOf(store), args);
        expect(await read(store, 'getActiveOrderVisit', ['500'])).toMatchObject({
            ovSignatureRequesterPath: 'signatures/visits/500',
            ovSignatureRequesterName: args[4].fileName,
        });
        await OFFLINE_FILE_OPS.deleteOrderVisitSignature.applyLocal(ctxOf(store), ['500', 'requester']);
        expect((await read(store, 'getActiveOrderVisit', ['500'])).ovSignatureRequesterName).toBeNull();
    });

    it('excluir anula a assinatura pendente do mesmo tipo, não a do outro', () => {
        const spec = OFFLINE_FILE_OPS.deleteOrderVisitSignature;
        expect(spec.cancelsPending!(['500', 'leader'], { method: 'saveOrderVisitSignature', args: ['500', 'leader'] })).toBe(true);
        expect(spec.cancelsPending!(['500', 'leader'], { method: 'saveOrderVisitSignature', args: ['500', 'requester'] })).toBe(false);
    });
});
