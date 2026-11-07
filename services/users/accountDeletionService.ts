import { supabase } from '../core/supabase';

/** Pedido de exclusão de conta (tabela users_account_deletion_requests). */
export interface AccountDeletionRequest {
    id: string;
    status: 'pending' | 'cancelled' | 'done';
    reason?: string;
    requestedAt: string;
}

const mapRequest = (row: any): AccountDeletionRequest => ({
    id: String(row.id),
    status: row.status,
    reason: row.reason || undefined,
    requestedAt: row.requested_at,
});

export const accountDeletionService = {
    /** Pedido pendente do usuário logado (RLS limita às próprias linhas). */
    async getMyPendingAccountDeletion(): Promise<AccountDeletionRequest | null> {
        const { data, error } = await supabase
            .from('users_account_deletion_requests')
            .select('id, status, reason, requested_at')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapRequest(data) : null;
    },

    /** Registra o pedido (idempotente: devolve o pendente se já existir). */
    async requestAccountDeletion(reason?: string): Promise<AccountDeletionRequest> {
        const { data, error } = await supabase.rpc('fn_users_request_account_deletion', {
            p_reason: reason ?? null,
        });
        if (error) throw new Error(error.message);
        return mapRequest(Array.isArray(data) ? data[0] : data);
    },

    async cancelAccountDeletion(): Promise<void> {
        const { error } = await supabase.rpc('fn_users_cancel_account_deletion');
        if (error) throw new Error(error.message);
    },
};
