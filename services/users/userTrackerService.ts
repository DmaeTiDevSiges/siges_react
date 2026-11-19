import { supabase } from '../core/supabase';

/**
 * Posição do rastreador em public.users_tracker (migration 20261111), fora da
 * tabela users para não disparar o Realtime de users a cada envio de posição.
 *
 * As colunas latitude/longitude/tracker_* de users foram removidas pela
 * 20261122_drop_users_legacy_tracker_columns.sql: não há mais caminho antigo.
 */

const TRACKER_COLUMNS = ['latitude', 'longitude', 'tracker_accuracy', 'tracked_at', 'tracker_heartbeat_at'] as const;
const IDS_PER_QUERY = 200;

/** true depois que o banco responder que users_tracker não está pronta (não insiste). */
let trackerTableMissing = false;
// 42703/PGRST204: a tabela legada users_tracker existe, mas ainda sem as colunas
// novas (migration 20261111 não aplicada) → usa o caminho antigo.
const isMissingRelation = (error: { code?: string } | null) =>
    !!error && ['42P01', 'PGRST205', '42703', 'PGRST204'].includes(error.code || '');

/**
 * Substitui, nas linhas de users recebidas, latitude/longitude/tracker_* pelos
 * valores de users_tracker. Altera as linhas no lugar e as devolve.
 */
export async function applyTrackerPositions<T extends { id?: unknown }>(rows: T[]): Promise<T[]> {
    if (trackerTableMissing || !rows?.length) return rows;

    const ids = [...new Set(rows.map(r => Number(r?.id)).filter(id => Number.isFinite(id)))];
    if (ids.length === 0) return rows;

    const byUser = new Map<number, Record<string, unknown>>();
    for (let i = 0; i < ids.length; i += IDS_PER_QUERY) {
        const { data, error } = await supabase
            .from('users_tracker')
            .select(`user_id, ${TRACKER_COLUMNS.join(', ')}`)
            .in('user_id', ids.slice(i, i + IDS_PER_QUERY));
        if (error) {
            if (isMissingRelation(error)) trackerTableMissing = true;
            else console.warn('[userTracker] Falha ao ler users_tracker:', error.message);
            return rows;
        }
        (data || []).forEach((row: any) => byUser.set(Number(row.user_id), row));
    }

    for (const row of rows as any[]) {
        const tracker = byUser.get(Number(row?.id));
        if (!tracker) continue;
        for (const column of TRACKER_COLUMNS) row[column] = tracker[column];
    }
    return rows;
}

/**
 * Envia a posição do usuário logado (web / app sem o serviço nativo).
 * Usa fn_users_tracker_report_session (a função identifica o usuário pela sessão).
 */
export async function reportSessionLocation(
    _userId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null
): Promise<void> {
    const { error } = await supabase.rpc('fn_users_tracker_report_session', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy: accuracy,
    });
    if (error) console.error('[userTracker] Erro ao enviar posição:', error);
}
