import { supabase } from '../core/supabase';

/**
 * Versões dos grupos de dados offline (migration 20261122 —
 * fn_offline_change_versions). Cada versão muda quando há inclusão, alteração
 * ou exclusão naquele grupo; o download automático baixa de novo só o que mudou.
 */
export interface OfflineChangeVersions {
    /** false = função ainda não criada no banco (o app volta à regra de 1 dia). */
    supported: boolean;
    units: Record<string, string>;
    assetTypes: Record<string, string>;
    orderTypes: Record<string, string>;
    materials: string | null;
    vehicles: string | null;
    users: string | null;
}

const UNSUPPORTED: OfflineChangeVersions = {
    supported: false,
    units: {},
    assetTypes: {},
    orderTypes: {},
    materials: null,
    vehicles: null,
    users: null,
};

const toIds = (ids: string[]) => ids.map(Number).filter(n => Number.isFinite(n) && n > 0);

export const offlineVersionsService = {
    async getOfflineChangeVersions(
        companyId: string,
        unitIds: string[],
        assetTypeIds: string[],
        orderTypeIds: string[],
    ): Promise<OfflineChangeVersions> {
        const { data, error } = await supabase.rpc('fn_offline_change_versions', {
            p_company_id: Number(companyId),
            p_unit_ids: toIds(unitIds),
            p_asset_type_ids: toIds(assetTypeIds),
            p_order_type_ids: toIds(orderTypeIds),
        });
        if (error) {
            if (error.code === 'PGRST202' || error.code === '42883') return UNSUPPORTED;
            throw error;
        }
        const d = (data || {}) as Record<string, any>;
        return {
            supported: true,
            units: d.units || {},
            assetTypes: d.asset_types || {},
            orderTypes: d.order_types || {},
            materials: d.materials ?? null,
            vehicles: d.vehicles ?? null,
            users: d.users ?? null,
        };
    },
};
