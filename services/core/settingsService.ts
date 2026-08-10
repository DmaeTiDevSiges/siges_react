import { supabase } from '../supabase';
import { System, UnitType } from '../../types';

// ── Cache TTL para dados de configuração (raramente mudam) ──────────────────
const TTL_MS = 30 * 60 * 1000; // 30 minutos

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache: {
    systemsParent?: CacheEntry<System[]>;
    unitTypesParent?: CacheEntry<UnitType[]>;
    processingConfigs?: CacheEntry<any[]>;
} = {};

const isFresh = <T>(entry?: CacheEntry<T>): entry is CacheEntry<T> =>
    !!entry && Date.now() < entry.expiresAt;

export const settingsService = {
    async getAppConfig() {
        try {
            const { data, error } = await supabase
                .from('cfg_app')
                .select('*')
                .limit(1)
                .single();
            if (error) {
                console.error('Error fetching cfg_app:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Exception fetching cfg_app:', error);
            return null;
        }
    },

    async getProcessingConfigurations() {
        if (isFresh(cache.processingConfigs)) return cache.processingConfigs.data;

        const { data, error } = await supabase
            .from('cfg_orders_visits_processing')
            .select('*')
            .order('id');

        if (error) {
            console.error('Error fetching processing configs:', error);
            return [];
        }

        const result = data as { id: number, description: string, icon: string, icon_color: string, bg_color: string }[];
        cache.processingConfigs = { data: result, expiresAt: Date.now() + TTL_MS };
        return result;
    },

    // ── Systems ──────────────────────────────────────────────────
    async getSystemsParent(): Promise<System[]> {
        if (isFresh(cache.systemsParent)) return cache.systemsParent.data;

        const { data, error } = await supabase
            .from('cfg_systems')
            .select('*')
            .is('parent_id', null)
            .eq('is_deleted', 'false')
            .eq('is_available', 'true')
            .order('description');

        if (error) {
            console.error('Error fetching parent systems:', error);
            return [];
        }

        const result = (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as System[];

        cache.systemsParent = { data: result, expiresAt: Date.now() + TTL_MS };
        return result;
    },

    async getSystems(parentId?: string): Promise<System[]> {
        let query = supabase
            .from('cfg_systems')
            .select('*')
            .eq('is_available', 'true')
            .eq('is_deleted', 'false')
            .order('description');

        if (parentId) query = query.eq('parent_id', parentId);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching systems:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as System[];
    },

    async updateSystem(id: string, data: Partial<System>): Promise<void> {
        const { error } = await supabase.from('cfg_systems').update(data).eq('id', id);
        if (error) throw error;
        cache.systemsParent = undefined; // Invalida cache após escrita
    },

    async createSystem(data: Partial<System>): Promise<void> {
        const { error } = await supabase.from('cfg_systems').insert(data);
        if (error) throw error;
        cache.systemsParent = undefined; // Invalida cache após escrita
    },

    async getSubSystems(systemId?: string): Promise<any[]> {
        return [];
    },

    // ── Unit Types ───────────────────────────────────────────────
    async getUnitTypesParent(): Promise<UnitType[]> {
        if (isFresh(cache.unitTypesParent)) return cache.unitTypesParent.data;

        const { data, error } = await supabase
            .from('cfg_units_types')
            .select('*')
            .is('parent_id', null)
            .eq('is_deleted', 'false')
            .eq('is_available', 'true')
            .order('description');

        if (error) {
            console.error('Error fetching parent unit types:', error);
            return [];
        }

        const result = (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as UnitType[];

        cache.unitTypesParent = { data: result, expiresAt: Date.now() + TTL_MS };
        return result;
    },

    async getUnitTypes(parentId?: string): Promise<UnitType[]> {
        let query = supabase
            .from('cfg_units_types')
            .select('*')
            .eq('is_available', 'true')
            .eq('is_deleted', 'false')
            .order('description');

        if (parentId) query = query.eq('parent_id', parentId);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching unit types:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            parentId: item.parent_id?.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        })) as UnitType[];
    },

    async updateUnitType(id: string, data: Partial<UnitType>): Promise<void> {
        const { error } = await supabase.from('cfg_units_types').update(data).eq('id', id);
        if (error) throw error;
        cache.unitTypesParent = undefined; // Invalida cache após escrita
    },

    async createUnitType(data: Partial<UnitType>): Promise<void> {
        const { error } = await supabase.from('cfg_units_types').insert(data);
        if (error) throw error;
        cache.unitTypesParent = undefined; // Invalida cache após escrita
    }
};
