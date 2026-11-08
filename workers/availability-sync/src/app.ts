/**
 * Execução manual pelo app SIGES (Ajustes → APIs Externas → botão "Executar agora").
 *
 *   POST /app/run?integration=<id>&mode=observe|write
 *   Authorization: Bearer <access_token do Supabase do usuário logado>
 *
 * Autorização (sem segredo no app):
 *   - a sessão e a permissão são validadas numa só chamada a
 *     rpc/fc_has_route_permission com o token do próprio usuário (auth.uid());
 *   - observe → can_view na rota settings_external_apis (só consulta, nunca grava);
 *   - write   → can_edit, e só quando o Worker está com DRY_RUN = "false".
 *     O app nunca liga a gravação: o modo observação do servidor prevalece.
 */

import { loadIntegrations, syncIntegration, type IntegrationReport, type SyncEnv } from './sync';

export const APP_ROUTE_KEY = 'settings_external_apis';
const COOLDOWN_MS = 15_000;

export interface AppEnv extends SyncEnv {
    /** Chave anon (pública) — o gateway do Supabase exige o header apikey. */
    SUPABASE_ANON_KEY?: string;
    /** Origens permitidas (CORS), separadas por vírgula. */
    ALLOWED_ORIGINS?: string;
    DRY_RUN?: string;
}

type FetchFn = (input: Request | string, init?: RequestInit) => Promise<Response>;

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export interface AppRunResult {
    dryRun: boolean;
    report: IntegrationReport;
}

// Evita disparos repetidos (duplo clique, vários usuários) por isolate.
const lastRunAt = new Map<string, number>();

export function corsHeaders(request: Request, env: AppEnv): Record<string, string> {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return {};
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

export async function hasRoutePermission(
    env: AppEnv,
    fetchFn: FetchFn,
    userToken: string,
    action: 'view' | 'edit',
): Promise<boolean> {
    if (!env.SUPABASE_ANON_KEY) throw new HttpError(500, 'SUPABASE_ANON_KEY não configurada no Worker');
    const res = await fetchFn(env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/fc_has_route_permission', {
        method: 'POST',
        headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + userToken,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ p_route_key: APP_ROUTE_KEY, p_action: action }),
        signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 401 || res.status === 403) throw new HttpError(401, 'Sessão inválida ou expirada');
    if (!res.ok) throw new HttpError(502, 'Falha ao validar permissão no SIGES (HTTP ' + res.status + ')');
    return (await res.json()) === true;
}

export async function handleAppRun(request: Request, env: AppEnv, fetchFn: FetchFn = fetch): Promise<AppRunResult> {
    const header = request.headers.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new HttpError(401, 'Login necessário');

    const url = new URL(request.url);
    const integrationParam = url.searchParams.get('integration') || '';
    if (!/^[0-9]{1,18}$/.test(integrationParam)) throw new HttpError(400, 'Parâmetro integration inválido');
    const mode = url.searchParams.get('mode') || 'observe';
    if (mode !== 'observe' && mode !== 'write') throw new HttpError(400, 'Parâmetro mode deve ser observe ou write');

    const serverDryRun = env.DRY_RUN !== 'false';
    if (mode === 'write' && serverDryRun) {
        throw new HttpError(409, 'A gravação está desligada no servidor (modo observação). Use "Testar".');
    }

    const allowed = await hasRoutePermission(env, fetchFn, token, mode === 'write' ? 'edit' : 'view');
    if (!allowed) {
        throw new HttpError(403, mode === 'write' ? 'Seu perfil não pode executar com gravação' : 'Seu perfil não pode executar esta API');
    }

    const target = (await loadIntegrations(env, fetchFn)).find(i => String(i.id) === integrationParam);
    if (!target) throw new HttpError(404, 'Integração ativa não encontrada (ou provedor sem adaptador)');

    const cooldownKey = integrationParam + ':' + mode;
    const last = lastRunAt.get(cooldownKey) || 0;
    if (Date.now() - last < COOLDOWN_MS) {
        throw new HttpError(429, 'Execução recente desta API; aguarde alguns segundos');
    }
    lastRunAt.set(cooldownKey, Date.now());

    const dryRun = mode === 'observe';
    return { dryRun, report: await syncIntegration(env, target, dryRun, fetchFn) };
}

/** Só para testes. */
export function resetCooldown(): void {
    lastRunAt.clear();
}
