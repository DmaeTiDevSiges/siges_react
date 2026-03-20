/**
 * OptimizedImage.tsx
 * Exibe imagens otimizadas via imgproxy com fallback automático para a original.
 */

import React, { useState } from 'react';
import { imgproxyService, ImagePreset } from '../../services/imgproxyService';

export interface OptimizedImageProps {
    src: string;
    alt: string;
    preset?: ImagePreset;
    className?: string;
    onClick?: () => void;
    useSrcSet?: boolean;
    loading?: 'lazy' | 'eager';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    preset = 'medium',
    className = '',
    onClick,
    useSrcSet = true,
    loading = 'lazy',
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // URLs locais (blob/data) nunca passam pelo imgproxy
    const isLocalUrl = src?.startsWith('blob:') || src?.startsWith('data:');

    const shouldOptimize =
        !hasError && !isLocalUrl && imgproxyService.isImgproxyConfigured();

    const optimizedSrc = shouldOptimize
        ? imgproxyService.getPresetUrl(src, preset)
        : src;

    const srcSet =
        shouldOptimize && useSrcSet && preset !== 'original'
            ? imgproxyService.generateSrcSet(src)
            : undefined;

    const handleError = () => {
        if (hasError) {
            // Já está usando a original — não faz mais nada
            setIsLoading(false);
            return;
        }

        // Primeira falha: reporta ao circuit breaker e usa original
        imgproxyService.reportServiceFailure();
        setHasError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        if (shouldOptimize) {
            // Sucesso via imgproxy — reseta contador de falhas
            imgproxyService.reportServiceSuccess();
        }
        setIsLoading(false);
    };

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            )}

            <img
                src={hasError ? src : optimizedSrc}
                srcSet={hasError ? undefined : srcSet}
                sizes={useSrcSet ? '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px' : undefined}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onClick={onClick}
                onError={handleError}
                onLoad={handleLoad}
                loading={loading}
            />
        </div>
    );
};
