import React from 'react';
import { Avatar } from './Avatar';

export type UserStatus = 'available' | 'unavailable' | 'busy';

interface UserAvatarProps {
    src?: string;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    status?: UserStatus;
    isOvInProgress?: boolean;
    className?: string;
    imageClassName?: string;
}

const statusColors = {
    available: '#22C55E', // green-500
    unavailable: '#94A3B8', // slate-400
    busy: '#EF4444', // red-500
};

/**
 * Premium User Avatar component with status indicator represented by a border.
 * Automatically handles initials fallback when image is missing.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    name,
    size = 'md',
    status = 'unavailable',
    isOvInProgress = false,
    className = '',
    imageClassName = ''
}) => {
    // Determine the actual visual status based on combined rules:
    // 1) available (Green): users.is_available = true
    // 2) busy (Red): is_ov_in_progress = true
    // 3) unavailable (Slate): users.is_available = false

    let visualStatus: UserStatus = 'unavailable';

    if (isOvInProgress || status === 'busy') {
        visualStatus = 'busy';
    } else if (status === 'available') {
        visualStatus = 'available';
    } else {
        visualStatus = 'unavailable';
    }

    // Determine border color and weight
    const borderColor = statusColors[visualStatus];
    const borderWeight = '4px';

    const sizeClasses = {
        xs: 'w-7 h-7',
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
        '2xl': 'w-40 h-40'
    };

    const isFullSize = className.includes('w-full') || className.includes('h-full') || className.includes('w-[') || className.includes('h-[');

    return (
        <div className={`relative inline-flex shrink-0 rounded-full ${!isFullSize ? sizeClasses[size] : ''} ${className}`}>
            <Avatar
                src={src}
                alt={name}
                size={size}
                shape="circle"
                style={{
                    border: `${borderWeight} solid ${borderColor}`,
                    transition: 'border-color 0.3s ease, border-width 0.3s ease'
                }}
                className={`bg-slate-50 dark:bg-slate-800 w-full! h-full!`}
                imageClassName={imageClassName}
            />
        </div>
    );
};
