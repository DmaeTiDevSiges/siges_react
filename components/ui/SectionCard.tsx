import React from 'react';

/**
 * Card de seção da home (visual novo / v2): título, valor em destaque,
 * linha de apoio e chevron. O card inteiro é clicável.
 */

interface SectionCardProps {
    title: React.ReactNode;
    icon?: string;
    /** Valor principal em destaque (número, texto curto ou <HiddenValue>). */
    value?: React.ReactNode;
    /** Linha de apoio abaixo do valor. */
    description?: React.ReactNode;
    /** Ação em pílula no rodapé (ex.: "Retomar visita"). */
    action?: { label: string; onClick: () => void };
    onClick?: () => void;
    /** Destaque: fundo suave da marca (ex.: visita em andamento). */
    highlight?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    value,
    description,
    action,
    onClick,
    highlight = false,
    children,
    className = '',
}) => {
    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            className={`rounded-card p-5 ${highlight ? 'bg-brand-soft' : 'bg-surface'} ${onClick ? 'cursor-pointer transition-transform duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40' : ''} ${className}`}
        >
            <div className="flex items-center gap-2">
                {icon && <span className={`material-symbols-outlined text-[22px] ${highlight ? 'text-brand' : 'text-fg'}`}>{icon}</span>}
                <h3 className="flex-1 min-w-0 text-headline text-fg truncate">{title}</h3>
                {onClick && <span className="material-symbols-outlined text-[22px] text-fg-subtle">chevron_right</span>}
            </div>

            {value !== undefined && (
                <div className="mt-3 text-title text-fg">{value}</div>
            )}
            {description && (
                <p className="mt-1 text-label font-normal text-fg-muted">{description}</p>
            )}
            {children && <div className="mt-3">{children}</div>}
            {action && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                    className="mt-4 h-10 px-5 rounded-full bg-brand text-on-brand text-label font-semibold cursor-pointer transition-colors hover:bg-brand-strong active:scale-[0.98]"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
