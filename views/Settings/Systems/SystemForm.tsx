import React, { useState, useEffect } from 'react';
import { System } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { dataService } from '../../../services/dataService';

interface SystemFormProps {
    initialSystem?: Partial<System>;
    onSave: (system: Partial<System>) => Promise<void> | void;
    onCancel: () => void;
}

export const SystemForm: React.FC<SystemFormProps> = ({
    initialSystem,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [systems, setSystems] = useState<System[]>([]);
    const [form, setForm] = useState({
        description: initialSystem?.description || '',
        code: initialSystem?.code || '',
        isAvailable: initialSystem?.isAvailable ?? true,
        parentId: initialSystem?.parentId || ''
    });

    useEffect(() => {
        const loadSystems = async () => {
            try {
                const data = await dataService.getSystems();
                // Filter out current system if editing to prevent circular parent
                const filtered = initialSystem?.id
                    ? data.filter(s => s.id !== initialSystem.id)
                    : data;
                setSystems(filtered);
            } catch (error) {
                console.error('Failed to load systems', error);
            }
        };
        loadSystems();
    }, [initialSystem?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            const dataToSave = {
                ...form,
                parentId: form.parentId || null
            };
            await onSave(dataToSave as Partial<System>);
        } catch (error) {
            console.error("Error saving system", error);
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
                    label="Nome do Sistema / Sub-sistema"
                    placeholder="Ex: Módulo de Finanças"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: FIN"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Select
                    label="Sistema Pai (Opcional)"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                    <option value="">Nenhum (Sistema Principal)</option>
                    {systems.map(sys => (
                        <option key={sys.id} value={sys.id}>
                            {sys.description} ({sys.code})
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
