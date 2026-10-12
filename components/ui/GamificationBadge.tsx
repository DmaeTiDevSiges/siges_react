import React from 'react';

interface GamificationBadgeProps {
    position: number;
    positionChange?: number;
    onClick?: () => void;
}

export const GamificationBadge: React.FC<GamificationBadgeProps> = ({
    position,
    positionChange = 0,
    onClick,
}) => {
    const movement = positionChange > 0 ? 'up' : positionChange < 0 ? 'down' : null;
    const movementDescription = movement === 'up'
        ? `Subiu ${positionChange} ${positionChange === 1 ? 'posição' : 'posições'}`
        : movement === 'down'
            ? `Caiu ${Math.abs(positionChange)} ${Math.abs(positionChange) === 1 ? 'posição' : 'posições'}`
            : null;

    return (
        <span
            onClick={onClick}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick?.();
                }
            }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={`inline-flex items-center ${onClick ? 'cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary' : ''}`}
            title={`Ver ranking da equipe${movementDescription ? ` · ${movementDescription} em relação ao mês anterior` : ''}`}
        >
            <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-amber-500" aria-hidden="true">
                <span className="material-symbols-outlined !text-[40px] leading-none">
                    workspace_premium
                </span>
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-amber-600 px-0.5 text-[10px] font-black leading-none text-black shadow-sm dark:border-card-dark">
                    {position}º
                </span>
            </span>
        </span>
    );
};
