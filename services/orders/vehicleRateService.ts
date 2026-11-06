// Contratos de R$/km (custo operacional por Km) — compatibilidade
// para o modelo unificado em cfg_vehicles_rentals_contracts.value_unit.
// A tabela cfg_vehicle_rate_contracts foi removida do modelo atual e o
// contrato de R$/km agora fica no mesmo registro do contrato de aluguel.
import { supabase } from '../core/supabase';

export interface VehicleRateContract {
    id: string;
    vehicleId: string;
    vehicleDescription?: string;
    vehiclePlates?: string;
    /** Custo operacional por Km (R$/km). */
    valueUnit: number;
    startDate: string;
    endDate?: string | null;
    active: boolean;
    description?: string | null;
    createdAt?: string;
}

export interface SaveVehicleRateContractInput {
    id?: string;
    vehicleId: string;
    valueUnit: number;
    startDate: string;
    endDate?: string | null;
    active?: boolean;
    description?: string | null;
}

export interface VehicleRateContractInfo {
    contractId: string;
    valueUnit: number;
    hasConflict: boolean;
}

const num = (v: unknown): number => Number(v ?? 0);

const toRateContract = (row: any): VehicleRateContract => ({
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    vehicleDescription: row.vehicle_description ?? undefined,
    vehiclePlates: row.vehicle_plates ?? undefined,
    valueUnit: num(row.value_unit),
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    active: !!row.active,
    description: row.description ?? null,
    createdAt: row.created_at
});

export const vehicleRateService = {
    async getContracts(vehicleId?: string): Promise<VehicleRateContract[]> {
        let query = supabase
            .from('cfg_vehicles_rentals_contracts')
            .select('*, vehicles!inner(description, plates)')
            .eq('is_deleted', false)
            .order('active', { ascending: false })
            .order('start_date', { ascending: false });
        if (vehicleId) {
            query = query.eq('vehicle_id', parseInt(vehicleId, 10));
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching rate contracts:', error);
            return [];
        }
        return (data || [])
            .filter((row: any) => row.value_unit != null)
            .map((row: any) => ({
                ...toRateContract(row),
                vehicleDescription: row.vehicles?.description ?? undefined,
                vehiclePlates: row.vehicles?.plates ?? undefined
            }));
    },

    async saveContract(input: SaveVehicleRateContractInput): Promise<VehicleRateContract> {
        const payload: Record<string, unknown> = {
            vehicle_id: parseInt(input.vehicleId, 10),
            value_unit: input.valueUnit,
            start_date: input.startDate,
            end_date: input.endDate || null,
            active: input.active !== false,
            description: input.description || null,
            updated_at: new Date().toISOString()
        };

        const query = input.id
            ? supabase.from('cfg_vehicles_rentals_contracts').update(payload).eq('id', parseInt(input.id, 10))
            : supabase.from('cfg_vehicles_rentals_contracts').insert({
                ...payload,
                monthly_value: 0,
                created_at: new Date().toISOString()
            });

        const { data, error } = await query.select('*, vehicles!inner(description, plates)').single();
        if (error) {
            console.error('Error saving rate contract:', error);
            throw new Error(error.message || 'Erro ao salvar o contrato de R$/km.');
        }

        return {
            ...toRateContract(data),
            vehicleDescription: (data as any).vehicles?.description ?? undefined,
            vehiclePlates: (data as any).vehicles?.plates ?? undefined
        };
    },

    async deleteContract(contractId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_vehicles_rentals_contracts')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', parseInt(contractId, 10));
        if (error) {
            console.error('Error deleting rate contract:', error);
            throw new Error(error.message || 'Erro ao excluir o contrato de R$/km.');
        }
    },

    /**
     * R$/km de VÁRIOS veículos numa competência, em UMA consulta (evita a rajada de
     * RPCs por veículo, que gerava 502 no gateway). Mesma regra de
     * fc_vehicle_rate_contract: contrato ativo, não excluído, vigente na data; havendo
     * mais de um, vence o de start_date mais recente (desempate: id maior).
     * Vale o contrato vigente no 1º dia do mês; sem ele, o vigente no último dia.
     */
    async getContractRatesForMonth(
        vehicleIds: string[],
        monthStart: string,
        monthEnd: string
    ): Promise<Record<string, number>> {
        const ids = Array.from(new Set(vehicleIds))
            .map(id => parseInt(id, 10))
            .filter(Number.isFinite);
        if (ids.length === 0) return {};

        const { data, error } = await supabase
            .from('cfg_vehicle_rate_contracts')
            .select('id, vehicle_id, value_unit, start_date, end_date')
            .in('vehicle_id', ids)
            .eq('active', true)
            .eq('is_deleted', false)
            .lte('start_date', monthEnd)
            .or(`end_date.is.null,end_date.gte.${monthStart}`);
        if (error) {
            console.error('Error fetching rate contracts for month:', error);
            throw new Error(error.message || 'Erro ao carregar os contratos de R$/km.');
        }

        const validOn = (c: any, day: string) =>
            c.start_date <= day && (c.end_date == null || c.end_date >= day);
        const newest = (a: any, b: any) =>
            a.start_date !== b.start_date
                ? (a.start_date > b.start_date ? a : b)
                : (Number(a.id) > Number(b.id) ? a : b);

        const pick: Record<string, { first?: any; last?: any }> = {};
        (data || []).forEach((c: any) => {
            const vid = String(c.vehicle_id);
            const slot = (pick[vid] ||= {});
            if (validOn(c, monthStart)) slot.first = slot.first ? newest(slot.first, c) : c;
            if (validOn(c, monthEnd)) slot.last = slot.last ? newest(slot.last, c) : c;
        });

        const rates: Record<string, number> = {};
        Object.entries(pick).forEach(([vid, slot]) => {
            const chosen = slot.first ?? slot.last;
            if (chosen) rates[vid] = num(chosen.value_unit);
        });
        return rates;
    },

    // Contrato de R$/km vigente em uma DATA (RPC — sinaliza conflito de vigência)
    async getContractInfo(vehicleId: string, onDate: string): Promise<VehicleRateContractInfo | null> {
        const { data, error } = await supabase.rpc('fc_vehicle_rate_contract', {
            p_vehicle_id: parseInt(vehicleId, 10),
            p_on_date: onDate
        });
        if (error) {
            console.error('Error fetching rate contract info:', error);
            return null;
        }
        const row = (data as any[])[0];
        if (!row) return null;
        return {
            contractId: String(row.contract_id),
            valueUnit: num(row.value_unit),
            hasConflict: !!row.has_conflict
        };
    }
};

export default vehicleRateService;
