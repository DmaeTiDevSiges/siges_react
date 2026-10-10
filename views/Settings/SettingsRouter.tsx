/**
 * SettingsRouter — Sub-roteador para toda a área de Ajustes.
 *
 * Centraliza todos os `case` de settings que antes estavam espalhados
 * no switch gigante de App.tsx. O App.tsx agora delega para este componente
 * qualquer tela pertencente ao domínio de configurações.
 *
 * Estratégia: recebe um objeto `ctx` com os handlers e estados do App.tsx
 * via props, evitando prop-drilling excessivo sem introduzir um novo Context.
 */
import React from 'react';
import { AppSettings } from './AppSettings';
import {
  SystemsList, SystemForm,
  UnitTypesList, UnitTypeForm,
  ClientsList, ClientDetails, ClientForm,
  UnitsList, UnitForm, UnitDetails, UnitStructure,
  UnitAssetTagAvailableForm, UnitAssetTagAvailableDetails,
  ActivitiesList, ActivityForm,
  ServicesList, ServiceForm,
  MaterialsList, MaterialsSearch, MaterialForm, MaterialDetails, MaterialsDashboard,
  EvaluationRequirementsScreen,
  PrioritiesList, PriorityForm,
  OrderTypesList, OrderTypeForm,
  OrderSubTypesList, OrderSubTypeForm,
  OrderPlansList, OrderPlanForm,
  OrderObjectsList, OrderObjectForm,
  AssetTypesList, AssetTypeForm,
  AssetStatusesList, AssetStatusForm,
  AssetPrioritiesList, AssetPriorityForm,
  AssetTypeAttributesScreen, AssetAttributesBrandsScreen,
  AssetTagsList, AssetTagForm,
  AssetTagSubsList, AssetTagSubForm,
  TechnicalManualsList, TechnicalManualForm, TechnicalManualDetails,
  AssetLoanChecklistTypesList, AssetLoanChecklistTypeForm,
  LoansChecklistsList, LoansChecklistForm,
  AppTipsList,
  VehicleCostTypesList,
  AIKnowledgeAdmin,
  AllUsersList,
  UserViewScreen,
  ProfilePermissionsScreen,
  RouteManagementScreen, RouteFormScreen,
  MaintenancePlansScreen,
} from '../../app/routes';
import { dataService } from '../../services/dataService';
import type {
  User, Company, Client, Unit, Activity, Service, Priority, OrderType,
  OrderSubType, OrderPlan, OrderObject, AssetType, AssetStatus, AssetPriority,
  AssetTag, AssetTagSub, AssetLoanChecklistType, LoansChecklist,
} from '../../types';

// ─── Tipos auxiliares ────────────────────────────────────────────────────────

type TechnicalManual = import('../../types').TechnicalManual;
type System = import('../../types').System;
type UnitType = import('../../types').UnitType;
type Route = import('../../types').Route;
type AssetTagSub_ = import('../../types').AssetTagSub;

import { usePermissions } from '../../contexts/PermissionsContext';
import { Loading } from '../../components/ui/Loading';

/** Gate de segurança para a tela de permissões de perfil */
interface ProfilePermissionsGateProps {
  children: React.ReactNode;
  onForbidden: () => void;
}
const ProfilePermissionsGate: React.FC<ProfilePermissionsGateProps> = ({ children, onForbidden }) => {
  const { canView, loading } = usePermissions();
  const forbidden = !loading && !canView('profile_permissions');

  React.useEffect(() => {
    if (loading || canView('profile_permissions')) return;
    onForbidden();
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

// ─── Props do SettingsRouter ─────────────────────────────────────────────────

export interface SettingsRouterContext {
  currentUser: User | null;

  // Systems
  selectedSystem: System | null;
  handleSystemSelect: (s: System) => void;
  handleSaveSystem: (s: Partial<System>) => Promise<void>;

  // UnitTypes
  selectedUnitType: UnitType | null;
  handleUnitTypeSelect: (ut: UnitType) => void;
  handleSaveUnitType: (ut: Partial<UnitType>) => Promise<void>;

  // Clients
  selectedClient: Client | null;
  handleClientSelect: (c: Client) => void;
  handleSaveClient: (c: Partial<Client>, onProgress?: (p: number) => void) => Promise<void>;
  handleEditClient: () => void;
  handleDeleteClient: () => Promise<void>;
  handleAddClick: () => void;

  // Units
  selectedUnit: Unit | null;
  selectedUnitAssetTag: AssetTag | null;
  setSelectedUnitAssetTag: (tag: AssetTag) => void;
  unitsListRefreshKey: number;
  setUnitsListRefreshKey: (fn: (prev: number) => number) => void;
  handleUnitSelect: (u: Unit) => Promise<void>;
  handleSaveUnit: (u: Partial<Unit>, file?: File | null, onProgress?: (p: number) => void) => Promise<void>;

  // Activities
  selectedActivity: Activity | null;
  handleActivitySelect: (a: Activity) => void;
  handleSaveActivity: (a: Partial<Activity>) => Promise<void>;

  // Services
  selectedService: Service | null;
  handleServiceSelect: (s: Service) => void;
  handleSaveService: (s: Partial<Service>) => Promise<void>;

  // Materials
  selectedMaterial: any | null;
  setSelectedMaterial: (m: any) => void;
  materialDefaultTab: string;
  handleMaterialSelect: (m: any) => void;
  handleSaveMaterial: (m: any) => Promise<void>;

  // Priorities
  selectedPriority: Priority | null;
  handlePrioritySelect: (p: Priority) => void;
  handleSavePriority: (p: Partial<Priority>) => Promise<void>;

  // OrderTypes
  selectedOrderType: OrderType | null;
  handleOrderTypeSelect: (ot: OrderType) => void;
  handleSaveOrderType: (ot: Partial<OrderType>) => Promise<void>;

  // OrderSubTypes
  selectedOrderSubType: OrderSubType | null;
  handleOrderSubTypeSelect: (ost: OrderSubType) => void;
  handleSaveOrderSubType: (ost: Partial<OrderSubType>) => Promise<void>;

  // OrderPlans
  selectedOrderPlan: OrderPlan | null;
  handleOrderPlanSelect: (op: OrderPlan) => void;
  handleSaveOrderPlan: (op: Partial<OrderPlan>) => Promise<void>;

  // OrderObjects
  selectedOrderObject: OrderObject | null;
  handleOrderObjectSelect: (oo: OrderObject) => void;
  handleSaveOrderObject: (oo: Partial<OrderObject>) => Promise<void>;

  // AssetTypes
  selectedAssetType: AssetType | null;
  handleAssetTypeSelect: (at: AssetType) => void;
  handleSaveAssetType: (at: Partial<AssetType>) => Promise<void>;

  // AssetStatuses
  selectedAssetStatus: AssetStatus | null;
  handleAssetStatusSelect: (as_: AssetStatus) => void;
  handleSaveAssetStatus: (as_: Partial<AssetStatus>) => Promise<void>;

  // AssetPriorities
  selectedAssetPriority: AssetPriority | null;
  handleAssetPrioritySelect: (ap: AssetPriority) => void;
  handleSaveAssetPriority: (ap: Partial<AssetPriority>) => Promise<void>;

  // AssetTags
  selectedAssetTag: AssetTag | null;
  handleAssetTagSelect: (tag: AssetTag) => void;
  handleSaveAssetTag: (tag: Partial<AssetTag>) => Promise<void>;

  // AssetTagSubs
  selectedAssetTagSub: AssetTagSub_ | null;
  handleAssetTagSubSelect: (sub: AssetTagSub_) => void;
  handleSaveAssetTagSub: (sub: Partial<AssetTagSub_>) => Promise<void>;

  // TechnicalManuals
  selectedTechnicalManual: TechnicalManual | null;
  handleTechnicalManualSelect: (tm: TechnicalManual) => void;
  handleSaveTechnicalManual: (tm: Partial<TechnicalManual>) => Promise<void>;
  handleDeleteTechnicalManual: () => Promise<void>;
  handleAssetSelect: (asset: any) => void;

  // Checklists
  selectedChecklistType: AssetLoanChecklistType | null;
  setSelectedChecklistType: (item: any) => void;
  selectedLoansChecklist: LoansChecklist | null;
  setSelectedLoansChecklist: (item: any) => void;

  // Users (all-users / user-details)
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  setSelectedCompany?: (c: any) => void;

  // Routes
  selectedRoute: Route | null;
  handleRouteSelect: (r: Route) => void;
  handleSaveRoute: (r: Partial<Route>) => Promise<void>;

  // Generics
  handleBack: () => void;
}

interface SettingsRouterProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  ctx: SettingsRouterContext;
}

/** Telas que pertencem ao domínio de settings */
export const SETTINGS_SCREENS = new Set([
  'settings', 'ai-admin',
  'systems', 'system-form', 'system-edit',
  'unit-types', 'unit-type-form', 'unit-type-edit',
  'clients', 'client-details', 'client-form', 'client-edit',
  'client-units', 'client-unit-form', 'client-unit-edit',
  'unit-details', 'unit-structure', 'unit-asset-tag-available', 'unit-asset-tag-details',
  'activities', 'activity-form', 'activity-edit',
  'services', 'service-form', 'service-edit',
  'materials', 'materials-search', 'material-form', 'material-edit', 'material-details', 'materials-dashboard',
  'evaluation-requirements',
  'priorities', 'priority-form', 'priority-edit',
  'order-types', 'order-type-form', 'order-type-edit',
  'order-sub-types', 'order-sub-type-form', 'order-sub-type-edit',
  'order-plans', 'order-plan-form', 'order-plan-edit',
  'order-objects', 'order-object-form', 'order-object-edit',
  'asset-types', 'asset-type-form', 'asset-type-edit',
  'asset-statuses', 'asset-status-form', 'asset-status-edit',
  'asset-priorities', 'asset-priority-form', 'asset-priority-edit',
  'asset-type-attributes', 'asset-attributes-brands',
  'asset-tags', 'asset-tag-form', 'asset-tag-edit',
  'asset-tag-subs', 'asset-tag-sub-form', 'asset-tag-sub-edit',
  'technical-manuals', 'technical-manual-form', 'technical-manual-edit', 'technical-manual-details',
  'asset-loan-checklist-types', 'asset-loan-checklist-type-form', 'asset-loan-checklist-type-edit',
  'loans-checklists', 'loans-checklist-form', 'loans-checklist-edit',
  'app-tips',
  'vehicle-cost-types',
  'all-users', 'user-details',
  'profile-permissions',
  'route-management', 'route-form', 'route-edit',
  'maintenance-plans', 'maintenance-plan-form', 'maintenance-plan-edit', 'maintenance-plan-details',
]);

export const SettingsRouter: React.FC<SettingsRouterProps> = ({ currentScreen, onNavigate, ctx }) => {
  const nav = (screen: string) => onNavigate(screen);
  const {
    currentUser, handleBack,
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
    selectedTechnicalManual, handleTechnicalManualSelect, handleSaveTechnicalManual,
    handleDeleteTechnicalManual, handleAssetSelect,
    selectedChecklistType, setSelectedChecklistType,
    selectedLoansChecklist, setSelectedLoansChecklist,
    selectedUser, setSelectedUser, setSelectedCompany,
    selectedRoute, handleRouteSelect, handleSaveRoute,
  } = ctx;

  switch (currentScreen) {
    // ── Hub ──────────────────────────────────────────────────────────────────
    case 'settings':
      return <AppSettings currentUser={currentUser} onNavigate={nav} />;

    // ── Inteligência Artificial ───────────────────────────────────────────────
    case 'ai-admin':
      return <AIKnowledgeAdmin onBack={() => nav('settings')} />;

    // ── Sistemas ─────────────────────────────────────────────────────────────
    case 'systems':
      return <SystemsList onAdd={() => nav('system-form')} onSelect={handleSystemSelect} />;
    case 'system-form':
      return <SystemForm onSave={handleSaveSystem} onCancel={() => nav('systems')} />;
    case 'system-edit':
      return selectedSystem
        ? <SystemForm initialSystem={selectedSystem} onSave={handleSaveSystem} onCancel={() => nav('systems')} />
        : null;

    // ── Tipos de Unidade ─────────────────────────────────────────────────────
    case 'unit-types':
      return <UnitTypesList onAdd={() => nav('unit-type-form')} onSelect={handleUnitTypeSelect} />;
    case 'unit-type-form':
      return <UnitTypeForm onSave={handleSaveUnitType} onCancel={() => nav('unit-types')} />;
    case 'unit-type-edit':
      return selectedUnitType
        ? <UnitTypeForm initialUnitType={selectedUnitType} onSave={handleSaveUnitType} onCancel={() => nav('unit-types')} />
        : null;

    // ── Clientes ─────────────────────────────────────────────────────────────
    case 'clients':
      return <ClientsList onSelect={handleClientSelect} onAdd={handleAddClick} />;
    case 'client-details':
      return selectedClient
        ? <ClientDetails client={selectedClient} onEdit={handleEditClient} onDelete={handleDeleteClient} onViewUnits={() => nav('client-units')} />
        : null;
    case 'client-form':
      return <ClientForm onSave={handleSaveClient} onCancel={() => nav('clients')} />;
    case 'client-edit':
      return selectedClient
        ? <ClientForm initialClient={selectedClient} onSave={handleSaveClient} onCancel={handleBack} />
        : null;
    case 'client-units':
      return selectedClient
        ? <UnitsList key={`units-${unitsListRefreshKey}`} client={selectedClient} onAdd={() => nav('client-unit-form')} onSelect={handleUnitSelect} />
        : null;
    case 'client-unit-form':
    case 'client-unit-edit': {
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
    }
    case 'unit-details':
      return selectedUnit
        ? (
          <UnitDetails
            key={`unit-${selectedUnit.id}-${unitsListRefreshKey}`}
            unit={selectedUnit}
            onBack={handleBack}
            onEdit={() => nav('client-unit-edit')}
            onNewOrder={() => console.log('New Order')}
            onSelectAsset={handleAssetSelect}
            onManageAvailability={(assetTag) => { setSelectedUnitAssetTag(assetTag); nav('unit-asset-tag-details'); }}
            onInformAvailability={(assetTag) => { setSelectedUnitAssetTag(assetTag); nav('unit-asset-tag-available'); }}
          />
        )
        : null;
    case 'unit-structure':
      return selectedUnit
        ? (
          <UnitStructure
            key={`unit-structure-${selectedUnit.id}`}
            unit={selectedUnit}
            onBack={handleBack}
            onStructureChanged={() => setUnitsListRefreshKey(prev => prev + 1)}
          />
        )
        : null;
    case 'unit-asset-tag-available':
      return selectedUnit && selectedUnitAssetTag
        ? (
          <UnitAssetTagAvailableForm
            unitId={selectedUnit.id}
            assetTagId={selectedUnitAssetTag.id}
            onBack={() => nav('unit-details')}
            onSave={() => { setUnitsListRefreshKey(prev => prev + 1); nav('unit-details'); }}
          />
        )
        : null;
    case 'unit-asset-tag-details':
      return selectedUnit && selectedUnitAssetTag
        ? (
          <UnitAssetTagAvailableDetails
            unitId={selectedUnit.id}
            assetTagId={selectedUnitAssetTag.id}
            onBack={() => nav('unit-details')}
            onNewEntry={() => nav('unit-asset-tag-available')}
          />
        )
        : null;

    // ── Atividades ───────────────────────────────────────────────────────────
    case 'activities':
      return <ActivitiesList onAdd={() => nav('activity-form')} onSelect={handleActivitySelect} />;
    case 'activity-form':
      return <ActivityForm onSave={handleSaveActivity} onCancel={handleBack} />;
    case 'activity-edit':
      return selectedActivity
        ? <ActivityForm initialActivity={selectedActivity} onSave={handleSaveActivity} onCancel={handleBack} />
        : null;

    // ── Serviços ─────────────────────────────────────────────────────────────
    case 'services':
      return <ServicesList onAdd={() => nav('service-form')} onSelect={handleServiceSelect} />;
    case 'service-form':
      return <ServiceForm onSave={handleSaveService} onCancel={handleBack} />;
    case 'service-edit':
      return selectedService
        ? <ServiceForm initialService={selectedService} onSave={handleSaveService} onCancel={handleBack} />
        : null;

    // ── Materiais ────────────────────────────────────────────────────────────
    case 'materials-search':
      return <MaterialsSearch currentUser={currentUser!} onSelectMaterial={handleMaterialSelect} onAdd={() => nav('material-form')} onDashboard={() => nav('materials-dashboard')} />;
    case 'materials':
      return <MaterialsList onAdd={() => nav('material-form')} onSelect={handleMaterialSelect} onDashboard={() => nav('materials-dashboard')} />;
    case 'material-form':
      return <MaterialForm onSave={handleSaveMaterial} onCancel={handleBack} />;
    case 'material-edit':
      return selectedMaterial
        ? <MaterialForm initialMaterial={selectedMaterial} onSave={handleSaveMaterial} onCancel={handleBack} />
        : null;
    case 'material-details':
      return selectedMaterial
        ? <MaterialDetails material={selectedMaterial} onEdit={() => nav('material-edit')} onUpdate={(updated: any) => setSelectedMaterial(updated)} defaultTab={materialDefaultTab} />
        : null;
    case 'materials-dashboard':
      return <MaterialsDashboard onBack={handleBack} onSelectMaterial={handleMaterialSelect} />;

    // ── Avaliações ───────────────────────────────────────────────────────────
    case 'evaluation-requirements':
      return <EvaluationRequirementsScreen onBack={handleBack} />;

    // ── Prioridades de OS ─────────────────────────────────────────────────────
    case 'priorities':
      return <PrioritiesList onAdd={() => nav('priority-form')} onSelect={handlePrioritySelect} />;
    case 'priority-form':
      return <PriorityForm onSave={handleSavePriority} onCancel={handleBack} />;
    case 'priority-edit':
      return selectedPriority
        ? <PriorityForm initialPriority={selectedPriority} onSave={handleSavePriority} onCancel={handleBack} />
        : null;

    // ── Tipos de OS ───────────────────────────────────────────────────────────
    case 'order-types':
      return <OrderTypesList onAdd={() => nav('order-type-form')} onSelect={handleOrderTypeSelect} />;
    case 'order-type-form':
      return <OrderTypeForm onSave={handleSaveOrderType} onCancel={handleBack} />;
    case 'order-type-edit':
      return selectedOrderType
        ? <OrderTypeForm initialOrderType={selectedOrderType} onSave={handleSaveOrderType} onCancel={handleBack} />
        : null;

    // ── Sub-Tipos de OS ───────────────────────────────────────────────────────
    case 'order-sub-types':
      return <OrderSubTypesList onAdd={() => nav('order-sub-type-form')} onSelect={handleOrderSubTypeSelect} />;
    case 'order-sub-type-form':
      return <OrderSubTypeForm onSave={handleSaveOrderSubType} onCancel={handleBack} />;
    case 'order-sub-type-edit':
      return selectedOrderSubType
        ? <OrderSubTypeForm initialOrderSubType={selectedOrderSubType} onSave={handleSaveOrderSubType} onCancel={handleBack} />
        : null;

    // ── Planos de OS ──────────────────────────────────────────────────────────
    case 'order-plans':
      return <OrderPlansList onAdd={() => nav('order-plan-form')} onSelect={handleOrderPlanSelect} />;
    case 'order-plan-form':
      return <OrderPlanForm onSave={handleSaveOrderPlan} onCancel={handleBack} />;
    case 'order-plan-edit':
      return selectedOrderPlan
        ? <OrderPlanForm initialOrderPlan={selectedOrderPlan} onSave={handleSaveOrderPlan} onCancel={handleBack} />
        : null;

    // ── Objetos de OS ─────────────────────────────────────────────────────────
    case 'order-objects':
      return <OrderObjectsList onAdd={() => nav('order-object-form')} onSelect={handleOrderObjectSelect} />;
    case 'order-object-form':
      return <OrderObjectForm onSave={handleSaveOrderObject} onCancel={handleBack} />;
    case 'order-object-edit':
      return selectedOrderObject
        ? <OrderObjectForm initialOrderObject={selectedOrderObject} onSave={handleSaveOrderObject} onCancel={handleBack} />
        : null;

    // ── Tipos de Ativo ────────────────────────────────────────────────────────
    case 'asset-types':
      return <AssetTypesList onAdd={() => nav('asset-type-form')} onSelect={handleAssetTypeSelect} />;
    case 'asset-type-form':
      return <AssetTypeForm onSave={handleSaveAssetType} onCancel={handleBack} />;
    case 'asset-type-edit':
      return selectedAssetType
        ? <AssetTypeForm initialAssetType={selectedAssetType} onSave={handleSaveAssetType} onCancel={handleBack} />
        : null;

    // ── Situações de Ativo ────────────────────────────────────────────────────
    case 'asset-statuses':
      return <AssetStatusesList onAdd={() => nav('asset-status-form')} onSelect={handleAssetStatusSelect} />;
    case 'asset-status-form':
      return <AssetStatusForm onSave={handleSaveAssetStatus} onCancel={handleBack} />;
    case 'asset-status-edit':
      return selectedAssetStatus
        ? <AssetStatusForm initialAssetStatus={selectedAssetStatus} onSave={handleSaveAssetStatus} onCancel={handleBack} />
        : null;

    // ── Prioridades de Ativo ──────────────────────────────────────────────────
    case 'asset-priorities':
      return <AssetPrioritiesList onAdd={() => nav('asset-priority-form')} onSelect={handleAssetPrioritySelect} />;
    case 'asset-priority-form':
      return <AssetPriorityForm onSave={handleSaveAssetPriority} onCancel={handleBack} />;
    case 'asset-priority-edit':
      return selectedAssetPriority
        ? <AssetPriorityForm initialAssetPriority={selectedAssetPriority} onSave={handleSaveAssetPriority} onCancel={handleBack} />
        : null;

    // ── Atributos e Marcas de Ativo ───────────────────────────────────────────
    case 'asset-type-attributes':
      return <AssetTypeAttributesScreen />;
    case 'asset-attributes-brands':
      return <AssetAttributesBrandsScreen />;

    // ── Setores (Asset Tags) ──────────────────────────────────────────────────
    case 'asset-tags':
      return <AssetTagsList onAdd={() => nav('asset-tag-form')} onSelect={handleAssetTagSelect} />;
    case 'asset-tag-form':
      return <AssetTagForm onSave={handleSaveAssetTag} onCancel={handleBack} />;
    case 'asset-tag-edit':
      return selectedAssetTag
        ? <AssetTagForm initialTag={selectedAssetTag} onSave={handleSaveAssetTag} onCancel={handleBack} />
        : null;

    // ── Posições (Asset Tag Subs) ─────────────────────────────────────────────
    case 'asset-tag-subs':
      return <AssetTagSubsList onAdd={() => nav('asset-tag-sub-form')} onSelect={handleAssetTagSubSelect} />;
    case 'asset-tag-sub-form':
      return <AssetTagSubForm onSave={handleSaveAssetTagSub} onCancel={handleBack} />;
    case 'asset-tag-sub-edit':
      return selectedAssetTagSub
        ? <AssetTagSubForm initialTagSub={selectedAssetTagSub} onSave={handleSaveAssetTagSub} onCancel={handleBack} />
        : null;

    // ── Manuais Técnicos ──────────────────────────────────────────────────────
    case 'technical-manuals':
      return <TechnicalManualsList onAdd={() => nav('technical-manual-form')} onSelect={handleTechnicalManualSelect} />;
    case 'technical-manual-form':
      return <TechnicalManualForm onSave={handleSaveTechnicalManual} onCancel={handleBack} />;
    case 'technical-manual-edit':
      return selectedTechnicalManual
        ? <TechnicalManualForm initialManual={selectedTechnicalManual} onSave={handleSaveTechnicalManual} onCancel={handleBack} />
        : null;
    case 'technical-manual-details':
      return selectedTechnicalManual
        ? (
          <TechnicalManualDetails
            manual={selectedTechnicalManual}
            onEdit={() => nav('technical-manual-edit')}
            onDelete={handleDeleteTechnicalManual}
            onSelectAsset={async (assetId: string) => {
              try {
                const asset = await dataService.getAssetById(assetId);
                if (asset) handleAssetSelect(asset);
              } catch (e) { console.error(e); }
            }}
          />
        )
        : null;

    // ── Checklists de Empréstimo ──────────────────────────────────────────────
    case 'asset-loan-checklist-types':
      return (
        <AssetLoanChecklistTypesList
          onAdd={() => nav('asset-loan-checklist-type-form')}
          onSelect={(item: any) => { setSelectedChecklistType(item); nav('asset-loan-checklist-type-edit'); }}
        />
      );
    case 'asset-loan-checklist-type-form':
      return <AssetLoanChecklistTypeForm onSave={() => nav('asset-loan-checklist-types')} onCancel={handleBack} />;
    case 'asset-loan-checklist-type-edit':
      return selectedChecklistType
        ? <AssetLoanChecklistTypeForm item={selectedChecklistType} onSave={() => nav('asset-loan-checklist-types')} onCancel={handleBack} />
        : null;
    case 'loans-checklists':
      return (
        <LoansChecklistsList
          onAdd={() => nav('loans-checklist-form')}
          onSelect={(item: any) => { setSelectedLoansChecklist(item); nav('loans-checklist-edit'); }}
        />
      );
    case 'loans-checklist-form':
      return <LoansChecklistForm onSave={() => nav('loans-checklists')} onCancel={handleBack} />;
    case 'loans-checklist-edit':
      return selectedLoansChecklist
        ? <LoansChecklistForm item={selectedLoansChecklist} onSave={() => nav('loans-checklists')} onCancel={handleBack} />
        : null;

    // ── Dicas do App ──────────────────────────────────────────────────────────
    case 'app-tips':
      return <AppTipsList onBack={handleBack} />;

    // ── Tipos de custo veicular (rateio de aluguel) ──────────────────────────
    case 'vehicle-cost-types':
      return <VehicleCostTypesList onBack={handleBack} />;

    // ── Usuários e Acesso ─────────────────────────────────────────────────────
    case 'all-users':
      return (
        <AllUsersList
          onSelectUser={async (user) => {
            setSelectedUser(user);
            localStorage.setItem('last_screen_before_profile', 'all-users');
            nav('user-details');
          }}
          onAddUser={
            currentUser?.companyId && currentUser.companyId !== '1'
              ? () => {
                  if (setSelectedCompany) setSelectedCompany({ id: currentUser.companyId! } as any);
                  nav('user-form');
                }
              : undefined
          }
          currentUser={currentUser}
        />
      );
    case 'user-details':
      return selectedUser
        ? (
          <UserViewScreen
            user={selectedUser}
            onBack={() => { nav('all-users'); setSelectedUser(null); }}
            onEdit={(user) => { setSelectedUser(user); nav('profile'); }}
          />
        )
        : null;

    // ── Permissões de Perfil ──────────────────────────────────────────────────
    case 'profile-permissions':
      return (
        <ProfilePermissionsGate onForbidden={() => nav('settings')}>
          <ProfilePermissionsScreen currentUser={currentUser} onBack={() => nav('settings')} />
        </ProfilePermissionsGate>
      );

    // ── Gerenciamento de Rotas ────────────────────────────────────────────────
    case 'route-management':
      return (
        <RouteManagementScreen
          onAdd={() => nav('route-form')}
          onEdit={handleRouteSelect}
          onBack={() => nav('settings')}
        />
      );
    case 'route-form':
      return <RouteFormScreen onSave={handleSaveRoute} onCancel={() => nav('route-management')} />;
    case 'route-edit':
      return selectedRoute
        ? <RouteFormScreen initialRoute={selectedRoute} onSave={handleSaveRoute} onCancel={() => nav('route-management')} />
        : null;

    // ── Planos de Manutenção ──────────────────────────────────────────────────
    case 'maintenance-plans':
    case 'maintenance-plan-form':
    case 'maintenance-plan-edit':
    case 'maintenance-plan-details':
      return (
        <MaintenancePlansScreen
          currentScreen={currentScreen}
          onNavigate={nav}
          onBack={handleBack}
          currentUser={currentUser}
        />
      );

    default:
      return null;
  }
};
