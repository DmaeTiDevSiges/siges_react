import React, { useState, useEffect } from 'react';
import { OrderType } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { ButtonSave } from '../../../../components/ui/ButtonSave';
import { dataService } from '../../../../services/dataService';

interface OrderTypeFormProps {
    initialOrderType?: Partial<OrderType>;
    onSave: (orderType: Partial<OrderType>) => Promise<void> | void;
    onCancel: () => void;
}

export const OrderTypeForm: React.FC<OrderTypeFormProps> = ({
    initialOrderType,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    // Auxiliary state for company selection (to filter departments)
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const [form, setForm] = useState({
        description: initialOrderType?.description || '',
        code: initialOrderType?.code || '',
        isAvailable: initialOrderType?.isAvailable ?? true,
        departmentId: initialOrderType?.departmentId || ''
    });

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const comps = await dataService.getCompanies();
                setCompanies(comps.filter(c => c.status === 'active'));
            } catch (error) {
                console.error("Error loading companies", error);
            }
        };
        loadCompanies();
    }, []);

    // Try to infer company if editing an existing type
    useEffect(() => {
        if (initialOrderType?.departmentId && companies.length > 0) {
            dataService.getDepartments().then(depts => {
                const dept = depts.find(d => d.id === initialOrderType.departmentId);
                if (dept) {
                    setSelectedCompanyId(dept.companyId);
                }
            });
        }
    }, [initialOrderType?.departmentId, companies.length]);

    useEffect(() => {
        if (selectedCompanyId) {
            dataService.getDepartmentsByCompany(selectedCompanyId)
                .then(depts => setDepartments(depts.filter(d => d.status === 'active')))
                .catch(err => console.error("Error loading departments", err));
        } else {
            setDepartments([]);
        }
    }, [selectedCompanyId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            // Artificial delay for premium effect visibility
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSave({
                ...form,
                id: initialOrderType?.id
            } as Partial<OrderType>);
        } catch (error) {
            console.error("Error saving order type", error);
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
                    placeholder="Ex: Preventiva"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: PREV"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Select
                    label="Empresa (Filtro)"
                    value={selectedCompanyId}
                    onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setForm(prev => ({ ...prev, departmentId: '' }));
                    }}
                >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </Select>

                <Select
                    label="Departamento"
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    required
                    disabled={!selectedCompanyId}
                >
                    <option value="">Selecione um departamento...</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
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
