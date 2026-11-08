import { supabase } from '../core/supabase';

// Administração das integrações de disponibilidade de ativos (Fase 4).
// Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md
// Tabelas: cfg_assets_available_integrations, cfg_assets_available_integrations_mappings,
//          logs_assets_available_integrations_events (somente leitura pela aplicação).
// Credenciais NUNCA passam por aqui: ficam como secrets do Worker workers/availability-sync
// (INTEGRATION_<id>_API_KEY).

export interface AssetsAvailableIntegration {
    id: number;
    companyId: number;
    providerCompanyId: number | null;
    name: string;
    providerCode: string;
    baseUrl: string | null;
    config: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AssetsAvailableIntegrationInput {
    companyId: number;
    providerCompanyId: number | null;
    name: string;
    providerCode: string;
    baseUrl: string | null;
    config: Record<string, unknown>;
    isActive: boolean;
}

export interface AssetsAvailableIntegrationMapping {
    id: number;
    integrationId: number;
    externalId: string;
    unitAssetTagId: number;
    isActive: boolean;
    lastSourceReportedAt: string | null;
    lastIsAvailable: boolean | null;
    unitAssetTagLabel?: string;
}

export interface AssetsAvailableIntegrationLog {
    id: number;
    externalId: string | null;
    sourceEventId: string | null;
    sourceReportedAt: string | null;
    isAvailable: boolean | null;
    result: 'applied' | 'unchanged' | 'duplicate' | 'pending_mapping' | 'rejected' | 'error';
    message: string | null;
    createdAt: string;
}

export interface UnitAssetTagOption {
    id: number;
    label: string;
}

// ── Execução manual (Worker workers/availability-sync, rota POST /app/run) ──
export type AssetsAvailableIntegrationRunMode = 'observe' | 'write';

export interface AssetsAvailableIntegrationRunReport {
    integrationId: number;
    name: string;
    providerCode: string;
    ok: boolean;
    dryRun: boolean;
    error?: string;
    observedAt?: string;
    stationCount?: number;
    missingMappings?: string[];
    counts?: Record<AssetsAvailableIntegrationLog['result'], number>;
    observation?: {
        external_id: string;
        name: string | null;
        external_status: string;
        external_reason: string | null;
        source_reported_at: string;
        mapped_unit_asset_tag_id: number | null;
    }[];
    problems?: { external_id: string | null; result: string; message: string | null }[];
}

export interface AssetsAvailableIntegrationRunResult {
    dryRun: boolean;
    report: AssetsAvailableIntegrationRunReport;
}

const SYNC_WORKER_URL = (import.meta.env.VITE_AVAILABILITY_SYNC_URL || '').replace(/\/+$/, '');

const INTEGRATION_COLUMNS =
    'id, company_id, provider_company_id, name, provider_code, base_url, config, is_active, created_at, updated_at';

const mapIntegration = (row: any): AssetsAvailableIntegration => ({
    id: Number(row.id),
    companyId: Number(row.company_id),
    providerCompanyId: row.provider_company_id != null ? Number(row.provider_company_id) : null,
    name: row.name,
    providerCode: row.provider_code,
    baseUrl: row.base_url ?? null,
    config: row.config ?? {},
    isActive: row.is_active === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const unitAssetTagLabel = (row: any): string =>
    [row.unit_code, row.unit_description, row.asset_tag_tag_sub_description || row.tag_description]
        .filter(Boolean)
        .join(' · ') || `Setor #${row.id}`;

const toIntegrationRow = (input: AssetsAvailableIntegrationInput) => ({
    company_id: input.companyId,
    provider_company_id: input.providerCompanyId,
    name: input.name.trim(),
    provider_code: input.providerCode.trim(),
    base_url: input.baseUrl?.trim() || null,
    config: input.config,
    is_active: input.isActive,
});

const fail = (context: string, error: any): never => {
    console.error(`[assetsAvailableIntegrations] ${context}:`, error);
    throw new Error(error?.message || context);
};

export const assetsAvailableIntegrationsService = {
    async getAssetsAvailableIntegrations(): Promise<AssetsAvailableIntegration[]> {
        const { data, error } = await supabase
            .from('cfg_assets_available_integrations')
            .select(INTEGRATION_COLUMNS)
            .order('name');
        if (error) fail('Erro ao listar integrações', error);
        return (data || []).map(mapIntegration);
    },

    async createAssetsAvailableIntegration(input: AssetsAvailableIntegrationInput): Promise<AssetsAvailableIntegration> {
        const { data, error } = await supabase
            .from('cfg_assets_available_integrations')
            .insert(toIntegrationRow(input))
            .select(INTEGRATION_COLUMNS)
            .single();
        if (error) fail('Erro ao criar integração', error);
        return mapIntegration(data);
    },

    async updateAssetsAvailableIntegration(id: number, input: AssetsAvailableIntegrationInput): Promise<AssetsAvailableIntegration> {
        const { data, error } = await supabase
            .from('cfg_assets_available_integrations')
            .update(toIntegrationRow(input))
            .eq('id', id)
            .select(INTEGRATION_COLUMNS)
            .single();
        if (error) fail('Erro ao atualizar integração', error);
        return mapIntegration(data);
    },

    async deleteAssetsAvailableIntegration(id: number): Promise<void> {
        // FKs ON DELETE RESTRICT: integrações com mapeamentos/logs não são apagadas
        // (preserva histórico). Nesses casos, desative a integração.
        const { error } = await supabase
            .from('cfg_assets_available_integrations')
            .delete()
            .eq('id', id);
        if (error) {
            if (error.code === '23503') {
                throw new Error('A integração possui mapeamentos ou histórico. Desative-a em vez de excluir.');
            }
            fail('Erro ao excluir integração', error);
        }
    },

    async getAssetsAvailableIntegrationMappings(integrationId: number): Promise<AssetsAvailableIntegrationMapping[]> {
        const { data, error } = await supabase
            .from('cfg_assets_available_integrations_mappings')
            .select('id, integration_id, external_id, unit_asset_tag_id, is_active, last_source_reported_at, last_is_available')
            .eq('integration_id', integrationId)
            .order('external_id');
        if (error) fail('Erro ao listar mapeamentos', error);

        const rows = data || [];
        const ids = [...new Set(rows.map((r: any) => r.unit_asset_tag_id))];
        const labels = new Map<number, string>();
        if (ids.length > 0) {
            const { data: tags, error: tagsError } = await supabase
                .from('v_units_assets_tags')
                .select('id, unit_code, unit_description, tag_description, asset_tag_tag_sub_description')
                .in('id', ids);
            if (tagsError) console.error('[assetsAvailableIntegrations] rótulos de setores:', tagsError);
            (tags || []).forEach((t: any) => labels.set(Number(t.id), unitAssetTagLabel(t)));
        }

        return rows.map((r: any) => ({
            id: Number(r.id),
            integrationId: Number(r.integration_id),
            externalId: r.external_id,
            unitAssetTagId: Number(r.unit_asset_tag_id),
            isActive: r.is_active === true,
            lastSourceReportedAt: r.last_source_reported_at ?? null,
            lastIsAvailable: r.last_is_available ?? null,
            unitAssetTagLabel: labels.get(Number(r.unit_asset_tag_id)),
        }));
    },

    async createAssetsAvailableIntegrationMapping(input: {
        integrationId: number;
        externalId: string;
        unitAssetTagId: number;
        isActive: boolean;
    }): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_available_integrations_mappings')
            .insert({
                integration_id: input.integrationId,
                external_id: input.externalId.trim(),
                unit_asset_tag_id: input.unitAssetTagId,
                is_active: input.isActive,
            });
        if (error) {
            if (error.code === '23505') {
                throw new Error('Este ID externo já está mapeado nesta integração.');
            }
            fail('Erro ao criar mapeamento', error);
        }
    },

    async updateAssetsAvailableIntegrationMapping(id: number, changes: { isActive: boolean }): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_available_integrations_mappings')
            .update({ is_active: changes.isActive })
            .eq('id', id);
        if (error) fail('Erro ao atualizar mapeamento', error);
    },

    async deleteAssetsAvailableIntegrationMapping(id: number): Promise<void> {
        const { error } = await supabase
            .from('cfg_assets_available_integrations_mappings')
            .delete()
            .eq('id', id);
        if (error) {
            if (error.code === '23503') {
                throw new Error('O mapeamento possui histórico. Desative-o em vez de excluir.');
            }
            fail('Erro ao excluir mapeamento', error);
        }
    },

    async getAssetsAvailableIntegrationLogs(integrationId: number, limit = 100): Promise<AssetsAvailableIntegrationLog[]> {
        const { data, error } = await supabase
            .from('logs_assets_available_integrations_events')
            .select('id, external_id, source_event_id, source_reported_at, is_available, result, message, created_at')
            .eq('integration_id', integrationId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) fail('Erro ao listar logs', error);
        return (data || []).map((r: any) => ({
            id: Number(r.id),
            externalId: r.external_id ?? null,
            sourceEventId: r.source_event_id ?? null,
            sourceReportedAt: r.source_reported_at ?? null,
            isAvailable: r.is_available ?? null,
            result: r.result,
            message: r.message ?? null,
            createdAt: r.created_at,
        }));
    },

    async searchUnitAssetTagsForMapping(term: string): Promise<UnitAssetTagOption[]> {
        const clean = term.trim().replace(/[%,()]/g, ' ');
        if (clean.length < 2) return [];
        const pattern = `%${clean}%`;
        const { data, error } = await supabase
            .from('v_units_assets_tags')
            .select('id, unit_code, unit_description, tag_description, asset_tag_tag_sub_description')
            .eq('is_deleted', false)
            .or(`unit_code.ilike.${pattern},unit_description.ilike.${pattern},tag_description.ilike.${pattern},asset_tag_tag_sub_description.ilike.${pattern}`)
            .limit(30);
        if (error) fail('Erro ao buscar setores', error);
        return (data || []).map((t: any) => ({ id: Number(t.id), label: unitAssetTagLabel(t) }));
    },

    /** Executa a integração agora pelo Worker (token do usuário; permissão validada no servidor). */
    async runAssetsAvailableIntegration(
        integrationId: number,
        mode: AssetsAvailableIntegrationRunMode,
    ): Promise<AssetsAvailableIntegrationRunResult> {
        if (!SYNC_WORKER_URL) {
            throw new Error('Execução manual indisponível: configure VITE_AVAILABILITY_SYNC_URL');
        }
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Sessão expirada. Entre novamente.');

        let response: Response;
        try {
            response = await fetch(
                `${SYNC_WORKER_URL}/app/run?integration=${encodeURIComponent(String(integrationId))}&mode=${mode}`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
            );
        } catch {
            throw new Error('Não foi possível contatar o serviço de sincronização');
        }
        const body = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(body?.error || `Falha na execução (HTTP ${response.status})`);
        }
        return body as AssetsAvailableIntegrationRunResult;
    },
};
