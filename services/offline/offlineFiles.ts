import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { compressAndGenerateVariants } from '../media/imageCompressionService';
import { removeLocalOfflineFileUrl, setLocalOfflineFileUrl } from './offlineFileUrls';

/**
 * Arquivos feitos offline (F3): fotos do ativo, fotos do checklist, assinaturas.
 *
 *   Directory.Data/offline-files/<nome final>          → o arquivo (base64)
 *   Directory.Data/offline-files/<nome final>.uploaded → marca "já subiu" (data)
 *
 * Fica FORA do store de cache (logout limpa o cache, não a fila nem estes
 * arquivos). Depois de subir, o arquivo fica mais 3 dias para a tela continuar
 * mostrando a foto até a próxima leitura online trazer a URL do servidor.
 *
 * Na fila, o argumento File/base64 vira uma referência (OfflineFileRef) e o
 * envio reconstrói o arquivo a partir daqui.
 */

const DIR = 'offline-files';
const dir = Directory.Data;
const UPLOADED_SUFFIX = '.uploaded';
const KEEP_AFTER_UPLOAD_MS = 3 * 24 * 60 * 60 * 1000;

export interface OfflineFileRef {
    __offlineFile: true;
    name: string;
    mime: string;
    size: number;
    /** Como o método original recebe: File ou data URL (assinatura). */
    as: 'file' | 'dataUrl';
}

export const isOfflineFileRef = (v: unknown): v is OfflineFileRef =>
    !!v && typeof v === 'object' && (v as any).__offlineFile === true && typeof (v as any).name === 'string';

export const extForMime = (mime: string): string =>
    mime === 'image/png' ? 'png' : mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : 'webp';

const mimeForName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp';
};

const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

const base64ToBlob = (b64: string, mime: string): Blob => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
};

const localUrlOf = async (name: string, b64?: string): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
        const { uri } = await Filesystem.getUri({ path: `${DIR}/${name}`, directory: dir });
        return Capacitor.convertFileSrc(uri);
    }
    // Navegador (dev): data URL.
    const data = b64 ?? (await readBase64(name));
    return `data:${mimeForName(name)};base64,${data}`;
};

const readBase64 = async (name: string): Promise<string> => {
    const { data } = await Filesystem.readFile({ path: `${DIR}/${name}`, directory: dir });
    return typeof data === 'string' ? data : blobToBase64(data as Blob);
};

/**
 * Comprime a foto AGORA (mesma compressão do envio) — o tipo final, e portanto
 * a extensão do nome no R2, já fica conhecido; e o aparelho guarda ~300 KB em
 * vez de vários MB.
 */
export const compressForOffline = async (file: Blob): Promise<{ blob: Blob; ext: string }> => {
    const { original } = await compressAndGenerateVariants(file);
    const blob = original as Blob;
    return { blob, ext: extForMime(blob.type || 'image/webp') };
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!m) return (await fetch(dataUrl)).blob();
    const mime = m[1] || 'image/png';
    return m[2] ? base64ToBlob(m[3], mime) : new Blob([decodeURIComponent(m[3])], { type: mime });
};

export const saveOfflineFile = async (
    name: string,
    blob: Blob,
    as: OfflineFileRef['as'],
): Promise<{ ref: OfflineFileRef; url: string }> => {
    const b64 = await blobToBase64(blob);
    await Filesystem.writeFile({ path: `${DIR}/${name}`, data: b64, directory: dir, recursive: true });
    const url = await localUrlOf(name, b64);
    setLocalOfflineFileUrl(name, url);
    return { ref: { __offlineFile: true, name, mime: blob.type || mimeForName(name), size: blob.size, as }, url };
};

/** Reconstrói o argumento original (File ou data URL) para o envio. */
export const loadOfflineFile = async (ref: OfflineFileRef): Promise<File | string> => {
    const b64 = await readBase64(ref.name);
    if (ref.as === 'dataUrl') return `data:${ref.mime};base64,${b64}`;
    return new File([base64ToBlob(b64, ref.mime)], ref.name, { type: ref.mime });
};

export const markOfflineFileUploaded = async (name: string): Promise<void> => {
    await Filesystem.writeFile({
        path: `${DIR}/${name}${UPLOADED_SUFFIX}`,
        data: String(Date.now()),
        directory: dir,
        encoding: Encoding.UTF8,
        recursive: true,
    }).catch(() => undefined);
};

export const deleteOfflineFile = async (name: string): Promise<void> => {
    removeLocalOfflineFileUrl(name);
    await Filesystem.deleteFile({ path: `${DIR}/${name}`, directory: dir }).catch(() => undefined);
    await Filesystem.deleteFile({ path: `${DIR}/${name}${UPLOADED_SUFFIX}`, directory: dir }).catch(() => undefined);
};

/**
 * Ao abrir o app: registra as URLs locais (para getPublicImageUrl) e apaga o
 * que subiu há mais de 3 dias.
 */
export const initOfflineFiles = async (): Promise<void> => {
    let names: string[] = [];
    try {
        const { files } = await Filesystem.readdir({ path: DIR, directory: dir });
        names = files.map(f => f.name);
    } catch {
        return; // pasta ainda não existe
    }
    const set = new Set(names);
    for (const name of names) {
        if (name.endsWith(UPLOADED_SUFFIX)) continue;
        if (set.has(`${name}${UPLOADED_SUFFIX}`)) {
            try {
                const { data } = await Filesystem.readFile({
                    path: `${DIR}/${name}${UPLOADED_SUFFIX}`,
                    directory: dir,
                    encoding: Encoding.UTF8,
                });
                if (Date.now() - Number(data) > KEEP_AFTER_UPLOAD_MS) {
                    await deleteOfflineFile(name);
                    continue;
                }
            } catch {
                /* marca ilegível: mantém */
            }
        }
        try {
            setLocalOfflineFileUrl(name, await localUrlOf(name));
        } catch {
            /* ignora */
        }
    }
};
