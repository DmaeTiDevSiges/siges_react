/**
 * Download automático offline — o que baixar (função pura, testada).
 *
 * Entrada: OSs abertas da empresa + o que já foi baixado (quando e em qual
 * versão) + as versões atuais do banco (fn_offline_change_versions, 20261122).
 * Saída: unidades/clientes/tipos de OS/OSs a baixar e unidades a apagar.
 * Unidade que se repete em várias OSs é baixada uma vez só.
 *
 * Um item é baixado de novo quando: é novo, a versão do banco mudou (inclusão,
 * alteração ou exclusão) ou passou do prazo de segurança (maxAgeMs).
 */

export interface OpenOrderRef {
    id: string;
    unitId: string | null;
    clientId: string | null;
    typeId: string | null;
    updatedAt: string | null;
}

/** Versões do banco (vazio/null = sem a função 20261122 → só o prazo vale). */
export interface RemoteVersions {
    units: Record<string, string>;
    assetTypes: Record<string, string>;
    orderTypes: Record<string, string>;
    materials: string | null;
    vehicles: string | null;
    users: string | null;
}

/** O que já está no aparelho: id → quando foi baixado (ms) e em qual versão. */
export interface AutoSyncSaved {
    userId: string;
    companyId: string;
    units: Record<string, number>;
    clients: Record<string, number>;
    orderTypes: Record<string, number>;
    assetTypes: Record<string, number>;
    /** OS → updated_at baixado (muda = baixa de novo). */
    orders: Record<string, string>;
    visits: Record<string, number>;
    /** Lista de usuários baixada em (ms). */
    usersAt?: number;
    versions: {
        units: Record<string, string>;
        assetTypes: Record<string, string>;
        orderTypes: Record<string, string>;
        materials?: string;
        vehicles?: string;
        users?: string;
    };
    lastSuccessAt?: number;
}

export const emptyAutoSyncSaved = (userId: string, companyId: string): AutoSyncSaved => ({
    userId,
    companyId,
    units: {},
    clients: {},
    orderTypes: {},
    assetTypes: {},
    orders: {},
    visits: {},
    versions: { units: {}, assetTypes: {}, orderTypes: {} },
});

export interface AutoSyncPlan {
    unitsToFetch: string[];
    unitsToDrop: string[];
    /** Unidades necessárias (para juntar os tipos de ativo de todas, baixadas agora ou antes). */
    unitsNeeded: string[];
    clientsToFetch: string[];
    orderTypesToFetch: string[];
    ordersToFetch: string[];
    ordersToDrop: string[];
    /** Catálogos gerais com versão diferente (baixar mesmo com menos de 1 dia). */
    materialsChanged: boolean;
    vehiclesChanged: boolean;
    usersChanged: boolean;
}

const distinct = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v && v !== '0'))).sort();

const stale = (savedAt: number | undefined, now: number, maxAgeMs: number) =>
    savedAt === undefined || now - savedAt >= maxAgeMs;

/** Versão do banco diferente da baixada (sem versão do banco = não sabe → false). */
const changed = (remote: string | null | undefined, saved: string | undefined) =>
    remote !== undefined && remote !== null && remote !== saved;

export const planAutoSync = (
    saved: AutoSyncSaved,
    openOrders: OpenOrderRef[],
    now: number,
    maxAgeMs: number,
    remote?: RemoteVersions | null,
): AutoSyncPlan => {
    const unitsNeeded = distinct(openOrders.map(o => o.unitId));
    const clientsNeeded = distinct(openOrders.map(o => o.clientId));
    const typesNeeded = distinct(openOrders.map(o => o.typeId));
    const openIds = new Set(openOrders.map(o => o.id));
    const v = saved.versions;

    return {
        unitsNeeded,
        unitsToFetch: unitsNeeded.filter(
            u => stale(saved.units[u], now, maxAgeMs) || changed(remote?.units[u], v.units[u]),
        ),
        unitsToDrop: Object.keys(saved.units).filter(u => !unitsNeeded.includes(u)).sort(),
        clientsToFetch: clientsNeeded.filter(c => stale(saved.clients[c], now, maxAgeMs)),
        orderTypesToFetch: typesNeeded.filter(
            t => stale(saved.orderTypes[t], now, maxAgeMs) || changed(remote?.orderTypes[t], v.orderTypes[t]),
        ),
        ordersToFetch: openOrders.filter(o => saved.orders[o.id] !== (o.updatedAt ?? '')).map(o => o.id),
        ordersToDrop: Object.keys(saved.orders).filter(id => !openIds.has(id)),
        materialsChanged: changed(remote?.materials, v.materials),
        vehiclesChanged: changed(remote?.vehicles, v.vehicles),
        usersChanged: changed(remote?.users, v.users),
    };
};

/** Tipos de ativo (planos de manutenção) a baixar, a partir dos ativos das unidades. */
export const assetTypesToFetch = (
    saved: AutoSyncSaved,
    assets: { typeId?: string | null }[],
    now: number,
    maxAgeMs: number,
    remote?: RemoteVersions | null,
): string[] =>
    distinct(assets.map(a => a.typeId)).filter(
        t => stale(saved.assetTypes[t], now, maxAgeMs) || changed(remote?.assetTypes[t], saved.versions.assetTypes[t]),
    );
