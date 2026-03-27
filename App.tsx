import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { Button } from './components/ui/Button';
import { SplashScreen } from './components/SplashScreen';
import UpdateNotifier from './components/UpdateNotifier';
import { CompaniesList } from './views/Settings/Companies/CompaniesList';
import { CompanyDetails } from './views/Settings/Companies/CompanyDetails';
import { CompanyForm } from './views/Settings/Companies/CompanyForm';
import { DepartmentForm } from './views/Departments/DepartmentForm';
import { DepartmentDetails } from './views/Departments/DepartmentDetails';
import { TeamForm } from './views/Teams/TeamForm';
import { TeamDetails } from './views/Teams/TeamDetails';
import { ClientsList } from './views/Settings/Clients/ClientsList';
import { ClientDetails } from './views/Settings/Clients/ClientDetails';
import { ClientForm } from './views/Settings/Clients/ClientForm';
import { dataService } from './services/dataService';
import { permissionService } from './services/permissionService';
import { UserForm } from './views/Users/UserForm';
import { ProfileScreen } from './views/Users/ProfileScreen';
import { Sidebar } from './components/Sidebar';
import { AppSettings } from './views/Settings/AppSettings';
import { LoginScreen } from './views/Users/LoginScreen';
import { DashboardScreen } from "./views/Dashboards/DashboardOrdersUserScreen";
import { DashboardOrdersVisitsAdminScreen } from "./views/Dashboards/DashboardOrdersVisitsAdminScreen";
import { DashboardUnitsPowerElectric } from "./views/Dashboards/DashboardUnitsPowerElectric";
import { DashboardUnitsAssetsTags } from "./views/Dashboards/DashboardUnitsAssetsTags";
import { SystemsList } from './views/Settings/Systems/SystemsList';
import { SystemForm } from './views/Settings/Systems/SystemForm';
import { UnitTypesList } from './views/Settings/UnitTypes/UnitTypesList';
import { UnitTypeForm } from './views/Settings/UnitTypes/UnitTypeForm';
import { UnitsList } from './views/Settings/Clients/Units/UnitsList';
import { UnitForm } from './views/Settings/Clients/Units/UnitForm';
import { UnitDetails } from './views/Settings/Clients/Units/UnitView';
import { ActivitiesList } from './views/Settings/Activities/ActivitiesList';
import { ActivityForm } from './views/Settings/Activities/ActivityForm';
import { ContractsList } from './views/Contracts/ContractsList';
import { ContractForm } from './views/Contracts/ContractForm';
import { ContractDetails } from './views/Contracts/ContractDetails';
import { ServicesList } from './views/Settings/Services/ServicesList';
import { ServiceForm } from './views/Settings/Services/ServiceForm';
import { PrioritiesList } from './views/Settings/Orders/Priorities/OrderPrioritiesList';
import { PriorityForm } from './views/Settings/Orders/Priorities/OrderPriorityForm';
import { OrderTypesList } from './views/Settings/Orders/OrderTypes/OrderTypesList';
import { OrderTypeForm } from './views/Settings/Orders/OrderTypes/OrderTypeForm';
import { OrderSubTypesList } from './views/Settings/Orders/OrderSubTypes/OrderSubTypesList';
import { OrderSubTypeForm } from './views/Settings/Orders/OrderSubTypes/OrderSubTypeForm';
import { OrderPlansList } from './views/Settings/Orders/Plans/OrderPlansList';
import { OrderPlanForm } from './views/Settings/Orders/Plans/OrderPlanForm';
import { OrderObjectsList } from './views/Settings/Orders/OrderObjects/OrderObjectsList';
import { OrderObjectForm } from './views/Settings/Orders/OrderObjects/OrderObjectForm';
import { AssetTypesList } from './views/Settings/Assets/AssetTypes/AssetTypesList';
import { AssetTypeForm } from './views/Settings/Assets/AssetTypes/AssetTypeForm';
import { AssetStatusesList } from './views/Settings/Assets/AssetStatuses/AssetStatusesList';
import { AssetStatusForm } from './views/Settings/Assets/AssetStatuses/AssetStatusForm';
import { AssetPrioritiesList } from './views/Settings/Assets/AssetPriorities/AssetPrioritiesList';
import { AssetPriorityForm } from './views/Settings/Assets/AssetPriorities/AssetPriorityForm';
import { AssetTagsList } from './views/Settings/Assets/AssetTags/AssetTagsList';
import { AssetTagForm } from './views/Settings/Assets/AssetTags/AssetTagForm';
import { AssetTagSubsList } from './views/Settings/Assets/AssetTagSubs/AssetTagSubsList';
import { AssetTagSubForm } from './views/Settings/Assets/AssetTagSubs/AssetTagSubForm';
import { UnitsSearch } from './views/Units/UnitsSearch';
import { UnitAssetTagAvailableForm } from './views/Units/UnitAssetTagAvailableForm';
import { UnitAssetTagAvailableDetails } from './views/Units/UnitAssetTagAvailableDetails';
import { AssetsSearch } from './views/Assets/AssetsSearch';
import { AssetDetails } from './views/Assets/AssetView';
import { AssetForm } from './views/Assets/AssetForm';
import { OrdersRequestsDashboardAdmin } from './views/OrderRequest/OrdersRequestsDashboardAdmin';
import { NotificationsList } from './views/Notifications/NotificationsList';
import { ServiceRequestDetail } from './views/ServiceRequest/ServiceRequestDetail';
import { ServiceRequestPage } from "./views/ServiceRequest/ServiceRequestScreen";
import { OrderRequestPage } from "./views/OrderRequest/OrderRequestScreen";
import { OrderRequestApproveConfirm } from "./views/OrderRequest/OrderRequestApproveConfirm";
import { OrderRequestView } from './views/OrderRequest/OrderRequestView';
import { OrderVisitPage } from "./views/OrderVisit/OrderVisitScreen";
import { OrderVisitAssetReport } from './views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport';
import { OrderVisitAssetActivities } from './views/OrderVisit/OrderVisitAsset/OrderVisitAssetActivities';
import { OrderVisitAssetMaterials } from './views/OrderVisit/OrderVisitAsset/OrderVisitAssetMaterials';
import { OrderVisitBottomNav } from './components/ordersVisits/OrderVisitBottomNav';
import { Toaster, toast } from 'sonner';
import { Company, Client, Department, Team, User, Priority, OrderType, OrderSubType, OrderPlan, OrderObject, Contract, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, Asset, UserNotification, Order } from './types';

import { UsersTracker } from './views/Users/UsersTracker';
import { AllUsersList } from './views/Admin/AllUsersList';
import { UserViewScreen } from './views/Admin/UserViewScreen';
import { useLocationTracker } from './hooks/useLocationTracker';
import { useKeyboard } from './hooks/useKeyboard';
import { LocationBlockedScreen } from './views/System/LocationBlockedScreen';

import { ProfilePermissionsScreen } from './views/Admin/ProfilePermissionsScreen';
import { AIKnowledgeAdmin } from './views/Settings/AIKnowledgeAdmin';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { MaintenancePlansScreen } from './views/Settings/MaintenancePlans/MaintenancePlansScreen';

type Screen = 'dashboard' | 'orders-dashboard' | 'visits-dashboard' | 'dashboard-units-power-electric' | 'dashboard-units-assets-tags' | 'companies' | 'company-details' | 'company-form' | 'company-edit' | 'department-form' | 'department-details' | 'department-edit' | 'team-form' | 'team-details' | 'team-edit' | 'user-details' | 'user-form' | 'all-users' | 'profile' | 'notifications' | 'contracts' | 'contract-form' | 'contract-edit' | 'contract-details' | 'units-search' | 'unit-create' | 'assets-search' | 'asset-details' | 'asset-form' | 'asset-edit' | 'asset-duplicate' | 'settings' | 'ai-admin' | 'systems' | 'system-form' | 'system-edit' | 'unit-types' | 'unit-type-form' | 'unit-type-edit' | 'clients' | 'client-details' | 'client-form' | 'client-edit' | 'client-units' | 'client-unit-form' | 'client-unit-edit' | 'unit-details' | 'unit-asset-tag-available' | 'unit-asset-tag-details' | 'activities'
 | 'activity-form' | 'activity-edit' | 'services' | 'service-form' | 'service-edit' | 'priorities' | 'priority-form' | 'priority-edit' | 'order-types' | 'order-type-form' | 'order-type-edit' | 'order-sub-types' | 'order-sub-type-form' | 'order-sub-type-edit' | 'order-plans' | 'order-plan-form' | 'order-plan-edit' | 'order-objects' | 'order-object-form' | 'order-object-edit' | 'asset-types' | 'asset-type-form' | 'asset-type-edit' | 'asset-statuses' | 'asset-status-form' | 'asset-status-edit' | 'asset-priorities' | 'asset-priority-form' | 'asset-priority-edit' | 'asset-tags' | 'asset-tag-form' | 'asset-tag-edit' | 'asset-tag-subs' | 'asset-tag-sub-form' | 'asset-tag-sub-edit' | 'service-request-detail' | 'service-request-create' | 'order-detail' | 'order-create' | 'users-tracker' | 'order-visit-execute' | 'order-visit-asset-report' | 'order-visit-asset-activities' | 'order-visit-asset-materials' | 'profile-permissions' | 'order-visit-approve' | 'maintenance-plans' | 'maintenance-plan-form' | 'maintenance-plan-edit' | 'maintenance-plan-details';

import { ActionIcon } from './components/ui/ActionIcon';
import { AIAssistantBubble } from './components/ai/AIAssistantBubble';
import { imgproxyService } from './services/imgproxyService';

const App: React.FC = () => {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [selectedCompanyForTracker, setSelectedCompanyForTracker] = useState<Company | null>(null);
  const [retryLocation, setRetryLocation] = useState(0);
  const isKeyboardVisible = useKeyboard();

  // Splash screen minimum timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);



  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'units' | 'assets' | 'contracts' | 'companies' | 'profile' | 'settings' | 'dashboard-orders-admin' | 'visits' | 'maintenance-plans' | 'profile-permissions' | 'dashboard-units-assets-tags'>(() => {
    const saved = localStorage.getItem('app_active_tab');
    if (saved === 'units-search') return 'units';
    if (saved === 'assets-search') return 'assets';
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
    }
  };
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const savedTab = localStorage.getItem('app_active_tab');
    if (savedTab === 'dashboard') return 'dashboard';
    if (savedTab === 'orders') return 'orders-dashboard';
    if (savedTab === 'units' || savedTab === 'units-search') return 'units-search';
    if (savedTab === 'assets' || savedTab === 'assets-search') return 'assets-search';
    if (savedTab === 'profile') return 'profile';
    if (savedTab === 'settings') return 'settings';
    return 'dashboard';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const showSplash = !minTimePassed || authLoading;
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'dark';
  });

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
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [selectedAssetStatus, setSelectedAssetStatus] = useState<AssetStatus | null>(null);
  const [selectedAssetPriority, setSelectedAssetPriority] = useState<AssetPriority | null>(null);
  const [selectedAssetTag, setSelectedAssetTag] = useState<AssetTag | null>(null);
  const [selectedAssetTagSub, setSelectedAssetTagSub] = useState<AssetTagSub | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [lastAssetSource, setLastAssetSource] = useState<Screen>('assets-search');
  const [selectedOrderVisitAssetId, setSelectedOrderVisitAssetId] = useState<string | null>(null);
  const [selectedOrderTypeId, setSelectedOrderTypeId] = useState<string | null>(null);
  const [selectedUnitAssetTag, setSelectedUnitAssetTag] = useState<any>(null);

  const handleManageAvailability = (item: any) => {
    setSelectedUnitAssetTag(item);
    setCurrentScreen('unit-asset-tag-details');
  };

  const handleOrderVisitAssetSelect = (assetId: string) => {
    setSelectedOrderVisitAssetId(assetId);
    setCurrentScreen('order-visit-asset-report');
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailActiveTab, setOrderDetailActiveTab] = useState<string>('SS');
  const [ssDetailActiveTab, setSsDetailActiveTab] = useState<string>('OS');
  const [visitActiveTab, setVisitActiveTab] = useState<'home' | 'transport' | 'assets' | 'services' | 'costs'>('home');

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

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
    if (path.startsWith('maintenance-plan')) tab = 'maintenance-plans';

    setActiveTab(tab);

    if (path === 'assets' || path === 'assets-search') {
      setCurrentScreen('assets-search');
    } else if (path === 'units' || path === 'units-search') {
      setCurrentScreen('units-search');
    } else if (path === 'orders') {
      setCurrentScreen('orders-dashboard');
    } else if (path === 'visits') {
      setCurrentScreen('orders-dashboard'); // Visitas now maps to orders-dashboard with activeTab='VISITAS'
    } else {
      setCurrentScreen(path as any);
    }
    localStorage.setItem('app_active_tab', tab);
  };

  const [ordersDashboardTab, setOrdersDashboardTab] = useState<'OS' | 'VISITAS'>('OS');

  const getTabNavigation = () => {
    // Only show tabs if on the Admin Dashboard or specialized Dashboards
    if (currentScreen !== 'orders-dashboard' && currentScreen !== 'visits-dashboard' && currentScreen !== 'dashboard-units-power-electric' && currentScreen !== 'dashboard-units-assets-tags') return undefined;

    return (
      <div className="flex items-center gap-4 h-full mt-1">
        <h1 className="hidden md:block text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestão</h1>
        <div className="hidden md:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <div className="flex gap-4">
          <button
            onClick={() => { setOrdersDashboardTab('OS'); setCurrentScreen('orders-dashboard'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 ${currentScreen === 'orders-dashboard' && ordersDashboardTab === 'OS' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            OS's
          </button>
          <button
            onClick={() => { setOrdersDashboardTab('VISITAS'); setCurrentScreen('visits-dashboard'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 ${(currentScreen === 'visits-dashboard' || (currentScreen === 'orders-dashboard' && ordersDashboardTab === 'VISITAS')) ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            Visitas
          </button>
          <button
            onClick={() => { setCurrentScreen('dashboard-units-assets-tags'); setActiveTab('dashboard-units-assets-tags'); }}
            className={`pb-1 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 ${currentScreen === 'dashboard-units-assets-tags' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            Unidades
          </button>
          <button
            onClick={() => setCurrentScreen('dashboard-units-power-electric')}
            className={`pb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all hover:text-slate-600 dark:hover:text-slate-200 ${currentScreen === 'dashboard-units-power-electric' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Energia
          </button>
        </div>
      </div>
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
    const loadUser = async () => {
      try {
        const user = await dataService.getCurrentUser();
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
    loadUser();

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
          dataService.getNotificationsCount(),
          dataService.getNotifications(0, 10) // Small initial set
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
      loadNotifications();
      // Se receber uma notificação de OS Autorizada, dispara um evento para atualizar o painel
      if (payload?.new?.type === 'OS Autorizada') {
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

  useEffect(() => {
    if (currentUser && currentUser.notificationsAmount !== notifications.length) {
      setCurrentUser(prev => prev ? { ...prev, notificationsAmount: notifications.length } : null);
    }
  }, [notifications.length, currentUser?.id]);

  // Background location tracker — updates users.latitude, users.longitude and users.tracker_at
  const { isLocationBlocked } = useLocationTracker(currentUser?.id, currentUser?.trackerIntervalSeconds, retryLocation);

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
    } else if (currentScreen === 'asset-details') {
      setCurrentScreen(lastAssetSource);
    } else if (currentScreen === 'asset-form' || currentScreen === 'asset-edit' || currentScreen === 'asset-duplicate') {
      setCurrentScreen('asset-details');
    } else if (currentScreen === 'order-detail') {
      if (selectedOrder?.id === currentUser?.oIdInProgress) {
        setCurrentScreen('order-visit-execute');
      } else {
        setCurrentScreen(activeTab === 'dashboard' ? 'dashboard' : 'orders-dashboard');
      }
    } else if (currentScreen === 'service-request-detail') {
      setCurrentScreen(activeTab === 'dashboard' ? 'dashboard' : 'orders-dashboard');
    } else if (currentScreen === 'order-create' || currentScreen === 'service-request-create') {
      if (selectedOrder) {
        const isOS = selectedOrder.type === 'OS' || (selectedOrder.parentId && Number(selectedOrder.parentId) > 0);
        setCurrentScreen(isOS ? 'order-detail' : 'service-request-detail');
      } else {
        setCurrentScreen('orders-dashboard');
      }
    } else if (currentScreen === 'order-visit-execute') {
      setSelectedVisit(null);
      setCurrentScreen(selectedOrder ? 'order-detail' : (['orders', 'visits', 'dashboard-orders-admin'].includes(activeTab) ? 'orders-dashboard' : 'dashboard'));
    } else if (currentScreen === 'order-visit-asset-report') {
      setCurrentScreen('order-visit-execute');
    } else if (currentScreen === 'order-visit-asset-activities' || currentScreen === 'order-visit-asset-materials') {
      setCurrentScreen('order-visit-asset-report');
    } else if (currentScreen === 'order-visit-approve') {
      setCurrentScreen('order-visit-execute');
    } else if (currentScreen === 'users-tracker') {
      setSelectedCompanyForTracker(null);
      setCurrentScreen('orders-dashboard');
    } else if (currentScreen === 'maintenance-plan-details') {
      setCurrentScreen('maintenance-plans');
    }
  };

  const handleSaveCompany = async (company: Partial<Company>) => {
    try {
      if (selectedCompany?.id && currentScreen === 'company-edit') {
        const updatedCompany = await dataService.updateCompany(selectedCompany.id, company);
        setSelectedCompany(updatedCompany);
        setCurrentScreen('company-details');
      } else {
        await dataService.createCompany(company);
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

  const handleSaveClient = async (client: Partial<Client>) => {
    try {
      if (selectedClient?.id && currentScreen === 'client-edit') {
        const updated = await dataService.updateClient(selectedClient.id, client);
        setSelectedClient(updated);
        setCurrentScreen('client-details');
      } else {
        await dataService.createClient(client);
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

  const handleSaveAsset = async (asset: Partial<Asset>, attributeValues: Record<string, string>, file?: File) => {
    try {
      let savedAsset: Asset;
      if (selectedAsset?.id && currentScreen === 'asset-edit') {
        savedAsset = await dataService.updateAsset(selectedAsset.id, asset);

        if (file) {
          const { path, filename } = await dataService.uploadAssetImage(savedAsset.id, file);
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
          const { path, filename } = await dataService.uploadAssetImage(savedAsset.id, file);
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

  const handleSaveUnit = async (unit: Partial<import('./types').Unit>, file?: File | null) => {
    try {
      console.log('💾 Saving unit:', { unit, hasFile: !!file, fileName: file?.name });

      let savedUnit: import('./types').Unit;
      const isEdit = selectedUnit?.id && currentScreen === 'client-unit-edit';

      if (isEdit) {
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
            const { path, filename } = await dataService.uploadUnitImage(clientIdToUse, savedUnit.id, file);
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
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            currentUser={currentUser}
            initialTab={dashboardInitialTab}
            onSelectOrder={handleOrderSelect}
            onResumeVisit={(visitId) => {
              setCurrentScreen('order-visit-execute');
            }}
            onSelectVisit={handleVisitSelect}
            onTabChange={(tab) => {
              setDashboardInitialTab(tab);
              localStorage.setItem('dashboardInitialTab', tab);
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
            onCreateServiceRequest={() => setCurrentScreen('service-request-create')}
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
            onCreateServiceRequest={() => setCurrentScreen('service-request-create')}
            activeTab="VISITAS"
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
        return <AllUsersList onSelectUser={async (user) => {
          setSelectedUser(user);
          localStorage.setItem('last_screen_before_profile', 'all-users');
          setCurrentScreen('user-details');
        }} />;
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
      case 'maintenance-plans':
      case 'maintenance-plan-form':
      case 'maintenance-plan-edit':
      case 'maintenance-plan-details':
        return <MaintenancePlansScreen currentScreen={currentScreen} onNavigate={setCurrentScreen} onBack={handleBack} currentUser={currentUser} />;
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
      case 'asset-details':
        return selectedAsset ? (
          <AssetDetails
            asset={selectedAsset}
            onBack={handleBack}
            onEdit={() => setCurrentScreen('asset-edit')}
            onDuplicate={() => setCurrentScreen('asset-duplicate')}
          />
        ) : null;
      case 'asset-form':
        return <AssetForm onSave={handleSaveAsset} onCancel={handleBack} />;
      case 'asset-edit':
        return selectedAsset ? (
          <AssetForm initialAsset={selectedAsset} onSave={handleSaveAsset} onCancel={handleBack} />
        ) : null;
      case 'asset-duplicate':
        return selectedAsset ? (
          <AssetForm
            initialAsset={selectedAsset}
            isDuplicate={true}
            onSave={handleSaveAsset}
            onCancel={handleBack}
          />
        ) : null;
      case 'notifications':
        return <NotificationsList notifications={notifications} onNotificationRead={handleNotificationRead} />;
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
            onCancelSS={async () => {
              if (selectedOrder) {
                try {
                  await dataService.updateOrderStatus(selectedOrder.id, 7);
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
                setCurrentScreen('order-visit-execute');
              } else {
                handleBack();
              }
            }}
            onEdit={() => {
              setCurrentScreen('order-create');
            }}
            onCancel={async () => {
              if (selectedOrder) {
                try {
                  await dataService.updateOrderStatus(selectedOrder.id, 7);
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
              if (selectedOrder) {
                setCurrentScreen('order-detail');
              } else if (['orders', 'visits', 'dashboard-orders-admin'].includes(activeTab)) {
                setCurrentScreen('orders-dashboard');
              } else {
                setDashboardInitialTab('visits');
                localStorage.setItem('dashboardInitialTab', 'visits');
                setCurrentScreen('dashboard');
              }
            }}
            onEndVisit={() => {
              setSelectedVisit(null);
              setCurrentUser({ ...currentUser, isOvInProgress: false, ovIdInProgress: undefined });
              setCurrentScreen('dashboard');
              toast.success('Visita encerrada com sucesso');
            }}
            onAssetSelect={handleOrderVisitAssetSelect}
            onApproveVisitRequest={(visit, order) => {
              setSelectedVisitForApproval(visit);
              setSelectedOrder(order);
              setCurrentScreen('order-visit-approve');
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
                // 1. Update order status/progress if changed in form
                if (selectedOrder?.id) {
                  await dataService.updateOrder(selectedOrder.id, {
                    statusId: parseInt(data.statusId),
                    statusAt: selectedVisitForApproval.ovEndedAt,
                    progress: data.progress,
                    causeReasonId: data.suspendedReasonId ? parseInt(data.suspendedReasonId) : undefined
                  });
                }

                // 2. Mark visit as approved (5) and update it with the new status/progress
                await dataService.updateOrderVisitProcessing(selectedVisitForApproval.id, 5, currentUser.id, {
                  statusId: parseInt(data.statusId),
                  progress: data.progress,
                  suspendedReasonId: data.suspendedReasonId ? parseInt(data.suspendedReasonId) : null
                });
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
            onBack={() => setCurrentScreen('order-visit-execute')}
            onManageActivities={(orderTypeId) => {
              setSelectedOrderTypeId(orderTypeId);
              setCurrentScreen('order-visit-asset-activities');
            }}
            onManageMaterials={() => {
              setCurrentScreen('order-visit-asset-materials');
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
    setSelectedCompanyForTracker(company);
    setCurrentScreen('users-tracker');
  };

  const getTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'Meu Painel';
      case 'orders-dashboard': return '';
      case 'visits-dashboard': return '';
      case 'users-tracker': return 'Rastreamento de Usuários';
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
      case 'activity-form': return 'Nova Atividade';
      case 'activity-edit': return 'Editar Atividade';
      case 'contracts': return 'Contratos';
      case 'contract-form': return 'Novo Contrato';
      case 'contract-details': return 'Contrato';
      case 'contract-edit': return 'Editar Contrato';
      case 'units-search': return 'Unidades';
      case 'assets-search': return 'Ativos';
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
      case 'notifications': return 'Notificações';
      case 'service-request-detail': return 'Detalhes da SS';
      case 'service-request-create': return 'Nova SS';
      case 'order-create': return 'Nova OS';
      case 'order-detail': return 'Detalhes da OS';
      case 'order-visit-execute': return 'Visita';
      case 'order-visit-asset-report': return 'Relatório de Ativo';
      case 'order-visit-asset-activities': return 'Intervenções';
      case 'order-visit-asset-materials': return 'Materiais';
      case 'profile-permissions': return 'Gestão Permissões';
      case 'order-visit-approve': return 'Aprovação Visita';
      case 'maintenance-plans': return 'Planos manutenção';
      case 'maintenance-plan-form': return 'Novo Plano';
      case 'maintenance-plan-edit': return 'Editar Plano';
      case 'maintenance-plan-details': return 'Detalhes do Plano';
      case 'unit-asset-tag-details': return 'Disponibilidade do Setor';
      case 'unit-asset-tag-available': return 'Disponibilidade';
      default: return 'Siges';
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => window.location.reload()} isDarkMode={theme === 'dark'} onThemeToggle={toggleTheme} />;
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
        <Toaster position="top-right" richColors closeButton style={{ top: '24px', position: 'fixed' }} />
      </PermissionsProvider>
    );
  }

  const handleUserStatusChange = async (isAvailable: boolean, ovIdInProgress: string) => {
    if (!currentUser) return;

    try {
      await dataService.updateUserAvailability(currentUser.id, isAvailable, ovIdInProgress);

      // Atualizar o estado local do usuário
      setCurrentUser({
        ...currentUser,
        isAvailable,
        ovIdInProgress
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
    currentScreen === 'client-unit-edit' ||
    currentScreen === 'maintenance-plan-details' ||
    currentScreen === 'unit-asset-tag-available';

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
      {currentUser?.isAdminSuper && <AIAssistantBubble />}
      {showSplash && <SplashScreen />}
      <PermissionsProvider currentUser={currentUser}>
        <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden ${showSplash ? 'hidden' : ''}`}>
            {currentScreen === 'profile' ? (
              <div className="flex-1 flex overflow-hidden">
                <div className="hidden md:block">
                  {sidebarContent}
                </div>
                <div className="flex-1 overflow-auto">
                  {renderContent()}
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
                  (currentScreen as string) !== 'companies' &&
                  (currentScreen as string) !== 'units-search' &&
                  (currentScreen as string) !== 'assets-search' &&
                  (currentScreen as string) !== 'settings' &&
                  (currentScreen as string) !== 'profile-permissions' &&
                  (currentScreen as string) !== 'notifications'
                }
                onBackClick={handleBack}
                currentUser={currentUser}
                showUserHeader={currentScreen !== 'settings'}
                hidePadding={hideMainNavigation}
                hideHeaderBorder={currentScreen === 'order-visit-approve'}
                isDashboard={
                  (currentScreen as string) === 'dashboard' ||
                  (currentScreen as string) === 'orders-dashboard' ||
                  (currentScreen as string) === 'visits-dashboard' ||
                  (currentScreen as string) === 'dashboard-units-power-electric' ||
                  (currentScreen as string) === 'dashboard-units-assets-tags'
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
              >
                {renderContent()}
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

            {isLocationBlocked && (
              <LocationBlockedScreen onRetry={() => setRetryLocation(prev => prev + 1)} />
            )}

            <Toaster position="top-right" richColors closeButton style={{ top: '96px', position: 'fixed' }} />
            <UpdateNotifier />
          </div>
        </PermissionsProvider>
    </>
  );
};

export default App;
