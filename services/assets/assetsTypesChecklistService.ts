import { supabase } from '../supabase';
import { AssetLoanChecklistType } from '../../types';

export const assetsTypesChecklistService = {
    async getChecklistTypes(): Promise<AssetLoanChecklistType[]> {
        const { data, error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .select(`
                id,
                checklist_id,
                asset_type_id,
                cfg_loans_checklists:checklist_id (
                    description,
                    sort_order,
                    is_active
                ),
                cfg_assets_types:asset_type_id (
                    description
                )
            `)
            .order('asset_type_id');

        if (error) {
            console.error('Error fetching checklist types:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            assetTypeId: item.asset_type_id.toString(),
            checklistId: item.checklist_id?.toString(),
            itemDescription: item.cfg_loans_checklists?.description || '',
            sortOrder: item.cfg_loans_checklists?.sort_order || 0,
            isActive: item.cfg_loans_checklists?.is_active ?? true,
            assetTypeName: item.cfg_assets_types?.description,
        }));
    },

    async getChecklistTypesByAssetType(assetTypeId: string): Promise<AssetLoanChecklistType[]> {
        const { data, error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .select(`
                id,
                checklist_id,
                asset_type_id,
                cfg_loans_checklists:checklist_id (
                    description,
                    sort_order,
                    is_active
                )
            `)
            .eq('asset_type_id', parseInt(assetTypeId))
            .order('cfg_loans_checklists(sort_order)');

        if (error) {
            console.error('Error fetching checklist types by asset type:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            assetTypeId: item.asset_type_id.toString(),
            checklistId: item.checklist_id?.toString(),
            itemDescription: item.cfg_loans_checklists?.description || '',
            sortOrder: item.cfg_loans_checklists?.sort_order || 0,
            isActive: item.cfg_loans_checklists?.is_active ?? true,
        }));
    },

    async getChecklistTypeById(id: string): Promise<AssetLoanChecklistType> {
        const { data, error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .select(`
                id,
                checklist_id,
                asset_type_id,
                cfg_loans_checklists:checklist_id (
                    description,
                    sort_order,
                    is_active
                ),
                cfg_assets_types:asset_type_id (
                    description
                )
            `)
            .eq('id', parseInt(id))
            .single();

        if (error) {
            console.error('Error fetching checklist type:', error);
            throw error;
        }

        return {
            id: data.id.toString(),
            assetTypeId: data.asset_type_id.toString(),
            checklistId: data.checklist_id?.toString(),
            itemDescription: (data as any).cfg_loans_checklists?.description || '',
            sortOrder: (data as any).cfg_loans_checklists?.sort_order || 0,
            isActive: (data as any).cfg_loans_checklists?.is_active ?? true,
            assetTypeName: (data as any).cfg_assets_types?.description,
        };
    },

    async createChecklistType(assetTypeId: string, checklistId: string): Promise<AssetLoanChecklistType> {
        const { data, error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .insert([{
                asset_type_id: parseInt(assetTypeId),
                checklist_id: parseInt(checklistId),
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating checklist type association:', error);
            throw error;
        }

        return this.getChecklistTypeById(data.id.toString());
    },

    async deleteChecklistType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error deleting checklist type association:', error);
            throw error;
        }
    },

    async reorderChecklistTypes(assetTypeId: string, orderedIds: string[]): Promise<void> {
        const updates = orderedIds.map((id, index) =>
            supabase
                .from('cfg_assets_types_loans_checklists')
                .update({ /* no column for sort_order on junction table, use cfg_loans_checklists.sort_order via checklist_id */ })
                .eq('id', parseInt(id))
        );

        // Update sort_order on cfg_loans_checklists for each checklist
        for (let index = 0; index < orderedIds.length; index++) {
            const junctionId = orderedIds[index];
            // First get the checklist_id from the junction table
            const { data: junction } = await supabase
                .from('cfg_assets_types_loans_checklists')
                .select('checklist_id')
                .eq('id', parseInt(junctionId))
                .single();

            if (junction) {
                await supabase
                    .from('cfg_loans_checklists')
                    .update({ sort_order: index })
                    .eq('id', junction.checklist_id);
            }
        }
    },

    async getAvailableChecklistsForAssetType(assetTypeId: string): Promise<{ id: string; description: string }[]> {
        // Get all active checklists NOT already associated with this asset type
        const { data: allChecklists } = await supabase
            .from('cfg_loans_checklists')
            .select('id, description')
            .eq('is_active', true)
            .order('sort_order');

        const { data: associated } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .select('checklist_id')
            .eq('asset_type_id', parseInt(assetTypeId));

        const associatedIds = new Set((associated || []).map((a: any) => a.checklist_id));

        return (allChecklists || [])
            .filter((c: any) => !associatedIds.has(c.id))
            .map((c: any) => ({ id: c.id.toString(), description: c.description }));
    },

    async addChecklistsToAssetType(assetTypeId: string, checklistIds: string[]): Promise<void> {
        const associations = checklistIds.map(checklistId => ({
            asset_type_id: parseInt(assetTypeId),
            checklist_id: parseInt(checklistId),
        }));

        const { error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .insert(associations);

        if (error) {
            console.error('Error adding checklists to asset type:', error);
            throw error;
        }
    },
};
