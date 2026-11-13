import React from 'react';
import { useUiVersion } from '../../contexts/UiVersionContext';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    id?: string;
    noBorder?: boolean;
    noShadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, id, noBorder, noShadow }) => {
    const { isV2 } = useUiVersion();

    if (isV2) {
        // v2: superfície plana — sem borda e sem sombra; separação por espaço.
        return (
            <div
                id={id}
                onClick={onClick}
                className={`bg-surface p-4 rounded-card ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
            >
                {children}
            </div>
        );
    }

    return (
        <div
            id={id}
            onClick={onClick}
            className={`bg-white dark:bg-slate-800/40 backdrop-blur-sm p-4 rounded-[16px] ${noShadow ? '' : 'shadow-sm'} ${noBorder ? '' : 'border border-slate-100 dark:border-white/5'} ${className}`}
        >
            {children}
        </div>
    );
};
