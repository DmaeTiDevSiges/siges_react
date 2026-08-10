import React, { useState, useEffect } from 'react';
import { Contract, Company, Department, Client } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DateInput } from '../../components/ui/DateInput';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { ButtonSave } from '../../components/ui/ButtonSave';

interface ContractFormProps {
    initialContract?: Contract;
    companyId?: string;
    onSave: (contract: Partial<Contract>) => Promise<void> | void;
    onCancel: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
    initialContract,
    companyId,
    onSave,
    onCancel
}) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [partnerDepartments, setPartnerDepartments] = useState<Department[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Contract>>({
        clientCompanyId: companyId || initialContract?.clientCompanyId || '',
        clientDepartmentId: initialContract?.clientDepartmentId || '',
        providerCompanyId: initialContract?.providerCompanyId || '',
        providerDepartmentId: initialContract?.providerDepartmentId || '',
        clientId: initialContract?.clientId || '',
        code: initialContract?.code || '',
        description: initialContract?.description || '',
        dateStart: initialContract?.dateStart ? new Date(initialContract.dateStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dateEnd: initialContract?.dateEnd ? new Date(initialContract.dateEnd).toISOString().split('T')[0] : '',
        totalValue: initialContract?.totalValue || 0,
        isAvailable: initialContract?.isAvailable ?? true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companiesData, clientsData] = await Promise.all([
                    dataService.getCompanies(),
                    dataService.getClients()
                ]);
                setCompanies(companiesData);
                setClients(clientsData);
            } catch (error) {
                console.error('Failed to load data', error);
            }
        };
        fetchData();
    }, []);

    // Update formData when initialContract changes
    useEffect(() => {
        if (initialContract) {
            setFormData({
                clientCompanyId: companyId || initialContract.clientCompanyId || '',
                clientDepartmentId: initialContract.clientDepartmentId || '',
                providerCompanyId: initialContract.providerCompanyId || '',
                providerDepartmentId: initialContract.providerDepartmentId || '',
                clientId: initialContract.clientId || '',
                code: initialContract.code || '',
                description: initialContract.description || '',
                dateStart: initialContract.dateStart ? new Date(initialContract.dateStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                dateEnd: initialContract.dateEnd ? new Date(initialContract.dateEnd).toISOString().split('T')[0] : '',
                totalValue: initialContract.totalValue || 0,
                isAvailable: initialContract.isAvailable ?? true
            });
        }
    }, [initialContract, companyId]);

    // Load company departments
    useEffect(() => {
        const loadDepartments = async () => {
            if (formData.clientCompanyId) {
                try {
                    const data = await dataService.getDepartmentsByCompany(formData.clientCompanyId);
                    setDepartments(data);
                } catch (error) {
                    console.error('Failed to load departments', error);
                }
            } else {
                setDepartments([]);
            }
        };
        loadDepartments();
    }, [formData.clientCompanyId]);

    // Load partner departments
    useEffect(() => {
        const loadProviderDepartments = async () => {
            if (formData.providerCompanyId) {
                try {
                    const data = await dataService.getDepartmentsByCompany(formData.providerCompanyId);
                    setPartnerDepartments(data);
                } catch (error) {
                    console.error('Failed to load partner departments', error);
                }
            } else {
                setPartnerDepartments([]);
            }
        };
        loadProviderDepartments();
    }, [formData.providerCompanyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.dateStart && formData.dateEnd) {
            if (formData.dateEnd < formData.dateStart) {
                toast.error('A Data de Término deve ser igual ou posterior à Data de Início.');
                return;
            }
        }

        try {
            setIsSaving(true);
            await onSave(formData);
        } catch (error) {
            console.error("Error saving contract", error);
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
                    label="Cliente"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    options={[
                        { value: '', label: 'Selecione um cliente' },
                        ...clients
                            .filter(c => c.status === 'active')
                            .map(c => ({ value: c.id, label: c.name }))
                    ]}
                    required
                />

                {!companyId && (
                    <Select
                        label="Empresa Contratante"
                        value={formData.clientCompanyId}
                        onChange={(e) => setFormData({ ...formData, clientCompanyId: e.target.value, clientDepartmentId: '' })}
                        options={[
                            { value: '', label: 'Selecione uma empresa' },
                            ...companies
                                .filter(c => c.status === 'active' && c.id !== formData.providerCompanyId)
                                .map(c => ({ value: c.id, label: c.name }))
                        ]}
                        required
                    />
                )}

                <Select
                    label="Departamento Responsável"
                    value={formData.clientDepartmentId}
                    onChange={(e) => setFormData({ ...formData, clientDepartmentId: e.target.value })}
                    options={[
                        { value: '', label: 'Selecione o departamento' },
                        ...departments
                            .filter(d => d.status === 'active')
                            .map(d => ({ value: d.id, label: d.name }))
                    ]}
                    disabled={!formData.clientCompanyId}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Código"
                        placeholder="Ex: CT-2024-001"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                    />
                    <CurrencyInput
                        label="Valor Total"
                        value={formData.totalValue}
                        onChange={(val) => setFormData({ ...formData, totalValue: val })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <DateInput
                        label="Data de Início"
                        value={formData.dateStart?.toString() || ''}
                        onChange={(val) => setFormData({ ...formData, dateStart: val })}
                        required
                    />
                    <DateInput
                        label="Data de Término"
                        value={formData.dateEnd?.toString() || ''}
                        onChange={(val) => setFormData({ ...formData, dateEnd: val })}
                        min={formData.dateStart?.toString()}
                        required
                    />
                </div>

                <Select
                    label="Parceiro"
                    value={formData.providerCompanyId}
                    onChange={(e) => setFormData({ ...formData, providerCompanyId: e.target.value, providerDepartmentId: '' })}
                    options={[
                        { value: '', label: 'Selecione o parceiro' },
                        ...companies
                            .filter(c => c.status === 'active')
                            .map(c => ({ value: c.id, label: c.name }))
                    ]}
                    required
                />
                <Select
                    label="Departamento do Parceiro"
                    value={formData.providerDepartmentId}
                    onChange={(e) => setFormData({ ...formData, providerDepartmentId: e.target.value })}
                    options={[
                        { value: '', label: 'Selecione o departamento' },
                        ...partnerDepartments
                            .filter(d => d.status === 'active')
                            .map(d => ({ value: d.id, label: d.name }))
                    ]}
                    disabled={!formData.providerCompanyId}
                    required
                />

                <Select
                    label="Situação"
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                    options={[
                        { value: 'true', label: 'Ativo' },
                        { value: 'false', label: 'Inativo' },
                    ]}
                    required
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Descrição / Observações
                    </label>
                    <textarea
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32"
                        placeholder="Detalhes adicionais do contrato..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
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
