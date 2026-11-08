import type { OfflineStore } from './offlineStore';

/** Store em memória — testes (Jest) e fallback quando nada mais funciona. */
export const createMemoryStore = (): OfflineStore => {
    const data = new Map<string, Map<string, unknown>>();
    const col = (name: string) => {
        let m = data.get(name);
        if (!m) {
            m = new Map();
            data.set(name, m);
        }
        return m;
    };
    // Cópia profunda: quem lê não altera o que está guardado (igual ao disco).
    const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

    return {
        async get<T>(collection: string, key: string) {
            const m = data.get(collection);
            return m && m.has(key) ? clone(m.get(key) as T) : null;
        },
        async put<T>(collection: string, key: string, value: T) {
            col(collection).set(key, clone(value));
        },
        async delete(collection, key) {
            data.get(collection)?.delete(key);
        },
        async keys(collection) {
            return Array.from(data.get(collection)?.keys() ?? []);
        },
        async clear(collection) {
            if (collection) data.delete(collection);
            else data.clear();
        },
    };
};
