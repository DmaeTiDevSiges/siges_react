import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { AssetTag, AssetTagSub, Company } from '../../types';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { getPublicImageUrl } from '../imageUtils';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { companiesService } from '../companies/companiesService';

export const assetTagsService = {
    // ── Asset Tags ───────────────────────────────────────────────
    async getAssetTags(status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTag[]> {
        let query = supabase.from('v_assets_tags').select('*');

        if (status === 'active') query = query.eq('is_available', true);
        if (status === 'inactive') query = query.eq('is_available', false);
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

    // ── Asset Tag Subs ───────────────────────────────────────────
    async getAssetTagSubs(parentId?: string, status: 'all' | 'active' | 'inactive' = 'all', search?: string): Promise<AssetTagSub[]> {
        let query = supabase.from('cfg_assets_tags_subs').select('*');

        query = query.eq('is_deleted', false);
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

    // ── Unit Asset Tags ──────────────────────────────────────────
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

        const uniqueTagIds = [...new Set(relations.map((r: any) => r.asset_tag_id).filter(Boolean))];

        if (uniqueTagIds.length === 0) return [];

        const { data: tags, error: tagsError } = await supabase
            .from('cfg_assets_tags')
            .select('*')
            .in('id', uniqueTagIds)
            .order('description');

        if (tagsError) {
            console.error('Error fetching asset tags for sectors:', error);
            return [];
        }

        return (tags || []).map(item => ({
            id: String(item.id ?? ''),
            code: item.code || '',
            description: item.description || '',
            isAvailable: !!item.is_available,
            unit_id: 0,
            asset_tag_id: item.id || 0
        })) as AssetTag[];
    },

    async getUnitAssetTagsItems(unitId: string, assetTagId: string): Promise<any[]> {
        const [tagsData, companies, reasonsData] = await Promise.all([
            supabase
                .from('cfg_units_assets_tags')
                .select('*')
                .eq('unit_id', unitId)
                .eq('asset_tag_id', assetTagId)
                .eq('is_deleted', 'false')
                .order('asset_tag_tag_sub_description', { ascending: true }),
            companiesService.getCompanies(),
            this.getAssetsUnavailableReasons()
        ]);

        const { data, error } = tagsData;

        if (error) {
            console.error('Error fetching unit asset tags items', error);
            throw error;
        }

        const companyMap = new Map<string, Company>(companies.map(c => [String(c.id), c]));
        const reasonsMap = new Map<string, string>(reasonsData.map(r => [String(r.id), r.description]));

        const userIdsToFetch = [...new Set(data.map((i: any) => i.last_reported_user_id).filter((id: any) => id))];
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
                    ? getPublicImageUrl(item.last_file_path, item.last_file_name, { width: 100, height: 100, resize: 'cover', format: 'origin' })
                    : null,
                reportedImageOriginal: item.last_file_path && item.last_file_name
                    ? getPublicImageUrl(item.last_file_path, item.last_file_name, { format: 'origin' })
                    : null,
                isActive: item.is_active === true || item.is_active === 'true',
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

        const { data: unitData } = item.unit_id
            ? await supabase.from('units').select('latitude, longitude, client_id').eq('id', item.unit_id).single()
            : { data: null };

        const companyLogoUrl = item.last_provider_company_file_path && item.last_provider_company_file_name
            ? getPublicImageUrl(item.last_provider_company_file_path, item.last_provider_company_file_name, { width: 100, height: 100, resize: 'contain' })
            : null;

        return {
            ...item,
            client_id: item.client_id ?? unitData?.client_id ?? null,
            isAvailable: item.last_is_available ?? null,
            last_reported_by_name: item.last_user_full_name || item.last_user_name,
            last_reported_user_name_short: item.last_reported_user_name_short,
            last_reported_by_company_logo: companyLogoUrl,
            last_reported_image: item.last_file_path && item.last_file_name
                ? getPublicImageUrl(item.last_file_path, item.last_file_name, { width: 400, height: 400, resize: 'cover' })
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
            } catch (_) { }

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
        await supabase.from('assets_available')
            .update({ file_path: path, file_name: filename })
            .eq('id', assetAvailableId);

        await supabase.from('cfg_units_assets_tags')
            .update({ last_file_path: path, last_file_name: filename })
            .eq('id', unitAssetTagId);
    },

    async uploadAssetAvailableImageAfterInsert(assetAvailableId: number, unitId: number, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        const filename = `${assetAvailableId}.${fileExt}`;
        const path = `companies/1/units/${unitId}/assets_available`;

        try {
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

    async uploadUnitAssetTagImage(unitAssetTagId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        const filename = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const path = `units_assets_tags/${unitAssetTagId}/${filename}`;

        try {
            await r2Service.uploadFile(file as any, path, onProgress);
            
            return { path, filename };
        } catch (error) {
            console.error('Error uploading unit asset tag image to R2', error);
            throw error;
        }
    },

    // ── Unavailable Reasons ──────────────────────────────────────
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

    // ── Simple asset tags list ───────────────────────────────────
    async getAssetsTags(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_assets_tags').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching asset tags:', error); return []; }
        return data || [];
    },
    async getUnitAssetTags(unitId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_units_assets_tags')
            .select('*')
            .eq('unit_id', unitId);

        if (error) {
            console.error('Error fetching unit asset tags', error);
            throw error;
        }

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
                let sectorName = row.tag_description;
                if (sectorName && sectorName.includes(' - ')) {
                    sectorName = sectorName.split(' - ')[0];
                }
                if (!sectorName && row.asset_tag_tag_sub_description) {
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
        const { data, error } = await supabase
            .from('cfg_units_assets_tags')
            .insert({
                unit_id: payload.unitId,
                asset_tag_id: payload.assetTagId,
                asset_tag_sub_id: payload.assetTagSubId || null,
                asset_tag_tag_sub_description: payload.assetTagTagSubDescription || null,
                operation_unit: payload.operationUnit || null,
                asset_available_rate: payload.assetAvailableRate ?? 0,
                flow_rate_is_visible: payload.flowRateIsVisible ?? false,
                flow_rate_unit: payload.flowRateUnit || null,
                flow_rate_min: payload.flowRateMin ?? 0,
                flow_rate_max: payload.flowRateMax ?? 0,
                power_is_visible: payload.powerIsVisible ?? false,
                power_unit: payload.powerUnit || null,
                power_min: payload.powerMin ?? 0,
                power_max: payload.powerMax ?? 0,
                pressure_is_visible: payload.pressureIsVisible ?? false,
                pressure_unit: payload.pressureUnit || null,
                pressure_min: payload.pressureMin ?? 0,
                pressure_max: payload.pressureMax ?? 0,
                voltage_is_visible: payload.voltageIsVisible ?? false,
                voltage_unit: payload.voltageUnit || null,
                voltage_min: payload.voltageMin ?? 0,
                voltage_max: payload.voltageMax ?? 0,
                amperage_is_visible: payload.amperageIsVisible ?? false,
                amperage_unit: payload.amperageUnit || null,
                amperage_min: payload.amperageMin ?? 0,
                amperage_max: payload.amperageMax ?? 0,
                is_active: true,
                is_deleted: false,
                last_created_at: getBrazilTimestamp(),
                created_at: getBrazilTimestamp(),
                created_user_id: payload.createdUserId || null,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
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
        const updateData: any = {};

        if (payload.unitId !== undefined) updateData.unit_id = payload.unitId;
        if (payload.assetTagId !== undefined) updateData.asset_tag_id = payload.assetTagId;
        if (payload.assetTagSubId !== undefined) updateData.asset_tag_sub_id = payload.assetTagSubId;
        if (payload.assetTagTagSubDescription !== undefined) updateData.asset_tag_tag_sub_description = payload.assetTagTagSubDescription;
        if (payload.operationUnit !== undefined) updateData.operation_unit = payload.operationUnit;
        if (payload.assetAvailableRate !== undefined) updateData.asset_available_rate = payload.assetAvailableRate;
        if (payload.flowRateIsVisible !== undefined) updateData.flow_rate_is_visible = payload.flowRateIsVisible;
        if (payload.flowRateUnit !== undefined) updateData.flow_rate_unit = payload.flowRateUnit;
        if (payload.flowRateMin !== undefined) updateData.flow_rate_min = payload.flowRateMin;
        if (payload.flowRateMax !== undefined) updateData.flow_rate_max = payload.flowRateMax;
        if (payload.powerIsVisible !== undefined) updateData.power_is_visible = payload.powerIsVisible;
        if (payload.powerUnit !== undefined) updateData.power_unit = payload.powerUnit;
        if (payload.powerMin !== undefined) updateData.power_min = payload.powerMin;
        if (payload.powerMax !== undefined) updateData.power_max = payload.powerMax;
        if (payload.pressureIsVisible !== undefined) updateData.pressure_is_visible = payload.pressureIsVisible;
        if (payload.pressureUnit !== undefined) updateData.pressure_unit = payload.pressureUnit;
        if (payload.pressureMin !== undefined) updateData.pressure_min = payload.pressureMin;
        if (payload.pressureMax !== undefined) updateData.pressure_max = payload.pressureMax;
        if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

        updateData.updated_at = getBrazilTimestamp();
        if (payload.updatedUserId !== undefined) updateData.updated_user_id = payload.updatedUserId;

        const { data, error } = await supabase
            .from('cfg_units_assets_tags')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteUnitAssetTag(id: number, deletedUserId?: number | null): Promise<void> {
        const { error } = await supabase
            .from('cfg_units_assets_tags')
            .update({
                is_deleted: true,
                deleted_at: getBrazilTimestamp(),
                deleted_user_id: deletedUserId || null,
            })
            .eq('id', id);

        if (error) throw error;
    }

};
