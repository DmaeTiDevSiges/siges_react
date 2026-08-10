import React from 'react';
import { OrderVisit } from '../../types';

interface OrderVisitButtonProcessingProps {
    visit?: OrderVisit;
    icon?: string;
    iconColor?: string;
    bgColor?: string;
    className?: string;
    width?: string;
    height?: string;
    onClick?: () => void;
    isEnabled?: boolean;
}

export const OrderVisitButtonProcessing: React.FC<OrderVisitButtonProcessingProps> = ({
    visit,
    icon,
    iconColor,
    bgColor,
    className = '',
    width = 'w-12',
    height = 'h-12',
    onClick,
    isEnabled = true
}) => {
    // Derive values: explicit prop > visit prop > default
    const finalIcon = icon || visit?.processingIcon || 'engineering';
    const finalIconColor = iconColor || visit?.processingIconColor || 'text-white';
    const finalBgColor = bgColor || visit?.processingBgColor || 'bg-slate-500';

    return (
        <button
            onClick={isEnabled ? onClick : undefined}
            disabled={!isEnabled}
            type="button"
            className={`${width} ${height} rounded-xl ${finalBgColor} flex items-center justify-center ${finalIconColor} shrink-0 ${className} border-none outline-none transition-transform ${isEnabled ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
        >
            <span className="material-symbols-outlined text-2xl">
                {finalIcon}
            </span>
        </button>
    );
};
