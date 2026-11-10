import type { Outbox, OutboxOp } from './outbox';

/**
 * Motor de sincronização (F2) — envia a fila em ordem quando há internet.
 *
 * Regras:
 *   - uma rodada por vez; ordem = ordem em que o técnico fez (seq);
 *   - só envia operações do usuário da sessão atual (outro login espera);
 *   - antes da 1ª operação de cada ativo, confere a trava (checkLock):
 *     perdeu a trava (gestor liberou / outro pegou) → todas as operações
 *     daquele ativo viram CONFLITO, nada é sobrescrito;
 *   - falha de rede → para a rodada, mantém pendente, tenta de novo depois;
 *   - outro erro → marca ERRO e segue com as demais; as operações seguintes
 *     do MESMO registro (entityKey) esperam — enviar depois e reenviar o erro
 *     em "Tentar de novo" voltaria o valor antigo.
 *
 * Núcleo sem Capacitor/Supabase — tudo entra por `deps` (testável no Jest).
 */

export type LockCheck = 'ok' | 'conflict';
export type ErrorKind = 'network' | 'error' | 'conflict';

export interface SyncDeps {
    outbox: Outbox;
    isOnline: () => boolean;
    /** auth.uid da sessão atual (null = sem sessão → não envia). */
    sessionUserUuid: () => Promise<string | null>;
    /** Renova o token antes de enviar (getSession). Lança se não der. */
    ensureSession?: () => Promise<void>;
    execute: (op: OutboxOp) => Promise<void>;
    checkLock: (ovaId: string) => Promise<LockCheck>;
    failureCount: () => number;
    classifyError: (error: unknown, networkFailed: boolean) => ErrorKind;
    /** Registro que a operação altera (ex.: "updateMaterialInAsset:12"). */
    entityKey?: (op: OutboxOp) => string;
    /**
     * F4 — barreira: a operação só vai depois de TODAS as anteriores do mesmo
     * ativo ('ova', ex.: Relatar ativo) ou da mesma visita ('visit', ex.:
     * Relatar visita, Encerrar). Se alguma anterior ficou (erro, conflito,
     * outro usuário, esperando), esta espera também.
     */
    barrier?: (op: OutboxOp) => 'ova' | 'visit' | undefined;
    /**
     * Ativo criado sem internet ("tmp:<uuid>"): não confere trava (ainda não
     * existe no servidor) e as operações dele esperam a inclusão chegar.
     */
    isTemporaryId?: (id: string) => boolean;
    now?: () => number;
}

export interface SyncResult {
    sent: number;
    errors: number;
    conflicts: number;
    /** Parou por falta de rede (ainda há pendentes). */
    stoppedByNetwork: boolean;
    skippedOtherUser: number;
    /** Ficaram esperando porque uma anterior do mesmo registro falhou. */
    heldBack: number;
}

const errorMessage = (e: unknown): string => {
    const msg = (e as any)?.message || String(e ?? 'Erro desconhecido');
    return String(msg).slice(0, 300);
};

export const runSync = async (deps: SyncDeps): Promise<SyncResult> => {
    const result: SyncResult = { sent: 0, errors: 0, conflicts: 0, stoppedByNetwork: false, skippedOtherUser: 0, heldBack: 0 };
    const keyOf = (op: OutboxOp) => deps.entityKey?.(op) ?? `${op.method}:${JSON.stringify(op.args?.[0] ?? null)}`;
    const now = deps.now ?? Date.now;

    if (!deps.isOnline()) return { ...result, stoppedByNetwork: true };

    const all = await deps.outbox.list();
    const pending = all.filter(o => o.status === 'pending');
    if (!pending.length) return result;
    // Registros com erro/conflito ainda na fila: as pendentes seguintes esperam.
    const blocked = new Set(all.filter(o => o.status !== 'pending').map(keyOf));
    // F4: ativos/visitas com operação que não chegou ao servidor (barreiras).
    const unsentScopes = new Set<string>();
    const markUnsent = (op: OutboxOp) => {
        if (op.ovaId) unsentScopes.add(`ova:${op.ovaId}`);
        if (op.visitId) unsentScopes.add(`visit:${op.visitId}`);
    };
    all.filter(o => o.status !== 'pending').forEach(markUnsent);

    try {
        await deps.ensureSession?.();
    } catch {
        return { ...result, stoppedByNetwork: true };
    }
    const uid = await deps.sessionUserUuid();
    if (!uid) return { ...result, stoppedByNetwork: true };

    const lockState = new Map<string, LockCheck>();

    for (const op of pending) {
        if (!deps.isOnline()) {
            result.stoppedByNetwork = true;
            break;
        }
        if (op.userUuid && op.userUuid !== uid) {
            result.skippedOtherUser++;
            markUnsent(op);
            continue;
        }
        if (blocked.has(keyOf(op))) {
            result.heldBack++;
            markUnsent(op);
            continue;
        }
        const barrier = deps.barrier?.(op);
        const barrierScope =
            barrier === 'ova' && op.ovaId ? `ova:${op.ovaId}` : barrier === 'visit' && op.visitId ? `visit:${op.visitId}` : null;
        if (barrierScope && unsentScopes.has(barrierScope)) {
            result.heldBack++;
            markUnsent(op);
            continue;
        }

        // Visita iniciada offline (etapa 3): se o "Iniciar" (ou algo dela) não chegou, espera.
        const tmpVisit = !!op.visitId && !!deps.isTemporaryId?.(op.visitId);
        if (tmpVisit && unsentScopes.has(`visit:${op.visitId}`)) {
            result.heldBack++;
            markUnsent(op);
            blocked.add(keyOf(op));
            continue;
        }

        // Ativo criado offline: se a inclusão (ou algo dele) não chegou, espera.
        const tmpOva = !!op.ovaId && !!deps.isTemporaryId?.(op.ovaId);
        if (tmpOva && unsentScopes.has(`ova:${op.ovaId}`)) {
            result.heldBack++;
            markUnsent(op);
            blocked.add(keyOf(op)); // as seguintes do mesmo registro esperam junto
            continue;
        }

        // Trava do ativo — uma checagem por ativo por rodada.
        if (op.ovaId && !tmpOva) {
            let state = lockState.get(op.ovaId);
            if (!state) {
                const before = deps.failureCount();
                try {
                    state = await deps.checkLock(op.ovaId);
                } catch (e) {
                    if (deps.failureCount() !== before || !deps.isOnline()) {
                        result.stoppedByNetwork = true;
                        break;
                    }
                    state = 'ok'; // não conseguiu checar por outro motivo: não bloqueia
                }
                lockState.set(op.ovaId, state);
            }
            if (state === 'conflict') {
                await deps.outbox.update(op.id, {
                    status: 'conflict',
                    lastError: 'O ativo foi liberado ou está com outro técnico. Esta alteração não foi enviada.',
                    lastAttemptAt: now(),
                });
                result.conflicts++;
                blocked.add(keyOf(op));
                markUnsent(op);
                continue;
            }
        }

        const before = deps.failureCount();
        try {
            await deps.execute(op);
            if (deps.failureCount() !== before) {
                // O serviço "engoliu" a falha de rede: não dá para saber se
                // gravou. Operações do grupo B são idempotentes → reenviar.
                throw new Error('Falha de rede durante o envio');
            }
            await deps.outbox.remove(op.id);
            result.sent++;
        } catch (e) {
            const networkFailed = deps.failureCount() !== before || !deps.isOnline();
            const kind = deps.classifyError(e, networkFailed);
            if (kind === 'network') {
                await deps.outbox.update(op.id, { attempts: op.attempts + 1, lastAttemptAt: now() });
                result.stoppedByNetwork = true;
                break;
            }
            await deps.outbox.update(op.id, {
                status: kind === 'conflict' ? 'conflict' : 'error',
                attempts: op.attempts + 1,
                lastError: errorMessage(e),
                lastAttemptAt: now(),
            });
            if (kind === 'conflict') result.conflicts++;
            else result.errors++;
            blocked.add(keyOf(op));
            markUnsent(op);
        }
    }

    return result;
};

/** Troca um valor (ex.: id temporário) em strings, listas e objetos simples. */
export const replaceDeep = (value: unknown, from: string, to: string): unknown => {
    if (value === from) return to;
    if (Array.isArray(value)) return value.map(v => replaceDeep(v, from, to));
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) out[k] = replaceDeep(v, from, to);
        return out;
    }
    return value;
};

/** Espera entre tentativas após falha de rede: 5 s, 10 s, 20 s… até 5 min. */
export const backoffMs = (failedRounds: number): number =>
    Math.min(5_000 * Math.pow(2, Math.max(0, failedRounds - 1)), 5 * 60_000);
