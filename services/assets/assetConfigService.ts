import { supabase } from '../supabase';
import { AssetType, AssetStatus, AssetPriority } from '../../types';

export const assetConfigService = {
    // ── Asset Types ──────────────────────────────────────────────
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

    // ── Asset Statuses ───────────────────────────────────────────
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

    // ── Asset Priorities ─────────────────────────────────────────
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
    }
};
