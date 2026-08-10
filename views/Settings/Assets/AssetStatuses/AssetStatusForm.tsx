import React, { useState } from 'react';
import { AssetStatus } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface AssetStatusFormProps {
    initialAssetStatus?: Partial<AssetStatus>;
    onSave: (assetStatus: Partial<AssetStatus>) => Promise<void> | void;
    onCancel: () => void;
}

export const AssetStatusForm: React.FC<AssetStatusFormProps> = ({
    initialAssetStatus,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialAssetStatus?.description || '',
        code: initialAssetStatus?.code || '',
        color: initialAssetStatus?.color || '#3b82f6',
        isAvailable: initialAssetStatus?.isAvailable ?? true
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialAssetStatus?.id } as Partial<AssetStatus>);
        } catch (error) {
            console.error("Error saving asset status", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto">
                <Input
                    label="Descrição"
                    placeholder="Ex: Em Operação"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: OP"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                        Cor de Identificação
                    </label>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] p-3">
                        <input
                            type="color"
                            value={form.color}
                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                            className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
                        />
                        <div className="flex-1">
                            <input
                                type="text"
                                value={form.color.toUpperCase()}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                className="w-full bg-transparent border-none text-sm font-mono focus:ring-0 text-slate-700 dark:text-slate-300 uppercase"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                </div>

                <Select
                    label="Situação"
                    value={form.isAvailable ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'active' })}
                >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </Select>
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
