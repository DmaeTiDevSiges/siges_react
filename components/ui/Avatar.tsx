import React, { useState } from 'react';
import { OptimizedImage } from './OptimizedImage';

interface AvatarProps {
    src?: string;
    alt: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    fallbackIcon?: string;
    shape?: 'circle' | 'rounded';
    className?: string;
    imageClassName?: string;
    style?: React.CSSProperties;
}

const sizeClasses = {
    xs: 'h-7 w-7 text-[14px]',
    sm: 'h-10 w-10 text-[20px]',
    md: 'h-14 w-14 text-[28px]',
    lg: 'h-24 w-24 text-[48px]',
    xl: 'h-32 w-32 text-[64px]',
    '2xl': 'h-40 w-40 text-[80px]'
};

const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-[12px]'
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = 'md',
    fallbackIcon = 'Siges',
    shape = 'rounded',
    className = '',
    style = {},
    imageClassName = ''
}) => {
    const [hasError, setHasError] = useState(false);

    React.useEffect(() => {
        setHasError(false);
    }, [src]);

    const baseClasses = `bg-slate-100 dark:bg-slate-700 flex-none overflow-hidden relative aspect-square`;

    // Note: Logging here causes console flood due to frequent re-renders from real-time tracking
    // if (src) console.log(`🖼️ [Avatar] Loading source for ${alt}:`, src);

    const getInitials = (name: string) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div
            className={`${baseClasses} ${sizeClasses[size]} ${shapeClasses[shape]} ${(!className.includes('border') && !style.border) ? 'border border-slate-200 dark:border-slate-600' : ''} flex items-center justify-center ${className}`}
            style={style}
        >
            {src && !hasError && !src.includes('noImageUser.png') ? (
                <OptimizedImage
                    src={src}
                    alt={alt}
                    preset="thumbnail"
                    className={`absolute inset-0 w-full h-full object-cover ${imageClassName}`}
                    onClick={undefined}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    {fallbackIcon === 'Siges' ? (
                        alt ? (
                            <span className="font-black text-slate-400 dark:text-slate-500 tracking-tighter select-none">
                                {getInitials(alt)}
                            </span>
                        ) : (
                            <img
                                src="/siges_logo.png"
                                alt="Siges"
                                className="w-full h-full object-contain p-2 opacity-50"
                            />
                        )
                    ) : (
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">
                            {fallbackIcon}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
