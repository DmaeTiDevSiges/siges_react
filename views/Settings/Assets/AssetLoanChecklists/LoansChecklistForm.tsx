import React, { useState, useEffect } from 'react';
import { LoansChecklist, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { Input } from '../../../../components/ui/Input';
import { Loading } from '../../../../components/ui/Loading';
import { toast } from 'sonner';

interface LoansChecklistFormProps {
    item?: LoansChecklist;
    onSave: () => void;
    onCancel: () => void;
}

export const LoansChecklistForm: React.FC<LoansChecklistFormProps> = ({
    item,
    onSave,
    onCancel,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        sortOrder: '0',
    });

    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (item) {
            setFormData({
                description: item.description,
                sortOrder: item.sortOrder.toString(),
            });
            loadAssetTypesForItem(item.id);
        }
    }, [item]);

    const loadData = async () => {
        try {
            const types = await dataService.getAssetTypes();
            setAssetTypes(types);
        } catch (error) {
            console.error('Error loading asset types:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAssetTypesForItem = async (checklistId: string) => {
        try {
            const typeIds = await dataService.getLoansChecklistAssetTypes(checklistId);
            setSelectedAssetTypeIds(typeIds);
        } catch {
            setSelectedAssetTypeIds([]);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleAssetType = (typeId: string) => {
        setSelectedAssetTypeIds(prev =>
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };

    const handleSubmit = async () => {
        if (!formData.description.trim()) {
            toast.error('Preencha a descrição do item');
            return;
        }

        try {
            setIsSaving(true);

            let checklistId: string;

            if (item) {
                await dataService.updateLoansChecklist(item.id, {
                    description: formData.description.trim(),
                    sortOrder: parseInt(formData.sortOrder) || 0,
                });
                checklistId = item.id;
                toast.success('Item atualizado com sucesso');
            } else {
                const created = await dataService.createLoansChecklist({
                    description: formData.description.trim(),
                    sortOrder: parseInt(formData.sortOrder) || 0,
                });
                checklistId = created.id;
                toast.success('Item criado com sucesso');
            }

            // Save asset type associations
            await dataService.setLoansChecklistAssetTypes(checklistId, selectedAssetTypeIds);

            onSave();
        } catch (error) {
            console.error('Error saving checklist:', error);
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

    return (
        <div className="space-y-6">
            <Input
                label="Descrição do Item *"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Ex: Estado geral do equipamento"
            />

            <Input
                label="Ordem"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                placeholder="0"
            />

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Tipos de Ativo Associados
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                    {assetTypes.length === 0 ? (
                        <p className="text-xs text-slate-400">Nenhum tipo de ativo cadastrado</p>
                    ) : (
                        assetTypes.map((type) => (
                            <label
                                key={type.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedAssetTypeIds.includes(type.id)}
                                    onChange={() => toggleAssetType(type.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {type.description || type.code}
                                </span>
                            </label>
                        ))
                    )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                    Selecione os tipos de ativo que devem ter este item no checklist de empréstimo
                </p>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.description.trim()}
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
