import React, { useState } from 'react';
import { OrderObject } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface OrderObjectFormProps {
    initialOrderObject?: Partial<OrderObject>;
    onSave: (orderObject: Partial<OrderObject>) => Promise<void> | void;
    onCancel: () => void;
}

export const OrderObjectForm: React.FC<OrderObjectFormProps> = ({
    initialOrderObject,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialOrderObject?.description || '',
        code: initialOrderObject?.code || '',
        isAvailable: initialOrderObject?.isAvailable ?? true
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialOrderObject?.id } as Partial<OrderObject>);
        } catch (error) {
            console.error("Error saving object", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                <Input
                    label="Descrição"
                    placeholder="Ex: Ar Condicionado"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: AC"
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
