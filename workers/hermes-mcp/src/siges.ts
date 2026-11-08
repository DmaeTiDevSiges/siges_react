import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Sessão Supabase do usuário SIGES vinculado a este Hermes.
 *
 * Fazemos login com e-mail/senha (anon key) em vez de usar a service_role:
 * assim o RLS e as views `security_invoker` aplicam exatamente a mesma
 * visibilidade que esse usuário tem no app. O LLM nunca escolhe "quem" está
 * consultando — a identidade vem só das variáveis de ambiente.
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

let client: SupabaseClient | null = null;
let profile: SigesProfile | null = null;

export async function getSiges(): Promise<{ db: SupabaseClient; me: SigesProfile }> {
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
        .select('id, name_short, name_full, email, company_id, team_id, is_team_leader, is_admin')
        .eq('uuid', auth.user.id)
        .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('Usuário autenticado não tem cadastro na tabela users do SIGES.');

    profile = {
        id: Number(row.id),
        name: row.name_short || row.name_full || row.email,
        email: row.email,
        companyId: row.company_id != null ? Number(row.company_id) : null,
        teamId: row.team_id != null ? Number(row.team_id) : null,
        isTeamLeader: !!row.is_team_leader,
        isAdmin: !!row.is_admin,
    };
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
