import React, { useState } from 'react';
import { OrderPlan } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface OrderPlanFormProps {
    initialOrderPlan?: Partial<OrderPlan>;
    onSave: (orderPlan: Partial<OrderPlan>) => Promise<void> | void;
    onCancel: () => void;
}

export const OrderPlanForm: React.FC<OrderPlanFormProps> = ({
    initialOrderPlan,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialOrderPlan?.description || '',
        code: initialOrderPlan?.code || '',
        isAvailable: initialOrderPlan?.isAvailable ?? true
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialOrderPlan?.id } as Partial<OrderPlan>);
        } catch (error) {
            console.error("Error saving plan", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto">
                <Input
                    label="Descrição"
                    placeholder="Ex: Preventiva Mensal"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: PREV-M"
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
