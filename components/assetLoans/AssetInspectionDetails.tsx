import React, { useState, useEffect, useCallback } from 'react';
import { AssetLoan, Asset, User } from '../../types';
import { dataService } from '../../services/dataService';
import { AssetLoanStatusBadge } from './AssetLoanStatusBadge';
import { AssetLoanChecklistForm, ChecklistItemState } from './AssetLoanChecklistForm';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { SignaturePad } from '../ui/SignaturePad';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { AssetLoanReportPDFButton } from '../reports/AssetLoanReportPDFButton';
import { usePermissions } from '../../contexts/PermissionsContext';
import { getRecordTypeConfig } from './assetLoanRecordTypes';
import { toast } from 'sonner';

/**
 * Vistoria única de Recebimento / Cedência (assets_loans.record_type = receipt | cedencia).
 *
 * Fluxo: analysis → closed (sem devolução). Para concluir:
 *   - todos os itens preenchidos;
 *   - ao menos uma foto em cada item danificado;
 *   - assinatura do vistoriador (o usuário logado).
 * O banco revalida tudo em fn_assets_loans_conclude_inspection. Depois de concluído,
 * o registro não pode ser alterado nem cancelado.
 */
interface AssetInspectionDetailsProps {
    loan: AssetLoan;
    onStatusChange: () => void;
}

export const AssetInspectionDetails: React.FC<AssetInspectionDetailsProps> = ({
    loan: initialLoan,
    onStatusChange,
}) => {
    const [loan, setLoan] = useState<AssetLoan>(initialLoan);
    const [asset, setAsset] = useState<Asset | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [items, setItems] = useState<ChecklistItemState[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const [isSavingSignature, setIsSavingSignature] = useState(false);
    const [confirmDeleteSignature, setConfirmDeleteSignature] = useState(false);
    const [isConcluding, setIsConcluding] = useState(false);
    const { canCreate } = usePermissions();

    const typeConfig = getRecordTypeConfig(loan.recordType);
    const isClosed = loan.status === 'closed';
    const canEdit = !isClosed && canCreate('assets_loans');
    const hasSignature = !!loan.signatureDeliveryPath && !!loan.signatureDeliveryName;

    const loadItems = useCallback(async () => {
        const checklists = await dataService.getAssetLoanChecklists(loan.id, 'single');
        const loaded = await Promise.all(checklists.map(async (checklist) => ({
            checklistTypeId: checklist.checklistTypeId,
            checklistDbId: parseInt(checklist.id),
            customItemDescription: checklist.customItemDescription,
            itemDescription: checklist.itemDescription,
            status: checklist.status,
            notes: checklist.notes || '',
            images: await dataService.getAssetLoanChecklistImages(checklist.id),
            pendingImageFiles: [],
            isCustom: !checklist.checklistTypeId,
        })));
        setItems(loaded);
    }, [loan.id]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setIsLoading(true);
                const [assetData, user] = await Promise.all([
                    dataService.getAssetById(loan.assetId),
                    dataService.getCurrentUser(),
                ]);
                if (!active) return;
                setAsset(assetData);
                setCurrentUser(user);
                await loadItems();
            } catch {
                if (active) toast.error('Erro ao carregar a vistoria');
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => { active = false; };
    }, [loan.assetId, loadItems]);

    const refreshLoan = async () => {
        const updated = await dataService.getAssetLoanById(loan.id);
        setLoan(updated);
        return updated;
    };

    // Pendências calculadas do que já está SALVO (items recarregados após salvar).
    const savedItems = items ?? [];
    const pendingCount = savedItems.filter(i => i.status === 'pending').length;
    const damagedWithoutPhoto = savedItems.filter(i => i.status === 'damaged' && i.images.length === 0).length;
    const checklistReady = savedItems.length > 0 && pendingCount === 0 && damagedWithoutPhoto === 0;

    const signerName = currentUser?.nameFull || currentUser?.nameShort || '';

    const handleSaveSignature = async (base64: string) => {
        if (!signerName) {
            toast.error('Usuário não identificado.');
            return;
        }
        try {
            setIsSavingSignature(true);
            await dataService.saveAssetLoanSignature(loan.id, 'delivery', base64, signerName);
            await refreshLoan();
            setIsSigning(false);
            toast.success('Assinatura salva!');
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao salvar assinatura');
        } finally {
            setIsSavingSignature(false);
        }
    };

    const handleDeleteSignature = async () => {
        try {
            await dataService.deleteAssetLoanSignature(loan.id, 'delivery');
            await refreshLoan();
            toast.success('Assinatura removida');
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao remover assinatura');
        } finally {
            setConfirmDeleteSignature(false);
        }
    };

    const handleConclude = async () => {
        if (pendingCount > 0) {
            toast.error(`Preencha e salve todos os itens do checklist (${pendingCount} pendente(s)).`);
            return;
        }
        if (damagedWithoutPhoto > 0) {
            toast.error(`Todo item danificado precisa de ao menos uma foto (${damagedWithoutPhoto} sem foto).`);
            return;
        }
        if (!hasSignature) {
            toast.error('Assine a vistoria antes de concluir.');
            return;
        }
        try {
            setIsConcluding(true);
            await dataService.concludeAssetInspection(loan.id);
            await refreshLoan();
            onStatusChange();
            toast.success(`${typeConfig.label} concluído!`);
        } catch (error: any) {
            // O banco devolve o motivo exato (itens, fotos, assinatura).
            toast.error(error?.message || 'Erro ao concluir a vistoria');
        } finally {
            setIsConcluding(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="md" />
            </div>
        );
    }

    const signatureUrl = hasSignature
        ? dataService.getSignatureUrl(loan.signatureDeliveryPath!, loan.signatureDeliveryName!)
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
                        <span className="material-symbols-outlined text-sm">{typeConfig.icon}</span>
                        {typeConfig.label}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {loan.borrowerName}
                    </h3>
                    <p className="text-xs text-slate-500">{typeConfig.personLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isClosed && (
                        <AssetLoanReportPDFButton
                            loan={loan}
                            asset={asset}
                            beforeItems={savedItems}
                            afterItems={[]}
                        />
                    )}
                    <AssetLoanStatusBadge status={loan.status} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrado em</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{formatDate(loan.createdAt)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vistoriador</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {loan.inspectorDeliveryName || loan.signatureDeliverySignerName || (isClosed ? '—' : 'Aguardando conclusão')}
                    </p>
                </div>
            </div>

            {loan.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{loan.notes}</p>
                </div>
            )}

            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Checklist da Vistoria</h4>

            {asset && (
                <AssetLoanChecklistForm
                    loanId={loan.id}
                    phase="single"
                    assetTypeId={asset.typeId || ''}
                    readonly={!canEdit}
                    canDeleteImages={canEdit}
                    hideSaveButton={hasSignature}
                    canSave={canEdit}
                    userId={currentUser?.id}
                    items={items ?? undefined}
                    onSave={loadItems}
                />
            )}

            {/* Assinatura do vistoriador (usuário logado) */}
            {(canEdit || hasSignature) && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Assinatura do Vistoriador
                        </h4>
                        {hasSignature && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                Assinado
                            </span>
                        )}
                    </div>

                    {hasSignature ? (
                        <div className="space-y-3">
                            {loan.signatureDeliverySignerName && (
                                <p className="text-xs font-bold text-slate-900 dark:text-white text-center">
                                    {loan.signatureDeliverySignerName}
                                </p>
                            )}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                                <img src={signatureUrl || ''} alt="Assinatura do vistoriador" className="max-h-24 mx-auto dark:invert" />
                            </div>
                            {loan.signatureDeliveryAt && (
                                <p className="text-[10px] text-slate-400 text-center">
                                    Assinado em {formatDateTime(loan.signatureDeliveryAt)}
                                </p>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => setConfirmDeleteSignature(true)}
                                    className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    Remover Assinatura
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                {checklistReady
                                    ? `Assinatura de ${signerName || 'usuário logado'}.`
                                    : 'Salve o checklist completo (com foto nos itens danificados) antes de assinar.'}
                            </p>
                            <button
                                onClick={() => setIsSigning(true)}
                                disabled={!checklistReady}
                                className="w-full py-3 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-lg">draw</span>
                                Assinar Vistoria
                            </button>
                        </>
                    )}
                </div>
            )}

            {canEdit && (
                <button
                    onClick={handleConclude}
                    disabled={isConcluding || !checklistReady || !hasSignature}
                    className={`w-full py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${checklistReady && hasSignature ? 'shadow-lg shadow-green-500/30' : ''}`}
                >
                    {isConcluding ? (
                        <Loading size="sm" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">task_alt</span>
                            Concluir {typeConfig.label}
                        </>
                    )}
                </button>
            )}

            {isClosed && (
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    Vistoria concluída. O registro não pode ser alterado nem cancelado.
                </p>
            )}

            <Modal
                isOpen={isSigning}
                onClose={() => setIsSigning(false)}
                title={`Assinatura - ${typeConfig.label}`}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Assinando como <strong className="text-slate-900 dark:text-white">{signerName}</strong>
                    </p>
                    <SignaturePad onSave={handleSaveSignature} title="Assine para confirmar a vistoria" />
                    {isSavingSignature && (
                        <div className="flex justify-center py-4">
                            <Loading size="sm" />
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={confirmDeleteSignature}
                onClose={() => setConfirmDeleteSignature(false)}
                onConfirm={handleDeleteSignature}
                title="Remover Assinatura"
                message="Tem certeza que deseja remover a assinatura do vistoriador?"
                confirmLabel="Remover"
                type="warning"
            />
        </div>
    );
};
