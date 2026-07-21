import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { Asset, AssetAlert, AssetHistoryItem } from '../../types';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { unitsService } from '../core/unitsService';
import { getPublicImageUrl } from '../imageUtils';
import { formatDateTime } from '../../utils/formatters';
import { assetAttributesService } from './assetAttributesService';


export const assetsService = {
    // ── Asset CRUD ───────────────────────────────────────────────
    async getAssets(filter: 'all' | 'active' | 'inactive' = 'all', search: string = '', unitId?: string, unitAssetTagId?: string): Promise<Asset[]> {
        try {
            let query = supabase
                .from('v_assets')
                .select('*')
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

            const { data, error } = await query.limit(5000);

            if (error) {
                console.error('getAssets: ERRO AO BUSCAR ATIVOS:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                return [];
            }

            return data.map((item: any) => ({
                id: item.id.toString(),
                code: item.code || '',
                description: item.description || '',
                clientId: item.client_id?.toString(),
                clientName: item.client_name || '',
                unitId: item.unit_id?.toString(),
                unitDescriptionFull: item.unit_description || '',
                statusId: item.status_id?.toString(),
                statusCode: item.status_code || '',
                statusColor: item.status_color || '#22c55e',
                tagId: item.tag_id?.toString(),
                tagName: '',
                tagSubId: item.tag_sub_id?.toString(),
                tagSubName: item.tag_sub_description || '',
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
                materialId: item.material_id?.toString(),
                materialCode: item.material_code || '',
                materialDescription: item.material_description || '',
                materialUnit: item.material_unit || '',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name
            } as Asset));

        } catch (error) {
            console.error('getAssets: ERRO CRÍTICO:', error);
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
            
            if (
                (filters.systemParentId && (Array.isArray(filters.systemParentId) ? filters.systemParentId.length > 0 : true)) ||
                (filters.systemId && (Array.isArray(filters.systemId) ? filters.systemId.length > 0 : true)) ||
                (filters.unitTypeParentId && (Array.isArray(filters.unitTypeParentId) ? filters.unitTypeParentId.length > 0 : true)) ||
                (filters.unitTypeId && (Array.isArray(filters.unitTypeId) ? filters.unitTypeId.length > 0 : true))
            ) {
                const units = await unitsService.getFilteredUnits({
                    systemParentId: filters.systemParentId,
                    systemId: filters.systemId,
                    unitTypeParentId: filters.unitTypeParentId,
                    unitTypeId: filters.unitTypeId,
                });
                
                unitIdsToFilter = units.map(u => u.id.toString());
                
                if (unitIdsToFilter.length === 0) {
                    return [];
                }
            }

            let query = supabase
                .from('v_assets')
                .select('*')
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

            const { data, error } = await query.limit(5000);

            if (error) {
                console.error('getFilteredAssets: ERRO:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                return [];
            }

            return data.map((item: any) => ({
                id: item.id.toString(),
                code: item.code || '',
                description: item.description || '',
                clientId: item.client_id?.toString(),
                clientName: item.client_name || '',
                unitId: item.unit_id?.toString(),
                unitDescriptionFull: item.unit_description || '',
                statusId: item.status_id?.toString(),
                statusCode: item.status_code || '',
                statusColor: item.status_color || '#22c55e',
                tagId: item.tag_id?.toString(),
                tagName: '',
                tagSubId: item.tag_sub_id?.toString(),
                tagSubName: item.tag_sub_description || '',
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
                materialId: item.material_id?.toString(),
                materialCode: item.material_code || '',
                materialDescription: item.material_description || '',
                materialUnit: item.material_unit || '',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name
            })) as Asset[];

        } catch (error) {
            console.error('getFilteredAssets: ERRO CRÍTICO:', error);
            throw error;
        }
    },

    async getAssetById(id: string): Promise<Asset | null> {
        const { data, error } = await supabase
            .from('v_assets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            id: data.id.toString(),
            code: data.code || '',
            description: data.description || '',
            clientId: data.client_id?.toString(),
            clientName: data.client_name || '',
            unitId: data.unit_id?.toString(),
            unitDescriptionFull: data.unit_description || '',
            statusId: data.status_id?.toString(),
            statusCode: data.status_code || '',
            statusColor: data.status_color || '#22c55e',
            tagId: data.tag_id?.toString(),
            tagName: '',
            tagSubId: data.tag_sub_id?.toString(),
            tagSubName: data.tag_sub_description || '',
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
            materialId: data.material_id?.toString(),
            materialCode: data.material_code || '',
            materialDescription: data.material_description || '',
            materialUnit: data.material_unit || '',
            imgFilePath: data.img_file_path,
            imgFileName: data.img_file_name
        } as Asset;
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
            material_id: asset.materialId ? parseInt(asset.materialId) : null,
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

        if (asset.attributeValues) {
            await assetAttributesService.saveAssetAttributeValues(data.id.toString(), asset.attributeValues);
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
        if (asset.materialId !== undefined) dbData.material_id = asset.materialId ? parseInt(asset.materialId) : null;
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

        if (asset.attributeValues) {
            await assetAttributesService.saveAssetAttributeValues(id, asset.attributeValues);
        }

        return (await this.getAssetById(id)) as Asset;
    },

    // ── Asset Images ─────────────────────────────────────────────
    async uploadAssetImage(assetId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const companyId = 1;
        const folderPath = `companies/${companyId}/assets/${assetId}`;
        const fullPath = `${folderPath}/${fileName}`;

        try {
            await r2Service.uploadFile(file, fullPath, onProgress);
        } catch (uploadError) {
            console.error('Error uploading asset image to R2:', uploadError);
            throw uploadError;
        }

        return { path: folderPath, filename: fileName };
    },

    async updateAssetPhotoFromReport(assetId: string, companyId: string, sourceFileName: string, sourceFolderPath: string): Promise<void> {
        const { error } = await supabase
            .from('assets')
            .update({
                img_file_path: sourceFolderPath,
                img_file_name: sourceFileName,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(assetId));

        if (error) throw error;
    },

    // ── Asset History ────────────────────────────────────────────
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
            console.error('Error fetching asset history:', error);
            return { data: [], total: 0 };
        }

        if (!history || history.length === 0) return { data: [], total: count || 0 };

        const orderIds = [...new Set(history.map((h: any) => h.o_id).filter(Boolean))];
        let providerCompaniesMap = new Map<string, { id: string; name: string; logoUrl: string }>();

        if (orderIds.length > 0) {
            const { data: orders } = await supabase
                .from('orders')
                .select('id, provider_company_id')
                .in('id', orderIds);

            if (orders && orders.length > 0) {
                const providerCompanyIds = [...new Set(
                    orders.map((o: any) => o.provider_company_id).filter(Boolean)
                )];

                if (providerCompanyIds.length > 0) {
                    const { data: companies } = await supabase
                        .from('cfg_companies')
                        .select('id, description, img_file_path, img_file_name')
                        .in('id', providerCompanyIds);

                    if (companies) {
                        const companiesById = new Map();
                        companies.forEach((company: any) => {
                            companiesById.set(company.id.toString(), company);
                        });

                        orders.forEach((order: any) => {
                            if (order.provider_company_id) {
                                const company = companiesById.get(order.provider_company_id.toString());
                                if (company) {
                                    const logoUrl = getPublicImageUrl(
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
            const primaryDesc = h.after_comments || h.before_comments || h.moved_comments || 'Sem observações';
            const providerCompany = providerCompaniesMap.get(h.o_id?.toString());

            return {
                id: h.id.toString(),
                ovId: h.ov_id?.toString(),
                orderId: h.o_id?.toString(),
                orderMask: h.order_mask,
                ovMask: h.ov_mask,
                type: h.o_type_description || 'Serviço',
                title: h.o_type_description || 'Ordem de Visita',
                description: h.activities_description || h.moved_comments || h.description || 'Sem observações',
                date: dateFormatted,
                user: h.o_team_leader_name_short || '',
                team: h.o_team_code || '',
                color: getColorForType(h.o_type_description || ''),
                isMoved: !!h.is_moved,
                beforeStatus: h.before_status_description,
                beforeUnit: h.before_unit_description,
                beforeTag: [h.before_tag_description, h.before_tag_sub_description].filter(Boolean).join(' > '),
                beforePriority: h.before_priority_description,
                beforeComments: h.before_comments,
                beforeImg: h.before_img_files_names && h.before_img_files_names.length > 0
                    ? getPublicImageUrl(h.before_img_file_path || `companies/${h.o_company_id || h.company_id}/assets/${h.asset_id}`, h.before_img_files_names[0], { width: 400, height: 400, resize: 'cover', format: 'origin' })
                    : undefined,
                afterStatus: h.after_status_description,
                afterUnit: h.after_unit_description,
                afterTag: [h.after_tag_description, h.after_tag_sub_description].filter(Boolean).join(' > '),
                afterPriority: h.after_priority_description,
                afterComments: h.after_comments,
                afterImg: h.after_img_files_names && h.after_img_files_names.length > 0
                    ? getPublicImageUrl(h.after_img_file_path || `companies/${h.o_company_id || h.company_id}/assets/${h.asset_id}`, h.after_img_files_names[0], { width: 400, height: 400, resize: 'cover', format: 'origin' })
                    : undefined,
                providerCompanyId: providerCompany?.id,
                providerCompanyName: providerCompany?.name,
                providerCompanyLogoUrl: providerCompany?.logoUrl,
                servicesValue: h.services_value,
                materialsValue: h.materials_value,
                vehiclesValue: h.vehicles_value,
                totalValue: h.total_value !== undefined ? h.total_value : ((h.services_value || 0) + (h.materials_value || 0) + (h.vehicles_value || 0)),
            } as AssetHistoryItem;
        });

        return { data, total: count || 0 };
    },

    // ── Asset Alerts ─────────────────────────────────────────────
    async getAssetAlerts(assetId: string): Promise<AssetAlert[]> {
        const { data, error } = await supabase
            .from('assets_alerts')
            .select(`
                *,
                cfg_orders_types ( description ),
                cfg_orders_priorities ( description, color )
            `)
            .eq('asset_id', assetId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching asset alerts:', error);
            throw error;
        }

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

        const assetIds = [...new Set(alertsData.map((d: any) => d.asset_id).filter(Boolean))];

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

        const assetIds = [...new Set(alertsData.map((d: any) => d.asset_id).filter(Boolean))];

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

        const clientByAssetId = new Map<string, string>();
        for (const [assetId, assetObj] of assetsMap) {
            const raw = assetObj as any;
            if (raw.injected_client_name) clientByAssetId.set(assetId, raw.injected_client_name);
        }

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
        const { usersService } = await import('../users/usersService');
        const currentUser = await usersService.getCurrentUser();

        const dbData: any = {
            asset_id: alert.assetId ? parseInt(alert.assetId) : null,
            o_type_id: alert.oTypeId ? parseInt(alert.oTypeId) : null,
            priority_id: alert.priorityId ? parseInt(alert.priorityId) : null,
            description: alert.description,
            is_done: alert.isDone ?? false,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            created_at: getBrazilTimestamp()
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
            updated_at: getBrazilTimestamp()
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
        const { usersService } = await import('../users/usersService');
        const currentUser = await usersService.getCurrentUser();

        const { error } = await supabase
            .from('assets_alerts')
            .update({
                is_deleted: true,
                deleted_user_id: currentUser ? parseInt(currentUser.id) : null,
                deleted_at: getBrazilTimestamp()
            })
            .eq('id', id);

        if (error) throw error;
    },

    // ── Asset Follow ─────────────────────────────────────────────
    async toggleAssetFollow(assetId: string): Promise<boolean> {
        const { usersService } = await import('../users/usersService');
        const currentUser = await usersService.getCurrentUser();
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
        const { usersService } = await import('../users/usersService');
        const currentUser = await usersService.getCurrentUser();
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

    // ── Asset by Code ────────────────────────────────────────────
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

    // ── Availability Export ──────────────────────────────────────
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

    // ── Dashboard ────────────────────────────────────────────────
    async getUnitsAssetsTagsDashboard(systemParentId: string): Promise<any[]> {
        const { data: unitsWithStatus, error: unitsError } = await supabase
            .from('units')
            .select('id')
            .eq('system_parent_id', systemParentId)
            .eq('status_id', 3)
            .eq('is_deleted', false);

        if (unitsError || !unitsWithStatus || unitsWithStatus.length === 0) {
            console.error('Error fetching units with status_id=3:', unitsError);
            return [];
        }

        const unitIds = unitsWithStatus.map(u => u.id);

        const { data, error } = await supabase
            .from('v_units_assets_tags')
            .select('*, units(latitude, longitude)')
            .in('unit_id', unitIds)
            .order('unit_description');

        if (error) {
            console.error('Error fetching dashboard data:', error);
            return [];
        }

        const rows = data || [];
        return rows.map(row => ({
            ...row,
            last_reported_image: row.last_file_path && row.last_file_name
                ? getPublicImageUrl(row.last_file_path, row.last_file_name, { width: 100, height: 100, resize: 'cover' })
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
    }
};
