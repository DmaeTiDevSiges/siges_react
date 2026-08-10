import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContractEvaluationRequirement, OrderVisitEvaluation, OrderVisit } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { SearchInput } from '../../components/ui/SearchInput';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { AlertModal } from '../../components/ui/AlertModal';

interface EvaluationItem {
    contractEvaluationId: string;
    requirementDescription: string;
    requirementCode?: string;
    weight: number;
    wasApplied: boolean;
    notes: string;
}

interface VisitEvaluationInlineProps {
    visitId: string;
    visit: OrderVisit | null;
    onRefresh?: () => void;
    onEvaluationCountChange?: (count: number) => void;
}

export const VisitEvaluationInline: React.FC<VisitEvaluationInlineProps> = ({ visitId, visit, onRefresh, onEvaluationCountChange }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [requirements, setRequirements] = useState<ContractEvaluationRequirement[]>([]);
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [existingEvaluations, setExistingEvaluations] = useState<OrderVisitEvaluation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<EvaluationItem | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visitId) {
            loadData();
        }
    }, [visitId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const contractId = visit?.contractId || (visit as any)?.o_contract_id;
            if (contractId) {
                const reqData = await dataService.getContractEvaluationRequirements(contractId);
                setRequirements(reqData);
            }
            const evalData = await dataService.getVisitEvaluations(visitId);
            setExistingEvaluations(evalData);
        } catch (error) {
            console.error('Error loading evaluation data:', error);
            toast.error('Erro ao carregar dados de avaliação');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initial = requirements.map(req => {
            const existing = existingEvaluations.find(
                e => e.contractEvaluationId === req.id
            );
            return {
                contractEvaluationId: req.id,
                requirementDescription: req.evaluationDescription || '',
                requirementCode: req.evaluationCode,
                weight: req.weight,
                wasApplied: existing?.wasApplied ?? false,
                notes: existing?.notes ?? '',
            };
        });
        setEvaluations(initial);
    }, [requirements, existingEvaluations]);

    const saveEvaluation = async (updatedEvaluations: EvaluationItem[], skipRefresh = false) => {
        if (!visitId) return;
        try {
            setSaving(true);
            await dataService.saveVisitEvaluations(
                visitId,
                updatedEvaluations.map(e => ({
                    contractEvaluationId: e.contractEvaluationId,
                    wasApplied: e.wasApplied,
                    notes: e.notes,
                })),
                visit?.ovTeamLeadId || ''
            );

            if (!skipRefresh && visit?.ovStatusId === 2 && visit?.ovTeamLeadId && visit?.ovEndedAt) {
                const endDate = new Date(visit.ovEndedAt);
                const year = endDate.getFullYear();
                const month = endDate.getMonth() + 1;
                dataService.recalculateLeaderScore(visit.ovTeamLeadId, year, month).catch(() => {});
            }

            if (!skipRefresh) {
                onRefresh?.();
            }
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error('Erro ao salvar avaliação');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEvaluation = async (index: number) => {
        const item = evaluations[index];
        setSelectingId(item.contractEvaluationId);
        const updated = evaluations.map((evalItem, i) =>
            i === index ? { ...evalItem, wasApplied: !evalItem.wasApplied } : evalItem
        );
        setEvaluations(updated);
        const newCount = updated.filter(e => e.wasApplied).length;
        onEvaluationCountChange?.(newCount);
        await saveEvaluation(updated, true);
        setSelectingId(null);
    };

    const handleNotesChange = (index: number, notes: string) => {
        const updated = evaluations.map((item, i) =>
            i === index ? { ...item, notes } : item
        );
        setEvaluations(updated);
        if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
        notesTimeoutRef.current = setTimeout(() => {
            saveEvaluation(updated);
        }, 800);
    };

    const filteredRequirements = evaluations.filter(item =>
        item.requirementDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.requirementCode && item.requirementCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedItems = evaluations.filter(e => e.wasApplied);
    const totalScore = selectedItems.reduce((sum, e) => sum + e.weight, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loading size="md" />
            </div>
        );
    }

    if (requirements.length === 0) {
        return (
            <EmptyState
                icon="rate_review"
                message="Nenhum requisito vinculado a este contrato"
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Campo de busca / seleção */}
            <div ref={dropdownRef} className="relative">
                <SearchInput
                    placeholder="Buscar e selecionar requisitos..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClear={() => { setSearchTerm(''); setIsDropdownOpen(false); }}
                    rightAction={selectingId ? <Loading size="xs" /> : undefined}
                />

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800/40 rounded-[16px] border border-slate-100 dark:border-white/5 shadow-sm z-50 max-h-64 overflow-y-auto no-scrollbar">
                        {filteredRequirements.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                Nenhum requisito encontrado
                            </div>
                        ) : (
                            filteredRequirements.map((item) => {
                                const evalIndex = evaluations.findIndex(e => e.contractEvaluationId === item.contractEvaluationId);
                                return (
                                    <div
                                        key={item.contractEvaluationId}
                                        onClick={() => { handleToggleEvaluation(evalIndex); setIsDropdownOpen(false); setSearchTerm(''); }}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${
                                            item.wasApplied
                                                ? 'bg-red-50 dark:bg-red-900/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                            item.wasApplied
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {selectingId === item.contractEvaluationId ? (
                                                <span className="material-symbols-outlined text-white text-sm animate-spin">progress_activity</span>
                                            ) : item.wasApplied ? (
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold uppercase truncate ${
                                                item.wasApplied ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {item.requirementDescription}
                                            </p>
                                            {item.requirementCode && (
                                                <span className="text-xs text-slate-400 font-mono">#{item.requirementCode}</span>
                                            )}
                                        </div>
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                                            item.wasApplied
                                                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                            {item.weight} {item.weight === 1 ? 'ponto' : 'pontos'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Requisitos selecionados (não cumpridos) */}
            {selectedItems.length > 0 && (
                <div className="space-y-3">
                    {selectedItems.map((item) => {
                        const evalIndex = evaluations.findIndex(e => e.contractEvaluationId === item.contractEvaluationId);
                        return (
                            <Card
                                key={item.contractEvaluationId}
                                className="border-2 border-red-300 dark:border-red-700 shadow-lg shadow-red-100 dark:shadow-red-900/20"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold uppercase text-red-700 dark:text-red-400">
                                                    {item.requirementDescription}
                                                </h3>
                                                {item.requirementCode && (
                                                    <span className="text-xs text-slate-400 font-mono">#{item.requirementCode}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs font-black px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                                    {item.weight} {item.weight === 1 ? 'ponto' : 'pontos'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setPendingDelete(item); }}
                                                    disabled={selectingId === item.contractEvaluationId}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                >
                                                    {selectingId === item.contractEvaluationId ? (
                                                        <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 -mx-4 px-4">
                                            <Textarea
                                                placeholder="Descreva o problema observado (opcional)"
                                                value={item.notes}
                                                onChange={(e) => handleNotesChange(evalIndex, e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Resumo */}
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Requisitos não cumpridos
                        </p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                            {selectedItems.length} <span className="text-xs font-normal text-slate-400">de {evaluations.length}</span>
                        </p>
                    </div>
                    <div className={`text-right px-4 py-3 rounded-xl ${
                        totalScore > 0
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Pontuação
                        </p>
                        <p className={`text-2xl font-black ${
                            totalScore > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                        }`}>
                            {totalScore}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Modal de Confirmação de Exclusão */}
            <AlertModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                icon="delete"
                iconClassName="text-red-500"
                iconBgClassName="bg-red-50 dark:bg-red-900/20"
                iconRingClassName="ring-red-50/50 dark:ring-red-900/10"
                title="Remover Avaliação"
                description={`Deseja realmente remover o requisito "${pendingDelete?.requirementDescription}" da avaliação?`}
                primaryAction={{
                    label: selectingId ? 'REMOVENDO...' : 'Confirmar',
                    icon: 'delete',
                    onClick: () => {
                        if (pendingDelete) {
                            const evalIndex = evaluations.findIndex(e => e.contractEvaluationId === pendingDelete.contractEvaluationId);
                            if (evalIndex >= 0) handleToggleEvaluation(evalIndex);
                        }
                        setPendingDelete(null);
                    },
                    variant: 'danger',
                    disabled: !!selectingId
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setPendingDelete(null),
                    variant: 'ghost'
                }}
            />
        </div>
    );
};
