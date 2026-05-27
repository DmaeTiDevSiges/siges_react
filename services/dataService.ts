// Data Service for SIGES application
import { supabase } from './supabase';
import { r2Service } from './r2Service';
import { Asset, Contract, ContractManager, Company, Client, Department, Team, User, Profile, Permission, System, UnitType, Unit, Vehicle, Activity, Priority, Service, ContractService, Route, Material, OrderVisitAssetMaterial, OrderType, OrderSubType, OrderPlan, OrderObject, AssetType, AssetStatus, AssetPriority, AssetTag, AssetTagSub, AssetAttribute, AssetAttributeValue, Order, UserNotification, AssetHistoryItem, OrderFilters, OrderVisit, OrderVisitTeam, OrderVisitVehicle, OrderVisitService, OrderVisitAssetView, OrderVisitAssetActivity, ServiceHistoryItem, MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, AssetAlert, SuspendedReason, CauseReason } from '../types';



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


const getProcessingConfigurations = async () => {
    const { data, error } = await supabase
        .from('cfg_orders_visits_processing')
        .select('*');

    if (error || !data) return [];

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
        try {
            const { data, error } = await supabase
                .from('cfg_app')
                .select('*')
                .limit(1)
                .single();
            if (error) {
                console.error('Error fetching cfg_app:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Exception fetching cfg_app:', error);
            return null;
        }
    },
    async getProcessingConfigurations() {
        const { data, error } = await supabase
            .from('cfg_orders_visits_processing')
            .select('*')
            .order('id');

        if (error) {
            console.error('Error fetching processing configs:', error);
            return [];
        }

        return data as { id: number, description: string, icon: string, icon_color: string, bg_color: string }[];
    },

    // Atualização de Heartbeat do usuário
    async updateLastOnline(userId: string): Promise<void> {
        try {
            await supabase
                .from('users')
                .update({ last_online: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            console.error('Error updating last_online:', error);
        }
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

    async saveOrderVisitSignature(ovId: string, type: 'leader' | 'requester', base64: string): Promise<void> {
        // r2Service is now static

        const folderPath = `signatures/visits/${ovId}`;
        const fileName = `${type}_${Date.now()}.png`;
        const fullPath = `${folderPath}/${fileName}`;

        // Convert base64 to Blob
        try {
            const res = await fetch(base64);
            const blob = await res.blob();
            await r2Service.uploadFile(blob as any, fullPath);

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
        try {
            const { error } = await supabase
                .from('orders_visits')
                .update({
                    ov_is_filed: true,
                    ov_approved_filed_user_id: userId,
                    ov_approved_filed_at: getBrazilTime()
                })
                .eq('id', visitId);

            if (error) throw error;
        } catch (error) {
            console.error('[dataService] Error filing order visit:', error);
            throw error;
        }
    },

    async deleteOrderVisitSignature(visitId: string, type: 'leader' | 'requester'): Promise<void> {
        try {
            const updateData: any = {};
            if (type === 'leader') {
                updateData.ov_signature_leader_path = null;
                updateData.ov_signature_leader_name = null;
                updateData.ov_signature_leader_at = null;
            } else {
                updateData.ov_signature_requester_path = null;
                updateData.ov_signature_requester_name = null;
                updateData.ov_signature_requester_at = null;
            }

            const { error } = await supabase
                .from('orders_visits')
                .update(updateData)
                .eq('id', visitId);

            if (error) throw error;
        } catch (error) {
            console.error('[dataService] Error deleting signature:', error);
            throw error;
        }
    },

    // Private helper for mapping raw database items (v_orders) to Order type
    _mapOrder(
        item: any,
        companyMap?: Map<string, any>,
        realStatusMap?: Record<string, string>,
        leaderMap?: Map<string, any>,
        unitMap?: Map<string, any>
    ): Order {
        if (!item) return {} as Order;

        // UI mapping for status colors and progress (View doesn't have these columns directly)
        let statusName = item.status_description || item.status_name || item.status_code || item.o_status_description || item.status;
        let progressStr = item.progress ? `${item.progress}% ` : '0%';
        let iconColor = item.icon_color || (item.status_color || 'text-slate-500');
        if (iconColor && !iconColor.startsWith('text-') && !iconColor.startsWith('#')) {
            iconColor = `text-${iconColor}`;
        }
        let bgColor = item.background_color || 'transparent';
        if (bgColor !== 'transparent' && !bgColor.startsWith('bg-') && !bgColor.startsWith('#')) {
            bgColor = `bg-${bgColor}`;
        }
        let borderClass = (item.status_color || 'text-slate-500').replace('text-', 'border-l-');
        let statusIcon = item.status_icon || 'task_alt';

        switch (item.status_id) {
            case 1: if (!item.status_color) borderClass = 'border-l-orange-500'; break;
            case 2: if (!item.status_color) borderClass = 'border-l-yellow-500'; break;
        }

        const providerCompanyIdStr = item.provider_company_id?.toString();
        const company = providerCompanyIdStr ? companyMap?.get(providerCompanyIdStr) : null;

        // Use signed URL if available from company map, otherwise try public URL constructor (fallback)
        let providerLogoUrl = company?.signedUrl;

        if (!providerLogoUrl) {
            // Handle naming inconsistency in views (img_file_path vs img_path)
            const providerImgPath = item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path;
            const providerImgName = item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name;
            providerLogoUrl = this.getPublicImageUrl(providerImgPath, providerImgName, { width: 100, height: 100, resize: 'contain' });
        }

        const leaderLoc = item.team_leader_id ? leaderMap?.get(item.team_leader_id.toString()) : null;
        const unitInfo = item.unit_id ? unitMap?.get(item.unit_id.toString()) : null;

        return {
            id: item.id?.toString(),
            orderMask: item.order_mask,
            // Essential IDs for form inheritance
            typeId: item.type_id?.toString(),
            typeSubId: item.type_sub_id?.toString(),
            objectId: item.object_id?.toString(),
            contractId: item.contract_id?.toString(),
            planId: item.plan_id?.toString(),
            clientId: item.client_id?.toString(),
            departmentId: item.department_id?.toString(),
            unitAssetTagId: item.unit_asset_tag_id?.toString(),
            assetTagId: item.asset_tag_id?.toString(),
            assetTagSubId: item.asset_tag_sub_id?.toString(),
            // Other fields
            requestedServices: item.requested_services,
            requestedAt: item.requested_at,
            date: item.requested_at,
            createdAt: item.created_at,
            statusId: Number(item.status_id),
            statusName: statusName,
            statusDescription: statusName,
            status: statusName,
            statusAt: realStatusMap ? realStatusMap[item.id?.toString()] : item.status_at,
            progress: (() => {
                const p = parseFloat(String(item.progress || '0').replace('%', ''));
                return isNaN(p) ? '0%' : `${Math.round(p * 100)}%`;
            })(),
            statusIcon: item.status_icon || statusIcon,
            iconColor: iconColor,
            statusBackgroundColor: bgColor,
            borderColor: borderClass,
            statusColor: item.status_color,
            parentId: item.parent_id ? Number(item.parent_id) : null,
            unitId: item.unit_id?.toString(),
            unitDescription: item.unit_description,
            unitDescriptionFull: item.description_full || item.unit_description_full,
            typeDescription: item.type_description,
            unitAssetTagDescription: item.asset_tag_description || item.unit_asset_tag_description,
            assetTagDescription: item.asset_tag_description || item.unit_asset_tag_description,
            unitAssetTagSubDescription: item.asset_tag_sub_description || item.unit_asset_tag_sub_description,
            assetTagSubDescription: item.asset_tag_sub_description || item.unit_asset_tag_sub_description,
            typeCode: item.type_code,
            typeSubCode: item.type_sub_code,
            typeSubDescription: item.type_sub_description,
            providerCompanyId: item.provider_company_id?.toString(),
            providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
            providerCompanyDescription: item.provider_company_description,
            requesterName: item.requester_name,
            requesterTeamId: item.requester_team_id?.toString(),
            requesterTeamCode: item.requester_team_code,
            requesterTeamDescription: item.requester_team_description,
            requesterPhone: item.requester_phone,
            systemDescription: item.system_description,
            systemId: item.system_id?.toString(),
            providerLogo: providerLogoUrl,
            providerCompanyImgFilePath: item.provider_company_img_file_path,
            providerCompanyImgFileName: item.provider_company_img_file_name,
            priorityId: item.priority_id?.toString(),
            priorityName: item.priority_description,
            priorityDescription: item.priority_description,
            priorityCode: item.priority_code,
            priorityColor: item.priority_color,
            objectCode: item.object_code,
            objectDescription: item.object_description,
            causeReasonDescription: item.cause_reason_description || 'N/I',
            createdUserId: item.created_user_id?.toString(),
            teamId: item.team_id?.toString(),
            teamCode: item.team_code,
            teamDescription: item.team_description,
            teamLeaderId: item.team_leader_id?.toString(),
            teamLeaderNameShort: item.team_leader_name_short,
            updatedDate: item.updated_at,
            contractDescription: item.contract_description,
            planDescription: item.plan_description,
            clientName: item.client_name,
            unitLatitude: item.unit_latitude,
            unitLongitude: item.unit_longitude,
            unitAvatarUrl: unitInfo?.avatarUrl,
            imgFilePath: item.img_file_path,
            imgFileName: item.img_file_name,
            imgFilesNames: item.img_files_names,
            companyId: item.company_id?.toString(),
            ovCounter: item.ov_counter
        } as Order;
    },

    async getContracts(ids?: (string | number)[]): Promise<Contract[]> {
        let query = supabase.from('contracts').select('*');
        if (ids && ids.length > 0) {
            query = query.in('id', ids.map(id => id.toString()));
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching contracts:', error);
            return [];
        }

        const [companiesData, departmentsData, clientsData] = await Promise.all([
            dataService.getCompanies(),
            dataService.getDepartments(),
            dataService.getClients()
        ]);

        const companyMap = new Map<string, Company>(companiesData.map(c => [c.id, c]));
        const deptMap = new Map<string, Department>(departmentsData.map(d => [d.id, d]));
        const clientMap = new Map<string, Client>(clientsData.map(c => [c.id, c]));

        return data.map((item: any) => ({
            id: item.id.toString(),
            clientCompanyId: item.client_company_id?.toString(),
            clientDepartmentId: item.client_department_id?.toString(),
            providerCompanyId: item.provider_company_id?.toString(),
            providerDepartmentId: item.provider_department_id?.toString(),
            clientId: item.client_id?.toString(),
            description: item.description,
            object: item.object,
            isAvailable: item.is_available ?? true,
            isDeleted: item.is_deleted,
            code: item.code,
            statusId: item.status_id,
            createdUserId: item.created_user_id?.toString(),
            createdDate: item.created_date,
            updatedUserId: item.updated_user_id?.toString(),
            updatedDate: item.updated_date,
            deletedUserId: item.deleted_user_id?.toString(),
            deletedDate: item.deleted_date,
            isDev: item.is_dev,
            version: item.version,
            defaultOvAssetId: item.default_ov_asset_id?.toString(),
            defaultActivityId: item.default_activity_id?.toString(),
            dateStart: item.date_start,
            dateEnd: item.date_end,
            totalValue: item.total_value,
            clientCompanyName: companyMap.get(item.client_company_id?.toString())?.name || 'N/A',
            providerCompanyName: companyMap.get(item.provider_company_id?.toString())?.name || 'N/A',
            clientDepartmentName: deptMap.get(item.client_department_id?.toString())?.name,
            providerDepartmentName: deptMap.get(item.provider_department_id?.toString())?.name,
            clientName: clientMap.get(item.client_id?.toString())?.name,
            logoUrl: companyMap.get(item.provider_company_id?.toString())?.logoUrl
        })) as Contract[];
    },

    async getContractById(id: string): Promise<Contract | null> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching contract by id:', error);
            return null;
        }

        return {
            id: data.id.toString(),
            clientCompanyId: data.client_company_id?.toString(),
            clientDepartmentId: data.client_department_id?.toString(),
            providerCompanyId: data.provider_company_id?.toString(),
            providerDepartmentId: data.provider_department_id?.toString(),
            clientId: data.client_id?.toString(),
            description: data.description,
            object: data.object,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            code: data.code,
            statusId: data.status_id,
            // ... map other fields if necessary for UI, but for logic this is enough
        } as Contract;
    },

    async getContractsByClientDepartmentId(clientDepartmentId: string): Promise<Contract[]> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('client_department_id', clientDepartmentId)
            .eq('is_available', true)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching contracts by client:', error);
            return [];
        }

        const [companiesData, departmentsData] = await Promise.all([
            dataService.getCompanies(),
            dataService.getDepartments()
        ]);

        const companyMap = new Map<string, Company>(companiesData.map(c => [c.id, c]));
        const deptMap = new Map<string, Department>(departmentsData.map(d => [d.id, d]));

        return data.map((item: any) => ({
            id: item.id.toString(),
            clientCompanyId: item.client_company_id?.toString(),
            clientDepartmentId: item.client_department_id?.toString(),
            providerCompanyId: item.provider_company_id?.toString(),
            providerDepartmentId: item.provider_department_id?.toString(),
            clientId: item.client_id?.toString(),
            description: item.description,
            object: item.object,
            isAvailable: item.is_available ?? true,
            isDeleted: item.is_deleted,
            code: item.code,
            statusId: item.status_id,
            createdUserId: item.created_user_id?.toString(),
            createdDate: item.created_date,
            updatedUserId: item.updated_user_id?.toString(),
            updatedDate: item.updated_date,
            deletedUserId: item.deleted_user_id?.toString(),
            deletedDate: item.deleted_date,
            isDev: item.is_dev,
            version: item.version,
            defaultOvAssetId: item.default_ov_asset_id?.toString(),
            defaultActivityId: item.default_activity_id?.toString(),
            dateStart: item.date_start,
            dateEnd: item.date_end,
            totalValue: item.total_value,
            clientCompanyName: companyMap.get(item.client_company_id?.toString())?.name || 'N/A',
            providerCompanyName: companyMap.get(item.provider_company_id?.toString())?.name || 'N/A',
            clientDepartmentName: deptMap.get(item.client_department_id?.toString())?.name,
            providerDepartmentName: deptMap.get(item.provider_department_id?.toString())?.name,
            logoUrl: companyMap.get(item.provider_company_id?.toString())?.logoUrl
        })) as Contract[];
    },

    async getContractsByClientId(clientId: string): Promise<Contract[]> {
        try {
            // Passo 1: Buscar o cliente para descobrir a empresa vinculada
            // Usamos MaybeSingle para não estourar erro se não achar
            const { data: clientData } = await supabase
                .from('clients')
                .select('company_id')
                .eq('id', clientId)
                .maybeSingle();

            const companyId = clientData?.company_id;

            // Arrays para armazenar resultados
            let contractsByClient: any[] = [];
            let contractsByCompany: any[] = [];

            // Passo 2: Buscar contratos vinculados diretamente ao CLIENTE
            const { data: byClient, error: errClient } = await supabase
                .from('contracts')
                .select('*')
                .eq('client_id', clientId)
                .eq('is_available', true)
                .eq('is_deleted', false);

            if (!errClient && byClient) {
                contractsByClient = byClient;
            } else if (errClient) {
                console.error("Erro ao buscar contratos por cliente:", errClient);
            }

            // Passo 3: Se houver empresa, buscar contratos vinculados à EMPRESA
            if (companyId) {
                const { data: byCompany, error: errCompany } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('client_company_id', companyId)
                    .eq('is_available', true)
                    .eq('is_deleted', false);

                if (!errCompany && byCompany) {
                    contractsByCompany = byCompany;
                } else if (errCompany) {
                    console.error("Erro ao buscar contratos por empresa:", errCompany);
                }
            }

            // Passo 4: Combinar e remover duplicatas (pelo ID)
            const allContracts = [...contractsByClient, ...contractsByCompany];
            const uniqueContracts = Array.from(new Map(allContracts.map(item => [item['id'], item])).values());

            if (uniqueContracts.length === 0) {
                return [];
            }

            // Passo 5: Carregar dados auxiliares (Companies, Departments) para montar o objeto completo
            // Otimização: Carregar apenas o necessário ou usar cache seria melhor, mas seguindo o padrão atual:
            const [companiesData, departmentsData] = await Promise.all([
                dataService.getCompanies(),
                dataService.getDepartments()
            ]);

            const companyMap = new Map<string, Company>(companiesData.map(c => [c.id, c]));
            const deptMap = new Map<string, Department>(departmentsData.map(d => [d.id, d]));

            return uniqueContracts.map((item: any) => ({
                id: item.id.toString(),
                clientCompanyId: item.client_company_id?.toString(),
                clientDepartmentId: item.client_department_id?.toString(),
                providerCompanyId: item.provider_company_id?.toString(),
                providerDepartmentId: item.provider_department_id?.toString(),
                clientId: item.client_id?.toString(),
                description: item.description,
                isAvailable: item.is_available,
                isDeleted: item.is_deleted,
                code: item.code,
                statusId: item.status_id,
                createdUserId: item.created_user_id?.toString(),
                createdDate: item.created_date,
                updatedUserId: item.updated_user_id?.toString(),
                updatedDate: item.updated_date,
                deletedUserId: item.deleted_user_id?.toString(),
                deletedDate: item.deleted_date,
                isDev: item.is_dev,
                version: item.version,
                defaultOvAssetId: item.default_ov_asset_id?.toString(),
                defaultActivityId: item.default_activity_id?.toString(),
                dateStart: item.date_start,
                dateEnd: item.date_end,
                totalValue: item.total_value,
                clientCompanyName: companyMap.get(item.client_company_id?.toString())?.name || 'N/A',
                providerCompanyName: companyMap.get(item.provider_company_id?.toString())?.name || 'N/A',
                clientDepartmentName: deptMap.get(item.client_department_id?.toString())?.name,
                providerDepartmentName: deptMap.get(item.provider_department_id?.toString())?.name,
                logoUrl: companyMap.get(item.provider_company_id?.toString())?.logoUrl,
                providerCompanyCode: companyMap.get(item.provider_company_id?.toString())?.code
            })) as Contract[];

        } catch (error) {
            console.error('Erro fatal ao buscar contratos:', error);
            return [];
        }
    },

    async getCompanies(): Promise<Company[]> {
        const { data: companies, error } = await supabase
            .from('v_companies')
            .select('*');

        if (error) {
            console.error('Error fetching companies:', error);
            throw error;
        }

        const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';

        return companies.map((item: any) => {
            let logoUrl = undefined;
            if (item.img_file_name) {
                // Aqui usamos nossa função que já trata a correção de domínio da VPS e integra com imgproxy
                logoUrl = this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 200, height: 200, resize: 'contain' });
            }

            return {
                id: item.id.toString(),
                name: item.description,
                code: item.code,
                emailSuffix: item.email_sufix,
                logoPath: item.img_file_path,
                logoName: item.img_file_name,
                status: item.is_available ? 'active' : 'inactive',
                logoUrl: logoUrl || 'https://via.placeholder.com/150',
                category: 'Empresa',
                cnpj: item.code,
                phone: '',
                location: 'Localização não definida',
                contractCount: 0
            };
        }) as Company[];
    },

    async getCompanyById(id: string): Promise<Company | null> {
        if (!id) return null;

        const { data, error } = await supabase
            .from('v_companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching company by id:', error);
            return null;
        }

        const item = data;
        return {
            id: item.id.toString(),
            name: item.description,
            code: item.code,
            emailSuffix: item.email_sufix,
            logoPath: item.img_file_path,
            logoName: item.img_file_name,
            status: item.is_available ? 'active' : 'inactive',
            logoUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'contain' }) || 'https://via.placeholder.com/150',

            category: 'Empresa',
            cnpj: item.code,
            phone: '',
            location: 'LocalizaÃ§Ã£o nÃ£o definida',
            contractCount: 0
        };
    },

    async createCompany(company: Partial<Company>): Promise<Company> {
        // 1. Insert initial data (without logo path for now if it's a file upload)
        const dbData = {
            description: company.name,
            code: company.code,
            email_sufix: company.emailSuffix,
            is_available: company.status === 'active',
            // If it's a URL (not base64), save it. If base64, we'll update after upload.
            img_file_path: company.logoUrl?.startsWith('data:') ? null : company.logoUrl,
        };

        const { data: newCompany, error: insertError } = await supabase
            .from('cfg_companies')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        let finalLogoUrl = company.logoUrl;
        const companyId = newCompany.id;

        // 2. Automate Client (Partner) creation for the new Company
        try {
            await supabase
                .from('clients')
                .insert({
                    name: company.name,
                    code: company.code,
                    is_available: true,
                    company_id: companyId,
                    is_deleted: false
                });
        } catch (clientErr) {
            console.error("Failed to create partner client for new company", clientErr);
        }

        // 3. Upload Logo if it's base64 to R2
        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            try {
                // r2Service is now static

                const folderPath = `companies/${companyId}/logo`;
                const fileName = `${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                // Convert Base64 to Blob and upload to R2
                const res = await fetch(company.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath);

                // 3. Update company with new path and name
                const { error: updateError } = await supabase
                    .from('cfg_companies')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', companyId);

                if (!updateError) {
                    finalLogoUrl = fullPath;
                }
            } catch (err) {
                console.error("Failed to process logo upload to R2", err);
            }
        }

        return {
            ...company,
            id: companyId.toString(),
            // If we uploaded successfully, we could return the derived URL, but for immediate UI feedback, 
            // returning the base64 (which is already in `company`) keeps the UI snappy without reload.
            // But lets try to return the structure mimicking a fresh fetch if possible? 
            // For now, simpler is better: return what we have plus ID.
        } as Company;
    },

    async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
        const dbData = {
            description: company.name,
            code: company.code,
            email_sufix: company.emailSuffix,
            is_available: company.status === 'active'
        };

        // Fetch current company to check for old logo if we are about to upload a new one
        let oldLogoPath = null;
        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            const { data: currentComp } = await supabase
                .from('cfg_companies')
                .select('img_file_path, img_file_name')
                .eq('id', id)
                .single();
            if (currentComp?.img_file_path && currentComp?.img_file_name) {
                oldLogoPath = `${currentComp.img_file_path}/${currentComp.img_file_name}`;
            }
        }

        const { error: updateError } = await supabase
            .from('cfg_companies')
            .update(dbData)
            .eq('id', id);

        if (updateError) throw updateError;

        // Upload Logo if changed and is base64
        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            try {
                const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
                const folderPath = `companies/${id}/logo`;
                const fileName = `${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(company.logoUrl);
                const blob = await res.blob();

                // 1. Upload new logo
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(fullPath, blob, {
                        contentType: blob.type,
                        upsert: true
                    });

                if (!uploadError) {
                    // 2. Update DB with new path
                    await supabase
                        .from('cfg_companies')
                        .update({
                            img_file_path: folderPath,
                            img_file_name: fileName
                        })
                        .eq('id', id);

                    // 3. Delete old logo if it existed
                    if (oldLogoPath) {
                        await supabase.storage
                            .from(bucketName)
                            .remove([oldLogoPath]);
                    }
                }
            } catch (err) {
                console.error("Failed to process new logo upload/old logo deletion", err);
            }
        }

        return { ...company, id } as Company;
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
        const pageSize = filters?.pageSize ?? 100;
        const page = filters?.page ?? 0;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('v_orders_visits')
            .select('*', { count: 'exact' })
            .order('ov_started_at', { ascending: false })
            .range(from, to);

        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const startDate = filters?.startDate || todayStr;
        const endDate = filters?.endDate || todayStr;

        const startStr = startDate.includes('T') || startDate.includes(' ') ? startDate : `${startDate} 00:00:00`;
        query = query.or(`ov_started_at.gte.${startStr},and(ov_started_at.is.null,o_requested_at.gte.${startStr})`);

        const endStr = endDate.includes('T') || endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;
        query = query.or(`ov_started_at.lte.${endStr},and(ov_started_at.is.null,o_requested_at.lte.${endStr})`);

        // Helper to apply array or single value filter
        const applyFilter = (col: string, val?: string | string[]) => {
            if (!val) return;
            if (Array.isArray(val)) {
                if (val.length > 0) query = query.in(col, val);
            } else {
                query = query.eq(col, val);
            }
        };

        applyFilter('o_contract_id', filters?.contractId);
        applyFilter('o_system_parent_id', filters?.systemParentId);
        applyFilter('o_system_id', filters?.systemId);
        applyFilter('o_unit_type_parent_id', filters?.unitTypeParentId);
        applyFilter('o_unit_type_id', filters?.unitTypeId);
        applyFilter('o_unit_id', filters?.unitId);
        applyFilter('o_object_id', filters?.orderObjectId);
        applyFilter('o_type_id', filters?.orderTypeId);
        applyFilter('o_type_sub_id', filters?.orderTypeSubId);
        applyFilter('o_asset_tag_id', filters?.assetTagId);
        applyFilter('o_asset_tag_sub_id', filters?.assetTagSubId);
        applyFilter('o_plan_id', filters?.orderPlanId);
        applyFilter('o_team_id', filters?.orderTeamId);

        if (filters?.searchQuery) {
            const search = `%${filters.searchQuery}%`;
            query = query.or(`ov_mask.ilike.${search},o_unit_description.ilike.${search},client_name.ilike.${search},o_mask.ilike.${search}`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching visits view:', error);
            return { data: [], count: 0 };
        }

        return { data: data ?? [], count: count ?? 0 };
    },

    async deleteCompany(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async createContract(contract: Partial<Contract>): Promise<Contract> {
        const dbData = {
            client_company_id: contract.clientCompanyId ? parseInt(contract.clientCompanyId) : null,
            client_department_id: contract.clientDepartmentId ? parseInt(contract.clientDepartmentId) : null,
            provider_company_id: contract.providerCompanyId ? parseInt(contract.providerCompanyId) : null,
            provider_department_id: contract.providerDepartmentId ? parseInt(contract.providerDepartmentId) : null,
            client_id: contract.clientId ? parseInt(contract.clientId) : null,
            description: contract.description,
            object: contract.object,
            is_available: contract.isAvailable !== undefined ? contract.isAvailable : true,
            code: contract.code,
            status_id: contract.statusId,
            date_start: contract.dateStart,
            date_end: contract.dateEnd,
            total_value: contract.totalValue,
            is_dev: contract.isDev,
            version: contract.version,
            default_ov_asset_id: contract.defaultOvAssetId ? parseInt(contract.defaultOvAssetId) : null,
            default_activity_id: contract.defaultActivityId ? parseInt(contract.defaultActivityId) : null
        };

        const { data, error } = await supabase
            .from('contracts')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...contract,
            id: data.id.toString()
        } as Contract;
    },

    async updateContract(id: string, contract: Partial<Contract>): Promise<Contract> {
        const dbData: any = {};
        if (contract.clientCompanyId !== undefined) dbData.client_company_id = contract.clientCompanyId ? parseInt(contract.clientCompanyId) : null;
        if (contract.clientDepartmentId !== undefined) dbData.client_department_id = contract.clientDepartmentId ? parseInt(contract.clientDepartmentId) : null;
        if (contract.providerCompanyId !== undefined) dbData.provider_company_id = contract.providerCompanyId ? parseInt(contract.providerCompanyId) : null;
        if (contract.providerDepartmentId !== undefined) dbData.provider_department_id = contract.providerDepartmentId ? parseInt(contract.providerDepartmentId) : null;
        if (contract.clientId !== undefined) dbData.client_id = contract.clientId ? parseInt(contract.clientId) : null;
        if (contract.description !== undefined) dbData.description = contract.description;
        if (contract.object !== undefined) dbData.object = contract.object;
        if (contract.isAvailable !== undefined) dbData.is_available = contract.isAvailable;
        if (contract.code !== undefined) dbData.code = contract.code;
        if (contract.statusId !== undefined) dbData.status_id = contract.statusId;
        if (contract.dateStart !== undefined) dbData.date_start = contract.dateStart;
        if (contract.dateEnd !== undefined) dbData.date_end = contract.dateEnd;
        if (contract.totalValue !== undefined) dbData.total_value = contract.totalValue;
        if (contract.isDev !== undefined) dbData.is_dev = contract.isDev;
        if (contract.version !== undefined) dbData.version = contract.version;
        if (contract.defaultOvAssetId !== undefined) dbData.default_ov_asset_id = contract.defaultOvAssetId ? parseInt(contract.defaultOvAssetId) : null;
        if (contract.defaultActivityId !== undefined) dbData.default_activity_id = contract.defaultActivityId ? parseInt(contract.defaultActivityId) : null;

        const { data, error } = await supabase
            .from('contracts')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...contract,
            id: data.id.toString()
        } as Contract;
    },

    async deleteContract(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },



    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                cfg_users_statuses (
                     id,
                     description
                ),
                cfg_profiles (
                    description
                ),
                cfg_teams (
                    description,
                    company_id,
                    department_id
                )
            `)
            .order('name_full');

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        // Manually fetch companies to avoid potential Relation error if FK is missing
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, code, img_file_path, img_file_name');
        const companyMap = new Map((companies || []).map((c: any) => [c.id, {
            name: c.description,
            logoUrl: this.getPublicImageUrl(c.img_file_path, c.img_file_name, { width: 100, height: 100, resize: 'contain' })
        }]));

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            phone: item.phone,
            avatarUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name || 'noImageUser.png', { width: 70, height: 70, resize: 'cover' }),

            companyId: (item.company_id || item.cfg_teams?.company_id)?.toString(),
            departmentId: item.cfg_teams?.department_id?.toString(),
            name: item.name_full,
            createdAt: item.created_at,
            teamId: item.team_id?.toString(),
            teamName: item.cfg_teams?.description,
            companyName: companyMap.get(item.company_id || item.cfg_teams?.company_id)?.name || 'N/A',
            companyLogoUrl: companyMap.get(item.company_id || item.cfg_teams?.company_id)?.logoUrl,
            vehicleId: item.vehicle_id?.toString(),
            isTeamLeader: item.is_team_leader,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async getDepartments(): Promise<Department[]> {
        const { data, error } = await supabase
            .from('cfg_departments')
            .select(`*`);

        if (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            parentId: item.parent_id?.toString(),
            companyName: item.cfg_companies?.description || 'Desconhecida'
        })) as Department[];
    },

    async getDepartmentsByCompany(companyId: string): Promise<Department[]> {
        const { data, error } = await supabase
            .from('cfg_departments')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching departments by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            parentId: item.parent_id?.toString()
        })) as Department[];
    },

    async createDepartment(department: Partial<Department>): Promise<Department> {
        const dbData = {
            company_id: department.companyId,
            description: department.name,
            code: department.code,
            is_available: department.status === 'active',
            parent_id: department.parentId || null
        };

        const { data, error } = await supabase
            .from('cfg_departments')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...department,
            id: data.id.toString()
        } as Department;
    },

    async updateDepartment(id: string, department: Partial<Department>): Promise<Department> {
        const dbData = {
            description: department.name,
            code: department.code,
            is_available: department.status === 'active',
            parent_id: department.parentId || null
        };

        const { data, error } = await supabase
            .from('cfg_departments')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...department,
            id: data.id.toString()
        } as Department;
    },

    async deleteDepartment(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getTeams(companyId?: string): Promise<Team[]> {
        let query = supabase.from('cfg_teams').select('*').eq('is_available', 'true');
        if (companyId) query = query.eq('company_id', companyId);

        const { data, error } = await query.order('description');
        if (error) { console.error('Error fetching teams:', error); return []; }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id?.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            companyId: item.company_id?.toString()
        })) as Team[];
    },

    async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
        const { data, error } = await supabase
            .from('cfg_teams')
            .select('*')
            .eq('department_id', departmentId);

        if (error) {
            console.error('Error fetching teams by department:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive'
        })) as Team[];
    },

    async createTeam(team: Partial<Team>): Promise<Team> {
        let companyId = team.companyId;

        // If companyId is missing but departmentId is present, fetch it from department
        if (!companyId && team.departmentId) {
            const { data: dept } = await supabase
                .from('cfg_departments')
                .select('company_id')
                .eq('id', team.departmentId)
                .single();
            if (dept) companyId = dept.company_id.toString();
        }

        const dbData = {
            department_id: team.departmentId,
            company_id: companyId,
            description: team.name,
            code: team.code,
            is_available: true
        };

        const { data, error } = await supabase
            .from('cfg_teams')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...team,
            id: data.id.toString()
        } as Team;
    },

    async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
        const dbData = {
            description: team.name,
            code: team.code,
            is_available: team.status === 'active'
        };

        const { data, error } = await supabase
            .from('cfg_teams')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...team,
            id: data.id.toString()
        } as Team;
    },

    async deleteTeam(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_teams')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getActivities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Activity[]> {
        // 1. Base query for activities
        let query = supabase
            .from('cfg_activities')
            .select('*')
            .eq('is_deleted', 'false')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', true);
        } else if (filter === 'inactive') {
            query = query.eq('is_available', false);
        }

        if (search) {
            // Filter by description OR code
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: activitiesData, error: activitiesError } = await query;

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
            throw activitiesError;
        }

        if (!activitiesData || activitiesData.length === 0) {
            return [];
        }

        // 2. Batch fetch linked order types and sub-types to avoid N+1 problem
        const activityIds = activitiesData.map((a: any) => a.id);

        let allTypeLinks: any[] = [];
        let allSubTypeLinks: any[] = [];

        if (activityIds.length > 0) {
            const typesRes = await supabase
                .from('cfg_orders_types_activities')
                .select('activity_id, o_type_id')
                .in('activity_id', activityIds);

            if (!typesRes.error && typesRes.data) allTypeLinks = typesRes.data;
        }

        // 3. Map results
        return activitiesData.map((item: any) => {
            const itemTypeLinks = allTypeLinks.filter(l => l.activity_id === item.id);
            const linkedOrderTypeIds = itemTypeLinks.map(l => l.o_type_id.toString());

            return {
                id: item.id.toString(),
                companyId: item.company_id?.toString(),
                departmentId: item.department_id?.toString(),
                code: item.code || '',
                description: item.description,
                isAvailable: item.is_available ?? true,
                isDeleted: item.is_deleted,
                linkedOrderTypeIds,
                linkedOrderSubTypeIds: [] // No longer used
            };
        });
    },



    async createActivity(activity: Partial<Activity>): Promise<Activity> {
        const dbData = {
            company_id: activity.companyId ? parseInt(activity.companyId) : null,
            department_id: activity.departmentId ? parseInt(activity.departmentId) : null,
            code: activity.code,
            description: activity.description,
            is_available: activity.isAvailable,
            is_deleted: false
        };

        const { data, error } = await supabase
            .from('cfg_activities')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        // Sync linked order types
        if (activity.linkedOrderTypeIds && activity.linkedOrderTypeIds.length > 0) {
            const relations = activity.linkedOrderTypeIds.map(orderTypeId => ({
                activity_id: data.id,
                o_type_id: orderTypeId,
                is_available: true
            }));
            await supabase.from('cfg_orders_types_activities').insert(relations);
        }

        return {
            ...activity,
            id: data.id.toString()
        } as Activity;
    },

    async updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
        const dbData: any = {};
        if (activity.companyId !== undefined) dbData.company_id = activity.companyId ? parseInt(activity.companyId) : null;
        if (activity.departmentId !== undefined) dbData.department_id = activity.departmentId ? parseInt(activity.departmentId) : null;
        if (activity.code !== undefined) dbData.code = activity.code;
        if (activity.description !== undefined) dbData.description = activity.description;
        if (activity.isAvailable !== undefined) dbData.is_available = activity.isAvailable;

        const { data, error } = await supabase
            .from('cfg_activities')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update links if provided
        if (activity.linkedOrderTypeIds) {
            // Remove old links
            await supabase.from('cfg_orders_types_activities').delete().eq('activity_id', id);
            // Add new links
            if (activity.linkedOrderTypeIds.length > 0) {
                const relations = activity.linkedOrderTypeIds.map(orderTypeId => ({
                    activity_id: parseInt(id),
                    o_type_id: parseInt(orderTypeId),
                    is_available: true
                }));
                await supabase.from('cfg_orders_types_activities').insert(relations);
            }
        }

        return {
            ...activity,
            id: data.id.toString()
        } as Activity;
    },

    async deleteActivity(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_activities')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // PRIORITIES (cfg_orders_priorities)
    // -------------------------------------------------------------------------
    async getPriorities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Priority[]> {
        let query = supabase
            .from('cfg_orders_priorities')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching priorities:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            color: item.color || undefined
        })) as Priority[];
    },

    async createPriority(priority: Partial<Priority>): Promise<Priority> {
        const dbData = {
            code: priority.code,
            description: priority.description,
            is_available: priority.isAvailable,
            color: priority.color
        };

        const { data, error } = await supabase
            .from('cfg_orders_priorities')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...priority,
            id: data.id.toString()
        } as Priority;
    },

    async updatePriority(id: string, priority: Partial<Priority>): Promise<Priority> {
        const dbData = {
            code: priority.code,
            description: priority.description,
            is_available: priority.isAvailable,
            color: priority.color
        };

        const { data, error } = await supabase
            .from('cfg_orders_priorities')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...priority,
            id: data.id.toString()
        } as Priority;
    },

    async deletePriority(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_priorities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ORDER TYPES (cfg_orders_types)
    // -------------------------------------------------------------------------
    async getOrderTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderType[]> {
        let query = supabase
            .from('cfg_orders_types')
            .select(`*`)
            .eq('is_deleted', 'false')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', true);
        } else if (filter === 'inactive') {
            query = query.eq('is_available', false);
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching order types:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id?.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            departmentName: item.cfg_departments?.description || 'Desconhecido'
        })) as OrderType[];
    },

    async createOrderType(orderType: Partial<OrderType>): Promise<OrderType> {
        const dbData = {
            department_id: orderType.departmentId ? parseInt(orderType.departmentId) : null,
            code: orderType.code,
            description: orderType.description,
            is_available: orderType.isAvailable,
            is_deleted: false
        };

        const { data, error } = await supabase
            .from('cfg_orders_types')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderType,
            id: data.id.toString()
        } as OrderType;
    },

    async updateOrderType(id: string, orderType: Partial<OrderType>): Promise<OrderType> {
        const dbData: any = {};
        if (orderType.departmentId !== undefined) dbData.department_id = orderType.departmentId ? parseInt(orderType.departmentId) : null;
        if (orderType.code !== undefined) dbData.code = orderType.code;
        if (orderType.description !== undefined) dbData.description = orderType.description;
        if (orderType.isAvailable !== undefined) dbData.is_available = orderType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderType,
            id: data.id.toString()
        } as OrderType;
    },

    async deleteOrderType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ORDER SUB-TYPES (cfg_orders_types_subs)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // ASSET ALERTS (assets_alerts)
    // -------------------------------------------------------------------------
    async getAssetAlerts(assetId: string): Promise<AssetAlert[]> {
        const { data, error } = await supabase
            .from('assets_alerts')
            .select(`
                *,
                cfg_orders_types (
                    description
                ),
                cfg_orders_priorities (
                    description,
                    color
                )
            `)
            .eq('asset_id', assetId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching asset alerts:', error);
            throw error;
        }

        // Buscar ov_ended_at da view para alertas resolvidos
        const ovaIds = (data || [])
            .filter((item: any) => item.ova_id)
            .map((item: any) => item.ova_id);

        let resolvedMap = new Map<string, string>();
        if (ovaIds.length > 0) {
            const { data: ovaData } = await supabase
                .from('v_orders_visits_assets')
                .select('id, ov_ended_at')
                .in('id', ovaIds);

            if (ovaData) {
                ovaData.forEach((ova: any) => {
                    if (ova.ov_ended_at) {
                        resolvedMap.set(ova.id.toString(), ova.ov_ended_at);
                    }
                });
            }
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            assetId: item.asset_id.toString(),
            oTypeId: item.o_type_id?.toString(),
            priorityId: item.priority_id?.toString(),
            description: item.description,
            isDone: item.is_done,
            ovaId: item.ova_id?.toString(),
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            updatedUserId: item.updated_user_id?.toString(),
            updatedAt: item.updated_at,
            isDeleted: item.is_deleted,
            deletedUserId: item.deleted_user_id?.toString(),
            deletedAt: item.deleted_at,
            resolvedAt: item.ova_id ? resolvedMap.get(item.ova_id.toString()) : undefined,
            orderTypeName: item.cfg_orders_types?.description,
            priorityName: item.cfg_orders_priorities?.description,
            priorityColor: item.cfg_orders_priorities?.color
        })) as AssetAlert[];
    },
    async getAllAssetAlerts(): Promise<AssetAlert[]> {
        // 1. Fetch all alerts
        const { data: alertsData, error: alertsError } = await supabase
            .from('assets_alerts')
            .select(`
                *,
                cfg_orders_types ( description ),
                cfg_orders_priorities ( description, color )
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (alertsError) {
            console.error('Error fetching all asset alerts:', alertsError);
            throw alertsError;
        }

        if (!alertsData || alertsData.length === 0) {
            return [];
        }

        // 2. Extract unique asset IDs
        const assetIds = [...new Set(alertsData.map((d: any) => d.asset_id).filter(Boolean))];

        // 3. Fetch asset details from v_assets view (already has client, unit, tags joined)
        let assetsMap = new Map<string, any>();

        if (assetIds.length > 0) {
            const { data: assetsDataList, error: assetsError } = await supabase
                .from('v_assets')
                .select('*')
                .in('id', assetIds);

            if (assetsError) {
                console.error('Error fetching assets for alerts:', assetsError);
            } else if (assetsDataList && assetsDataList.length > 0) {
                assetsMap = new Map(assetsDataList.map((a: any) => [a.id.toString(), a]));
                const unitIds = [...new Set(assetsDataList.map((a: any) => a.unit_id).filter(Boolean))];
                if (unitIds.length > 0) {
                    const { data: unitsData } = await supabase.from('v_units').select('id, client_name').in('id', unitIds);
                    if (unitsData) {
                        unitsData.forEach((u: any) => {
                            for (const a of assetsDataList) {
                                if (a.unit_id?.toString() === u.id?.toString()) {
                                    a.injected_client_name = u.client_name;
                                }
                            }
                        });
                    }
                }
            }
        }

        // Fetch ov_ended_at for resolved alerts (where ovaId is present)
        const ovaIds = [...new Set(alertsData.filter((a: any) => a.is_done && a.ova_id).map((a: any) => a.ova_id))];
        let resolvedMap = new Map<string, string>();
        if (ovaIds.length > 0) {
            const { data: ovaData } = await supabase
                .from('v_orders_visits_assets')
                .select('id, ov_ended_at')
                .in('id', ovaIds);
            
            if (ovaData) {
                resolvedMap = new Map(ovaData.map((o: any) => [o.id.toString(), o.ov_ended_at]));
            }
        }

        // Build lookup maps for extras
        const clientByAssetId = new Map<string, string>();
        for (const [assetId, assetObj] of assetsMap) {
            const raw = assetObj as any;
            if (raw.injected_client_name) clientByAssetId.set(assetId, raw.injected_client_name);
        }

        return alertsData.map((item: any) => {
            const assetData = assetsMap.get(item.asset_id?.toString());

            const resolvedAt = (item.is_done && item.ova_id) ? resolvedMap.get(item.ova_id.toString()) : undefined;

            return {
                id: item.id.toString(),
                assetId: item.asset_id?.toString(),
                description: item.description,
                isDone: item.is_done,
                ovaId: item.ova_id?.toString(),
                priorityId: item.priority_id,
                orderTypeId: item.order_type_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdUserId: item.created_user_id?.toString(),
                updatedUserId: item.updated_user_id?.toString(),
                isDeleted: item.is_deleted,

                priorityName: item.cfg_orders_priorities?.description,
                priorityColor: item.cfg_orders_priorities?.color,
                orderTypeName: item.cfg_orders_types?.description,
                assetCode: assetData?.code,
                assetStatusName: assetData?.status_code || '',
                assetStatusColor: assetData?.status_color || '',
                assetDescription: assetData?.description,
                unitDescription: assetData?.unit_description_full || assetData?.unit_description || assetData?.description_full,
                clientName: clientByAssetId.get(item.asset_id?.toString()) || assetData?.client_name || assetData?.client_description,
                tagName: assetData?.tag_name || assetData?.tag_description || assetData?.asset_tag_description || assetData?.unit_asset_tag_description,
                tagSubName: assetData?.tag_sub_name || assetData?.tag_sub_description || assetData?.asset_tag_sub_description || assetData?.unit_asset_tag_sub_description,
                resolvedAt
            } as AssetAlert;
        });
    },

    async getAllActiveAssetAlerts(): Promise<AssetAlert[]> {
        // 1. Fetch active alerts
        const { data: alertsData, error: alertsError } = await supabase
            .from('assets_alerts')
            .select(`
                *,
                cfg_orders_types ( description ),
                cfg_orders_priorities ( description, color )
            `)
            .eq('is_done', false)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (alertsError) {
            console.error('Error fetching active asset alerts:', alertsError);
            throw alertsError;
        }

        if (!alertsData || alertsData.length === 0) {
            return [];
        }

        // 2. Extract unique asset IDs
        const assetIds = [...new Set(alertsData.map((d: any) => d.asset_id).filter(Boolean))];

        // 3. Fetch asset details from v_assets view (already has client, unit, tags joined)
        let assetsMap = new Map<string, any>();

        if (assetIds.length > 0) {
            const { data: assetsDataList, error: assetsError } = await supabase
                .from('v_assets')
                .select('*')
                .in('id', assetIds);

            if (assetsError) {
                console.error('Error fetching assets for alerts:', assetsError);
            } else if (assetsDataList && assetsDataList.length > 0) {
                assetsMap = new Map(assetsDataList.map((a: any) => [a.id.toString(), a]));
                const unitIds = [...new Set(assetsDataList.map((a: any) => a.unit_id).filter(Boolean))];
                if (unitIds.length > 0) {
                    const { data: unitsData } = await supabase.from('v_units').select('id, client_name').in('id', unitIds);
                    if (unitsData) {
                        unitsData.forEach((u: any) => {
                            for (const a of assetsDataList) {
                                if (a.unit_id?.toString() === u.id?.toString()) {
                                    a.injected_client_name = u.client_name;
                                }
                            }
                        });
                    }
                }
            }
        }

        // Build lookup maps for extras
        const clientByAssetId = new Map<string, string>();
        for (const [assetId, assetObj] of assetsMap) {
            const raw = assetObj as any;
            if (raw.injected_client_name) clientByAssetId.set(assetId, raw.injected_client_name);
        }

        // 4. Map everything together
        return alertsData.map((d: any) => {
            const assetIdStr = d.asset_id?.toString();
            const asset = assetIdStr ? assetsMap.get(assetIdStr) : null;

            return {
                id: d.id.toString(),
                assetId: d.asset_id?.toString(),
                assetDescription: asset?.description,
                assetCode: asset?.code,
                assetStatusName: asset?.status_code || '',
                assetStatusColor: asset?.status_color || '',
                clientName: clientByAssetId.get(assetIdStr || '') || asset?.client_name || asset?.client_description || '',
                unitDescription: asset?.unit_description_full || asset?.unit_description || asset?.description_full || '',
                tagName: asset?.tag_name || asset?.tag_description || asset?.asset_tag_description || asset?.unit_asset_tag_description || '',
                tagSubName: asset?.tag_sub_name || asset?.tag_sub_description || asset?.asset_tag_sub_description || asset?.unit_asset_tag_sub_description || '',
                oTypeId: d.o_type_id?.toString(),
                orderTypeName: d.cfg_orders_types?.description,
                priorityId: d.priority_id?.toString(),
                priorityName: d.cfg_orders_priorities?.description,
                priorityColor: d.cfg_orders_priorities?.color,
                description: d.description,
                isDone: d.is_done,
                ovaId: d.ova_id?.toString(),
                createdAt: d.created_at,
                createdUserId: d.created_user_id?.toString()
            };
        }) as AssetAlert[];
    },

    async createAssetAlert(alert: Partial<AssetAlert>): Promise<AssetAlert> {
        const currentUser = await this.getCurrentUser();

        const dbData: any = {
            asset_id: alert.assetId ? parseInt(alert.assetId) : null,
            o_type_id: alert.oTypeId ? parseInt(alert.oTypeId) : null,
            priority_id: alert.priorityId ? parseInt(alert.priorityId) : null,
            description: alert.description,
            is_done: alert.isDone ?? false,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            created_at: new Date().toISOString()
        };

        if (alert.ovaId) {
            dbData.ova_id = parseInt(alert.ovaId);
        }

        const { data, error } = await supabase
            .from('assets_alerts')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...alert,
            id: data.id.toString(),
            createdUserId: currentUser ? currentUser.id : undefined,
            createdAt: data.created_at
        } as AssetAlert;
    },

    async updateAssetAlert(id: string, alert: Partial<AssetAlert>): Promise<AssetAlert> {
        const dbData: any = {
            updated_at: new Date().toISOString()
        };
        if (alert.oTypeId !== undefined) dbData.o_type_id = alert.oTypeId ? parseInt(alert.oTypeId) : null;
        if (alert.priorityId !== undefined) dbData.priority_id = alert.priorityId ? parseInt(alert.priorityId) : null;
        if (alert.description !== undefined) dbData.description = alert.description;
        if (alert.isDone !== undefined) dbData.is_done = alert.isDone;
        if (alert.ovaId !== undefined) dbData.ova_id = alert.ovaId ? parseInt(alert.ovaId) : null;
        if (alert.updatedUserId !== undefined) dbData.updated_user_id = alert.updatedUserId ? parseInt(alert.updatedUserId) : null;

        const { data, error } = await supabase
            .from('assets_alerts')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...alert,
            id: data.id.toString(),
            updatedAt: data.updated_at
        } as AssetAlert;
    },

    async deleteAssetAlert(id: string): Promise<void> {
        const currentUser = await this.getCurrentUser();

        const { error } = await supabase
            .from('assets_alerts')
            .update({
                is_deleted: true,
                deleted_user_id: currentUser ? parseInt(currentUser.id) : null,
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getOrderSubTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderSubType[]> {
        let query = supabase
            .from('cfg_orders_types_subs')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching order sub-types:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            orderTypeId: undefined,
            departmentId: item.department_id?.toString(),
            parentId: undefined,
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true
        })) as OrderSubType[];
    },

    async getOrderSubTypesByType(typeId: string): Promise<OrderSubType[]> {
        // NOTE: cfg_orders_types_subs does not have a FK to cfg_orders_types
        // Returning all available subtypes since filtering by type is not possible
        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .select('*')
            .eq('is_available', 'true')
            .order('description');

        if (error) {
            console.error('Error fetching order sub-types:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            orderTypeId: undefined, // No FK exists in table
            departmentId: item.department_id?.toString(),
            parentId: undefined, // Column doesn't exist in current schema
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true
        })) as OrderSubType[];
    },

    async createOrderSubType(orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        const dbData: any = {};
        // orderTypeId and parentId columns don't exist in table
        if (orderSubType.departmentId !== undefined) dbData.department_id = orderSubType.departmentId ? parseInt(orderSubType.departmentId) : null;
        if (orderSubType.code !== undefined) dbData.code = orderSubType.code;
        if (orderSubType.description !== undefined) dbData.description = orderSubType.description;
        if (orderSubType.isAvailable !== undefined) dbData.is_available = orderSubType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderSubType,
            id: data.id.toString()
        } as OrderSubType;
    },

    async updateOrderSubType(id: string, orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        const dbData: any = {};
        // orderTypeId and parentId columns don't exist in table
        if (orderSubType.departmentId !== undefined) dbData.department_id = orderSubType.departmentId ? parseInt(orderSubType.departmentId) : null;
        if (orderSubType.code !== undefined) dbData.code = orderSubType.code;
        if (orderSubType.description !== undefined) dbData.description = orderSubType.description;
        if (orderSubType.isAvailable !== undefined) dbData.is_available = orderSubType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderSubType,
            id: data.id.toString()
        } as OrderSubType;
    },

    async deleteOrderSubType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_subs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ORDER PLANS (cfg_orders_plans)
    // -------------------------------------------------------------------------
    async getOrderPlans(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderPlan[]> {
        let query = supabase
            .from('cfg_orders_plans')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching order plans:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            color: item.color || undefined
        })) as OrderPlan[];
    },

    async createOrderPlan(orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        const dbData: any = {};
        if (orderPlan.code !== undefined) dbData.code = orderPlan.code;
        if (orderPlan.description !== undefined) dbData.description = orderPlan.description;
        if (orderPlan.isAvailable !== undefined) dbData.is_available = orderPlan.isAvailable;
        if (orderPlan.color !== undefined) dbData.color = orderPlan.color;

        const { data, error } = await supabase
            .from('cfg_orders_plans')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderPlan,
            id: data.id.toString()
        } as OrderPlan;
    },

    async updateOrderPlan(id: string, orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        const dbData: any = {};
        if (orderPlan.code !== undefined) dbData.code = orderPlan.code;
        if (orderPlan.description !== undefined) dbData.description = orderPlan.description;
        if (orderPlan.isAvailable !== undefined) dbData.is_available = orderPlan.isAvailable;
        if (orderPlan.color !== undefined) dbData.color = orderPlan.color;

        const { data, error } = await supabase
            .from('cfg_orders_plans')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderPlan,
            id: data.id.toString()
        } as OrderPlan;
    },

    async deleteOrderPlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_plans')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ORDER OBJECTS (cfg_orders_objects)
    // -------------------------------------------------------------------------
    async getOrderObjects(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderObject[]> {
        let query = supabase
            .from('cfg_orders_objects')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching order objects:', error);
            throw error;
        }

        return (data || []).map(item => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        }));
    },

    async createOrderObject(orderObject: Partial<OrderObject>): Promise<OrderObject> {
        const dbData: any = {};
        if (orderObject.code !== undefined) dbData.code = orderObject.code;
        if (orderObject.description !== undefined) dbData.description = orderObject.description;
        if (orderObject.isAvailable !== undefined) dbData.is_available = orderObject.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_objects')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderObject,
            id: data.id.toString()
        } as OrderObject;
    },

    async updateOrderObject(id: string, orderObject: Partial<OrderObject>): Promise<OrderObject> {
        const dbData: any = {};
        if (orderObject.code !== undefined) dbData.code = orderObject.code;
        if (orderObject.description !== undefined) dbData.description = orderObject.description;
        if (orderObject.isAvailable !== undefined) dbData.is_available = orderObject.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_objects')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderObject,
            id: data.id.toString()
        } as OrderObject;
    },

    async deleteOrderObject(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_objects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async linkActivityToOrderType(activityId: string, orderTypeId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_activities')
            .insert({
                activity_id: activityId,
                o_type_id: orderTypeId,
                is_available: true
            });

        if (error) {
            console.error('Error linking activity to order type:', error);
            throw error;
        }
    },

    async unlinkActivityFromOrderType(activityId: string, orderTypeId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_activities')
            .delete()
            .eq('activity_id', activityId)
            .eq('o_type_id', orderTypeId);

        if (error) {
            console.error('Error unlinking activity from order type:', error);
            throw error;
        }
    },

    async getUsersByCompany(companyId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                cfg_users_statuses (
                     id,
                     description
                ),
                cfg_profiles (
                    description
                ),
                cfg_teams!inner (
                    description,
                    company_id
                )
            `)
            .eq('cfg_teams.company_id', companyId)
            .order('name_full');

        if (error) {
            console.error('Error fetching users by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            latitude: item.latitude,
            longitude: item.longitude,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            phone: item.phone,

            // Avatar logic
            avatarUrl: item.img_file_name
                ? this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,


            companyId: item.cfg_teams?.company_id?.toString(),
            name: item.name_full,
            createdAt: item.created_at,
            teamId: item.team_id?.toString(),
            teamName: item.cfg_teams?.description,
            vehicleId: item.vehicle_id?.toString(),
            isAvailable: item.is_available,
            shiftStart: item.shift_start,
            shiftEnd: item.shift_end,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async getTeamsByCompany(companyId: string): Promise<Team[]> {
        const { data, error } = await supabase
            .from('cfg_teams')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching teams by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive'
        })) as Team[];
    },

    async getTeamMembers(teamId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching team members:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            nameFull: item.name_full,
            nameShort: item.name_short,
            email: item.email,
            avatarUrl: item.img_file_name
                ? this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async searchUsers(query: string, companyId: string, excludeTeamId?: string): Promise<User[]> {
        let queryBuilder = supabase
            .from('users')
            .select(`
                *,
                cfg_teams!inner (
                    company_id
                )       
            `)
            .eq('cfg_teams.company_id', companyId)
            .ilike('name_full', `%${query}%`)
            .order('name_full');

        if (excludeTeamId) {
            queryBuilder = queryBuilder.neq('team_id', excludeTeamId);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            console.error('Error searching users:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            nameFull: item.name_full,
            nameShort: item.name_short,
            email: item.email,
            avatarUrl: item.img_file_name
                ? this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,
            teamId: item.team_id?.toString(),
            isAvailable: item.is_available,
            shiftStart: item.shift_start,
            shiftEnd: item.shift_end,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async searchVehicles(query: string, companyId?: string): Promise<Vehicle[]> {
        let q = supabase
            .from('v_vehicles')
            .select('*')
            .eq('is_available', 'true')
            .or(`description.ilike.%${query}%,plates.ilike.%${query}%`)
            .limit(10);

        // Filter by provider company when supplied (v_orders.provider_company_id = v_vehicles.company_id)
        if (companyId) {
            q = q.eq('company_id', companyId);
        }

        const { data, error } = await q;

        if (error) {
            console.error('Error searching vehicles:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            plates: item.plates,
            model: item.model,
            brand: item.brand,
            color: item.color,
            year: item.year,
            isAvailable: item.is_available
        })) as Vehicle[];
    },

    async getVehicle(id: string): Promise<Vehicle | null> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // It's possible the user has a vehicle_id that doesn't exist or was deleted, just return null/log
            console.error('Error fetching vehicle:', error);
            return null;
        }

        return {
            id: data.id.toString(),
            description: data.description,
            plates: data.plates,
            model: data.model,
            brand: data.brand,
            color: data.color,
            year: data.year,
            isAvailable: data.is_available
        } as Vehicle;
    },

    async updateUserVehicle(userId: string, vehicleId: string | null): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ vehicle_id: vehicleId ? parseInt(vehicleId) : null })
            .eq('uuid', userId);

        if (error) {
            console.error('Error updating user vehicle:', error);
            throw error;
        }
    },

    async addUserToTeam(userId: string, newTeamId: string): Promise<void> {
        // 1. Get current user data to find their current team
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('team_id')
            .eq('uuid', userId)
            .single();

        if (fetchError) throw fetchError;

        const oldTeamId = user.team_id;

        // 2. Update user: set team_id_previous = oldTeamId, team_id = newTeamId
        const { error: updateError } = await supabase
            .from('users')
            .update({
                team_id_previous: oldTeamId,
                team_id: parseInt(newTeamId)
            })
            .eq('uuid', userId);

        if (updateError) throw updateError;
    },

    async removeUserFromTeam(userId: string): Promise<void> {
        // 1. Fetch user to get team_id_previous
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('team_id_previous')
            .eq('uuid', userId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Set team_id to team_id_previous
        // We do not clear team_id_previous here, or maybe we should? 
        // Request says "team_id passa ser igual ao team_id_previous".
        const { error } = await supabase
            .from('users')
            .update({ team_id: user.team_id_previous })
            .eq('uuid', userId);

        if (error) throw error;
    },

    async updateUserTeam(userId: string, teamId: string | null): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ team_id: teamId ? parseInt(teamId) : null })
            .eq('uuid', userId); // Using UUID for safety, assuming userId passed is UUID. If numeric ID is passed, change to .eq('id', userId)

        if (error) {
            console.error('Error updating user team:', error);
            throw error;
        }
    },

    async createUser(user: Partial<User>, password: string): Promise<void> {
        // Create a temporary client to avoid logging out the current user
        // We import createClient specifically for this purpose
        const { createClient } = await import('@supabase/supabase-js');

        const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false, // Don't save session to localStorage
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: user.email!,
            password: password,
            options: {
                data: {
                    name: user.nameFull
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("UsuÃ¡rio nÃ£o criado no Auth");

        const updateData = {
            name_full: user.nameFull,
            name_short: user.nameShort,
            mobile: user.mobile,
            team_id: (user.teamId && user.teamId !== '') ? parseInt(user.teamId) : null,
            company_id: (user.companyId && user.companyId !== '') ? parseInt(user.companyId) : null,
            profile_id: (user.profileId && user.profileId !== '') ? parseInt(user.profileId) : null,
            status_id: 1, // Requested: 1
            img_file_path: 'settings/images',
            img_file_name: 'noImageUser.png',
            shift_start: '08:00:00',
            shift_end: '18:00:00'
        };

        // We use the MAIN supabase client here because we need the Admin's (current user) permissions
        // to update the 'users' table, assuming there is an RLS policy allowing it.
        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('uuid', authData.user.id);

        if (updateError) {
            console.error("Error updating user profile", updateError);
            throw updateError;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        if (currentUserPromise) return currentUserPromise;

        currentUserPromise = (async () => {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            // If token is invalid (401/403), clear it to prevent repeated network errors
            if (authError) {
                await supabase.auth.signOut().catch(() => { });
            }
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                cfg_users_statuses (
                     id,
                     description
                ),
                cfg_profiles!left (
                    description
                ),
                cfg_teams!left (
                    description,
                    company_id,
                    department_id
                )
            `)
            .eq('uuid', authUser.id)
            .single();


        if (error) {
            // Don't log PGRST116 (user not found) - this is expected when user hasn't logged in yet
            if (error.code !== 'PGRST116') {
                console.error('Error fetching current user:', error);
            }
            return null;
        }

        // Fetch company details separately to avoid PGRST200 (schema cache) issues with the new FK
        let company: any = null;
        const teamCompanyId = data.cfg_teams?.company_id;

        if (teamCompanyId) {
            const { data: companyData } = await supabase
                .from('cfg_companies')
                .select('id, description, img_file_path, img_file_name')
                .eq('id', teamCompanyId)
                .single();
            company = companyData;
        }

        // Fetch user permissions if user exists
        let permissions: Permission[] = [];
        if (data.profile_id) {
            const { data: permsData, error: permsError } = await supabase
                .rpc('fc_get_user_permissions', { p_user_id: data.id });

            if (!permsError && permsData) {
                permissions = permsData.map((item: any) => ({
                    id: '', // Not needed for permission check
                    profileId: data.profile_id.toString(),
                    routeId: item.route_id?.toString(),
                    routeKey: item.route_key,
                    routePath: item.route_path,
                    routeDescription: item.route_description,
                    canView: item.can_view,
                    canCreate: item.can_create,
                    canEdit: !!item.can_edit,
                    canDelete: !!item.can_delete,
                    canSearch: item.can_search !== undefined ? !!item.can_search : true
                }));
            }
        }

        return {
            id: data.id.toString(),
            uuid: data.uuid,
            email: data.email,
            nameFull: data.name_full,
            nameShort: data.name_short,
            mobile: data.mobile,
            mobileMask: data.mobile_mask,
            phone: data.phone,
            statusId: data.status_id,
            statusName: data.cfg_users_statuses?.description || 'Desconhecido',
            profileId: data.profile_id?.toString(),
            profileName: data.cfg_profiles?.description,
            avatarUrl: data.img_file_name
                ? this.getPublicImageUrl(data.img_file_path, data.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,

            // Extract company info from team relationship (fetched separately)
            companyId: company?.id?.toString(),
            companyName: company?.description,
            companyLogoUrl: company ?
                this.getPublicImageUrl(
                    company.img_file_path,
                    company.img_file_name,
                    { width: 400, height: 400, resize: 'contain' }
                ) : undefined,
            teamId: data.team_id?.toString(),
            teamName: data.cfg_teams?.description,
            departmentId: data.cfg_teams?.department_id?.toString(), // Get department from TEAM
            isAdminSuper: data.is_admin_super,
            notificationsAmount: data.notifications_amount || 0,
            createdAt: data.created_at,
            vehicleId: data.vehicle_id?.toString(),
            isTeamLeader: data.is_team_leader,
            isAvailable: data.is_available,
            isOvInProgress: data.is_ov_in_progress,
            ovIdInProgress: data.ov_id_in_progress?.toString(),
            oIdInProgress: data.o_id_in_progress?.toString(),
            opIdInProgress: data.op_id_in_progress?.toString(),
            ovIdInProgressMask: data.ov_id_in_progress_mask,
            ovInProgressLeaderId: data.ov_in_progress_leader_id,
            oContractIdInProgress: data.o_contract_id_in_progress,
            oTypeIdInProgress: data.o_type_id_in_progress,
            oTypeSubIdInProgress: data.o_type_sub_id_in_progress,
            oPlanIdInProgress: data.o_plan_id_in_progress,
            oAssetTagIdInProgress: data.o_asset_tag_id_in_progress,
            oUnitIdInProgress: data.o_unit_id_in_progress,
            oSystemIdInProgress: data.o_system_id_in_progress,
            oSystemParentIdInProgress: data.o_system_parent_id_in_progress,
            oUnitTypeIdInProgress: data.o_unit_type_id_in_progress,
            oUnitTypeParentIdInProgress: data.o_unit_type_parent_id_in_progress,
            oObjectIdInProgress: data.o_object_id_in_progress,
            ovIdInProgressBigInt: data.ov_id_in_progress,
            oIdInProgressBigInt: data.o_id_in_progress,
            opIdInProgressBigInt: data.op_id_in_progress,
            latitude: data.latitude,
            longitude: data.longitude,
            shiftStart: data.shift_start,
            shiftEnd: data.shift_end,
            trackerIntervalSeconds: data.tracker_interval_seconds ?? null,
            permissions: permissions
        } as User;
    } catch (error) {
        currentUserPromise = null;
        throw error;
    }
})().finally(() => {
    currentUserPromise = null;
});

    return currentUserPromise;
},

    async updateProfile(userUuid: string, user: Partial<User>): Promise<void> {
        // 1. Update basic info first
        const updateData: any = {
            name_full: user.nameFull,
            name_short: user.nameShort,
            mobile: user.mobile,
            phone: user.phone,
            profile_id: (user.profileId && user.profileId !== '') ? parseInt(user.profileId) : undefined,
            team_id: (user.teamId && user.teamId !== '') ? parseInt(user.teamId) : undefined,
            company_id: (user.companyId && user.companyId !== '') ? parseInt(user.companyId) : undefined,
            shift_start: user.shiftStart,
            shift_end: user.shiftEnd
        };

        if (user.isTeamLeader !== undefined) {
            updateData.is_team_leader = user.isTeamLeader;
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('uuid', userUuid);

        if (updateError) throw updateError;

        // 2. Handle email update via Auth if it's the current user
        if (user.email) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.id === userUuid) {
                const { error: emailError } = await supabase.auth.updateUser({ email: user.email });
                if (emailError) throw emailError;
            } else {
                const { error: dbEmailError } = await supabase
                    .from('users')
                    .update({ email: user.email })
                    .eq('uuid', userUuid);
                if (dbEmailError) throw dbEmailError;
            }
        }

        // 3. Handle image upload if provided as base64
        if (user.avatarUrl && user.avatarUrl.startsWith('data:')) {
            try {
                // Fetch current user data for ID and old image info
                const { data: dbUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id, img_file_path, img_file_name')
                    .eq('uuid', userUuid)
                    .single();

                if (fetchError || !dbUser) throw new Error("Usuário não encontrado para upload de imagem");

                const userId = dbUser.id;
                const oldPath = dbUser.img_file_path;
                const oldName = dbUser.img_file_name;
                const oldFullFile = (oldPath && oldName) ? `${oldPath}/${oldName}` : null;

                // Process Base64 to Blob
                const res = await fetch(user.avatarUrl);
                const blob = await res.blob();

                // 1. Upload new image to R2 using helper
                const { path, filename } = await this.uploadUserAvatar(userId, blob);

                // 2. Update database with new path
                const { error: dbUpdateError } = await supabase
                    .from('users')
                    .update({
                        img_file_path: path,
                        img_file_name: filename
                    })
                    .eq('id', userId);

                if (dbUpdateError) throw dbUpdateError;

                // 3. Delete old image from R2 if it exists
                if (oldFullFile && !oldFullFile.includes('settings/images')) {
                    // r2Service is now static

                    try {
                        await r2Service.deleteFile(oldFullFile);
                    } catch (delError) {
                        console.warn("Could not delete old avatar from R2:", delError);
                    }
                }
            } catch (err) {
                console.error("Failed to process profile image update", err);
                throw err;
            }
        }
    },

    async updateUserStatus(userId: string, statusId: number): Promise<string> {
        const { error } = await supabase
            .from('users')
            .update({ status_id: statusId })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user status:', error);
            throw error;
        }

        const { data: statusData } = await supabase
            .from('cfg_users_statuses')
            .select('description')
            .eq('id', statusId)
            .single();

        return statusData?.description || 'Desconhecido';
    },

    async updateUserAvailability(userId: string, isAvailable: boolean, ovIdInProgress: string | null | undefined): Promise<void> {
        const parsedOvId = ovIdInProgress ? Number(ovIdInProgress) : null;
        const payload: { is_available: boolean; ov_id_in_progress: number | null } = {
            is_available: isAvailable,
            ov_id_in_progress: Number.isInteger(parsedOvId) && parsedOvId! > 0 ? parsedOvId : null
        };

        const { error } = await supabase
            .from('users')
            .update(payload)
            .eq('id', userId);

        if (error) {
            console.error('Error updating user availability:', error);
            throw error;
        }
    },



    async createCompanyProfile(companyId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        // 1. Create Profile
        const { data: profile, error: profileError } = await supabase
            .from('cfg_profiles')
            .insert({
                department_id: parseInt(companyId),
                description,
                is_available: true
            })
            .select()
            .single();

        if (profileError) throw profileError;

        // 2. Create Permissions
        if (permissions.length > 0) {
            const permsData = permissions.map(p => ({
                profile_id: profile.id,
                can_view: p.canView ?? false,
                can_create: p.canCreate ?? false,
                can_edit: p.canEdit ?? false,
                can_delete: p.canDelete ?? false
            }));

            const { error: permsError } = await supabase
                .from('cfg_profiles_access')
                .insert(permsData);

            if (permsError) throw permsError;
        }
    },

    async updateCompanyProfile(profileId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        // 1. Update Profile Description
        const { error: profileError } = await supabase
            .from('cfg_profiles')
            .update({ description })
            .eq('id', profileId);

        if (profileError) throw profileError;

        // 2. Delete existing permissions and recreate (simpler sync)
        await supabase
            .from('cfg_profiles_access')
            .delete()
            .eq('profile_id', profileId);

        // 3. Create new permissions
        if (permissions.length > 0) {
            const permsData = permissions.map(p => ({
                profile_id: parseInt(profileId),
                can_view: p.canView ?? false,
                can_create: p.canCreate ?? false,
                can_edit: p.canEdit ?? false,
                can_delete: p.canDelete ?? false
            }));

            const { error: permsError } = await supabase
                .from('cfg_profiles_access')
                .insert(permsData);

            if (permsError) throw permsError;
        }
    },

    async deleteCompanyProfile(profileId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_profiles')
            .delete()
            .eq('id', profileId);
        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ROUTES & PERMISSIONS
    // -------------------------------------------------------------------------




    async signIn(email: string, password: string): Promise<void> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // After successful login, sync the UUID from auth.users to public.users (only if different)
        if (data.user) {
            try {
                // First, check if the UUID needs updating
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('uuid')
                    .eq('email', email)
                    .single();

                // Only update if UUID is different
                if (existingUser && existingUser.uuid !== data.user.id) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ uuid: data.user.id })
                        .eq('email', email);

                    if (updateError) {
                        console.error('Error syncing UUID:', updateError);
                    }
                }
            } catch (syncError) {
                console.error('Failed to sync user UUID:', syncError);
            }
        }
    },

    subscribeToAuthChanges(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },

    async signOut(): Promise<void> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error signing out from Supabase:', error);
        } catch (e) {
            console.error('Unexpected error during sign out:', e);
        } finally {
            localStorage.clear();
            window.location.href = '/'; // Redirect to root so Nginx serves the SPA correctly
        }
    },

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
    },

    async updatePassword(password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },

    async getClients(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('is_deleted', 'false'); // Only non-deleted

        if (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            code: item.code,
            email: item.email,
            mobile: item.mobile,
            address: item.address,
            logoPath: item.img_file_path,
            logoName: item.img_file_name,
            status: item.is_available ? 'active' : 'inactive',
            logoUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'contain' }) || 'https://via.placeholder.com/150',

            category: 'Cliente',
            contractCount: 0,
            companyId: item.company_id?.toString()
        })) as Client[];
    },

    async createClient(client: Partial<Client>): Promise<Client> {
        const currentUser = await this.getCurrentUser();

        const dbData = {
            name: client.name,
            code: client.code,
            email: client.email,
            mobile: client.mobile,
            address: client.address,
            is_available: true,
            img_file_path: client.logoUrl?.startsWith('data:') ? null : client.logoUrl,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            is_deleted: false
        };

        const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        const clientId = newClient.id;

        if (client.logoUrl && client.logoUrl.startsWith('data:')) {
            try {
                // r2Service is now static

                const folderPath = `clients/${clientId}`;
                const fileName = `avatar_${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(client.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath);

                await supabase
                    .from('clients')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', clientId);
            } catch (err) {
                console.error("Failed to process client logo upload to R2", err);
            }
        }

        return { ...client, id: clientId.toString(), status: 'active' } as Client;
    },

    async updateClient(id: string, client: Partial<Client>): Promise<Client> {
        const currentUser = await this.getCurrentUser();

        const dbData = {
            name: client.name,
            code: client.code,
            email: client.email,
            mobile: client.mobile,
            address: client.address,
            is_available: client.status === 'active',
            company_id: client.companyId ? parseInt(client.companyId) : null,
            updated_user_id: currentUser ? parseInt(currentUser.id) : null,
            updated_at: getBrazilTimestamp()
        };

        const { error: updateError } = await supabase
            .from('clients')
            .update(dbData)
            .eq('id', id);

        if (updateError) throw updateError;

        if (client.logoUrl && client.logoUrl.startsWith('data:')) {
            try {
                // r2Service is now static

                const folderPath = `clients/${id}`;
                const fileName = `avatar_${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(client.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath);

                await supabase
                    .from('clients')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', id);
            } catch (err) {
                console.error("Failed to process client logo update to R2", err);
            }
        }

        return { ...client, id } as Client;
    },

    async deleteClient(id: string): Promise<void> {
        const currentUser = await this.getCurrentUser();

        const { error } = await supabase
            .from('clients')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_user_id: currentUser ? parseInt(currentUser.id) : null
            })
            .eq('id', id);

        if (error) throw error;
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
        // 1. Fetch Units
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .eq('client_id', clientId)
            .eq('is_deleted', 'false');

        if (unitsError) {
            console.error('Error fetching units:', unitsError);
            throw unitsError;
        }

        // 2. Fetch Reference Data (Types, Systems, and Statuses) in parallel
        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        // Helper Map functions
        const typesMap = new Map(unitTypes?.map(t => [t.id, t.description]));
        const systemsMap = new Map(systems?.map(s => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map(st => [st.id, st.description]));

        return (units || []).map((item: any) => {
            return {
                id: item.id.toString(),
                clientId: item.client_id.toString(),
                description: item.description,
                code: item.code,
                installationCodePowerSupply: item.installation_code_power_supply,
                addressFull: item.address_full,
                latitude: item.latitude,
                longitude: item.longitude,
                unitTypeParentId: item.unit_type_parent_id?.toString(),
                unitTypeId: item.unit_type_id?.toString(),
                typeName: typesMap.get(item.unit_type_parent_id),
                subTypeName: typesMap.get(item.unit_type_id),
                systemParentId: item.system_parent_id?.toString(),
                systemId: item.system_id?.toString(),
                systemParentName: systemsMap.get(item.system_parent_id),
                systemName: systemsMap.get(item.system_id),
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                statusId: item.status_id?.toString() || '1',
                statusName: statusesMap.get(item.status_id),
                logoUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, {
                    width: 400,
                    height: 400,
                    resize: 'cover'
                }),
                descriptionFull: item.description_full
            };
        }) as Unit[];
    },

    async searchUnits(search: string = '', limit: number = 50): Promise<Unit[]> {
        let query = supabase
            .from('units')
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .eq('is_deleted', 'false');

        if (search && search.trim().length > 0) {
            const terms = search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data: units, error: unitsError } = await query.limit(limit);

        if (unitsError) {
            console.error('Error searching units:', unitsError);
            throw unitsError;
        }

        // Fetch Reference Data (Types, Systems, and Statuses) in parallel
        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        const typesMap = new Map(unitTypes?.map(t => [t.id, t.description]));
        const systemsMap = new Map(systems?.map(s => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map(st => [st.id, st.description]));

        return (units || []).map((item: any) => ({
            id: item.id.toString(),
            clientId: item.client_id?.toString() || '',
            description: item.description,
            code: item.code,
            installationCodePowerSupply: item.installation_code_power_supply,
            addressFull: item.address_full,
            latitude: item.latitude,
            longitude: item.longitude,
            unitTypeParentId: item.unit_type_parent_id?.toString(),
            unitTypeId: item.unit_type_id?.toString(),
            typeName: typesMap.get(item.unit_type_parent_id),
            subTypeName: typesMap.get(item.unit_type_id),
            systemParentId: item.system_parent_id?.toString(),
            systemId: item.system_id?.toString(),
            systemParentName: systemsMap.get(item.system_parent_id),
            systemName: systemsMap.get(item.system_id),
            imgFilePath: item.img_file_path,
            imgFileName: item.img_file_name,
            statusId: item.status_id?.toString() || '1',
            statusName: statusesMap.get(item.status_id),
            logoUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, {
                width: 400,
                height: 400,
                resize: 'cover'
            }),
            descriptionFull: item.description_full
        })) as Unit[];
    },

    async getUnitById(id: string): Promise<Unit | null> {
        // 1. Fetch the main unit record
        const { data: unitData, error } = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ [getUnitById] DB Error:', error.message);
            return null;
        }

        console.log('🔋 [getUnitById] Main Record:', {
            id: unitData.id,
            cli: unitData.client_id,
            path: unitData.img_file_path,
            name: unitData.img_file_name
        });

        // 2. Fetch auxiliary data separately to avoid PGRST200 (Join cache issues)
        const [clientRes, typeParentRes, typeSubRes, sysParentRes, sysSubRes, statusRes] = await Promise.all([
            unitData.client_id ? supabase.from('clients').select('name').eq('id', unitData.client_id).single() : Promise.resolve({ data: null }),
            unitData.unit_type_parent_id ? supabase.from('cfg_units_types').select('description').eq('id', unitData.unit_type_parent_id).single() : Promise.resolve({ data: null }),
            unitData.unit_type_id ? supabase.from('cfg_units_types').select('description').eq('id', unitData.unit_type_id).single() : Promise.resolve({ data: null }),
            unitData.system_parent_id ? supabase.from('cfg_systems').select('description').eq('id', unitData.system_parent_id).single() : Promise.resolve({ data: null }),
            unitData.system_id ? supabase.from('cfg_systems').select('description').eq('id', unitData.system_id).single() : Promise.resolve({ data: null }),
            unitData.status_id ? supabase.from('v_units_statuses').select('description').eq('id', unitData.status_id).single() : Promise.resolve({ data: null })
        ]);

        const logoUrl = this.getPublicImageUrl(unitData.img_file_path, unitData.img_file_name, {
            width: 800,
            height: 800,
            resize: 'contain',
            cacheBust: Date.now()
        });

        const mapped: Unit = {
            id: unitData.id.toString(),
            clientId: unitData.client_id?.toString(),
            clientName: clientRes.data?.name,
            description: unitData.description,
            code: unitData.code,
            installationCodePowerSupply: unitData.installation_code_power_supply,
            addressFull: unitData.address_full,
            latitude: unitData.latitude,
            longitude: unitData.longitude,
            unitTypeParentId: unitData.unit_type_parent_id?.toString(),
            unitTypeId: unitData.unit_type_id?.toString(),
            typeName: typeParentRes.data?.description,
            subTypeName: typeSubRes.data?.description,
            systemParentId: unitData.system_parent_id?.toString(),
            systemId: unitData.system_id?.toString(),
            systemParentName: sysParentRes.data?.description,
            systemName: sysSubRes.data?.description,
            imgFilePath: unitData.img_file_path,
            imgFileName: unitData.img_file_name,
            statusId: unitData.status_id?.toString() || '1',
            statusName: statusRes.data?.description,
            logoUrl: logoUrl,
            descriptionFull: unitData.description_full
        };

        console.log('✅ [getUnitById] Mapped Result:', {
            id: mapped.id,
            client: mapped.clientName,
            url: mapped.logoUrl
        });

        return mapped;
    },

    async createUnit(unit: Partial<Unit>): Promise<Unit> {
        const dbData = {
            client_id: parseInt(unit.clientId!),
            description: unit.description,
            code: unit.code,
            installation_code_power_supply: unit.installationCodePowerSupply,
            address_full: unit.addressFull,
            latitude: unit.latitude,
            longitude: unit.longitude,
            unit_type_parent_id: unit.unitTypeParentId && unit.unitTypeParentId !== '' ? parseInt(unit.unitTypeParentId) : null,
            unit_type_id: unit.unitTypeId && unit.unitTypeId !== '' ? parseInt(unit.unitTypeId) : null,
            system_parent_id: unit.systemParentId && unit.systemParentId !== '' ? parseInt(unit.systemParentId) : null,
            system_id: unit.systemId && unit.systemId !== '' ? parseInt(unit.systemId) : null,
            status_id: unit.statusId ? parseInt(unit.statusId) : 1,
            img_file_path: unit.imgFilePath,
            img_file_name: unit.imgFileName
        };

        const { data, error } = await supabase
            .from('units')
            .insert(dbData)
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .single();

        if (error) throw error;

        return this.getUnitById(data.id.toString()) as any;
    },

    async updateUnit(id: string, unit: Partial<Unit>): Promise<Unit> {
        const dbData: any = {};
        if (unit.clientId !== undefined) dbData.client_id = parseInt(unit.clientId);
        if (unit.description !== undefined) dbData.description = unit.description;
        if (unit.code !== undefined) dbData.code = unit.code;
        if (unit.installationCodePowerSupply !== undefined) dbData.installation_code_power_supply = unit.installationCodePowerSupply;
        if (unit.addressFull !== undefined) dbData.address_full = unit.addressFull;
        if (unit.latitude !== undefined) dbData.latitude = unit.latitude;
        if (unit.longitude !== undefined) dbData.longitude = unit.longitude;
        if (unit.unitTypeParentId !== undefined) dbData.unit_type_parent_id = unit.unitTypeParentId && unit.unitTypeParentId !== '' ? parseInt(unit.unitTypeParentId) : null;
        if (unit.unitTypeId !== undefined) dbData.unit_type_id = unit.unitTypeId && unit.unitTypeId !== '' ? parseInt(unit.unitTypeId) : null;
        if (unit.systemParentId !== undefined) dbData.system_parent_id = unit.systemParentId && unit.systemParentId !== '' ? parseInt(unit.systemParentId) : null;
        if (unit.systemId !== undefined) dbData.system_id = unit.systemId && unit.systemId !== '' ? parseInt(unit.systemId) : null;
        
        // Update status_id only
        if (unit.statusId !== undefined) {
            dbData.status_id = unit.statusId && unit.statusId !== '' ? parseInt(unit.statusId) : null;
            console.log(`🔄 [updateUnit] Updating status_id for unit ${id}: ${dbData.status_id}`);
        }
        
        if (unit.imgFilePath !== undefined) dbData.img_file_path = unit.imgFilePath;
        if (unit.imgFileName !== undefined) dbData.img_file_name = unit.imgFileName;

        console.log(`💾 [updateUnit] Data to update:`, dbData);

        const { data, error } = await supabase
            .from('units')
            .update(dbData)
            .eq('id', id)
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .single();

        if (error) {
            console.error(`❌ [updateUnit] Database error:`, error);
            throw error;
        }

        console.log(`✅ [updateUnit] Update successful, fetching fresh data...`);
        return this.getUnitById(id) as any;
    },

    async deleteUnit(id: string): Promise<void> {
        const { error } = await supabase
            .from('units')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) throw error;
    },

    // Services
    async getServices(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Service[]> {
        let query = supabase
            .from('cfg_services')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching services:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            unit: item.unit || '',
            isAvailable: item.is_available ?? true
        })) as Service[];
    },

    async createService(service: Partial<Service>): Promise<Service> {
        const dbData = {
            code: service.code,
            description: service.description,
            unit: service.unit,
            is_available: service.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_services')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            unit: data.unit || '',
            isAvailable: data.is_available
        } as Service;
    },

    async updateService(id: string, service: Partial<Service>): Promise<Service> {
        const dbData = {
            code: service.code,
            description: service.description,
            unit: service.unit,
            is_available: service.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_services')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            unit: data.unit || '',
            isAvailable: data.is_available
        } as Service;
    },

    // Orders
    /**
     * Get Active Orders (SS/OS) by unit asset tag ID
     */
    async getActiveOrdersByAssetTagId(unitAssetTagId: string | number): Promise<any[]> {
        if (!unitAssetTagId) return [];
        
        try {
            const numericId = typeof unitAssetTagId === 'string' ? parseInt(unitAssetTagId) : unitAssetTagId;
            console.log('Querying active orders for ID:', numericId);
            
            const { data, error } = await supabase
                .from('v_orders')
                .select('id, order_mask, status_id, status_description, requested_services, requested_at, unit_asset_tag_id, unit_asset_tag_has_order, parent_id')
                .eq('unit_asset_tag_id', numericId)
                .eq('unit_asset_tag_has_order', true)
                .or('parent_id.eq.0,parent_id.is.null')
                .not('status_id', 'in', '(7,8)')
                .order('requested_at', { ascending: false });

            if (error) {
                console.error('Error fetching active orders:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Exception in getActiveOrdersByAssetTagId:', error);
            return [];
        }
    },
    
    /**
     * Mark a Service Order (SS) as completed (status 8)
     */
    async completeServiceOrder(orderId: string | number, userId?: string | number, rating: number = 0): Promise<boolean> {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
            if (isNaN(numericId)) return false;

            const now = getBrazilTimestamp();
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status_id: 8, 
                    status_at: now,
                    updated_at: now,
                    unit_asset_tag_has_order: false,
                    unit_asset_tag_no_has_order_user_id: userId || null,
                    unit_asset_tag_no_has_order_at: now,
                    rating: rating || null
                })
                .eq('id', numericId);

            if (error) {
                console.error('Error completing service order:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Exception in completeServiceOrder:', error);
            return false;
        }
    },

    /**
     * Cancel Service Request (Order)
     * Sets status_id to 7 (Cancelled) and updates asset tracking fields.
     */
    async cancelServiceOrder(orderId: string | number, userId: string | number): Promise<boolean> {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
            if (isNaN(numericId)) return false;

            const now = getBrazilTimestamp();
            const { error } = await supabase
                .from('orders')
                .update({
                    status_id: 7,
                    status_at: now,
                    updated_at: now,
                    unit_asset_tag_has_order: false,
                    unit_asset_tag_no_has_order_user_id: userId,
                    unit_asset_tag_no_has_order_at: now
                })
                .eq('id', numericId);

            if (error) {
                console.error('Error cancelling service order:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Exception in cancelServiceOrder:', error);
            return false;
        }
    },

    /**
     * Create Service Request (Order)
     * Implements the complete flow from flows/servicesRequests/create-service-request.flow
     */
    async createServiceRequest(order: Partial<Order>): Promise<Order> {
        // Passo 1 & 2: Validar dados obrigatórios
        if (!order.clientId || !order.unitId || !order.typeId || !order.requestedServices) {
            throw new Error('Dados obrigatórios faltando: clientId, unitId, typeId, requestedServices');
        }

        // Passo 3: Obter usuário logado
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            throw new Error('Usuário não autenticado');
        }

        // Resolver dados do usuário (team, company, department)
        const { data: userTeam, error: teamError } = await supabase
            .from('cfg_teams')
            .select('company_id, department_id')
            .eq('id', currentUser.teamId)
            .single();

        if (teamError) {
            console.error('Erro ao buscar dados do team:', teamError);
        }

        // Resolver dados da unidade (com descrições para fallback)
        const { data: unitData, error: unitError } = await supabase
            .from('units')
            .select('description, description_full, system_parent_id, system_id, unit_type_parent_id, unit_type_id, latitude, longitude')
            .eq('id', order.unitId)
            .single();

        if (unitError) {
            console.error('Erro ao buscar dados da unidade:', unitError);
        }

        // Resolver dados do tipo de OS (SS) para fallback
        const { data: orderTypeData, error: typeError } = await supabase
            .from('cfg_orders_types')
            .select('description, code')
            .eq('id', order.typeId)
            .single();

        if (typeError) {
            console.error('Erro ao buscar dados do tipo de OS:', typeError);
        }

        // Resolver dados da prioridade (opcional) para fallback
        let priorityData: any = null;
        if (order.priorityId) {
            const { data, error: pError } = await supabase
                .from('cfg_orders_priorities')
                .select('description, code')
                .eq('id', order.priorityId)
                .single();
            if (!pError) priorityData = data;
        }

        // Resolver dados do asset tag (se fornecido)
        let assetTagData: any = null;
        if (order.unitAssetTagId) {
            const { data, error: assetTagError } = await supabase
                .from('cfg_units_assets_tags')
                .select('asset_tag_id, asset_tag_sub_id')
                .eq('id', order.unitAssetTagId)
                .single();

            if (assetTagError) {
                console.error('Erro ao buscar dados do asset tag:', assetTagError);
            } else {
                assetTagData = data;
            }
        }

        // Se não encontrou via unitAssetTagId, tenta usar os IDs diretos se fornecidos
        const finalAssetTagId = assetTagData?.asset_tag_id || (order.assetTagId ? parseInt(order.assetTagId) : null);
        const finalAssetTagSubId = assetTagData?.asset_tag_sub_id || (order.assetTagSubId ? parseInt(order.assetTagSubId) : null);

        // Passo 4: Gerar Contador da Ordem
        const currentYear = new Date().getFullYear();

        // Buscar contador do ano atual
        const { data: counterData, error: counterFetchError } = await supabase
            .from('cfg_orders_counter')
            .select('id, counter')
            .eq('year', currentYear)
            .maybeSingle();

        let newCounter: number;

        if (counterFetchError) {
            throw new Error(`Erro ao buscar contador: ${counterFetchError.message}`);
        }

        if (!counterData) {
            // Criar novo contador para o ano
            const { data: newCounterData, error: createCounterError } = await supabase
                .from('cfg_orders_counter')
                .insert({ year: currentYear, counter: 1 })
                .select('counter')
                .single();

            if (createCounterError) {
                throw new Error(`Erro ao criar contador: ${createCounterError.message}`);
            }

            newCounter = newCounterData.counter;
        } else {
            // Incrementar contador existente
            const { data: updatedCounterData, error: updateCounterError } = await supabase
                .from('cfg_orders_counter')
                .update({ counter: counterData.counter + 1 })
                .eq('id', counterData.id)
                .select('counter')
                .single();

            if (updateCounterError) {
                throw new Error(`Erro ao atualizar contador: ${updateCounterError.message}`);
            }

            newCounter = updatedCounterData.counter;
        }

        // Gerar order_mask: counter.0.ano
        const orderMask = `${newCounter}.0.${currentYear}`;

        // Passo 5: Inserir Registro de Ordem
        const dbData: any = {
            // Campos Fixos ou Nulos
            plan_id: null,
            object_id: null,
            parent_id: null,
            type_sub_id: null,
            team_leader_id: null,
            status_id: 1, // Status: Criado
            counter_child: 0,
            team_id: null,
            contract_id: null,
            provider_company_id: null,
            counter_parent: newCounter,
            order_mask: orderMask,
            year: currentYear,
            unit_asset_tag_has_order: true,

            // Campos Derivados do Usuário Logado
            company_id: userTeam?.company_id || null,
            department_id: userTeam?.department_id || null,
            requester_name: currentUser.nameShort || currentUser.nameFull,
            requester_team_id: currentUser.teamId ? parseInt(currentUser.teamId) : null,
            requester_phone: currentUser.mobileMask || currentUser.mobile || null,
            created_user_id: parseInt(currentUser.id),

            // Campos Derivados do Formulário
            client_id: parseInt(order.clientId),
            unit_id: parseInt(order.unitId),
            unit_asset_tag_id: order.unitAssetTagId ? parseInt(order.unitAssetTagId) : null,
            type_id: parseInt(order.typeId),
            priority_id: order.priorityId ? parseInt(order.priorityId) : null,
            requested_services: order.requestedServices,

            // Campos derivados da unidade
            system_parent_id: unitData?.system_parent_id || null,
            system_id: unitData?.system_id || null,
            unit_type_parent_id: unitData?.unit_type_parent_id || null,
            unit_type_id: unitData?.unit_type_id || null,
            unit_latitude: unitData?.latitude || null,
            unit_longitude: unitData?.longitude || null,

            // Campos derivados do asset tag
            asset_tag_id: finalAssetTagId,
            asset_tag_sub_id: finalAssetTagSubId,

            // Campos de data e hora
            status_at: getBrazilTimestamp(),
            requested_at: getBrazilTimestamp(),
            created_at: getBrazilTimestamp()
        };

        // Imagens (até 4 imagens) - conforme flow atualizado
        if (order.images && Array.isArray(order.images)) {
            // Validar máximo de 4 imagens
            if (order.images.length > 4) {
                throw new Error('Máximo de 4 imagens permitido');
            }
            dbData.img_files_names = order.images;
        }

        const { data, error } = await supabase
            .from('orders')
            .insert(dbData)
            .select()
            .single();

        if (error) {
            console.error('Erro ao inserir ordem:', error);
            throw error;
        }

        const createdId = data.id.toString();

        // Ensure folder path is updated for images before returning so it's consistent
        const folderPath = `companies/${dbData.company_id}/orders/${createdId}/images`;
        await supabase
            .from('orders')
            .update({ img_file_path: folderPath })
            .eq('id', createdId);

        // Se o usuário optou por receber notificações, adicioná-lo como seguidor da ordem
        if (order.isNotifying) {
            await supabase
                .from('orders_followers')
                .insert({
                    o_id: parseInt(createdId),
                    user_id: parseInt(currentUser.id)
                });
        }

        // Fetch the COMPLETE order details (includes mapping, joined names, and correctly formatted dates)
        let fullOrder = await this.getOrderById(createdId);

        if (!fullOrder) {
            // Try again after 1s if first attempt failed - views might have slight delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            fullOrder = await this.getOrderById(createdId);
        }

        if (!fullOrder) {
            // Fallback for safety - Ensure keys are in camelCase as expected by the UI
            return {
                id: createdId,
                orderMask: orderMask,
                clientId: dbData.client_id?.toString(),
                unitId: dbData.unit_id?.toString(),
                unitDescription: unitData?.description,
                unitDescriptionFull: unitData?.description_full,
                typeId: dbData.type_id?.toString(),
                typeCode: orderTypeData?.code,
                typeDescription: orderTypeData?.description,
                requestedServices: dbData.requested_services,
                priorityId: dbData.priority_id?.toString(),
                priorityDescription: priorityData?.description,
                requesterName: dbData.requester_name,
                requesterPhone: dbData.requester_phone,
                requestedAt: dbData.requested_at,
                createdAt: dbData.created_at,
                statusId: dbData.status_id,
                statusAt: dbData.status_at,
                progress: '0%',
                images: dbData.img_files_names || [],
                imgFilePath: folderPath
            } as any;
        }

        return fullOrder;
    },




    async getParentOrder(parentId: string | number): Promise<Order | null> {
        const { data, error } = await supabase
            .from('v_orders_parent')
            .select('*')
            .eq('id', parentId)
            .single();

        if (error) {
            console.error('Error fetching parent order from v_orders_parent:', error);
            return null;
        }

        return {
            id: data.id?.toString(),
            orderMask: data.order_mask,
            typeId: data.type_id?.toString(),
            typeCode: data.type_code,
            typeDescription: data.type_description,
            unitId: data.unit_id?.toString(),
            unitDescription: data.unit_description,
            unitAssetTagDescription: data.asset_tag_description,
            assetTagDescription: data.asset_tag_description,
            unitAssetTagSubDescription: data.asset_tag_sub_description,
            assetTagSubDescription: data.asset_tag_sub_description,
            requesterName: data.requester_name,
            requesterTeamCode: data.requester_team_code,
            requesterPhone: data.requester_phone,
            requestedAt: data.requested_at,
            requestedServices: data.requested_services,
            statusId: data.status_id,
            statusAt: data.status_at,
            statusDescription: data.status_description,
            statusColor: data.status_color,
            statusIcon: data.status_icon,
            statusBackgroundColor: data.status_background_color,
            imgFilesNames: data.img_files_names || [],
            imgFilePath: data.img_file_path,
            clientName: data.client_name,
            companyId: data.company_id?.toString(),
            priorityCode: data.priority_code,
            teamLeaderId: data.team_leader_id?.toString()
        } as Order;
    },

    async getChildOrders(parentId: string | number): Promise<Order[]> {
        try {
            const pid = typeof parentId === 'string' && !isNaN(Number(parentId)) ? Number(parentId) : parentId;

            const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
            const companyMap = new Map((companies || []).map(c => [c.id, c]));

            const { data, error } = await supabase
                .from('v_orders')
                .select('*')
                .eq('parent_id', pid)
                .order('requested_at', { ascending: false });

            if (error) throw error;

            // Fetch status_at separately since it might be missing from the view or not selected
            const orderIds = (data || []).map((o: any) => o.id);
            let statusMap: Record<string, string> = {};

            if (orderIds.length > 0) {
                const { data: statusData } = await supabase
                    .from('orders')
                    .select('id, status_at')
                    .in('id', orderIds);

                if (statusData) {
                    statusData.forEach((s: any) => {
                        statusMap[s.id] = s.status_at;
                    });
                }
            }

            return (data || []).map((row: any) => {
                // Use company_id (Owner/Client) for the logo to maintain consistency with the SS Detail view
                const providerCompanyIdStr = row.provider_company_id?.toString();
                const providerCompany = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;
                const providerLogoUrl = this.getPublicImageUrl(
                    row.provider_company_img_file_path || row.provider_company_img_path || providerCompany?.img_file_path,
                    row.provider_company_img_file_name || row.provider_company_img_name || providerCompany?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                );

                return {
                    id: row.id.toString(),
                    type: 'OS',
                    orderMask: row.order_mask,
                    clientId: row.client_id,
                    clientName: row.client_name,
                    companyId: row.company_id,
                    unitId: row.unit_id,
                    departmentId: row.department_id,
                    providerDepartmentId: row.provider_department_id,
                    typeId: row.type_id?.toString(),
                    typeCode: row.type_code,
                    typeSubId: row.type_sub_id?.toString(),
                    typeSubCode: row.type_sub_code,
                    objectId: row.object_id?.toString(),
                    objectCode: row.object_code,
                    priorityId: row.priority_id?.toString(),
                    priorityCode: row.priority_code,
                    statusId: row.status_id,
                    statusAt: statusMap[row.id] || row.status_at,
                    statusDescription: row.status_description,
                    statusIcon: row.status_icon,
                    iconColor: row.icon_color,
                    statusBackgroundColor: row.status_background_color,
                    requestedServices: row.requested_services,
                    requesterName: row.requester_name,
                    requesterTeamCode: row.team_code,
                    requesterPhone: row.requester_phone,
                    requestedAt: row.requested_at,
                    progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                    providerCompanyName: row.provider_company_description || row.provider_company_name || providerCompany?.description,
                    providerLogo: providerLogoUrl,
                    unitDescription: row.unit_description,
                    unitAssetTagDescription: row.unit_asset_tag_description || row.asset_tag_description,
                    unitAssetTagSubDescription: row.unit_asset_tag_sub_description || row.asset_tag_sub_description,
                    assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                    assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                    teamCode: row.team_code,
                    teamLeaderNameShort: row.team_leader_name_short,
                    parentId: row.parent_id,
                    imgFilePath: row.img_file_path,
                    imgFileName: row.img_file_name,
                    imgFilesNames: row.img_files_names
                } as Order;
            });
        } catch (error) {
            console.error('Error fetching child orders:', error);
            return [];
        }
    },

    async createOrder(order: Partial<Order>): Promise<Order> {
        // Basic validation
        if (!order.clientId || !order.unitId || !order.typeId || !order.requestedServices) {
            throw new Error('Dados obrigatórios faltando: client_id, unit_id, type_id, requested_services');
        }

        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('Usuário não autenticado');

        // Resolve user data
        const { data: userTeam } = await supabase
            .from('cfg_teams')
            .select('company_id, department_id')
            .eq('id', currentUser.teamId)
            .single();

        let dbData: any = {};
        let orderMask = '';

        if (order.parentId) {
            // Case: Create OS from SS (Child Order)
            const parentId = parseInt(order.parentId.toString());
            const { data: parentOrder, error: parentError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', parentId)
                .single();

            if (parentError || !parentOrder) throw new Error('Solicitação de Serviço (SS) pai não encontrada');


            // Fetch provider info from contract
            let providerCompanyId = null;
            let providerDepartmentId = null;
            if (order.contractId) {
                const { data: contractData } = await supabase
                    .from('contracts')
                    .select('provider_company_id, provider_department_id')
                    .eq('id', order.contractId)
                    .single();

                if (contractData) {
                    providerCompanyId = contractData.provider_company_id;
                    providerDepartmentId = contractData.provider_department_id;
                }
            }

            // Count existing children to determine counter_child
            const { count, error: countError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('parent_id', parentId);

            if (countError) throw new Error('Erro ao contar ordens filhas');

            const childCounter = (count || 0) + 1;
            const currentYear = parentOrder.year;

            // Mask format: PARENT_COUNTER.CHILD_COUNTER.YEAR (e.g., 100.1.2024)
            orderMask = `${parentOrder.counter_parent}.${childCounter}.${currentYear}`;

            dbData = {
                // Inherited from Parent SS
                parent_id: parentId,
                client_id: parentOrder.client_id,
                unit_id: parentOrder.unit_id,
                unit_asset_tag_id: order.unitAssetTagId ? parseInt(order.unitAssetTagId) : parentOrder.unit_asset_tag_id,
                system_parent_id: parentOrder.system_parent_id,
                system_id: parentOrder.system_id,
                unit_type_parent_id: parentOrder.unit_type_parent_id,
                unit_type_id: parentOrder.unit_type_id,
                unit_latitude: parentOrder.unit_latitude,
                unit_longitude: parentOrder.unit_longitude,
                asset_tag_id: order.assetTagId ? parseInt(order.assetTagId) : parentOrder.asset_tag_id,
                asset_tag_sub_id: order.assetTagSubId ? parseInt(order.assetTagSubId) : parentOrder.asset_tag_sub_id,
                counter_parent: parentOrder.counter_parent,
                counter_child: childCounter,
                year: currentYear,
                company_id: parentOrder.company_id, // Same company

                // New Data
                type_id: parseInt(order.typeId),
                type_sub_id: order.typeSubId ? parseInt(order.typeSubId) : null,
                object_id: order.objectId ? parseInt(order.objectId) : null,
                priority_id: order.priorityId ? parseInt(order.priorityId) : null,
                team_id: order.teamId ? parseInt(order.teamId) : null,
                contract_id: order.contractId ? parseInt(order.contractId) : null,
                plan_id: order.planId ? parseInt(order.planId) : null,
                requested_services: order.requestedServices,

                // Provider Data (Derived from Contract)
                provider_company_id: providerCompanyId,
                provider_department_id: providerDepartmentId,

                // Requester (Current User creates the OS)
                department_id: userTeam?.department_id || null,
                requester_name: currentUser.nameShort || currentUser.nameFull,
                requester_team_id: currentUser.teamId ? parseInt(currentUser.teamId) : null,
                requester_phone: currentUser.mobileMask || currentUser.mobile || null,
                created_user_id: parseInt(currentUser.id),

                order_mask: orderMask,
                status_id: 2, // Em Avaliação
                unit_asset_tag_has_order: false,
                status_at: getBrazilTimestamp(),
                requested_at: getBrazilTimestamp(), // Data de criação desta OS (individual)
                created_at: getBrazilTimestamp()
            };

        } else {
            // Case: Create New Root OS - FORBIDDEN
            throw new Error("Não é possível criar uma nova OS sem uma SS");
        }

        // Imagens (Common)
        if (order.images && Array.isArray(order.images)) {
            dbData.img_files_names = order.images;
        }

        const { data, error: insertError } = await supabase
            .from('orders')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        // Flow Rule: Update SS status based on children priority
        // "Não atualizar situação da SS caso exista alguma OS com situação 'Em Andamento', 
        // caso contrario, executar a função updateServiceRequestStatus"
        // The helper function updateServiceRequestStatus already implements "Highest Priority Wins".
        // If an OS is "Em Andamento" (Higher Priority), it will be respected.
        if (dbData.parent_id) {
            await this.updateServiceRequestStatus(dbData.parent_id.toString());
        }

        const insertedOrder = data as any;
        console.log('Inserted order result:', { id: insertedOrder.id, company_id: insertedOrder.company_id });
        // Atualizar o caminho das imagens agora que temos o ID da OS
        const folderPath = `companies/${insertedOrder.company_id}/orders/${insertedOrder.id}/images`;
        const { error: updatePathError } = await supabase
            .from('orders')
            .update({ img_file_path: folderPath })
            .eq('id', insertedOrder.id);

        if (updatePathError) {
            console.error('Erro ao atualizar caminho das imagens:', updatePathError);
            // Non-blocking error, we still have the order
        }

        // Fetch the COMPLETE order details (includes mapping, joined names, and correctly formatted dates)
        let fullOrder = await this.getOrderById(insertedOrder.id);

        if (!fullOrder) {
            // Try again after 1s if first attempt failed - views might have slight delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            fullOrder = await this.getOrderById(insertedOrder.id);
        }

        if (!fullOrder) {
            // Fallback for safety - Ensure keys are in camelCase as expected by the UI
            return {
                ...insertedOrder,
                id: insertedOrder.id.toString(),
                companyId: insertedOrder.company_id?.toString(),
                imgFilePath: folderPath
            } as any;
        }

        return fullOrder;
    },

    async copyImagesFromOrderToOrder(srcCompanyId: string, srcOrderId: string, destCompanyId: string, destOrderId: string, files: string[]): Promise<void> {
        // r2Service is now static

        const srcFolder = `companies/${srcCompanyId}/orders/${srcOrderId}/images`;
        const destFolder = `companies/${destCompanyId}/orders/${destOrderId}/images`;

        if (r2Service.isR2Configured()) {
            const promises = files.map(filename => {
                return r2Service.copyFile(`${srcFolder}/${filename}`, `${destFolder}/${filename}`);
            });
            await Promise.all(promises);
        } else {
            const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
            const promises = files.map(filename => {
                return supabase.storage.from(bucketName).copy(
                    `${srcFolder}/${filename}`,
                    `${destFolder}/${filename}`
                );
            });
            await Promise.all(promises);
        }
    },

    async uploadOrderImage(companyId: string, orderId: string, file: File): Promise<{ path: string; filename: string }> {
        // r2Service is now static

        const fileExt = file.name.split('.').pop();
        // Adiciona um random string para evitar colisão em uploads simultâneos
        const uniqueSuffix = Math.random().toString(36).substring(7);
        const fileName = `${Date.now()}-${uniqueSuffix}.${fileExt}`;
        const folderPath = `companies/${companyId}/orders/${orderId}/images`;
        const fullPath = `${folderPath}/${fileName}`;

        await r2Service.uploadFile(file, fullPath);

        return { path: folderPath, filename: fileName };
    },

    async updateOrderImage(orderId: string, path: string, filename: string): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({
                img_file_path: path,
                img_file_name: filename
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
        const dbData: any = {
            updated_at: getBrazilTimestamp()
        };

        if (order.typeId !== undefined) dbData.type_id = order.typeId ? parseInt(order.typeId) : null;
        if (order.typeSubId !== undefined) dbData.type_sub_id = order.typeSubId ? parseInt(order.typeSubId) : null;
        if (order.objectId !== undefined) dbData.object_id = order.objectId ? parseInt(order.objectId) : null;
        if (order.priorityId !== undefined) dbData.priority_id = order.priorityId ? parseInt(order.priorityId) : null;
        if (order.teamId !== undefined) dbData.team_id = order.teamId ? parseInt(order.teamId) : null;
        if (order.contractId !== undefined) dbData.contract_id = order.contractId ? parseInt(order.contractId) : null;
        if (order.planId !== undefined) dbData.plan_id = order.planId ? parseInt(order.planId) : null;
        if (order.requestedServices !== undefined) dbData.requested_services = order.requestedServices;
        if (order.clientId !== undefined) dbData.client_id = order.clientId ? parseInt(order.clientId) : null;
        if (order.unitId !== undefined) dbData.unit_id = order.unitId ? parseInt(order.unitId) : null;

        // Resolve unitAssetTagId via cfg_units_assets_tags to get the correct asset_tag_id
        // (same logic used in createServiceRequest to avoid ID mismatch between tables)
        if (order.unitAssetTagId !== undefined) {
            const newUnitAssetTagId = order.unitAssetTagId ? parseInt(order.unitAssetTagId) : null;
            dbData.unit_asset_tag_id = newUnitAssetTagId;

            if (newUnitAssetTagId) {
                const { data: tagData, error: assetTagError } = await supabase
                    .from('cfg_units_assets_tags')
                    .select('asset_tag_id, asset_tag_sub_id')
                    .eq('id', newUnitAssetTagId)
                    .single();

                if (!assetTagError && tagData) {
                    dbData.asset_tag_id = tagData.asset_tag_id ?? null;
                    dbData.asset_tag_sub_id = tagData.asset_tag_sub_id ?? null;
                }
            } else {
                // Clearing the sector clears both derived fields if explicitly set to null/empty
                dbData.asset_tag_id = null;
                dbData.asset_tag_sub_id = null;
            }
        }

        // Allow direct assetTagId override only if unitAssetTagId was not provided
        if (order.assetTagId !== undefined && order.unitAssetTagId === undefined) dbData.asset_tag_id = order.assetTagId ? parseInt(order.assetTagId) : null;
        if (order.assetTagSubId !== undefined && order.unitAssetTagId === undefined) dbData.asset_tag_sub_id = order.assetTagSubId ? parseInt(order.assetTagSubId) : null;
        if (order.statusId !== undefined) dbData.status_id = order.statusId;
        if (order.statusAt !== undefined) dbData.status_at = order.statusAt;
        if (order.causeReasonId !== undefined) dbData.cause_reason_id = order.causeReasonId;

        if (order.progress !== undefined) {
            const p = parseFloat(String(order.progress).replace('%', ''));
            dbData.progress = isNaN(p) ? 0 : p / 100;
        }

        // Handling images list if provided
        if (order.images !== undefined) dbData.img_files_names = order.images;

        const { data, error } = await supabase
            .from('orders')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If contract changed, we need to update provider info derived from it
        if (order.contractId) {
            const { data: contractData } = await supabase
                .from('contracts')
                .select('provider_company_id, provider_department_id')
                .eq('id', order.contractId)
                .single();

            if (contractData) {
                await supabase
                    .from('orders')
                    .update({
                        provider_company_id: contractData.provider_company_id,
                        provider_department_id: contractData.provider_department_id
                    })
                    .eq('id', id);
            }
        }

        if (data && data.parent_id) {
            await this.updateServiceRequestStatus(data.parent_id.toString());
        }

        // Return the COMPLETE order details (includes mapping, joined names, and correctly formatted dates)
        let fullOrder = await this.getOrderById(id);

        if (!fullOrder) {
            // Try again after 500ms if first attempt failed - views might have slight delay
            await new Promise(resolve => setTimeout(resolve, 500));
            fullOrder = await this.getOrderById(id);
        }

        if (!fullOrder) {
            const updatedData = data as any;
            return {
                ...updatedData,
                id: updatedData.id.toString(),
                companyId: updatedData.company_id?.toString()
            } as Order;
        }

        return fullOrder;
    },


    async updateOrderFiles(orderId: string, filenames: string[]): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({
                img_files_names: filenames
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    async updateOrderStatus(orderId: string, statusId: number): Promise<void> {
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', orderId).single();
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: statusId,
                status_at: getBrazilTimestamp()
            })
            .eq('id', orderId);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },


    /**
     * Atualiza o status da Solicitação de Serviço (SS) com base no maior nível de prioridade
     * entre todas as suas Ordens de Serviço (OS) filhas.
     * 
     * @param serviceRequestId - ID da SS a ser atualizada
     */
    async updateServiceRequestStatus(serviceRequestId: string): Promise<void> {
        const id = Number(serviceRequestId);
        const { data: childOrders, error } = await supabase
            .from('orders')
            .select('status_id, status_at')
            .eq('parent_id', id)
            .eq('is_deleted', false);

        if (error) {
            console.error('Erro ao buscar OS filhas:', error);
            throw error;
        }

        if (!childOrders || childOrders.length === 0) return;

        const { data: statusesData, error: statusError } = await supabase
            .from('cfg_orders_statuses')
            .select('id, priority_level');

        if (statusError) {
            console.error('Erro ao buscar cfg_orders_statuses:', statusError);
            return;
        }

        const priorityMap = new Map<number, number>();
        statusesData?.forEach((s: any) => priorityMap.set(s.id, s.priority_level));

        const ordersWithPriority = childOrders.map((os: any) => ({
            ...os,
            priority_level: priorityMap.get(os.status_id) || 0
        }));

        const maxPriority = Math.max(...ordersWithPriority.map((os: any) => os.priority_level));

        const targetOrder = ordersWithPriority
            .filter((os: any) => os.priority_level === maxPriority)
            .sort((a: any, b: any) => new Date(b.status_at).getTime() - new Date(a.status_at).getTime())[0];

        if (!targetOrder) return;

        const { data: ssData } = await supabase
            .from('orders')
            .select('status_id, status_at')
            .eq('id', id)
            .single();

        if (!ssData) return;

        // Regra: Sempre sincronizar a SS com a OS filha mais avançada (FORÇADO)
        await supabase
            .from('orders')
            .update({
                status_id: targetOrder.status_id,
                status_at: targetOrder.status_at,
                updated_at: getBrazilTimestamp() // Forçar refresh de triggers/views
            })
            .eq('id', id);
    },

    // Contract Services
    async getContractServices(contractId: string): Promise<ContractService[]> {
        // 1. Fetch linkage records
        const { data: linkerData, error: linkerError } = await supabase
            .from('contracts_services')
            .select('*')
            .eq('contract_id', contractId);

        if (linkerError) {
            console.error('Error fetching contract services:', linkerError);
            throw linkerError;
        }

        if (!linkerData || linkerData.length === 0) return [];

        // 2. Fetch related service details to avoid join cache issues
        const serviceIds = [...new Set(linkerData.map(item => item.service_id))];
        const { data: servicesData, error: servicesError } = await supabase
            .from('cfg_services')
            .select('id, description, code, unit')
            .in('id', serviceIds);

        if (servicesError) {
            console.error('Error fetching service details:', servicesError);
            throw servicesError;
        }

        // 3. Map and join manually
        return linkerData.map((item: any) => {
            const service = servicesData?.find(s => s.id === item.service_id);

            return {
                id: item.id.toString(),
                contractId: item.contract_id.toString(),
                serviceId: item.service_id.toString(),
                valueUnit: Number(item.value_unit),
                discount: Number(item.discount),
                amount: Number(item.amount),
                valueTotal: Number(item.value_total),
                isAvailable: item.is_available,
                isDeleted: item.is_deleted,
                versionMode: item.version_mode,
                serviceDescription: service?.description,
                serviceCode: service?.code,
                serviceUnit: service?.unit
            };
        }) as ContractService[];
    },

    async addContractService(item: Partial<ContractService>): Promise<void> {
        const dbData = {
            contract_id: item.contractId,
            service_id: item.serviceId,
            value_unit: item.valueUnit,
            discount: item.discount,
            amount: item.amount
        };

        const { error } = await supabase
            .from('contracts_services')
            .insert(dbData);

        if (error) throw error;
    },

    async updateContractService(id: string, item: Partial<ContractService>): Promise<void> {
        const dbData: any = {};
        if (item.valueUnit !== undefined) dbData.value_unit = item.valueUnit;
        if (item.discount !== undefined) dbData.discount = item.discount;
        if (item.amount !== undefined) dbData.amount = item.amount;

        const { error } = await supabase
            .from('contracts_services')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteContractService(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts_services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // CONTRACT MANAGERS (contracts_managers)
    // -------------------------------------------------------------------------
    async getContractManagers(contractId: string): Promise<ContractManager[]> {
        // Fetch relations
        const { data: relations, error } = await supabase
            .from('contracts_managers')
            .select('*')
            .eq('contract_id', contractId)
            .eq('is_deleted', 'false');

        if (error) {
            console.error('Error fetching contract managers relations:', error);
            throw error;
        }

        if (!relations || relations.length === 0) return [];

        const userIds = relations.map(r => r.manager_id);

        // Fetch actual user details
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);

        if (usersError) {
            console.error('Error fetching manager details:', usersError);
            throw usersError;
        }

        const userMap = new Map(users.map(u => [u.id.toString(), u]));

        return relations.map(r => {
            const user = userMap.get(r.manager_id.toString());
            return {
                id: r.id.toString(),
                contractId: r.contract_id.toString(),
                managerId: r.manager_id.toString(),
                isDeleted: r.is_deleted,
                role: r.role,
                versionMode: r.version_mode,
                createdAt: r.created_at,
                // Audit fields
                managerName: user?.name_short || user?.name_full,
                managerEmail: user?.email,
                managerAvatarUrl: user?.img_file_name
                    ? this.getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined
            };
        });
    },

    async getManagedContracts(userId: string): Promise<Contract[]> {
        const { data: managed, error } = await supabase
            .from('contracts_managers')
            .select('contract_id')
            .eq('manager_id', userId)
            .eq('is_deleted', false)
            .in('role', ['manager', 'viewer']);

        if (error || !managed || managed.length === 0) return [];

        const contractIds = managed.map(m => m.contract_id.toString());
        return this.getContracts(contractIds);
    },

    async isUserContractManager(userId: string, contractId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('contracts_managers')
            .select('id')
            .eq('contract_id', contractId)
            .eq('manager_id', userId)
            .eq('role', 'manager')
            .eq('is_deleted', false)
            .maybeSingle();

        if (error) {
            console.error('Error checking if user is contract manager:', error);
            return false;
        }

        return !!data;
    },

    async addContractManager(contractId: string, managerId: string, role: string = 'viewer'): Promise<void> {
        // Check if already exists (deleted or not)
        const { data: existingFollow, error: checkError } = await supabase
            .from('contracts_managers')
            .select('id, is_deleted')
            .eq('contract_id', contractId)
            .eq('manager_id', managerId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingFollow) {
            // If exists but deleted, restore it
            if (existingFollow.is_deleted) {
                const { error } = await supabase
                    .from('contracts_managers')
                    .update({
                        is_deleted: false,
                        deleted_at: null,
                        deleted_user_id: null,
                        role
                    })
                    .eq('id', existingFollow.id);
                if (error) throw error;
            } else {
                // If active, update role
                await supabase
                    .from('contracts_managers')
                    .update({ role })
                    .eq('id', existingFollow.id);
            }
            return;
        }

        // Insert new
        const { error } = await supabase
            .from('contracts_managers')
            .insert({
                contract_id: contractId,
                manager_id: managerId,
                is_deleted: false,
                role
            });

        if (error) throw error;
    },

    async removeContractManager(contractId: string, managerId: string): Promise<void> {
        const { error } = await supabase
            .from('contracts_managers')
            .update({
                is_deleted: true,
                deleted_at: getBrazilTimestamp()
                // deleted_user_id: should come from context, but skipping for now
            })
            .eq('contract_id', contractId)
            .eq('manager_id', managerId);

        if (error) throw error;
    },

    async getAssets(filter: 'all' | 'active' | 'inactive' = 'all', search: string = '', unitId?: string, unitAssetTagId?: string): Promise<Asset[]> {
        console.log('getAssets: INICIANDO BUSCA DE ATIVOS...');

        try {
            // 1. Busca os ativos
            let query = supabase
                .from('assets')
                .select('*')
                .eq('is_deleted', 'false')
                .order('description');

            if (search && search.trim().length > 0) {
                const terms = search.trim().split(/\s+/);
                terms.forEach(term => {
                    query = query.ilike('searchable', `%${term}%`);
                });
            }

            if (unitId) {
                query = query.eq('unit_id', unitId);
            }

            if (unitAssetTagId) {
                query = query.eq('unit_asset_tag_id', unitAssetTagId);
            }

            // Limit results to avoid massive payloads if no search (or generous limit with search)
            const { data: assetsData, error: assetsError } = await query.limit(5000);

            if (assetsError) {
                console.error('getAssets: ERRO AO BUSCAR ATIVOS NA TABELA assets:', assetsError);
                throw assetsError;
            }

            if (!assetsData || assetsData.length === 0) {
                console.log('getAssets: NENHUM ATIVO ENCONTRADO NA TABELA.');
                return [];
            }

            console.log(`getAssets: ${assetsData.length} ativos encontrados.`);

            // 2. Coleta IDs únicos para buscar apenas dados relacionados necessários
            const unitIds = [...new Set(assetsData.map((a: any) => a.unit_id).filter(Boolean))];
            const clientIds = [...new Set(assetsData.map((a: any) => a.client_id).filter(Boolean))];
            const statusIds = [...new Set(assetsData.map((a: any) => a.status_id).filter(Boolean))];
            const unitAssetTagIds = [...new Set(assetsData.map((a: any) => a.unit_asset_tag_id).filter(Boolean))];

            // 3. Busca dados auxiliares em paralelo (apenas o necessário)
            const promises: any[] = [];

            if (unitIds.length > 0)
                promises.push(supabase.from('units').select('id, description_full').in('id', unitIds));
            else
                promises.push(Promise.resolve({ data: [] }));

            if (clientIds.length > 0)
                promises.push(supabase.from('clients').select('id, name').in('id', clientIds));
            else
                promises.push(Promise.resolve({ data: [] }));

            if (statusIds.length > 0)
                promises.push(supabase.from('cfg_assets_statuses').select('id, code, color').in('id', statusIds));
            else
                promises.push(Promise.resolve({ data: [] }));

            if (unitAssetTagIds.length > 0)
                promises.push(supabase.from('cfg_units_assets_tags').select('id, asset_tag_tag_sub_description').in('id', unitAssetTagIds));
            else
                promises.push(Promise.resolve({ data: [] }));

            const [unitsRes, clientsRes, statusRes, unitTagsRes] = await Promise.all(promises);

            const unitsMap = new Map((unitsRes.data || []).map((u: any) => [u.id.toString(), u.description_full]));
            const clientsMap = new Map((clientsRes.data || []).map((c: any) => [c.id.toString(), c.name]));
            const statusMap = new Map((statusRes.data || []).map((s: any) => [s.id.toString(), s.code]));
            const statusColorMap = new Map((statusRes.data || []).map((s: any) => [s.id.toString(), s.color]));
            const unitTagsMap = new Map((unitTagsRes.data || []).map((t: any) => [t.id.toString(), t.asset_tag_tag_sub_description]));

            console.log('getAssets: MAPEANDO DADOS...');

            // 4. Mapeia os dados combinando as informações
            const mappedAssets = assetsData.map((item: any) => {
                const unitId = item.unit_id?.toString();
                const clientId = item.client_id?.toString();
                const statusId = item.status_id?.toString();
                const tagId = item.tag_id?.toString();
                const tagSubId = item.tag_sub_id?.toString();
                const unitAssetTagId = item.unit_asset_tag_id?.toString();

                const mapped = {
                    id: item.id.toString(),
                    code: item.code || '',
                    description: item.description || '',
                    clientId: clientId,
                    clientName: clientsMap.get(clientId) || '',
                    unitId: unitId,
                    unitDescriptionFull: unitsMap.get(unitId) || '',
                    statusId: statusId,
                    statusCode: statusMap.get(statusId) || '',
                    statusColor: statusColorMap.get(statusId) || '#22c55e',
                    tagId: tagId,
                    tagName: unitTagsMap.get(unitAssetTagId) || '',
                    tagSubId: tagSubId,
                    tagSubName: '',
                    unitAssetTagId: unitAssetTagId,
                    statusAt: item.status_at,
                    acquisitionAt: item.acquisition_at,
                    typeId: item.type_id?.toString(),
                    comments: item.comments,
                    brand: item.brand,
                    model: item.model,
                    serial: item.serial,
                    location: item.location,
                    power: item.power,
                    powerUnit: item.power_unit,
                    voltage: item.voltage,
                    voltageUnit: item.voltage_unit,
                    amperage: item.amperage,
                    poles: item.poles,
                    rotation: item.rotation,
                    rotationUnit: item.rotation_unit,
                    serviceFactor: item.service_factor,
                    rotorDiameter: item.rotor_diameter,
                    rotorDiameterUnit: item.rotor_diameter_unit,
                    flowRateMax: item.flow_rate_max,
                    flowRateMin: item.flow_rate_min,
                    flowRateOperation: item.flow_rate_operation,
                    flowRateUnit: item.flow_rate_unit,
                    pressureMax: item.pressure_max,
                    pressureMin: item.pressure_min,
                    pressureOperation: item.pressure_operation,
                    pressureUnit: item.pressure_unit,
                    weight: item.weight,
                    weightUnit: item.weight_unit,
                    imgFilePath: item.img_file_path,
                    imgFileName: item.img_file_name
                };
                return mapped;
            }) as Asset[];

            console.log('getAssets: MAPEAMENTO CONCLUÍDO COM SUCESSO.');
            return mappedAssets;

        } catch (error) {
            console.error('getAssets: ERRO CRÍTICO NA FUNÇÃO:', error);
            throw error;
        }
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
        try {
            let unitIdsToFilter: string[] | null = null;
            
            // Se houver filtros de unidade (que não sejam apenas unitId), busca as unidades primeiro
            if (
                (filters.systemParentId && (Array.isArray(filters.systemParentId) ? filters.systemParentId.length > 0 : true)) ||
                (filters.systemId && (Array.isArray(filters.systemId) ? filters.systemId.length > 0 : true)) ||
                (filters.unitTypeParentId && (Array.isArray(filters.unitTypeParentId) ? filters.unitTypeParentId.length > 0 : true)) ||
                (filters.unitTypeId && (Array.isArray(filters.unitTypeId) ? filters.unitTypeId.length > 0 : true))
            ) {
                const units = await this.getFilteredUnits({
                    systemParentId: filters.systemParentId,
                    systemId: filters.systemId,
                    unitTypeParentId: filters.unitTypeParentId,
                    unitTypeId: filters.unitTypeId,
                });
                
                unitIdsToFilter = units.map(u => u.id.toString());
                
                if (unitIdsToFilter.length === 0) {
                    return []; // Nenhum match de unidade
                }
            }

            let query = supabase
                .from('assets')
                .select('*')
                .eq('is_deleted', 'false')
                .order('description');

            if (filters.search && filters.search.trim().length > 0) {
                const terms = filters.search.trim().split(/\s+/);
                terms.forEach(term => {
                    query = query.ilike('searchable', `%${term}%`);
                });
            }

            if (filters.unitId && (Array.isArray(filters.unitId) ? filters.unitId.length > 0 : true)) {
                if (Array.isArray(filters.unitId)) query = query.in('unit_id', filters.unitId);
                else query = query.eq('unit_id', filters.unitId);
            } else if (unitIdsToFilter) {
                query = query.in('unit_id', unitIdsToFilter);
            }

            if (filters.tagId && (Array.isArray(filters.tagId) ? filters.tagId.length > 0 : true)) {
                if (Array.isArray(filters.tagId)) query = query.in('tag_id', filters.tagId);
                else query = query.eq('tag_id', filters.tagId);
            }

            if (filters.tagSubId && (Array.isArray(filters.tagSubId) ? filters.tagSubId.length > 0 : true)) {
                if (Array.isArray(filters.tagSubId)) query = query.in('tag_sub_id', filters.tagSubId);
                else query = query.eq('tag_sub_id', filters.tagSubId);
            }

            if (filters.statusId && (Array.isArray(filters.statusId) ? filters.statusId.length > 0 : true)) {
                if (Array.isArray(filters.statusId)) query = query.in('status_id', filters.statusId);
                else query = query.eq('status_id', filters.statusId);
            }

            if (filters.typeId && (Array.isArray(filters.typeId) ? filters.typeId.length > 0 : true)) {
                if (Array.isArray(filters.typeId)) query = query.in('type_id', filters.typeId);
                else query = query.eq('type_id', filters.typeId);
            }

            const { data: assetsData, error: assetsError } = await query.limit(5000);

            if (assetsError) {
                console.error('getFilteredAssets: ERRO:', assetsError);
                throw assetsError;
            }

            if (!assetsData || assetsData.length === 0) {
                return [];
            }

            // Mapeamento local dos relacionamentos (mesmo padrão do getAssets)
            const unitIds = [...new Set(assetsData.map((a: any) => a.unit_id).filter(Boolean))];
            const clientIds = [...new Set(assetsData.map((a: any) => a.client_id).filter(Boolean))];
            const statusIds = [...new Set(assetsData.map((a: any) => a.status_id).filter(Boolean))];
            const unitAssetTagIds = [...new Set(assetsData.map((a: any) => a.unit_asset_tag_id).filter(Boolean))];

            const promises: any[] = [];
            promises.push(unitIds.length > 0 ? supabase.from('units').select('id, description_full').in('id', unitIds) : Promise.resolve({ data: [] }));
            promises.push(clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : Promise.resolve({ data: [] }));
            promises.push(statusIds.length > 0 ? supabase.from('cfg_assets_statuses').select('id, code, color').in('id', statusIds) : Promise.resolve({ data: [] }));
            promises.push(unitAssetTagIds.length > 0 ? supabase.from('cfg_units_assets_tags').select('id, asset_tag_tag_sub_description').in('id', unitAssetTagIds) : Promise.resolve({ data: [] }));

            const [unitsRes, clientsRes, statusRes, unitTagsRes] = await Promise.all(promises);

            const unitsMap = new Map((unitsRes.data || []).map((u: any) => [u.id.toString(), u.description_full]));
            const clientsMap = new Map((clientsRes.data || []).map((c: any) => [c.id.toString(), c.name]));
            const statusMap = new Map((statusRes.data || []).map((s: any) => [s.id.toString(), s.code]));
            const statusColorMap = new Map((statusRes.data || []).map((s: any) => [s.id.toString(), s.color]));
            const unitTagsMap = new Map((unitTagsRes.data || []).map((t: any) => [t.id.toString(), t.asset_tag_tag_sub_description]));

            return assetsData.map((item: any) => ({
                id: item.id.toString(),
                code: item.code || '',
                description: item.description || '',
                clientId: item.client_id?.toString(),
                clientName: clientsMap.get(item.client_id?.toString()) || '',
                unitId: item.unit_id?.toString(),
                unitDescriptionFull: unitsMap.get(item.unit_id?.toString()) || '',
                statusId: item.status_id?.toString(),
                statusCode: statusMap.get(item.status_id?.toString()) || '',
                statusColor: statusColorMap.get(item.status_id?.toString()) || '#22c55e',
                tagId: item.tag_id?.toString(),
                tagName: unitTagsMap.get(item.unit_asset_tag_id?.toString()) || '',
                tagSubId: item.tag_sub_id?.toString(),
                tagSubName: '',
                unitAssetTagId: item.unit_asset_tag_id?.toString(),
                statusAt: item.status_at,
                acquisitionAt: item.acquisition_at,
                typeId: item.type_id?.toString(),
                comments: item.comments,
                brand: item.brand,
                model: item.model,
                serial: item.serial,
                location: item.location,
                power: item.power,
                powerUnit: item.power_unit,
                voltage: item.voltage,
                voltageUnit: item.voltage_unit,
                amperage: item.amperage,
                poles: item.poles,
                rotation: item.rotation,
                rotationUnit: item.rotation_unit,
                serviceFactor: item.service_factor,
                rotorDiameter: item.rotor_diameter,
                rotorDiameterUnit: item.rotor_diameter_unit,
                flowRateMax: item.flow_rate_max,
                flowRateMin: item.flow_rate_min,
                flowRateOperation: item.flow_rate_operation,
                flowRateUnit: item.flow_rate_unit,
                pressureMax: item.pressure_max,
                pressureMin: item.pressure_min,
                pressureOperation: item.pressure_operation,
                pressureUnit: item.pressure_unit,
                weight: item.weight,
                weightUnit: item.weight_unit,
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name
            })) as Asset[];

        } catch (error) {
            console.error('getFilteredAssets: ERRO CRÍTICO NA FUNÇÃO:', error);
            throw error;
        }
    },

    async createAsset(asset: Partial<Asset>): Promise<Asset> {
        const dbData: any = {
            code: asset.code,
            description: asset.description,
            client_id: asset.clientId ? parseInt(asset.clientId) : null,
            unit_id: asset.unitId ? parseInt(asset.unitId) : null,
            status_id: asset.statusId ? parseInt(asset.statusId) : null,
            tag_id: asset.tagId ? parseInt(asset.tagId) : null,
            tag_sub_id: asset.tagSubId ? parseInt(asset.tagSubId) : null,
            comments: asset.comments,
            brand: asset.brand,
            model: asset.model,
            serial: asset.serial,
            location: asset.location,
            acquisition_at: asset.acquisitionAt || null,
            status_at: asset.statusAt || null,
            power: asset.power,
            power_unit: asset.powerUnit,
            voltage: asset.voltage,
            voltage_unit: asset.voltageUnit,
            amperage: asset.amperage,
            poles: asset.poles,
            rotation: asset.rotation,
            rotation_unit: asset.rotationUnit,
            service_factor: asset.serviceFactor,
            rotor_diameter: asset.rotorDiameter,
            rotor_diameter_unit: asset.rotorDiameterUnit,
            flow_rate_max: asset.flowRateMax,
            flow_rate_min: asset.flowRateMin,
            flow_rate_operation: asset.flowRateOperation,
            flow_rate_unit: asset.flowRateUnit,
            pressure_max: asset.pressureMax,
            pressure_min: asset.pressureMin,
            pressure_operation: asset.pressureOperation,
            pressure_unit: asset.pressureUnit,
            weight: asset.weight,
            weight_unit: asset.weightUnit,
            type_id: asset.typeId ? parseInt(asset.typeId) : null,
            unit_asset_tag_id: asset.unitAssetTagId ? parseInt(asset.unitAssetTagId) : null,
            img_file_path: asset.imgFilePath,
            img_file_name: asset.imgFileName,
            updated_at: new Date().toISOString()
        };

        if (asset.unitAssetTagId) {
            const { data: tagMaster } = await supabase
                .from('cfg_units_assets_tags')
                .select('asset_tag_id, asset_tag_sub_id')
                .eq('id', asset.unitAssetTagId)
                .single();

            if (tagMaster) {
                dbData.tag_id = tagMaster.asset_tag_id;
                dbData.tag_sub_id = tagMaster.asset_tag_sub_id;
            }
        }

        const { data, error } = await supabase
            .from('assets')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        // Save attribute values if provided
        if (asset.attributeValues) {
            await this.saveAssetAttributeValues(data.id.toString(), asset.attributeValues);
        }

        return (await this.getAssetById(data.id.toString())) || {
            ...asset,
            id: data.id.toString()
        } as Asset;
    },

    async updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
        const dbData: any = {
            updated_at: new Date().toISOString()
        };

        if (asset.code !== undefined) dbData.code = asset.code;
        if (asset.description !== undefined) dbData.description = asset.description;
        if (asset.clientId !== undefined) dbData.client_id = asset.clientId ? parseInt(asset.clientId) : null;
        if (asset.unitId !== undefined) dbData.unit_id = asset.unitId ? parseInt(asset.unitId) : null;
        if (asset.statusId !== undefined) dbData.status_id = asset.statusId ? parseInt(asset.statusId) : null;
        if (asset.tagId !== undefined) dbData.tag_id = asset.tagId ? parseInt(asset.tagId) : null;
        if (asset.tagSubId !== undefined) dbData.tag_sub_id = asset.tagSubId ? parseInt(asset.tagSubId) : null;
        if (asset.comments !== undefined) dbData.comments = asset.comments;
        if (asset.brand !== undefined) dbData.brand = asset.brand;
        if (asset.model !== undefined) dbData.model = asset.model;
        if (asset.serial !== undefined) dbData.serial = asset.serial;
        if (asset.location !== undefined) dbData.location = asset.location;
        if (asset.acquisitionAt !== undefined) dbData.acquisition_at = asset.acquisitionAt || null;
        if (asset.statusAt !== undefined) dbData.status_at = asset.statusAt || null;
        if (asset.power !== undefined) dbData.power = asset.power;
        if (asset.powerUnit !== undefined) dbData.power_unit = asset.powerUnit;
        if (asset.voltage !== undefined) dbData.voltage = asset.voltage;
        if (asset.voltageUnit !== undefined) dbData.voltage_unit = asset.voltageUnit;
        if (asset.amperage !== undefined) dbData.amperage = asset.amperage;
        if (asset.poles !== undefined) dbData.poles = asset.poles;
        if (asset.rotation !== undefined) dbData.rotation = asset.rotation;
        if (asset.rotationUnit !== undefined) dbData.rotation_unit = asset.rotationUnit;
        if (asset.serviceFactor !== undefined) dbData.service_factor = asset.serviceFactor;
        if (asset.rotorDiameter !== undefined) dbData.rotor_diameter = asset.rotorDiameter;
        if (asset.rotorDiameterUnit !== undefined) dbData.rotor_diameter_unit = asset.rotorDiameterUnit;
        if (asset.flowRateMax !== undefined) dbData.flow_rate_max = asset.flowRateMax;
        if (asset.flowRateMin !== undefined) dbData.flow_rate_min = asset.flowRateMin;
        if (asset.flowRateOperation !== undefined) dbData.flow_rate_operation = asset.flowRateOperation;
        if (asset.flowRateUnit !== undefined) dbData.flow_rate_unit = asset.flowRateUnit;
        if (asset.pressureMax !== undefined) dbData.pressure_max = asset.pressureMax;
        if (asset.pressureMin !== undefined) dbData.pressure_min = asset.pressureMin;
        if (asset.pressureOperation !== undefined) dbData.pressure_operation = asset.pressureOperation;
        if (asset.pressureUnit !== undefined) dbData.pressure_unit = asset.pressureUnit;
        if (asset.weight !== undefined) dbData.weight = asset.weight;
        if (asset.weightUnit !== undefined) dbData.weight_unit = asset.weightUnit;
        if (asset.imgFilePath !== undefined) dbData.img_file_path = asset.imgFilePath;
        if (asset.imgFileName !== undefined) dbData.img_file_name = asset.imgFileName;
        if (asset.typeId !== undefined) dbData.type_id = asset.typeId ? parseInt(asset.typeId) : null;
        if (asset.unitAssetTagId !== undefined) dbData.unit_asset_tag_id = asset.unitAssetTagId ? parseInt(asset.unitAssetTagId) : null;

        if (dbData.unit_asset_tag_id) {
            const { data: tagMaster } = await supabase
                .from('cfg_units_assets_tags')
                .select('asset_tag_id, asset_tag_sub_id')
                .eq('id', dbData.unit_asset_tag_id)
                .single();

            if (tagMaster) {
                dbData.tag_id = tagMaster.asset_tag_id;
                dbData.tag_sub_id = tagMaster.asset_tag_sub_id;
            }
        }

        const { error } = await supabase
            .from('assets')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;

        // Save attribute values if provided
        if (asset.attributeValues) {
            await this.saveAssetAttributeValues(id, asset.attributeValues);
        }

        return (await this.getAssetById(id)) as Asset;
    },

    async uploadAssetImage(assetId: string, file: File): Promise<{ path: string, filename: string }> {
        // Importar r2Service dinamicamente
        // r2Service is now static


        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        // Estrutura ajustada: companies/1/assets/{assetId}/ (Raiz)
        const companyId = 1;
        const folderPath = `companies/${companyId}/assets/${assetId}`;
        const fullPath = `${folderPath}/${fileName}`;

        // Upload to Cloudflare R2
        try {
            await r2Service.uploadFile(file, fullPath);
        } catch (uploadError) {
            console.error('Error uploading asset image to R2:', uploadError);
            throw uploadError;
        }

        return { path: folderPath, filename: fileName };
    },

    async getAssetById(id: string): Promise<Asset | null> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        // Fetch auxiliary data
        const [unitsData, clientsData, statusData, tagInfo] = await Promise.all([
            supabase.from('units').select('id, description_full').eq('id', data.unit_id).single(),
            supabase.from('clients').select('id, name').eq('id', data.client_id).single(),
            supabase.from('cfg_assets_statuses').select('id, code, color').eq('id', data.status_id).single(),
            data.unit_asset_tag_id
                ? supabase.from('cfg_units_assets_tags').select('id, asset_tag_tag_sub_description').eq('id', data.unit_asset_tag_id).single()
                : Promise.resolve({ data: null })
        ]);

        return {
            id: data.id.toString(),
            code: data.code || '',
            description: data.description || '',
            clientId: data.client_id?.toString(),
            clientName: clientsData.data?.name || '',
            unitId: data.unit_id?.toString(),
            unitDescriptionFull: unitsData.data?.description_full || '',
            statusId: data.status_id?.toString(),
            statusCode: statusData.data?.code || '',
            statusColor: statusData.data?.color || '#22c55e',
            tagId: data.tag_id?.toString(),
            tagName: tagInfo.data?.asset_tag_tag_sub_description || '',
            tagSubId: data.tag_sub_id?.toString(),
            tagSubName: '',
            unitAssetTagId: data.unit_asset_tag_id?.toString(),
            statusAt: data.status_at,
            typeId: data.type_id?.toString(),
            comments: data.comments,
            brand: data.brand,
            model: data.model,
            serial: data.serial,
            location: data.location,
            acquisitionAt: data.acquisition_at,
            power: data.power,
            powerUnit: data.power_unit,
            voltage: data.voltage,
            voltageUnit: data.voltage_unit,
            amperage: data.amperage,
            poles: data.poles,
            rotation: data.rotation,
            rotationUnit: data.rotation_unit,
            serviceFactor: data.service_factor,
            rotorDiameter: data.rotor_diameter,
            rotorDiameterUnit: data.rotor_diameter_unit,
            flowRateMax: data.flow_rate_max,
            flowRateMin: data.flow_rate_min,
            flowRateOperation: data.flow_rate_operation,
            flowRateUnit: data.flow_rate_unit,
            pressureMax: data.pressure_max,
            pressureMin: data.pressure_min,
            pressureOperation: data.pressure_operation,
            pressureUnit: data.pressure_unit,
            weight: data.weight,
            weightUnit: data.weight_unit,
            imgFilePath: data.img_file_path,
            imgFileName: data.img_file_name
        } as Asset;
    },

    async getAssetHistory(assetId: string, page: number = 0, pageSize: number = 10): Promise<{ data: AssetHistoryItem[], total: number }> {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: history, error, count } = await supabase
            .from('v_orders_visits_assets')
            .select('*', { count: 'exact' })
            .eq('asset_id', assetId)
            .eq('processing_id', 5)
            .order('ov_ended_at', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('Error fetching asset history from v_orders_visits_assets:', error);
            return { data: [], total: 0 };
        }

        if (!history || history.length === 0) return { data: [], total: count || 0 };

        // Buscar informações das empresas fornecedoras para todas as ordens
        const orderIds = [...new Set(history.map((h: any) => h.o_id).filter(Boolean))];
        let providerCompaniesMap = new Map<string, { id: string; name: string; logoUrl: string }>();

        if (orderIds.length > 0) {
            // Primeiro, buscar as ordens para pegar os provider_company_id
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, provider_company_id')
                .in('id', orderIds);

            if (ordersError) {
                console.error('Erro ao buscar orders:', ordersError);
            }

            if (orders && orders.length > 0) {
                // Pegar todos os provider_company_id únicos
                const providerCompanyIds = [...new Set(
                    orders
                        .map((o: any) => o.provider_company_id)
                        .filter(Boolean)
                )];

                if (providerCompanyIds.length > 0) {
                    // Buscar as empresas fornecedoras
                    const { data: companies, error: companiesError } = await supabase
                        .from('cfg_companies')
                        .select('id, description, img_file_path, img_file_name')
                        .in('id', providerCompanyIds);

                    if (companiesError) {
                        console.error('Erro ao buscar companies:', companiesError);
                    }

                    if (companies) {
                        // Criar um mapa de company_id -> company data
                        const companiesById = new Map();
                        companies.forEach((company: any) => {
                            companiesById.set(company.id.toString(), company);
                        });

                        // Mapear order_id -> provider company data
                        orders.forEach((order: any) => {
                            if (order.provider_company_id) {
                                const company = companiesById.get(order.provider_company_id.toString());
                                if (company) {
                                    const logoUrl = this.getPublicImageUrl(
                                        company.img_file_path,
                                        company.img_file_name,
                                        { width: 100, height: 100, resize: 'contain' }
                                    );

                                    providerCompaniesMap.set(order.id.toString(), {
                                        id: company.id?.toString() || '',
                                        name: company.description || '',
                                        logoUrl: logoUrl || ''
                                    });
                                }
                            }
                        });
                    }
                }
            }
        }

        const getColorForType = (type: string) => {
            if (!type) return 'bg-slate-500';
            const t = type.toLowerCase();
            if (t.includes('preventiva')) return 'bg-blue-500';
            if (t.includes('corretiva')) return 'bg-orange-500';
            if (t.includes('preditiva')) return 'bg-purple-500';
            if (t.includes('instalação') || t.includes('movimentação')) return 'bg-emerald-500';
            return 'bg-slate-500';
        };

        const data = history.map((h: any) => {
            const dateStr = h.ov_ended_at || h.ov_started_at;
            const dateFormatted = formatDateTime(dateStr);

            // Use 'after' comments as primary description if available, else 'before', else movement comment
            const primaryDesc = h.after_comments || h.before_comments || h.moved_comments || 'Sem observações';

            // Obter informações da empresa fornecedora
            const providerCompany = providerCompaniesMap.get(h.o_id?.toString());

            return {
                id: h.id.toString(),
                ovId: h.ov_id?.toString(),
                orderId: h.o_id?.toString(),
                orderMask: h.order_mask,
                ovMask: h.ov_mask,

                type: h.o_type_description || 'Serviço',
                title: h.o_type_description || 'Ordem de Visita',
                // description maps to activities_description (intervenções realizadas)
                description: h.activities_description || h.moved_comments || h.description || 'Sem observações',
                date: dateFormatted,
                user: h.o_team_leader_name_short || '',
                team: h.o_team_code || '',
                color: getColorForType(h.o_type_description || ''),

                // Detailed fields
                isMoved: !!h.is_moved,

                beforeStatus: h.before_status_description,
                beforeUnit: h.before_unit_description,
                beforeTag: [h.before_tag_description, h.before_tag_sub_description].filter(Boolean).join(' > '),
                beforePriority: h.before_priority_description,
                beforeComments: h.before_comments,
                beforeImg: h.before_img_files_names && h.before_img_files_names.length > 0
                    ? this.getPublicImageUrl(h.before_img_file_path || `companies/${h.o_company_id || h.company_id}/assets/${h.asset_id}`, h.before_img_files_names[0], { width: 400, height: 400, resize: 'cover', format: 'origin' })
                    : undefined,

                afterStatus: h.after_status_description,
                afterUnit: h.after_unit_description,
                afterTag: [h.after_tag_description, h.after_tag_sub_description].filter(Boolean).join(' > '),
                afterPriority: h.after_priority_description,
                afterComments: h.after_comments,
                afterImg: h.after_img_files_names && h.after_img_files_names.length > 0
                    ? this.getPublicImageUrl(h.after_img_file_path || `companies/${h.o_company_id || h.company_id}/assets/${h.asset_id}`, h.after_img_files_names[0], { width: 400, height: 400, resize: 'cover', format: 'origin' })
                    : undefined,

                // Provider Company Info
                providerCompanyId: providerCompany?.id,
                providerCompanyName: providerCompany?.name,
                providerCompanyLogoUrl: providerCompany?.logoUrl,

                // Financial
                servicesValue: h.services_value,
                materialsValue: h.materials_value,
                vehiclesValue: h.vehicles_value,
                totalValue: h.total_value !== undefined ? h.total_value : ((h.services_value || 0) + (h.materials_value || 0) + (h.vehicles_value || 0)),

            } as AssetHistoryItem;
        });

        return { data, total: count || 0 };
    },

    // -------------------------------------------------------------------------
    // ASSET TAGS (cfg_assets_tags)
    // -------------------------------------------------------------------------
    async getAssetTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetType[]> {
        let query = supabase
            .from('cfg_assets_types')
            .select('*')
            .eq('is_deleted', 'false')
            .order('description');

        if (filter === 'active' || filter === 'all') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching asset types:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available ?? true,
            namingPattern: item.naming_pattern
        })) as AssetType[];
    },

    async createAssetType(assetType: Partial<AssetType>): Promise<AssetType> {
        const dbData = {
            code: assetType.code,
            description: assetType.description,
            is_available: assetType.isAvailable,
            naming_pattern: assetType.namingPattern
        };

        const { data, error } = await supabase
            .from('cfg_assets_types')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetType,
            id: data.id.toString(),
            namingPattern: data.naming_pattern
        } as AssetType;
    },

    async updateAssetType(id: string, assetType: Partial<AssetType>): Promise<AssetType> {
        const dbData = {
            code: assetType.code,
            description: assetType.description,
            is_available: assetType.isAvailable,
            naming_pattern: assetType.namingPattern
        };

        const { data, error } = await supabase
            .from('cfg_assets_types')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetType,
            id: data.id.toString(),
            namingPattern: data.naming_pattern
        } as AssetType;
    },

    async deleteAssetType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ASSET STATUSES (cfg_assets_statuses)
    // -------------------------------------------------------------------------
    async getAssetStatuses(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetStatus[]> {
        let query = supabase
            .from('cfg_assets_statuses')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching asset statuses:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            color: item.color,
            isAvailable: item.is_available ?? true
        })) as AssetStatus[];
    },

    async createAssetStatus(assetStatus: Partial<AssetStatus>): Promise<AssetStatus> {
        const dbData = {
            code: assetStatus.code,
            description: assetStatus.description,
            color: assetStatus.color,
            is_available: assetStatus.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_assets_statuses')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetStatus,
            id: data.id.toString()
        } as AssetStatus;
    },

    async updateAssetStatus(id: string, assetStatus: Partial<AssetStatus>): Promise<AssetStatus> {
        const dbData = {
            code: assetStatus.code,
            description: assetStatus.description,
            color: assetStatus.color,
            is_available: assetStatus.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_assets_statuses')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetStatus,
            id: data.id.toString()
        } as AssetStatus;
    },

    async deleteAssetStatus(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_statuses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // ASSET PRIORITIES (cfg_assets_priorities)
    // -------------------------------------------------------------------------
    async getAssetPriorities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<AssetPriority[]> {
        let query = supabase
            .from('cfg_assets_priorities')
            .select('*')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', 'true');
        } else if (filter === 'inactive') {
            query = query.eq('is_available', 'false');
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching asset priorities:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            color: item.color,
            isAvailable: item.is_available ?? true
        })) as AssetPriority[];
    },

    async createAssetPriority(assetPriority: Partial<AssetPriority>): Promise<AssetPriority> {
        const dbData = {
            code: assetPriority.code,
            description: assetPriority.description,
            color: assetPriority.color,
            is_available: assetPriority.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_assets_priorities')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetPriority,
            id: data.id.toString()
        } as AssetPriority;
    },

    async updateAssetPriority(id: string, assetPriority: Partial<AssetPriority>): Promise<AssetPriority> {
        const dbData = {
            code: assetPriority.code,
            description: assetPriority.description,
            color: assetPriority.color,
            is_available: assetPriority.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_assets_priorities')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...assetPriority,
            id: data.id.toString()
        } as AssetPriority;
    },

    async deleteAssetPriority(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_priorities')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
        if (!unitId || unitId === 'null') {
            return [];
        }

        const { data, error } = await supabase
            .from('cfg_units_assets_tags')
            .select('id, asset_tag_tag_sub_description, is_active, asset_tag_id, asset_tag_sub_id, unit_id')
            .eq('unit_id', unitId)
            .eq('is_active', 'true')
            .eq('is_deleted', 'false')
            .order('asset_tag_tag_sub_description');

        if (error) {
            console.error('Error fetching units assets by unit:', error);
            throw error;
        }

        return data.map(item => ({
            id: String(item.id ?? ''),
            code: '',
            description: item.asset_tag_tag_sub_description || '',
            isAvailable: !!item.is_active,
            unit_id: item.unit_id || 0,
            asset_tag_id: item.asset_tag_id || 0,
            asset_tag_sub_id: item.asset_tag_sub_id
        })) as AssetTag[];
    },
    async getUniqueSectorsByUnit(unitId: string): Promise<AssetTag[]> {
        if (!unitId) return [];

        // 1. Get all tag associations for the unit
        const { data: relations, error } = await supabase
            .from('cfg_units_assets_tags')
            .select('asset_tag_id')
            .eq('unit_id', unitId)
            .eq('is_active', 'true')
            .eq('is_deleted', 'false');

        if (error) {
            console.error('Error fetching unit sectors:', error);
            return [];
        }

        if (!relations || relations.length === 0) return [];

        // 2. Extract distinct IDs
        const tagIds = [...new Set(relations.map((r: any) => r.asset_tag_id))];

        // 3. Fetch tag details
        const { data: tags, error: tagError } = await supabase
            .from('cfg_assets_tags')
            .select('*')
            .select('*')
            .in('id', tagIds)
            .order('description');

        if (tagError) {
            console.error('Error fetching sector details:', tagError);
            return [];
        }

        return tags.map((t: any) => ({
            id: t.id.toString(),
            code: t.code,
            description: t.description,
            isAvailable: t.is_available,
            unit_id: parseInt(unitId) || 0,
            asset_tag_id: t.id
        })) as AssetTag[];
    },

    async getAssetTags(status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTag[]> {
        let query = supabase.from('cfg_assets_tags').select('*');

        if (status === 'active') query = query.eq('is_available', 'true');
        if (status === 'inactive') query = query.eq('is_available', 'false');
        if (search) query = query.ilike('description', `%${search}%`);

        const { data, error } = await query.order('description');
        if (error) throw error;

        return data.map(item => ({
            id: String(item.id ?? ''),
            code: item.code || '',
            description: item.description || '',
            isAvailable: !!item.is_available,
            unit_id: 0,
            asset_tag_id: item.id || 0
        })) as AssetTag[];
    },

    async createAssetTag(tag: Omit<AssetTag, 'id'>): Promise<AssetTag> {
        const { data, error } = await supabase
            .from('cfg_assets_tags')
            .insert({
                code: tag.code,
                description: tag.description,
                is_available: tag.isAvailable
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...tag,
            id: String(data.id ?? '')
        };
    },

    async updateAssetTag(id: string, tag: Partial<AssetTag>): Promise<AssetTag> {
        const dbData: any = {};
        if (tag.code !== undefined) dbData.code = tag.code;
        if (tag.description !== undefined) dbData.description = tag.description;
        if (tag.isAvailable !== undefined) dbData.is_available = tag.isAvailable;

        const { data, error } = await supabase
            .from('cfg_assets_tags')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...tag,
            id: String(data.id ?? '')
        } as AssetTag;
    },

    async deleteAssetTag(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_tags')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ASSET TAG SUBS (Posições)
    async getAssetTagSubs(parentId?: string, status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTagSub[]> {
        let query = supabase.from('cfg_assets_tags_subs').select('*');

        if (parentId) query = query.eq('parent_id', parentId);
        if (status === 'active') query = query.eq('is_available', 'true');
        if (status === 'inactive') query = query.eq('is_available', 'false');
        if (search) query = query.ilike('description', `%${search}%`);

        const { data, error } = await query.order('description');
        if (error) throw error;

        return data.map(item => ({
            id: String(item.id ?? ''),
            parentId: String(item.parent_id ?? ''),
            code: item.code || '',
            description: item.description || '',
            isAvailable: !!item.is_available
        }));
    },

    async createAssetTagSub(tagSub: Omit<AssetTagSub, 'id'>): Promise<AssetTagSub> {
        const { data, error } = await supabase
            .from('cfg_assets_tags_subs')
            .insert({
                parent_id: tagSub.parentId,
                code: tagSub.code,
                description: tagSub.description,
                is_available: tagSub.isAvailable
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...tagSub,
            id: String(data.id ?? '')
        };
    },

    async updateAssetTagSub(id: string, tagSub: Partial<AssetTagSub>): Promise<AssetTagSub> {
        const dbData: any = {};
        if (tagSub.code !== undefined) dbData.code = tagSub.code;
        if (tagSub.description !== undefined) dbData.description = tagSub.description;
        if (tagSub.isAvailable !== undefined) dbData.is_available = tagSub.isAvailable;
        if (tagSub.parentId !== undefined) dbData.parent_id = tagSub.parentId;

        const { data, error } = await supabase
            .from('cfg_assets_tags_subs')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...tagSub,
            id: String(data.id ?? '')
        } as AssetTagSub;
    },

    async deleteAssetTagSub(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_tags_subs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // UNIT ASSET TAGS (Sectors)
    // -------------------------------------------------------------------------
    async getUnitAssetTagsItems(unitId: string, assetTagId: string): Promise<any[]> {
        const [tagsData, companies, reasonsData] = await Promise.all([
            supabase
                .from('cfg_units_assets_tags')
                .select('*')
                .eq('unit_id', unitId)
                .eq('asset_tag_id', assetTagId)
                .eq('is_deleted', 'false')
                .order('asset_tag_tag_sub_description', { ascending: true }),
            this.getCompanies(),
            this.getAssetsUnavailableReasons()
        ]);

        const { data, error } = tagsData;

        if (error) {
            console.error('Error fetching unit asset tags items', error);
            throw error;
        }

        const companyMap = new Map<string, Company>(companies.map(c => [String(c.id), c]));
        const reasonsMap = new Map<string, string>(reasonsData.map(r => [String(r.id), r.description]));

        const userIdsToFetch = [...new Set(data.map((i: any) => i.last_reported_user_id).filter(id => id))];
        let usersMap = new Map();
        if (userIdsToFetch.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name_short')
                .in('id', userIdsToFetch);
            
            if (usersData) {
                usersMap = new Map(usersData.map((u: any) => [u.id, u]));
            }
        }

        return data.map((item: any) => {
            let details = '';
            if (item.flow_rate_is_visible && item.last_flow_rate !== null) {
                details += `${item.last_flow_rate}${item.flow_rate_unit || 'l/s'} `;
            }
            if (item.power_is_visible && item.last_power !== null) {
                details += `${item.last_power}${item.power_unit || 'CV'} `;
            }

            // O avatar vem da última empresa provedora reportada neste tag.
            // Se o ID em last_provider_company_id for 1 (DMAE), é o DMAE que aparecerá.
            // Se quiser outro provedor, deve garantir que o DB salvou o ID do provedor correspondente
            const companyId = item.last_provider_company_id;
            const company = companyId ? companyMap.get(String(companyId)) : null;

            const reportedUser = item.last_reported_user_id ? usersMap.get(item.last_reported_user_id) : null;
            const unavailableReason = item.last_asset_unavailable_reason_id ? reasonsMap.get(String(item.last_asset_unavailable_reason_id)) : null;

            return {
                id: String(item.id),
                name: item.asset_tag_tag_sub_description || 'Desconhecido',
                details: details.trim(),
                subtitle: item.last_comments || '',
                unavailableReason: unavailableReason || null,
                status: item.last_is_available ? 'ready' : 'not_ready',
                time: item.last_reported_at ? formatDateTime(item.last_reported_at) : 'N/A',
                relativeTime: item.last_reported_at ? formatRelativeTime(item.last_reported_at) : '',
                companyAvatar: company?.logoUrl || null,
                reportedUserShortName: reportedUser?.name_short || 'N/D',
                reportedImage: item.last_file_path && item.last_file_name
                    ? this.getPublicImageUrl(item.last_file_path, item.last_file_name, { width: 100, height: 100, resize: 'cover', format: 'origin' })
                    : null,
                reportedImageOriginal: item.last_file_path && item.last_file_name
                    ? this.getPublicImageUrl(item.last_file_path, item.last_file_name, { format: 'origin' })
                    : null,
                originalData: item
            };
        });
    },

    async getUnitAssetTagItemById(id: string): Promise<any> {
        const { data: viewData, error: viewError } = await supabase
            .from('v_units_assets_tags')
            .select('*')
            .eq('id', id)
            .single();

        if (viewError) {
            console.error('Error fetching unit asset tag detail from view', viewError);
        }

        const item = viewData as any;
        if (!item) return null;

        // Fetch unit lat/lon if needed for other parts of the app
        const { data: unitData } = item.unit_id
            ? await supabase.from('units').select('latitude, longitude').eq('id', item.unit_id).single()
            : { data: null };

        const companyLogoUrl = item.last_provider_company_file_path && item.last_provider_company_file_name
            ? this.getPublicImageUrl(item.last_provider_company_file_path, item.last_provider_company_file_name, { width: 100, height: 100, resize: 'contain' })
            : null;


        return {
            ...item,
            isAvailable: item.last_is_available ?? null,
            last_reported_by_name: item.last_user_full_name || item.last_user_name,
            last_reported_user_name_short: item.last_reported_user_name_short,
            last_reported_by_company_logo: companyLogoUrl,
            last_reported_image: item.last_file_path && item.last_file_name
                ? this.getPublicImageUrl(item.last_file_path, item.last_file_name, { width: 400, height: 400, resize: 'cover' })
                : null,
            unit_latitude: unitData?.latitude ?? null,
            unit_longitude: unitData?.longitude ?? null,
        };
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
        // Usa a função padrão do projeto para timestamp
        const dtStr = getBrazilTimestamp();

        const { data, error: rpcError } = await supabase.rpc('update_unit_asset_tag_availability', {
            p_unit_asset_tag_id: parseInt(id),
            p_is_available: payload.isAvailable,
            p_reason_id: payload.reasonId ? parseInt(payload.reasonId) : null,
            p_comments: payload.comments || null,
            p_reported_by_id: parseInt(payload.reportedById),
            p_file_path: payload.images?.[0]?.path || null,
            p_file_name: payload.images?.[0]?.filename || null,
            p_unit_id: payload.unitId,
            p_asset_tag_id: payload.assetTagId,
            p_asset_tag_sub_id: payload.assetTagSubId || null,
            p_operation_record: payload.operationRecord ? Number(payload.operationRecord) : null,
            p_created_at: dtStr,
            p_reported_at: dtStr,
            p_reported_latitude: payload.reportedLatitude ?? null,
            p_reported_longitude: payload.reportedLongitude ?? null,
            p_unit_latitude: payload.unitLatitude ?? null,
            p_unit_longitude: payload.unitLongitude ?? null,
            p_unit_reported_distance: payload.unitReportedDistance ?? null,
            p_provider_company_id: payload.providerCompanyId ?? null,
            p_is_web: payload.isWeb
        });

        // Se schema cache estiver desatualizado, recarregar e tentar novamente
        if (rpcError?.code === 'PGRST202') {
            console.warn('Schema cache desatualizado, recarregando...');
            try {
                await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`,
                    {
                        method: 'GET',
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    }
                );
            } catch (_) { /* silencioso */ }

            // Retry após aguardar o reload
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { data: retryData, error: retryError } = await supabase.rpc('update_unit_asset_tag_availability', {
                p_unit_asset_tag_id: parseInt(id),
                p_is_available: payload.isAvailable,
                p_reason_id: payload.reasonId ? parseInt(payload.reasonId) : null,
                p_comments: payload.comments || null,
                p_reported_by_id: parseInt(payload.reportedById),
                p_file_path: payload.images?.[0]?.path || null,
                p_file_name: payload.images?.[0]?.filename || null,
                p_unit_id: payload.unitId,
                p_asset_tag_id: payload.assetTagId,
                p_asset_tag_sub_id: payload.assetTagSubId || null,
                p_operation_record: payload.operationRecord ? Number(payload.operationRecord) : null,
                p_created_at: dtStr,
                p_reported_at: dtStr,
                p_reported_latitude: payload.reportedLatitude ?? null,
                p_reported_longitude: payload.reportedLongitude ?? null,
                p_unit_latitude: payload.unitLatitude ?? null,
                p_unit_longitude: payload.unitLongitude ?? null,
                p_unit_reported_distance: payload.unitReportedDistance ?? null,
                p_provider_company_id: payload.providerCompanyId ?? null,
                p_is_web: payload.isWeb
            });
            if (retryError) {
                console.error('Erro após retry do RPC:', retryError);
                throw retryError;
            }
            return retryData as number;
        }

        if (rpcError) {
            console.error('Error executing update_unit_asset_tag_availability RPC', rpcError);
            throw rpcError;
        }

        return data as number;
    },

    async updateUnitAssetTagImageRefs(unitAssetTagId: number, assetAvailableId: number, path: string, filename: string): Promise<void> {
        // Atualiza a tabela de histórico
        await supabase.from('assets_available')
            .update({ file_path: path, file_name: filename })
            .eq('id', assetAvailableId);

        // Atualiza a mestre
        await supabase.from('cfg_units_assets_tags')
            .update({ last_file_path: path, last_file_name: filename })
            .eq('id', unitAssetTagId);
    },

    async uploadAssetAvailableImageAfterInsert(assetAvailableId: number, unitId: number, file: File): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        const filename = `${assetAvailableId}.${fileExt}`;
        const path = `companies/1/units/${unitId}/assets_available`;

        try {
            // r2Service is now static

            // Upload to Cloudflare R2
            await r2Service.uploadFile(file as any, `${path}/${filename}`);
            
            return { path, filename };
        } catch (error) {
            console.error('Error uploading generated asset available image to R2', error);
            throw error;
        }
    },

    async getUnitAssetTagAvailabilityHistory(unitAssetTagId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('assets_available')
            .select(`
                *,
                reported_user: users!reported_user_id(name_short, name_full, img_file_path),
                reason: cfg_assets_unavailable_reasons!asset_unavailable_reason_id(description)
            `)
            .eq('unit_asset_tag_id', parseInt(unitAssetTagId))
            .order('reported_at', { ascending: false });

        if (error) {
            console.error('Error fetching unit asset tag availability history', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            reported_by_name: item.reported_user?.name_short || item.reported_user?.name_full,
            reason_description: item.reason?.description
        }));
    },

    async uploadUnitAssetTagImage(unitAssetTagId: string, file: File): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        const filename = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const path = `units_assets_tags/${unitAssetTagId}/${filename}`;

        try {
            // r2Service is now static

            // Attempt R2 file upload primarily due to Supabase timeouts
            await r2Service.uploadFile(file as any, path);
            
            return { path, filename };
        } catch (error) {
            console.error('Error uploading unit asset tag image to R2', error);
            throw error;
        }
    },

    subscribeToOrdersVisits(callback: (payload: any) => void) {
        return supabase
            .channel('orders_visits-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, callback)
            .subscribe();
    },

    async getUnitAssetTags(unitId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('cfg_units_assets_tags')
            .select('*')
            .eq('unit_id', unitId)
            .eq('is_deleted', 'false');

        if (error) {
            console.error('Error fetching unit asset tags', error);
            throw error;
        }

        // Group by asset_tag_id
        const groups: Record<string, {
            id: string,
            name: string,
            totalRate: number,
            count: number,
            lastUpdate: string
        }> = {};

        data.forEach((row: any) => {
            const tagId = row.asset_tag_id;
            if (!tagId) return;

            if (!groups[tagId]) {
                // Try to get sector name
                let sectorName = row.asset_tag_description;
                if (!sectorName && row.asset_tag_tag_sub_description) {
                    // Try to parse from "Sector > Sub" or "Sector - Sub"
                    // User image uses " > "
                    sectorName = row.asset_tag_tag_sub_description.split(' > ')[0];
                }

                groups[tagId] = {
                    id: String(tagId),
                    name: sectorName || 'Setor Indefinido',
                    totalRate: 0,
                    count: 0,
                    lastUpdate: row.last_reported_at
                };
            }

            const rate = Number(row.last_asset_available_rate) || 0;
            groups[tagId].totalRate += rate;
            groups[tagId].count += 1;

            // Keep most recent update
            if (row.last_reported_at && (!groups[tagId].lastUpdate || new Date(row.last_reported_at) > new Date(groups[tagId].lastUpdate))) {
                groups[tagId].lastUpdate = row.last_reported_at;
            }
        });

        return Object.values(groups)
            .map(g => ({
                id: g.id,
                name: g.name,
                subtitle: `${g.count} Posiç${g.count === 1 ? 'ão' : 'ões'}`,
                progress: Math.round(g.totalRate * 100),
                lastUpdate: formatRelativeTime(g.lastUpdate),
                isAvailable: true
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    // -------------------------------------------------------------------------
    // ASSET ATTRIBUTES (Dynamic Fields)
    // -------------------------------------------------------------------------
    async getAssetAttributesByType(assetTypeId: string): Promise<AssetAttribute[]> {
        const { data, error } = await supabase
            .from('cfg_assets_types_attributes')
            .select(`
                asset_type_id,
                is_required,
                order_index,
                is_available,
                col_span,
                cfg_assets_attributes (
                    id,
                    field_key,
                    label,
                    data_type,
                    unit,
                    decimals
                )
            `)
            .eq('asset_type_id', assetTypeId)
            .eq('is_available', 'true')
            .order('order_index');

        if (error) {
            console.error('Error fetching asset attributes:', error);
            throw error;
        }

        return (data || []).map((item: any) => {
            const attr = item.cfg_assets_attributes;
            return {
                id: String(attr.id ?? ''),
                assetTypeId: String(item.asset_type_id ?? ''),
                fieldKey: attr.field_key || '',
                label: attr.label || '',
                dataType: attr.data_type || 'text',
                unit: attr.unit,
                decimals: attr.decimals || 0,
                required: !!item.is_required,
                orderIndex: item.order_index || 0,
                colSpan: item.col_span || 12,
                isAvailable: !!item.is_available
            };
        });
    },

    async getAssetAttributeValues(assetId: string): Promise<Record<string, string>> {
        const { data, error } = await supabase
            .from('assets_attributes_values')
            .select('field_key, value')
            .eq('asset_id', assetId);

        if (error) {
            console.error('Error fetching asset attribute values:', error);
            throw error;
        }

        const values: Record<string, string> = {};
        (data || []).forEach((item: any) => {
            values[item.field_key] = item.value || '';
        });

        return values;
    },

    async saveAssetAttributeValues(assetId: string, values: Record<string, string>): Promise<void> {
        // Delete existing values for this asset
        const { error: deleteError } = await supabase
            .from('assets_attributes_values')
            .delete()
            .eq('asset_id', assetId);

        if (deleteError) {
            console.error('Error deleting old attribute values:', deleteError);
            throw deleteError;
        }

        // Insert new values
        const rows = Object.entries(values)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .map(([fieldKey, value]) => ({
                asset_id: parseInt(assetId),
                field_key: fieldKey,
                value: String(value)
            }));

        if (rows.length > 0) {
            const { error: insertError } = await supabase
                .from('assets_attributes_values')
                .insert(rows);

            if (insertError) {
                console.error('Error inserting attribute values:', insertError);
                throw insertError;
            }
        }
    },

    async createAssetAttribute(attribute: Partial<AssetAttribute>): Promise<AssetAttribute> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes')
            .insert({
                field_key: attribute.fieldKey,
                label: attribute.label,
                data_type: attribute.dataType,
                unit: attribute.unit,
                decimals: attribute.decimals || 0,
                is_available: true,
                is_deleted: false
            })
            .select()
            .single();

        if (error) throw error;

        return {
            ...attribute,
            id: String(data.id ?? '')
        } as AssetAttribute;
    },

    async updateAssetAttribute(id: string, attribute: Partial<AssetAttribute>): Promise<AssetAttribute> {
        const dbData: any = {};
        if (attribute.fieldKey !== undefined) dbData.field_key = attribute.fieldKey;
        if (attribute.label !== undefined) dbData.label = attribute.label;
        if (attribute.dataType !== undefined) dbData.data_type = attribute.dataType;
        if (attribute.unit !== undefined) dbData.unit = attribute.unit;
        if (attribute.decimals !== undefined) dbData.decimals = attribute.decimals;
        if (attribute.isAvailable !== undefined) dbData.is_available = attribute.isAvailable;

        const { data, error } = await supabase
            .from('cfg_assets_attributes')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...attribute,
            id: String(data.id ?? '')
        } as AssetAttribute;
    },

    async deleteAssetAttribute(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_attributes')
            .update({ is_deleted: true, is_available: false })
            .eq('id', id);

        if (error) throw error;
    },

    // -------------------------------------------------------------------------
    // FILE UPLOAD HELPERS
    // -------------------------------------------------------------------------

    async uploadUserAvatar(userId: string, file: File | Blob): Promise<{ path: string, filename: string }> {
        // r2Service is now static


        // Se for File, pega extensão, se for Blob (de base64), assume .jpg
        const fileExt = (file as File).name ? (file as File).name.split('.').pop() : 'jpg';
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const folderPath = `users/${userId}/avatar`;
        const fullPath = `${folderPath}/${fileName}`;

        console.log('👤 Uploading user avatar to R2:', { folderPath, fileName, fullPath });

        try {
            await r2Service.uploadFile(file as any, fullPath);
            return { path: folderPath, filename: fileName };
        } catch (uploadError) {
            console.error('❌ Error uploading user avatar to R2:', uploadError);
            throw uploadError;
        }
    },

    async uploadUnitImage(clientId: string, unitId: string, file: File): Promise<{ path: string, filename: string }> {
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
            await r2Service.uploadFile(file, fullPath);
            console.log('✅ Unit image uploaded successfully to R2:', { path: folderPath, filename: fileName });
            return { path: folderPath, filename: fileName };
        } catch (uploadError) {
            console.error('❌ Error uploading unit image to R2:', uploadError);
            throw uploadError;
        }
    },

    async getNotificationsCount(): Promise<number> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return 0;

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUser.id)
            .single();

        if (!userData) return 0;

        const { count, error } = await supabase
            .from('users_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id_to', userData.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching notifications count:', error);
            return 0;
        }

        return count || 0;
    },

    async getNotifications(page = 0, pageSize = 20): Promise<UserNotification[]> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return [];

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUser.id)
            .single();

        if (!userData) return [];

        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('users_notifications')
            .select(`
                *,
                related_user:user_id_from (
                    name_full,
                    img_file_path,
                    img_file_name,
                    is_available,
                    ov_id_in_progress
                )
            `)
            .eq('user_id_to', userData.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching notifications:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return [];
        }

        return data.map((item: any) => {
            // Get avatar URL using the standard function with mandatory transformation
            const avatarUrl = this.getPublicImageUrl(
                item.related_user?.img_file_path,
                item.related_user?.img_file_name || 'noImageUser.png',
                { width: 70, height: 70, resize: 'cover' }
            );

            return {
                id: item.id.toString(),
                userIdTo: item.user_id_to?.toString(),
                userIdFrom: item.user_id_from?.toString(),
                title: item.title,
                body: item.body,
                type: item.type,
                isRead: item.is_read,
                createdAt: item.created_at,
                readAt: item.read_at,
                unitId: item.unit_id?.toString(),
                imgUrl: item.img_url,
                orderId: item.o_id?.toString(),
                vehicleId: item.v_id?.toString(),
                activityId: item.activity_id?.toString(),
                companyId: item.company_id?.toString(),
                tokenFcm: item.token_fcm,
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                userFromNameShort: item.user_from_name_short,
                pageTarget: item.page_target,
                versionMode: item.version_mode,
                userToWhatsapp: item.user_to_whatsapp,
                relatedUserName: item.related_user?.name_full,
                relatedUserAvatarUrl: avatarUrl,
                relatedUserIsAvailable: item.related_user?.is_available,
                relatedUserOvIdInProgress: item.related_user?.ov_id_in_progress
            };
        });
    },

    async markNotificationAsRead(id: string): Promise<void> {
        // Ensure we are sending a number to match the bigint column
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) throw new Error('Invalid notification ID');

        const { error } = await supabase
            .from('users_notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', numericId);

        if (error) throw error;
    },

    async clearAllNotifications(): Promise<void> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUser.id)
            .single();

        if (!userData) return;

        const { error } = await supabase
            .from('users_notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id_to', userData.id)
            .eq('is_read', false);

        if (error) throw error;
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
        if (!code || code === '0') return null;
        try {
            const { data } = await supabase
                .from('assets')
                .select('id')
                .eq('code', code)
                .maybeSingle();

            if (!data) return null;

            return this.getAssetById(data.id.toString());
        } catch (error) {
            console.error('Error fetching asset by code:', error);
            return null;
        }
    },

    async toggleAssetFollow(assetId: string): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');

        const { data: existingFollow, error: checkError } = await supabase
            .from('assets_followers')
            .select('*')
            .eq('asset_id', parseInt(assetId))
            .eq('user_id', parseInt(currentUser.id))
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingFollow) {
            const { error: deleteError } = await supabase
                .from('assets_followers')
                .delete()
                .eq('asset_id', parseInt(assetId))
                .eq('user_id', parseInt(currentUser.id));
            if (deleteError) throw deleteError;
            return false;
        } else {
            const { error: insertError } = await supabase
                .from('assets_followers')
                .insert({
                    asset_id: parseInt(assetId),
                    user_id: parseInt(currentUser.id)
                });
            if (insertError) throw insertError;
            return true;
        }
    },

    async getFollowedAssetIds(): Promise<string[]> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return [];

        const { data, error } = await supabase
            .from('assets_followers')
            .select('asset_id')
            .eq('user_id', parseInt(currentUser.id));

        if (error) {
            console.error('Error fetching followed assets:', error);
            return [];
        }

        return data.map((f: any) => f.asset_id.toString());
    },

    async getSystemsParent(): Promise<System[]> {
        const { data, error } = await supabase.from('cfg_systems').select('*').is('parent_id', null).eq('is_deleted', 'false').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching parent systems:', error); return []; }
        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as System[];
    },

    async getSystems(parentId?: string): Promise<System[]> {
        let query = supabase.from('cfg_systems').select('*').eq('is_available', 'true').eq('is_deleted', 'false').order('description');
        if (parentId) query = query.eq('parent_id', parentId);
        const { data, error } = await query;
        if (error) { console.error('Error fetching systems:', error); return []; }
        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as System[];
    },

    async getUnitsAssetsTagsDashboard(systemParentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_units_assets_tags')
            .select('*')
            .eq('system_parent_id', systemParentId)
            .order('unit_description');

        if (error) {
            console.error('Error fetching dashboard data:', error);
            return [];
        }

        const rows = data || [];
        return rows.map(row => ({
            ...row,
            last_reported_image: row.last_file_path && row.last_file_name
                ? this.getPublicImageUrl(row.last_file_path, row.last_file_name, { width: 100, height: 100, resize: 'cover' })
                : null,
            last_provider_company_logo: row.last_provider_company_logo || null
        }));
    },

    async getSystemsParentAssetsTagsAvailableRate(systemParentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_systems_parent_assets_tags_available_rate')
            .select('*')
            .eq('system_parent_id', systemParentId)
            .order('asset_tag_description');

        if (error) {
            console.error('Error fetching systems parent assets tags available rate:', error);
            return [];
        }

        return data || [];
    },

    async getUnitTypesParent(): Promise<UnitType[]> {
        const { data, error } = await supabase.from('cfg_units_types').select('*').is('parent_id', null).eq('is_deleted', 'false').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching parent unit types:', error); return []; }
        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as UnitType[];
    },

    async getUnitTypes(parentId?: string): Promise<UnitType[]> {
        let query = supabase.from('cfg_units_types').select('*').eq('is_available', 'true').eq('is_deleted', 'false').order('description');
        if (parentId) query = query.eq('parent_id', parentId);
        const { data, error } = await query;
        if (error) { console.error('Error fetching unit types:', error); return []; }
        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as UnitType[];
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
        let query = supabase.from('units').select('*').order('description_full');

        if (filter === 'active') query = query.eq('is_available', true);
        if (filter === 'inactive') query = query.eq('is_available', false);

        if (search && search.trim().length > 0) {
            const terms = search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data: units, error } = await query;
        if (error) {
            console.error('Error fetching units:', error);
            return [];
        }

        // Fetch Reference Data (Types, Systems, and Statuses) in parallel
        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        const typesMap = new Map(unitTypes?.map((t: any) => [t.id, t.description]));
        const systemsMap = new Map(systems?.map((s: any) => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map((st: any) => [st.id, st.description]));

        return (units || []).map((item: any) => ({
            ...item,
            typeName: typesMap.get(item.unit_type_parent_id),
            subTypeName: typesMap.get(item.unit_type_id),
            systemParentName: systemsMap.get(item.system_parent_id),
            systemName: systemsMap.get(item.system_id),
            statusName: statusesMap.get(item.status_id),
            logoUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, {
                width: 400,
                height: 400,
                resize: 'cover'
            }),
        }));
    },

    async getUnitsByIds(ids: string[]): Promise<{ data: any[] | null, error: any }> {
        if (!ids || ids.length === 0) return { data: [], error: null };
        const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        const { data, error } = await supabase
            .from('units')
            .select('id, description, latitude, longitude, img_file_path, img_file_name')
            .in('id', numericIds);
        return { data, error };
    },

    async getFilteredUnits(filters: {
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        search?: string;
    }): Promise<any[]> {
        let query = supabase.from('units').select('*').eq('is_available', true).order('description_full');

        if (filters.systemParentId && (Array.isArray(filters.systemParentId) ? filters.systemParentId.length > 0 : true)) {
            if (Array.isArray(filters.systemParentId)) query = query.in('system_parent_id', filters.systemParentId);
            else query = query.eq('system_parent_id', filters.systemParentId);
        }

        if (filters.systemId && (Array.isArray(filters.systemId) ? filters.systemId.length > 0 : true)) {
            if (Array.isArray(filters.systemId)) query = query.in('system_id', filters.systemId);
            else query = query.eq('system_id', filters.systemId);
        }

        if (filters.unitTypeParentId && (Array.isArray(filters.unitTypeParentId) ? filters.unitTypeParentId.length > 0 : true)) {
            if (Array.isArray(filters.unitTypeParentId)) query = query.in('unit_type_parent_id', filters.unitTypeParentId);
            else query = query.eq('unit_type_parent_id', filters.unitTypeParentId);
        }

        if (filters.unitTypeId && (Array.isArray(filters.unitTypeId) ? filters.unitTypeId.length > 0 : true)) {
            if (Array.isArray(filters.unitTypeId)) query = query.in('unit_type_id', filters.unitTypeId);
            else query = query.eq('unit_type_id', filters.unitTypeId);
        }

        if (filters.search && filters.search.trim().length > 0) {
            const terms = filters.search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching filtered units:', error);
            return [];
        }
        return data || [];
    },

    async getSubSystems(systemId?: string): Promise<any[]> {
        // NOTE: cfg_subsystems seems to be legacy or alias for child systems. 
        // If the user wants child systems, use getSystems(parentId). 
        // But for compatibility I keep this if older code calls it.
        // Actually user said "getSubSystems Excluir". 
        // I will remove it from this implementation to comply with instructions. 
        // If there are callers they will break and I will fix them.
        return [];
    },

    async getAssetsTags(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_assets_tags').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching asset tags:', error); return []; }
        return data || [];
    },



    async getOrdersObjects(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_objects').select('*').order('description');
        if (error) { console.error('Error fetching order objects:', error); return []; }
        return data || [];
    },



    async getPlans(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_plans').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching plans:', error); return []; }
        return data || [];
    },

    async getCancelReasons(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_cancel_reasons').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching cancel reasons:', error); return []; }
        return data || [];
    },

    async getSuspendedReasons(): Promise<SuspendedReason[]> {
        const { data, error } = await supabase
            .from('cfg_orders_suspended_reasons')
            .select('id, description')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching suspended reasons:', error);
            return [];
        }

        return data || [];
    },

    async getOrderCauseReasons(): Promise<CauseReason[]> {
        const { data, error } = await supabase
            .from('v_orders_causes_reasons')
            .select('id, description')
            .eq('is_availabe', true)
            .order('description');

        if (error) {
            console.error('Error fetching order cause reasons:', error);
            return [];
        }

        return data || [];
    },


    async getTeamLeader(teamId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId)
            .eq('is_team_leader', true)
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as User;
    },

    async getOpenOrdersByUnit(unitId: string, filters: {
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderTypeSubId?: string | string[];
        contractId?: string | string[];
        planId?: string | string[];
        teamId?: string | string[];
    }): Promise<any[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .eq('unit_id', unitId)
            // Filtro para ordens abertas (Status 2 a 5: Avaliação, Autorizada, Agendada, Execução)
            .in('status_id', [2, 3, 4, 5])
            // Filtrar apenas OSs (parent_id > 0), excluindo SSs
            .not('parent_id', 'is', null);

        if (filters.orderObjectId) {
            if (Array.isArray(filters.orderObjectId)) query = query.in('object_id', filters.orderObjectId);
            else query = query.eq('object_id', filters.orderObjectId);
        }
        if (filters.orderTypeId) {
            if (Array.isArray(filters.orderTypeId)) query = query.in('type_id', filters.orderTypeId);
            else query = query.eq('type_id', filters.orderTypeId);
        }
        if (filters.orderTypeSubId) {
            if (Array.isArray(filters.orderTypeSubId)) query = query.in('type_sub_id', filters.orderTypeSubId);
            else query = query.eq('type_sub_id', filters.orderTypeSubId);
        }
        if (filters.contractId) {
            if (Array.isArray(filters.contractId)) query = query.in('contract_id', filters.contractId);
            else query = query.eq('contract_id', filters.contractId);
        }
        if (filters.planId) {
            if (Array.isArray(filters.planId)) query = query.in('plan_id', filters.planId);
            else query = query.eq('plan_id', filters.planId);
        }
        if (filters.teamId) {
            if (Array.isArray(filters.teamId)) query = query.in('team_id', filters.teamId);
            else query = query.eq('team_id', filters.teamId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching open orders by unit:', error);
            return [];
        }
        return data || [];
    },

    async getOrderByMask(mask: string): Promise<Order | null> {
        const result = await this.getOrdersFilters({ orderMask: mask, useGeneralView: true, pageSize: 1 });
        return result.data?.[0] || null;
    },

    async getOrdersFilters(filters?: OrderFilters & { page?: number; pageSize?: number }): Promise<{ data: Order[]; hasMore: boolean; total: number }> {
        const page = filters?.page ?? 0;
        const pageSize = filters?.pageSize ?? 20;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const viewName = 'v_orders';

        let query = supabase
            .from(viewName)
            .select('*', { count: 'exact' });

        // If not using general view, filter for "Open" orders (status NOT terminal: 7 or 8)
        if (!filters?.useGeneralView) {
            query = query.not('status_id', 'in', '(7,8)');
        }

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (val === null) {
                    query = query.is(column, null);
                    return;
                }
                if (val === undefined || val === '') return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('id', filters.id);
            applyFilter('order_mask', filters.orderMask);
            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('unit_asset_tag_id', filters.unitAssetTagId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('asset_tag_sub_id', filters.assetTagSubId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('priority_id', filters.priorityId);
            if (filters.parentId !== undefined) {
                if (filters.parentId === null) {
                    query = query.or('parent_id.eq.0,parent_id.is.null');
                } else {
                    applyFilter('parent_id', filters.parentId);
                }
            }

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }

            // Active filter chips logic
            if (filters.activeFilter === 'SS') {
                query = query.is('parent_id', null);
            } else if (filters.activeFilter === 'OS') {
                query = query.not('parent_id', 'is', null);
            } else if (filters.activeFilter === '2023') {
                query = query.eq('year', 2023);
            } else if (filters.activeFilter === 'Alta Prioridade') {
                query = query.in('priority_id', [4, 5]);
            }

            if (filters.statusId) {
                query = query.eq('status_id', filters.statusId);
            }

            if (filters.period) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const fifteenDaysAgo = new Date(today);
                fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

                if (filters.period === 'Hoje') {
                    query = query.gte('requested_at', today.toISOString());
                } else if (filters.period === 'Ontem') {
                    query = query.gte('requested_at', yesterday.toISOString()).lt('requested_at', today.toISOString());
                } else if (filters.period === '< 7 dias') {
                    query = query.gte('requested_at', sevenDaysAgo.toISOString());
                } else if (filters.period === '< 15 dias') {
                    query = query.gte('requested_at', fifteenDaysAgo.toISOString());
                }
            }
        }

        query = query.order('requested_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
            // Fix: Handle "Requested range not satisfiable" (PGRST103)
            // This occurs when requesting a page offset beyond the available rows
            if (error.code === 'PGRST103') {
                return { data: [], hasMore: false, total: 0 };
            }

            console.error('Error fetching filtered orders:', error);
            throw error;
        }

        const total = count || 0;
        const hasMore = to < total - 1;

        // 🚀 OTIMIZAÇÃO: Cache de empresas (evita consulta repetida)
        const now = Date.now();
        let companiesWithUrls: any[] = [];

        if (metadataCache.companies && (now - metadataCache.companiesTimestamp) < metadataCache.CACHE_DURATION) {
            // Usar cache
            companiesWithUrls = metadataCache.companies;
        } else {
            // Buscar do banco e cachear
            const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');

            const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';

            // Generate signed URLs for companies (in parallel)
            const validCompanies = (companies || []).filter((c: any) => c.img_file_path && c.img_file_name);
            let pathsToSign: string[] = [];
            let pathToCompanyMap: Record<string, any[]> = {};

            validCompanies.forEach((c: any) => {
                // Remove leading/trailing slashes
                let cleanPath = c.img_file_path.replace(/^\/+|\/+$/g, '');
                let cleanName = c.img_file_name.replace(/^\/+|\/+$/g, '');

                // Extra safety: Remove bucket name if path starts with it
                if (cleanPath.startsWith(`${bucket}/`)) {
                    cleanPath = cleanPath.substring(bucket.length + 1);
                }
                const fullPath = `${cleanPath}/${cleanName}`;
                pathsToSign.push(fullPath);

                if (!pathToCompanyMap[fullPath]) pathToCompanyMap[fullPath] = [];
                pathToCompanyMap[fullPath].push(c);
            });

            companiesWithUrls = [...(companies || [])];

            if (pathsToSign.length > 0) {
                try {
                    const { data: signedData, error } = await supabase.storage
                        .from(bucket)
                        .createSignedUrls(pathsToSign, 3600);

                    if (!error && signedData) {
                        signedData.forEach((item) => {
                            if (item.path && item.signedUrl) {
                                let sUrl = item.signedUrl;
                                if (sUrl.includes('siges-mao.com.br')) {
                                    sUrl = sUrl.replace('siges-mao.com.br', 'vps.supabase.siges-app.com.br');
                                } else if (sUrl.includes('siges-app.com.br') && !sUrl.includes('vps.')) {
                                    sUrl = sUrl.replace('supabase.siges-app.com.br', 'vps.supabase.siges-app.com.br');
                                }

                                const comps = pathToCompanyMap[item.path];
                                if (comps) {
                                    comps.forEach(comp => {
                                        comp.signedUrl = sUrl;
                                    });
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Batch sign failed', e);
                }
            }

            companiesWithUrls = companiesWithUrls.map((c: any) => {
                if (c.img_file_path && c.img_file_name && !c.signedUrl) {
                    const publicUrl = this.getPublicImageUrl(c.img_file_path, c.img_file_name);
                    return { ...c, signedUrl: publicUrl };
                }
                return c;
            });

            // Salvar no cache
            metadataCache.companies = companiesWithUrls;
            metadataCache.companiesTimestamp = now;
        }

        const companyMap = new Map((companiesWithUrls || []).map((c: any) => [c.id?.toString(), c]));

        // 🚀 OTIMIZAÇÃO: Buscar status_at real da tabela 'orders' para evitar dados agregados da view
        const orderIds = (data || []).map((o: any) => o.id);
        let realStatusMap: Record<string, string> = {};

        if (orderIds.length > 0) {
            const { data: realStatusData } = await supabase
                .from('orders')
                .select('id, status_at')
                .in('id', orderIds);

            if (realStatusData) {
                realStatusData.forEach((s: any) => {
                    realStatusMap[s.id.toString()] = s.status_at;
                });
            }
        }

        // 🚀 OTIMIZAÇÃO: Cache de líderes (busca apenas IDs não cacheados)
        const teamLeaderIds = Array.from(new Set((data || []).map((o: any) => o.team_leader_id).filter(Boolean)));
        let leaderMap = new Map<string, { latitude: number; longitude: number; avatarUrl?: string; isAvailable?: boolean; ovIdInProgress?: number }>();

        if (teamLeaderIds.length > 0) {
            // Inicializar cache se não existir
            if (!metadataCache.leaders) {
                metadataCache.leaders = new Map();
                metadataCache.leadersTimestamp = now;
            }

            const currentLeadersCache = metadataCache.leaders;

            // Verificar quais IDs precisam ser buscados
            const idsToFetch = teamLeaderIds.filter(id => !currentLeadersCache.has(id.toString()));

            // Buscar apenas IDs não cacheados
            if (idsToFetch.length > 0) {
                try {
                    const { data: leaders, error: leaderError } = await supabase
                        .from('users')
                        .select('id, latitude, longitude, img_file_path, img_file_name, is_available, ov_id_in_progress')
                        .in('id', idsToFetch);

                    if (!leaderError && leaders) {
                        leaders.forEach((l: any) => {
                            const avatarUrl = this.getPublicImageUrl(
                                l.img_file_path,
                                l.img_file_name || 'noImageUser.png',
                                { width: 100, height: 100, resize: 'cover' }
                            );

                            const leaderData = {
                                latitude: l.latitude,
                                longitude: l.longitude,
                                avatarUrl,
                                isAvailable: l.is_available,
                                ovIdInProgress: l.ov_id_in_progress
                            };

                            // Adicionar ao cache
                            currentLeadersCache.set(l.id.toString(), leaderData);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching team leader locations:', error);
                }
            }

            // Montar mapa com dados do cache
            teamLeaderIds.forEach(id => {
                const cached = currentLeadersCache.get(id.toString());
                if (cached && cached.latitude && cached.longitude) {
                    leaderMap.set(id.toString(), cached);
                }
            });
        }

        // 🚀 OTIMIZAÇÃO: Cache de unidades (busca apenas IDs não cacheados)
        const unitIds = Array.from(new Set((data || []).map((o: any) => o.unit_id).filter(Boolean)));
        let unitMap = new Map<string, { avatarUrl?: string }>();

        if (unitIds.length > 0) {
            // Inicializar cache se não existir
            if (!metadataCache.units) {
                metadataCache.units = new Map();
                metadataCache.unitsTimestamp = now;
            }

            const currentUnitsCache = metadataCache.units;

            // Verificar quais IDs precisam ser buscados
            const idsToFetch = unitIds.filter(id => !currentUnitsCache.has(id.toString()));

            // Buscar apenas IDs não cacheados
            if (idsToFetch.length > 0) {
                try {
                    const { data: units, error: unitError } = await supabase
                        .from('units')
                        .select('id, img_file_path, img_file_name')
                        .in('id', idsToFetch);

                    if (!unitError && units) {
                        units.forEach((u: any) => {
                            if (u.img_file_path) {
                                const avatarUrl = this.getPublicImageUrl(
                                    u.img_file_path,
                                    u.img_file_name,
                                    { width: 100, height: 100, resize: 'cover' }
                                );
                                if (avatarUrl) {
                                    currentUnitsCache.set(u.id.toString(), { avatarUrl });
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching unit images:', error);
                }
            }

            // Montar mapa com dados do cache
            unitIds.forEach(id => {
                const cached = currentUnitsCache.get(id.toString());
                if (cached) {
                    unitMap.set(id.toString(), cached);
                }
            });
        }

        const orders = (data || []).map((item: any) => this._mapOrder(item, companyMap, realStatusMap, leaderMap, unitMap));

        return { data: orders, hasMore, total };
    },

    async getOrdersVisitsAssetsWithProvider(filters?: {
        assetId?: string;
        orderId?: string;
        ovId?: string;
    }): Promise<any[]> {
        let query = supabase
            .from('orders_visits_assets')
            .select(`
            *,
            ov: orders_visits!orders_visits_assets_ov_id_fkey(
                    *,
                o: orders!orders_visits_o_id_fkey(
                    id,
                    provider_company_id,
                    order_mask,
                    status_id,
                    created_at,
                    cfg_companies!orders_provider_company_id_fkey(
                        id,
                        description,
                        code
                    )
                )
            )
                `);

        if (filters?.assetId) query = query.eq('asset_id', filters.assetId);
        if (filters?.ovId) query = query.eq('ov_id', filters.ovId);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders visits assets with provider:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            assetId: item.asset_id?.toString(),
            ovId: item.ov_id?.toString(),
            visit: {
                id: item.ov?.id?.toString(),
                oId: item.ov?.o?.id?.toString(),
                visitDate: item.ov?.visit_date,
                status: item.ov?.status,
            },
            order: {
                id: item.ov?.o?.id?.toString(),
                providerCompanyId: item.ov?.o?.provider_company_id?.toString(),
                orderMask: item.ov?.o?.order_mask,
                statusId: item.ov?.o?.status_id,
                createdAt: item.ov?.o?.created_at,
                providerCompany: item.ov?.o?.cfg_companies ? {
                    id: item.ov?.o?.cfg_companies?.id?.toString(),
                    name: item.ov?.o?.cfg_companies?.description,
                    code: item.ov?.o?.cfg_companies?.code,
                } : null
            }
        }));
    },

     subscribeToOrders: (callback: (payload: any) => void) => {
         const channelId = `orders-changes-${Math.random().toString(36).substring(2)}`;
         return supabase
             .channel(channelId)
             .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => callback(payload))
             .subscribe();
     },

     subscribeToVisits: (callback: (payload: any) => void) => {
         const channelId = `visits-changes-${Math.random().toString(36).substring(2)}`;
         return supabase
             .channel(channelId)
             .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, (payload) => callback(payload))
             .subscribe();
     },

    async getOrderById(id: string | number): Promise<Order | null> {
        const { data } = await this.getOrdersFilters({ id: [id.toString()], useGeneralView: true });
        return data.length > 0 ? data[0] : null;
    },

    async getFollowedOrderIds(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('orders_followers')
            .select('o_id')
            .eq('user_id', parseInt(userId));

        if (error) {
            console.error('Error fetching followed orders:', error);
            return [];
        }
        return data.map((row: any) => row.o_id.toString());
    },

    async toggleOrderFollow(orderId: string, userId: string): Promise<boolean> {
        const oId = parseInt(orderId);
        const uId = parseInt(userId);

        // Check if exists
        const { data: existing } = await supabase
            .from('orders_followers')
            .select('id')
            .eq('o_id', oId)
            .eq('user_id', uId)
            .maybeSingle();

        if (existing) {
            // Delete
            const { error } = await supabase
                .from('orders_followers')
                .delete()
                .eq('o_id', oId)
                .eq('user_id', uId);

            if (error) {
                console.error('Error removing follower:', error);
                return true; // Still followed
            }
            return false; // Removed
        } else {
            // Insert
            const { error } = await supabase
                .from('orders_followers')
                .insert([{ o_id: oId, user_id: uId }]);

            if (error) {
                console.error('Error adding follower:', error);
                return false; // Still unfollowed
            }
            return true; // Added
        }
    },

     async getDashboardStats(
         filters?: OrderFilters,
         ssFiltersOverride?: OrderFilters,
         osFiltersOverride?: OrderFilters
     ): Promise<{
         ssCounts: { today: number; yesterday: number; sevenDays: number; fifteenDays: number };
         osCounts: Record<number, number>;
         ssSectorCounts?: Array<{ id: string, label: string, count: number }>;
         osSectorCounts?: Array<{ id: string, label: string, count: number }>;
     }> {
        // Base queries using the general orders view with manual status/hierarchy filters
        let ssUnscheduledQuery = supabase.from('v_orders')
            .select('requested_at, asset_tag_id, unit_asset_tag_id, asset_tag_description')
            .eq('status_id', 1)
            .is('parent_id', null);

        let osQuery = supabase.from('v_orders')
            .select('status_id, parent_id, asset_tag_id, asset_tag_description')
            .not('status_id', 'in', '(7,8)')
            .not('parent_id', 'is', null);

        const applyFiltersToQuery = (query: any, f: OrderFilters) => {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    // Exclude JS null/undefined AND the strings "null"/"undefined" that can
                    // arrive from serialized/stale filters — Supabase sends them as-is to
                    // PostgreSQL which then fails with '22P02 invalid input syntax for bigint'
                    const filteredVal = val.filter((v: any) =>
                        v !== null &&
                        v !== undefined &&
                        v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', f.systemParentId);
            applyFilter('system_id', f.systemId);
            applyFilter('unit_type_parent_id', f.unitTypeParentId);
            applyFilter('unit_type_id', f.unitTypeId);
            applyFilter('unit_id', f.unitId);
            applyFilter('asset_tag_id', f.assetTagId);
            applyFilter('object_id', f.orderObjectId);
            applyFilter('type_id', f.orderTypeId);
            applyFilter('type_sub_id', f.orderTypeSubId);
            applyFilter('contract_id', f.contractId);
            applyFilter('plan_id', f.orderPlanId);
            applyFilter('team_id', f.orderTeamId);
            applyFilter('priority_id', f.priorityId);

            if (f.search) {
                const s = `%${f.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
            return query;
        };

         if (filters) {
             ssUnscheduledQuery = applyFiltersToQuery(ssUnscheduledQuery, ssFiltersOverride || filters);
             osQuery = applyFiltersToQuery(osQuery, osFiltersOverride || filters);
         }

        const [ssUnscheduledRes, osRes] = await Promise.all([ssUnscheduledQuery, osQuery]);

        if (ssUnscheduledRes.error || osRes.error) {
            console.error('Error fetching dashboard stats:', ssUnscheduledRes.error || osRes.error);
            return {
                ssCounts: { today: 0, yesterday: 0, sevenDays: 0, fifteenDays: 0 },
                osCounts: {}
            };
        }

        const ssDataList = ssUnscheduledRes.data || [];
        const osDataList = osRes.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);

        const parseDate = (d: string) => d ? new Date(d) : null;

        const ssCounts = {
            today: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= today; }).length,
            yesterday: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= yesterday && d < today; }).length,
            sevenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= sevenDaysAgo; }).length,
            fifteenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= fifteenDaysAgo; }).length
        };

        const osCounts: Record<number, number> = {};
        osDataList.forEach((o: any) => {
            if (o.parent_id && o.status_id) {
                osCounts[o.status_id] = (osCounts[o.status_id] || 0) + 1;
            }
        });

        const ssSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        
        // Filter by period filter if it exists in the active filters
        const periodFilter = ssFiltersOverride?.period || filters?.period;
        let sectorDataList = ssDataList;
        if (periodFilter) {
            sectorDataList = ssDataList.filter((o: any) => {
                const d = parseDate(o.requested_at);
                if (!d) return false;
                if (periodFilter === 'Hoje') return d >= today;
                if (periodFilter === 'Ontem') return d >= yesterday && d < today;
                if (periodFilter === '< 7 dias') return d >= sevenDaysAgo;
                if (periodFilter === '< 15 dias') return d >= fifteenDaysAgo;
                return true;
            });
        }

        sectorDataList.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!ssSectorMap[id]) {
                ssSectorMap[id] = { id, label, count: 0 };
            }
            ssSectorMap[id].count += 1;
        });
        const ssSectorCounts = Object.values(ssSectorMap).sort((a, b) => b.count - a.count);

        const osStatusFilter = osFiltersOverride?.statusId;
        let osSectorCountSource = osDataList;
        if (osStatusFilter) {
            const statusIdNum = Array.isArray(osStatusFilter) ? Number(osStatusFilter[0]) : Number(osStatusFilter);
            if (!Number.isNaN(statusIdNum)) {
                osSectorCountSource = osDataList.filter((o: any) => o.status_id === statusIdNum);
            }
        }

        const osSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        osSectorCountSource.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!osSectorMap[id]) {
                osSectorMap[id] = { id, label, count: 0 };
            }
            osSectorMap[id].count += 1;
        });
        const osSectorCounts = Object.values(osSectorMap).sort((a, b) => b.count - a.count);

        return { ssCounts, osCounts, ssSectorCounts, osSectorCounts };
    },


    async getUnscheduledSS(filters?: OrderFilters): Promise<Order[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .eq('status_id', 1)
            .is('parent_id', null);

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('priority_id', filters.priorityId);

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
        }

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching unscheduled SS:', error);
            return [];
        }

        let filteredData = data || [];

        // Apply period filter in JS to match dashboard stats exactly
        if (filters?.period) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            const fifteenDaysAgo = new Date(today);
            fifteenDaysAgo.setDate(today.getDate() - 15);

            const parseDate = (d: string) => d ? new Date(d) : null;

            filteredData = filteredData.filter((item: any) => {
                const itemDate = parseDate(item.requested_at);
                if (!itemDate) return false;

                if (filters.period === 'Hoje') {
                    return itemDate >= today;
                } else if (filters.period === 'Ontem') {
                    return itemDate >= yesterday && itemDate < today;
                } else if (filters.period === '< 7 dias') {
                    return itemDate >= sevenDaysAgo;
                } else if (filters.period === '< 15 dias') {
                    return itemDate >= fifteenDaysAgo;
                }
                return true;
            });
        }

        // Fetch companies to ensure we have logos even if view lacks them
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map((companies || []).map((c: any) => [c.id?.toString(), c]));

        return filteredData.map((item: any) => {
            const providerCompanyIdStr = item.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            return {
                id: item.id.toString(),
                orderMask: item.order_mask,
                // Essential IDs for form inheritance
                typeId: item.type_id?.toString(),
                typeSubId: item.type_sub_id?.toString(),
                objectId: item.object_id?.toString(),
                contractId: item.contract_id?.toString(),
                planId: item.plan_id?.toString(),
                unitId: item.unit_id?.toString(),
                clientId: item.client_id?.toString(),
                departmentId: item.department_id?.toString(),
                unitAssetTagId: item.unit_asset_tag_id?.toString(),
                assetTagId: item.asset_tag_id?.toString(),
                systemId: item.system_id?.toString(),
                teamId: item.team_id?.toString(),
                // Display fields
                typeCode: item.type_code,
                unitDescription: item.unit_description,
                title: item.unit_description, // Map title to unit description
                requestedServices: item.requested_services,
                requestedAt: item.requested_at,
                createdAt: item.created_at,
                statusAt: item.status_at,
                statusDescription: item.status_description,
                statusIcon: item.status_icon,
                iconColor: item.icon_color,
                statusBackgroundColor: item.background_color,
                statusColor: item.status_color,
                priorityId: item.priority_id?.toString(),
                priorityDescription: item.priority_description,
                priorityCode: item.priority_code,
                priorityColor: item.priority_color,
                typeDescription: item.type_description,
                typeName: item.type_description,
                typeIcon: item.type_icon,
                typeColor: item.type_color,
                requesterName: item.requester_name,
                requesterTeamCode: item.requester_team_code,
                requesterPhone: item.requester_phone,
                phone: item.requester_phone,
                clientName: item.client_name,
                contractDescription: item.contract_description,
                planDescription: item.plan_description,
                progress: item.progress ? `${Math.round(parseFloat(String(item.progress)) * 100)}%` : '0%',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                imgFilesNames: item.img_files_names,
                companyId: item.company_id?.toString(),
                causeReasonDescription: item.cause_reason_description,
                providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
                providerLogo: this.getPublicImageUrl(
                    item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path,
                    item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                ),
                unitLatitude: item.unit_latitude,
                unitLongitude: item.unit_longitude,
                teamLeaderLatitude: item.team_leader_latitude,
                teamLeaderLongitude: item.team_leader_longitude,
                assetTagDescription: item.asset_tag_description,
                unitAssetTagDescription: item.asset_tag_description,
                assetTagSubDescription: item.asset_tag_sub_description,
                unitAssetTagSubDescription: item.asset_tag_sub_description,
                teamCode: item.team_code,
                teamDescription: item.team_description,
                team: item.team_code || item.team_description,
                systemDescription: item.system_description,
                system: item.system_description,
                statusId: item.status_id ? Number(item.status_id) : 1,
                parentId: item.parent_id ? Number(item.parent_id) : null,
                ovCounter: item.ov_counter
            } as Order;
        });
    },

    async getOpenOS(filters?: OrderFilters): Promise<Order[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .not('status_id', 'in', '(7,8)')
            .not('parent_id', 'is', null);

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    // Exclude JS null/undefined AND the strings "null"/"undefined" that can
                    // arrive from serialized/stale filters — Supabase sends them as-is to
                    // PostgreSQL which then fails with '22P02 invalid input syntax for bigint'
                    const filteredVal = val.filter((v: any) =>
                        v !== null &&
                        v !== undefined &&
                        v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('priority_id', filters.priorityId);
            applyFilter('status_id', filters.statusId);

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
        }

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching open OS:', error);
            return [];
        }

        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map((companies || []).map((c: any) => [c.id?.toString(), c]));

        return (data || []).map((item: any) => {
            const providerCompanyIdStr = item.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            return {
                id: item.id.toString(),
                orderMask: item.order_mask,
                typeId: item.type_id?.toString(),
                typeSubId: item.type_sub_id?.toString(),
                objectId: item.object_id?.toString(),
                contractId: item.contract_id?.toString(),
                planId: item.plan_id?.toString(),
                unitId: item.unit_id?.toString(),
                clientId: item.client_id?.toString(),
                departmentId: item.department_id?.toString(),
                unitAssetTagId: item.unit_asset_tag_id?.toString(),
                assetTagId: item.asset_tag_id?.toString(),
                systemId: item.system_id?.toString(),
                teamId: item.team_id?.toString(),
                typeCode: item.type_code,
                typeSubCode: item.type_sub_code,
                objectCode: item.object_code,
                unitDescription: item.unit_description,
                title: item.unit_description,
                requestedServices: item.requested_services,
                requestedAt: item.requested_at,
                createdAt: item.created_at,
                statusAt: item.status_at,
                statusDescription: item.status_description,
                statusIcon: item.status_icon,
                iconColor: item.icon_color,
                statusBackgroundColor: item.background_color,
                statusColor: item.status_color,
                priorityId: item.priority_id?.toString(),
                priorityDescription: item.priority_description,
                priorityCode: item.priority_code,
                priorityColor: item.priority_color,
                typeDescription: item.type_description,
                typeName: item.type_description,
                typeIcon: item.type_icon,
                typeColor: item.type_color,
                requesterName: item.requester_name,
                requesterNameShort: item.requester_name_short,
                requesterTeamCode: item.requester_team_code,
                requesterPhone: item.requester_phone,
                phone: item.requester_phone,
                clientName: item.client_name,
                contractDescription: item.contract_description,
                planDescription: item.plan_description,
                progress: item.progress ? `${Math.round(parseFloat(String(item.progress)) * 100)}%` : '0%',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                imgFilesNames: item.img_files_names,
                companyId: item.company_id?.toString(),
                causeReasonDescription: item.cause_reason_description,
                providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
                providerLogo: this.getPublicImageUrl(
                    item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path,
                    item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                ),
                unitLatitude: item.unit_latitude,
                unitLongitude: item.unit_longitude,
                teamLeaderLatitude: item.team_leader_latitude,
                teamLeaderLongitude: item.team_leader_longitude,
                teamLeaderNameShort: item.team_leader_name_short,
                assetTagDescription: item.asset_tag_description,
                unitAssetTagDescription: item.asset_tag_description,
                assetTagSubDescription: item.asset_tag_sub_description,
                unitAssetTagSubDescription: item.asset_tag_sub_description,
                teamCode: item.team_code,
                teamDescription: item.team_description,
                team: item.team_code || item.team_description,
                systemDescription: item.system_description,
                system: item.system_description,
                statusId: item.status_id ? Number(item.status_id) : 1,
                parentId: item.parent_id ? Number(item.parent_id) : null,
                ovCounter: item.ov_counter
            } as Order;
        });
    },

    async updateSystem(id: string, data: Partial<System>): Promise<void> {
        const { error } = await supabase.from('cfg_systems').update(data).eq('id', id);
        if (error) throw error;
    },

    async createSystem(data: Partial<System>): Promise<void> {
        const { error } = await supabase.from('cfg_systems').insert(data);
        if (error) throw error;
    },

    async updateUnitType(id: string, data: Partial<UnitType>): Promise<void> {
        const { error } = await supabase.from('cfg_units_types').update(data).eq('id', id);
        if (error) throw error;
    },

    async createUnitType(data: Partial<UnitType>): Promise<void> {
        const { error } = await supabase.from('cfg_units_types').insert(data);
        if (error) throw error;
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
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map((companies || []).map((c: any) => [c.id?.toString(), c]));

        const { data, error } = await supabase
            .from('v_orders')
            .select('*')
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching orders by team:', error);
            return [];
        }

        return (data || []).map((row: any) => {
            const providerCompanyIdStr = row.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            const providerLogoUrl = this.getPublicImageUrl(
                row.provider_company_img_file_path || row.provider_company_img_path || company?.img_file_path,
                row.provider_company_img_file_name || row.provider_company_img_name || company?.img_file_name,
                { width: 100, height: 100, resize: 'contain' }
            );

            return {
                id: row.id.toString(),
                uid: row.o_uid,
                orderMask: row.order_mask,
                clientId: row.client_id,
                companyId: row.company_id,
                unitId: row.unit_id,
                departmentId: row.department_id,
                providerDepartmentId: row.provider_department_id,
                typeId: row.type_id,
                typeCode: row.type_code,
                typeSubId: row.type_sub_id,
                typeSubCode: row.type_sub_code,
                objectId: row.object_id,
                objectCode: row.object_code,
                priorityId: row.priority_id,
                priorityCode: row.priority_code,
                teamId: row.team_id,
                contractId: row.contract_id,
                planId: row.plan_id,
                statusId: row.status_id,
                statusAt: row.status_at,
                requesterName: row.requester_name,
                requesterPhone: row.requester_phone,
                requestedAt: row.requested_at,
                requestedServices: row.requested_services,
                totalValue: row.total_value,
                systemId: row.system_id,
                unitLatitude: row.unit_latitude,
                unitLongitude: row.unit_longitude,
                teamCode: row.team_code,
                statusName: row.status_name,
                statusDescription: row.status_description,
                statusIcon: row.status_icon,
                iconColor: row.icon_color,
                statusBackgroundColor: row.status_background_color,
                progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                unitDescription: row.unit_description,
                unitDescriptionFull: row.unit_description_full,
                typeDescription: row.type_description,
                priorityDescription: row.priority_description,
                priorityColor: row.priority_color,
                assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                unitAssetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                unitAssetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                providerCompanyName: row.provider_company_description || row.provider_company_name || company?.description,
                providerLogo: providerLogoUrl,
                parentId: row.parent_id,
                teamLeaderId: row.team_leader_id?.toString(),
                teamLeaderNameShort: row.team_leader_name_short,
                ovCounter: row.ov_counter,
                imgFilePath: row.img_file_path,
                imgFileName: row.img_file_name,
                imgFilesNames: row.img_files_names
            } as Order;
        });
    },

    async getOrdersByLeader(leaderId: string): Promise<Order[]> {
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map((companies || []).map((c: any) => [c.id?.toString(), c]));

        const { data, error } = await supabase
            .from('v_orders')
            .select('*')
            .eq('team_leader_id', leaderId);

        if (error) {
            console.error('Error fetching orders by leader:', error);
            return [];
        }

        return (data || []).map((row: any) => {
            const providerCompanyIdStr = row.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            const providerLogoUrl = this.getPublicImageUrl(
                row.provider_company_img_file_path || row.provider_company_img_path || company?.img_file_path,
                row.provider_company_img_file_name || row.provider_company_img_name || company?.img_file_name,
                { width: 100, height: 100, resize: 'contain' }
            );

            return {
                id: row.id.toString(),
                uid: row.o_uid,
                orderMask: row.order_mask,
                clientId: row.client_id,
                companyId: row.company_id,
                unitId: row.unit_id,
                departmentId: row.department_id,
                providerDepartmentId: row.provider_department_id,
                typeId: row.type_id,
                typeCode: row.type_code,
                typeSubId: row.type_sub_id,
                typeSubCode: row.type_sub_code,
                objectId: row.object_id,
                objectCode: row.object_code,
                priorityId: row.priority_id,
                priorityCode: row.priority_code,
                teamId: row.team_id,
                contractId: row.contract_id,
                planId: row.plan_id,
                statusId: row.status_id,
                statusAt: row.status_at,
                requesterName: row.requester_name,
                requesterPhone: row.requester_phone,
                requestedAt: row.requested_at,
                requestedServices: row.requested_services,
                totalValue: row.total_value,
                systemId: row.system_id,
                unitLatitude: row.unit_latitude,
                unitLongitude: row.unit_longitude,
                teamCode: row.team_code,
                statusName: row.status_name,
                statusDescription: row.status_description,
                statusIcon: row.status_icon,
                iconColor: row.icon_color,
                statusBackgroundColor: row.status_background_color,
                progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                unitDescription: row.unit_description,
                unitDescriptionFull: row.unit_description_full,
                typeDescription: row.type_description,
                priorityDescription: row.priority_description,
                priorityColor: row.priority_color,
                assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                unitAssetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                unitAssetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                providerCompanyName: row.provider_company_description || row.provider_company_name || company?.description,
                providerLogo: providerLogoUrl,
                parentId: row.parent_id,
                teamLeaderId: row.team_leader_id?.toString(),
                teamLeaderNameShort: row.team_leader_name_short,
                ovCounter: row.ov_counter,
                imgFilePath: row.img_file_path,
                imgFileName: row.img_file_name,
                imgFilesNames: row.img_files_names
            } as Order;
        });
    },

    async hasActiveVisits(orderId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('orders_visits')
            .select('*', { count: 'exact', head: true })
            .eq('o_id', orderId)
            .eq('is_deleted', false);

        if (error) return false;
        return (count || 0) > 0;
    },

    async getAvailableTeamMembers(teamId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name_full, name_short, is_team_leader')
            .eq('team_id', teamId)
            .order('name_short');

        if (error) {
            console.error('Error fetching available team members:', error);
            return [];
        }

        return data.map((u: any) => ({
            id: u.id.toString(),
            nameFull: u.name_full,
            nameShort: u.name_short,
            isTeamLeader: u.is_team_leader
        })) as User[];
    },

    async getActiveUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name_short, is_available, is_ov_in_progress, img_file_path, img_file_name, team_id, ov_id_in_progress')
            .eq('is_ov_in_progress', true)
            .order('name_short');

        if (error) {
            console.error('Error fetching active users:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            nameShort: item.name_short,
            isAvailable: item.is_available,
            isOvInProgress: item.is_ov_in_progress,
            ovIdInProgress: item.ov_id_in_progress,
            teamId: item.team_id?.toString(),
            avatarUrl: item.img_file_name
                ? this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 100, height: 100, resize: 'cover' })
                : undefined,
        })) as User[];
    },

    async authorizeOrder(orderId: string, teamId: string, planId?: string, teamLeaderId?: string): Promise<void> {
        // 1. Get current auth user and order details (from view for complete info)
        const [{ data: { user: authUser } }, { data: order }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('v_orders').select('*').eq('id', orderId).single()
        ]);

        if (!order) throw new Error("Ordem de serviço não encontrada");

        // 2. Identify the authorizing user
        let authorizingUserId = '';
        let authorizingUserName = 'Alguém';
        if (authUser) {
            const { data: userData } = await supabase
                .from('users')
                .select('id, name_short, name_full')
                .eq('uuid', authUser.id)
                .single();
            if (userData) {
                authorizingUserId = userData.id.toString();
                authorizingUserName = userData.name_short || userData.name_full || 'Alguém';
            }
        }

        // 3. Perform the update
        const now = getBrazilTimestamp();
        const updateData: any = {
            status_id: 3,
            status_at: now,
            team_id: teamId ? Number(teamId) : null,
            plan_id: planId ? Number(planId) : null
        };

        if (teamLeaderId && teamLeaderId !== "") {
            updateData.team_leader_id = Number(teamLeaderId);
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) throw updateError;

        // 4. Update Service Request (Parent) status if needed
        if (order.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }

        // 5. Send Notifications
        try {
            console.log('🔔 Starting notification process for OS:', orderId);
            const notifications: any[] = [];
            const timestamp = getBrazilTimestamp();
            const orderMask = order.order_mask || 'N/A';
            const unitDesc = order.unit_description || order.unit_name || 'N/A';

            console.log('📝 Notification Context:', { authorizingUserId, teamLeaderId, orderMask });

            // 5.1 Notify Team Leader
            if (teamLeaderId && teamLeaderId !== "") {
                const { data: leaderUser } = await supabase.from('users').select('mobile_whatsapp').eq('id', teamLeaderId).single();
                notifications.push({
                    user_id_to: Number(teamLeaderId),
                    user_id_from: authorizingUserId ? Number(authorizingUserId) : null,
                    title: 'OS Autorizada',
                    body: `${authorizingUserName} autorizou a OS ${orderMask}.\nUnidade: ${unitDesc}\nServiços: ${order.requested_services || ''}`,
                    type: 'OS Autorizada',
                    created_at: timestamp,
                    is_read: false,
                    o_id: Number(orderId),
                    user_to_whatsapp: leaderUser?.mobile_whatsapp
                });
            }

            // 5.2 Notify Followers
            const { data: followers } = await supabase.from('orders_followers').select('user_id').eq('o_id', orderId);
            if (followers && followers.length > 0) {
                // Remove only teamLeader (already notified in 5.1); authorizingUser receives notification even if they authorized
                const followerIds = followers.map(f => f.user_id.toString()).filter(id => {
                    if (teamLeaderId && teamLeaderId !== '' && id === teamLeaderId) return false;
                    return true;
                });
                if (followerIds.length > 0) {
                    const { data: fUsers } = await supabase.from('users').select('id, mobile_whatsapp').in('id', followerIds);
                    followerIds.forEach(fId => {
                        const fUser = fUsers?.find(u => u.id.toString() === fId);
                        notifications.push({
                            user_id_to: Number(fId),
                            user_id_from: authorizingUserId ? Number(authorizingUserId) : null,
                            title: 'OS Autorizada',
                            body: `A OS ${orderMask} foi autorizada por ${authorizingUserName}.\nUnidade: ${unitDesc}`,
                            type: 'OS Autorizada',
                            created_at: timestamp,
                            is_read: false,
                            o_id: Number(orderId),
                            user_to_whatsapp: fUser?.mobile_whatsapp
                        });
                    });
                }
            }

            if (notifications.length > 0) {
                const { error: notifInsertError } = await supabase.from('users_notifications').insert(notifications);
                if (notifInsertError) console.error('❌ Error inserting notifications table:', notifInsertError);
            }
        } catch (notifErr) {
            console.error('❌ Fatal error in notification flow:', notifErr);
        }
    },

    async cancelOrder(orderId: string, reasonId: string, userId: string, teamId: string): Promise<void> {
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', orderId).single();
        const now = getBrazilTimestamp();
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 7,
                status_at: now,
                canceled_user_id: userId,
                canceled_team_id: teamId,
                canceled_at: now,
                cancel_reason_id: reasonId,
                unit_asset_tag_has_order: false,
                unit_asset_tag_no_has_order_user_id: userId,
                unit_asset_tag_no_has_order_at: now
            })
            .eq('id', orderId);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },

    async scheduleOrder(orderId: string, date: string): Promise<void> {
        const id = Number(orderId);
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', id).maybeSingle();

        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 4,
                status_at: date
            })
            .eq('id', id);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },

    async updateOrderTeam(orderId: string, teamId: string, teamLeaderId?: string): Promise<void> {
        const updateData: any = {
            team_id: teamId ? Number(teamId) : null
        };

        if (teamLeaderId && teamLeaderId !== "") {
            updateData.team_leader_id = Number(teamLeaderId);
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) throw error;
    },

    async getLeadersByCompany(companyId: string): Promise<User[]> {
        // Step 1: Get team IDs for this company (users.team_id = cfg_teams.id)
        const { data: teams, error: teamsError } = await supabase
            .from('cfg_teams')
            .select('id')
            .eq('company_id', companyId);

        if (teamsError || !teams || teams.length === 0) return [];

        const teamIds = teams.map((t: any) => t.id);

        // Step 2: Get leaders directly - users.team_id is a direct FK to cfg_teams
        const { data, error } = await supabase
            .from('users')
            .select('*, cfg_users_statuses(id, description), cfg_profiles(description)')
            .in('team_id', teamIds)
            .eq('is_team_leader', true);

        if (error) {
            console.error('Error fetching leaders by company:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            latitude: item.latitude,
            longitude: item.longitude,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            phone: item.phone,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress,
            avatarUrl: this.getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 100, height: 100, resize: 'cover' })
        })) as User[];
    },

    async getTodayVisitsByCompany(companyId: string): Promise<OrderVisit[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('o_provider_company_id', companyId)
            .or(`ov_status_id.eq.1,and(ov_status_id.eq.2,ov_started_at.gte.${startOfDay},ov_started_at.lte.${endOfDay})`)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching today visits by company:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            // View fields
            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,
            statusIcon: row.ov_status_icon,
            statusColor: row.ov_status_color,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            requestedServices: row.o_requested_services,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description
        })) as OrderVisit[];
    },

    async getVisitsByTeam(teamId: string): Promise<OrderVisit[]> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('o_team_id', teamId)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching visits by team:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            // View fields - using correct column names from v_orders_visits
            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description
        })) as OrderVisit[];
    },

    async getVisitsByLeader(leaderId: string): Promise<OrderVisit[]> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('ov_team_leader_id', leaderId)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching visits by leader:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            // View fields - using correct column names from v_orders_visits
            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            requestedServices: row.o_requested_services,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
        })) as OrderVisit[];
    },

    async startOrderVisit(order: Order, currentUser: User): Promise<void> {
        const { data, error } = await supabase.rpc('flow_order_visit_create_v2', {
            payload: {
                order_id: Number(order.id),
                user_id: currentUser.id
            }
        });

        if (error) {
            console.error('Error starting visit:', error);
            throw error;
        }

        const result = data as { success: boolean; message: string; visit_id?: number };
        if (!result.success) {
            throw new Error(result.message);
        }

        // Flow Rule: Update Parent SS if this is an OS
        if (order.parentId) {
            await this.updateServiceRequestStatus(order.parentId.toString());
        }
    },

    async getActiveOrderVisit(id: string): Promise<OrderVisit | null> {
        // Ensure counters are synced when accessing the visit page
        // This handles legacy data or any missed syncs
        try {
            await this.syncOrderVisitAssetsProcessing(id);
        } catch (e) {
            console.warn('[dataService] Failed to pre-sync visit assets:', e);
        }

        // Fetch visit data and configurations in parallel
        const [visitResult, configs] = await Promise.all([
            supabase
                .from('v_orders_visits')
                .select('*')
                .eq('id', id)
                .single(),
            getProcessingConfigurations()
        ]);

        const { data, error } = visitResult;

        if (error || !data) return null;

        // Fetch additional data directly from orders_visits table to ensure we have the latest counters
        // and avoid issues if they are missing from the view
        const { data: tableData } = await supabase
            .from('orders_visits')
            .select(`
                ov_assets_amount,
                ov_assets_reported_amount,
                ov_assets_draft_amount,
                ov_assets_revised_amount,
                ov_assets_disapproved_amount,
                ov_assets_approved_no_filed_amount,
                ov_assets_approved_filed_amount
            `)
            .eq('id', parseInt(id))
            .single();

        const { data: orderData } = await supabase
            .from('v_orders')
            .select('contract_id, provider_department_id')
            .eq('id', data.o_id)
            .single();

        // Find matching config for this visit's processing ID
        const config = configs.find(c => c.id === data.ov_processing_id);

        let contractObject = null;
        const cId = orderData?.contract_id || data.o_contract_id;
        if (cId) {
            const { data: contractData } = await supabase
                .from('contracts')
                .select('object')
                .eq('id', cId)
                .single();
            contractObject = contractData?.object;
        }

        return {
            id: data.id?.toString(),
            oId: data.o_id?.toString(),
            ovMask: data.ov_mask,
            ovStatusId: data.ov_status_id,
            ovCreatedAt: data.ov_started_at,
            ovCreatedUserId: data.ov_team_leader_id?.toString(),
            ovStartedAt: data.ov_started_at,
            ovEndedAt: data.ov_ended_at,
            ovTeamLeadId: data.ov_team_leader_id?.toString(),
            ovProcessingId: data.ov_processing_id,
            ovComments: data.ov_comments,
            orderMask: data.o_mask,
            statusDescription: data.ov_status_description,
            processingDescription: data.ov_processing_description,
            teamLeaderName: data.ov_team_leader_name_short,
            unitDescription: data.o_unit_description,
            unitId: data.o_unit_id?.toString(),
            systemDescription: data.o_system_description,
            clientName: data.client_name || data.o_client_name,
            assetTagDescription: data.o_asset_tag_description || data.asset_tag_description,
            assetTagSubDescription: data.asset_tag_sub_description || data.o_asset_tag_sub_description,
            requestedServices: data.o_requested_services,
            progress: data.ov_o_progress ? Math.round(parseFloat(data.ov_o_progress) * 100) : 0,
            ovOStatusId: data.ov_o_status_id,
            ovOStatusDescription: data.ov_o_status_description,
            ovOSuspendedReasonId: data.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: data.ov_o_suspended_reason_description,
            processingIcon: config?.icon,
            processingIconColor: config?.icon_color,
            processingBgColor: config?.bg_color,
            ovDurationHours: data.ov_duration_hours,
            contractId: orderData?.contract_id?.toString() || data.o_contract_id?.toString(),
            servicesValue: data.ov_services_value,
            materialsValue: data.ov_materials_value,
            vehiclesValue: data.ov_vehicles_value,
            totalValue: data.ov_total_value,
            companyId: data.o_provider_company_id?.toString(),
            providerCompanyId: data.o_provider_company_id?.toString(),
            providerDepartmentId: orderData?.provider_department_id?.toString() || data.o_provider_department_id?.toString(),
            isFiled: data.ov_is_filed,
            teamCode: data.o_team_code,
            priorityId: data.o_priority_id?.toString(),
            priorityCode: data.o_priority_code,
            priorityDescription: data.o_priority_description,
            priorityColor: data.o_priority_color,
            oRequesterName: data.o_requester_name,
            oRequesterPhone: data.o_requester_phone,
            contractDescription: data.o_contract_description,
            contractObject: contractObject,
            planDescription: data.o_plan_description || data.plan_description,
            oReasonDescription: data.o_reason_description,
            oCauseDescription: data.o_cause_description,
            observation: data.o_comments || data.ov_comments,
            ovAssetsAmount: tableData?.ov_assets_amount ?? data.ov_assets_amount,
            ovAssetsReportedAmount: tableData?.ov_assets_reported_amount ?? data.ov_assets_reported_amount,
            ovAssetsDraftAmount: tableData?.ov_assets_draft_amount ?? data.ov_assets_draft_amount,
            ovAssetsRevisedAmount: tableData?.ov_assets_revised_amount ?? data.ov_assets_revised_amount,
            ovAssetsDisapprovedAmount: tableData?.ov_assets_disapproved_amount ?? data.ov_assets_disapproved_amount,
            ovAssetsApprovedNoFiledAmount: tableData?.ov_assets_approved_no_filed_amount ?? data.ov_assets_approved_no_filed_amount,
            ovAssetsApprovedFiledAmount: tableData?.ov_assets_approved_filed_amount ?? data.ov_assets_approved_filed_amount,
            ovAssetsApprovedAmount: (tableData?.ov_assets_approved_no_filed_amount ?? data.ov_assets_approved_no_filed_amount ?? 0) +
                (tableData?.ov_assets_approved_filed_amount ?? data.ov_assets_approved_filed_amount ?? 0),
            // Approval audit trail
            reportedAt: data.ov_reported_at,
            reportedUserId: data.ov_reported_user_id?.toString(),
            reportedUserNameShort: data.ov_reported_user_name_short,
            revisedAt: data.ov_revised_at,
            revisedUserId: data.ov_revised_user_id?.toString(),
            revisedUserNameShort: data.ov_revised_user_name_short,
            disapprovedAt: data.ov_disapproved_at,
            disapprovedUserId: data.ov_disapproved_user_id?.toString(),
            disapprovedUserNameShort: data.ov_disapproved_user_name_short,
            approvedAt: data.ov_approved_at,
            approvedUserId: data.ov_approved_user_id?.toString(),
            approvedUserNameShort: data.ov_approved_user_name_short,
            approvedFiledAt: data.ov_approved_filed_at,
            approvedFiledUserId: data.ov_approved_filed_user_id?.toString(),
            approvedFiledUserNameShort: data.ov_approved_filed_user_name_short,
            ovSignatureLeaderPath: data.ov_signature_leader_path,
            ovSignatureLeaderName: data.ov_signature_leader_name,
            ovSignatureLeaderAt: data.ov_signature_leader_at,
            ovSignatureRequesterPath: data.ov_signature_requester_path,
            ovSignatureRequesterName: data.ov_signature_requester_name,
            ovSignatureRequesterAt: data.ov_signature_requester_at,
        } as OrderVisit;
    },

    async getOrderVisitTeam(visitId: string): Promise<OrderVisitTeam[]> {
        // 1. Fetch team links
        const { data: teamLinks, error: teamError } = await supabase
            .from('orders_visits_teams')
            .select('*')
            .eq('ov_id', visitId)
            .order('order_id', { ascending: true });

        if (teamError || !teamLinks || teamLinks.length === 0) return [];

        // 2. Fetch User Details
        const userIds = teamLinks.map((t: any) => t.user_id);
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name_short, img_file_path, img_file_name, is_available')
            .in('id', userIds);

        if (usersError || !users) return [];

        // 3. Merge Data
        const userMap = new Map(users.map((u: any) => [u.id, u]));

        return teamLinks.map((item: any) => {
            const user = userMap.get(item.user_id);
            return {
                id: item.id,
                ovId: item.ov_id,
                userId: item.user_id,
                isLeader: item.is_leader,
                orderId: item.order_id,
                userName: user?.name_short,
                userIsAvailable: user?.is_available,
                userAvatarUrl: user?.img_file_path && user?.img_file_name
                    ? this.getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined
            };
        });
    },

    async getOrdersVisitsTeamsBulk(visitIds: string[]): Promise<Record<string, OrderVisitTeam[]>> {
        if (!visitIds || visitIds.length === 0) return {};

        const numericIds = visitIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (numericIds.length === 0) return {};

        // 1. Fetch team links for all visits
        const { data: teamLinks, error: teamError } = await supabase
            .from('orders_visits_teams')
            .select('*')
            .in('ov_id', numericIds)
            .order('order_id', { ascending: true });

        if (teamError || !teamLinks || teamLinks.length === 0) return {};

        // 2. Fetch all unique users involved
        const userIds = Array.from(new Set(teamLinks.map((t: any) => t.user_id)));
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name_short, img_file_path, img_file_name, is_available')
            .in('id', userIds);

        if (usersError || !users) {
            console.error('Error fetching users for teams bulk:', usersError);
            return {};
        }

        // 3. Merge Data
        const userMap = new Map(users.map((u: any) => [u.id, u]));
        const results: Record<string, OrderVisitTeam[]> = {};

        teamLinks.forEach((item: any) => {
            const user = userMap.get(item.user_id);
            const mappedMember: OrderVisitTeam = {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                userId: item.user_id,
                isLeader: item.is_leader,
                orderId: item.order_id,
                userName: user?.name_short,
                userIsAvailable: user?.is_available,
                userAvatarUrl: user?.img_file_path && user?.img_file_name
                    ? this.getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined
            };

            const ovIdStr = item.ov_id.toString();
            if (!results[ovIdStr]) {
                results[ovIdStr] = [];
            }
            results[ovIdStr].push(mappedMember);
        });

        return results;
    },

    async getProviderCompanyByOvAssetId(ovAssetId: string): Promise<string | null> {
        const { data: ova, error: ovaError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (ovaError || !ova) return null;

        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('o_provider_company_id')
            .eq('id', ova.ov_id)
            .single();

        if (visitError || !visit) return null;

        return visit.o_provider_company_id?.toString() || null;
    },

    async removeTeamMember(visitId: string, userId: string): Promise<void> {
        // 1. Fetch visit status to check if we should update user record
        const { data: visit, error: visitError } = await supabase
            .from('orders_visits')
            .select('ov_status_id')
            .eq('id', parseInt(visitId))
            .single();

        if (visitError || !visit) throw visitError || new Error('Visita não encontrada');

        // 2. Remove from orders_visits_teams
        const { error: teamError } = await supabase
            .from('orders_visits_teams')
            .delete()
            .eq('ov_id', parseInt(visitId))
            .eq('user_id', userId);

        if (teamError) throw teamError;

        // 3. Update user status ONLY if visit is in progress
        if (visit.ov_status_id === 1) {
            const { error: userError } = await supabase
                .from('users')
                .update({
                    is_available: true,
                    is_ov_in_progress: false,
                    ov_id_in_progress: 0,
                    o_id_in_progress: 0,
                    op_id_in_progress: 0,
                    ov_id_in_progress_mask: '0',
                    o_contract_id_in_progress: 0,
                    o_type_id_in_progress: 0,
                    o_type_sub_id_in_progress: 0,
                    ov_in_progress_leader_id: 0,
                    o_plan_id_in_progress: 0,
                    o_asset_tag_id_in_progress: 0,
                    o_unit_id_in_progress: 0,
                    o_unit_type_id_in_progress: 0,
                    o_unit_type_parent_id_in_progress: 0,
                    o_system_id_in_progress: 0,
                    o_system_parent_id_in_progress: 0,
                    o_object_id_in_progress: 0
                })
                .eq('id', userId);

            if (userError) throw userError;
        }
    },

    async addTeamMember(visitId: string, userId: string): Promise<void> {
        // 1. Business Rule: No duplicate members
        const { data: existing, error: checkError } = await supabase
            .from('orders_visits_teams')
            .select('id')
            .eq('ov_id', visitId)
            .eq('user_id', userId)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existing) throw new Error('Usuário já faz parte da equipe desta visita');

        // 2. Fetch Visit and Order Data
        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) throw visitError || new Error('Visita não encontrada');

        const { data: order, error: orderError } = await supabase
            .from('v_orders')
            .select('*')
            .eq('id', visit.o_id)
            .single();

        if (orderError || !order) throw orderError || new Error('Ordem de serviço não encontrada');

        // 3. Insert into orders_visits_teams
        const { error: insertError } = await supabase
            .from('orders_visits_teams')
            .insert({
                ov_id: parseInt(visitId),
                user_id: userId,
                is_leader: false,
                order_id: 0 // Temp
            });

        if (insertError) throw insertError;

        // 4. Update order_id for all non-leaders alphabetically by name_short
        const { data: teamMembers, error: membersError } = await supabase
            .from('orders_visits_teams')
            .select('id, user_id, is_leader')
            .eq('ov_id', visitId)
            .eq('is_leader', false);

        if (membersError) throw membersError;

        const { data: usersInfo, error: usersInfoError } = await supabase
            .from('users')
            .select('id, name_short')
            .in('id', teamMembers.map(m => m.user_id));

        if (usersInfoError) throw usersInfoError;

        const nameMap = new Map(usersInfo.map(u => [u.id, u.name_short]));
        const sortedMembers = [...teamMembers].sort((a, b) => {
            const nameA = nameMap.get(a.user_id) || '';
            const nameB = nameMap.get(b.user_id) || '';
            return nameA.localeCompare(nameB, 'pt-BR');
        });

        // Sequential updates for order_id
        for (let i = 0; i < sortedMembers.length; i++) {
            await supabase
                .from('orders_visits_teams')
                .update({ order_id: i + 1 })
                .eq('id', sortedMembers[i].id);
        }

        // 5. Update user record (if status is 1 - Em Andamento)
        if (visit.ov_status_id === 1) {
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    is_available: false,
                    is_ov_in_progress: true,
                    ov_id_in_progress: parseInt(visitId),
                    o_id_in_progress: parseInt(visit.o_id),
                    op_id_in_progress: order.parent_id,
                    ov_id_in_progress_mask: visit.ov_mask,
                    o_contract_id_in_progress: order.contract_id,
                    o_type_id_in_progress: order.type_id,
                    o_type_sub_id_in_progress: order.type_sub_id,
                    ov_in_progress_leader_id: visit.ov_team_leader_id,
                    o_plan_id_in_progress: order.plan_id,
                    o_asset_tag_id_in_progress: order.asset_tag_id,
                    o_unit_id_in_progress: order.unit_id,
                    o_unit_type_id_in_progress: order.unit_type_id,
                    o_unit_type_parent_id_in_progress: order.unit_type_parent_id,
                    o_system_id_in_progress: order.system_id,
                    o_system_parent_id_in_progress: order.system_parent_id,
                    o_object_id_in_progress: order.object_id
                })
                .eq('id', userId);

            if (userUpdateError) throw userUpdateError;
        }
    },

    async getVisitsByOrderId(orderId: string | number): Promise<OrderVisit[]> {
        // Fetch visits and configurations in parallel
        const [visitsResult, configs] = await Promise.all([
            supabase
                .from('v_orders_visits')
                .select('*')
                .eq('o_id', Number(orderId))
                .order('ov_started_at', { ascending: true }),
            getProcessingConfigurations()
        ]);

        const { data, error } = visitsResult;

        if (error || !data) return [];

        return data.map(item => {
            // Find matching config
            const config = configs.find(c => c.id === item.ov_processing_id);

            return {
                id: item.id?.toString(),
                oId: item.o_id?.toString(),
                ovMask: item.ov_mask,
                ovStatusId: item.ov_status_id,
                ovCreatedAt: item.created_at || item.ov_started_at,
                ovCreatedUserId: item.created_user_id?.toString() || item.ov_team_leader_id?.toString(),
                ovUpdatedAt: item.updated_at,
                ovUpdatedUserId: item.updated_user_id?.toString(),
                ovStartedAt: item.ov_started_at,
                ovEndedAt: item.ov_ended_at,
                ovTeamLeadId: item.ov_team_leader_id?.toString(),
                ovProcessingId: item.ov_processing_id,
                ovComments: item.ov_comments,
                orderMask: item.o_mask,
                statusDescription: item.ov_status_description,
                processingDescription: item.ov_processing_description,
                teamLeaderName: item.ov_team_leader_name_short,
                unitDescription: item.o_unit_description,
                unitId: item.o_unit_id?.toString(),
                systemDescription: item.o_system_description,
                clientName: item.o_client_name,
                assetTagDescription: item.o_asset_tag_description,
                assetTagSubDescription: item.o_asset_tag_sub_description,
                requestedServices: item.o_requested_services,
                progress: item.ov_o_progress ? Math.round(parseFloat(item.ov_o_progress) * 100) : 0,
                ovOStatusId: item.ov_o_status_id,
                ovOStatusDescription: item.ov_o_status_description,
                ovOSuspendedReasonId: item.ov_o_suspended_reason_id,
                ovOSuspendedReasonDescription: item.ov_o_suspended_reason_description,
                processingIcon: config?.icon,
                processingIconColor: config?.icon_color,
                processingBgColor: config?.bg_color,
                ovDurationHours: item.ov_duration_hours,
                contractId: item.o_contract_id?.toString(),
                servicesValue: item.ov_services_value,
                materialsValue: item.ov_materials_value,
                vehiclesValue: item.ov_vehicles_value,
                totalValue: item.ov_total_value,
                teamCode: item.o_team_code
            } as OrderVisit;
        });
    },


    async getVisitsByParentOrderId(parentId: string | number): Promise<OrderVisit[]> {
        // Fetch visits and configurations in parallel
        const [visitsResult, configs] = await Promise.all([
            supabase
                .from('v_orders_visits')
                .select('*')
                .eq('op_id', Number(parentId))
                .order('ov_started_at', { ascending: true }),
            getProcessingConfigurations()
        ]);

        const { data, error } = visitsResult;

        if (error || !data) return [];


        return data.map(item => {
            // Find matching config
            const config = configs.find(c => c.id === item.ov_processing_id);

            return {
                id: item.id?.toString(),
                oId: item.o_id?.toString(),
                ovMask: item.ov_mask,
                ovStatusId: item.ov_status_id,
                ovCreatedAt: item.created_at || item.ov_started_at,
                ovCreatedUserId: item.created_user_id?.toString() || item.ov_team_leader_id?.toString(),
                ovUpdatedAt: item.updated_at,
                ovUpdatedUserId: item.updated_user_id?.toString(),
                ovStartedAt: item.ov_started_at,
                ovEndedAt: item.ov_ended_at,
                ovTeamLeadId: item.ov_team_leader_id?.toString(),
                ovProcessingId: item.ov_processing_id,
                ovComments: item.ov_comments,
                orderMask: item.o_mask,
                statusDescription: item.ov_status_description,
                processingDescription: item.ov_processing_description,
                teamLeaderName: item.ov_team_leader_name_short,
                unitDescription: item.o_unit_description,
                unitId: item.o_unit_id?.toString(),
                systemDescription: item.o_system_description,
                clientName: item.o_client_name,
                assetTagDescription: item.o_asset_tag_description,
                assetTagSubDescription: item.o_asset_tag_sub_description,
                requestedServices: item.o_requested_services,
                progress: item.ov_o_progress ? Math.round(parseFloat(item.ov_o_progress) * 100) : 0,
                ovOStatusId: item.ov_o_status_id,
                ovOStatusDescription: item.ov_o_status_description,
                ovOSuspendedReasonId: item.ov_o_suspended_reason_id,
                ovOSuspendedReasonDescription: item.ov_o_suspended_reason_description,
                processingIcon: config?.icon,
                processingIconColor: config?.icon_color,
                processingBgColor: config?.bg_color,
                ovDurationHours: item.ov_duration_hours,
                contractId: item.o_contract_id?.toString(),
                servicesValue: item.ov_services_value,
                materialsValue: item.ov_materials_value,
                vehiclesValue: item.ov_vehicles_value,
                totalValue: item.ov_total_value,
                teamCode: item.o_team_code
            } as OrderVisit;
        });
    },



    async getAssetsUnavailableReasons(): Promise<{ id: number, description: string }[]> {
        const { data, error } = await supabase
            .from('cfg_assets_unavailable_reasons')
            .select('id, description')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching asset unavailable reasons:', error);
            return [];
        }

        return data || [];
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT
    // -------------------------------------------------------------------------
    async getOrderVisitById(visitId: string): Promise<OrderVisit | null> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();
        if (error) {
            console.error('Error fetching visit by id', error);
            return null;
        }
        return data as OrderVisit;
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT VEHICLES (orders_visits_vehicles)
    // -------------------------------------------------------------------------
    async getOrderVisitVehicles(visitId: string): Promise<OrderVisitVehicle[]> {
        // Usar a view v_orders_visits_vehicles que já tem os dados do veículo incluídos
        const { data, error } = await supabase
            .from('v_orders_visits_vehicles')
            .select('*')
            .eq('ov_id', visitId);

        if (error) {
            console.error('Error fetching order visit vehicles:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            vehicleId: item.vehicle_id.toString(),
            recorderStart: item.recorder_start,
            recorderEnd: item.recorder_end,
            amount: (item.recorder_end && item.recorder_start) ? (item.recorder_end - item.recorder_start) : 0,
            valueUnit: item.value_unit,
            valueTotal: item.value_total,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            // Dados do veículo vêm diretamente da view
            description: item.vehicle_description,
            plates: item.vehicle_plates,
            model: item.vehicle_description, // A view não tem 'model', usar description
            unit: item.unit
        }));
    },

    async addVehicleToOrderVisit(visitId: string, vehicleId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_vehicles')
            .insert({
                ov_id: parseInt(visitId),
                vehicle_id: parseInt(vehicleId),
                created_user_id: parseInt(userId),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error adding vehicle to visit:', error);
            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSETS (orders_visits_assets)
    // -------------------------------------------------------------------------
    async getOrderVisitAssets(visitId: string): Promise<OrderVisitAssetView[]> {
        const { data: viewData, error: viewError } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('ov_id', parseInt(visitId));

        if (viewError) {
            console.error('Error fetching order visit assets from view:', viewError);
            return [];
        }

        // Fetch image data directly from the table to ensure we have the most recent data
        const { data: tableData, error: tableError } = await supabase
            .from('orders_visits_assets')
            .select('id, before_img_files_names, after_img_files_names, before_img_file_path, after_img_file_path')
            .eq('ov_id', parseInt(visitId));

        if (tableError) {
            console.warn('Error fetching image data directly from table:', tableError);
        }

        // Create a map of table data for easy merging
        const tableDataMap = new Map((tableData || []).map((t: any) => [t.id.toString(), t]));

        return (viewData || []).map((item: any) => {
            // Merge view data with table data (table data takes precedence for images)
            const tableItem = tableDataMap.get(item.id.toString());
            const mergedItem = tableItem ? { ...item, ...tableItem } : item;

            const oCompanyId = mergedItem.o_company_id || mergedItem.company_id;
            const assetId = mergedItem.asset_id;

            // Helper to ensure we have an array of strings
            const ensureArray = (val: any): string[] => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string' && val.trim()) {
                    // Handle postgres array format if necessary: {file1,file2}
                    if (val.startsWith('{') && val.endsWith('}')) {
                        return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                    }
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) {
                        return [val];
                    }
                }
                return [];
            };

            const beforeFiles = ensureArray(mergedItem.before_img_files_names);
            const afterFiles = ensureArray(mergedItem.after_img_files_names);

            const initialPhotoUrls = beforeFiles.map((name: string) =>
                this.getPublicImageUrl(mergedItem.before_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, name));

            const finalPhotoUrls = afterFiles.map((name: string) =>
                this.getPublicImageUrl(mergedItem.after_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, name));

            return {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                assetId: assetId.toString(),
                code: item.code,
                description: item.description,
                brand: item.brand,
                model: item.model,
                serial: item.serial,
                location: item.location,
                beforeUnitDescription: item.before_unit_description,
                afterUnitDescription: item.after_unit_description,
                beforeStatusDescription: item.before_status_description,
                afterStatusDescription: item.after_status_description,
                afterTagDescription: item.after_tag_description,
                beforeTagDescription: item.before_tag_description,
                beforeTagSubDescription: item.before_tag_sub_description,
                afterTagSubDescription: item.after_tag_sub_description,
                beforeComments: item.before_comments,
                afterComments: item.after_comments,
                isMoved: item.is_moved,
                movedComments: item.moved_comments,
                oTeamLeaderNameShort: item.o_team_leader_name_short,
                ovMask: item.ov_mask,
                orderMask: item.o_mask || item.order_mask, 
                beforeStatusAt: item.before_status_at,
                createdAt: item.reported_at,
                beforeStatusColor: item.status_color || item.before_status_color,
                clientName: item.client_name,
                beforeClientName: item.before_client_name,
                afterClientName: item.after_client_name,
                processingId: item.processing_id,
                processingDescription: item.processing_description,
                disapprovedNotes: item.disapproved_notes,
                reportedUserNameShort: item.reported_user_name_short,
                activitiesDescription: item.activities_description,
                maintenancePlanId: item.maintenance_plan_id?.toString(),
                maintenancePlanProgress: item.maintenance_plan_progress,
                oContractId: item.o_contract_id?.toString(),
                orderTypeId: item.o_type_id?.toString(),
                imgUrl: initialPhotoUrls[0], 
                initialPhotoUrls,
                finalPhotoUrls
            };
        });
    },

    async getMovedAssetsByUnitAssetTagId(unitAssetTagId: string): Promise<OrderVisitAssetView[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('before_unit_asset_tag_id', unitAssetTagId)
            .eq('is_moved', true);

        if (error) {
            console.error('Error fetching moved assets by unit_asset_tag_id:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            assetId: item.asset_id.toString(),
            code: item.code,
            description: item.description,
            brand: item.brand,
            model: item.model,
            serial: item.serial,
            location: item.location,
            isMoved: item.is_moved,
            beforeUnitId: item.before_unit_id?.toString(),
            afterUnitId: item.after_unit_id?.toString(),
            beforeUnitAssetTagId: item.before_unit_asset_tag_id?.toString(),
            afterUnitAssetTagId: item.after_unit_asset_tag_id?.toString(),
            beforeStatusId: item.before_status_id?.toString(),
            afterStatusId: item.after_status_id?.toString(),
            beforeUnitDescription: item.before_unit_description,
            afterUnitDescription: item.after_unit_description,
            beforeStatusDescription: item.before_status_description,
            afterStatusDescription: item.after_status_description,
            beforeTagDescription: item.before_tag_description,
            beforeTagSubDescription: item.before_tag_sub_description,
            afterUnitAssetTagDescription: item.after_unit_asset_tag_description,
            beforeStatusAt: item.before_status_at,
            createdAt: item.reported_at,
            beforeStatusColor: item.status_color || item.before_status_color,
            clientName: item.client_name,
            processingId: item.processing_id,
            oTeamLeaderNameShort: item.o_team_leader_name_short,
            ovMask: item.ov_mask,
            orderMask: item.order_mask,
            movedComments: item.moved_comments,
            afterTagDescription: item.after_tag_description,
            afterTagSubDescription: item.after_tag_sub_description,
            imgUrl: item.before_img_files_names && item.before_img_files_names.length > 0
                ? this.getPublicImageUrl(item.before_img_file_path || `companies/${item.o_company_id || item.company_id}/assets/${item.asset_id}`, item.before_img_files_names[0])
                : undefined
        }));
    },

    async getOrderVisitAssetById(id: string): Promise<OrderVisitAssetView | null> {
        // Fetch from view for joined data
        const { data: viewData, error: viewError } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('id', id)
            .single();

        if (viewError || !viewData) {
            console.error('Error fetching order visit asset by id from view:', viewError);
            return null;
        }

        // Fetch image arrays and paths directly from the table to avoid view sync lag/issues
        const { data: tableData, error: tableError } = await supabase
            .from('orders_visits_assets')
            .select('processing_id, disapproved_notes, disapproved_user_id, disapproved_at, before_img_files_names, after_img_files_names, before_img_file_path, after_img_file_path')
            .eq('id', parseInt(id))
            .single();

        if (tableError) {
            console.warn('Error fetching image file names directly from table, using view data if available:', tableError);
            // Proceed with viewData, image arrays might be outdated or missing
        }

        const data = { ...viewData, ...tableData };

        let orderTypeId = data.o_type_id?.toString();
        let contractId = data.o_contract_id?.toString();
        const oCompanyId = data.o_company_id || data.company_id;

        // If o_type_id is not in the asset view, fetch it from the visit view or order
        if ((!orderTypeId || !contractId) && data.o_id) {
            try {
                const { data: orderData } = await supabase
                    .from('v_orders')
                    .select('type_id, contract_id')
                    .eq('id', data.o_id)
                    .single();
                if (orderData) {
                    if (!orderTypeId) orderTypeId = orderData.type_id?.toString();
                    if (!contractId) contractId = orderData.contract_id?.toString();
                }
            } catch (vError) {
                console.warn('Could not fetch order data for orderTypeId/contractId', vError);
            }
        }

        let assetTypeId: string | undefined;
        try {
            const { data: assetData } = await supabase
                .from('assets')
                .select('type_id')
                .eq('id', data.asset_id)
                .single();
            if (assetData) {
                assetTypeId = assetData.type_id?.toString();
            }
        } catch (e) {
            console.warn('Could not fetch type_id from assets', e);
        }

        const ensureArray = (val: any): string[] => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.trim()) {
                if (val.startsWith('{') && val.endsWith('}')) {
                    return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                }
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    return [val];
                }
            }
            return [];
        };

        const beforeFiles = ensureArray(data.before_img_files_names);
        const afterFiles = ensureArray(data.after_img_files_names);

        return {
            id: data.id.toString(),
            ovId: data.ov_id.toString(),
            assetId: data.asset_id.toString(),
            code: data.code,
            description: data.description,
            brand: data.brand,
            model: data.model,
            serial: data.serial,
            assetTypeId: assetTypeId,
            location: data.location,
            beforeUnitId: data.before_unit_id?.toString(),
            afterUnitId: data.after_unit_id?.toString(),
            beforeUnitAssetTagId: data.before_unit_asset_tag_id?.toString(),
            beforeStatusId: data.before_status_id?.toString(),
            afterStatusId: data.after_status_id?.toString(),
            beforeLocation: data.before_location,
            afterLocation: data.after_location,
            beforePriorityId: data.before_priority_id,
            isMoved: data.is_moved,
            beforeClientId: data.before_client_id?.toString(),
            afterClientId: data.after_client_id?.toString(),
            afterUnitAssetTagId: data.after_unit_asset_tag_id?.toString(),
            isFiled: data.is_filed,
            beforeUnitDescription: data.before_unit_description,
            afterUnitDescription: data.after_unit_description,
            beforeStatusDescription: data.before_status_description,
            afterStatusDescription: data.after_status_description,
            beforeTagDescription: data.before_tag_description,
            beforeTagSubDescription: data.before_tag_sub_description,
            afterUnitAssetTagDescription: data.after_unit_asset_tag_description,
            beforeStatusAt: data.before_status_at,
            createdAt: data.reported_at,
            processingId: data.processing_id,
            disapprovedNotes: data.disapproved_notes,
            // Extended fields for OrderVisitAssetCardDetail
            afterTagDescription: data.after_tag_description,
            afterTagSubDescription: data.after_tag_sub_description,
            afterStatusAt: data.after_status_at,
            afterStatusColor: data.status_color,
            clientName: data.client_name,
            beforeClientName: data.before_client_name || data.client_name,
            afterClientName: data.after_client_name,

            beforeComments: data.before_comments,
            afterComments: data.after_comments,

            oTeamLeaderNameShort: data.o_team_leader_name_short,
            ovMask: data.ov_mask,
            orderMask: data.order_mask,

            oCompanyId: oCompanyId,

            beforeImgFilesNames: beforeFiles,
            afterImgFilesNames: afterFiles,
            initialPhotoUrls: beforeFiles.map((name: string) =>
                this.getPublicImageUrl(data.before_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, name)
            ),
            finalPhotoUrls: afterFiles.map((name: string) =>
                this.getPublicImageUrl(data.after_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, name)
            ),
            imgUrl: beforeFiles.length > 0 ?
                this.getPublicImageUrl(data.before_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, beforeFiles[0]) : undefined,
            afterImgUrl: afterFiles.length > 0 ?
                this.getPublicImageUrl(data.after_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, afterFiles[0]) : undefined,
            movedComments: data.moved_comments,
            beforeTagId: data.before_tag_id?.toString(),
            afterTagId: data.after_tag_id?.toString(),
            beforeTagSubId: data.before_tag_sub_id?.toString(),
            afterTagSubId: data.after_tag_sub_id?.toString(),
            afterPriorityId: data.after_priority_id,
            clientId: data.client_id?.toString(),
            orderTypeId: orderTypeId,
            oContractId: contractId,
            maintenancePlanId: data.maintenance_plan_id?.toString()
        };


    },

    async updateOrderVisitAsset(id: string, updates: Partial<{
        before_comments: string;
        after_comments: string;
        before_recorder: number;
        after_recorder: number;
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
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error updating order visit asset:', error);
            throw error;
        }
    },

    async reportedOrderVisitAsset(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                processing_id: 2,
                reported_user_id: userId,
                reported_at: new Date().toISOString(),
                disapproved_user_id: null,
                disapproved_at: null,
                disapproved_notes: null
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error reporting order visit asset:', error);
            throw error;
        }

        // Sync counters
        const visitId = await this.getOrderVisitIdByAssetId(id);
        if (visitId) await this.syncOrderVisitAssetsProcessing(visitId);
    },

    async disapproveOrderVisitAsset(id: string, userId: string, notes: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                processing_id: 4,
                disapproved_user_id: userId,
                disapproved_at: new Date().toISOString(),
                disapproved_notes: notes
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error disapproving order visit asset:', error);
            throw error;
        }

        // Sync counters
        const visitId = await this.getOrderVisitIdByAssetId(id);
        if (visitId) await this.syncOrderVisitAssetsProcessing(visitId);
    },

    async updateOrderVisitAssetProcessingStatus(id: string, processingId: number, userId: string): Promise<void> {
        const updates: any = {
            processing_id: processingId
        };
        
        let shouldApplyMovement = false;
        let assetUpdates: any = null;
        let targetAssetId: number | null = null;

        if (processingId === 5) {
            updates.approved_user_id = userId;
            updates.approved_at = new Date().toISOString();
            
            // Verificamos a movimentação
            const { data: ovaData } = await supabase
                .from('orders_visits_assets')
                .select('is_moved, asset_id, ov_id, after_status_id, after_unit_id, after_tag_id, after_tag_sub_id, after_unit_asset_tag_id, after_priority_id, moved_comments')
                .eq('id', parseInt(id))
                .single();
                
            if (ovaData?.is_moved && ovaData?.asset_id) {
                shouldApplyMovement = true;
                targetAssetId = ovaData.asset_id;
                
                const { data: vVisit } = await supabase
                    .from('v_orders_visits')
                    .select('ov_ended_at')
                    .eq('id', ovaData.ov_id)
                    .single();
                    
                assetUpdates = {
                    status_id: ovaData.after_status_id,
                    status_at: vVisit?.ov_ended_at || new Date().toISOString(),
                    unit_id: ovaData.after_unit_id,
                    tag_id: ovaData.after_tag_id,
                    tag_sub_id: ovaData.after_tag_sub_id,
                    unit_asset_tag_id: ovaData.after_unit_asset_tag_id,
                    priority_id: ovaData.after_priority_id,
                    comments: ovaData.moved_comments
                };
                
                // Remove campos null/undefined para não apagar o que não mandamos atualizar
                Object.keys(assetUpdates).forEach(k => {
                    if (assetUpdates[k] === null || assetUpdates[k] === undefined) {
                        delete assetUpdates[k];
                    }
                });
            }
        }

        const { error } = await supabase
            .from('orders_visits_assets')
            .update(updates)
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error updating processing status:', error);
            throw error;
        }
        
        if (shouldApplyMovement && targetAssetId && assetUpdates && Object.keys(assetUpdates).length > 0) {
            const { error: assetError } = await supabase
                .from('assets')
                .update(assetUpdates)
                .eq('id', targetAssetId);
                
            if (assetError) {
                console.error('Error applying asset movement updates:', assetError);
                throw assetError;
            }
        }

        // Sync counters
        const visitId = await this.getOrderVisitIdByAssetId(id);
        if (visitId) await this.syncOrderVisitAssetsProcessing(visitId);
    },

    async uploadOrderVisitAssetPhoto(ovAssetId: string, file: File, type: 'before' | 'after'): Promise<{ path: string, filename: string }> {
        // Importar r2Service dinamicamente
        // r2Service is now static


        const fileExt = file.name.split('.').pop();
        // Add random suffix to prevent duplicate names when uploading multiple files simultaneously
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `${type}_${Date.now()}_${randomSuffix}.${fileExt}`;

        // 1. Fetch current record to get metadata and current lists
        // Note: Fetching from table directly to avoid view lag
        const { data: assetData, error: fetchError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id, asset_id, before_img_files_names, after_img_files_names')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (fetchError || !assetData) throw fetchError || new Error('Asset report not found');

        // Fetch companyId from visit view (o_company_id is a view field, not in the base table)
        let companyId: any = null;
        if (assetData.ov_id) {
            const { data: visitData } = await supabase
                .from('v_orders_visits')
                .select('o_provider_company_id')
                .eq('id', assetData.ov_id)
                .single();
            companyId = visitData?.o_provider_company_id;
        }

        // Fallback: try to get company from the asset record via assets table
        if (!companyId && assetData.asset_id) {
            const { data: assetInfo } = await supabase
                .from('assets')
                .select('company_owner_id')
                .eq('id', assetData.asset_id)
                .single();
            companyId = assetInfo?.company_owner_id;
        }

        if (!companyId) throw new Error('Company ID not found for asset path');

        const column = type === 'before' ? 'before_img_files_names' : 'after_img_files_names';
        const pathColumn = type === 'before' ? 'before_img_file_path' : 'after_img_file_path';

        const assetId = assetData.asset_id;
        const currentList = assetData[column] || [];
        const newList = [...currentList, fileName];

        //  Estrutura ajustada: companies/{companyId}/assets/{assetId}/ (Raiz)
        const folderPath = `companies/${companyId}/assets/${assetId}`;
        const fullPath = `${folderPath}/${fileName}`;

        // 2. Upload to Cloudflare R2
        try {
            // r2Service is now static

            await r2Service.uploadFile(file, fullPath);
        } catch (uploadError) {
            console.error('Error uploading to R2:', uploadError);
            throw uploadError;
        }

        const { error: dbError } = await supabase
            .from('orders_visits_assets')
            .update({
                [column]: newList,
                [pathColumn]: folderPath,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(ovAssetId));

        if (dbError) {
            console.error('Error updating asset image list:', dbError);
            throw dbError;
        }

        return { path: folderPath, filename: fileName };
    },

    async removeOrderVisitAssetPhoto(ovAssetId: string, type: 'before' | 'after', fileName: string): Promise<void> {
        // 1. Fetch current list
        const column = type === 'before' ? 'before_img_files_names' : 'after_img_files_names';
        const { data: current, error: fetchError } = await supabase
            .from('orders_visits_assets')
            .select(column)
            .eq('id', parseInt(ovAssetId))
            .single();

        if (fetchError || !current) throw fetchError || new Error('Asset report not found');

        // 2. Filter out the specific file
        const currentList: string[] = (current as any)[column] || [];
        const newList = currentList.filter(f => f !== fileName);

        // 3. Update DB
        const pathColumn = type === 'before' ? 'before_img_file_path' : 'after_img_file_path';

        const { error: dbError } = await supabase
            .from('orders_visits_assets')
            .update({
                [column]: newList,
                [pathColumn]: newList.length > 0 ? undefined : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(ovAssetId));

        if (dbError) {
            console.error('Error removing asset photo from list:', dbError);
            throw dbError;
        }
    },


    async getOrderVisitIdByAssetId(assetId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('orders_visits_assets')
            .select('ov_id')
            .eq('id', parseInt(assetId))
            .single();

        if (error) {
            console.error('Error fetching ov_id by assetId:', error);
            return null;
        }
        return data?.ov_id?.toString() || null;
    },

    /**
     * Sincroniza todos os contadores de ativos na visita
     * @param visitId ID da visita
     */
    async syncOrderVisitAssetsProcessing(visitId: string): Promise<void> {
        // 1. Get visit is_filed status
        const { data: visit, error: vErr } = await supabase
            .from('orders_visits')
            .select('ov_is_filed')
            .eq('id', parseInt(visitId))
            .single();

        if (vErr || !visit) {
            console.error('Error fetching visit for asset sync:', vErr);
            return;
        }

        // 2. Only process if not filed
        if (visit.ov_is_filed) return;

        // 3. Get all assets for this visit
        const { data: assets, error: aErr } = await supabase
            .from('orders_visits_assets')
            .select('processing_id, is_filed')
            .eq('ov_id', parseInt(visitId));

        if (aErr) {
            console.error('Error fetching assets for counter update:', aErr);
            return;
        }

        // 4. Calculate counters with type safety
        const stats = {
            ov_assets_amount: assets.length,
            ov_assets_draft_amount: assets.filter(a => Number(a.processing_id) === 1).length,
            ov_assets_reported_amount: assets.filter(a => Number(a.processing_id) === 2).length,
            ov_assets_revised_amount: assets.filter(a => Number(a.processing_id) === 3).length,
            ov_assets_disapproved_amount: assets.filter(a => Number(a.processing_id) === 4).length,
            ov_assets_approved_no_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !a.is_filed).length,
            ov_assets_approved_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !!a.is_filed).length,
        };

        // 5. Update visit
        const { error: uErr } = await supabase
            .from('orders_visits')
            .update(stats)
            .eq('id', parseInt(visitId));

        if (uErr) {
            console.error('Error updating visit assets counters:', uErr);
        }
    },

    /**
     * @deprecated Use syncOrderVisitAssetsProcessing instead
     */
    async updateVisitAssetsAmount(visitId: string): Promise<void> {
        return this.syncOrderVisitAssetsProcessing(visitId);
    },

    async addAssetToOrderVisit(visitId: string, assetId: string, userId: string): Promise<void> {
        // 1. Fetch asset details
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('*')
            .eq('id', assetId)
            .single();

        if (assetError || !asset) {
            console.error('Error fetching asset details:', assetError);
            throw new Error('Asset not found');
        }

        // 2. Fetch order details from v_orders_visits (view) to get o_id and op_id
        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('o_id, op_id')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            console.error('Error fetching visit details:', visitError);
            throw new Error('Visit not found');
        }

        // 3. Prepare payload
        const payload = {
            ov_id: parseInt(visitId),
            asset_id: parseInt(assetId),

            // After values (current asset state at time of insertion)
            after_unit_id: asset.unit_id,
            after_unit_asset_tag_id: asset.unit_asset_tag_id,
            after_tag_id: asset.tag_id,
            after_tag_sub_id: asset.tag_sub_id,
            after_status_id: asset.status_id,
            after_status_at: asset.status_at,
            after_priority_id: asset.priority_id,
            after_client_id: asset.client_id,
            after_location: asset.location,

            // Before values
            before_unit_id: asset.unit_id,
            before_unit_asset_tag_id: asset.unit_asset_tag_id,
            before_tag_id: asset.tag_id,
            before_tag_sub_id: asset.tag_sub_id,
            before_status_id: asset.status_id,
            before_status_at: asset.status_at,
            before_priority_id: asset.priority_id,
            before_client_id: asset.client_id,
            before_location: asset.location,

            is_moved: false,
            processing_id: 1,
            created_user_id: parseInt(userId),
            created_at: new Date().toISOString(),
            o_id: visit.o_id,
            op_id: visit.op_id
        };

        const { error } = await supabase
            .from('orders_visits_assets')
            .insert(payload);

        if (error) {
            console.error('Error adding asset to visit:', error);
            throw error;
        }

        // 4. Update ov_assets_amount in orders_visits
        await this.updateVisitAssetsAmount(visitId);
    },

    async removeAssetFromOrderVisit(ovaId: string): Promise<void> {
        // r2Service is now static


        // 1. Fetch current record to get metadata for storage deletion AND visitId
        const { data: ova, error: fetchError } = await supabase
            .from('v_orders_visits_assets')
            .select('o_company_id, asset_id, before_img_files_names, after_img_files_names, ov_id')
            .eq('id', parseInt(ovaId))
            .single();

        if (fetchError || !ova) {
            console.error('Error fetching asset record for removal:', fetchError);
            throw fetchError || new Error('Asset record not found');
        }

        const folderPath = `companies/${ova.o_company_id}/${ova.asset_id}`;

        // 2. Storage Cleanup R2: before_img_files_names
        const beforePhotos = ova.before_img_files_names || [];
        if (beforePhotos.length > 0) {
            const pathsToDel = beforePhotos.map((name: string) => `${folderPath}/${name}`);
            try {
                await r2Service.deleteFiles(pathsToDel);
            } catch (e) {
                console.warn('Could not delete before photos from R2:', e);
            }
        }

        // 3. Storage Cleanup R2: after_img_files_names
        const afterPhotos = ova.after_img_files_names || [];
        if (afterPhotos.length > 0) {
            const pathsToDel = afterPhotos.map((name: string) => `${folderPath}/${name}`);
            try {
                await r2Service.deleteFiles(pathsToDel);
            } catch (e) {
                console.warn('Could not delete after photos from R2:', e);
            }
        }

        // 4. orders_visits_assets_activities
        const { error: actError } = await supabase
            .from('orders_visits_assets_activities')
            .delete()
            .eq('ova_id', parseInt(ovaId));
        if (actError) {
            console.error('Error deleting asset activities:', actError);
            throw actError;
        }

        // 5. orders_visits_assets_materials
        const { error: matError } = await supabase
            .from('orders_visits_assets_materials')
            .delete()
            .eq('ova_id', parseInt(ovaId));
        if (matError) {
            console.error('Error deleting asset materials:', matError);
            throw matError;
        }

        // 6. orders_visits_assets
        const { error: ovaError } = await supabase
            .from('orders_visits_assets')
            .delete()
            .eq('id', parseInt(ovaId));

        if (ovaError) {
            console.error('Error removing asset main record:', ovaError);
            throw ovaError;
        }

        // 7. Update ov_assets_amount in orders_visits
        await this.updateVisitAssetsAmount(ova.ov_id.toString());
    },

    async removeVehicleFromOrderVisit(visitVehicleId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_vehicles')
            .delete()
            .eq('id', visitVehicleId);

        if (error) {
            console.error('Error removing vehicle from visit:', error);
            throw error;
        }
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
        // 1. Buscar detalhes do novo ativo (incluindo client_id via join se possível ou via assets)
        const { data: asset, error: assetError } = await supabase
            .from('v_assets')
            .select('*')
            .eq('id', newAssetId)
            .single();

        if (assetError || !asset) {
            console.error('Error fetching new asset details:', assetError);
            throw new Error('Novo ativo não encontrado no sistema.');
        }

        // 2. Buscar o registro atual para pegar o ov_id e asset_id antigo (para atualizar materiais)
        const { data: oldOva, error: oldError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id, asset_id')
            .eq('id', parseInt(ovaId))
            .single();

        if (oldError || !oldOva) {
            throw new Error('Registro de relatório original não encontrado.');
        }

        const oldAssetId = oldOva.asset_id;

        // 3. Preparar o payload de atualização
        // Mantemos before_img_file_path e after_img_file_path para preservar as fotos
        const updates = {
            asset_id: parseInt(newAssetId),

            // Novos dados cadastrais (Origem)
            before_unit_id: asset.unit_id,
            before_tag_id: asset.tag_id,
            before_tag_sub_id: asset.tag_sub_id,
            before_status_id: asset.status_id,
            before_status_at: asset.status_at,
            before_priority_id: asset.priority_id,
            before_unit_asset_tag_id: asset.unit_asset_tag_id,
            before_client_id: asset.client_id, // v_assets mapeia o client_id

            is_moved: false,
            moved_comments: null,

            // Novos dados cadastrais (Destino inicializado igual à origem)
            after_unit_id: asset.unit_id,
            after_tag_id: asset.tag_id,
            after_tag_sub_id: asset.tag_sub_id,
            after_status_id: asset.status_id,
            after_status_at: asset.status_at,
            after_priority_id: asset.priority_id,
            after_unit_asset_tag_id: asset.unit_asset_tag_id,
            after_client_id: asset.client_id,
            after_location: asset.location,

            updated_at: new Date().toISOString(),
            updated_user_id: parseInt(userId)
        };

        const { error: updateError } = await supabase
            .from('orders_visits_assets')
            .update(updates)
            .eq('id', parseInt(ovaId));

        if (updateError) {
            console.error('Error updating orders_visits_assets during swap:', updateError);
            throw updateError;
        }

        // 4. Atualizar materiais vinculados para o novo asset_id (se houver)
        const { error: matError } = await supabase
            .from('orders_visits_assets_materials')
            .update({ asset_id: parseInt(newAssetId) })
            .eq('ov_id', oldOva.ov_id)
            .eq('asset_id', oldAssetId)
            .eq('ova_id', parseInt(ovaId)); // Filtramos por ova_id para ser bem específico se possível

        if (matError) {
            console.error('Error updating materials asset_id during swap:', matError);
            // Não bloqueamos o sucesso total por causa dos materiais, mas logamos
        }
    },

    async updateVehicleKm(visitVehicleId: string, kmInitial?: number | null, kmFinal?: number | null): Promise<void> {
        const dbData: any = {};
        if (kmInitial !== undefined) dbData.recorder_start = kmInitial;
        if (kmFinal !== undefined) dbData.recorder_end = kmFinal;
        dbData.updated_at = new Date().toISOString();

        console.log('Sending start update:', dbData);

        const { error } = await supabase
            .from('orders_visits_vehicles')
            .update(dbData)
            .eq('id', visitVehicleId);

        if (error) {
            console.error('Error updating vehicle km (attempt 1):', error);

            // Fallback: If migration failed, column might still be km_initial
            if (kmInitial !== undefined && error.message?.includes('recorder_start')) {
                console.log('Retrying with km_initial...');
                const fallbackData: any = { updated_at: new Date().toISOString() };
                fallbackData.km_initial = kmInitial;
                if (kmFinal !== undefined) fallbackData.recorder_end = kmFinal;

                const { error: error2 } = await supabase
                    .from('orders_visits_vehicles')
                    .update(fallbackData)
                    .eq('id', visitVehicleId);

                if (error2) throw error2; // Throw original or new error
                return; // Success on fallback
            }

            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT SERVICES (orders_visits_services)
    // -------------------------------------------------------------------------
    async getOrderVisitServices(visitId: string): Promise<OrderVisitService[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_services')
            .select('*')
            .eq('ov_id', visitId);

        if (error) {
            console.error('Error fetching order visit services:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            amount: Number(item.amount),
            valueUnit: Number(item.value_unit),
            discount: Number(item.discount || 0),
            valueTotal: Number(item.value_total),
            versionMode: item.version_mode,
            serviceDescription: item.description, // Mapped from 'description' in view
            serviceCode: item.code,               // Mapped from 'code' in view
            serviceUnit: item.unit                // Mapped from 'unit' in view
        }));
    },

    async addServiceToOrderVisit(visitId: string, contractServiceId: string, userId: string, amount: number = 1): Promise<void> {
        // First get the contract service details to copy values (discount, value_unit)
        const { data: cs } = await supabase
            .from('contracts_services')
            .select('value_unit, discount')
            .eq('id', contractServiceId)
            .single();

        const valueUnit = Number(cs?.value_unit || 0);
        const discount = Number(cs?.discount !== undefined ? cs.discount : 1);

        const { error } = await supabase
            .from('orders_visits_services')
            .insert({
                ov_id: parseInt(visitId),
                service_id: parseInt(contractServiceId), // service_id in ov_services maps to id in contracts_services
                amount: amount,
                value_unit: valueUnit,
                discount: discount,
                value_total: amount * valueUnit * (discount || 1), // Optional manual calc if DB doesn't have trigger
                created_user_id: parseInt(userId),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error adding service to visit:', error);
            throw error;
        }
    },

    async removeServiceFromOrderVisit(ovServiceId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_services')
            .delete()
            .eq('id', ovServiceId);

        if (error) {
            console.error('Error removing service from visit:', error);
            throw error;
        }
    },

    async updateOrderVisitService(ovServiceId: string, updates: { amount?: number; discount?: number }): Promise<void> {
        // Fetch current values to update total
        const { data: current } = await supabase
            .from('orders_visits_services')
            .select('amount, value_unit, discount')
            .eq('id', ovServiceId)
            .single();

        if (!current) return;

        const newAmount = updates.amount !== undefined ? updates.amount : Number(current.amount);
        const newDiscount = updates.discount !== undefined ? updates.discount : Number(current.discount);

        // Calculation: amount * value_unit * discount
        const valueTotal = newAmount * (current.value_unit || 0) * (newDiscount || 1);

        const { error } = await supabase
            .from('orders_visits_services')
            .update({
                amount: newAmount,
                discount: newDiscount,
                value_total: valueTotal,
                updated_at: new Date().toISOString(),
                updated_user_id: undefined // Could be added if needed
            })
            .eq('id', ovServiceId);

        if (error) {
            console.error('Error updating service:', error);
            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET ACTIVITIES (orders_visits_assets_activities)
    // -------------------------------------------------------------------------
    async getActivitiesByOrderType(orderTypeId: string): Promise<Activity[]> {
        // 1. Fetch bridge table records
        const { data: bridgeData, error: bridgeError } = await supabase
            .from('cfg_orders_types_activities')
            .select('activity_id')
            .eq('o_type_id', parseInt(orderTypeId))
            .eq('is_available', true);

        if (bridgeError || !bridgeData || bridgeData.length === 0) {
            if (bridgeError) console.error('Error fetching activities bridge:', bridgeError);
            return [];
        }

        const activityIds = bridgeData.map(b => b.activity_id);

        // 2. Fetch actual activities
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('cfg_activities')
            .select('*')
            .in('id', activityIds)
            .eq('is_available', true)
            .order('description', { ascending: true });

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
            return [];
        }

        return (activitiesData || []).map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            code: item.code,
            isAvailable: item.is_available
        }));
    },

    async getOrderVisitAssetActivities(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        // 1. Fetch bridge records
        const { data: bridgeData, error: bridgeError } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('is_deleted', false);

        if (bridgeError || !bridgeData || bridgeData.length === 0) {
            if (bridgeError) console.error('Error fetching asset activities bridge:', bridgeError);
            return [];
        }

        const activityIds = bridgeData.map(b => b.activity_id);

        // 2. Fetch activities to get descriptions
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('cfg_activities')
            .select('id, description, code')
            .in('id', activityIds);

        if (activitiesError) {
            console.error('Error fetching activities for descriptions:', activitiesError);
            return bridgeData.map((item: any) => ({
                id: item.id.toString(),
                orderVisitAssetId: item.order_visit_asset_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at
            }));
        }

        const activityMap = new Map(activitiesData.map(a => [a.id.toString(), a]));

        return bridgeData.map((item: any) => {
            const activity = activityMap.get(item.activity_id.toString());
            return {
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                activityDescription: activity?.description,
                activityCode: activity?.code,
                maintenancePlanId: item.maintenance_plan_id?.toString()
            };
        });
    },

    async toggleOrderVisitAssetActivity(ovAssetId: string, activityId: string, userId: string, isSelected: boolean): Promise<void> {
        if (isSelected) {
            // Check if it already exists (could be deleted)
            const { data: existing } = await supabase
                .from('orders_visits_assets_activities')
                .select('id')
                .eq('ova_id', parseInt(ovAssetId))
                .eq('activity_id', parseInt(activityId))
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('orders_visits_assets_activities')
                    .update({ is_deleted: false, updated_at: getBrazilTimestamp(), updated_user_id: parseInt(userId) })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('orders_visits_assets_activities')
                    .insert({
                        ova_id: parseInt(ovAssetId),
                        activity_id: parseInt(activityId),
                        created_user_id: parseInt(userId),
                        created_at: getBrazilTimestamp(),
                        is_deleted: false
                    });
            }
        } else {
            await supabase
                .from('orders_visits_assets_activities')
                .update({ is_deleted: true, updated_at: getBrazilTimestamp(), updated_user_id: parseInt(userId) })
                .eq('ova_id', parseInt(ovAssetId))
                .eq('activity_id', parseInt(activityId));
        }
    },

    async getOrderVisitAssetsActivitiesByVisit(visitId: string): Promise<OrderVisitAssetActivity[]> {
        // 1. Get all asset IDs for this visit
        const { data: assets, error: assetsError } = await supabase
            .from('orders_visits_assets')
            .select('id')
            .eq('ov_id', parseInt(visitId));

        if (assetsError || !assets || assets.length === 0) {
            if (assetsError) console.error('Error fetching assets for activities:', assetsError);
            return [];
        }

        const ovaIds = assets.map(a => a.id);

        // 2. Fetch all activities results for these ovaIds (WITHOUT JOINS to avoid PGRST200)
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .in('ova_id', ovaIds)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching activities records:', error);
            return [];
        }

        // 3. Fetch all cfg_activities to manual merge (to bypass broken FKs in cache)
        const activityIds = Array.from(new Set(data.map(item => item.activity_id)));
        const { data: cfgActivities, error: cfgError } = await supabase
            .from('cfg_activities')
            .select('id, description, code')
            .in('id', activityIds);

        const activitiesMap: Record<string, any> = (cfgActivities || []).reduce((acc, curr) => {
            acc[curr.id.toString()] = curr;
            return acc;
        }, {} as any);

        return (data || []).map((item: any) => {
            const activityInfo = activitiesMap[item.activity_id.toString()];
            return {
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                activityDescription: activityInfo?.description,
                activityCode: activityInfo?.code,
                status: item.status,
                comments: item.comments,
                imgFilePath: item.img_file_path,
                imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
                maintenancePlanId: item.maintenance_plan_id?.toString()
            };
        });
    },

    async getOrderVisitAssetsMaterialsByVisit(visitId: string): Promise<OrderVisitAssetMaterial[]> {
        // 1. Get all asset IDs for this visit
        const { data: assets, error: assetsError } = await supabase
            .from('orders_visits_assets')
            .select('id')
            .eq('ov_id', parseInt(visitId));

        if (assetsError || !assets || assets.length === 0) {
            if (assetsError) console.error('Error fetching assets for materials:', assetsError);
            return [];
        }

        const ovaIds = assets.map(a => a.id);

        // 2. Fetch materials records (WITHOUT JOINS)
        const { data, error } = await supabase
            .from('orders_visits_assets_materials')
            .select('*')
            .in('ova_id', ovaIds)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching materials records:', error);
            return [];
        }

        // 3. Fetch materials catalog info for manual merge
        const materialIds = Array.from(new Set(data.map(item => item.material_id)));
        const { data: materialsCatalog, error: matError } = await supabase
            .from('materials')
            .select('*')
            .in('id', materialIds);
        
        const materialsMap: Record<string, any> = (materialsCatalog || []).reduce((acc, curr) => {
            acc[curr.id.toString()] = curr;
            return acc;
        }, {} as any);

        return (data || []).map((item: any) => {
            const matInfo = materialsMap[item.material_id.toString()];
            return {
                id: item.id.toString(),
                ovaId: item.ova_id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                materialId: item.material_id.toString(),
                amount: item.amount,
                valueUnit: item.value_unit,
                discount: item.discount,
                valueTotal: item.value_total,
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                materialDescription: matInfo?.description,
                materialCode: matInfo?.code,
                materialUnit: matInfo?.unit
            };
        });
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET MATERIALS (orders_visits_assets_materials)
    // -------------------------------------------------------------------------
    async getAvailableMaterials(search: string = '', page: number = 0, pageSize: number = 20, providerCompanyId?: string): Promise<Material[]> {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        // Utilizamos a view v_materials para trazer os materiais já filtrados e estruturados
        let query = supabase
            .from('v_materials')
            .select('*')
            .order('description', { ascending: true })
            .range(from, to);

        if (providerCompanyId) {
            query = query.eq('provider_company_id', parseInt(providerCompanyId));
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching materials catalog from v_materials:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            code: item.code,
            description: item.description,
            unit: item.unit,
            defaultValue: item.price_unit || item.value_unit || 0,
            isAvailable: true 
        }));
    },

    async getOrderVisitAssetMaterials(ovAssetId: string): Promise<OrderVisitAssetMaterial[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_assets_materials')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId));

        if (error) {
            console.error('Error fetching asset materials:', error);
            return [];
        }

        if (data && data.length > 0) {
            console.log('DEBUG: First material record from view:', JSON.stringify(data[0], null, 2));
        }

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            ovaId: item.ova_id?.toString(),
            materialId: item.material_id?.toString(),
            amount: item.amount || 0,
            valueUnit: item.value_unit || 0,
            valueTotal: item.value_total || 0,
            discount: item.discount || 0,
            isDeleted: !!item.is_deleted || !!item.is_deteted, // Handle both just in case
            createdUserId: item.created_user_id?.toString(),

            createdAt: item.created_at,
            // Check both aliased and original column names just in case
            materialDescription: item.material_description || item.description || 'Sem descrição',
            materialCode: item.material_code || item.code || '---',
            materialUnit: item.material_unit || item.unit || 'un'
        }));
    },

    async addMaterialToAsset(ovAssetId: string, materialId: string, amount: number, valueUnit: number, userId: string): Promise<void> {
        // 1. Get the visit ID (ov_id) and asset original ID (asset_id) first
        const { data: ova, error: ovaError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id, asset_id')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (ovaError) {
            console.error('Error fetching asset visit info:', ovaError);
            throw ovaError;
        }

        // 2. Perform insert with ova_id, ov_id and asset_id
        const { error } = await supabase
            .from('orders_visits_assets_materials')
            .insert({
                ova_id: parseInt(ovAssetId),
                ov_id: ova.ov_id,
                asset_id: ova.asset_id, // Mandatory column in some versions of the schema
                material_id: parseInt(materialId),
                amount: amount,
                value_unit: valueUnit,
                created_user_id: parseInt(userId),
                is_deleted: false
            });

        if (error) throw error;
    },

    async updateMaterialInAsset(id: string, updates: { amount?: number, discount?: number, valueUnit?: number }): Promise<void> {
        const payload: any = {};
        if (updates.amount !== undefined) payload.amount = updates.amount;
        if (updates.discount !== undefined) payload.discount = updates.discount;
        if (updates.valueUnit !== undefined) payload.value_unit = updates.valueUnit;

        // Ensure record is active if we are updating it
        // Check if is_deteted exists in schema based on error, but trying is_deleted as requested
        payload.is_deleted = false;

        const { error } = await supabase
            .from('orders_visits_assets_materials')
            .update(payload)
            .eq('id', parseInt(id));

        if (error) throw error;
    },

    async removeMaterialFromAsset(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets_materials')
            .update({ is_deleted: true, updated_at: getBrazilTimestamp(), updated_user_id: parseInt(userId) })
            .eq('id', parseInt(id));

        if (error) throw error;
    },

    // PERMISSIONS MANAGEMENT
    async getCompanyProfiles(companyId: string): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('cfg_profiles')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            description: item.description,
            isAvailable: item.is_available,
            createdAt: item.created_at
        })) as Profile[];
    },

    async getAllRoutes(): Promise<Route[]> {
        const { data, error } = await supabase
            .from('cfg_routes')
            .select('*')
            .eq('is_available', true)
            .order('order_index');

        if (error) {
            console.error('Error fetching routes:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            description: item.description,
            icon: item.icon,
            parentId: item.parent_id?.toString(),
            orderIndex: item.order_index,
            isAvailable: item.is_available
        })) as Route[];
    },

    async getUserPermissions(userId: string): Promise<Permission[]> {
        console.log(`[DataService] Fetching perms for user:`, userId);
        const { data, error } = await supabase
            .rpc('fc_get_user_permissions', { p_user_id: parseInt(userId) });

        if (error) {
            console.error('Error fetching user permissions:', error);
            return [];
        }

        console.log(`[DataService] RPC returned ${data?.length || 0} permissions`);

        return data.map((item: any) => ({
            id: '0', // Not relevant for user permission check
            profileId: '0', // Not relevant
            routeId: item.route_id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            routeDescription: item.route_description,
            canView: !!item.can_view,
            canCreate: !!item.can_create,
            canEdit: !!item.can_edit,
            canDelete: !!item.can_delete,
            canSearch: !!item.can_search
        })) as Permission[];
    },

    async getProfilePermissions(profileId: string): Promise<Permission[]> {
        const { data, error } = await supabase
            .rpc('fc_get_profile_permissions', { p_profile_id: parseInt(profileId) });

        if (error) {
            console.error('Error fetching profile permissions:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.permission_id?.toString() || '0',
            profileId: profileId,
            routeId: item.route_id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            routeDescription: item.route_description,
            canView: !!item.can_view,
            canCreate: !!item.can_create,
            canEdit: !!item.can_edit,
            canDelete: !!item.can_delete,
            canSearch: item.can_search !== undefined ? !!item.can_search : true
        })) as Permission[];
    },

    async updateProfilePermissions(profileId: string, permissions: any[]): Promise<void> {
        console.log(`[DataService] Updating permissions for profile ${profileId}`, permissions);
        const routesJson = permissions.map(p => ({
            route_id: parseInt(p.routeId),
            can_view: !!p.canView,
            can_create: !!p.canCreate,
            can_edit: !!p.canEdit,
            can_delete: !!p.canDelete,
            can_search: p.canSearch !== undefined ? !!p.canSearch : true
        }));

        const { error } = await supabase
            .rpc('fc_update_profile_routes', {
                p_profile_id: parseInt(profileId),
                p_routes: routesJson
            });

        if (error) {
            console.error('Error updating profile permissions:', error);
            throw error;
        }
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
        // 1. Validate Vehicles
        const { data: vehicles, error: vehError } = await supabase
            .from('orders_visits_vehicles')
            .select('*')
            .eq('ov_id', visitId);

        if (vehError) throw vehError;

        if (vehicles && vehicles.length > 0) {
            // Check if any vehicle has invalid recorder data
            const hasInvalid = vehicles.some(v =>
                v.recorder_start === null ||
                v.recorder_end === null ||
                Number(v.recorder_start) >= Number(v.recorder_end)
            );

            if (hasInvalid) {
                // "abrir uma notificação informando que há registros de veiculos sem finalização"
                throw new Error('Existem veículos com apontamento inválido ou incompleto (Km Inicial >= Km Final).');
            }
        }

        const timestamp = getBrazilTimestamp();

        // 2. Update Order Visit
        const visitUpdate: any = {
            ov_ended_at: timestamp,
            ov_status_id: 2, // Encerrada
            ov_o_status_id: statusId,
            ov_o_progress: statusId === 8 ? 1 : (progress / 100)
        };

        if (statusId === 6 && suspendedReasonId) { // Suspended
            visitUpdate.ov_o_suspended_reason_id = parseInt(suspendedReasonId);
        }

        const { error: visitUpdateError } = await supabase
            .from('orders_visits')
            .update(visitUpdate)
            .eq('id', visitId);
        if (visitUpdateError) throw visitUpdateError;

        // 3. Update Order
        const orderUpdate: any = {
            status_id: statusId,
            status_at: timestamp,
            progress: statusId === 8 ? 1 : (progress / 100)
        };

        if (statusId === 6 && suspendedReasonId) {
            orderUpdate.cause_reason_id = parseInt(suspendedReasonId);
        }

        // We update and select parent_id for next step
        const { data: order, error: orderUpdateError } = await supabase
            .from('orders')
            .update(orderUpdate)
            .eq('id', orderId)
            .select('parent_id, order_mask, requested_services, client_id, unit_id, asset_tag_id, asset_tag_sub_id')
            .single();

        if (orderUpdateError) throw orderUpdateError;

        // 3.1 Se for uma OS filha, atualiza a situação da SS pai
        if (order && order.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }

        // 4. Release Team
        const { data: team } = await supabase
            .from('orders_visits_teams')
            .select('user_id')
            .eq('ov_id', visitId);

        if (team && team.length > 0) {
            const userIds = team.map(t => t.user_id);
            const { error: usersError } = await supabase
                .from('users')
                .update({
                    is_available: true,
                    ov_in_progress_leader_id: 0,
                    o_contract_id_in_progress: 0,
                    o_type_id_in_progress: 0,
                    o_type_sub_id_in_progress: 0,
                    o_plan_id_in_progress: 0,
                    o_asset_tag_id_in_progress: 0,
                    o_unit_id_in_progress: 0,
                    o_system_id_in_progress: 0,
                    o_system_parent_id_in_progress: 0,
                    o_unit_type_id_in_progress: 0,
                    o_unit_type_parent_id_in_progress: 0,
                    o_object_id_in_progress: 0,
                    ov_id_in_progress: 0,
                    o_id_in_progress: 0,
                    op_id_in_progress: 0,
                    is_ov_in_progress: false,
                    ov_id_in_progress_mask: null,
                    updated_at: timestamp
                })
                .in('id', userIds);

            if (usersError) throw usersError;
        }

        // 5. Notifications
        // "orders_followers.o_id = orders.parent_id"
        if (order && order.parent_id) {
            const { data: followers } = await supabase
                .from('orders_followers')
                .select('user_id')
                .eq('o_id', order.parent_id);

            if (followers && followers.length > 0) {
                // Fetch details for message construction
                // We use parallel fetches for efficiency
                const [clientRes, unitRes, tagRes, tagSubRes, followerUsersRes] = await Promise.all([
                    supabase.from('v_companies').select('name:description').eq('id', order.client_id).single(),
                    supabase.from('units').select('description').eq('id', order.unit_id).single(),
                    order.asset_tag_id ? supabase.from('cfg_assets_tags').select('description').eq('id', order.asset_tag_id).single() : { data: null },
                    order.asset_tag_sub_id ? supabase.from('cfg_assets_tags_subs').select('description').eq('id', order.asset_tag_sub_id).single() : { data: null },
                    supabase.from('users').select('id, mobile_whatsapp').in('id', followers.map(f => f.user_id))
                ]);

                const clientName = clientRes.data?.name || 'N/A';
                const unitDesc = unitRes.data?.description || 'N/A';
                const assetTag = tagRes.data?.description || '';
                const assetTagSub = tagSubRes.data?.description || '';
                const followerUsers = followerUsersRes.data || [];

                const notifications = followers.map(f => {
                    const fUser = followerUsers.find(u => u.id === f.user_id);
                    return {
                        user_id_to: f.user_id,
                        user_id_from: user.id,
                        title: 'Visita encerrada.',
                        body: `${user.nameShort || user.nameFull} encerrou a visita:\nOS ${order.order_mask}: ${statusDescription}\nCliente: ${clientName}\nUnidade: ${unitDesc}\nSetor/Posição: ${assetTag}${assetTagSub ? '/' + assetTagSub : ''}\nServicos a realizar: ${order.requested_services || ''}`,
                        type: 'Visita encerrada',
                        created_at: timestamp,
                        is_read: false,
                        user_to_whatsapp: fUser?.mobile_whatsapp
                    };
                });

                await supabase.from('users_notifications').insert(notifications);
            }
        }
    },

    async getOrdersVisitsServicesMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_services')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk services:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsMaterialsMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_assets_materials')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk materials:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsVehiclesMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_vehicles')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk vehicles:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsAssetsMovedMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_assets')
            .select('id, is_moved, asset_id, asset_type_id, asset_type_description')
            .in('ov_id', ovIds)
            .eq('is_moved', true);

        if (error) {
            console.error('Error fetching moved assets:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            isMoved: item.is_moved,
            assetTypeId: item.asset_type_id,
            assetTypeDescription: item.asset_type_description || 'N/A'
        }));
    },

    /**
     * Busca o histórico completo de uma Solicitação de Serviço (SS).
     * Compila criação da OS, visitas e todas as intervenções realizadas.
     */
    async getServiceOrderHistory(orderId: string | number): Promise<ServiceHistoryItem[]> {
        const history: ServiceHistoryItem[] = [];
        const orderIdInt = typeof orderId === 'number' ? orderId : parseInt(orderId);

        try {
            // 1. Get Order details (Initial creation)
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select(`
                    id, created_at, parent_id,
                    status:cfg_orders_statuses(description, color),
                    user:users(name_short, name_full)
                `)
                .eq('id', orderIdInt)
                .single();

            if (order && !orderError) {
                const typeLabel = order.parent_id ? 'OS' : 'SS';
                // Handle joined data which might come as arrays from Supabase
                const statusInfo = Array.isArray(order.status) ? (order.status[0] as any) : (order.status as any);
                const userInfo = Array.isArray(order.user) ? (order.user[0] as any) : (order.user as any);

                history.push({
                    id: `creation-${order.id}`,
                    title: `${typeLabel} Criada`,
                    date: order.created_at,
                    type: 'created',
                    userName: userInfo?.name_short || userInfo?.name_full,
                    description: `Solicitação registrada com status inicial: ${statusInfo?.description || 'Aberto'}`,
                    statusName: statusInfo?.description,
                    statusColor: statusInfo?.color
                });
            } else if (orderError) {
                console.warn('History: Could not fetch order details:', orderError);
            }

            // 2. Get all visits for this order
            const { data: visits, error: visitsError } = await supabase
                .from('v_orders_visits')
                .select('id, ov_mask, ov_started_at, ov_ended_at, ov_team_leader_name_short, ov_status_description')
                .eq('o_id', orderIdInt)
                .order('ov_started_at', { ascending: true });

            if (visitsError) {
                console.warn('History: Error fetching visits:', visitsError);
            }

            if (visits && visits.length > 0) {
                for (const visit of visits) {
                    // Event: Visit Started
                    if (visit.ov_started_at) {
                        history.push({
                            id: `v-start-${visit.id}`,
                            title: 'Visita Iniciada',
                            date: visit.ov_started_at,
                            type: 'visit_started',
                            visitMask: visit.ov_mask,
                            userName: visit.ov_team_leader_name_short,
                            description: 'A equipe técnica iniciou os trabalhos na unidade.'
                        });
                    }

                    // Event: Visit Ended
                    if (visit.ov_ended_at) {
                        history.push({
                            id: `v-end-${visit.id}`,
                            title: 'Visita Finalizada',
                            date: visit.ov_ended_at,
                            type: 'visit_ended',
                            visitMask: visit.ov_mask,
                            userName: visit.ov_team_leader_name_short,
                            description: `Visita encerrada com status final: ${visit.ov_status_description || 'Concluída'}`
                        });
                    }

                    // Interventions (Activities)
                    const { data: activities } = await supabase
                        .from('orders_visits_assets_activities')
                        .select(`
                            id,
                            created_at,
                            activity:cfg_activities(description, code),
                            ova:orders_visits_assets!ova_id!inner(
                                asset:assets(code, description)
                            ),
                            user:users(name_short, name_full)
                        `)
                        .eq('ova.ov_id', visit.id)
                        .eq('is_deleted', false);

                    if (activities && activities.length > 0) {
                        activities.forEach((act: any) => {
                            const actUserInfo = Array.isArray(act.user) ? act.user[0] : act.user;
                            const activityInfo = Array.isArray(act.activity) ? act.activity[0] : act.activity;
                            const assetInfo = act.ova?.asset;

                            history.push({
                                id: `act-${act.id}`,
                                title: 'Intervenção Realizada',
                                date: act.created_at,
                                type: 'intervention',
                                description: activityInfo?.description,
                                userName: actUserInfo?.name_short || actUserInfo?.name_full,
                                assetCode: assetInfo?.code,
                                assetDescription: assetInfo?.description,
                                visitMask: visit.ov_mask
                            });
                        });
                    }

                    // Materials
                    const { data: materials } = await supabase
                        .from('orders_visits_assets_materials')
                        .select(`
                            id,
                            created_at,
                            amount,
                            material:materials(description, code, unit),
                            ova:orders_visits_assets!ova_id!inner(
                                asset:assets(code, description)
                            ),
                            user:users(name_short, name_full)
                        `)
                        .eq('ova.ov_id', visit.id)
                        .eq('is_deleted', false);

                    if (materials && materials.length > 0) {
                        materials.forEach((mat: any) => {
                            const matUserInfo = Array.isArray(mat.user) ? mat.user[0] : mat.user;
                            const materialInfo = Array.isArray(mat.material) ? mat.material[0] : mat.material;
                            const assetInfo = mat.ova?.asset;

                            history.push({
                                id: `mat-${mat.id}`,
                                title: 'Material Utilizado',
                                date: mat.created_at,
                                type: 'material',
                                description: `${mat.amount} ${materialInfo?.unit || 'un'} x ${materialInfo?.description}`,
                                userName: matUserInfo?.name_short || matUserInfo?.name_full,
                                assetCode: assetInfo?.code,
                                assetDescription: assetInfo?.description,
                                visitMask: visit.ov_mask
                            });
                        });
                    }
                }
            }

            // Final sort descendente (mais recentes primeiro)
            return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        } catch (error) {
            console.error('Error fetching service order history:', error);
        }

        // Sort by date descending
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    /**
     * Reporta uma visita, alterando o processing_id de 1 (Rascunho) para 2 (Reportada)
     * @param visitId ID da visita
     * @param userId ID do usuário que está reportando
     * @returns Promise<void>
     * @throws Error se a visita não estiver em rascunho ou se houver ativos não reportados
     */
    async reportOrderVisit(visitId: string, userId: string): Promise<void> {
        // 1. Verificar se a visita existe e está em rascunho (processing_id = 1) ou rejeitada (4)
        const { data: visit, error: visitError } = await supabase
            .from('orders_visits')
            .select('ov_processing_id')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            throw new Error('Visita não encontrada');
        }

        if (visit.ov_processing_id !== 1 && visit.ov_processing_id !== 4) {
            throw new Error('Apenas visitas em rascunho ou rejeitadas podem ser reportadas');
        }

        // 2. Verificar o status dos ativos baseado no estado da visita
        const { data: assets, error: assetsError } = await supabase
            .from('v_orders_visits_assets')
            .select('processing_id')
            .eq('ov_id', visitId);

        if (assetsError) {
            throw new Error('Erro ao verificar ativos da visita');
        }

        // Se houver ativos, aplicar a regra de validação
        if (assets && assets.length > 0) {
            if (visit.ov_processing_id === 1) {
                // Se a visita for rascunho, TODOS os ativos devem estar reportados (2)
                const hasUnreportedAssets = assets.some((asset: any) => asset.processing_id !== 2);
                if (hasUnreportedAssets) {
                    throw new Error('Todos os ativos devem estar reportados antes de reportar a visita');
                }
            } else if (visit.ov_processing_id === 4) {
                // Se a visita foi rejeitada, NENHUM ativo pode estar rejeitado (4)
                const hasRejectedAssets = assets.some((asset: any) => asset.processing_id === 4);
                if (hasRejectedAssets) {
                    throw new Error('Não é possível reportar a visita enquanto houver ativos rejeitados');
                }
            }
        }

        // 3. Atualizar a visita
        const timestamp = getBrazilTimestamp();
        const { error: updateError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 2,
                ov_reported_user_id: Number(userId),
                ov_reported_at: timestamp
            })
            .eq('id', visitId);

        if (updateError) {
            console.error('Error reporting visit:', updateError);
            throw new Error('Erro ao reportar visita');
        }
    },

    async updateOrderVisitProcessing(visitId: string, processingId: number, userId: string, extraData?: { statusId: number; progress: number; suspendedReasonId?: number | null }): Promise<void> {
        const timestamp = getBrazilTimestamp();
        const payload: any = {
            ov_processing_id: processingId
        };

        if (processingId === 5) {
            payload.ov_approved_user_id = parseInt(userId);
            payload.ov_approved_at = timestamp;
        }

        if (extraData) {
            payload.ov_o_status_id = extraData.statusId;
            payload.ov_o_progress = extraData.statusId === 8 ? 1 : (extraData.progress / 100);
            payload.ov_o_suspended_reason_id = extraData.statusId === 6 ? (extraData.suspendedReasonId || null) : null;
        }

        const { error } = await supabase
            .from('orders_visits')
            .update(payload)
            .eq('id', parseInt(visitId));

        if (error) {
            console.error('Error updating visit processing:', error);
            throw new Error('Erro ao atualizar processamento da visita');
        }
    },

    async disapproveOrderVisit(visitId: string, userId: string): Promise<void> {
        // 1. Get visit details for notification (from v_orders_visits as usual for complete info)
        const { data: visit, error: fetchError } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();

        if (fetchError || !visit) throw fetchError || new Error('Visita não encontrada');

        const now = getBrazilTimestamp();

        // 2. Update the visit status
        const { error: updateError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 4, // Ajuste / Rejeitado
                ov_disapproved_at: now,
                ov_disapproved_user_id: parseInt(userId)
            })
            .eq('id', parseInt(visitId));

        if (updateError) throw updateError;

        // 3. Send Notification to Team Leader
        try {
            if (visit.ov_team_leader_id) {
                const { data: leaderUser } = await supabase.from('users').select('name_short, mobile_whatsapp').eq('id', visit.ov_team_leader_id).single();
                const { data: currentUser } = await supabase.from('users').select('name_short, name_full').eq('id', userId).single();

                const authorizingUserName = currentUser?.name_short || currentUser?.name_full || 'Supervisor';
                const visitMask = visit.ov_mask || 'N/A';

                await supabase.from('users_notifications').insert({
                    user_id_to: visit.ov_team_leader_id,
                    user_id_from: parseInt(userId),
                    title: 'Visita Rejeitada para Ajuste',
                    body: `${authorizingUserName} rejeitou a visita ${visitMask} para ajustes.\nVerifique os ativos rejeitados no relatório técnico.`,
                    type: 'Visita Rejeitada',
                    created_at: now,
                    is_read: false,
                    o_id: visit.o_id,
                    user_to_whatsapp: leaderUser?.mobile_whatsapp
                });
            }
        } catch (notifErr) {
            console.error('Error sending notification for visit disapproval:', notifErr);
        }
    },

    // ─── Location Tracker ────────────────────────────────────────────────────

    async getUserTrackerInterval(userId: string): Promise<number | null> {
        const { data, error } = await supabase
            .from('users')
            .select('tracker_interval_seconds')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching tracker interval:', error);
            return null;
        }

        return data?.tracker_interval_seconds ?? null;
    },

    async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({
                latitude,
                longitude,
                tracker_at: getBrazilTimestamp()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user location:', error);
        }
    },

    // -------------------------------------------------------------------------
    // PREVENTIVE MAINTENANCE PLANS
    // -------------------------------------------------------------------------

    async getMaintenancePlans(assetTypeId?: string): Promise<MaintenancePlan[]> {
        let query = supabase.from('maintenances_plans').select('*').eq('is_deleted', false);
        if (assetTypeId) {
            // Also fetch generic ones (asset_type_id null)?
            // Fetch exact matches or generic ones 
            query = query.or(`asset_type_id.eq.${assetTypeId},asset_type_id.is.null`);
        }
        const { data, error } = await query.order('description', { ascending: true });
        if (error) {
            console.error('Error fetching maintenance plans:', error);
            return [];
        }
        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            assetTypeId: item.asset_type_id?.toString(),
            isAvailable: item.is_available,
            isDeleted: item.is_deleted
        }));
    },

    async getMaintenancePlanById(id: string): Promise<MaintenancePlan | null> {
        const { data, error } = await supabase.from('maintenances_plans').select('*').eq('id', parseInt(id)).single();
        if (error || !data) return null;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async createMaintenancePlan(plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        const { data, error } = await supabase
            .from('maintenances_plans')
            .insert({
                code: plan.code,
                description: plan.description,
                asset_type_id: plan.assetTypeId ? parseInt(plan.assetTypeId) : null,
                is_available: plan.isAvailable !== undefined ? plan.isAvailable : true,
                created_user_id: parseInt(userId)
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async updateMaintenancePlan(id: string, plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        const payload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (plan.code !== undefined) payload.code = plan.code;
        if (plan.description !== undefined) payload.description = plan.description;
        if (plan.assetTypeId !== undefined) payload.asset_type_id = plan.assetTypeId ? parseInt(plan.assetTypeId) : null;
        if (plan.isAvailable !== undefined) payload.is_available = plan.isAvailable;

        const { data, error } = await supabase
            .from('maintenances_plans')
            .update(payload)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async getMaintenancePlanSections(planId: string): Promise<MaintenancePlanSection[]> {
        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .select('*')
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('is_deleted', false)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id.toString(),
            maintenancePlanId: item.maintenance_plan_id.toString(),
            description: item.description,
            isAvailable: item.is_available,
            isDeleted: item.is_deleted,
            orderIndex: item.order_index
        }));
    },

    async createMaintenancePlanSection(section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        if (!section.maintenancePlanId) throw new Error("maintenancePlanId is required");
        
        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .insert({
                maintenance_plan_id: parseInt(section.maintenancePlanId),
                description: section.description,
                is_available: section.isAvailable !== undefined ? section.isAvailable : true,
                created_user_id: parseInt(userId),
                order_index: section.orderIndex || 0
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanId: data.maintenance_plan_id.toString(),
            description: data.description,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index
        };
    },

    async updateMaintenancePlanSection(id: string, section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        const payload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (section.description !== undefined) payload.description = section.description;
        if (section.isAvailable !== undefined) payload.is_available = section.isAvailable;
        if (section.orderIndex !== undefined) payload.order_index = section.orderIndex;
        if (section.isDeleted !== undefined) {
             payload.is_deleted = section.isDeleted;
             if(section.isDeleted) payload.deleted_user_id = parseInt(userId);
        }

        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .update(payload)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanId: data.maintenance_plan_id.toString(),
            description: data.description,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index
        };
    },

    async getMaintenancePlanSectionActivities(sectionId: string): Promise<MaintenancePlanSectionActivity[]> {
        const { data, error } = await supabase
            .from('maintenances_plans_sections_activities')
            .select('*, cfg_activities(description, code)')
            .eq('maintenance_plan_section_id', parseInt(sectionId))
            .eq('is_deleted', false)
            .order('order_index', { ascending: true });
        if (error) return [];
        return data.map((item: any) => ({
            id: item.id.toString(),
            maintenancePlanSectionId: item.maintenance_plan_section_id.toString(),
            activityId: item.activity_id.toString(),
            isAvailable: item.is_available,
            isDeleted: item.is_deleted,
            orderIndex: item.order_index,
            description: item.description,
            commentsDefault: item.comments_default,
            activityDescription: item.cfg_activities?.description,
            activityCode: item.cfg_activities?.code
        }));
    },

    async createMaintenancePlanSectionActivity(sectionId: string, activityId: string, userId: string, orderIndex?: number, description?: string, commentsDefault?: string): Promise<MaintenancePlanSectionActivity> {
        // We use upsert to avoid duplicate keys issues if deleted and re-added
        const payload: any = {
            maintenance_plan_section_id: parseInt(sectionId),
            activity_id: parseInt(activityId),
            created_user_id: parseInt(userId),
            is_deleted: false,
            is_available: true,
            order_index: orderIndex || 0,
            description: description,
            comments_default: commentsDefault
        };

        const { data, error } = await supabase
            .from('maintenances_plans_sections_activities')
            .upsert(payload, { onConflict: 'maintenance_plan_section_id,activity_id' })
            .select('*, cfg_activities(description, code)')
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanSectionId: data.maintenance_plan_section_id.toString(),
            activityId: data.activity_id.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index,
            description: data.description,
            commentsDefault: data.comments_default,
            activityDescription: data.cfg_activities?.description,
            activityCode: data.cfg_activities?.code
        };
    },

    async updateMaintenancePlanSectionActivity(id: string, payload: Partial<MaintenancePlanSectionActivity>, userId: string): Promise<void> {
        const dbPayload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (payload.orderIndex !== undefined) dbPayload.order_index = payload.orderIndex;
        if (payload.description !== undefined) dbPayload.description = payload.description;
        if (payload.commentsDefault !== undefined) dbPayload.comments_default = payload.commentsDefault;
        if (payload.isDeleted !== undefined) {
             dbPayload.is_deleted = payload.isDeleted;
             if(payload.isDeleted) dbPayload.deleted_user_id = parseInt(userId);
        }

        const { error } = await supabase
            .from('maintenances_plans_sections_activities')
            .update(dbPayload)
            .eq('id', parseInt(id));

        if (error) throw error;
    },

    async removeMaintenancePlanSectionActivity(sectionActivityId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('maintenances_plans_sections_activities')
            .update({
                is_deleted: true,
                deleted_user_id: parseInt(userId),
                deleted_at: getBrazilTimestamp()
            })
            .eq('id', parseInt(sectionActivityId));

        if (error) throw error;
    },

    // To load checklist for an asset visit (fetch all activities filled out with maintenance_plan_id)
    async getMaintenanceChecklistItemsByVisit(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .not('maintenance_plan_id', 'is', null)
            .neq('maintenance_plan_id', 0)
            .eq('is_deleted', false);
        
        if (error) {
            console.error('Error fetching visit checklist items:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            orderVisitAssetId: item.ova_id.toString(),
            activityId: item.activity_id.toString(),
            isDeleted: item.is_deleted,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            maintenancePlanId: item.maintenance_plan_id?.toString(),
            status: item.status,
            imgFilePath: item.img_file_path,
            imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
            comments: item.comments
        }));
    },

    async getMaintenanceChecklistItems(ovAssetId: string, planId: string): Promise<OrderVisitAssetActivity[]> {
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('is_deleted', false);
        
        if (error) {
            console.error('Error fetching maintenance checklist items:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            orderVisitAssetId: item.ova_id.toString(),
            activityId: item.activity_id.toString(),
            isDeleted: item.is_deleted,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            maintenancePlanId: item.maintenance_plan_id?.toString(),
            status: item.status,
            imgFilePath: item.img_file_path,
            imgFilesNames: item.img_files_names,
            comments: item.comments
        }));
    },

    // To load checklist history for an asset across all visits
    async getGlobalMaintenanceChecklistItems(assetId: string, planId: string, currentOvaId?: string): Promise<OrderVisitAssetActivity[]> {
        try {
            // Fetch all OrderVisitAsset records for this asset and plan, ordered by ID DESC (latest first)
            const { data: ovaRecords, error: ovaError } = await supabase
                .from('orders_visits_assets')
                .select('id')
                .eq('asset_id', parseInt(assetId))
                .eq('maintenance_plan_id', parseInt(planId))
                .eq('is_deleted', false)
                .order('id', { ascending: false });

            if (ovaError || !ovaRecords || ovaRecords.length === 0) {
                return [];
            }

            // Exclude current visit
            const previousOvas = currentOvaId 
                ? ovaRecords.filter(r => r.id.toString() !== currentOvaId.toString())
                : ovaRecords;

            if (previousOvas.length === 0) return [];

            // Limit to the last 50 visits to avoid huge IN queries, usually enough to find the "última visita"
            const previousOvaIds = previousOvas.map(r => r.id).slice(0, 50);

            // Fetch activities for all selected previous OVAs, only where status is filled
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .select('*')
                .in('ova_id', previousOvaIds)
                .eq('maintenance_plan_id', parseInt(planId))
                .not('status', 'is', null)
                .order('ova_id', { ascending: false });

            if (error) {
                console.error('Error fetching global maintenance checklist items:', error);
                return [];
            }

            // Filter to keep only the absolute most recent status for each activity
            const latestActivitiesMap = new Map<number, any>();
            for (const item of data || []) {
                if (!latestActivitiesMap.has(item.activity_id)) {
                    latestActivitiesMap.set(item.activity_id, item);
                }
            }

            return Array.from(latestActivitiesMap.values()).map((item: any) => ({
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                maintenancePlanId: item.maintenance_plan_id?.toString(),
                status: item.status,
                imgFilePath: item.img_file_path,
                imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
                comments: item.comments
            }));
        } catch (error) {
            console.error('Catch in getGlobalMaintenanceChecklistItems:', error);
            return [];
        }
    },

    async updateOrderVisitAssetPlan(ovAssetId: string, planId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({ maintenance_plan_id: planId ? parseInt(planId) : null })
            .eq('id', parseInt(ovAssetId));
            
        if (error) {
            console.error('Error updating order visit asset plan:', error);
            throw error;
        }
    },

    async updateOrderVisitAssetProgress(ovAssetId: string, progress: number): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({ maintenance_plan_progress: progress })
            .eq('id', parseInt(ovAssetId));
            
        if (error) {
            console.error('Error updating order visit asset progress:', error);
            throw error;
        }
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
        const dbUpdates: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
        if (updates.imgFilePath !== undefined) dbUpdates.img_file_path = updates.imgFilePath;
        if (updates.imgFilesNames !== undefined) dbUpdates.img_files_names = updates.imgFilesNames;

        const { data: existing } = await supabase
            .from('orders_visits_assets_activities')
            .select('id')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId))
            .maybeSingle();

        let resultData = null;

        if (existing) {
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .update({ ...dbUpdates, is_deleted: false })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        } else {
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .insert({
                    ova_id: parseInt(ovAssetId),
                    activity_id: parseInt(activityId),
                    maintenance_plan_id: parseInt(planId),
                    created_user_id: parseInt(userId),
                    created_at: getBrazilTimestamp(),
                    is_deleted: false,
                    ...dbUpdates
                })
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        }

        if (resultData) {
            return {
                id: resultData.id.toString(),
                orderVisitAssetId: resultData.ova_id.toString(),
                activityId: resultData.activity_id.toString(),
                isDeleted: resultData.is_deleted,
                createdUserId: resultData.created_user_id?.toString(),
                createdAt: resultData.created_at,
                maintenancePlanId: resultData.maintenance_plan_id?.toString(),
                status: resultData.status,
                imgFilePath: resultData.img_file_path,
                imgFilesNames: Array.isArray(resultData.img_files_names) ? resultData.img_files_names : (typeof resultData.img_files_names === 'string' ? JSON.parse(resultData.img_files_names) : []),
                comments: resultData.comments
            };
        }
        return null;
    },

    async deleteMaintenanceChecklistItem(ovAssetId: string, planId: string, activityId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets_activities')
            .delete()
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId));

        if (error) {
            console.error('Error deleting maintenance checklist item:', error);
            throw error;
        }
    },

    async uploadChecklistImage(ovAssetId: string, activityId: string, file: File, companyId?: string, assetId?: string): Promise<{ path: string; filename: string }> {
        // r2Service is now static

        
        // Ensure file extension is standard
        let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpeg';
        if (fileExt === 'jpg') fileExt = 'jpeg';

        const uniqueSuffix = Math.random().toString(36).substring(7);
        
        // Ensure no spaces or special characters in IDs and paths
        const cleanOvAssetId = String(ovAssetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanActivityId = String(activityId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCompanyId = String(companyId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanAssetId = String(assetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');

        const fileName = `checklist_${cleanOvAssetId}_${cleanActivityId}_${Date.now()}_${uniqueSuffix}.${fileExt}`;
        
        // Pattern: companies/{companyId}/assets/{assetId}
        const folderPath = (cleanCompanyId && cleanAssetId && cleanCompanyId !== 'undefined' && cleanAssetId !== 'undefined') 
            ? `companies/${cleanCompanyId}/assets/${cleanAssetId}` 
            : `checklist/${cleanOvAssetId}/${cleanActivityId}`;
            
        const fullPath = `${folderPath}/${fileName}`.replace(/\s+/g, '_');

        console.log('DEBUG: Final upload path:', fullPath);
        console.log('DEBUG: file.type (original):', file.type);

        // We use a new File object if we need to force the MIME type, but r2Service just needs the blob and path
        await r2Service.uploadFile(file, fullPath);
        return { path: folderPath, filename: fileName };
    },

    async removeChecklistImage(ovAssetId: string, planId: string, activityId: string, fileName: string, userId: string): Promise<OrderVisitAssetActivity | null> {
        // 1. Fetch current record
        const { data: existing, error: fetchError } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId))
            .maybeSingle();

        if (fetchError || !existing) throw fetchError || new Error('Item de checklist não encontrado');

        // 2. Filter out the specific file
        const currentList: string[] = existing.img_files_names || [];
        const newList = currentList.filter(f => f !== fileName);

        // 3. Try to delete from R2
        try {
            // r2Service is now static

            // Replicate the path logic from the component/upload to ensure consistency
            const folderPath = existing.img_file_path || `checklist/${ovAssetId}/${activityId}`;
            const fullPath = `${folderPath}/${fileName}`.replace(/\/+/g, '/');
            
            console.log('DEBUG: Deleting from R2 at path:', fullPath);
            await r2Service.deleteFile(fullPath);
        } catch (r2Error) {
            console.warn('Não foi possível excluir do R2, continuando com atualização do Banco:', r2Error);
        }

        // 4. Update DB
        return await this.upsertMaintenanceChecklistItem(ovAssetId, planId, activityId, userId, {
            imgFilesNames: newList
        });
    },

    async getAssetAvailabilityHistory7Days(unitAssetTagId: string, offsetDays: number = 0): Promise<{ date: string; isAvailable: boolean | null }[]> {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - offsetDays);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // 7 days total inclusive
        startDate.setHours(0, 0, 0, 0);
        
        // 1. Obter chaves estrangeiras do ativo
        const { data: tagData, error: tagError } = await supabase
            .from('v_units_assets_tags')
            .select('unit_id, asset_tag_id, asset_tag_sub_id')
            .eq('id', parseInt(unitAssetTagId))
            .single();

        if (tagError || !tagData) {
            console.error('Error fetching asset keys:', tagError);
            return [];
        }

        // 2. Buscar histórico usando as chaves
        let query = supabase
            .from('v_assets_available')
            .select('is_available, reported_at')
            .eq('unit_id', tagData.unit_id)
            .eq('asset_tag_id', tagData.asset_tag_id)
            .gte('reported_at', startDate.toISOString())
            .lte('reported_at', endDate.toISOString());

        if (tagData.asset_tag_sub_id != null) {
            query = query.eq('asset_tag_sub_id', tagData.asset_tag_sub_id);
        } else {
            query = query.is('asset_tag_sub_id', null);
        }

        const { data, error } = await query.order('reported_at', { ascending: false });

        if (error) {
            console.error('Error fetching availability history:', error);
            return [];
        }

        // Process in JS: since data is ordered DESC, the first record for a given day is the latest of that day
        const historyMap = new Map<string, boolean>();
        
        for (const record of (data || [])) {
            const dateStr = String(record.reported_at).substring(0, 10);
            if (!historyMap.has(dateStr)) {
                historyMap.set(dateStr, record.is_available);
            }
        }

        // Build array of exactly 7 days
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            result.push({
                date: dateStr,
                isAvailable: historyMap.has(dateStr) ? historyMap.get(dateStr)! : null
            });
        }

        return result;
    },

    async getAssetAvailabilityForExport(unitId: string, startDate: string, endDate: string, assetTagId?: string, assetTagSubId?: string): Promise<any[]> {
        let query = supabase
            .from('v_assets_available')
            .select('*')
            .eq('unit_id', parseInt(unitId))
            .gte('reported_at', startDate)
            .lte('reported_at', endDate + ' 23:59:59');

        if (assetTagId && assetTagId !== 'all') {
            query = query.eq('asset_tag_id', parseInt(assetTagId));
        }

        if (assetTagSubId && assetTagSubId !== 'all') {
            query = query.eq('asset_tag_sub_id', parseInt(assetTagSubId));
        }

        const { data, error } = await query
            .order('unit_description', { ascending: true })
            .order('tag_description', { ascending: true })
            .order('tag_sub_description', { ascending: true })
            .order('reported_at', { ascending: true });

        if (error) {
            console.error('Error fetching export data:', error);
            return [];
        }

        return data || [];
    },

    // ==========================================
    // MANUS INTEGRATION METHODS
    // ==========================================

    /**
     * Verifica se um contrato usa integração com Manus
     */
    async checkContractUsesManus(contractId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('is_use_manus')
                .eq('id', contractId)
                .single();

            if (error) {
                console.error('Error checking contract Manus flag:', error);
                return false;
            }

            return data?.is_use_manus || false;
        } catch (error) {
            console.error('Error checking contract Manus flag:', error);
            return false;
        }
    },

    /**
     * Busca dados de uma visita no sistema Manus
     */
    async getManusVisitData(visitId: string): Promise<any | null> {
        try {
            // Aqui você pode adaptar conforme a estrutura real da tabela do Manus
            const { data, error } = await supabase
                .from('manus_visits')
                .select('*')
                .eq('visit_id', visitId)
                .single();

            if (error) {
                console.error('Error fetching Manus visit data:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching Manus visit data:', error);
            return null;
        }
    },

    /**
     * Envia dados de uma visita para o Manus
     */
    async sendVisitToManus(visitId: string, visitData: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('manus_visits')
                .upsert({
                    visit_id: visitId,
                    ...visitData,
                    synced_at: getBrazilTimestamp()
                });

            if (error) {
                console.error('Error sending visit to Manus:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error sending visit to Manus:', error);
            return false;
        }
    },

    /**
     * Atualiza status de sincronização com Manus
     */
    async updateManusSyncStatus(visitId: string, status: string, message?: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('manus_visits')
                .update({
                    sync_status: status,
                    sync_message: message,
                    updated_at: getBrazilTimestamp()
                })
                .eq('visit_id', visitId);

            if (error) {
                console.error('Error updating Manus sync status:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error updating Manus sync status:', error);
            return false;
        }
    }
};
