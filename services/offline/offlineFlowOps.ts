import { getBrazilNaiveTimestamp, getBrazilTimestamp } from '../../utils/dateUtils';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { offlineUuidOf, vehicleOfflineUuidOf } from './offlineUuid';
import { cacheKey, findInCachedReads, patchCachedRead, patchCachedReadsOf, readCached, registerReadKey } from './readCache';
import { getOfflineOpsStore, patchOva, sameId, str, visitOfListItem, type OfflineOpSpec } from './offlineOps';

/**
 * F4 — inclusões e fluxo que podem ser feitos SEM internet.
 *
 * Inclusões (material no ativo, serviço na visita): a linha nasce com
 * offline_uuid (migration 20261116) e id local "tmp:<uuid>". Reenviar o
 * insert não duplica (insertWithOfflineUuid). Alterar/remover o item antes de
 * subir: no envio o "tmp:" vira o id real (procurado pelo offline_uuid);
 * remover antes de o insert subir anula tudo na fila.
 *
 * Fluxo: Relatar ativo (espera as alterações do ativo), Relatar visita e
 * Encerrar visita (esperam todas as da visita). A hora gravada é a do
 * aparelho. Validações que dependem do servidor são repetidas no envio.
 *
 * Veículo: a busca usa o cadastro da empresa baixado no preparo; a linha
 * nasce com offline_uuid como material/serviço. Equipe: incluir/remover membro
 * (lista de usuários do preparo); no envio a inclusão é idempotente.
 *
 * Ativo: associar sem internet (busca no catálogo das unidades baixado no
 * download automático); nasce "tmp:<uuid>" e o relatório dele funciona offline.
 * Remover offline só o ativo incluído offline (anula tudo dele na fila).
 *
 * Continuam só online: ociosidade (contrato de locação), trocar ativo,
 * remover ativo que já está no servidor, aprovação.
 */

export const newOfflineUuid = (): string => {
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
/** Cadastro de veículos da empresa baixado no preparo (offline: busca local). */
export const vehiclesCatalogKey = (companyId: unknown) => `vehicles:${str(companyId)}`;

const findCatalogVehicle = async (store: Parameters<typeof patchCachedRead>[0], vehicleId: unknown) => {
    try {
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            if (!key.startsWith('vehicles:')) continue;
            const list = await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key);
            const hit = Array.isArray(list) ? list.find(v => sameId(v?.id, vehicleId)) : undefined;
            if (hit) return hit;
        }
    } catch {
        /* sem cadastro */
    }
    return undefined;
};

const findCatalogMaterial = async (store: Parameters<typeof patchCachedRead>[0], materialId: unknown) => {
    try {
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            // Só catálogos de materiais (o mesmo id pode existir em ativos/veículos).
            if (!key.startsWith('materials:')) continue;
            const list = await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key);
            const hit = Array.isArray(list) ? list.find(m => sameId(m?.id, materialId)) : undefined;
            if (hit) return hit;
        }
    } catch {
        /* sem catálogo */
    }
    return undefined;
};

/** Ativo do catálogo das unidades ("assets:unit:<id>", download automático). */
const findCatalogAsset = async (store: Parameters<typeof patchCachedRead>[0], assetId: unknown) => {
    try {
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            if (!key.startsWith('assets:unit:')) continue;
            const list = await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key);
            const hit = Array.isArray(list) ? list.find(a => sameId(a?.id, assetId)) : undefined;
            if (hit) return hit;
        }
    } catch {
        /* sem catálogo */
    }
    return undefined;
};

/** Grava uma leitura no cache (e no índice), como se tivesse vindo do servidor. */
const putRead = async (ctx: { store: Parameters<typeof patchCachedRead>[0]; now: () => number }, method: string, args: unknown[], value: unknown) => {
    await ctx.store.put(OFFLINE_COLLECTIONS.reads, cacheKey(method, args), { value, savedAt: ctx.now() });
    await registerReadKey(ctx.store, method, args);
};

/** Ativo da visita incluído sem internet: "tmp:<offline_uuid>" (orders_visits_assets). */
export const ovaTmpIdOf = (opts: unknown) => `${TMP_PREFIX}${str(offlineUuidOf(opts))}`;

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
    return p.method === insertMethod && str(offlineUuidOf(p.args[uuidArgIndex])) === uuidOfTmp(a[0]);
};
const teamMemberKey = (visitId: unknown, userId: unknown) => `visit:${str(visitId)}:team:${str(userId)}`;

const insertWasCancelled = (insertMethod: string) => (cancelled: { method: string }[]) =>
    cancelled.some(c => c.method === insertMethod);

/** Visita iniciada sem internet: "tmp:<offline_uuid>" (orders_visits, migration 20261124). */
export const visitTmpIdOf = (opts: unknown) => `${TMP_PREFIX}${str(offlineUuidOf(opts))}`;

/** Status da OS que impedem iniciar visita (mesma regra da v3: 7 cancelada, 8 concluída). */
const CLOSED_ORDER_STATUS = [7, 8];

/**
 * Visita montada no aparelho a partir da OS e do técnico (mesmos campos que
 * getActiveOrderVisit devolve). O número definitivo (ov_mask) vem do servidor.
 */
const buildLocalVisit = (visitId: string, order: any, user: any, startedAt: string) => ({
    id: visitId,
    oId: str(order.id),
    ovMask: `${order.orderMask || 'OS'} · nova (sem internet)`,
    ovStatusId: 1,
    ovProcessingId: 1,
    ovStartedAt: startedAt,
    ovCreatedAt: startedAt,
    ovCreatedUserId: str(user.id),
    ovTeamLeadId: str(user.id),
    ovEndedAt: undefined,
    orderMask: order.orderMask,
    statusDescription: 'Em Andamento',
    processingDescription: 'Rascunho',
    teamLeaderName: user.nameShort || user.nameFull,
    unitDescription: order.unitDescription,
    unitId: order.unitId,
    systemDescription: order.systemDescription,
    clientName: order.clientName,
    assetTagDescription: order.assetTagDescription,
    assetTagSubDescription: order.assetTagSubDescription,
    requestedServices: order.requestedServices,
    contractId: order.contractId,
    companyId: order.companyId,
    providerCompanyId: order.providerCompanyId,
    priorityId: order.priorityId,
    priorityCode: order.priorityCode,
    priorityDescription: order.priorityDescription,
    priorityColor: order.priorityColor,
    isFiled: false,
    servicesValue: 0,
    materialsValue: 0,
    vehiclesValue: 0,
    totalValue: 0,
    ovAssetsAmount: 0,
    ovAssetsReportedAmount: 0,
    ovAssetsDisapprovedAmount: 0,
    ovAssetsApprovedAmount: 0,
    ovAssetsRevisedAmount: 0,
});

export const OFFLINE_FLOW_OPS: Record<string, OfflineOpSpec> = {
    // startOrderVisit(order, currentUser, startedAt?, options?) — Iniciar visita (etapa 3)
    startOrderVisit: {
        visitId: a => (offlineUuidOf(a[3]) ? visitTmpIdOf(a[3]) : undefined),
        entityKey: a => `visit:${visitTmpIdOf(a[3])}:start`,
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const [order, user, startedAt] = [a[0] || {}, a[1] || {}, a[2]];
            // Mesmas regras da tela (OrderRequestView.canStartVisit) e da v3.
            if (CLOSED_ORDER_STATUS.includes(Number(order.statusId))) {
                throw new Error('Esta OS está concluída ou cancelada.');
            }
            if (order.teamLeaderId && !sameId(order.teamLeaderId, user.id)) {
                throw new Error('Só o líder designado na OS pode iniciar a visita.');
            }
            if (user.isAvailable === false || user.isOvInProgress) {
                throw new Error('Você já está em uma visita. Encerre-a antes de iniciar outra.');
            }
            const options = {
                offlineUuid: newOfflineUuid(),
                clientStartedAt: getBrazilNaiveTimestamp(),
                vehicleOfflineUuid: user.vehicleId ? newOfflineUuid() : undefined,
                // Só para montar a visita no aparelho (o serviço ignora).
                preview: {
                    order: {
                        id: str(order.id), orderMask: order.orderMask, unitId: order.unitId, unitDescription: order.unitDescription,
                        systemDescription: order.systemDescription, clientName: order.clientName,
                        assetTagDescription: order.assetTagDescription, assetTagSubDescription: order.assetTagSubDescription,
                        requestedServices: order.requestedServices, contractId: order.contractId, companyId: order.companyId,
                        providerCompanyId: order.providerCompanyId, priorityId: order.priorityId, priorityCode: order.priorityCode,
                        priorityDescription: order.priorityDescription, priorityColor: order.priorityColor,
                    },
                    user: { id: str(user.id), uuid: user.uuid, nameShort: user.nameShort, nameFull: user.nameFull, vehicleId: user.vehicleId, avatarUrl: user.avatarUrl },
                },
            };
            // Na fila só os ids (o serviço usa id/parentId e o id do líder).
            return [{ id: str(order.id), parentId: order.parentId ?? null }, { id: str(user.id) }, startedAt, options];
        },
        applyLocal: async (ctx, a) => {
            const opts = a[3] || {};
            const order = opts.preview?.order || { id: str(a[0]?.id) };
            const user = opts.preview?.user || { id: str(a[1]?.id) };
            const visitId = visitTmpIdOf(opts);
            const startedAt = a[2] || opts.clientStartedAt;

            const visit = buildLocalVisit(visitId, order, user, startedAt);
            await putRead(ctx, 'getActiveOrderVisit', [visitId], visit);
            await putRead(ctx, 'getOrderVisitById', [visitId], visit);
            // Equipe: só o líder no aparelho; o servidor aplica a regra da equipe no envio.
            await putRead(ctx, 'getOrderVisitTeam', [visitId], [
                {
                    id: `${TMP_PREFIX}team:${user.id}`, ovId: visitId, userId: str(user.id), isLeader: true, orderId: 0,
                    userName: user.nameShort || user.nameFull, userAvatarUrl: user.avatarUrl, userIsAvailable: false,
                },
            ]);
            await putRead(ctx, 'getOrderVisitAssets', [visitId], []);
            await putRead(ctx, 'getOrderVisitServices', [visitId], []);
            await putRead(ctx, 'getVisitEvaluations', [visitId], []);
            // Veículo do líder: a v3 cria a linha com este offline_uuid (Km offline acha a linha no envio).
            const vehicles: any[] = [];
            if (user.vehicleId && vehicleOfflineUuidOf(opts)) {
                const v = await findCatalogVehicle(ctx.store, user.vehicleId);
                vehicles.push({
                    id: `${TMP_PREFIX}${vehicleOfflineUuidOf(opts)}`, ovId: visitId, vehicleId: str(user.vehicleId),
                    createdUserId: str(user.id), createdAt: startedAt,
                    description: v?.description, plates: v?.plates, model: v?.model, unit: v?.unit,
                });
            }
            await putRead(ctx, 'getOrderVisitVehicles', [visitId], vehicles);
            // OS em andamento.
            await patchCachedRead<any>(ctx.store, 'getOrderById', [str(order.id)], o => (o ? { ...o, statusId: 5 } : undefined));
            // Perfil guardado: técnico "em visita" (reabrir o app offline cai na visita).
            if (user.uuid) {
                const profile = await ctx.store.get<any>(OFFLINE_COLLECTIONS.profile, str(user.uuid)).catch(() => null);
                if (profile) {
                    await ctx.store.put(OFFLINE_COLLECTIONS.profile, str(user.uuid), {
                        ...profile,
                        isAvailable: false,
                        isOvInProgress: true,
                        ovIdInProgress: visitId,
                        oIdInProgress: str(order.id),
                        ovIdInProgressMask: visit.ovMask,
                    });
                }
            }
        },
    },

    // ── Inclusões ────────────────────────────────────────────────────────────

    // addMaterialToAsset(ovAssetId, materialId, amount, valueUnit, userId, options?)
    addMaterialToAsset: {
        ovaId: a => str(a[0]),
        entityKey: a => `material:${TMP_PREFIX}${str(offlineUuidOf(a[5]))}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], a[3], a[4], { offlineUuid: newOfflineUuid() }],
        applyLocal: async (ctx, a) => {
            const [ovaId, materialId, amount, valueUnit, userId, opts] = [str(a[0]), str(a[1]), Number(a[2]), Number(a[3]), str(a[4]), a[5] || {}];
            const material = await findCatalogMaterial(ctx.store, materialId);
            const item = {
                id: `${TMP_PREFIX}${offlineUuidOf(opts)}`,
                ovaId,
                orderVisitAssetId: ovaId,
                materialId,
                amount,
                valueUnit,
                valueTotal: amount * valueUnit,
                discount: 1,
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
        entityKey: a => `service:${TMP_PREFIX}${str(offlineUuidOf(a[4]))}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], a[3] ?? 1, { offlineUuid: newOfflineUuid() }],
        applyLocal: async (ctx, a) => {
            const [visitId, csId, amount, opts] = [str(a[0]), str(a[1]), Number(a[3] ?? 1), a[4] || {}];
            const cs = await findInCachedReads<any[], any>(ctx.store, 'getContractServices', list =>
                Array.isArray(list) ? list.find(x => sameId(x?.id, csId)) : undefined,
            );
            const valueUnit = Number(cs?.valueUnit || 0);
            const discount = Number(cs?.discount !== undefined ? cs.discount : 1);
            const item = {
                id: `${TMP_PREFIX}${offlineUuidOf(opts)}`,
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

    // addAssetToOrderVisit(visitId, assetId, userId, options?)
    // Ativo incluído sem internet: nasce "tmp:<uuid>" e o relatório dele já
    // funciona offline. No envio, as operações desse ativo esperam a inclusão
    // e o "tmp:" vira o id real (offlineSync / syncEngine: isTemporaryId).
    addAssetToOrderVisit: {
        visitId: a => str(a[0]),
        ovaId: a => (offlineUuidOf(a[3]) ? ovaTmpIdOf(a[3]) : undefined),
        entityKey: a => `ova:${ovaTmpIdOf(a[3])}:insert`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], { offlineUuid: newOfflineUuid() }],
        applyLocal: async (ctx, a) => {
            const [visitId, assetId, userId, opts] = [str(a[0]), str(a[1]), str(a[2]), a[3] || {}];
            const id = ovaTmpIdOf(opts);
            const asset = await findCatalogAsset(ctx.store, assetId);
            const siblings = (await readCached<any[]>(ctx.store, 'getOrderVisitAssets', [visitId]))?.value || [];
            const sib = (Array.isArray(siblings) ? siblings.find(x => x && !isTmpId(x.id)) : undefined) || {};
            const visit = (await readCached<any>(ctx.store, 'getActiveOrderVisit', [visitId]))?.value || {};
            const companyId = sib.oCompanyId ?? visit.providerCompanyId;
            // Tipo da OS (para as atividades): de outro ativo da visita ou, no 1º
            // ativo / visita iniciada offline, da OS baixada pelo download automático.
            let orderTypeId: string | undefined = sib.orderTypeId ?? visit.orderTypeId;
            if (!orderTypeId && visit.oId) {
                const order = (await readCached<any>(ctx.store, 'getOrderById', [str(visit.oId)]))?.value;
                if (order?.typeId != null) orderTypeId = str(order.typeId);
            }

            // Mesmo formato de visitsService.getOrderVisitAssets / getOrderVisitAssetById.
            const item = {
                id,
                ovId: visitId,
                assetId,
                code: asset?.code,
                description: asset?.description || 'Ativo (sem internet)',
                brand: asset?.brand,
                model: asset?.model,
                serial: asset?.serial,
                assetTypeId: asset?.typeId,
                location: asset?.location,
                clientId: asset?.clientId,
                beforeClientId: asset?.clientId,
                afterClientId: asset?.clientId,
                clientName: asset?.clientName,
                beforeClientName: asset?.clientName,
                beforeUnitId: asset?.unitId,
                afterUnitId: asset?.unitId,
                beforeUnitDescription: asset?.unitDescriptionFull,
                afterUnitDescription: asset?.unitDescriptionFull,
                beforeUnitAssetTagId: asset?.unitAssetTagId,
                afterUnitAssetTagId: asset?.unitAssetTagId,
                beforeTagId: asset?.tagId,
                afterTagId: asset?.tagId,
                beforeTagSubId: asset?.tagSubId,
                afterTagSubId: asset?.tagSubId,
                beforeTagDescription: asset?.tagName,
                beforeTagSubDescription: asset?.tagSubName,
                beforeStatusId: asset?.statusId,
                afterStatusId: asset?.statusId,
                beforeStatusDescription: asset?.statusDescription,
                beforeStatusColor: asset?.statusColor,
                beforeStatusAt: asset?.statusAt,
                beforeLocation: asset?.location,
                afterLocation: asset?.location,
                isMoved: false,
                isFiled: false,
                processingId: 1,
                processingDescription: 'Rascunho',
                ovMask: sib.ovMask ?? visit.ovMask,
                orderMask: sib.orderMask ?? visit.orderMask,
                oTeamLeaderNameShort: sib.oTeamLeaderNameShort,
                oCompanyId: companyId,
                oContractId: sib.oContractId ?? (visit.contractId != null ? str(visit.contractId) : undefined),
                orderTypeId,
                maintenancePlanProgress: 0,
                hasRecorder: false,
                beforeRecorder: null,
                afterRecorder: null,
                beforeImgFilesNames: [],
                afterImgFilesNames: [],
                initialPhotoUrls: [],
                finalPhotoUrls: [],
                createdUserId: userId,
                createdAt: new Date(ctx.now()).toISOString(),
            };

            const hit = await patchCachedRead<any[]>(ctx.store, 'getOrderVisitAssets', [visitId], list => [...(list || []), item]);
            if (hit === undefined) await putRead(ctx, 'getOrderVisitAssets', [visitId], [item]);
            // Leituras do relatório deste ativo (nunca vieram do servidor).
            await putRead(ctx, 'getOrderVisitAssetById', [id], item);
            await putRead(ctx, 'getOrderVisitAssetActivities', [id], []);
            await putRead(ctx, 'getOrderVisitAssetMaterials', [id], []);
            await putRead(ctx, 'getMaintenanceChecklistItemsByVisit', [id], []);
            if (companyId != null) await putRead(ctx, 'getProviderCompanyByOvAssetId', [id], str(companyId));
            await patchVisit(ctx.store, visitId, v => ({ ...v, ovAssetsAmount: Number(v.ovAssetsAmount || 0) + 1 }));
        },
    },

    // removeAssetFromOrderVisit(ovaId)
    // Sem internet, só o ativo incluído offline: anula a inclusão e tudo dele
    // na fila. Remover um ativo que já está no servidor continua exigindo conexão.
    removeAssetFromOrderVisit: {
        ovaId: a => str(a[0]),
        visitId: a => visitOfListItem('getOrderVisitAssets', a[0]),
        entityKey: a => `ova:${str(a[0])}:${isTmpId(a[0]) ? 'insert' : 'remove'}`,
        prepareArgs: async a => {
            if (!isTmpId(a[0])) {
                throw new Error('Sem internet. Remover um ativo que já está no servidor só pode ser feito com conexão.');
            }
            return a;
        },
        cancelsPending: (a, p) => {
            if (!isTmpId(a[0])) return false;
            if (str((p as any).ovaId) === str(a[0])) return true;
            return p.method === 'addAssetToOrderVisit' && str(offlineUuidOf(p.args[3])) === uuidOfTmp(a[0]);
        },
        skipIfCancelled: insertWasCancelled('addAssetToOrderVisit'),
        applyLocal: async (ctx, a) => {
            const id = str(a[0]);
            let visitId = '';
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitAssets', list => {
                const hit = Array.isArray(list) ? list.find(x => sameId(x?.id, id)) : undefined;
                if (hit?.ovId) visitId = str(hit.ovId);
                return dropFromList(list, id);
            });
            if (visitId) {
                await patchVisit(ctx.store, visitId, v => ({ ...v, ovAssetsAmount: Math.max(0, Number(v.ovAssetsAmount || 0) - 1) }));
            }
        },
    },

    // addVehicleToOrderVisit(visitId, vehicleId, userId, options?)
    addVehicleToOrderVisit: {
        visitId: a => str(a[0]),
        entityKey: a => `vehicle:${TMP_PREFIX}${str(offlineUuidOf(a[3]))}`,
        skipLocalOnOnline: true,
        prepareArgs: async a => [a[0], a[1], a[2], { offlineUuid: newOfflineUuid() }],
        applyLocal: async (ctx, a) => {
            const [visitId, vehicleId, userId, opts] = [str(a[0]), str(a[1]), str(a[2]), a[3] || {}];
            const vehicle = await findCatalogVehicle(ctx.store, vehicleId);
            // Mesmo formato de visitsService.getOrderVisitVehicles (linha de Km vazia).
            const item = {
                id: `${TMP_PREFIX}${offlineUuidOf(opts)}`,
                ovId: visitId,
                vehicleId,
                recorderStart: null,
                recorderEnd: null,
                amount: 0,
                valueUnit: null,
                valueTotal: null,
                createdUserId: userId,
                createdAt: new Date(ctx.now()).toISOString(),
                costType: 'odometer',
                description: vehicle?.description || 'Veículo (sem internet)',
                plates: vehicle?.plates,
                model: vehicle?.description,
            };
            const hit = await patchCachedRead<any[]>(ctx.store, 'getOrderVisitVehicles', [visitId], list => [...(list || []), item]);
            if (hit === undefined) {
                await ctx.store.put(OFFLINE_COLLECTIONS.reads, cacheKey('getOrderVisitVehicles', [visitId]), {
                    value: [item],
                    savedAt: ctx.now(),
                });
                await registerReadKey(ctx.store, 'getOrderVisitVehicles', [visitId]);
            }
        },
    },

    // removeVehicleFromOrderVisit(visitVehicleId)
    removeVehicleFromOrderVisit: {
        entityKey: a => `vehicle:${str(a[0])}`,
        visitId: a => visitOfListItem('getOrderVisitVehicles', a[0]),
        tmpIdTable: 'orders_visits_vehicles',
        cancelsPending: cancelsTmpItem('addVehicleToOrderVisit', 3),
        skipIfCancelled: insertWasCancelled('addVehicleToOrderVisit'),
        applyLocal: async (ctx, a) => {
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitVehicles', list => dropFromList(list, a[0]));
        },
    },

    // ── Equipe ───────────────────────────────────────────────────────────────

    // addTeamMember(visitId, userId, options?)
    addTeamMember: {
        visitId: a => str(a[0]),
        entityKey: a => teamMemberKey(a[0], a[1]),
        skipLocalOnOnline: true,
        // Na fila a inclusão é idempotente: reenvio após queda não vira "já faz parte".
        prepareArgs: async a => [a[0], a[1], { idempotent: true }],
        applyLocal: async (ctx, a) => {
            const [visitId, userId] = [str(a[0]), str(a[1])];
            const user = await findInCachedReads<any[], any>(ctx.store, 'getUsers', list =>
                Array.isArray(list) ? list.find(u => sameId(u?.id, userId)) : undefined,
            );
            await patchCachedRead<any[]>(ctx.store, 'getOrderVisitTeam', [visitId], list => {
                const team = Array.isArray(list) ? list : [];
                if (team.some(m => sameId(m?.userId, userId))) return undefined;
                const member = {
                    id: `${TMP_PREFIX}team:${userId}`,
                    ovId: visitId,
                    userId,
                    isLeader: false,
                    orderId: team.length + 1,
                    userName: user?.nameShort || user?.nameFull || 'Membro (sem internet)',
                    userIsAvailable: false,
                    userAvatarUrl: user?.avatarUrl,
                };
                return [...team, member];
            });
        },
    },

    // removeTeamMember(visitId, userId)
    removeTeamMember: {
        visitId: a => str(a[0]),
        entityKey: a => teamMemberKey(a[0], a[1]),
        // Remover quem foi incluído sem internet e ainda não subiu: anula a inclusão.
        cancelsPending: (a, p) =>
            p.method === 'addTeamMember' && sameId(p.args[0], a[0]) && sameId(p.args[1], a[1]),
        skipIfCancelled: true,
        applyLocal: async (ctx, a) => {
            const [visitId, userId] = [str(a[0]), str(a[1])];
            await patchCachedRead<any[]>(ctx.store, 'getOrderVisitTeam', [visitId], list => {
                if (!Array.isArray(list)) return undefined;
                const next = list.filter(m => !sameId(m?.userId, userId));
                return next.length === list.length ? undefined : next;
            });
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
            args[9] = { clientOpId: newOfflineUuid(), clientEndedAt: getBrazilNaiveTimestamp() };
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
