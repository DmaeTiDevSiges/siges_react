import { supabase } from './supabase';
import { OrderFilters, TeamShiftsMonthly, TeamIdleEvolutionPoint, ApprovedVisitRow, TeamShiftsRecord } from '../../types';
import { usersService } from '../users/usersService';
import { visitsService } from '../orders/visitsService';
import { teamShiftsRecordsService } from './teamShiftsRecordsService';

// ---------------------------------------------------------------------------
// Ociosidade das equipes — helpers puros (aba OCIOSIDADE)
// ---------------------------------------------------------------------------

const IDLE_DEFAULT_SHIFT_START = '08:00';
const IDLE_DEFAULT_SHIFT_END = '18:00';

const parseClockToMinutes = (value?: string | null): number | null => {
    if (!value) return null;
    const [h, m] = value.split(':');
    const hh = Number(h);
    const mm = Number(m || 0);
    if (!Number.isFinite(hh) || hh < 0 || hh > 24) return null;
    if (!Number.isFinite(mm) || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
};

/** Duração do turno em minutos; default 08:00–18:00 (600min) sem turno cadastrado. */
const getTeamShiftMinutes = (shiftStart?: string, shiftEnd?: string): number => {
    const start = parseClockToMinutes(shiftStart) ?? parseClockToMinutes(IDLE_DEFAULT_SHIFT_START)!;
    const end = parseClockToMinutes(shiftEnd) ?? parseClockToMinutes(IDLE_DEFAULT_SHIFT_END)!;
    if (end <= start) return 600;
    return end - start;
};

/** Dias úteis (seg–sex) de um mês (month 1-based). */
const countBusinessDays = (year: number, month: number): number => {
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let count = 0;
    for (let day = 1; day <= lastDay; day++) {
        const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        if (dow >= 1 && dow <= 5) count++;
    }
    return count;
};

/**
 * Interpreta timestamp naive do banco ('YYYY-MM-DD HH:MM:SS' ou ISO
 * 'YYYY-MM-DDTHH:mm:ss'). Dois valores parseados no mesmo fuso produz
 * diferença correta — é só o delta que nos interessa.
 */
const parseVisitTimestamp = (value: string): number => {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const ms = Date.parse(normalized);
    return Number.isFinite(ms) ? ms : NaN;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

export const dashboardService = {
    async getAuthorizedOrdersFromStatusLogs(
        orderIds: Array<string | number>
    ): Promise<Array<{ orderId: string; authorizedAt: string | null }>> {
        const ids = [...new Set(orderIds.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
        if (ids.length === 0) return [];

        const authorizedOrders = new Map<string, { orderId: string; authorizedAt: string | null }>();
        const orderIdChunkSize = 500;
        const pageSize = 1000;

        for (let i = 0; i < ids.length; i += orderIdChunkSize) {
            const orderIdChunk = ids.slice(i, i + orderIdChunkSize);
            let from = 0;

            while (true) {
                const { data, error } = await supabase
                    .from('orders_statuses_logs')
                    .select('order_id, order_status_at, created_date')
                    .eq('order_status_id', 3)
                    .in('order_id', orderIdChunk)
                    .order('id', { ascending: true })
                    .range(from, from + pageSize - 1);

                if (error) throw error;

                for (const row of data ?? []) {
                    const orderId = String(row.order_id);
                    authorizedOrders.set(orderId, {
                        orderId,
                        authorizedAt: row.order_status_at || row.created_date || null,
                    });
                }

                if (!data || data.length < pageSize) break;
                from += pageSize;
            }
        }

        return [...authorizedOrders.values()];
    },

    async getDashboardStats(
        filters?: OrderFilters,
        ssFiltersOverride?: OrderFilters,
        osFiltersOverride?: OrderFilters,
        viewName?: string
    ): Promise<{
        ssCounts: { today: number; yesterday: number; sevenDays: number; fifteenDays: number; between16And30: number; moreThan30: number };
        osCounts: Record<number, number>;
        ssSectorCounts?: Array<{ id: string, label: string, count: number }>;
        osSectorCounts?: Array<{ id: string, label: string, count: number }>;
    }> {
        const ssViewName = viewName || 'v_orders';
        const osViewName = viewName || 'v_orders';
        const isParentView = viewName === 'v_orders_parent';
        
        let ssUnscheduledQuery = supabase.from(ssViewName)
            .select('requested_at, asset_tag_id, unit_asset_tag_id, asset_tag_description')
            .eq('status_id', 1)
            .is('parent_id', null);

        let osQuery = supabase.from(osViewName)
            .select('status_id, parent_id, asset_tag_id, asset_tag_description')
            .not('status_id', 'in', '(7,8)');

        if (!isParentView) {
            osQuery = osQuery.not('parent_id', 'is', null);
        }

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
            applyFilter('provider_company_id', f.providerCompanyId);

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
            if (o.status_id) {
                osCounts[o.status_id] = (osCounts[o.status_id] || 0) + 1;
            }
        });

        const ssSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        const periodFilter = ssFiltersOverride?.period || filters?.period;
        let sectorDataList = ssDataList;
        if (periodFilter) {
            sectorDataList = ssDataList.filter((o: any) => {
                const d = parseDate(o.requested_at);
                if (!d) return false;
                if (periodFilter === 'Hoje') return d >= today;
                if (periodFilter === 'Ontem') return d >= yesterday && d < today;
                if (periodFilter === '2-7 dias') return d >= sevenDaysAgo && d < yesterday;
                if (periodFilter === '8-15 dias') return d >= fifteenDaysAgo && d < sevenDaysAgo;
                if (periodFilter === '16-30 dias') return d >= thirtyDaysAgo && d < fifteenDaysAgo;
                if (periodFilter === '> 30 dias') return d < thirtyDaysAgo;
                return true;
            });
        }

        sectorDataList.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!ssSectorMap[id]) ssSectorMap[id] = { id, label, count: 0 };
            ssSectorMap[id].count += 1;
        });
        const ssSectorCounts = Object.values(ssSectorMap).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

        const osStatusFilter = osFiltersOverride?.statusId;
        let osSectorCountSource = osDataList;
        if (osStatusFilter) {
            const statusIdNum = Array.isArray(osStatusFilter) ? Number(osStatusFilter[0]) : Number(osStatusFilter);
            if (!Number.isNaN(statusIdNum)) {
                osSectorCountSource = osDataList.filter((o: any) => o.status_id === statusIdNum);
            }
        }

        const osSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        osSectorCountSource.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!osSectorMap[id]) osSectorMap[id] = { id, label, count: 0 };
            osSectorMap[id].count += 1;
        });
        const osSectorCounts = Object.values(osSectorMap).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

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
        causeReasonId?: string | string[];
        orderPlanId?: string | string[];
        orderTeamId?: string | string[];
        responsibleTeamId?: string | string[];
        providerCompanyId?: string | string[];
        searchQuery?: string;
        includeEndedInRange?: boolean;
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
        const pad = (n: number) => String(n).padStart(2, '0');
        const monthStart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
        const monthEnd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())}`;

        const startDate = filters?.startDate || monthStart;
        const endDate = filters?.endDate || monthEnd;

        const startStr = startDate.includes('T') || startDate.includes(' ') ? startDate : `${startDate} 00:00:00`;
        const endStr = endDate.includes('T') || endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;

        if (filters?.includeEndedInRange) {
            // Modo "visitas do dia": inclui visitas abertas (independente do
            // dia de início) e visitas cujo início OU fim cai no intervalo.
            // Usado apenas pela tela de visitas de hoje para não duplicar
            // visitas de vários dias nos dashboards de período.
            query = query.or(
                `ov_status_id.eq.1,` +
                `and(ov_started_at.gte.${startStr},ov_started_at.lte.${endStr}),` +
                `and(ov_ended_at.gte.${startStr},ov_ended_at.lte.${endStr}),` +
                `and(ov_started_at.is.null,o_requested_at.gte.${startStr},o_requested_at.lte.${endStr})`
            );
        } else {
            query = query.or(`ov_started_at.gte.${startStr},and(ov_started_at.is.null,o_requested_at.gte.${startStr})`);
            query = query.or(`ov_started_at.lte.${endStr},and(ov_started_at.is.null,o_requested_at.lte.${endStr})`);
        }

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
        applyFilter('o_cause_reason_id', filters?.causeReasonId);
        applyFilter('o_plan_id', filters?.orderPlanId);
        applyFilter('o_team_id', filters?.orderTeamId);
        applyFilter('o_team_id', filters?.responsibleTeamId);
        applyFilter('o_provider_company_id', filters?.providerCompanyId);

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
    },

    /**
     * Ociosidade e turnos das equipes por mês (aba OCIOSIDADE).
     *
     * Escopo: apenas equipes **avaliáveis** (`cfg_teams.is_evaluable = true`) do
     * departamento do usuário logado (cfg_teams.department_id, já refletido em
     * currentUser.departmentId via join da equipe do usuário).
     *
     * Ociosidade % = 1 − (minutos de visitas aprovadas ÷ minutos de turno
     * disponíveis no mês), limitado a 0–100.
     * - Visitas aprovadas: ov_processing_id = 5, atribuídas ao mês de ov_started_at.
     * - Turno disponível: dias úteis (seg–sex) × duração do turno do líder
     *   (default 08:00–18:00).
     * - Lançamentos manuais (normal/extra) vêm junto, apenas como registro —
     *   não alimentam o cálculo.
     *
     * Também retorna, por equipe:
     * - suggestedExtraShifts: dias distintos com visita aprovada fora do turno
     *   (fim de semana, virada de dia ou término após o fim do turno);
     * - evolution + idlePercentPrevious/idleDelta: série de `months` meses
     *   (padrão 6) terminando no mês alvo;
     * - visits: drill-down das visitas aprovadas do mês.
     */
    async getTeamShiftsStats(
        companyId: string | undefined,
        departmentId: string | undefined,
        year: number,
        month: number,
        months = 6
    ): Promise<TeamShiftsMonthly[]> {
        if (!departmentId) return [];

        // Apenas equipes avaliáveis: cfg_teams.is_evaluable = true
        // (getTeams já traz isEvaluable com default true; exclui só o false explícito)
        const teams = (await usersService.getTeams(companyId, departmentId))
            .filter(team => team.isEvaluable !== false);
        if (teams.length === 0) return [];

        const pad = (n: number) => String(n).padStart(2, '0');
        const targetKey = `${year}-${pad(month)}`;
        const monthStr = `${targetKey}-01`;
        const teamIds = teams.map(t => t.id);

        const [records, approvedVisits, leaderShifts] = await Promise.all([
            teamShiftsRecordsService.getTeamShiftsRecords(monthStr),
            companyId
                ? visitsService.getApprovedVisitsByCompanyMonth(companyId, year, month, months)
                : Promise.resolve([]),
            usersService.getTeamLeadersShifts(teamIds)
        ]) as [TeamShiftsRecord[], ApprovedVisitRow[], Array<{ teamId: string; shiftStart: string; shiftEnd: string }>];

        const recordByTeam = new Map(records.map(r => [r.teamId, r]));
        const shiftByTeam = new Map(leaderShifts.map(s => [s.teamId, s]));

        // Série da evolução: `months` meses terminando no mês alvo
        const seriesKeys: Array<{ key: string; year: number; month: number }> = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(year, month - 1 - i, 1));
            seriesKeys.push({
                key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`,
                year: d.getUTCFullYear(),
                month: d.getUTCMonth() + 1
            });
        }

        // Agrega minutos e lista de visitas por equipe × mês
        const minutesByTeamMonth = new Map<string, Map<string, number>>();
        const visitsByTeamMonth = new Map<string, Map<string, ApprovedVisitRow[]>>();
        for (const visit of approvedVisits) {
            if (!visit.ovStartedAt || !visit.ovEndedAt) continue;
            const startMs = parseVisitTimestamp(visit.ovStartedAt);
            const endMs = parseVisitTimestamp(visit.ovEndedAt);
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) continue;

            const minutes = Math.round((endMs - startMs) / 60000);
            const key = visit.ovStartedAt.substring(0, 7); // 'YYYY-MM' — premissa: mês do início

            const teamMonths = minutesByTeamMonth.get(visit.teamId) ?? new Map<string, number>();
            teamMonths.set(key, (teamMonths.get(key) ?? 0) + minutes);
            minutesByTeamMonth.set(visit.teamId, teamMonths);

            const teamVisits = visitsByTeamMonth.get(visit.teamId) ?? new Map<string, ApprovedVisitRow[]>();
            const list = teamVisits.get(key) ?? [];
            list.push({ ...visit, minutes });
            teamVisits.set(key, list);
            visitsByTeamMonth.set(visit.teamId, teamVisits);
        }

        // Sugestão de turno extra (mês alvo): dia distinto com visita aprovada
        // em fim de semana, com virada de dia ou terminando após o turno do líder.
        const suggestionDaysByTeam = new Map<string, Set<string>>();
        for (const visit of approvedVisits) {
            if (!visit.ovStartedAt || !visit.ovEndedAt) continue;
            if (visit.ovStartedAt.substring(0, 7) !== targetKey) continue;

            const teamId = visit.teamId;
            const day = visit.ovStartedAt.substring(0, 10);
            const dayMs = Date.parse(`${day}T00:00:00Z`);
            const dow = Number.isFinite(dayMs) ? new Date(dayMs).getUTCDay() : 1;
            const isWeekend = dow === 0 || dow === 6;

            const shift = shiftByTeam.get(teamId);
            const shiftEndClock = (shift?.shiftEnd || IDLE_DEFAULT_SHIFT_END).substring(0, 5);
            const endClock = visit.ovEndedAt.substring(11, 16);
            const crossesMidnight = visit.ovEndedAt.substring(0, 10) !== day;
            const endsAfterShift = !!endClock && !!shiftEndClock && endClock > shiftEndClock;

            if (isWeekend || crossesMidnight || endsAfterShift) {
                const days = suggestionDaysByTeam.get(teamId) ?? new Set<string>();
                days.add(day);
                suggestionDaysByTeam.set(teamId, days);
            }
        }

        const businessDays = countBusinessDays(year, month);

        const stats: TeamShiftsMonthly[] = teams.map(team => {
            const shift = shiftByTeam.get(team.id);
            const shiftMinutes = getTeamShiftMinutes(shift?.shiftStart, shift?.shiftEnd);
            const shiftMinutesAvailable = businessDays * shiftMinutes;

            const teamMonthMinutes = minutesByTeamMonth.get(team.id);
            const approvedVisitMinutes = teamMonthMinutes?.get(targetKey) ?? 0;
            const usedMinutes = Math.min(approvedVisitMinutes, shiftMinutesAvailable);
            const idlePercent = shiftMinutesAvailable > 0
                ? round1(Math.max(0, Math.min(100, (1 - usedMinutes / shiftMinutesAvailable) * 100)))
                : 0;

            const record = recordByTeam.get(team.id);

            const evolution: TeamIdleEvolutionPoint[] = seriesKeys.map(k => {
                const monthMinutes = teamMonthMinutes?.get(k.key) ?? 0;
                const monthBusinessDays = countBusinessDays(k.year, k.month);
                const monthAvailable = monthBusinessDays * shiftMinutes;
                const monthUsed = Math.min(monthMinutes, monthAvailable);
                return {
                    year: k.year,
                    month: k.month,
                    idlePercent: monthAvailable > 0
                        ? round1(Math.max(0, Math.min(100, (1 - monthUsed / monthAvailable) * 100)))
                        : 0
                };
            });

            const targetIdx = seriesKeys.findIndex(k => k.key === targetKey);
            const previousIdle = targetIdx > 0 ? evolution[targetIdx - 1].idlePercent : null;
            const idleDelta = previousIdle !== null ? round1(idlePercent - previousIdle) : null;

            return {
                teamId: team.id,
                teamCode: team.code,
                teamName: team.name,
                recordId: record?.id,
                normalShifts: record?.normalShifts ?? 0,
                extraShifts: record?.extraShifts ?? 0,
                note: record?.note ?? null,
                updatedBy: record?.updatedBy,
                updatedAt: record?.updatedAt,
                businessDays,
                approvedVisitMinutes,
                shiftMinutesAvailable,
                idlePercent,
                suggestedExtraShifts: suggestionDaysByTeam.get(team.id)?.size ?? 0,
                idlePercentPrevious: previousIdle,
                idleDelta,
                visits: visitsByTeamMonth.get(team.id)?.get(targetKey) ?? [],
                evolution
            } as TeamShiftsMonthly;
        });

        stats.sort((a, b) => b.idlePercent - a.idlePercent || a.teamName.localeCompare(b.teamName));
        return stats;
    }
};
