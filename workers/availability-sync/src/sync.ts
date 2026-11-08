/**
 * Núcleo da sincronização: para cada integração ativa com adaptador conhecido,
 * consulta a API externa, normaliza para o contrato canônico e (fora do modo
 * observação) entrega o lote a fn_add_assets_available, que resolve
 * mapeamento, escopo, idempotência, histórico e cascata.
 *
 * O Worker nunca escreve em tabelas: só lê a configuração e chama a RPC.
 */

import { ADAPTERS, resolveUrl } from './adapters';
import type { CanonicalItem, ObservationRow } from './adapters/types';

export interface SyncEnv {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    USER_AGENT?: string;
    /** Chaves das APIs externas: INTEGRATION_<id>_API_KEY (wrangler secret). */
    [key: string]: unknown;
}

export interface IntegrationRow {
    id: number;
    name: string;
    provider_code: string;
    base_url: string | null;
}

export interface IngestRow {
    external_id: string | null;
    result: 'applied' | 'unchanged' | 'duplicate' | 'pending_mapping' | 'rejected' | 'error';
    message: string | null;
    asset_available_id: number | null;
}

export interface IntegrationReport {
    integrationId: number;
    name: string;
    providerCode: string;
    ok: boolean;
    dryRun: boolean;
    error?: string;
    observedAt?: string;
    stationCount?: number;
    missingMappings?: string[];
    counts?: Record<IngestRow['result'], number>;
    /** Só no modo observação. */
    observation?: ObservationRow[];
    /** Linhas com result = rejected/error (mensagens já sanitizadas pela RPC). */
    problems?: IngestRow[];
}

const FETCH_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const BATCH_SIZE = 500; // limite de fn_add_assets_available

type FetchFn = (input: Request | string, init?: RequestInit) => Promise<Response>;

function supabaseHeaders(env: SyncEnv): Record<string, string> {
    return {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
}

async function supabaseJson<T>(env: SyncEnv, fetchFn: FetchFn, path: string, init?: RequestInit): Promise<T> {
    const res = await fetchFn(env.SUPABASE_URL.replace(/\/+$/, '') + path, {
        ...init,
        headers: { ...supabaseHeaders(env), ...(init?.headers as Record<string, string> | undefined) },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
        const text = (await res.text()).slice(0, 300);
        throw new Error('SIGES respondeu HTTP ' + res.status + ': ' + text);
    }
    return (await res.json()) as T;
}

export async function loadIntegrations(env: SyncEnv, fetchFn: FetchFn): Promise<IntegrationRow[]> {
    const codes = Object.keys(ADAPTERS).join(',');
    return supabaseJson<IntegrationRow[]>(
        env,
        fetchFn,
        '/rest/v1/cfg_assets_available_integrations' +
            '?select=id,name,provider_code,base_url' +
            '&is_active=is.true' +
            '&provider_code=in.(' + encodeURIComponent(codes) + ')' +
            '&order=id.asc',
    );
}

async function loadMappings(env: SyncEnv, fetchFn: FetchFn, integrationId: number): Promise<Record<string, number>> {
    const rows = await supabaseJson<{ external_id: string; unit_asset_tag_id: number }[]>(
        env,
        fetchFn,
        '/rest/v1/cfg_assets_available_integrations_mappings' +
            '?select=external_id,unit_asset_tag_id' +
            '&integration_id=eq.' + integrationId +
            '&is_active=is.true',
    );
    const map: Record<string, number> = {};
    for (const row of rows) map[row.external_id] = row.unit_asset_tag_id;
    return map;
}

async function ingest(env: SyncEnv, fetchFn: FetchFn, integrationId: number, items: CanonicalItem[]): Promise<IngestRow[]> {
    const rows: IngestRow[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        rows.push(
            ...(await supabaseJson<IngestRow[]>(env, fetchFn, '/rest/v1/rpc/fn_add_assets_available', {
                method: 'POST',
                body: JSON.stringify({ p_integration_id: integrationId, p_items: batch, p_contract_version: 1 }),
            })),
        );
    }
    return rows;
}

async function readLimitedJson(res: Response): Promise<unknown> {
    const declared = Number(res.headers.get('content-length') || '0');
    if (declared > MAX_RESPONSE_BYTES) throw new Error('resposta da API acima de 2 MB');
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error('resposta da API acima de 2 MB');
    try {
        return JSON.parse(text);
    } catch {
        throw new Error('resposta da API não é JSON');
    }
}

export async function syncIntegration(
    env: SyncEnv,
    integration: IntegrationRow,
    dryRun: boolean,
    fetchFn: FetchFn = fetch,
): Promise<IntegrationReport> {
    const report: IntegrationReport = {
        integrationId: integration.id,
        name: integration.name,
        providerCode: integration.provider_code,
        ok: false,
        dryRun,
    };

    try {
        const adapter = ADAPTERS[integration.provider_code];
        if (!adapter) throw new Error('adaptador não implementado');

        const apiKey = env['INTEGRATION_' + integration.id + '_API_KEY'];
        if (typeof apiKey !== 'string' || !apiKey) {
            throw new Error('secret INTEGRATION_' + integration.id + '_API_KEY não configurado no Worker');
        }

        const url = resolveUrl(adapter, integration.base_url);
        const res = await fetchFn(adapter.buildRequest(url, apiKey, env.USER_AGENT || 'SIGES-AvailabilitySync/1.0'), {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            // Workers só aceitam follow|manual; 3xx cai em !res.ok (sem seguir para outro host).
            redirect: 'manual',
        });
        if (!res.ok) {
            // Corpo da API externa não é repassado: pode conter dados que não queremos em logs.
            throw new Error('API externa respondeu HTTP ' + res.status);
        }

        const mappings = await loadMappings(env, fetchFn, integration.id);
        const normalized = adapter.normalize(await readLimitedJson(res), mappings);

        report.observedAt = normalized.observedAt;
        report.stationCount = normalized.items.length;
        report.missingMappings = normalized.missingMappings;

        if (dryRun) {
            report.observation = normalized.observation;
            report.ok = true;
            return report;
        }

        const rows = await ingest(env, fetchFn, integration.id, normalized.items);
        const counts = { applied: 0, unchanged: 0, duplicate: 0, pending_mapping: 0, rejected: 0, error: 0 };
        for (const row of rows) counts[row.result] = (counts[row.result] ?? 0) + 1;
        report.counts = counts;
        report.problems = rows.filter(r => r.result === 'rejected' || r.result === 'error');
        report.ok = counts.error === 0;
        return report;
    } catch (err) {
        report.error = err instanceof Error ? err.message.slice(0, 500) : 'erro desconhecido';
        return report;
    }
}

export async function syncAll(env: SyncEnv, dryRun: boolean, fetchFn: FetchFn = fetch): Promise<IntegrationReport[]> {
    const integrations = await loadIntegrations(env, fetchFn);
    const reports: IntegrationReport[] = [];
    // Sequencial: poucas integrações e a RPC já serializa por integração.
    for (const integration of integrations) {
        reports.push(await syncIntegration(env, integration, dryRun, fetchFn));
    }
    return reports;
}
