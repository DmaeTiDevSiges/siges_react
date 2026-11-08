import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { hashKey, type OfflineStore, type StoredDoc } from './offlineStore';

/**
 * Store do APK: um arquivo JSON por documento em Directory.Data
 * (armazenamento privado do app — não é limpo como o cache do WebView).
 *
 *   offline/<coleção>/<hash da chave>.json   → { key, value, savedAt }
 *
 * Gravação direta no arquivo final: se o app morrer no meio, o JSON pela metade
 * falha no parse e vira uma FALTA no cache (nunca um dado errado). Basta para
 * o cache de leitura. A fila da F2 (perder operação é grave) precisa de
 * gravação segura — o `rename` do plugin é delegado à lib ionfilesystem e
 * não confirmamos se sobrescreve no Android; validar no aparelho antes.
 */
const ROOT = 'offline';
const dir = Directory.Data;

const colPath = (collection: string) => `${ROOT}/${collection}`;
const docPath = (collection: string, key: string) => `${colPath(collection)}/${hashKey(key)}.json`;

const readDoc = async <T>(path: string): Promise<StoredDoc<T> | null> => {
    try {
        const { data } = await Filesystem.readFile({ path, directory: dir, encoding: Encoding.UTF8 });
        return JSON.parse(typeof data === 'string' ? data : await (data as Blob).text()) as StoredDoc<T>;
    } catch {
        return null; // não existe ou corrompido → falta no cache
    }
};

export const createFilesystemStore = (): OfflineStore => ({
    async get<T>(collection: string, key: string) {
        const doc = await readDoc<T>(docPath(collection, key));
        return doc && doc.key === key ? doc.value : null;
    },

    async put<T>(collection: string, key: string, value: T) {
        const doc: StoredDoc<T> = { key, value, savedAt: Date.now() };
        await Filesystem.writeFile({
            path: docPath(collection, key),
            data: JSON.stringify(doc),
            directory: dir,
            encoding: Encoding.UTF8,
            recursive: true,
        });
    },

    async delete(collection, key) {
        await Filesystem.deleteFile({ path: docPath(collection, key), directory: dir }).catch(() => undefined);
    },

    async keys(collection) {
        try {
            const { files } = await Filesystem.readdir({ path: colPath(collection), directory: dir });
            const keys: string[] = [];
            for (const f of files) {
                if (!f.name.endsWith('.json')) continue;
                const doc = await readDoc(`${colPath(collection)}/${f.name}`);
                if (doc) keys.push(doc.key);
            }
            return keys;
        } catch {
            return [];
        }
    },

    async clear(collection) {
        await Filesystem.rmdir({
            path: collection ? colPath(collection) : ROOT,
            directory: dir,
            recursive: true,
        }).catch(() => undefined);
    },
});
