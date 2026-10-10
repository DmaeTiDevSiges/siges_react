// Contratos de R$/km (custo operacional por Km) — cfg_vehicle_rate_contracts
// (dev/supabase/migrations/20261010_add_vehicle_rate_contracts.sql)
//
// Mesmo modelo dos contratos de aluguel (vehicleRentalService), mas com
// VALOR POR Km em vez de valor mensal. O preço das linhas de odômetro é
// resolvido no banco pelo contrato vigente NA DATA da linha — informar
// Km em veículo sem contrato vigente é bloqueado pelo trigger.
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
            .from('cfg_vehicle_rate_contracts')
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
        return (data || []).map((row: any) => ({
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
            ? supabase.from('cfg_vehicle_rate_contracts').update(payload).eq('id', parseInt(input.id, 10))
            : supabase.from('cfg_vehicle_rate_contracts').insert({
                ...payload,
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
            .from('cfg_vehicle_rate_contracts')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', parseInt(contractId, 10));
        if (error) {
            console.error('Error deleting rate contract:', error);
            throw new Error(error.message || 'Erro ao excluir o contrato de R$/km.');
        }
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
