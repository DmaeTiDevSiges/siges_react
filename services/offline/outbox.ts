/**
 * Fila de operações offline (F2) — docs/OFFLINE_PLANO_IMPLEMENTACAO.md.
 *
 * Cada gravação feita sem internet vira uma operação: o NOME do método do
 * dataService e os ARGUMENTOS. Ao reconectar, o syncEngine executa o mesmo
 * método, na ordem em que o técnico fez — a regra de negócio continua num
 * lugar só (o serviço), sem cópia em SQL.
 *
 * Persistência: a lista inteira num único valor do Preferences (SharedPreferences
 * no Android, gravação atômica) — app morto no meio não perde operação.
 * Fica FORA do store de cache: o logout limpa o cache, nunca a fila.
 */

export type OutboxStatus = 'pending' | 'error' | 'conflict';

export interface OutboxOp {
    id: string;
    seq: number;
    method: string;
    args: unknown[];
    createdAt: number;
    /** auth.uid de quem fez — só a sessão do mesmo usuário envia. */
    userUuid: string | null;
    /** Ativo da visita (orders_visits_assets.id) — para checar a trava. */
    ovaId?: string;
    /** Visita (orders_visits.id) — "Relatar visita"/"Encerrar" esperam as dela. */
    visitId?: string;
    status: OutboxStatus;
    attempts: number;
    lastError?: string;
    lastAttemptAt?: number;
}

export interface OutboxStorage {
    load(): Promise<OutboxOp[]>;
    save(ops: OutboxOp[]): Promise<void>;
}

export interface OutboxSummary {
    pending: number;
    errors: number;
    conflicts: number;
    total: number;
}

export type NewOutboxOp = Pick<OutboxOp, 'method' | 'args' | 'userUuid' | 'ovaId' | 'visitId'>;

const newId = (): string => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch {
        /* segue */
    }
    return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const summarize = (ops: OutboxOp[]): OutboxSummary => ({
    pending: ops.filter(o => o.status === 'pending').length,
    errors: ops.filter(o => o.status === 'error').length,
    conflicts: ops.filter(o => o.status === 'conflict').length,
    total: ops.length,
});

export interface Outbox {
    enqueue(op: NewOutboxOp): Promise<OutboxOp>;
    list(): Promise<OutboxOp[]>;
    update(id: string, patch: Partial<Omit<OutboxOp, 'id' | 'seq'>>): Promise<void>;
    remove(id: string): Promise<void>;
    /** Erros voltam para pendente (o técnico tocou em "Tentar de novo"). */
    retryErrors(): Promise<number>;
    /** Remove as operações que casam com o filtro e as devolve (F3: anular envio de foto). */
    removeWhere(pred: (op: OutboxOp) => boolean): Promise<OutboxOp[]>;
    /** Descarta as operações com esse estado (o técnico confirmou). */
    discard(status: Exclude<OutboxStatus, 'pending'>): Promise<number>;
    summary(): Promise<OutboxSummary>;
    subscribe(listener: (summary: OutboxSummary, ops: OutboxOp[]) => void): () => void;
}

export const createOutbox = (storage: OutboxStorage, now: () => number = Date.now): Outbox => {
    let cache: OutboxOp[] | null = null;
    // Todas as mudanças passam por esta corrente: nada se cruza.
    let chain: Promise<unknown> = Promise.resolve();
    const listeners = new Set<(s: OutboxSummary, ops: OutboxOp[]) => void>();

    const load = async () => {
        if (!cache) {
            try {
                cache = (await storage.load()) || [];
            } catch {
                cache = [];
            }
            cache.sort((a, b) => a.seq - b.seq);
        }
        return cache;
    };

    const notify = (ops: OutboxOp[]) => {
        const s = summarize(ops);
        listeners.forEach(l => {
            try {
                l(s, ops.map(o => ({ ...o })));
            } catch {
                /* listener com erro não derruba a fila */
            }
        });
    };

    const mutate = <T>(fn: (ops: OutboxOp[]) => T): Promise<T> => {
        const run = chain.then(async () => {
            const ops = await load();
            const result = fn(ops);
            await storage.save(ops);
            notify(ops);
            return result;
        });
        chain = run.catch(() => undefined);
        return run;
    };

    return {
        enqueue: op =>
            mutate(ops => {
                const seq = ops.length ? ops[ops.length - 1].seq + 1 : 1;
                const entry: OutboxOp = {
                    id: newId(),
                    seq,
                    method: op.method,
                    args: JSON.parse(JSON.stringify(op.args ?? [])),
                    createdAt: now(),
                    userUuid: op.userUuid ?? null,
                    ovaId: op.ovaId,
                    visitId: op.visitId,
                    status: 'pending',
                    attempts: 0,
                };
                ops.push(entry);
                return { ...entry };
            }),

        list: async () => {
            await chain;
            return (await load()).map(o => ({ ...o }));
        },

        update: (id, patch) =>
            mutate(ops => {
                const op = ops.find(o => o.id === id);
                if (op) Object.assign(op, patch);
            }),

        remove: id =>
            mutate(ops => {
                const i = ops.findIndex(o => o.id === id);
                if (i >= 0) ops.splice(i, 1);
            }),

        retryErrors: () =>
            mutate(ops => {
                let n = 0;
                for (const op of ops) {
                    if (op.status === 'error') {
                        op.status = 'pending';
                        op.lastError = undefined;
                        n++;
                    }
                }
                return n;
            }),

        removeWhere: pred =>
            mutate(ops => {
                const removed: OutboxOp[] = [];
                for (let i = ops.length - 1; i >= 0; i--) {
                    if (pred({ ...ops[i] })) removed.unshift(...ops.splice(i, 1));
                }
                return removed;
            }),

        discard: status =>
            mutate(ops => {
                const before = ops.length;
                for (let i = ops.length - 1; i >= 0; i--) if (ops[i].status === status) ops.splice(i, 1);
                return before - ops.length;
            }),

        summary: async () => {
            await chain;
            return summarize(await load());
        },

        subscribe: listener => {
            listeners.add(listener);
            load().then(ops => {
                try {
                    listener(summarize(ops), ops.map(o => ({ ...o })));
                } catch {
                    /* idem */
                }
            });
            return () => {
                listeners.delete(listener);
            };
        },
    };
};

/** Armazenamento em memória — testes. */
export const createMemoryOutboxStorage = (initial: OutboxOp[] = []): OutboxStorage & { data: OutboxOp[] } => {
    const holder = { data: JSON.parse(JSON.stringify(initial)) as OutboxOp[] };
    return {
        get data() {
            return holder.data;
        },
        async load() {
            return JSON.parse(JSON.stringify(holder.data));
        },
        async save(ops) {
            holder.data = JSON.parse(JSON.stringify(ops));
        },
    };
};
