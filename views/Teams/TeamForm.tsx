import React, { useState, useEffect } from 'react';
import { Team, Department } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { dataService } from '../../services/dataService';
import { KeyboardAwareScrollView } from '../../components/ui/KeyboardAwareScrollView';

interface TeamFormProps {
    departmentId?: string;
    companyId?: string;
    initialTeam?: Partial<Team>;
    onSave: (team: Partial<Team>) => Promise<void> | void;
    onCancel: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
    departmentId,
    companyId,
    initialTeam,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [form, setForm] = useState({
        name: initialTeam?.name || '',
        code: initialTeam?.code || '',
        departmentId: initialTeam?.departmentId || departmentId || ''
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            if (!companyId && !departmentId) return;

            try {
                setLoadingDepartments(true);
                const data = companyId
                    ? await dataService.getDepartmentsByCompany(companyId)
                    : await dataService.getDepartments();
                setDepartments(data);
            } catch (error) {
                console.error('Failed to load departments', error);
            } finally {
                setLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, [companyId, departmentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);

            // Determine companyId
            let selectedCompanyId = companyId || initialTeam?.companyId;

            if (!selectedCompanyId && form.departmentId) {
                const dept = departments.find(d => d.id === form.departmentId);
                if (dept) selectedCompanyId = dept.companyId;
            }

            await onSave({
                ...form,
                companyId: selectedCompanyId
            } as Partial<Team>);
        } catch (error) {
            console.error("Error saving team", error);
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

            <form onSubmit={handleSubmit}>
                <KeyboardAwareScrollView className="flex-1 p-4 space-y-6 pb-10" extraPadding={30}>
                    <Input
                        label="Nome da Equipe"
                        placeholder="Ex: Equipe de Cadastro"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />

                    <Input
                        label="Código"
                        placeholder="Ex: EP-CAD"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        required
                    />

                    {(companyId || departments.length > 0) && (
                        <Select
                            label="Departamento"
                            value={form.departmentId}
                            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                            disabled={loadingDepartments}
                            required
                        >
                            <option value="">Selecione um departamento</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </option>
                            ))}
                        </Select>
                    )}
                </KeyboardAwareScrollView>
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </div>
    );
};
