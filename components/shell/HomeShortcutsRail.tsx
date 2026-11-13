import React from 'react';
import { ShortcutRail } from '../ui/ShortcutRail';
import { useHomeShortcuts } from './useHomeShortcuts';

/** Faixa de atalhos logo abaixo do topo da home (visual novo / v2). */
export const HomeShortcutsRail: React.FC<{
    navigate: (tab: string) => void;
    isAdminSuper?: boolean;
    isAdmin?: boolean;
}> = ({ navigate, isAdminSuper, isAdmin }) => {
    const items = useHomeShortcuts(navigate, { isAdminSuper, isAdmin });
    if (items.length === 0) return null;
    return (
        <div className="shrink-0 bg-surface pt-4 pb-3">
            <ShortcutRail items={items} />
        </div>
    );
};
