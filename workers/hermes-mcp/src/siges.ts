import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AccessDenied, callContext, phoneCandidates, signJwt, verifySenderToken } from './identity.js';

/**
 * Sessão Supabase do usuário SIGES que está consultando.
 *
 * Dois modos (sempre com RLS do usuário, nunca consultas como service_role):
 *  - USUÁRIO ÚNICO (padrão): login com SIGES_USER_EMAIL/SIGES_USER_PASSWORD.
 *  - MULTIUSUÁRIO (SUPABASE_JWT_SECRET + SIGES_HOOK_SECRET definidos): o remetente
 *    vem assinado pelo plugin do Hermes; achamos o usuário por users.mobile_full e
 *    emitimos um JWT curto em nome dele. O LLM nunca escolhe "quem" está consultando.
 */

export interface SigesProfile {
    id: number;
    name: string;
    email: string;
    companyId: number | null;
    teamId: number | null;
    isTeamLeader: boolean;
    isAdmin: boolean;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
    return value;
}

export const MAX_ROWS = Math.max(1, Math.min(200, Number(process.env.SIGES_MAX_ROWS) || 50));

export const isMultiUser = () => !!(process.env.SUPABASE_JWT_SECRET && process.env.SIGES_HOOK_SECRET);

const PROFILE_COLUMNS = 'id, uuid, name_short, name_full, email, company_id, team_id, is_team_leader, is_admin, is_available';

function toProfile(row: any): SigesProfile {
    return {
        id: Number(row.id),
        name: row.name_short || row.name_full || row.email,
        email: row.email,
        companyId: row.company_id != null ? Number(row.company_id) : null,
        teamId: row.team_id != null ? Number(row.team_id) : null,
        isTeamLeader: !!row.is_team_leader,
        isAdmin: !!row.is_admin,
    };
}

export async function getSiges(): Promise<{ db: SupabaseClient; me: SigesProfile }> {
    return isMultiUser() ? getSigesForSender() : getSigesSingleUser();
}

// ---------------------------------------------------------------------------
// Modo multiusuário
// ---------------------------------------------------------------------------

const JWT_TTL_SECONDS = 15 * 60;
const CACHE_TTL_MS = 5 * 60 * 1000;
const senderCache = new Map<string, { at: number; db: SupabaseClient; me: SigesProfile }>();

function anonClient(accessToken: string): SupabaseClient {
    return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
}

async function getSigesForSender(): Promise<{ db: SupabaseClient; me: SigesProfile }> {
    const jwtSecret = requireEnv('SUPABASE_JWT_SECRET');
    const sender = verifySenderToken(callContext.getStore()?.auth, requireEnv('SIGES_HOOK_SECRET'));

    const cached = senderCache.get(sender);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return { db: cached.db, me: cached.me };

    // Busca do usuário pelo celular: única consulta feita com papel de serviço,
    // limitada a esta linha. Tudo o mais roda com o JWT do próprio usuário (RLS).
    const now = Math.floor(Date.now() / 1000);
    const lookup = anonClient(signJwt({ role: 'service_role', iss: 'siges-tools', iat: now, exp: now + 60 }, jwtSecret));
    const { data: rows, error } = await lookup
        .from('users')
        .select(PROFILE_COLUMNS)
        .in('mobile_full', phoneCandidates(sender))
        .limit(2);
    if (error) throw error;
    if (!rows?.length) throw new AccessDenied('este número de WhatsApp não está cadastrado (campo celular) em nenhum usuário do SIGES.');
    if (rows.length > 1) throw new AccessDenied('mais de um usuário do SIGES tem este celular; corrija o cadastro.');
    const row: any = rows[0];
    if (row.is_available === false) throw new AccessDenied('usuário inativo no SIGES.');
    if (!row.uuid || !row.email) throw new AccessDenied('usuário sem login (uuid/e-mail) no SIGES.');

    const userJwt = signJwt({
        sub: row.uuid,
        email: row.email,
        role: 'authenticated',
        aud: 'authenticated',
        iss: 'siges-tools',
        iat: now,
        exp: now + JWT_TTL_SECONDS,
    }, jwtSecret);

    const entry = { at: Date.now(), db: anonClient(userJwt), me: toProfile(row) };
    senderCache.set(sender, entry);
    return { db: entry.db, me: entry.me };
}

// ---------------------------------------------------------------------------
// Modo usuário único
// ---------------------------------------------------------------------------

let client: SupabaseClient | null = null;
let profile: SigesProfile | null = null;

async function getSigesSingleUser(): Promise<{ db: SupabaseClient; me: SigesProfile }> {
    if (client && profile) {
        // autoRefreshToken renova o JWT; se a sessão sumiu (ex.: senha trocada), refaz o login.
        const { data } = await client.auth.getSession();
        if (data.session) return { db: client, me: profile };
    }

    client = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
        auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
    });

    const { data: auth, error: authError } = await client.auth.signInWithPassword({
        email: requireEnv('SIGES_USER_EMAIL'),
        password: requireEnv('SIGES_USER_PASSWORD'),
    });
    if (authError || !auth.user) {
        client = null;
        throw new Error(`Falha no login SIGES: ${authError?.message ?? 'usuário não retornado'}`);
    }

    const { data: row, error } = await client
        .from('users')
        .select(PROFILE_COLUMNS)
        .eq('uuid', auth.user.id)
        .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('Usuário autenticado não tem cadastro na tabela users do SIGES.');

    profile = toProfile(row);
    return { db: client, me: profile };
}

/**
 * Padrão de "apenas as minhas": só faz sentido para quem trabalha em campo
 * (líder de equipe que não é admin). Gestor/admin, por padrão, vê tudo que o RLS permite.
 */
export const defaultOnlyMine = (me: SigesProfile) => me.isTeamLeader && !me.isAdmin;

// ---------------------------------------------------------------------------
// Datas — padrão SIGES: America/Sao_Paulo. Timestamps sem offset no banco já
// são horário local de São Paulo, então comparamos como texto 'YYYY-MM-DD HH:MM:SS'.
// ---------------------------------------------------------------------------

const TZ = 'America/Sao_Paulo';

/** Data de hoje (ou hoje + offset em dias) em São Paulo, formato YYYY-MM-DD. */
export function todayInBrazil(offsetDays = 0): string {
    const d = new Date(Date.now() + offsetDays * 86_400_000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export const dayStart = (date: string) => `${date} 00:00:00`;
export const dayEnd = (date: string) => `${date} 23:59:59`;

/** Formata um timestamp do banco como 'DD/MM/AAAA HH:MM' (horário de São Paulo). */
export function formatBr(value: string | null | undefined): string | null {
    if (!value) return null;
    const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
    if (!hasOffset) {
        // Já é horário local de SP — só reordena, sem converter.
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
        if (!m) return value;
        return m[4] ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : `${m[3]}/${m[2]}/${m[1]}`;
    }
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
}
