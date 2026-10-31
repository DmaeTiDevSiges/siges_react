import { supabase } from './supabase';
import { AuditLogItem, AuditLogFilters, AuditOperation, AuditTableConfig, AuditTableConfigChange } from '../../types';

/**
 * Leitura do log de auditoria de banco (tabela public.audits_logs).
 *
 * A ESCRITA não acontece por aqui: é feita por triggers (fc_audit_log)
 * instalados nas tabelas de negócio — ver migrations
 * 20261046_reactivate_audits_logs.sql e 20261047_create_audit_triggers.sql.
 * A RLS da tabela nega escrita direta do client; apenas a função
 * SECURITY DEFINER dos triggers grava.
 *
 * Autoria: audits_logs.user_id → public.users.id (FK criada na
 * migration 20261049; antes a coluna era user_uuid, já removida).
 * O nome do autor é resolvido numa SEGUNDA QUERY contra `users` em vez
 * de join embutido (`user:user_id(...)`): assim a leitura funciona
 * também enquanto a FK ainda não tiver sido aplicada no banco — nenhum
 * gargalo de schema cache do PostgREST (PGRST200).
 */

/** Nunca lança: se o lookup falhar, a lista volta sem nomes (só um warning). */
const resolveUserNames = async (
    userIds: Array<number | null | undefined>
): Promise<Map<number, string>> => {
    const ids = [...new Set(userIds.filter((id): id is number => typeof id === 'number'))];
    const names = new Map<number, string>();
    if (ids.length === 0) return names;

    const { data, error } = await supabase
        .from('users')
        .select('id, name_short, name_full')
        .in('id', ids);

    if (error) {
        console.error('[auditService] Error resolving audit authors:', error);
        return names;
    }

    for (const u of data || []) {
        const name = u.name_short || u.name_full || null;
        if (name) names.set(Number(u.id), name);
    }
    return names;
};

export const auditService = {
    async listTableConfig(): Promise<AuditTableConfig[]> {
        const { data, error } = await supabase.rpc('get_audit_table_config');
        if (error) {
            console.error('[auditService] Error listing audit table config:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            table_name: String(row.table_name),
            is_enabled: row.is_enabled === true,
            table_exists: row.table_exists === true,
        }));
    },

    async updateTableConfig(changes: AuditTableConfigChange[]): Promise<void> {
        if (changes.length === 0) return;

        const { error } = await supabase.rpc('set_audit_table_config', {
            p_changes: changes,
        });
        if (error) {
            console.error('[auditService] Error updating audit table config:', error);
            throw error;
        }
    },

    /**
     * Lista eventos de auditoria com filtros, paginação server-side e
     * nome do autor resolvido via lookup em users.
     * data_old/data_new não são retornados aqui (peso) — usar getLogById.
     */
    async listLogs(filters?: AuditLogFilters): Promise<{ logs: AuditLogItem[]; total: number }> {
        let query = supabase
            .from('audits_logs')
            .select('id, created_date, table_name, operation, record_id, user_id', { count: 'exact' })
            .order('id', { ascending: false });

        if (filters?.tableName) {
            query = query.eq('table_name', filters.tableName);
        }
        if (filters?.operation) {
            query = query.eq('operation', filters.operation);
        }
        if (filters?.userId != null) {
            // Autoria agora é user_id → public.users.id (FK), sem user_uuid.
            query = query.eq('user_id', filters.userId);
        }
        if (filters?.dateFrom) {
            // created_date é timestamp sem offset em horário de SP (convenção
            // do projeto): comparar com a string 'YYYY-MM-DD' usa meia-noite de SP.
            query = query.gte('created_date', `${filters.dateFrom} 00:00:00`);
        }
        if (filters?.dateTo) {
            query = query.lte('created_date', `${filters.dateTo} 23:59:59`);
        }
        if (filters?.search) {
            const q = filters.search.replace(/%/g, '\\%');
            query = query.or(`record_id.ilike.%${q}%,table_name.ilike.%${q}%`);
        }

        const page = filters?.page || 0;
        const pageSize = filters?.pageSize || 20;
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[auditService] Error listing audit logs:', error);
            return { logs: [], total: 0 };
        }

        const rows = data || [];

        // 2ª query: nomes dos autores (sem join embutido no PostgREST)
        const namesById = await resolveUserNames(rows.map((r: any) => r.user_id));

        const logs = rows.map((row: any) => ({
            id: Number(row.id),
            createdAt: row.created_date,
            tableName: row.table_name,
            operation: row.operation as AuditOperation,
            recordId: row.record_id,
            userId: row.user_id != null ? Number(row.user_id) : null,
            userName: row.user_id != null ? namesById.get(Number(row.user_id)) ?? null : null,
            dataOld: null,
            dataNew: null,
        })) satisfies AuditLogItem[];

        return { logs, total: count || 0 };
    },

    /**
     * Detalhe de um evento (com data_old / data_new para o diff).
     */
    async getLogById(id: number): Promise<AuditLogItem | null> {
        const { data, error } = await supabase
            .from('audits_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            if (error) console.error('[auditService] Error fetching audit log:', error);
            return null;
        }

        const namesById = await resolveUserNames([(data as any).user_id]);
        const userName = (data as any).user_id != null
            ? namesById.get(Number((data as any).user_id)) ?? null
            : null;

        return {
            id: Number((data as any).id),
            createdAt: (data as any).created_date,
            tableName: (data as any).table_name,
            operation: (data as any).operation as AuditOperation,
            recordId: (data as any).record_id,
            userId: (data as any).user_id != null ? Number((data as any).user_id) : null,
            userName,
            dataOld: (data as any).data_old,
            dataNew: (data as any).data_new,
        };
    },
};
