import { guaibaflowAdapter } from './guaibaflow';
import type { Adapter } from './types';

/** provider_code (cfg_assets_available_integrations) → adaptador. */
export const ADAPTERS: Record<string, Adapter> = {
    [guaibaflowAdapter.code]: guaibaflowAdapter,
};

/**
 * Resolve a URL a consultar: base_url da integração ou a padrão do adaptador.
 * Só HTTPS e só hosts aprovados no adaptador — base_url vem de uma tela
 * administrativa e não pode apontar o Worker para destinos arbitrários.
 */
export function resolveUrl(adapter: Adapter, baseUrl: string | null): string {
    const raw = baseUrl && baseUrl.trim() ? baseUrl.trim() : adapter.defaultUrl;
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new Error('base_url inválida');
    }
    if (url.protocol !== 'https:') {
        throw new Error('base_url deve usar HTTPS');
    }
    if (url.username || url.password) {
        throw new Error('base_url não pode conter credenciais');
    }
    if (!adapter.allowedHosts.includes(url.hostname.toLowerCase())) {
        throw new Error('host de base_url não permitido para o adaptador ' + adapter.code);
    }
    return url.toString();
}

export type { Adapter } from './types';
