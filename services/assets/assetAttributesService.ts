import { supabase } from '../supabase';
import { AssetAttribute, TypeAttributeConfig } from '../../types';

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
    },

    // ── Type-Attribute Junction (cfg_assets_types_attributes) ──────────────

    async getAllAssetAttributes(): Promise<AssetAttribute[]> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes')
            .select('*')
            .eq('is_deleted', 'false')
            .order('label');

        if (error) {
            console.error('Error fetching all asset attributes:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: String(item.id ?? ''),
            fieldKey: item.field_key || '',
            label: item.label || '',
            dataType: item.data_type || 'text',
            unit: item.unit,
            decimals: item.decimals || 0,
            isAvailable: !!item.is_available
        })) as AssetAttribute[];
    },

    async getAttributesNotLinkedToType(assetTypeId: string): Promise<AssetAttribute[]> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes')
            .select('*')
            .eq('is_deleted', 'false')
            .not('id', 'in',
                supabase.from('cfg_assets_types_attributes')
                    .select('attribute_id')
                    .eq('asset_type_id', assetTypeId)
                    .eq('is_available', 'true')
            )
            .order('label');

        if (error) {
            console.error('Error fetching unlinked attributes:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: String(item.id ?? ''),
            fieldKey: item.field_key || '',
            label: item.label || '',
            dataType: item.data_type || 'text',
            unit: item.unit,
            decimals: item.decimals || 0,
            isAvailable: !!item.is_available
        })) as AssetAttribute[];
    },

    async getTypeAttributeConfigs(assetTypeId: string): Promise<TypeAttributeConfig[]> {
        const { data, error } = await supabase
            .from('cfg_assets_types_attributes')
            .select(`
                id,
                asset_type_id,
                attribute_id,
                is_required,
                order_index,
                col_span,
                is_available,
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
            console.error('Error fetching type attribute configs:', error);
            throw error;
        }

        return (data || []).map((item: any) => {
            const attr = item.cfg_assets_attributes;
            return {
                id: String(item.id ?? ''),
                attributeId: String(attr.id ?? ''),
                fieldKey: attr.field_key || '',
                label: attr.label || '',
                dataType: attr.data_type || 'text',
                unit: attr.unit,
                decimals: attr.decimals || 0,
                isRequired: !!item.is_required,
                orderIndex: item.order_index || 0,
                colSpan: item.col_span || 12,
                isAvailable: !!item.is_available
            };
        });
    },

    async linkAttributeToType(
        assetTypeId: string,
        attributeId: string,
        config: { isRequired?: boolean; orderIndex?: number; colSpan?: number } = {}
    ): Promise<TypeAttributeConfig> {
        const { data, error } = await supabase
            .from('cfg_assets_types_attributes')
            .upsert({
                asset_type_id: parseInt(assetTypeId),
                attribute_id: parseInt(attributeId),
                is_required: config.isRequired ?? false,
                order_index: config.orderIndex ?? 0,
                col_span: config.colSpan ?? 6,
                is_available: true
            }, {
                onConflict: 'asset_type_id,attribute_id'
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: String(data.id),
            attributeId,
            fieldKey: '',
            label: '',
            dataType: 'text',
            isRequired: data.is_required,
            orderIndex: data.order_index,
            colSpan: data.col_span,
            isAvailable: data.is_available
        } as TypeAttributeConfig;
    },

    async unlinkAttributeFromType(assetTypeId: string, attributeId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_types_attributes')
            .update({ is_available: false })
            .eq('asset_type_id', assetTypeId)
            .eq('attribute_id', attributeId);

        if (error) throw error;
    },

    async updateTypeAttributeConfig(
        assetTypeId: string,
        junctionId: string,
        config: { isRequired?: boolean; colSpan?: number }
    ): Promise<void> {
        const dbData: any = {};
        if (config.isRequired !== undefined) dbData.is_required = config.isRequired;
        if (config.colSpan !== undefined) dbData.col_span = config.colSpan;

        const { error } = await supabase
            .from('cfg_assets_types_attributes')
            .update(dbData)
            .eq('id', junctionId)
            .eq('asset_type_id', assetTypeId);

        if (error) throw error;
    },

    async reorderTypeAttributes(assetTypeId: string, orderedJunctionIds: string[]): Promise<void> {
        const updates = orderedJunctionIds.map((junctionId, index) =>
            supabase
                .from('cfg_assets_types_attributes')
                .update({ order_index: index + 1 })
                .eq('id', junctionId)
                .eq('asset_type_id', assetTypeId)
        );

        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Error reordering attributes:', errors);
            throw new Error('Failed to reorder attributes');
        }
    }
};
