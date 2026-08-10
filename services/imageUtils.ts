/**
 * imageUtils.ts
 * Utilitários de URL de imagem sem dependência circular.
 * Usado por dataService.ts, usersService.ts, ordersService.ts, toolsService.ts, etc.
 */
import { supabase } from './supabase';

export interface PublicImageUrlOptions {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    quality?: number;
    format?: 'origin' | 'webp' | 'jpeg' | 'png';
    cacheBust?: number;
}

/**
 * Gera URL pública para imagem no Supabase Storage ou Cloudflare R2.
 * Extração de dataService.getPublicImageUrl para evitar dependências circulares.
 */
export function getPublicImageUrl(
    path: string | undefined | null,
    name: string | undefined,
    options?: PublicImageUrlOptions
): string | undefined {
    if (!name) return undefined;
    const safePath = path || '';
    if (safePath.startsWith('http') || safePath.startsWith('data:')) return safePath;

    const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

    if (r2PublicUrl) {
        let cleanPath = safePath.replace(/^\/+|\/+$/g, '');
        const cleanName = name.replace(/^\/+|\/+$/g, '');
        const baseUrl = r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl;
        let pathPart = cleanPath;
        const legacyPrefixes = ['siges/stub/siges/', 'stub/siges/', 'siges/'];
        for (const prefix of legacyPrefixes) {
            if (pathPart.startsWith(prefix)) {
                pathPart = pathPart.substring(prefix.length);
                break;
            }
        }
        const finalPath = pathPart ? `${pathPart}/${cleanName}` : cleanName;
        return `${baseUrl}/${finalPath}`;
    }

    const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
    const transform: any = {};
    if (options?.width) transform.width = options.width;
    if (options?.height) transform.height = options.height;
    if (options?.resize) transform.resize = options.resize;
    if (options?.quality) transform.quality = options.quality;
    if (options?.format && options.format !== 'origin') transform.format = options.format;

    let cleanPath = safePath.endsWith('/') ? safePath.slice(0, -1) : safePath;
    let cleanName = name.startsWith('/') ? name.slice(1) : name;
    cleanPath = cleanPath.replace(/^\/+/, '');
    cleanName = cleanName.replace(/^\/+/, '');

    if (cleanPath.startsWith(`${bucket}/`)) {
        cleanPath = cleanPath.substring(bucket.length + 1);
    } else if (cleanPath === bucket) {
        cleanPath = '';
    }

    const finalPath = cleanPath ? `${cleanPath}/${cleanName}` : cleanName;

    if (Object.keys(transform).length === 0) {
        transform.quality = 80;
        transform.format = 'origin';
    } else if (!transform.format && options?.format !== 'origin') {
        transform.format = 'origin';
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath, { transform });
    let finalUrl = data.publicUrl;

    if (finalUrl.includes('siges-mao.com.br')) {
        finalUrl = finalUrl.replace('siges-mao.com.br', 'vps.supabase.siges-app.com.br');
    } else if (finalUrl.includes('siges-app.com.br') && !finalUrl.includes('vps.')) {
        finalUrl = finalUrl.replace('supabase.siges-app.com.br', 'vps.supabase.siges-app.com.br');
    }

    if (!finalUrl.includes('vps.supabase.siges-app.com.br')) {
        finalUrl = finalUrl.replace('://supabase.siges-app.com.br', '://vps.supabase.siges-app.com.br');
    }

    if (options?.cacheBust) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}v=${options.cacheBust}`;
    }

    return finalUrl;
}
