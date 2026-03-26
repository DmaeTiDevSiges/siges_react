import React from 'react';
import { IconButton } from './ui/IconButton';
import { usePermissions } from '../contexts/PermissionsContext';

interface SidebarProps {
    onNavigate: (screen: string) => void;
    isAdminSuper?: boolean;
    activeTab: 'dashboard' | 'orders' | 'units' | 'assets' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags';
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    currentUser?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onNavigate,
    isAdminSuper,
    activeTab,
    isCollapsed = false,
    onToggleCollapse,
    currentUser
}) => {
    const { canView } = usePermissions();

    return (
        <div className={`
            hidden md:flex flex-col h-full bg-white dark:bg-card-dark border-r border-slate-100 dark:border-slate-800 transition-all duration-300 safe-area-top safe-area-bottom
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}>
            {/* Header */}
            <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white animate-in fade-in duration-300">Menu</h2>
                )}

                {/* Toggle Button for Desktop */}
                <IconButton
                    icon={isCollapsed ? 'menu_open' : 'menu'}
                    onClick={onToggleCollapse}
                    className="text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title={isCollapsed ? "Expandir" : "Recolher"}
                />
            </div>

            {/* Navigation Items */}
            <nav className={`flex-1 p-4 space-y-2 ${isCollapsed ? 'px-2' : 'p-4'}`}>
                <SidebarItem
                    icon="grid_view"
                    label="Painel"
                    isActive={activeTab === 'dashboard'}
                    isCollapsed={isCollapsed}
                    onClick={() => { onNavigate('dashboard'); }}
                />
                {(isAdminSuper || canView('dashboard_orders_admin')) && (
                    <SidebarItem
                        icon="assignment_add"
                        label="Gestão"
                        isActive={activeTab === 'orders' || activeTab === 'visits' || activeTab === 'dashboard-units-assets-tags'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('orders'); }}
                    />
                )}
                {(isAdminSuper || canView('units')) && (
                    <SidebarItem
                        icon="apartment"
                        label="Unidades"
                        isActive={activeTab === 'units'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('units-search'); }}
                    />
                )}
                {(isAdminSuper || canView('assets')) && (
                    <SidebarItem
                        icon="inventory_2"
                        label="Ativos"
                        isActive={activeTab === 'assets'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('assets'); }}
                    />
                )}
                {(isAdminSuper || canView('maintenance_plans')) && (
                    <SidebarItem
                        icon="checklist"
                        label="PMP"
                        isActive={activeTab === 'maintenance-plans'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('maintenance-plans'); }}
                    />
                )}
                {(isAdminSuper || canView('settings')) && (
                    <SidebarItem
                        icon="settings"
                        label="Ajustes"
                        isActive={activeTab === 'profile-permissions' || activeTab === 'settings' || activeTab === 'companies'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('settings'); }}
                    />
                )}
            </nav>
        </div>
    );
};

interface SidebarItemProps {
    icon: string;
    label: string;
    isActive: boolean;
    isCollapsed?: boolean;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, isCollapsed, onClick }) => (
    <button
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={`
            w-full flex items-center rounded-xl transition-all duration-200
            ${isCollapsed ? 'justify-center p-3' : 'p-3 gap-3'}
            ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        `}
    >
        <span className="material-symbols-outlined">{icon}</span>
        {!isCollapsed && (
            <span className="font-medium text-sm whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                {label}
            </span>
        )}
    </button>
);
