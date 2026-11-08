import { hashKey, type OfflineStore, type StoredDoc } from './offlineStore';

/**
 * Store do navegador — só para DESENVOLVIMENTO (testar o modo offline com o
 * DevTools em "Offline"). Em produção web o modo offline fica desligado.
 * localStorage tem ~5 MB: se encher, a gravação falha e a leitura segue online.
 */
const PREFIX = 'siges_offline';
const itemKey = (collection: string, key: string) => `${PREFIX}:${collection}:${hashKey(key)}`;

const safe = <T>(fn: () => T, fallback: T): T => {
    try {
        return fn();
    } catch {
        return fallback;
    }
};

export const createLocalStorageStore = (): OfflineStore => ({
    async get<T>(collection: string, key: string) {
        const raw = safe(() => window.localStorage.getItem(itemKey(collection, key)), null);
        if (!raw) return null;
        const doc = safe(() => JSON.parse(raw) as StoredDoc<T>, null);
        return doc && doc.key === key ? doc.value : null;
    },
    async put<T>(collection: string, key: string, value: T) {
        const doc: StoredDoc<T> = { key, value, savedAt: Date.now() };
        window.localStorage.setItem(itemKey(collection, key), JSON.stringify(doc));
    },
    async delete(collection, key) {
        safe(() => window.localStorage.removeItem(itemKey(collection, key)), undefined);
    },
    async keys(collection) {
        const prefix = `${PREFIX}:${collection}:`;
        const out: string[] = [];
        safe(() => {
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (!k?.startsWith(prefix)) continue;
                const doc = JSON.parse(window.localStorage.getItem(k) || 'null') as StoredDoc | null;
                if (doc) out.push(doc.key);
            }
        }, undefined);
        return out;
    },
    async clear(collection) {
        const prefix = collection ? `${PREFIX}:${collection}:` : `${PREFIX}:`;
        safe(() => {
            const del: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k?.startsWith(prefix)) del.push(k);
            }
            del.forEach(k => window.localStorage.removeItem(k));
        }, undefined);
    },
});
