import { useMemo } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { ShortcutItem } from '../ui/ShortcutRail';

/**
 * Atalhos da home no visual novo (v2). Mesmos destinos e permissões do BottomNav
 * (components/shell/BottomNav.tsx) — manter os dois em sincronia até o v1 ser removido (F6).
 */
export const useHomeShortcuts = (
    navigate: (tab: string) => void,
    opts: { isAdminSuper?: boolean; isAdmin?: boolean }
): ShortcutItem[] => {
    const { canView, canSearch } = usePermissions();
    const { isAdminSuper, isAdmin } = opts;

    return useMemo(() => {
        const items: (ShortcutItem & { show: boolean })[] = [];

        const gestaoTab =
            canView('dashboard_services') ? 'ss'
            : canView('dashboard_orders') ? 'orders'
            : canView('dashboard_orders_visits') ? 'visits'
            : canView('dashboard_units_assets_tags') ? 'dashboard-units-assets-tags'
            : canView('dashboard_units_power_electric') ? 'dashboard-units-power-electric'
            : canView('dashboard_contracts_evaluations') ? 'dashboard-contracts-evaluations'
            : canView('dashboard_teams_shifts') ? 'team-shifts'
            : canView('orders_daily_schedule') ? 'orders-daily-schedule'
            : null;

        items.push(
            { id: 'gestao', icon: 'assignment', label: 'Gestão', show: !!gestaoTab, onClick: () => gestaoTab && navigate(gestaoTab) },
            { id: 'units', icon: 'apartment', label: 'Unidades', show: canSearch('units'), onClick: () => navigate('units') },
            { id: 'assets', icon: 'inventory_2', label: 'Ativos', show: canSearch('assets'), onClick: () => navigate('assets') },
            { id: 'materials', icon: 'trolley', label: 'Materiais', show: !!isAdminSuper || canSearch('materials_search'), onClick: () => navigate('materials') },
            { id: 'maintenance-plans', icon: 'checklist', label: 'PMP', show: !!isAdminSuper || canView('maintenance_plans'), onClick: () => navigate('maintenance-plans') },
            { id: 'manuals', icon: 'menu_book', label: 'Manuais', show: !!isAdminSuper || canView('technicals_manuals_search'), onClick: () => navigate('manuals') },
            { id: 'app-notices', icon: 'campaign', label: 'Avisos', show: !!isAdminSuper || (canView('app_notices') && canSearch('app_notices')), onClick: () => navigate('app-notices') },
            { id: 'tools', icon: 'handyman', label: 'Ferramentas', show: !!isAdminSuper || canView('tools_create_edit_delete'), onClick: () => navigate('tools') },
            { id: 'extra-workers', icon: 'groups', label: 'MO Extra', show: !!isAdminSuper || canView('notices_workers_extra'), onClick: () => navigate('extra-workers') },
            { id: 'settings', icon: 'settings', label: 'Ajustes', show: !!isAdminSuper || !!isAdmin, onClick: () => navigate('settings') },
        );

        return items.filter(i => i.show).map(({ show, ...i }) => i);
    }, [canView, canSearch, isAdminSuper, isAdmin, navigate]);
};
