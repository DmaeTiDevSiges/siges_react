import { supabase } from '../supabase';
import { Material } from '../../types';
import { usersService } from '../users/usersService';
import { getBrazilTimestamp } from '../../utils/dateUtils';

export const materialsService = {
    async getMaterials(filter: number | 'all' = 'all', search: string = '', companyId?: string, page: number = 1, pageSize: number = 50): Promise<{ materials: Material[]; total: number }> {
        const currentUser = await usersService.getCurrentUser();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('v_materials')
            .select('id, code, description, unit, price_unit, company_id, balance, finger_print, is_deleted, status_id, status_description, type_id, type_description', { count: 'exact' })
            .eq('provider_company_id', currentUser?.companyId ? parseInt(currentUser.companyId) : 0)
            .order('description');

        if (filter !== 'all') {
            query = query.eq('status_id', filter);
        }

        if (companyId) {
            query = query.eq('company_id', parseInt(companyId));
        }

        if (search) {
            const terms = search.trim().split(/\s+/);
            for (const term of terms) {
                query = query.ilike('searchable', `%${term}%`);
            }
        }

        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching materials:', error);
            throw error;
        }

        let materials = (data || []).map((item: any) => ({
                id: item.id.toString(),
                code: item.code || '',
                description: item.description || '',
                unit: item.unit || '',
                priceUnit: item.price_unit || 0,
                companyId: item.company_id?.toString(),
                balance: item.balance || 0,
                fingerPrint: item.finger_print,
                isAvailable: !item.is_deleted,
                statusId: item.status_id || 1,
                statusDescription: item.status_description || (item.is_deleted ? 'Inativo' : 'Ativo'),
                typeId: item.type_id || null,
                typeDescription: item.type_description || null
            })) as Material[];

        // Enrich with type data from materials table (view may not have columns cached in PostgREST)
        const missingTypes = materials.filter(m => !m.typeDescription && m.id);
        if (missingTypes.length > 0) {
            const ids = missingTypes.map(m => parseInt(m.id));
            const { data: typeData } = await supabase
                .from('materials')
                .select('id, type_id')
                .in('id', ids);

            if (typeData && typeData.length > 0) {
                const typeIds = [...new Set(typeData.map((t: any) => t.type_id).filter(Boolean))];
                if (typeIds.length > 0) {
                    const { data: typesData } = await supabase
                        .from('cfg_materials_types')
                        .select('id, description')
                        .in('id', typeIds);

                    const typesMap = new Map<number, string>((typesData || []).map((t: any) => [t.id, t.description]));
                    const materialTypesMap = new Map<number, number>(typeData.filter((t: any) => t.type_id).map((t: any) => [t.id, t.type_id]));

                    materials.forEach(m => {
                        const typeId = materialTypesMap.get(parseInt(m.id));
                        if (typeId) {
                            m.typeId = typeId;
                            m.typeDescription = typesMap.get(typeId) || null;
                        }
                    });
                }
            }
        }

        return {
            materials,
            total: count || 0
        };
    },

    async checkMaterialCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = supabase
            .from('materials')
            .select('id')
            .eq('code', code)
            .eq('is_deleted', false);

        if (excludeId) {
            query = query.neq('id', parseInt(excludeId));
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error checking material code:', error);
            return false;
        }

        return (data && data.length > 0);
    },

    async createMaterial(material: Partial<Material>): Promise<Material> {
        const currentUser = await usersService.getCurrentUser();
        const dbData: any = {
            code: material.code,
            description: material.description,
            unit: material.unit,
            price_unit: material.priceUnit || 0,
            status_id: material.statusId || 1,
            type_id: material.typeId || null,
            company_id: 1,
            provider_company_id: currentUser?.companyId ? parseInt(currentUser.companyId) : null,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            created_at: getBrazilTimestamp(),
            is_deleted: false
        };

        const { data, error } = await supabase
            .from('materials')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        if (material.warehouseId) {
            const wmData: any = {
                warehouse_id: parseInt(material.warehouseId),
                material_id: data.id,
                quantity: material.initialQuantity || 0,
                min_stock: material.minStock || 0,
                cost_avg: material.costAvg || 0
            };

            const { error: wmError } = await supabase
                .from('warehouses_materials')
                .insert(wmData);

            if (wmError) throw wmError;
        }

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description || '',
            unit: data.unit || '',
            priceUnit: data.price_unit || 0,
            companyId: data.company_id?.toString(),
            balance: data.balance || 0,
            fingerPrint: data.finger_print,
            isAvailable: !data.is_deleted,
            statusId: data.status_id || 1
        } as Material;
    },

    async getMaterialsStatuses(): Promise<{ id: number; code: string; description: string }[]> {
        const { data, error } = await supabase
            .from('cfg_materials_statuses')
            .select('id, code, description')
            .order('id');

        if (error) {
            console.error('Error fetching materials statuses:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            code: item.code,
            description: item.description
        }));
    },

    async getMaterialsTypes(): Promise<{ id: number; code: string; description: string }[]> {
        const { data, error } = await supabase
            .from('cfg_materials_types')
            .select('id, code, description')
            .order('id');

        if (error) {
            console.error('Error fetching materials types:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            code: item.code,
            description: item.description
        }));
    },

    async getMaterialById(id: string): Promise<Material | null> {
        const { data, error } = await supabase
            .from('v_materials')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (error || !data) {
            console.error('Error fetching material:', error);
            return null;
        }

        const material: Material = {
            id: data.id?.toString(),
            code: data.code || '',
            description: data.description || '',
            unit: data.unit || '',
            priceUnit: data.price_unit || 0,
            companyId: data.company_id?.toString(),
            balance: data.balance || 0,
            fingerPrint: data.finger_print,
            isAvailable: !data.is_deleted,
            statusId: data.status_id || 1,
            statusDescription: data.status_description || (data.is_deleted ? 'Inativo' : 'Ativo'),
            typeId: data.type_id || null,
            typeDescription: data.type_description || null
        };

        return material;
    },

    async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
        const dbData: any = {};
        if (material.code !== undefined) dbData.code = material.code;
        if (material.description !== undefined) dbData.description = material.description;
        if (material.unit !== undefined) dbData.unit = material.unit;
        if (material.priceUnit !== undefined) dbData.price_unit = material.priceUnit;
        if (material.statusId !== undefined) dbData.status_id = material.statusId;
        if (material.typeId !== undefined) dbData.type_id = material.typeId;
        if (material.companyId !== undefined) dbData.company_id = material.companyId ? parseInt(material.companyId) : null;
        if (material.isAvailable !== undefined) dbData.is_deleted = !material.isAvailable;

        const { data, error } = await supabase
            .from('materials')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const { data: statusRow } = await supabase.from('cfg_materials_statuses').select('description').eq('id', data.status_id).single();

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description || '',
            unit: data.unit || '',
            priceUnit: data.price_unit || 0,
            companyId: data.company_id?.toString(),
            balance: data.balance || 0,
            fingerPrint: data.finger_print,
            isAvailable: !data.is_deleted,
            statusId: data.status_id || 1,
            statusDescription: statusRow?.description || (data.is_deleted ? 'Inativo' : 'Ativo')
        } as Material;
    },

    async getOrderVisitAssetMaterials(ovAssetId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_assets_materials')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId));

        if (error) {
            console.error('Error fetching asset materials:', error);
            return [];
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
    async getAvailableMaterials(search: string = '', page: number = 0, pageSize: number = 20, providerCompanyId?: string): Promise<Material[]> {
        const currentUser = await usersService.getCurrentUser();
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('v_materials')
            .select('*')
            .eq('provider_company_id', currentUser?.companyId ? parseInt(currentUser.companyId) : 0)
            .eq('is_deleted', false)
            .order('description', { ascending: true })
            .range(from, to);

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
            priceUnit: item.price_unit || item.value_unit || 0,
            isAvailable: true,
            statusDescription: item.status_description || 'Ativo'
        }));
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
        const { data, error } = await supabase
            .from('warehouses_materials')
            .select('quantity, min_stock, cost_avg, material_id, warehouse_id, materials(id, code, description, unit, is_deleted), warehouses(id, description)');

        if (error) {
            console.error('Error fetching materials below min stock:', error);
            return [];
        }

        const results: any[] = [];
        for (const row of data || []) {
            const mat = (row as any).materials;
            if (mat?.is_deleted) continue;
            const wh = (row as any).warehouses;
            const qty = row.quantity || 0;
            const minStock = row.min_stock || 0;
            if (minStock > 0 && qty <= minStock) {
                const deficit = minStock - qty;
                results.push({
                    material_id: row.material_id,
                    material_code: mat?.code || '',
                    material_description: mat?.description || '',
                    material_unit: mat?.unit || '',
                    warehouse_id: row.warehouse_id,
                    warehouse_description: wh?.description || '',
                    quantity: qty,
                    min_stock: minStock,
                    cost_avg: row.cost_avg || 0,
                    deficit,
                    deficit_value: deficit * (row.cost_avg || 0),
                });
            }
        }

        return results.sort((a, b) => b.deficit_value - a.deficit_value);
    },

    async getMaterialsStockSummary(): Promise<{
        total_stock_value: number;
        total_materials: number;
        materials_without_stock: number;
        materials_below_min: number;
    }> {
        const { data, error } = await supabase
            .from('warehouses_materials')
            .select('quantity, min_stock, cost_avg, material_id, materials(id, is_deleted)');

        if (error) {
            console.error('Error fetching stock summary:', error);
            return { total_stock_value: 0, total_materials: 0, materials_without_stock: 0, materials_below_min: 0 };
        }

        let totalStockValue = 0;
        let totalMaterials = 0;
        let materialsWithoutStock = 0;
        let materialsBelowMin = 0;
        const seenMaterials = new Set<number | string>();
        const belowMinMats = new Set<number>();

        for (const row of data || []) {
            const mat = (row as any).materials;
            if (mat?.is_deleted) continue;

            const matId = row.material_id;
            if (!seenMaterials.has(matId)) {
                seenMaterials.add(matId);
                totalMaterials++;
            }

            const qty = row.quantity || 0;
            const costAvg = row.cost_avg || 0;
            totalStockValue += qty * costAvg;

            if (qty === 0 && !seenMaterials.has(matId + '_nostock')) {
                seenMaterials.add(matId + '_nostock');
                materialsWithoutStock++;
            }
            if (row.min_stock > 0 && qty <= row.min_stock && !belowMinMats.has(matId)) {
                belowMinMats.add(matId);
                materialsBelowMin++;
            }
        }

        return { total_stock_value: totalStockValue, total_materials: totalMaterials, materials_without_stock: materialsWithoutStock, materials_below_min: materialsBelowMin };
    }

};
