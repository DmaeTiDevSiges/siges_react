import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import type { OutboxOp } from '../../services/offline/outbox';
import {
    discardOfflineOp,
    getOutbox,
    retryOfflineErrors,
    retryOfflineOp,
    syncNow,
} from '../../services/offline/offlineSync';
import { dependentsOf, friendlyError, groupByVisit, opLabel, statusInfo } from '../../services/offline/pendingOps';
import { readCached } from '../../services/offline/readCache';
import { getOfflineStore } from '../../services/offline/offlineConfig';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { formatDateInBrazil } from '../../utils/formatters';

/**
 * Tela de pendências offline (F5, item 5.1).
 *
 * Painel em tela cheia, montado uma vez no App e aberto de qualquer lugar com
 * openPendingOpsPanel() (faixa do cabeçalho, cartão "Modo campo"). Lista o que
 * foi feito sem internet e ainda não chegou ao servidor, por visita:
 *   pendente → só informa;  erro → Tentar de novo / Descartar;
 *   recusada → Descartar (com o que depende dela).
 */

const OPEN_EVENT = 'siges:open-offline-pending';

export const openPendingOpsPanel = (): void => {
    window.dispatchEvent(new Event(OPEN_EVENT));
};

const toneClasses = {
    pending: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    conflict: 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
} as const;

const fmt = (ms?: number) =>
    ms ? formatDateInBrazil(ms, 'dateTime', 'pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

/** Rótulos de visita/ativo a partir do cache do aparelho (sem internet). */
const useLabels = (ops: OutboxOp[]) => {
    const [labels, setLabels] = useState<{ visits: Record<string, string>; assets: Record<string, string> }>({ visits: {}, assets: {} });
    const key = ops.map(o => `${o.visitId}|${o.ovaId}`).join(',');
    useEffect(() => {
        let alive = true;
        (async () => {
            const store = getOfflineStore();
            const visits: Record<string, string> = {};
            const assets: Record<string, string> = {};
            for (const id of new Set(ops.map(o => o.visitId).filter(Boolean) as string[])) {
                const v = (await readCached<any>(store, 'getActiveOrderVisit', [id]).catch(() => null))?.value;
                visits[id] = v?.ovMask ? `Visita ${v.ovMask}` : id.startsWith('tmp:') ? 'Visita nova (sem internet)' : `Visita ${id}`;
            }
            for (const id of new Set(ops.map(o => o.ovaId).filter(Boolean) as string[])) {
                const a = (await readCached<any>(store, 'getOrderVisitAssetById', [id]).catch(() => null))?.value;
                assets[id] = a ? [a.code, a.description].filter(Boolean).join(' · ') : id.startsWith('tmp:') ? 'Ativo incluído sem internet' : `Ativo ${id}`;
            }
            if (alive) setLabels({ visits, assets });
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return labels;
};

export const PendingOpsPanel: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [ops, setOps] = useState<OutboxOp[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const { summary, syncing } = useOfflineSync();
    const { isConnected } = useNetworkStatus();
    const labels = useLabels(ops);

    useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => window.removeEventListener(OPEN_EVENT, onOpen);
    }, []);

    // Lista viva da fila enquanto aberto.
    useEffect(() => {
        if (!open) return;
        const outbox = getOutbox();
        if (!outbox) return;
        return outbox.subscribe((_s, list) => setOps(list));
    }, [open]);

    // Botão "voltar" do Android fecha o painel (sem ele, o padrão sai do app).
    useEffect(() => {
        if (!open || !Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        CapApp.addListener('backButton', () => setOpen(false))
            .then(h => {
                remove = () => h.remove();
            })
            .catch(() => undefined);
        return () => remove?.();
    }, [open]);

    const groups = useMemo(() => groupByVisit(ops), [ops]);

    const handleRetry = useCallback(async (op: OutboxOp) => {
        setBusyId(op.id);
        try {
            await retryOfflineOp(op.id);
            toast.success('Enviando de novo…');
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleDiscard = useCallback(
        async (op: OutboxOp) => {
            const deps = dependentsOf(op, ops);
            const extra = deps.length
                ? `\n\nJunto saem ${deps.length} alteração(ões) que dependem dela (${Array.from(new Set(deps.map(d => opLabel(d.method)))).join(', ')}).`
                : '';
            const ok = window.confirm(
                `Descartar "${opLabel(op.method)}"? Ela NÃO será enviada ao servidor.${extra}\n\n` +
                    'A tela pode continuar mostrando a alteração até a próxima atualização com internet.',
            );
            if (!ok) return;
            setBusyId(op.id);
            try {
                const n = await discardOfflineOp(op.id);
                toast.success(`${n} alteração(ões) descartada(s).`);
            } finally {
                setBusyId(null);
            }
        },
        [ops],
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-light dark:bg-background-dark" role="dialog" aria-modal="true" aria-label="Pendências offline">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-card-dark">
                <button onClick={() => setOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Voltar">
                    <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">arrow_back</span>
                </button>
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Pendências offline</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {summary.total === 0
                            ? 'Nada pendente'
                            : [
                                  summary.pending && `${summary.pending} aguardando`,
                                  summary.errors && `${summary.errors} com erro`,
                                  summary.conflicts && `${summary.conflicts} recusada(s)`,
                              ]
                                  .filter(Boolean)
                                  .join(' · ')}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 px-4 py-3">
                <button
                    onClick={() => syncNow().catch(() => undefined)}
                    disabled={!isConnected || syncing || summary.pending === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase disabled:opacity-40"
                >
                    <span className={`material-symbols-outlined text-base ${syncing ? 'animate-spin [animation-direction:reverse]' : ''}`}>
                        {syncing ? 'sync' : 'cloud_upload'}
                    </span>
                    {!isConnected ? 'Sem internet' : syncing ? 'Enviando…' : 'Enviar agora'}
                </button>
                {summary.errors > 0 && (
                    <button
                        onClick={() => retryOfflineErrors()}
                        disabled={!isConnected}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase disabled:opacity-40"
                    >
                        Tentar de novo os com erro
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
                {ops.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
                        <span className="material-symbols-outlined text-5xl text-emerald-500 mb-2">cloud_done</span>
                        <p className="font-bold">Tudo enviado</p>
                        <p className="text-xs mt-1">Nenhuma alteração feita sem internet está esperando.</p>
                    </div>
                )}

                {groups.map(group => (
                    <section key={group.visitId ?? 'none'} className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden">
                        <h3 className="px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                            {group.visitId ? labels.visits[group.visitId] || 'Visita' : 'Outras alterações'}
                        </h3>
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {group.ops.map(op => {
                                const st = statusInfo(op.status);
                                const err = friendlyError(op);
                                return (
                                    <li key={op.id} className="px-4 py-3 text-xs">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 dark:text-white">{opLabel(op.method)}</p>
                                                {op.ovaId && (
                                                    <p className="text-slate-500 dark:text-slate-400 truncate">{labels.assets[op.ovaId] || 'Ativo'}</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {fmt(op.createdAt)}
                                                    {op.attempts > 0 && ` · ${op.attempts} tentativa(s)`}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${toneClasses[st.tone]}`}>{st.label}</span>
                                        </div>
                                        {err && <p className={`mt-1.5 rounded-lg px-2 py-1.5 ${toneClasses[st.tone]}`}>{err}</p>}
                                        {op.status !== 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                {op.status === 'error' && (
                                                    <button
                                                        onClick={() => handleRetry(op)}
                                                        disabled={busyId === op.id || !isConnected}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-black uppercase text-[10px] disabled:opacity-40"
                                                    >
                                                        Tentar de novo
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDiscard(op)}
                                                    disabled={busyId === op.id}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black uppercase text-[10px] disabled:opacity-40"
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
};
