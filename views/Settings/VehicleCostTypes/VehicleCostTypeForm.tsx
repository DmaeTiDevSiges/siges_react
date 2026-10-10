import React, { useState } from 'react';
import { VehicleCostType } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';

export interface VehicleCostTypeFormInput {
    id?: string;
    code: string;
    description: string;
    color?: string;
    isAvailable?: boolean;
}

interface VehicleCostTypeFormProps {
    initial?: VehicleCostType | null;
    onSave: (input: VehicleCostTypeFormInput) => Promise<void>;
    onCancel: () => void;
}

export const VehicleCostTypeForm: React.FC<VehicleCostTypeFormProps> = ({
    initial,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<VehicleCostTypeFormInput>({
        id: initial?.id,
        code: initial?.code || '',
        description: initial?.description || '',
        color: initial?.color || '#64748b',
        isAvailable: initial?.isAvailable ?? true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        if (!form.code.trim() || !form.description.trim()) return;

        try {
            setIsSaving(true);
            await onSave({
                ...form,
                code: form.code.trim(),
                description: form.description.trim()
            });
        } catch (error) {
            console.error('Error saving vehicle cost type', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            {isSaving && (
                <div className="h-1 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <div className="p-4 space-y-5">
                <Input
                    label="Descrição"
                    placeholder="Ex: Combustível"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: FUEL"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                />

                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <Input
                            label="Cor"
                            placeholder="#64748b"
                            value={form.color || ''}
                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                        />
                    </div>
                    <input
                        type="color"
                        aria-label="Selecionar cor"
                        value={form.color || '#64748b'}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="h-12 w-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                    />
                </div>

                <Select
                    label="Situação"
                    value={form.isAvailable ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'active' })}
                >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </Select>
            </div>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </form>
    );
};
