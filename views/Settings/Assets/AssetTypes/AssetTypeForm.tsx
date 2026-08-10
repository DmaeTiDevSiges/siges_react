import React, { useState } from 'react';
import { AssetType } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface AssetTypeFormProps {
    initialAssetType?: Partial<AssetType>;
    onSave: (assetType: Partial<AssetType>) => Promise<void> | void;
    onCancel: () => void;
}

export const AssetTypeForm: React.FC<AssetTypeFormProps> = ({
    initialAssetType,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialAssetType?.description || '',
        code: initialAssetType?.code || '',
        isAvailable: initialAssetType?.isAvailable ?? true,
        namingPattern: initialAssetType?.namingPattern || ''
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialAssetType?.id } as Partial<AssetType>);
        } catch (error) {
            console.error("Error saving asset type", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto">
                <Input
                    label="Descrição"
                    placeholder="Ex: Transformador"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: TR-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Select
                    label="Situação"
                    value={form.isAvailable ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'active' })}
                >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </Select>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <Input
                            label="Padrão de Nomeação"
                            placeholder="Ex: {type} {brand} {model}"
                            value={form.namingPattern}
                            onChange={(e) => setForm({ ...form, namingPattern: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                            Variáveis: {"{type}, {brand}, {model}, {code}, {serial}"} ou {"{field_key_do_atributo}"}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
                            <strong>Dica:</strong> Use as chaves entre as variáveis para definir a ordem e o texto (espaços, traços, etc).
                            Atributos dinâmicos incluirão o valor e a unidade automaticamente.
                        </p>
                    </div>
                </div>
            </form>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-background-dark flex gap-3">
                <Button variant="ghost" fullWidth onClick={onCancel} disabled={isSaving}>
                    Cancelar
                </Button>
                <Button variant="primary" fullWidth onClick={() => handleSubmit()} loading={isSaving}>
                    Salvar
                </Button>
            </div>
        </div>
    );
};
