import { getBrazilTime } from '../../utils/dateUtils';
import { checklistFileName, checklistFolderPath } from '../core/checklistPaths';
import { patchCachedRead, patchCachedReadsOf } from './readCache';
import { checklistKey, mergeChecklistItem, patchList, sameId, str, type OfflineOpSpec } from './offlineOps';
import { compressForOffline, dataUrlToBlob, deleteOfflineFile, extForMime, saveOfflineFile } from './offlineFiles';
import { getLocalOfflineFileUrl } from './offlineFileUrls';

/**
 * Operações com arquivo que podem ser feitas SEM internet (F3):
 * fotos antes/depois do ativo, fotos do checklist, assinaturas da visita.
 *
 * Offline:
 *   1. a foto é comprimida e salva no aparelho com o NOME FINAL já definido;
 *   2. na fila vai uma referência ao arquivo (nunca o conteúdo);
 *   3. o cache recebe o nome + a URL local → a tela mostra a foto mesmo
 *      depois de fechar o app;
 *   4. no envio, o mesmo método do serviço sobe o arquivo com esse nome —
 *      reenviar sobrescreve o mesmo arquivo no R2 e não duplica na lista.
 * Remover uma foto que ainda não subiu só tira o envio da fila.
 */

const rand = () => Math.random().toString(36).substring(2, 8);
const SIGNATURE_FOLDER = (ovId: string) => `signatures/visits/${ovId}`;

type PhotoType = 'before' | 'after';
const photoFields = (type: PhotoType) =>
    type === 'before'
        ? { names: 'beforeImgFilesNames', urls: 'initialPhotoUrls' }
        : { names: 'afterImgFilesNames', urls: 'finalPhotoUrls' };

/** Acrescenta/remove a foto no ativo em cache (getOrderVisitAssetById e lista da visita). */
const patchOvaPhotos = async (
    store: Parameters<typeof patchCachedRead>[0],
    ovaId: string,
    mutate: (ova: any) => any,
) => {
    const updated = await patchCachedRead<any>(store, 'getOrderVisitAssetById', [ovaId], v => (v ? mutate(v) : undefined));
    const apply = (list: any[] | null | undefined) => patchList(list, ovaId, mutate);
    if (updated?.ovId) await patchCachedRead<any[]>(store, 'getOrderVisitAssets', [String(updated.ovId)], apply);
    else await patchCachedReadsOf<any[]>(store, 'getOrderVisitAssets', apply);
};

const signatureFields = (type: string) =>
    type === 'leader'
        ? { path: 'ovSignatureLeaderPath', name: 'ovSignatureLeaderName', at: 'ovSignatureLeaderAt' }
        : { path: 'ovSignatureRequesterPath', name: 'ovSignatureRequesterName', at: 'ovSignatureRequesterAt' };

const patchVisit = async (store: Parameters<typeof patchCachedRead>[0], ovId: string, patch: Record<string, unknown>) => {
    for (const method of ['getActiveOrderVisit', 'getOrderVisitById']) {
        await patchCachedRead<any>(store, method, [ovId], v => (v ? { ...v, ...patch } : undefined));
    }
};

export const OFFLINE_FILE_OPS: Record<string, OfflineOpSpec> = {
    // uploadOrderVisitAssetPhoto(ovAssetId, file, type, onProgress?, options?) → { path, filename }
    uploadOrderVisitAssetPhoto: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:photo:${str(a[4]?.fileName)}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const [ovaId, file, type] = [str(a[0]), a[1] as Blob, a[2] as PhotoType];
            const { blob, ext } = await compressForOffline(file);
            const fileName = `${type}_${Date.now()}_${rand()}.${ext}`;
            const { ref } = await saveOfflineFile(fileName, blob, 'file');
            return [ovaId, ref, type, null, { fileName }];
        },
        applyLocal: async (ctx, a) => {
            const [ovaId, type, fileName] = [str(a[0]), a[2] as PhotoType, str(a[4]?.fileName)];
            const url = getLocalOfflineFileUrl(fileName) || '';
            const f = photoFields(type);
            await patchOvaPhotos(ctx.store, ovaId, ova => ({
                ...ova,
                [f.names]: [...(ova[f.names] || []), fileName],
                [f.urls]: [...(ova[f.urls] || []), url],
            }));
            return { path: '', filename: fileName };
        },
    },

    // removeOrderVisitAssetPhoto(ovAssetId, type, fileName)
    removeOrderVisitAssetPhoto: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:photo:${str(a[2])}`,
        cancelsPending: (a, p) =>
            p.method === 'uploadOrderVisitAssetPhoto' &&
            sameId(p.args[0], a[0]) &&
            str((p.args[4] as any)?.fileName) === str(a[2]),
        skipIfCancelled: true,
        applyLocal: async (ctx, a) => {
            const [ovaId, type, fileName] = [str(a[0]), a[1] as PhotoType, str(a[2])];
            const f = photoFields(type);
            await patchOvaPhotos(ctx.store, ovaId, ova => {
                const names: string[] = ova[f.names] || [];
                const idx = names.indexOf(fileName);
                if (idx < 0) return ova;
                const urls: string[] = [...(ova[f.urls] || [])];
                urls.splice(idx, 1);
                return { ...ova, [f.names]: names.filter((_, i) => i !== idx), [f.urls]: urls };
            });
            await deleteOfflineFile(fileName);
        },
    },

    // uploadChecklistImage(ovAssetId, activityId, file, companyId?, assetId?, onProgress?, options?) → { path, filename }
    uploadChecklistImage: {
        ovaId: a => str(a[0]),
        entityKey: a => checklistKey(a[0], a[1]),
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const [ovaId, activityId, file, companyId, assetId] = [str(a[0]), str(a[1]), a[2] as Blob, a[3], a[4]];
            const { blob, ext } = await compressForOffline(file);
            const fileName = checklistFileName(ovaId, activityId, ext);
            const { ref } = await saveOfflineFile(fileName, blob, 'file');
            return [ovaId, activityId, ref, companyId, assetId, null, { fileName }];
        },
        applyLocal: async (_ctx, a) => ({
            path: checklistFolderPath(a[0], a[1], a[3], a[4]),
            filename: str(a[6]?.fileName),
        }),
    },

    // removeChecklistImage(ovAssetId, planId, activityId, fileName, userId) → item
    removeChecklistImage: {
        ovaId: a => str(a[0]),
        entityKey: a => checklistKey(a[0], a[2]),
        // Tira o upload da fila, mas a remoção ainda vai: o upsert com a lista
        // de fotos (que citava este arquivo) pode já ter subido.
        cancelsPending: (a, p) =>
            p.method === 'uploadChecklistImage' &&
            sameId(p.args[0], a[0]) &&
            str((p.args[6] as any)?.fileName) === str(a[3]),
        applyLocal: async (ctx, a) => {
            const [ovaId, planId, activityId, fileName] = [str(a[0]), str(a[1]), str(a[2]), str(a[3])];
            let result: any;
            const drop = (list: any[] | null | undefined) => {
                if (!Array.isArray(list)) return undefined;
                const existing = list.find(x => sameId(x?.activityId, activityId) && (!x?.maintenancePlanId || sameId(x.maintenancePlanId, planId)));
                if (!existing) return undefined;
                const merged = mergeChecklistItem(
                    { store: ctx.store, now: ctx.now, tempId: ctx.tempId },
                    existing,
                    ovaId,
                    planId,
                    activityId,
                    { imgFilesNames: (existing.imgFilesNames || []).filter((n: string) => n !== fileName) },
                );
                result = merged;
                return list.map(x => (x === existing ? merged : x));
            };
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItems', [ovaId, planId], drop);
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItemsByVisit', [ovaId], drop);
            await deleteOfflineFile(fileName);
            return result ?? null;
        },
    },

    // saveOrderVisitSignature(ovId, type, base64, onProgress?, options?)
    saveOrderVisitSignature: {
        entityKey: a => `visit:${str(a[0])}:signature:${str(a[1])}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const [ovId, type, dataUrl] = [str(a[0]), str(a[1]), str(a[2])];
            const blob = await dataUrlToBlob(dataUrl);
            const fileName = `${type}_${Date.now()}.${extForMime(blob.type || 'image/png')}`;
            const { ref } = await saveOfflineFile(fileName, blob, 'dataUrl');
            return [ovId, type, ref, null, { fileName, signedAt: getBrazilTime() }];
        },
        applyLocal: async (ctx, a) => {
            const [ovId, type, opts] = [str(a[0]), str(a[1]), (a[4] || {}) as { fileName?: string; signedAt?: string }];
            const f = signatureFields(type);
            await patchVisit(ctx.store, ovId, {
                [f.path]: SIGNATURE_FOLDER(ovId),
                [f.name]: opts.fileName,
                [f.at]: opts.signedAt,
            });
        },
    },

    // deleteOrderVisitSignature(visitId, type)
    deleteOrderVisitSignature: {
        entityKey: a => `visit:${str(a[0])}:signature:${str(a[1])}`,
        // Anula a assinatura que nem subiu; a remoção ainda vai (pode haver uma anterior no servidor).
        cancelsPending: (a, p) =>
            p.method === 'saveOrderVisitSignature' && sameId(p.args[0], a[0]) && str(p.args[1]) === str(a[1]),
        applyLocal: async (ctx, a) => {
            const [ovId, type] = [str(a[0]), str(a[1])];
            const f = signatureFields(type);
            await patchVisit(ctx.store, ovId, { [f.path]: null, [f.name]: null, [f.at]: null });
        },
    },
};
