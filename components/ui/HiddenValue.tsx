import React from 'react';
import { useUiVersion } from '../../contexts/UiVersionContext';

/**
 * Valor que some quando "Ocultar valores" (ícone de olho) está ativo.
 * Só oculta no visual novo (v2); no v1 mostra sempre.
 */
export const HiddenValue: React.FC<{ children: React.ReactNode; mask?: string; className?: string }> = ({
    children,
    mask = '••••',
    className = '',
}) => {
    const { isV2, hideValues } = useUiVersion();
    if (isV2 && hideValues) {
        return <span className={className} aria-label="Valor oculto">{mask}</span>;
    }
    return <span className={className}>{children}</span>;
};
