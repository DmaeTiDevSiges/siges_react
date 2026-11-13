import React from 'react';

/**
 * Linha de lista "ícone · título/subtítulo · valor · ›" (visual novo / v2).
 * A linha inteira é clicável quando há onClick. Use dentro de um container com
 * `divide-y divide-line` para as divisórias.
 */

interface ListRowProps {
    icon?: string;
    /** Cor do círculo do ícone (classes). Padrão: fundo suave da marca. */
    iconClassName?: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Valor/badge à direita, antes do chevron. */
    trailing?: React.ReactNode;
    onClick?: () => void;
    showChevron?: boolean;
    className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
    icon,
    iconClassName = 'bg-brand-soft text-brand',
    title,
    subtitle,
    trailing,
    onClick,
    showChevron = !!onClick,
    className = '',
}) => {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            {...(onClick ? { type: 'button' as const, onClick } : {})}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${onClick ? 'cursor-pointer transition-colors active:bg-surface-2 focus:outline-none focus-visible:bg-surface-2' : ''} ${className}`}
        >
            {icon && (
                <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconClassName}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </span>
            )}
            <span className="flex-1 min-w-0">
                <span className="block text-body text-fg font-medium truncate">{title}</span>
                {subtitle && <span className="block text-label font-normal text-fg-muted truncate">{subtitle}</span>}
            </span>
            {trailing && <span className="shrink-0 text-label text-fg-muted">{trailing}</span>}
            {showChevron && (
                <span className="material-symbols-outlined shrink-0 text-[22px] text-fg-subtle">chevron_right</span>
            )}
        </Tag>
    );
};
