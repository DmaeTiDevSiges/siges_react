/**
 * Download automático offline — o que baixar (função pura, testada).
 *
 * Entrada: OSs abertas da empresa + o que já foi baixado (e quando).
 * Saída: unidades/clientes/tipos de OS/OSs a baixar e unidades a apagar.
 * Unidade que se repete em várias OSs é baixada uma vez só.
 */

export interface OpenOrderRef {
    id: string;
    unitId: string | null;
    clientId: string | null;
    typeId: string | null;
    updatedAt: string | null;
}

/** O que já está no aparelho: id → quando foi baixado (ms). */
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
}

const distinct = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v && v !== '0'))).sort();

const stale = (savedAt: number | undefined, now: number, maxAgeMs: number) =>
    savedAt === undefined || now - savedAt >= maxAgeMs;

export const planAutoSync = (
    saved: AutoSyncSaved,
    openOrders: OpenOrderRef[],
    now: number,
    maxAgeMs: number,
): AutoSyncPlan => {
    const unitsNeeded = distinct(openOrders.map(o => o.unitId));
    const clientsNeeded = distinct(openOrders.map(o => o.clientId));
    const typesNeeded = distinct(openOrders.map(o => o.typeId));
    const openIds = new Set(openOrders.map(o => o.id));

    return {
        unitsNeeded,
        unitsToFetch: unitsNeeded.filter(u => stale(saved.units[u], now, maxAgeMs)),
        unitsToDrop: Object.keys(saved.units).filter(u => !unitsNeeded.includes(u)).sort(),
        clientsToFetch: clientsNeeded.filter(c => stale(saved.clients[c], now, maxAgeMs)),
        orderTypesToFetch: typesNeeded.filter(t => stale(saved.orderTypes[t], now, maxAgeMs)),
        ordersToFetch: openOrders.filter(o => saved.orders[o.id] !== (o.updatedAt ?? '')).map(o => o.id),
        ordersToDrop: Object.keys(saved.orders).filter(id => !openIds.has(id)),
    };
};

/** Tipos de ativo (planos de manutenção) a baixar, a partir dos ativos das unidades. */
export const assetTypesToFetch = (
    saved: AutoSyncSaved,
    assets: { typeId?: string | null }[],
    now: number,
    maxAgeMs: number,
): string[] => distinct(assets.map(a => a.typeId)).filter(t => stale(saved.assetTypes[t], now, maxAgeMs));
