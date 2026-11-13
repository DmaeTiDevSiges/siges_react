import React from 'react';

/**
 * Atalhos circulares em carrossel horizontal (visual novo / v2).
 * Círculo 64px com ícone + legenda curta abaixo.
 */

export interface ShortcutItem {
    id: string;
    icon: string;
    label: string;
    onClick: () => void;
    /** Número pequeno no canto (ex.: pendências). */
    badge?: number;
}

interface ShortcutButtonProps extends Omit<ShortcutItem, 'id'> {
    className?: string;
}

export const ShortcutButton: React.FC<ShortcutButtonProps> = ({ icon, label, onClick, badge, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group shrink-0 w-[72px] flex flex-col items-center gap-2 snap-start cursor-pointer focus:outline-none ${className}`}
    >
        <span className="relative w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-fg transition-transform duration-150 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand/40">
            <span className="material-symbols-outlined text-[26px]">{icon}</span>
            {!!badge && badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-brand text-on-brand text-[11px] font-semibold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </span>
        <span className="text-caption text-fg text-center leading-tight line-clamp-2">{label}</span>
    </button>
);

interface ShortcutRailProps {
    items: ShortcutItem[];
    className?: string;
}

export const ShortcutRail: React.FC<ShortcutRailProps> = ({ items, className = '' }) => {
    if (items.length === 0) return null;
    return (
        <div className={`flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 px-4 py-1 ${className}`}>
            {items.map(({ id, ...item }) => (
                <ShortcutButton key={id} {...item} />
            ))}
        </div>
    );
};
