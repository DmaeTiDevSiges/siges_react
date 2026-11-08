/** Item do contrato canônico v1 aceito por fn_add_assets_available. */
export interface CanonicalItem {
    external_id: string;
    status: 'available' | 'unavailable';
    source_reported_at: string;
    source_event_id: string | null;
    reason: string | null;
}

/** Linha de conferência humana (modo observação). Nunca vai para o banco. */
export interface ObservationRow {
    external_id: string;
    name: string | null;
    external_status: string;
    external_reason: string | null;
    source_reported_at: string;
    mapped_unit_asset_tag_id: number | null;
}

export interface NormalizeResult {
    observedAt: string;
    items: CanonicalItem[];
    observation: ObservationRow[];
    missingMappings: string[];
}

/**
 * Um adaptador por provedor (e por variante de contrato, se preciso).
 * Conhece autenticação, formato e regras do fornecedor; o restante do Worker
 * só lida com o contrato canônico.
 */
export interface Adapter {
    code: string;
    defaultUrl: string;
    /** Hosts aceitos em base_url (proteção contra SSRF). */
    allowedHosts: string[];
    buildRequest(url: string, apiKey: string, userAgent: string): Request;
    normalize(response: unknown, mappings: Record<string, number>): NormalizeResult;
}
