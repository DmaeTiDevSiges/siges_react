/**
 * Telas lazy do SIGES (extraído de App.tsx).
 *
 * Cada tela é carregada sob demanda com retry automático em falha de chunk
 * (lazyWithRetry). O mapa screen → elemento continua no App.tsx.
 */
import React from 'react';

export function isChunkLoadError(err: unknown): boolean {
  const msg =
    (err instanceof Error ? `${err.name}: ${err.message}` : String(err)) +
    ((err as { stack?: string })?.stack || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('ChunkLoadError')
  );
}

function forceCleanReloadOnce(): boolean {
  // A new deploy deletes old hashed chunks (e.g. OrdersRequestsDashboardAdmin-<old>.js).
  // A client holding a stale index.html/SW cache retries the SAME dead URL forever,
  // so retrying import() is useless — reload once (guarded) to fetch the new index.html.
  try {
    const key = 'siges-chunk-reload';
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode) — still reload, ErrorBoundary guards loops.
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
  return true;
}

function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>, retries = 2) {
  return React.lazy(() => {
    return new Promise<{ default: React.ComponentType<any> }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((mod) => {
            try {
              sessionStorage.removeItem('siges-chunk-reload');
            } catch {}
            resolve(mod);
          })
          .catch((err) => {
            if (isChunkLoadError(err)) {
              // Stale hashed chunk (new deploy) or Cloudflare challenge HTML served
              // as JS: retrying the URL won't help — do one clean reload.
              if (forceCleanReloadOnce()) return;
              reject(err);
              return;
            }
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), 1000);
            } else {
              reject(err);
            }
          });
      };
      attempt(retries);
    });
  });
}


// Lazy Loaded Views (Fase 1 de Otimização de Performance)
export const CompaniesList = lazyWithRetry(() => import('../views/Settings/Companies/CompaniesList').then(m => ({ default: m.CompaniesList })));
export const CompanyDetails = lazyWithRetry(() => import('../views/Settings/Companies/CompanyDetails').then(m => ({ default: m.CompanyDetails })));
export const CompanyForm = lazyWithRetry(() => import('../views/Settings/Companies/CompanyForm').then(m => ({ default: m.CompanyForm })));
export const DepartmentForm = lazyWithRetry(() => import('../views/Departments/DepartmentForm').then(m => ({ default: m.DepartmentForm })));
export const DepartmentDetails = lazyWithRetry(() => import('../views/Departments/DepartmentDetails').then(m => ({ default: m.DepartmentDetails })));
export const TeamForm = lazyWithRetry(() => import('../views/Teams/TeamForm').then(m => ({ default: m.TeamForm })));
export const TeamDetails = lazyWithRetry(() => import('../views/Teams/TeamDetails').then(m => ({ default: m.TeamDetails })));
export const ClientsList = lazyWithRetry(() => import('../views/Settings/Clients/ClientsList').then(m => ({ default: m.ClientsList })));
export const ClientDetails = lazyWithRetry(() => import('../views/Settings/Clients/ClientDetails').then(m => ({ default: m.ClientDetails })));
export const ClientForm = lazyWithRetry(() => import('../views/Settings/Clients/ClientForm').then(m => ({ default: m.ClientForm })));
export const UserForm = lazyWithRetry(() => import('../views/Users/UserForm').then(m => ({ default: m.UserForm })));
export const ProfileScreen = lazyWithRetry(() => import('../views/Users/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
export const ForgotPasswordScreen = lazyWithRetry(() => import('../views/Users/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
export const ResetPasswordScreen = lazyWithRetry(() => import('../views/Users/ResetPasswordScreen').then(m => ({ default: m.ResetPasswordScreen })));
export const DashboardScreen = lazyWithRetry(() => import('../views/Dashboards/DashboardOrdersUserScreen').then(m => ({ default: m.DashboardScreen })));
export const OrdersVisitsDashboardAdmin = lazyWithRetry(() => import('../views/Dashboards/OrdersVisitsDashboardAdmin').then(m => ({ default: m.OrdersVisitsDashboardAdmin })));
export const DashboardOrdersVisitsTodayScreen = lazyWithRetry(() => import('../views/Dashboards/DashboardOrdersVisitsTodayScreen').then(m => ({ default: m.DashboardOrdersVisitsTodayScreen })));
export const DashboardUnitsPowerElectric = lazyWithRetry(() => import('../views/Dashboards/DashboardUnitsPowerElectric').then(m => ({ default: m.DashboardUnitsPowerElectric })));
export const DashboardUnitsAssetsTags = lazyWithRetry(() => import('../views/Dashboards/DashboardUnitsAssetsTags').then(m => ({ default: m.DashboardUnitsAssetsTags })));
export const DashboardOrdersAdminCalendarScreen = lazyWithRetry(() => import('../views/Dashboards/DashboardOrdersAdminCalendarScreen').then(m => ({ default: m.DashboardOrdersAdminCalendarScreen })));
export const DashboardServicesAdminScreen = lazyWithRetry(() => import('../views/Dashboards/DashboardServicesAdminScreen').then(m => ({ default: m.DashboardServicesAdminScreen })));
export const DashboardAdminContractsEvaluationsRequirements = lazyWithRetry(() => import('../views/Dashboards/DashboardAdminContractsEvaluationsRequirements').then(m => ({ default: m.DashboardAdminContractsEvaluationsRequirements })));
export const LeaderRankingDashboard = lazyWithRetry(() => import('../views/Dashboards/LeaderRankingDashboard').then(m => ({ default: m.LeaderRankingDashboard })));
export const ServicesRequestsDashboardAdmin = lazyWithRetry(() => import('../views/ServiceRequest/ServicesRequestsDashboardAdmin').then(m => ({ default: m.ServicesRequestsDashboardAdmin })));
export const ServicesRequestsPeriodDashboardAdmin = lazyWithRetry(() => import('../views/ServiceRequest/ServicesRequestsPeriodDashboardAdmin').then(m => ({ default: m.ServicesRequestsPeriodDashboardAdmin })));
export const SystemsList = lazyWithRetry(() => import('../views/Settings/Systems/SystemsList').then(m => ({ default: m.SystemsList })));
export const SystemForm = lazyWithRetry(() => import('../views/Settings/Systems/SystemForm').then(m => ({ default: m.SystemForm })));
export const UnitTypesList = lazyWithRetry(() => import('../views/Settings/UnitTypes/UnitTypesList').then(m => ({ default: m.UnitTypesList })));
export const UnitTypeForm = lazyWithRetry(() => import('../views/Settings/UnitTypes/UnitTypeForm').then(m => ({ default: m.UnitTypeForm })));
export const UnitsList = lazyWithRetry(() => import('../views/Settings/Clients/Units/UnitsList').then(m => ({ default: m.UnitsList })));
export const UnitForm = lazyWithRetry(() => import('../views/Settings/Clients/Units/UnitForm').then(m => ({ default: m.UnitForm })));
export const UnitDetails = lazyWithRetry(() => import('../views/Settings/Clients/Units/UnitView').then(m => ({ default: m.UnitDetails })));
export const UnitStructure = lazyWithRetry(() => import('../views/Settings/Clients/Units/UnitStructure').then(m => ({ default: m.UnitStructure })));
export const ActivitiesList = lazyWithRetry(() => import('../views/Settings/Activities/ActivitiesList').then(m => ({ default: m.ActivitiesList })));
export const ActivityForm = lazyWithRetry(() => import('../views/Settings/Activities/ActivityForm').then(m => ({ default: m.ActivityForm })));
export const ContractsList = lazyWithRetry(() => import('../views/Contracts/ContractsList').then(m => ({ default: m.ContractsList })));
export const ContractForm = lazyWithRetry(() => import('../views/Contracts/ContractForm').then(m => ({ default: m.ContractForm })));
export const ContractDetails = lazyWithRetry(() => import('../views/Contracts/ContractDetails').then(m => ({ default: m.ContractDetails })));
export const ServicesList = lazyWithRetry(() => import('../views/Settings/Services/ServicesList').then(m => ({ default: m.ServicesList })));
export const ServiceForm = lazyWithRetry(() => import('../views/Settings/Services/ServiceForm').then(m => ({ default: m.ServiceForm })));
export const MaterialsList = lazyWithRetry(() => import('../views/Settings/Materials/MaterialsList').then(m => ({ default: m.MaterialsList })));
export const MaterialsSearch = lazyWithRetry(() => import('../views/Settings/Materials/MaterialsSearch').then(m => ({ default: m.MaterialsSearch })));
export const MaterialForm = lazyWithRetry(() => import('../views/Settings/Materials/MaterialForm').then(m => ({ default: m.MaterialForm })));
export const MaterialDetails = lazyWithRetry(() => import('../views/Settings/Materials/MaterialDetails').then(m => ({ default: m.MaterialDetails })));
export const MaterialsDashboard = lazyWithRetry(() => import('../views/Settings/Materials/MaterialsDashboard').then(m => ({ default: m.MaterialsDashboard })));
export const EvaluationRequirementsScreen = lazyWithRetry(() => import('../views/Settings/Evaluations/EvaluationRequirementsScreen').then(m => ({ default: m.EvaluationRequirementsScreen })));
export const PrioritiesList = lazyWithRetry(() => import('../views/Settings/Orders/Priorities/OrderPrioritiesList').then(m => ({ default: m.PrioritiesList })));
export const PriorityForm = lazyWithRetry(() => import('../views/Settings/Orders/Priorities/OrderPriorityForm').then(m => ({ default: m.PriorityForm })));
export const OrderTypesList = lazyWithRetry(() => import('../views/Settings/Orders/OrderTypes/OrderTypesList').then(m => ({ default: m.OrderTypesList })));
export const OrderTypeForm = lazyWithRetry(() => import('../views/Settings/Orders/OrderTypes/OrderTypeForm').then(m => ({ default: m.OrderTypeForm })));
export const OrderSubTypesList = lazyWithRetry(() => import('../views/Settings/Orders/OrderSubTypes/OrderSubTypesList').then(m => ({ default: m.OrderSubTypesList })));
export const OrderSubTypeForm = lazyWithRetry(() => import('../views/Settings/Orders/OrderSubTypes/OrderSubTypeForm').then(m => ({ default: m.OrderSubTypeForm })));
export const OrderPlansList = lazyWithRetry(() => import('../views/Settings/Orders/Plans/OrderPlansList').then(m => ({ default: m.OrderPlansList })));
export const OrderPlanForm = lazyWithRetry(() => import('../views/Settings/Orders/Plans/OrderPlanForm').then(m => ({ default: m.OrderPlanForm })));
export const OrderObjectsList = lazyWithRetry(() => import('../views/Settings/Orders/OrderObjects/OrderObjectsList').then(m => ({ default: m.OrderObjectsList })));
export const OrderObjectForm = lazyWithRetry(() => import('../views/Settings/Orders/OrderObjects/OrderObjectForm').then(m => ({ default: m.OrderObjectForm })));
export const AssetTypesList = lazyWithRetry(() => import('../views/Settings/Assets/AssetTypes/AssetTypesList').then(m => ({ default: m.AssetTypesList })));
export const AssetTypeForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetTypes/AssetTypeForm').then(m => ({ default: m.AssetTypeForm })));
export const AssetStatusesList = lazyWithRetry(() => import('../views/Settings/Assets/AssetStatuses/AssetStatusesList').then(m => ({ default: m.AssetStatusesList })));
export const AssetStatusForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetStatuses/AssetStatusForm').then(m => ({ default: m.AssetStatusForm })));
export const AssetPrioritiesList = lazyWithRetry(() => import('../views/Settings/Assets/AssetPriorities/AssetPrioritiesList').then(m => ({ default: m.AssetPrioritiesList })));
export const AssetPriorityForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetPriorities/AssetPriorityForm').then(m => ({ default: m.AssetPriorityForm })));
export const AssetTypeAttributesScreen = lazyWithRetry(() => import('../views/Settings/Assets/AssetTypeAttributes/AssetTypeAttributesScreen').then(m => ({ default: m.AssetTypeAttributesScreen })));
export const AssetAttributesBrandsScreen = lazyWithRetry(() => import('../views/Settings/Assets/AssetTypeAttributes/AssetAttributesBrandsScreen').then(m => ({ default: m.AssetAttributesBrandsScreen })));
export const AssetTagsList = lazyWithRetry(() => import('../views/Settings/Assets/AssetTags/AssetTagsList').then(m => ({ default: m.AssetTagsList })));
export const AssetTagForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetTags/AssetTagForm').then(m => ({ default: m.AssetTagForm })));
export const AssetTagSubsList = lazyWithRetry(() => import('../views/Settings/Assets/AssetTagSubs/AssetTagSubsList').then(m => ({ default: m.AssetTagSubsList })));
export const AssetTagSubForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetTagSubs/AssetTagSubForm').then(m => ({ default: m.AssetTagSubForm })));
export const TechnicalManualsList = lazyWithRetry(() => import('../views/Settings/Assets/TechnicalManuals/TechnicalManualsList').then(m => ({ default: m.TechnicalManualsList })));
export const TechnicalManualForm = lazyWithRetry(() => import('../views/Settings/Assets/TechnicalManuals/TechnicalManualForm').then(m => ({ default: m.TechnicalManualForm })));
export const TechnicalManualDetails = lazyWithRetry(() => import('../views/Settings/Assets/TechnicalManuals/TechnicalManualDetails').then(m => ({ default: m.TechnicalManualDetails })));
export const AssetLoanChecklistTypesList = lazyWithRetry(() => import('../views/Settings/Assets/AssetLoanChecklists/AssetLoanChecklistTypesList').then(m => ({ default: m.AssetLoanChecklistTypesList })));
export const AssetLoanChecklistTypeForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetLoanChecklists/AssetLoanChecklistTypeForm').then(m => ({ default: m.AssetLoanChecklistTypeForm })));
export const LoansChecklistsList = lazyWithRetry(() => import('../views/Settings/Assets/AssetLoanChecklists/LoansChecklistsList').then(m => ({ default: m.LoansChecklistsList })));
export const LoansChecklistForm = lazyWithRetry(() => import('../views/Settings/Assets/AssetLoanChecklists/LoansChecklistForm').then(m => ({ default: m.LoansChecklistForm })));
export const UnitsSearch = lazyWithRetry(() => import('../views/Units/UnitsSearch').then(m => ({ default: m.UnitsSearch })));
export const UnitAssetTagAvailableForm = lazyWithRetry(() => import('../views/Units/UnitAssetTagAvailableForm').then(m => ({ default: m.UnitAssetTagAvailableForm })));
export const UnitAssetTagAvailableDetails = lazyWithRetry(() => import('../views/Units/UnitAssetTagAvailableDetails').then(m => ({ default: m.UnitAssetTagAvailableDetails })));
export const AssetsSearch = lazyWithRetry(() => import('../views/Assets/AssetsSearch').then(m => ({ default: m.AssetsSearch })));
export const AssetDetails = lazyWithRetry(() => import('../views/Assets/AssetView').then(m => ({ default: m.AssetDetails })));
export const AssetForm = lazyWithRetry(() => import('../views/Assets/AssetForm').then(m => ({ default: m.AssetForm })));
export const AssetCloneWizard = lazyWithRetry(() => import('../views/Assets/AssetCloneWizard').then(m => ({ default: m.AssetCloneWizard })));
export const AssetsAlerts = lazyWithRetry(() => import('../views/Assets/AssetsAlerts').then(m => ({ default: m.AssetsAlerts })));
export const AssetsAlertsHeaderWidget = lazyWithRetry(() => import('../components/assets/AssetsAlertsHeaderWidget').then(m => ({ default: m.AssetsAlertsHeaderWidget })));
export const OrdersRequestsDashboardAdmin = lazyWithRetry(() => import('../views/OrderRequest/OrdersRequestsDashboardAdmin').then(m => ({ default: m.OrdersRequestsDashboardAdmin })));
export const OrdersRequestsPeriodDashboardAdmin = lazyWithRetry(() => import('../views/OrderRequest/OrdersRequestsPeriodDashboardAdmin').then(m => ({ default: m.OrdersRequestsPeriodDashboardAdmin })));
export const NotificationsList = lazyWithRetry(() => import('../views/Notifications/NotificationsList').then(m => ({ default: m.NotificationsList })));
export const AppNoticesList = lazyWithRetry(() => import('../views/AppNotices/AppNoticesList').then(m => ({ default: m.AppNoticesList })));
export const ExtraWorkersList = lazyWithRetry(() => import('../views/AppNotices/ExtraWorkersList').then(m => ({ default: m.ExtraWorkersList })));
export const AppTipsList = lazyWithRetry(() => import('../views/Settings/AppTips/AppTipsList').then(m => ({ default: m.AppTipsList })));
export const ServiceRequestDetail = lazyWithRetry(() => import('../views/ServiceRequest/ServiceRequestDetail').then(m => ({ default: m.ServiceRequestDetail })));
export const ServiceRequestPage = lazyWithRetry(() => import('../views/ServiceRequest/ServiceRequestScreen').then(m => ({ default: m.ServiceRequestPage })));
export const OrderRequestPage = lazyWithRetry(() => import('../views/OrderRequest/OrderRequestScreen').then(m => ({ default: m.OrderRequestPage })));
export const OrderRequestApproveConfirm = lazyWithRetry(() => import('../views/OrderRequest/OrderRequestApproveConfirm').then(m => ({ default: m.OrderRequestApproveConfirm })));
export const OrderRequestView = lazyWithRetry(() => import('../views/OrderRequest/OrderRequestView').then(m => ({ default: m.OrderRequestView })));
export const OrderVisitPage = lazyWithRetry(() => import('../views/OrderVisit/OrderVisitScreen').then(m => ({ default: m.OrderVisitPage })));
export const OrderVisitAssetReport = lazyWithRetry(() => import('../views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport').then(m => ({ default: m.OrderVisitAssetReport })));
export const OrderVisitAssetActivities = lazyWithRetry(() => import('../views/OrderVisit/OrderVisitAsset/OrderVisitAssetActivities').then(m => ({ default: m.OrderVisitAssetActivities })));
export const OrderVisitAssetMaterials = lazyWithRetry(() => import('../views/OrderVisit/OrderVisitAsset/OrderVisitAssetMaterials').then(m => ({ default: m.OrderVisitAssetMaterials })));
export const OrderVisitBottomNav = lazyWithRetry(() => import('../components/ordersVisits/OrderVisitBottomNav').then(m => ({ default: m.OrderVisitBottomNav })));
export const VisitEvaluationPage = lazyWithRetry(() => import('../views/Visits/VisitEvaluationPage').then(m => ({ default: m.VisitEvaluationPage })));

export const UsersTracker = lazyWithRetry(() => import('../views/Users/UsersTracker').then(m => ({ default: m.UsersTracker })));
export const AllUsersList = lazyWithRetry(() => import('../views/Settings/Users/AllUsersList').then(m => ({ default: m.AllUsersList })));
export const UserViewScreen = lazyWithRetry(() => import('../views/Settings/Users/UserViewScreen').then(m => ({ default: m.UserViewScreen })));
export const LocationBlockedScreen = lazyWithRetry(() => import('../views/System/LocationBlockedScreen').then(m => ({ default: m.LocationBlockedScreen })));
export const UserUnavailableScreen = lazyWithRetry(() => import('../views/System/UserUnavailableScreen').then(m => ({ default: m.UserUnavailableScreen })));

export const ProfilePermissionsScreen = lazyWithRetry(() => import('../views/Settings/Users/ProfilePermissionsScreen').then(m => ({ default: m.ProfilePermissionsScreen })));
export const RouteManagementScreen = lazyWithRetry(() => import('../views/Settings/Security/RouteManagement').then(m => ({ default: m.RouteManagementScreen })));
export const RouteFormScreen = lazyWithRetry(() => import('../views/Settings/Security/RouteForm').then(m => ({ default: m.RouteForm })));
export const AIKnowledgeAdmin = lazyWithRetry(() => import('../views/Settings/AI/AIKnowledgeAdmin').then(m => ({ default: m.AIKnowledgeAdmin })));
export const MaintenancePlansScreen = lazyWithRetry(() => import('../views/Settings/MaintenancePlans/MaintenancePlansScreen').then(m => ({ default: m.MaintenancePlansScreen })));
export const ToolsMainView = lazyWithRetry(() => import('../views/Tools/ToolsMainView').then(m => ({ default: m.ToolsMainView })));
