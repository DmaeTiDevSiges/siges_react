

export interface ContractManager {
  id: string;
  contractId: string;
  managerId: string;
  isDeleted: boolean;
  role?: string;
  versionMode?: string;
  createdUserId?: string;
  createdAt?: string;
  deletedUserId?: string;
  deletedAt?: string;

  // UI helpers
  managerName?: string;
  managerAvatarUrl?: string;
  managerEmail?: string;
}

export interface Contract {
  id: string;
  clientCompanyId?: string;
  clientDepartmentId?: string;
  providerCompanyId?: string;
  providerDepartmentId?: string;
  clientId?: string;
  description?: string;
  isAvailable?: boolean;
  isDeleted?: boolean;
  code?: string;
  statusId?: number;
  createdUserId?: string;
  createdDate?: string;
  updatedUserId?: string;
  updatedDate?: string;
  deletedUserId?: string;
  deletedDate?: string;
  isDev?: boolean;
  version?: string;
  defaultOvAssetId?: string;
  defaultActivityId?: string;
  dateStart?: string;
  dateEnd?: string;
  totalValue?: number;

  // UI helpers
  clientCompanyName?: string;
  providerCompanyName?: string;
  clientDepartmentName?: string;
  providerDepartmentName?: string;
  clientName?: string;
  logoUrl?: string;
  providerCompanyCode?: string;
}

export interface Company {
  id: string;

  // Mapped from cfg_companies
  name: string; // description
  code: string; // code
  emailSuffix: string; // email_sufix
  logoPath: string; // img_file_path
  logoName: string; // img_file_name
  status: 'active' | 'inactive'; // is_available

  // UI helpers
  logoUrl: string; // Derived/Mapped

  // Virtual / Mock fields for UI compatibility until schema expansion
  category: string;
  phone: string;
  location: string;
  cnpj: string;

  contractCount: number;
}

export interface Client {
  id: string;
  name: string;
  code: string; // Used for CPF/CNPJ
  email?: string;
  mobile?: string;
  address?: string;
  logoPath: string;
  logoName: string;
  status: 'active' | 'inactive';
  logoUrl: string;
  category: string;
  contractCount: number;
  companyId?: string;
}


export interface ServiceHistoryItem {
  id: string;
  title: string;
  date: string;
  type: 'created' | 'status_change' | 'visit_started' | 'visit_ended' | 'intervention' | 'material' | 'observation';
  description?: string;
  userName?: string;
  userAvatarUrl?: string;
  assetCode?: string;
  assetDescription?: string;
  visitMask?: string;
  statusName?: string;
  statusColor?: string;
}

export interface Department {
  id: string;
  companyId: string;

  // Mapped from cfg_departments
  name: string; // description
  code: string; // code
  status: 'active' | 'inactive'; // is_available
  parentId?: string; // parent_id

  // UI helpers
  companyName?: string;
  parentName?: string;
}

export interface Team {
  id: string;
  departmentId: string;

  // Mapped from cfg_teams
  name: string; // description
  code: string; // code
  status: 'active' | 'inactive'; // is_available

  // UI helpers
  departmentName?: string;
  companyName?: string;
  companyId?: string;
}

export interface UserStatus {
  id: number;
  description: string;
}

export interface User {
  id: string; // BigInt (Internal ID)
  uuid: string; // UUID (Auth ID)
  email: string;

  // Personal
  nameFull?: string;
  nameShort?: string;
  mobile?: string;
  mobileMask?: string;
  phone?: string;
  imgFilePath?: string;
  imgFileName?: string;
  latitude?: number;
  longitude?: number;
  trackerIntervalSeconds?: number;
  trackerAt?: string;

  // Organization
  statusId?: number;
  teamId?: string;
  companyId?: string;
  departmentId?: string;
  profileId?: string;

  // Flags & Permissions
  isAdmin?: boolean;
  isAdminSuper?: boolean;
  isTeamLeader?: boolean;
  isAvailable?: boolean;

  // Operational
  isOvInProgress?: boolean;
  ovIdInProgress?: string;
  oIdInProgress?: string;
  opIdInProgress?: string;
  ovIdInProgressMask?: string;
  ovInProgressLeaderId?: number;
  oContractIdInProgress?: number;
  oTypeIdInProgress?: number;
  oTypeSubIdInProgress?: number;
  oPlanIdInProgress?: number;
  oAssetTagIdInProgress?: number;
  oUnitIdInProgress?: number;
  oSystemIdInProgress?: number;
  oSystemParentIdInProgress?: number;
  oUnitTypeIdInProgress?: number;
  oUnitTypeParentIdInProgress?: number;
  oObjectIdInProgress?: number;
  ovIdInProgressBigInt?: number;
  oIdInProgressBigInt?: number;
  opIdInProgressBigInt?: number;

  // Metadata
  createdAt: string;
  updatedAt?: string;

  // UI helpers
  statusName?: string;
  teamName?: string;
  companyName?: string;
  profileName?: string;
  avatarUrl?: string; // Derived
  companyLogoUrl?: string; // Derived
  notificationsAmount?: number;
  vehicleId?: string;
  permissions?: Permission[];
}

export interface Route {
  id: string;
  routeKey: string;
  routePath: string;
  description: string;
  icon?: string;
  parentId?: string;
  orderIndex: number;
  isAvailable: boolean;
}

export interface Permission {
  id: string;
  profileId: string;
  routeId: string;
  routeKey?: string; // Helper field from view/join
  routePath?: string; // Helper field from view/join
  routeDescription?: string; // Helper field from view/join
  resource?: string; // Helper for Profile management
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSearch: boolean;
}

export interface Profile {
  id: string;
  companyId: string;
  description: string;
  isAvailable: boolean;
  createdAt: string;
  permissions?: Permission[];
}

export interface System {
  id: string;
  parentId?: string;
  code: string;
  description: string;
  isAvailable: boolean;
}

export interface UnitType {
  id: string;
  parentId?: string;
  code: string;
  description: string;
  isAvailable: boolean;
}

export interface Unit {
  id: string;
  clientId: string;
  description: string;
  code: string;
  installationCodePowerSupply: string;
  addressFull: string;
  latitude?: number;
  longitude?: number;
  unitTypeParentId: string;
  unitTypeId: string;
  typeName?: string;
  subTypeName?: string;
  systemParentId: string;
  systemId: string;
  systemParentName?: string;
  systemName?: string;
  imgFilePath?: string;
  imgFileName?: string;
  status: 'active' | 'inactive';
  logoUrl?: string;
  descriptionFull?: string;
  clientName?: string;
}

export interface Vehicle {
  id: string;
  description: string;
  plates: string;
  model: string;
  brand: string;
  color: string;
  year: string;
  isAvailable: boolean;
}

export interface Activity {
  id: string;
  companyId?: string;
  departmentId?: string;
  code: string;
  description: string;
  isAvailable: boolean;
  isDeleted?: boolean;
  linkedOrderTypeIds?: string[]; // IDs of order types linked to this activity
  linkedOrderSubTypeIds?: string[]; // IDs of order sub-types linked to this activity
}

export interface OrderTypeActivity {
  id: string;
  orderTypeId: string;
  activityId: string;
  isAvailable: boolean;
}

export interface OrderVisitAssetActivity {
  id: string;
  orderVisitAssetId: string;
  activityId: string;
  isDeleted: boolean;
  createdUserId?: string;
  createdAt?: string;
  maintenancePlanId?: string;
  isOk?: boolean | null;
  imgFilePath?: string;
  imgFilesNames?: any; // JSONB
  comments?: string;

  // View fields
  activityDescription?: string;
  activityCode?: string;
}

export interface MaintenancePlan {
  id: string;
  code: string;
  description: string;
  assetTypeId?: string;
  isAvailable: boolean;
  isDeleted: boolean;
  createdUserId?: string;
  createdAt?: string;
  updatedUserId?: string;
  updatedAt?: string;
  deletedUserId?: string;
  deletedAt?: string;
}

export interface MaintenancePlanSection {
  id: string;
  maintenancePlanId: string;
  description: string;
  isAvailable: boolean;
  isDeleted: boolean;
  createdUserId?: string;
  createdAt?: string;
  updatedUserId?: string;
  updatedAt?: string;
  deletedUserId?: string;
  deletedAt?: string;
  orderIndex?: number;
}

export interface MaintenancePlanSectionActivity {
  id: string;
  maintenancePlanSectionId: string;
  activityId: string;
  isAvailable: boolean;
  isDeleted: boolean;
  createdUserId?: string;
  createdAt?: string;
  updatedUserId?: string;
  updatedAt?: string;
  deletedUserId?: string;
  deletedAt?: string;
  orderIndex?: number;
  description?: string;
  commentsDefault?: string;
  // view fields
  activityDescription?: string;
  activityCode?: string;
}

export interface Service {
  id: string;
  code: string;
  description: string;
  unit: string;
  isAvailable: boolean;
}

export interface Material {
  id: string;
  code: string;
  description: string;
  unit: string;
  defaultValue: number;
  isAvailable: boolean;
}

export interface OrderVisitAssetMaterial {
  id: string;
  ovaId: string;
  orderVisitAssetId?: string; // alias returned by dataService (ova_id)
  materialId: string;
  amount: number;
  valueUnit: number;
  valueTotal: number;
  discount: number; // 0 = Addition, 1 = Discount
  isDeleted: boolean;
  createdUserId?: string;
  createdAt?: string;

  // View fields
  materialDescription?: string;
  materialCode?: string;
  materialUnit?: string;
}

export interface ContractService {
  id: string;
  contractId: string;
  serviceId: string;
  valueUnit: number;
  discount: number;
  amount: number;
  valueTotal: number;
  isAvailable: boolean;
  isDeleted: boolean;
  versionMode: string;

  // UI helpers
  serviceDescription?: string;
  serviceCode?: string;
  serviceUnit?: string;
}
export interface Priority {
  id: string;
  code: string;
  description: string;
  isAvailable: boolean;
  color?: string; // e.g., hex code for high/medium/low visual cues
}
export interface OrderType {
  id: string;
  departmentId: string;
  code: string;
  description: string;
  isAvailable: boolean;
  color?: string;

  // UI helpers
  departmentName?: string;
}

export interface OrderSubType {
  id: string;
  orderTypeId: string;
  departmentId?: string;
  parentId?: string;
  code: string;
  description: string;
  isAvailable: boolean;
  linkedActivityIds?: string[];
}

export interface OrderPlan {
  id: string;
  code: string;
  description: string;
  isAvailable: boolean;
  color?: string;
}

export interface OrderObject {
  id: string;
  code: string;
  description: string;
  isAvailable: boolean;
}

export interface AssetType {
  id: string;
  code: string;
  description: string;
  isAvailable: boolean;
  namingPattern?: string;
}

export interface AssetStatus {
  id: string;
  code: string;
  description: string;
  color?: string;
  isAvailable: boolean;
}

export interface AssetPriority {
  id: string;
  code: string;
  description: string;
  color: string;
  isAvailable: boolean;
}

export interface AssetTag {
  id: string;
  code: string;
  description: string;
  isAvailable: boolean;
  unit_id: number;
  asset_tag_id: number;
  asset_tag_sub_id?: number | null;
  unit_description?: string;
  client_name?: string;
  asset_tag_tag_sub_description?: string;
}

export interface AssetTagSub {
  id: string;
  parentId: string;
  code: string;
  description: string;
  isAvailable: boolean;
}

export interface AssetAttribute {
  id: string;
  assetTypeId: string;
  fieldKey: string;
  label: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  unit?: string;
  decimals?: number;
  required: boolean;
  orderIndex: number;
  colSpan?: number;
  isAvailable: boolean;
}

export interface AssetAttributeValue {
  assetId: string;
  fieldKey: string;
  value: string;
}

export interface AssetAlert {
  id: string;
  assetId: string;
  oTypeId?: string;
  priorityId?: string;
  description?: string;
  isDone: boolean;
  ovId?: string;
  createdUserId?: string;
  createdAt?: string;
  updatedUserId?: string;
  updatedAt?: string;
  isDeleted: boolean;
  deletedUserId?: string;
  deletedAt?: string;

  // UI helpers
  orderTypeName?: string;
  priorityName?: string;
  priorityColor?: string;
}

export interface Asset {
  id: string;
  clientId?: string;
  clientName?: string;
  companyId?: string;
  unitId?: string;
  unitDescriptionFull?: string;
  code: string;
  description: string;
  statusId?: string;
  statusCode?: string;
  statusColor?: string;
  tagId?: string;
  tagName?: string;
  tagSubId?: string;
  tagSubName?: string;
  statusAt?: string;
  typeId?: string;
  searchable?: string;
  comments?: string;
  brand?: string;
  model?: string;
  serial?: string;
  power?: number;
  powerUnit?: string;
  voltage?: string;
  amperage?: string;
  poles?: number;
  voltageUnit?: string;
  amperageUnit?: string;
  polesUnit?: string;
  rotation?: number;
  rotationUnit?: string;
  serviceFactor?: number;
  pressureMax?: number;
  pressureMin?: number;
  pressureOperation?: number;
  pressureUnit?: string;
  flowRateMax?: number;
  flowRateMin?: number;
  flowRateOperation?: number;
  flowRateUnit?: string;
  rotorDiameter?: number;
  rotorDiameterUnit?: string;
  priorityId?: number;
  materialId?: string;
  materialCode?: string;
  acquisitionAt?: string;
  location?: string;
  weight?: number;
  weightUnit?: string;
  createdUserId?: string;
  createdAt?: string;
  updatedUserId?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedUserId?: string;
  deletedAt?: string;
  couplingModelId?: number;
  acquisitionValue?: number;
  versionMode?: string;
  imgFilePath?: string;
  imgFileName?: string;
  imgUrl?: string;
  unitAssetTagId?: string;
  companyOwnerId?: string;
  imgFileNameThumb?: string;
  attributeValues?: Record<string, string>;
}

export interface UserNotification {
  id: string;
  userIdTo: string;
  userIdFrom?: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  unitId?: string;
  imgUrl?: string;
  orderId?: string; // o_id
  vehicleId?: string; // v_id
  activityId?: string;
  companyId?: string;
  tokenFcm?: string;
  imgFilePath?: string;
  imgFileName?: string;
  userFromNameShort?: string;
  pageTarget?: string;
  versionMode?: string;
  userToWhatsapp?: string;

  // UI helpers
  relatedUserName?: string;
  relatedUserAvatarUrl?: string;
  relatedUserIsAvailable?: boolean;
  relatedUserOvIdInProgress?: number;
}

// Deprecated: Use Notification instead
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  isRead: boolean;
}

export interface Order {
  id: string;
  uid?: string;
  orderMask?: string; // order_mask

  // Relations
  clientId?: string;
  companyId?: string;
  unitId?: string;
  departmentId?: string;
  providerDepartmentId?: string;

  typeId?: string;
  typeCode?: string;
  typeSubId?: string;
  typeSubCode?: string;

  objectId?: string;
  objectCode?: string;
  objectDescription?: string;

  priorityId?: string;
  priorityCode?: string;
  teamId?: string;
  contractId?: string;
  planId?: string;
  statusId?: number;
  statusAt?: string;

  // Requester
  requesterName?: string;
  requesterNameShort?: string;
  requesterPhone?: string;
  requesterTeamId?: string;
  requesterTeamCode?: string;
  requestedAt?: string;

  // Details
  requestedServices?: string; // Description

  // Values
  totalValue?: number;
  materialsValue?: number;
  servicesValue?: number;
  vehiclesValue?: number;

  // System/Assets
  systemId?: string;
  systemParentId?: string;
  assetTagId?: string; // Setor
  assetTagSubId?: string;

  // Location snapshot
  unitLatitude?: number;
  unitLongitude?: number;

  // Meta
  createdUserId?: string;
  createdAt?: string;
  updatedAt?: string;

  teamCode?: string;
  causeReasonDescription?: string;
  causeReasonId?: number;

  imgFilePath?: string;
  imgFileName?: string;
  imgFilesNames?: string[];
  images?: string[]; // Array of image filenames to be saved (max 4)

  // UI Helpers
  clientName?: string;
  unitDescription?: string;
  unitDescriptionFull?: string;
  typeName?: string;
  statusName?: string;
  statusDescription?: string;
  statusIcon?: string;
  statusColor?: string; // Renamed for internal use, but mapping will change
  iconColor?: string;
  statusBackgroundColor?: string;
  borderColor?: string;
  progress?: string;
  priorityName?: string;
  priorityDescription?: string;
  priorityColor?: string;
  typeColor?: string;
  typeIcon?: string;
  typeDescription?: string;
  typeSubDescription?: string;
  unitName?: string;
  unitCode?: string;
  assetId?: string;
  assetName?: string;
  assetTagDescription?: string;
  assetTagSubDescription?: string;
  createdDate?: string;
  updatedDate?: string;
  date?: string;
  parentId?: number | null;
  teamLeaderId?: string;
  ovCounter?: number;
  subInfo?: string;
  branch?: string;
  title?: string;
  category?: string;
  description?: string;
  team?: string;
  teamDescription?: string;
  responsible?: string;
  responsibleAvatar?: string;
  phone?: string;
  status?: string;
  type?: string;
  systemDescription?: string;
  providerLogo?: string | null;
  providerCompanyName?: string;
  providerCompanyId?: string;
  contractDescription?: string;
  planDescription?: string;
  teamLeaderNameShort?: string;
  teamLeaderLatitude?: number;
  teamLeaderLongitude?: number;
  teamLeaderAvatarUrl?: string;
  teamLeaderIsAvailable?: boolean;
  teamLeaderOvIdInProgress?: number;
  unitAvatarUrl?: string;
  unitAssetTagDescription?: string;
  unitAssetTagSubDescription?: string;
  unitAssetTagId?: string;
  providerCompanyImgFilePath?: string;
  providerCompanyImgFileName?: string;
}

export interface OrderVisit {
  id: string;
  oId: string;
  ovMask: string;
  ovStatusId: number;
  ovStatusAt?: string;
  ovCreatedAt: string;
  ovCreatedUserId: string;
  ovUpdatedAt?: string;
  ovUpdatedUserId?: string;
  ovStartedAt?: string;
  ovEndedAt?: string;
  ovTeamLeadId: string;
  ovComments?: string;
  ovProcessingId: number;
  ovOStatusId?: number;
  ovOSuspendedReasonId?: number;

  // Mapped from cfg_orders_visits_processing (frontend-side join option)
  processingIcon?: string;
  processingIconColor?: string;
  processingBgColor?: string;

  // UI Helpers / View fields
  orderMask?: string;
  statusDescription?: string;
  processingDescription?: string;
  teamLeaderName?: string;
  teamLeadAvatarUrl?: string;
  unitDescription?: string;
  unitId?: string;
  systemDescription?: string;
  clientName?: string;
  assetTagDescription?: string;
  assetTagSubDescription?: string;
  requestedServices?: string;
  progress?: number;
  ovDurationHours?: number;
  contractId?: string;
  servicesValue?: number;
  materialsValue?: number;
  vehiclesValue?: number;
  totalValue?: number;
  companyId?: string;
  providerCompanyId?: string;
  providerDepartmentId?: string;
  isFiled?: boolean;
  teamCode?: string;
  priorityId?: string;
  priorityCode?: string;
  priorityColor?: string;
  priorityDescription?: string;
  oRequesterName?: string;
  oRequesterPhone?: string;
  contractDescription?: string;
  planDescription?: string;
  oReasonDescription?: string;
  oCauseDescription?: string;
  observation?: string;
  ovAssetsAmount?: number;
  ovAssetsReportedAmount?: number;
  ovAssetsDraftAmount?: number;
  ovAssetsRevisedAmount?: number;
  ovAssetsDisapprovedAmount?: number;
  ovAssetsApprovedNoFiledAmount?: number;
  ovAssetsApprovedFiledAmount?: number;
  ovAssetsApprovedAmount?: number;

  // Approval audit trail (from v_orders_visits)
  reportedAt?: string;
  reportedUserId?: string;
  reportedUserNameShort?: string;
  revisedAt?: string;
  revisedUserId?: string;
  revisedUserNameShort?: string;
  disapprovedAt?: string;
  disapprovedUserId?: string;
  disapprovedUserNameShort?: string;
  approvedAt?: string;
  approvedUserId?: string;
  approvedUserNameShort?: string;
  approvedFiledAt?: string;
  approvedFiledUserId?: string;
  approvedFiledUserNameShort?: string;
}

export interface OrderVisitTeam {
  id: string;
  ovId: string;
  userId: string;
  isLeader: boolean;
  orderId: number;

  // UI Helpers
  userName?: string;
  userAvatarUrl?: string;
  userIsAvailable?: boolean;
}

export interface OrderVisitVehicle {
  id: string;
  ovId: string;
  vehicleId: string;
  recorderStart?: number;
  recorderEnd?: number;
  amount?: number;
  valueUnit?: number;
  valueTotal?: number;
  createdUserId?: string;
  createdAt: string;

  // UI Helpers
  description?: string;
  plates?: string;
  model?: string;
  unit?: string;
}
export interface OrderVisitService {
  id: string;
  ovId: string;
  serviceId?: string; // FK to contracts_services.id
  valueUnit: number;
  amount: number;
  discount: number;
  valueTotal: number;
  comments?: string;
  versionMode: string;
  createdUserId?: string;
  createdAt?: string;

  // UI Helpers (from view)
  serviceDescription?: string;
  serviceCode?: string;
  serviceUnit?: string;
  contractId?: string;
}


export interface OrderVisitAsset {
  id: string;
  ovId: string;
  assetId: string;
  isMoved?: boolean;
  beforeClientId?: string;
  afterClientId?: string;
  beforeUnitId?: string;
  afterUnitId?: string;
  beforeUnitAssetTagId?: string;
  afterUnitAssetTagId?: string;
  beforeStatusId?: string;
  afterStatusId?: string;
  beforeLocation?: string;
  afterLocation?: string;
  beforeTagId?: string;
  afterTagId?: string;
  beforeTagSubId?: string;
  afterTagSubId?: string;
  beforePriorityId?: number;
  afterPriorityId?: number;
  isFiled?: boolean;
  movedComments?: string;
  clientId?: string;
  createdUserId?: string;
  createdAt?: string;
  maintenancePlanId?: string;
  maintenancePlanProgress?: number;
}

export interface OrderVisitAssetView extends OrderVisitAsset {
  code?: string;
  description?: string;
  brand?: string;
  model?: string;
  serial?: string;
  assetTypeId?: string;
  location?: string;
  unitId?: string; // asset's current unit (from joined asset data)
  beforeUnitDescription?: string;
  afterUnitDescription?: string;
  beforeStatusDescription?: string;
  afterStatusDescription?: string;
  beforeTagDescription?: string;
  beforeTagSubDescription?: string;
  oTeamLeaderNameShort?: string;
  ovMask?: string;
  orderMask?: string;
  // UI Helpers
  imgUrl?: string;
  afterImgUrl?: string;
  initialPhotoUrls?: string[];
  finalPhotoUrls?: string[];
  beforeImgFilesNames?: string[];
  afterImgFilesNames?: string[];
  oCompanyId?: string;
  orderTypeId?: string;
  beforeComments?: string;
  afterComments?: string;
  afterTagDescription?: string;
  afterTagSubDescription?: string;
  afterUnitAssetTagDescription?: string;
  afterStatusAt?: string;
  beforeStatusAt?: string;
  afterStatusColor?: string;
  clientName?: string;
  beforeClientName?: string;
  afterClientName?: string;
  processingId?: number;
  processingDescription?: string;
  reportedUserId?: string;
  reportedAt?: string;
  disapprovedUserId?: string;
  disapprovedAt?: string;
  disapprovedNotes?: string;
  approvedUserId?: string;
  approvedAt?: string;
  beforeStatusColor?: string;
  reportedUserNameShort?: string;
  activitiesDescription?: string;
}

export interface AssetHistoryItem {
  id: string; // From v_orders_visits_assets.id (or ov_id if grouping)
  type: string; // o_type_description
  title: string; // o_type_sub_description || o_type_description
  description: string; // before_comments or after_comments or details
  date: string; // ov_ended_at || ov_started_at
  user?: string; // o_team_leader_name_short
  team?: string; // o_team_code
  color?: string;

  // Detailed fields from v_orders_visits_assets
  ovId: string;
  orderId: string; // o_id
  orderMask?: string;
  ovMask?: string;

  // Before State
  beforeStatus?: string; // before_status_description
  beforeUnit?: string; // before_unit_description
  beforeTag?: string; // before_tag_description (+ sub)
  beforePriority?: string;
  beforeComments?: string;
  beforeImg?: string;

  // After State
  afterStatus?: string; // after_status_description
  afterUnit?: string; // after_unit_description
  afterTag?: string; // after_tag_description (+ sub)
  afterPriority?: string;
  afterComments?: string;
  afterImg?: string;

  // Provider Company Info
  providerCompanyId?: string;
  providerCompanyName?: string;
  providerCompanyLogoUrl?: string;

  isMoved?: boolean;
}

export interface OrderFilters {
  id?: string | string[];
  systemParentId?: string | string[];
  systemId?: string | string[];
  unitTypeParentId?: string | string[];
  unitTypeId?: string | string[];
  unitId?: string | string[];
  assetTagId?: string | string[];
  orderObjectId?: string | string[];
  orderTypeId?: string | string[];
  orderTypeSubId?: string | string[];
  contractId?: string | string[];
  useGeneralView?: boolean;
  orderPlanId?: string | string[];
  orderTeamId?: string | string[];
  priorityId?: string | string[];
  search?: string;
  activeFilter?: string;
  statusId?: number | null;
  parentId?: string | string[];
  period?: string | null;
  orderMask?: string;
}
