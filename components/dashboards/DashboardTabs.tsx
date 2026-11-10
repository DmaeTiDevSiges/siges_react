import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

interface DashboardTabsProps {
  currentScreen: string;
  setCurrentScreen: React.Dispatch<React.SetStateAction<any>>;
  ordersDashboardTab: 'OS' | 'VISITAS';
  setOrdersDashboardTab: React.Dispatch<React.SetStateAction<'OS' | 'VISITAS'>>;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  isAdminSuper?: boolean;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  currentScreen,
  setCurrentScreen,
  ordersDashboardTab,
  setOrdersDashboardTab,
  setActiveTab,
  isAdminSuper = false,
}) => {
  const { canView } = usePermissions();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollHints = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Roda do mouse rola as abas na horizontal (a barra não mostra scrollbar).
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', updateScrollHints, { passive: true });
    window.addEventListener('resize', updateScrollHints);
    updateScrollHints();
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', updateScrollHints);
      window.removeEventListener('resize', updateScrollHints);
    };
  });

  // Mantém a aba ativa visível.
  React.useEffect(() => {
    const active = scrollRef.current?.querySelector('.text-primary');
    (active as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [currentScreen, ordersDashboardTab]);

  const hasServices = canView('dashboard_services');
  const hasOrders = canView('dashboard_orders');
  const hasVisits = canView('dashboard_orders_visits');
  const hasUnits = canView('dashboard_units_assets_tags');
  const hasPower = canView('dashboard_units_power_electric');
  const hasEvaluations = canView('dashboard_contracts_evaluations');
  const hasVehicle = canView('dashboard_vehicles');
  const hasGrant = canView('orders_timeline');
  const hasTeamShifts = canView('dashboard_teams_shifts');
  const hasDailySchedule = canView('orders_daily_schedule');

  const isDashboardScreen =
    currentScreen === 'ss-dashboard' ||
    currentScreen === 'ss-dashboard-period' ||
    currentScreen === 'orders-dashboard' ||
    currentScreen === 'orders-dashboard-period' ||
    currentScreen === 'visits-dashboard' ||
    currentScreen === 'dashboard-units-power-electric' ||
    currentScreen === 'dashboard-units-assets-tags' ||
    currentScreen === 'dashboard-contracts-evaluations' ||
    currentScreen === 'dashboard-orders-admin-calendar' ||
    currentScreen === 'materials-dashboard' ||
    currentScreen === 'services-history' ||
    currentScreen === 'rental-apportionment' ||
    currentScreen === 'rental-contracts' ||
    currentScreen === 'rate-contracts' ||
    currentScreen === 'vehicles' ||
    currentScreen === 'grant-dashboard' ||
    currentScreen === 'orders-daily-schedule' ||
    currentScreen === 'team-shifts';

  if (!isDashboardScreen) return null;

  const isVehicleActive =
    currentScreen === 'rental-apportionment' ||
    currentScreen === 'rental-contracts' ||
    currentScreen === 'rate-contracts' ||
    currentScreen === 'vehicles';

  return (
    <div className="flex items-center gap-4 h-full mt-1 min-w-0">
      <div className="hidden md:flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestão</h1>
        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono leading-none mt-0.5 select-all">
          SIGES v{__BUILD_ID__}
        </span>
      </div>
      <div className="hidden md:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
      <div className="relative min-w-0 flex-1">
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-surface-light dark:from-card-dark to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-surface-light dark:from-card-dark to-transparent" />
      )}
      <div ref={scrollRef} className="flex items-center no-scrollbar overflow-x-auto gap-4">
        {hasServices && (
          <button
            onClick={() => setCurrentScreen('ss-dashboard')}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${(currentScreen === 'ss-dashboard' || currentScreen === 'ss-dashboard-period') ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            SS's
            {(currentScreen === 'ss-dashboard' || currentScreen === 'ss-dashboard-period') && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasOrders && (
          <button
            onClick={() => { setOrdersDashboardTab('OS'); setCurrentScreen('orders-dashboard'); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${(currentScreen === 'orders-dashboard-period' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS')) ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            OS's
            {(currentScreen === 'orders-dashboard-period' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS')) && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasDailySchedule && (
          <button
            onClick={() => { setCurrentScreen('orders-daily-schedule'); setActiveTab('orders-daily-schedule' as any); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'orders-daily-schedule' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Programação
            {currentScreen === 'orders-daily-schedule' && (
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
        {hasGrant && (
          <button
            onClick={() => { setCurrentScreen('grant-dashboard'); setActiveTab('grant-dashboard' as any); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'grant-dashboard' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Cronograma
            {currentScreen === 'grant-dashboard' && (
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
        {hasVisits && isAdminSuper && (
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
        {hasVehicle && (
          <button
            onClick={() => {
              setCurrentScreen('rental-apportionment');
              setActiveTab('rental-apportionment');
            }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${
              isVehicleActive ? 'text-primary' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Transportes
            {isVehicleActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasEvaluations && (
          <button
            onClick={() => { setCurrentScreen('dashboard-contracts-evaluations'); setActiveTab('dashboard-contracts-evaluations'); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'dashboard-contracts-evaluations' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Avaliações
            {currentScreen === 'dashboard-contracts-evaluations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
        {hasTeamShifts && (
          <button
            onClick={() => { setCurrentScreen('team-shifts'); setActiveTab('team-shifts' as any); }}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${currentScreen === 'team-shifts' ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
          >
            Ociosidade
            {currentScreen === 'team-shifts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
      </div>
      </div>
    </div>
  );
};
