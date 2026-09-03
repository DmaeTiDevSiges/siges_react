import React, { useState, useEffect } from 'react';
import { EvaluationRequirement, ContractEvaluationRequirement } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { DecimalInput } from '../../../components/ui/DecimalInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { Loading } from '../../../components/ui/Loading';

interface ContractEvaluationsTabProps {
    contractId: string;
}

export const ContractEvaluationsTab: React.FC<ContractEvaluationsTabProps> = ({ contractId }) => {
    const [contractEvaluations, setContractEvaluations] = useState<ContractEvaluationRequirement[]>([]);
    const [availableRequirements, setAvailableRequirements] = useState<EvaluationRequirement[]>([]);
    const [allRequirements, setAllRequirements] = useState<EvaluationRequirement[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<ContractEvaluationRequirement | null>(null);
    const [newWeight, setNewWeight] = useState<number>(-1);
    const [showNewRequirementForm, setShowNewRequirementForm] = useState(false);
    const [newRequirement, setNewRequirement] = useState({ description: '', code: '' });

    useEffect(() => {
        loadData();
    }, [contractId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [contractData, allData] = await Promise.all([
                dataService.getContractEvaluationRequirements(contractId),
                dataService.getEvaluationRequirements()
            ]);
            setContractEvaluations(contractData);
            setAllRequirements(allData);
        } catch (error) {
            console.error('Error loading evaluation data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchQuery) {
            setAvailableRequirements([]);
            return;
        }
        const filtered = allRequirements.filter(r =>
            r.isAvailable &&
            !contractEvaluations.some(ce => ce.evaluationId === r.id) &&
            (r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.code?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setAvailableRequirements(filtered);
    }, [searchQuery, allRequirements, contractEvaluations]);

    const handleAddRequirement = async (requirement: EvaluationRequirement) => {
        try {
            await dataService.addEvaluationToContract(contractId, requirement.id, newWeight);
            setSearchQuery('');
            setAvailableRequirements([]);
            setNewWeight(-1);
            await loadData();
            toast.success('Requisito adicionado ao contrato');
        } catch (error) {
            console.error('Error adding requirement:', error);
            toast.error('Erro ao adicionar requisito');
        }
    };

    const handleUpdateWeight = async (item: ContractEvaluationRequirement, newWeightValue: number) => {
        try {
            await dataService.updateContractEvaluationWeight(item.id, newWeightValue);
            setEditingItem(null);
            await loadData();
            toast.success('Peso atualizado');
        } catch (error) {
            console.error('Error updating weight:', error);
            toast.error('Erro ao atualizar peso');
        }
    };

    const handleRemoveRequirement = async (id: string) => {
        if (!confirm('Deseja remover este requisito do contrato?')) return;
        try {
            await dataService.removeEvaluationFromContract(id);
            if (editingItem?.id === id) setEditingItem(null);
            await loadData();
            toast.success('Requisito removido');
        } catch (error) {
            console.error('Error removing requirement:', error);
            toast.error('Erro ao remover requisito');
        }
    };

    const handleCreateRequirement = async () => {
        if (!newRequirement.description.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }

        try {
            const created = await dataService.createEvaluationRequirement({
                description: newRequirement.description,
                code: newRequirement.code || undefined,
            });

            if (created && 'error' in created) {
                toast.error(created.error);
                return;
            }

            if (created) {
                toast.success('Requisito criado com sucesso');
                setShowNewRequirementForm(false);
                setNewRequirement({ description: '', code: '' });
                await loadData();
            } else {
                toast.error('Erro ao criar requisito');
            }
        } catch (error) {
            console.error('Error creating requirement:', error);
            toast.error('Erro ao criar requisito');
        }
    };

    return (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Vincule requisitos de avaliação a este contrato
                </p>
                <Button
                    onClick={() => setShowNewRequirementForm(true)}
                    className="flex items-center gap-2"
                    size="sm"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Novo Requisito
                </Button>
            </div>

            {/* Search and Add Section */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar requisitos (por descrição ou código)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60"
                        />
                    </div>
                    <div className="w-24">
                        <DecimalInput
                            label="Peso"
                            value={newWeight}
                            onChange={setNewWeight}
                            precision={0}
                        />
                    </div>
                </div>

                {searchQuery && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {availableRequirements.length > 0 ? (
                            availableRequirements.map(requirement => (
                                <button
                                    key={requirement.id}
                                    onClick={() => handleAddRequirement(requirement)}
                                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                            {requirement.description}
                                        </p>
                                        {requirement.code && (
                                            <span className="text-[10px] text-slate-500 font-mono">#{requirement.code}</span>
                                        )}
                                    </div>
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm italic">
                                Nenhum requisito encontrado
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* List of Requirements */}
            <div className="flex flex-col gap-3">
                {loading && contractEvaluations.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loading size="xs" />
                    </div>
                ) : contractEvaluations.length > 0 ? (
                    contractEvaluations.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setEditingItem(item)}
                            className="group flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-start min-w-0 flex-1">
                                <div className="flex items-center justify-between w-full">
                                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase truncate">
                                        {item.evaluationDescription}
                                    </h4>
                                    <StatusBadge status="active" size="sm" />
                                </div>

                                {item.evaluationCode && (
                                    <div className="mt-1">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            #{item.evaluationCode}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center flex-wrap gap-x-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Peso:</span>
                                        <span className={`text-[11px] font-bold ${item.weight < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {item.weight} ptos
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
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2">rate_review</span>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Nenhum requisito vinculado</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Editar Requisito"
            >
                {editingItem && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {editingItem.evaluationDescription}
                                </h4>
                                {editingItem.evaluationCode && (
                                    <span className="text-xs text-slate-400 font-mono mt-1">
                                        #{editingItem.evaluationCode}
                                    </span>
                                )}
                            </div>
                            <IconButton
                                icon="delete"
                                variant="danger"
                                size="lg"
                                onClick={() => handleRemoveRequirement(editingItem.id)}
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <DecimalInput
                                label="Peso (pontuação negativa)"
                                value={editingItem.weight}
                                onChange={(val) => setEditingItem({ ...editingItem, weight: val })}
                                precision={0}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                O peso define quantos pontos serão descontados quando o requisito não for cumprido.
                                Use valores negativos (ex: -5, -10).
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                fullWidth
                                onClick={() => handleUpdateWeight(editingItem, editingItem.weight)}
                                className="h-14 rounded-2xl text-lg font-black"
                            >
                                Salvar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* New Requirement Modal */}
            <Modal
                isOpen={showNewRequirementForm}
                onClose={() => {
                    setShowNewRequirementForm(false);
                    setNewRequirement({ description: '', code: '' });
                }}
                title="Novo Requisito de Avaliação"
            >
                <div className="space-y-4">
                    <Input
                        label="Descrição *"
                        value={newRequirement.description}
                        onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                        placeholder="Ex: EPIs utilizadas corretamente"
                    />
                    <Input
                        label="Código (opcional)"
                        value={newRequirement.code}
                        onChange={(e) => setNewRequirement({ ...newRequirement, code: e.target.value })}
                        placeholder="Ex: EPI001"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        O código é opcional, mas ajuda na identificação rápida do requisito.
                    </p>
                    <Button fullWidth onClick={handleCreateRequirement} className="mt-4">
                        Criar Requisito
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
