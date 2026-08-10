import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { dataService } from '../../services/dataService';

interface DepartmentFormProps {
    companyId: string;
    initialDepartment?: Partial<Department>;
    onSave: (department: Partial<Department>) => Promise<void> | void;
    onCancel: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
    companyId,
    initialDepartment,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [form, setForm] = useState({
        name: initialDepartment?.name || '',
        code: initialDepartment?.code || '',
        status: initialDepartment?.status || 'active' as 'active' | 'inactive',
        parentId: initialDepartment?.parentId || '',
        companyId: companyId
    });

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const data = await dataService.getDepartmentsByCompany(companyId);
                // Filter out current department if editing
                const filtered = initialDepartment?.id
                    ? data.filter(d => d.id !== initialDepartment.id)
                    : data;
                setDepartments(filtered);
            } catch (error) {
                console.error('Failed to load departments', error);
            }
        };
        loadDepartments();
    }, [companyId, initialDepartment?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            const dataToSave = {
                ...form,
                parentId: form.parentId || undefined
            };
            await onSave(dataToSave as Partial<Department>);
        } catch (error) {
            console.error("Error saving department", error);
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
                    label="Nome do Departamento"
                    placeholder="Ex: Recursos Humanos"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: RH"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Select
                    label="Departamento Pai (Opcional)"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                    <option value="">Nenhum (Departamento Principal)</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                        </option>
                    ))}
                </Select>

                <Select
                    label="Situação"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
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
