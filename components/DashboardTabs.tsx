import React from 'react';
import { usePermissions } from '../contexts/PermissionsContext';

interface DashboardTabsProps {
  currentScreen: string;
  setCurrentScreen: React.Dispatch<React.SetStateAction<any>>;
  ordersDashboardTab: 'OS' | 'VISITAS';
  setOrdersDashboardTab: React.Dispatch<React.SetStateAction<'OS' | 'VISITAS'>>;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  currentScreen,
  setCurrentScreen,
  ordersDashboardTab,
  setOrdersDashboardTab,
  setActiveTab,
}) => {
  const { canView } = usePermissions();

  const hasOrders = canView('dashboard_orders');
  const hasVisits = canView('dashboard_orders_visits');
  const hasUnits = canView('dashboard_units_assets_tags');
  const hasPower = canView('dashboard_units_power_electric');

  const isDashboardScreen =
    currentScreen === 'orders-dashboard' ||
    currentScreen === 'visits-dashboard' ||
    currentScreen === 'dashboard-units-power-electric' ||
    currentScreen === 'dashboard-units-assets-tags' ||
    currentScreen === 'dashboard-orders-admin-calendar' ||
    currentScreen === 'materials-dashboard' ||
    currentScreen === 'services-history';

  if (!isDashboardScreen) return null;

  return (
    <div className="flex items-center gap-4 h-full mt-1">
      <h1 className="hidden md:block text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestão</h1>
      <div className="hidden md:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {hasOrders && (
          <button
            onClick={() => { setOrdersDashboardTab('OS'); setCurrentScreen('orders-dashboard'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap flex-shrink-0 ${currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            OS's
          </button>
        )}
        {hasVisits && (
          <button
            onClick={() => { setOrdersDashboardTab('VISITAS'); setCurrentScreen('visits-dashboard'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap flex-shrink-0 ${(currentScreen === 'visits-dashboard' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'VISITAS')) ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            Visitas
          </button>
        )}
        {hasUnits && (
          <button
            onClick={() => { setCurrentScreen('dashboard-units-assets-tags'); setActiveTab('dashboard-units-assets-tags'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap flex-shrink-0 ${currentScreen === 'dashboard-units-assets-tags' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            Unidades
          </button>
        )}
        {hasVisits && (
          <button
            onClick={() => setCurrentScreen('dashboard-orders-admin-calendar')}
            className={`pb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap flex-shrink-0 ${currentScreen === 'dashboard-orders-admin-calendar' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            <span className="material-symbols-outlined text-[14px]">calendar_view_week</span>
            Calendário
          </button>
        )}
        {canView('dashboard_materials') && (
          <button
            onClick={() => setCurrentScreen('materials-dashboard')}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 whitespace-nowrap flex-shrink-0 ${currentScreen === 'materials-dashboard' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            Materiais
          </button>
        )}
      </div>
    </div>
  );
};
