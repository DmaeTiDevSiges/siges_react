import { useEffect, useRef, useState } from 'react';

/**
 * Destaca por alguns instantes os itens que MUDARAM entre duas versões de uma
 * lista (ex.: card recém-atualizado pelo realtime).
 *
 * Compara uma "assinatura" por id — só os campos que aparecem na tela — em vez
 * de confiar no evento do realtime, que também dispara por mudanças invisíveis
 * e altera várias linhas de uma vez nas cascatas.
 *
 * - Primeira carga e troca de `resetKey` (ex.: outro sistema) não destacam.
 * - Cada id fica destacado `durationMs` desde a ÚLTIMA mudança dele.
 * `getId` / `getSignature` devem ser estáveis (funções de módulo).
 */

/** Ids novos ou com assinatura diferente da versão anterior. */
export function changedIds(prev: ReadonlyMap<string, string>, next: ReadonlyMap<string, string>): string[] {
    const out: string[] = [];
    next.forEach((signature, id) => {
        if (prev.get(id) !== signature) out.push(id);
    });
    return out;
}

export function useRecentlyChanged<T>(
    rows: readonly T[] | null | undefined,
    getId: (row: T) => string | number,
    getSignature: (row: T) => string,
    resetKey: unknown,
    durationMs = 1000,
): ReadonlySet<string> {
    const [active, setActive] = useState<ReadonlySet<string>>(() => new Set());
    const baselineRef = useRef<Map<string, string> | null>(null);
    const resetKeyRef = useRef<unknown>(resetKey);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        if (!rows) return;
        const next = new Map<string, string>();
        for (const row of rows) next.set(String(getId(row)), getSignature(row));

        // Troca de contexto (ex.: outro sistema): as linhas que estão aqui ainda são
        // as ANTIGAS — descarta a referência e espera a próxima carga.
        if (!Object.is(resetKeyRef.current, resetKey)) {
            resetKeyRef.current = resetKey;
            baselineRef.current = null;
            timersRef.current.forEach(clearTimeout);
            timersRef.current.clear();
            setActive(current => (current.size ? new Set() : current));
            return;
        }

        // Sem referência: a primeira carga com dados vira a referência, sem destaque
        // (lista vazia = ainda carregando, não vira referência).
        const prev = baselineRef.current;
        if (prev === null) {
            if (next.size > 0) baselineRef.current = next;
            return;
        }
        baselineRef.current = next;

        const changed = changedIds(prev, next);
        if (changed.length === 0) return;

        setActive(current => {
            const updated = new Set(current);
            changed.forEach(id => updated.add(id));
            return updated;
        });
        for (const id of changed) {
            const old = timersRef.current.get(id);
            if (old) clearTimeout(old);
            timersRef.current.set(id, setTimeout(() => {
                timersRef.current.delete(id);
                setActive(current => {
                    if (!current.has(id)) return current;
                    const updated = new Set(current);
                    updated.delete(id);
                    return updated;
                });
            }, durationMs));
        }
        // getId/getSignature são estáveis por contrato; não entram nas deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, resetKey, durationMs]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(clearTimeout);
            timers.clear();
        };
    }, []);

    return active;
}
