// Data Service for SIGES application
import { supabase } from './core/supabase';
import { r2Service } from './media/r2Service';
import { materialsService } from './materials/materialsService';
import { warehouseService } from './materials/warehouseService';
import { purchasesService } from './materials/purchasesService';
import { materialsImportService } from './materials/materialsImportService';
import type {
    MaterialsImportProgress,
    MaterialsImportResult,
    MaterialsImportRow,
    MaterialsParseResult,
    MaterialsValidationContext,
    MaterialsValidationResult
} from './materials/materialsImportService';
import { ordersService } from './orders/ordersService';
import { visitsService } from './orders/visitsService';
export { competenceLabel, previousCompetenceMonth, toCompetenceClosingInstant, toCompetenceMonthStart } from './orders/visitsService';
import { vehicleRentalService } from './orders/vehicleRentalService';
import type {
    VehicleRentalContract,
    VehicleRentalContractInfo,
    VehicleRentalDetailRow,
    VehicleRentalPeriod,
    VehicleRentalSummaryRow,
    SaveVehicleRentalContractInput,
    VehicleMonthlyExpense,
    SaveVehicleMonthlyExpenseInput,
    FuelExpenseImages,
    FuelExpenseImageRefs,
    VehicleUtilizationRow
} from './orders/vehicleRentalService';
import { vehicleRateService } from './orders/vehicleRateService';
import { dailyScheduleService } from './orders/dailyScheduleService';
import type { DailyScheduleBoard, DailyScheduleItemInput, DailyScheduleMoveLog, DailyScheduleTeam, MyDayScheduleItem } from './orders/dailyScheduleService';
import { vehiclesService, SaveVehicleInput } from './orders/vehiclesService';
import type {
    VehicleRateContract,
    VehicleRateContractInfo,
    SaveVehicleRateContractInput
} from './orders/vehicleRateService';
import { assetTagsService } from './assets/assetTagsService';
import { assetsAvailableIntegrationsService } from './assets/assetsAvailableIntegrationsService';
import type {
    AssetsAvailableIntegration,
    AssetsAvailableIntegrationInput,
    AssetsAvailableIntegrationMapping,
    AssetsAvailableIntegrationLog,
    UnitAssetTagOption,
    AssetsAvailableIntegrationRunMode,
    AssetsAvailableIntegrationRunResult,
} from './assets/assetsAvailableIntegrationsService';
import { assetAvailabilityNotificationService } from './assets/assetAvailabilityNotificationService';
import type { AvailabilityNotificationResult } from './assets/assetAvailabilityNotificationService';
import { companiesService } from './companies/companiesService';
import { evaluationService } from './companies/evaluationService';
import { unitsService } from './core/unitsService';
import { visitChatService } from './orders/visitChatService';
import { assetsService } from './assets/assetsService';
import { assetConfigService } from './assets/assetConfigService';
import { assetAttributesService } from './assets/assetAttributesService';
import { assetAttributeGroupsService } from './assets/assetAttributeGroupsService';
import { usersService } from './users/usersService';
import { accountDeletionService, AccountDeletionRequest } from './users/accountDeletionService';
import { trackerService } from './users/trackerService';
import { notificationsService } from './core/notificationsService';
import { settingsService } from './core/settingsService';
import { dashboardService } from './core/dashboardService';
import { teamShiftsRecordsService } from './core/teamShiftsRecordsService';
import { maintenancePlansService } from './core/maintenancePlansService';
import { orderConfigService } from './core/orderConfigService';
import { toolsService } from './tools/toolsService';
import { technicalManualsService } from './assets/technicalManualsService';
import { appNoticesService } from './core/appNoticesService';
import { appNoticesWorkersService } from './core/appNoticesWorkersService';
import { appTipsService } from './core/appTipsService';
import { auditService } from './core/auditService';
import { gamificationService } from './gamification/gamificationService';
import { assetLoansService } from './assets/assetLoansService';
import { assetsTypesChecklistService } from './assets/assetsTypesChecklistService';
import { loansChecklistService } from './assets/loansChecklistService';
import { Asset, Contract, ContractManager, Company, Client, Department, Team, User, UserStatus, Profile, Permission, System, UnitType, Unit, Vehicle, VehicleCompanyInfo, Activity, Priority, Service, ContractService, Route, Material, OrderVisitAssetMaterial, OrderType, OrderSubType, OrderPlan, OrderObject, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, AssetAttribute, TypeAttributeConfig, AssetAttributeValue, Order, UserNotification, AssetActivityEntry, AssetHistoryItem, OrderFilters, OrderVisit, OrderVisitTeam, OrderVisitVehicle, OrderVisitService, OrderVisitAssetView, OrderVisitAssetActivity, ServiceHistoryItem, OrderStatusLogItem, MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, AssetAlert, SuspendedReason, CauseReason, VehicleCostType, OrderVisitChatMessage, OrderVisitChatParticipant, TechnicalManual, TechnicalManualCategory, TechnicalManualFile, TechnicalManualAsset, SystemNotice, CreateSystemNoticeInput, NoticeFilters, NoticeWorker, NoticeWorkerPeriod, NoticeWorkersSummaryOptions, NoticeWorkersSummaryItem, AppTip, CreateAppTipInput, AppTipFilters, LeaderMonthlyScore, LeaderScoreHistory, LeaderScoreBadge, LeaderRankingEntry, TeamRankingEntry, OrderVisitScore, AssetMaterial, AssetLoan, AssetLoanChecklistPhase, LoansChecklist, AssetLoanChecklistType, AssetLoanChecklist, AssetLoanChecklistImage, CreateAssetLoanInput, UpdateAssetLoanInput, SaveChecklistItemInput, CreateChecklistTypeInput, CreateLoansChecklistInput, UpdateLoansChecklistInput, TeamShiftsMonthly, TeamShiftsRecord, TeamShiftsSaveEntry, TeamShiftsMonthLock, TeamShiftsCalendarEntry, AuditLogItem, AuditLogFilters, AuditTableConfig, AuditTableConfigChange, OrderVisitAssetLockResult, OrderVisitAssetUnlockResult, OrderVisitAssetsLocks } from '../types';
import { installOfflineLayer } from './offline/offlineLayer';
import { offlineVersionsService, type OfflineChangeVersions } from './offline/offlineVersionsService';
import { getLocalOfflineFileUrl } from './offline/offlineFileUrls';



import { formatRelativeTime, formatDateTime } from '../utils/formatters';

export const getBrazilTimestamp = (dateInput?: string | Date | null) => {
    let now: Date;
    if (dateInput) {
        if (typeof dateInput === 'string') {
            const clean = dateInput.replace(' ', 'T');
            // Se a string não tiver informação de fuso, tratamos como UTC para converter para SP
            // (já que as datas do Manus vêm "3h a mais", indicando que estão em UTC)
            const hasTimezone = clean.includes('Z') || /[-+]\d{2}(:?\d{2})?$/.test(clean);
            now = new Date(hasTimezone ? clean : clean + 'Z');
        } else {
            now = dateInput;
        }
    } else {
        now = new Date();
    }
    
    if (isNaN(now.getTime())) now = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}T${map.get('hour')}:${map.get('minute')}:${map.get('second')}-03:00`;
};

/** Alias for getBrazilTimestamp as requested by user */
export const getBrazilTime = getBrazilTimestamp;


let processingConfigurationsCache: any[] | null = null;
const getProcessingConfigurations = async () => {
    if (processingConfigurationsCache) return processingConfigurationsCache;
    
    const { data, error } = await supabase
        .from('cfg_orders_visits_processing')
        .select('*');

    if (error || !data) return [];

    processingConfigurationsCache = data;
    return data as { id: number, icon: string, icon_color: string, bg_color: string }[];
};

// Cache de metadados para otimização de performance
const metadataCache = {
    companies: null as any[] | null,
    companiesTimestamp: 0,
    leaders: null as Map<string, any> | null,
    leadersTimestamp: 0,
    units: null as Map<string, any> | null,
    unitsTimestamp: 0,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutos
};

// Debounce for auth requests to prevent NavigatorLockAcquireTimeoutError (lock contention)
let currentUserPromise: Promise<User | null> | null = null;

export const dataService = {
    getAppConfig: (...args: Parameters<typeof settingsService.getAppConfig>): ReturnType<typeof settingsService.getAppConfig> => settingsService.getAppConfig(...args),
    getProcessingConfigurations: (...args: Parameters<typeof settingsService.getProcessingConfigurations>): ReturnType<typeof settingsService.getProcessingConfigurations> => settingsService.getProcessingConfigurations(...args),

    getCauseReasons: (...args: Parameters<typeof orderConfigService.getOrderCauseReasons>): ReturnType<typeof orderConfigService.getOrderCauseReasons> => orderConfigService.getOrderCauseReasons(...args),

    // Atualização de Heartbeat do usuário
    updateLastOnline: (...args: Parameters<typeof usersService.updateLastOnline>): ReturnType<typeof usersService.updateLastOnline> => usersService.updateLastOnline(...args),

    // Tokens de rastreamento por aparelho (trackerService)
    issueTrackerToken: (...args: Parameters<typeof trackerService.issueTrackerToken>): ReturnType<typeof trackerService.issueTrackerToken> => trackerService.issueTrackerToken(...args),

    revokeTrackerToken: (...args: Parameters<typeof trackerService.revokeTrackerToken>): ReturnType<typeof trackerService.revokeTrackerToken> => trackerService.revokeTrackerToken(...args),

    // Atualização de localização do usuário (tracker)
    updateUserLocation: (...args: Parameters<typeof usersService.updateUserLocation>): ReturnType<typeof usersService.updateUserLocation> => usersService.updateUserLocation(...args),

    // Limpar cache de metadados (útil após updates de empresas/usuários/unidades)
    clearMetadataCache() {
        metadataCache.companies = null;
        metadataCache.companiesTimestamp = 0;
        metadataCache.leaders = null;
        metadataCache.leadersTimestamp = 0;
        metadataCache.units = null;
        metadataCache.unitsTimestamp = 0;
    },

    // Helper to get public URL with dynamic transformation (imgproxy or Supabase ImgProxy)
    getPublicImageUrl(path: string | undefined | null, name: string | undefined, options?: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill'; quality?: number; format?: 'origin' | 'webp' | 'jpeg' | 'png'; cacheBust?: number }): string | undefined {
        if (!name) return undefined;
        // Modo offline (F3): foto/assinatura feita sem internet e ainda no aparelho.
        const offlineLocalUrl = getLocalOfflineFileUrl(name);
        if (offlineLocalUrl) return offlineLocalUrl;
        // Treat null/undefined path as empty string (root)
        const safePath = path || '';
        if (safePath.startsWith('http') || safePath.startsWith('data:')) return safePath;

        // Check if we should use R2 (imgproxy optimization will be handled by OptimizedImage component)
        const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

        if (r2PublicUrl) {
            // Use Cloudflare R2 - return direct URL
            let cleanPath = safePath.replace(/^\/+|\/+$/g, '');
            let cleanName = name.replace(/^\/+|\/+$/g, '');

            // Remove trailing slash from URL
            const baseUrl = r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl;

            let pathPart = cleanPath;

            // COMPATIBILIDADE: Remover prefixos legados para apontar para raiz do R2
            const legacyPrefixes = ['siges/stub/siges/', 'stub/siges/', 'siges/'];
            for (const prefix of legacyPrefixes) {
                if (pathPart.startsWith(prefix)) {
                    pathPart = pathPart.substring(prefix.length);
                    break;
                }
            }

            const finalPath = pathPart ? (`${pathPart}/${cleanName}`) : cleanName;
            return `${baseUrl}/${finalPath}`;
        }

        // Fallback to Supabase Storage (original implementation)
        const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';

        // Prepare transformation options
        const transform: any = {};
        if (options?.width) transform.width = options.width;
        if (options?.height) transform.height = options.height;
        if (options?.resize) transform.resize = options.resize;
        if (options?.quality) transform.quality = options.quality;
        if (options?.format && options.format !== 'origin') transform.format = options.format;

        let cleanPath = safePath.endsWith('/') ? safePath.slice(0, -1) : safePath;
        let cleanName = name.startsWith('/') ? name.slice(1) : name;

        // Strip leading slashes
        cleanPath = cleanPath.replace(/^\/+/, '');
        cleanName = cleanName.replace(/^\/+/, '');

        // Check if path already starts with bucket name and strip it to avoid duplication by bucket method
        if (cleanPath.startsWith(`${bucket}/`)) {
            cleanPath = cleanPath.substring(bucket.length + 1);
        } else if (cleanPath === bucket) {
            cleanPath = ''; // Root of bucket
        }

        const finalPath = cleanPath ? (`${cleanPath}/${cleanName}`) : cleanName;

        // Ensure we use Supabase's Image Transformation (imgproxy) by providing the transform object
        if (Object.keys(transform).length === 0) {
            transform.quality = 80;
            transform.format = 'origin';
        } else if (!transform.format && options?.format !== 'origin') {
            transform.format = 'origin';
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath, {
            transform: transform
        });

        let finalUrl = data.publicUrl;

        // Fix incorrect domain if present (Supabase internal config issue)
        // User reports correct URL is: https://vps.supabase.siges-app.com.br/storage/v1/object/public/...
        if (finalUrl.includes('siges-mao.com.br')) {
            finalUrl = finalUrl.replace('siges-mao.com.br', 'vps.supabase.siges-app.com.br');
        } else if (finalUrl.includes('siges-app.com.br') && !finalUrl.includes('vps.')) {
            // Ensure vps subdomain if missing
            finalUrl = finalUrl.replace('supabase.siges-app.com.br', 'vps.supabase.siges-app.com.br');
        }

        // Manual override to ensure VPS domain if generic supabase domain is returned
        if (!finalUrl.includes('vps.supabase.siges-app.com.br')) {
            // Basic naive replacement if standard supabase cloud URL is returned (unlikely for self-hosted but possible)
            // or just trust the previous replacements.
            // Let's force the domain if it matches the known pattern
            finalUrl = finalUrl.replace('://supabase.siges-app.com.br', '://vps.supabase.siges-app.com.br');
        }

        // Force cache-busting to ensure we don't see stale images
        if (options?.cacheBust) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${separator}v=${options.cacheBust}`;
        }

        return finalUrl;
    },

    getSignatureUrl(path: string, name: string): string {
        return this.getPublicImageUrl(path, name, { format: 'origin' });
    },

    async saveOrderVisitSignature(ovId: string, type: 'leader' | 'requester', base64: string, onProgress?: ((progress: number) => void) | null, options?: { fileName?: string; signedAt?: string }): Promise<void> {
        // r2Service is now static

        const folderPath = `signatures/visits/${ovId}`;

        // Convert base64 to Blob and upload as-is (signatures are small PNGs from SignaturePad).
        // Preserva a extensão/Content-Type reais do blob: assinaturas antigas em JPEG
        // (fundo preto, sem alpha) não devem ser gravadas como .png.
        try {
            const res = await fetch(base64);
            const blob = await res.blob();
            const mimeType = blob.type || 'image/png';
            const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
            // Modo offline (F3): nome e hora vêm do aparelho (hora real da assinatura).
            const fileName = options?.fileName || `${type}_${Date.now()}.${ext}`;
            const fullPath = `${folderPath}/${fileName}`;
            const uploadFile = new File([blob], `signature_${type}.${ext}`, { type: mimeType });
            await r2Service.uploadFile(uploadFile as any, fullPath, onProgress || undefined);

            const updateData: any = {};
            if (type === 'leader') {
                updateData.ov_signature_leader_path = folderPath;
                updateData.ov_signature_leader_name = fileName;
                updateData.ov_signature_leader_at = options?.signedAt || getBrazilTime();
            } else {
                updateData.ov_signature_requester_path = folderPath;
                updateData.ov_signature_requester_name = fileName;
                updateData.ov_signature_requester_at = options?.signedAt || getBrazilTime();
            }

            const { error } = await supabase
                .from('orders_visits')
                .update(updateData)
                .eq('id', ovId);

            if (error) throw error;
        } catch (err) {
            console.error('[dataService] Error saving signature:', err);
            throw err;
        }
    },

    fileOrderVisit: (...args: Parameters<typeof visitsService.fileOrderVisit>): ReturnType<typeof visitsService.fileOrderVisit> => visitsService.fileOrderVisit(...args),


    deleteOrderVisitSignature: (...args: Parameters<typeof visitsService.deleteOrderVisitSignature>): ReturnType<typeof visitsService.deleteOrderVisitSignature> => visitsService.deleteOrderVisitSignature(...args),

    // -------------------------------------------------------------------------
    // FINANCIAL APPROVAL
    // -------------------------------------------------------------------------

    submitVisitCosts: (...args: Parameters<typeof visitsService.submitVisitCosts>): ReturnType<typeof visitsService.submitVisitCosts> => visitsService.submitVisitCosts(...args),

    approveVisitFinancial: (...args: Parameters<typeof visitsService.approveVisitFinancial>): ReturnType<typeof visitsService.approveVisitFinancial> => visitsService.approveVisitFinancial(...args),

    rejectVisitFinancial: (...args: Parameters<typeof visitsService.rejectVisitFinancial>): ReturnType<typeof visitsService.rejectVisitFinancial> => visitsService.rejectVisitFinancial(...args),

    resetVisitCostsStatus: (...args: Parameters<typeof visitsService.resetVisitCostsStatus>): ReturnType<typeof visitsService.resetVisitCostsStatus> => visitsService.resetVisitCostsStatus(...args),

    getVisitFinancialStatus: (...args: Parameters<typeof visitsService.getVisitFinancialStatus>): ReturnType<typeof visitsService.getVisitFinancialStatus> => visitsService.getVisitFinancialStatus(...args),

    getVisitVehiclePending: (...args: Parameters<typeof visitsService.getVisitVehiclePending>): ReturnType<typeof visitsService.getVisitVehiclePending> => visitsService.getVisitVehiclePending(...args),

    // Private helper for mapping raw database items (v_orders) to Order type
    _mapOrder: (...args: Parameters<typeof ordersService._mapOrder>): ReturnType<typeof ordersService._mapOrder> => ordersService._mapOrder(...args),

    getContracts: (...args: Parameters<typeof companiesService.getContracts>): ReturnType<typeof companiesService.getContracts> => companiesService.getContracts(...args),

    getContractById: (...args: Parameters<typeof companiesService.getContractById>): ReturnType<typeof companiesService.getContractById> => companiesService.getContractById(...args),

    getContractsByClientDepartmentId: (...args: Parameters<typeof companiesService.getContractsByClientDepartmentId>): ReturnType<typeof companiesService.getContractsByClientDepartmentId> => companiesService.getContractsByClientDepartmentId(...args),

    getContractsByClientId: (...args: Parameters<typeof companiesService.getContractsByClientId>): ReturnType<typeof companiesService.getContractsByClientId> => companiesService.getContractsByClientId(...args),

    getCompanies: (...args: Parameters<typeof companiesService.getCompanies>): ReturnType<typeof companiesService.getCompanies> => companiesService.getCompanies(...args),

    getCompanyById: (...args: Parameters<typeof companiesService.getCompanyById>): ReturnType<typeof companiesService.getCompanyById> => companiesService.getCompanyById(...args),

    createCompany: (...args: Parameters<typeof companiesService.createCompany>): ReturnType<typeof companiesService.createCompany> => companiesService.createCompany(...args),

    updateCompany: (...args: Parameters<typeof companiesService.updateCompany>): ReturnType<typeof companiesService.updateCompany> => companiesService.updateCompany(...args),

    getOrdersVisitsView: (...args: Parameters<typeof dashboardService.getOrdersVisitsView>): ReturnType<typeof dashboardService.getOrdersVisitsView> => dashboardService.getOrdersVisitsView(...args),

    getOrdersVisitsDashboardSummary: (...args: Parameters<typeof dashboardService.getOrdersVisitsDashboardSummary>): ReturnType<typeof dashboardService.getOrdersVisitsDashboardSummary> => dashboardService.getOrdersVisitsDashboardSummary(...args),

    getAuthorizedOrdersFromStatusLogs: (...args: Parameters<typeof dashboardService.getAuthorizedOrdersFromStatusLogs>): ReturnType<typeof dashboardService.getAuthorizedOrdersFromStatusLogs> => dashboardService.getAuthorizedOrdersFromStatusLogs(...args),

    getOrdersForCalendar: (...args: Parameters<typeof dashboardService.getOrdersForCalendar>): ReturnType<typeof dashboardService.getOrdersForCalendar> => dashboardService.getOrdersForCalendar(...args),

    deleteCompany: (...args: Parameters<typeof companiesService.deleteCompany>): ReturnType<typeof companiesService.deleteCompany> => companiesService.deleteCompany(...args),

    createContract: (...args: Parameters<typeof companiesService.createContract>): ReturnType<typeof companiesService.createContract> => companiesService.createContract(...args),

    updateContract: (...args: Parameters<typeof companiesService.updateContract>): ReturnType<typeof companiesService.updateContract> => companiesService.updateContract(...args),

    deleteContract: (...args: Parameters<typeof companiesService.deleteContract>): ReturnType<typeof companiesService.deleteContract> => companiesService.deleteContract(...args),



    getUsers: (...args: Parameters<typeof usersService.getUsers>): ReturnType<typeof usersService.getUsers> => usersService.getUsers(...args),

    getDepartments: (...args: Parameters<typeof usersService.getDepartments>): ReturnType<typeof usersService.getDepartments> => usersService.getDepartments(...args),

    getDepartmentsByCompany: (...args: Parameters<typeof usersService.getDepartmentsByCompany>): ReturnType<typeof usersService.getDepartmentsByCompany> => usersService.getDepartmentsByCompany(...args),

    getDepartmentClientsIds: (...args: Parameters<typeof usersService.getDepartmentClientsIds>): ReturnType<typeof usersService.getDepartmentClientsIds> => usersService.getDepartmentClientsIds(...args),

    createDepartment: (...args: Parameters<typeof usersService.createDepartment>): ReturnType<typeof usersService.createDepartment> => usersService.createDepartment(...args),

    updateDepartment: (...args: Parameters<typeof usersService.updateDepartment>): ReturnType<typeof usersService.updateDepartment> => usersService.updateDepartment(...args),

    deleteDepartment: (...args: Parameters<typeof usersService.deleteDepartment>): ReturnType<typeof usersService.deleteDepartment> => usersService.deleteDepartment(...args),

    getTeams: (...args: Parameters<typeof usersService.getTeams>): ReturnType<typeof usersService.getTeams> => usersService.getTeams(...args),

    getTeamsByDepartment: (...args: Parameters<typeof usersService.getTeamsByDepartment>): ReturnType<typeof usersService.getTeamsByDepartment> => usersService.getTeamsByDepartment(...args),

    createTeam: (...args: Parameters<typeof usersService.createTeam>): ReturnType<typeof usersService.createTeam> => usersService.createTeam(...args),

    updateTeam: (...args: Parameters<typeof usersService.updateTeam>): ReturnType<typeof usersService.updateTeam> => usersService.updateTeam(...args),

    deleteTeam: (...args: Parameters<typeof usersService.deleteTeam>): ReturnType<typeof usersService.deleteTeam> => usersService.deleteTeam(...args),

    updateTeamOrders: (...args: Parameters<typeof usersService.updateTeamOrders>): ReturnType<typeof usersService.updateTeamOrders> => usersService.updateTeamOrders(...args),

    getActivities: (...args: Parameters<typeof orderConfigService.getActivities>): ReturnType<typeof orderConfigService.getActivities> => orderConfigService.getActivities(...args),



    createActivity: (...args: Parameters<typeof orderConfigService.createActivity>): ReturnType<typeof orderConfigService.createActivity> => orderConfigService.createActivity(...args),

    updateActivity: (...args: Parameters<typeof orderConfigService.updateActivity>): ReturnType<typeof orderConfigService.updateActivity> => orderConfigService.updateActivity(...args),

    deleteActivity: (...args: Parameters<typeof orderConfigService.deleteActivity>): ReturnType<typeof orderConfigService.deleteActivity> => orderConfigService.deleteActivity(...args),

    // -------------------------------------------------------------------------
    // PRIORITIES (cfg_orders_priorities)
    // -------------------------------------------------------------------------
    getPriorities: (...args: Parameters<typeof orderConfigService.getPriorities>): ReturnType<typeof orderConfigService.getPriorities> => orderConfigService.getPriorities(...args),

    createPriority: (...args: Parameters<typeof orderConfigService.createPriority>): ReturnType<typeof orderConfigService.createPriority> => orderConfigService.createPriority(...args),

    updatePriority: (...args: Parameters<typeof orderConfigService.updatePriority>): ReturnType<typeof orderConfigService.updatePriority> => orderConfigService.updatePriority(...args),

    deletePriority: (...args: Parameters<typeof orderConfigService.deletePriority>): ReturnType<typeof orderConfigService.deletePriority> => orderConfigService.deletePriority(...args),

    // -------------------------------------------------------------------------
    // ORDER TYPES (cfg_orders_types)
    // -------------------------------------------------------------------------
    getOrderTypes: (...args: Parameters<typeof orderConfigService.getOrderTypes>): ReturnType<typeof orderConfigService.getOrderTypes> => orderConfigService.getOrderTypes(...args),

    createOrderType: (...args: Parameters<typeof orderConfigService.createOrderType>): ReturnType<typeof orderConfigService.createOrderType> => orderConfigService.createOrderType(...args),

    updateOrderType: (...args: Parameters<typeof orderConfigService.updateOrderType>): ReturnType<typeof orderConfigService.updateOrderType> => orderConfigService.updateOrderType(...args),

    deleteOrderType: (...args: Parameters<typeof orderConfigService.deleteOrderType>): ReturnType<typeof orderConfigService.deleteOrderType> => orderConfigService.deleteOrderType(...args),

    // -------------------------------------------------------------------------
    // ORDER SUB-TYPES (cfg_orders_types_subs)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // ASSET ALERTS (assets_alerts)
    // -------------------------------------------------------------------------
    getAssetAlerts: (...args: Parameters<typeof assetsService.getAssetAlerts>): ReturnType<typeof assetsService.getAssetAlerts> => assetsService.getAssetAlerts(...args),
    getAllAssetAlerts: (...args: Parameters<typeof assetsService.getAllAssetAlerts>): ReturnType<typeof assetsService.getAllAssetAlerts> => assetsService.getAllAssetAlerts(...args),

    getAllActiveAssetAlerts: (...args: Parameters<typeof assetsService.getAllActiveAssetAlerts>): ReturnType<typeof assetsService.getAllActiveAssetAlerts> => assetsService.getAllActiveAssetAlerts(...args),

    createAssetAlert: (...args: Parameters<typeof assetsService.createAssetAlert>): ReturnType<typeof assetsService.createAssetAlert> => assetsService.createAssetAlert(...args),

    updateAssetAlert: (...args: Parameters<typeof assetsService.updateAssetAlert>): ReturnType<typeof assetsService.updateAssetAlert> => assetsService.updateAssetAlert(...args),

    deleteAssetAlert: (...args: Parameters<typeof assetsService.deleteAssetAlert>): ReturnType<typeof assetsService.deleteAssetAlert> => assetsService.deleteAssetAlert(...args),

    getOrderSubTypes: (...args: Parameters<typeof orderConfigService.getOrderSubTypes>): ReturnType<typeof orderConfigService.getOrderSubTypes> => orderConfigService.getOrderSubTypes(...args),

    getOrderSubTypesByType: (...args: Parameters<typeof orderConfigService.getOrderSubTypesByType>): ReturnType<typeof orderConfigService.getOrderSubTypesByType> => orderConfigService.getOrderSubTypesByType(...args),

    createOrderSubType: (...args: Parameters<typeof orderConfigService.createOrderSubType>): ReturnType<typeof orderConfigService.createOrderSubType> => orderConfigService.createOrderSubType(...args),

    updateOrderSubType: (...args: Parameters<typeof orderConfigService.updateOrderSubType>): ReturnType<typeof orderConfigService.updateOrderSubType> => orderConfigService.updateOrderSubType(...args),

    deleteOrderSubType: (...args: Parameters<typeof orderConfigService.deleteOrderSubType>): ReturnType<typeof orderConfigService.deleteOrderSubType> => orderConfigService.deleteOrderSubType(...args),

    // -------------------------------------------------------------------------
    // ORDER PLANS (cfg_orders_plans)
    // -------------------------------------------------------------------------
    getOrderPlans: (...args: Parameters<typeof orderConfigService.getOrderPlans>): ReturnType<typeof orderConfigService.getOrderPlans> => orderConfigService.getOrderPlans(...args),

    createOrderPlan: (...args: Parameters<typeof orderConfigService.createOrderPlan>): ReturnType<typeof orderConfigService.createOrderPlan> => orderConfigService.createOrderPlan(...args),

    updateOrderPlan: (...args: Parameters<typeof orderConfigService.updateOrderPlan>): ReturnType<typeof orderConfigService.updateOrderPlan> => orderConfigService.updateOrderPlan(...args),

    deleteOrderPlan: (...args: Parameters<typeof orderConfigService.deleteOrderPlan>): ReturnType<typeof orderConfigService.deleteOrderPlan> => orderConfigService.deleteOrderPlan(...args),

    // -------------------------------------------------------------------------
    // ORDER OBJECTS (cfg_orders_objects)
    // -------------------------------------------------------------------------
    getOrderObjects: (...args: Parameters<typeof orderConfigService.getOrderObjects>): ReturnType<typeof orderConfigService.getOrderObjects> => orderConfigService.getOrderObjects(...args),

    createOrderObject: (...args: Parameters<typeof orderConfigService.createOrderObject>): ReturnType<typeof orderConfigService.createOrderObject> => orderConfigService.createOrderObject(...args),

    updateOrderObject: (...args: Parameters<typeof orderConfigService.updateOrderObject>): ReturnType<typeof orderConfigService.updateOrderObject> => orderConfigService.updateOrderObject(...args),

    deleteOrderObject: (...args: Parameters<typeof orderConfigService.deleteOrderObject>): ReturnType<typeof orderConfigService.deleteOrderObject> => orderConfigService.deleteOrderObject(...args),

    linkActivityToOrderType: (...args: Parameters<typeof orderConfigService.linkActivityToOrderType>): ReturnType<typeof orderConfigService.linkActivityToOrderType> => orderConfigService.linkActivityToOrderType(...args),

    unlinkActivityFromOrderType: (...args: Parameters<typeof orderConfigService.unlinkActivityFromOrderType>): ReturnType<typeof orderConfigService.unlinkActivityFromOrderType> => orderConfigService.unlinkActivityFromOrderType(...args),

    getUsersByCompany: (...args: Parameters<typeof usersService.getUsersByCompany>): ReturnType<typeof usersService.getUsersByCompany> => usersService.getUsersByCompany(...args),

    getUsersByProfile: (...args: Parameters<typeof usersService.getUsersByProfile>): ReturnType<typeof usersService.getUsersByProfile> => usersService.getUsersByProfile(...args),

    getTeamsByCompany: (...args: Parameters<typeof usersService.getTeamsByCompany>): ReturnType<typeof usersService.getTeamsByCompany> => usersService.getTeamsByCompany(...args),

    getTeamMembers: (...args: Parameters<typeof usersService.getTeamMembers>): ReturnType<typeof usersService.getTeamMembers> => usersService.getTeamMembers(...args),

    searchUsers: (...args: Parameters<typeof usersService.searchUsers>): ReturnType<typeof usersService.searchUsers> => usersService.searchUsers(...args),

    searchVehicles: (...args: Parameters<typeof usersService.searchVehicles>): ReturnType<typeof usersService.searchVehicles> => usersService.searchVehicles(...args),

    getVehicle: (...args: Parameters<typeof usersService.getVehicle>): ReturnType<typeof usersService.getVehicle> => usersService.getVehicle(...args),

    getVehiclesCompaniesInfo: (...args: Parameters<typeof usersService.getVehiclesCompaniesInfo>): ReturnType<typeof usersService.getVehiclesCompaniesInfo> => usersService.getVehiclesCompaniesInfo(...args),

    getVehicles: (...args: Parameters<typeof vehiclesService.getVehicles>): ReturnType<typeof vehiclesService.getVehicles> => vehiclesService.getVehicles(...args),

    saveVehicle: (...args: Parameters<typeof vehiclesService.saveVehicle>): ReturnType<typeof vehiclesService.saveVehicle> => vehiclesService.saveVehicle(...args),

    deleteVehicle: (...args: Parameters<typeof vehiclesService.deleteVehicle>): ReturnType<typeof vehiclesService.deleteVehicle> => vehiclesService.deleteVehicle(...args),

    updateUserVehicle: (...args: Parameters<typeof usersService.updateUserVehicle>): ReturnType<typeof usersService.updateUserVehicle> => usersService.updateUserVehicle(...args),

    addUserToTeam: (...args: Parameters<typeof usersService.addUserToTeam>): ReturnType<typeof usersService.addUserToTeam> => usersService.addUserToTeam(...args),

    removeUserFromTeam: (...args: Parameters<typeof usersService.removeUserFromTeam>): ReturnType<typeof usersService.removeUserFromTeam> => usersService.removeUserFromTeam(...args),

    updateUserTeam: (...args: Parameters<typeof usersService.updateUserTeam>): ReturnType<typeof usersService.updateUserTeam> => usersService.updateUserTeam(...args),

    createUser: (...args: Parameters<typeof usersService.createUser>): ReturnType<typeof usersService.createUser> => usersService.createUser(...args),

    /** Usuário logado com cache de 30 s; { force: true } busca do servidor. */
    getCurrentUser: (...args: Parameters<typeof usersService.getCurrentUser>): ReturnType<typeof usersService.getCurrentUser> => usersService.getCurrentUser(...args),

    updateProfile: (...args: Parameters<typeof usersService.updateProfile>): ReturnType<typeof usersService.updateProfile> => usersService.updateProfile(...args),

    updatePhoneNumber: (...args: Parameters<typeof usersService.updatePhoneNumber>): ReturnType<typeof usersService.updatePhoneNumber> => usersService.updatePhoneNumber(...args),

    getMyPendingAccountDeletion: (...args: Parameters<typeof accountDeletionService.getMyPendingAccountDeletion>): ReturnType<typeof accountDeletionService.getMyPendingAccountDeletion> => accountDeletionService.getMyPendingAccountDeletion(...args),

    requestAccountDeletion: (...args: Parameters<typeof accountDeletionService.requestAccountDeletion>): ReturnType<typeof accountDeletionService.requestAccountDeletion> => accountDeletionService.requestAccountDeletion(...args),

    cancelAccountDeletion: (...args: Parameters<typeof accountDeletionService.cancelAccountDeletion>): ReturnType<typeof accountDeletionService.cancelAccountDeletion> => accountDeletionService.cancelAccountDeletion(...args),

    updateUserStatus: (...args: Parameters<typeof usersService.updateUserStatus>): ReturnType<typeof usersService.updateUserStatus> => usersService.updateUserStatus(...args),

    getUserStatuses: (...args: Parameters<typeof usersService.getUserStatuses>): ReturnType<typeof usersService.getUserStatuses> => usersService.getUserStatuses(...args),

    updateUserAvailability: (...args: Parameters<typeof usersService.updateUserAvailability>): ReturnType<typeof usersService.updateUserAvailability> => usersService.updateUserAvailability(...args),



    createCompanyProfile: (...args: Parameters<typeof companiesService.createCompanyProfile>): ReturnType<typeof companiesService.createCompanyProfile> => companiesService.createCompanyProfile(...args),

    updateCompanyProfile: (...args: Parameters<typeof companiesService.updateCompanyProfile>): ReturnType<typeof companiesService.updateCompanyProfile> => companiesService.updateCompanyProfile(...args),

    deleteCompanyProfile: (...args: Parameters<typeof companiesService.deleteCompanyProfile>): ReturnType<typeof companiesService.deleteCompanyProfile> => companiesService.deleteCompanyProfile(...args),

    // -------------------------------------------------------------------------
    // ROUTES & PERMISSIONS
    // -------------------------------------------------------------------------




    signIn: (...args: Parameters<typeof usersService.signIn>): ReturnType<typeof usersService.signIn> => usersService.signIn(...args),

    impersonateUser: (...args: Parameters<typeof usersService.impersonateUser>): ReturnType<typeof usersService.impersonateUser> => usersService.impersonateUser(...args),

    exitImpersonation: (...args: Parameters<typeof usersService.exitImpersonation>): ReturnType<typeof usersService.exitImpersonation> => usersService.exitImpersonation(...args),

    subscribeToAuthChanges: (...args: Parameters<typeof usersService.subscribeToAuthChanges>): ReturnType<typeof usersService.subscribeToAuthChanges> => usersService.subscribeToAuthChanges(...args),

    signOut: (...args: Parameters<typeof usersService.signOut>): ReturnType<typeof usersService.signOut> => usersService.signOut(...args),

    resetPassword: (...args: Parameters<typeof usersService.resetPassword>): ReturnType<typeof usersService.resetPassword> => usersService.resetPassword(...args),

    updatePassword: (...args: Parameters<typeof usersService.updatePassword>): ReturnType<typeof usersService.updatePassword> => usersService.updatePassword(...args),

    getClients: (...args: Parameters<typeof companiesService.getClients>): ReturnType<typeof companiesService.getClients> => companiesService.getClients(...args),

    createClient: (...args: Parameters<typeof companiesService.createClient>): ReturnType<typeof companiesService.createClient> => companiesService.createClient(...args),

    updateClient: (...args: Parameters<typeof companiesService.updateClient>): ReturnType<typeof companiesService.updateClient> => companiesService.updateClient(...args),

    deleteClient: (...args: Parameters<typeof companiesService.deleteClient>): ReturnType<typeof companiesService.deleteClient> => companiesService.deleteClient(...args),

    // -------------------------------------------------------------------------
    // SYSTEMS (cfg_systems)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // UNIT TYPES (cfg_units_types)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // UNITS (cfg_units)
    // -------------------------------------------------------------------------


    getUnitsByClient: (...args: Parameters<typeof companiesService.getUnitsByClient>): ReturnType<typeof companiesService.getUnitsByClient> => companiesService.getUnitsByClient(...args),

    searchUnits: (...args: Parameters<typeof unitsService.searchUnits>): ReturnType<typeof unitsService.searchUnits> => unitsService.searchUnits(...args),

    searchUnitsByClient: (...args: Parameters<typeof unitsService.searchUnitsByClient>): ReturnType<typeof unitsService.searchUnitsByClient> => unitsService.searchUnitsByClient(...args),

    getUnitById: (...args: Parameters<typeof unitsService.getUnitById>): ReturnType<typeof unitsService.getUnitById> => unitsService.getUnitById(...args),

    createUnit: (...args: Parameters<typeof unitsService.createUnit>): ReturnType<typeof unitsService.createUnit> => unitsService.createUnit(...args),

    updateUnit: (...args: Parameters<typeof unitsService.updateUnit>): ReturnType<typeof unitsService.updateUnit> => unitsService.updateUnit(...args),

    deleteUnit: (...args: Parameters<typeof unitsService.deleteUnit>): ReturnType<typeof unitsService.deleteUnit> => unitsService.deleteUnit(...args),

    // Services
    getServices: (...args: Parameters<typeof orderConfigService.getServices>): ReturnType<typeof orderConfigService.getServices> => orderConfigService.getServices(...args),

    createService: (...args: Parameters<typeof orderConfigService.createService>): ReturnType<typeof orderConfigService.createService> => orderConfigService.createService(...args),

    updateService: (...args: Parameters<typeof orderConfigService.updateService>): ReturnType<typeof orderConfigService.updateService> => orderConfigService.updateService(...args),

    // Orders
    /**
     * Get Active Orders (SS/OS) by unit asset tag ID
     */
    getActiveOrdersByAssetTagId: (...args: Parameters<typeof ordersService.getActiveOrdersByAssetTagId>): ReturnType<typeof ordersService.getActiveOrdersByAssetTagId> => ordersService.getActiveOrdersByAssetTagId(...args),
    
    /**
     * Mark a Service Order (SS) as completed (status 8)
     */
    completeServiceOrder: (...args: Parameters<typeof ordersService.completeServiceOrder>): ReturnType<typeof ordersService.completeServiceOrder> => ordersService.completeServiceOrder(...args),

    /**
     * Cancel Service Request (Order)
     * Sets status_id to 7 (Cancelled) and updates asset tracking fields.
     */
    cancelServiceOrder: (...args: Parameters<typeof ordersService.cancelServiceOrder>): ReturnType<typeof ordersService.cancelServiceOrder> => ordersService.cancelServiceOrder(...args),

    /**
     * Create Service Request (Order)
     * Implements the complete flow from flows/servicesRequests/create-service-request.flow
     */
    createServiceRequest: (...args: Parameters<typeof ordersService.createServiceRequest>): ReturnType<typeof ordersService.createServiceRequest> => ordersService.createServiceRequest(...args),




    getParentOrder: (...args: Parameters<typeof ordersService.getParentOrder>): ReturnType<typeof ordersService.getParentOrder> => ordersService.getParentOrder(...args),

    getChildOrders: (...args: Parameters<typeof ordersService.getChildOrders>): ReturnType<typeof ordersService.getChildOrders> => ordersService.getChildOrders(...args),

    createOrder: (...args: Parameters<typeof ordersService.createOrder>): ReturnType<typeof ordersService.createOrder> => ordersService.createOrder(...args),

    copyImagesFromOrderToOrder: (...args: Parameters<typeof ordersService.copyImagesFromOrderToOrder>): ReturnType<typeof ordersService.copyImagesFromOrderToOrder> => ordersService.copyImagesFromOrderToOrder(...args),

    uploadOrderImage: (...args: Parameters<typeof ordersService.uploadOrderImage>): ReturnType<typeof ordersService.uploadOrderImage> => ordersService.uploadOrderImage(...args),

    updateOrderImage: (...args: Parameters<typeof ordersService.updateOrderImage>): ReturnType<typeof ordersService.updateOrderImage> => ordersService.updateOrderImage(...args),

    updateOrder: (...args: Parameters<typeof ordersService.updateOrder>): ReturnType<typeof ordersService.updateOrder> => ordersService.updateOrder(...args),


    updateOrderFiles: (...args: Parameters<typeof ordersService.updateOrderFiles>): ReturnType<typeof ordersService.updateOrderFiles> => ordersService.updateOrderFiles(...args),

    updateOrderStatus: (...args: Parameters<typeof ordersService.updateOrderStatus>): ReturnType<typeof ordersService.updateOrderStatus> => ordersService.updateOrderStatus(...args),


    /**
     * Atualiza o status da Solicitação de Serviço (SS) com base no maior nível de prioridade
     * entre todas as suas Ordens de Serviço (OS) filhas.
     *
     * @param serviceRequestId - ID da SS a ser atualizada
     */
    updateServiceRequestStatus: (...args: Parameters<typeof ordersService.updateServiceRequestStatus>): ReturnType<typeof ordersService.updateServiceRequestStatus> => ordersService.updateServiceRequestStatus(...args),

    // Contract Services
    getContractServices: (...args: Parameters<typeof companiesService.getContractServices>): ReturnType<typeof companiesService.getContractServices> => companiesService.getContractServices(...args),


    addContractService: (...args: Parameters<typeof companiesService.addContractService>): ReturnType<typeof companiesService.addContractService> => companiesService.addContractService(...args),


    updateContractService: (...args: Parameters<typeof companiesService.updateContractService>): ReturnType<typeof companiesService.updateContractService> => companiesService.updateContractService(...args),

    deleteContractService: (...args: Parameters<typeof companiesService.deleteContractService>): ReturnType<typeof companiesService.deleteContractService> => companiesService.deleteContractService(...args),

    // -------------------------------------------------------------------------
    // CONTRACT MANAGERS (contracts_managers)
    // -------------------------------------------------------------------------
    getContractManagers: (...args: Parameters<typeof companiesService.getContractManagers>): ReturnType<typeof companiesService.getContractManagers> => companiesService.getContractManagers(...args),

    getManagedContracts: (...args: Parameters<typeof companiesService.getManagedContracts>): ReturnType<typeof companiesService.getManagedContracts> => companiesService.getManagedContracts(...args),

    isUserContractManager: (...args: Parameters<typeof companiesService.isUserContractManager>): ReturnType<typeof companiesService.isUserContractManager> => companiesService.isUserContractManager(...args),

    addContractManager: (...args: Parameters<typeof companiesService.addContractManager>): ReturnType<typeof companiesService.addContractManager> => companiesService.addContractManager(...args),

    removeContractManager: (...args: Parameters<typeof companiesService.removeContractManager>): ReturnType<typeof companiesService.removeContractManager> => companiesService.removeContractManager(...args),

    // -------------------------------------------------------------------------
    // EVALUATION REQUIREMENTS (cfg_evaluation_requirements)
    // -------------------------------------------------------------------------
    getEvaluationRequirements: (...args: Parameters<typeof evaluationService.getEvaluationRequirements>): ReturnType<typeof evaluationService.getEvaluationRequirements> => evaluationService.getEvaluationRequirements(...args),

    createEvaluationRequirement: (...args: Parameters<typeof evaluationService.createEvaluationRequirement>): ReturnType<typeof evaluationService.createEvaluationRequirement> => evaluationService.createEvaluationRequirement(...args),

    updateEvaluationRequirement: (...args: Parameters<typeof evaluationService.updateEvaluationRequirement>): ReturnType<typeof evaluationService.updateEvaluationRequirement> => evaluationService.updateEvaluationRequirement(...args),

    deleteEvaluationRequirement: (...args: Parameters<typeof evaluationService.deleteEvaluationRequirement>): ReturnType<typeof evaluationService.deleteEvaluationRequirement> => evaluationService.deleteEvaluationRequirement(...args),

    // -------------------------------------------------------------------------
    // CONTRACT EVALUATION REQUIREMENTS (contracts_evaluation_requirements)
    // -------------------------------------------------------------------------
    getContractEvaluationRequirements: (...args: Parameters<typeof evaluationService.getContractEvaluationRequirements>): ReturnType<typeof evaluationService.getContractEvaluationRequirements> => evaluationService.getContractEvaluationRequirements(...args),

    addEvaluationToContract: (...args: Parameters<typeof evaluationService.addEvaluationToContract>): ReturnType<typeof evaluationService.addEvaluationToContract> => evaluationService.addEvaluationToContract(...args),

    updateContractEvaluationWeight: (...args: Parameters<typeof evaluationService.updateContractEvaluationWeight>): ReturnType<typeof evaluationService.updateContractEvaluationWeight> => evaluationService.updateContractEvaluationWeight(...args),

    removeEvaluationFromContract: (...args: Parameters<typeof evaluationService.removeEvaluationFromContract>): ReturnType<typeof evaluationService.removeEvaluationFromContract> => evaluationService.removeEvaluationFromContract(...args),

    // -------------------------------------------------------------------------
    // VISIT EVALUATIONS (orders_visits_evaluations)
    // -------------------------------------------------------------------------
    getVisitEvaluations: (...args: Parameters<typeof evaluationService.getVisitEvaluations>): ReturnType<typeof evaluationService.getVisitEvaluations> => evaluationService.getVisitEvaluations(...args),

    saveVisitEvaluations: (...args: Parameters<typeof evaluationService.saveVisitEvaluations>): ReturnType<typeof evaluationService.saveVisitEvaluations> => evaluationService.saveVisitEvaluations(...args),

    getVisitTotalScore: (...args: Parameters<typeof evaluationService.getVisitTotalScore>): ReturnType<typeof evaluationService.getVisitTotalScore> => evaluationService.getVisitTotalScore(...args),

    deleteVisitEvaluations: (...args: Parameters<typeof evaluationService.deleteVisitEvaluations>): ReturnType<typeof evaluationService.deleteVisitEvaluations> => evaluationService.deleteVisitEvaluations(...args),

    canEvaluateVisit: (...args: Parameters<typeof evaluationService.canEvaluateVisit>): ReturnType<typeof evaluationService.canEvaluateVisit> => evaluationService.canEvaluateVisit(...args),

    // -------------------------------------------------------------------------
    // ASSETS AVAILABILITY NOTIFICATION (WhatsApp)
    // -------------------------------------------------------------------------
    /**
     * Grupo de WhatsApp configurado para o sistema (disponibilidade de ativos).
     * null = sistema sem grupo configurado → a mensagem não deve ser enviada.
     */
    getSystemWhatsAppGroupId: (...args: Parameters<typeof settingsService.getSystemWhatsAppGroupId>): ReturnType<typeof settingsService.getSystemWhatsAppGroupId> => settingsService.getSystemWhatsAppGroupId(...args),

    /**
     * Envia a mensagem de disponibilidade dos ativos para o grupo do sistema.
     * Retorna `{ sent, systemParentId, groupId, reason }` — `sent` false quando
     * o envio é ignorado (unidade sem sistema ou sistema sem grupo de WhatsApp
     * configurado); `systemParentId` é o `v_units.system_parent_id` usado na
     * resolução e `groupId` traz o valor de `systems_whatsapp_group_id`.
     */
    sendAssetAvailabilityWhatsAppMessage: (...args: Parameters<typeof assetAvailabilityNotificationService.sendAvailabilityMessage>): ReturnType<typeof assetAvailabilityNotificationService.sendAvailabilityMessage> => assetAvailabilityNotificationService.sendAvailabilityMessage(...args),

    getAssets: (...args: Parameters<typeof assetsService.getAssets>): ReturnType<typeof assetsService.getAssets> => assetsService.getAssets(...args),

    getFilteredAssets: (...args: Parameters<typeof assetsService.getFilteredAssets>): ReturnType<typeof assetsService.getFilteredAssets> => assetsService.getFilteredAssets(...args),

    createAsset: (...args: Parameters<typeof assetsService.createAsset>): ReturnType<typeof assetsService.createAsset> => assetsService.createAsset(...args),

    updateAsset: (...args: Parameters<typeof assetsService.updateAsset>): ReturnType<typeof assetsService.updateAsset> => assetsService.updateAsset(...args),

    uploadAssetImage: (...args: Parameters<typeof assetsService.uploadAssetImage>): ReturnType<typeof assetsService.uploadAssetImage> => assetsService.uploadAssetImage(...args),

    updateAssetPhotoFromReport: (...args: Parameters<typeof assetsService.updateAssetPhotoFromReport>): ReturnType<typeof assetsService.updateAssetPhotoFromReport> => assetsService.updateAssetPhotoFromReport(...args),

    getAssetById: (...args: Parameters<typeof assetsService.getAssetById>): ReturnType<typeof assetsService.getAssetById> => assetsService.getAssetById(...args),

    getAssetHistory: (...args: Parameters<typeof assetsService.getAssetHistory>): ReturnType<typeof assetsService.getAssetHistory> => assetsService.getAssetHistory(...args),

    /**
     * Atividades do ativo em visitas aprovadas (aba "Atividades" do Detalhe do Ativo).
     * O recorte por ano/mês é feito no cliente com `utils/assetActivityMatrix`.
     */
    getApprovedAssetActivities: (...args: Parameters<typeof assetsService.getApprovedAssetActivities>): ReturnType<typeof assetsService.getApprovedAssetActivities> => assetsService.getApprovedAssetActivities(...args),

    // -------------------------------------------------------------------------
    // ASSET TAGS (cfg_assets_tags)
    // -------------------------------------------------------------------------
    getAssetTypes: (...args: Parameters<typeof assetConfigService.getAssetTypes>): ReturnType<typeof assetConfigService.getAssetTypes> => assetConfigService.getAssetTypes(...args),

    createAssetType: (...args: Parameters<typeof assetConfigService.createAssetType>): ReturnType<typeof assetConfigService.createAssetType> => assetConfigService.createAssetType(...args),

    updateAssetType: (...args: Parameters<typeof assetConfigService.updateAssetType>): ReturnType<typeof assetConfigService.updateAssetType> => assetConfigService.updateAssetType(...args),

    deleteAssetType: (...args: Parameters<typeof assetConfigService.deleteAssetType>): ReturnType<typeof assetConfigService.deleteAssetType> => assetConfigService.deleteAssetType(...args),

    // -------------------------------------------------------------------------
    // ASSET STATUSES (cfg_assets_statuses)
    // -------------------------------------------------------------------------
    getAssetStatuses: (...args: Parameters<typeof assetConfigService.getAssetStatuses>): ReturnType<typeof assetConfigService.getAssetStatuses> => assetConfigService.getAssetStatuses(...args),

    createAssetStatus: (...args: Parameters<typeof assetConfigService.createAssetStatus>): ReturnType<typeof assetConfigService.createAssetStatus> => assetConfigService.createAssetStatus(...args),

    updateAssetStatus: (...args: Parameters<typeof assetConfigService.updateAssetStatus>): ReturnType<typeof assetConfigService.updateAssetStatus> => assetConfigService.updateAssetStatus(...args),

    deleteAssetStatus: (...args: Parameters<typeof assetConfigService.deleteAssetStatus>): ReturnType<typeof assetConfigService.deleteAssetStatus> => assetConfigService.deleteAssetStatus(...args),

    // -------------------------------------------------------------------------
    // ASSET PRIORITIES (cfg_assets_priorities)
    // -------------------------------------------------------------------------
    getAssetPriorities: (...args: Parameters<typeof assetConfigService.getAssetPriorities>): ReturnType<typeof assetConfigService.getAssetPriorities> => assetConfigService.getAssetPriorities(...args),

    createAssetPriority: (...args: Parameters<typeof assetConfigService.createAssetPriority>): ReturnType<typeof assetConfigService.createAssetPriority> => assetConfigService.createAssetPriority(...args),

    updateAssetPriority: (...args: Parameters<typeof assetConfigService.updateAssetPriority>): ReturnType<typeof assetConfigService.updateAssetPriority> => assetConfigService.updateAssetPriority(...args),

    deleteAssetPriority: (...args: Parameters<typeof assetConfigService.deleteAssetPriority>): ReturnType<typeof assetConfigService.deleteAssetPriority> => assetConfigService.deleteAssetPriority(...args),

    async getAssetTagsByUnit(unitId: string): Promise<AssetTag[]> {
        if (!unitId || unitId === 'null') {
            return [];
        }

        const { data, error } = await supabase
            .from('cfg_units_assets_tags')
            .select('id, asset_tag_tag_sub_description, is_active, asset_tag_id, asset_tag_sub_id')
            .eq('unit_id', unitId)
            .eq('is_active', 'true')
            .eq('is_deleted', 'false')
            .order('asset_tag_tag_sub_description');

        if (error) {
            console.error('Error fetching asset tags by unit:', error);
            throw error;
        }

        const mappedData = data.map(item => ({
            id: String(item.id ?? ''),
            code: '',
            description: item.asset_tag_tag_sub_description || '',
            isAvailable: !!item.is_active,
            // Armazena os IDs originais para persistência correta no ativo
            asset_tag_id: item.asset_tag_id,
            asset_tag_sub_id: item.asset_tag_sub_id
        } as any));

        return mappedData;
    },

    getUnitsAssetsByUnit: (...args: Parameters<typeof assetTagsService.getUnitsAssetsByUnit>): ReturnType<typeof assetTagsService.getUnitsAssetsByUnit> => assetTagsService.getUnitsAssetsByUnit(...args),
    getUniqueSectorsByUnit: (...args: Parameters<typeof assetTagsService.getUniqueSectorsByUnit>): ReturnType<typeof assetTagsService.getUniqueSectorsByUnit> => assetTagsService.getUniqueSectorsByUnit(...args),

    getUnitStructureNodes: (...args: Parameters<typeof assetTagsService.getUnitStructureNodes>): ReturnType<typeof assetTagsService.getUnitStructureNodes> => assetTagsService.getUnitStructureNodes(...args),
    updateUnitStructureParent: (...args: Parameters<typeof assetTagsService.updateUnitStructureParent>): ReturnType<typeof assetTagsService.updateUnitStructureParent> => assetTagsService.updateUnitStructureParent(...args),
    updateUnitStructureOrder: (...args: Parameters<typeof assetTagsService.updateUnitStructureOrder>): ReturnType<typeof assetTagsService.updateUnitStructureOrder> => assetTagsService.updateUnitStructureOrder(...args),
    linkUnitStructureNode: (...args: Parameters<typeof assetTagsService.linkUnitStructureNode>): ReturnType<typeof assetTagsService.linkUnitStructureNode> => assetTagsService.linkUnitStructureNode(...args),
    unlinkUnitStructureNode: (...args: Parameters<typeof assetTagsService.unlinkUnitStructureNode>): ReturnType<typeof assetTagsService.unlinkUnitStructureNode> => assetTagsService.unlinkUnitStructureNode(...args),
    getUnitAssetTagCascadeInfo: (...args: Parameters<typeof assetTagsService.getUnitAssetTagCascadeInfo>): ReturnType<typeof assetTagsService.getUnitAssetTagCascadeInfo> => assetTagsService.getUnitAssetTagCascadeInfo(...args),

    getAssetTags: (...args: Parameters<typeof assetTagsService.getAssetTags>): ReturnType<typeof assetTagsService.getAssetTags> => assetTagsService.getAssetTags(...args),

    createAssetTag: (...args: Parameters<typeof assetTagsService.createAssetTag>): ReturnType<typeof assetTagsService.createAssetTag> => assetTagsService.createAssetTag(...args),

    updateAssetTag: (...args: Parameters<typeof assetTagsService.updateAssetTag>): ReturnType<typeof assetTagsService.updateAssetTag> => assetTagsService.updateAssetTag(...args),

    deleteAssetTag: (...args: Parameters<typeof assetTagsService.deleteAssetTag>): ReturnType<typeof assetTagsService.deleteAssetTag> => assetTagsService.deleteAssetTag(...args),

    // ASSET TAG SUBS (Posições)
    getAssetTagSubs: (...args: Parameters<typeof assetTagsService.getAssetTagSubs>): ReturnType<typeof assetTagsService.getAssetTagSubs> => assetTagsService.getAssetTagSubs(...args),

    createAssetTagSub: (...args: Parameters<typeof assetTagsService.createAssetTagSub>): ReturnType<typeof assetTagsService.createAssetTagSub> => assetTagsService.createAssetTagSub(...args),

    updateAssetTagSub: (...args: Parameters<typeof assetTagsService.updateAssetTagSub>): ReturnType<typeof assetTagsService.updateAssetTagSub> => assetTagsService.updateAssetTagSub(...args),

    deleteAssetTagSub: (...args: Parameters<typeof assetTagsService.deleteAssetTagSub>): ReturnType<typeof assetTagsService.deleteAssetTagSub> => assetTagsService.deleteAssetTagSub(...args),

    // -------------------------------------------------------------------------
    // UNIT ASSET TAGS (Sectors)
    // -------------------------------------------------------------------------
    getUnitAssetTagsItems: (...args: Parameters<typeof assetTagsService.getUnitAssetTagsItems>): ReturnType<typeof assetTagsService.getUnitAssetTagsItems> => assetTagsService.getUnitAssetTagsItems(...args),

    getUnitAssetTagItemById: (...args: Parameters<typeof assetTagsService.getUnitAssetTagItemById>): ReturnType<typeof assetTagsService.getUnitAssetTagItemById> => assetTagsService.getUnitAssetTagItemById(...args),

    updateUnitAssetTagAvailability: (...args: Parameters<typeof assetTagsService.updateUnitAssetTagAvailability>): ReturnType<typeof assetTagsService.updateUnitAssetTagAvailability> => assetTagsService.updateUnitAssetTagAvailability(...args),

    updateUnitAssetTagImageRefs: (...args: Parameters<typeof assetTagsService.updateUnitAssetTagImageRefs>): ReturnType<typeof assetTagsService.updateUnitAssetTagImageRefs> => assetTagsService.updateUnitAssetTagImageRefs(...args),

    uploadAssetAvailableImageAfterInsert: (...args: Parameters<typeof assetTagsService.uploadAssetAvailableImageAfterInsert>): ReturnType<typeof assetTagsService.uploadAssetAvailableImageAfterInsert> => assetTagsService.uploadAssetAvailableImageAfterInsert(...args),

    getUnitAssetTagAvailabilityHistory: (...args: Parameters<typeof assetTagsService.getUnitAssetTagAvailabilityHistory>): ReturnType<typeof assetTagsService.getUnitAssetTagAvailabilityHistory> => assetTagsService.getUnitAssetTagAvailabilityHistory(...args),

    uploadUnitAssetTagImage: (...args: Parameters<typeof assetTagsService.uploadUnitAssetTagImage>): ReturnType<typeof assetTagsService.uploadUnitAssetTagImage> => assetTagsService.uploadUnitAssetTagImage(...args),

    subscribeToOrdersVisits(callback: (payload: any) => void) {
        const channelName = `orders_visits-changes-${Math.random().toString(36).substring(7)}`;
        return supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, callback)
            .subscribe();
    },

    getUnitAssetTags: (...args: Parameters<typeof assetTagsService.getUnitAssetTags>): ReturnType<typeof assetTagsService.getUnitAssetTags> => assetTagsService.getUnitAssetTags(...args),

    createUnitAssetTag: (...args: Parameters<typeof assetTagsService.createUnitAssetTag>): ReturnType<typeof assetTagsService.createUnitAssetTag> => assetTagsService.createUnitAssetTag(...args),

    updateUnitAssetTag: (...args: Parameters<typeof assetTagsService.updateUnitAssetTag>): ReturnType<typeof assetTagsService.updateUnitAssetTag> => assetTagsService.updateUnitAssetTag(...args),

    deleteUnitAssetTag: (...args: Parameters<typeof assetTagsService.deleteUnitAssetTag>): ReturnType<typeof assetTagsService.deleteUnitAssetTag> => assetTagsService.deleteUnitAssetTag(...args),

    // -------------------------------------------------------------------------
    // ASSET ATTRIBUTES (Dynamic Fields)
    // -------------------------------------------------------------------------
    getAssetAttributesByType: (...args: Parameters<typeof assetAttributesService.getAssetAttributesByType>): ReturnType<typeof assetAttributesService.getAssetAttributesByType> => assetAttributesService.getAssetAttributesByType(...args),

    getAssetAttributeValues: (...args: Parameters<typeof assetAttributesService.getAssetAttributeValues>): ReturnType<typeof assetAttributesService.getAssetAttributeValues> => assetAttributesService.getAssetAttributeValues(...args),

    saveAssetAttributeValues: (...args: Parameters<typeof assetAttributesService.saveAssetAttributeValues>): ReturnType<typeof assetAttributesService.saveAssetAttributeValues> => assetAttributesService.saveAssetAttributeValues(...args),

    createAssetAttribute: (...args: Parameters<typeof assetAttributesService.createAssetAttribute>): ReturnType<typeof assetAttributesService.createAssetAttribute> => assetAttributesService.createAssetAttribute(...args),

    updateAssetAttribute: (...args: Parameters<typeof assetAttributesService.updateAssetAttribute>): ReturnType<typeof assetAttributesService.updateAssetAttribute> => assetAttributesService.updateAssetAttribute(...args),

    deleteAssetAttribute: (...args: Parameters<typeof assetAttributesService.deleteAssetAttribute>): ReturnType<typeof assetAttributesService.deleteAssetAttribute> => assetAttributesService.deleteAssetAttribute(...args),

    // -------------------------------------------------------------------------
    // TYPE-ATTRIBUTE CONFIGURATION (cfg_assets_types_attributes)
    // -------------------------------------------------------------------------
    getAllAssetAttributes: (...args: Parameters<typeof assetAttributesService.getAllAssetAttributes>): ReturnType<typeof assetAttributesService.getAllAssetAttributes> => assetAttributesService.getAllAssetAttributes(...args),

    getAttributesNotLinkedToType: (...args: Parameters<typeof assetAttributesService.getAttributesNotLinkedToType>): ReturnType<typeof assetAttributesService.getAttributesNotLinkedToType> => assetAttributesService.getAttributesNotLinkedToType(...args),

    getTypeAttributeConfigs: (...args: Parameters<typeof assetAttributesService.getTypeAttributeConfigs>): ReturnType<typeof assetAttributesService.getTypeAttributeConfigs> => assetAttributesService.getTypeAttributeConfigs(...args),

    linkAttributeToType: (...args: Parameters<typeof assetAttributesService.linkAttributeToType>): ReturnType<typeof assetAttributesService.linkAttributeToType> => assetAttributesService.linkAttributeToType(...args),

    unlinkAttributeFromType: (...args: Parameters<typeof assetAttributesService.unlinkAttributeFromType>): ReturnType<typeof assetAttributesService.unlinkAttributeFromType> => assetAttributesService.unlinkAttributeFromType(...args),

    updateTypeAttributeConfig: (...args: Parameters<typeof assetAttributesService.updateTypeAttributeConfig>): ReturnType<typeof assetAttributesService.updateTypeAttributeConfig> => assetAttributesService.updateTypeAttributeConfig(...args),

    reorderTypeAttributes: (...args: Parameters<typeof assetAttributesService.reorderTypeAttributes>): ReturnType<typeof assetAttributesService.reorderTypeAttributes> => assetAttributesService.reorderTypeAttributes(...args),

    // -------------------------------------------------------------------------
    // ASSET ATTRIBUTE GROUPS (cfg_assets_attributes_groups)
    // -------------------------------------------------------------------------
    getAttributeGroups: (...args: Parameters<typeof assetAttributeGroupsService.getGroups>): ReturnType<typeof assetAttributeGroupsService.getGroups> => assetAttributeGroupsService.getGroups(...args),

    createAttributeGroup: (...args: Parameters<typeof assetAttributeGroupsService.createGroup>): ReturnType<typeof assetAttributeGroupsService.createGroup> => assetAttributeGroupsService.createGroup(...args),

    updateAttributeGroup: (...args: Parameters<typeof assetAttributeGroupsService.updateGroup>): ReturnType<typeof assetAttributeGroupsService.updateGroup> => assetAttributeGroupsService.updateGroup(...args),

    deleteAttributeGroup: (...args: Parameters<typeof assetAttributeGroupsService.deleteGroup>): ReturnType<typeof assetAttributeGroupsService.deleteGroup> => assetAttributeGroupsService.deleteGroup(...args),

    getAttributeOptionsByGroup: (...args: Parameters<typeof assetAttributeGroupsService.getOptionsByGroup>): ReturnType<typeof assetAttributeGroupsService.getOptionsByGroup> => assetAttributeGroupsService.getOptionsByGroup(...args),

    getAttributeOptionsAsSelect: (...args: Parameters<typeof assetAttributeGroupsService.getOptionsAsSelect>): ReturnType<typeof assetAttributeGroupsService.getOptionsAsSelect> => assetAttributeGroupsService.getOptionsAsSelect(...args),

    createAttributeOption: (...args: Parameters<typeof assetAttributeGroupsService.createOption>): ReturnType<typeof assetAttributeGroupsService.createOption> => assetAttributeGroupsService.createOption(...args),

    updateAttributeOption: (...args: Parameters<typeof assetAttributeGroupsService.updateOption>): ReturnType<typeof assetAttributeGroupsService.updateOption> => assetAttributeGroupsService.updateOption(...args),

    deleteAttributeOption: (...args: Parameters<typeof assetAttributeGroupsService.deleteOption>): ReturnType<typeof assetAttributeGroupsService.deleteOption> => assetAttributeGroupsService.deleteOption(...args),

    // -------------------------------------------------------------------------
    // FILE UPLOAD HELPERS
    // -------------------------------------------------------------------------

    recordProfileFaceCheck: (...args: Parameters<typeof usersService.recordProfileFaceCheck>): ReturnType<typeof usersService.recordProfileFaceCheck> => usersService.recordProfileFaceCheck(...args),

    notifyProfilePhotoRejected: (...args: Parameters<typeof notificationsService.notifyProfilePhotoRejected>): ReturnType<typeof notificationsService.notifyProfilePhotoRejected> => notificationsService.notifyProfilePhotoRejected(...args),

    uploadUserAvatar: (...args: Parameters<typeof usersService.uploadUserAvatar>): ReturnType<typeof usersService.uploadUserAvatar> => usersService.uploadUserAvatar(...args),

    uploadUserSignature: (...args: Parameters<typeof usersService.uploadUserSignature>): ReturnType<typeof usersService.uploadUserSignature> => usersService.uploadUserSignature(...args),

    updateUserSignature: (...args: Parameters<typeof usersService.updateUserSignature>): ReturnType<typeof usersService.updateUserSignature> => usersService.updateUserSignature(...args),

    deleteUserSignature: (...args: Parameters<typeof usersService.deleteUserSignature>): ReturnType<typeof usersService.deleteUserSignature> => usersService.deleteUserSignature(...args),

    getUserSignatureUrl(path: string, name: string): string {
        return this.getPublicImageUrl(path, name, { width: 600, height: 300, resize: 'contain' }) || '';
    },

    async uploadUnitImage(clientId: string, unitId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileName = `${Date.now()}.webp`;
        const folderPath = `clients/${clientId}/units/${unitId}`;
        const fullPath = `${folderPath}/${fileName}`;

        // Delete old image if exists (No R2, se desejar manter limpeza)
        try {
            const { data: existingUnit } = await supabase
                .from('units')
                .select('img_file_path, img_file_name')
                .eq('id', unitId)
                .single();

            if (existingUnit?.img_file_path && existingUnit?.img_file_name) {
                const oldPath = `${existingUnit.img_file_path}/${existingUnit.img_file_name}`;
                const { addVariantToPath } = await import('./media/imageUtils');
                await r2Service.deleteFiles([
                    oldPath,
                    addVariantToPath(oldPath, 'thumb'),
                    addVariantToPath(oldPath, 'medium'),
                ]);
            }
        } catch (cleanupError) {
            console.warn('⚠️ Could not delete old image (may not exist or permission error):', cleanupError);
        }

        try {
            const result = await r2Service.uploadImageWithVariants(file, fullPath, onProgress);
            return { path: folderPath, filename: result.filename };
        } catch (uploadError) {
            console.error('❌ Error uploading unit image to R2:', uploadError);
            throw uploadError;
        }
    },

    getNotificationsCount: (...args: Parameters<typeof notificationsService.getNotificationsCount>): ReturnType<typeof notificationsService.getNotificationsCount> => notificationsService.getNotificationsCount(...args),

    getNotifications: (...args: Parameters<typeof notificationsService.getNotifications>): ReturnType<typeof notificationsService.getNotifications> => notificationsService.getNotifications(...args),

    markNotificationAsRead: (...args: Parameters<typeof notificationsService.markNotificationAsRead>): ReturnType<typeof notificationsService.markNotificationAsRead> => notificationsService.markNotificationAsRead(...args),

    deleteNotification: (...args: Parameters<typeof notificationsService.deleteNotification>): ReturnType<typeof notificationsService.deleteNotification> => notificationsService.deleteNotification(...args),

    deleteVisitChatNotifications: (...args: Parameters<typeof notificationsService.deleteVisitChatNotifications>): ReturnType<typeof notificationsService.deleteVisitChatNotifications> => notificationsService.deleteVisitChatNotifications(...args),

    clearAllNotifications: (...args: Parameters<typeof notificationsService.clearAllNotifications>): ReturnType<typeof notificationsService.clearAllNotifications> => notificationsService.clearAllNotifications(...args),

    /** Lembrete mensal de lançamento de turnos (1×/mês, só admins super). */
    ensureMonthlyShiftsReminder: (...args: Parameters<typeof notificationsService.ensureMonthlyShiftsReminder>): ReturnType<typeof notificationsService.ensureMonthlyShiftsReminder> => notificationsService.ensureMonthlyShiftsReminder(...args),

    subscribeToNotifications(userId: string, onUpdate: (payload: any) => void) {
        return supabase
            .channel(`public:users_notifications:user_id_to=${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users_notifications',
                    filter: `user_id_to=eq.${userId}`
                },
                (payload) => {
                    onUpdate(payload);
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('❌ Realtime subscription error:', err);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ Realtime subscription failed. This might be due to WebSocket configuration in your self-hosted Supabase instance.');
                }
            });
    },

    getAssetByCode: (...args: Parameters<typeof assetsService.getAssetByCode>): ReturnType<typeof assetsService.getAssetByCode> => assetsService.getAssetByCode(...args),

    toggleAssetFollow: (...args: Parameters<typeof assetsService.toggleAssetFollow>): ReturnType<typeof assetsService.toggleAssetFollow> => assetsService.toggleAssetFollow(...args),

    getFollowedAssetIds: (...args: Parameters<typeof assetsService.getFollowedAssetIds>): ReturnType<typeof assetsService.getFollowedAssetIds> => assetsService.getFollowedAssetIds(...args),

    getSystemsParent: (...args: Parameters<typeof settingsService.getSystemsParent>): ReturnType<typeof settingsService.getSystemsParent> => settingsService.getSystemsParent(...args),

    getSystems: (...args: Parameters<typeof settingsService.getSystems>): ReturnType<typeof settingsService.getSystems> => settingsService.getSystems(...args),

    getUnitsAssetsTagsDashboard: (...args: Parameters<typeof assetsService.getUnitsAssetsTagsDashboard>): ReturnType<typeof assetsService.getUnitsAssetsTagsDashboard> => assetsService.getUnitsAssetsTagsDashboard(...args),

    getSystemsParentAssetsTagsAvailableRate: (...args: Parameters<typeof assetsService.getSystemsParentAssetsTagsAvailableRate>): ReturnType<typeof assetsService.getSystemsParentAssetsTagsAvailableRate> => assetsService.getSystemsParentAssetsTagsAvailableRate(...args),

    getUnitTypesParent: (...args: Parameters<typeof settingsService.getUnitTypesParent>): ReturnType<typeof settingsService.getUnitTypesParent> => settingsService.getUnitTypesParent(...args),

    getUnitTypes: (...args: Parameters<typeof settingsService.getUnitTypes>): ReturnType<typeof settingsService.getUnitTypes> => settingsService.getUnitTypes(...args),

    async getUnitsStatuses(): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_units_statuses')
            .select('*')
            .order('description');
        if (error) {
            console.error('Error fetching unit statuses:', error);
            return [];
        }
        return data || [];
    },

    getUnits: (...args: Parameters<typeof unitsService.getUnits>): ReturnType<typeof unitsService.getUnits> => unitsService.getUnits(...args),

    getUnitsForSearch: (...args: Parameters<typeof unitsService.getUnitsForSearch>): ReturnType<typeof unitsService.getUnitsForSearch> => unitsService.getUnitsForSearch(...args),

    getUnitsByIds: (...args: Parameters<typeof unitsService.getUnitsByIds>): ReturnType<typeof unitsService.getUnitsByIds> => unitsService.getUnitsByIds(...args),

    getFilteredUnits: (...args: Parameters<typeof unitsService.getFilteredUnits>): ReturnType<typeof unitsService.getFilteredUnits> => unitsService.getFilteredUnits(...args),

    /**
     * Get all units with coordinates for client-side proximity filtering.
     * Returns units with latitude/longitude for distance calculation.
     */
    getUnitsWithCoordinates: (...args: Parameters<typeof unitsService.getUnitsWithCoordinates>): ReturnType<typeof unitsService.getUnitsWithCoordinates> => unitsService.getUnitsWithCoordinates(...args),

    /**
     * Get nearby units using Supabase RPC (server-side Haversine).
     * Requires the nearby_units() function to be created in the database.
     * Falls back to client-side filtering if RPC is not available.
     */
    getNearbyUnits: (...args: Parameters<typeof unitsService.getNearbyUnits>): ReturnType<typeof unitsService.getNearbyUnits> => unitsService.getNearbyUnits(...args),

    getSubSystems: (...args: Parameters<typeof settingsService.getSubSystems>): ReturnType<typeof settingsService.getSubSystems> => settingsService.getSubSystems(...args),

    getAssetsTags: (...args: Parameters<typeof assetTagsService.getAssetsTags>): ReturnType<typeof assetTagsService.getAssetsTags> => assetTagsService.getAssetsTags(...args),



    getOrdersObjects: (...args: Parameters<typeof orderConfigService.getOrdersObjects>): ReturnType<typeof orderConfigService.getOrdersObjects> => orderConfigService.getOrdersObjects(...args),



    getPlans: (...args: Parameters<typeof orderConfigService.getPlans>): ReturnType<typeof orderConfigService.getPlans> => orderConfigService.getPlans(...args),

    getCancelReasons: (...args: Parameters<typeof orderConfigService.getCancelReasons>): ReturnType<typeof orderConfigService.getCancelReasons> => orderConfigService.getCancelReasons(...args),

    getSuspendedReasons: (...args: Parameters<typeof orderConfigService.getSuspendedReasons>): ReturnType<typeof orderConfigService.getSuspendedReasons> => orderConfigService.getSuspendedReasons(...args),

    getOrderCauseReasons: (...args: Parameters<typeof orderConfigService.getOrderCauseReasons>): ReturnType<typeof orderConfigService.getOrderCauseReasons> => orderConfigService.getOrderCauseReasons(...args),

    // -------------------------------------------------------------------------
    // VEHICLE COST TYPES (cfg_vehicles_costs_types — rateio de aluguel)
    // -------------------------------------------------------------------------
    getVehicleCostTypes: (...args: Parameters<typeof orderConfigService.getVehicleCostTypes>): ReturnType<typeof orderConfigService.getVehicleCostTypes> => orderConfigService.getVehicleCostTypes(...args),

    saveVehicleCostType: (...args: Parameters<typeof orderConfigService.saveVehicleCostType>): ReturnType<typeof orderConfigService.saveVehicleCostType> => orderConfigService.saveVehicleCostType(...args),

    deleteVehicleCostType: (...args: Parameters<typeof orderConfigService.deleteVehicleCostType>): ReturnType<typeof orderConfigService.deleteVehicleCostType> => orderConfigService.deleteVehicleCostType(...args),


    getTeamLeader: (...args: Parameters<typeof usersService.getTeamLeader>): ReturnType<typeof usersService.getTeamLeader> => usersService.getTeamLeader(...args),

    setTeamLeader: (...args: Parameters<typeof usersService.setTeamLeader>): ReturnType<typeof usersService.setTeamLeader> => usersService.setTeamLeader(...args),

    getOpenOrdersForOffline: (...args: Parameters<typeof ordersService.getOpenOrdersForOffline>): ReturnType<typeof ordersService.getOpenOrdersForOffline> => ordersService.getOpenOrdersForOffline(...args),
    getOpenOrdersByUnit: (...args: Parameters<typeof ordersService.getOpenOrdersByUnit>): ReturnType<typeof ordersService.getOpenOrdersByUnit> => ordersService.getOpenOrdersByUnit(...args),

    getOrderByMask: (...args: Parameters<typeof ordersService.getOrderByMask>): ReturnType<typeof ordersService.getOrderByMask> => ordersService.getOrderByMask(...args),

    getOrdersFilters: (...args: Parameters<typeof ordersService.getOrdersFilters>): ReturnType<typeof ordersService.getOrdersFilters> => ordersService.getOrdersFilters(...args),

    getOrdersVisitsAssetsWithProvider: (...args: Parameters<typeof ordersService.getOrdersVisitsAssetsWithProvider>): ReturnType<typeof ordersService.getOrdersVisitsAssetsWithProvider> => ordersService.getOrdersVisitsAssetsWithProvider(...args),

     /** Mudanças em public.orders. Passe `{ orderId }` para ouvir uma OS só (filtro no servidor). */
     subscribeToOrders: (callback: (payload: any) => void, options: { orderId?: string } = {}) => {
         const channelId = `orders-changes-${Math.random().toString(36).substring(2)}`;
         const orderId = options.orderId && /^\d+$/.test(options.orderId) ? options.orderId : null;
         let retryTimeout: ReturnType<typeof setTimeout> | null = null;
         let disposed = false;
         let retryCount = 0;
         const MAX_RETRIES = 5;

         const subscribe = () => {
             if (disposed) return null;
             return supabase
                 .channel(channelId)
                 .on('postgres_changes', {
                     event: '*',
                     schema: 'public',
                     table: 'orders',
                     ...(orderId ? { filter: `id=eq.${orderId}` } : {}),
                 }, (payload) => {
                     retryCount = 0;
                     callback(payload);
                 })
                 .subscribe((status, err) => {
                     if (err) console.error('❌ [Meu Painel] orders subscription error:', err);
                     if (status === 'SUBSCRIBED') {
                         retryCount = 0;
                     }
                     if (status === 'CHANNEL_ERROR') {
                         if (retryCount >= MAX_RETRIES) {
                             console.error(`❌ [Meu Painel] orders subscription gave up after ${MAX_RETRIES} retries`);
                             return;
                         }
                         retryCount++;
                         const delay = Math.min(3000 * Math.pow(2, retryCount - 1), 30000);
                         console.warn(`⚠️ [Meu Painel] orders subscription error, reconnecting in ${Math.round(delay/1000)}s (attempt ${retryCount}/${MAX_RETRIES})...`);
                         if (!disposed) {
                             retryTimeout = setTimeout(() => {
                                 supabase.removeChannel(channel);
                                 channel = subscribe();
                             }, delay);
                         }
                     }
                 });
         };

         let channel: ReturnType<typeof subscribe> = subscribe();

         return {
             unsubscribe: () => {
                 disposed = true;
                 if (retryTimeout) clearTimeout(retryTimeout);
                 if (channel) supabase.removeChannel(channel);
             }
         } as any;
     },

     subscribeToVisits: (callback: (payload: any) => void) => {
         const channelId = `visits-changes-${Math.random().toString(36).substring(2)}`;
         let retryTimeout: ReturnType<typeof setTimeout> | null = null;
         let disposed = false;
         let retryCount = 0;
         const MAX_RETRIES = 5;

         const subscribe = () => {
             if (disposed) return null;
             return supabase
                 .channel(channelId)
                 .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, (payload) => {
                     retryCount = 0;
                     callback(payload);
                 })
                 .subscribe((status, err) => {
                     if (err) console.error('❌ [Meu Painel] visits subscription error:', err);
                     if (status === 'SUBSCRIBED') {
                         retryCount = 0;
                     }
                     if (status === 'CHANNEL_ERROR') {
                         if (retryCount >= MAX_RETRIES) {
                             console.error(`❌ [Meu Painel] visits subscription gave up after ${MAX_RETRIES} retries`);
                             return;
                         }
                         retryCount++;
                         const delay = Math.min(3000 * Math.pow(2, retryCount - 1), 30000);
                         console.warn(`⚠️ [Meu Painel] visits subscription error, reconnecting in ${Math.round(delay/1000)}s (attempt ${retryCount}/${MAX_RETRIES})...`);
                         if (!disposed) {
                             retryTimeout = setTimeout(() => {
                                 supabase.removeChannel(channel);
                                 channel = subscribe();
                             }, delay);
                         }
                     }
                 });
         };

         let channel: ReturnType<typeof subscribe> = subscribe();

         return {
             unsubscribe: () => {
                 disposed = true;
                 if (retryTimeout) clearTimeout(retryTimeout);
                 if (channel) supabase.removeChannel(channel);
             }
         } as any;
     },

    getOrderById: (...args: Parameters<typeof ordersService.getOrderById>): ReturnType<typeof ordersService.getOrderById> => ordersService.getOrderById(...args),

    getFollowedOrderIds: (...args: Parameters<typeof ordersService.getFollowedOrderIds>): ReturnType<typeof ordersService.getFollowedOrderIds> => ordersService.getFollowedOrderIds(...args),

    toggleOrderFollow: (...args: Parameters<typeof ordersService.toggleOrderFollow>): ReturnType<typeof ordersService.toggleOrderFollow> => ordersService.toggleOrderFollow(...args),

    getDashboardStats: (...args: Parameters<typeof ordersService.getDashboardStats>): ReturnType<typeof ordersService.getDashboardStats> => ordersService.getDashboardStats(...args),

    // ---------------------------------------------------------------------
    // OCIOSIDADE / TURNOS DAS EQUIPES (aba OCIOSIDADE)
    // ---------------------------------------------------------------------

    /** Ociosidade + turnos por equipe no mês (escopo: departamento do usuário). */
    getTeamShiftsStats: (...args: Parameters<typeof dashboardService.getTeamShiftsStats>): ReturnType<typeof dashboardService.getTeamShiftsStats> => dashboardService.getTeamShiftsStats(...args),

    /** Lançamentos manuais de turnos do mês de competência. */
    getTeamShiftsRecords: (...args: Parameters<typeof teamShiftsRecordsService.getTeamShiftsRecords>): ReturnType<typeof teamShiftsRecordsService.getTeamShiftsRecords> => teamShiftsRecordsService.getTeamShiftsRecords(...args),

    /** Marca turnos normais e extras por equipe e dia útil da competência. */
    getTeamShiftsCalendar: (...args: Parameters<typeof teamShiftsRecordsService.getTeamShiftsCalendar>): ReturnType<typeof teamShiftsRecordsService.getTeamShiftsCalendar> => teamShiftsRecordsService.getTeamShiftsCalendar(...args),

    /** Salva o calendário diário e sincroniza os totais mensais atomicamente. */
    saveTeamShiftsCalendar: (...args: Parameters<typeof teamShiftsRecordsService.saveTeamShiftsCalendar>): ReturnType<typeof teamShiftsRecordsService.saveTeamShiftsCalendar> => teamShiftsRecordsService.saveTeamShiftsCalendar(...args),

    /** Salva o lançamento do mês em lote (remove lançamentos zerados; erro se fechado). */
    saveTeamShiftsRecords: (...args: Parameters<typeof teamShiftsRecordsService.saveTeamShiftsRecords>): ReturnType<typeof teamShiftsRecordsService.saveTeamShiftsRecords> => teamShiftsRecordsService.saveTeamShiftsRecords(...args),

    /** Fechamento de competência do mês (null = aberto). */
    getTeamShiftsMonthLock: (...args: Parameters<typeof teamShiftsRecordsService.getMonthLock>): ReturnType<typeof teamShiftsRecordsService.getMonthLock> => teamShiftsRecordsService.getMonthLock(...args),

    /** Fecha a competência do mês (idempotente). */
    lockTeamShiftsMonth: (...args: Parameters<typeof teamShiftsRecordsService.lockMonth>): ReturnType<typeof teamShiftsRecordsService.lockMonth> => teamShiftsRecordsService.lockMonth(...args),

    /** Reabre a competência removendo o registro de fechamento. */
    unlockTeamShiftsMonth: (...args: Parameters<typeof teamShiftsRecordsService.unlockMonth>): ReturnType<typeof teamShiftsRecordsService.unlockMonth> => teamShiftsRecordsService.unlockMonth(...args),

    getUnscheduledSS: (...args: Parameters<typeof ordersService.getUnscheduledSS>): ReturnType<typeof ordersService.getUnscheduledSS> => ordersService.getUnscheduledSS(...args),

    getOpenSS: (...args: Parameters<typeof ordersService.getOpenSS>): ReturnType<typeof ordersService.getOpenSS> => ordersService.getOpenSS(...args),

    getOpenOS: (...args: Parameters<typeof ordersService.getOpenOS>): ReturnType<typeof ordersService.getOpenOS> => ordersService.getOpenOS(...args),

    getCompletedOS: (...args: Parameters<typeof ordersService.getCompletedOS>): ReturnType<typeof ordersService.getCompletedOS> => ordersService.getCompletedOS(...args),

    getCompletedOSCounts: (...args: Parameters<typeof ordersService.getCompletedOSCounts>): ReturnType<typeof ordersService.getCompletedOSCounts> => ordersService.getCompletedOSCounts(...args),

    getCompletedSS: (...args: Parameters<typeof ordersService.getCompletedSS>): ReturnType<typeof ordersService.getCompletedSS> => ordersService.getCompletedSS(...args),

    getCanceledSS: (...args: Parameters<typeof ordersService.getCanceledSS>): ReturnType<typeof ordersService.getCanceledSS> => ordersService.getCanceledSS(...args),

    updateSystem: (...args: Parameters<typeof settingsService.updateSystem>): ReturnType<typeof settingsService.updateSystem> => settingsService.updateSystem(...args),

    createSystem: (...args: Parameters<typeof settingsService.createSystem>): ReturnType<typeof settingsService.createSystem> => settingsService.createSystem(...args),

    updateUnitType: (...args: Parameters<typeof settingsService.updateUnitType>): ReturnType<typeof settingsService.updateUnitType> => settingsService.updateUnitType(...args),

    createUnitType: (...args: Parameters<typeof settingsService.createUnitType>): ReturnType<typeof settingsService.createUnitType> => settingsService.createUnitType(...args),

    /**
     * Mudanças em public.users. ATENÇÃO: o rastreamento atualiza a posição de
     * cada usuário a cada 30–60 s, então sem filtro isto dispara o tempo todo.
     * - Para ouvir um usuário só, passe `{ userId }` (filtro no servidor).
     * - Para telas que apenas recarregam dados, use subscribeToUsersThrottled.
     */
    subscribeToUsers(callback: (payload: any) => void, options: { userId?: string } = {}) {
        const channelName = `users-changes-${Math.random().toString(36).substring(7)}`;
        const userId = options.userId && /^\d+$/.test(options.userId) ? options.userId : null;
        return supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    ...(userId ? { filter: `id=eq.${userId}` } : {}),
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    },

    /**
     * Igual a subscribeToUsers, mas chama o callback no máximo uma vez a cada
     * `minIntervalMs` (agrupa a rajada de atualizações de posição numa única
     * recarga). Para telas que refazem consultas a cada mudança.
     */
    subscribeToUsersThrottled(callback: () => void, minIntervalMs: number = 30_000) {
        let lastRunAt = 0;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const run = () => {
            timer = null;
            lastRunAt = Date.now();
            callback();
        };
        const channelName = `users-changes-throttled-${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                if (timer) return;
                const wait = Math.max(0, minIntervalMs - (Date.now() - lastRunAt));
                timer = setTimeout(run, wait);
            })
            .subscribe();
        return {
            unsubscribe: () => {
                if (timer) clearTimeout(timer);
                timer = null;
                supabase.removeChannel(channel);
            },
        };
    },

    getOrdersByTeam: (...args: Parameters<typeof ordersService.getOrdersByTeam>): ReturnType<typeof ordersService.getOrdersByTeam> => ordersService.getOrdersByTeam(...args),

    getOrdersByLeader: (...args: Parameters<typeof ordersService.getOrdersByLeader>): ReturnType<typeof ordersService.getOrdersByLeader> => ordersService.getOrdersByLeader(...args),

    hasActiveVisits: (...args: Parameters<typeof ordersService.hasActiveVisits>): ReturnType<typeof ordersService.hasActiveVisits> => ordersService.hasActiveVisits(...args),

    getAvailableTeamMembers: (...args: Parameters<typeof ordersService.getAvailableTeamMembers>): ReturnType<typeof ordersService.getAvailableTeamMembers> => ordersService.getAvailableTeamMembers(...args),

    getActiveUsers: (...args: Parameters<typeof usersService.getActiveUsers>): ReturnType<typeof usersService.getActiveUsers> => usersService.getActiveUsers(...args),

    authorizeOrder: (...args: Parameters<typeof ordersService.authorizeOrder>): ReturnType<typeof ordersService.authorizeOrder> => ordersService.authorizeOrder(...args),

    // ── Programação Diária (services/orders/dailyScheduleService.ts) ──────────
    getDailyScheduleBoard: (...args: Parameters<typeof dailyScheduleService.getBoard>): ReturnType<typeof dailyScheduleService.getBoard> => dailyScheduleService.getBoard(...args),

    saveDailySchedule: (...args: Parameters<typeof dailyScheduleService.saveSchedule>): ReturnType<typeof dailyScheduleService.saveSchedule> => dailyScheduleService.saveSchedule(...args),

    getMyDaySchedule: (...args: Parameters<typeof dailyScheduleService.getMyDaySchedule>): ReturnType<typeof dailyScheduleService.getMyDaySchedule> => dailyScheduleService.getMyDaySchedule(...args),

    saveOrderPriorities: (...args: Parameters<typeof dailyScheduleService.savePriorities>): ReturnType<typeof dailyScheduleService.savePriorities> => dailyScheduleService.savePriorities(...args),

    logDailyScheduleMove: (...args: Parameters<typeof dailyScheduleService.logMove>): ReturnType<typeof dailyScheduleService.logMove> => dailyScheduleService.logMove(...args),

    authorizeOrderToScheduleTeam: (...args: Parameters<typeof dailyScheduleService.authorizeToTeam>): ReturnType<typeof dailyScheduleService.authorizeToTeam> => dailyScheduleService.authorizeToTeam(...args),

    moveAuthorizedOrderToScheduleTeam: (...args: Parameters<typeof dailyScheduleService.moveAuthorizedToTeam>): ReturnType<typeof dailyScheduleService.moveAuthorizedToTeam> => dailyScheduleService.moveAuthorizedToTeam(...args),

    hasActiveChildOrders: (...args: Parameters<typeof ordersService.hasActiveChildOrders>): ReturnType<typeof ordersService.hasActiveChildOrders> => ordersService.hasActiveChildOrders(...args),

    cancelOrder: (...args: Parameters<typeof ordersService.cancelOrder>): ReturnType<typeof ordersService.cancelOrder> => ordersService.cancelOrder(...args),


    scheduleOrder: (...args: Parameters<typeof ordersService.scheduleOrder>): ReturnType<typeof ordersService.scheduleOrder> => ordersService.scheduleOrder(...args),


    updateOrderTeam: (...args: Parameters<typeof ordersService.updateOrderTeam>): ReturnType<typeof ordersService.updateOrderTeam> => ordersService.updateOrderTeam(...args),


    getLeadersByCompany: (...args: Parameters<typeof companiesService.getLeadersByCompany>): ReturnType<typeof companiesService.getLeadersByCompany> => companiesService.getLeadersByCompany(...args),

    getTodayVisitsByCompany: (...args: Parameters<typeof companiesService.getTodayVisitsByCompany>): ReturnType<typeof companiesService.getTodayVisitsByCompany> => companiesService.getTodayVisitsByCompany(...args),

    getVisitsByTeam: (...args: Parameters<typeof visitsService.getVisitsByTeam>): ReturnType<typeof visitsService.getVisitsByTeam> => visitsService.getVisitsByTeam(...args),

    getVisitsByLeader: (...args: Parameters<typeof visitsService.getVisitsByLeader>): ReturnType<typeof visitsService.getVisitsByLeader> => visitsService.getVisitsByLeader(...args),

    getVisitsByChatCreator: (...args: Parameters<typeof visitsService.getVisitsByChatCreator>): ReturnType<typeof visitsService.getVisitsByChatCreator> => visitsService.getVisitsByChatCreator(...args),

    getOpenChatVisitsForUser: (...args: Parameters<typeof visitsService.getOpenChatVisitsForUser>): ReturnType<typeof visitsService.getOpenChatVisitsForUser> => visitsService.getOpenChatVisitsForUser(...args),

    startOrderVisit: (...args: Parameters<typeof visitsService.startOrderVisit>): ReturnType<typeof visitsService.startOrderVisit> => visitsService.startOrderVisit(...args),
    getReassignPreview: (...args: Parameters<typeof visitsService.getReassignPreview>): ReturnType<typeof visitsService.getReassignPreview> => visitsService.getReassignPreview(...args),
    reassignOrderVisit: (...args: Parameters<typeof visitsService.reassignOrderVisit>): ReturnType<typeof visitsService.reassignOrderVisit> => visitsService.reassignOrderVisit(...args),

    getActiveOrderVisit: (...args: Parameters<typeof visitsService.getActiveOrderVisit>): ReturnType<typeof visitsService.getActiveOrderVisit> => visitsService.getActiveOrderVisit(...args),

    getOfflineChangeVersions: (...args: Parameters<typeof offlineVersionsService.getOfflineChangeVersions>): ReturnType<typeof offlineVersionsService.getOfflineChangeVersions> => offlineVersionsService.getOfflineChangeVersions(...args),
    getOpenVisitIdsByUser: (...args: Parameters<typeof visitsService.getOpenVisitIdsByUser>): ReturnType<typeof visitsService.getOpenVisitIdsByUser> => visitsService.getOpenVisitIdsByUser(...args),
    getOrderVisitTeam: (...args: Parameters<typeof visitsService.getOrderVisitTeam>): ReturnType<typeof visitsService.getOrderVisitTeam> => visitsService.getOrderVisitTeam(...args),

    getOrdersVisitsTeamsBulk: (...args: Parameters<typeof visitsService.getOrdersVisitsTeamsBulk>): ReturnType<typeof visitsService.getOrdersVisitsTeamsBulk> => visitsService.getOrdersVisitsTeamsBulk(...args),

    getProviderCompanyByOvAssetId: (...args: Parameters<typeof companiesService.getProviderCompanyByOvAssetId>): ReturnType<typeof companiesService.getProviderCompanyByOvAssetId> => companiesService.getProviderCompanyByOvAssetId(...args),

    removeTeamMember: (...args: Parameters<typeof visitsService.removeTeamMember>): ReturnType<typeof visitsService.removeTeamMember> => visitsService.removeTeamMember(...args),

    addTeamMember: (...args: Parameters<typeof visitsService.addTeamMember>): ReturnType<typeof visitsService.addTeamMember> => visitsService.addTeamMember(...args),

    getVisitsByOrderId: (...args: Parameters<typeof visitsService.getVisitsByOrderId>): ReturnType<typeof visitsService.getVisitsByOrderId> => visitsService.getVisitsByOrderId(...args),

    getVisitsByParentOrderId: (...args: Parameters<typeof visitsService.getVisitsByParentOrderId>): ReturnType<typeof visitsService.getVisitsByParentOrderId> => visitsService.getVisitsByParentOrderId(...args),

    getVisitsByContractId: (...args: Parameters<typeof visitsService.getVisitsByContractId>): ReturnType<typeof visitsService.getVisitsByContractId> => visitsService.getVisitsByContractId(...args),


    getAssetsUnavailableReasons: (...args: Parameters<typeof assetTagsService.getAssetsUnavailableReasons>): ReturnType<typeof assetTagsService.getAssetsUnavailableReasons> => assetTagsService.getAssetsUnavailableReasons(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT
    // -------------------------------------------------------------------------
    getOrderVisitById: (...args: Parameters<typeof visitsService.getOrderVisitById>): ReturnType<typeof visitsService.getOrderVisitById> => visitsService.getOrderVisitById(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT VEHICLES (orders_visits_vehicles)
    // -------------------------------------------------------------------------
    getOrderVisitVehicles: (...args: Parameters<typeof visitsService.getOrderVisitVehicles>): ReturnType<typeof visitsService.getOrderVisitVehicles> => visitsService.getOrderVisitVehicles(...args),

    addVehicleToOrderVisit: (...args: Parameters<typeof visitsService.addVehicleToOrderVisit>): ReturnType<typeof visitsService.addVehicleToOrderVisit> => visitsService.addVehicleToOrderVisit(...args),

    /**
     * Registra a ociosidade do veículo parado (contrato só-aluguel) na
     * visita, com competência explícita (YYYY-MM ou YYYY-MM-DD).
     */
    addIdleToOrderVisit: (...args: Parameters<typeof visitsService.addIdleToOrderVisit>): ReturnType<typeof visitsService.addIdleToOrderVisit> => visitsService.addIdleToOrderVisit(...args),
    // -------------------------------------------------------------------------
    // VEHICLE RENTAL APPORTIONMENT (rateio de aluguel veicular)
    // -------------------------------------------------------------------------
    getRentalContracts: (...args: Parameters<typeof vehicleRentalService.getContracts>): ReturnType<typeof vehicleRentalService.getContracts> => vehicleRentalService.getContracts(...args),

    saveRentalContract: (...args: Parameters<typeof vehicleRentalService.saveContract>): ReturnType<typeof vehicleRentalService.saveContract> => vehicleRentalService.saveContract(...args),

    deleteRentalContract: (...args: Parameters<typeof vehicleRentalService.deleteContract>): ReturnType<typeof vehicleRentalService.deleteContract> => vehicleRentalService.deleteContract(...args),

    getRentalExpenses: (...args: Parameters<typeof vehicleRentalService.getExpenses>): ReturnType<typeof vehicleRentalService.getExpenses> => vehicleRentalService.getExpenses(...args),

    saveRentalExpense: (...args: Parameters<typeof vehicleRentalService.saveExpense>): ReturnType<typeof vehicleRentalService.saveExpense> => vehicleRentalService.saveExpense(...args),

    deleteRentalExpense: (...args: Parameters<typeof vehicleRentalService.deleteExpense>): ReturnType<typeof vehicleRentalService.deleteExpense> => vehicleRentalService.deleteExpense(...args),

    getFuelExpensesByUser: (...args: Parameters<typeof vehicleRentalService.getFuelExpensesByUser>): ReturnType<typeof vehicleRentalService.getFuelExpensesByUser> => vehicleRentalService.getFuelExpensesByUser(...args),

    getMaxVehicleOdometer: (...args: Parameters<typeof vehicleRentalService.getMaxVehicleOdometer>): ReturnType<typeof vehicleRentalService.getMaxVehicleOdometer> => vehicleRentalService.getMaxVehicleOdometer(...args),

    /**
     * Km final do ÚLTIMO LANÇAMENTO anterior do mesmo veículo, excluindo o
     * registro atual (`v_orders_visits_vehicles.id`).
     */
    getPreviousVehicleOdometer: (...args: Parameters<typeof vehicleRentalService.getPreviousVehicleOdometer>): ReturnType<typeof vehicleRentalService.getPreviousVehicleOdometer> => vehicleRentalService.getPreviousVehicleOdometer(...args),

    uploadFuelExpenseImages: (...args: Parameters<typeof vehicleRentalService.uploadFuelExpenseImages>): ReturnType<typeof vehicleRentalService.uploadFuelExpenseImages> => vehicleRentalService.uploadFuelExpenseImages(...args),

    getRentalContractInfo: (...args: Parameters<typeof vehicleRentalService.getContractInfo>): ReturnType<typeof vehicleRentalService.getContractInfo> => vehicleRentalService.getContractInfo(...args),

    getRentalSummary: (...args: Parameters<typeof vehicleRentalService.getSummary>): ReturnType<typeof vehicleRentalService.getSummary> => vehicleRentalService.getSummary(...args),

    getRentalDetail: (...args: Parameters<typeof vehicleRentalService.getDetail>): ReturnType<typeof vehicleRentalService.getDetail> => vehicleRentalService.getDetail(...args),

    simulateRentalPeriod: (...args: Parameters<typeof vehicleRentalService.simulatePeriod>): ReturnType<typeof vehicleRentalService.simulatePeriod> => vehicleRentalService.simulatePeriod(...args),

    getCompetenceVisitsCostsSummary: (...args: Parameters<typeof vehicleRentalService.getCompetenceVisitsCostsSummary>): ReturnType<typeof vehicleRentalService.getCompetenceVisitsCostsSummary> => vehicleRentalService.getCompetenceVisitsCostsSummary(...args),

    getRentalUtilization: (...args: Parameters<typeof vehicleRentalService.getUtilization>): ReturnType<typeof vehicleRentalService.getUtilization> => vehicleRentalService.getUtilization(...args),

    getRentalPeriods: (...args: Parameters<typeof vehicleRentalService.getPeriods>): ReturnType<typeof vehicleRentalService.getPeriods> => vehicleRentalService.getPeriods(...args),

    calculateRentalPeriod: (...args: Parameters<typeof vehicleRentalService.calculatePeriod>): ReturnType<typeof vehicleRentalService.calculatePeriod> => vehicleRentalService.calculatePeriod(...args),

    allocateRentalPeriod: (...args: Parameters<typeof vehicleRentalService.allocatePeriod>): ReturnType<typeof vehicleRentalService.allocatePeriod> => vehicleRentalService.allocatePeriod(...args),

    closeRentalPeriod: (...args: Parameters<typeof vehicleRentalService.closePeriod>): ReturnType<typeof vehicleRentalService.closePeriod> => vehicleRentalService.closePeriod(...args),

    reopenRentalPeriod: (...args: Parameters<typeof vehicleRentalService.reopenPeriod>): ReturnType<typeof vehicleRentalService.reopenPeriod> => vehicleRentalService.reopenPeriod(...args),

    revertRentalPeriod: (...args: Parameters<typeof vehicleRentalService.revertPeriod>): ReturnType<typeof vehicleRentalService.revertPeriod> => vehicleRentalService.revertPeriod(...args),

    // -------------------------------------------------------------------------
    // VEHICLE RATE CONTRACTS (contratos de R$/km — custo operacional por Km)
    // -------------------------------------------------------------------------
    getRateContracts: (...args: Parameters<typeof vehicleRateService.getContracts>): ReturnType<typeof vehicleRateService.getContracts> => vehicleRateService.getContracts(...args),

    saveRateContract: (...args: Parameters<typeof vehicleRateService.saveContract>): ReturnType<typeof vehicleRateService.saveContract> => vehicleRateService.saveContract(...args),

    deleteRateContract: (...args: Parameters<typeof vehicleRateService.deleteContract>): ReturnType<typeof vehicleRateService.deleteContract> => vehicleRateService.deleteContract(...args),

    getRateContractInfo: (...args: Parameters<typeof vehicleRateService.getContractInfo>): ReturnType<typeof vehicleRateService.getContractInfo> => vehicleRateService.getContractInfo(...args),

    getRateContractRatesForMonth: (...args: Parameters<typeof vehicleRateService.getContractRatesForMonth>): ReturnType<typeof vehicleRateService.getContractRatesForMonth> => vehicleRateService.getContractRatesForMonth(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSETS (orders_visits_assets)
    // -------------------------------------------------------------------------
    getOrderVisitAssets: (...args: Parameters<typeof visitsService.getOrderVisitAssets>): ReturnType<typeof visitsService.getOrderVisitAssets> => visitsService.getOrderVisitAssets(...args),

    getMovedAssetsByUnitAssetTagId: (...args: Parameters<typeof visitsService.getMovedAssetsByUnitAssetTagId>): ReturnType<typeof visitsService.getMovedAssetsByUnitAssetTagId> => visitsService.getMovedAssetsByUnitAssetTagId(...args),

    // Modo offline: trava do relatório do ativo (visitsService)
    lockOrderVisitAsset: (...args: Parameters<typeof visitsService.lockOrderVisitAsset>): ReturnType<typeof visitsService.lockOrderVisitAsset> => visitsService.lockOrderVisitAsset(...args),

    unlockOrderVisitAsset: (...args: Parameters<typeof visitsService.unlockOrderVisitAsset>): ReturnType<typeof visitsService.unlockOrderVisitAsset> => visitsService.unlockOrderVisitAsset(...args),

    getOrderVisitAssetsLocks: (...args: Parameters<typeof visitsService.getOrderVisitAssetsLocks>): ReturnType<typeof visitsService.getOrderVisitAssetsLocks> => visitsService.getOrderVisitAssetsLocks(...args),

    getOrderVisitAssetById: (...args: Parameters<typeof visitsService.getOrderVisitAssetById>): ReturnType<typeof visitsService.getOrderVisitAssetById> => visitsService.getOrderVisitAssetById(...args),

    copyOrderVisitAssetReport: (...args: Parameters<typeof visitsService.copyOrderVisitAssetReport>): ReturnType<typeof visitsService.copyOrderVisitAssetReport> => visitsService.copyOrderVisitAssetReport(...args),

    updateOrderVisitAsset: (...args: Parameters<typeof visitsService.updateOrderVisitAsset>): ReturnType<typeof visitsService.updateOrderVisitAsset> => visitsService.updateOrderVisitAsset(...args),

    reportedOrderVisitAsset: (...args: Parameters<typeof visitsService.reportedOrderVisitAsset>): ReturnType<typeof visitsService.reportedOrderVisitAsset> => visitsService.reportedOrderVisitAsset(...args),

    disapproveOrderVisitAsset: (...args: Parameters<typeof visitsService.disapproveOrderVisitAsset>): ReturnType<typeof visitsService.disapproveOrderVisitAsset> => visitsService.disapproveOrderVisitAsset(...args),

    updateOrderVisitAssetProcessingStatus: (...args: Parameters<typeof visitsService.updateOrderVisitAssetProcessingStatus>): ReturnType<typeof visitsService.updateOrderVisitAssetProcessingStatus> => visitsService.updateOrderVisitAssetProcessingStatus(...args),

    uploadOrderVisitAssetPhoto: (...args: Parameters<typeof visitsService.uploadOrderVisitAssetPhoto>): ReturnType<typeof visitsService.uploadOrderVisitAssetPhoto> => visitsService.uploadOrderVisitAssetPhoto(...args),

    removeOrderVisitAssetPhoto: (...args: Parameters<typeof visitsService.removeOrderVisitAssetPhoto>): ReturnType<typeof visitsService.removeOrderVisitAssetPhoto> => visitsService.removeOrderVisitAssetPhoto(...args),


    getOrderVisitIdByAssetId: (...args: Parameters<typeof visitsService.getOrderVisitIdByAssetId>): ReturnType<typeof visitsService.getOrderVisitIdByAssetId> => visitsService.getOrderVisitIdByAssetId(...args),

    /**
     * Sincroniza todos os contadores de ativos na visita
     * @param visitId ID da visita
     */
    syncOrderVisitAssetsProcessing: (...args: Parameters<typeof visitsService.syncOrderVisitAssetsProcessing>): ReturnType<typeof visitsService.syncOrderVisitAssetsProcessing> => visitsService.syncOrderVisitAssetsProcessing(...args),

    /**
     * @deprecated Use syncOrderVisitAssetsProcessing instead
     */
    updateVisitAssetsAmount: (...args: Parameters<typeof visitsService.updateVisitAssetsAmount>): ReturnType<typeof visitsService.updateVisitAssetsAmount> => visitsService.updateVisitAssetsAmount(...args),

    addAssetToOrderVisit: (...args: Parameters<typeof visitsService.addAssetToOrderVisit>): ReturnType<typeof visitsService.addAssetToOrderVisit> => visitsService.addAssetToOrderVisit(...args),

    removeAssetFromOrderVisit: (...args: Parameters<typeof visitsService.removeAssetFromOrderVisit>): ReturnType<typeof visitsService.removeAssetFromOrderVisit> => visitsService.removeAssetFromOrderVisit(...args),

    removeVehicleFromOrderVisit: (...args: Parameters<typeof visitsService.removeVehicleFromOrderVisit>): ReturnType<typeof visitsService.removeVehicleFromOrderVisit> => visitsService.removeVehicleFromOrderVisit(...args),

    /**
     * Troca o ativo de um registro de reporte de visita.
     * Atualiza o ID do ativo e todos os dados cadastrais (before/after) baseados no novo ativo.
     * Mantém os caminhos das fotos originais (para não perder as fotos já tiradas).
     * @param ovaId ID do registro em orders_visits_assets
     * @param newAssetId ID do novo ativo
     * @param userId ID do usuário logado
     */
    changeOrderVisitAsset: (...args: Parameters<typeof visitsService.changeOrderVisitAsset>): ReturnType<typeof visitsService.changeOrderVisitAsset> => visitsService.changeOrderVisitAsset(...args),

    updateVehicleKm: (...args: Parameters<typeof visitsService.updateVehicleKm>): ReturnType<typeof visitsService.updateVehicleKm> => visitsService.updateVehicleKm(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT SERVICES (orders_visits_services)
    // -------------------------------------------------------------------------
    getOrderVisitServices: (...args: Parameters<typeof visitsService.getOrderVisitServices>): ReturnType<typeof visitsService.getOrderVisitServices> => visitsService.getOrderVisitServices(...args),

    addServiceToOrderVisit: (...args: Parameters<typeof visitsService.addServiceToOrderVisit>): ReturnType<typeof visitsService.addServiceToOrderVisit> => visitsService.addServiceToOrderVisit(...args),

    removeServiceFromOrderVisit: (...args: Parameters<typeof visitsService.removeServiceFromOrderVisit>): ReturnType<typeof visitsService.removeServiceFromOrderVisit> => visitsService.removeServiceFromOrderVisit(...args),

    updateOrderVisitService: (...args: Parameters<typeof visitsService.updateOrderVisitService>): ReturnType<typeof visitsService.updateOrderVisitService> => visitsService.updateOrderVisitService(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET ACTIVITIES (orders_visits_assets_activities)
    // -------------------------------------------------------------------------
    getActivitiesByOrderType: (...args: Parameters<typeof visitsService.getActivitiesByOrderType>): ReturnType<typeof visitsService.getActivitiesByOrderType> => visitsService.getActivitiesByOrderType(...args),

    getOrderVisitAssetActivities: (...args: Parameters<typeof visitsService.getOrderVisitAssetActivities>): ReturnType<typeof visitsService.getOrderVisitAssetActivities> => visitsService.getOrderVisitAssetActivities(...args),

    toggleOrderVisitAssetActivity: (...args: Parameters<typeof visitsService.toggleOrderVisitAssetActivity>): ReturnType<typeof visitsService.toggleOrderVisitAssetActivity> => visitsService.toggleOrderVisitAssetActivity(...args),

    getOrderVisitAssetsActivitiesByVisit: (...args: Parameters<typeof visitsService.getOrderVisitAssetsActivitiesByVisit>): ReturnType<typeof visitsService.getOrderVisitAssetsActivitiesByVisit> => visitsService.getOrderVisitAssetsActivitiesByVisit(...args),

    getOrderVisitAssetsMaterialsByVisit: (...args: Parameters<typeof visitsService.getOrderVisitAssetsMaterialsByVisit>): ReturnType<typeof visitsService.getOrderVisitAssetsMaterialsByVisit> => visitsService.getOrderVisitAssetsMaterialsByVisit(...args),

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET MATERIALS (orders_visits_assets_materials)
    // -------------------------------------------------------------------------
    getAvailableMaterials: (...args: Parameters<typeof materialsService.getAvailableMaterials>): ReturnType<typeof materialsService.getAvailableMaterials> => materialsService.getAvailableMaterials(...args),

    getMaterials: (...args: Parameters<typeof materialsService.getMaterials>): ReturnType<typeof materialsService.getMaterials> => materialsService.getMaterials(...args),

    checkMaterialCodeExists: (...args: Parameters<typeof materialsService.checkMaterialCodeExists>): ReturnType<typeof materialsService.checkMaterialCodeExists> => materialsService.checkMaterialCodeExists(...args),

    createMaterial: (...args: Parameters<typeof materialsService.createMaterial>): ReturnType<typeof materialsService.createMaterial> => materialsService.createMaterial(...args),

    // -------------------------------------------------------------------------
    // MATERIALS IMPORT (CSV/XLSX)
    // -------------------------------------------------------------------------
    parseMaterialsCsv: (...args: Parameters<typeof materialsImportService.parseMaterialsCsv>): ReturnType<typeof materialsImportService.parseMaterialsCsv> => materialsImportService.parseMaterialsCsv(...args),

    getExistingMaterialCodes: (...args: Parameters<typeof materialsImportService.getExistingCodes>): ReturnType<typeof materialsImportService.getExistingCodes> => materialsImportService.getExistingCodes(...args),

    /** Mapa code → id dos almoxarifados da empresa do usuário logado (necessário para importar). */
    getMaterialImportWarehouseMap: (...args: Parameters<typeof materialsImportService.loadWarehouseCodeMap>): ReturnType<typeof materialsImportService.loadWarehouseCodeMap> => materialsImportService.loadWarehouseCodeMap(...args),

    validateMaterialsRows: (...args: Parameters<typeof materialsImportService.validateMaterialsRows>): ReturnType<typeof materialsImportService.validateMaterialsRows> => materialsImportService.validateMaterialsRows(...args),

    importMaterials: (...args: Parameters<typeof materialsImportService.importMaterials>): ReturnType<typeof materialsImportService.importMaterials> => materialsImportService.importMaterials(...args),

    getWarehouses: (...args: Parameters<typeof warehouseService.getWarehouses>): ReturnType<typeof warehouseService.getWarehouses> => warehouseService.getWarehouses(...args),

    getMaterialsStatuses: (...args: Parameters<typeof materialsService.getMaterialsStatuses>): ReturnType<typeof materialsService.getMaterialsStatuses> => materialsService.getMaterialsStatuses(...args),

    getMaterialsTypes: (...args: Parameters<typeof materialsService.getMaterialsTypes>): ReturnType<typeof materialsService.getMaterialsTypes> => materialsService.getMaterialsTypes(...args),

    getMaterialById: (...args: Parameters<typeof materialsService.getMaterialById>): ReturnType<typeof materialsService.getMaterialById> => materialsService.getMaterialById(...args),

    getWarehouseMaterials: (...args: Parameters<typeof warehouseService.getWarehouseMaterials>): ReturnType<typeof warehouseService.getWarehouseMaterials> => warehouseService.getWarehouseMaterials(...args),

    getWarehouseMaterialsByIds: (...args: Parameters<typeof warehouseService.getWarehouseMaterialsByIds>): ReturnType<typeof warehouseService.getWarehouseMaterialsByIds> => warehouseService.getWarehouseMaterialsByIds(...args),

    createWarehouseMaterial: (...args: Parameters<typeof warehouseService.createWarehouseMaterial>): ReturnType<typeof warehouseService.createWarehouseMaterial> => warehouseService.createWarehouseMaterial(...args),

    updateWarehouseMaterial: (...args: Parameters<typeof warehouseService.updateWarehouseMaterial>): ReturnType<typeof warehouseService.updateWarehouseMaterial> => warehouseService.updateWarehouseMaterial(...args),

    updateMaterial: (...args: Parameters<typeof materialsService.updateMaterial>): ReturnType<typeof materialsService.updateMaterial> => materialsService.updateMaterial(...args),

    getOrderVisitAssetMaterials: (...args: Parameters<typeof materialsService.getOrderVisitAssetMaterials>): ReturnType<typeof materialsService.getOrderVisitAssetMaterials> => materialsService.getOrderVisitAssetMaterials(...args),

    addMaterialToAsset: (...args: Parameters<typeof materialsService.addMaterialToAsset>): ReturnType<typeof materialsService.addMaterialToAsset> => materialsService.addMaterialToAsset(...args),

    updateMaterialInAsset: (...args: Parameters<typeof materialsService.updateMaterialInAsset>): ReturnType<typeof materialsService.updateMaterialInAsset> => materialsService.updateMaterialInAsset(...args),

    removeMaterialFromAsset: (...args: Parameters<typeof materialsService.removeMaterialFromAsset>): ReturnType<typeof materialsService.removeMaterialFromAsset> => materialsService.removeMaterialFromAsset(...args),

    // -------------------------------------------------------------------------
    // ASSET COMPONENTS (assets_materials)
    // -------------------------------------------------------------------------
    getAssetComponents: (...args: Parameters<typeof materialsService.getAssetComponents>): ReturnType<typeof materialsService.getAssetComponents> => materialsService.getAssetComponents(...args),

    addComponentToAsset: (...args: Parameters<typeof materialsService.addComponentToAsset>): ReturnType<typeof materialsService.addComponentToAsset> => materialsService.addComponentToAsset(...args),

    removeComponentFromAsset: (...args: Parameters<typeof materialsService.removeComponentFromAsset>): ReturnType<typeof materialsService.removeComponentFromAsset> => materialsService.removeComponentFromAsset(...args),

    updateAssetComponent: (...args: Parameters<typeof materialsService.updateAssetComponent>): ReturnType<typeof materialsService.updateAssetComponent> => materialsService.updateAssetComponent(...args),

    // PERMISSIONS MANAGEMENT
    getCompanyProfiles: (...args: Parameters<typeof companiesService.getCompanyProfiles>): ReturnType<typeof companiesService.getCompanyProfiles> => companiesService.getCompanyProfiles(...args),

    getAllProfiles: (...args: Parameters<typeof companiesService.getAllProfiles>): ReturnType<typeof companiesService.getAllProfiles> => companiesService.getAllProfiles(...args),

    getAllRoutes: (...args: Parameters<typeof orderConfigService.getAllRoutes>): ReturnType<typeof orderConfigService.getAllRoutes> => orderConfigService.getAllRoutes(...args),

    getAllRoutesForCompanyAdmin: (...args: Parameters<typeof orderConfigService.getAllRoutesForCompanyAdmin>): ReturnType<typeof orderConfigService.getAllRoutesForCompanyAdmin> => orderConfigService.getAllRoutesForCompanyAdmin(...args),

    getAllRoutesAdmin: (...args: Parameters<typeof orderConfigService.getAllRoutesAdmin>): ReturnType<typeof orderConfigService.getAllRoutesAdmin> => orderConfigService.getAllRoutesAdmin(...args),

    updateRouteAvailability: (...args: Parameters<typeof orderConfigService.updateRouteAvailability>): ReturnType<typeof orderConfigService.updateRouteAvailability> => orderConfigService.updateRouteAvailability(...args),

    createRoute: (...args: Parameters<typeof orderConfigService.createRoute>): ReturnType<typeof orderConfigService.createRoute> => orderConfigService.createRoute(...args),

    updateRoute: (...args: Parameters<typeof orderConfigService.updateRoute>): ReturnType<typeof orderConfigService.updateRoute> => orderConfigService.updateRoute(...args),

    deleteRoute: (...args: Parameters<typeof orderConfigService.deleteRoute>): ReturnType<typeof orderConfigService.deleteRoute> => orderConfigService.deleteRoute(...args),

    getUserPermissions: (...args: Parameters<typeof usersService.getUserPermissions>): ReturnType<typeof usersService.getUserPermissions> => usersService.getUserPermissions(...args),

    getProfilePermissions: (...args: Parameters<typeof usersService.getProfilePermissions>): ReturnType<typeof usersService.getProfilePermissions> => usersService.getProfilePermissions(...args),

    updateProfilePermissions: (...args: Parameters<typeof usersService.updateProfilePermissions>): ReturnType<typeof usersService.updateProfilePermissions> => usersService.updateProfilePermissions(...args),

    copyProfilePermissions: (...args: Parameters<typeof usersService.copyProfilePermissions>): ReturnType<typeof usersService.copyProfilePermissions> => usersService.copyProfilePermissions(...args),

    // -------------------------------------------------------------------------
    // ORDER VISITS - CLOSE
    // -------------------------------------------------------------------------
    closeOrderVisit: (...args: Parameters<typeof visitsService.closeOrderVisit>): ReturnType<typeof visitsService.closeOrderVisit> => visitsService.closeOrderVisit(...args),

    /**
     * Exclusão completa (soft delete) de uma visita técnica e de todos os filhos.
     * Guards: visita encerrada, não arquivada/aprovada e sem ativos avaliados.
     * Plano: docs/plano-exclusao-visita-is-deleted.md
     */
    deleteOrderVisit: (...args: Parameters<typeof visitsService.deleteOrderVisit>): ReturnType<typeof visitsService.deleteOrderVisit> => visitsService.deleteOrderVisit(...args),

    getOrdersVisitsServicesMerged: (...args: Parameters<typeof visitsService.getOrdersVisitsServicesMerged>): ReturnType<typeof visitsService.getOrdersVisitsServicesMerged> => visitsService.getOrdersVisitsServicesMerged(...args),

    getOrdersVisitsMaterialsMerged: (...args: Parameters<typeof visitsService.getOrdersVisitsMaterialsMerged>): ReturnType<typeof visitsService.getOrdersVisitsMaterialsMerged> => visitsService.getOrdersVisitsMaterialsMerged(...args),

    getOrdersVisitsVehiclesMerged: (...args: Parameters<typeof visitsService.getOrdersVisitsVehiclesMerged>): ReturnType<typeof visitsService.getOrdersVisitsVehiclesMerged> => visitsService.getOrdersVisitsVehiclesMerged(...args),

    getOrdersVisitsAssetsMovedMerged: (...args: Parameters<typeof visitsService.getOrdersVisitsAssetsMovedMerged>): ReturnType<typeof visitsService.getOrdersVisitsAssetsMovedMerged> => visitsService.getOrdersVisitsAssetsMovedMerged(...args),

    /**
     * Busca o histórico completo de uma Solicitação de Serviço (SS).
     * Compila criação da OS, visitas e todas as intervenções realizadas.
     */
    getServiceOrderHistory: (...args: Parameters<typeof ordersService.getServiceOrderHistory>): ReturnType<typeof ordersService.getServiceOrderHistory> => ordersService.getServiceOrderHistory(...args),

    getOrderStatusHistory: (...args: Parameters<typeof ordersService.getOrderStatusHistory>): ReturnType<typeof ordersService.getOrderStatusHistory> => ordersService.getOrderStatusHistory(...args),

    getMaintenancePlansByOrderId: (...args: Parameters<typeof ordersService.getMaintenancePlansByOrderId>): ReturnType<typeof ordersService.getMaintenancePlansByOrderId> => ordersService.getMaintenancePlansByOrderId(...args),

    getOrderIdsByMaintenancePlanIds: (...args: Parameters<typeof ordersService.getOrderIdsByMaintenancePlanIds>): ReturnType<typeof ordersService.getOrderIdsByMaintenancePlanIds> => ordersService.getOrderIdsByMaintenancePlanIds(...args),

    /**
     * Reporta uma visita, alterando o processing_id de 1 (Rascunho) para 2 (Reportada)
     * @param visitId ID da visita
     * @param userId ID do usuário que está reportando
     * @returns Promise<void>
     * @throws Error se a visita não estiver em rascunho ou se houver ativos não reportados
     */
    reportOrderVisit: (...args: Parameters<typeof visitsService.reportOrderVisit>): ReturnType<typeof visitsService.reportOrderVisit> => visitsService.reportOrderVisit(...args),

    /**
     * Marca uma visita como REVISADA (3), validando que TODOS os seus ativos já estão REVISADOS.
     * Visível/acionável quando: visita está REPORTADA (2) e ovAssetsAmount === ovAssetsRevisedAmount.
     * @param visitId ID da visita
     * @param userId ID do usuário que está marcando como revisada
     */
    markOrderVisitAsRevised: (...args: Parameters<typeof visitsService.markOrderVisitAsRevised>): ReturnType<typeof visitsService.markOrderVisitAsRevised> => visitsService.markOrderVisitAsRevised(...args),

    updateOrderVisitProcessing: (...args: Parameters<typeof visitsService.updateOrderVisitProcessing>): ReturnType<typeof visitsService.updateOrderVisitProcessing> => visitsService.updateOrderVisitProcessing(...args),

    disapproveOrderVisit: (...args: Parameters<typeof visitsService.disapproveOrderVisit>): ReturnType<typeof visitsService.disapproveOrderVisit> => visitsService.disapproveOrderVisit(...args),

    checkMovedAssetsForVisit: (...args: Parameters<typeof visitsService.checkMovedAssetsForVisit>): ReturnType<typeof visitsService.checkMovedAssetsForVisit> => visitsService.checkMovedAssetsForVisit(...args),

    reverseOrderVisitApproval: (...args: Parameters<typeof visitsService.reverseOrderVisitApproval>): ReturnType<typeof visitsService.reverseOrderVisitApproval> => visitsService.reverseOrderVisitApproval(...args),

    // ─── Location Tracker ────────────────────────────────────────────────────

    getUserTrackerInterval: (...args: Parameters<typeof usersService.getUserTrackerInterval>): ReturnType<typeof usersService.getUserTrackerInterval> => usersService.getUserTrackerInterval(...args),



    // -------------------------------------------------------------------------
    // PREVENTIVE MAINTENANCE PLANS
    // -------------------------------------------------------------------------

    getMaintenancePlans: (...args: Parameters<typeof maintenancePlansService.getMaintenancePlans>): ReturnType<typeof maintenancePlansService.getMaintenancePlans> => maintenancePlansService.getMaintenancePlans(...args),

    getMaintenancePlanById: (...args: Parameters<typeof maintenancePlansService.getMaintenancePlanById>): ReturnType<typeof maintenancePlansService.getMaintenancePlanById> => maintenancePlansService.getMaintenancePlanById(...args),

    createMaintenancePlan: (...args: Parameters<typeof maintenancePlansService.createMaintenancePlan>): ReturnType<typeof maintenancePlansService.createMaintenancePlan> => maintenancePlansService.createMaintenancePlan(...args),

    updateMaintenancePlan: (...args: Parameters<typeof maintenancePlansService.updateMaintenancePlan>): ReturnType<typeof maintenancePlansService.updateMaintenancePlan> => maintenancePlansService.updateMaintenancePlan(...args),

    duplicateMaintenancePlan: (...args: Parameters<typeof maintenancePlansService.duplicateMaintenancePlan>): ReturnType<typeof maintenancePlansService.duplicateMaintenancePlan> => maintenancePlansService.duplicateMaintenancePlan(...args),

    getMaintenancePlanSections: (...args: Parameters<typeof maintenancePlansService.getMaintenancePlanSections>): ReturnType<typeof maintenancePlansService.getMaintenancePlanSections> => maintenancePlansService.getMaintenancePlanSections(...args),

    createMaintenancePlanSection: (...args: Parameters<typeof maintenancePlansService.createMaintenancePlanSection>): ReturnType<typeof maintenancePlansService.createMaintenancePlanSection> => maintenancePlansService.createMaintenancePlanSection(...args),

    updateMaintenancePlanSection: (...args: Parameters<typeof maintenancePlansService.updateMaintenancePlanSection>): ReturnType<typeof maintenancePlansService.updateMaintenancePlanSection> => maintenancePlansService.updateMaintenancePlanSection(...args),

    getMaintenancePlanSectionActivities: (...args: Parameters<typeof maintenancePlansService.getMaintenancePlanSectionActivities>): ReturnType<typeof maintenancePlansService.getMaintenancePlanSectionActivities> => maintenancePlansService.getMaintenancePlanSectionActivities(...args),

    createMaintenancePlanSectionActivity: (...args: Parameters<typeof maintenancePlansService.createMaintenancePlanSectionActivity>): ReturnType<typeof maintenancePlansService.createMaintenancePlanSectionActivity> => maintenancePlansService.createMaintenancePlanSectionActivity(...args),

    updateMaintenancePlanSectionActivity: (...args: Parameters<typeof maintenancePlansService.updateMaintenancePlanSectionActivity>): ReturnType<typeof maintenancePlansService.updateMaintenancePlanSectionActivity> => maintenancePlansService.updateMaintenancePlanSectionActivity(...args),

    removeMaintenancePlanSectionActivity: (...args: Parameters<typeof maintenancePlansService.removeMaintenancePlanSectionActivity>): ReturnType<typeof maintenancePlansService.removeMaintenancePlanSectionActivity> => maintenancePlansService.removeMaintenancePlanSectionActivity(...args),

    // To load checklist for an asset visit (fetch all activities filled out with maintenance_plan_id)
    getMaintenanceChecklistItemsByVisit: (...args: Parameters<typeof maintenancePlansService.getMaintenanceChecklistItemsByVisit>): ReturnType<typeof maintenancePlansService.getMaintenanceChecklistItemsByVisit> => maintenancePlansService.getMaintenanceChecklistItemsByVisit(...args),

    getMaintenanceChecklistItems: (...args: Parameters<typeof maintenancePlansService.getMaintenanceChecklistItems>): ReturnType<typeof maintenancePlansService.getMaintenanceChecklistItems> => maintenancePlansService.getMaintenanceChecklistItems(...args),

    // To load checklist history for an asset across all visits
    getGlobalMaintenanceChecklistItems: (...args: Parameters<typeof maintenancePlansService.getGlobalMaintenanceChecklistItems>): ReturnType<typeof maintenancePlansService.getGlobalMaintenanceChecklistItems> => maintenancePlansService.getGlobalMaintenanceChecklistItems(...args),

    updateOrderVisitAssetPlan: (...args: Parameters<typeof maintenancePlansService.updateOrderVisitAssetPlan>): ReturnType<typeof maintenancePlansService.updateOrderVisitAssetPlan> => maintenancePlansService.updateOrderVisitAssetPlan(...args),

    updateOrderVisitAssetProgress: (...args: Parameters<typeof maintenancePlansService.updateOrderVisitAssetProgress>): ReturnType<typeof maintenancePlansService.updateOrderVisitAssetProgress> => maintenancePlansService.updateOrderVisitAssetProgress(...args),

    upsertMaintenanceChecklistItem: (...args: Parameters<typeof maintenancePlansService.upsertMaintenanceChecklistItem>): ReturnType<typeof maintenancePlansService.upsertMaintenanceChecklistItem> => maintenancePlansService.upsertMaintenanceChecklistItem(...args),

    deleteMaintenanceChecklistItem: (...args: Parameters<typeof maintenancePlansService.deleteMaintenanceChecklistItem>): ReturnType<typeof maintenancePlansService.deleteMaintenanceChecklistItem> => maintenancePlansService.deleteMaintenanceChecklistItem(...args),

    uploadChecklistImage: (...args: Parameters<typeof maintenancePlansService.uploadChecklistImage>): ReturnType<typeof maintenancePlansService.uploadChecklistImage> => maintenancePlansService.uploadChecklistImage(...args),

    removeChecklistImage: (...args: Parameters<typeof maintenancePlansService.removeChecklistImage>): ReturnType<typeof maintenancePlansService.removeChecklistImage> => maintenancePlansService.removeChecklistImage(...args),

    getAssetAvailabilityHistory7Days: (...args: Parameters<typeof visitsService.getAssetAvailabilityHistory7Days>): ReturnType<typeof visitsService.getAssetAvailabilityHistory7Days> => visitsService.getAssetAvailabilityHistory7Days(...args),

    getAssetAvailabilityForExport: (...args: Parameters<typeof assetsService.getAssetAvailabilityForExport>): ReturnType<typeof assetsService.getAssetAvailabilityForExport> => assetsService.getAssetAvailabilityForExport(...args),

    // ==========================================
    // MANUS INTEGRATION METHODS
    // ==========================================

    /**
     * Verifica se um contrato usa integração com Manus
     */
    checkContractUsesManus: (...args: Parameters<typeof companiesService.checkContractUsesManus>): ReturnType<typeof companiesService.checkContractUsesManus> => companiesService.checkContractUsesManus(...args),

    /**
     * Busca dados de uma visita no sistema Manus
     */
    getManusVisitData: (...args: Parameters<typeof visitsService.getManusVisitData>): ReturnType<typeof visitsService.getManusVisitData> => visitsService.getManusVisitData(...args),

    /**
     * Envia dados de uma visita para o Manus
     */
    sendVisitToManus: (...args: Parameters<typeof visitsService.sendVisitToManus>): ReturnType<typeof visitsService.sendVisitToManus> => visitsService.sendVisitToManus(...args),

    /**
     * Atualiza status de sincronização com Manus
     */
    updateManusSyncStatus: (...args: Parameters<typeof visitsService.updateManusSyncStatus>): ReturnType<typeof visitsService.updateManusSyncStatus> => visitsService.updateManusSyncStatus(...args),

    getVisitChatMessages: (...args: Parameters<typeof visitChatService.getVisitChatMessages>): ReturnType<typeof visitChatService.getVisitChatMessages> => visitChatService.getVisitChatMessages(...args),

    sendVisitChatMessage: (...args: Parameters<typeof visitChatService.sendVisitChatMessage>): ReturnType<typeof visitChatService.sendVisitChatMessage> => visitChatService.sendVisitChatMessage(...args),

    toggleResolveChatAction: (...args: Parameters<typeof visitChatService.toggleResolveChatAction>): ReturnType<typeof visitChatService.toggleResolveChatAction> => visitChatService.toggleResolveChatAction(...args),

    getVisitChatParticipants: (...args: Parameters<typeof visitChatService.getVisitChatParticipants>): ReturnType<typeof visitChatService.getVisitChatParticipants> => visitChatService.getVisitChatParticipants(...args),

    addVisitChatParticipant: (...args: Parameters<typeof visitChatService.addVisitChatParticipant>): ReturnType<typeof visitChatService.addVisitChatParticipant> => visitChatService.addVisitChatParticipant(...args),

    removeVisitChatParticipant: (...args: Parameters<typeof visitChatService.removeVisitChatParticipant>): ReturnType<typeof visitChatService.removeVisitChatParticipant> => visitChatService.removeVisitChatParticipant(...args),

    sendChatNotifications: (...args: Parameters<typeof visitChatService.sendChatNotifications>): ReturnType<typeof visitChatService.sendChatNotifications> => visitChatService.sendChatNotifications(...args),

    markVisitChatMessagesAsRead: (...args: Parameters<typeof visitChatService.markVisitChatMessagesAsRead>): ReturnType<typeof visitChatService.markVisitChatMessagesAsRead> => visitChatService.markVisitChatMessagesAsRead(...args),

    getVisitChatStatus: (...args: Parameters<typeof visitChatService.getVisitChatStatus>): ReturnType<typeof visitChatService.getVisitChatStatus> => visitChatService.getVisitChatStatus(...args),

    closeVisitChat: (...args: Parameters<typeof visitChatService.closeVisitChat>): ReturnType<typeof visitChatService.closeVisitChat> => visitChatService.closeVisitChat(...args),

    reopenVisitChat: (...args: Parameters<typeof visitChatService.reopenVisitChat>): ReturnType<typeof visitChatService.reopenVisitChat> => visitChatService.reopenVisitChat(...args),

    // -------------------------------------------------------------------------
    // MATERIAL PURCHASES (materials_purchases)
    // -------------------------------------------------------------------------

    createMaterialPurchase: (...args: Parameters<typeof purchasesService.createMaterialPurchase>): ReturnType<typeof purchasesService.createMaterialPurchase> => purchasesService.createMaterialPurchase(...args),

    getMaterialPurchases: (...args: Parameters<typeof purchasesService.getMaterialPurchases>): ReturnType<typeof purchasesService.getMaterialPurchases> => purchasesService.getMaterialPurchases(...args),


    getMaterialPurchasesDashboard: (...args: Parameters<typeof purchasesService.getMaterialPurchasesDashboard>): ReturnType<typeof purchasesService.getMaterialPurchasesDashboard> => purchasesService.getMaterialPurchasesDashboard(...args),

    getMaterialPurchasesAll: (...args: Parameters<typeof purchasesService.getMaterialPurchasesAll>): ReturnType<typeof purchasesService.getMaterialPurchasesAll> => purchasesService.getMaterialPurchasesAll(...args),


    getActivePurchasesMaterialIds: (...args: Parameters<typeof purchasesService.getActivePurchasesMaterialIds>): ReturnType<typeof purchasesService.getActivePurchasesMaterialIds> => purchasesService.getActivePurchasesMaterialIds(...args),

    authorizeMaterialPurchase: (...args: Parameters<typeof purchasesService.authorizeMaterialPurchase>): ReturnType<typeof purchasesService.authorizeMaterialPurchase> => purchasesService.authorizeMaterialPurchase(...args),

    getPurchaseCancelReasons: (...args: Parameters<typeof purchasesService.getCancelReasons>): ReturnType<typeof purchasesService.getCancelReasons> => purchasesService.getCancelReasons(...args),

    cancelMaterialPurchase: (...args: Parameters<typeof purchasesService.cancelMaterialPurchase>): ReturnType<typeof purchasesService.cancelMaterialPurchase> => purchasesService.cancelMaterialPurchase(...args),


    completeMaterialPurchase: (...args: Parameters<typeof purchasesService.completeMaterialPurchase>): ReturnType<typeof purchasesService.completeMaterialPurchase> => purchasesService.completeMaterialPurchase(...args),


    getMaterialsBelowMinStock: (...args: Parameters<typeof materialsService.getMaterialsBelowMinStock>): ReturnType<typeof materialsService.getMaterialsBelowMinStock> => materialsService.getMaterialsBelowMinStock(...args),

    getMaterialsStockSummary: (...args: Parameters<typeof materialsService.getMaterialsStockSummary>): ReturnType<typeof materialsService.getMaterialsStockSummary> => materialsService.getMaterialsStockSummary(...args),

    getRecentPurchases: (...args: Parameters<typeof purchasesService.getRecentPurchases>): ReturnType<typeof purchasesService.getRecentPurchases> => purchasesService.getRecentPurchases(...args),

    // -------------------------------------------------------------------------
    // TECHNICAL MANUALS (Documentos Técnicos)
    // -------------------------------------------------------------------------
    getTechnicalManuals: (...args: Parameters<typeof technicalManualsService.getTechnicalManuals>): ReturnType<typeof technicalManualsService.getTechnicalManuals> => technicalManualsService.getTechnicalManuals(...args),

    getTechnicalManualsByAssetId: (...args: Parameters<typeof technicalManualsService.getTechnicalManualsByAssetId>): ReturnType<typeof technicalManualsService.getTechnicalManualsByAssetId> => technicalManualsService.getTechnicalManualsByAssetId(...args),

    getTechnicalManualById: (...args: Parameters<typeof technicalManualsService.getTechnicalManualById>): ReturnType<typeof technicalManualsService.getTechnicalManualById> => technicalManualsService.getTechnicalManualById(...args),

    createTechnicalManual: (...args: Parameters<typeof technicalManualsService.createTechnicalManual>): ReturnType<typeof technicalManualsService.createTechnicalManual> => technicalManualsService.createTechnicalManual(...args),

    updateTechnicalManual: (...args: Parameters<typeof technicalManualsService.updateTechnicalManual>): ReturnType<typeof technicalManualsService.updateTechnicalManual> => technicalManualsService.updateTechnicalManual(...args),

    deleteTechnicalManual: (...args: Parameters<typeof technicalManualsService.deleteTechnicalManual>): ReturnType<typeof technicalManualsService.deleteTechnicalManual> => technicalManualsService.deleteTechnicalManual(...args),

    getTechnicalManualCategories: (...args: Parameters<typeof technicalManualsService.getTechnicalManualCategories>): ReturnType<typeof technicalManualsService.getTechnicalManualCategories> => technicalManualsService.getTechnicalManualCategories(...args),

    createTechnicalManualCategory: (...args: Parameters<typeof technicalManualsService.createTechnicalManualCategory>): ReturnType<typeof technicalManualsService.createTechnicalManualCategory> => technicalManualsService.createTechnicalManualCategory(...args),

    getTechnicalManualFiles: (...args: Parameters<typeof technicalManualsService.getTechnicalManualFiles>): ReturnType<typeof technicalManualsService.getTechnicalManualFiles> => technicalManualsService.getTechnicalManualFiles(...args),

    uploadTechnicalManualFile: (...args: Parameters<typeof technicalManualsService.uploadTechnicalManualFile>): ReturnType<typeof technicalManualsService.uploadTechnicalManualFile> => technicalManualsService.uploadTechnicalManualFile(...args),

    deleteTechnicalManualFile: (...args: Parameters<typeof technicalManualsService.deleteTechnicalManualFile>): ReturnType<typeof technicalManualsService.deleteTechnicalManualFile> => technicalManualsService.deleteTechnicalManualFile(...args),

    getAssociatedAssets: (...args: Parameters<typeof technicalManualsService.getAssociatedAssets>): ReturnType<typeof technicalManualsService.getAssociatedAssets> => technicalManualsService.getAssociatedAssets(...args),

    associateAsset: (...args: Parameters<typeof technicalManualsService.associateAsset>): ReturnType<typeof technicalManualsService.associateAsset> => technicalManualsService.associateAsset(...args),

    dissociateAsset: (...args: Parameters<typeof technicalManualsService.dissociateAsset>): ReturnType<typeof technicalManualsService.dissociateAsset> => technicalManualsService.dissociateAsset(...args),

    getAssetsByTypeForAssociation: (...args: Parameters<typeof technicalManualsService.getAssetsByTypeForAssociation>): ReturnType<typeof technicalManualsService.getAssetsByTypeForAssociation> => technicalManualsService.getAssetsByTypeForAssociation(...args),

    getManualsWithFilesForAssets: (...args: Parameters<typeof technicalManualsService.getManualsWithFilesForAssets>): ReturnType<typeof technicalManualsService.getManualsWithFilesForAssets> => technicalManualsService.getManualsWithFilesForAssets(...args),

    getOpenAlertsBySectorAndType: (...args: Parameters<typeof assetsService.getOpenAlertsBySectorAndType>): ReturnType<typeof assetsService.getOpenAlertsBySectorAndType> => assetsService.getOpenAlertsBySectorAndType(...args),

    linkAlertsToOrder: (...args: Parameters<typeof ordersService.linkAlertsToOrder>): ReturnType<typeof ordersService.linkAlertsToOrder> => ordersService.linkAlertsToOrder(...args),

    unlinkAlertFromOrder: (...args: Parameters<typeof ordersService.unlinkAlertFromOrder>): ReturnType<typeof ordersService.unlinkAlertFromOrder> => ordersService.unlinkAlertFromOrder(...args),

    getAlertsByOrderId: (...args: Parameters<typeof ordersService.getAlertsByOrderId>): ReturnType<typeof ordersService.getAlertsByOrderId> => ordersService.getAlertsByOrderId(...args),

    getAlertDetailsByOrderId: (...args: Parameters<typeof ordersService.getAlertDetailsByOrderId>): ReturnType<typeof ordersService.getAlertDetailsByOrderId> => ordersService.getAlertDetailsByOrderId(...args),

    // -------------------------------------------------------------------------
    // SYSTEM NOTICES (Avisos do Sistema)
    // -------------------------------------------------------------------------
    getActiveNotices: (...args: Parameters<typeof appNoticesService.getActiveNotices>): ReturnType<typeof appNoticesService.getActiveNotices> => appNoticesService.getActiveNotices(...args),

    listNotices: (...args: Parameters<typeof appNoticesService.listNotices>): ReturnType<typeof appNoticesService.listNotices> => appNoticesService.listNotices(...args),

    getNoticeById: (...args: Parameters<typeof appNoticesService.getNoticeById>): ReturnType<typeof appNoticesService.getNoticeById> => appNoticesService.getNoticeById(...args),

    createNotice: (...args: Parameters<typeof appNoticesService.createNotice>): ReturnType<typeof appNoticesService.createNotice> => appNoticesService.createNotice(...args),

    updateNotice: (...args: Parameters<typeof appNoticesService.updateNotice>): ReturnType<typeof appNoticesService.updateNotice> => appNoticesService.updateNotice(...args),

    deleteNotice: (...args: Parameters<typeof appNoticesService.deleteNotice>): ReturnType<typeof appNoticesService.deleteNotice> => appNoticesService.deleteNotice(...args),

    toggleNoticeActive: (...args: Parameters<typeof appNoticesService.toggleNoticeActive>): ReturnType<typeof appNoticesService.toggleNoticeActive> => appNoticesService.toggleNoticeActive(...args),

    incrementViewCount: (...args: Parameters<typeof appNoticesService.incrementViewCount>): ReturnType<typeof appNoticesService.incrementViewCount> => appNoticesService.incrementViewCount(...args),

    // -------------------------------------------------------------------------
    // NOTICE WORKERS (Trabalhadores Extras por Aviso)
    // -------------------------------------------------------------------------
    getNoticeWorkers: (...args: Parameters<typeof appNoticesWorkersService.getWorkersByNotice>): ReturnType<typeof appNoticesWorkersService.getWorkersByNotice> => appNoticesWorkersService.getWorkersByNotice(...args),

    getNoticeWorkerPeriods: (...args: Parameters<typeof appNoticesWorkersService.getPeriodsByNotice>): ReturnType<typeof appNoticesWorkersService.getPeriodsByNotice> => appNoticesWorkersService.getPeriodsByNotice(...args),

    getNoticeWorkerPeriodForDate: (...args: Parameters<typeof appNoticesWorkersService.getPeriodForDate>): ReturnType<typeof appNoticesWorkersService.getPeriodForDate> => appNoticesWorkersService.getPeriodForDate(...args),

    getNoticeWorkerCurrentPeriod: (...args: Parameters<typeof appNoticesWorkersService.getCurrentPeriod>): ReturnType<typeof appNoticesWorkersService.getCurrentPeriod> => appNoticesWorkersService.getCurrentPeriod(...args),

    /**
     * Cria um TURNO (escala) explícito no aviso — permite várias escalas no
     * mesmo dia. Erros tipados: PERIODO_INVALIDO, PERIODO_FORA_DA_JANELA,
     * PERIODO_SOBREPOSTO, NOTICE_NOT_FOUND.
     */
    createNoticeWorkerPeriod: (...args: Parameters<typeof appNoticesWorkersService.createPeriod>): ReturnType<typeof appNoticesWorkersService.createPeriod> => appNoticesWorkersService.createPeriod(...args),

    getNoticeWorkersForDate: (...args: Parameters<typeof appNoticesWorkersService.getWorkersForDate>): ReturnType<typeof appNoticesWorkersService.getWorkersForDate> => appNoticesWorkersService.getWorkersForDate(...args),

    setNoticeWorkers: (...args: Parameters<typeof appNoticesWorkersService.setWorkers>): ReturnType<typeof appNoticesWorkersService.setWorkers> => appNoticesWorkersService.setWorkers(...args),

    getNoticeWorkersSummaryByNotices: (...args: Parameters<typeof appNoticesWorkersService.getWorkersSummaryByNotices>): ReturnType<typeof appNoticesWorkersService.getWorkersSummaryByNotices> => appNoticesWorkersService.getWorkersSummaryByNotices(...args),

    // -------------------------------------------------------------------------
    // APP TIPS (Dicas do App)
    // -------------------------------------------------------------------------
    getActiveTipsForScreen: (...args: Parameters<typeof appTipsService.getActiveTipsForScreen>): ReturnType<typeof appTipsService.getActiveTipsForScreen> => appTipsService.getActiveTipsForScreen(...args),

    getUndismissedTipsCount: (...args: Parameters<typeof appTipsService.getUndismissedCount>): ReturnType<typeof appTipsService.getUndismissedCount> => appTipsService.getUndismissedCount(...args),

    dismissAppTip: (...args: Parameters<typeof appTipsService.dismissTip>): ReturnType<typeof appTipsService.dismissTip> => appTipsService.dismissTip(...args),

    resetAppTipDismissals: (...args: Parameters<typeof appTipsService.resetDismissals>): ReturnType<typeof appTipsService.resetDismissals> => appTipsService.resetDismissals(...args),

    listAppTips: (...args: Parameters<typeof appTipsService.listTips>): ReturnType<typeof appTipsService.listTips> => appTipsService.listTips(...args),

    getAppTipById: (...args: Parameters<typeof appTipsService.getTipById>): ReturnType<typeof appTipsService.getTipById> => appTipsService.getTipById(...args),

    createAppTip: (...args: Parameters<typeof appTipsService.createTip>): ReturnType<typeof appTipsService.createTip> => appTipsService.createTip(...args),

    updateAppTip: (...args: Parameters<typeof appTipsService.updateTip>): ReturnType<typeof appTipsService.updateTip> => appTipsService.updateTip(...args),

    deleteAppTip: (...args: Parameters<typeof appTipsService.deleteTip>): ReturnType<typeof appTipsService.deleteTip> => appTipsService.deleteTip(...args),

    toggleAppTipActive: (...args: Parameters<typeof appTipsService.toggleTipActive>): ReturnType<typeof appTipsService.toggleTipActive> => appTipsService.toggleTipActive(...args),

    // -------------------------------------------------------------------------
    // AUDIT LOG (Auditoria de banco de dados)
    // -------------------------------------------------------------------------
    listAuditLogs: (...args: Parameters<typeof auditService.listLogs>): ReturnType<typeof auditService.listLogs> => auditService.listLogs(...args),

    getAuditLogById: (...args: Parameters<typeof auditService.getLogById>): ReturnType<typeof auditService.getLogById> => auditService.getLogById(...args),

    listAuditedTableConfig: (...args: Parameters<typeof auditService.listTableConfig>): ReturnType<typeof auditService.listTableConfig> => auditService.listTableConfig(...args),

    updateAuditedTableConfig: (...args: Parameters<typeof auditService.updateTableConfig>): ReturnType<typeof auditService.updateTableConfig> => auditService.updateTableConfig(...args),

    // -------------------------------------------------------------------------
    // GAMIFICATION (Sistema de Gamificação de Líderes)
    // -------------------------------------------------------------------------
    getVisitScores: (...args: Parameters<typeof gamificationService.getVisitScores>): ReturnType<typeof gamificationService.getVisitScores> => gamificationService.getVisitScores(...args),

    getLeaderRanking: (...args: Parameters<typeof gamificationService.getLeaderRanking>): ReturnType<typeof gamificationService.getLeaderRanking> => gamificationService.getLeaderRanking(...args),

    getLeaderHistory: (...args: Parameters<typeof gamificationService.getLeaderHistory>): ReturnType<typeof gamificationService.getLeaderHistory> => gamificationService.getLeaderHistory(...args),

    getLeaderVisitHistory: (...args: Parameters<typeof gamificationService.getLeaderVisitHistory>): ReturnType<typeof gamificationService.getLeaderVisitHistory> => gamificationService.getLeaderVisitHistory(...args),

    getLeaderBadges: (...args: Parameters<typeof gamificationService.getLeaderBadges>): ReturnType<typeof gamificationService.getLeaderBadges> => gamificationService.getLeaderBadges(...args),

    getDepartmentSummary: (...args: Parameters<typeof gamificationService.getDepartmentSummary>): ReturnType<typeof gamificationService.getDepartmentSummary> => gamificationService.getDepartmentSummary(...args),

    getTeamRanking: (...args: Parameters<typeof gamificationService.getTeamRanking>): ReturnType<typeof gamificationService.getTeamRanking> => gamificationService.getTeamRanking(...args),

    getTeamSummary: (...args: Parameters<typeof gamificationService.getTeamSummary>): ReturnType<typeof gamificationService.getTeamSummary> => gamificationService.getTeamSummary(...args),

    recalculateLeaderScore: (...args: Parameters<typeof gamificationService.recalculateLeaderScore>): ReturnType<typeof gamificationService.recalculateLeaderScore> => gamificationService.recalculateLeaderScore(...args),

    recalculateDepartmentScores: (...args: Parameters<typeof gamificationService.recalculateDepartmentScores>): ReturnType<typeof gamificationService.recalculateDepartmentScores> => gamificationService.recalculateDepartmentScores(...args),

    recalculateAllScores: (...args: Parameters<typeof gamificationService.recalculateAllScores>): ReturnType<typeof gamificationService.recalculateAllScores> => gamificationService.recalculateAllScores(...args),

    checkAndGrantBadges: (...args: Parameters<typeof gamificationService.checkAndGrantBadges>): ReturnType<typeof gamificationService.checkAndGrantBadges> => gamificationService.checkAndGrantBadges(...args),

    getDepartmentsWithLeaders: (...args: Parameters<typeof gamificationService.getDepartmentsWithLeaders>): ReturnType<typeof gamificationService.getDepartmentsWithLeaders> => gamificationService.getDepartmentsWithLeaders(...args),

    // ===== ASSET LOANS =====

    getAssetLoansByAssetId: (...args: Parameters<typeof assetLoansService.getLoansByAssetId>): ReturnType<typeof assetLoansService.getLoansByAssetId> => assetLoansService.getLoansByAssetId(...args),

    getAssetLoanById: (...args: Parameters<typeof assetLoansService.getLoanById>): ReturnType<typeof assetLoansService.getLoanById> => assetLoansService.getLoanById(...args),

    createAssetLoan: (...args: Parameters<typeof assetLoansService.createLoan>): ReturnType<typeof assetLoansService.createLoan> => assetLoansService.createLoan(...args),

    concludeAssetInspection: (...args: Parameters<typeof assetLoansService.concludeInspection>): ReturnType<typeof assetLoansService.concludeInspection> => assetLoansService.concludeInspection(...args),

    updateAssetLoan: (...args: Parameters<typeof assetLoansService.updateLoan>): ReturnType<typeof assetLoansService.updateLoan> => assetLoansService.updateLoan(...args),

    activateAssetLoan: (...args: Parameters<typeof assetLoansService.activateLoan>): ReturnType<typeof assetLoansService.activateLoan> => assetLoansService.activateLoan(...args),

    returnAssetLoan: (...args: Parameters<typeof assetLoansService.returnLoan>): ReturnType<typeof assetLoansService.returnLoan> => assetLoansService.returnLoan(...args),

    deleteAssetLoan: (...args: Parameters<typeof assetLoansService.deleteLoan>): ReturnType<typeof assetLoansService.deleteLoan> => assetLoansService.deleteLoan(...args),

    getAssetLoanChecklists: (...args: Parameters<typeof assetLoansService.getChecklists>): ReturnType<typeof assetLoansService.getChecklists> => assetLoansService.getChecklists(...args),

    saveAssetLoanChecklist: (...args: Parameters<typeof assetLoansService.saveChecklist>): ReturnType<typeof assetLoansService.saveChecklist> => assetLoansService.saveChecklist(...args),

    updateAssetLoanChecklistItem: (...args: Parameters<typeof assetLoansService.updateChecklistItem>): ReturnType<typeof assetLoansService.updateChecklistItem> => assetLoansService.updateChecklistItem(...args),

    isAssetLoanChecklistComplete: (...args: Parameters<typeof assetLoansService.isChecklistComplete>): ReturnType<typeof assetLoansService.isChecklistComplete> => assetLoansService.isChecklistComplete(...args),

    getAssetLoanChecklistItemsCount: (...args: Parameters<typeof assetLoansService.getChecklistItemsCount>): ReturnType<typeof assetLoansService.getChecklistItemsCount> => assetLoansService.getChecklistItemsCount(...args),

    getAssetLoanChecklistImages: (...args: Parameters<typeof assetLoansService.getChecklistImages>): ReturnType<typeof assetLoansService.getChecklistImages> => assetLoansService.getChecklistImages(...args),

    uploadAssetLoanChecklistImage: (...args: Parameters<typeof assetLoansService.uploadChecklistImage>): ReturnType<typeof assetLoansService.uploadChecklistImage> => assetLoansService.uploadChecklistImage(...args),

    async uploadAssetLoanChecklistImageFromPending(checklistDbId: number, file: File, userId: string, loanId: string): Promise<AssetLoanChecklistImage> {
        const fileName = `companies/1/assets_loans/${loanId}/checklist_${checklistDbId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;

        const result = await r2Service.uploadImageWithVariants(file, fileName, undefined, { maxDimension: 1200, quality: 0.8 });

        return assetLoansService.uploadChecklistImage(checklistDbId.toString(), result.publicUrl, 'photo', userId);
    },

    deleteAssetLoanChecklistImage: (...args: Parameters<typeof assetLoansService.deleteChecklistImage>): ReturnType<typeof assetLoansService.deleteChecklistImage> => assetLoansService.deleteChecklistImage(...args),

    getOverdueAssetLoans: (...args: Parameters<typeof assetLoansService.getOverdueLoans>): ReturnType<typeof assetLoansService.getOverdueLoans> => assetLoansService.getOverdueLoans(...args),

    getActiveAssetLoansCount: (...args: Parameters<typeof assetLoansService.getActiveLoansCount>): ReturnType<typeof assetLoansService.getActiveLoansCount> => assetLoansService.getActiveLoansCount(...args),

    saveAssetLoanSignature: (...args: Parameters<typeof assetLoansService.saveLoanSignature>): ReturnType<typeof assetLoansService.saveLoanSignature> => assetLoansService.saveLoanSignature(...args),

    deleteAssetLoanSignature: (...args: Parameters<typeof assetLoansService.deleteLoanSignature>): ReturnType<typeof assetLoansService.deleteLoanSignature> => assetLoansService.deleteLoanSignature(...args),

    // ===== CHECKLIST TYPES (N:N associations) =====

    getChecklistTypes: (...args: Parameters<typeof assetsTypesChecklistService.getChecklistTypes>): ReturnType<typeof assetsTypesChecklistService.getChecklistTypes> => assetsTypesChecklistService.getChecklistTypes(...args),

    getChecklistTypesByAssetType: (...args: Parameters<typeof assetsTypesChecklistService.getChecklistTypesByAssetType>): ReturnType<typeof assetsTypesChecklistService.getChecklistTypesByAssetType> => assetsTypesChecklistService.getChecklistTypesByAssetType(...args),

    getChecklistTypeById: (...args: Parameters<typeof assetsTypesChecklistService.getChecklistTypeById>): ReturnType<typeof assetsTypesChecklistService.getChecklistTypeById> => assetsTypesChecklistService.getChecklistTypeById(...args),

    createChecklistTypeAssociation: (...args: Parameters<typeof assetsTypesChecklistService.createChecklistType>): ReturnType<typeof assetsTypesChecklistService.createChecklistType> => assetsTypesChecklistService.createChecklistType(...args),

    deleteChecklistType: (...args: Parameters<typeof assetsTypesChecklistService.deleteChecklistType>): ReturnType<typeof assetsTypesChecklistService.deleteChecklistType> => assetsTypesChecklistService.deleteChecklistType(...args),

    // ===== LOANS CHECKLISTS (generic catalog) =====

    getLoansChecklists: (...args: Parameters<typeof loansChecklistService.getChecklists>): ReturnType<typeof loansChecklistService.getChecklists> => loansChecklistService.getChecklists(...args),

    getLoansChecklistById: (...args: Parameters<typeof loansChecklistService.getChecklistById>): ReturnType<typeof loansChecklistService.getChecklistById> => loansChecklistService.getChecklistById(...args),

    createLoansChecklist: (...args: Parameters<typeof loansChecklistService.createChecklist>): ReturnType<typeof loansChecklistService.createChecklist> => loansChecklistService.createChecklist(...args),

    updateLoansChecklist: (...args: Parameters<typeof loansChecklistService.updateChecklist>): ReturnType<typeof loansChecklistService.updateChecklist> => loansChecklistService.updateChecklist(...args),

    deleteLoansChecklist: (...args: Parameters<typeof loansChecklistService.deleteChecklist>): ReturnType<typeof loansChecklistService.deleteChecklist> => loansChecklistService.deleteChecklist(...args),

    getLoansChecklistAssetTypes: (...args: Parameters<typeof loansChecklistService.getChecklistAssetTypes>): ReturnType<typeof loansChecklistService.getChecklistAssetTypes> => loansChecklistService.getChecklistAssetTypes(...args),

    setLoansChecklistAssetTypes: (...args: Parameters<typeof loansChecklistService.setChecklistAssetTypes>): ReturnType<typeof loansChecklistService.setChecklistAssetTypes> => loansChecklistService.setChecklistAssetTypes(...args),

    isLoansChecklistInUse: (...args: Parameters<typeof loansChecklistService.isChecklistInUse>): ReturnType<typeof loansChecklistService.isChecklistInUse> => loansChecklistService.isChecklistInUse(...args),

    reorderChecklistTypes: (...args: Parameters<typeof assetsTypesChecklistService.reorderChecklistTypes>): ReturnType<typeof assetsTypesChecklistService.reorderChecklistTypes> => assetsTypesChecklistService.reorderChecklistTypes(...args),

    getAvailableChecklistsForAssetType: (...args: Parameters<typeof assetsTypesChecklistService.getAvailableChecklistsForAssetType>): ReturnType<typeof assetsTypesChecklistService.getAvailableChecklistsForAssetType> => assetsTypesChecklistService.getAvailableChecklistsForAssetType(...args),

    addChecklistsToAssetType: (...args: Parameters<typeof assetsTypesChecklistService.addChecklistsToAssetType>): ReturnType<typeof assetsTypesChecklistService.addChecklistsToAssetType> => assetsTypesChecklistService.addChecklistsToAssetType(...args),

    // ── Integrações de disponibilidade de ativos (assetsAvailableIntegrationsService) ──
    getAssetsAvailableIntegrations: (...args: Parameters<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrations>): ReturnType<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrations> => assetsAvailableIntegrationsService.getAssetsAvailableIntegrations(...args),

    createAssetsAvailableIntegration: (...args: Parameters<typeof assetsAvailableIntegrationsService.createAssetsAvailableIntegration>): ReturnType<typeof assetsAvailableIntegrationsService.createAssetsAvailableIntegration> => assetsAvailableIntegrationsService.createAssetsAvailableIntegration(...args),

    updateAssetsAvailableIntegration: (...args: Parameters<typeof assetsAvailableIntegrationsService.updateAssetsAvailableIntegration>): ReturnType<typeof assetsAvailableIntegrationsService.updateAssetsAvailableIntegration> => assetsAvailableIntegrationsService.updateAssetsAvailableIntegration(...args),

    deleteAssetsAvailableIntegration: (...args: Parameters<typeof assetsAvailableIntegrationsService.deleteAssetsAvailableIntegration>): ReturnType<typeof assetsAvailableIntegrationsService.deleteAssetsAvailableIntegration> => assetsAvailableIntegrationsService.deleteAssetsAvailableIntegration(...args),

    getAssetsAvailableIntegrationMappings: (...args: Parameters<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrationMappings>): ReturnType<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrationMappings> => assetsAvailableIntegrationsService.getAssetsAvailableIntegrationMappings(...args),

    createAssetsAvailableIntegrationMapping: (...args: Parameters<typeof assetsAvailableIntegrationsService.createAssetsAvailableIntegrationMapping>): ReturnType<typeof assetsAvailableIntegrationsService.createAssetsAvailableIntegrationMapping> => assetsAvailableIntegrationsService.createAssetsAvailableIntegrationMapping(...args),

    updateAssetsAvailableIntegrationMapping: (...args: Parameters<typeof assetsAvailableIntegrationsService.updateAssetsAvailableIntegrationMapping>): ReturnType<typeof assetsAvailableIntegrationsService.updateAssetsAvailableIntegrationMapping> => assetsAvailableIntegrationsService.updateAssetsAvailableIntegrationMapping(...args),

    deleteAssetsAvailableIntegrationMapping: (...args: Parameters<typeof assetsAvailableIntegrationsService.deleteAssetsAvailableIntegrationMapping>): ReturnType<typeof assetsAvailableIntegrationsService.deleteAssetsAvailableIntegrationMapping> => assetsAvailableIntegrationsService.deleteAssetsAvailableIntegrationMapping(...args),

    getAssetsAvailableIntegrationLogs: (...args: Parameters<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrationLogs>): ReturnType<typeof assetsAvailableIntegrationsService.getAssetsAvailableIntegrationLogs> => assetsAvailableIntegrationsService.getAssetsAvailableIntegrationLogs(...args),

    searchUnitAssetTagsForMapping: (...args: Parameters<typeof assetsAvailableIntegrationsService.searchUnitAssetTagsForMapping>): ReturnType<typeof assetsAvailableIntegrationsService.searchUnitAssetTagsForMapping> => assetsAvailableIntegrationsService.searchUnitAssetTagsForMapping(...args),

    runAssetsAvailableIntegration: (...args: Parameters<typeof assetsAvailableIntegrationsService.runAssetsAvailableIntegration>): ReturnType<typeof assetsAvailableIntegrationsService.runAssetsAvailableIntegration> => assetsAvailableIntegrationsService.runAssetsAvailableIntegration(...args),
};

// Modo offline (F1): cache de leitura e bloqueio de gravações offline nos
// métodos da visita. Sem a flag VITE_FEATURE_OFFLINE_MODE, não muda nada.
installOfflineLayer(dataService as any);
