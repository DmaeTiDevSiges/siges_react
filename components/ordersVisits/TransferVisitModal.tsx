import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Loading } from '../ui/Loading';
import { dataService } from '../../services/dataService';
import { Order } from '../../types';

interface TransferVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitId: string;
    sourceMask?: string;
    targetOrder: Order;
    confirming?: boolean;
    onConfirm: () => Promise<void>;
}

interface Preview {
    assetsAmount: number;
    servicesAmount: number;
    targetHasOpenVisit: boolean;
    visitMask?: string;
    startedAt?: string | null;
    sourceOrderId?: string;
}

export const TransferVisitModal: React.FC<TransferVisitModalProps> = ({
    isOpen,
    onClose,
    visitId,
    sourceMask,
    targetOrder,
    confirming = false,
    onConfirm
}) => {
    const [preview, setPreview] = useState<Preview | null>(null);
    const [loading, setLoading] = useState(false);
    const [sourceOrder, setSourceOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setPreview(null);
            setSourceOrder(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        dataService.getReassignPreview(visitId, targetOrder.id)
            .then(p => { if (!cancelled) setPreview(p); })
            .catch(() => { if (!cancelled) setPreview({ assetsAmount: 0, servicesAmount: 0, targetHasOpenVisit: false }); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, visitId, targetOrder.id]);

    useEffect(() => {
        const sourceId = preview?.sourceOrderId;
        if (!sourceId || !isOpen) return;
        let cancelled = false;
        dataService.getOrderById(sourceId)
            .then(order => { if (!cancelled) setSourceOrder(order); })
            .catch(() => { if (!cancelled) setSourceOrder(null); });
        return () => { cancelled = true; };
    }, [preview?.sourceOrderId, isOpen]);

    const blockedReason: string | null = preview
        ? (preview.assetsAmount > 0
            ? 'A visita possui ativos registrados e não pode ser transferida.'
            : preview.servicesAmount > 0
                ? 'A visita possui serviços registrados e não pode ser transferida.'
                : preview.targetHasOpenVisit
                    ? 'A OS de destino já possui uma visita em andamento.'
                    : null)
        : null;

    const canConfirm = !loading && !confirming && !blockedReason;

    console.log('[Transfer] preview', { loading, confirming, blockedReason, preview });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => { if (canConfirm) void onConfirm(); }}
            title="Transferir Visita"
            type="warning"
            maxWidth="sm"
            confirmLabel={
                loading ? 'Verificando…'
                    : blockedReason ? 'Transferência bloqueada'
                        : 'Confirmar'
            }
            confirmLoading={confirming}
            confirmLoadingLabel="TRANSFERINDO..."
        >
            <div className="flex flex-col gap-1 pb-2">
                <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                    {sourceOrder?.clientName && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">{sourceOrder.clientName}</p>
                    )}
                    <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight mb-0.5">
                        {sourceOrder?.unitDescription || sourceOrder?.typeDescription || '—'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">
                        {sourceOrder?.unitAssetTagDescription
                            ? `${sourceOrder.unitAssetTagDescription}${sourceOrder.unitAssetTagSubDescription ? ` / ${sourceOrder.unitAssetTagSubDescription}` : ''}`
                            : sourceOrder?.typeDescription || ''}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight whitespace-pre-line">
                        {sourceOrder ? (sourceOrder.requestedServices || 'Sem serviços solicitados') : 'Carregando OS…'}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visita em andamento</span>
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{preview?.visitMask || sourceMask || '—'}</span>
                    </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <span className="material-symbols-outlined text-lg text-amber-500 mt-0.5">history</span>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                        As informações de tempo, equipe e transporte serão mantidas.
                    </p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        <Loading size="xs" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verificando…</span>
                    </div>
                )}

                {!loading && blockedReason && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                        <span className="material-symbols-outlined text-lg text-red-500 mt-0.5">block</span>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 leading-relaxed">
                            {blockedReason}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
