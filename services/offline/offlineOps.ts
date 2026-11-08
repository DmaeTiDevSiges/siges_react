import type { OfflineStore } from './store/offlineStore';
import { findInCachedReads, patchCachedRead, patchCachedReadsOf, readCached } from './readCache';

/**
 * Operações que podem ser feitas SEM internet (F2 — grupo B do inventário).
 *
 * Todas só DEFINEM valores ("comentário = X", "atividade marcada = sim"):
 * reenviar a mesma operação dá o mesmo resultado. Por isso a fila reexecuta
 * o próprio método do serviço, sem RPC novo. Inserts (material novo, serviço
 * novo…) duplicariam linhas — ficam para a F4, com client_uuid.
 *
 * Para cada método:
 *   ovaId(args)          → ativo da visita afetado (checagem da trava no envio)
 *   entityKey(args)      → registro alterado (ordem/erro na fila)
 *   applyLocal(store, a) → atualiza as respostas em cache que as telas leem e
 *                          devolve o que o método devolveria (a tela usa)
 */

export interface OfflineOpContext {
    store: OfflineStore;
    now: () => number;
    tempId: () => string;
}

export interface OfflineOpSpec {
    ovaId?: (args: any[]) => string | undefined | Promise<string | undefined>;
    entityKey: (args: any[]) => string;
    applyLocal: (ctx: OfflineOpContext, args: any[]) => Promise<unknown>;
    /**
     * F3 — antes de entrar na fila: troca File/base64 por referência a um
     * arquivo salvo no aparelho e fixa o nome final (offlineFileOps.ts).
     * applyLocal recebe os argumentos JÁ preparados.
     */
    prepareArgs?: (args: any[]) => Promise<any[]>;
    /** F3 — operações pendentes que esta anula (ex.: remover foto que nem subiu). */
    cancelsPending?: (args: any[], pending: { method: string; args: unknown[] }) => boolean;
    /** Se anulou pendentes, não precisa ir ao servidor (função: decide pelas anuladas). */
    skipIfCancelled?: boolean | ((cancelled: { method: string; args: unknown[] }[]) => boolean);
    /** F4 — visita da operação (barreiras de Relatar/Encerrar). Sem isto, vem do ativo. */
    visitId?: (args: any[]) => string | undefined | Promise<string | undefined>;
    /** F4 — só envia depois de todas as anteriores do mesmo ativo/visita. */
    barrier?: 'ova' | 'visit';
    /**
     * F4 — args[0] pode ser o id temporário de uma linha criada offline
     * ("tmp:<client_uuid>"); no envio vira o id real, procurado nesta tabela.
     */
    tmpIdTable?: string;
    /** F4 — depois de enviada (ex.: soltar a trava ao relatar o ativo). */
    afterSync?: (args: any[], helpers: { unlockOva: (ovaId: string) => Promise<void> }) => Promise<void>;
    /** Online deu certo: não mexe no cache (a leitura seguinte traz o servidor). */
    skipLocalOnOnline?: boolean;
}

export const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
export const sameId = (a: unknown, b: unknown) => str(a) !== '' && str(a) === str(b);

/**
 * Item do checklist (ativo + atividade). Upload da foto, upsert e remoção do
 * mesmo item usam a MESMA chave: se a foto falhar, o upsert que a cita espera.
 */
export const checklistKey = (ovaId: unknown, activityId: unknown) => `ova:${str(ovaId)}:checklist:${str(activityId)}`;

/** Atualiza um item (por id) dentro de uma lista; undefined = lista não mudou. */
export const patchList = <T extends { id?: unknown }>(list: T[] | null | undefined, id: unknown, patch: (item: T) => T) => {
    if (!Array.isArray(list)) return undefined;
    let changed = false;
    const next = list.map(item => {
        if (!sameId(item?.id, id)) return item;
        changed = true;
        return patch(item);
    });
    return changed ? next : undefined;
};

// Colunas de orders_visits_assets → campos do OrderVisitAssetView (visitsService).
const OVA_FIELD_MAP: Record<string, string> = {
    before_comments: 'beforeComments',
    after_comments: 'afterComments',
    has_recorder: 'hasRecorder',
    before_recorder: 'beforeRecorder',
    after_recorder: 'afterRecorder',
    is_moved: 'isMoved',
    after_status_id: 'afterStatusId',
    after_unit_id: 'afterUnitId',
    after_tag_id: 'afterTagId',
    after_tag_sub_id: 'afterTagSubId',
    after_priority_id: 'afterPriorityId',
    moved_comments: 'movedComments',
    after_unit_asset_tag_id: 'afterUnitAssetTagId',
    after_client_id: 'afterClientId',
    maintenance_plan_id: 'maintenancePlanId',
    maintenance_plan_progress: 'maintenancePlanProgress',
};

const toOvaPatch = (updates: Record<string, unknown>) => {
    const patch: Record<string, unknown> = {};
    for (const [col, value] of Object.entries(updates || {})) {
        const field = OVA_FIELD_MAP[col];
        if (!field) continue;
        patch[field] = col.endsWith('_id') && value !== null && value !== undefined && col !== 'after_priority_id' ? String(value) : value;
    }
    return patch;
};

/** Aplica o patch no ativo (getOrderVisitAssetById) e na lista da visita. */
export const patchOva = async (ctx: OfflineOpContext, ovaId: string, patch: Record<string, unknown>) => {
    if (!Object.keys(patch).length) return;
    const updated = await patchCachedRead<any>(ctx.store, 'getOrderVisitAssetById', [ovaId], v =>
        v ? { ...v, ...patch } : undefined,
    );
    const ovId = updated?.ovId;
    if (ovId) {
        await patchCachedRead<any[]>(ctx.store, 'getOrderVisitAssets', [String(ovId)], list =>
            patchList(list, ovaId, item => ({ ...item, ...patch })),
        );
    } else {
        await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitAssets', list =>
            patchList(list, ovaId, item => ({ ...item, ...patch })),
        );
    }
};

/** Material da visita → ativo (para a trava), procurando nas listas em cache. */
export const ovaOfMaterial = (ctx: { store: OfflineStore }, materialId: string) =>
    findInCachedReads<any[], string>(ctx.store, 'getOrderVisitAssetMaterials', (list, args) =>
        Array.isArray(list) && list.some(m => sameId(m?.id, materialId)) ? str(args[0]) : undefined,
    );

export const mergeChecklistItem = (
    ctx: OfflineOpContext,
    existing: any | undefined,
    ovaId: string,
    planId: string,
    activityId: string,
    updates: Record<string, unknown>,
) => ({
    ...(existing || {
        id: ctx.tempId(),
        orderVisitAssetId: ovaId,
        activityId,
        isDeleted: false,
        maintenancePlanId: planId,
        createdAt: new Date(ctx.now()).toISOString(),
    }),
    ...Object.fromEntries(
        (['status', 'comments', 'imgFilePath', 'imgFilesNames'] as const)
            .filter(k => updates?.[k] !== undefined)
            .map(k => [k, updates[k]]),
    ),
    isDeleted: false,
});

let storeRef: OfflineStore | null = null;

/** Visita de um item de lista em cache (lista por visita: args[0] = visitId). */
export const visitOfListItem = async (method: string, itemId: unknown): Promise<string | undefined> =>
    storeRef
        ? findInCachedReads<any[], string>(storeRef, method, (list, args) =>
              Array.isArray(list) && list.some(x => sameId(x?.id, itemId)) ? str(args[0]) : undefined,
          )
        : undefined;

/** Visita de um ativo da visita, pelo cache (getOrderVisitAssetById → ovId). */
export const visitOfOva = async (ovaId: unknown): Promise<string | undefined> => {
    if (!storeRef || !str(ovaId)) return undefined;
    const direct = await readCached<any>(storeRef, 'getOrderVisitAssetById', [str(ovaId)]).catch(() => null);
    if (direct?.value?.ovId) return str(direct.value.ovId);
    return visitOfListItem('getOrderVisitAssets', ovaId);
};
/** O offlineLayer injeta o store usado para descobrir o ativo de um material. */
export const setOfflineOpsStore = (store: OfflineStore) => {
    storeRef = store;
};

export const getOfflineOpsStore = (): OfflineStore | null => storeRef;

export const OFFLINE_OPS: Record<string, OfflineOpSpec> = {
    // updateOrderVisitAsset(id, updates)
    updateOrderVisitAsset: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:fields`,
        applyLocal: async (ctx, a) => {
            await patchOva(ctx, str(a[0]), toOvaPatch(a[1] || {}));
        },
    },

    // updateOrderVisitAssetPlan(ovAssetId, planId)
    updateOrderVisitAssetPlan: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:plan`,
        applyLocal: async (ctx, a) => {
            await patchOva(ctx, str(a[0]), { maintenancePlanId: a[1] ? str(a[1]) : undefined });
        },
    },

    // updateOrderVisitAssetProgress(ovAssetId, progress)
    updateOrderVisitAssetProgress: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:progress`,
        applyLocal: async (ctx, a) => {
            await patchOva(ctx, str(a[0]), { maintenancePlanProgress: a[1] });
        },
    },

    // toggleOrderVisitAssetActivity(ovAssetId, activityId, userId, isSelected)
    toggleOrderVisitAssetActivity: {
        ovaId: a => str(a[0]),
        entityKey: a => `ova:${str(a[0])}:activity:${str(a[1])}`,
        applyLocal: async (ctx, a) => {
            const [ovaId, activityId, userId, isSelected] = [str(a[0]), str(a[1]), str(a[2]), !!a[3]];
            const catalog = isSelected
                ? await findInCachedReads<any[], any>(ctx.store, 'getActivitiesByOrderType', list =>
                      Array.isArray(list) ? list.find(x => sameId(x?.id, activityId)) : undefined,
                  )
                : undefined;
            await patchCachedRead<any[]>(ctx.store, 'getOrderVisitAssetActivities', [ovaId], list => {
                const current = Array.isArray(list) ? list : [];
                const without = current.filter(x => !sameId(x?.activityId, activityId) || x?.maintenancePlanId);
                if (!isSelected) return without;
                return [
                    ...without,
                    {
                        id: ctx.tempId(),
                        orderVisitAssetId: ovaId,
                        activityId,
                        isDeleted: false,
                        createdUserId: userId,
                        createdAt: new Date(ctx.now()).toISOString(),
                        activityDescription: catalog?.description,
                        activityCode: catalog?.code,
                    },
                ];
            });
        },
    },

    // upsertMaintenanceChecklistItem(ovAssetId, planId, activityId, userId, updates) → item
    upsertMaintenanceChecklistItem: {
        ovaId: a => str(a[0]),
        entityKey: a => checklistKey(a[0], a[2]),
        applyLocal: async (ctx, a) => {
            const [ovaId, planId, activityId, , updates] = [str(a[0]), str(a[1]), str(a[2]), a[3], a[4] || {}];
            let result: any;
            const upsert = (list: any[] | null | undefined) => {
                const current = Array.isArray(list) ? list : [];
                const existing = current.find(x => sameId(x?.activityId, activityId) && (!x?.maintenancePlanId || sameId(x.maintenancePlanId, planId)));
                const merged = mergeChecklistItem(ctx, existing ?? result, ovaId, planId, activityId, updates);
                result = merged;
                return existing ? current.map(x => (x === existing ? merged : x)) : [...current, merged];
            };
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItems', [ovaId, planId], upsert);
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItemsByVisit', [ovaId], upsert);
            return result ?? mergeChecklistItem(ctx, undefined, ovaId, planId, activityId, updates);
        },
    },

    // deleteMaintenanceChecklistItem(ovAssetId, planId, activityId)
    deleteMaintenanceChecklistItem: {
        ovaId: a => str(a[0]),
        entityKey: a => checklistKey(a[0], a[2]),
        applyLocal: async (ctx, a) => {
            const [ovaId, planId, activityId] = [str(a[0]), str(a[1]), str(a[2])];
            const drop = (list: any[] | null | undefined) =>
                Array.isArray(list)
                    ? list.filter(x => !(sameId(x?.activityId, activityId) && (!x?.maintenancePlanId || sameId(x.maintenancePlanId, planId))))
                    : undefined;
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItems', [ovaId, planId], drop);
            await patchCachedRead<any[]>(ctx.store, 'getMaintenanceChecklistItemsByVisit', [ovaId], drop);
        },
    },

    // updateMaterialInAsset(id, { amount, discount, valueUnit })
    updateMaterialInAsset: {
        ovaId: a => (storeRef ? ovaOfMaterial({ store: storeRef }, str(a[0])) : undefined),
        entityKey: a => `material:${str(a[0])}`,
        tmpIdTable: 'orders_visits_assets_materials',
        applyLocal: async (ctx, a) => {
            const [id, u] = [str(a[0]), (a[1] || {}) as { amount?: number; discount?: number; valueUnit?: number }];
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitAssetMaterials', list =>
                patchList(list, id, m => {
                    const amount = u.amount ?? m.amount;
                    const valueUnit = u.valueUnit ?? m.valueUnit;
                    return {
                        ...m,
                        amount,
                        discount: u.discount ?? m.discount,
                        valueUnit,
                        valueTotal: Number(amount) * Number(valueUnit || 0),
                    };
                }),
            );
        },
    },

    // updateOrderVisitService(ovServiceId, { amount, discount, valueUnit })
    updateOrderVisitService: {
        entityKey: a => `service:${str(a[0])}`,
        visitId: a => visitOfListItem('getOrderVisitServices', a[0]),
        tmpIdTable: 'orders_visits_services',
        applyLocal: async (ctx, a) => {
            const [id, u] = [str(a[0]), (a[1] || {}) as { amount?: number; discount?: number; valueUnit?: number }];
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitServices', list =>
                patchList(list, id, s => {
                    const amount = u.amount ?? s.amount;
                    const discount = u.discount ?? s.discount;
                    const valueUnit = u.valueUnit ?? s.valueUnit;
                    // Mesma conta de visitsService.updateOrderVisitService.
                    return { ...s, amount, discount, valueUnit, valueTotal: Number(amount) * Number(valueUnit || 0) * (Number(discount) || 1) };
                }),
            );
        },
    },

    // updateVehicleKm(visitVehicleId, kmInitial?, kmFinal?)
    updateVehicleKm: {
        entityKey: a => `vehicle:${str(a[0])}`,
        visitId: a => visitOfListItem('getOrderVisitVehicles', a[0]),
        applyLocal: async (ctx, a) => {
            const [id, start, end] = [str(a[0]), a[1], a[2]];
            await patchCachedReadsOf<any[]>(ctx.store, 'getOrderVisitVehicles', list =>
                patchList(list, id, v => ({
                    ...v,
                    ...(start !== undefined ? { recorderStart: start } : {}),
                    ...(end !== undefined ? { recorderEnd: end } : {}),
                })),
            );
        },
    },

    // updateAssetAlert(id, alert) → AssetAlert
    updateAssetAlert: {
        entityKey: a => `alert:${str(a[0])}`,
        applyLocal: async (ctx, a) => {
            const [id, patch] = [str(a[0]), (a[1] || {}) as Record<string, unknown>];
            let merged: any;
            await patchCachedReadsOf<any[]>(ctx.store, 'getAssetAlerts', list =>
                patchList(list, id, al => (merged = { ...al, ...patch })),
            );
            return merged ?? { id, ...patch };
        },
    },
};

/** Acrescenta especificações (offlineFileOps, F3) sem esta lista importar Capacitor. */
export const registerOfflineOps = (specs: Record<string, OfflineOpSpec>): void => {
    Object.assign(OFFLINE_OPS, specs);
};

export const opEntityKey = (method: string, args: unknown[]): string =>
    OFFLINE_OPS[method]?.entityKey(args as any[]) ?? `${method}:${JSON.stringify(args?.[0] ?? null)}`;
