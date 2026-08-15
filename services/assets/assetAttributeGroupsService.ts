import { supabase } from '../supabase';
import { AssetAttributeGroup, AssetAttributeGroupOption } from '../../types';

export const assetAttributeGroupsService = {
    // ── Groups (Grupos) CRUD ─────────────────────────────────────────────

    async getGroups(): Promise<AssetAttributeGroup[]> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes_groups')
            .select('id, group_name, description, is_available, parent_id')
            .eq('is_available', true)
            .is('parent_id', null)
            .order('group_name');

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: String(item.id ?? ''),
            group: item.group_name || '',
            description: item.description || '',
            isAvailable: !!item.is_available,
            parentId: item.parent_id ? String(item.parent_id) : null
        }));
    },

    async createGroup(group: string, description?: string): Promise<AssetAttributeGroup> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes_groups')
            .insert({ group_name: group, description: description || '' })
            .select()
            .single();

        if (error) throw error;

        return {
            id: String(data.id ?? ''),
            group: data.group_name || '',
            description: data.description || '',
            isAvailable: !!data.is_available,
            parentId: data.parent_id ? String(data.parent_id) : null
        };
    },

    async updateGroup(id: string, group: string, description?: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_attributes_groups')
            .update({ group_name: group, description: description || '', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteGroup(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_attributes_groups')
            .update({ is_available: false })
            .eq('id', id);

        if (error) throw error;
    },

    // ── Options (Opções - filhos do grupo) CRUD ──────────────────────────

    async getOptionsByGroup(groupId: string): Promise<AssetAttributeGroupOption[]> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes_groups')
            .select('*')
            .eq('parent_id', groupId)
            .eq('is_available', true)
            .order('group_name');

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: String(item.id ?? ''),
            groupId: String(item.parent_id ?? ''),
            group: item.group_name || '',
            description: item.description || '',
            isAvailable: !!item.is_available,
            parentId: item.parent_id ? String(item.parent_id) : null
        }));
    },

    async getOptionsAsSelect(groupId: string): Promise<{ value: string; label: string }[]> {
        const options = await this.getOptionsByGroup(groupId);
        return options.map(opt => ({ value: String(opt.id), label: opt.group }));
    },

    async createOption(groupId: string, group: string, description?: string): Promise<AssetAttributeGroupOption> {
        const { data, error } = await supabase
            .from('cfg_assets_attributes_groups')
            .insert({
                parent_id: parseInt(groupId),
                group_name: group,
                description: description || ''
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: String(data.id ?? ''),
            groupId: String(data.parent_id ?? ''),
            group: data.group_name || '',
            description: data.description || '',
            isAvailable: !!data.is_available,
            parentId: data.parent_id ? String(data.parent_id) : null
        };
    },

    async updateOption(id: string, group: string, description?: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_attributes_groups')
            .update({ group_name: group, description: description || '', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteOption(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_attributes_groups')
            .update({ is_available: false })
            .eq('id', id);

        if (error) throw error;
    }
};
