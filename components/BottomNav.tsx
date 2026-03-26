import React from 'react';

import { usePermissions } from '../contexts/PermissionsContext';

interface BottomNavProps {
  activeTab: 'dashboard' | 'orders' | 'units' | 'assets' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags';
  setActiveTab: (tab: any) => void;
  isAdminSuper?: boolean;
  currentUser?: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdminSuper, currentUser }) => {
  const { canView, canSearch, permissions } = usePermissions();

  // Define visibility for each tab
  const showDashboard = true; // Always show? Or check canView('dashboard')?
  const showDashboardOrdersAdmin = canView('dashboard_orders_admin');
  const showUnitsSearch = canSearch('units'); // Assuming route key is 'units'
  const showAssetsSearch = canSearch('assets');

  const showSettings = isAdminSuper; // Only admin super

  return (
    <div className="shrink-0 w-full bg-surface-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pt-2 px-2 flex flex-row items-center justify-between rounded-t-[12px]" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>

      {showDashboard && (
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'dashboard' ? '"FILL" 1' : '' }}>
            grid_view
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Meu Painel</span>
        </button>
      )}

      {showDashboardOrdersAdmin && (
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'orders' || activeTab === 'dashboard-units-assets-tags' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'orders' ? '"FILL" 1' : '' }}>
            assignment
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-full">Gestao OS</span>
        </button>
      )}

      {showUnitsSearch && (
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'units' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'units' ? '"FILL" 1' : '' }}>
            apartment
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Unidades</span>
        </button>
      )}

      {showAssetsSearch && (
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'assets' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'assets' ? '"FILL" 1' : '' }}>
            inventory_2
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ativos</span>
        </button>
      )}

      {showSettings && (
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'settings' ? '"FILL" 1' : '' }}>
            settings
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-full">Ajustes</span>
        </button>
      )}
    </div>
  );
};

