import React from 'react';
import { Avatar } from './Avatar';

interface CompanyAvatarProps {
    src?: string;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    imageClassName?: string;
}

/**
 * Premium Company Avatar component optimized for logos.
 * Features a clean white background and standard Sigēs rounding.
 */
export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
    src,
    name,
    size = 'md',
    className = '',
    imageClassName = ''
}) => {
    return (
        <Avatar
            src={src}
            alt={name}
            size={size}
            shape="rounded"
            // Logo specific styling: force white background and clean border
            // We use w-full! h-full! to ensure it adheres to the className passed from parent
            className={`bg-white! dark:bg-white! border-slate-100! ${className}`}
            imageClassName={`object-contain p-1 ${imageClassName}`}
        />
    );
};
