import { supabase } from '../supabase';
import { Activity, Priority, OrderType, OrderSubType, OrderPlan, OrderObject, Route, Service } from '../../types';

// ── Cache TTL para tipos de OS (raramente mudam) ───────────────────────
const ORDER_TYPES_TTL_MS = 30 * 60 * 1000; // 30 minutos
let orderTypesCache: { data: OrderType[]; expiresAt: number } | null = null;

export const orderConfigService = {
    // ── Activities (cfg_activities) ─────────────────────────────
    async getActivities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Activity[]> {
        let query = supabase
            .from('cfg_activities')
            .select('*')
            .eq('is_deleted', 'false')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', true);
        } else if (filter === 'inactive') {
            query = query.eq('is_available', false);
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: activitiesData, error: activitiesError } = await query;

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
            throw activitiesError;
        }

        if (!activitiesData || activitiesData.length === 0) {
            return [];
        }

        const activityIds = activitiesData.map((a: any) => a.id);

        let allTypeLinks: any[] = [];

        if (activityIds.length > 0) {
            const typesRes = await supabase
                .from('cfg_orders_types_activities')
                .select('activity_id, o_type_id')
                .in('activity_id', activityIds);

            if (!typesRes.error && typesRes.data) allTypeLinks = typesRes.data;
        }

        return activitiesData.map((item: any) => {
            const itemTypeLinks = allTypeLinks.filter(l => l.activity_id === item.id);
            const linkedOrderTypeIds = itemTypeLinks.map(l => l.o_type_id.toString());

            return {
                id: item.id.toString(),
                companyId: item.company_id?.toString(),
                departmentId: item.department_id?.toString(),
                code: item.code || '',
                description: item.description,
                isAvailable: item.is_available ?? true,
                isDeleted: item.is_deleted,
                linkedOrderTypeIds,
                linkedOrderSubTypeIds: []
            };
        });
    },

    async createActivity(activity: Partial<Activity>): Promise<Activity> {
        const dbData = {
            company_id: activity.companyId ? parseInt(activity.companyId) : null,
            department_id: activity.departmentId ? parseInt(activity.departmentId) : null,
            code: activity.code,
            description: activity.description,
            is_available: activity.isAvailable,
            is_deleted: false
        };

        const { data, error } = await supabase
            .from('cfg_activities')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        if (activity.linkedOrderTypeIds && activity.linkedOrderTypeIds.length > 0) {
            const relations = activity.linkedOrderTypeIds.map(orderTypeId => ({
                activity_id: data.id,
                o_type_id: orderTypeId,
                is_available: true
            }));
            await supabase.from('cfg_orders_types_activities').insert(relations);
        }

        return {
            ...activity,
            id: data.id.toString()
        } as Activity;
    },

    async updateActivity(id: string, activity: Partial<Activity>): Promise<Activity> {
        const dbData: any = {};
        if (activity.companyId !== undefined) dbData.company_id = activity.companyId ? parseInt(activity.companyId) : null;
        if (activity.departmentId !== undefined) dbData.department_id = activity.departmentId ? parseInt(activity.departmentId) : null;
        if (activity.code !== undefined) dbData.code = activity.code;
        if (activity.description !== undefined) dbData.description = activity.description;
        if (activity.isAvailable !== undefined) dbData.is_available = activity.isAvailable;

        const { data, error } = await supabase
            .from('cfg_activities')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (activity.linkedOrderTypeIds) {
            await supabase.from('cfg_orders_types_activities').delete().eq('activity_id', id);
            if (activity.linkedOrderTypeIds.length > 0) {
                const relations = activity.linkedOrderTypeIds.map(orderTypeId => ({
                    activity_id: parseInt(id),
                    o_type_id: parseInt(orderTypeId),
                    is_available: true
                }));
                await supabase.from('cfg_orders_types_activities').insert(relations);
            }
        }

        return {
            ...activity,
            id: data.id.toString()
        } as Activity;
    },

    async deleteActivity(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_activities')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) throw error;
    },

    async linkActivityToOrderType(activityId: string, orderTypeId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_activities')
            .insert({
                activity_id: activityId,
                o_type_id: orderTypeId,
                is_available: true
            });

        if (error) {
            console.error('Error linking activity to order type:', error);
            throw error;
        }
    },

    async unlinkActivityFromOrderType(activityId: string, orderTypeId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_activities')
            .delete()
            .eq('activity_id', activityId)
            .eq('o_type_id', orderTypeId);

        if (error) {
            console.error('Error unlinking activity from order type:', error);
            throw error;
        }
    },

    // ── Priorities (cfg_orders_priorities) ──────────────────────
    async getPriorities(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Priority[]> {
        let query = supabase
            .from('cfg_orders_priorities')
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
            console.error('Error fetching priorities:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            color: item.color || undefined
        })) as Priority[];
    },

    async createPriority(priority: Partial<Priority>): Promise<Priority> {
        const dbData = {
            code: priority.code,
            description: priority.description,
            is_available: priority.isAvailable,
            color: priority.color
        };

        const { data, error } = await supabase
            .from('cfg_orders_priorities')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...priority,
            id: data.id.toString()
        } as Priority;
    },

    async updatePriority(id: string, priority: Partial<Priority>): Promise<Priority> {
        const dbData = {
            code: priority.code,
            description: priority.description,
            is_available: priority.isAvailable,
            color: priority.color
        };

        const { data, error } = await supabase
            .from('cfg_orders_priorities')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...priority,
            id: data.id.toString()
        } as Priority;
    },

    async deletePriority(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_priorities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Order Types (cfg_orders_types) ──────────────────────────
    async getOrderTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderType[]> {
        // Cache apenas para a chamada padrão (all + sem busca) — usada nos filtros dos dashboards
        const useCache = filter === 'all' && !search;
        if (useCache && orderTypesCache && Date.now() < orderTypesCache.expiresAt) {
            return orderTypesCache.data;
        }

        let query = supabase
            .from('cfg_orders_types')
            .select(`*`)
            .eq('is_deleted', 'false')
            .order('description');

        if (filter === 'active') {
            query = query.eq('is_available', true);
        } else if (filter === 'inactive') {
            query = query.eq('is_available', false);
        }

        if (search) {
            query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching order types:', error);
            throw error;
        }

        const result = (data || []).map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id?.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            departmentName: item.cfg_departments?.description || 'Desconhecido'
        })) as OrderType[];

        if (useCache) {
            orderTypesCache = { data: result, expiresAt: Date.now() + ORDER_TYPES_TTL_MS };
        }

        return result;
    },

    async createOrderType(orderType: Partial<OrderType>): Promise<OrderType> {
        const dbData = {
            department_id: orderType.departmentId ? parseInt(orderType.departmentId) : null,
            code: orderType.code,
            description: orderType.description,
            is_available: orderType.isAvailable,
            is_deleted: false
        };

        const { data, error } = await supabase
            .from('cfg_orders_types')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderType,
            id: data.id.toString()
        } as OrderType;
    },

    async updateOrderType(id: string, orderType: Partial<OrderType>): Promise<OrderType> {
        const dbData: any = {};
        if (orderType.departmentId !== undefined) dbData.department_id = orderType.departmentId ? parseInt(orderType.departmentId) : null;
        if (orderType.code !== undefined) dbData.code = orderType.code;
        if (orderType.description !== undefined) dbData.description = orderType.description;
        if (orderType.isAvailable !== undefined) dbData.is_available = orderType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderType,
            id: data.id.toString()
        } as OrderType;
    },

    async deleteOrderType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Order Sub-Types (cfg_orders_types_subs) ─────────────────
    async getOrderSubTypes(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderSubType[]> {
        let query = supabase
            .from('cfg_orders_types_subs')
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
            console.error('Error fetching order sub-types:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            orderTypeId: undefined,
            departmentId: item.department_id?.toString(),
            parentId: undefined,
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true
        })) as OrderSubType[];
    },

    async getOrderSubTypesByType(typeId: string): Promise<OrderSubType[]> {
        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .select('*')
            .eq('is_available', 'true')
            .order('description');

        if (error) {
            console.error('Error fetching order sub-types:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            orderTypeId: undefined,
            departmentId: item.department_id?.toString(),
            parentId: undefined,
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true
        })) as OrderSubType[];
    },

    async createOrderSubType(orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        const dbData: any = {};
        if (orderSubType.departmentId !== undefined) dbData.department_id = orderSubType.departmentId ? parseInt(orderSubType.departmentId) : null;
        if (orderSubType.code !== undefined) dbData.code = orderSubType.code;
        if (orderSubType.description !== undefined) dbData.description = orderSubType.description;
        if (orderSubType.isAvailable !== undefined) dbData.is_available = orderSubType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderSubType,
            id: data.id.toString()
        } as OrderSubType;
    },

    async updateOrderSubType(id: string, orderSubType: Partial<OrderSubType>): Promise<OrderSubType> {
        const dbData: any = {};
        if (orderSubType.departmentId !== undefined) dbData.department_id = orderSubType.departmentId ? parseInt(orderSubType.departmentId) : null;
        if (orderSubType.code !== undefined) dbData.code = orderSubType.code;
        if (orderSubType.description !== undefined) dbData.description = orderSubType.description;
        if (orderSubType.isAvailable !== undefined) dbData.is_available = orderSubType.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_types_subs')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderSubType,
            id: data.id.toString()
        } as OrderSubType;
    },

    async deleteOrderSubType(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_types_subs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Order Plans (cfg_orders_plans) ──────────────────────────
    async getOrderPlans(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderPlan[]> {
        let query = supabase
            .from('cfg_orders_plans')
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
            console.error('Error fetching order plans:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            isAvailable: item.is_available ?? true,
            color: item.color || undefined
        })) as OrderPlan[];
    },

    async createOrderPlan(orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        const dbData: any = {};
        if (orderPlan.code !== undefined) dbData.code = orderPlan.code;
        if (orderPlan.description !== undefined) dbData.description = orderPlan.description;
        if (orderPlan.isAvailable !== undefined) dbData.is_available = orderPlan.isAvailable;
        if (orderPlan.color !== undefined) dbData.color = orderPlan.color;

        const { data, error } = await supabase
            .from('cfg_orders_plans')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderPlan,
            id: data.id.toString()
        } as OrderPlan;
    },

    async updateOrderPlan(id: string, orderPlan: Partial<OrderPlan>): Promise<OrderPlan> {
        const dbData: any = {};
        if (orderPlan.code !== undefined) dbData.code = orderPlan.code;
        if (orderPlan.description !== undefined) dbData.description = orderPlan.description;
        if (orderPlan.isAvailable !== undefined) dbData.is_available = orderPlan.isAvailable;
        if (orderPlan.color !== undefined) dbData.color = orderPlan.color;

        const { data, error } = await supabase
            .from('cfg_orders_plans')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderPlan,
            id: data.id.toString()
        } as OrderPlan;
    },

    async deleteOrderPlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_plans')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Order Objects (cfg_orders_objects) ───────────────────────
    async getOrderObjects(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<OrderObject[]> {
        let query = supabase
            .from('cfg_orders_objects')
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
            console.error('Error fetching order objects:', error);
            throw error;
        }

        return (data || []).map(item => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            isAvailable: item.is_available
        }));
    },

    async createOrderObject(orderObject: Partial<OrderObject>): Promise<OrderObject> {
        const dbData: any = {};
        if (orderObject.code !== undefined) dbData.code = orderObject.code;
        if (orderObject.description !== undefined) dbData.description = orderObject.description;
        if (orderObject.isAvailable !== undefined) dbData.is_available = orderObject.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_objects')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderObject,
            id: data.id.toString()
        } as OrderObject;
    },

    async updateOrderObject(id: string, orderObject: Partial<OrderObject>): Promise<OrderObject> {
        const dbData: any = {};
        if (orderObject.code !== undefined) dbData.code = orderObject.code;
        if (orderObject.description !== undefined) dbData.description = orderObject.description;
        if (orderObject.isAvailable !== undefined) dbData.is_available = orderObject.isAvailable;

        const { data, error } = await supabase
            .from('cfg_orders_objects')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...orderObject,
            id: data.id.toString()
        } as OrderObject;
    },

    async deleteOrderObject(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_orders_objects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Routes (cfg_routes) ─────────────────────────────────────
    async getAllRoutes(): Promise<Route[]> {
        const { data, error } = await supabase
            .from('cfg_routes')
            .select('*')
            .eq('is_available', true)
            .order('order_index');

        if (error) {
            console.error('Error fetching routes:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            description: item.description,
            icon: item.icon,
            parentId: item.parent_id?.toString(),
            orderIndex: item.order_index,
            isAvailable: item.is_available
        })) as Route[];
    },

    // ── Services (cfg_services) ─────────────────────────────────
    async getServices(filter: 'all' | 'active' | 'inactive' = 'all', search: string = ''): Promise<Service[]> {
        let query = supabase
            .from('cfg_services')
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
            console.error('Error fetching services:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.description,
            unit: item.unit || '',
            isAvailable: item.is_available ?? true
        })) as Service[];
    },

    async createService(service: Partial<Service>): Promise<Service> {
        const dbData = {
            code: service.code,
            description: service.description,
            unit: service.unit,
            is_available: service.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_services')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            unit: data.unit || '',
            isAvailable: data.is_available
        } as Service;
    },

    async updateService(id: string, service: Partial<Service>): Promise<Service> {
        const dbData = {
            code: service.code,
            description: service.description,
            unit: service.unit,
            is_available: service.isAvailable
        };

        const { data, error } = await supabase
            .from('cfg_services')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            unit: data.unit || '',
            isAvailable: data.is_available
        } as Service;
    },

    // ── Reasons (cfg_orders_*) ──────────────────────────────────
    async getOrdersObjects(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_objects').select('*').order('description');
        if (error) { console.error('Error fetching order objects:', error); return []; }
        return data || [];
    },

    async getPlans(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_plans').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching plans:', error); return []; }
        return data || [];
    },

    async getCancelReasons(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_cancel_reasons').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching cancel reasons:', error); return []; }
        return data || [];
    },

    async getSuspendedReasons(): Promise<any[]> {
        const { data, error } = await supabase
            .from('cfg_orders_suspended_reasons')
            .select('id, description')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching suspended reasons:', error);
            return [];
        }

        return data || [];
    },

    async getOrderCauseReasons(): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_orders_causes_reasons')
            .select('id, description')
            .eq('is_availabe', true)
            .order('description');

        if (error) {
            console.error('Error fetching order cause reasons:', error);
            return [];
        }

        return data || [];
    }
};
