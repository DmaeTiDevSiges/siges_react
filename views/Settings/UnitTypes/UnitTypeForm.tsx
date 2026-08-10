import React, { useState, useEffect } from 'react';
import { UnitType } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { dataService } from '../../../services/dataService';

interface UnitTypeFormProps {
    initialUnitType?: Partial<UnitType>;
    onSave: (unitType: Partial<UnitType>) => Promise<void> | void;
    onCancel: () => void;
}

export const UnitTypeForm: React.FC<UnitTypeFormProps> = ({
    initialUnitType,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
    const [form, setForm] = useState({
        description: initialUnitType?.description || '',
        code: initialUnitType?.code || '',
        isAvailable: initialUnitType?.isAvailable ?? true,
        parentId: initialUnitType?.parentId || ''
    });

    useEffect(() => {
        const loadUnitTypes = async () => {
            try {
                const data = await dataService.getUnitTypes();
                // Filter out current unit type if editing to prevent circular parent
                const filtered = initialUnitType?.id
                    ? data.filter(ut => ut.id !== initialUnitType.id)
                    : data;
                setUnitTypes(filtered);
            } catch (error) {
                console.error('Failed to load unit types', error);
            }
        };
        loadUnitTypes();
    }, [initialUnitType?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            const dataToSave = {
                ...form,
                parentId: form.parentId || null
            };
            await onSave(dataToSave as Partial<UnitType>);
        } catch (error) {
            console.error("Error saving unit type", error);
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
                    label="Nome do Tipo / Sub-tipo"
                    placeholder="Ex: Categoria de Serviço"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: CAT"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Select
                    label="Tipo Pai (Opcional)"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                    <option value="">Nenhum (Tipo Principal)</option>
                    {unitTypes.map(ut => (
                        <option key={ut.id} value={ut.id}>
                            {ut.description} ({ut.code})
                        </option>
                    ))}
                </Select>

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
