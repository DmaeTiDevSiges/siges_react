import { normalizeGuaibaFlow } from './adapters/guaibaflow';
import { guaibaflowAdapter } from './adapters/guaibaflow';
import { resolveUrl } from './adapters';
import { syncIntegration, type SyncEnv } from './sync';

// Amostra sanitizada no formato documentado em https://guaibaflow.com.br/api-ajuda.php
const sample = () => ({
    versao: 'v1',
    gerado_em: '2026-11-04T10:00:12-03:00',
    atraso_max_min: 60,
    estacoes: [
        { id: '101', nome: 'Estação Exemplo A', status: 'ON', motivo: null, ultima_leitura: '2026-11-04T09:45:00-03:00' },
        { id: 102, nome: 'Estação Exemplo B', status: 'OFF', motivo: 'falha_comunicacao', ultima_leitura: '2026-11-04T09:45:00-03:00' },
    ],
});

describe('normalizeGuaibaFlow', () => {
    it('converte ON/OFF para o contrato canônico v1', () => {
        const r = normalizeGuaibaFlow(sample(), { '101': 7 });
        expect(r.observedAt).toBe('2026-11-04T10:00:12-03:00');
        expect(r.items).toEqual([
            {
                external_id: '101',
                status: 'available',
                source_reported_at: '2026-11-04T09:45:00-03:00',
                source_event_id: 'guaibaflow:2026-11-04T10:00:12-03:00:101',
                reason: null,
            },
            {
                external_id: '102',
                status: 'unavailable',
                source_reported_at: '2026-11-04T09:45:00-03:00',
                source_event_id: 'guaibaflow:2026-11-04T10:00:12-03:00:102',
                reason: 'INDISPONIVEL',
            },
        ]);
        expect(r.missingMappings).toEqual(['102']);
        expect(r.observation[0].mapped_unit_asset_tag_id).toBe(7);
        expect(r.observation[1].external_reason).toBe('falha_comunicacao');
    });

    it('rejeita status desconhecido sem converter por padrão', () => {
        const s = sample();
        s.estacoes[0].status = 'WARN';
        expect(() => normalizeGuaibaFlow(s, {})).toThrow(/status desconhecido "WARN"/);
    });

    it('rejeita ultima_leitura sem offset', () => {
        const s = sample();
        s.estacoes[1].ultima_leitura = '2026-11-04T09:45:00';
        expect(() => normalizeGuaibaFlow(s, {})).toThrow(/ultima_leitura inválida/);
    });

    it('rejeita id duplicado, versão inesperada e lista vazia', () => {
        const dup = sample();
        dup.estacoes[1].id = '101';
        expect(() => normalizeGuaibaFlow(dup, {})).toThrow(/duplicado/);
        expect(() => normalizeGuaibaFlow({ ...sample(), versao: 'v2' }, {})).toThrow(/versão/);
        expect(() => normalizeGuaibaFlow({ ...sample(), estacoes: [] }, {})).toThrow(/nenhuma estação/);
    });
});

describe('resolveUrl', () => {
    it('usa a URL padrão e aceita só HTTPS em hosts aprovados', () => {
        expect(resolveUrl(guaibaflowAdapter, null)).toBe('https://guaibaflow.com.br/api-status.php');
        expect(() => resolveUrl(guaibaflowAdapter, 'http://guaibaflow.com.br/api-status.php')).toThrow(/HTTPS/);
        expect(() => resolveUrl(guaibaflowAdapter, 'https://169.254.169.254/latest')).toThrow(/não permitido/);
        expect(() => resolveUrl(guaibaflowAdapter, 'https://u:p@guaibaflow.com.br/')).toThrow(/credenciais/);
    });
});

describe('syncIntegration', () => {
    const env: SyncEnv = {
        SUPABASE_URL: 'https://siges.example',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        INTEGRATION_3_API_KEY: 'gfk_teste',
    };
    const integration = { id: 3, name: 'GuaibaFlow', provider_code: 'guaibaflow', base_url: null };

    function mockFetch(ingestRows: unknown[] = []) {
        const calls: { url: string; init?: RequestInit; request?: Request }[] = [];
        const fn = jest.fn(async (input: Request | string, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.url;
            calls.push({ url, init, request: typeof input === 'string' ? undefined : input });
            if (url.startsWith('https://guaibaflow.com.br/')) return new Response(JSON.stringify(sample()));
            if (url.includes('/cfg_assets_available_integrations_mappings')) {
                return new Response(JSON.stringify([{ external_id: '101', unit_asset_tag_id: 7 }]));
            }
            if (url.endsWith('/rpc/fn_add_assets_available')) return new Response(JSON.stringify(ingestRows));
            return new Response('not found', { status: 404 });
        });
        return { fn, calls };
    }

    it('modo observação não chama a RPC e envia User-Agent próprio', async () => {
        const { fn, calls } = mockFetch();
        const r = await syncIntegration(env, integration, true, fn);
        expect(r.ok).toBe(true);
        expect(r.observation).toHaveLength(2);
        expect(r.missingMappings).toEqual(['102']);
        expect(calls.some(c => c.url.includes('/rpc/'))).toBe(false);
        const api = calls.find(c => c.request)!.request!;
        expect(api.headers.get('Authorization')).toBe('Bearer gfk_teste');
        expect(api.headers.get('User-Agent')).toBe('SIGES-AvailabilitySync/1.0');
    });

    it('fora do modo observação entrega o lote canônico à RPC e resume o resultado', async () => {
        const { fn, calls } = mockFetch([
            { external_id: '101', result: 'applied', message: null, asset_available_id: 55 },
            { external_id: '102', result: 'pending_mapping', message: 'ID externo sem mapeamento', asset_available_id: null },
        ]);
        const r = await syncIntegration(env, integration, false, fn);
        expect(r.ok).toBe(true);
        expect(r.counts).toMatchObject({ applied: 1, pending_mapping: 1, error: 0 });
        const rpc = calls.find(c => c.url.endsWith('/rpc/fn_add_assets_available'))!;
        const body = JSON.parse(String(rpc.init!.body));
        expect(body.p_integration_id).toBe(3);
        expect(body.p_contract_version).toBe(1);
        expect(body.p_items).toHaveLength(2);
    });

    it('marca falha quando a RPC devolve erro e não expõe o corpo da API externa', async () => {
        const { fn } = mockFetch([{ external_id: '101', result: 'error', message: 'falha', asset_available_id: null }]);
        const r = await syncIntegration(env, integration, false, fn);
        expect(r.ok).toBe(false);
        expect(r.problems).toHaveLength(1);

        const failing = jest.fn(async () => new Response('segredo no corpo', { status: 403 }));
        const r2 = await syncIntegration(env, integration, false, failing);
        expect(r2.ok).toBe(false);
        expect(r2.error).toBe('API externa respondeu HTTP 403');
    });

    it('exige o secret da integração', async () => {
        const { fn } = mockFetch();
        const r = await syncIntegration({ ...env, INTEGRATION_3_API_KEY: undefined }, integration, true, fn);
        expect(r.ok).toBe(false);
        expect(r.error).toMatch(/INTEGRATION_3_API_KEY/);
        expect(fn).not.toHaveBeenCalled();
    });
});
