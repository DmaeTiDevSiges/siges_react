import React, { useState, useEffect } from 'react';
import { AssetLoanChecklistType, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Loading } from '../../../../components/ui/Loading';
import { toast } from 'sonner';

interface AssetLoanChecklistTypeFormProps {
    item?: AssetLoanChecklistType;
    assetTypeId?: string;
    onSave: () => void;
    onCancel: () => void;
}

export const AssetLoanChecklistTypeForm: React.FC<AssetLoanChecklistTypeFormProps> = ({
    item,
    assetTypeId,
    onSave,
    onCancel,
}) => {
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        assetTypeId: assetTypeId || '',
        itemDescription: '',
        sortOrder: '0',
    });

    useEffect(() => {
        loadAssetTypes();
    }, []);

    useEffect(() => {
        if (item) {
            setFormData({
                assetTypeId: item.assetTypeId,
                itemDescription: item.itemDescription,
                sortOrder: item.sortOrder.toString(),
            });
        }
    }, [item]);

    const loadAssetTypes = async () => {
        try {
            const data = await dataService.getAssetTypes();
            setAssetTypes(data);
        } catch (error) {
            console.error('Error loading asset types:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.assetTypeId || !formData.itemDescription.trim()) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            setIsSaving(true);

            if (item) {
                await dataService.updateChecklistType(item.id, {
                    itemDescription: formData.itemDescription.trim(),
                    sortOrder: parseInt(formData.sortOrder) || 0,
                });
                toast.success('Item atualizado com sucesso');
            } else {
                await dataService.createChecklistType({
                    assetTypeId: formData.assetTypeId,
                    itemDescription: formData.itemDescription.trim(),
                    sortOrder: parseInt(formData.sortOrder) || 0,
                });
                toast.success('Item criado com sucesso');
            }

            onSave();
        } catch (error) {
            console.error('Error saving checklist type:', error);
            toast.error('Erro ao salvar item');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="md" />
            </div>
        );
    }

    const assetTypeOptions = assetTypes.map(type => ({
        value: type.id,
        label: type.description || type.code,
    }));

    return (
        <div className="space-y-6">
            <Select
                label="Tipo de Ativo *"
                value={formData.assetTypeId}
                onChange={(e) => handleInputChange('assetTypeId', e.target.value)}
                options={assetTypeOptions}
                placeholder="Selecione o tipo de ativo"
                disabled={!!item || !!assetTypeId}
            />

            <Input
                label="Descrição do Item *"
                value={formData.itemDescription}
                onChange={(e) => handleInputChange('itemDescription', e.target.value)}
                placeholder="Ex: Estado geral do equipamento"
            />

            <Input
                label="Ordem"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                placeholder="0"
            />

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.assetTypeId || !formData.itemDescription.trim()}
                    className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <Loading size="sm" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">save</span>
                            {item ? 'Atualizar' : 'Criar'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
