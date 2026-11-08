import { corsHeaders, handleAppRun, HttpError, resetCooldown, type AppEnv } from './app';

const station = { versao: 'v1', gerado_em: '2026-11-07T10:00:00-03:00', estacoes: [
    { id: '101', nome: 'A', status: 'ON', motivo: null, ultima_leitura: '2026-11-07T09:45:00-03:00' },
] };

const baseEnv: AppEnv = {
    SUPABASE_URL: 'https://siges.example',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    SUPABASE_ANON_KEY: 'anon-key',
    ALLOWED_ORIGINS: 'https://siges.app',
    DRY_RUN: 'true',
    INTEGRATION_3_API_KEY: 'gfk_teste',
};

function mockFetch(permission: boolean | 401, rpcRows: unknown[] = []) {
    const seen: { url: string; auth?: string | null; body?: string }[] = [];
    const fn = jest.fn(async (input: Request | string, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.url;
        const headers = new Headers(typeof input === 'string' ? init?.headers : input.headers);
        seen.push({ url, auth: headers.get('Authorization'), body: init?.body as string | undefined });
        if (url.endsWith('/rpc/fc_has_route_permission')) {
            return permission === 401 ? new Response('{}', { status: 401 }) : new Response(JSON.stringify(permission));
        }
        if (url.includes('/cfg_assets_available_integrations?')) {
            return new Response(JSON.stringify([{ id: 3, name: 'GuaibaFlow', provider_code: 'guaibaflow', base_url: null }]));
        }
        if (url.includes('/cfg_assets_available_integrations_mappings')) return new Response('[]');
        if (url.startsWith('https://guaibaflow.com.br/')) return new Response(JSON.stringify(station));
        if (url.endsWith('/rpc/fn_add_assets_available')) return new Response(JSON.stringify(rpcRows));
        return new Response('nf', { status: 404 });
    });
    return { fn, seen };
}

const req = (qs: string, token = 'user-jwt') =>
    new Request('https://worker.example/app/run?' + qs, {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
    });

async function expectHttpError(p: Promise<unknown>, status: number) {
    await expect(p).rejects.toBeInstanceOf(HttpError);
    await p.catch((e: HttpError) => expect(e.status).toBe(status));
}

beforeEach(() => resetCooldown());

describe('handleAppRun', () => {
    it('modo teste: valida permissão view com o token do usuário e não grava', async () => {
        const { fn, seen } = mockFetch(true);
        const r = await handleAppRun(req('integration=3&mode=observe'), baseEnv, fn);
        expect(r.dryRun).toBe(true);
        expect(r.report.ok).toBe(true);
        expect(r.report.observation).toHaveLength(1);
        const perm = seen.find(s => s.url.endsWith('/rpc/fc_has_route_permission'))!;
        expect(perm.auth).toBe('Bearer user-jwt');
        expect(JSON.parse(perm.body!)).toEqual({ p_route_key: 'settings_external_apis', p_action: 'view' });
        expect(seen.some(s => s.url.endsWith('/rpc/fn_add_assets_available'))).toBe(false);
    });

    it('gravação recusada enquanto o servidor está em observação', async () => {
        const { fn } = mockFetch(true);
        await expectHttpError(handleAppRun(req('integration=3&mode=write'), baseEnv, fn), 409);
        expect(fn).not.toHaveBeenCalled();
    });

    it('gravação exige can_edit e chama a RPC quando DRY_RUN=false', async () => {
        const { fn, seen } = mockFetch(true, [{ external_id: '101', result: 'applied', message: null, asset_available_id: 9 }]);
        const r = await handleAppRun(req('integration=3&mode=write'), { ...baseEnv, DRY_RUN: 'false' }, fn);
        expect(r.dryRun).toBe(false);
        expect(r.report.counts?.applied).toBe(1);
        const perm = seen.find(s => s.url.endsWith('/rpc/fc_has_route_permission'))!;
        expect(JSON.parse(perm.body!).p_action).toBe('edit');
    });

    it('sem permissão → 403; sessão inválida → 401; sem token → 401', async () => {
        await expectHttpError(handleAppRun(req('integration=3&mode=observe'), baseEnv, mockFetch(false).fn), 403);
        await expectHttpError(handleAppRun(req('integration=3&mode=observe'), baseEnv, mockFetch(401).fn), 401);
        await expectHttpError(handleAppRun(req('integration=3&mode=observe', ''), baseEnv, mockFetch(true).fn), 401);
    });

    it('valida parâmetros, integração inexistente e repetição rápida', async () => {
        await expectHttpError(handleAppRun(req('integration=abc'), baseEnv, mockFetch(true).fn), 400);
        await expectHttpError(handleAppRun(req('integration=3&mode=x'), baseEnv, mockFetch(true).fn), 400);
        await expectHttpError(handleAppRun(req('integration=99'), baseEnv, mockFetch(true).fn), 404);
        await handleAppRun(req('integration=3'), baseEnv, mockFetch(true).fn);
        await expectHttpError(handleAppRun(req('integration=3'), baseEnv, mockFetch(true).fn), 429);
    });
});

describe('corsHeaders', () => {
    it('só libera origens configuradas', () => {
        const ok = new Request('https://w/app/run', { headers: { Origin: 'https://siges.app' } });
        const bad = new Request('https://w/app/run', { headers: { Origin: 'https://evil.example' } });
        expect(corsHeaders(ok, baseEnv)['Access-Control-Allow-Origin']).toBe('https://siges.app');
        expect(corsHeaders(bad, baseEnv)).toEqual({});
    });
});
