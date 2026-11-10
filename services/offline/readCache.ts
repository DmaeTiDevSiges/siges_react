import { OFFLINE_COLLECTIONS, type OfflineStore } from './store/offlineStore';

/**
 * Cache de leitura do modo offline — "rede primeiro, cache como reserva".
 *
 *   online  → chama o serviço; deu certo → devolve e guarda no cache
 *             falhou por rede (contador mudou ou lançou) → devolve o cache
 *   offline → devolve o cache; sem cache → OfflineCacheMissError
 *
 * Erro que NÃO é de rede (permissão, validação) continua subindo: o cache
 * não esconde problemas reais.
 */

export interface ReadCacheDeps {
    store: OfflineStore;
    isOnline: () => boolean;
    failureCount: () => number;
    now?: () => number;
    onWriteError?: (error: unknown) => void;
}

export interface CachedRead<T = unknown> {
    value: T;
    savedAt: number;
}

export class OfflineCacheMissError extends Error {
    readonly method: string;
    constructor(method: string) {
        super('Sem internet e estes dados ainda não foram baixados para o aparelho. Com internet, o download é automático.');
        this.name = 'OfflineCacheMissError';
        this.method = method;
    }
}

/**
 * Argumentos normalizados para a chave: número vira texto (a tela passa
 * "123", o preparo pode passar 123), undefined vira null e os undefined do
 * final saem (getX(id) e getX(id, undefined) são a mesma chamada).
 */
export const normalizeArgs = (args: unknown[]): unknown[] => {
    const norm = (v: unknown): unknown => {
        if (v === undefined || v === null) return null;
        if (typeof v === 'number' || typeof v === 'bigint') return String(v);
        if (Array.isArray(v)) return v.map(norm);
        if (typeof v === 'object') {
            const out: Record<string, unknown> = {};
            for (const k of Object.keys(v as object).sort()) {
                const val = (v as Record<string, unknown>)[k];
                if (val !== undefined) out[k] = norm(val);
            }
            return out;
        }
        return v;
    };
    const list = [...args];
    while (list.length && list[list.length - 1] === undefined) list.pop();
    return list.map(norm);
};

export const cacheKey = (method: string, args: unknown[]): string =>
    `${method}:${JSON.stringify(normalizeArgs(args))}`;

export const readCached = async <T>(
    store: OfflineStore,
    method: string,
    args: unknown[],
): Promise<CachedRead<T> | null> =>
    store.get<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, cacheKey(method, args));

export const cachedRead = async <T>(
    deps: ReadCacheDeps,
    method: string,
    args: unknown[],
    fetcher: () => Promise<T>,
): Promise<T> => {
    const key = cacheKey(method, args);
    const fromCache = async () => {
        try {
            return await deps.store.get<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key);
        } catch {
            return null;
        }
    };

    if (!deps.isOnline()) {
        const hit = await fromCache();
        if (hit) return hit.value;
        throw new OfflineCacheMissError(method);
    }

    const before = deps.failureCount();
    let value: T;
    try {
        value = await fetcher();
    } catch (error) {
        if (deps.failureCount() !== before || !deps.isOnline()) {
            const hit = await fromCache();
            if (hit) return hit.value;
        }
        throw error;
    }

    if (deps.failureCount() !== before) {
        // O serviço "engoliu" uma falha de rede (devolveu [] / null). Não grava.
        const hit = await fromCache();
        return hit ? hit.value : value;
    }

    // Grava sem segurar a tela.
    const entry: CachedRead<T> = { value, savedAt: (deps.now ?? Date.now)() };
    deps.store
        .put(OFFLINE_COLLECTIONS.reads, key, entry)
        .then(() => registerReadKey(deps.store, method, args))
        .catch(e => deps.onWriteError?.(e));
    return value;
};

// ── Índice de chaves por método (F2) ─────────────────────────────────────────
// Uma operação offline às vezes só sabe o id do registro (ex.: material 12) e
// precisa achar em qual lista em cache ele está. O índice guarda, por método,
// os argumentos de cada resposta salva. Persistido: sobrevive a reabrir o app.

const INDEX_COLLECTION = 'reads_index';
type IndexDoc = { entries: [string, unknown[]][] };
const memIndex = new Map<string, Map<string, unknown[]>>();
const loadedIndex = new WeakMap<OfflineStore, Set<string>>();

const indexFor = async (store: OfflineStore, method: string): Promise<Map<string, unknown[]>> => {
    let loaded = loadedIndex.get(store);
    if (!loaded) {
        loaded = new Set();
        loadedIndex.set(store, loaded);
    }
    const memKey = method;
    let map = memIndex.get(memKey);
    if (!map) {
        map = new Map();
        memIndex.set(memKey, map);
    }
    if (!loaded.has(method)) {
        loaded.add(method);
        try {
            const doc = await store.get<IndexDoc>(INDEX_COLLECTION, method);
            for (const [k, a] of doc?.entries || []) if (!map.has(k)) map.set(k, a);
        } catch {
            /* índice ilegível: segue com o da memória */
        }
    }
    return map;
};

export const registerReadKey = async (store: OfflineStore, method: string, args: unknown[]): Promise<void> => {
    const map = await indexFor(store, method);
    const key = cacheKey(method, args);
    if (map.has(key)) return;
    map.set(key, normalizeArgs(args));
    await store.put<IndexDoc>(INDEX_COLLECTION, method, { entries: Array.from(map.entries()) });
};

/** Só para testes. */
export const resetReadIndex = (): void => {
    memIndex.clear();
};

/** Altera a resposta em cache de UMA chamada (argumentos conhecidos). */
export const patchCachedRead = async <T>(
    store: OfflineStore,
    method: string,
    args: unknown[],
    mutate: (value: T) => T | undefined,
): Promise<T | undefined> => {
    const key = cacheKey(method, args);
    const hit = await store.get<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key);
    if (!hit) return undefined;
    const next = mutate(hit.value);
    if (next === undefined) return undefined;
    await store.put<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key, { value: next, savedAt: hit.savedAt });
    return next;
};

/**
 * Altera todas as respostas em cache de um método (ex.: todas as listas de
 * materiais). `mutate` devolve undefined quando aquela lista não muda.
 */
export const patchCachedReadsOf = async <T>(
    store: OfflineStore,
    method: string,
    mutate: (value: T, args: unknown[]) => T | undefined,
): Promise<number> => {
    const map = await indexFor(store, method);
    let changed = 0;
    for (const [key, args] of map.entries()) {
        const hit = await store.get<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key);
        if (!hit) continue;
        const next = mutate(hit.value, args);
        if (next === undefined) continue;
        await store.put<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key, { value: next, savedAt: hit.savedAt });
        changed++;
    }
    return changed;
};

/** Procura um item em todas as respostas em cache de um método. */
export const findInCachedReads = async <T, R>(
    store: OfflineStore,
    method: string,
    pick: (value: T, args: unknown[]) => R | undefined,
): Promise<R | undefined> => {
    const map = await indexFor(store, method);
    for (const [key, args] of map.entries()) {
        const hit = await store.get<CachedRead<T>>(OFFLINE_COLLECTIONS.reads, key);
        if (!hit) continue;
        const found = pick(hit.value, args);
        if (found !== undefined) return found;
    }
    return undefined;
};
