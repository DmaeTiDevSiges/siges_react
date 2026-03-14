import React, { useState, useEffect } from 'react';
import { ContractService, Service } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { Input } from '../../../components/ui/Input';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { DecimalInput } from '../../../components/ui/DecimalInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';

interface ContractServicesListProps {
    contractId: string;
}

export const ContractServicesList: React.FC<ContractServicesListProps> = ({ contractId }) => {
    const [contractServices, setContractServices] = useState<ContractService[]>([]);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
    const [editingService, setEditingService] = useState<ContractService | null>(null);

    useEffect(() => {
        loadData();
    }, [contractId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await dataService.getContractServices(contractId);
            setContractServices(data);
            setDirtyIds(new Set());
        } catch (error) {
            console.error('Error loading contract services:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableServices = async (query: string) => {
        if (!query) {
            setAvailableServices([]);
            return;
        }
        try {
            const data = await dataService.getServices('active', query);
            // Filter out services already in the contract
            const filtered = data.filter(s => !contractServices.some(cs => cs.serviceId === s.id));
            setAvailableServices(filtered);
        } catch (error) {
            console.error('Error loading available services:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAvailableServices(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAddService = async (service: Service) => {
        try {
            await dataService.addContractService({
                contractId,
                serviceId: service.id,
                valueUnit: 0,
                discount: 1,
                amount: 0
            });
            setSearchQuery('');
            setAvailableServices([]);
            await loadData();
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Erro ao adicionar serviço');
        }
    };

    const handleLocalUpdate = (id: string, field: keyof ContractService, value: number) => {
        setContractServices(prev => prev.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                newItem.valueTotal = (newItem.valueUnit || 0) * (newItem.discount || 0) * (newItem.amount || 0);
                if (editingService?.id === id) setEditingService(newItem);
                return newItem;
            }
            return item;
        }));
        setDirtyIds(prev => new Set(prev).add(id));
    };

    const handleSaveService = async (item: ContractService) => {
        try {
            setSavingIds(prev => new Set(prev).add(item.id));
            await dataService.updateContractService(item.id, {
                valueUnit: item.valueUnit,
                discount: item.discount,
                amount: item.amount
            });
            setDirtyIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
            setEditingService(null);
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Erro ao salvar alterações');
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleRemoveService = async (id: string) => {
        if (!confirm('Deseja remover este serviço do contrato?')) return;
        try {
            await dataService.deleteContractService(id);
            if (editingService?.id === id) setEditingService(null);
            await loadData();
        } catch (error) {
            console.error('Error removing service:', error);
            toast.error('Erro ao remover serviço');
        }
    };

    return (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            {/* Search and Add Section */}
            <div className="relative">
                <SearchInput
                    placeholder="Buscar serviços (por nome ou código)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60"
                />

                {searchQuery && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {availableServices.length > 0 ? (
                            availableServices.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleAddService(service)}
                                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                            {service.description}
                                        </p>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{service.unit}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{service.code}</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm italic">
                                Nenhum serviço sugerido
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* List of Services */}
            <div className="flex flex-col gap-3">
                {loading && contractServices.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : contractServices.length > 0 ? (
                    contractServices.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setEditingService(item)}
                            className="group flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-start min-w-0 flex-1">
                                <div className="flex items-center justify-between w-full">
                                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase truncate">
                                        {item.serviceDescription}
                                    </h4>
                                    <StatusBadge status="active" size="sm" />
                                </div>

                                <div className="mt-1">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        #{item.serviceCode || 'S/C'}
                                    </span>
                                </div>

                                <div className="flex items-center flex-wrap gap-x-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vlr Unit:</span>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            R$ {item.valueUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">A/D:</span>
                                        <span className={`text-[11px] font-bold ${item.discount < 1 ? 'text-green-500' : item.discount > 1 ? 'text-orange-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {item.discount.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                                        </span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Qte Prev:</span>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {item.serviceUnit}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center ml-4">
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    chevron_right
                                </span>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-card-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2">inventory_2</span>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Nenhum serviço vinculado</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingService}
                onClose={() => setEditingService(null)}
                title="Editar Serviço"
            >
                {editingService && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {editingService.serviceDescription}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono mt-1">
                                    #{editingService.serviceCode || 'SEM CÓDIGO'}
                                </span>
                            </div>
                            <IconButton
                                icon="delete"
                                variant="danger"
                                size="lg"
                                onClick={() => handleRemoveService(editingService.id)}
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <CurrencyInput
                                label="Valor Unitário"
                                value={editingService.valueUnit}
                                onChange={(val) => handleLocalUpdate(editingService.id, 'valueUnit', val)}
                            />
                            <DecimalInput
                                label="Acréscimo/Desconto"
                                value={editingService.discount}
                                onChange={(val) => handleLocalUpdate(editingService.id, 'discount', val)}
                                precision={4}
                                rightIcon={
                                    <span className={`text-[10px] font-black ${editingService.discount < 1 ? 'text-green-500' : editingService.discount > 1 ? 'text-orange-500' : 'hidden'}`}>
                                        {editingService.discount < 1 ? `-${Math.round((1 - editingService.discount) * 100)}%` : `+${Math.round((editingService.discount - 1) * 100)}%`}
                                    </span>
                                }
                            />

                            <DecimalInput
                                label="Qte Prevista"
                                value={editingService.amount}
                                onChange={(val) => handleLocalUpdate(editingService.id, 'amount', val)}
                                precision={2}
                                rightIcon={
                                    editingService.serviceUnit ? (
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                                            {editingService.serviceUnit}
                                        </span>
                                    ) : undefined
                                }
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col items-end mb-6">
                                <div className="text-slate-900 dark:text-white font-black text-3xl flex items-baseline gap-1.5">
                                    <span className="text-[16px] text-slate-400 dark:text-slate-600 font-medium tracking-tight">R$</span>
                                    {(editingService.valueTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Total Previsto</span>
                            </div>

                            <Button
                                fullWidth
                                onClick={() => handleSaveService(editingService)}
                                loading={savingIds.has(editingService.id)}
                                className="h-14 rounded-2xl text-lg font-black"
                            >
                                {dirtyIds.has(editingService.id) ? 'Salvar' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
