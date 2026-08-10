import React, { useState, useEffect } from 'react';
import { Activity, OrderType, Company, Department } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { dataService } from '../../../services/dataService';

interface ActivityFormProps {
    initialActivity?: Partial<Activity>;
    onSave: (activity: Partial<Activity>) => Promise<void> | void;
    onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
    initialActivity,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    const [form, setForm] = useState({
        companyId: initialActivity?.companyId || '',
        departmentId: initialActivity?.departmentId || '',
        description: initialActivity?.description || '',
        code: initialActivity?.code || '',
        isAvailable: initialActivity?.isAvailable ?? true,
        linkedOrderTypeIds: initialActivity?.linkedOrderTypeIds || []
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [types, comps] = await Promise.all([
                    dataService.getOrderTypes('active'),
                    dataService.getCompanies().then(comps => comps.filter(c => c.status === 'active'))
                ]);
                setOrderTypes(types);
                setCompanies(comps);
            } catch (error) {
                console.error("Error loading initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // Load departments when company changes
    useEffect(() => {
        if (form.companyId) {
            dataService.getDepartmentsByCompany(form.companyId)
                .then(deptList => deptList.filter(d => d.status === 'active'))
                .then(setDepartments)
                .catch(err => console.error("Error loading departments", err));
        } else {
            setDepartments([]);
        }
    }, [form.companyId]);

    const toggleOrderType = (id: string) => {
        setForm(prev => ({
            ...prev,
            linkedOrderTypeIds: prev.linkedOrderTypeIds.includes(id)
                ? prev.linkedOrderTypeIds.filter(tid => tid !== id)
                : [...prev.linkedOrderTypeIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialActivity?.id } as Partial<Activity>);
        } catch (error) {
            console.error("Error saving activity", error);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Empresa"
                        value={form.companyId}
                        onChange={(e) => {
                            setForm(prev => ({ ...prev, companyId: e.target.value, departmentId: '' }));
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
                        disabled={!form.companyId}
                    >
                        <option value="">Selecione um departamento...</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </Select>
                </div>

                <Input
                    label="Nome da Atividade"
                    placeholder="Ex: Instalação Elétrica"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: INST-ELE"
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

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        Vincular a Tipos de OS
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {orderTypes.map(type => (
                            <label
                                key={type.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${form.linkedOrderTypeIds.includes(type.id)
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                                    : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                            >
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.linkedOrderTypeIds.includes(type.id)}
                                        onChange={() => toggleOrderType(type.id)}
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                                        {type.description}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tight">
                                        {type.code}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </div>
    );
};
