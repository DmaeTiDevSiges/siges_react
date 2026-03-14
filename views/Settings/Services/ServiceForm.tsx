import React, { useState } from 'react';
import { Service } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';

interface ServiceFormProps {
    initialService?: Partial<Service>;
    onSave: (service: Partial<Service>) => Promise<void> | void;
    onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
    initialService,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        description: initialService?.description || '',
        code: initialService?.code || '',
        unit: initialService?.unit || '',
        isAvailable: initialService?.isAvailable ?? true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsSaving(true);
            // Artificial delay for premium effect visibility
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSave({ ...form, id: initialService?.id } as Partial<Service>);
        } catch (error) {
            console.error("Error saving service", error);
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
                <Input
                    label="Descrição"
                    placeholder="Ex: Consultoria Técnica"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: SERV-CON"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Input
                    label="Unidade"
                    placeholder="Ex: HORA, M2, UNID"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
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
