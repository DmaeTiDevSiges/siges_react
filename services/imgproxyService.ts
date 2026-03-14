/**
 * imgproxyService.ts
 * Serviço para geração de URLs otimizadas via imgproxy com assinatura
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

// Presets pré-configurados para diferentes casos de uso
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
    original: {
        // Sem transformações, apenas serve a imagem original
    },
};

/**
 * Gera assinatura HMAC para URL do imgproxy
 * @param path - Caminho processado para assinatura
 * @returns Assinatura em formato URL-safe base64
 */
const createSignature = (path: string): string => {
    const key = import.meta.env.VITE_IMGPROXY_KEY;
    const salt = import.meta.env.VITE_IMGPROXY_SALT;

    if (!key || !salt) {
        console.warn('Chaves do imgproxy não configuradas. URLs não serão assinadas.');
        return '';
    }

    // Converter key e salt de hex para WordArray
    const keyBin = CryptoJS.enc.Hex.parse(key);
    const saltBin = CryptoJS.enc.Hex.parse(salt);

    // Criar HMAC
    const hmac = CryptoJS.HmacSHA256(saltBin.concat(CryptoJS.enc.Utf8.parse(path)), keyBin);

    // Converter para base64 URL-safe
    return hmac.toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Codifica URL de origem para formato seguro do imgproxy
 * @param url - URL da imagem original
 * @returns URL codificada em base64 URL-safe
 */
const encodeSourceUrl = (url: string): string => {
    const encoded = CryptoJS.enc.Utf8.parse(url).toString(CryptoJS.enc.Base64);
    return encoded
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Constrói string de opções de processamento para imgproxy
 * @param options - Opções de transformação
 * @returns String formatada de opções
 */
const buildProcessingOptions = (options: TransformOptions): string => {
    const parts: string[] = [];

    // Resize type
    const resizeType = options.resize || 'fit';
    const width = options.width || 0;
    const height = options.height || 0;
    const enlarge = options.enlarge ? 1 : 0;
    parts.push(`rs:${resizeType}:${width}:${height}:${enlarge}`);

    // Gravity (para crops)
    if (options.gravity) {
        parts.push(`g:${options.gravity}`);
    }

    // Quality
    if (options.quality) {
        parts.push(`q:${options.quality}`);
    }

    // Format
    if (options.format) {
        parts.push(`f:${options.format}`);
    }

    return parts.join('/');
};

/**
 * Gera URL otimizada via imgproxy
 * @param sourceUrl - URL da imagem original (R2)
 * @param options - Opções de transformação
 * @returns URL completa do imgproxy com assinatura
 */
export const generateUrl = (sourceUrl: string, options: TransformOptions = {}): string => {
    const imgproxyUrl = import.meta.env.VITE_IMGPROXY_URL;

    if (!imgproxyUrl) {
        console.warn('URL do imgproxy não configurada. Retornando URL original.');
        return sourceUrl;
    }

    // Se não há opções, retorna a imagem original via imgproxy (sem transformações)
    if (Object.keys(options).length === 0) {
        options = { format: 'webp' }; // Pelo menos converte para webp
    }

    const encodedUrl = encodeSourceUrl(sourceUrl);
    const processingOptions = buildProcessingOptions(options);
    const path = `/${processingOptions}/${encodedUrl}`;
    const signature = createSignature(path);

    // Remove trailing slash do imgproxyUrl se existir
    const baseUrl = imgproxyUrl.endsWith('/') ? imgproxyUrl.slice(0, -1) : imgproxyUrl;

    return `${baseUrl}/${signature}${path}`;
};

/**
 * Gera URL usando preset pré-configurado
 * @param sourceUrl - URL da imagem original
 * @param preset - Nome do preset
 * @returns URL otimizada
 */
export const getPresetUrl = (sourceUrl: string, preset: ImagePreset = 'medium'): string => {
    if (preset === 'original') {
        return sourceUrl; // Retorna URL original sem processamento
    }

    const options = PRESETS[preset];
    return generateUrl(sourceUrl, options);
};

/**
 * Gera srcset para imagens responsivas
 * @param sourceUrl - URL da imagem original
 * @returns String srcset com múltiplas resoluções
 */
export const generateSrcSet = (sourceUrl: string): string => {
    const sizes = [
        { width: 400, descriptor: '400w' },
        { width: 800, descriptor: '800w' },
        { width: 1200, descriptor: '1200w' },
        { width: 1920, descriptor: '1920w' },
    ];

    return sizes
        .map(({ width, descriptor }) => {
            const url = generateUrl(sourceUrl, {
                width,
                resize: 'fit',
                format: 'webp',
                quality: 85,
            });
            return `${url} ${descriptor}`;
        })
        .join(', ');
};

/**
 * Valida se o imgproxy está configurado
 * @returns true se todas as configurações necessárias estão presentes
 */
export const isImgproxyConfigured = (): boolean => {
    return !!(
        import.meta.env.VITE_IMGPROXY_URL &&
        import.meta.env.VITE_IMGPROXY_KEY &&
        import.meta.env.VITE_IMGPROXY_SALT
    );
};

export const imgproxyService = {
    generateUrl,
    getPresetUrl,
    generateSrcSet,
    isImgproxyConfigured,
};
