import { supabase } from './supabase';

/**
 * Insert idempotente para o modo offline (colunas offline_uuid —
 * migrations 20261116 + 20261125, que renomeou client_uuid → offline_uuid).
 *
 * Com `offlineUuid` (linha criada no aparelho sem internet), grava a coluna
 * offline_uuid (UNIQUE). Se a fila reenviar a mesma operação — queda no meio
 * do envio — o índice recusa a duplicata (23505) e isso conta como sucesso.
 *
 * Transição: enquanto a 20261125 não estiver aplicada, a coluna ainda se chama
 * client_uuid — o helper detecta (coluna inexistente) e usa o nome antigo.
 * Sem nenhuma das duas (migrations não aplicadas), grava sem o UUID: funciona,
 * mas sem a proteção contra duplicata.
 * Sem `offlineUuid` (fluxo online de sempre): insert normal.
 */

const COLUMNS = ['offline_uuid', 'client_uuid'] as const;
type UuidColumn = (typeof COLUMNS)[number] | null;

/** Coluna que funcionou neste banco (descoberta na 1ª chamada). */
let knownColumn: UuidColumn | undefined;

const isMissingColumn = (e: { code?: string; message?: string } | null | undefined, column: string) =>
    !!e && (e.code === '42703' || e.code === 'PGRST204') && (!e.message || e.message.includes(column));

const isDuplicateUuid = (e: { code?: string; message?: string; details?: string | null }) =>
    e.code === '23505' && /(offline|client)_uuid/i.test(`${e.message} ${e.details ?? ''}`);

const candidates = (): UuidColumn[] => (knownColumn !== undefined ? [knownColumn] : [...COLUMNS, null]);

export const insertWithOfflineUuid = async (
    table: string,
    row: Record<string, unknown>,
    offlineUuid?: string,
): Promise<void> => {
    if (!offlineUuid) {
        const { error } = await supabase.from(table).insert(row);
        if (error) throw error;
        return;
    }

    for (const column of candidates()) {
        const { error } = await supabase.from(table).insert(column ? { ...row, [column]: offlineUuid } : row);
        if (!error) {
            knownColumn = column;
            return;
        }
        if (isDuplicateUuid(error)) {
            knownColumn = column;
            return; // já gravado num envio anterior
        }
        if (column && isMissingColumn(error, column)) continue; // banco ainda com o outro nome
        throw error;
    }
};

/** Id real de uma linha criada offline (procura pelo offline_uuid). */
export const findIdByOfflineUuid = async (table: string, offlineUuid: string): Promise<string | null> => {
    for (const column of candidates()) {
        if (!column) return null; // banco sem a coluna: não há como achar
        const { data, error } = await supabase.from(table).select('id').eq(column, offlineUuid).maybeSingle();
        if (!error) {
            knownColumn = column;
            return data?.id != null ? String(data.id) : null;
        }
        if (isMissingColumn(error, column)) continue;
        throw error;
    }
    return null;
};

/** Só para testes. */
export const __resetOfflineUuidColumn = (): void => {
    knownColumn = undefined;
};
