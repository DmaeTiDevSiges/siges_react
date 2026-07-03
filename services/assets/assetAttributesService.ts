import { supabase } from '../supabase';
import { AssetAttribute } from '../../types';

export const assetAttributesService = {
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
        const { error: deleteError } = await supabase
            .from('assets_attributes_values')
            .delete()
            .eq('asset_id', assetId);

        if (deleteError) {
            console.error('Error deleting old attribute values:', deleteError);
            throw deleteError;
        }

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
    }
};
