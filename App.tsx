import React, { useState, useEffect, useRef } from 'react';
import { NetworkProvider } from './contexts/NetworkContext';
import { useNetworkStatus, useNetworkAndQuality, useQualityNotifications } from './hooks/useNetworkStatus';
import { useNetworkAndQuality as useCombinedNetwork } from './hooks/useNetworkAndQuality';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { Button } from './components/ui/Button';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import UpdateNotifier from './components/UpdateNotifier';
import { dataService } from './services/dataService';
import { usePermissions } from './contexts/PermissionsContext';
import { permissionService } from './services/permissionService';
import { Sidebar } from './components/Sidebar';
import { DashboardTabs } from './components/DashboardTabs';
import { AppSettings } from './views/Settings/AppSettings';
import { LoginScreen } from './views/Users/LoginScreen';
import { Toaster, toast } from 'sonner';
import { Company, Client, Department, Team, User, Priority, OrderType, OrderSubType, OrderPlan, OrderObject, Contract, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, Asset, UserNotification, Order, OrderVisit, OrderVisitAssetView } from './types';

// Lazy Loaded Views (Fase 1 de Otimização de Performance)
const CompaniesList = React.lazy(() => import('./views/Settings/Companies/CompaniesList').then(m => ({ default: m.CompaniesList })));
const CompanyDetails = React.lazy(() => import('./views/Settings/Companies/CompanyDetails').then(m => ({ default: m.CompanyDetails })));
const CompanyForm = React.lazy(() => import('./views/Settings/Companies/CompanyForm').then(m => ({ default: m.CompanyForm })));
const DepartmentForm = React.lazy(() => import('./views/Departments/DepartmentForm').then(m => ({ default: m.DepartmentForm })));
const DepartmentDetails = React.lazy(() => import('./views/Departments/DepartmentDetails').then(m => ({ default: m.DepartmentDetails })));
const TeamForm = React.lazy(() => import('./views/Teams/TeamForm').then(m => ({ default: m.TeamForm })));
const TeamDetails = React.lazy(() => import('./views/Teams/TeamDetails').then(m => ({ default: m.TeamDetails })));
const ClientsList = React.lazy(() => import('./views/Settings/Clients/ClientsList').then(m => ({ default: m.ClientsList })));
const ClientDetails = React.lazy(() => import('./views/Settings/Clients/ClientDetails').then(m => ({ default: m.ClientDetails })));
const ClientForm = React.lazy(() => import('./views/Settings/Clients/ClientForm').then(m => ({ default: m.ClientForm })));
const UserForm = React.lazy(() => import('./views/Users/UserForm').then(m => ({ default: m.UserForm })));
const ProfileScreen = React.lazy(() => import('./views/Users/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ForgotPasswordScreen = React.lazy(() => import('./views/Users/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
const ResetPasswordScreen = React.lazy(() => import('./views/Users/ResetPasswordScreen').then(m => ({ default: m.ResetPasswordScreen })));
const DashboardScreen = React.lazy(() => import('./views/Dashboards/DashboardOrdersUserScreen').then(m => ({ default: m.DashboardScreen })));
const DashboardOrdersVisitsAdminScreen = React.lazy(() => import('./views/Dashboards/DashboardOrdersVisitsAdminScreen').then(m => ({ default: m.DashboardOrdersVisitsAdminScreen })));
const DashboardOrdersVisitsTodayScreen = React.lazy(() => import('./views/Dashboards/DashboardOrdersVisitsTodayScreen').then(m => ({ default: m.DashboardOrdersVisitsTodayScreen })));
const DashboardUnitsPowerElectric = React.lazy(() => import('./views/Dashboards/DashboardUnitsPowerElectric').then(m => ({ default: m.DashboardUnitsPowerElectric })));
const DashboardUnitsAssetsTags = React.lazy(() => import('./views/Dashboards/DashboardUnitsAssetsTags').then(m => ({ default: m.DashboardUnitsAssetsTags })));
const DashboardOrdersAdminCalendarScreen = React.lazy(() => import('./views/Dashboards/DashboardOrdersAdminCalendarScreen').then(m => ({ default: m.DashboardOrdersAdminCalendarScreen })));
const DashboardServicesAdminScreen = React.lazy(() => import('./views/Dashboards/DashboardServicesAdminScreen').then(m => ({ default: m.DashboardServicesAdminScreen })));
const ServicesRequestsDashboardAdmin = React.lazy(() => import('./views/ServiceRequest/ServicesRequestsDashboardAdmin').then(m => ({ default: m.ServicesRequestsDashboardAdmin })));
const SystemsList = React.lazy(() => import('./views/Settings/Systems/SystemsList').then(m => ({ default: m.SystemsList })));
const SystemForm = React.lazy(() => import('./views/Settings/Systems/SystemForm').then(m => ({ default: m.SystemForm })));
const UnitTypesList = React.lazy(() => import('./views/Settings/UnitTypes/UnitTypesList').then(m => ({ default: m.UnitTypesList })));
const UnitTypeForm = React.lazy(() => import('./views/Settings/UnitTypes/UnitTypeForm').then(m => ({ default: m.UnitTypeForm })));
const UnitsList = React.lazy(() => import('./views/Settings/Clients/Units/UnitsList').then(m => ({ default: m.UnitsList })));
const UnitForm = React.lazy(() => import('./views/Settings/Clients/Units/UnitForm').then(m => ({ default: m.UnitForm })));
const UnitDetails = React.lazy(() => import('./views/Settings/Clients/Units/UnitView').then(m => ({ default: m.UnitDetails })));
const ActivitiesList = React.lazy(() => import('./views/Settings/Activities/ActivitiesList').then(m => ({ default: m.ActivitiesList })));
const ActivityForm = React.lazy(() => import('./views/Settings/Activities/ActivityForm').then(m => ({ default: m.ActivityForm })));
const ContractsList = React.lazy(() => import('./views/Contracts/ContractsList').then(m => ({ default: m.ContractsList })));
const ContractForm = React.lazy(() => import('./views/Contracts/ContractForm').then(m => ({ default: m.ContractForm })));
const ContractDetails = React.lazy(() => import('./views/Contracts/ContractDetails').then(m => ({ default: m.ContractDetails })));
const ServicesList = React.lazy(() => import('./views/Settings/Services/ServicesList').then(m => ({ default: m.ServicesList })));
const ServiceForm = React.lazy(() => import('./views/Settings/Services/ServiceForm').then(m => ({ default: m.ServiceForm })));
const MaterialsList = React.lazy(() => import('./views/Settings/Materials/MaterialsList').then(m => ({ default: m.MaterialsList })));
const MaterialsSearch = React.lazy(() => import('./views/Settings/Materials/MaterialsSearch').then(m => ({ default: m.MaterialsSearch })));
const MaterialForm = React.lazy(() => import('./views/Settings/Materials/MaterialForm').then(m => ({ default: m.MaterialForm })));
const MaterialDetails = React.lazy(() => import('./views/Settings/Materials/MaterialDetails').then(m => ({ default: m.MaterialDetails })));
const MaterialsDashboard = React.lazy(() => import('./views/Settings/Materials/MaterialsDashboard').then(m => ({ default: m.MaterialsDashboard })));
const PrioritiesList = React.lazy(() => import('./views/Settings/Orders/Priorities/OrderPrioritiesList').then(m => ({ default: m.PrioritiesList })));
const PriorityForm = React.lazy(() => import('./views/Settings/Orders/Priorities/OrderPriorityForm').then(m => ({ default: m.PriorityForm })));
const OrderTypesList = React.lazy(() => import('./views/Settings/Orders/OrderTypes/OrderTypesList').then(m => ({ default: m.OrderTypesList })));
const OrderTypeForm = React.lazy(() => import('./views/Settings/Orders/OrderTypes/OrderTypeForm').then(m => ({ default: m.OrderTypeForm })));
const OrderSubTypesList = React.lazy(() => import('./views/Settings/Orders/OrderSubTypes/OrderSubTypesList').then(m => ({ default: m.OrderSubTypesList })));
const OrderSubTypeForm = React.lazy(() => import('./views/Settings/Orders/OrderSubTypes/OrderSubTypeForm').then(m => ({ default: m.OrderSubTypeForm })));
const OrderPlansList = React.lazy(() => import('./views/Settings/Orders/Plans/OrderPlansList').then(m => ({ default: m.OrderPlansList })));
const OrderPlanForm = React.lazy(() => import('./views/Settings/Orders/Plans/OrderPlanForm').then(m => ({ default: m.OrderPlanForm })));
const OrderObjectsList = React.lazy(() => import('./views/Settings/Orders/OrderObjects/OrderObjectsList').then(m => ({ default: m.OrderObjectsList })));
const OrderObjectForm = React.lazy(() => import('./views/Settings/Orders/OrderObjects/OrderObjectForm').then(m => ({ default: m.OrderObjectForm })));
const AssetTypesList = React.lazy(() => import('./views/Settings/Assets/AssetTypes/AssetTypesList').then(m => ({ default: m.AssetTypesList })));
const AssetTypeForm = React.lazy(() => import('./views/Settings/Assets/AssetTypes/AssetTypeForm').then(m => ({ default: m.AssetTypeForm })));
const AssetStatusesList = React.lazy(() => import('./views/Settings/Assets/AssetStatuses/AssetStatusesList').then(m => ({ default: m.AssetStatusesList })));
const AssetStatusForm = React.lazy(() => import('./views/Settings/Assets/AssetStatuses/AssetStatusForm').then(m => ({ default: m.AssetStatusForm })));
const AssetPrioritiesList = React.lazy(() => import('./views/Settings/Assets/AssetPriorities/AssetPrioritiesList').then(m => ({ default: m.AssetPrioritiesList })));
const AssetPriorityForm = React.lazy(() => import('./views/Settings/Assets/AssetPriorities/AssetPriorityForm').then(m => ({ default: m.AssetPriorityForm })));
const AssetTagsList = React.lazy(() => import('./views/Settings/Assets/AssetTags/AssetTagsList').then(m => ({ default: m.AssetTagsList })));
const AssetTagForm = React.lazy(() => import('./views/Settings/Assets/AssetTags/AssetTagForm').then(m => ({ default: m.AssetTagForm })));
const AssetTagSubsList = React.lazy(() => import('./views/Settings/Assets/AssetTagSubs/AssetTagSubsList').then(m => ({ default: m.AssetTagSubsList })));
const AssetTagSubForm = React.lazy(() => import('./views/Settings/Assets/AssetTagSubs/AssetTagSubForm').then(m => ({ default: m.AssetTagSubForm })));
const TechnicalManualsList = React.lazy(() => import('./views/Settings/Assets/TechnicalManuals/TechnicalManualsList').then(m => ({ default: m.TechnicalManualsList })));
const TechnicalManualForm = React.lazy(() => import('./views/Settings/Assets/TechnicalManuals/TechnicalManualForm').then(m => ({ default: m.TechnicalManualForm })));
const TechnicalManualDetails = React.lazy(() => import('./views/Settings/Assets/TechnicalManuals/TechnicalManualDetails').then(m => ({ default: m.TechnicalManualDetails })));
const UnitsSearch = React.lazy(() => import('./views/Units/UnitsSearch').then(m => ({ default: m.UnitsSearch })));
const UnitAssetTagAvailableForm = React.lazy(() => import('./views/Units/UnitAssetTagAvailableForm').then(m => ({ default: m.UnitAssetTagAvailableForm })));
const UnitAssetTagAvailableDetails = React.lazy(() => import('./views/Units/UnitAssetTagAvailableDetails').then(m => ({ default: m.UnitAssetTagAvailableDetails })));
const AssetsSearch = React.lazy(() => import('./views/Assets/AssetsSearch').then(m => ({ default: m.AssetsSearch })));
const AssetDetails = React.lazy(() => import('./views/Assets/AssetView').then(m => ({ default: m.AssetDetails })));
const AssetForm = React.lazy(() => import('./views/Assets/AssetForm').then(m => ({ default: m.AssetForm })));
const AssetsAlerts = React.lazy(() => import('./views/Assets/AssetsAlerts').then(m => ({ default: m.AssetsAlerts })));
const AssetsAlertsHeaderWidget = React.lazy(() => import('./components/assets/AssetsAlertsHeaderWidget').then(m => ({ default: m.AssetsAlertsHeaderWidget })));
const OrdersRequestsDashboardAdmin = React.lazy(() => import('./views/OrderRequest/OrdersRequestsDashboardAdmin').then(m => ({ default: m.OrdersRequestsDashboardAdmin })));
const NotificationsList = React.lazy(() => import('./views/Notifications/NotificationsList').then(m => ({ default: m.NotificationsList })));
const ServiceRequestDetail = React.lazy(() => import('./views/ServiceRequest/ServiceRequestDetail').then(m => ({ default: m.ServiceRequestDetail })));
const ServiceRequestPage = React.lazy(() => import('./views/ServiceRequest/ServiceRequestScreen').then(m => ({ default: m.ServiceRequestPage })));
const OrderRequestPage = React.lazy(() => import('./views/OrderRequest/OrderRequestScreen').then(m => ({ default: m.OrderRequestPage })));
const OrderRequestApproveConfirm = React.lazy(() => import('./views/OrderRequest/OrderRequestApproveConfirm').then(m => ({ default: m.OrderRequestApproveConfirm })));
const OrderRequestView = React.lazy(() => import('./views/OrderRequest/OrderRequestView').then(m => ({ default: m.OrderRequestView })));
const OrderVisitPage = React.lazy(() => import('./views/OrderVisit/OrderVisitScreen').then(m => ({ default: m.OrderVisitPage })));
const OrderVisitAssetReport = React.lazy(() => import('./views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport').then(m => ({ default: m.OrderVisitAssetReport })));
const OrderVisitAssetActivities = React.lazy(() => import('./views/OrderVisit/OrderVisitAsset/OrderVisitAssetActivities').then(m => ({ default: m.OrderVisitAssetActivities })));
const OrderVisitAssetMaterials = React.lazy(() => import('./views/OrderVisit/OrderVisitAsset/OrderVisitAssetMaterials').then(m => ({ default: m.OrderVisitAssetMaterials })));
const OrderVisitBottomNav = React.lazy(() => import('./components/ordersVisits/OrderVisitBottomNav').then(m => ({ default: m.OrderVisitBottomNav })));

const UsersTracker = React.lazy(() => import('./views/Users/UsersTracker').then(m => ({ default: m.UsersTracker })));
const AllUsersList = React.lazy(() => import('./views/Admin/AllUsersList').then(m => ({ default: m.AllUsersList })));
const UserViewScreen = React.lazy(() => import('./views/Admin/UserViewScreen').then(m => ({ default: m.UserViewScreen })));
import { useLocationTracker } from './hooks/useLocationTracker';
import { useKeyboard } from './hooks/useKeyboard';
const LocationBlockedScreen = React.lazy(() => import('./views/System/LocationBlockedScreen').then(m => ({ default: m.LocationBlockedScreen })));
const UserUnavailableScreen = React.lazy(() => import('./views/System/UserUnavailableScreen').then(m => ({ default: m.UserUnavailableScreen })));
import { Capacitor } from '@capacitor/core';
import { useShiftMonitor } from './hooks/useShiftMonitor';
import { Modal } from './components/ui/Modal';

const ProfilePermissionsScreen = React.lazy(() => import('./views/Admin/ProfilePermissionsScreen').then(m => ({ default: m.ProfilePermissionsScreen })));
const AIKnowledgeAdmin = React.lazy(() => import('./views/Settings/AIKnowledgeAdmin').then(m => ({ default: m.AIKnowledgeAdmin })));
import { PermissionsProvider } from './contexts/PermissionsContext';
const MaintenancePlansScreen = React.lazy(() => import('./views/Settings/MaintenancePlans/MaintenancePlansScreen').then(m => ({ default: m.MaintenancePlansScreen })));
const ToolsMainView = React.lazy(() => import('./views/Tools/ToolsMainView').then(m => ({ default: m.ToolsMainView })));

type Screen = 'dashboard' | 'orders-dashboard' | 'visits-dashboard' | 'dashboard-units-power-electric' | 'dashboard-units-assets-tags' | 'companies' | 'company-details' | 'company-form' | 'company-edit' | 'department-form' | 'department-details' | 'department-edit' | 'team-form' | 'team-details' | 'team-edit' | 'user-details' | 'user-form' | 'all-users' | 'profile' | 'notifications' | 'contracts' | 'contract-form' | 'contract-edit' | 'contract-details' | 'units-search' | 'unit-create' | 'assets-search' | 'assets-alerts' | 'asset-details' | 'asset-form' | 'asset-edit' | 'asset-duplicate' | 'settings' | 'ai-admin' | 'systems' | 'system-form' | 'system-edit' | 'unit-types' | 'unit-type-form' | 'unit-type-edit' | 'clients' | 'client-details' | 'client-form' | 'client-edit' | 'client-units' | 'client-unit-form' | 'client-unit-edit' | 'unit-details' | 'unit-asset-tag-available' | 'unit-asset-tag-details' | 'activities'
  | 'activity-form' | 'activity-edit' | 'services' | 'service-form' | 'service-edit' | 'materials' | 'materials-search' | 'material-form' | 'material-edit' | 'material-details' | 'materials-dashboard' | 'priorities' | 'priority-form' | 'priority-edit' | 'order-types' | 'order-type-form' | 'order-type-edit' | 'order-sub-types' | 'order-sub-type-form' | 'order-sub-type-edit' | 'order-plans' | 'order-plan-form' | 'order-plan-edit' | 'order-objects' | 'order-object-form' | 'order-object-edit' | 'asset-types' | 'asset-type-form' | 'asset-type-edit' | 'asset-statuses' | 'asset-status-form' | 'asset-status-edit' | 'asset-priorities' | 'asset-priority-form' | 'asset-priority-edit' | 'asset-tags' | 'asset-tag-form' | 'asset-tag-edit' | 'asset-tag-subs' | 'asset-tag-sub-form' | 'asset-tag-sub-edit' | 'technical-manuals' | 'technical-manual-form' | 'technical-manual-edit' | 'technical-manual-details' | 'service-request-detail' | 'service-request-create' | 'services-history' | 'order-detail' | 'order-create' | 'users-tracker' | 'order-visit-execute' | 'order-visit-asset-report' | 'order-visit-asset-activities' | 'order-visit-asset-materials' | 'profile-permissions' | 'order-visit-approve' | 'maintenance-plans' | 'maintenance-plan-form' | 'maintenance-plan-edit' | 'maintenance-plan-details' | 'visits-today' | 'tools' | 'dashboard-orders-admin-calendar';

import { ActionIcon } from './components/ui/ActionIcon';
import { imgproxyService } from './services/imgproxyService';
import { Loading } from './components/ui/Loading';


const AppContent: React.FC = () => {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [selectedCompanyForTracker, setSelectedCompanyForTracker] = useState<Company | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') === 'users-tracker') {
      const stored = sessionStorage.getItem('tracker_company');
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

    console.log('[AppContent] Network status:', { prevConnected, isConnected, connectionType });

    if (!isConnected && prevConnected) {
      // Transitioned from connected to disconnected
      console.log('[AppContent] Showing disconnect toast');
      toast.error('⚠️ Sem conexão de internet', {
        description: 'Verifique sua conexão WiFi ou dados móveis',
        duration: 5000,
      });
    } else if (isConnected && !prevConnected) {
      // Transitioned from disconnected to connected
      console.log('[AppContent] Showing reconnect toast');
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
    console.log('[AppContent] Data quality status:', { prevQuality, currentQuality, monitoring: isDataQualityMonitoring });

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
      console.log('[App] Deep link received:', data.url);
      try {
        const url = new URL(data.url);
        const path = url.pathname;
        const hash = url.hash;
        const search = url.search;

        // Password recovery deep link: siges://reset-password#... or siges://?code=...
        if (path.includes('/reset-password') || hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('code=')) {
          console.log('[App] Recovery deep link detected');
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

  // Status bar configuration on native
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      StatusBar.setOverlaysWebView({ overlay: false });
    }).catch(() => {
      // Plugin not installed — silent fail
    });
  }, []);



  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'units' | 'assets' | 'tools' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags' | 'materials' | 'manuals'>(() => {
    const saved = localStorage.getItem('app_active_tab');
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
    if (normalizedTab === 'orders') {
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
    }
  };
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen') as Screen | null;
    if (screenParam && screenParam === 'users-tracker') {
      const stored = sessionStorage.getItem('tracker_company');
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
    return 'dashboard';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const showSplash = !minTimePassed || authLoading;
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'dark';
  });

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
      console.log('[Recovery] token_hash detected, cleaning URL and calling verifyOtp');
      window.history.replaceState({}, document.title, '/');
      import('./services/supabase').then(({ supabase }) => {
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
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [lastAssetSource, setLastAssetSource] = useState<Screen>('assets-search');
  const [lastOrderSource, setLastOrderSource] = useState<Screen>('orders-dashboard');
  const [lastVisitSource, setLastVisitSource] = useState<Screen>('visits-dashboard');
  const [selectedOrderVisitAsset, setSelectedOrderVisitAsset] = useState<OrderVisitAssetView | null>(null);
  const [selectedVisitForAssetReport, setSelectedVisitForAssetReport] = useState<OrderVisit | null>(null);
  const [selectedOrderVisitAssetId, setSelectedOrderVisitAssetId] = useState<string | null>(null);
  const [selectedOrderTypeId, setSelectedOrderTypeId] = useState<string | null>(null);
  const [selectedUnitAssetTag, setSelectedUnitAssetTag] = useState<any>(null);
  const [assetReportBackScreen, setAssetReportBackScreen] = useState<Screen>('order-visit-execute');

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitsListRefreshKey, setUnitsListRefreshKey] = useState(0);
  const [visitRefreshKey, setVisitRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const selectedOrderRef = React.useRef<Order | null>(null);
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

  const [dashboardInitialTab, setDashboardInitialTab] = useState<'services' | 'visits'>(() => {
    return (localStorage.getItem('dashboardInitialTab') as 'services' | 'visits') || 'services';
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
    if (path === 'orders' || path === 'orders-dashboard') {
      tab = 'orders';
      setOrdersDashboardTab('OS');
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



  const getTabNavigation = () => {
    const isDashboardScreen = currentScreen === 'orders-dashboard' ||
      currentScreen === 'visits-dashboard' ||
      currentScreen === 'dashboard-units-power-electric' ||
      currentScreen === 'dashboard-units-assets-tags' ||
      currentScreen === 'dashboard-orders-admin-calendar' ||
      currentScreen === 'materials-dashboard' ||
      currentScreen === 'services-history';

    if (!isDashboardScreen) return undefined;
    return (
      <DashboardTabs
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        ordersDashboardTab={ordersDashboardTab}
        setOrdersDashboardTab={setOrdersDashboardTab}
        setActiveTab={setActiveTab}
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
        const user = await withTimeout(dataService.getCurrentUser(), 8000);

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

    // Subscribe to user changes for real-time updates
    const subscription = dataService.subscribeToUsers((payload: any) => {
      // Only refresh if the affected user is the current user
      if (payload.new && currentUserRef.current?.id === payload.new.id.toString()) {
        loadUser();
      }
    });

    // Subscribe to order changes to update detail view
    const orderSubscription = dataService.subscribeToOrders((payload) => {
      if (payload.new && selectedOrderRef.current?.id === payload.new.id.toString()) {
        dataService.getOrderById(payload.new.id.toString()).then(updated => {
          if (updated) setSelectedOrder(updated);
        });
      }
    });

    return () => {
      if (signedOutTimer) clearTimeout(signedOutTimer);
      authSubscription.unsubscribe();
      subscription.unsubscribe();
      orderSubscription.unsubscribe();
    }
  }, []);

  // Sync theme
  useEffect(() => {
    console.log('Switching theme to:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

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

    const loadNotifications = async () => {
      try {
        const [count, data] = await Promise.all([
          dataService.getNotificationsCount(currentUser.uuid),
          dataService.getNotifications(0, 10, currentUser.uuid)
        ]);

        setNotifications(data);
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, notificationsAmount: count } : null);
        }
      } catch (error) {
        console.error('Error loading initial notifications:', error);
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
        loadNotifications();
      }

      // Se receber uma notificação de OS Autorizada, dispara um evento para atualizar o painel
      if (newNotif?.type === 'OS Autorizada') {
        window.dispatchEvent(new CustomEvent('refresh_dashboard'));
      }
    });

    const pollInterval = setInterval(loadNotifications, 60000);

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

  const handleChatEntered = async (visitId: string) => {
    // Remove from local state immediately (optimistic)
    setNotifications(prev => {
      const newList = prev.filter(n => !(n.type === 'visit_chat' && n.ovId === visitId));
      if (currentUser && newList.length !== prev.length) {
        setCurrentUser({ ...currentUser, notificationsAmount: newList.length });
      }
      return newList;
    });
    // Delete from DB in background (fire-and-forget)
    try {
      await dataService.deleteVisitChatNotifications(visitId);
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
    currentUser?.isAvailable ?? true
  );

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

  const handleVisitSelect = (visit: import('./types').OrderVisit) => {
    if (currentScreen !== 'order-visit-execute') {
      setLastVisitSource(currentScreen);
    }
    setSelectedVisit(visit);
    setVisitActiveTab('home');
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
    } else if (currentScreen === 'client-units') {
      setCurrentScreen('client-details');
    } else if (currentScreen === 'unit-details') {
      if (activeTab === 'units') {
        setCurrentScreen('units-search');
      } else {
        setUnitsListRefreshKey(prev => prev + 1);
        setCurrentScreen('client-units');
      }

    } else if (currentScreen === 'unit-asset-tag-details' || currentScreen === 'unit-asset-tag-available') {
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
    } else if (currentScreen === 'asset-form' || currentScreen === 'asset-edit' || currentScreen === 'asset-duplicate') {
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
    } else if (currentScreen === 'services-history') {
      setCurrentScreen(lastOrderSource || 'orders-dashboard');
    } else if (currentScreen === 'order-create' || currentScreen === 'service-request-create') {
      setCurrentScreen('orders-dashboard');
    } else if (currentScreen === 'order-visit-execute') {
      setSelectedVisit(null);
      setCurrentScreen(lastVisitSource);
    } else if (currentScreen === 'order-visit-asset-report') {
      setCurrentScreen(assetReportBackScreen);
    } else if (currentScreen === 'order-visit-asset-activities' || currentScreen === 'order-visit-asset-materials') {
      setCurrentScreen('order-visit-asset-report');
    } else if (currentScreen === 'order-visit-approve') {
      setCurrentScreen('order-visit-execute');
    } else if (currentScreen === 'users-tracker') {
      sessionStorage.removeItem('tracker_company');
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

        setCurrentScreen('assets-search');
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
        toast.error("Erro ao excluir equipe");
      }
    }
  };

  const handleDeleteTeamInline = async (teamId: string) => {
    try {
      await dataService.deleteTeam(teamId);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting team", error);
      toast.error("Erro ao excluir equipe");
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
            const freshUrl = dataService.getPublicImageUrl(path, filename, { width: 400, height: 400, resize: 'cover', cacheBust: Date.now() });
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
              resize: 'contain',
              cacheBust: Date.now()
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

    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            currentUser={currentUser}
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
          />
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
              }
            }}
          />
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
      case 'user-form':
        return selectedCompany ? (
          <UserForm
            companyId={selectedCompany.id}
            onSave={() => setCurrentScreen('company-details')}
            onCancel={() => setCurrentScreen('company-details')}
          />
        ) : null;
      case 'all-users':
        return <AllUsersList
          onSelectUser={async (user) => {
            setSelectedUser(user);
            localStorage.setItem('last_screen_before_profile', 'all-users');
            setCurrentScreen('user-details');
          }}
          currentUser={currentUser}
        />;
      case 'user-details':
        return selectedUser ? (
          <UserViewScreen
            user={selectedUser}
            onBack={() => {
              setCurrentScreen('all-users');
              setSelectedUser(null);
            }}
            onEdit={(user) => {
              setSelectedUser(user);
              setCurrentScreen('profile');
            }}
          />
        ) : null;
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
      case 'settings':
        if (!currentUser?.isAdminSuper) {
          setCurrentScreen('companies');
          setActiveTab('companies');
          return <CompaniesList onSelect={handleCompanySelect} onAdd={handleAddClick} />;
        }
        return <AppSettings onNavigate={(screen) => setCurrentScreen(screen as any)} />;
      case 'ai-admin':
        return <AIKnowledgeAdmin onBack={() => setCurrentScreen('settings')} />;
      case 'systems':
        return <SystemsList onAdd={() => setCurrentScreen('system-form')} onSelect={handleSystemSelect} />;
      case 'system-form':
        return <SystemForm onSave={handleSaveSystem} onCancel={() => setCurrentScreen('systems')} />;
      case 'system-edit':
        return selectedSystem ? <SystemForm initialSystem={selectedSystem} onSave={handleSaveSystem} onCancel={() => setCurrentScreen('systems')} /> : null;
      case 'unit-types':
        return <UnitTypesList onAdd={() => setCurrentScreen('unit-type-form')} onSelect={handleUnitTypeSelect} />;
      case 'unit-type-form':
        return <UnitTypeForm onSave={handleSaveUnitType} onCancel={() => setCurrentScreen('unit-types')} />;
      case 'unit-type-edit':
        return selectedUnitType ? <UnitTypeForm initialUnitType={selectedUnitType} onSave={handleSaveUnitType} onCancel={() => setCurrentScreen('unit-types')} /> : null;
      case 'clients':
        return <ClientsList onSelect={handleClientSelect} onAdd={handleAddClick} />;
      case 'client-details':
        return selectedClient ? (
          <ClientDetails
            client={selectedClient}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onViewUnits={() => setCurrentScreen('client-units')}
          />
        ) : null;
      case 'client-form':
        return (
          <ClientForm
            onSave={handleSaveClient}
            onCancel={() => setCurrentScreen('clients')}
          />
        );
      case 'client-edit':
        return selectedClient ? (
          <ClientForm
            initialClient={selectedClient}
            onSave={handleSaveClient}
            onCancel={handleBack}
          />
        ) : null;
      case 'client-units':
        return selectedClient ? <UnitsList key={`units-${unitsListRefreshKey}`} client={selectedClient} onAdd={() => setCurrentScreen('client-unit-form')} onSelect={handleUnitSelect} /> : null;
      case 'client-unit-form':
      case 'client-unit-edit':
        const effectiveClientId = selectedClient?.id || selectedUnit?.clientId;
        if (!effectiveClientId && currentScreen === 'client-unit-form') return null;

        return (
          <UnitForm
            key={`unit-form-${currentScreen === 'client-unit-edit' ? selectedUnit?.id || 'new' : 'new'}`}
            clientId={effectiveClientId || ''}
            initialUnit={currentScreen === 'client-unit-form' ? undefined : selectedUnit || undefined}
            onSave={handleSaveUnit}
            onCancel={handleBack}
          />
        );
      case 'unit-details':
        return selectedUnit ? (
          <UnitDetails
            key={`unit-${selectedUnit.id}-${unitsListRefreshKey}`}
            unit={selectedUnit}
            onBack={handleBack}
            onEdit={() => setCurrentScreen('client-unit-edit')}
            onNewOrder={() => console.log('New Order')}
            onSelectAsset={handleAssetSelect}
            onManageAvailability={(assetTag) => {
              setSelectedUnitAssetTag(assetTag);
              setCurrentScreen('unit-asset-tag-details');
            }}
            onInformAvailability={(assetTag) => {
              setSelectedUnitAssetTag(assetTag);
              setCurrentScreen('unit-asset-tag-available');
            }}
          />
        ) : null;
      case 'unit-asset-tag-available':
        return selectedUnit && selectedUnitAssetTag ? (
          <UnitAssetTagAvailableForm
            unitId={selectedUnit.id}
            assetTagId={selectedUnitAssetTag.id}
            onBack={() => setCurrentScreen('unit-details')}
            onSave={() => {
              setUnitsListRefreshKey(prev => prev + 1);
              setCurrentScreen('unit-details');
            }}
          />
        ) : null;
      case 'unit-asset-tag-details':
        return selectedUnit && selectedUnitAssetTag ? (
          <UnitAssetTagAvailableDetails
            unitId={selectedUnit.id}
            assetTagId={selectedUnitAssetTag.id}
            onBack={() => setCurrentScreen('unit-details')}
            onNewEntry={() => setCurrentScreen('unit-asset-tag-available')}
          />
        ) : null;
      case 'activities':
        return <ActivitiesList onAdd={() => setCurrentScreen('activity-form')} onSelect={handleActivitySelect} />;
      case 'services':
        return <ServicesList onAdd={() => setCurrentScreen('service-form')} onSelect={handleServiceSelect} />;
      case 'service-form':
        return <ServiceForm onSave={handleSaveService} onCancel={handleBack} />;
      case 'service-edit':
        return selectedService ? <ServiceForm initialService={selectedService} onSave={handleSaveService} onCancel={handleBack} /> : null;
      case 'materials-search':
        return <MaterialsSearch currentUser={currentUser!} onSelectMaterial={handleMaterialSelect} onAdd={() => setCurrentScreen('material-form')} onDashboard={() => setCurrentScreen('materials-dashboard')} />;
      case 'materials':
        return <MaterialsList onAdd={() => setCurrentScreen('material-form')} onSelect={handleMaterialSelect} onDashboard={() => setCurrentScreen('materials-dashboard')} />;
      case 'material-form':
        return <MaterialForm onSave={handleSaveMaterial} onCancel={handleBack} />;
      case 'material-edit':
        return selectedMaterial ? <MaterialForm initialMaterial={selectedMaterial} onSave={handleSaveMaterial} onCancel={handleBack} /> : null;
      case 'material-details':
        return selectedMaterial ? <MaterialDetails material={selectedMaterial} onEdit={() => setCurrentScreen('material-edit')} onUpdate={(updated) => setSelectedMaterial(updated)} defaultTab={materialDefaultTab} /> : null;
      case 'materials-dashboard':
        return <MaterialsDashboard onBack={handleBack} onSelectMaterial={handleMaterialSelect} />;
      case 'activity-form':
        return <ActivityForm onSave={handleSaveActivity} onCancel={handleBack} />;
      case 'activity-edit':
        return selectedActivity ? <ActivityForm initialActivity={selectedActivity} onSave={handleSaveActivity} onCancel={handleBack} /> : null;
      case 'priorities':
        return <PrioritiesList onAdd={() => setCurrentScreen('priority-form')} onSelect={handlePrioritySelect} />;
      case 'priority-form':
        return <PriorityForm onSave={handleSavePriority} onCancel={handleBack} />;
      case 'priority-edit':
        return selectedPriority ? <PriorityForm initialPriority={selectedPriority} onSave={handleSavePriority} onCancel={handleBack} /> : null;
      case 'order-types':
        return <OrderTypesList onAdd={() => setCurrentScreen('order-type-form')} onSelect={handleOrderTypeSelect} />;
      case 'order-type-form':
        return <OrderTypeForm onSave={handleSaveOrderType} onCancel={handleBack} />;
      case 'order-type-edit':
        return selectedOrderType ? <OrderTypeForm initialOrderType={selectedOrderType} onSave={handleSaveOrderType} onCancel={handleBack} /> : null;
      case 'order-sub-types':
        return <OrderSubTypesList onAdd={() => setCurrentScreen('order-sub-type-form')} onSelect={handleOrderSubTypeSelect} />;
      case 'order-sub-type-form':
        return <OrderSubTypeForm onSave={handleSaveOrderSubType} onCancel={handleBack} />;
      case 'order-sub-type-edit':
        return selectedOrderSubType ? <OrderSubTypeForm initialOrderSubType={selectedOrderSubType} onSave={handleSaveOrderSubType} onCancel={handleBack} /> : null;
      case 'order-plans':
        return <OrderPlansList onAdd={() => setCurrentScreen('order-plan-form')} onSelect={handleOrderPlanSelect} />;
      case 'order-plan-form':
        return <OrderPlanForm onSave={handleSaveOrderPlan} onCancel={handleBack} />;
      case 'order-plan-edit':
        return selectedOrderPlan ? <OrderPlanForm initialOrderPlan={selectedOrderPlan} onSave={handleSaveOrderPlan} onCancel={handleBack} /> : null;
      case 'order-objects':
        return <OrderObjectsList onAdd={() => setCurrentScreen('order-object-form')} onSelect={handleOrderObjectSelect} />;
      case 'order-object-form':
        return <OrderObjectForm onSave={handleSaveOrderObject} onCancel={handleBack} />;
      case 'order-object-edit':
        return selectedOrderObject ? <OrderObjectForm initialOrderObject={selectedOrderObject} onSave={handleSaveOrderObject} onCancel={handleBack} /> : null;
      case 'asset-types':
        return <AssetTypesList onAdd={() => setCurrentScreen('asset-type-form')} onSelect={handleAssetTypeSelect} />;
      case 'asset-type-form':
        return <AssetTypeForm onSave={handleSaveAssetType} onCancel={handleBack} />;
      case 'asset-type-edit':
        return selectedAssetType ? <AssetTypeForm initialAssetType={selectedAssetType} onSave={handleSaveAssetType} onCancel={handleBack} /> : null;
      case 'asset-statuses':
        return <AssetStatusesList onAdd={() => setCurrentScreen('asset-status-form')} onSelect={handleAssetStatusSelect} />;
      case 'asset-status-form':
        return <AssetStatusForm onSave={handleSaveAssetStatus} onCancel={handleBack} />;
      case 'asset-status-edit':
        return selectedAssetStatus ? <AssetStatusForm initialAssetStatus={selectedAssetStatus} onSave={handleSaveAssetStatus} onCancel={handleBack} /> : null;
      case 'asset-priorities':
        return <AssetPrioritiesList onAdd={() => setCurrentScreen('asset-priority-form')} onSelect={handleAssetPrioritySelect} />;
      case 'asset-priority-form':
        return <AssetPriorityForm onSave={handleSaveAssetPriority} onCancel={handleBack} />;
      case 'asset-priority-edit':
        return selectedAssetPriority ? <AssetPriorityForm initialAssetPriority={selectedAssetPriority} onSave={handleSaveAssetPriority} onCancel={handleBack} /> : null;
      case 'asset-tags':
        return <AssetTagsList onAdd={() => setCurrentScreen('asset-tag-form')} onSelect={handleAssetTagSelect} />;
      case 'asset-tag-form':
        return <AssetTagForm onSave={handleSaveAssetTag} onCancel={handleBack} />;
      case 'asset-tag-edit':
        return selectedAssetTag ? <AssetTagForm initialTag={selectedAssetTag} onSave={handleSaveAssetTag} onCancel={handleBack} /> : null;
      case 'asset-tag-subs':
        return <AssetTagSubsList onAdd={() => setCurrentScreen('asset-tag-sub-form')} onSelect={handleAssetTagSubSelect} />;
      case 'asset-tag-sub-form':
        return <AssetTagSubForm onSave={handleSaveAssetTagSub} onCancel={handleBack} />;
      case 'asset-tag-sub-edit':
        return selectedAssetTagSub ? <AssetTagSubForm initialTagSub={selectedAssetTagSub} onSave={handleSaveAssetTagSub} onCancel={handleBack} /> : null;
      case 'technical-manuals':
        return <TechnicalManualsList onAdd={() => setCurrentScreen('technical-manual-form')} onSelect={handleTechnicalManualSelect} />;
      case 'technical-manual-form':
        return <TechnicalManualForm onSave={handleSaveTechnicalManual} onCancel={handleBack} />;
      case 'technical-manual-edit':
        return selectedTechnicalManual ? <TechnicalManualForm initialManual={selectedTechnicalManual} onSave={handleSaveTechnicalManual} onCancel={handleBack} /> : null;
      case 'technical-manual-details':
        return selectedTechnicalManual ? <TechnicalManualDetails manual={selectedTechnicalManual} onEdit={() => setCurrentScreen('technical-manual-edit')} onDelete={handleDeleteTechnicalManual} onSelectAsset={async (assetId) => { try { const asset = await dataService.getAssetById(assetId); if (asset) handleAssetSelect(asset); } catch (e) { console.error(e); } }} /> : null;
      case 'maintenance-plans':
      case 'maintenance-plan-form':
      case 'maintenance-plan-edit':
      case 'maintenance-plan-details':
        return <MaintenancePlansScreen currentScreen={currentScreen} onNavigate={setCurrentScreen} onBack={handleBack} currentUser={currentUser} />;
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
        }} />;
      case 'asset-details':
        return selectedAsset ? (
          <AssetDetails
            asset={selectedAsset}
            onBack={handleBack}
            onEdit={() => setCurrentScreen('asset-edit')}
            onDuplicate={() => setCurrentScreen('asset-duplicate')}
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
      case 'asset-duplicate':
        return selectedAsset ? (
          <AssetForm
            initialAsset={selectedAsset}
            isDuplicate={true}
            onSave={handleSaveAsset}
            onCancel={handleBack}
            onMaterialSelect={handleMaterialSelect}
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
            onCancelSS={async () => {
              if (selectedOrder && currentUser) {
                try {
                  await dataService.cancelServiceOrder(selectedOrder.id, currentUser.id);
                  toast.success('Solicitação cancelada com sucesso');
                  setCurrentScreen('orders-dashboard');
                } catch (e) {
                  toast.error('Erro ao cancelar solicitação');
                }
              }
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
          />
        );
      case 'order-detail':
        return selectedOrder ? (
          <OrderRequestView
            order={selectedOrder}
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
            onCancel={async () => {
              if (selectedOrder && currentUser) {
                try {
                  await dataService.cancelServiceOrder(selectedOrder.id, currentUser.id);
                  toast.success('Ordem de serviço cancelada com sucesso');
                  setCurrentScreen('orders-dashboard');
                } catch (e) {
                  toast.error('Erro ao cancelar ordem de serviço');
                }
              }
            }}
            onStartVisit={() => {
              return new Promise<void>(async (resolve, reject) => {
                if (selectedOrder && currentUser) {
                  if (!navigator.geolocation) {
                    toast.error('Geolocalização não suportada pelo seu navegador');
                    reject(new Error('Geolocation not supported'));
                    return;
                  }

                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      try {
                        toast.loading('Iniciando visita...');
                        await dataService.startOrderVisit(selectedOrder, currentUser);
                        toast.dismiss();
                        toast.success('Visita iniciada com sucesso!');

                        // Refresh user data to update isAvailable and inProgress status
                        const updatedUser = await dataService.getCurrentUser();
                        if (updatedUser) {
                          setCurrentUser(updatedUser);
                          if (updatedUser.ovIdInProgress) {
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
                        toast.error('Erro ao iniciar visita');
                        console.error(e);
                        reject(e);
                      }
                    },
                    (error) => {
                      toast.error('Para iniciar a visita, você deve habilitar o acesso à localização.');
                      reject(error);
                    }
                  );
                } else {
                  reject(new Error('Missing order or user'));
                }
              });
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
                setCurrentUser({ ...currentUser, isOvInProgress: false, ovIdInProgress: undefined });
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
            onSubmit={async (data: any) => {
              if (!selectedVisitForApproval || !currentUser) return;

              const approvePromise = async () => {
                // 1. Update order status/progress only if OS is NOT in Execução (statusId=5)
                if (selectedOrder?.id && selectedOrder?.statusId !== 5) {
                  await dataService.updateOrder(selectedOrder.id, {
                    statusId: parseInt(data.statusId),
                    statusAt: selectedVisitForApproval.ovEndedAt,
                    progress: data.progress,
                    causeReasonId: data.causeReasonId ? parseInt(data.causeReasonId) : undefined
                  });
                }

                // 2. Mark visit as approved (5) and update it with the new status/progress
                await dataService.updateOrderVisitProcessing(selectedVisitForApproval.id, 5, currentUser.id, {
                  statusId: parseInt(data.statusId),
                  progress: data.progress,
                  suspendedReasonId: data.suspendedReasonId ? parseInt(data.suspendedReasonId) : null
                });

                // 3. Recarregar a OS para refletir o status atual (inclusive mudanças
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

      case 'order-visit-asset-report':
        return selectedOrderVisitAssetId ? (
          <OrderVisitAssetReport
            assetId={selectedOrderVisitAssetId}
            initialAsset={selectedOrderVisitAsset || undefined}
            initialVisit={selectedVisitForAssetReport || undefined}
            onBack={() => setCurrentScreen(assetReportBackScreen)}
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
            onBack={() => setCurrentScreen('order-visit-asset-report')}
          />
        ) : null;
      case 'order-visit-asset-materials':
        return selectedOrderVisitAssetId ? (
          <OrderVisitAssetMaterials
            ovAssetId={selectedOrderVisitAssetId}
            onBack={() => setCurrentScreen('order-visit-asset-report')}
          />
        ) : null;
      case 'users-tracker':
        return selectedCompanyForTracker ? (
          <UsersTracker
            company={selectedCompanyForTracker}
            onBack={() => setCurrentScreen('orders-dashboard')}
          />
        ) : null;
      case 'profile-permissions':
        return <ProfilePermissionsScreen currentUser={currentUser} onBack={() => setCurrentScreen('settings')} />;
      default:
        return <CompaniesList onSelect={handleCompanySelect} onAdd={handleAddClick} />;
    }
  };

  const handleTrackUsers = (company: Company) => {
    if (Capacitor.isNativePlatform()) {
      setSelectedCompanyForTracker(company);
      setCurrentScreen('users-tracker');
    } else {
      sessionStorage.setItem('tracker_company', JSON.stringify(company));
      window.open(window.location.pathname + '?screen=users-tracker', '_blank');
    }
  };

  const getTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'Meu Painel';
      case 'orders-dashboard': return '';
      case 'visits-dashboard': return '';
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
      case 'asset-duplicate': return 'Duplicar Ativo';
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
      case 'notifications': return 'Notificações';
      case 'service-request-detail': return 'Detalhes da SS';
      case 'service-request-create': return selectedOrder?.id ? 'Edição SS' : 'Nova SS';
      case 'order-create': return selectedOrder?.id ? 'Edição OS' : 'Nova OS';
      case 'order-detail': return 'Detalhes da OS';
      case 'order-visit-execute': return 'Visita';
      case 'order-visit-asset-report': return 'Relatório de Ativo';
      case 'order-visit-asset-activities': return 'Intervenções';
      case 'order-visit-asset-materials': return 'Materiais';
      case 'profile-permissions': return 'Gestão Permissões';
      case 'order-visit-approve': return 'Aprovação Visita';
      case 'maintenance-plans': return 'Planos Man Programada';
      case 'maintenance-plan-form': return 'Novo Plano';
      case 'maintenance-plan-edit': return 'Editar Plano';
      case 'maintenance-plan-details': return 'Detalhes do Plano';
      case 'unit-asset-tag-details': return 'Disponibilidade do Setor';
      case 'unit-asset-tag-available': return 'Disponibilidade';
      case 'services-history': return 'Histórico de SS';
      case 'tools': return 'Ferramentas';
      default: return 'Siges';
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
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
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 overflow-hidden">
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
            ? { bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', position: 'fixed' }
            : { top: '24px', position: 'fixed' }
          }
        />
      </PermissionsProvider>
    );
  }

  const handleUserStatusChange = async (isAvailable: boolean, ovIdInProgress: string | null) => {
    if (!currentUser) return;

    if (!isAvailable && currentUser.isOvInProgress) {
      toast.error("Você não pode ficar Indisponível enquanto possui uma visita em aberto.");
      return;
    }

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
    currentScreen === 'order-visit-approve';

  const isFullPageScreen = currentScreen === 'service-request-create' ||
    currentScreen === 'order-create' ||
    currentScreen === 'service-request-detail' ||
    currentScreen === 'order-detail' ||
    currentScreen === 'asset-details' ||
    currentScreen === 'asset-form' ||
    currentScreen === 'asset-edit' ||
    currentScreen === 'asset-duplicate' ||
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
      activeTab={activeTab}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={toggleSidebarCollapse}
      currentUser={currentUser}
    />
  );

  return (
    <>
      {showSplash && <SplashScreen />}
      <PermissionsProvider currentUser={currentUser}>
        {currentScreen === 'users-tracker' ? (
          <div className="w-full h-screen overflow-hidden relative">
            <React.Suspense fallback={
              <div className="flex h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
                <Loading size="md" />
              </div>
            }>
              {renderContent()}
            </React.Suspense>
          </div>
        ) : (
        <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden ${showSplash ? 'hidden' : ''}`}>
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
                  {renderContent()}
                </React.Suspense>
              </div>
            </div>
          ) : (
            <Layout
              title={getTitle()}
              showBackButton={
                (currentScreen as string) !== 'dashboard' &&
                (currentScreen as string) !== 'orders-dashboard' &&
                (currentScreen as string) !== 'visits-dashboard' &&
                (currentScreen as string) !== 'dashboard-units-power-electric' &&
                (currentScreen as string) !== 'dashboard-units-assets-tags' &&
                (currentScreen as string) !== 'dashboard-orders-admin-calendar' &&
                (currentScreen as string) !== 'services-history' &&
                (currentScreen as string) !== 'companies' &&
                (currentScreen as string) !== 'units-search' &&
                (currentScreen as string) !== 'assets-search' &&
                (currentScreen as string) !== 'technical-manuals' &&
                (currentScreen as string) !== 'settings' &&
                (currentScreen as string) !== 'profile-permissions' &&
                (currentScreen as string) !== 'notifications' &&
                (currentScreen as string) !== 'tools' &&
                (currentScreen as string) !== 'materials-search' &&
                (currentScreen as string) !== 'materials-dashboard' &&
                (currentScreen as string) !== 'material-form' &&
                (currentScreen as string) !== 'material-edit'
              }
              onBackClick={handleBack}
              currentUser={currentUser}
              showUserHeader={currentScreen !== 'settings'}
              hidePadding={hideMainNavigation}
              hideHeaderBorder={currentScreen === 'order-visit-approve'}
              hideHeader={(currentScreen as string) === 'users-tracker'}
              isDashboard={
                (currentScreen as string) === 'dashboard' ||
                (currentScreen as string) === 'orders-dashboard' ||
                (currentScreen as string) === 'visits-dashboard' ||
                (currentScreen as string) === 'dashboard-units-power-electric' ||
                (currentScreen as string) === 'dashboard-units-assets-tags' ||
                (currentScreen as string) === 'users-tracker' ||
                (currentScreen as string) === 'services-history'
              }
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
              titleRightElement={
                (currentScreen as string) === 'assets-search'
                  ? <AssetsAlertsHeaderWidget onNavigate={(screen) => setCurrentScreen(screen as any)} />
                  : undefined
              }
            >
              <React.Suspense fallback={
                <div className="flex h-full items-center justify-center p-8">
                  <Loading size="md" />
                </div>
              }>
                {renderContent()}
              </React.Suspense>
            </Layout>
          )}


          {!hideMainNavigation && !isKeyboardVisible && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
              <BottomNav
                activeTab={activeTab}
                isAdminSuper={currentUser?.isAdminSuper}
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

          <Toaster
            position={Capacitor.isNativePlatform() ? 'bottom-center' : 'top-right'}
            richColors
            closeButton
            style={Capacitor.isNativePlatform()
              ? { bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', position: 'fixed' }
              : { top: '96px', position: 'fixed' }
            }
          />
          <UpdateNotifier />
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
                  const { apiN8nService } = await import('./services/apiN8nService');
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
                const { supabase } = await import('./services/supabase');
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
              window.location.reload();
            }}
            className="fixed bottom-6 right-6 z-[99999] w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors active:scale-95"
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
