/**
 * r2Service.ts
 * Serviço para upload e gerenciamento de arquivos no Cloudflare R2
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

// Configuração do cliente S3 para Cloudflare R2
const getR2Client = () => {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Credenciais do R2 não configuradas. Verifique as variáveis de ambiente.');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
};

export interface UploadResult {
    path: string;
    publicUrl: string;
}

/**
 * Faz upload de um arquivo para o Cloudflare R2
 * @param file - Arquivo a ser enviado
 * @param path - Caminho completo no bucket (ex: companies/123/assets/456/image.jpg)
 * @returns Objeto com path e URL pública
 */
export const uploadFile = async (file: File, path: string): Promise<UploadResult> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    try {
        const client = getR2Client();

        // Converter File para ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: path,
            Body: buffer,
            ContentType: file.type,
            // Headers de cache para CDN
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await client.send(command);

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
        const client = getR2Client();

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
        const client = getR2Client();

        // O SDK v3 do S3 não tem um DeleteObjectsCommand simples que aceite array de strings diretamente da mesma forma que o v2,
        // mas podemos iterar ou usar DeleteObjectsCommand (plural).
        // Para manter simples e evitar limites de 1000 objetos do S3 batch delete:
        await Promise.all(paths.map(path => deleteFile(path)));
    } catch (error) {
        console.error('Erro ao deletar arquivos do R2:', error);
        throw new Error(`Falha ao deletar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Copia um arquivo dentro do Cloudflare R2
 * @param srcKey - Caminho do arquivo de origem (ex: companies/1/orders/1/images/img.jpg)
 * @param destKey - Caminho do arquivo de destino
 */
export const copyFile = async (srcKey: string, destKey: string): Promise<void> => {
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('Nome do bucket R2 não configurado.');
    }

    try {
        const client = getR2Client();

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
    copyFile,
    deleteFile,
    deleteFiles,
    getPublicUrl,
    isR2Configured,
};
