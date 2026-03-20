/**
 * imgproxyService.ts
 * Serviço para geração de URLs otimizadas via imgproxy com assinatura HMAC-SHA256.
 *
 * Arquitetura:
 *  - URLs do Supabase Storage → convertidas para s3://siges/<path>
 *  - URLs do Cloudflare R2    → convertidas para s3://siges/<path>
 *  - URLs blob/data (locais)  → não otimizáveis, retorna original
 *  O imgproxy na VPS acessa o bucket S3/R2 diretamente via credenciais configuradas.
 */

import CryptoJS from 'crypto-js';

export interface TransformOptions {
    width?: number;
    height?: number;
    resize?: 'fit' | 'fill' | 'auto';
    gravity?: 'no' | 'ce' | 'sm';
    enlarge?: boolean;
    format?: 'webp' | 'jpeg' | 'png' | 'avif';
    quality?: number;
}

export type ImagePreset = 'thumbnail' | 'medium' | 'large' | 'original';

const PRESETS: Record<ImagePreset, TransformOptions> = {
    thumbnail: {
        width: 150,
        height: 150,
        resize: 'fill',
        gravity: 'sm',
        format: 'webp',
        quality: 80,
    },
    medium: {
        width: 800,
        height: 800,
        resize: 'fit',
        format: 'webp',
        quality: 85,
    },
    large: {
        width: 1920,
        height: 1920,
        resize: 'fit',
        format: 'webp',
        quality: 90,
    },
    original: {},
};

/**
 * Gera assinatura HMAC-SHA256 conforme spec do imgproxy:
 *   HMAC(key=keyBytes, message=saltBytes || pathUTF8)
 */
const createSignature = (path: string): string => {
    const key  = import.meta.env.VITE_IMGPROXY_KEY;
    const salt = import.meta.env.VITE_IMGPROXY_SALT;

    if (!key || !salt) return 'insecure';

    const keyBin  = CryptoJS.enc.Hex.parse(key);
    const saltBin = CryptoJS.enc.Hex.parse(salt);

    const hmac = CryptoJS.HmacSHA256(
        saltBin.concat(CryptoJS.enc.Utf8.parse(path)),
        keyBin
    );

    return hmac.toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Codifica URL de origem em Base64 URL-safe (sem padding).
 */
const encodeSourceUrl = (url: string): string => {
    const encoded = CryptoJS.enc.Utf8.parse(url).toString(CryptoJS.enc.Base64);
    return encoded
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Constrói string de opções de processamento para imgproxy.
 */
const buildProcessingOptions = (options: TransformOptions): string => {
    const parts: string[] = [];

    const resizeType = options.resize || 'fit';
    const width      = options.width  || 0;
    const height     = options.height || 0;
    const enlarge    = options.enlarge ? 1 : 0;
    parts.push(`rs:${resizeType}:${width}:${height}:${enlarge}`);

    if (options.gravity) parts.push(`g:${options.gravity}`);
    if (options.quality) parts.push(`q:${options.quality}`);
    if (options.format)  parts.push(`f:${options.format}`);

    return parts.join('/');
};

/**
 * Converte URL pública (Supabase Storage ou R2) para path interno s3://siges/<path>.
 *
 * O imgproxy acessa o bucket R2/S3 diretamente — não precisa de URL pública;
 * a conversão para s3:// é mais eficiente (evita hop HTTP extra) e funciona
 * desde que as credenciais AWS_S3_* estejam configuradas corretamente no container.
 */
const toS3Url = (sourceUrl: string): string => {
    // Supabase Storage: .../storage/v1/object/public/siges/<path>
    //                ou .../storage/v1/object/sign/siges/<path>?token=...
    if (sourceUrl.includes('supabase') && sourceUrl.includes('/siges/')) {
        const parts = sourceUrl.split('/siges/');
        if (parts.length > 1) {
            const path = parts[1].split('?')[0]; // remove query params / token
            if (path) return `s3://siges/${path}`;
        }
    }

    // Cloudflare R2 público: https://pub-xxx.r2.dev/<path>
    //                     ou https://<accountId>.r2.cloudflarestorage.com/<bucket>/<path>
    if (sourceUrl.includes('r2.dev') || sourceUrl.includes('r2.cloudflarestorage.com')) {
        try {
            const urlObj  = new URL(sourceUrl);
            let tempPath  = urlObj.pathname.startsWith('/')
                ? urlObj.pathname.substring(1)
                : urlObj.pathname;

            // Remove prefixo do bucket se já estiver no path
            if (tempPath.startsWith('siges/')) tempPath = tempPath.substring(6);

            const path = tempPath.split('?')[0];
            if (path) return `s3://siges/${path}`;
        } catch {
            const match = sourceUrl.match(/(?:r2\.dev|cloudflarestorage\.com)\/(.+)$/);
            if (match) return `s3://siges/${match[1].split('?')[0]}`;
        }
    }

    // Fallback: não foi possível converter → usa URL original
    return sourceUrl;
};

/**
 * Gera URL otimizada via imgproxy.
 * @param sourceUrl URL pública da imagem (R2 ou Supabase Storage)
 * @param options   Opções de transformação
 */
export const generateUrl = (sourceUrl: string, options: TransformOptions = {}): string => {
    const imgproxyUrl = import.meta.env.VITE_IMGPROXY_URL;

    if (!imgproxyUrl) return sourceUrl;

    // URLs locais (blob/data) não podem ser acessadas pelo imgproxy (servidor externo)
    if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:')) return sourceUrl;

    const finalSourceUrl    = toS3Url(sourceUrl);
    const encodedUrl        = encodeSourceUrl(finalSourceUrl);
    const processingOptions = buildProcessingOptions(
        Object.keys(options).length === 0 ? { format: 'webp' } : options
    );
    const pathSegment = `/${processingOptions}/${encodedUrl}`;
    const signature   = createSignature(pathSegment);

    const baseUrl = imgproxyUrl.endsWith('/') ? imgproxyUrl.slice(0, -1) : imgproxyUrl;
    return `${baseUrl}/${signature}${pathSegment}`;
};

/**
 * Gera URL usando preset pré-configurado.
 */
export const getPresetUrl = (sourceUrl: string, preset: ImagePreset = 'medium'): string => {
    if (preset === 'original') return sourceUrl;
    return generateUrl(sourceUrl, PRESETS[preset]);
};

/**
 * Gera srcset para imagens responsivas.
 */
export const generateSrcSet = (sourceUrl: string): string => {
    const sizes = [
        { width: 400,  descriptor: '400w'  },
        { width: 800,  descriptor: '800w'  },
        { width: 1200, descriptor: '1200w' },
        { width: 1920, descriptor: '1920w' },
    ];

    return sizes
        .map(({ width, descriptor }) => {
            const url = generateUrl(sourceUrl, { width, resize: 'fit', format: 'webp', quality: 85 });
            return `${url} ${descriptor}`;
        })
        .join(', ');
};

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
// Desativa o imgproxy temporariamente após N falhas consecutivas.

let consecutiveFailures = 0;
let disabledUntil       = 0;
const MAX_FAILURES    = 3;
const RECOVERY_TIME   = 2 * 60 * 1000; // 2 minutos

/**
 * Retorna true se o imgproxy está configurado e o circuit breaker está fechado.
 */
export const isImgproxyConfigured = (): boolean => {
    const hasConfig = !!(
        import.meta.env.VITE_IMGPROXY_URL &&
        import.meta.env.VITE_IMGPROXY_KEY &&
        import.meta.env.VITE_IMGPROXY_SALT
    );
    if (!hasConfig) return false;

    // Recuperação automática após o tempo de espera
    if (Date.now() > disabledUntil) {
        if (disabledUntil > 0) {
            consecutiveFailures = 0;
            disabledUntil       = 0;
        }
        return true;
    }

    return false; // circuit breaker aberto
};

/**
 * Registra falha de carregamento.
 * Desativa após MAX_FAILURES falhas consecutivas.
 */
export const reportServiceFailure = () => {
    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES && disabledUntil === 0) {
        console.warn(
            `[imgproxyService] ${MAX_FAILURES} falhas consecutivas. ` +
            `Desativando por ${RECOVERY_TIME / 1000}s — verifique S3 no container.`
        );
        disabledUntil = Date.now() + RECOVERY_TIME;
    }
};

/**
 * Registra sucesso — reseta o contador de falhas.
 */
export const reportServiceSuccess = () => {
    if (consecutiveFailures > 0) consecutiveFailures = 0;
};

export const checkServiceHealth = async (): Promise<boolean> => {
    const imgproxyUrl = import.meta.env.VITE_IMGPROXY_URL;
    if (!imgproxyUrl) return false;
    try {
        await fetch(`${imgproxyUrl}/health`, { method: 'GET', mode: 'no-cors' });
        return true;
    } catch {
        return false;
    }
};

export const imgproxyService = {
    generateUrl,
    getPresetUrl,
    generateSrcSet,
    isImgproxyConfigured,
    checkServiceHealth,
    reportServiceFailure,
    reportServiceSuccess,
};
