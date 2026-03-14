import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    id?: string;
    noBorder?: boolean;
    noShadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, id, noBorder, noShadow }) => {
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
