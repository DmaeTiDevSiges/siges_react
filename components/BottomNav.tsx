import React from 'react';

import { usePermissions } from '../contexts/PermissionsContext';

interface BottomNavProps {
  activeTab: 'dashboard' | 'orders' | 'units' | 'assets' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags' | 'dashboard-units-power-electric' | 'tools' | 'materials' | 'manuals' | 'app-notices' | 'app-tips';
  setActiveTab: (tab: any) => void;
  isAdminSuper?: boolean;
  currentUser?: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdminSuper, currentUser }) => {
  const { canView, canSearch, permissions } = usePermissions();

  // Definir visibilidade para cada aba
  const showDashboard = true; 
  const showGestao = isAdminSuper || 
                    canView('dashboard_orders') || 
                    canView('dashboard_orders_visits') || 
                    canView('dashboard_units_assets_tags') || 
                    canView('dashboard_units_power_electric');
  const showUnitsSearch = canSearch('units'); 
  const showAssetsSearch = canSearch('assets');
  const showSettings = isAdminSuper; 
  const showTools = isAdminSuper || canView('tools_create_edit_delete');
  const showMaterials = isAdminSuper || canView('materials_search');
  const showMaintenancePlans = isAdminSuper || canView('maintenance_plans');
  const showManuals = isAdminSuper || canView('technicals_manuals_search');
  const showNotices = isAdminSuper || canView('app_notices');
  const showTips = isAdminSuper;

  return (
    <div className="shrink-0 w-full bg-surface-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pt-2 px-2 flex flex-row items-center overflow-x-auto rounded-t-[12px]" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>

      {showDashboard && (
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'dashboard' ? '"FILL" 1' : '' }}>
            grid_view
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Painel</span>
        </button>
      )}

      {showGestao && (
        <button
          onClick={() => {
            if (canView('dashboard_orders')) setActiveTab('orders');
            else if (canView('dashboard_orders_visits')) setActiveTab('visits');
            else if (canView('dashboard_units_assets_tags')) setActiveTab('dashboard-units-assets-tags');
            else if (canView('dashboard_units_power_electric')) setActiveTab('dashboard-units-power-electric');
          }}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'orders' || activeTab === 'visits' || activeTab === 'dashboard-units-assets-tags' || activeTab === 'dashboard-units-power-electric' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: (activeTab === 'orders' || activeTab === 'visits' || activeTab === 'dashboard-units-assets-tags' || activeTab === 'dashboard-units-power-electric') ? '"FILL" 1' : '' }}>
            assignment
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-full">Gestão</span>
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

      {showMaterials && (
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'materials' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'materials' ? '"FILL" 1' : '' }}>
            inventory
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Materiais</span>
        </button>
      )}

      {showMaintenancePlans && (
        <button
          onClick={() => setActiveTab('maintenance-plans')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'maintenance-plans' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'maintenance-plans' ? '"FILL" 1' : '' }}>
            checklist
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">PMP</span>
        </button>
      )}

      {showManuals && (
        <button
          onClick={() => setActiveTab('manuals')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'manuals' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'manuals' ? '"FILL" 1' : '' }}>
            menu_book
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Manuais</span>
        </button>
      )}

      {showNotices && (
        <button
          onClick={() => setActiveTab('app-notices')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'app-notices' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'app-notices' ? '"FILL" 1' : '' }}>
            notifications
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Avisos</span>
        </button>
      )}

      {showTips && (
        <button
          onClick={() => setActiveTab('app-tips')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'app-tips' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'app-tips' ? '"FILL" 1' : '' }}>
            tips_and_updates
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Dicas</span>
        </button>
      )}

      {showTools && (
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-colors ${activeTab === 'tools' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'tools' ? '"FILL" 1' : '' }}>
            handyman
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ferramentas</span>
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

