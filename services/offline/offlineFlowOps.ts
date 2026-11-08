import { getBrazilNaiveTimestamp, getBrazilTimestamp } from '../../utils/dateUtils';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, findInCachedReads, patchCachedRead, patchCachedReadsOf, readCached, registerReadKey } from './readCache';
import { getOfflineOpsStore, patchOva, sameId, str, type OfflineOpSpec } from './offlineOps';

/**
 * F4 — inclusões e fluxo que podem ser feitos SEM internet.
 *
 * Inclusões (material no ativo, serviço na visita): a linha nasce com
 * client_uuid (migration 20261116) e id local "tmp:<uuid>". Reenviar o
 * insert não duplica (insertWithClientUuid). Alterar/remover o item antes de
 * subir: no envio o "tmp:" vira o id real (procurado pelo client_uuid);
 * remover antes de o insert subir anula tudo na fila.
 *
 * Fluxo: Relatar ativo (espera as alterações do ativo), Relatar visita e
 * Encerrar visita (esperam todas as da visita). A hora gravada é a do
 * aparelho. Validações que dependem do servidor são repetidas no envio.
 *
 * Continuam só online: incluir veículo/ociosidade (contrato de locação,
 * busca de veículos), incluir/trocar ativo (busca no cadastro), aprovação.
 */

export const newClientUuid = (): string => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch {
        /* segue */
    }
    // v4 simples (Math.random) — só se crypto.randomUUID não existir.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
};

export const TMP_PREFIX = 'tmp:';
export const isTmpId = (v: unknown): v is string => typeof v === 'string' && v.startsWith(TMP_PREFIX);
const uuidOfTmp = (v: unknown) => (isTmpId(v) ? v.slice(TMP_PREFIX.length) : '');

/** Catálogo de materiais baixado no preparo (offline: busca local). */
export const materialsCatalogKey = (providerId: unknown) => `materials:${str(providerId)}`;

const findCatalogMaterial = async (store: Parameters<typeof patchCachedRead>[0], materialId: unknown) => {
    try {
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            const list = await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key);
            const hit = Array.isArray(list) ? list.find(m => sameId(m?.id, materialId)) : undefined;
            if (hit) return hit;
        }
    } catch {
        /* sem catálogo */
    }
    return undefined;
};

const patchVisit = async (store: Parameters<typeof patchCachedRead>[0], ovId: string, mutate: (v: any) => any) => {
    for (const method of ['getActiveOrderVisit', 'getOrderVisitById']) {
        await patchCachedRead<any>(store, method, [ovId], v => (v ? mutate(v) : undefined));
    }
};

/** Remove de uma lista por id; undefined = não mudou. */
const dropFromList = (list: any[] | null | undefined, id: unknown) => {
    if (!Array.isArray(list)) return undefined;
    const next = list.filter(x => !sameId(x?.id, id));
    return next.length === list.length ? undefined : next;
};

/** Pendentes que um "remover" de item temporário anula: o insert e as alterações. */
const cancelsTmpItem = (insertMethod: string, uuidArgIndex: number) => (a: any[], p: { method: string; args: unknown[] }) => {
    if (!isTmpId(a[0])) return false;
    if (sameId(p.args[0], a[0])) return true;
    return p.method === insertMethod && str((p.args[uuidArgIndex] as any)?.clientUuid) === uuidOfTmp(a[0]);
};
const insertWasCancelled = (insertMethod: string) => (cancelled: { method: string }[]) =>
    cancelled.some(c => c.method === insertMethod);

export const OFFLINE_FLOW_OPS: Record<string, OfflineOpSpec> = {
    // ── Inclusões ────────────────────────────────────────────────────────────

    // addMaterialToAsset(ovAssetId, materialId, amount, valueUnit, userId, options?)
    addMaterialToAsset: {
        ovaId: a => str(a[0]),
        entityKey: a => `material:${TMP_PREFIX}${str(a[5]?.clientUuid)}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], a[3], a[4], { clientUuid: newClientUuid() }],
        applyLocal: async (ctx, a) => {
            const [ovaId, materialId, amount, valueUnit, userId, opts] = [str(a[0]), str(a[1]), Number(a[2]), Number(a[3]), str(a[4]), a[5] || {}];
            const material = await findCatalogMaterial(ctx.store, materialId);
            const item = {
                id: `${TMP_PREFIX}${opts.clientUuid}`,
                ovaId,
                orderVisitAssetId: ovaId,
                materialId,
                amount,
                valueUnit,
                valueTotal: amount * valueUnit,
                discount: 0,
                isDeleted: false,
                createdUserId: userId,
                createdAt: new Date(ctx.now()).toISOString(),
                materialDescription: material?.description || 'Material (sem internet)',
                materialCode: material?.code || '---',
                materialUnit: material?.unit || 'un',
            };
            const hit = await patchCachedRead<any[]>(ctx.store, 'getOrderVisitAssetMaterials', [ovaId], list => [...(list || []), item]);
            if (hit === undefined) {
                // Lista nunca baixada: cria só com o item novo.
                await ctx.store.put(OFFLINE_COLLECTIONS.reads, cacheKey('getOrderVisitAssetMaterials', [ovaId]), {
                    value: [item],
                    savedAt: ctx.now(),
                });
                await registerReadKey(ctx.store, 'getOrderVisitAssetMaterials', [ovaId]);
            }
        },
    },

    // removeMaterialFromAsset(id, userId)
    removeMaterialFromAsset: {
        entityKey: a => `material:${str(a[0])}`,
        tmpIdTable: 'orders_visits_assets_materials',
        cancelsPending: cancelsTmpItem('addMaterialToAsset', 5),
        skipIfCancelled: insertWasCancelled('addMaterialToAsset'),
        applyLocal: async (ctx, a) => {
            const id = str(a[0]);
            // Igual ao servidor (soft delete): a lista traz o item com isDeleted.
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitAssetMaterials', list => {
                if (!Array.isArray(list) || !list.some(m => sameId(m?.id, id))) return undefined;
                return isTmpId(id) ? list.filter(m => !sameId(m?.id, id)) : list.map(m => (sameId(m?.id, id) ? { ...m, isDeleted: true } : m));
            });
        },
    },

    // addServiceToOrderVisit(visitId, contractServiceId, userId, amount = 1, options?)
    addServiceToOrderVisit: {
        visitId: a => str(a[0]),
        entityKey: a => `service:${TMP_PREFIX}${str(a[4]?.clientUuid)}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], a[3] ?? 1, { clientUuid: newClientUuid() }],
        applyLocal: async (ctx, a) => {
            const [visitId, csId, amount, opts] = [str(a[0]), str(a[1]), Number(a[3] ?? 1), a[4] || {}];
            const cs = await findInCachedReads<any[], any>(ctx.store, 'getContractServices', list =>
                Array.isArray(list) ? list.find(x => sameId(x?.id, csId)) : undefined,
            );
            const valueUnit = Number(cs?.valueUnit || 0);
            const discount = Number(cs?.discount !== undefined ? cs.discount : 1);
            const item = {
                id: `${TMP_PREFIX}${opts.clientUuid}`,
                ovId: visitId,
                serviceId: cs?.serviceId ? str(cs.serviceId) : csId,
                amount,
                valueUnit,
                discount,
                valueTotal: amount * valueUnit * (discount || 1),
                versionMode: cs?.versionMode,
                serviceDescription: cs?.serviceDescription || 'Serviço (sem internet)',
                serviceCode: cs?.serviceCode,
                serviceUnit: cs?.serviceUnit,
            };
            await patchCachedRead<any[]>(ctx.store, 'getOrderVisitServices', [visitId], list => [...(list || []), item]);
        },
    },

    // removeServiceFromOrderVisit(ovServiceId)
    removeServiceFromOrderVisit: {
        entityKey: a => `service:${str(a[0])}`,
        tmpIdTable: 'orders_visits_services',
        cancelsPending: cancelsTmpItem('addServiceToOrderVisit', 4),
        skipIfCancelled: insertWasCancelled('addServiceToOrderVisit'),
        applyLocal: async (ctx, a) => {
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitServices', list => dropFromList(list, a[0]));
        },
    },

    // removeVehicleFromOrderVisit(visitVehicleId) — o veículo foi incluído online
    removeVehicleFromOrderVisit: {
        entityKey: a => `vehicle:${str(a[0])}`,
        applyLocal: async (ctx, a) => {
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitVehicles', list => dropFromList(list, a[0]));
        },
    },

    // ── Fluxo ────────────────────────────────────────────────────────────────

    // reportedOrderVisitAsset(id, userId, options?) — Relatar ativo
    reportedOrderVisitAsset: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:report`,
        barrier: 'ova',
        prepareArgs: async a => [a[0], a[1], { reportedAt: new Date().toISOString() }],
        applyLocal: async (ctx, a) => {
            const [ovaId, userId, opts] = [str(a[0]), str(a[1]), a[2] || {}];
            const before = (await readCached<any>(ctx.store, 'getOrderVisitAssetById', [ovaId]))?.value;
            const prev = Number(before?.processingId || 1);
            await patchOva(ctx, ovaId, {
                processingId: 2,
                reportedUserId: userId,
                reportedAt: opts.reportedAt,
                disapprovedNotes: null,
            });
            if (before?.ovId && prev !== 2) {
                await patchVisit(ctx.store, str(before.ovId), v => ({
                    ...v,
                    ovAssetsReportedAmount: Number(v.ovAssetsReportedAmount || 0) + 1,
                    ...(prev === 4 ? { ovAssetsDisapprovedAmount: Math.max(0, Number(v.ovAssetsDisapprovedAmount || 0) - 1) } : {}),
                }));
            }
        },
        afterSync: async (a, h) => {
            await h.unlockOva(str(a[0]));
        },
    },

    // reportOrderVisit(visitId, userId, options?) — Relatar visita
    reportOrderVisit: {
        visitId: a => str(a[0]),
        entityKey: a => `visit:${str(a[0])}:report`,
        barrier: 'visit',
        prepareArgs: async a => {
            // Mesma validação do serviço, com os dados do aparelho (o envio confere de novo).
            const store = getOfflineOpsStore();
            if (store) await validateReportVisitLocal(store, str(a[0]));
            return [a[0], a[1], { reportedAt: getBrazilTimestamp(), idempotent: true }];
        },
        applyLocal: async (ctx, a) => {
            const [visitId, userId, opts] = [str(a[0]), str(a[1]), a[2] || {}];
            await patchVisit(ctx.store, visitId, v => ({ ...v, ovProcessingId: 2, reportedUserId: userId, reportedAt: opts.reportedAt }));
        },
    },

    // closeOrderVisit(visitId, orderId, statusId, statusDescription, suspendedReasonId, causeReasonId, progress, user, endedAt?, options?)
    closeOrderVisit: {
        visitId: a => str(a[0]),
        entityKey: a => `visit:${str(a[0])}:close`,
        barrier: 'visit',
        prepareArgs: async a => {
            const store = getOfflineOpsStore();
            if (store) await validateCloseVisitLocal(store, str(a[0]));
            const args = [...a];
            while (args.length < 9) args.push(undefined);
            args[9] = { clientOpId: newClientUuid(), clientEndedAt: getBrazilNaiveTimestamp() };
            return args;
        },
        applyLocal: async (ctx, a) => {
            const [visitId, statusId, user, endedAt, opts] = [str(a[0]), Number(a[2]), a[7] || {}, a[8], a[9] || {}];
            await patchVisit(ctx.store, visitId, v => ({
                ...v,
                ovStatusId: 2,
                ovOStatusId: statusId,
                ovEndedAt: endedAt || opts.clientEndedAt,
            }));
            // Perfil guardado: o técnico deixa de estar "em visita" (reabrir o app offline).
            if (user?.uuid) {
                const profile = await ctx.store.get<any>(OFFLINE_COLLECTIONS.profile, str(user.uuid)).catch(() => null);
                if (profile) {
                    await ctx.store.put(OFFLINE_COLLECTIONS.profile, str(user.uuid), {
                        ...profile,
                        isOvInProgress: false,
                        ovIdInProgress: undefined,
                        isAvailable: true,
                    });
                }
            }
        },
    },
};

// ── Validações locais (antes de entrar na fila) ──────────────────────────────

/** Relatar visita: mesma regra do serviço, com o cache. Lança com a mesma mensagem. */
export const validateReportVisitLocal = async (store: Parameters<typeof patchCachedRead>[0], visitId: string): Promise<void> => {
    const visit = (await readCached<any>(store, 'getActiveOrderVisit', [visitId]))?.value;
    const assets = (await readCached<any[]>(store, 'getOrderVisitAssets', [visitId]))?.value || [];
    const processing = Number(visit?.ovProcessingId || 1);
    if (processing !== 1 && processing !== 4) throw new Error('Apenas visitas em rascunho ou rejeitadas podem ser reportadas');
    if (processing === 1 && assets.some(x => Number(x?.processingId || 1) !== 2)) {
        throw new Error('Todos os ativos devem estar reportados antes de reportar a visita');
    }
    if (processing === 4 && assets.some(x => Number(x?.processingId) === 4)) {
        throw new Error('Não é possível reportar a visita enquanto houver ativos rejeitados');
    }
};

/** Encerrar: valida o Km dos veículos (exceto ociosidade) com o cache. */
export const validateCloseVisitLocal = async (store: Parameters<typeof patchCachedRead>[0], visitId: string): Promise<void> => {
    const vehicles = (await readCached<any[]>(store, 'getOrderVisitVehicles', [visitId]))?.value || [];
    const invalid = vehicles.some(
        v =>
            v?.costType !== 'idle' &&
            (v?.recorderStart == null || v?.recorderEnd == null || Number(v.recorderStart) >= Number(v.recorderEnd)),
    );
    if (invalid) throw new Error('Existem veículos com apontamento inválido ou incompleto (Km Inicial >= Km Final).');
};
