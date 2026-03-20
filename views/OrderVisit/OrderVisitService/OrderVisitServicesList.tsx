import React, { useState, useEffect } from 'react';
import { OrderVisitService, ContractService } from '../../../types';
import { dataService } from '../../../services/dataService';
import { Card } from '../../../components/ui/Card';
import { ButtonDelete } from '../../../components/ui/ButtonDelete';
import { ButtonNew } from '../../../components/ui/ButtonNew';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { toast } from 'sonner';

interface OrderVisitServicesListProps {
    visitId: string;
    isEditable?: boolean;
    contractId?: string;
    onVisitRefresh?: () => void;
}

export const OrderVisitServicesList: React.FC<OrderVisitServicesListProps> = ({
    visitId,
    isEditable = true,
    contractId,
    onVisitRefresh
}) => {
    const [visitServices, setVisitServices] = useState<OrderVisitService[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Service State
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableServices, setAvailableServices] = useState<ContractService[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingServiceId, setAddingServiceId] = useState<string | null>(null);
    const [successServiceId, setSuccessServiceId] = useState<string | null>(null);

    useEffect(() => {
        loadVisitServices();
    }, [visitId]);

    const loadVisitServices = async () => {
        try {
            setLoading(true);
            const data = await dataService.getOrderVisitServices(visitId);
            setVisitServices(data);
        } catch (error) {
            console.error('Error loading visit services:', error);
            toast.error('Erro ao carregar serviços da visita');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!contractId) return;

        try {
            setSearching(true);
            // We fetch all services for the contract and then filter locally by search term
            // This is efficient since a contract typically has < 50 services
            if (availableServices.length === 0) {
                const results = await dataService.getContractServices(contractId);
                setAvailableServices(results);
            }
        } catch (error) {
            console.error('Error loading contract services:', error);
        } finally {
            setSearching(false);
        }
    };

    const filteredSearchResults = availableServices.filter(s => {
        const matchesSearch = s.serviceDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const alreadyAdded = visitServices.some(vs => vs.serviceId === s.id);
        return matchesSearch && !alreadyAdded && searchTerm.length >= 1;
    });

    const handleAddService = async (contractService: ContractService, userId: string) => {
        try {
            setAddingServiceId(contractService.id);
            await dataService.addServiceToOrderVisit(visitId, contractService.id, userId);
            
            setAddingServiceId(null);
            setSuccessServiceId(contractService.id);
            toast.success('Serviço adicionado!');
            
            // Revert success state after a while
            setTimeout(() => {
                setSuccessServiceId(null);
            }, 1500);

            // Removed premature close of adding mode to allow adding multiple services
            // setIsAdding(false); 
            // setSearchTerm('');
            
            loadVisitServices();
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Erro ao adicionar serviço');
            setAddingServiceId(null);
        }
    };

    const [serviceToDelete, setServiceToDelete] = useState<OrderVisitService | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemoveService = (vs: OrderVisitService) => {
        setServiceToDelete(vs);
    };

    const confirmRemoveService = async () => {
        if (!serviceToDelete) return;
        setIsDeleting(true);
        try {
            await dataService.removeServiceFromOrderVisit(serviceToDelete.id);
            toast.success('Serviço removido com sucesso!');
            setVisitServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
            setServiceToDelete(null);
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error('Error removing service:', error);
            toast.error('Erro ao remover serviço');
        } finally {
            setIsDeleting(false);
        }
    };

    // State to track raw input values during typing
    const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

    const handleUpdateField = async (ovServiceId: string, field: 'amount' | 'discount', value: string) => {
        // 1. MASK LOGIC: Sanitize input to allow only numbers and ONE decimal separator
        let sanitized = value.replace(/[^\d.,]/g, ''); // Remove anything not digit, dot or comma
        sanitized = sanitized.replace(',', '.'); // Normalize to dot for logic

        // Handle multiple dots (keep only the first one)
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit decimal places based on field
        const maxDecimals = field === 'amount' ? 2 : 4;
        if (parts.length === 2 && parts[1].length > maxDecimals) {
            sanitized = parts[0] + '.' + parts[1].substring(0, maxDecimals);
        }

        // 2. Update raw input state (showing as comma for the user)
        const displayValue = sanitized.replace('.', ',');
        const inputKey = `${ovServiceId}_${field}`;
        setRawInputs(prev => ({ ...prev, [inputKey]: displayValue }));

        // 3. Database Update logic
        const numValue = parseFloat(sanitized);

        // If it's a valid number and doesn't end with a separator, we update the DB
        if (isNaN(numValue) || numValue < 0 || sanitized.endsWith('.')) {
            return;
        }

        // Optimistic update
        setVisitServices(prev => prev.map(s => {
            if (s.id === ovServiceId) {
                const newAmount = field === 'amount' ? numValue : (s.amount || 0);
                const newDiscount = field === 'discount' ? numValue : (s.discount || 0);
                return {
                    ...s,
                    [field]: numValue,
                    valueTotal: newAmount * (s.valueUnit || 0) * (newDiscount || 1)
                };
            }
            return s;
        }));

        try {
            await dataService.updateOrderVisitService(ovServiceId, { [field]: numValue });
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error(`Error updating service ${field}:`, error);
            toast.error('Erro ao atualizar serviço');
            loadVisitServices();
        }
    };

    const [currentUserId, setCurrentUserId] = useState<string>('');
    useEffect(() => {
        dataService.getCurrentUser().then(u => {
            if (u) setCurrentUserId(u.id);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    SERVIÇOS REALIZADOS
                </h3>
                {isEditable && contractId && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isAdding
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                    >
                        {isAdding ? (
                            <>
                                <span className="material-symbols-outlined text-sm">close</span>
                                CANCELAR
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">add</span>
                                ASSOCIAR
                            </>
                        )}
                    </button>
                )}
            </div>

            {!contractId && !loading && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold text-center">
                    CONTRATO NÃO VINCULADO PARA ESTA ORDEM
                </div>
            )}

            {/* Add Service Search Area */}
            {isAdding && (
                <div className="animate-in slide-in-from-top-2 duration-300 mb-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar serviço no contrato..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            autoFocus
                        />
                    </div>

                    {searching && (
                        <div className="p-4 text-center text-slate-400 text-xs font-bold">
                            BUSCANDO...
                        </div>
                    )}

                    {!searching && searchTerm.length >= 1 && filteredSearchResults.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs font-bold">
                            NENHUM SERVIÇO ENCONTRADO NO CONTRATO
                        </div>
                    )}

                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                        {filteredSearchResults.map(cs => (
                            <div key={cs.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                                            {cs.serviceDescription}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {cs.serviceCode} • {cs.serviceUnit} • R$ {cs.valueUnit?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <ButtonNew
                                    isLoading={addingServiceId === cs.id}
                                    isSuccess={successServiceId === cs.id}
                                    onClick={() => handleAddService(cs, currentUserId)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid gap-4">
                {visitServices.length === 0 && !isAdding && (
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-10 border border-dashed border-slate-200 dark:border-white/5 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <span className="material-symbols-outlined text-4xl">construction</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">Nenhum serviço registrado.</p>
                        {isEditable && contractId && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 text-indigo-500 text-xs font-black uppercase tracking-widest hover:text-indigo-600"
                            >
                                Adicionar Primeiro Serviço
                            </button>
                        )}
                    </div>
                )}


                {visitServices.map(vs => (
                    <Card key={vs.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                        {vs.serviceDescription}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                                        {vs.serviceCode} • R$ {vs.valueUnit?.toFixed(2)} / {vs.serviceUnit}
                                    </p>
                                </div>
                            </div>

                            {isEditable && (
                                <ButtonDelete
                                    onClick={() => handleRemoveService(vs)}
                                    icon="delete"
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-24">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        QUANTIDADE
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={rawInputs[`${vs.id}_amount`] ?? (vs.amount % 1 === 0 ? vs.amount.toString() : vs.amount.toFixed(2).replace('.', ','))}
                                            disabled={!isEditable}
                                            onChange={(e) => handleUpdateField(vs.id, 'amount', e.target.value)}
                                            onBlur={() => setRawInputs(prev => {
                                                const news = { ...prev };
                                                delete news[`${vs.id}_amount`];
                                                return news;
                                            })}
                                            className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-lg text-sm font-bold text-slate-700 dark:text-white p-2 focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-400">{vs.serviceUnit}</span>
                                    </div>
                                </div>

                                <div className="w-20">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        A / D
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={rawInputs[`${vs.id}_discount`] ?? (vs.discount % 1 === 0 ? vs.discount.toString() : vs.discount.toFixed(4).replace('.', ','))}
                                        disabled={!isEditable}
                                        onChange={(e) => handleUpdateField(vs.id, 'discount', e.target.value)}
                                        onBlur={() => setRawInputs(prev => {
                                            const news = { ...prev };
                                            delete news[`${vs.id}_discount`];
                                            return news;
                                        })}
                                        className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-lg text-sm font-bold text-slate-700 dark:text-white p-2 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 block mb-1">TOTAL</span>
                                <span className="text-lg font-black text-blue-500">
                                    R$ {vs.valueTotal?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* Total */}
                {visitServices.length > 0 && (
                    <div className="mt-2 flex justify-end">
                        <div className="text-right">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">TOTAL SERVIÇOS</span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                R$ {visitServices.reduce((sum, vs) => sum + (vs.valueTotal || 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            <ConfirmDeleteModal
                isOpen={!!serviceToDelete}
                onClose={() => setServiceToDelete(null)}
                onConfirm={confirmRemoveService}
                title="Remover Serviço"
                description={
                    serviceToDelete ? (
                        <>
                            Confirma a remoção do serviço <strong className="text-slate-700 dark:text-slate-200">{serviceToDelete.serviceDescription}</strong>?
                        </>
                    ) : undefined
                }
                isLoading={isDeleting}
            />
        </div>
    );
};
