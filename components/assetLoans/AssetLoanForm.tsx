import React, { useState, useEffect } from 'react';
import { Asset } from '../../types';
import { dataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AssetLoanChecklistForm } from './AssetLoanChecklistForm';
import { Loading } from '../ui/Loading';
import { toast } from 'sonner';

interface AssetLoanFormProps {
    assetId: string;
    assetName: string;
    onSave: () => void;
    onCancel: () => void;
}

export const AssetLoanForm: React.FC<AssetLoanFormProps> = ({
    assetId,
    assetName,
    onSave,
    onCancel,
}) => {
    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState<'form' | 'checklist'>('form');
    const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        borrowerName: '',
        expectedReturnDate: '',
        notes: '',
    });

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

    const handleCreateLoan = async () => {
        if (!formData.borrowerName || !formData.expectedReturnDate) {
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
            const newLoan = await dataService.createAssetLoan(
                {
                    assetId,
                    borrowerName: formData.borrowerName,
                    lenderUserId: currentUser.id,
                    expectedReturnDate: formData.expectedReturnDate,
                    notes: formData.notes,
                },
                currentUser.id
            );
            setCreatedLoanId(newLoan.id);
            setCurrentStep('checklist');
        } catch (error) {
            toast.error('Erro ao criar empréstimo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChecklistSave = () => {
        toast.success('Empréstimo criado com sucesso!');
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
                    <Input
                        label="Nome do Solicitante *"
                        value={formData.borrowerName}
                        onChange={(e) => handleInputChange('borrowerName', e.target.value)}
                        placeholder="Digite o nome do solicitante"
                    />

                    <Input
                        label="Data Prevista de Devolução *"
                        type="date"
                        value={formData.expectedReturnDate}
                        onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                    />

                    <Textarea
                        label="Observações"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Observações sobre o empréstimo (opcional)"
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
                            onClick={handleCreateLoan}
                            disabled={isSaving || !formData.borrowerName || !formData.expectedReturnDate}
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
                                    Empréstimo criado com sucesso!
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                    Agora preencha o checklist antes de Confirmar a entrega
                                </p>
                            </div>
                        </div>

                        <AssetLoanChecklistForm
                            loanId={createdLoanId}
                            phase="before"
                            assetTypeId={asset.typeId || ''}
                            onSave={handleChecklistSave}
                        />
                    </div>
                )
            )}
        </div>
    );
};
