import { supabase } from '../core/supabase';
import { Vehicle } from '../../types';

export interface SaveVehicleInput {
    id?: string;
    description: string;
    plates: string;
    isAvailable?: boolean;
    companyId?: string | null;
}

const toVehicle = (row: any): Vehicle => ({
    id: String(row.id),
    description: row.description || '',
    plates: row.plates || '',
    model: row.model || '',
    brand: row.brand || '',
    color: row.color || '',
    year: row.year != null ? String(row.year) : '',
    isAvailable: row.is_available !== false,
    valueUnit: row.value_unit != null ? Number(row.value_unit) : undefined,
    discount: row.discount != null ? Number(row.discount) : undefined,
    companyId: row.company_id != null ? String(row.company_id) : undefined
});

export const vehiclesService = {
    async getVehicles(): Promise<Vehicle[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('is_deleted', false)
            .order('plates', { ascending: true });

        if (error) {
            console.error('Error fetching vehicles:', error);
            throw error;
        }
        return (data || []).map(toVehicle);
    },

    async saveVehicle(input: SaveVehicleInput, fallbackCompanyId?: string | null): Promise<Vehicle> {
        const now = new Date().toISOString();
        const companyId = input.companyId !== undefined ? input.companyId : (fallbackCompanyId ?? null);
        const numericCompanyId = companyId ? parseInt(companyId, 10) : NaN;
        const payload: Record<string, unknown> = {
            description: input.description.trim(),
            plates: input.plates.trim().toUpperCase(),
            company_id: Number.isFinite(numericCompanyId) ? numericCompanyId : null,
            is_available: input.isAvailable !== false,
            updated_at: now
        };

        if (input.id) {
            const { data, error } = await supabase
                .from('vehicles')
                .update(payload)
                .eq('id', parseInt(input.id, 10))
                .select('*')
                .single();
            if (error) {
                console.error('Error updating vehicle:', error);
                throw error;
            }
            return toVehicle(data);
        }

        const { data, error } = await supabase
            .from('vehicles')
            .insert({
                ...payload,
                unit: 'Km',
                created_at: now
            })
            .select('*')
            .single();
        if (error) {
            console.error('Error creating vehicle:', error);
            throw error;
        }
        return toVehicle(data);
    },

    /**
     * Soft delete. Marca também is_available=false porque a view v_vehicles
     * (usada nos seletores de veículo) não filtra is_deleted.
     */
    async deleteVehicle(id: string): Promise<void> {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('vehicles')
            .update({
                is_deleted: true,
                is_available: false,
                deleted_at: now,
                updated_at: now
            })
            .eq('id', parseInt(id, 10));

        if (error) {
            console.error('Error deleting vehicle:', error);
            throw error;
        }
    }
};
