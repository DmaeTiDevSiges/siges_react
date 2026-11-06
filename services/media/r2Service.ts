/**
 * r2Service.ts
 * Serviço para upload e gerenciamento de arquivos no Cloudflare R2
 */

import type { S3Client } from '@aws-sdk/client-s3';
import { supabase } from '../core/supabase';
import { compressAndGenerateVariants, CompressionOptions } from './imageCompressionService';
import { addVariantToPath } from './imageUtils';

// Cliente S3 singleton — reusa conexão/TLS entre uploads
let cachedClient: S3Client | null = null;
let cachedEndpoint: string | null = null;

// ── Modo Worker (recomendado) ────────────────────────────────────────────────
// Com VITE_R2_WORKER_URL definida, todo acesso ao bucket passa pelo Worker
// workers/r2-files (Cloudflare), que usa binding direto ao R2 e valida o login
// do Supabase. Nenhuma chave S3 fica no app.
//
// Sem a variável, cai no modo legado (SDK S3 + VITE_R2_ACCESS_KEY_ID /
// VITE_R2_SECRET_ACCESS_KEY), que EXPÕE a chave no JavaScript público. Manter
// apenas até o Worker estar publicado; depois remover essas variáveis do .env.
const WORKER_URL = (import.meta.env.VITE_R2_WORKER_URL || '').replace(/\/+$/, '');
const useWorker = () => WORKER_URL.length > 0;

const encodeKey = (key: string) =>
    key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

const getAccessToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sessão expirada. Entre novamente para enviar arquivos.');
    return token;
};

const workerError = async (response: Response, action: string): Promise<Error> => {
    let detail = `HTTP ${response.status}`;
    try {
        const body = await response.json();
        if (body?.error) detail = body.error;
    } catch { }
    return new Error(`Falha ao ${action}: ${detail}`);
};

/** Upload via Worker com progresso (fetch não informa progresso de upload). */
const workerUpload = async (
    path: string,
    body: File | Blob | Uint8Array,
    contentType: string,
    contentEncoding: string | undefined,
    onProgress?: (progress: number) => void
): Promise<void> => {
    const token = await getAccessToken();
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${WORKER_URL}/objects/${encodeKey(path)}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');
        if (contentEncoding) xhr.setRequestHeader('X-File-Encoding', contentEncoding);
        xhr.upload.onprogress = (event) => {
            if (onProgress && event.lengthComputable && event.total > 0) {
                onProgress(Math.round((event.loaded * 100) / event.total));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) return resolve();
            let detail = `HTTP ${xhr.status}`;
            try { detail = JSON.parse(xhr.responseText)?.error || detail; } catch { }
            reject(new Error(detail));
        };
        xhr.onerror = () => reject(new Error('Falha de rede no upload'));
        xhr.ontimeout = () => reject(new Error('Tempo esgotado no upload'));
        xhr.timeout = 5 * 60_000;
        xhr.send(body instanceof Uint8Array ? new Blob([body]) : body);
    });
};

const workerRequest = async (method: 'GET' | 'DELETE' | 'POST', route: string, body?: unknown): Promise<Response> => {
    const token = await getAccessToken();
    return fetch(`${WORKER_URL}${route}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
};

// ── Modo legado (SDK S3) ─────────────────────────────────────────────────────
// O AWS SDK (centenas de KB) só é baixado no primeiro upload/download, não na
// abertura do app — este serviço é importado por vários serviços carregados no boot.
type S3Sdk = typeof import('@aws-sdk/client-s3');
type StorageSdk = typeof import('@aws-sdk/lib-storage');
let sdkPromise: Promise<[S3Sdk, StorageSdk]> | null = null;
const loadSdk = () => {
    if (!sdkPromise) {
        sdkPromise = Promise.all([import('@aws-sdk/client-s3'), import('@aws-sdk/lib-storage')])
            .catch((error) => {
                sdkPromise = null; // permite nova tentativa (ex.: falha de rede no chunk)
                throw error;
            });
    }
    return sdkPromise;
};

const getR2Client = async (): Promise<S3Client> => {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Credenciais do R2 não configuradas. Verifique as variáveis de ambiente.');
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    if (cachedClient && cachedEndpoint === endpoint) {
        return cachedClient;
    }

    const [{ S3Client }] = await loadSdk();
    cachedClient = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
    cachedEndpoint = endpoint;
    return cachedClient;
};

export interface UploadResult {
    path: string;
    publicUrl: string;
}

const COMPRESSIBLE_TYPES = new Set([
    'application/pdf',
    'application/json',
    'application/xml',
]);

export const maybeCompress = async (
    file: File | Blob
): Promise<{ body: File | Blob | Uint8Array; contentEncoding?: string }> => {
    const isCompressible = COMPRESSIBLE_TYPES.has(file.type) || file.type.startsWith('text/');
    // Imagens/binários: passa o Blob direto ao SDK (evita cópia via arrayBuffer)
    if (!isCompressible) return { body: file };
    const raw = new Uint8Array(await file.arrayBuffer());
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    const gzipped = new Uint8Array(await new Response(stream).arrayBuffer());
    return { body: gzipped, contentEncoding: 'gzip' };
};

/**
 * Faz upload de um arquivo para o Cloudflare R2
 * @param file - Arquivo a ser enviado
 * @param path - Caminho completo no bucket (ex: companies/123/assets/456/image.jpg)
 * @param onProgress - Função opcional de callback chamada durante o progresso do upload
 * @returns Objeto com path e URL pública
 */
export const uploadFile = async (file: File | Blob, path: string, onProgress?: (progress: number) => void): Promise<UploadResult> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    // Log diagnóstico em dev
    if (import.meta.env.DEV) {
        const sizeKB = (file.size / 1024).toFixed(1);
        console.log(`[r2Service] Upload: ${sizeKB} KB | ${file.type || 'unknown'} | → ${path}`);
    }

    try {
        const { body, contentEncoding } = await maybeCompress(file);

        if (useWorker()) {
            await workerUpload(path, body, file.type, contentEncoding, onProgress);
            return { path, publicUrl: getPublicUrl(path) };
        }

        const client = await getR2Client();
        const [, { Upload }] = await loadSdk();

        const upload = new Upload({
            client,
            params: {
                Bucket: bucketName,
                Key: path,
                Body: body,
                ContentType: file.type,
                ...(contentEncoding && { ContentEncoding: contentEncoding }),
                // Headers de cache para CDN
                CacheControl: 'public, max-age=31536000, immutable',
            },
        });

        upload.on('httpUploadProgress', (progress) => {
            if (progress.loaded && progress.total && onProgress) {
                const percentCompleted = Math.round((progress.loaded * 100) / progress.total);
                onProgress(percentCompleted);
            }
        });

        await upload.done();

        const publicUrl = getPublicUrl(path);

        return {
            path,
            publicUrl,
        };
    } catch (error) {
        console.error('Erro ao fazer upload para R2:', {
            bucket: bucketName,
            key: path,
            contentType: file.type,
            error: error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error
        });
        throw new Error(`Falha no upload para o bucket ${bucketName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Remove um arquivo do Cloudflare R2
 * @param path - Caminho completo do arquivo no bucket
 */
export const deleteFile = async (path: string): Promise<void> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    try {
        if (useWorker()) {
            const response = await workerRequest('DELETE', `/objects/${encodeKey(path)}`);
            if (!response.ok && response.status !== 404) throw await workerError(response, 'deletar');
            return;
        }

        const client = await getR2Client();
        const [{ DeleteObjectCommand }] = await loadSdk();

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: path,
        });

        await client.send(command);
    } catch (error) {
        console.error('Erro ao deletar arquivo do R2:', error);
        throw new Error(`Falha ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Baixa o conteúdo de um arquivo do Cloudflare R2.
 * Arquivos comprimidos (gzip, conforme maybeCompress no upload) são descomprimidos automaticamente.
 * @param path - Caminho completo do arquivo no bucket
 * @returns Blob com o conteúdo do arquivo
 */
export const downloadFile = async (path: string): Promise<Blob> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    try {
        if (useWorker()) {
            const response = await workerRequest('GET', `/objects/${encodeKey(path)}`);
            if (!response.ok) throw await workerError(response, 'baixar');
            let bytes = new Uint8Array(await response.arrayBuffer());
            const isGzip = response.headers.get('X-File-Encoding') === 'gzip' || (bytes[0] === 0x1f && bytes[1] === 0x8b);
            if (isGzip) {
                const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
                bytes = new Uint8Array(await new Response(stream).arrayBuffer());
            }
            return new Blob([bytes], { type: response.headers.get('Content-Type') || 'application/octet-stream' });
        }

        const client = await getR2Client();
        const [{ GetObjectCommand }] = await loadSdk();
        const command = new GetObjectCommand({ Bucket: bucketName, Key: path });
        const response = await client.send(command);

        const body = response.Body as any;
        const raw = await body.transformToByteArray();
        let bytes: Uint8Array = new Uint8Array(raw);

        // Descomprime se o S3 devolveu com ContentEncoding gzip (padrão do upload)
        if ((response.ContentEncoding === 'gzip') || bytes[0] === 0x1f && bytes[1] === 0x8b) {
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
            bytes = new Uint8Array(await new Response(stream).arrayBuffer());
        }

        const contentType = response.ContentType || 'application/octet-stream';
        return new Blob([bytes], { type: contentType });
    } catch (error) {
        console.error('Erro ao baixar arquivo do R2:', error);
        throw new Error(`Falha ao baixar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Gera URL pública para um arquivo no R2
 * @param path - Caminho do arquivo no bucket
 * @returns URL pública completa
 */
export const getPublicUrl = (path: string): string => {
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!publicUrl) {
        throw new Error('URL pública do R2 não configurada.');
    }

    // Remove trailing slash se existir
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;

    // Remove leading slash do path se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${baseUrl}/${cleanPath}`;
};

/**
 * Valida se as configurações do R2 estão presentes
 * @returns true se todas as configurações necessárias estão presentes
 */
export const isR2Configured = (): boolean => {
    if (useWorker()) {
        return !!(import.meta.env.VITE_R2_BUCKET_NAME && import.meta.env.VITE_R2_PUBLIC_URL);
    }
    return !!(
        import.meta.env.VITE_R2_ACCOUNT_ID &&
        import.meta.env.VITE_R2_ACCESS_KEY_ID &&
        import.meta.env.VITE_R2_SECRET_ACCESS_KEY &&
        import.meta.env.VITE_R2_BUCKET_NAME &&
        import.meta.env.VITE_R2_PUBLIC_URL
    );
};

/**
 * Remove múltiplos arquivos do Cloudflare R2
 * @param paths - Lista de caminhos completos dos arquivos no bucket
 */
export const deleteFiles = async (paths: string[]): Promise<void> => {
    if (!paths || paths.length === 0) return;

    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
    if (!bucketName) throw new Error('Nome do bucket R2 não configurado.');

    try {
        // Valida as credenciais antes de disparar as remoções em paralelo.
        if (!useWorker()) await getR2Client();

        // O SDK v3 do S3 não tem um DeleteObjectsCommand simples que aceite array de strings diretamente da mesma forma que o v2,
        // mas podemos iterar ou usar DeleteObjectsCommand (plural).
        // Para manter simples e evitar limites de 1000 objetos do S3 batch delete:
        await Promise.all(paths.map(path => deleteFile(path)));
    } catch (error) {
        console.error('Erro ao deletar arquivos do R2:', error);
        throw new Error(`Falha ao deletar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

export interface UploadFileInput {
    file: File | Blob;
    path: string;
}

/**
 * Upload paralelo de N arquivos com progresso agregado (0-100).
 */
export const uploadFiles = async (
    files: UploadFileInput[],
    onProgress?: (progress: number) => void
): Promise<UploadResult[]> => {
    if (files.length === 0) return [];
    if (files.length === 1) {
        return [await uploadFile(files[0].file, files[0].path, onProgress)];
    }

    const sizes = files.map((f) => f.file.size || 0);
    const totalBytes = sizes.reduce((a, b) => a + b, 0) || 1;
    const loaded = new Array(files.length).fill(0);

    const report = () => {
        if (!onProgress) return;
        const done = loaded.reduce((a, b) => a + b, 0);
        onProgress(Math.min(99, Math.round((done / totalBytes) * 100)));
    };

    try {
        const results = await Promise.all(
            files.map((item, index) =>
                uploadFile(item.file, item.path, (p) => {
                    loaded[index] = (sizes[index] * p) / 100;
                    report();
                }).then((result) => {
                    loaded[index] = sizes[index];
                    report();
                    return result;
                })
            )
        );
        onProgress?.(100);
        return results;
    } catch (error) {
        console.error('Erro em uploadFiles:', error);
        throw error;
    }
};

const extensionForType = (mime: string, fallbackPath: string): string => {
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    const m = fallbackPath.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : 'webp';
};

/**
 * Comprime e sobe original + variantes (.medium / .thumb) em paralelo.
 * A normalização de extensão garante que o path do banco bate com o arquivo real.
 */
export const uploadImageWithVariants = async (
    file: File | Blob,
    originalPath: string,
    onProgress?: (progress: number) => void,
    compressionOptions?: CompressionOptions
): Promise<UploadResult & { filename: string }> => {
    const variants = await compressAndGenerateVariants(file, compressionOptions);
    const ext = extensionForType(variants.original.type, originalPath);
    const normalizedPath = originalPath.replace(/(\.[^./?]+)$/, `.${ext}`);

    const jobs: UploadFileInput[] = [
        { file: variants.original, path: normalizedPath },
        { file: variants.medium, path: addVariantToPath(normalizedPath, 'medium') },
        { file: variants.thumb, path: addVariantToPath(normalizedPath, 'thumb') },
    ];

    await uploadFiles(jobs, onProgress);

    const filename = normalizedPath.split('/').pop() || normalizedPath;
    return {
        path: normalizedPath,
        filename,
        publicUrl: getPublicUrl(normalizedPath),
    };
};

/**
 * Copia um arquivo (e variantes, se existirem) dentro do Cloudflare R2
 * @param srcKey - Caminho do arquivo de origem (ex: companies/1/orders/1/images/img.jpg)
 * @param destKey - Caminho de destino
 */
export const copyFile = async (srcKey: string, destKey: string): Promise<void> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    try {
        if (useWorker()) {
            const response = await workerRequest('POST', '/copy', { src: srcKey, dest: destKey });
            if (!response.ok) throw await workerError(response, 'copiar');
            return;
        }

        const client = await getR2Client();
        const [{ CopyObjectCommand }] = await loadSdk();

        const command = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${srcKey}`, // S3 format bucket/key
            Key: destKey,
        });

        await client.send(command);
    } catch (error) {
        console.error('Erro ao copiar arquivo no R2:', error);
        throw new Error(`Falha ao copiar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

export const r2Service = {
    uploadFile,
    uploadFiles,
    uploadImageWithVariants,
    copyFile,
    deleteFile,
    deleteFiles,
    downloadFile,
    getPublicUrl,
    isR2Configured,
};
