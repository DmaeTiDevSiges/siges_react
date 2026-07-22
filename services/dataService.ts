// Data Service for SIGES application
import { supabase } from './supabase';
import { r2Service } from './r2Service';
import { materialsService } from './materials/materialsService';
import { warehouseService } from './materials/warehouseService';
import { purchasesService } from './materials/purchasesService';
import { ordersService } from './orders/ordersService';
import { visitsService } from './orders/visitsService';
import { assetTagsService } from './assets/assetTagsService';
import { companiesService } from './companies/companiesService';
import { unitsService } from './core/unitsService';
import { visitChatService } from './orders/visitChatService';
import { assetsService } from './assets/assetsService';
import { assetConfigService } from './assets/assetConfigService';
import { assetAttributesService } from './assets/assetAttributesService';
import { usersService } from './users/usersService';
import { notificationsService } from './core/notificationsService';
import { settingsService } from './core/settingsService';
import { dashboardService } from './core/dashboardService';
import { maintenancePlansService } from './core/maintenancePlansService';
import { orderConfigService } from './core/orderConfigService';
import { toolsService } from './toolsService';
import { technicalManualsService } from './assets/technicalManualsService';
import { Asset, Contract, ContractManager, Company, Client, Department, Team, User, UserStatus, Profile, Permission, System, UnitType, Unit, Vehicle, Activity, Priority, Service, ContractService, Route, Material, OrderVisitAssetMaterial, OrderType, OrderSubType, OrderPlan, OrderObject, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, AssetAttribute, AssetAttributeValue, Order, UserNotification, AssetHistoryItem, OrderFilters, OrderVisit, OrderVisitTeam, OrderVisitVehicle, OrderVisitService, OrderVisitAssetView, OrderVisitAssetActivity, ServiceHistoryItem, MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, AssetAlert, SuspendedReason, CauseReason, OrderVisitChatMessage, OrderVisitChatParticipant, TechnicalManual, TechnicalManualCategory, TechnicalManualFile, TechnicalManualAsset } from '../types';



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
    async getAppConfig() {
        return settingsService.getAppConfig.apply(settingsService, arguments as any);
    },
    async getProcessingConfigurations() {
        return settingsService.getProcessingConfigurations.apply(settingsService, arguments as any);
    },

    // Atualização de Heartbeat do usuário
    async updateLastOnline(userId: string): Promise<void> {
        return usersService.updateLastOnline.apply(usersService, arguments as any);
    },

    // Atualização de localização do usuário (tracker)
    async updateUserLocation(
        userId: string,
        latitude: number,
        longitude: number,
        accuracy: number | null = null
    ): Promise<void> {
        return usersService.updateUserLocation.apply(usersService, arguments as any);
    },

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
        return this.getPublicImageUrl(path, name, { width: 600, height: 300, resize: 'fit' });
    },

    async saveOrderVisitSignature(ovId: string, type: 'leader' | 'requester', base64: string, onProgress?: (progress: number) => void): Promise<void> {
        // r2Service is now static

        const folderPath = `signatures/visits/${ovId}`;
        const fileName = `${type}_${Date.now()}.png`;
        const fullPath = `${folderPath}/${fileName}`;

        // Convert base64 to Blob
        try {
            const res = await fetch(base64);
            const blob = await res.blob();
            await r2Service.uploadFile(blob as any, fullPath, onProgress);

            const updateData: any = {};
            if (type === 'leader') {
                updateData.ov_signature_leader_path = folderPath;
                updateData.ov_signature_leader_name = fileName;
                updateData.ov_signature_leader_at = getBrazilTime();
            } else {
                updateData.ov_signature_requester_path = folderPath;
                updateData.ov_signature_requester_name = fileName;
                updateData.ov_signature_requester_at = getBrazilTime();
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

      async fileOrderVisit(visitId: string, userId: string): Promise<void> {
    return visitsService.fileOrderVisit.apply(visitsService, arguments as any);
  },


      async deleteOrderVisitSignature(visitId: string, type: 'leader' | 'requester'): Promise<void> {
    return visitsService.deleteOrderVisitSignature.apply(visitsService, arguments as any);
  },


    // Private helper for mapping raw database items (v_orders) to Order type
    _mapOrder(
        item: any,
        companyMap?: Map<string, any>,
        realStatusMap?: Record<string, string>,
        leaderMap?: Map<string, any>,
        unitMap?: Map<string, any>
    ): Order {
        return ordersService._mapOrder.apply(ordersService, arguments as any);
    },

    async getContracts(ids?: (string | number)[]): Promise<Contract[]> {
        return companiesService.getContracts.apply(companiesService, arguments as any);
    },

    async getContractById(id: string): Promise<Contract | null> {
        return companiesService.getContractById.apply(companiesService, arguments as any);
    },

    async getContractsByClientDepartmentId(clientDepartmentId: string): Promise<Contract[]> {
        return companiesService.getContractsByClientDepartmentId.apply(companiesService, arguments as any);
    },

    async getContractsByClientId(clientId: string): Promise<Contract[]> {
        return companiesService.getContractsByClientId.apply(companiesService, arguments as any);
    },

    async getCompanies(): Promise<Company[]> {
        return companiesService.getCompanies.apply(companiesService, arguments as any);
    },

    async getCompanyById(id: string): Promise<Company | null> {
        return companiesService.getCompanyById.apply(companiesService, arguments as any);
    },

    async createCompany(company: Partial<Company>, onProgress?: (progress: number) => void): Promise<Company> {
        return companiesService.createCompany.apply(companiesService, arguments as any);
    },

    async updateCompany(id: string, company: Partial<Company>, onProgress?: (progress: number) => void): Promise<Company> {
        return companiesService.updateCompany.apply(companiesService, arguments as any);
    },

    async getOrdersVisitsView(filters?: { 
        startDate?: string; 
        endDate?: string; 
        page?: number; 
        pageSize?: number;
        contractId?: string | string[];
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        unitId?: string | string[];
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderTypeSubId?: string | string[];
        assetTagId?: string | string[];
        assetTagSubId?: string | string[];
        orderPlanId?: string | string[];
        orderTeamId?: string | string[];
        searchQuery?: string;
    }) {
        return dashboardService.getOrdersVisitsView.apply(dashboardService, arguments as any);
    },

    async getOrdersForCalendar(filters?: {
        startDate?: string;
        endDate?: string;
        contractId?: string | string[];
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        unitId?: string | string[];
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderPlanId?: string | string[];
        orderTeamId?: string | string[];
        searchQuery?: string;
    }): Promise<any[]> {
        return dashboardService.getOrdersForCalendar.apply(dashboardService, arguments as any);
    },

    async deleteCompany(id: string): Promise<void> {
        return companiesService.deleteCompany.apply(companiesService, arguments as any);
    },

    async createContract(contract: Partial<Contract>): Promise<Contract> {
        return companiesService.createContract.apply(companiesService, arguments as any);
    },

    async updateContract(id: string, contract: Partial<Contract>): Promise<Contract> {
        return companiesService.updateContract.apply(companiesService, arguments as any);
    },

    async deleteContract(id: string): Promise<void> {
        return companiesService.deleteContract.apply(companiesService, arguments as any);
    },



    async getUsers(): Promise<User[]> {
        return usersService.getUsers.apply(usersService, arguments as any);
    },

    async getDepartments(): Promise<Department[]> {
        return usersService.getDepartments.apply(usersService, arguments as any);
    },

    async getDepartmentsByCompany(companyId: string): Promise<Department[]> {
        return usersService.getDepartmentsByCompany.apply(usersService, arguments as any);
    },

    async createDepartment(department: Partial<Department>): Promise<Department> {
        return usersService.createDepartment.apply(usersService, arguments as any);
    },

    async updateDepartment(id: string, department: Partial<Department>): Promise<Department> {
        return usersService.updateDepartment.apply(usersService, arguments as any);
    },

    async deleteDepartment(id: string): Promise<void> {
        return usersService.deleteDepartment.apply(usersService, arguments as any);
    },

    async getTeams(companyId?: string, departmentId?: string): Promise<Team[]> {
        return usersService.getTeams.apply(usersService, arguments as any);
    },

    async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
        return usersService.getTeamsByDepartment.apply(usersService, arguments as any);
    },

    async createTeam(team: Partial<Team>): Promise<Team> {
        return usersService.createTeam.apply(usersService, arguments as any);
    },

    async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
        return usersService.updateTeam.apply(usersService, arguments as any);
    },

    async deleteTeam(id: string): Promise<void> {
        return usersService.deleteTeam.apply(usersService, arguments as any);
    },

    async getActivities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Activity[]> {
        return orderConfigService.getActivities.apply(orderConfigService, arguments as any);
    },



    async createActivity(activity: Partial<Activity>): Promise<Activity> {
        return orderConfigService.createActivity.apply(orderConfigService, arguments as any);
    },

    async updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
        return orderConfigService.updateActivity.apply(orderConfigService, arguments as any);
    },

    async deleteActivity(id: string): Promise<void> {
        return orderConfigService.deleteActivity.apply(orderConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // PRIORITIES (cfg_orders_priorities)
    // -------------------------------------------------------------------------
    async getPriorities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Priority[]> {
        return orderConfigService.getPriorities.apply(orderConfigService, arguments as any);
    },

    async createPriority(priority: Partial<Priority>): Promise<Priority> {
        return orderConfigService.createPriority.apply(orderConfigService, arguments as any);
    },

    async updatePriority(id: string, priority: Partial<Priority>): Promise<Priority> {
        return orderConfigService.updatePriority.apply(orderConfigService, arguments as any);
    },

    async deletePriority(id: string): Promise<void> {
        return orderConfigService.deletePriority.apply(orderConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER TYPES (cfg_orders_types)
    // -------------------------------------------------------------------------
    async getOrderTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderType[]> {
        return orderConfigService.getOrderTypes.apply(orderConfigService, arguments as any);
    },

    async createOrderType(orderType: Partial<OrderType>): Promise<OrderType> {
        return orderConfigService.createOrderType.apply(orderConfigService, arguments as any);
    },

    async updateOrderType(id: string, orderType: Partial<OrderType>): Promise<OrderType> {
        return orderConfigService.updateOrderType.apply(orderConfigService, arguments as any);
    },

    async deleteOrderType(id: string): Promise<void> {
        return orderConfigService.deleteOrderType.apply(orderConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER SUB-TYPES (cfg_orders_types_subs)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // ASSET ALERTS (assets_alerts)
    // -------------------------------------------------------------------------
    async getAssetAlerts(assetId: string): Promise<AssetAlert[]> {
        return assetsService.getAssetAlerts.apply(assetsService, arguments as any);
    },
    async getAllAssetAlerts(): Promise<AssetAlert[]> {
        return assetsService.getAllAssetAlerts.apply(assetsService, arguments as any);
    },

    async getAllActiveAssetAlerts(): Promise<AssetAlert[]> {
        return assetsService.getAllActiveAssetAlerts.apply(assetsService, arguments as any);
    },

    async createAssetAlert(alert: Partial<AssetAlert>): Promise<AssetAlert> {
        return assetsService.createAssetAlert.apply(assetsService, arguments as any);
    },

    async updateAssetAlert(id: string, alert: Partial<AssetAlert>): Promise<AssetAlert> {
        return assetsService.updateAssetAlert.apply(assetsService, arguments as any);
    },

    async deleteAssetAlert(id: string): Promise<void> {
        return assetsService.deleteAssetAlert.apply(assetsService, arguments as any);
    },

    async getOrderSubTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderSubType[]> {
        return orderConfigService.getOrderSubTypes.apply(orderConfigService, arguments as any);
    },

    async getOrderSubTypesByType(typeId: string): Promise<OrderSubType[]> {
        return orderConfigService.getOrderSubTypesByType.apply(orderConfigService, arguments as any);
    },

    async createOrderSubType(orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        return orderConfigService.createOrderSubType.apply(orderConfigService, arguments as any);
    },

    async updateOrderSubType(id: string, orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        return orderConfigService.updateOrderSubType.apply(orderConfigService, arguments as any);
    },

    async deleteOrderSubType(id: string): Promise<void> {
        return orderConfigService.deleteOrderSubType.apply(orderConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER PLANS (cfg_orders_plans)
    // -------------------------------------------------------------------------
    async getOrderPlans(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderPlan[]> {
        return orderConfigService.getOrderPlans.apply(orderConfigService, arguments as any);
    },

    async createOrderPlan(orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        return orderConfigService.createOrderPlan.apply(orderConfigService, arguments as any);
    },

    async updateOrderPlan(id: string, orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        return orderConfigService.updateOrderPlan.apply(orderConfigService, arguments as any);
    },

    async deleteOrderPlan(id: string): Promise<void> {
        return orderConfigService.deleteOrderPlan.apply(orderConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER OBJECTS (cfg_orders_objects)
    // -------------------------------------------------------------------------
    async getOrderObjects(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderObject[]> {
        return orderConfigService.getOrderObjects.apply(orderConfigService, arguments as any);
    },

    async createOrderObject(orderObject: Partial<OrderObject>): Promise<OrderObject> {
        return orderConfigService.createOrderObject.apply(orderConfigService, arguments as any);
    },

    async updateOrderObject(id: string, orderObject: Partial<OrderObject>): Promise<OrderObject> {
        return orderConfigService.updateOrderObject.apply(orderConfigService, arguments as any);
    },

    async deleteOrderObject(id: string): Promise<void> {
        return orderConfigService.deleteOrderObject.apply(orderConfigService, arguments as any);
    },

    async linkActivityToOrderType(activityId: string, orderTypeId: string): Promise<void> {
        return orderConfigService.linkActivityToOrderType.apply(orderConfigService, arguments as any);
    },

    async unlinkActivityFromOrderType(activityId: string, orderTypeId: string): Promise<void> {
        return orderConfigService.unlinkActivityFromOrderType.apply(orderConfigService, arguments as any);
    },

    async getUsersByCompany(companyId: string): Promise<User[]> {
        return usersService.getUsersByCompany.apply(usersService, arguments as any);
    },

    async getTeamsByCompany(companyId: string): Promise<Team[]> {
        return usersService.getTeamsByCompany.apply(usersService, arguments as any);
    },

    async getTeamMembers(teamId: string): Promise<User[]> {
        return usersService.getTeamMembers.apply(usersService, arguments as any);
    },

    async searchUsers(query: string, companyId: string, excludeTeamId?: string): Promise<User[]> {
        return usersService.searchUsers.apply(usersService, arguments as any);
    },

    async searchVehicles(query: string, companyId?: string): Promise<Vehicle[]> {
        return usersService.searchVehicles.apply(usersService, arguments as any);
    },

    async getVehicle(id: string): Promise<Vehicle | null> {
        return usersService.getVehicle.apply(usersService, arguments as any);
    },

    async updateUserVehicle(userId: string, vehicleId: string | null): Promise<void> {
        return usersService.updateUserVehicle.apply(usersService, arguments as any);
    },

    async addUserToTeam(userId: string, newTeamId: string): Promise<void> {
        return usersService.addUserToTeam.apply(usersService, arguments as any);
    },

    async removeUserFromTeam(userId: string): Promise<void> {
        return usersService.removeUserFromTeam.apply(usersService, arguments as any);
    },

    async updateUserTeam(userId: string, teamId: string | null): Promise<void> {
        return usersService.updateUserTeam.apply(usersService, arguments as any);
    },

    async createUser(user: Partial<User>, password: string): Promise<void> {
        return usersService.createUser.apply(usersService, arguments as any);
    },

    async getCurrentUser(): Promise<User | null> {
        return usersService.getCurrentUser.apply(usersService, arguments as any);
    },

    async updateProfile(userUuid: string, user: Partial<User>, onProgress?: (progress: number) => void): Promise<void> {
        return usersService.updateProfile.apply(usersService, arguments as any);
    },

    async updateUserStatus(userId: string, statusId: number): Promise<string> {
        return usersService.updateUserStatus.apply(usersService, arguments as any);
    },

    async getUserStatuses(): Promise<UserStatus[]> {
        return usersService.getUserStatuses.apply(usersService, arguments as any);
    },

    async updateUserAvailability(userId: string, isAvailable: boolean, ovIdInProgress: string | null | undefined): Promise<void> {
        return usersService.updateUserAvailability.apply(usersService, arguments as any);
    },



    async createCompanyProfile(companyId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        return companiesService.createCompanyProfile.apply(companiesService, arguments as any);
    },

    async updateCompanyProfile(profileId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        return companiesService.updateCompanyProfile.apply(companiesService, arguments as any);
    },

    async deleteCompanyProfile(profileId: string): Promise<void> {
        return companiesService.deleteCompanyProfile.apply(companiesService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ROUTES & PERMISSIONS
    // -------------------------------------------------------------------------




    async signIn(email: string, password: string): Promise<void> {
        return usersService.signIn.apply(usersService, arguments as any);
    },

    async impersonateUser(targetUserId: string): Promise<{ email: string; password: string; uuid: string }> {
        return usersService.impersonateUser.apply(usersService, arguments as any);
    },

    async exitImpersonation(adminAccessToken: string, adminRefreshToken: string): Promise<void> {
        return usersService.exitImpersonation.apply(usersService, arguments as any);
    },

    subscribeToAuthChanges(callback: (event: string, session: any) => void) {
        return usersService.subscribeToAuthChanges.apply(usersService, arguments as any);
    },

    async signOut(userUuid?: string): Promise<void> {
        return usersService.signOut.apply(usersService, arguments as any);
    },

    async resetPassword(email: string): Promise<void> {
        return usersService.resetPassword.apply(usersService, arguments as any);
    },

    async updatePassword(password: string): Promise<void> {
        return usersService.updatePassword.apply(usersService, arguments as any);
    },

    async getClients(): Promise<Client[]> {
        return companiesService.getClients.apply(companiesService, arguments as any);
    },

    async createClient(client: Partial<Client>, onProgress?: (progress: number) => void): Promise<Client> {
        return companiesService.createClient.apply(companiesService, arguments as any);
    },

    async updateClient(id: string, client: Partial<Client>, onProgress?: (progress: number) => void): Promise<Client> {
        return companiesService.updateClient.apply(companiesService, arguments as any);
    },

    async deleteClient(id: string): Promise<void> {
        return companiesService.deleteClient.apply(companiesService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // SYSTEMS (cfg_systems)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // UNIT TYPES (cfg_units_types)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // UNITS (cfg_units)
    // -------------------------------------------------------------------------


    async getUnitsByClient(clientId: string): Promise<Unit[]> {
        return companiesService.getUnitsByClient.apply(companiesService, arguments as any);
    },

    async searchUnits(search: string = '', limit: number = 50): Promise<Unit[]> {
        return unitsService.searchUnits.apply(unitsService, arguments as any);
    },

    async getUnitById(id: string): Promise<Unit | null> {
        return unitsService.getUnitById.apply(unitsService, arguments as any);
    },

    async createUnit(unit: Partial<Unit>): Promise<Unit> {
        return unitsService.createUnit.apply(unitsService, arguments as any);
    },

    async updateUnit(id: string, unit: Partial<Unit>): Promise<Unit> {
        return unitsService.updateUnit.apply(unitsService, arguments as any);
    },

    async deleteUnit(id: string): Promise<void> {
        return unitsService.deleteUnit.apply(unitsService, arguments as any);
    },

    // Services
    async getServices(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Service[]> {
        return orderConfigService.getServices.apply(orderConfigService, arguments as any);
    },

    async createService(service: Partial<Service>): Promise<Service> {
        return orderConfigService.createService.apply(orderConfigService, arguments as any);
    },

    async updateService(id: string, service: Partial<Service>): Promise<Service> {
        return orderConfigService.updateService.apply(orderConfigService, arguments as any);
    },

    // Orders
    /**
     * Get Active Orders (SS/OS) by unit asset tag ID
     */
    async getActiveOrdersByAssetTagId(unitAssetTagId: string | number): Promise<any[]> {
        return ordersService.getActiveOrdersByAssetTagId.apply(ordersService, arguments as any);
    },
    
    /**
     * Mark a Service Order (SS) as completed (status 8)
     */
    async completeServiceOrder(orderId: string | number, userId?: string | number, rating: number = 0): Promise<boolean> {
        return ordersService.completeServiceOrder.apply(ordersService, arguments as any);
    },

    /**
     * Cancel Service Request (Order)
     * Sets status_id to 7 (Cancelled) and updates asset tracking fields.
     */
    async cancelServiceOrder(orderId: string | number, userId: string | number): Promise<boolean> {
        return ordersService.cancelServiceOrder.apply(ordersService, arguments as any);
    },

    /**
     * Create Service Request (Order)
     * Implements the complete flow from flows/servicesRequests/create-service-request.flow
     */
    async createServiceRequest(order: Partial<Order>): Promise<Order> {
        return ordersService.createServiceRequest.apply(ordersService, arguments as any);
    },




    async getParentOrder(parentId: string | number): Promise<Order | null> {
        return ordersService.getParentOrder.apply(ordersService, arguments as any);
    },

    async getChildOrders(parentId: string | number): Promise<Order[]> {
        return ordersService.getChildOrders.apply(ordersService, arguments as any);
    },

    async createOrder(order: Partial<Order>): Promise<Order> {
        return ordersService.createOrder.apply(ordersService, arguments as any);
    },

    async copyImagesFromOrderToOrder(srcCompanyId: string, srcOrderId: string, destCompanyId: string, destOrderId: string, files: string[]): Promise<void> {
        return ordersService.copyImagesFromOrderToOrder.apply(ordersService, arguments as any);
    },

    async uploadOrderImage(companyId: string, orderId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string; filename: string }> {
        return ordersService.uploadOrderImage.apply(ordersService, arguments as any);
    },

    async updateOrderImage(orderId: string, path: string, filename: string): Promise<void> {
        return ordersService.updateOrderImage.apply(ordersService, arguments as any);
    },

    async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
        return ordersService.updateOrder.apply(ordersService, arguments as any);
    },


    async updateOrderFiles(orderId: string, filenames: string[]): Promise<void> {
        return ordersService.updateOrderFiles.apply(ordersService, arguments as any);
    },

    async updateOrderStatus(orderId: string, statusId: number): Promise<void> {
        return ordersService.updateOrderStatus.apply(ordersService, arguments as any);
    },


    /**
     * Atualiza o status da Solicitação de Serviço (SS) com base no maior nível de prioridade
     * entre todas as suas Ordens de Serviço (OS) filhas.
     *
     * @param serviceRequestId - ID da SS a ser atualizada
     */
    async updateServiceRequestStatus(serviceRequestId: string): Promise<void> {
        return ordersService.updateServiceRequestStatus.apply(ordersService, arguments as any);
    },

    // Contract Services
      async getContractServices(contractId: string): Promise<ContractService[]> {
    return companiesService.getContractServices.apply(companiesService, arguments as any);
  },


      async addContractService(item: Partial<ContractService>): Promise<void> {
    return companiesService.addContractService.apply(companiesService, arguments as any);
  },


    async updateContractService(id: string, item: Partial<ContractService>): Promise<void> {
        return companiesService.updateContractService.apply(companiesService, arguments as any);
    },

    async deleteContractService(id: string): Promise<void> {
        return companiesService.deleteContractService.apply(companiesService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // CONTRACT MANAGERS (contracts_managers)
    // -------------------------------------------------------------------------
    async getContractManagers(contractId: string): Promise<ContractManager[]> {
        return companiesService.getContractManagers.apply(companiesService, arguments as any);
    },

    async getManagedContracts(userId: string): Promise<Contract[]> {
        return companiesService.getManagedContracts.apply(companiesService, arguments as any);
    },

    async isUserContractManager(userId: string, contractId: string): Promise<boolean> {
        return companiesService.isUserContractManager.apply(companiesService, arguments as any);
    },

    async addContractManager(contractId: string, managerId: string, role: string = 'viewer'): Promise<void> {
        return companiesService.addContractManager.apply(companiesService, arguments as any);
    },

    async removeContractManager(contractId: string, managerId: string): Promise<void> {
        return companiesService.removeContractManager.apply(companiesService, arguments as any);
    },

    async getAssets(filter: 'all' | 'active' | 'inactive' = 'all', search: string = '', unitId?: string, unitAssetTagId?: string): Promise<Asset[]> {
        return assetsService.getAssets.apply(assetsService, arguments as any);
    },

    async getFilteredAssets(filters: {
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        unitId?: string | string[];
        tagId?: string | string[];
        tagSubId?: string | string[];
        typeId?: string | string[];
        statusId?: string | string[];
        search?: string;
    }): Promise<Asset[]> {
        return assetsService.getFilteredAssets.apply(assetsService, arguments as any);
    },

    async createAsset(asset: Partial<Asset>): Promise<Asset> {
        return assetsService.createAsset.apply(assetsService, arguments as any);
    },

    async updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
        return assetsService.updateAsset.apply(assetsService, arguments as any);
    },

    async uploadAssetImage(assetId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        return assetsService.uploadAssetImage.apply(assetsService, arguments as any);
    },

    async updateAssetPhotoFromReport(assetId: string, companyId: string, sourceFileName: string, sourceFolderPath: string): Promise<void> {
        return assetsService.updateAssetPhotoFromReport.apply(assetsService, arguments as any);
    },

    async getAssetById(id: string): Promise<Asset | null> {
        return assetsService.getAssetById.apply(assetsService, arguments as any);
    },

    async getAssetHistory(assetId: string, page: number = 0, pageSize: number = 10): Promise<{ data: AssetHistoryItem[], total: number }> {
        return assetsService.getAssetHistory.apply(assetsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ASSET TAGS (cfg_assets_tags)
    // -------------------------------------------------------------------------
    async getAssetTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetType[]> {
        return assetConfigService.getAssetTypes.apply(assetConfigService, arguments as any);
    },

    async createAssetType(assetType: Partial<AssetType>): Promise<AssetType> {
        return assetConfigService.createAssetType.apply(assetConfigService, arguments as any);
    },

    async updateAssetType(id: string, assetType: Partial<AssetType>): Promise<AssetType> {
        return assetConfigService.updateAssetType.apply(assetConfigService, arguments as any);
    },

    async deleteAssetType(id: string): Promise<void> {
        return assetConfigService.deleteAssetType.apply(assetConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ASSET STATUSES (cfg_assets_statuses)
    // -------------------------------------------------------------------------
    async getAssetStatuses(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetStatus[]> {
        return assetConfigService.getAssetStatuses.apply(assetConfigService, arguments as any);
    },

    async createAssetStatus(assetStatus: Partial<AssetStatus>): Promise<AssetStatus> {
        return assetConfigService.createAssetStatus.apply(assetConfigService, arguments as any);
    },

    async updateAssetStatus(id: string, assetStatus: Partial<AssetStatus>): Promise<AssetStatus> {
        return assetConfigService.updateAssetStatus.apply(assetConfigService, arguments as any);
    },

    async deleteAssetStatus(id: string): Promise<void> {
        return assetConfigService.deleteAssetStatus.apply(assetConfigService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ASSET PRIORITIES (cfg_assets_priorities)
    // -------------------------------------------------------------------------
    async getAssetPriorities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetPriority[]> {
        return assetConfigService.getAssetPriorities.apply(assetConfigService, arguments as any);
    },

    async createAssetPriority(assetPriority: Partial<AssetPriority>): Promise<AssetPriority> {
        return assetConfigService.createAssetPriority.apply(assetConfigService, arguments as any);
    },

    async updateAssetPriority(id: string, assetPriority: Partial<AssetPriority>): Promise<AssetPriority> {
        return assetConfigService.updateAssetPriority.apply(assetConfigService, arguments as any);
    },

    async deleteAssetPriority(id: string): Promise<void> {
        return assetConfigService.deleteAssetPriority.apply(assetConfigService, arguments as any);
    },

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

    async getUnitsAssetsByUnit(unitId: string): Promise<AssetTag[]> {
        return assetTagsService.getUnitsAssetsByUnit.apply(assetTagsService, arguments as any);
    },
    async getUniqueSectorsByUnit(unitId: string): Promise<AssetTag[]> {
        return assetTagsService.getUniqueSectorsByUnit.apply(assetTagsService, arguments as any);
    },

    async getAssetTags(status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTag[]> {
        return assetTagsService.getAssetTags.apply(assetTagsService, arguments as any);
    },

    async createAssetTag(tag: Omit<AssetTag, 'id'>): Promise<AssetTag> {
        return assetTagsService.createAssetTag.apply(assetTagsService, arguments as any);
    },

    async updateAssetTag(id: string, tag: Partial<AssetTag>): Promise<AssetTag> {
        return assetTagsService.updateAssetTag.apply(assetTagsService, arguments as any);
    },

    async deleteAssetTag(id: string): Promise<void> {
        return assetTagsService.deleteAssetTag.apply(assetTagsService, arguments as any);
    },

    // ASSET TAG SUBS (Posições)
    async getAssetTagSubs(parentId?: string, status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTagSub[]> {
        return assetTagsService.getAssetTagSubs.apply(assetTagsService, arguments as any);
    },

    async createAssetTagSub(tagSub: Omit<AssetTagSub, 'id'>): Promise<AssetTagSub> {
        return assetTagsService.createAssetTagSub.apply(assetTagsService, arguments as any);
    },

    async updateAssetTagSub(id: string, tagSub: Partial<AssetTagSub>): Promise<AssetTagSub> {
        return assetTagsService.updateAssetTagSub.apply(assetTagsService, arguments as any);
    },

    async deleteAssetTagSub(id: string): Promise<void> {
        return assetTagsService.deleteAssetTagSub.apply(assetTagsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // UNIT ASSET TAGS (Sectors)
    // -------------------------------------------------------------------------
    async getUnitAssetTagsItems(unitId: string, assetTagId: string): Promise<any[]> {
        return assetTagsService.getUnitAssetTagsItems.apply(assetTagsService, arguments as any);
    },

    async getUnitAssetTagItemById(id: string): Promise<any> {
        return assetTagsService.getUnitAssetTagItemById.apply(assetTagsService, arguments as any);
    },

    async updateUnitAssetTagAvailability(id: string, payload: { 
        isAvailable: boolean, 
        reasonId?: string, 
        comments?: string, 
        reportedById: string,
        images?: { path: string, filename: string }[],
        unitId: number,
        assetTagId: number,
        assetTagSubId?: number | null,
        operationRecord?: number | string,
        reportedLatitude?: number | null,
        reportedLongitude?: number | null,
        unitLatitude?: number | null,
        unitLongitude?: number | null,
        unitReportedDistance?: number | null,
        providerCompanyId?: number,
        isWeb: boolean
    }): Promise<number> {
        return assetTagsService.updateUnitAssetTagAvailability.apply(assetTagsService, arguments as any);
    },

    async updateUnitAssetTagImageRefs(unitAssetTagId: number, assetAvailableId: number, path: string, filename: string): Promise<void> {
        return assetTagsService.updateUnitAssetTagImageRefs.apply(assetTagsService, arguments as any);
    },

    async uploadAssetAvailableImageAfterInsert(assetAvailableId: number, unitId: number, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        return assetTagsService.uploadAssetAvailableImageAfterInsert.apply(assetTagsService, arguments as any);
    },

    async getUnitAssetTagAvailabilityHistory(unitAssetTagId: string): Promise<any[]> {
        return assetTagsService.getUnitAssetTagAvailabilityHistory.apply(assetTagsService, arguments as any);
    },

    async uploadUnitAssetTagImage(unitAssetTagId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        return assetTagsService.uploadUnitAssetTagImage.apply(assetTagsService, arguments as any);
    },

    subscribeToOrdersVisits(callback: (payload: any) => void) {
        const channelName = `orders_visits-changes-${Math.random().toString(36).substring(7)}`;
        return supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, callback)
            .subscribe();
    },

      async getUnitAssetTags(unitId: string): Promise<any[]> {
    return assetTagsService.getUnitAssetTags.apply(assetTagsService, arguments as any);
  },

    async createUnitAssetTag(payload: {
        unitId: number;
        assetTagId: number;
        assetTagSubId?: number | null;
        assetTagTagSubDescription?: string;
        operationUnit?: string;
        assetAvailableRate?: number;
        flowRateIsVisible?: boolean;
        flowRateUnit?: string;
        flowRateMin?: number;
        flowRateMax?: number;
        powerIsVisible?: boolean;
        powerUnit?: string;
        powerMin?: number;
        powerMax?: number;
        pressureIsVisible?: boolean;
        pressureUnit?: string;
        pressureMin?: number;
        pressureMax?: number;
        voltageIsVisible?: boolean;
        voltageUnit?: string;
        voltageMin?: number;
        voltageMax?: number;
        amperageIsVisible?: boolean;
        amperageUnit?: string;
        amperageMin?: number;
        amperageMax?: number;
        createdUserId?: number;
    }): Promise<any> {
        return assetTagsService.createUnitAssetTag.apply(assetTagsService, arguments as any);
    },

    async updateUnitAssetTag(id: number, payload: {
        unitId?: number;
        assetTagId?: number;
        assetTagSubId?: number | null;
        assetTagTagSubDescription?: string;
        operationUnit?: string;
        assetAvailableRate?: number;
        flowRateIsVisible?: boolean;
        flowRateUnit?: string;
        flowRateMin?: number;
        flowRateMax?: number;
        powerIsVisible?: boolean;
        powerUnit?: string;
        powerMin?: number;
        powerMax?: number;
        pressureIsVisible?: boolean;
        pressureUnit?: string;
        pressureMin?: number;
        pressureMax?: number;
        isActive?: boolean;
        updatedUserId?: number;
    }): Promise<any> {
        return assetTagsService.updateUnitAssetTag.apply(assetTagsService, arguments as any);
    },

    async deleteUnitAssetTag(id: number, deletedUserId?: number | null): Promise<void> {
        return assetTagsService.deleteUnitAssetTag.apply(assetTagsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ASSET ATTRIBUTES (Dynamic Fields)
    // -------------------------------------------------------------------------
    async getAssetAttributesByType(assetTypeId: string): Promise<AssetAttribute[]> {
        return assetAttributesService.getAssetAttributesByType.apply(assetAttributesService, arguments as any);
    },

    async getAssetAttributeValues(assetId: string): Promise<Record<string, string>> {
        return assetAttributesService.getAssetAttributeValues.apply(assetAttributesService, arguments as any);
    },

    async saveAssetAttributeValues(assetId: string, values: Record<string, string>): Promise<void> {
        return assetAttributesService.saveAssetAttributeValues.apply(assetAttributesService, arguments as any);
    },

    async createAssetAttribute(attribute: Partial<AssetAttribute>): Promise<AssetAttribute> {
        return assetAttributesService.createAssetAttribute.apply(assetAttributesService, arguments as any);
    },

    async updateAssetAttribute(id: string, attribute: Partial<AssetAttribute>): Promise<AssetAttribute> {
        return assetAttributesService.updateAssetAttribute.apply(assetAttributesService, arguments as any);
    },

    async deleteAssetAttribute(id: string): Promise<void> {
        return assetAttributesService.deleteAssetAttribute.apply(assetAttributesService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // FILE UPLOAD HELPERS
    // -------------------------------------------------------------------------

    async uploadUserAvatar(userId: string, file: File | Blob, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        return usersService.uploadUserAvatar.apply(usersService, arguments as any);
    },

    async uploadUnitImage(clientId: string, unitId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        // Importar r2Service dinamicamente para evitar problemas de dependência circular se houver
        // r2Service is now static


        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const folderPath = `clients/${clientId}/units/${unitId}`;
        const fullPath = `${folderPath}/${fileName}`;

        console.log('📸 Uploading unit image to R2:', { folderPath, fileName, fullPath });

        // Delete old image if exists (No R2, se desejar manter limpeza)
        try {
            const { data: existingUnit } = await supabase
                .from('units')
                .select('img_file_path, img_file_name')
                .eq('id', unitId)
                .single();

            if (existingUnit?.img_file_path && existingUnit?.img_file_name) {
                const oldPath = `${existingUnit.img_file_path}/${existingUnit.img_file_name}`;
                console.log('🗑️ Deleting old image from R2:', oldPath);
                await r2Service.deleteFile(oldPath);
            }
        } catch (cleanupError) {
            console.warn('⚠️ Could not delete old image (may not exist or permission error):', cleanupError);
        }

        try {
            await r2Service.uploadFile(file, fullPath, onProgress);
            console.log('✅ Unit image uploaded successfully to R2:', { path: folderPath, filename: fileName });
            return { path: folderPath, filename: fileName };
        } catch (uploadError) {
            console.error('❌ Error uploading unit image to R2:', uploadError);
            throw uploadError;
        }
    },

    async getNotificationsCount(authUserId?: string): Promise<number> {
        return notificationsService.getNotificationsCount.apply(notificationsService, arguments as any);
    },

    async getNotifications(page = 0, pageSize = 20, authUserId?: string): Promise<UserNotification[]> {
        return notificationsService.getNotifications.apply(notificationsService, arguments as any);
    },

    async markNotificationAsRead(id: string): Promise<void> {
        return notificationsService.markNotificationAsRead.apply(notificationsService, arguments as any);
    },

    async deleteNotification(id: string): Promise<void> {
        return notificationsService.deleteNotification.apply(notificationsService, arguments as any);
    },

    async deleteVisitChatNotifications(ovId: string): Promise<void> {
        return notificationsService.deleteVisitChatNotifications.apply(notificationsService, arguments as any);
    },

    async clearAllNotifications(): Promise<void> {
        return notificationsService.clearAllNotifications.apply(notificationsService, arguments as any);
    },

    subscribeToNotifications(userId: string, onUpdate: (payload: any) => void) {
        console.log('📡 Setting up realtime subscription for user:', userId);

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
                    console.log('🔔 Realtime notification received:', payload);
                    onUpdate(payload);
                }
            )
            .subscribe((status, err) => {
                console.log('📡 Subscription status:', status);
                if (err) {
                    console.error('❌ Realtime subscription error:', err);
                }
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to notifications');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ Realtime subscription failed. This might be due to WebSocket configuration in your self-hosted Supabase instance.');
                }
            });
    },

    async getAssetByCode(code: string): Promise<Asset | null> {
        return assetsService.getAssetByCode.apply(assetsService, arguments as any);
    },

    async toggleAssetFollow(assetId: string): Promise<boolean> {
        return assetsService.toggleAssetFollow.apply(assetsService, arguments as any);
    },

    async getFollowedAssetIds(): Promise<string[]> {
        return assetsService.getFollowedAssetIds.apply(assetsService, arguments as any);
    },

    async getSystemsParent(): Promise<System[]> {
        return settingsService.getSystemsParent.apply(settingsService, arguments as any);
    },

    async getSystems(parentId?: string): Promise<System[]> {
        return settingsService.getSystems.apply(settingsService, arguments as any);
    },

    async getUnitsAssetsTagsDashboard(systemParentId: string): Promise<any[]> {
        return assetsService.getUnitsAssetsTagsDashboard.apply(assetsService, arguments as any);
    },

    async getSystemsParentAssetsTagsAvailableRate(systemParentId: string): Promise<any[]> {
        return assetsService.getSystemsParentAssetsTagsAvailableRate.apply(assetsService, arguments as any);
    },

    async getUnitTypesParent(): Promise<UnitType[]> {
        return settingsService.getUnitTypesParent.apply(settingsService, arguments as any);
    },

    async getUnitTypes(parentId?: string): Promise<UnitType[]> {
        return settingsService.getUnitTypes.apply(settingsService, arguments as any);
    },

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

    async getUnits(filter: 'all' | 'active' | 'inactive' = 'active', search: string = ''): Promise<any[]> {
        return unitsService.getUnits.apply(unitsService, arguments as any);
    },

    async getUnitsByIds(ids: string[]): Promise<{ data: any[] | null, error: any }> {
        return unitsService.getUnitsByIds.apply(unitsService, arguments as any);
    },

    async getFilteredUnits(filters: {
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        search?: string;
    }): Promise<any[]> {
        return unitsService.getFilteredUnits.apply(unitsService, arguments as any);
    },

    /**
     * Get all units with coordinates for client-side proximity filtering.
     * Returns units with latitude/longitude for distance calculation.
     */
    async getUnitsWithCoordinates(statusFilter?: 'all' | 'active' | 'inactive'): Promise<any[]> {
        return unitsService.getUnitsWithCoordinates.apply(unitsService, arguments as any);
    },

    /**
     * Get nearby units using Supabase RPC (server-side Haversine).
     * Requires the nearby_units() function to be created in the database.
     * Falls back to client-side filtering if RPC is not available.
     */
    async getNearbyUnits(
        lat: number,
        lng: number,
        radiusMeters: number = 5000,
        statusFilter: 'all' | 'active' | 'inactive' = 'all'
    ): Promise<any[]> {
        return unitsService.getNearbyUnits.apply(unitsService, arguments as any);
    },

    async getSubSystems(systemId?: string): Promise<any[]> {
        return settingsService.getSubSystems.apply(settingsService, arguments as any);
    },

    async getAssetsTags(): Promise<any[]> {
        return assetTagsService.getAssetsTags.apply(assetTagsService, arguments as any);
    },



    async getOrdersObjects(): Promise<any[]> {
        return orderConfigService.getOrdersObjects.apply(orderConfigService, arguments as any);
    },



    async getPlans(): Promise<any[]> {
        return orderConfigService.getPlans.apply(orderConfigService, arguments as any);
    },

    async getCancelReasons(): Promise<any[]> {
        return orderConfigService.getCancelReasons.apply(orderConfigService, arguments as any);
    },

    async getSuspendedReasons(): Promise<SuspendedReason[]> {
        return orderConfigService.getSuspendedReasons.apply(orderConfigService, arguments as any);
    },

    async getOrderCauseReasons(): Promise<CauseReason[]> {
        return orderConfigService.getOrderCauseReasons.apply(orderConfigService, arguments as any);
    },


    async getTeamLeader(teamId: string): Promise<User | null> {
        return usersService.getTeamLeader.apply(usersService, arguments as any);
    },

    async getOpenOrdersByUnit(unitId: string, filters: {
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderTypeSubId?: string | string[];
        contractId?: string | string[];
        planId?: string | string[];
        teamId?: string | string[];
    }): Promise<any[]> {
        return ordersService.getOpenOrdersByUnit.apply(ordersService, arguments as any);
    },

    async getOrderByMask(mask: string): Promise<Order | null> {
        return ordersService.getOrderByMask.apply(ordersService, arguments as any);
    },

    async getOrdersFilters(filters?: OrderFilters & { page?: number; pageSize?: number }): Promise<{ data: Order[]; hasMore: boolean; total: number }> {
        return ordersService.getOrdersFilters.apply(ordersService, arguments as any);
    },

    async getOrdersVisitsAssetsWithProvider(filters?: {
        assetId?: string;
        orderId?: string;
        ovId?: string;
    }): Promise<any[]> {
        return ordersService.getOrdersVisitsAssetsWithProvider.apply(ordersService, arguments as any);
    },

     subscribeToOrders: (callback: (payload: any) => void) => {
         const channelId = `orders-changes-${Math.random().toString(36).substring(2)}`;
         console.log('📡 [Meu Painel] Subscribing to orders realtime changes');
         return supabase
             .channel(channelId)
             .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                 console.log('🔄 [Meu Painel] orders change received:', payload.eventType);
                 callback(payload);
             })
             .subscribe((status, err) => {
                 console.log('📡 [Meu Painel] orders subscription status:', status);
                 if (err) console.error('❌ [Meu Painel] orders subscription error:', err);
                 if (status === 'CHANNEL_ERROR') {
                     console.warn('⚠️ [Meu Painel] Verifique se a tabela "orders" tem Realtime habilitado no Supabase (Database → Replication).');
                 }
             });
     },

     subscribeToVisits: (callback: (payload: any) => void) => {
         const channelId = `visits-changes-${Math.random().toString(36).substring(2)}`;
         console.log('📡 [Meu Painel] Subscribing to orders_visits realtime changes');
         return supabase
             .channel(channelId)
             .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, (payload) => {
                 console.log('🔄 [Meu Painel] orders_visits change received:', payload.eventType);
                 callback(payload);
             })
             .subscribe((status, err) => {
                 console.log('📡 [Meu Painel] visits subscription status:', status);
                 if (err) console.error('❌ [Meu Painel] visits subscription error:', err);
                 if (status === 'CHANNEL_ERROR') {
                     console.warn('⚠️ [Meu Painel] Verifique se a tabela "orders_visits" tem Realtime habilitado no Supabase (Database → Replication).');
                 }
             });
     },

    async getOrderById(id: string | number): Promise<Order | null> {
        return ordersService.getOrderById.apply(ordersService, arguments as any);
    },

    async getFollowedOrderIds(userId: string): Promise<string[]> {
        return ordersService.getFollowedOrderIds.apply(ordersService, arguments as any);
    },

    async toggleOrderFollow(orderId: string, userId: string): Promise<boolean> {
        return ordersService.toggleOrderFollow.apply(ordersService, arguments as any);
    },

     async getDashboardStats(
         filters?: OrderFilters,
         ssFiltersOverride?: OrderFilters,
         osFiltersOverride?: OrderFilters
     ): Promise<{
         ssCounts: { today: number; yesterday: number; sevenDays: number; fifteenDays: number; between16And30: number; moreThan30: number };
         osCounts: Record<number, number>;
         ssSectorCounts?: Array<{ id: string, label: string, count: number }>;
         osSectorCounts?: Array<{ id: string, label: string, count: number }>;
     }> {
         return dashboardService.getDashboardStats.apply(dashboardService, arguments as any);
     },


    async getUnscheduledSS(filters?: OrderFilters): Promise<Order[]> {
        return ordersService.getUnscheduledSS.apply(ordersService, arguments as any);
    },

    async getOpenOS(filters?: OrderFilters): Promise<Order[]> {
        return ordersService.getOpenOS.apply(ordersService, arguments as any);
    },

    async updateSystem(id: string, data: Partial<System>): Promise<void> {
        return settingsService.updateSystem.apply(settingsService, arguments as any);
    },

    async createSystem(data: Partial<System>): Promise<void> {
        return settingsService.createSystem.apply(settingsService, arguments as any);
    },

    async updateUnitType(id: string, data: Partial<UnitType>): Promise<void> {
        return settingsService.updateUnitType.apply(settingsService, arguments as any);
    },

    async createUnitType(data: Partial<UnitType>): Promise<void> {
        return settingsService.createUnitType.apply(settingsService, arguments as any);
    },

    subscribeToUsers(callback: (payload: any) => void) {
        const channelName = `users-changes-${Math.random().toString(36).substring(7)}`;
        return supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    },

    async getOrdersByTeam(teamId: string): Promise<Order[]> {
        return ordersService.getOrdersByTeam.apply(ordersService, arguments as any);
    },

    async getOrdersByLeader(leaderId: string): Promise<Order[]> {
        return ordersService.getOrdersByLeader.apply(ordersService, arguments as any);
    },

    async hasActiveVisits(orderId: string): Promise<boolean> {
        return ordersService.hasActiveVisits.apply(ordersService, arguments as any);
    },

    async getAvailableTeamMembers(teamId: string): Promise<User[]> {
        return ordersService.getAvailableTeamMembers.apply(ordersService, arguments as any);
    },

    async getActiveUsers(): Promise<User[]> {
        return usersService.getActiveUsers.apply(usersService, arguments as any);
    },

    async authorizeOrder(orderId: string, teamId: string, planId?: string, teamLeaderId?: string): Promise<void> {
        return ordersService.authorizeOrder.apply(ordersService, arguments as any);
    },

      async cancelOrder(orderId: string, reasonId: string, userId: string, teamId: string): Promise<void> {
    return ordersService.cancelOrder.apply(ordersService, arguments as any);
  },


      async scheduleOrder(orderId: string, date: string): Promise<void> {
    return ordersService.scheduleOrder.apply(ordersService, arguments as any);
  },


      async updateOrderTeam(orderId: string, teamId: string, teamLeaderId?: string): Promise<void> {
    return ordersService.updateOrderTeam.apply(ordersService, arguments as any);
  },


    async getLeadersByCompany(companyId: string): Promise<User[]> {
        return companiesService.getLeadersByCompany.apply(companiesService, arguments as any);
    },

    async getTodayVisitsByCompany(companyId: string): Promise<OrderVisit[]> {
        return companiesService.getTodayVisitsByCompany.apply(companiesService, arguments as any);
    },

    async getVisitsByTeam(teamId: string): Promise<OrderVisit[]> {
        return visitsService.getVisitsByTeam.apply(visitsService, arguments as any);
    },

    async getVisitsByLeader(leaderId: string): Promise<OrderVisit[]> {
        return visitsService.getVisitsByLeader.apply(visitsService, arguments as any);
    },

    async startOrderVisit(order: Order, currentUser: User): Promise<void> {
        return visitsService.startOrderVisit.apply(visitsService, arguments as any);
    },

    async getActiveOrderVisit(id: string): Promise<OrderVisit | null> {
        return visitsService.getActiveOrderVisit.apply(visitsService, arguments as any);
    },

    async getOrderVisitTeam(visitId: string): Promise<OrderVisitTeam[]> {
        return visitsService.getOrderVisitTeam.apply(visitsService, arguments as any);
    },

    async getOrdersVisitsTeamsBulk(visitIds: string[]): Promise<Record<string, OrderVisitTeam[]>> {
        return visitsService.getOrdersVisitsTeamsBulk.apply(visitsService, arguments as any);
    },

    async getProviderCompanyByOvAssetId(ovAssetId: string): Promise<string | null> {
        return companiesService.getProviderCompanyByOvAssetId.apply(companiesService, arguments as any);
    },

    async removeTeamMember(visitId: string, userId: string): Promise<void> {
        return visitsService.removeTeamMember.apply(visitsService, arguments as any);
    },

    async addTeamMember(visitId: string, userId: string): Promise<void> {
        return visitsService.addTeamMember.apply(visitsService, arguments as any);
    },

    async getVisitsByOrderId(orderId: string | number): Promise<OrderVisit[]> {
        return visitsService.getVisitsByOrderId.apply(visitsService, arguments as any);
    },


    async getVisitsByParentOrderId(parentId: string | number): Promise<OrderVisit[]> {
        return visitsService.getVisitsByParentOrderId.apply(visitsService, arguments as any);
    },



    async getAssetsUnavailableReasons(): Promise<{ id: number, description: string }[]> {
        return assetTagsService.getAssetsUnavailableReasons.apply(assetTagsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT
    // -------------------------------------------------------------------------
    async getOrderVisitById(visitId: string): Promise<OrderVisit | null> {
        return visitsService.getOrderVisitById.apply(visitsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT VEHICLES (orders_visits_vehicles)
    // -------------------------------------------------------------------------
    async getOrderVisitVehicles(visitId: string): Promise<OrderVisitVehicle[]> {
        return visitsService.getOrderVisitVehicles.apply(visitsService, arguments as any);
    },

    async addVehicleToOrderVisit(visitId: string, vehicleId: string, userId: string): Promise<void> {
        return visitsService.addVehicleToOrderVisit.apply(visitsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSETS (orders_visits_assets)
    // -------------------------------------------------------------------------
    async getOrderVisitAssets(visitId: string): Promise<OrderVisitAssetView[]> {
        return visitsService.getOrderVisitAssets.apply(visitsService, arguments as any);
    },

    async getMovedAssetsByUnitAssetTagId(unitAssetTagId: string): Promise<OrderVisitAssetView[]> {
        return visitsService.getMovedAssetsByUnitAssetTagId.apply(visitsService, arguments as any);
    },

    async getOrderVisitAssetById(id: string): Promise<OrderVisitAssetView | null> {
        return visitsService.getOrderVisitAssetById.apply(visitsService, arguments as any);
    },

    async updateOrderVisitAsset(id: string, updates: Partial<{
        before_comments: string;
        after_comments: string;
        has_recorder: boolean;
        before_recorder: number | null;
        after_recorder: number | null;
        is_moved: boolean;
        after_status_id: string;
        after_unit_id: string;
        after_tag_id: string;
        after_tag_sub_id: string;
        after_priority_id: number;
        moved_comments: string;
        after_unit_asset_tag_id: string;
        after_client_id: string;
    }>): Promise<void> {
        return visitsService.updateOrderVisitAsset.apply(visitsService, arguments as any);
    },

    async reportedOrderVisitAsset(id: string, userId: string): Promise<void> {
        return visitsService.reportedOrderVisitAsset.apply(visitsService, arguments as any);
    },

    async disapproveOrderVisitAsset(id: string, userId: string, notes: string): Promise<void> {
        return visitsService.disapproveOrderVisitAsset.apply(visitsService, arguments as any);
    },

    async updateOrderVisitAssetProcessingStatus(id: string, processingId: number, userId: string): Promise<void> {
        return visitsService.updateOrderVisitAssetProcessingStatus.apply(visitsService, arguments as any);
    },

    async uploadOrderVisitAssetPhoto(ovAssetId: string, file: File, type: 'before' | 'after', onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        return visitsService.uploadOrderVisitAssetPhoto.apply(visitsService, arguments as any);
    },

    async removeOrderVisitAssetPhoto(ovAssetId: string, type: 'before' | 'after', fileName: string): Promise<void> {
        return visitsService.removeOrderVisitAssetPhoto.apply(visitsService, arguments as any);
    },


    async getOrderVisitIdByAssetId(assetId: string): Promise<string | null> {
        return visitsService.getOrderVisitIdByAssetId.apply(visitsService, arguments as any);
    },

    /**
     * Sincroniza todos os contadores de ativos na visita
     * @param visitId ID da visita
     */
    async syncOrderVisitAssetsProcessing(visitId: string): Promise<void> {
        return visitsService.syncOrderVisitAssetsProcessing.apply(visitsService, arguments as any);
    },

    /**
     * @deprecated Use syncOrderVisitAssetsProcessing instead
     */
    async updateVisitAssetsAmount(visitId: string): Promise<void> {
        return visitsService.updateVisitAssetsAmount.apply(visitsService, arguments as any);
    },

    async addAssetToOrderVisit(visitId: string, assetId: string, userId: string): Promise<void> {
        return visitsService.addAssetToOrderVisit.apply(visitsService, arguments as any);
    },

    async removeAssetFromOrderVisit(ovaId: string): Promise<void> {
        return visitsService.removeAssetFromOrderVisit.apply(visitsService, arguments as any);
    },

    async removeVehicleFromOrderVisit(visitVehicleId: string): Promise<void> {
        return visitsService.removeVehicleFromOrderVisit.apply(visitsService, arguments as any);
    },

    /**
     * Troca o ativo de um registro de reporte de visita.
     * Atualiza o ID do ativo e todos os dados cadastrais (before/after) baseados no novo ativo.
     * Mantém os caminhos das fotos originais (para não perder as fotos já tiradas).
     * @param ovaId ID do registro em orders_visits_assets
     * @param newAssetId ID do novo ativo
     * @param userId ID do usuário logado
     */
    async changeOrderVisitAsset(ovaId: string, newAssetId: string, userId: string): Promise<void> {
        return visitsService.changeOrderVisitAsset.apply(visitsService, arguments as any);
    },

    async updateVehicleKm(visitVehicleId: string, kmInitial?: number | null, kmFinal?: number | null): Promise<void> {
        return visitsService.updateVehicleKm.apply(visitsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT SERVICES (orders_visits_services)
    // -------------------------------------------------------------------------
    async getOrderVisitServices(visitId: string): Promise<OrderVisitService[]> {
        return visitsService.getOrderVisitServices.apply(visitsService, arguments as any);
    },

    async addServiceToOrderVisit(visitId: string, contractServiceId: string, userId: string, amount: number = 1): Promise<void> {
        return visitsService.addServiceToOrderVisit.apply(visitsService, arguments as any);
    },

    async removeServiceFromOrderVisit(ovServiceId: string): Promise<void> {
        return visitsService.removeServiceFromOrderVisit.apply(visitsService, arguments as any);
    },

    async updateOrderVisitService(ovServiceId: string, updates: { amount?: number; discount?: number; valueUnit?: number }): Promise<void> {
        return visitsService.updateOrderVisitService.apply(visitsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET ACTIVITIES (orders_visits_assets_activities)
    // -------------------------------------------------------------------------
    async getActivitiesByOrderType(orderTypeId: string): Promise<Activity[]> {
        return visitsService.getActivitiesByOrderType.apply(visitsService, arguments as any);
    },

    async getOrderVisitAssetActivities(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        return visitsService.getOrderVisitAssetActivities.apply(visitsService, arguments as any);
    },

    async toggleOrderVisitAssetActivity(ovAssetId: string, activityId: string, userId: string, isSelected: boolean): Promise<void> {
        return visitsService.toggleOrderVisitAssetActivity.apply(visitsService, arguments as any);
    },

    async getOrderVisitAssetsActivitiesByVisit(visitId: string): Promise<OrderVisitAssetActivity[]> {
        return visitsService.getOrderVisitAssetsActivitiesByVisit.apply(visitsService, arguments as any);
    },

    async getOrderVisitAssetsMaterialsByVisit(visitId: string): Promise<OrderVisitAssetMaterial[]> {
        return visitsService.getOrderVisitAssetsMaterialsByVisit.apply(visitsService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET MATERIALS (orders_visits_assets_materials)
    // -------------------------------------------------------------------------
    async getAvailableMaterials(search: string = '', page: number = 0, pageSize: number = 20, providerCompanyId?: string): Promise<Material[]> {
        return materialsService.getAvailableMaterials.apply(materialsService, arguments as any);
    },

    async getMaterials(filter: number | 'all' = 'all', search: string = '', companyId?: string, page: number = 1, pageSize: number = 50): Promise<{ materials: Material[]; total: number }> {
        return materialsService.getMaterials.apply(materialsService, arguments as any);
    },

    async checkMaterialCodeExists(code: string, excludeId?: string): Promise<boolean> {
        return materialsService.checkMaterialCodeExists.apply(materialsService, arguments as any);
    },

    async createMaterial(material: Partial<Material>): Promise<Material> {
        return materialsService.createMaterial.apply(materialsService, arguments as any);
    },

    async getWarehouses(): Promise<{ id: string; code: string; description: string; address?: string }[]> {
        return warehouseService.getWarehouses.apply(warehouseService, arguments as any);
    },

    async getMaterialsStatuses(): Promise<{ id: number; code: string; description: string }[]> {
        return materialsService.getMaterialsStatuses.apply(materialsService, arguments as any);
    },

    async getMaterialsTypes(): Promise<{ id: number; code: string; description: string }[]> {
        return materialsService.getMaterialsTypes.apply(materialsService, arguments as any);
    },

    async getMaterialById(id: string): Promise<Material | null> {
        return materialsService.getMaterialById.apply(materialsService, arguments as any);
    },

    async getWarehouseMaterials(materialId: string): Promise<{ warehouse_id: string; warehouse_code: string; warehouse_description: string; warehouse_address?: string; quantity: number; min_stock: number; cost_avg: number }[]> {
        return warehouseService.getWarehouseMaterials.apply(warehouseService, arguments as any);
    },

    async getWarehouseMaterialsByIds(materialIds: string[]): Promise<Record<string, { warehouse_id: string; warehouse_code: string; warehouse_description: string; warehouse_address?: string; quantity: number; min_stock: number; cost_avg: number }[]>> {
        return warehouseService.getWarehouseMaterialsByIds.apply(warehouseService, arguments as any);
    },

    async createWarehouseMaterial(data: { warehouseId: string; materialId: string; quantity: number; minStock: number; priceUnit?: number }): Promise<void> {
        return warehouseService.createWarehouseMaterial.apply(warehouseService, arguments as any);
    },

    async updateWarehouseMaterial(warehouseId: string, materialId: string, data: { quantity?: number; minStock?: number; costAvg?: number }): Promise<void> {
        return warehouseService.updateWarehouseMaterial.apply(warehouseService, arguments as any);
    },

    async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
        return materialsService.updateMaterial.apply(materialsService, arguments as any);
    },

    async getOrderVisitAssetMaterials(ovAssetId: string): Promise<OrderVisitAssetMaterial[]> {
        return materialsService.getOrderVisitAssetMaterials.apply(materialsService, arguments as any);
    },

    async addMaterialToAsset(ovAssetId: string, materialId: string, amount: number, valueUnit: number, userId: string): Promise<void> {
        return materialsService.addMaterialToAsset.apply(materialsService, arguments as any);
    },

    async updateMaterialInAsset(id: string, updates: { amount?: number, discount?: number, valueUnit?: number }): Promise<void> {
        return materialsService.updateMaterialInAsset.apply(materialsService, arguments as any);
    },

    async removeMaterialFromAsset(id: string, userId: string): Promise<void> {
        return materialsService.removeMaterialFromAsset.apply(materialsService, arguments as any);
    },

    // PERMISSIONS MANAGEMENT
    async getCompanyProfiles(companyId: string): Promise<Profile[]> {
        return companiesService.getCompanyProfiles.apply(companiesService, arguments as any);
    },

    async getAllRoutes(): Promise<Route[]> {
        return orderConfigService.getAllRoutes.apply(orderConfigService, arguments as any);
    },

    async getUserPermissions(userId: string): Promise<Permission[]> {
        return usersService.getUserPermissions.apply(usersService, arguments as any);
    },

    async getProfilePermissions(profileId: string): Promise<Permission[]> {
        return usersService.getProfilePermissions.apply(usersService, arguments as any);
    },

    async updateProfilePermissions(profileId: string, permissions: any[]): Promise<void> {
        return usersService.updateProfilePermissions.apply(usersService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // ORDER VISITS - CLOSE
    // -------------------------------------------------------------------------
    async closeOrderVisit(
        visitId: string,
        orderId: string,
        statusId: number,
        statusDescription: string, // Passed from UI for notification
        suspendedReasonId: string | null,
        progress: number,
        user: User
    ): Promise<void> {
        return visitsService.closeOrderVisit.apply(visitsService, arguments as any);
    },

    async getOrdersVisitsServicesMerged(ovIds: string[]): Promise<any[]> {
        return visitsService.getOrdersVisitsServicesMerged.apply(visitsService, arguments as any);
    },

    async getOrdersVisitsMaterialsMerged(ovIds: string[]): Promise<any[]> {
        return visitsService.getOrdersVisitsMaterialsMerged.apply(visitsService, arguments as any);
    },

    async getOrdersVisitsVehiclesMerged(ovIds: string[]): Promise<any[]> {
        return visitsService.getOrdersVisitsVehiclesMerged.apply(visitsService, arguments as any);
    },

    async getOrdersVisitsAssetsMovedMerged(ovIds: string[]): Promise<any[]> {
        return visitsService.getOrdersVisitsAssetsMovedMerged.apply(visitsService, arguments as any);
    },

    /**
     * Busca o histórico completo de uma Solicitação de Serviço (SS).
     * Compila criação da OS, visitas e todas as intervenções realizadas.
     */
      async getServiceOrderHistory(orderId: string | number): Promise<ServiceHistoryItem[]> {
    return ordersService.getServiceOrderHistory.apply(ordersService, arguments as any);
  },


    /**
     * Reporta uma visita, alterando o processing_id de 1 (Rascunho) para 2 (Reportada)
     * @param visitId ID da visita
     * @param userId ID do usuário que está reportando
     * @returns Promise<void>
     * @throws Error se a visita não estiver em rascunho ou se houver ativos não reportados
     */
    async reportOrderVisit(visitId: string, userId: string): Promise<void> {
        return visitsService.reportOrderVisit.apply(visitsService, arguments as any);
    },

    /**
     * Marca uma visita como REVISADA (3), validando que TODOS os seus ativos já estão REVISADOS.
     * Visível/acionável quando: visita está REPORTADA (2) e ovAssetsAmount === ovAssetsRevisedAmount.
     * @param visitId ID da visita
     * @param userId ID do usuário que está marcando como revisada
     */
    async markOrderVisitAsRevised(visitId: string, userId: string): Promise<void> {
        return visitsService.markOrderVisitAsRevised.apply(visitsService, arguments as any);
    },

    async updateOrderVisitProcessing(visitId: string, processingId: number, userId: string, extraData?: { statusId: number; progress: number; suspendedReasonId?: number | null }): Promise<void> {
        return visitsService.updateOrderVisitProcessing.apply(visitsService, arguments as any);
    },

    async disapproveOrderVisit(visitId: string, userId: string): Promise<void> {
        return visitsService.disapproveOrderVisit.apply(visitsService, arguments as any);
    },

    async checkMovedAssetsForVisit(visitId: string): Promise<number> {
        return visitsService.checkMovedAssetsForVisit.apply(visitsService, arguments as any);
    },

    async reverseOrderVisitApproval(visitId: string): Promise<void> {
        return visitsService.reverseOrderVisitApproval.apply(visitsService, arguments as any);
    },

    // ─── Location Tracker ────────────────────────────────────────────────────

    async getUserTrackerInterval(userId: string): Promise<number | null> {
        return usersService.getUserTrackerInterval.apply(usersService, arguments as any);
    },



    // -------------------------------------------------------------------------
    // PREVENTIVE MAINTENANCE PLANS
    // -------------------------------------------------------------------------

    async getMaintenancePlans(assetTypeId?: string): Promise<MaintenancePlan[]> {
        return maintenancePlansService.getMaintenancePlans.apply(maintenancePlansService, arguments as any);
    },

    async getMaintenancePlanById(id: string): Promise<MaintenancePlan | null> {
        return maintenancePlansService.getMaintenancePlanById.apply(maintenancePlansService, arguments as any);
    },

    async createMaintenancePlan(plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        return maintenancePlansService.createMaintenancePlan.apply(maintenancePlansService, arguments as any);
    },

    async updateMaintenancePlan(id: string, plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        return maintenancePlansService.updateMaintenancePlan.apply(maintenancePlansService, arguments as any);
    },

    async duplicateMaintenancePlan(planId: string, userId: string): Promise<string> {
        return maintenancePlansService.duplicateMaintenancePlan.apply(maintenancePlansService, arguments as any);
    },

    async getMaintenancePlanSections(planId: string): Promise<MaintenancePlanSection[]> {
        return maintenancePlansService.getMaintenancePlanSections.apply(maintenancePlansService, arguments as any);
    },

    async createMaintenancePlanSection(section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        return maintenancePlansService.createMaintenancePlanSection.apply(maintenancePlansService, arguments as any);
    },

    async updateMaintenancePlanSection(id: string, section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        return maintenancePlansService.updateMaintenancePlanSection.apply(maintenancePlansService, arguments as any);
    },

    async getMaintenancePlanSectionActivities(sectionId: string): Promise<MaintenancePlanSectionActivity[]> {
        return maintenancePlansService.getMaintenancePlanSectionActivities.apply(maintenancePlansService, arguments as any);
    },

    async createMaintenancePlanSectionActivity(sectionId: string, activityId: string, userId: string, orderIndex?: number, description?: string, commentsDefault?: string): Promise<MaintenancePlanSectionActivity> {
        return maintenancePlansService.createMaintenancePlanSectionActivity.apply(maintenancePlansService, arguments as any);
    },

    async updateMaintenancePlanSectionActivity(id: string, payload: Partial<MaintenancePlanSectionActivity>, userId: string): Promise<void> {
        return maintenancePlansService.updateMaintenancePlanSectionActivity.apply(maintenancePlansService, arguments as any);
    },

    async removeMaintenancePlanSectionActivity(sectionActivityId: string, userId: string): Promise<void> {
        return maintenancePlansService.removeMaintenancePlanSectionActivity.apply(maintenancePlansService, arguments as any);
    },

    // To load checklist for an asset visit (fetch all activities filled out with maintenance_plan_id)
    async getMaintenanceChecklistItemsByVisit(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        return maintenancePlansService.getMaintenanceChecklistItemsByVisit.apply(maintenancePlansService, arguments as any);
    },

    async getMaintenanceChecklistItems(ovAssetId: string, planId: string): Promise<OrderVisitAssetActivity[]> {
        return maintenancePlansService.getMaintenanceChecklistItems.apply(maintenancePlansService, arguments as any);
    },

    // To load checklist history for an asset across all visits
    async getGlobalMaintenanceChecklistItems(assetId: string, planId: string, currentOvaId?: string): Promise<OrderVisitAssetActivity[]> {
        return maintenancePlansService.getGlobalMaintenanceChecklistItems.apply(maintenancePlansService, arguments as any);
    },

    async updateOrderVisitAssetPlan(ovAssetId: string, planId: string): Promise<void> {
        return maintenancePlansService.updateOrderVisitAssetPlan.apply(maintenancePlansService, arguments as any);
    },

    async updateOrderVisitAssetProgress(ovAssetId: string, progress: number): Promise<void> {
        return maintenancePlansService.updateOrderVisitAssetProgress.apply(maintenancePlansService, arguments as any);
    },

    async upsertMaintenanceChecklistItem(
        ovAssetId: string, 
        planId: string, 
        activityId: string, 
        userId: string, 
        updates: { 
            status?: 'OK' | 'NOK' | 'NA' | null, 
            comments?: string, 
            imgFilePath?: string, 
            imgFilesNames?: any 
        }
    ): Promise<OrderVisitAssetActivity | null> {
        return maintenancePlansService.upsertMaintenanceChecklistItem.apply(maintenancePlansService, arguments as any);
    },

    async deleteMaintenanceChecklistItem(ovAssetId: string, planId: string, activityId: string): Promise<void> {
        return maintenancePlansService.deleteMaintenanceChecklistItem.apply(maintenancePlansService, arguments as any);
    },

    async uploadChecklistImage(ovAssetId: string, activityId: string, file: File, companyId?: string, assetId?: string, onProgress?: (progress: number) => void): Promise<{ path: string; filename: string }> {
        return maintenancePlansService.uploadChecklistImage.apply(maintenancePlansService, arguments as any);
    },

    async removeChecklistImage(ovAssetId: string, planId: string, activityId: string, fileName: string, userId: string): Promise<OrderVisitAssetActivity | null> {
        return maintenancePlansService.removeChecklistImage.apply(maintenancePlansService, arguments as any);
    },

    async getAssetAvailabilityHistory7Days(unitAssetTagId: string, offsetDays: number = 0): Promise<{ date: string; isAvailable: boolean | null }[]> {
        return visitsService.getAssetAvailabilityHistory7Days.apply(visitsService, arguments as any);
    },

    async getAssetAvailabilityForExport(unitId: string, startDate: string, endDate: string, assetTagId?: string, assetTagSubId?: string): Promise<any[]> {
        return assetsService.getAssetAvailabilityForExport.apply(assetsService, arguments as any);
    },

    // ==========================================
    // MANUS INTEGRATION METHODS
    // ==========================================

    /**
     * Verifica se um contrato usa integração com Manus
     */
    async checkContractUsesManus(contractId: string): Promise<boolean> {
        return companiesService.checkContractUsesManus.apply(companiesService, arguments as any);
    },

    /**
     * Busca dados de uma visita no sistema Manus
     */
    async getManusVisitData(visitId: string): Promise<any | null> {
        return visitsService.getManusVisitData.apply(visitsService, arguments as any);
    },

    /**
     * Envia dados de uma visita para o Manus
     */
    async sendVisitToManus(visitId: string, visitData: any): Promise<boolean> {
        return visitsService.sendVisitToManus.apply(visitsService, arguments as any);
    },

    /**
     * Atualiza status de sincronização com Manus
     */
    async updateManusSyncStatus(visitId: string, status: string, message?: string): Promise<boolean> {
        return visitsService.updateManusSyncStatus.apply(visitsService, arguments as any);
    },

    async getVisitChatMessages(visitId: string): Promise<OrderVisitChatMessage[]> {
        return visitChatService.getVisitChatMessages.apply(visitChatService, arguments as any);
    },

    async sendVisitChatMessage(messageData: Partial<OrderVisitChatMessage> & { activeUserIds?: string[] }): Promise<OrderVisitChatMessage | null> {
        return visitChatService.sendVisitChatMessage.apply(visitChatService, arguments as any);
    },

    async toggleResolveChatAction(messageId: string, isResolved: boolean): Promise<void> {
        return visitChatService.toggleResolveChatAction.apply(visitChatService, arguments as any);
    },

    async getVisitChatParticipants(visitId: string): Promise<OrderVisitChatParticipant[]> {
        return visitChatService.getVisitChatParticipants.apply(visitChatService, arguments as any);
    },

    async addVisitChatParticipant(visitId: string, userId: string): Promise<void> {
        return visitChatService.addVisitChatParticipant.apply(visitChatService, arguments as any);
    },

    async removeVisitChatParticipant(visitId: string, userId: string): Promise<void> {
        return visitChatService.removeVisitChatParticipant.apply(visitChatService, arguments as any);
    },

    async sendChatNotifications(
        visitId: string,
        message: string,
        senderId: string,
        type: 'action' | 'info' | 'normal',
        activeUserIds: string[] = []
    ): Promise<void> {
        return visitChatService.sendChatNotifications.apply(visitChatService, arguments as any);
    },

    async markVisitChatMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
        return visitChatService.markVisitChatMessagesAsRead.apply(visitChatService, arguments as any);
    },

    async getVisitChatStatus(visitId: string): Promise<{ chatStatus: string; chatCreatedUserId: string | null; chatClosedAt: string | null; chatClosedUserId: string | null }> {
        return visitChatService.getVisitChatStatus.apply(visitChatService, arguments as any);
    },

    async closeVisitChat(visitId: string, userId: string): Promise<void> {
        return visitChatService.closeVisitChat.apply(visitChatService, arguments as any);
    },

    async reopenVisitChat(visitId: string, userId: string): Promise<void> {
        return visitChatService.reopenVisitChat.apply(visitChatService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // MATERIAL PURCHASES (materials_purchases)
    // -------------------------------------------------------------------------

    async createMaterialPurchase(data: { materialId: string; purchaseTypeId?: string; warehouseId?: string; quantity: number; unitPrice: number; justification: string; code?: string }): Promise<any> {
        return purchasesService.createMaterialPurchase.apply(purchasesService, arguments as any);
    },

      async getMaterialPurchases(materialId: string): Promise<any[]> {
    return purchasesService.getMaterialPurchases.apply(purchasesService, arguments as any);
  },


    async getMaterialPurchasesDashboard(): Promise<{ pending: number; authorized: number; completed: number; cancelled: number; pending_value: number; authorized_value: number }> {
        return purchasesService.getMaterialPurchasesDashboard.apply(purchasesService, arguments as any);
    },

      async getMaterialPurchasesAll(): Promise<any[]> {
    return purchasesService.getMaterialPurchasesAll.apply(purchasesService, arguments as any);
  },


    async getActivePurchasesMaterialIds(): Promise<Record<number, { hasPending: boolean; hasAuthorized: boolean }>> {
        return purchasesService.getActivePurchasesMaterialIds.apply(purchasesService, arguments as any);
    },

    async authorizeMaterialPurchase(id: string, data: { code: string; purchaseTypeId: string; warehouseId: string; quantity: number; unitPrice: number; justification: string }): Promise<void> {
        return purchasesService.authorizeMaterialPurchase.apply(purchasesService, arguments as any);
    },

      async cancelMaterialPurchase(id: string, cancelReason: string): Promise<void> {
    return purchasesService.cancelMaterialPurchase.apply(purchasesService, arguments as any);
  },


      async completeMaterialPurchase(id: string): Promise<void> {
    return purchasesService.completeMaterialPurchase.apply(purchasesService, arguments as any);
  },


    async getMaterialsBelowMinStock(): Promise<{
        material_id: number;
        material_code: string;
        material_description: string;
        material_unit: string;
        warehouse_id: string;
        warehouse_description: string;
        quantity: number;
        min_stock: number;
        cost_avg: number;
        deficit: number;
        deficit_value: number;
    }[]> {
        return materialsService.getMaterialsBelowMinStock.apply(materialsService, arguments as any);
    },

    async getMaterialsStockSummary(): Promise<{
        total_stock_value: number;
        total_materials: number;
        materials_without_stock: number;
        materials_below_min: number;
    }> {
        return materialsService.getMaterialsStockSummary.apply(materialsService, arguments as any);
    },

    async getRecentPurchases(limit = 5): Promise<any[]> {
        return purchasesService.getRecentPurchases.apply(purchasesService, arguments as any);
    },

    // -------------------------------------------------------------------------
    // TECHNICAL MANUALS (Documentos Técnicos)
    // -------------------------------------------------------------------------
    async getTechnicalManuals(
        filter: 'all' | 'active' | 'inactive' = 'all',
        search: string = '',
        assetTypeId?: string
    ): Promise<TechnicalManual[]> {
        return technicalManualsService.getTechnicalManuals.apply(technicalManualsService, arguments as any);
    },

    async getTechnicalManualsByAssetId(assetId: string): Promise<TechnicalManual[]> {
        return technicalManualsService.getTechnicalManualsByAssetId.apply(technicalManualsService, arguments as any);
    },

    async getTechnicalManualById(id: string): Promise<TechnicalManual | null> {
        return technicalManualsService.getTechnicalManualById.apply(technicalManualsService, arguments as any);
    },

    async createTechnicalManual(tm: Partial<TechnicalManual>): Promise<TechnicalManual> {
        return technicalManualsService.createTechnicalManual.apply(technicalManualsService, arguments as any);
    },

    async updateTechnicalManual(id: string, tm: Partial<TechnicalManual>): Promise<TechnicalManual> {
        return technicalManualsService.updateTechnicalManual.apply(technicalManualsService, arguments as any);
    },

    async deleteTechnicalManual(id: string): Promise<void> {
        return technicalManualsService.deleteTechnicalManual.apply(technicalManualsService, arguments as any);
    },

    async getTechnicalManualCategories(): Promise<TechnicalManualCategory[]> {
        return technicalManualsService.getTechnicalManualCategories.apply(technicalManualsService, arguments as any);
    },

    async createTechnicalManualCategory(tmCategory: Partial<TechnicalManualCategory>): Promise<TechnicalManualCategory> {
        return technicalManualsService.createTechnicalManualCategory.apply(technicalManualsService, arguments as any);
    },

    async getTechnicalManualFiles(tmId: string): Promise<TechnicalManualFile[]> {
        return technicalManualsService.getTechnicalManualFiles.apply(technicalManualsService, arguments as any);
    },

    async uploadTechnicalManualFile(tmId: string, file: File, companyId?: string, tmCategoryId?: string): Promise<TechnicalManualFile> {
        return technicalManualsService.uploadTechnicalManualFile.apply(technicalManualsService, arguments as any);
    },

    async deleteTechnicalManualFile(fileId: string): Promise<void> {
        return technicalManualsService.deleteTechnicalManualFile.apply(technicalManualsService, arguments as any);
    },

    async getAssociatedAssets(tmId: string): Promise<TechnicalManualAsset[]> {
        return technicalManualsService.getAssociatedAssets.apply(technicalManualsService, arguments as any);
    },

    async associateAsset(tmId: string, assetId: string): Promise<void> {
        return technicalManualsService.associateAsset.apply(technicalManualsService, arguments as any);
    },

    async dissociateAsset(tmId: string, assetId: string): Promise<void> {
        return technicalManualsService.dissociateAsset.apply(technicalManualsService, arguments as any);
    },

    async getAssetsByTypeForAssociation(assetTypeId: string, search?: string, excludeTmId?: string, clientId?: string, unitId?: string): Promise<{ id: string; code: string; description: string; tagDescription?: string; tagSubDescription?: string; statusDescription?: string }[]> {
        return technicalManualsService.getAssetsByTypeForAssociation.apply(technicalManualsService, arguments as any);
    }
};


