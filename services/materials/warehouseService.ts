import { supabase } from '../supabase';
import { usersService } from '../users/usersService';

export const warehouseService = {
    async getWarehouses(companyId?: string): Promise<{ id: string; code: string; description: string; address?: string }[]> {
        let query = supabase
            .from('warehouses')
            .select('id, code, description, address')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');

        if (companyId) {
            query = query.eq('company_id', parseInt(companyId));
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            address: item.address || ''
        }));
    },

    async getWarehouseMaterials(materialId: string): Promise<{ warehouse_id: string; warehouse_code: string; warehouse_description: string; warehouse_address?: string; quantity: number; min_stock: number; cost_avg: number }[]> {
        const { data, error } = await supabase
            .from('warehouses_materials')
            .select('warehouse_id, quantity, min_stock, cost_avg, warehouses(id, code, description, address)')
            .eq('material_id', parseInt(materialId));

        if (error) throw error;

        return (data || []).map((item: any) => ({
            warehouse_id: item.warehouse_id?.toString() || '',
            warehouse_code: item.warehouses?.code || '',
            warehouse_description: item.warehouses?.description || '',
            warehouse_address: item.warehouses?.address || '',
            quantity: item.quantity || 0,
            min_stock: item.min_stock || 0,
            cost_avg: item.cost_avg || 0
        })).sort((a, b) => a.warehouse_description.localeCompare(b.warehouse_description));
    },

    async getWarehouseMaterialsByIds(materialIds: string[]): Promise<Record<string, { warehouse_id: string; warehouse_code: string; warehouse_description: string; warehouse_address?: string; quantity: number; min_stock: number; cost_avg: number }[]>> {
        if (materialIds.length === 0) return {};

        const { data, error } = await supabase
            .from('warehouses_materials')
            .select('material_id, warehouse_id, quantity, min_stock, cost_avg, warehouses(id, code, description, address)')
            .in('material_id', materialIds.map(id => parseInt(id)));

        if (error) throw error;

        const result: Record<string, any[]> = {};
        for (const item of data || []) {
            const matId = item.material_id?.toString() || '';
            if (!result[matId]) result[matId] = [];
            result[matId].push({
                warehouse_id: item.warehouse_id?.toString() || '',
                warehouse_code: item.warehouses?.code || '',
                warehouse_description: item.warehouses?.description || '',
                warehouse_address: item.warehouses?.address || '',
                quantity: item.quantity || 0,
                min_stock: item.min_stock || 0,
                cost_avg: item.cost_avg || 0
            });
        }
        return result;
    },

    async createWarehouseMaterial(data: { warehouseId: string; materialId: string; quantity: number; minStock: number; priceUnit?: number }): Promise<void> {
        const currentUser = await usersService.getCurrentUser();

        const dbData: any = {
            warehouse_id: parseInt(data.warehouseId),
            material_id: parseInt(data.materialId),
            quantity: data.quantity,
            min_stock: data.minStock,
            cost_avg: data.priceUnit ?? 0
        };

        const { error } = await supabase
            .from('warehouses_materials')
            .insert(dbData);

        if (error) throw error;

        if (data.priceUnit !== undefined) {
            await supabase
                .from('materials')
                .update({ price_unit: data.priceUnit })
                .eq('id', parseInt(data.materialId));
        }
    },

    async updateWarehouseMaterial(warehouseId: string, materialId: string, data: { quantity?: number; minStock?: number; costAvg?: number }): Promise<void> {
        const dbData: any = { updated_at: new Date().toISOString() };
        if (data.quantity !== undefined) dbData.quantity = data.quantity;
        if (data.minStock !== undefined) dbData.min_stock = data.minStock;
        if (data.costAvg !== undefined) dbData.cost_avg = data.costAvg;

        const { error } = await supabase
            .from('warehouses_materials')
            .update(dbData)
            .eq('warehouse_id', parseInt(warehouseId))
            .eq('material_id', parseInt(materialId));

        if (error) throw error;
    }
};
