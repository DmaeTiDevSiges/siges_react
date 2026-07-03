import { supabase } from '../supabase';
import { OrderFilters } from '../../types';

export const dashboardService = {
    async getDashboardStats(
        filters?: OrderFilters,
        ssFiltersOverride?: OrderFilters,
        osFiltersOverride?: OrderFilters
    ): Promise<{
        ssCounts: { today: number; yesterday: number; sevenDays: number; fifteenDays: number; between16And30: number; moreThan30: number };
        osCounts: Record<number, number>;
        ssSectorCounts?: Array<{ id: string, label: string, count: number }>;
        osSectorCounts?: Array<{ id: string, label: string, count: number }>;
    }> {
        let ssUnscheduledQuery = supabase.from('v_orders')
            .select('requested_at, asset_tag_id, unit_asset_tag_id, asset_tag_description')
            .eq('status_id', 1)
            .is('parent_id', null);

        let osQuery = supabase.from('v_orders')
            .select('status_id, parent_id, asset_tag_id, asset_tag_description')
            .not('status_id', 'in', '(7,8)')
            .not('parent_id', 'is', null);

        const applyFiltersToQuery = (query: any, f: OrderFilters) => {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', f.systemParentId);
            applyFilter('system_id', f.systemId);
            applyFilter('unit_type_parent_id', f.unitTypeParentId);
            applyFilter('unit_type_id', f.unitTypeId);
            applyFilter('unit_id', f.unitId);
            applyFilter('asset_tag_id', f.assetTagId);
            applyFilter('object_id', f.orderObjectId);
            applyFilter('type_id', f.orderTypeId);
            applyFilter('type_sub_id', f.orderTypeSubId);
            applyFilter('contract_id', f.contractId);
            applyFilter('plan_id', f.orderPlanId);
            applyFilter('team_id', f.orderTeamId);
            applyFilter('priority_id', f.priorityId);

            if (f.search) {
                const s = `%${f.search}%`;
                query = query.or(`order_mask.ilike.${s},unit_description.ilike.${s},unit_description_full.ilike.${s},type_description.ilike.${s},requested_services.ilike.${s}`);
            }
            return query;
        };

        if (filters) {
            ssUnscheduledQuery = applyFiltersToQuery(ssUnscheduledQuery, ssFiltersOverride || filters);
            osQuery = applyFiltersToQuery(osQuery, osFiltersOverride || filters);
        }

        const [ssUnscheduledRes, osRes] = await Promise.all([ssUnscheduledQuery, osQuery]);

        if (ssUnscheduledRes.error || osRes.error) {
            console.error('Error fetching dashboard stats:', ssUnscheduledRes.error || osRes.error);
            return {
                ssCounts: { today: 0, yesterday: 0, sevenDays: 0, fifteenDays: 0, between16And30: 0, moreThan30: 0 },
                osCounts: {}
            };
        }

        const ssDataList = ssUnscheduledRes.data || [];
        const osDataList = osRes.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const parseDate = (d: string) => d ? new Date(d) : null;

        const ssCounts = {
            today: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= today; }).length,
            yesterday: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= yesterday && d < today; }).length,
            sevenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= sevenDaysAgo && d < yesterday; }).length,
            fifteenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= fifteenDaysAgo && d < sevenDaysAgo; }).length,
            between16And30: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= thirtyDaysAgo && d < fifteenDaysAgo; }).length,
            moreThan30: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d < thirtyDaysAgo; }).length
        };

        const osCounts: Record<number, number> = {};
        osDataList.forEach((o: any) => {
            if (o.parent_id && o.status_id) {
                osCounts[o.status_id] = (osCounts[o.status_id] || 0) + 1;
            }
        });

        const ssSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        ssDataList.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!ssSectorMap[id]) ssSectorMap[id] = { id, label, count: 0 };
            ssSectorMap[id].count += 1;
        });
        const ssSectorCounts = Object.values(ssSectorMap).sort((a, b) => b.count - a.count);

        const osSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        osDataList.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!osSectorMap[id]) osSectorMap[id] = { id, label, count: 0 };
            osSectorMap[id].count += 1;
        });
        const osSectorCounts = Object.values(osSectorMap).sort((a, b) => b.count - a.count);

        return { ssCounts, osCounts, ssSectorCounts, osSectorCounts };
    },

    async getOrdersVisitsView(filters?: {
        startDate?: string;
        endDate?: string;
        page?: number;
        pageSize?: number;
        contractId?: string | string[];
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        unitId?: string | string[];
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderTypeSubId?: string | string[];
        assetTagId?: string | string[];
        assetTagSubId?: string | string[];
        orderPlanId?: string | string[];
        orderTeamId?: string | string[];
        searchQuery?: string;
    }) {
        const pageSize = filters?.pageSize ?? 100;
        const page = filters?.page ?? 0;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('v_orders_visits')
            .select('*', { count: 'exact' })
            .order('ov_started_at', { ascending: false })
            .range(from, to);

        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const startDate = filters?.startDate || todayStr;
        const endDate = filters?.endDate || todayStr;

        const startStr = startDate.includes('T') || startDate.includes(' ') ? startDate : `${startDate} 00:00:00`;
        query = query.or(`ov_started_at.gte.${startStr},and(ov_started_at.is.null,o_requested_at.gte.${startStr})`);

        const endStr = endDate.includes('T') || endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;
        query = query.or(`ov_started_at.lte.${endStr},and(ov_started_at.is.null,o_requested_at.lte.${endStr})`);

        const applyFilter = (col: string, val?: string | string[]) => {
            if (!val) return;
            if (Array.isArray(val)) {
                if (val.length > 0) query = query.in(col, val);
            } else {
                query = query.eq(col, val);
            }
        };

        applyFilter('o_contract_id', filters?.contractId);
        applyFilter('o_system_parent_id', filters?.systemParentId);
        applyFilter('o_system_id', filters?.systemId);
        applyFilter('o_unit_type_parent_id', filters?.unitTypeParentId);
        applyFilter('o_unit_type_id', filters?.unitTypeId);
        applyFilter('o_unit_id', filters?.unitId);
        applyFilter('o_object_id', filters?.orderObjectId);
        applyFilter('o_type_id', filters?.orderTypeId);
        applyFilter('o_type_sub_id', filters?.orderTypeSubId);
        applyFilter('o_asset_tag_id', filters?.assetTagId);
        applyFilter('o_asset_tag_sub_id', filters?.assetTagSubId);
        applyFilter('o_plan_id', filters?.orderPlanId);
        applyFilter('o_team_id', filters?.orderTeamId);

        if (filters?.searchQuery) {
            const search = `%${filters.searchQuery}%`;
            query = query.or(`ov_mask.ilike.${search},o_unit_description.ilike.${search},client_name.ilike.${search},o_mask.ilike.${search}`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching visits view:', error);
            return { data: [], count: 0 };
        }

        return { data: data ?? [], count: count ?? 0 };
    },

    async getOrdersForCalendar(filters?: {
        startDate?: string;
        endDate?: string;
        contractId?: string | string[];
        systemParentId?: string | string[];
        systemId?: string | string[];
        unitTypeParentId?: string | string[];
        unitTypeId?: string | string[];
        unitId?: string | string[];
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderPlanId?: string | string[];
        orderTeamId?: string | string[];
        searchQuery?: string;
    }): Promise<any[]> {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const startDate = filters?.startDate || todayStr;
        const endDate = filters?.endDate || todayStr;
        const startStr = startDate.includes('T') || startDate.includes(' ') ? startDate : `${startDate} 00:00:00`;
        const endStr = endDate.includes('T') || endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;

        let query = supabase
            .from('v_orders')
            .select('id, order_mask, status_id, status_description, requested_at, unit_description, client_name, plan_description, contract_id, system_parent_id, system_id, unit_type_parent_id, unit_type_id, unit_id, type_id, plan_id, team_id, type_code, type_sub_code')
            .gte('requested_at', startStr)
            .lte('requested_at', endStr)
            .not('parent_id', 'is', null)
            .order('requested_at', { ascending: true });

        const applyFilter = (col: string, val?: string | string[]) => {
            if (!val) return;
            if (Array.isArray(val)) {
                if (val.length > 0) query = query.in(col, val);
            } else {
                query = query.eq(col, val);
            }
        };

        applyFilter('contract_id', filters?.contractId);
        applyFilter('system_parent_id', filters?.systemParentId);
        applyFilter('system_id', filters?.systemId);
        applyFilter('unit_type_parent_id', filters?.unitTypeParentId);
        applyFilter('unit_type_id', filters?.unitTypeId);
        applyFilter('unit_id', filters?.unitId);
        applyFilter('object_id', filters?.orderObjectId);
        applyFilter('type_id', filters?.orderTypeId);
        applyFilter('plan_id', filters?.orderPlanId);
        applyFilter('team_id', filters?.orderTeamId);

        if (filters?.searchQuery) {
            const search = `%${filters.searchQuery}%`;
            query = query.or(`order_mask.ilike.${search},unit_description.ilike.${search},client_name.ilike.${search}`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching orders for calendar:', error);
            return [];
        }
        return data ?? [];
    }
};
