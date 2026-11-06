/**
 * siges-files — Cloudflare Worker que intermedia o acesso ao bucket R2.
 *
 * Por quê: o app usava a chave S3 do R2 (VITE_R2_SECRET_ACCESS_KEY), que ia
 * embutida no JavaScript público e no APK. Este Worker acessa o bucket por
 * *binding* (sem chave nenhuma) e só atende usuários logados no Supabase.
 *
 * Rotas (todas exigem `Authorization: Bearer <access_token do Supabase>`):
 *   PUT    /objects/<caminho>   upload (corpo = arquivo)
 *   GET    /objects/<caminho>   download
 *   DELETE /objects/<caminho>   exclusão
 *   POST   /copy                cópia  { "src": "<caminho>", "dest": "<caminho>" }
 *
 * Regras de caminho:
 *   - só `companies/<número>/...` e `users/<número>/...`
 *   - sem `..`, `//`, barra inicial, caracteres de controle; até 512 caracteres
 *   - `users/<id>/...` só pode ser gravado/apagado pelo próprio usuário
 *   (Restrição por empresa em `companies/<id>/` fica para uma 2ª etapa:
 *    prestadores trabalham em ativos de empresas clientes.)
 */

// ── Tipos mínimos do runtime (evita dependência de @cloudflare/workers-types) ──
interface R2HttpMetadata {
    contentType?: string;
    contentEncoding?: string;
    cacheControl?: string;
}
interface R2ObjectBody {
    body: ReadableStream;
    httpMetadata?: R2HttpMetadata;
    size: number;
    httpEtag: string;
    arrayBuffer(): Promise<ArrayBuffer>;
}
interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | null, options?: { httpMetadata?: R2HttpMetadata }): Promise<unknown>;
    delete(key: string): Promise<void>;
}

export interface Env {
    BUCKET: R2Bucket;
    SUPABASE_URL: string;
    /** Chave anon (pública) — o gateway do Supabase exige o header apikey. */
    SUPABASE_ANON_KEY: string;
    /** Origens permitidas (CORS), separadas por vírgula. */
    ALLOWED_ORIGINS: string;
    /** Tamanho máximo de upload em MB (padrão 25). */
    MAX_UPLOAD_MB?: string;
}

const CACHE_CONTROL = 'public, max-age=31536000, immutable';

// ── Autenticação (cache curto por isolate para não validar a cada arquivo) ──
interface AuthUser {
    uuid: string;
    userId: string | null; // public.users.id
}
const authCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const AUTH_TTL_MS = 60_000;

class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

async function authenticate(request: Request, env: Env): Promise<AuthUser> {
    const header = request.headers.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new HttpError(401, 'Login necessário');

    const cached = authCache.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.user;

    const base = env.SUPABASE_URL.replace(/\/+$/, '');
    const headers = { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY };

    // Supabase auto-hospedado: valida o token no próprio GoTrue (sem segredo JWT aqui).
    const authRes = await fetch(`${base}/auth/v1/user`, { headers });
    if (!authRes.ok) throw new HttpError(401, 'Sessão inválida ou expirada');
    const authUser = (await authRes.json()) as { id?: string };
    if (!authUser?.id) throw new HttpError(401, 'Sessão inválida');

    // users.id (bigint) do usuário logado — necessário para users/<id>/...
    let userId: string | null = null;
    const userRes = await fetch(
        `${base}/rest/v1/users?uuid=eq.${encodeURIComponent(authUser.id)}&select=id&limit=1`,
        { headers }
    );
    if (userRes.ok) {
        const rows = (await userRes.json()) as Array<{ id: number | string }>;
        if (rows?.[0]?.id != null) userId = String(rows[0].id);
    }

    const user: AuthUser = { uuid: authUser.id, userId };
    if (authCache.size > 500) authCache.clear();
    authCache.set(token, { user, expiresAt: Date.now() + AUTH_TTL_MS });
    return user;
}

// ── Validação de caminho ─────────────────────────────────────────────────────
const KEY_PREFIX = /^(companies|users)\/(\d+)\/./;

function validateKey(key: string): { scope: 'companies' | 'users'; ownerId: string } {
    if (
        !key ||
        key.length > 512 ||
        key.startsWith('/') ||
        key.includes('//') ||
        key.split('/').some(part => part === '..' || part === '.') ||
        /[\u0000-\u001f\u007f\\]/.test(key)
    ) {
        throw new HttpError(400, 'Caminho inválido');
    }
    const match = KEY_PREFIX.exec(key);
    if (!match) throw new HttpError(403, 'Caminho fora das áreas permitidas');
    return { scope: match[1] as 'companies' | 'users', ownerId: match[2] };
}

function assertCanWrite(key: string, user: AuthUser) {
    const { scope, ownerId } = validateKey(key);
    if (scope === 'users' && ownerId !== user.userId) {
        throw new HttpError(403, 'Sem permissão para alterar arquivos de outro usuário');
    }
}

function keyFromPath(pathname: string): string {
    const raw = pathname.slice('/objects/'.length);
    try {
        return raw.split('/').map(decodeURIComponent).join('/');
    } catch {
        throw new HttpError(400, 'Caminho inválido');
    }
}

// ── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(request: Request, env: Env): Record<string, string> {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return {};
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-File-Encoding',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

const json = (body: unknown, status: number, extra: Record<string, string>) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...extra },
    });

// ── Handlers ─────────────────────────────────────────────────────────────────
async function handleUpload(request: Request, env: Env, key: string, user: AuthUser) {
    assertCanWrite(key, user);
    const maxBytes = Number(env.MAX_UPLOAD_MB || '25') * 1024 * 1024;
    const length = Number(request.headers.get('Content-Length') || '0');
    if (!length) throw new HttpError(411, 'Content-Length obrigatório');
    if (length > maxBytes) throw new HttpError(413, `Arquivo maior que ${env.MAX_UPLOAD_MB || '25'} MB`);

    // Encoding do arquivo vem em header próprio: um Content-Encoding no request
    // seria interpretado pela borda da Cloudflare como compressão do transporte.
    const encoding = request.headers.get('X-File-Encoding');
    await env.BUCKET.put(key, request.body, {
        httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream',
            ...(encoding === 'gzip' ? { contentEncoding: 'gzip' } : {}),
            cacheControl: CACHE_CONTROL,
        },
    });
    return { path: key };
}

async function handleDownload(env: Env, key: string, cors: Record<string, string>) {
    validateKey(key);
    const object = await env.BUCKET.get(key);
    if (!object) return json({ error: 'Arquivo não encontrado' }, 404, cors);
    // Devolve os bytes como estão (o app descomprime gzip — ver r2Service.downloadFile)
    // e informa o encoding em header próprio para a borda não reprocessar.
    return new Response(object.body, {
        headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'X-File-Encoding': object.httpMetadata?.contentEncoding || '',
            'Cache-Control': 'private, no-store',
            'Access-Control-Expose-Headers': 'X-File-Encoding',
            ...cors,
        },
    });
}

async function handleCopy(request: Request, env: Env, user: AuthUser) {
    const body = (await request.json().catch(() => null)) as { src?: string; dest?: string } | null;
    if (!body?.src || !body?.dest) throw new HttpError(400, 'Informe src e dest');
    validateKey(body.src);
    assertCanWrite(body.dest, user);
    const source = await env.BUCKET.get(body.src);
    if (!source) throw new HttpError(404, 'Arquivo de origem não encontrado');
    await env.BUCKET.put(body.dest, await source.arrayBuffer(), {
        httpMetadata: { ...source.httpMetadata, cacheControl: CACHE_CONTROL },
    });
    return { path: body.dest };
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const cors = corsHeaders(request, env);
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: cors });
        }

        try {
            const url = new URL(request.url);
            const user = await authenticate(request, env);

            if (url.pathname === '/copy' && request.method === 'POST') {
                return json(await handleCopy(request, env, user), 200, cors);
            }
            if (url.pathname.startsWith('/objects/')) {
                const key = keyFromPath(url.pathname);
                if (request.method === 'PUT') return json(await handleUpload(request, env, key, user), 200, cors);
                if (request.method === 'GET') return await handleDownload(env, key, cors);
                if (request.method === 'DELETE') {
                    assertCanWrite(key, user);
                    await env.BUCKET.delete(key);
                    return json({ ok: true }, 200, cors);
                }
            }
            return json({ error: 'Rota não encontrada' }, 404, cors);
        } catch (error) {
            const status = error instanceof HttpError ? error.status : 500;
            const message = error instanceof HttpError ? error.message : 'Erro interno';
            if (status === 500) console.error('[siges-files]', error);
            return json({ error: message }, status, cors);
        }
    },
};
