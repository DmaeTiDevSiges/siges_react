/**
 * OptimizedImage.tsx
 * Componente React para exibição de imagens otimizadas via imgproxy
 */

import React, { useState, useEffect } from 'react';
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

    // Verifica se a URL é do tipo blob ou data, que não podem ser acessadas pelo servidor imgproxy
    const isLocalUrl = src.startsWith('blob:') || src.startsWith('data:');

    // Se imgproxy não estiver configurado, houver erro ou for local, usa imagem original
    const shouldOptimize = imgproxyService.isImgproxyConfigured() && !hasError && !isLocalUrl;

    useEffect(() => {
        if (!shouldOptimize && !hasError) {
            console.warn(`[OptimizedImage] Usando imagem original para ${src?.substring(0, 50)}... Motivo: ${isLocalUrl ? 'URL local (blob/data)' : 'imgproxy não configurado'}`);
        }
    }, [src, shouldOptimize, hasError, isLocalUrl]);

    // Gera URL otimizada
    const optimizedSrc = shouldOptimize
        ? imgproxyService.getPresetUrl(src, preset)
        : src;

    // Gera srcset para imagens responsivas
    const srcSet = shouldOptimize && useSrcSet && preset !== 'original'
        ? imgproxyService.generateSrcSet(src)
        : undefined;

    const handleError = () => {
        console.warn(`Erro ao carregar imagem otimizada: ${optimizedSrc}. Usando original.`);
        setHasError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Placeholder durante carregamento */}
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            )}

            <img
                src={hasError ? src : optimizedSrc}
                srcSet={hasError ? undefined : srcSet}
                sizes={useSrcSet ? "(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px" : undefined}
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
