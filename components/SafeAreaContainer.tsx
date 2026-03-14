import React from 'react';

interface SafeAreaContainerProps {
    children: React.ReactNode;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
    className?: string;
    as?: React.ElementType;
}

/**
 * SafeAreaContainer - Componente wrapper para aplicar safe area insets
 * 
 * Respeita as áreas seguras de dispositivos móveis (notch, status bar, home indicator)
 * 
 * @param top - Aplica padding-top para notch/status bar (padrão: true)
 * @param bottom - Aplica padding-bottom para home indicator (padrão: true)
 * @param left - Aplica padding-left para bordas laterais (padrão: false)
 * @param right - Aplica padding-right para bordas laterais (padrão: false)
 * @param className - Classes CSS adicionais
 * @param as - Elemento HTML a ser renderizado (padrão: 'div')
 * 
 * @example
 * ```tsx
 * <SafeAreaContainer top bottom>
 *   <YourContent />
 * </SafeAreaContainer>
 * ```
 */
export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
    children,
    top = false,
    bottom = false,
    left = false,
    right = false,
    className = '',
    as: Component = 'div'
}) => {
    const safeAreaClasses = [
        top && 'safe-area-top',
        bottom && 'safe-area-bottom',
        left && 'safe-area-left',
        right && 'safe-area-right',
        className
    ].filter(Boolean).join(' ');

    return React.createElement(Component, { className: safeAreaClasses }, children);
};
