import React, { useState, useEffect } from 'react';
import { OrderSubType, OrderType } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { ButtonSave } from '../../../../components/ui/ButtonSave';
import { dataService } from '../../../../services/dataService';
import { toast } from 'sonner';

interface OrderSubTypeFormProps {
    initialOrderSubType?: Partial<OrderSubType>;
    onSave: (orderSubType: Partial<OrderSubType>) => Promise<void> | void;
    onCancel: () => void;
}

export const OrderSubTypeForm: React.FC<OrderSubTypeFormProps> = ({
    initialOrderSubType,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [orderTypeOptions, setOrderTypeOptions] = useState<OrderType[]>([]);
    const [subTypeOptions, setSubTypeOptions] = useState<OrderSubType[]>([]);
    const [form, setForm] = useState({
        description: initialOrderSubType?.description || '',
        code: initialOrderSubType?.code || '',
        isAvailable: initialOrderSubType?.isAvailable ?? true,
        orderTypeId: initialOrderSubType?.orderTypeId || '',
        parentId: initialOrderSubType?.parentId || ''
    });

    useEffect(() => {
        const loadMainTypes = async () => {
            try {
                const data = await dataService.getOrderTypes('active');
                setOrderTypeOptions(data);
            } catch (error) {
                console.error("Error loading order types", error);
            }
        };
        loadMainTypes();
    }, []);

    useEffect(() => {
        const loadSubTypes = async () => {
            if (!form.orderTypeId) {
                setSubTypeOptions([]);
                return;
            }
            try {
                const data = await dataService.getOrderSubTypes();
                // Filter by selected main type and avoid circular reference
                const filtered = data.filter(item =>
                    item.orderTypeId === form.orderTypeId &&
                    item.id !== initialOrderSubType?.id
                );
                setSubTypeOptions(filtered);
            } catch (error) {
                console.error("Error loading sub types", error);
            }
        };
        loadSubTypes();
    }, [form.orderTypeId, initialOrderSubType?.id]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSaving) return;

        if (!form.orderTypeId) {
            toast.error("Selecione um Tipo de OS");
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                ...form,
                id: initialOrderSubType?.id,
                parentId: form.parentId || undefined
            } as Partial<OrderSubType>);
        } catch (error) {
            console.error("Error saving order sub type", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto pb-10">
                <Select
                    label="Tipo de OS Principal"
                    value={form.orderTypeId}
                    onChange={(e) => setForm({ ...form, orderTypeId: e.target.value, parentId: '' })}
                    required
                >
                    <option value="">Selecione...</option>
                    {orderTypeOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>
                            {opt.code} - {opt.description}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Sub-Tipo Pai (Opcional)"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    disabled={!form.orderTypeId}
                >
                    <option value="">Nenhum</option>
                    {subTypeOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>
                            {opt.code} - {opt.description}
                        </option>
                    ))}
                </Select>

                <Input
                    label="Descrição"
                    placeholder="Ex: Corretiva Urgente"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: CURG"
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

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </div>
    );
};
