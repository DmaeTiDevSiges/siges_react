import type { OfflineStore } from './offlineStore';

/**
 * Store do navegador (desenvolvimento) em IndexedDB.
 *
 * Substitui o localStorage, que tem ~5 MB: o download automático (todas as
 * unidades, catálogos, visitas) enchia o localStorage e a fila offline deixava
 * de gravar ("exceeded the quota"). IndexedDB aceita centenas de MB.
 * No APK continua o Filesystem (filesystemStore).
 */
const DB_NAME = 'siges_offline';
const DB_VERSION = 1;
const STORE = 'docs';
const BY_COLLECTION = 'byCollection';

interface Row {
    id: string; // `${collection}\u0000${key}`
    collection: string;
    key: string;
    value: unknown;
    savedAt: number;
}

const rowId = (collection: string, key: string) => `${collection}\u0000${key}`;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const os = db.createObjectStore(STORE, { keyPath: 'id' });
                    os.createIndex(BY_COLLECTION, 'collection', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => {
                dbPromise = null;
                reject(req.error);
            };
        });
    }
    return dbPromise;
};

const run = async <T>(mode: IDBTransactionMode, fn: (os: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> => {
    const db = await openDb();
    return new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const os = tx.objectStore(STORE);
        const req = fn(os);
        let result: T | undefined;
        if (req) req.onsuccess = () => { result = req.result; };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

/** IndexedDB disponível neste navegador? */
export const isIndexedDbAvailable = (): boolean => {
    try {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
        return false;
    }
};

/**
 * Libera o localStorage do cache offline antigo (prefixo siges_offline:). Ele
 * disputava espaço com a sessão do login e com o resto do app.
 */
const purgeLegacyLocalStorageCache = () => {
    try {
        const del: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k?.startsWith('siges_offline:')) del.push(k);
        }
        del.forEach(k => window.localStorage.removeItem(k));
    } catch {
        /* sem localStorage */
    }
};

export const createIndexedDbStore = (): OfflineStore => {
    purgeLegacyLocalStorageCache();
    return {
        async get<T>(collection: string, key: string) {
            const row = await run<Row>('readonly', os => os.get(rowId(collection, key)) as IDBRequest<Row>);
            return row ? (row.value as T) : null;
        },
        async put<T>(collection: string, key: string, value: T) {
            const row: Row = { id: rowId(collection, key), collection, key, value, savedAt: Date.now() };
            await run('readwrite', os => os.put(row));
        },
        async delete(collection, key) {
            await run('readwrite', os => os.delete(rowId(collection, key)));
        },
        async keys(collection) {
            const rows = await run<Row[]>('readonly', os => os.index(BY_COLLECTION).getAll(collection) as IDBRequest<Row[]>);
            return (rows || []).map(r => r.key);
        },
        async clear(collection) {
            if (!collection) {
                await run('readwrite', os => os.clear());
                return;
            }
            const ids = await run<IDBValidKey[]>('readonly', os => os.index(BY_COLLECTION).getAllKeys(collection));
            if (!ids?.length) return;
            await run('readwrite', os => { ids.forEach(id => os.delete(id)); });
        },
    };
};
