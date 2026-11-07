import React, { useState, useEffect } from 'react';
import { Asset, AssetLoanRecordType } from '../../types';
import { dataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AssetLoanChecklistForm } from './AssetLoanChecklistForm';
import { Loading } from '../ui/Loading';
import { toast } from 'sonner';
import { RECORD_TYPES, getRecordTypeConfig } from './assetLoanRecordTypes';

interface AssetLoanFormProps {
    assetId: string;
    assetName: string;
    onSave: () => void;
    onCancel: () => void;
}

export const AssetLoanForm: React.FC<AssetLoanFormProps> = ({
    assetId,
    onSave,
    onCancel,
}) => {
    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState<'form' | 'checklist'>('form');
    const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
    const [recordType, setRecordType] = useState<AssetLoanRecordType>('loan');
    const [userId, setUserId] = useState<string | undefined>(undefined);

    const [formData, setFormData] = useState({
        borrowerName: '',
        expectedReturnDate: '',
        notes: '',
    });

    const typeConfig = getRecordTypeConfig(recordType);
    const isLoan = recordType === 'loan';
    const canSubmit = !!formData.borrowerName.trim() && (!isLoan || !!formData.expectedReturnDate);

    useEffect(() => {
        loadData();
    }, [assetId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const assetData = await dataService.getAssetById(assetId);
            setAsset(assetData);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        if (!canSubmit) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            setIsSaving(true);
            const currentUser = await dataService.getCurrentUser();
            if (!currentUser?.id) {
                toast.error('Usuário não identificado');
                return;
            }
            const newLoan = await dataService.createAssetLoan({
                assetId,
                recordType,
                borrowerName: formData.borrowerName.trim(),
                lenderUserId: currentUser.id,
                expectedReturnDate: isLoan ? formData.expectedReturnDate : undefined,
                notes: formData.notes,
            });
            setUserId(currentUser.id);
            setCreatedLoanId(newLoan.id);
            setCurrentStep('checklist');
        } catch (error: any) {
            // Mensagens do banco (ex.: tipo de ativo sem checklist, registro em aberto).
            toast.error(error?.message || `Erro ao criar ${typeConfig.label.toLowerCase()}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChecklistSave = () => {
        toast.success(isLoan
            ? 'Empréstimo criado com sucesso!'
            : `${typeConfig.label} criado. Assine e conclua a vistoria nos detalhes do registro.`);
        onSave();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="md" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {currentStep === 'form' ? (
                <>
                    {/* Tipo do registro */}
                    <div>
                        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                            Tipo de registro *
                        </span>
                        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de registro">
                            {RECORD_TYPES.map((type) => {
                                const cfg = getRecordTypeConfig(type);
                                const active = type === recordType;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setRecordType(type)}
                                        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border text-xs font-bold transition-colors ${active
                                            ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/30'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            {isLoan
                                ? 'Vistoria na entrega e na devolução do ativo.'
                                : 'Vistoria única. Não registra devolução nem altera a localização do ativo.'}
                        </p>
                    </div>

                    <Input
                        label={`${typeConfig.personLabel} *`}
                        value={formData.borrowerName}
                        onChange={(e) => handleInputChange('borrowerName', e.target.value)}
                        placeholder={typeConfig.personPlaceholder}
                    />

                    {isLoan && (
                        <Input
                            label="Data Prevista de Devolução *"
                            type="date"
                            value={formData.expectedReturnDate}
                            onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                        />
                    )}

                    <Textarea
                        label="Observações"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Observações (opcional)"
                        rows={3}
                    />

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSaving || !canSubmit}
                            className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <Loading size="sm" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">save</span>
                                    Criar e Preencher Checklist
                                </>
                            )}
                        </button>
                    </div>
                </>
            ) : (
                createdLoanId && asset && (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-200">
                                    {typeConfig.label} criado com sucesso!
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                    {isLoan
                                        ? 'Agora preencha o checklist antes de confirmar a entrega'
                                        : 'Agora preencha o checklist da vistoria (foto obrigatória em item danificado)'}
                                </p>
                            </div>
                        </div>

                        <AssetLoanChecklistForm
                            loanId={createdLoanId}
                            phase={isLoan ? 'before' : 'single'}
                            assetTypeId={asset.typeId || ''}
                            userId={userId}
                            onSave={handleChecklistSave}
                        />
                    </div>
                )
            )}
        </div>
    );
};
