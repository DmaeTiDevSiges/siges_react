import { supabase } from '../supabase';
import { Unit } from '../../types';
import { getPublicImageUrl } from '../imageUtils';

export const unitsService = {
    async searchUnits(search: string = '', limit: number = 50): Promise<Unit[]> {
        let query = supabase
            .from('units')
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .eq('is_deleted', 'false');

        if (search && search.trim().length > 0) {
            const terms = search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data: units, error: unitsError } = await query.limit(limit);

        if (unitsError) {
            console.error('Error searching units:', unitsError);
            throw unitsError;
        }

        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        const typesMap = new Map(unitTypes?.map(t => [t.id, t.description]));
        const systemsMap = new Map(systems?.map(s => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map(st => [st.id, st.description]));

        return (units || []).map((item: any) => ({
            id: item.id.toString(),
            clientId: item.client_id?.toString() || '',
            description: item.description,
            code: item.code,
            installationCodePowerSupply: item.installation_code_power_supply,
            addressFull: item.address_full,
            latitude: item.latitude,
            longitude: item.longitude,
            unitTypeParentId: item.unit_type_parent_id?.toString(),
            unitTypeId: item.unit_type_id?.toString(),
            typeName: typesMap.get(item.unit_type_parent_id),
            subTypeName: typesMap.get(item.unit_type_id),
            systemParentId: item.system_parent_id?.toString(),
            systemId: item.system_id?.toString(),
            systemParentName: systemsMap.get(item.system_parent_id),
            systemName: systemsMap.get(item.system_id),
            imgFilePath: item.img_file_path,
            imgFileName: item.img_file_name,
            statusId: item.status_id?.toString() || '1',
            statusName: statusesMap.get(item.status_id),
            logoUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, {
                width: 400,
                height: 400,
                resize: 'cover'
            }),
            descriptionFull: item.description_full
        })) as Unit[];
    },

    async getUnitById(id: string): Promise<Unit | null> {
        const { data: unitData, error } = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching unit:', error.message);
            return null;
        }

        const [clientRes, typeParentRes, typeSubRes, sysParentRes, sysSubRes, statusRes] = await Promise.all([
            unitData.client_id ? supabase.from('clients').select('name').eq('id', unitData.client_id).single() : Promise.resolve({ data: null }),
            unitData.unit_type_parent_id ? supabase.from('cfg_units_types').select('description').eq('id', unitData.unit_type_parent_id).single() : Promise.resolve({ data: null }),
            unitData.unit_type_id ? supabase.from('cfg_units_types').select('description').eq('id', unitData.unit_type_id).single() : Promise.resolve({ data: null }),
            unitData.system_parent_id ? supabase.from('cfg_systems').select('description').eq('id', unitData.system_parent_id).single() : Promise.resolve({ data: null }),
            unitData.system_id ? supabase.from('cfg_systems').select('description').eq('id', unitData.system_id).single() : Promise.resolve({ data: null }),
            unitData.status_id ? supabase.from('v_units_statuses').select('description').eq('id', unitData.status_id).single() : Promise.resolve({ data: null })
        ]);

        const logoUrl = getPublicImageUrl(unitData.img_file_path, unitData.img_file_name, {
            width: 800,
            height: 800,
            resize: 'contain',
            cacheBust: Date.now()
        });

        const mapped: Unit = {
            id: unitData.id.toString(),
            clientId: unitData.client_id?.toString(),
            clientName: clientRes.data?.name,
            description: unitData.description,
            code: unitData.code,
            installationCodePowerSupply: unitData.installation_code_power_supply,
            addressFull: unitData.address_full,
            latitude: unitData.latitude,
            longitude: unitData.longitude,
            unitTypeParentId: unitData.unit_type_parent_id?.toString(),
            unitTypeId: unitData.unit_type_id?.toString(),
            typeName: typeParentRes.data?.description,
            subTypeName: typeSubRes.data?.description,
            systemParentId: unitData.system_parent_id?.toString(),
            systemId: unitData.system_id?.toString(),
            systemParentName: sysParentRes.data?.description,
            systemName: sysSubRes.data?.description,
            imgFilePath: unitData.img_file_path,
            imgFileName: unitData.img_file_name,
            statusId: unitData.status_id?.toString() || '1',
            statusName: statusRes.data?.description,
            logoUrl: logoUrl,
            descriptionFull: unitData.description_full
        };

        return mapped;
    },

    async createUnit(unit: Partial<Unit>): Promise<Unit> {
        const dbData = {
            client_id: parseInt(unit.clientId!),
            description: unit.description,
            code: unit.code,
            installation_code_power_supply: unit.installationCodePowerSupply,
            address_full: unit.addressFull,
            latitude: unit.latitude,
            longitude: unit.longitude,
            unit_type_parent_id: unit.unitTypeParentId && unit.unitTypeParentId !== '' ? parseInt(unit.unitTypeParentId) : null,
            unit_type_id: unit.unitTypeId && unit.unitTypeId !== '' ? parseInt(unit.unitTypeId) : null,
            system_parent_id: unit.systemParentId && unit.systemParentId !== '' ? parseInt(unit.systemParentId) : null,
            system_id: unit.systemId && unit.systemId !== '' ? parseInt(unit.systemId) : null,
            status_id: unit.statusId ? parseInt(unit.statusId) : 1,
            img_file_path: unit.imgFilePath,
            img_file_name: unit.imgFileName
        };

        const { data, error } = await supabase
            .from('units')
            .insert(dbData)
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .single();

        if (error) throw error;

        return this.getUnitById(data.id.toString()) as any;
    },

    async updateUnit(id: string, unit: Partial<Unit>): Promise<Unit> {
        const dbData: any = {};
        if (unit.clientId !== undefined) dbData.client_id = parseInt(unit.clientId);
        if (unit.description !== undefined) dbData.description = unit.description;
        if (unit.code !== undefined) dbData.code = unit.code;
        if (unit.installationCodePowerSupply !== undefined) dbData.installation_code_power_supply = unit.installationCodePowerSupply;
        if (unit.addressFull !== undefined) dbData.address_full = unit.addressFull;
        if (unit.latitude !== undefined) dbData.latitude = unit.latitude;
        if (unit.longitude !== undefined) dbData.longitude = unit.longitude;
        if (unit.unitTypeParentId !== undefined) dbData.unit_type_parent_id = unit.unitTypeParentId && unit.unitTypeParentId !== '' ? parseInt(unit.unitTypeParentId) : null;
        if (unit.unitTypeId !== undefined) dbData.unit_type_id = unit.unitTypeId && unit.unitTypeId !== '' ? parseInt(unit.unitTypeId) : null;
        if (unit.systemParentId !== undefined) dbData.system_parent_id = unit.systemParentId && unit.systemParentId !== '' ? parseInt(unit.systemParentId) : null;
        if (unit.systemId !== undefined) dbData.system_id = unit.systemId && unit.systemId !== '' ? parseInt(unit.systemId) : null;
        
        if (unit.statusId !== undefined) {
            dbData.status_id = unit.statusId && unit.statusId !== '' ? parseInt(unit.statusId) : null;
        }
        
        if (unit.imgFilePath !== undefined) dbData.img_file_path = unit.imgFilePath;
        if (unit.imgFileName !== undefined) dbData.img_file_name = unit.imgFileName;

        const { data, error } = await supabase
            .from('units')
            .update(dbData)
            .eq('id', id)
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .single();

        if (error) {
            console.error(`Error updating unit:`, error);
            throw error;
        }

        return this.getUnitById(id) as any;
    },

    async deleteUnit(id: string): Promise<void> {
        const { error } = await supabase
            .from('units')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) throw error;
    },

    async getUnitsWithCoordinates(statusFilter?: 'all' | 'active' | 'inactive'): Promise<any[]> {
        let query = supabase
            .from('units')
            .select('id, description, code, address_full, latitude, longitude, status_id, client_id, system_id, unit_type_id')
            .eq('is_deleted', 'false')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (statusFilter === 'active') {
            query = query.eq('status_id', 1);
        } else if (statusFilter === 'inactive') {
            query = query.neq('status_id', 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching units with coordinates:', error);
            return [];
        }

        return data || [];
    },

    async getNearbyUnits(
        latitude: number,
        longitude: number,
        radiusKm: number = 10,
        limit: number = 20
    ): Promise<any[]> {
        const R = 6371;
        const latRad = latitude * Math.PI / 180;
        const lonRad = longitude * Math.PI / 180;
        
        const latMin = (latitude - radiusKm / R * 180 / Math.PI);
        const latMax = (latitude + radiusKm / R * 180 / Math.PI);
        const lonMin = (longitude - radiusKm / (R * Math.cos(latRad)) * 180 / Math.PI);
        const lonMax = (longitude + radiusKm / (R * Math.cos(latRad)) * 180 / Math.PI);

        const { data, error } = await supabase
            .from('units')
            .select('id, description, code, address_full, latitude, longitude, status_id')
            .eq('is_deleted', 'false')
            .eq('status_id', 1)
            .gte('latitude', latMin)
            .lte('latitude', latMax)
            .gte('longitude', lonMin)
            .lte('longitude', lonMax)
            .limit(limit * 3);

        if (error) {
            console.error('Error fetching nearby units:', error);
            return [];
        }

        const unitsWithDistance = (data || []).map((unit: any) => {
            const dLat = (unit.latitude - latitude) * Math.PI / 180;
            const dLon = (unit.longitude - longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(latRad) * Math.cos(unit.latitude * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return { ...unit, distance };
        });

        return unitsWithDistance
            .filter((unit: any) => unit.distance <= radiusKm)
            .sort((a: any, b: any) => a.distance - b.distance)
            .slice(0, limit);
    },
    async getUnits(filter: 'all' | 'active' | 'inactive' = 'active', search: string = ''): Promise<any[]> {
        let query = supabase.from('units').select('*').order('description_full');

        if (filter === 'active') query = query.eq('is_available', true);
        if (filter === 'inactive') query = query.eq('is_available', false);

        if (search && search.trim().length > 0) {
            const terms = search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data: units, error } = await query;
        if (error) {
            console.error('Error fetching units:', error);
            return [];
        }

        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        const typesMap = new Map(unitTypes?.map((t: any) => [t.id, t.description]));
        const systemsMap = new Map(systems?.map((s: any) => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map((st: any) => [st.id, st.description]));

        return (units || []).map((item: any) => ({
            ...item,
            typeName: typesMap.get(item.unit_type_parent_id),
            subTypeName: typesMap.get(item.unit_type_id),
            systemParentName: systemsMap.get(item.system_parent_id),
            systemName: systemsMap.get(item.system_id),
            statusName: statusesMap.get(item.status_id),
            logoUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, {
                width: 400,
                height: 400,
                resize: 'cover'
            }),
        }));
    },

    async getUnitsByIds(ids: string[]): Promise<{ data: any[] | null, error: any }> {
        if (!ids || ids.length === 0) return { data: [], error: null };
        const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        const { data, error } = await supabase
            .from('units')
            .select('id, description, latitude, longitude, img_file_path, img_file_name')
            .in('id', numericIds);
        return { data, error };
    },

    async getFilteredUnits(filters: {
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        search?: string;
    }): Promise<any[]> {
        let query = supabase.from('units').select('*').eq('is_available', true).order('description_full');

        if (filters.systemParentId && (Array.isArray(filters.systemParentId) ? filters.systemParentId.length > 0 : true)) {
            if (Array.isArray(filters.systemParentId)) query = query.in('system_parent_id', filters.systemParentId);
            else query = query.eq('system_parent_id', filters.systemParentId);
        }

        if (filters.systemId && (Array.isArray(filters.systemId) ? filters.systemId.length > 0 : true)) {
            if (Array.isArray(filters.systemId)) query = query.in('system_id', filters.systemId);
            else query = query.eq('system_id', filters.systemId);
        }

        if (filters.unitTypeParentId && (Array.isArray(filters.unitTypeParentId) ? filters.unitTypeParentId.length > 0 : true)) {
            if (Array.isArray(filters.unitTypeParentId)) query = query.in('unit_type_parent_id', filters.unitTypeParentId);
            else query = query.eq('unit_type_parent_id', filters.unitTypeParentId);
        }

        if (filters.unitTypeId && (Array.isArray(filters.unitTypeId) ? filters.unitTypeId.length > 0 : true)) {
            if (Array.isArray(filters.unitTypeId)) query = query.in('unit_type_id', filters.unitTypeId);
            else query = query.eq('unit_type_id', filters.unitTypeId);
        }

        if (filters.search && filters.search.trim().length > 0) {
            const terms = filters.search.trim().split(/\s+/);
            terms.forEach(term => {
                query = query.ilike('description_full', `%${term}%`);
            });
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching filtered units:', error);
            return [];
        }
        return data || [];
    }

};
