import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NetworkProvider } from './contexts/NetworkContext';
import { logAppVersion } from './utils/consoleControl';
import { announceNotificationArrival } from './hooks/useNotificationArrival';
import { useNetworkStatus, useNetworkAndQuality, useQualityNotifications } from './hooks/useNetworkStatus';
import { useNetworkAndQuality as useCombinedNetwork } from './hooks/useNetworkAndQuality';
import { Layout } from './components/shell/Layout';
import { HomeShortcutsRail } from './components/shell/HomeShortcutsRail';
import { useUiVersion } from './contexts/UiVersionContext';
import { BottomNav } from './components/shell/BottomNav';
import { isOfflineSupported, isOnline } from './services/offline/offlineConfig';
import { Button } from './components/ui/Button';
import { SplashScreen } from './components/shell/SplashScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import UpdateNotifier from './components/shell/UpdateNotifier';
import { LegacyAppMigrationScreen } from './components/shell/LegacyAppMigrationScreen';
import { LocationDisclosureModal } from './components/permissions/LocationDisclosureModal';
import { dataService } from './services/dataService';
import { getCachedCurrentUser } from './services/offline/offlineAuth';
import { PendingOpsPanel } from './components/offline/PendingOpsPanel';
import { hasHeaderBack } from './app/screenBack';
import { fromPath, toPath, type Selection } from './app/screenRoutes';
import { useScreenHistory } from './hooks/useScreenHistory';
import { prefetchVisitOffline, runOfflineAutoSync, setOfflineAutoSyncActive, setOfflineAutoSyncUser } from './services/offline/offlineAutoSync';
import { refreshOfflineGate, subscribeOfflineGate } from './services/offline/offlineGate';
import { usePermissions } from './contexts/PermissionsContext';
import { permissionService } from './services/core/permissionService';
import { Sidebar } from './components/shell/Sidebar';
import { DashboardTabs } from './components/dashboards/DashboardTabs';
import { SettingsRouter, SETTINGS_SCREENS } from './views/Settings/SettingsRouter';
import { LoginScreen } from './views/Users/LoginScreen';
import { Toaster, toast } from 'sonner';
import { consumeReloadNotice, markReload, setDiagnosticsScreen } from './services/core/clientDiagnosticsService';
import { Company, Client, Department, Team, User, Priority, OrderType, OrderSubType, OrderPlan, OrderObject, Contract, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, Asset, UserNotification, Order, OrderVisit, OrderVisitAssetView } from './types';
import {
  CompaniesList,
  CompanyDetails,
  CompanyForm,
  DepartmentForm,
  DepartmentDetails,
  TeamForm,
  TeamDetails,
  ClientsList,
  ClientDetails,
  ClientForm,
  UserForm,
  ProfileScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  DashboardScreen,
  OrdersVisitsDashboardAdmin,
  DashboardOrdersVisitsTodayScreen,
  DashboardUnitsPowerElectric,
  DashboardUnitsAssetsTags,
  DashboardOrdersAdminCalendarScreen,
  OrdersDailyScheduleScreen,
  DashboardServicesAdminScreen,
  DashboardAdminContractsEvaluationsRequirements,
  LeaderRankingDashboard,
  DashboardTeamShifts,
  ServicesRequestsDashboardAdmin,
  ServicesRequestsPeriodDashboardAdmin,
  ContractsList,
  ContractForm,
  ContractDetails,
  UnitsSearch,
  AssetsSearch,
  AssetDetails,
  AssetForm,
  AssetCloneWizard,
  AssetsAlerts,
  AssetsAlertsHeaderWidget,
  OrdersRequestsDashboardAdmin,
  OrdersRequestsPeriodDashboardAdmin,
  NotificationsList,
  AppNoticesList,
  ExtraWorkersList,
  ServiceRequestDetail,
  ServiceRequestPage,
  OrderRequestPage,
  OrderRequestApproveConfirm,
  OrderRequestView,
  OrderVisitPage,
  OrderVisitAssetReport,
  OrderVisitAssetActivities,
  OrderVisitAssetMaterials,
  OrderVisitBottomNav,
  VisitEvaluationPage,
  UsersTracker,
  LocationBlockedScreen,
  UserUnavailableScreen,
  ToolsMainView,
  UnitForm,
  RentalContractList,
  VehiclesDashboardAdminScreen,
  VehicleList,
  FuelExpenseScreen,
} from './app/routes';
import { GrantDashboardScreen } from './views/Dashboards/DashboardGrantScreen';
import { useLocationTracker } from './hooks/useLocationTracker';
import { useKeyboard } from './hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useShiftMonitor } from './hooks/useShiftMonitor';
import { Modal } from './components/ui/Modal';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { GamificationBadge } from './components/ui/GamificationBadge';
import { GamificationHistoryModal } from './components/ui/GamificationHistoryModal';


type Screen = 'ss-dashboard' | 'dashboard' | 'orders-dashboard' | 'visits-dashboard' | 'dashboard-units-power-electric' | 'dashboard-units-assets-tags' | 'dashboard-contracts-evaluations' | 'leader-ranking' | 'companies' | 'company-details' | 'company-form' | 'company-edit' | 'department-form' | 'department-details' | 'department-edit' | 'team-form' | 'team-details' | 'team-edit' | 'user-details' | 'user-form' | 'all-users' | 'profile' | 'notifications' | 'contracts' | 'contract-form' | 'contract-edit' | 'contract-details' | 'units-search' | 'unit-create' | 'assets-search' | 'assets-alerts' | 'asset-details' | 'asset-form' | 'asset-edit' | 'asset-clone-wizard' | 'settings' | 'ai-admin' | 'systems' | 'system-form' | 'system-edit' | 'unit-types' | 'unit-type-form' | 'unit-type-edit' | 'clients' | 'client-details' | 'client-form' | 'client-edit' | 'client-units' | 'client-unit-form' | 'client-unit-edit' | 'unit-details' | 'unit-structure' | 'unit-asset-tag-available' | 'unit-asset-tag-details' | 'activities'
  | 'asset-loan-checklist-types' | 'asset-loan-checklist-type-form' | 'asset-loan-checklist-type-edit'
  | 'loans-checklists' | 'loans-checklist-form' | 'loans-checklist-edit'
  | 'activity-form' | 'activity-edit' | 'services' | 'service-form' | 'service-edit' | 'materials' | 'materials-search' | 'material-form' | 'material-edit' | 'material-details' | 'materials-dashboard' | 'evaluation-requirements' | 'priorities' | 'priority-form' | 'priority-edit' | 'order-types' | 'order-type-form' | 'order-type-edit' | 'order-sub-types' | 'order-sub-type-form' | 'order-sub-type-edit' | 'order-plans' | 'order-plan-form' | 'order-plan-edit' | 'order-objects' | 'order-object-form' | 'order-object-edit' | 'asset-types' | 'asset-type-form' | 'asset-type-edit' | 'asset-type-attributes' | 'asset-attributes-brands' | 'asset-statuses' | 'asset-status-form' | 'asset-status-edit' | 'asset-priorities' | 'asset-priority-form' | 'asset-priority-edit' | 'asset-tags' | 'asset-tag-form' | 'asset-tag-edit' | 'asset-tag-subs' | 'asset-tag-sub-form' | 'asset-tag-sub-edit' | 'technical-manuals' | 'technical-manual-form' | 'technical-manual-edit' | 'technical-manual-details' | 'service-request-detail' | 'service-request-create' | 'services-history' | 'order-detail' | 'order-create' | 'users-tracker'   | 'order-visit-execute' | 'order-visit-asset-report' | 'order-visit-asset-activities' | 'order-visit-asset-materials'   | 'profile-permissions' | 'order-visit-approve' | 'order-visit-evaluation' | 'maintenance-plans' | 'maintenance-plan-form' | 'maintenance-plan-edit' | 'maintenance-plan-details' | 'visits-today' | 'tools' | 'dashboard-orders-admin-calendar'   | 'app-notices' | 'extra-workers' | 'app-tips' | 'audit-log' | 'audit-config' | 'route-management' | 'route-form' | 'route-edit' | 'orders-dashboard-period' | 'ss-dashboard-period'   | 'vehicle-cost-types' | 'rental-contracts' | 'rental-apportionment' | 'rate-contracts' | 'vehicles' | 'fuel-expense' | 'grant-dashboard' | 'team-shifts' | 'orders-daily-schedule' | 'settings-api-guaibaflow';

import { ActionIcon } from './components/ui/ActionIcon';
import { imgproxyService } from './services/media/imgproxyService';
import { Loading } from './components/ui/Loading';

// Gate de permissão para as telas de SS (ss-dashboard / services-history).
// Sem a permissão 'dashboard_services' a aba SS's não aparece, mas sem este gate
// a tela era montada mesmo assim (ex: app_active_tab salvo como 'ss') e executava
// queries/assinaturas de SS em segundo plano. Enquanto as permissões carregam,
// também bloqueia a montagem para evitar que os efeitos da tela rodarem antes
// da checagem.
interface SsScreenGateProps {
  children: React.ReactNode;
  onForbidden: (tab: string) => void;
}

const SsScreenGate: React.FC<SsScreenGateProps> = ({ children, onForbidden }) => {
  const { canView, loading } = usePermissions();

  const forbidden = !loading && !canView('dashboard_services');

  useEffect(() => {
    if (loading || canView('dashboard_services')) return;
    // Redireciona para a primeira aba de Gestão permitida (mesma ordem do Sidebar)
    if (canView('dashboard_orders')) onForbidden('orders');
    else if (canView('dashboard_orders_visits')) onForbidden('visits');
    else if (canView('dashboard_units_assets_tags')) onForbidden('dashboard-units-assets-tags');
    else if (canView('dashboard_units_power_electric')) onForbidden('dashboard-units-power-electric');
    else if (canView('dashboard_contracts_evaluations')) onForbidden('dashboard-contracts-evaluations');
    else onForbidden('dashboard');
  }, [loading, canView, onForbidden]);

  if (loading || forbidden) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loading size="md" />
      </div>
    );
  }
  return <>{children}</>;
};

const TeamShiftsScreenGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canView, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loading size="md" />
      </div>
    );
  }

  if (!canView('dashboard_teams_shifts')) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
          <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
          <h2 className="mt-2 font-bold text-slate-900 dark:text-white">Acesso restrito</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Seu perfil não tem permissão para visualizar a aba Disponibilidade.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Uma vez por carregamento do app (no corpo do componente repetia a cada render).
// Única mensagem que passa pelo console silenciado (utils/consoleControl.ts).
logAppVersion(__BUILD_ID__);

const AppContent: React.FC = () => {
  const [minTimePassed, setMinTimePassed] = useState(false);
  // trackerLeaderIds: líderes filtrados no painel de origem (ausente = todos da empresa).
  const [selectedCompanyForTracker, setSelectedCompanyForTracker] = useState<(Company & { trackerLeaderIds?: string[] }) | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') === 'users-tracker') {
      const stored = localStorage.getItem('tracker_company');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return null;
  });
  const [retryLocation, setRetryLocation] = useState(0);
  const isKeyboardVisible = useKeyboard();

  // Monitor network connectivity and show notifications
  const { isConnected, connectionType } = useNetworkStatus();
  const { dataQualityStatus, isDataQualityMonitoring } = useCombinedNetwork();
  const { shouldShowQualityWarning, shouldShowStabilityWarning, shouldShowLatencyWarning } = useQualityNotifications();
  const networkStatusRef = React.useRef<{ isConnected: boolean; connectionType: string | null }>({ isConnected: true, connectionType: null });
  const dataQualityRef = React.useRef(dataQualityStatus);

  useEffect(() => {
    const prevConnected = networkStatusRef.current.isConnected;
    networkStatusRef.current = { isConnected, connectionType: connectionType || null };

    if (!isConnected && prevConnected) {
      // Transitioned from connected to disconnected
      toast.error('⚠️ Sem conexão de internet', {
        description: 'Verifique sua conexão WiFi ou dados móveis',
        duration: 5000,
      });
    } else if (isConnected && !prevConnected) {
      // Transitioned from disconnected to connected
      const connTypeLabel = connectionType ? ` via ${connectionType.toUpperCase()}` : '';
      toast.success('✅ Conectado novamente' + connTypeLabel, {
        duration: 3000,
      });
    }
  }, [isConnected, connectionType]);

  // Monitor data quality and show notifications
  useEffect(() => {
    const prevQuality = dataQualityRef.current.overallScore;
    const currentQuality = dataQualityStatus.overallScore;
    dataQualityRef.current = dataQualityStatus;

    // As notificações visuais via toast foram removidas para tornar o monitoramento menos intrusivo
    // O DataQualityIndicator (ícone) já mostra o status visualmente para o usuário
  }, [dataQualityStatus, isDataQualityMonitoring]);

  // Splash screen minimum timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Deep linking handler — listen for app URL opens
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrlOpen = async (data: { url: string }) => {
      try {
        const url = new URL(data.url);
        const path = url.pathname;
        const hash = url.hash;
        const search = url.search;

        // Password recovery deep link: siges://reset-password#... or siges://?code=...
        if (path.includes('/reset-password') || hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('code=')) {
          // Build a web-compatible URL so the existing recovery logic can process it
          const webParams = search ? search.substring(1) : '';
          const webHash = hash || '';
          window.location.href = `/${webParams ? '?' + webParams : ''}${webHash}`;
          return;
        }

        if (path.includes('/visit') || path.includes('/order-visit')) {
          setCurrentScreen('order-visit-execute');
        } else if (path.includes('/order')) {
          setCurrentScreen('orders-dashboard');
        } else if (path.includes('/asset')) {
          setCurrentScreen('assets-search');
        } else if (path.includes('/profile')) {
          setCurrentScreen('profile');
        }
      } catch (e) {
        console.warn('[App] Failed to parse deep link:', e);
      }
    };

    // Use Capacitor App plugin if available
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', handleAppUrlOpen);
    }).catch(() => {
      // Plugin not available — silent fail
    });
  }, []);

  // Status bar is configured in the theme useEffect below



  const [activeTab, setActiveTab] = useState<'ss' | 'dashboard' | 'orders' | 'units' | 'assets' | 'tools' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags' | 'materials' | 'manuals' | 'app-notices' | 'extra-workers' | 'team-shifts'>(() => {
    const saved = localStorage.getItem('app_active_tab');
    // Aba removida de Gestão (a tela foi para Ajustes > APIs externas).
    if (saved === 'dashboard-assets-available-integrations') return 'dashboard';
    if (saved === 'units-search') return 'units';
    if (saved === 'assets-search') return 'assets';
    if (saved === 'materials-search') return 'materials';
    return (saved as any) || 'dashboard';
  });

  const handleMainTabChange = (tab: any) => {
    // Standardize tab names
    let normalizedTab = tab;
    if (tab === 'units-search' || tab === 'units_search') normalizedTab = 'units';
    if (tab === 'assets-search') normalizedTab = 'assets';
    if (tab === 'dashboard-orders-admin') normalizedTab = 'orders';

    // Track last main tab for returning from Profile/Settings
    if (normalizedTab !== 'profile' && normalizedTab !== 'settings') {
      localStorage.setItem('last_main_tab', normalizedTab);
    }

    setActiveTab(normalizedTab);
    localStorage.setItem('app_active_tab', normalizedTab);

    // Navigate to appropriate screen
    if (normalizedTab === 'ss') {
      setCurrentScreen('ss-dashboard');
    } else if (normalizedTab === 'orders') {
      setCurrentScreen('orders-dashboard');
    } else if (normalizedTab === 'visits') {
      setCurrentScreen('visits-dashboard');
    } else if (normalizedTab === 'units') {
      setCurrentScreen('units-search');
    } else if (normalizedTab === 'assets') {
      setCurrentScreen('assets-search');
    } else if (normalizedTab === 'dashboard') {
      setCurrentScreen('dashboard');
    } else if (normalizedTab === 'profile') {
      setCurrentScreen('profile');
    } else if (normalizedTab === 'settings') {
      setCurrentScreen('settings');
    } else if (normalizedTab === 'companies') {
      setCurrentScreen('companies');
    } else if (normalizedTab === 'contracts') {
      setCurrentScreen('contracts');
    } else if (normalizedTab === 'maintenance-plans') {
      setCurrentScreen('maintenance-plans');
    } else if (normalizedTab === 'tools') {
      setCurrentScreen('tools');
    } else if (normalizedTab === 'materials') {
      setCurrentScreen('materials-search');
    } else if (normalizedTab === 'manuals') {
      setCurrentScreen('technical-manuals');
    } else if (normalizedTab === 'app-notices') {
      setCurrentScreen('app-notices');
    } else if (normalizedTab === 'extra-workers') {
      setCurrentScreen('extra-workers');
    } else if (normalizedTab === 'team-shifts') {
      setCurrentScreen('team-shifts');
    } else if (normalizedTab === 'orders-daily-schedule') {
      setCurrentScreen('orders-daily-schedule');
    } else if (normalizedTab === 'fuel-expense') {
      setCurrentScreen('fuel-expense');
    }
  };
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen') as Screen | null;
    if (screenParam && screenParam === 'users-tracker') {
      const stored = localStorage.getItem('tracker_company');
      if (stored) return 'users-tracker';
    }
    const savedTab = localStorage.getItem('app_active_tab');
    if (savedTab === 'dashboard') return 'dashboard';
    if (savedTab === 'orders') return 'orders-dashboard';
    if (savedTab === 'units' || savedTab === 'units-search') return 'units-search';
    if (savedTab === 'assets' || savedTab === 'assets-search') return 'assets-search';
    if (savedTab === 'tools') return 'tools';
    if (savedTab === 'visits') return 'visits-dashboard';
    if (savedTab === 'maintenance-plans') return 'maintenance-plans';
    if (savedTab === 'profile') return 'profile';
    if (savedTab === 'settings') return 'settings';
    if (savedTab === 'companies') return 'companies';
    if (savedTab === 'contracts') return 'contracts';
    if (savedTab === 'materials' || savedTab === 'materials-search') return 'materials-search';
    if (savedTab === 'manuals') return 'technical-manuals';
    if (savedTab === 'ss') return 'ss-dashboard';
    if (savedTab === 'leader-ranking') return 'leader-ranking';
    if (savedTab === 'dashboard-units-assets-tags') return 'dashboard-units-assets-tags';
    if (savedTab === 'dashboard-units-power-electric') return 'dashboard-units-power-electric';
    if (savedTab === 'dashboard-contracts-evaluations') return 'dashboard-contracts-evaluations';
    if (savedTab === 'app-notices') return 'app-notices';
    if (savedTab === 'extra-workers') return 'extra-workers';
    return 'dashboard';
  });

  // Diagnóstico: tela atual (usada nos logs de erro/recarga).
  useEffect(() => {
    setDiagnosticsScreen(currentScreen);
  }, [currentScreen]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const numericCompanyId = Number(currentUser?.companyId);
  const providerCompanyId = currentUser?.companyId && Number.isFinite(numericCompanyId) && numericCompanyId !== 1
    ? currentUser.companyId
    : undefined;
  const [dashboardGamification, setDashboardGamification] = useState<{
    position: number;
    positionChange?: number;
  } | null>(null);
  const [showDashboardGamificationHistory, setShowDashboardGamificationHistory] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Aviso do motivo da última recarga automática (após o splash, com o Toaster montado).
  useEffect(() => {
    if (authLoading) return;
    const notice = consumeReloadNotice();
    if (!notice) return;
    const timer = setTimeout(() => toast.info(`O app foi recarregado automaticamente: ${notice}.`), 1200);
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (currentScreen !== 'dashboard') {
      setDashboardGamification(null);
      setShowDashboardGamificationHistory(false);
    }
  }, [currentScreen]);
  const showSplash = !minTimePassed || authLoading;
  const { isV2: isUiV2 } = useUiVersion();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'dark';
  });
  // No nativo, o localStorage do WebView pode ser apagado ao sair/atualizar o app
  // (mesmo motivo pelo qual a sessão do Supabase usa @capacitor/preferences).
  // Enquanto o espelho em Preferences não é lido no boot, a gravação do espelho
  // fica suspensa para não sobrescrever o valor guardado.
  const themeHydrationRef = useRef<'pending' | 'done'>(
    !Capacitor.isNativePlatform() || localStorage.getItem('app_theme') ? 'done' : 'pending'
  );

  // Computed once from the URL at the time the app loads.
  // Used to know if this page load originated from a password recovery link.
  // Covers: implicit (#type=recovery), PKCE via GoTrue (?code=), token_hash approach (?token_hash=...&type=recovery)
  const isRecoveryFlowRef = useRef((() => {
    const params = new URLSearchParams(window.location.search);
    return window.location.hash.includes('type=recovery') ||
      params.get('type') === 'recovery' ||
      params.has('token_hash') ||
      params.has('code');
  })());

  const [authScreen, setAuthScreen] = useState<'login' | 'forgot-password' | 'reset-password'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash.includes('type=recovery')) return 'reset-password';
    if (params.get('type') === 'recovery') return 'reset-password';
    if (params.has('token_hash') && params.get('type') === 'recovery') return 'reset-password';
    // PKCE code from GoTrue — supabase-js will auto-exchange it and fire PASSWORD_RECOVERY
    // Show reset screen immediately so the user doesn't see a flash of the login screen
    if (params.has('code')) return 'reset-password';
    return 'login';
  });

  // Safe Links bypass: verify OTP when token_hash approach is used
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    if (tokenHash && type === 'recovery') {
      window.history.replaceState({}, document.title, '/');
      import('./services/core/supabase').then(({ supabase }) => {
        supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ data, error }: { data: any; error: any }) => {
          if (error) {
            console.error('[Recovery] verifyOtp failed:', error.message, error);
            setAuthScreen('forgot-password');
          } else {
            console.log('[Recovery] verifyOtp succeeded, session established');
            setAuthScreen('reset-password');
          }
        });
      });
    }
  }, []);

  // Clean URL params after opening tracker in new tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') === 'users-tracker') {
      localStorage.removeItem('tracker_company');
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<import('./types').System | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<import('./types').UnitType | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<import('./types').Route | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<import('./types').Unit | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<import('./types').Activity | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [selectedOrderSubType, setSelectedOrderSubType] = useState<OrderSubType | null>(null);
  const [selectedOrderPlan, setSelectedOrderPlan] = useState<OrderPlan | null>(null);
  const [selectedOrderObject, setSelectedOrderObject] = useState<OrderObject | null>(null);
  const [selectedService, setSelectedService] = useState<import('./types').Service | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<import('./types').Material | null>(null);
  const [materialDefaultTab, setMaterialDefaultTab] = useState<'almoxarifados' | 'compras'>('almoxarifados');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [selectedAssetStatus, setSelectedAssetStatus] = useState<AssetStatus | null>(null);
  const [selectedAssetPriority, setSelectedAssetPriority] = useState<AssetPriority | null>(null);
  const [selectedAssetTag, setSelectedAssetTag] = useState<AssetTag | null>(null);
  const [selectedAssetTagSub, setSelectedAssetTagSub] = useState<AssetTagSub | null>(null);
  const [selectedTechnicalManual, setSelectedTechnicalManual] = useState<import('./types').TechnicalManual | null>(null);
  const [selectedChecklistType, setSelectedChecklistType] = useState<import('./types').AssetLoanChecklistType | null>(null);
  const [selectedLoansChecklist, setSelectedLoansChecklist] = useState<import('./types').LoansChecklist | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [cloneSourceAsset, setCloneSourceAsset] = useState<Asset | null>(null);
  const [lastAssetSource, setLastAssetSource] = useState<Screen>('assets-search');
  const [lastOrderSource, setLastOrderSource] = useState<Screen>('orders-dashboard');
  // Origem da navegação: página Online de SS que abriu a página de período
  // ('ss-dashboard' ou 'services-history') — usada pelo switch Online e pelo voltar.
  const [ssPeriodReturnScreen, setSsPeriodReturnScreen] = useState<Screen>('ss-dashboard');
  const [lastVisitSource, setLastVisitSource] = useState<Screen>('visits-dashboard');
  const [selectedOrderVisitAsset, setSelectedOrderVisitAsset] = useState<OrderVisitAssetView | null>(null);
  const [selectedVisitForAssetReport, setSelectedVisitForAssetReport] = useState<OrderVisit | null>(null);
  const [selectedOrderVisitAssetId, setSelectedOrderVisitAssetId] = useState<string | null>(null);
  const [selectedOrderTypeId, setSelectedOrderTypeId] = useState<string | null>(null);
  const [selectedUnitAssetTag, setSelectedUnitAssetTag] = useState<any>(null);
  const [assetReportBackScreen, setAssetReportBackScreen] = useState<Screen>('order-visit-execute');
  // Seção do relatório do ativo a centralizar ao voltar (ex.: atividades → materiais)
  const [assetReportFocus, setAssetReportFocus] = useState<'materials' | null>(null);

  const handleManageAvailability = (item: any) => {
    setSelectedUnitAssetTag(item);
    setCurrentScreen('unit-asset-tag-details');
  };

  const handleOrderVisitAssetSelect = (asset: OrderVisitAssetView, visit: OrderVisit) => {
    setSelectedOrderVisitAsset(asset);
    setSelectedOrderVisitAssetId(asset.id);
    setSelectedVisitForAssetReport(visit);
    setAssetReportBackScreen('order-visit-execute');
    setCurrentScreen('order-visit-asset-report');
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailActiveTab, setOrderDetailActiveTab] = useState<string>('SS');
  const [ssDetailActiveTab, setSsDetailActiveTab] = useState<string>('OS');
  const [visitActiveTab, setVisitActiveTab] = useState<'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat'>('home');

  const handleVisitTabChange = (tab: any) => {
    setVisitActiveTab(tab);
    if (currentScreen !== 'order-visit-execute') {
      setCurrentScreen('order-visit-execute');
    }
  };
  const [selectedVisit, setSelectedVisit] = useState<import('./types').OrderVisit | null>(null);
  const [selectedVisitForApproval, setSelectedVisitForApproval] = useState<import('./types').OrderVisit | null>(null);

  // Sai do relatório do ativo. Se ele foi aberto por link/recarregamento, o App não sabe qual é a
  // visita (só o ativo): descobre pelo ativo antes de voltar, senão a tela da visita ficaria em branco.
  const leaveAssetReport = async () => {
    const target = assetReportBackScreen;
    if (target === 'order-visit-execute' && !(selectedVisit?.id || currentUser?.ovIdInProgress)) {
      let ovId: string | undefined = selectedVisitForAssetReport?.id || selectedOrderVisitAsset?.ovId;
      if (!ovId && selectedOrderVisitAssetId) {
        try { ovId = (await dataService.getOrderVisitAssetById(selectedOrderVisitAssetId))?.ovId; } catch { /* sem rede: cai no painel */ }
      }
      if (!ovId) { setCurrentScreen('dashboard'); return; }
      setSelectedVisit({ id: String(ovId) } as unknown as import('./types').OrderVisit);
    }
    setCurrentScreen(target);
  };
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitsListRefreshKey, setUnitsListRefreshKey] = useState(0);
  const [visitRefreshKey, setVisitRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const selectedOrderRef = React.useRef<Order | null>(null);
  // OS/SS pedida pela URL (voltar/avançar, F5, link) ainda sendo buscada pelo id.
  const [routeOrderId, setRouteOrderId] = useState<string | null>(null);
  const routeOrderReq = React.useRef<string | null>(null);
  const currentUserRef = React.useRef<User | null>(null);
  const loadUserRef = React.useRef<(() => Promise<void>) | null>(null);
  const selectedVisitRef = React.useRef<import('./types').OrderVisit | null>(null);
  const visitActiveTabRef = React.useRef<'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat'>('home');

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedVisitRef.current = selectedVisit;
  }, [selectedVisit]);

  useEffect(() => {
    visitActiveTabRef.current = visitActiveTab;
  }, [visitActiveTab]);

  const [dashboardInitialTab, setDashboardInitialTab] = useState<'services' | 'visits' | 'fuel'>(() => {
    return (localStorage.getItem('dashboardInitialTab') as 'services' | 'visits' | 'fuel') || 'services';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  };

  const handleNavigate = (path: string) => {
    // Map paths to their corresponding bottom navigation tabs
    let tab: any = path;
    if (path === 'assets' || path === 'assets-search' || path === 'asset-details') tab = 'assets';
    if (path === 'units' || path === 'units-search' || path === 'unit-details') tab = 'units';
    if (path === 'dashboard') tab = 'dashboard';
    if (path === 'orders' || path === 'orders-dashboard' || path === 'orders-dashboard-period') {
      tab = 'orders';
      setOrdersDashboardTab('OS');
    }
    if (path === 'ss-dashboard' || path === 'ss-dashboard-period') {
      tab = 'ss';
    }
    if (path === 'visits' || path === 'visits-dashboard') {
      tab = 'visits';
      setOrdersDashboardTab('VISITAS');
    }
    if (path === 'settings' || path === 'companies' || path === 'contracts') tab = path;
    if (path === 'materials' || path === 'materials-search') tab = 'materials';
    if (path === 'manuals' || path === 'technical-manuals') tab = 'manuals';
    if (path.startsWith('maintenance-plan')) tab = 'maintenance-plans';

    setActiveTab(tab);

    if (path === 'assets' || path === 'assets-search') {
      setCurrentScreen('assets-search');
    } else if (path === 'units' || path === 'units-search') {
      setCurrentScreen('units-search');
    } else if (path === 'materials' || path === 'materials-search') {
      setCurrentScreen('materials-search');
    } else if (path === 'manuals' || path === 'technical-manuals') {
      setCurrentScreen('technical-manuals');
    } else if (path === 'ss') {
      setCurrentScreen('ss-dashboard');
    } else if (path === 'ss-dashboard-period') {
      // Guarda a origem para o switch "Online" voltar de onde veio
      setSsPeriodReturnScreen(currentScreen === 'services-history' ? 'services-history' : 'ss-dashboard');
      setCurrentScreen('ss-dashboard-period');
    } else if (path === 'orders') {
      setCurrentScreen('orders-dashboard');
    } else if (path === 'visits') {
      setCurrentScreen('orders-dashboard'); // Visitas now maps to orders-dashboard with activeTab='VISITAS'
    } else if (path === 'services-history') {
      tab = 'orders';
      setCurrentScreen('services-history');
    } else {
      setCurrentScreen(path as any);
    }
    localStorage.setItem('app_active_tab', tab);
  };

  const [ordersDashboardTab, setOrdersDashboardTab] = useState<'OS' | 'VISITAS'>('OS');

  // Chamado pelo SsScreenGate quando o usuário não tem permissão 'dashboard_services'
  // e ainda assim acabou em uma tela de SS (ex: app_active_tab salvo como 'ss').
  const handleSsScreenForbidden = useCallback((tab: string) => {
    const screens: Record<string, Screen> = {
      'orders': 'orders-dashboard',
      'visits': 'visits-dashboard',
      'dashboard-units-assets-tags': 'dashboard-units-assets-tags',
      'dashboard-units-power-electric': 'dashboard-units-power-electric',
      'dashboard-contracts-evaluations': 'dashboard-contracts-evaluations',
      'dashboard': 'dashboard',
    };
    const screen = screens[tab] || 'dashboard';
    if (tab === 'orders') setOrdersDashboardTab('OS');
    if (tab === 'visits') setOrdersDashboardTab('VISITAS');
    setActiveTab(tab as any);
    setCurrentScreen(screen);
    localStorage.setItem('app_active_tab', tab);
    localStorage.setItem('last_main_tab', tab);
  }, []);



  const getTabNavigation = () => {
    const isDashboardScreen = currentScreen === 'ss-dashboard' ||
      currentScreen === 'ss-dashboard-period' ||
      currentScreen === 'orders-dashboard' ||
      currentScreen === 'orders-dashboard-period' ||
      currentScreen === 'visits-dashboard' ||
      currentScreen === 'dashboard-units-power-electric' ||
      currentScreen === 'dashboard-units-assets-tags' ||
      currentScreen ===    'dashboard-contracts-evaluations' ||
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
    if (!isDashboardScreen) return undefined;
    return (
      <DashboardTabs
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        ordersDashboardTab={ordersDashboardTab}
        setOrdersDashboardTab={setOrdersDashboardTab}
        setActiveTab={setActiveTab}
        isAdminSuper={currentUser?.isAdminSuper}
      />
    );
  };

  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setCurrentScreen('company-details');
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setCurrentScreen('department-details');
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setCurrentScreen('team-details');
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setCurrentScreen('client-details');
  };

  useEffect(() => {
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeout = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), ms);
      });

      return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
    };

    let signedOutTimer: ReturnType<typeof setTimeout> | null = null;

    const loadUser = async () => {
      try {
        // force: loadUser é chamado no login e quando a própria linha muda (realtime)
        let user = await withTimeout(dataService.getCurrentUser({ force: true }), 8000);

        // Modo offline: carga estourou o tempo na abertura (sinal sem internet)
        // → usa o perfil guardado da sessão salva em vez de cair no login.
        if (!user && !currentUserRef.current) {
          user = await getCachedCurrentUser<User>();
        }

        // If timeout returned null, don't reset user — keep current state
        if (!user && currentUserRef.current) {
          console.warn('[Auth] loadUser timeout or null result, keeping current user');
          return;
        }

        // Avoid setting state if the core user data (excluding location) hasn't changed.
        // This prevents visual refreshes / flicker when only latitude/longitude updates.
        if (user && currentUserRef.current) {
          const hasChanges =
            user.id !== currentUserRef.current.id ||
            user.companyId !== currentUserRef.current.companyId ||
            user.teamId !== currentUserRef.current.teamId ||
            user.isAvailable !== currentUserRef.current.isAvailable ||
            user.isOvInProgress !== currentUserRef.current.isOvInProgress ||
            user.ovIdInProgress !== currentUserRef.current.ovIdInProgress ||
            user.statusId !== currentUserRef.current.statusId ||
            user.profileId !== currentUserRef.current.profileId;

          if (!hasChanges) return;
        }

        setCurrentUser(user);
        if (user && !localStorage.getItem('app_active_tab')) {
          setCurrentScreen('dashboard');
          handleMainTabChange('dashboard');
        }
      } catch (error) {
        console.error("Auth error", error);
      } finally {
        setAuthLoading(false);
      }
    };
    loadUserRef.current = loadUser;
    loadUser();

    // Listen for auth state changes (especially for password recovery)
    const { data: { subscription: authSubscription } } = dataService.subscribeToAuthChanges((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Explicit recovery event — always show reset screen
        setAuthScreen('reset-password');
      } else if (event === 'SIGNED_IN') {
        // Cancel any pending SIGNED_OUT (token refresh race condition)
        if (signedOutTimer) {
          clearTimeout(signedOutTimer);
          signedOutTimer = null;
        }
        if (isRecoveryFlowRef.current) {
          // SIGNED_IN can fire instead of (or after) PASSWORD_RECOVERY in PKCE flow.
          // If we loaded from a recovery URL, keep showing the reset screen.
          setAuthScreen('reset-password');
        } else {
          loadUser();
        }
      } else if (event === 'SIGNED_OUT') {
        // Debounce SIGNED_OUT: Supabase can fire SIGNED_OUT briefly during token refresh
        // on self-hosted instances. Wait 2s to see if SIGNED_IN follows.
        // SKIP during recovery flow — the session is valid for password reset.
        if (isRecoveryFlowRef.current) {
          console.warn('[Auth] SIGNED_OUT ignored during recovery flow');
          return;
        }
        signedOutTimer = setTimeout(() => {
          console.warn('[Auth] SIGNED_OUT confirmed after debounce — redirecting to login');
          setCurrentUser(null);
          setAuthScreen('login');
          signedOutTimer = null;
        }, 2000);
      }
    });

    // Assinaturas realtime de users/orders ficam em efeitos próprios (filtradas
    // pelo usuário logado e pela OS aberta) — ver abaixo de useLocationTracker.

    return () => {
      if (signedOutTimer) clearTimeout(signedOutTimer);
      authSubscription.unsubscribe();
    }
  }, []);

  // Restaura o tema do Preferences nativo (SharedPreferences/UserDefaults) quando
  // o localStorage do WebView foi apagado — evita voltar ao dark no modo light
  // depois de sair e reabrir o app. Se o valor não existir ainda, semeia o espelho.
  useEffect(() => {
    if (themeHydrationRef.current !== 'pending') return;
    Preferences.get({ key: 'app_theme' })
      .then(({ value }) => {
        if (value === 'light' || value === 'dark') {
          setTheme(value);
        } else {
          return Preferences.set({ key: 'app_theme', value: theme });
        }
      })
      .catch(() => {})
      .finally(() => {
        themeHydrationRef.current = 'done';
      });
  }, []);

  // Sync theme + StatusBar
  useEffect(() => {
    console.log('Switching theme to:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);

    if (Capacitor.isNativePlatform()) {
      // Espelha o tema no Preferences nativo (só depois da hidratação no boot,
      // para não sobrescrever o valor restaurado).
      if (themeHydrationRef.current === 'done') {
        Preferences.set({ key: 'app_theme', value: theme }).catch(() => {});
      }
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        if (theme === 'dark') {
          StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: '#101922' });
        } else {
          StatusBar.setStyle({ style: Style.Light });
          StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
        StatusBar.setOverlaysWebView({ overlay: false });
      }).catch(() => {});
    }
  }, [theme]);

  // Visual novo (beta): barra de status acompanha o topo — cor da marca na home ("hero"),
  // superfície neutra nas demais. Ao desligar a chave, volta às cores do efeito acima.
  const isHeroScreen = isUiV2 && currentScreen === 'dashboard';
  const uiV2StatusBarInit = useRef(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!isUiV2 && !uiV2StatusBarInit.current) return; // v1 puro: nada muda
    uiV2StatusBarInit.current = true;
    // Espera o provider aplicar .ui-v2 no <html> antes de ler os tokens.
    const raf = requestAnimationFrame(() => {
      const css = getComputedStyle(document.documentElement);
      const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        if (isHeroScreen) {
          StatusBar.setStyle({ style: Style.Dark }); // ícones claros sobre a marca
          StatusBar.setBackgroundColor({ color: token('--color-hero', '#1a6fd1') });
        } else if (theme === 'dark') {
          StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: isUiV2 ? token('--color-surface', '#18181b') : '#101922' });
        } else {
          StatusBar.setStyle({ style: Style.Light });
          StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      }).catch(() => {});
    });
    return () => cancelAnimationFrame(raf);
  }, [theme, isUiV2, isHeroScreen]);

  // Request native permissions on startup
  useEffect(() => {
    const initApp = async () => {
      try {
        await permissionService.requestAllPermissions();
        // Check imgproxy health to avoid 503 errors early
        await imgproxyService.checkServiceHealth();
      } catch (err) {
        console.error("Failed to initialize app services", err);
      }
    };
    initApp();
  }, []);

  // Load and subscribe to notifications
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadNotifications = async (): Promise<UserNotification[]> => {
      try {
        const [count, data] = await Promise.all([
          dataService.getNotificationsCount(currentUser.uuid),
          dataService.getNotifications(0, 10, currentUser.uuid)
        ]);

        setNotifications(data);
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, notificationsAmount: count } : null);
        }
        return data;
      } catch (error) {
        console.error('Error loading initial notifications:', error);
        return [];
      }
    };

    loadNotifications();

    const subscription = dataService.subscribeToNotifications(currentUser.id, (payload) => {
      // Ignorar notificações de chat da visita que está sendo visualizada no momento
      // Usar refs para evitar closure stale (o useEffect não re-executa quando visitActiveTab/selectedVisit mudam)
      const newNotif = payload?.new;
      const activeVisitId = selectedVisitRef.current?.id?.toString() || currentUserRef.current?.ovIdInProgress?.toString();
      const isActiveChatNotif =
        newNotif?.type === 'visit_chat' &&
        newNotif?.ov_id?.toString() === activeVisitId &&
        visitActiveTabRef.current === 'chat';

      if (isActiveChatNotif && newNotif?.id) {
        dataService.deleteNotification(newNotif.id.toString()).catch((error) => {
          console.error('Error deleting active visit_chat notification:', error);
        });
      } else {
        const listPromise = loadNotifications();

        // Efeito de chegada no botão de notificações (Header): só notificação NOVA,
        // com o app visível e enviada por outra pessoa. Avatar do remetente quando
        // ele tem foto; senão (ou notificação do sistema) o badge pulsa.
        const senderId = newNotif?.user_id_from != null ? String(newNotif.user_id_from) : null;
        const isNew = payload?.eventType === 'INSERT' && newNotif?.id != null;
        const isFromMe = senderId !== null && senderId === currentUserRef.current?.id?.toString();
        if (isNew && !isFromMe && document.visibilityState === 'visible') {
          const notificationId = String(newNotif.id);
          listPromise.then(list => {
            const loaded = list.find(n => n.id === notificationId);
            announceNotificationArrival({
              id: notificationId,
              senderId,
              avatarUrl: senderId && loaded?.relatedUserHasPhoto ? loaded.relatedUserAvatarUrl ?? null : null,
            });
          });
        }
      }

      // Se receber uma notificação de OS Autorizada, dispara um evento para atualizar o painel
      if (newNotif?.type === 'OS Autorizada') {
        window.dispatchEvent(new CustomEvent('refresh_dashboard'));
      }
    });

    // Fallback do realtime (que já entrega as notificações): a cada 5 min e só
    // com o app visível. Antes: consulta a cada 60 s, mesmo em segundo plano.
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications();
    }, 5 * 60_000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [currentUser?.id]);

  const handleNotificationRead = (id: string) => {
    setNotifications(prev => {
      const newList = prev.filter(n => n.id !== id);
      if (currentUser) {
        setCurrentUser({ ...currentUser, notificationsAmount: newList.length });
      }
      return newList;
    });
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    if (notification.type === 'visit_chat' && notification.ovId) {
      setSelectedVisit({ id: notification.ovId } as any);
      setVisitActiveTab('chat');
      setCurrentScreen('order-visit-execute');
    } else if (notification.type === 'profile_photo_rejected') {
      // Aviso da revisão de fotos (Ajustes → Usuários): abre o perfil para trocar a foto
      handleMainTabChange('profile');
    } else if (
      (notification.type === 'Compra Aprovada' || notification.type === 'Compra Cancelada' || notification.type === 'Compra Concluída') &&
      notification.materialId
    ) {
      try {
        const material = await dataService.getMaterialById(notification.materialId);
        if (material) {
          setSelectedMaterial(material);
          setMaterialDefaultTab('compras');
          setCurrentScreen('material-details');
        }
      } catch (error) {
        console.error('Error loading material for notification:', error);
      }
    }

    try {
      await dataService.deleteNotification(notification.id);
      setNotifications(prev => {
        const newList = prev.filter(n => n.id !== notification.id);
        if (currentUser) {
          setCurrentUser({ ...currentUser, notificationsAmount: newList.length });
        }
        return newList;
      });
    } catch (error) {
      console.error('Error deleting notification after click:', error);
    }
  };

  // Ao entrar no chat da visita: apaga TODAS as notificações de chat dessa visita
  // (não só as 10 carregadas na lista) e recarrega lista + contador do banco.
  const handleChatEntered = async (visitId: string | number) => {
    const ovId = String(visitId);
    // Remove da lista local na hora (ids comparados como texto: o id da visita
    // pode chegar como número quando o chat é aberto pela notificação).
    setNotifications(prev => prev.filter(n => !(n.type === 'visit_chat' && String(n.ovId) === ovId)));
    try {
      await dataService.deleteVisitChatNotifications(ovId);
      // O realtime não entrega DELETE com filtro (sem REPLICA IDENTITY FULL):
      // recarrega aqui para o badge refletir o que restou no banco.
      const uuid = currentUserRef.current?.uuid;
      if (uuid) {
        const [count, data] = await Promise.all([
          dataService.getNotificationsCount(uuid),
          dataService.getNotifications(0, 10, uuid),
        ]);
        setNotifications(data);
        setCurrentUser(prev => prev ? { ...prev, notificationsAmount: count } : null);
      }
    } catch (error) {
      console.error('Error deleting visit_chat notifications on chat enter:', error);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.notificationsAmount !== notifications.length) {
      setCurrentUser(prev => prev ? { ...prev, notificationsAmount: notifications.length } : null);
    }
  }, [notifications.length, currentUser?.id]);

  // Background location tracker — updates users.latitude, users.longitude and users.tracker_heartbeat_at
  const hasOpenVisit = !!currentUser?.isOvInProgress || (!!currentUser?.ovIdInProgress && Number(currentUser.ovIdInProgress) > 0);
  const { isLocationBlocked, blockReason } = useLocationTracker(
    currentUser?.id,
    currentUser?.trackerIntervalSeconds,
    retryLocation,
    hasOpenVisit,
    currentUser?.isAvailable ?? true,
    currentUser?.shiftStart,
    currentUser?.shiftEnd,
    // Só líderes de equipe são rastreados (os demais: serviço desligado).
    !!currentUser?.isTeamLeader
  );

  // Realtime da PRÓPRIA linha em users (filtro no servidor). Antes o app ouvia
  // a tabela inteira e recebia a posição de todos os usuários a cada minuto.
  // A própria linha também muda a cada envio de posição: só recarrega quando
  // muda um campo que importa (mesmos campos comparados em loadUser).
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
    const subscription = dataService.subscribeToUsers((payload: any) => {
      const row = payload?.new;
      const current = currentUserRef.current;
      if (!row || !current) return;
      const changed = (a: unknown, b: unknown) => String(a ?? '') !== String(b ?? '');
      if (
        changed(row.company_id, current.companyId) ||
        changed(row.team_id, current.teamId) ||
        changed(row.is_available, current.isAvailable) ||
        changed(row.is_team_leader, current.isTeamLeader) ||
        changed(row.is_ov_in_progress, current.isOvInProgress) ||
        changed(row.ov_id_in_progress, current.ovIdInProgress) ||
        changed(row.status_id, current.statusId) ||
        changed(row.profile_id, current.profileId)
      ) {
        loadUserRef.current?.();
      }
    }, { userId });
    return () => subscription.unsubscribe();
  }, [currentUser?.id]);

  // Realtime só da OS aberta no detalhe (antes: todas as OS de todas as empresas).
  useEffect(() => {
    const orderId = selectedOrder?.id;
    if (!orderId) return;
    const subscription = dataService.subscribeToOrders((payload) => {
      if (!payload?.new) return;
      dataService.getOrderById(orderId).then(updated => {
        if (updated && selectedOrderRef.current?.id === orderId) setSelectedOrder(updated);
      });
    }, { orderId });
    return () => subscription.unsubscribe();
  }, [selectedOrder?.id]);

  // Dados offline baixados automaticamente (OSs abertas da empresa + visitas em andamento).
  // F5: antes, lê a chave do banco (fn_offline_enabled) — offline só para quem foi liberado.
  useEffect(() => {
    let cancelled = false;
    const user = currentUser ? { id: currentUser.id, companyId: currentUser.companyId } : null;
    refreshOfflineGate(currentUser?.uuid)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setOfflineAutoSyncUser(user);
      });
    // Liberado depois (piloto ativado com o técnico já logado): começa a baixar.
    const unsubscribeGate = subscribeOfflineGate(open => {
      if (open && user) {
        setOfflineAutoSyncUser(user);
        runOfflineAutoSync('manual');
      }
    });
    return () => {
      cancelled = true;
      unsubscribeGate();
    };
  }, [currentUser?.id, currentUser?.companyId, currentUser?.uuid]);

  // Atualização automática dos dados offline só no "Meu Painel" (de onde se iniciam as visitas).
  useEffect(() => {
    setOfflineAutoSyncActive(currentScreen === 'dashboard');
  }, [currentScreen]);

  // Background shift monitor - alerts user to change availability status based on shift hours
  const { showShiftAlert, dismissAlert } = useShiftMonitor(currentUser, currentScreen === 'profile');

  // Heartbeat system (sends a ping every 3 minutes if active)
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const ping = () => {
      dataService.updateLastOnline(currentUser.id).catch(console.error);
    };

    // Ping immediately when user is loaded
    ping();

    // Ping every 3 minutes
    const interval = setInterval(ping, 180000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Load departments when company changes
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany?.id) {
        const depts = await dataService.getDepartmentsByCompany(selectedCompany.id);
        setDepartments(depts);
      }
    };
    loadDepartments();
  }, [selectedCompany]);

  const handleAddClick = () => {
    if (currentScreen === 'companies') {
      setCurrentScreen('company-form');
    } else if (currentScreen === 'clients') {
      setCurrentScreen('client-form');
    } else if (currentScreen === 'contracts') {
      setCurrentScreen('contract-form');
    }
  };

  const handleOrderSelect = (order: Order) => {
    routeOrderReq.current = null;
    setRouteOrderId(null);
    setSelectedOrder(order);
    const isOS = order.type === 'OS' || (order.parentId && Number(order.parentId) > 0);

    if (currentScreen !== 'order-detail' && currentScreen !== 'service-request-detail' && currentScreen !== 'order-create' && currentScreen !== 'service-request-create') {
      setLastOrderSource(currentScreen);
    }

    if (isOS) {
      setOrderDetailActiveTab('SS');
      setCurrentScreen('order-detail');
    } else {
      setSsDetailActiveTab('OS');
      setCurrentScreen('service-request-detail');
    }
  };

  const handleRefreshOrder = async (orderId: string) => {
    try {
      const updated = await dataService.getOrderById(orderId);
      if (updated) setSelectedOrder(updated);
    } catch (error) {
      console.error("Error refreshing order:", error);
    }
  };

  const handleVisitSelect = (
    visit: import('./types').OrderVisit | { id: string; [key: string]: any },
    initialTab: 'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat' = 'home'
  ) => {
    if (currentScreen !== 'order-visit-execute') {
      setLastVisitSource(currentScreen);
    }
    setSelectedVisit(visit as any);
    setVisitActiveTab(initialTab);
    setCurrentScreen('order-visit-execute');
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setLastAssetSource(currentScreen);
    setCurrentScreen('asset-details');
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setCurrentScreen('asset-edit');
  };

  const handleAssetTypeSelect = (assetType: AssetType) => {
    setSelectedAssetType(assetType);
    setCurrentScreen('asset-type-edit');
  };

  const handleSaveAssetType = async (assetType: Partial<AssetType>) => {
    try {
      if (selectedAssetType?.id && currentScreen === 'asset-type-edit') {
        await dataService.updateAssetType(selectedAssetType.id, assetType);
      } else {
        await dataService.createAssetType(assetType);
      }
      setCurrentScreen('asset-types');
    } catch (error) {
      console.error("Error saving asset type", error);
      toast.error("Erro ao salvar tipo de ativo");
    }
  };

  const handleAssetStatusSelect = (assetStatus: AssetStatus) => {
    setSelectedAssetStatus(assetStatus);
    setCurrentScreen('asset-status-edit');
  };

  const handleSaveAssetStatus = async (assetStatus: Partial<AssetStatus>) => {
    try {
      if (selectedAssetStatus?.id && currentScreen === 'asset-status-edit') {
        await dataService.updateAssetStatus(selectedAssetStatus.id, assetStatus);
      } else {
        await dataService.createAssetStatus(assetStatus);
      }
      setCurrentScreen('asset-statuses');
    } catch (error) {
      console.error("Error saving asset status", error);
      toast.error("Erro ao salvar situação de ativo");
    }
  };

  const handleAssetPrioritySelect = (assetPriority: AssetPriority) => {
    setSelectedAssetPriority(assetPriority);
    setCurrentScreen('asset-priority-edit');
  };

  const handleSaveAssetPriority = async (assetPriority: Partial<AssetPriority>) => {
    try {
      if (selectedAssetPriority?.id && currentScreen === 'asset-priority-edit') {
        await dataService.updateAssetPriority(selectedAssetPriority.id, assetPriority);
      } else {
        await dataService.createAssetPriority(assetPriority);
      }
      setCurrentScreen('asset-priorities');
    } catch (error) {
      console.error("Error saving asset priority", error);
      toast.error("Erro ao salvar prioridade de ativo");
    }
  };

  const handleAssetTagSelect = (assetTag: AssetTag) => {
    setSelectedAssetTag(assetTag);
    setCurrentScreen('asset-tag-edit');
  };

  const handleSaveAssetTag = async (assetTag: Partial<AssetTag>) => {
    try {
      if (selectedAssetTag?.id && currentScreen === 'asset-tag-edit') {
        await dataService.updateAssetTag(selectedAssetTag.id, assetTag);
      } else {
        await dataService.createAssetTag(assetTag as any);
      }
      setCurrentScreen('asset-tags');
    } catch (error) {
      console.error("Error saving asset tag", error);
      toast.error("Erro ao salvar setor");
    }
  };

  const handleAssetTagSubSelect = (assetTagSub: AssetTagSub) => {
    setSelectedAssetTagSub(assetTagSub);
    setCurrentScreen('asset-tag-sub-edit');
  };

  const handleSaveAssetTagSub = async (assetTagSub: Partial<AssetTagSub>) => {
    try {
      if (selectedAssetTagSub?.id && currentScreen === 'asset-tag-sub-edit') {
        await dataService.updateAssetTagSub(selectedAssetTagSub.id, assetTagSub);
      } else {
        await dataService.createAssetTagSub(assetTagSub as any);
      }
      setCurrentScreen('asset-tag-subs');
    } catch (error) {
      console.error("Error saving asset tag sub", error);
      toast.error("Erro ao salvar posição");
    }
  };

  const handleTechnicalManualSelect = (tm: import('./types').TechnicalManual) => {
    setSelectedTechnicalManual(tm);
    setCurrentScreen('technical-manual-details');
  };

  const handleSaveTechnicalManual = async (tm: Partial<import('./types').TechnicalManual>) => {
    try {
      if (selectedTechnicalManual?.id && currentScreen === 'technical-manual-edit') {
        await dataService.updateTechnicalManual(selectedTechnicalManual.id, tm);
      } else {
        await dataService.createTechnicalManual(tm);
      }
      setCurrentScreen('technical-manuals');
    } catch (error) {
      console.error("Error saving technical manual", error);
      toast.error("Erro ao salvar documento técnico");
    }
  };

  const handleDeleteTechnicalManual = async () => {
    if (!selectedTechnicalManual?.id) return;
    if (!confirm('Tem certeza que deseja excluir este documento técnico?')) return;

    try {
      await dataService.deleteTechnicalManual(selectedTechnicalManual.id);
      toast.success('Documento técnico excluído!');
      setCurrentScreen('technical-manuals');
    } catch (error) {
      console.error("Error deleting technical manual", error);
      toast.error("Erro ao excluir documento técnico");
    }
  };

  const handleBack = () => {
    if (currentScreen === 'company-details' || currentScreen === 'company-form') {
      setCurrentScreen('companies');
    } else if (currentScreen === 'company-edit') {
      setCurrentScreen('company-details');
    } else if (currentScreen === 'department-form' || currentScreen === 'department-details') {
      setCurrentScreen('company-details');
    } else if (currentScreen === 'team-form' || currentScreen === 'team-details') {
      setCurrentScreen('department-details');
    } else if (currentScreen === 'team-edit') {
      setCurrentScreen('team-details');
    } else if (currentScreen === 'department-edit') {
      setCurrentScreen('department-details');
    } else if (currentScreen === 'user-form' || currentScreen === 'user-details') {
      setCurrentScreen('all-users');
      setSelectedUser(null);
    } else if (currentScreen === 'client-details' || currentScreen === 'client-form') {
      setCurrentScreen('clients');
    } else if (currentScreen === 'client-edit') {
      setCurrentScreen('client-details');
    } else if (currentScreen === 'profile' || currentScreen === 'settings') {
      const lastTab = localStorage.getItem('last_main_tab') || 'dashboard';
      handleMainTabChange(lastTab);
    } else if (currentScreen === 'systems') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'system-form' || currentScreen === 'system-edit') {
      setCurrentScreen('systems');
    } else if (currentScreen === 'unit-types') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'unit-type-form' || currentScreen === 'unit-type-edit') {
      setCurrentScreen('unit-types');
    } else if (currentScreen === 'maintenance-plans') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'maintenance-plan-form' || currentScreen === 'maintenance-plan-edit') {
      setCurrentScreen('maintenance-plans');
    } else if (currentScreen === 'asset-tags') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-tag-form' || currentScreen === 'asset-tag-edit') {
      setCurrentScreen('asset-tags');
    } else if (currentScreen === 'asset-tag-subs') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-tag-sub-form' || currentScreen === 'asset-tag-sub-edit') {
      setCurrentScreen('asset-tag-subs');
    } else if (currentScreen === 'technical-manuals') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'technical-manual-form' || currentScreen === 'technical-manual-edit') {
      setCurrentScreen('technical-manuals');
    } else if (currentScreen === 'technical-manual-details') {
      setCurrentScreen('technical-manuals');
    } else if (currentScreen === 'asset-loan-checklist-types') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-loan-checklist-type-form' || currentScreen === 'asset-loan-checklist-type-edit') {
      setCurrentScreen('asset-loan-checklist-types');
    } else if (currentScreen === 'loans-checklists') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'loans-checklist-form' || currentScreen === 'loans-checklist-edit') {
      setCurrentScreen('loans-checklists');
    } else if (currentScreen === 'app-notices') {
      const lastTab = localStorage.getItem('last_main_tab') || 'dashboard';
      handleMainTabChange(lastTab);
    } else if (currentScreen === 'extra-workers') {
      const lastTab = localStorage.getItem('last_main_tab') || 'dashboard';
      handleMainTabChange(lastTab);
    } else if (currentScreen === 'app-tips') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'audit-log') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'audit-config' || currentScreen === 'settings-api-guaibaflow') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'vehicle-cost-types') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'rental-contracts' || currentScreen === 'rental-apportionment') {
      setCurrentScreen('dashboard');
    } else if (currentScreen === 'rate-contracts') {
      setCurrentScreen('rental-contracts');
    } else if (currentScreen === 'vehicles') {
      setCurrentScreen('dashboard');
    } else if (currentScreen === 'fuel-expense') {
      setCurrentScreen('dashboard');
    } else if (currentScreen === 'client-units') {
      setCurrentScreen('client-details');
    } else if (currentScreen === 'unit-details') {
      if (activeTab === 'units') {
        setCurrentScreen('units-search');
      } else {
        setUnitsListRefreshKey(prev => prev + 1);
        setCurrentScreen('client-units');
      }
    } else if (currentScreen === 'unit-structure') {
      setUnitsListRefreshKey(prev => prev + 1);
      setCurrentScreen('unit-details');
    } else if (currentScreen === 'unit-asset-tag-available' || currentScreen === 'unit-asset-tag-details') {
      setCurrentScreen('unit-details');
    } else if (currentScreen === 'client-unit-form') {
      setCurrentScreen('client-units');
    } else if (currentScreen === 'client-unit-edit') {
      setCurrentScreen('unit-details');
    } else if (currentScreen === 'activities') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'activity-form' || currentScreen === 'activity-edit') {
      setCurrentScreen('activities');
    } else if (currentScreen === 'services') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'service-form' || currentScreen === 'service-edit') {
      setCurrentScreen('services');
    } else if (currentScreen === 'materials-search') {
      setCurrentScreen('dashboard');
      setActiveTab('dashboard');
      localStorage.setItem('app_active_tab', 'dashboard');
    } else if (currentScreen === 'materials') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'material-form' || currentScreen === 'material-edit') {
      setCurrentScreen('materials-search');
    } else if (currentScreen === 'material-details') {
      setCurrentScreen('materials-search');
    } else if (currentScreen === 'evaluation-requirements') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'priorities') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'priority-form' || currentScreen === 'priority-edit') {
      setCurrentScreen('priorities');
    } else if (currentScreen === 'order-types') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'order-type-form' || currentScreen === 'order-type-edit') {
      setCurrentScreen('order-types');
    } else if (currentScreen === 'contract-details') {
      if (selectedCompany) setCurrentScreen('company-details');
      else {
        setCurrentScreen('contracts');
        handleMainTabChange('contracts');
      }
    } else if (currentScreen === 'contract-form' || currentScreen === 'contract-edit') {
      if (selectedCompany) setCurrentScreen('company-details');
      else {
        setCurrentScreen('contracts');
        handleMainTabChange('contracts');
      }
    } else if (currentScreen === 'asset-types') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-type-form' || currentScreen === 'asset-type-edit') {
      setCurrentScreen('asset-types');
    } else if (currentScreen === 'asset-statuses') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-status-form' || currentScreen === 'asset-status-edit') {
      setCurrentScreen('asset-statuses');
    } else if (currentScreen === 'asset-priorities') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'asset-priority-form' || currentScreen === 'asset-priority-edit') {
      setCurrentScreen('asset-priorities');
    } else if (currentScreen === 'order-sub-types' || currentScreen === 'order-plans' || currentScreen === 'order-objects') {
      setCurrentScreen('settings');
    } else if (currentScreen === 'order-sub-type-form' || currentScreen === 'order-sub-type-edit') {
      setCurrentScreen('order-sub-types');
    } else if (currentScreen === 'order-plan-form' || currentScreen === 'order-plan-edit') {
      setCurrentScreen('order-plans');
    } else if (currentScreen === 'order-object-form' || currentScreen === 'order-object-edit') {
      setCurrentScreen('order-objects');
    } else if (currentScreen === 'assets-alerts') {
      setCurrentScreen('assets-search');
    } else if (currentScreen === 'asset-details') {
      setCurrentScreen(lastAssetSource);
    } else if (currentScreen === 'asset-form' || currentScreen === 'asset-edit' || currentScreen === 'asset-clone-wizard') {
      setCurrentScreen('asset-details');
    } else if (currentScreen === 'order-detail') {
      if (selectedOrder?.id === currentUser?.oIdInProgress) {
        setLastVisitSource('order-detail');
        setCurrentScreen('order-visit-execute');
      } else {
        setCurrentScreen(lastOrderSource);
      }
    } else if (currentScreen === 'service-request-detail') {
      setCurrentScreen(lastOrderSource);
    } else if (currentScreen === 'orders-dashboard-period') {
      setCurrentScreen('orders-dashboard');
    } else if (currentScreen === 'ss-dashboard-period') {
      setCurrentScreen(ssPeriodReturnScreen);
    } else if (currentScreen === 'services-history') {
      setCurrentScreen(lastOrderSource || 'orders-dashboard');
    } else if (currentScreen === 'order-create' || currentScreen === 'service-request-create') {
      setCurrentScreen('orders-dashboard');
    } else if (currentScreen === 'order-visit-execute') {
      setSelectedVisit(null);
      setCurrentScreen(lastVisitSource);
    } else if (currentScreen === 'order-visit-asset-report') {
      leaveAssetReport();
    } else if (currentScreen === 'order-visit-asset-activities' || currentScreen === 'order-visit-asset-materials') {
      setCurrentScreen('order-visit-asset-report');
    } else if (currentScreen === 'order-visit-approve') {
      setCurrentScreen('order-visit-execute');
    } else if (currentScreen === 'order-visit-evaluation') {
      setCurrentScreen('order-visit-approve');
    } else if (currentScreen === 'users-tracker') {
      localStorage.removeItem('tracker_company');
      if (window.opener) {
        window.close();
      } else {
        setSelectedCompanyForTracker(null);
        setCurrentScreen('orders-dashboard');
      }
    } else if (currentScreen === 'maintenance-plan-details') {
      setCurrentScreen('maintenance-plans');
    }
  };

  const handleSaveCompany = async (company: Partial<Company>, onProgress?: (progress: number) => void) => {
    try {
      if (selectedCompany?.id && currentScreen === 'company-edit') {
        const updatedCompany = await dataService.updateCompany(selectedCompany.id, company, onProgress);
        setSelectedCompany(updatedCompany);
        setCurrentScreen('company-details');
      } else {
        await dataService.createCompany(company, onProgress);
        setCurrentScreen('companies');
      }
    } catch (error: any) {
      console.error("Error saving company", error);
      const msg = error.message || (typeof error === 'object' ? JSON.stringify(error) : "Erro desconhecido");
      toast.error("Erro ao salvar empresa: " + msg);
    }
  };

  const handleEditCompany = () => {
    setCurrentScreen('company-edit');
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    if (confirm(`Deseja realmente excluir a empresa "${selectedCompany.name}"?`)) {
      try {
        await dataService.deleteCompany(selectedCompany.id);
        setSelectedCompany(null);
        setCurrentScreen('companies');
      } catch (error) {
        console.error("Error deleting company", error);
        toast.error("Erro ao excluir empresa");
      }
    }
  };

  const handleSaveClient = async (client: Partial<Client>, onProgress?: (progress: number) => void) => {
    try {
      if (selectedClient?.id && currentScreen === 'client-edit') {
        const updated = await dataService.updateClient(selectedClient.id, client, onProgress);
        setSelectedClient(updated);
        setCurrentScreen('client-details');
      } else {
        await dataService.createClient(client, onProgress);
        setCurrentScreen('clients');
      }
    } catch (error) {
      console.error("Error saving client", error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleEditClient = () => {
    setCurrentScreen('client-edit');
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (confirm(`Deseja realmente excluir o cliente "${selectedClient.name}"?`)) {
      try {
        await dataService.deleteClient(selectedClient.id);
        setSelectedClient(null);
        setCurrentScreen('clients');
      } catch (error) {
        console.error("Error deleting client", error);
        toast.error("Erro ao excluir cliente");
      }
    }
  };

  const handleAddDepartment = () => {
    setCurrentScreen('department-form');
  };

  const handleSaveDepartment = async (department: Partial<Department>) => {
    try {
      if (selectedDepartment?.id && currentScreen === 'department-edit') {
        await dataService.updateDepartment(selectedDepartment.id, department);
        setSelectedDepartment({ ...selectedDepartment, ...department } as Department); // Update local state
        setCurrentScreen('department-details');
      } else {
        await dataService.createDepartment(department);
        setCurrentScreen('company-details');
      }
    } catch (error) {
      console.error("Error saving department", error);
      toast.error("Erro ao salvar departamento");
    }
  };

  const handleSaveAsset = async (asset: Partial<Asset>, attributeValues: Record<string, string>, file?: File, onProgress?: (progress: number) => void) => {
    try {
      let savedAsset: Asset;
      if (selectedAsset?.id && currentScreen === 'asset-edit') {
        savedAsset = await dataService.updateAsset(selectedAsset.id, asset);

        if (file) {
          const { path, filename } = await dataService.uploadAssetImage(savedAsset.id, file, onProgress);
          await dataService.updateAsset(savedAsset.id, { imgFilePath: path, imgFileName: filename });
          savedAsset = (await dataService.getAssetById(savedAsset.id)) || savedAsset;
        }

        // Save dynamic attribute values
        await dataService.saveAssetAttributeValues(savedAsset.id, attributeValues);

        setSelectedAsset(savedAsset);
        setCurrentScreen('asset-details');
        toast.success('Ativo atualizado com sucesso!');
      } else {
        savedAsset = await dataService.createAsset(asset);

        if (file) {
          const { path, filename } = await dataService.uploadAssetImage(savedAsset.id, file, onProgress);
          await dataService.updateAsset(savedAsset.id, { imgFilePath: path, imgFileName: filename });
          savedAsset = (await dataService.getAssetById(savedAsset.id)) || savedAsset;
        }

        // Save dynamic attribute values
        await dataService.saveAssetAttributeValues(savedAsset.id, attributeValues);

        // Abre a página do ativo recém-criado (relido: já com imagem e atributos); voltar leva à lista.
        savedAsset = (await dataService.getAssetById(savedAsset.id)) || savedAsset;
        setSelectedAsset(savedAsset);
        setLastAssetSource('assets-search');
        setCurrentScreen('asset-details');
        toast.success('Ativo criado com sucesso!');
      }
    } catch (error: any) {
      console.error("Error saving asset", error);
      toast.error("Erro ao salvar ativo: " + error.message);
    }
  };

  const handleAddTeam = (departmentId?: string) => {
    // If departmentId is provided, find and select that department
    if (departmentId) {
      const dept = departments.find(d => d.id === departmentId);
      if (dept) {
        setSelectedDepartment(dept);
      }
    }
    setCurrentScreen('team-form');
  };

  const handleSaveTeam = async (team: Partial<Team>) => {
    try {
      if (selectedTeam?.id) {
        // Update existing team
        await dataService.updateTeam(selectedTeam.id, team);
      } else {
        // Create new team
        await dataService.createTeam(team);
      }
      setSelectedTeam(null);
      // If we have a selected company, go back to company details (the tree view)
      if (selectedCompany) {
        setCurrentScreen('company-details');
      } else {
        setCurrentScreen('department-details');
      }
    } catch (error) {
      console.error("Error saving team", error);
      toast.error("Erro ao salvar equipe");
    }
  };

  const handleEditTeam = () => {
    setCurrentScreen('team-edit');
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam?.id) return;

    if (confirm(`Deseja realmente excluir a equipe "${selectedTeam.name}"?`)) {
      try {
        await dataService.deleteTeam(selectedTeam.id);
        setSelectedTeam(null);
        setCurrentScreen('department-details');
      } catch (error) {
        console.error("Error deleting team", error);
        toast.error(error instanceof Error ? error.message : "Erro ao excluir equipe");
      }
    }
  };

  const handleDeleteTeamInline = async (teamId: string) => {
    try {
      await dataService.deleteTeam(teamId);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting team", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir equipe");
    }
  };

  const handleToggleEvaluable = async (teamId: string, currentValue: boolean) => {
    try {
      await dataService.updateTeam(teamId, { isEvaluable: !currentValue });
      toast.success(!currentValue ? 'Equipe marcada como avaliável' : 'Equipe marcada como não avaliável');
    } catch (error) {
      console.error("Error toggling team evaluable", error);
      toast.error("Erro ao alterar configuração de avaliação");
    }
  };


  const handleEditDepartment = () => {
    setCurrentScreen('department-edit');
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    if (confirm(`Deseja excluir o departamento "${selectedDepartment.name}"?`)) {
      try {
        await dataService.deleteDepartment(selectedDepartment.id);
        setSelectedDepartment(null);
        setCurrentScreen('company-details');
      } catch (error) {
        console.error("Error deleting department", error);
        toast.error("Erro ao excluir departamento");
      }
    }
  }


  const handleAddUser = () => {
    setCurrentScreen('user-form');
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCurrentScreen('profile');
  };

  const handleSystemSelect = (system: import('./types').System) => {
    setSelectedSystem(system);
    setCurrentScreen('system-edit');
  };

  const handleSaveSystem = async (system: Partial<import('./types').System>) => {
    try {
      if (selectedSystem?.id && currentScreen === 'system-edit') {
        await dataService.updateSystem(selectedSystem.id, system);
      } else {
        await dataService.createSystem(system);
      }
      setCurrentScreen('systems');
    } catch (error) {
      console.error("Error saving system", error);
      toast.error("Erro ao salvar sistema");
    }
  };

  const handleUnitTypeSelect = (unitType: import('./types').UnitType) => {
    setSelectedUnitType(unitType);
    setCurrentScreen('unit-type-edit');
  };

  const handleSaveUnitType = async (unitType: Partial<import('./types').UnitType>) => {
    try {
      if (selectedUnitType?.id && currentScreen === 'unit-type-edit') {
        await dataService.updateUnitType(selectedUnitType.id, unitType);
      } else {
        await dataService.createUnitType(unitType);
      }
      setCurrentScreen('unit-types');
    } catch (error) {
      console.error("Error saving unit type", error);
      toast.error("Erro ao salvar tipo");
    }
  };

  const handleRouteSelect = (route: import('./types').Route) => {
    setSelectedRoute(route);
    setCurrentScreen('route-edit');
  };

  const handleSaveRoute = async (route: Partial<import('./types').Route>) => {
    try {
      if (selectedRoute?.id && currentScreen === 'route-edit') {
        await dataService.updateRoute(selectedRoute.id, route);
      } else {
        await dataService.createRoute(route);
      }
      setCurrentScreen('route-management');
    } catch (error) {
      console.error("Error saving route", error);
      toast.error("Erro ao salvar rota");
    }
  };

  const handleUnitSelect = async (unit: import('./types').Unit) => {
    setSelectedUnit(unit);

    // Ensure selectedClient matches the unit's clientId
    if (!selectedClient || String(selectedClient.id) !== String(unit.clientId)) {
      try {
        const clients = await dataService.getClients();
        const client = clients.find(c => String(c.id) === String(unit.clientId));
        if (client) {
          setSelectedClient(client);
        }
      } catch (error) {
        console.error("Error setting selected client for unit", error);
      }
    }

    setCurrentScreen('unit-details');
  };

  const handleSaveUnit = async (unit: Partial<import('./types').Unit>, file?: File | null, onProgress?: (progress: number) => void) => {
    try {
      console.log('💾 Saving unit:', {
        unit,
        hasFile: !!file,
        fileName: file?.name,
        statusId: unit.statusId,
        isEdit: selectedUnit?.id && currentScreen === 'client-unit-edit'
      });

      let savedUnit: import('./types').Unit;
      const isEdit = selectedUnit?.id && currentScreen === 'client-unit-edit';

      if (isEdit) {
        console.log('✏️ Editing unit:', selectedUnit!.id, 'with data:', unit);
        savedUnit = await dataService.updateUnit(selectedUnit!.id, unit);
        console.log('✏️ Unit updated:', savedUnit);
      } else {
        savedUnit = await dataService.createUnit({ ...unit, clientId: unit.clientId || selectedClient?.id });
        console.log('✨ Unit created:', savedUnit);
      }

      if (file) {
        const clientIdToUse = selectedClient?.id || savedUnit.clientId;
        console.log('📸 Processing image upload:', { clientIdToUse, unitId: savedUnit.id });

        if (clientIdToUse) {
          try {
            const { path, filename } = await dataService.uploadUnitImage(clientIdToUse, savedUnit.id, file, onProgress);
            console.log('🖼️ Image uploaded, updating unit with:', { path, filename });

            const updatedWithImage = await dataService.updateUnit(savedUnit.id, {
              imgFilePath: path,
              imgFileName: filename
            });
            console.log('✅ Unit updated with image:', updatedWithImage);
            // Force manual update to ensure fresh image paths AND URL
            const freshUrl = dataService.getPublicImageUrl(path, filename, { width: 400, height: 400, resize: 'cover' });
            savedUnit = { ...updatedWithImage, imgFilePath: path, imgFileName: filename, logoUrl: freshUrl };
          } catch (uploadError) {
            console.error("❌ Error uploading unit image", uploadError);
            toast.error("Unidade salva, mas erro ao fazer upload da imagem.");
          }
        } else {
          console.warn('⚠️ No clientId available for image upload');
        }
      } else {
        console.log('ℹ️ No image file provided');
      }

      if (isEdit) {
        // Fetch fresh data to ensure all relationships and URLs are correct
        const freshUnit = await dataService.getUnitById(savedUnit.id);

        console.log('🔍 [handleSaveUnit] Verification:', {
          uploadHappened: !!file,
          savedUnitImg: savedUnit.imgFileName,
          freshUnitImg: freshUnit?.imgFileName,
          freshUnitClient: freshUnit?.clientName
        });

        if (freshUnit) {
          // Manually merge image data from savedUnit to ensure we don't use stale cache from freshUnit fetch
          const mergedUnit = {
            ...freshUnit,
            imgFilePath: savedUnit.imgFilePath,
            imgFileName: savedUnit.imgFileName,
            logoUrl: dataService.getPublicImageUrl(savedUnit.imgFilePath || '', savedUnit.imgFileName || '', {
              width: 800,
              height: 800,
              resize: 'contain'
            })
          };

          console.log('🚀 [handleSaveUnit] UI Refresh with:', {
            id: mergedUnit.id,
            client: mergedUnit.clientName,
            finalUrl: mergedUnit.logoUrl
          });

          setSelectedUnit(mergedUnit);
        } else {
          console.warn('⚠️ [handleSaveUnit] DB Fetch failed, using last saved result');
          setSelectedUnit(savedUnit);
        }

        // Refresh the list in background so it's ready when user goes back
        setUnitsListRefreshKey(prev => prev + 1);

        // Redirect to details page to show the updated unit
        setCurrentScreen('unit-details');
      } else {
        // For new units, also show the details
        setSelectedUnit(savedUnit);
        setUnitsListRefreshKey(prev => prev + 1);
        setCurrentScreen('unit-details');
      }
    } catch (error) {
      console.error("❌ Error saving unit", error);
      toast.error("Erro ao salvar unidade");
    }
  };

  const handleActivitySelect = (activity: import('./types').Activity) => {
    setSelectedActivity(activity);
    setCurrentScreen('activity-edit');
  };

  const handleSaveActivity = async (activity: Partial<import('./types').Activity>) => {
    try {
      if (selectedActivity?.id && currentScreen === 'activity-edit') {
        await dataService.updateActivity(selectedActivity.id, activity);
      } else {
        await dataService.createActivity(activity);
      }
      setCurrentScreen('activities');
    } catch (error) {
      console.error("Error saving activity", error);
      toast.error("Erro ao salvar atividade");
    }
  };



  const handleServiceSelect = (service: import('./types').Service) => {
    setSelectedService(service);
    setCurrentScreen('service-edit');
  };

  const handleSaveService = async (service: Partial<import('./types').Service>) => {
    try {
      if (selectedService?.id && currentScreen === 'service-edit') {
        await dataService.updateService(selectedService.id, service);
      } else {
        await dataService.createService(service);
      }
      setCurrentScreen('services');
    } catch (error) {
      console.error("Error saving service", error);
      toast.error("Erro ao salvar serviço");
    }
  };

  const handleMaterialSelect = (material: import('./types').Material) => {
    setSelectedMaterial(material);
    setCurrentScreen('material-details');
  };

  const handleSaveMaterial = async (material: Partial<import('./types').Material>) => {
    try {
      if (selectedMaterial?.id && currentScreen === 'material-edit') {
        const updated = await dataService.updateMaterial(selectedMaterial.id, material);
        setSelectedMaterial(updated);
        setCurrentScreen('material-details');
      } else {
        const created = await dataService.createMaterial(material);
        setSelectedMaterial(created);
        setCurrentScreen('material-details');
      }
    } catch (error) {
      console.error("Error saving material", error);
      toast.error("Erro ao salvar material");
    }
  };

  const handlePrioritySelect = (priority: Priority) => {
    setSelectedPriority(priority);
    setCurrentScreen('priority-edit');
  };

  const handleSavePriority = async (priority: Partial<Priority>) => {
    try {
      if (selectedPriority?.id && currentScreen === 'priority-edit') {
        await dataService.updatePriority(selectedPriority.id, priority);
      } else {
        await dataService.createPriority(priority);
      }
      setCurrentScreen('priorities');
    } catch (error) {
      console.error("Error saving priority", error);
      toast.error("Erro ao salvar prioridade");
    }
  };

  const handleOrderTypeSelect = (orderType: OrderType) => {
    setSelectedOrderType(orderType);
    setCurrentScreen('order-type-edit');
  };

  const handleSaveOrderType = async (orderType: Partial<OrderType>) => {
    try {
      if (selectedOrderType?.id && currentScreen === 'order-type-edit') {
        await dataService.updateOrderType(selectedOrderType.id, orderType);
      } else {
        await dataService.createOrderType(orderType);
      }
      setCurrentScreen('order-types');
    } catch (error) {
      console.error("Error saving order type", error);
      toast.error("Erro ao salvar tipo de OS");
    }
  };

  const handleOrderSubTypeSelect = (orderSubType: OrderSubType) => {
    setSelectedOrderSubType(orderSubType);
    setCurrentScreen('order-sub-type-edit');
  };

  const handleSaveOrderSubType = async (orderSubType: Partial<OrderSubType>) => {
    try {
      if (selectedOrderSubType?.id && currentScreen === 'order-sub-type-edit') {
        await dataService.updateOrderSubType(selectedOrderSubType.id, orderSubType);
      } else {
        await dataService.createOrderSubType(orderSubType);
      }
      setCurrentScreen('order-sub-types');
    } catch (error) {
      console.error("Error saving order sub-type", error);
      toast.error("Erro ao salvar sub-tipo de OS");
    }
  };

  const handleOrderPlanSelect = (orderPlan: OrderPlan) => {
    setSelectedOrderPlan(orderPlan);
    setCurrentScreen('order-plan-edit');
  };

  const handleSaveOrderPlan = async (orderPlan: Partial<OrderPlan>) => {
    try {
      if (selectedOrderPlan?.id && currentScreen === 'order-plan-edit') {
        await dataService.updateOrderPlan(selectedOrderPlan.id, orderPlan);
      } else {
        await dataService.createOrderPlan(orderPlan);
      }
      setCurrentScreen('order-plans');
    } catch (error) {
      console.error("Error saving order plan", error);
      toast.error("Erro ao salvar plano de OS");
    }
  };

  const handleOrderObjectSelect = (orderObject: OrderObject) => {
    setSelectedOrderObject(orderObject);
    setCurrentScreen('order-object-edit');
  };

  const handleSaveOrderObject = async (orderObject: Partial<OrderObject>) => {
    try {
      if (selectedOrderObject?.id && currentScreen === 'order-object-edit') {
        await dataService.updateOrderObject(selectedOrderObject.id, orderObject);
      } else {
        await dataService.createOrderObject(orderObject);
      }
      setCurrentScreen('order-objects');
    } catch (error) {
      console.error("Error saving order object", error);
      toast.error("Erro ao salvar objeto de OS");
    }
  };

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentScreen('contract-details');
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;
    if (!confirm(`Deseja realmente excluir o contrato ${selectedContract.code}?`)) return;

    try {
      await dataService.deleteContract(selectedContract.id);
      setCurrentScreen(selectedCompany ? 'company-details' : 'contracts');
    } catch (error) {
      console.error("Error deleting contract", error);
      toast.error("Erro ao excluir contrato");
    }
  };

  const handleSaveContract = async (contract: Partial<Contract>) => {
    try {
      if (selectedContract?.id && currentScreen === 'contract-edit') {
        await dataService.updateContract(selectedContract.id, contract);
        setCurrentScreen(selectedCompany ? 'company-details' : 'contracts');
      } else {
        await dataService.createContract(contract);
        setCurrentScreen(selectedCompany ? 'company-details' : 'contracts');
      }
    } catch (error) {
      console.error("Error saving contract", error);
      toast.error("Erro ao salvar contrato");
    }
  };

  function renderContent() {
    const isUserUnavailable = !(currentUser?.isAvailable ?? true) && !hasOpenVisit;
    const allowedScreensWhenUnavailable: Screen[] = ['profile', 'settings'];

    if (isUserUnavailable && !allowedScreensWhenUnavailable.includes(currentScreen)) {
      return (
        <UserUnavailableScreen
          onBecomeAvailable={() => handleUserStatusChange(true, null)}
        />
      );
    }

    if (SETTINGS_SCREENS.has(currentScreen)) {
      return (
        <SettingsRouter
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen as any)}
          ctx={{
            currentUser,
            selectedSystem, handleSystemSelect, handleSaveSystem,
            selectedUnitType, handleUnitTypeSelect, handleSaveUnitType,
            selectedClient, handleClientSelect, handleSaveClient, handleEditClient, handleDeleteClient, handleAddClick,
            selectedUnit, selectedUnitAssetTag, setSelectedUnitAssetTag, unitsListRefreshKey, setUnitsListRefreshKey,
            handleUnitSelect, handleSaveUnit,
            selectedActivity, handleActivitySelect, handleSaveActivity,
            selectedService, handleServiceSelect, handleSaveService,
            selectedMaterial, setSelectedMaterial, materialDefaultTab, handleMaterialSelect, handleSaveMaterial,
            selectedPriority, handlePrioritySelect, handleSavePriority,
            selectedOrderType, handleOrderTypeSelect, handleSaveOrderType,
            selectedOrderSubType, handleOrderSubTypeSelect, handleSaveOrderSubType,
            selectedOrderPlan, handleOrderPlanSelect, handleSaveOrderPlan,
            selectedOrderObject, handleOrderObjectSelect, handleSaveOrderObject,
            selectedAssetType, handleAssetTypeSelect, handleSaveAssetType,
            selectedAssetStatus, handleAssetStatusSelect, handleSaveAssetStatus,
            selectedAssetPriority, handleAssetPrioritySelect, handleSaveAssetPriority,
            selectedAssetTag, handleAssetTagSelect, handleSaveAssetTag,
            selectedAssetTagSub, handleAssetTagSubSelect, handleSaveAssetTagSub,
            selectedTechnicalManual, handleTechnicalManualSelect, handleSaveTechnicalManual, handleDeleteTechnicalManual, handleAssetSelect,
            selectedChecklistType, setSelectedChecklistType,
            selectedLoansChecklist, setSelectedLoansChecklist,
            selectedUser, setSelectedUser, setSelectedCompany,
            selectedRoute, handleRouteSelect, handleSaveRoute,
            handleBack,
          }}
        />
      );
    }

    switch (currentScreen) {
      case 'dashboard': {
        const dashboardScreen = (
          <DashboardScreen
            currentUser={currentUser}
            onGamificationChange={setDashboardGamification}
            initialTab={dashboardInitialTab}
            onSelectOrder={handleOrderSelect}
            onResumeVisit={(visitId) => {
              setLastVisitSource('dashboard');
              setCurrentScreen('order-visit-execute');
            }}
            onSelectVisit={handleVisitSelect}
            onTabChange={(tab) => {
              setDashboardInitialTab(tab);
              localStorage.setItem('dashboardInitialTab', tab);
            }}
            onEdit={(order) => {
              setSelectedOrder(order);
              setCurrentScreen('order-create');
            }}
            onNavigate={(screen) => setCurrentScreen(screen as any)}
            topSlot={isUiV2 ? (
              // Visual novo: atalhos circulares no topo da home (docs/PLANO_DESIGN_ESTILO_NUBANK.md, F3)
              <HomeShortcutsRail
                navigate={(tab) => handleMainTabChange(tab)}
                isAdminSuper={currentUser?.isAdminSuper}
                isAdmin={currentUser?.isAdmin}
              />
            ) : undefined}
          />
        );
        return dashboardScreen;
      }
      case 'ss-dashboard':
        return (
          <SsScreenGate onForbidden={handleSsScreenForbidden}>
            <ServicesRequestsDashboardAdmin
              currentUser={currentUser}
              onSelectOrder={(order) => {
                setLastOrderSource('ss-dashboard');
                setSelectedOrder(order);
                const isOS = order.type === 'OS' || (order.parentId && Number(order.parentId) > 0);
                if (isOS) {
                  setOrderDetailActiveTab('SS');
                  setCurrentScreen('order-detail');
                } else {
                  setSsDetailActiveTab('OS');
                  setCurrentScreen('service-request-detail');
                }
              }}
              onSelectVisit={handleVisitSelect}
              onTrackUsers={handleTrackUsers}
              onCreateServiceRequest={() => {
                setSelectedOrder(null);
                setCurrentScreen('service-request-create');
              }}
              onNavigate={handleNavigate}
              onEdit={(order) => {
                setSelectedOrder(order);
                setCurrentScreen('order-create');
              }}
              providerCompanyId={providerCompanyId}
            />
          </SsScreenGate>
        );
      case 'ss-dashboard-period':
        return (
          <SsScreenGate onForbidden={handleSsScreenForbidden}>
            <ServicesRequestsPeriodDashboardAdmin
              currentUser={currentUser}
              onSelectOrder={(order) => {
                setLastOrderSource('ss-dashboard-period');
                setSelectedOrder(order);
                const isOS = order.type === 'OS' || (order.parentId && Number(order.parentId) > 0);
                if (isOS) {
                  setOrderDetailActiveTab('SS');
                  setCurrentScreen('order-detail');
                } else {
                  setSsDetailActiveTab('OS');
                  setCurrentScreen('service-request-detail');
                }
              }}
              onSelectVisit={handleVisitSelect}
              onTrackUsers={handleTrackUsers}
              onCreateServiceRequest={() => {
                setSelectedOrder(null);
                setCurrentScreen('service-request-create');
              }}
              onNavigate={handleNavigate}
              onEdit={(order) => {
                setSelectedOrder(order);
                setCurrentScreen('order-create');
              }}
              providerCompanyId={providerCompanyId}
              onlineScreenKey={ssPeriodReturnScreen}
            />
          </SsScreenGate>
        );
      case 'orders-dashboard':
        return (
          <OrdersRequestsDashboardAdmin
            currentUser={currentUser}
            onSelectOrder={handleOrderSelect}
            onSelectVisit={handleVisitSelect}
            onTrackUsers={handleTrackUsers}
            onCreateServiceRequest={() => {
              setSelectedOrder(null);
              setCurrentScreen('service-request-create');
            }}
            onNavigate={handleNavigate}
            onEdit={(order) => {
              setSelectedOrder(order);
              setCurrentScreen('order-create');
            }}
            activeTab={ordersDashboardTab}
            providerCompanyId={providerCompanyId}
          />
        );
      case 'orders-dashboard-period':
        return (
          <OrdersRequestsPeriodDashboardAdmin
            currentUser={currentUser}
            onSelectOrder={handleOrderSelect}
            onSelectVisit={handleVisitSelect}
            onTrackUsers={handleTrackUsers}
            onCreateServiceRequest={() => {
              setSelectedOrder(null);
              setCurrentScreen('service-request-create');
            }}
            onNavigate={handleNavigate}
            onEdit={(order) => {
              setSelectedOrder(order);
              setCurrentScreen('order-create');
            }}
            activeTab="OS"
            providerCompanyId={providerCompanyId}
          />
        );
      case 'visits-dashboard':
        return (
          <OrdersRequestsDashboardAdmin
            currentUser={currentUser}
            onSelectOrder={handleOrderSelect}
            onSelectVisit={handleVisitSelect}
            onTrackUsers={handleTrackUsers}
            onCreateServiceRequest={() => {
              setSelectedOrder(null);
              setCurrentScreen('service-request-create');
            }}
            onNavigate={handleNavigate}
            onEdit={(order) => {
              setSelectedOrder(order);
              setCurrentScreen('order-create');
            }}
            activeTab="VISITAS"
            providerCompanyId={providerCompanyId}
          />
        );
      case 'visits-today':
        return (
          <DashboardOrdersVisitsTodayScreen
            company={selectedCompany!}
            onBack={() => setCurrentScreen('orders-dashboard')}
          />
        );
      case 'dashboard-orders-admin-calendar':
        return (
          <DashboardOrdersAdminCalendarScreen
            currentUser={currentUser!}
            onSelectVisit={handleVisitSelect}
            onOrderSelect={handleOrderSelect}
            onEdit={(order) => {
              setSelectedOrder(order);
              setCurrentScreen('order-create');
            }}
          />
        );
      case 'services-history':
        return (
          <SsScreenGate onForbidden={handleSsScreenForbidden}>
            <ServicesRequestsDashboardAdmin
              currentUser={currentUser}
              onSelectOrder={(order) => {
                setLastOrderSource('services-history');
                setSelectedOrder(order);
                const isOS = order.type === 'OS' || (order.parentId && Number(order.parentId) > 0);
                if (isOS) {
                  setOrderDetailActiveTab('SS');
                  setCurrentScreen('order-detail');
                } else {
                  setSsDetailActiveTab('OS');
                  setCurrentScreen('service-request-detail');
                }
              }}
              onNavigate={(path) => {
                if (path === 'services-history') {
                  setCurrentScreen('services-history');
                } else if (path === 'ss-dashboard-period') {
                  setSsPeriodReturnScreen('services-history');
                  setCurrentScreen('ss-dashboard-period');
                }
              }}
              providerCompanyId={providerCompanyId}
              onlineScreenKey="services-history"
            />
          </SsScreenGate>
        );
      case 'dashboard-units-power-electric':
        return (
          <DashboardUnitsPowerElectric
            currentUser={currentUser!}
            onSelectVisit={handleVisitSelect}
            onFiltersChange={(filters) => console.log('Filters changed', filters)}
          />
        );
      case 'dashboard-units-assets-tags':
        return (
          <DashboardUnitsAssetsTags
            currentUser={currentUser!}
            onSelectVisit={handleVisitSelect}
            onCreateServiceRequest={(initialData) => {
              setSelectedOrder(initialData as any);
              setCurrentScreen('service-request-create');
            }}
          />
        );
      case 'dashboard-contracts-evaluations':
        return (
          <DashboardAdminContractsEvaluationsRequirements
            currentUser={currentUser!}
          />
        );
      case 'leader-ranking':
        return (
          <LeaderRankingDashboard
            currentUser={currentUser!}
          />
        );
      case 'team-shifts':
        return (
          <TeamShiftsScreenGate>
            <DashboardTeamShifts currentUser={currentUser!} />
          </TeamShiftsScreenGate>
        );
      case 'companies':
        return <CompaniesList onSelect={handleCompanySelect} onAdd={handleAddClick} />;
      case 'company-details':
        return selectedCompany ? (
          <CompanyDetails
            key={selectedCompany.id}
            company={selectedCompany}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onAddDepartment={handleAddDepartment}
            onSelectDepartment={handleDepartmentSelect}
            onSelectTeam={handleTeamSelect}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeamInline}
            onToggleEvaluable={handleToggleEvaluable}
            onAddUser={handleAddUser}
            onSelectUser={handleUserSelect}
            onSelectContract={handleContractSelect}
            onAddContract={() => setCurrentScreen('contract-form')}
          />
        ) : null;
      case 'company-form':
        return (
          <CompanyForm
            onSave={handleSaveCompany}
            onCancel={() => setCurrentScreen('companies')}
          />
        );
      case 'company-edit':
        return selectedCompany ? (
          <CompanyForm
            initialCompany={selectedCompany}
            onSave={handleSaveCompany}
            onCancel={() => setCurrentScreen('company-details')}
          />
        ) : null;
      case 'department-form':
        return selectedCompany ? (
          <DepartmentForm
            companyId={selectedCompany.id}
            onSave={handleSaveDepartment}
            onCancel={() => setCurrentScreen('company-details')}
          />
        ) : null;
      case 'department-details':
        return selectedDepartment ? (
          <DepartmentDetails
            department={selectedDepartment}
            onAddTeam={handleAddTeam}
            onSelectTeam={handleTeamSelect}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
          />
        ) : null;
      case 'department-edit':
        return selectedDepartment && selectedCompany ? (
          <DepartmentForm
            companyId={selectedCompany.id}
            initialDepartment={selectedDepartment}
            onSave={handleSaveDepartment}
            onCancel={() => setCurrentScreen('department-details')}
          />
        ) : null;
      case 'team-form':
        return (
          <TeamForm
            departmentId={selectedDepartment?.id}
            companyId={selectedCompany?.id}
            onSave={handleSaveTeam}
            onCancel={() => {
              if (selectedCompany) setCurrentScreen('company-details');
              else if (selectedDepartment) setCurrentScreen('department-details');
              else setCurrentScreen('companies');
            }}
          />
        );
      case 'team-details':
        return selectedTeam ? (
          <TeamDetails
            team={selectedTeam}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
          />
        ) : null;
      case 'team-edit':
        return selectedTeam ? (
          <TeamForm
            companyId={selectedCompany?.id}
            initialTeam={selectedTeam}
            onSave={handleSaveTeam}
            onCancel={() => setCurrentScreen('team-details')}
          />
        ) : null;
      case 'user-form': {
        const fromAllUsers = selectedCompany && !selectedCompany.name;
        return selectedCompany ? (
          <UserForm
            companyId={selectedCompany.id}
            onSave={() => setCurrentScreen(fromAllUsers ? 'all-users' : 'company-details')}
            onCancel={() => setCurrentScreen(fromAllUsers ? 'all-users' : 'company-details')}
          />
        ) : null;
      }
      case 'profile':
        return <ProfileScreen
          user={selectedUser || (currentUser as User)}
          onBack={() => {
            if (selectedUser) {
              // Se vier do fluxo de consulta, volta para consulta
              setCurrentScreen('user-details');
            } else {
              const lastTab = localStorage.getItem('last_main_tab') || 'dashboard';
              handleMainTabChange(lastTab);
            }
          }}
          onThemeToggle={toggleTheme}
          isDarkMode={theme === 'dark'}
          onUserUpdate={(updatedUser) => {
            if (!selectedUser) {
              setCurrentUser(updatedUser);
            } else {
              setSelectedUser(updatedUser);
            }
          }}
          onStatusChange={handleUserStatusChange}
        />;
      case 'app-notices':
        return <AppNoticesList onBack={handleBack} />;
      case 'extra-workers':
        return <ExtraWorkersList onNavigate={handleNavigate} />;
      case 'tools':
        return <ToolsMainView companyId={currentUser?.companyId || ''} />;
      case 'contracts':
        return <ContractsList onSelect={handleContractSelect} onAdd={handleAddClick} />;
      case 'contract-form':
        return (
          <ContractForm
            companyId={selectedCompany?.id}
            onSave={handleSaveContract}
            onCancel={handleBack}
          />
        );
      case 'contract-details':
        return selectedContract ? (
          <ContractDetails
            contract={selectedContract}
            onEdit={() => setCurrentScreen('contract-edit')}
            onDelete={handleDeleteContract}
          />
        ) : null;
      case 'contract-edit':
        return selectedContract ? (
          <ContractForm
            companyId={selectedCompany?.id}
            initialContract={selectedContract}
            onSave={handleSaveContract}
            onCancel={handleBack}
          />
        ) : null;
      case 'units-search':
        return <UnitsSearch key={`search-${unitsListRefreshKey}`} currentUser={currentUser!} onSelectUnit={handleUnitSelect} onAdd={() => setCurrentScreen('unit-create')} />;
      case 'unit-create':
        return <UnitForm clientId="" onSave={handleSaveUnit} onCancel={() => setCurrentScreen('units-search')} />;
      case 'assets-search':
        return <AssetsSearch currentUser={currentUser!} onSelectAsset={handleAssetSelect} onAdd={() => setCurrentScreen('asset-form')} />;
      case 'assets-alerts':
        return <AssetsAlerts onSelectAsset={(assetId) => {
          const goToAsset = async () => {
            try {
              const asset = await dataService.getAssetById(assetId);
              if (asset) handleAssetSelect(asset);
            } catch (e) { console.error(e); }
          };
          goToAsset();
        }} onSelectOrder={async (orderId) => {
          try {
            const order = await dataService.getOrderById(orderId);
            if (order) {
              setSelectedOrder(order);
              setCurrentScreen('order-detail');
            }
          } catch (e) { console.error(e); }
        }} />;
      case 'asset-details':
        return selectedAsset ? (
          <AssetDetails
            asset={selectedAsset}
            onBack={handleBack}
            onEdit={() => setCurrentScreen('asset-edit')}
            onDuplicate={() => {
              setCloneSourceAsset(selectedAsset);
              setCurrentScreen('asset-clone-wizard');
            }}
            onViewReport={(ovaId) => {
              setSelectedOrderVisitAssetId(ovaId);
              setSelectedOrderVisitAsset(null);
              setSelectedVisitForAssetReport(null);
              setAssetReportBackScreen('asset-details');
              setCurrentScreen('order-visit-asset-report');
            }}
            onMaterialSelect={handleMaterialSelect}
          />
        ) : null;
      case 'asset-form':
        return <AssetForm onSave={handleSaveAsset} onCancel={handleBack} onMaterialSelect={handleMaterialSelect} />;
      case 'asset-edit':
        return selectedAsset ? (
          <AssetForm initialAsset={selectedAsset} onSave={handleSaveAsset} onCancel={handleBack} onMaterialSelect={handleMaterialSelect} />
        ) : null;
      case 'asset-clone-wizard':
        return cloneSourceAsset ? (
          <AssetCloneWizard
            sourceAsset={cloneSourceAsset}
            onCancel={handleBack}
            onComplete={(newAsset) => {
              // Abre a página do ativo recém-criado (voltar leva de volta à origem da navegação).
              setCloneSourceAsset(null);
              setSelectedAsset(newAsset);
              setCurrentScreen('asset-details');
            }}
          />
        ) : null;
      case 'notifications':
        return (
          <NotificationsList
            notifications={notifications}
            onNotificationRead={handleNotificationRead}
            onNotificationClick={handleNotificationClick}
          />
        );
      case 'service-request-detail':
        if (routeOrderId) return (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Carregando...
          </div>
        );
        return selectedOrder ? (
          <ServiceRequestDetail
            order={selectedOrder}
            onRefreshOrder={() => handleRefreshOrder(selectedOrder.id)}
            activeTab={ssDetailActiveTab}
            onTabChange={setSsDetailActiveTab}
            onSelectOrder={handleOrderSelect}
            onSelectVisit={handleVisitSelect}
            onBack={() => setCurrentScreen('orders-dashboard')}
            onEdit={() => setCurrentScreen('service-request-create')}
            onGenerateOS={() => setCurrentScreen('order-create')}
            onCloneSS={(clonedData) => {
              setSelectedOrder(clonedData as any);
              setCurrentScreen('service-request-create');
            }}
            onCancelSS={() => {
              setCurrentScreen('orders-dashboard');
            }}
          />
        ) : null;
      case 'service-request-create':
        return (
          <ServiceRequestPage
            onBack={() => setCurrentScreen('orders-dashboard')}
            onSubmit={(data) => handleOrderSelect(data)}
            initialData={selectedOrder || undefined}
            onSelectOrder={(order) => handleOrderSelect(order)}
          />
        );
      case 'order-create':
        return (
          <OrderRequestPage
            onBack={() => setCurrentScreen('orders-dashboard')}
            onSubmit={(data) => handleOrderSelect(data)}
            initialData={selectedOrder || undefined}
            mode={selectedOrder?.id && selectedOrder?.parentId ? 'edit' : undefined}
          />
        );
      case 'order-detail':
        if (routeOrderId) return (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Carregando...
          </div>
        );
        return selectedOrder ? (
          <OrderRequestView
            order={selectedOrder}
            currentUser={currentUser}
            onRefreshOrder={() => handleRefreshOrder(selectedOrder.id)}
            onBack={() => {
              if (selectedOrder.id === currentUser?.oIdInProgress) {
                setLastVisitSource('order-detail');
                setCurrentScreen('order-visit-execute');
              } else {
                handleBack();
              }
            }}
            onEdit={() => {
              setCurrentScreen('order-create');
            }}
            onCancel={() => {
              setCurrentScreen('orders-dashboard');
            }}
            onStartVisit={(startedAt?: string) => {
              return new Promise<void>(async (resolve, reject) => {
                // Sem internet: com o modo offline liberado, a visita nasce no aparelho
                // ("tmp:") e vai para a fila (etapa 3, flow_order_visit_create_v3).
                // Sem o modo offline, continua exigindo conexão.
                if (!isOnline() && !isOfflineSupported()) {
                  toast.error('Sem internet. Para iniciar a visita é preciso estar conectado. Conecte-se e tente de novo.', { id: 'start-visit-offline', duration: 6000 });
                  reject(new Error('offline'));
                  return;
                }
                const startingOffline = !isOnline();
                if (selectedOrder && currentUser) {
                  try {
                    toast.loading('Iniciando visita...');
                    await dataService.startOrderVisit(selectedOrder, currentUser, startedAt);
                    toast.dismiss();
                    toast.success(startingOffline
                      ? 'Visita iniciada sem internet. Ela será enviada quando a conexão voltar.'
                      : 'Visita iniciada com sucesso!');

                    // Refresh user data to update isAvailable and inProgress status
                    const updatedUser = await dataService.getCurrentUser({ force: true });
                    if (updatedUser) {
                      setCurrentUser(updatedUser);
                      if (updatedUser.ovIdInProgress) {
                        // Visita nova: baixa já para o aparelho (o sinal pode cair logo).
                        // Iniciada offline ("tmp:") já foi montada no aparelho.
                        if (!String(updatedUser.ovIdInProgress).startsWith('tmp:')) {
                          prefetchVisitOffline(updatedUser.ovIdInProgress, true);
                        }
                        // Verifica em segundo plano se os dados offline mudaram (OSs, unidades,
                        // materiais...) — não segura o início da visita.
                        if (!startingOffline) runOfflineAutoSync('visit-start');
                        setLastVisitSource('order-detail');
                        setCurrentScreen('order-visit-execute');
                      } else {
                        setCurrentScreen('dashboard');
                      }
                    } else {
                      setCurrentScreen('dashboard');
                    }
                    resolve();
                  } catch (e) {
                    toast.dismiss();
                    toast.error(e instanceof Error ? e.message : 'Erro ao iniciar visita');
                    console.error(e);
                    reject(e);
                  }
                } else {
                  reject(new Error('Missing order or user'));
                }
              });
            }}
            onVisitTransferred={() => {
              // visita mudou de OS: recarrega a tela da visita e o usuário
              setVisitRefreshKey(k => k + 1);
              setLastVisitSource('order-detail');
              setCurrentScreen('order-visit-execute');
              dataService.getCurrentUser({ force: true }).then(u => { if (u) setCurrentUser(u); });
            }}
            onSelectParentOrder={handleOrderSelect}
            onSelectVisit={handleVisitSelect}
            activeTab={orderDetailActiveTab}
            onTabChange={setOrderDetailActiveTab}
          />
        ) : null;
      case 'order-visit-execute':
        const vId = selectedVisit?.id || currentUser?.ovIdInProgress?.toString();
        return vId ? (
          <OrderVisitPage
            key={visitRefreshKey}
            visitId={vId}
            activeTab={visitActiveTab}
            onTabChange={handleVisitTabChange}
            onBack={() => {
              setSelectedVisit(null);
              setCurrentScreen(lastVisitSource);
            }}
            onEndVisit={() => {
              setSelectedVisit(null);
              if (currentUser) {
                // Igual ao servidor no encerramento: líder volta disponível (sem isso,
                // encerrar sem internet travava o "Iniciar" da próxima OS).
                setCurrentUser({ ...currentUser, isOvInProgress: false, ovIdInProgress: undefined, isAvailable: true });
              }
              setCurrentScreen('dashboard');
              toast.success('Visita encerrada com sucesso');
            }}
            onAssetSelect={handleOrderVisitAssetSelect}
            onApproveVisitRequest={(visit, order) => {
              setSelectedVisitForApproval(visit);
              setSelectedOrder(order);
              setCurrentScreen('order-visit-approve');
            }}
            onNavigateToEvaluation={async () => {
              if (vId) {
                const visitData = await dataService.getOrderVisitById(vId);
                if (visitData) {
                  setSelectedVisitForApproval(visitData);
                  setCurrentScreen('order-visit-evaluation');
                }
              }
            }}
            onChatEntered={handleChatEntered}
            onViewOrder={async () => {
              if (selectedVisit?.oId) {
                try {
                  const orderData = await dataService.getOrderById(selectedVisit.oId);
                  if (orderData) {
                    setSelectedOrder(orderData);
                    setCurrentScreen('order-detail');
                  }
                } catch (error) {
                  console.error('Error loading order:', error);
                  toast.error('Erro ao carregar ordem de serviço');
                }
              }
            }}
          />
        ) : null;
      case 'order-visit-approve':
        return (selectedVisitForApproval && selectedOrder) ? (
          <OrderRequestApproveConfirm
            onBack={() => {
              setCurrentScreen('order-visit-execute');
            }}
            onNavigateToEvaluation={() => {
              setCurrentScreen('order-visit-evaluation');
            }}
            onSubmit={async (data: any) => {
              if (!selectedVisitForApproval || !currentUser) return;

              const approvePromise = async () => {
                // Update the order, approve the visit, and register its plans atomically.
                await dataService.updateOrderVisitProcessing(selectedVisitForApproval.id, 5, currentUser.id, {
                  statusId: parseInt(data.statusId),
                  progress: data.progress,
                  suspendedReasonId: data.suspendedReasonId ? parseInt(data.suspendedReasonId) : null,
                  causeReasonId: data.causeReasonId ? parseInt(data.causeReasonId) : null
                });

                // Recarregar a OS para refletir o status atual (inclusive mudanças
                //    propagadas pelo trigger trg_order_status_inheritance na SS pai).
                //    Sem isso, selectedOrder fica com dados stale ao retornar para order-detail.
                if (selectedOrder?.id) {
                  const refreshedOrder = await dataService.getOrderById(selectedOrder.id);
                  if (refreshedOrder) setSelectedOrder(refreshedOrder);
                }

                setVisitRefreshKey(k => k + 1);
                setCurrentScreen('order-visit-execute');
              };

              toast.promise(approvePromise(), {
                loading: 'Aprovando visita e atualizando OS...',
                success: 'Visita aprovada com sucesso!',
                error: (err) => err instanceof Error ? err.message : 'Erro ao aprovar visita'
              });
            }}
            initialData={selectedOrder}
            visit={selectedVisitForApproval}
          />
        ) : null;

      case 'order-visit-evaluation':
        return selectedVisitForApproval ? (
          <VisitEvaluationPage
            visitId={selectedVisitForApproval.id}
            onBack={() => {
              if (selectedOrder) {
                setCurrentScreen('order-visit-approve');
              } else {
                setCurrentScreen('order-visit-execute');
              }
            }}
            onSaved={() => {
              setVisitRefreshKey(k => k + 1);
              setCurrentScreen('order-visit-execute');
            }}
          />
        ) : null;

      case 'order-visit-asset-report':
        return selectedOrderVisitAssetId ? (
          <OrderVisitAssetReport
            // key: trocar de ativo (setas do desktop) remonta a tela — fotos, autosave e trava zerados.
            key={selectedOrderVisitAssetId}
            assetId={selectedOrderVisitAssetId}
            // Só aberto pela visita: setas (desktop) e avanço automático após reportar/revisar/aprovar.
            onNavigateAsset={assetReportBackScreen === 'order-visit-execute' ? (target) => {
              setSelectedOrderVisitAsset(target);
              setSelectedOrderVisitAssetId(String(target.id));
            } : undefined}
            initialAsset={selectedOrderVisitAsset || undefined}
            initialVisit={selectedVisitForAssetReport || undefined}
            onBack={leaveAssetReport}
            focusSection={assetReportFocus}
            onFocusHandled={() => setAssetReportFocus(null)}
            onApproved={() => {
              // Aberto pela visita: volta para a aba de ativos, já atualizada.
              // Aberto por outra tela (ex.: detalhes do ativo): volta para ela.
              if (assetReportBackScreen === 'order-visit-execute') {
                setVisitActiveTab('assets');
                setVisitRefreshKey(k => k + 1);
              }
              leaveAssetReport();
            }}
            onManageActivities={(orderTypeId) => {
              setSelectedOrderTypeId(orderTypeId);
              setCurrentScreen('order-visit-asset-activities');
            }}
            onManageMaterials={() => {
              setCurrentScreen('order-visit-asset-materials');
            }}
            onViewAsset={async () => {
              const assetId = selectedOrderVisitAsset?.assetId;
              if (assetId) {
                const fullAsset = await dataService.getAssetById(assetId);
                if (fullAsset) {
                  handleAssetSelect(fullAsset);
                }
              }
            }}
          />
        ) : null;
      case 'order-visit-asset-activities':
        return (selectedOrderVisitAssetId && selectedOrderTypeId) ? (
          <OrderVisitAssetActivities
            ovAssetId={selectedOrderVisitAssetId}
            orderTypeId={selectedOrderTypeId}
            onBack={() => {
              // Próximo passo do preenchimento: materiais
              setAssetReportFocus('materials');
              setCurrentScreen('order-visit-asset-report');
            }}
          />
        ) : null;
      case 'order-visit-asset-materials':
        return selectedOrderVisitAssetId ? (
          <OrderVisitAssetMaterials
            ovAssetId={selectedOrderVisitAssetId}
            onBack={() => {
              setAssetReportFocus('materials');
              setCurrentScreen('order-visit-asset-report');
            }}
          />
        ) : null;
      case 'users-tracker':
        return selectedCompanyForTracker ? (
          <UsersTracker
            company={selectedCompanyForTracker}
            leaderIds={selectedCompanyForTracker.trackerLeaderIds}
            onBack={() => setCurrentScreen('orders-dashboard')}
          />
        ) : null;
      case 'rental-contracts':
        return (
          <VehiclesDashboardAdminScreen
            onNavigate={handleNavigate}
            onSelectVisit={(visit, tab) => handleVisitSelect(visit as any, tab ?? 'transport')}
            initialTab="rental-contracts"
          />
        );
      case 'rate-contracts':
        return (
          <VehiclesDashboardAdminScreen
            onNavigate={handleNavigate}
            onSelectVisit={(visit, tab) => handleVisitSelect(visit as any, tab ?? 'transport')}
            initialTab="rental-contracts"
          />
        );
      case 'rental-apportionment':
        return (
          <VehiclesDashboardAdminScreen
            onNavigate={handleNavigate}
            onSelectVisit={(visit, tab) => handleVisitSelect(visit as any, tab ?? 'transport')}
            initialTab="costs"
          />
        );
      case 'vehicles':
        return (
          <VehiclesDashboardAdminScreen
            onNavigate={handleNavigate}
            onSelectVisit={(visit, tab) => handleVisitSelect(visit as any, tab ?? 'transport')}
            initialTab="vehicles"
          />
        );
      case 'fuel-expense':
        return <FuelExpenseScreen onNavigate={handleNavigate} />;
      case 'orders-daily-schedule':
        return <OrdersDailyScheduleScreen currentUser={currentUser!} onSelectOrder={handleOrderSelect} />;
      case 'grant-dashboard':
        return <GrantDashboardScreen onNavigate={handleNavigate} onSelectOrder={handleOrderSelect} currentUser={currentUser} />;
      default:
        return <CompaniesList onSelect={handleCompanySelect} onAdd={handleAddClick} />;
    }
  };

  const handleTrackUsers = (company: Company, leaderIds?: string[]) => {
    const target = { ...company, trackerLeaderIds: leaderIds };
    if (Capacitor.isNativePlatform()) {
      setSelectedCompanyForTracker(target);
      setCurrentScreen('users-tracker');
    } else {
      localStorage.setItem('tracker_company', JSON.stringify(target));
      window.open(window.location.pathname + '?screen=users-tracker', '_blank');
    }
  };

  const getTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'Meu Painel';
      case 'orders-dashboard': return '';
      case 'orders-dashboard-period': return '';
      case 'visits-dashboard': return '';
      case 'dashboard-contracts-evaluations': return '';
      case 'leader-ranking': return '';
      case 'team-shifts': return 'Ociosidade';
      case 'users-tracker': return 'VISITAS EM TEMPO REAL';
      case 'companies': return 'Empresas';
      case 'company-details': return 'Empresa';
      case 'company-form': return 'Nova Empresa';
      case 'company-edit': return 'Editar Empresa';
      case 'department-form': return 'Novo Departamento';
      case 'department-details': return 'Departamento';
      case 'team-form': return 'Nova Equipe';
      case 'team-details': return 'Equipe';
      case 'team-edit': return 'Editar Equipe';
      case 'department-edit': return 'Editar Departamento';
      case 'user-form': return 'Novo Usuário';
      case 'all-users': return 'Usuários';
      case 'user-details': return 'Detalhes do Usuário';
      case 'profile': return 'Perfil';
      case 'settings': return 'Ajustes';
      case 'systems': return 'Sistemas / Sub-sistemas';
      case 'system-form': return 'Novo Sistema';
      case 'system-edit': return 'Editar Sistema';
      case 'unit-types': return 'Tipos / Sub-tipos';
      case 'unit-type-form': return 'Novo Tipo';
      case 'unit-type-edit': return 'Editar Tipo';
      case 'clients': return 'Clientes';
      case 'client-details': return 'Cliente';
      case 'client-form': return 'Novo Cliente';
      case 'client-units': return 'Unidades do Cliente';
      case 'client-unit-form': return 'Nova Unidade';
      case 'client-unit-edit': return 'Editar Unidade';
      case 'unit-create': return 'Nova Unidade';
      case 'unit-details': return 'Unidade';
      case 'unit-structure': return 'Estrutura da Unidade';
      case 'client-edit': return 'Editar Cliente';
      case 'activities': return 'Atividades';
      case 'services': return 'Serviços';
      case 'service-form': return 'Novo Serviço';
      case 'service-edit': return 'Editar Serviço';
      case 'materials': return 'Materiais';
      case 'materials-search': return 'Materiais';
      case 'material-form': return 'Novo Material';
      case 'material-edit': return 'Editar Material';
      case 'material-details': return 'Material';
      case 'materials-dashboard': return 'Dashboard de Materiais';
      case 'evaluation-requirements': return 'Requisitos para Avaliações';
      case 'activity-form': return 'Nova Atividade';
      case 'activity-edit': return 'Editar Atividade';
      case 'contracts': return 'Contratos';
      case 'contract-form': return 'Novo Contrato';
      case 'contract-details': return 'Contrato';
      case 'contract-edit': return 'Editar Contrato';
      case 'units-search': return 'Unidades';
      case 'assets-search': return 'Ativos';
      case 'assets-alerts': return 'Alertas de Ativos';
      case 'asset-details': return 'Ativo';
      case 'asset-form': return 'Novo Ativo';
      case 'asset-clone-wizard': return 'Clonar Ativo';
      case 'asset-edit': return 'Editar Ativo';
      case 'priorities': return 'Prioridades';
      case 'priority-form': return 'Nova Prioridade';
      case 'priority-edit': return 'Editar Prioridade';
      case 'order-types': return 'Tipos de OS';
      case 'order-type-form': return 'Novo Tipo de OS';
      case 'order-type-edit': return 'Editar Tipo de OS';
      case 'order-sub-types': return 'Sub-Tipos de OS';
      case 'order-sub-type-form': return 'Novo Sub-Tipo de OS';
      case 'order-sub-type-edit': return 'Editar Sub-Tipo de OS';
      case 'order-plans': return 'Planos';
      case 'order-plan-form': return 'Novo Plano';
      case 'order-plan-edit': return 'Editar Plano';
      case 'order-objects': return 'Objetos';
      case 'order-object-form': return 'Novo Objeto';
      case 'order-object-edit': return 'Editar Objeto';
      case 'asset-types': return 'Tipos de Ativos';
      case 'asset-type-form': return 'Novo Tipo de Ativo';
      case 'asset-type-edit': return 'Editar Tipo de Ativo';
      case 'asset-type-attributes': return 'Dados Técnicos por Tipo';
      case 'asset-attributes-brands': return 'Marcas e Modelos';
      case 'asset-statuses': return 'Situações de Ativos';
      case 'asset-status-form': return 'Nova Situação';
      case 'asset-status-edit': return 'Editar Situação';
      case 'asset-priorities': return 'Prioridades de Ativos';
      case 'asset-priority-form': return 'Nova Prioridade';
      case 'asset-priority-edit': return 'Editar Prioridade';
      case 'asset-tags': return 'Setores';
      case 'asset-tag-form': return 'Novo Setor';
      case 'asset-tag-edit': return 'Editar Setor';
      case 'asset-tag-subs': return 'Posições';
      case 'asset-tag-sub-form': return 'Nova Posição';
      case 'asset-tag-sub-edit': return 'Editar Posição';
      case 'technical-manuals': return 'Manuais';
      case 'technical-manual-form': return 'Novo Manual';
      case 'technical-manual-edit': return 'Editar Manual';
      case 'technical-manual-details': return 'Detalhes do Manual';
      case 'asset-loan-checklist-types': return 'Checklists por Tipo de Ativo';
      case 'asset-loan-checklist-type-form': return 'Novo Vínculo';
      case 'asset-loan-checklist-type-edit': return 'Editar Vínculo';
      case 'loans-checklists': return 'Itens de Checklist';
      case 'loans-checklist-form': return 'Novo Item de Checklist';
      case 'loans-checklist-edit': return 'Editar Item de Checklist';
      case 'notifications': return 'Notificações';
      case 'service-request-detail': return 'Detalhes da SS';
      case 'service-request-create': return selectedOrder?.id ? 'Edição SS' : 'Nova SS';
      case 'order-create': return (selectedOrder?.id && selectedOrder?.parentId) ? 'Edição OS' : 'Nova OS';
      case 'order-detail': return 'Detalhes da OS';
      case 'order-visit-execute': return 'Visita';
      case 'order-visit-asset-report': return 'Relatório de Ativo';
      case 'order-visit-asset-activities': return 'Atividades';
      case 'order-visit-asset-materials': return 'Materiais';
      case 'profile-permissions': return 'Gestão Permissões';
      case 'route-management': return 'Gerenciar Rotas';
      case 'route-form': return 'Nova Rota';
      case 'route-edit': return 'Editar Rota';
      case 'order-visit-approve': return 'Aprovação Visita';
      case 'order-visit-evaluation': return 'Avaliação da Visita';
      case 'maintenance-plans': return 'Planos Man Programada';
      case 'maintenance-plan-form': return 'Novo Plano';
      case 'maintenance-plan-edit': return 'Editar Plano';
      case 'maintenance-plan-details': return 'Detalhes do Plano';
      case 'unit-asset-tag-details': return 'Disponibilidade do Setor';
      case 'unit-asset-tag-available': return 'Disponibilidade';
      case 'services-history': return 'Histórico de SS';
      case 'app-notices': return 'Avisos';
      case 'extra-workers': return 'MO Extra';
      case 'audit-log': return 'Auditoria';
      case 'audit-config': return 'Tabelas auditadas';
      case 'settings-api-guaibaflow': return 'API GuaibaFlow';
      case 'tools': return 'Ferramentas';
      case 'vehicle-cost-types': return 'Tipos de Custo Veicular';
      case 'rental-contracts': return 'Gestão Transportes';
      case 'rental-apportionment': return 'Gestão Transportes';
      case 'rate-contracts': return 'Gestão Transportes';
      case 'vehicles': return 'Gestão Transportes';
      case 'fuel-expense': return 'Combustível';
      case 'grant-dashboard': return 'Cronograma';
      case 'orders-daily-schedule': return 'Programação Diária';
      default: return 'Siges';
    }
  };

  // Histórico de telas (#/tela) + botão voltar do Android. Só com usuário logado:
  // antes disso o "#" pode trazer o token de recuperação de senha do Supabase.
  const canEnterScreen = (s: Screen): boolean => {
    switch (s as string) {
      case 'company-details': case 'company-edit': case 'department-form': return !!selectedCompany;
      case 'department-details': return !!selectedDepartment;
      case 'team-details': return !!selectedTeam;
      case 'team-edit': return !!selectedTeam && !!selectedCompany;
      case 'contract-details': case 'contract-edit': return !!selectedContract;
      case 'asset-details': case 'asset-edit': return !!selectedAsset;
      case 'asset-clone-wizard': return !!cloneSourceAsset;
      case 'service-request-detail': case 'order-detail': return !!selectedOrder;
      case 'order-visit-execute': return !!(selectedVisit?.id || currentUser?.ovIdInProgress);
      case 'order-visit-approve': return !!(selectedVisitForApproval && selectedOrder);
      case 'order-visit-evaluation': return !!selectedVisitForApproval;
      case 'order-visit-asset-report': case 'order-visit-asset-materials': return !!selectedOrderVisitAssetId;
      case 'order-visit-asset-activities': return !!(selectedOrderVisitAssetId && selectedOrderTypeId);
      case 'users-tracker': return !!selectedCompanyForTracker;
      default: return true;
    }
  };
  // OS/SS vinda da URL: a memória pode ter outra (ou nenhuma); busca pelo id.
  const loadRouteOrder = (orderId: string) => {
    if (selectedOrderRef.current?.id != null && String(selectedOrderRef.current.id) === orderId) {
      routeOrderReq.current = null;
      setRouteOrderId(null);
      return;
    }
    routeOrderReq.current = orderId;
    setRouteOrderId(orderId);
    const fail = () => {
      if (routeOrderReq.current !== orderId) return;
      routeOrderReq.current = null;
      setRouteOrderId(null);
      toast.error('Não foi possível abrir a OS/SS.');
      setCurrentScreen('dashboard');
    };
    dataService.getOrderById(orderId).then(order => {
      if (routeOrderReq.current !== orderId) return;
      if (!order) { fail(); return; }
      routeOrderReq.current = null;
      setSelectedOrder(order);
      setRouteOrderId(null);
    }).catch(fail);
  };
  // Etapa 1b: ids do fluxo da visita vão para a URL (app/screenRoutes.ts) e voltam dela.
  const routeSelection: Selection = {
    visitId: (selectedVisit?.id || currentUser?.ovIdInProgress?.toString()) ?? null,
    ovaId: selectedOrderVisitAssetId,
    orderTypeId: selectedOrderTypeId,
    orderId: routeOrderId ?? (selectedOrder?.id != null ? String(selectedOrder.id) : null),
  };
  const applyRouteSelection = (sel: Selection) => {
    if (sel.visitId) {
      setSelectedVisit(prev => (prev?.id != null && String(prev.id) === sel.visitId ? prev : ({ id: sel.visitId } as unknown as import('./types').OrderVisit)));
    }
    if (sel.ovaId) {
      // Objetos "de arranque" (initialAsset/initialVisit) são de outro ativo: descarta.
      setSelectedOrderVisitAsset(prev => (prev != null && String(prev.id) === sel.ovaId ? prev : null));
      setSelectedVisitForAssetReport(prev => (selectedOrderVisitAssetId === sel.ovaId ? prev : null));
      setSelectedOrderVisitAssetId(sel.ovaId);
    }
    if (sel.orderTypeId) setSelectedOrderTypeId(sel.orderTypeId);
    if (sel.orderId) loadRouteOrder(sel.orderId);
  };
  useScreenHistory<Screen>({
    screen: currentScreen,
    setScreen: setCurrentScreen,
    selection: routeSelection,
    applySelection: applyRouteSelection,
    routing: {
      toPath: (screen, sel) => toPath(screen, sel),
      fromPath: pathname => {
        const route = fromPath(pathname);
        return route ? { screen: route.screen as Screen, selection: route.selection } : null;
      },
    },
    enabled: !!currentUser && !authLoading && authScreen !== 'reset-password'
      && new URLSearchParams(window.location.search).get('fullscreenMap') !== 'true',
    homeScreen: 'dashboard',
    canEnter: canEnterScreen,
    // Mesmo voltar da seta do cabeçalho; telas sem seta (abas, "Voltar" no rodapé) caem no histórico.
    logicalBack: () => {
      if (!hasHeaderBack(currentScreen)) return false;
      handleBack();
      return true;
    },
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
        <Loading size="md" />
      </div>
    );
  }

  // Reset-password must be checked BEFORE the !currentUser guard.
  // Supabase recovery sessions authenticate the user automatically, so currentUser
  // will be set — but we still need to show the password reset form.
  if (authScreen === 'reset-password') {
    return <ResetPasswordScreen
      onSuccess={async () => {
        isRecoveryFlowRef.current = false;
        window.history.replaceState({}, document.title, '/');
        // Clear reset screen immediately — loadUser will set currentUser
        setAuthScreen('login');
        setAuthLoading(true);
        try {
          await loadUserRef.current?.();
        } catch (e) {
          console.error('[Recovery] Failed to load user after password reset:', e);
          // loadUser already handles fallback to login
        } finally {
          setAuthLoading(false);
        }
      }}
      onBack={() => setAuthScreen('forgot-password')}
    />;
  }

  if (!currentUser) {
    if (authScreen === 'forgot-password') {
      return <ForgotPasswordScreen onBack={() => setAuthScreen('login')} />;
    }
    return (
      <LoginScreen
        onLoginSuccess={() => {
          if (currentUserRef.current) {
            return;
          }
          setAuthLoading(true);
          loadUserRef.current?.();
        }}
        onForgotPassword={() => setAuthScreen('forgot-password')}
        isDarkMode={theme === 'dark'}
        onThemeToggle={toggleTheme}
      />
    );
  }

  // Handle Fullscreen Map Mode via URL Param
  const isFullscreenMap = new URLSearchParams(window.location.search).get('fullscreenMap') === 'true';
  if (isFullscreenMap) {
    return (
      <PermissionsProvider currentUser={currentUser}>
        <div className="fixed inset-0 bg-background-light dark:bg-background-dark overflow-hidden screen-safe">
          <DashboardUnitsAssetsTags
            currentUser={currentUser!}
            onSelectVisit={handleVisitSelect}
            isFullscreenMapMode={true}
          />
        </div>
        <Toaster
          position={Capacitor.isNativePlatform() ? 'bottom-center' : 'top-right'}
          richColors
          closeButton
          style={Capacitor.isNativePlatform()
            ? { bottom: 'calc(max(var(--bottom-nav-h, 0px), env(safe-area-inset-bottom, 0px)) + 0.75rem)', position: 'fixed' }
            : { top: '24px', position: 'fixed' }
          }
        />
      </PermissionsProvider>
    );
  }

  const handleUserStatusChange = async (isAvailable: boolean, ovIdInProgress: string | null) => {
    if (!currentUser) return;

    try {
      await dataService.updateUserAvailability(currentUser.id, isAvailable, ovIdInProgress);

      // Atualizar o estado local do usuário
      setCurrentUser({
        ...currentUser,
        isAvailable,
        ovIdInProgress: ovIdInProgress ?? undefined
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  };

  // Helper to check if we're in a visit-related screen
  const isInVisitContext = currentScreen === 'order-visit-execute' ||
    currentScreen === 'order-visit-asset-report' ||
    currentScreen === 'order-visit-asset-activities' ||
    currentScreen === 'order-visit-asset-materials' ||
    currentScreen === 'order-visit-approve' ||
    currentScreen === 'order-visit-evaluation';

  const isFullPageScreen = currentScreen === 'service-request-create' ||
    currentScreen === 'order-create' ||
    currentScreen === 'service-request-detail' ||
    currentScreen === 'order-detail' ||
    currentScreen === 'asset-details' ||
    currentScreen === 'asset-form' ||
    currentScreen === 'asset-edit' ||
    currentScreen === 'asset-clone-wizard' ||
    currentScreen === 'unit-details' ||
    currentScreen === 'client-unit-form' ||
    currentScreen === 'unit-asset-tag-available' ||
    currentScreen === 'users-tracker';

  const hideMainNavigation = isInVisitContext || isFullPageScreen;

  const sidebarContent = (
    <Sidebar
      onNavigate={(path) => {
        handleNavigate(path);
      }}
      isAdminSuper={currentUser?.isAdminSuper}
      isAdmin={currentUser?.isAdmin}
      activeTab={activeTab}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={toggleSidebarCollapse}
      currentUser={currentUser}
    />
  );

  return (
    <>
      {showSplash && <SplashScreen isDarkMode={theme === 'dark'} />}
      <PermissionsProvider currentUser={currentUser}>
        {currentScreen === 'users-tracker' ? (
          <div className="w-full h-screen overflow-hidden relative">
            <React.Suspense fallback={
              <div className="flex h-screen bg-background-light dark:bg-background-dark items-center justify-center">
                <Loading size="md" />
              </div>
            }>
              <ErrorBoundary fallback={
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <span className="material-symbols-outlined text-red-500 text-3xl mb-3">error</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Falha ao carregar esta tela</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
                    Recarregar
                  </button>
                </div>
              }>
                {renderContent()}
              </ErrorBoundary>
            </React.Suspense>
          </div>
        ) : (
        <div className={`flex min-h-screen bg-background-light dark:bg-background-dark overflow-hidden ${showSplash ? 'hidden' : ''}`}>
          {currentScreen === 'profile' ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="hidden md:block">
                {sidebarContent}
              </div>
              <div className="flex-1 overflow-auto">
                <React.Suspense fallback={
                  <div className="flex h-full items-center justify-center p-8">
                    <Loading size="md" />
                  </div>
                }>
                  <ErrorBoundary fallback={
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <span className="material-symbols-outlined text-red-500 text-3xl mb-3">error</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Falha ao carregar esta tela</p>
                      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
                        Recarregar
                      </button>
                    </div>
                  }>
                    {renderContent()}
                  </ErrorBoundary>
                </React.Suspense>
              </div>
            </div>
          ) : (
            <Layout
              title={getTitle()}
              showBackButton={hasHeaderBack(currentScreen)}
              onBackClick={handleBack}
              currentUser={currentUser}
              showUserHeader={currentScreen !== 'settings'}
              hidePadding={hideMainNavigation}
              hideHeaderBorder={currentScreen === 'order-visit-approve'}
              hideHeader={(currentScreen as string) === 'users-tracker'}
              isDashboard={
                (currentScreen as string) === 'dashboard' ||
                (currentScreen as string) === 'orders-dashboard' ||
                (currentScreen as string) === 'orders-dashboard-period' ||
                (currentScreen as string) === 'visits-dashboard' ||
                (currentScreen as string) === 'dashboard-units-power-electric' ||
                (currentScreen as string) === 'dashboard-units-assets-tags' ||
                (currentScreen as string) === 'users-tracker' ||
                (currentScreen as string) === 'services-history'
              }
              dashboard={undefined}
              currentScreen={currentScreen as string}
              onProfileClick={() => {
                localStorage.setItem('last_main_tab', activeTab);
                setCurrentScreen('profile');
                setActiveTab('profile');
              }}
              onNotificationsClick={() => {
                setCurrentScreen('notifications');
              }}
              onStatusChange={handleUserStatusChange}
              sidebar={!hideMainNavigation ? sidebarContent : undefined}
              onMenuClick={undefined}
              tabNavigation={getTabNavigation()}
              userLeftElement={
                currentScreen === 'dashboard' && dashboardGamification ? (
                  <GamificationBadge
                    position={dashboardGamification.position}
                    positionChange={dashboardGamification.positionChange}
                    onClick={() => setShowDashboardGamificationHistory(true)}
                  />
                ) : undefined
              }
              titleRightElement={
                <>
                  {currentScreen === 'dashboard' && dashboardGamification && (
                    currentUser?.departmentId && currentUser?.teamId && (
                      <GamificationHistoryModal
                        isOpen={showDashboardGamificationHistory}
                        onClose={() => setShowDashboardGamificationHistory(false)}
                        departmentId={currentUser.departmentId}
                        teamId={currentUser.teamId}
                      />
                    )
                  )}
                  {currentScreen === 'assets-search' && (
                    <AssetsAlertsHeaderWidget onNavigate={(screen) => setCurrentScreen(screen as any)} />
                  )}
                </>
              }
            >
              <React.Suspense fallback={
                <div className="flex h-full items-center justify-center p-8">
                  <Loading size="md" />
                </div>
              }>
                <ErrorBoundary fallback={
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <span className="material-symbols-outlined text-red-500 text-3xl mb-3">error</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Falha ao carregar esta tela</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
                      Recarregar
                    </button>
                  </div>
                }>
                  {renderContent()}
                </ErrorBoundary>
              </React.Suspense>
            </Layout>
          )}


          {!hideMainNavigation && !isKeyboardVisible && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
              <BottomNav
                activeTab={activeTab}
                isAdminSuper={currentUser?.isAdminSuper}
                isAdmin={currentUser?.isAdmin}
                currentUser={currentUser}
                setActiveTab={(tab) => {
                  if (tab === 'profile') setSelectedUser(null);
                  handleMainTabChange(tab);
                }}
              />
            </div>
          )}

          {/* OrderVisitBottomNav has been moved to OrderVisitScreen component */}

          {isLocationBlocked && Capacitor.isNativePlatform() && (
            <LocationBlockedScreen
              blockReason={blockReason}
              onRetry={() => setRetryLocation(prev => prev + 1)}
            />
          )}

          {/* Aviso em destaque antes do pedido de localização (Play Store) */}
          <LocationDisclosureModal />

          <Modal
            isOpen={showShiftAlert.show}
            onClose={() => dismissAlert(showShiftAlert.type)}
            title={showShiftAlert.type === 'START' ? 'Início de Turno' : showShiftAlert.type === 'END_WITH_VISIT' ? 'Visita em Andamento' : 'Fim de Expediente'}
            message={showShiftAlert.message}
            type="info"
            confirmLabel={showShiftAlert.type === 'START' ? 'Ficar Disponível' : showShiftAlert.type === 'END_WITH_VISIT' ? 'Ir para a Visita' : 'NÃO ESTOU MAIS DISPONÍVEL'}
            cancelLabel={showShiftAlert.type === 'START' ? 'Manter Indisponível' : showShiftAlert.type === 'END_WITH_VISIT' ? 'Encerrar Turno' : 'Ainda estou disponível'}
            onConfirm={async () => {
              if (showShiftAlert.type === 'END_WITH_VISIT') {
                dismissAlert(showShiftAlert.type);
                if (currentUser?.ovIdInProgress) {
                  try {
                    const visit = await dataService.getOrderVisitById(currentUser.ovIdInProgress);
                    if (visit) {
                      handleVisitSelect(visit);
                    } else {
                      toast.error("Visita não encontrada.");
                    }
                  } catch (e) {
                    toast.error("Erro ao carregar visita em andamento.");
                  }
                }
                return;
              }
              try {
                await handleUserStatusChange(showShiftAlert.type === 'START', currentUser?.ovIdInProgress || null);
                dismissAlert(showShiftAlert.type);
                toast.success(showShiftAlert.type === 'START' ? 'Você está online!' : 'Check-out realizado com sucesso.');
                if (showShiftAlert.type !== 'START') {
                  setCurrentScreen('profile');
                }
              } catch (e) {
                toast.error('Erro ao atualizar status.');
              }
            }}
          />

          {/* Modo offline (F5): tela de pendências — aberta pela faixa do cabeçalho / cartão Modo campo */}
          <PendingOpsPanel />

          <Toaster
            position={Capacitor.isNativePlatform() ? 'bottom-center' : 'top-right'}
            richColors
            closeButton
            style={Capacitor.isNativePlatform()
              ? { bottom: 'calc(max(var(--bottom-nav-h, 0px), env(safe-area-inset-bottom, 0px)) + 0.75rem)', position: 'fixed' }
              : { top: '96px', position: 'fixed' }
            }
          />
          <UpdateNotifier />
          {/* App antigo (com.ag.siges): migração para br.com.sigesapp */}
          <LegacyAppMigrationScreen />
        </div>
        )}

        {/* Floating Exit Impersonation Button */}
        {sessionStorage.getItem('is_impersonating') === 'true' && (
          <button
            onClick={async () => {
              try {
                // 1. Restore original password before switching back
                const impersonatedUuid = sessionStorage.getItem('impersonated_user_uuid');
                if (impersonatedUuid) {
                  const { apiN8nService } = await import('./services/core/apiN8nService');
                  await apiN8nService.restorePassword(impersonatedUuid);
                }
              } catch (e) {
                console.error('Erro ao restaurar senha:', e);
                // Continue even if restore fails — admin can reset password manually
              }

              // 2. Restore admin session
              const adminToken = sessionStorage.getItem('admin_access_token');
              const adminRefresh = sessionStorage.getItem('admin_refresh_token');
              if (adminToken && adminRefresh) {
                const { supabase } = await import('./services/core/supabase');
                await supabase.auth.setSession({
                  access_token: adminToken,
                  refresh_token: adminRefresh,
                });
              }

              // 3. Clean up
              sessionStorage.removeItem('is_impersonating');
              sessionStorage.removeItem('impersonated_user_uuid');
              sessionStorage.removeItem('admin_access_token');
              sessionStorage.removeItem('admin_refresh_token');
              markReload('impersonation_end');
              window.location.reload();
            }}
            className="fixed bottom-[calc(var(--bottom-nav-h,calc(4.5rem+env(safe-area-inset-bottom,0px)))+1rem)] md:bottom-6 right-6 z-[99999] w-12 h-12 rounded-full bg-amber-500 text-black shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors active:scale-95"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            title="Voltar ao Admin"
          >
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </button>
        )}
      </PermissionsProvider>
    </>
  );
};

/**
 * App wrapper that provides NetworkProvider context
 */
const App: React.FC = () => {
  return (
    <NetworkProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </NetworkProvider>
  );
};

export default App;
