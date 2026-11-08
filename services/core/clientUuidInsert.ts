import { supabase } from './supabase';

/**
 * Insert idempotente para o modo offline (F4, migration 20261116).
 *
 * Com `clientUuid` (linha criada no aparelho sem internet), grava a coluna
 * client_uuid (UNIQUE). Se a fila reenviar a mesma operação — queda no meio
 * do envio — o índice recusa a duplicata (23505) e isso conta como sucesso.
 * Sem a migration aplicada (coluna inexistente), grava sem client_uuid:
 * funciona, mas sem a proteção contra duplicata.
 * Sem `clientUuid` (fluxo online de sempre): insert normal.
 */
export const insertWithClientUuid = async (
    table: string,
    row: Record<string, unknown>,
    clientUuid?: string,
): Promise<void> => {
    if (!clientUuid) {
        const { error } = await supabase.from(table).insert(row);
        if (error) throw error;
        return;
    }

    const { error } = await supabase.from(table).insert({ ...row, client_uuid: clientUuid });
    if (!error) return;
    if (error.code === '23505' && /client_uuid/i.test(`${error.message} ${error.details ?? ''}`)) return;
    if (error.code === '42703' || error.code === 'PGRST204') {
        const { error: retryError } = await supabase.from(table).insert(row);
        if (retryError) throw retryError;
        return;
    }
    throw error;
};

/** Id real de uma linha criada offline (procura pelo client_uuid). */
export const findIdByClientUuid = async (table: string, clientUuid: string): Promise<string | null> => {
    const { data, error } = await supabase.from(table).select('id').eq('client_uuid', clientUuid).maybeSingle();
    if (error) throw error;
    return data?.id != null ? String(data.id) : null;
};
