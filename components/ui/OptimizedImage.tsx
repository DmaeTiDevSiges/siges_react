/**
 * OptimizedImage.tsx
 * Exibe imagens com variantes pré-geradas no upload (thumb/medium/original)
 * direto do R2/CDN — sem imgproxy. Fallback automático para a original.
 */

import React, { useState } from 'react';
import { getVariantUrl, buildVariantSrcSet, ImageVariant } from '../../services/imageUtils';

export type ImagePreset = 'thumbnail' | 'medium' | 'large' | 'original';

export interface OptimizedImageProps {
    src: string;
    alt: string;
    preset?: ImagePreset;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLImageElement>;
    useSrcSet?: boolean;
    loading?: 'lazy' | 'eager';
    style?: React.CSSProperties;
}

const PRESET_TO_VARIANT: Record<ImagePreset, ImageVariant> = {
    thumbnail: 'thumb',
    medium: 'medium',
    large: 'original',
    original: 'original',
};

const OptimizedImageBase: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    preset = 'medium',
    className = '',
    onClick,
    useSrcSet = true,
    loading = 'lazy',
    style,
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isLocalUrl = src?.startsWith('blob:') || src?.startsWith('data:');
    const variant = PRESET_TO_VARIANT[preset] ?? 'medium';

    // Fallback (hasError) e URLs locais usam o original sem variantes
    const primarySrc =
        hasError || isLocalUrl ? src : getVariantUrl(src, variant);

    const srcSet =
        !hasError && !isLocalUrl && useSrcSet && preset !== 'original'
            ? buildVariantSrcSet(src)
            : undefined;

    const handleError = () => {
        if (hasError) {
            setIsLoading(false);
            return;
        }
        // Variante pode não existir (imagens antigas) → cai para a original
        console.warn('[OptimizedImage] Variante indisponível, usando original:', primarySrc, '→', src);
        setHasError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            )}

            <img
                src={primarySrc}
                srcSet={srcSet}
                sizes={srcSet ? '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1600px' : undefined}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onClick={onClick}
                onError={handleError}
                onLoad={handleLoad}
                loading={loading}
                style={style}
            />
        </div>
    );
};

export const OptimizedImage = React.memo(OptimizedImageBase);
