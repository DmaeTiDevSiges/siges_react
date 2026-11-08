import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { OrderVisit, OrderVisitAssetView, OrderVisitAssetsLocks, OrderVisitTeam } from '../../types';
import { dataService } from '../../services/dataService';
import { isOfflineSupported } from '../../services/offline/offlineConfig';
import {
    getFieldPackage,
    prepareFieldPackage,
    type FieldPackage,
} from '../../services/offline/fieldPackageService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import {
    discardOfflineConflicts,
    discardOfflineErrors,
    retryOfflineErrors,
    syncNow,
} from '../../services/offline/offlineSync';
import { formatDateInBrazil } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';

/**
 * Modo campo na tela da visita (F1 1.5/1.7, F2).
 *   online  → "Preparar para campo" / "Atualizar pacote" (escolhe os ativos a travar)
 *             + fila: aguardando envio / erros / recusadas, com as ações
 *   offline → aviso: usando o pacote de <data>  |  visita não preparada
 * Só aparece com o modo offline disponível, para quem é da equipe e com a
 * visita ainda editável (rascunho ou rejeitada, não arquivada).
 */
interface FieldPackageCardProps {
    visit: OrderVisit;
    team: OrderVisitTeam[];
    currentUserId?: string;
}

const EDITABLE_PROCESSING = [1, 4];

export const FieldPackageCard: React.FC<FieldPackageCardProps> = ({ visit, team, currentUserId }) => {
    const { isConnected } = useNetworkStatus();
    const sync = useOfflineSync();
    const [pkg, setPkg] = useState<FieldPackage | null>(null);
    const [pkgLoaded, setPkgLoaded] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [assets, setAssets] = useState<OrderVisitAssetView[]>([]);
    const [locks, setLocks] = useState<OrderVisitAssetsLocks>({ supported: true, locks: {} });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loadingPicker, setLoadingPicker] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

    const visitId = String(visit.id);
    const isTeamMember = !!currentUserId && team.some(m => String(m.userId) === String(currentUserId));
    const isEditableVisit = EDITABLE_PROCESSING.includes(Number(visit.ovProcessingId || 1)) && !visit.isFiled;
    const enabled = isOfflineSupported() && isTeamMember && isEditableVisit;

    const reloadPackage = useCallback(async () => {
        setPkg(await getFieldPackage(visitId));
        setPkgLoaded(true);
    }, [visitId]);

    useEffect(() => {
        if (enabled) reloadPackage();
    }, [enabled, reloadPackage]);

    const openPicker = async () => {
        setShowPicker(true);
        setLoadingPicker(true);
        try {
            const [list, lockInfo] = await Promise.all([
                dataService.getOrderVisitAssets(visitId),
                dataService.getOrderVisitAssetsLocks(visitId),
            ]);
            setAssets(list || []);
            setLocks(lockInfo);
            // Padrão: os já travados por mim + os livres e editáveis.
            const initial = new Set<string>();
            for (const a of list || []) {
                const id = String(a.id);
                const lock = lockInfo.locks[id];
                const editable = EDITABLE_PROCESSING.includes(Number(a.processingId || 1));
                if (!editable) continue;
                if (!lock || lock.userId === String(currentUserId)) initial.add(id);
            }
            setSelected(initial);
        } catch (e: any) {
            toast.error(e?.message || 'Erro ao carregar os ativos da visita');
            setShowPicker(false);
        } finally {
            setLoadingPicker(false);
        }
    };

    const handlePrepare = async () => {
        if (!currentUserId) return;
        setPreparing(true);
        setProgress({ done: 0, total: 0 });
        try {
            const mine = Object.entries(locks.locks)
                .filter(([, l]) => l.userId === String(currentUserId))
                .map(([id]) => id);
            const releaseOvaIds = mine.filter(id => !selected.has(id));
            const { pkg: newPkg, lockedByOthers } = await prepareFieldPackage({
                visitId,
                userId: String(currentUserId),
                lockOvaIds: Array.from(selected),
                releaseOvaIds,
                onProgress: (done, total) => setProgress({ done, total }),
            });
            setPkg(newPkg);
            setShowPicker(false);

            if (newPkg.failedReads > 0) {
                toast.warning(`Pacote salvo, mas ${newPkg.failedReads} item(ns) não baixaram. Toque em "Atualizar pacote" com sinal melhor.`);
            } else {
                toast.success(
                    newPkg.lockSupported
                        ? `Visita pronta para campo · ${newPkg.lockedOvaIds.length} ativo(s) reservado(s) para você.`
                        : 'Visita pronta para campo.',
                );
            }
            if (lockedByOthers.length) {
                const names = Array.from(new Set(lockedByOthers.map(l => l.userName).filter(Boolean))).join(', ');
                toast.warning(`${lockedByOthers.length} ativo(s) já estão com outro técnico${names ? ` (${names})` : ''}.`);
            }
        } catch (e: any) {
            toast.error(e?.message || 'Erro ao preparar a visita para campo');
        } finally {
            setPreparing(false);
        }
    };

    const toggle = (id: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const preparedLabel = useMemo(
        () => (pkg ? formatDateInBrazil(pkg.preparedAt, 'dateTime', 'pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''),
        [pkg],
    );

    const handleDiscard = async (kind: 'error' | 'conflict') => {
        const label = kind === 'error' ? 'com erro' : 'recusadas';
        if (!window.confirm(`Descartar as alterações ${label}? Elas não serão enviadas ao servidor.`)) return;
        const n = kind === 'error' ? await discardOfflineErrors() : await discardOfflineConflicts();
        toast.success(`${n} alteração(ões) descartada(s).`);
    };

    const { pending, errors, conflicts } = sync.summary;
    const queuePanel = (pending > 0 || errors > 0 || conflicts > 0) && isConnected ? (
        <Card className="px-4 py-3 space-y-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-lg text-xs">
            {pending > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                        <span className={`material-symbols-outlined text-base ${sync.syncing ? 'animate-spin' : ''}`}>
                            {sync.syncing ? 'sync' : 'cloud_upload'}
                        </span>
                        {sync.syncing ? 'Enviando' : 'Aguardando envio'}: {pending}
                    </span>
                    {!sync.syncing && (
                        <button onClick={() => syncNow().catch(() => undefined)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-black uppercase text-[11px]">
                            Enviar agora
                        </button>
                    )}
                </div>
            )}
            {errors > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
                        <span className="material-symbols-outlined text-base">error</span>
                        Não enviadas (erro): {errors}
                    </span>
                    <span className="flex gap-2">
                        <button onClick={() => retryOfflineErrors()} className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-black uppercase text-[11px]">
                            Tentar de novo
                        </button>
                        <button onClick={() => handleDiscard('error')} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-black uppercase text-[11px]">
                            Descartar
                        </button>
                    </span>
                </div>
            )}
            {conflicts > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                        <span className="material-symbols-outlined text-base">lock_reset</span>
                        Recusadas (ativo liberado/com outro técnico): {conflicts}
                    </span>
                    <button onClick={() => handleDiscard('conflict')} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-black uppercase text-[11px]">
                        Descartar
                    </button>
                </div>
            )}
        </Card>
    ) : null;

    if (!enabled || !pkgLoaded) return queuePanel;

    // ── Offline ─────────────────────────────────────────────────────────────
    if (!isConnected) {
        return pkg ? (
            <Card className="px-4 py-3 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">cloud_off</span>
                <div className="text-xs">
                    <p className="font-black text-amber-800 dark:text-amber-300">Sem internet · modo campo</p>
                    <p className="text-amber-700 dark:text-amber-400/80 mt-0.5">
                        Dados do pacote de {preparedLabel}. As alterações ficam salvas no aparelho e são enviadas quando a internet voltar.
                        {sync.summary.pending > 0 && ` ${sync.summary.pending} aguardando envio.`}
                    </p>
                </div>
            </Card>
        ) : (
            <Card className="px-4 py-3 flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">cloud_off</span>
                <div className="text-xs">
                    <p className="font-black text-red-800 dark:text-red-300">Sem internet · visita não preparada</p>
                    <p className="text-red-700 dark:text-red-400/80 mt-0.5">
                        Só aparece o que já foi aberto antes. Da próxima vez, toque em "Preparar para campo" com internet.
                    </p>
                </div>
            </Card>
        );
    }

    // ── Online ──────────────────────────────────────────────────────────────
    return (
        <>
            {queuePanel}
            <Card className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined ${pkg ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {pkg ? 'offline_pin' : 'download_for_offline'}
                    </span>
                    <div className="text-xs min-w-0">
                        <p className="font-black text-slate-800 dark:text-white">Modo campo</p>
                        <p className="text-slate-500 dark:text-slate-400 truncate">
                            {pkg
                                ? `Pacote de ${preparedLabel}${pkg.lockSupported ? ` · ${pkg.lockedOvaIds.length} ativo(s) seu(s)` : ''}`
                                : 'Baixe a visita para usar sem internet'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openPicker}
                    disabled={preparing}
                    className="shrink-0 px-3 py-2 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wide disabled:opacity-50"
                >
                    {pkg ? 'Atualizar' : 'Preparar'}
                </button>
            </Card>

            <Modal
                isOpen={showPicker}
                onClose={() => !preparing && setShowPicker(false)}
                onConfirm={handlePrepare}
                title="Preparar para campo"
                confirmLabel={`Preparar (${selected.size})`}
                confirmLoading={preparing}
                confirmLoadingLabel={progress.total ? `Baixando ${progress.done}/${progress.total}` : 'Reservando ativos…'}
                loading={loadingPicker}
                maxWidth="md"
            >
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {locks.supported
                            ? 'Marque os ativos que você vai preencher. Eles ficam reservados para você até relatar — outro técnico só consulta.'
                            : 'A visita inteira será baixada para consulta sem internet.'}
                    </p>
                    {locks.supported && (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5 max-h-[50vh] overflow-y-auto">
                            {assets.map(a => {
                                const id = String(a.id);
                                const lock = locks.locks[id];
                                const byOther = !!lock && lock.userId !== String(currentUserId);
                                const editable = EDITABLE_PROCESSING.includes(Number(a.processingId || 1));
                                const disabled = byOther || !editable || preparing;
                                return (
                                    <li key={id}>
                                        <label className={`flex items-center gap-3 py-2.5 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-indigo-600"
                                                checked={selected.has(id)}
                                                disabled={disabled}
                                                onChange={() => toggle(id)}
                                            />
                                            <span className="min-w-0 text-xs">
                                                <span className="block font-bold text-slate-800 dark:text-white truncate">
                                                    {a.code ? `${a.code} · ` : ''}{a.description || `Ativo ${id}`}
                                                </span>
                                                <span className="block text-slate-500 dark:text-slate-400">
                                                    {byOther
                                                        ? `Com ${lock.userName || 'outro técnico'}`
                                                        : !editable
                                                            ? 'Já relatado — só consulta'
                                                            : lock
                                                                ? 'Reservado para você'
                                                                : 'Livre'}
                                                </span>
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                            {!assets.length && !loadingPicker && (
                                <li className="py-3 text-xs text-slate-500">Nenhum ativo nesta visita ainda.</li>
                            )}
                        </ul>
                    )}
                </div>
            </Modal>
        </>
    );
};
