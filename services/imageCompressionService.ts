/**
 * imageCompressionService.ts
 * Serviço client-side de compressão e redimensionamento de imagens antes do upload.
 *
 * Reduz drasticamente o tráfego de dados (90-95%) ao:
 *  1. Redimensionar fotos de câmera (12-48 MP) para max 2048px na maior aresta
 *  2. Converter para WebP (25-35% menor que JPEG a qualidade equivalente)
 *  3. Aplicar qualidade 80 consistente
 *
 * Usa Canvas API — funciona em todos os WebViews modernos (Capacitor).
 */

export interface CompressionOptions {
    /** Maior dimensão (px) na maior aresta. Default: 2048 */
    maxDimension?: number;
    /** Qualidade WebP (0-1). Default: 0.80 */
    quality?: number;
    /** Formato de saída. Default: 'webp' */
    format?: 'webp' | 'jpeg';
    /** Se true, ignora compressão. Default: false */
    skip?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxDimension: 2048,
    quality: 0.80,
    format: 'webp',
    skip: false,
};

/**
 * Determina se o arquivo deve ser comprimido.
 * Pula se já for WebP/AVIF pequeno ou se for arquivo non-image.
 */
const shouldCompress = (file: File | Blob): boolean => {
    if (!(file instanceof File)) return true;

    // Pula arquivos que já são compactos
    if (file.type === 'image/webp' || file.type === 'image/avif') {
        if (file.size < 500 * 1024) return false; // < 500KB → já ok
    }

    // Pula tipos não-imagem (PDFs, etc — tratados pelo r2Service maybeCompress)
    if (!file.type.startsWith('image/')) return false;

    return true;
};

/**
 * Redimensiona e comprime uma imagem via Canvas API.
 * Mantém proporção e aplica WebP com qualidade configurada.
 */
export const compressForUpload = async (
    file: File | Blob,
    options?: CompressionOptions
): Promise<File | Blob> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (opts.skip || !shouldCompress(file)) {
        return file;
    }

    try {
        const img = await loadImage(file);
        const { width, height } = calculateResize(
            img.naturalWidth,
            img.naturalHeight,
            opts.maxDimension
        );

        // Se não precisou redimir e já é WebP pequeno, retorna original
        const needsResize = width !== img.naturalWidth || height !== img.naturalHeight;
        if (!needsResize && file instanceof File && file.type === 'image/webp' && file.size < 500 * 1024) {
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, mimeType, opts.quality);

        if (!blob) return file;

        // Log de diagnóstico (apenas em dev)
        if (import.meta.env.DEV) {
            const originalSize = file instanceof File ? file.size : (file as Blob).size;
            console.log(
                `[imageCompression] ${formatBytes(originalSize)} → ${formatBytes(blob.size)} ` +
                `(${Math.round((1 - blob.size / originalSize) * 100)}% redução) | ` +
                `${img.naturalWidth}x${img.naturalHeight} → ${width}x${height} | ${mimeType}`
            );
        }

        if (file instanceof File) {
            const ext = opts.format === 'webp' ? 'webp' : 'jpg';
            return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${ext}`, {
                type: mimeType,
            });
        }

        return blob;
    } catch (error) {
        console.warn('[imageCompression] Falha na compressão — enviando original:', error);
        return file;
    }
};

/**
 * Compressão com opções pré-definidas para diferentes contextos.
 */
export const compressForThumbnail = (file: File | Blob): Promise<File | Blob> =>
    compressForUpload(file, { maxDimension: 400, quality: 0.75, format: 'webp' });

export const compressForAvatar = (file: File | Blob): Promise<File | Blob> =>
    compressForUpload(file, { maxDimension: 512, quality: 0.80, format: 'webp' });

/**
 * Para assinaturas e imagens que preservam formato (PNG).
 * Apenas redimensiona, sem converter para WebP.
 */
export const compressPng = (file: File | Blob, maxDim = 1200): Promise<File | Blob> =>
    compressForUpload(file, { maxDimension: maxDim, quality: 1.0, format: 'jpeg' });

// ─── Helpers ────────────────────────────────────────────────────────────────

const loadImage = (file: File | Blob): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Falha ao carregar imagem para compressão'));
        };
        img.src = URL.createObjectURL(file);
    });

const calculateResize = (
    origW: number,
    origH: number,
    maxDim: number
): { width: number; height: number } => {
    if (origW <= maxDim && origH <= maxDim) {
        return { width: origW, height: origH };
    }

    const ratio = Math.min(maxDim / origW, maxDim / origH);
    return {
        width: Math.round(origW * ratio),
        height: Math.round(origH * ratio),
    };
};

const canvasToBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const imageCompressionService = {
    compressForUpload,
    compressForThumbnail,
    compressForAvatar,
    compressPng,
};
