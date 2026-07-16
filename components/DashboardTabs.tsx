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
      <div className="flex items-center border-b border-slate-200 dark:border-white/5 no-scrollbar overflow-x-auto gap-4">
        {hasOrders && (
          <button
            onClick={() => { setOrdersDashboardTab('OS'); setCurrentScreen('orders-dashboard'); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            OS's
            {currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasVisits && (
          <button
            onClick={() => { setOrdersDashboardTab('VISITAS'); setCurrentScreen('visits-dashboard'); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${(currentScreen === 'visits-dashboard' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'VISITAS')) ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Visitas
            {(currentScreen === 'visits-dashboard' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'VISITAS')) && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasUnits && (
          <button
            onClick={() => { setCurrentScreen('dashboard-units-assets-tags'); setActiveTab('dashboard-units-assets-tags'); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'dashboard-units-assets-tags' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Unidades
            {currentScreen === 'dashboard-units-assets-tags' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasVisits && (
          <button
            onClick={() => setCurrentScreen('dashboard-orders-admin-calendar')}
            className={`pb-4 px-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'dashboard-orders-admin-calendar' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-[14px]">calendar_view_week</span>
            Calendário
            {currentScreen === 'dashboard-orders-admin-calendar' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {canView('dashboard_materials') && (
          <button
            onClick={() => setCurrentScreen('materials-dashboard')}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'materials-dashboard' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Materiais
            {currentScreen === 'materials-dashboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
