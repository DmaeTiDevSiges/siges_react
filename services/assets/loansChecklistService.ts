import { supabase } from '../supabase';
import { LoansChecklist, CreateLoansChecklistInput, UpdateLoansChecklistInput } from '../../types';

const mapChecklist = (item: any): LoansChecklist => ({
    id: item.id.toString(),
    description: item.description,
    sortOrder: item.sort_order,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
});

export const loansChecklistService = {
    async getChecklists(): Promise<LoansChecklist[]> {
        const { data, error } = await supabase
            .from('cfg_loans_checklists')
            .select('*')
            .order('sort_order');

        if (error) {
            console.error('Error fetching loans checklists:', error);
            throw error;
        }

        return (data || []).map(mapChecklist);
    },

    async getChecklistById(id: string): Promise<LoansChecklist> {
        const { data, error } = await supabase
            .from('cfg_loans_checklists')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (error) {
            console.error('Error fetching loans checklist:', error);
            throw error;
        }

        return mapChecklist(data);
    },

    async createChecklist(input: CreateLoansChecklistInput): Promise<LoansChecklist> {
        const { data, error } = await supabase
            .from('cfg_loans_checklists')
            .insert([{
                description: input.description,
                sort_order: input.sortOrder || 0,
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating loans checklist:', error);
            throw error;
        }

        return mapChecklist(data);
    },

    async updateChecklist(id: string, input: UpdateLoansChecklistInput): Promise<LoansChecklist> {
        const updates: any = {};
        if (input.description !== undefined) updates.description = input.description;
        if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
        if (input.isActive !== undefined) updates.is_active = input.isActive;

        const { error } = await supabase
            .from('cfg_loans_checklists')
            .update(updates)
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error updating loans checklist:', error);
            throw error;
        }

        return this.getChecklistById(id);
    },

    async deleteChecklist(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_loans_checklists')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error deleting loans checklist:', error);
            throw error;
        }
    },

    async getChecklistAssetTypes(checklistId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('cfg_assets_types_loans_checklists')
            .select('asset_type_id')
            .eq('checklist_id', parseInt(checklistId));

        if (error) {
            console.error('Error fetching checklist asset types:', error);
            throw error;
        }

        return (data || []).map((item: any) => item.asset_type_id.toString());
    },

    async setChecklistAssetTypes(checklistId: string, assetTypeIds: string[]): Promise<void> {
        // Remove existing associations
        await supabase
            .from('cfg_assets_types_loans_checklists')
            .delete()
            .eq('checklist_id', parseInt(checklistId));

        // Insert new associations
        if (assetTypeIds.length > 0) {
            const associations = assetTypeIds.map(assetTypeId => ({
                checklist_id: parseInt(checklistId),
                asset_type_id: parseInt(assetTypeId),
            }));

            const { error } = await supabase
                .from('cfg_assets_types_loans_checklists')
                .insert(associations);

            if (error) {
                console.error('Error setting checklist asset types:', error);
                throw error;
            }
        }
    },

    async isChecklistInUse(checklistId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('assets_loans_checklists')
            .select('id', { count: 'exact', head: true })
            .eq('loan_checklist_id', parseInt(checklistId));

        if (error) {
            console.error('Error checking if checklist is in use:', error);
            return false;
        }

        return (count || 0) > 0;
    },
};
