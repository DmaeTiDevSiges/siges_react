import React, { useState, useEffect, useRef } from 'react';
import { AssetLoan, Asset } from '../../types';
import { dataService } from '../../services/dataService';
import { AssetLoanStatusBadge } from './AssetLoanStatusBadge';
import { AssetLoanChecklistForm, ChecklistItemState } from './AssetLoanChecklistForm';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { SignaturePad } from '../ui/SignaturePad';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { AssetLoanReportPDFButton } from '../reports/AssetLoanReportPDFButton';
import { usePermissions } from '../../contexts/PermissionsContext';
import { toast } from 'sonner';

interface AssetLoanDetailsProps {
    loan: AssetLoan;
    onClose: () => void;
    onStatusChange: () => void;
}

export const AssetLoanDetails: React.FC<AssetLoanDetailsProps> = ({
    loan: initialLoan,
    onClose,
    onStatusChange,
}) => {
    const [loan, setLoan] = useState<AssetLoan>(initialLoan);
    const [asset, setAsset] = useState<Asset | null>(null);
    const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
    const [isLoading, setIsLoading] = useState(true);
    const [isActivating, setIsActivating] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [checklistSaved, setChecklistSaved] = useState(false);
    const [afterChecklistComplete, setAfterChecklistComplete] = useState(false);
    const [signingType, setSigningType] = useState<'delivery' | 'return' | null>(null);
    const [isSavingSignature, setIsSavingSignature] = useState(false);
    const [deletingSignatureType, setDeletingSignatureType] = useState<'delivery' | 'return' | null>(null);
    const [signerName, setSignerName] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [beforeItems, setBeforeItems] = useState<ChecklistItemState[] | null>(null);
    const [afterItems, setAfterItems] = useState<ChecklistItemState[] | null>(null);
    const { canCreate } = usePermissions();

    useEffect(() => {
        loadAsset();
        loadCurrentUser();
        loadBothChecklists();
    }, [loan.assetId, loan.id]);

    const loadCurrentUser = async () => {
        try {
            const user = await dataService.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
        }
    };

    const loadChecklistForPhase = async (phase: 'before' | 'after'): Promise<ChecklistItemState[]> => {
        const checklists = await dataService.getAssetLoanChecklists(loan.id, phase);
        if (checklists.length === 0) return [];
        return Promise.all(
            checklists.map(async (checklist) => {
                const images = await dataService.getAssetLoanChecklistImages(checklist.id);
                return {
                    checklistTypeId: checklist.checklistTypeId,
                    checklistDbId: parseInt(checklist.id),
                    customItemDescription: checklist.customItemDescription,
                    itemDescription: checklist.itemDescription,
                    status: checklist.status,
                    notes: checklist.notes || '',
                    images,
                    pendingImageFiles: [],
                    isCustom: !checklist.checklistTypeId,
                    isDivergent: checklist.isDivergent,
                };
            })
        );
    };

    const loadBothChecklists = async () => {
        const [before, after] = await Promise.all([
            loadChecklistForPhase('before'),
            loadChecklistForPhase('after'),
        ]);
        setBeforeItems(before);
        setAfterItems(after);
    };

    useEffect(() => {
        if (loan.status === 'analysis') {
            checkChecklistComplete();
        }
    }, [loan.id, loan.status]);

    const checkChecklistComplete = async () => {
        try {
            const complete = await dataService.isAssetLoanChecklistComplete(loan.id, 'before');
            setChecklistSaved(complete);
        } catch {
            setChecklistSaved(false);
        }
    };

    const loadAsset = async () => {
        try {
            setIsLoading(true);
            const assetData = await dataService.getAssetById(loan.assetId);
            setAsset(assetData);
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async () => {
        const checklistComplete = await dataService.isAssetLoanChecklistComplete(loan.id, 'before');
        
        if (!checklistComplete) {
            toast.error('O checklist "antes" deve ser preenchido para ativar o empréstimo');
            return;
        }

        if (!loan.signatureDeliveryPath) {
            toast.error('A assinatura do solicitante é obrigatória para confirmar a entrega');
            return;
        }

        try {
            setIsActivating(true);
            await dataService.activateAssetLoan(loan.id, currentUser.id);
            const updatedLoan = await dataService.getAssetLoanById(loan.id);
            setLoan(updatedLoan);
            onStatusChange();
            toast.success('Empréstimo ativado com sucesso!');
        } catch (error) {
            toast.error('Erro ao ativar empréstimo');
        } finally {
            setIsActivating(false);
        }
    };

    const handleReturn = async () => {
        if (!loan.signatureReturnPath) {
            toast.error('A assinatura do solicitante é obrigatória para confirmar a devolução');
            return;
        }

        try {
            setIsReturning(true);
            await dataService.returnAssetLoan(loan.id, currentUser.id);
            const updatedLoan = await dataService.getAssetLoanById(loan.id);
            setLoan(updatedLoan);
            onStatusChange();
            toast.success('Empréstimo devolvido com sucesso!');
        } catch (error) {
            toast.error('Erro ao devolver empréstimo');
        } finally {
            setIsReturning(false);
        }
    };

    const handleChecklistSave = async () => {
        setChecklistSaved(true);
        await loadBothChecklists();
        toast.success('Checklist salvo com sucesso!');
    };

    const handleSaveSignature = async (base64: string) => {
        if (!signingType) return;
        if (!signerName.trim()) {
            toast.error('O nome de quem assina é obrigatório.');
            return;
        }

        try {
            setIsSavingSignature(true);
            await dataService.saveAssetLoanSignature(loan.id, signingType, base64, signerName);
            
            const updatedLoan = await dataService.getAssetLoanById(loan.id);
            setLoan(updatedLoan);
            
            setSigningType(null);
            setSignerName('');
            toast.success('Assinatura salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar assinatura');
        } finally {
            setIsSavingSignature(false);
        }
    };

    const handleDeleteSignature = async (type: 'delivery' | 'return') => {
        setDeletingSignatureType(type);
    };

    const confirmDeleteSignature = async () => {
        if (!deletingSignatureType) return;

        try {
            await dataService.deleteAssetLoanSignature(loan.id, deletingSignatureType);
            
            const updatedLoan = await dataService.getAssetLoanById(loan.id);
            setLoan(updatedLoan);
            
            toast.success('Assinatura removida com sucesso!');
        } catch (error) {
            toast.error('Erro ao remover assinatura');
        } finally {
            setDeletingSignatureType(null);
        }
    };

    const getSignatureUrl = (path?: string, name?: string): string | null => {
        if (!path || !name) return null;
        return dataService.getSignatureUrl(path, name);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="md" />
            </div>
        );
    }

    const status = loan.computedStatus || loan.status;
    const isPending = loan.status === 'analysis';
    const isActive = loan.status === 'pending';
    const isReturned = loan.status === 'closed';

    const hasDeliverySignature = !!loan.signatureDeliveryPath && !!loan.signatureDeliveryName;
    const hasReturnSignature = !!loan.signatureReturnPath && !!loan.signatureReturnName;

    const canDeleteImages =
        (activeTab === 'before' && isPending) ||
        (activeTab === 'after' && isActive);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {loan.borrowerName}
                        </h3>
                        <p className="text-xs text-slate-500">Solicitante</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(isActive || isReturned) && (
                        <AssetLoanReportPDFButton
                            loan={loan}
                            asset={asset}
                            beforeItems={beforeItems ?? []}
                            afterItems={afterItems ?? []}
                        />
                    )}
                    <AssetLoanStatusBadge status={status} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Entrega</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {formatDate(loan.createdAt)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Prevista</span>
                    <p className={`text-xs font-bold mt-1 ${status === 'overdue' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                        {formatDate(loan.expectedReturnDate)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Devolução</span>
                    <p className={`text-xs font-bold mt-1 ${loan.actualReturnDate ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                        {loan.actualReturnDate ? formatDate(loan.actualReturnDate) : '—'}
                    </p>
                </div>
            </div>

            {isReturned && (loan.itemsChecklistsDivergentCount ?? 0) > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/40 rounded-xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">difference</span>
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">Divergências no Checklists</span>
                            <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                                {loan.itemsChecklistsDivergentCount} {loan.itemsChecklistsDivergentCount === 1 ? 'item divergiu' : 'itens divergiram'}
                            </p>
                            <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5">
                                entre as avaliações antes e depois
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {loan.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{loan.notes}</p>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('before')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-colors ${
                        activeTab === 'before'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                    Checklist Antes
                </button>
                <button
                    onClick={() => setActiveTab('after')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                        activeTab === 'after'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                    Checklist Depois
                    {(loan.itemsChecklistsDivergentCount ?? 0) > 0 && (
                        <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {loan.itemsChecklistsDivergentCount}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'before' && (
                <button
                    onClick={() => setActiveTab('after')}
                    className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <span className="material-symbols-outlined text-blue-600 text-lg">person</span>
                    <div className="text-left flex-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Vistoriador da Entrega</span>
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-200">{loan.inspectorDeliveryName || 'Aguardando...'}</p>
                    </div>
                    <span className="material-symbols-outlined text-blue-400 text-lg">arrow_forward</span>
                </button>
            )}

            {activeTab === 'after' && (
                <button
                    onClick={() => setActiveTab('before')}
                    className="w-full bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                    <span className="material-symbols-outlined text-green-600 text-lg">person</span>
                    <div className="text-left flex-1">
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Vistoriador da Devolução</span>
                        <p className="text-xs font-bold text-green-800 dark:text-green-200">{loan.inspectorReturnName || 'Aguardando...'}</p>
                    </div>
                    <span className="material-symbols-outlined text-green-400 text-lg">arrow_back</span>
                </button>
            )}

            {asset && (
                <AssetLoanChecklistForm
                    loanId={loan.id}
                    phase={activeTab}
                    assetTypeId={asset.typeId || ''}
                    readonly={isReturned || (activeTab === 'before' && isActive)}
                    canDeleteImages={canDeleteImages}
                    hideSaveButton={(activeTab === 'before' && hasDeliverySignature) || (activeTab === 'after' && hasReturnSignature)}
                    canSave={canCreate('assets_loans_create_update_delete')}
                    userId={currentUser?.id}
                    items={activeTab === 'before' ? beforeItems ?? undefined : afterItems ?? undefined}
                    onSave={handleChecklistSave}
                    onCompleteChange={activeTab === 'after' ? setAfterChecklistComplete : undefined}
                />
            )}

            {/* Signature Section - Delivery */}
            {activeTab === 'before' && (isPending || hasDeliverySignature) && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Assinatura (Entrega)
                        </h4>
                        {hasDeliverySignature && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                Assinado
                            </span>
                        )}
                    </div>
                    
                    {hasDeliverySignature ? (
                        <div className="space-y-3">
                            {loan.signatureDeliverySignerName && (
                                <p className="text-xs font-bold text-slate-900 dark:text-white text-center">
                                    {loan.signatureDeliverySignerName}
                                </p>
                            )}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                                <img 
                                    src={getSignatureUrl(loan.signatureDeliveryPath, loan.signatureDeliveryName) || ''} 
                                    alt="Assinatura Entrega" 
                                    className="max-h-24 mx-auto dark:invert"
                                />
                            </div>
                            {loan.signatureDeliveryAt && (
                                <p className="text-[10px] text-slate-400 text-center">
                                    Assinado em {formatDateTime(loan.signatureDeliveryAt)}
                                </p>
                            )}
                            {isPending && (
                                <button
                                    onClick={() => handleDeleteSignature('delivery')}
                                    className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    Remover Assinatura
                                </button>
                            )}
                        </div>
                    ) : (
                        canCreate('assets_loans_create_update_delete') && (
                        <button
                            onClick={() => { setSignerName(loan.borrowerName || ''); setSigningType('delivery'); }}
                            className="w-full py-3 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">draw</span>
                            Adicionar Assinatura
                        </button>
                        )
                    )}
                </div>
            )}

            {/* Signature Section - Return */}
            {activeTab === 'after' && (isActive || isReturned || hasReturnSignature) && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Assinatura (Devolução)
                        </h4>
                        {hasReturnSignature && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                Assinado
                            </span>
                        )}
                    </div>
                    
                    {hasReturnSignature ? (
                        <div className="space-y-3">
                            {loan.signatureReturnSignerName && (
                                <p className="text-xs font-bold text-slate-900 dark:text-white text-center">
                                    {loan.signatureReturnSignerName}
                                </p>
                            )}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                                <img 
                                    src={getSignatureUrl(loan.signatureReturnPath, loan.signatureReturnName) || ''} 
                                    alt="Assinatura Devolução" 
                                    className="max-h-24 mx-auto dark:invert"
                                />
                            </div>
                            {loan.signatureReturnAt && (
                                <p className="text-[10px] text-slate-400 text-center">
                                    Assinado em {formatDateTime(loan.signatureReturnAt)}
                                </p>
                            )}
                            {isActive && (
                                <button
                                    onClick={() => handleDeleteSignature('return')}
                                    className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    Remover Assinatura
                                </button>
                            )}
                        </div>
                    ) : (
                        canCreate('assets_loans_create_update_delete') && (
                        <button
                            onClick={() => { setSignerName(''); setSigningType('return'); }}
                            className="w-full py-3 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">draw</span>
                            Adicionar Assinatura
                        </button>
                        )
                    )}
                </div>
            )}

            <div className="flex gap-3 pt-4">
                {isPending && canCreate('assets_loans_create_update_delete') && (
                    <button
                        onClick={handleActivate}
                        disabled={isActivating || !checklistSaved || !loan.signatureDeliveryPath}
                        className={`flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                            checklistSaved && loan.signatureDeliveryPath
                                ? 'animate-pulse shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                                : ''
                        }`}
                    >
                        {isActivating ? (
                            <Loading size="sm" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Confirmar Entrega
                            </>
                        )}
                    </button>
                )}
                
                {isActive && activeTab === 'after' && canCreate('assets_loans_create_update_delete') && (
                    <button
                        onClick={handleReturn}
                        disabled={isReturning || !afterChecklistComplete || !loan.signatureReturnPath}
                        className={`flex-1 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                            afterChecklistComplete && loan.signatureReturnPath
                                ? 'animate-pulse shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
                                : ''
                        }`}
                    >
                        {isReturning ? (
                            <Loading size="sm" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">assignment_return</span>
                                Confirmar Devolução
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Signature Modal */}
            <Modal
                isOpen={!!signingType}
                onClose={() => { setSigningType(null); setSignerName(''); }}
                title={signingType === 'delivery' ? 'Assinatura - Entrega' : 'Assinatura - Devolução'}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Nome de quem assina
                        </label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="Digite o nome de quem está assinando"
                            required
                            className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <SignaturePad
                        onSave={handleSaveSignature}
                        title={signingType === 'delivery' ? 'Assine para confirmar a entrega' : 'Assine para confirmar a devolução'}
                    />
                    {isSavingSignature && (
                        <div className="flex justify-center py-4">
                            <Loading size="sm" />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Signature Confirmation Modal */}
            <Modal
                isOpen={!!deletingSignatureType}
                onClose={() => setDeletingSignatureType(null)}
                onConfirm={confirmDeleteSignature}
                title="Remover Assinatura"
                message={`Tem certeza que deseja remover a assinatura de ${deletingSignatureType === 'delivery' ? 'entrega' : 'devolução'}?`}
                confirmLabel="Remover"
                type="warning"
            />
        </div>
    );
};
