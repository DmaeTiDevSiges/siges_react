import React, { useState, useEffect } from 'react';
import { Company, Vehicle } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';

export interface VehicleFormInput {
    id?: string;
    description: string;
    plates: string;
    isAvailable?: boolean;
    companyId?: string | null;
}

interface VehicleFormProps {
    initial?: Vehicle | null;
    defaultCompanyId?: string;
    onSave: (input: VehicleFormInput) => Promise<void>;
    onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
    initial,
    defaultCompanyId,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [form, setForm] = useState({
        description: initial?.description || '',
        plates: initial?.plates || '',
        isAvailable: initial?.isAvailable ?? true,
        companyId: initial?.companyId || defaultCompanyId || ''
    });

    useEffect(() => {
        dataService.getCompanies()
            .then(comps => setCompanies(comps.filter(c => c.status === 'active')))
            .catch(err => console.error('Error loading companies', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (!form.description.trim()) {
            toast.warning('Informe a descrição do veículo.');
            return;
        }
        if (!form.plates.trim()) {
            toast.warning('Informe a placa do veículo.');
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                id: initial?.id,
                description: form.description.trim(),
                plates: form.plates.trim().toUpperCase(),
                isAvailable: form.isAvailable,
                companyId: form.companyId || null
            });
        } catch (error) {
            console.error('Error saving vehicle', error);
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
                    placeholder="Ex: Fiat Strada"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Placa"
                    placeholder="Ex: ABC1234"
                    value={form.plates}
                    onChange={(e) => setForm({ ...form, plates: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                />

                <Select
                    label="Empresa"
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
            </div>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </form>
    );
};
