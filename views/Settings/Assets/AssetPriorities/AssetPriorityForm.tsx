import React, { useState } from 'react';
import { AssetPriority } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface AssetPriorityFormProps {
    initialAssetPriority?: Partial<AssetPriority>;
    onSave: (assetPriority: Partial<AssetPriority>) => Promise<void> | void;
    onCancel: () => void;
}

export const AssetPriorityForm: React.FC<AssetPriorityFormProps> = ({
    initialAssetPriority,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialAssetPriority?.description || '',
        code: initialAssetPriority?.code || '',
        color: initialAssetPriority?.color || '#3b82f6',
        isAvailable: initialAssetPriority?.isAvailable ?? true
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialAssetPriority?.id } as Partial<AssetPriority>);
        } catch (error) {
            console.error("Error saving asset priority", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto">
                <Input
                    label="Descrição"
                    placeholder="Ex: Crítica"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: CHI"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Cor
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#ec4899', '#64748b'].map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setForm({ ...form, color })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <input
                            type="color"
                            value={form.color}
                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                            className="w-8 h-8 rounded-full overflow-hidden border-0 p-0"
                        />
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
