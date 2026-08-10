import React, { useState } from 'react';
import { Priority } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface PriorityFormProps {
    initialPriority?: Partial<Priority>;
    onSave: (priority: Partial<Priority>) => Promise<void> | void;
    onCancel: () => void;
}

export const PriorityForm: React.FC<PriorityFormProps> = ({
    initialPriority,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialPriority?.description || '',
        code: initialPriority?.code || '',
        isAvailable: initialPriority?.isAvailable ?? true
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialPriority?.id } as Partial<Priority>);
        } catch (error) {
            console.error("Error saving priority", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                <Input
                    label="Descrição"
                    placeholder="Ex: Alta"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: P1"
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
