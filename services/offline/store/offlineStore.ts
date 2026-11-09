/**
 * Store local do modo offline (docs/OFFLINE_PLANO_IMPLEMENTACAO.md).
 *
 * Documentos JSON por coleção. A implementação muda conforme a plataforma
 * (Filesystem no APK, localStorage no navegador em dev, memória no Jest), mas
 * o resto do código só conhece esta interface — trocar por SQLite depois não
 * afeta quem usa.
 */
export interface OfflineStore {
    get<T = unknown>(collection: string, key: string): Promise<T | null>;
    put<T = unknown>(collection: string, key: string, value: T): Promise<void>;
    delete(collection: string, key: string): Promise<void>;
    keys(collection: string): Promise<string[]>;
    /** Sem `collection`, apaga tudo. */
    clear(collection?: string): Promise<void>;
}

/** Coleções usadas pelo modo offline. */
export const OFFLINE_COLLECTIONS = {
    /** Respostas de leitura do dataService (chave = método + argumentos). */
    reads: 'reads',
    /** Perfil do usuário logado (chave = uuid do auth). */
    profile: 'profile',
    /** Pacote de campo por visita (chave = id da visita). */
    package: 'package',
    /** Token da trava de cada ativo reservado (chave = ovaId) — conferido no envio. */
    locks: 'locks',
    /** Catálogos baixados no preparo (ex.: materiais do fornecedor) — busca offline. */
    catalog: 'catalog',
    /** Estado do download automático (offlineAutoSync): o que já foi baixado e quando. */
    autosync: 'autosync',
} as const;

/**
 * Hash de 53 bits (cyrb53) — nome de arquivo curto e estável para chaves longas.
 * O arquivo guarda a chave original e a leitura confere, então colisão vira só
 * uma falta no cache, nunca um dado trocado.
 */
export const hashKey = (str: string, seed = 0): string => {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

/** Envelope gravado em cada documento (Filesystem/localStorage). */
export interface StoredDoc<T = unknown> {
    key: string;
    value: T;
    savedAt: number;
}
