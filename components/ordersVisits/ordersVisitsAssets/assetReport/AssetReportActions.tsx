/**
 * Botões do relatório do ativo.
 *
 * mode:
 *  - 'primary'   ações que avançam o fluxo (Reportar, Rejeitar/Revisar/Aprovar, Confirmar)
 *  - 'secondary' saídas e ações raras (Manter rascunho, Trocar ativo, Remover)
 *  - 'all'       as duas (painel lateral no desktop)
 * As regras de quando cada botão aparece ficam na tela (flags abaixo).
 */
import React from 'react';

export interface AssetReportActionFlags {
    /** Rascunho, Revisado ou Rejeitado. */
    showReport: boolean;
    /** Reportado com a visita ainda em rascunho: volta o ativo para rascunho. */
    showRevertDraft: boolean;
    /** Reportado/Revisado ou em modo de revisão/aprovação. */
    showReview: boolean;
    showSwap: boolean;
    showRemove: boolean;
    canDisapprove: boolean;
    canReview: boolean;
    canApprove: boolean;
}

interface Props extends AssetReportActionFlags {
    mode: 'primary' | 'secondary' | 'all';
    localEditMode: 'review' | 'approval' | null;
    isUpdatingStatus: boolean;
    uploadingCount: number;
    onReport: () => void;
    onKeepDraft: () => void;
    onRevertDraft: () => void;
    onReject: () => void;
    onStartReview: () => void;
    onStartApproval: () => void;
    onCancelEdit: () => void;
    onConfirmEdit: () => void;
    onSwap: () => void;
    onRemove: () => void;
}

const base = 'w-full min-h-[48px] py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed';
const neutral = `${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`;

export const AssetReportActions: React.FC<Props> = (p) => {
    const showPrimary = p.mode !== 'secondary';
    const showSecondary = p.mode !== 'primary';
    const uploadingLabel = `Enviando ${p.uploadingCount} ${p.uploadingCount === 1 ? 'foto' : 'fotos'}...`;

    const primary: React.ReactNode[] = [];
    const secondary: React.ReactNode[] = [];

    if (p.showReport) {
        primary.push(
            <button
                key="report"
                type="button"
                disabled={p.uploadingCount > 0 || p.isUpdatingStatus}
                onClick={p.onReport}
                className={`${base} bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20`}
            >
                {p.isUpdatingStatus ? 'Processando...' : p.uploadingCount > 0 ? uploadingLabel : 'Reportar Relatório do Ativo'}
            </button>
        );
        secondary.push(
            <button key="keep-draft" type="button" onClick={p.onKeepDraft} className={neutral}>
                Manter como Rascunho
            </button>
        );
    }

    if (p.showRevertDraft) {
        secondary.push(
            <button key="revert-draft" type="button" disabled={p.isUpdatingStatus} onClick={p.onRevertDraft} className={neutral}>
                {p.isUpdatingStatus ? 'Processando...' : 'Manter como Rascunho'}
            </button>
        );
    }

    if (p.showReview) {
        if (!p.localEditMode) {
            const reviewRow = (p.canDisapprove || p.canReview) && (
                <div key="review-row" className="grid grid-cols-2 gap-3">
                    {p.canDisapprove && (
                        <button
                            type="button"
                            onClick={p.onReject}
                            className={`${base} bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ${!p.canReview ? 'col-span-2' : ''}`}
                        >
                            Rejeitar
                        </button>
                    )}
                    {p.canReview && (
                        <button
                            type="button"
                            onClick={p.onStartReview}
                            className={`${base} bg-amber-500/10 text-black dark:text-amber-500 border border-amber-500/20 ${!p.canDisapprove ? 'col-span-2' : ''}`}
                        >
                            Revisar
                        </button>
                    )}
                </div>
            );
            if (reviewRow) primary.push(reviewRow);
            if (p.canApprove) {
                primary.push(
                    <button key="approve" type="button" onClick={p.onStartApproval} className={`${base} bg-emerald-500 text-white shadow-lg shadow-emerald-500/20`}>
                        Aprovar
                    </button>
                );
            }
        } else {
            const isReview = p.localEditMode === 'review';
            primary.push(
                <div key="confirm-row" className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={p.onCancelEdit} className={`${base} bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20`}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={p.isUpdatingStatus || p.uploadingCount > 0}
                        onClick={p.onConfirmEdit}
                        className={`${base} shadow-lg ${isReview ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}
                    >
                        {p.isUpdatingStatus
                            ? (isReview ? 'Revisando...' : 'Aprovando...')
                            : p.uploadingCount > 0
                                ? uploadingLabel
                                : isReview ? 'Confirmar Revisão' : 'Confirmar Aprovação'}
                    </button>
                </div>
            );
        }
    }

    if (p.showSwap) {
        secondary.push(
            <button
                key="swap"
                type="button"
                onClick={p.onSwap}
                className={`${base} bg-amber-50 dark:bg-amber-500/10 text-black dark:text-amber-500 border border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20`}
            >
                Trocar Ativo (Ativo Errado)
            </button>
        );
    }

    if (p.showRemove) {
        secondary.push(
            <button
                key="remove"
                type="button"
                onClick={p.onRemove}
                className={`${base} bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20`}
            >
                Remover Ativo da Visita
            </button>
        );
    }

    // Confirmando revisão/aprovação: só Cancelar/Confirmar ficam visíveis.
    if (p.localEditMode && p.showReview) {
        const confirmRow = primary.find(el => React.isValidElement(el) && el.key === 'confirm-row');
        return showPrimary && confirmRow ? <div className="flex flex-col gap-3">{confirmRow}</div> : null;
    }

    const items = [...(showPrimary ? primary : []), ...(showSecondary ? secondary : [])];
    if (items.length === 0) return null;

    return <div className="flex flex-col gap-3">{items}</div>;
};

/** Há algum botão primário para mostrar (decide se a barra fixa do celular aparece)? */
export const hasPrimaryReportAction = (f: AssetReportActionFlags, localEditMode: 'review' | 'approval' | null) =>
    f.showReport || (f.showReview && (!!localEditMode || f.canDisapprove || f.canReview || f.canApprove));
