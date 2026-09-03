import React, { useState, useEffect } from 'react';
import { ContractEvaluationRequirement, OrderVisitEvaluation, OrderVisit } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Loading } from '../../components/ui/Loading';
import { IconButton } from '../../components/ui/IconButton';

interface EvaluationItem {
    contractEvaluationId: string;
    requirementDescription: string;
    requirementCode?: string;
    weight: number;
    wasApplied: boolean;
    notes: string;
}

interface VisitEvaluationPageProps {
    visitId: string;
    onBack: () => void;
    onSaved: () => void;
}

export const VisitEvaluationPage: React.FC<VisitEvaluationPageProps> = ({ visitId, onBack, onSaved }) => {
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [visit, setVisit] = useState<OrderVisit | null>(null);
    const [requirements, setRequirements] = useState<ContractEvaluationRequirement[]>([]);
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [existingEvaluations, setExistingEvaluations] = useState<OrderVisitEvaluation[]>([]);

    useEffect(() => {
        if (visitId) {
            loadData();
        }
    }, [visitId]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Carrega dados da visita
            const visitData = await dataService.getOrderVisitById(visitId);
            if (!visitData) {
                toast.error('Visita não encontrada');
                onBack();
                return;
            }
            setVisit(visitData);

            // Carrega requisitos do contrato
            const contractId = visitData.contractId || (visitData as any).o_contract_id;
            if (contractId) {
                const reqData = await dataService.getContractEvaluationRequirements(contractId);
                setRequirements(reqData);
            }

            // Carrega avaliações existentes
            const evalData = await dataService.getVisitEvaluations(visitId);
            setExistingEvaluations(evalData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Inicializa evaluations com base nos requisitos e avaliações existentes
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

    const handleToggleEvaluation = (index: number) => {
        setEvaluations(prev => prev.map((item, i) =>
            i === index ? { ...item, wasApplied: !item.wasApplied } : item
        ));
    };

    const handleNotesChange = (index: number, notes: string) => {
        setEvaluations(prev => prev.map((item, i) =>
            i === index ? { ...item, notes } : item
        ));
    };

    const handleSave = async () => {
        if (!visitId) return;

        try {
            setSaving(true);
            const currentUser = await dataService.getCurrentUser();
            await dataService.saveVisitEvaluations(
                visitId,
                evaluations.map(e => ({
                    contractEvaluationId: e.contractEvaluationId,
                    wasApplied: e.wasApplied,
                    notes: e.notes,
                })),
                currentUser?.id || visit?.ovTeamLeadId || ''
            );
            toast.success('Avaliações salvas com sucesso');

            // Recalcular score do líder se a visita estiver encerrada
            if (visit?.ovStatusId === 2 && visit?.ovTeamLeadId && visit?.ovEndedAt) {
                const endDate = new Date(visit.ovEndedAt);
                const year = endDate.getFullYear();
                const month = endDate.getMonth() + 1;
                dataService.recalculateLeaderScore(visit.ovTeamLeadId, year, month).catch(() => {
                    // Erro silencioso - recálculo é opcional
                });
            }

            onSaved();
        } catch (error) {
            console.error('Error saving evaluations:', error);
            toast.error('Erro ao salvar avaliações');
        } finally {
            setSaving(false);
        }
    };

    const totalScore = evaluations
        .filter(e => e.wasApplied)
        .reduce((sum, e) => sum + e.weight, 0);

    const appliedCount = evaluations.filter(e => e.wasApplied).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loading size="md" />
            </div>
        );
    }

    const isFiled = visit?.isFiled === true;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark">


            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">




                {/* Lista de Requisitos */}
                {requirements.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-card-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2">
                            rate_review
                        </span>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                            Nenhum requisito vinculado a este contrato
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {evaluations.map((item, index) => (
                            <div
                                key={item.contractEvaluationId}
                                className={`bg-white dark:bg-card-dark rounded-2xl border-2 transition-all duration-200 ${
                                    item.wasApplied
                                        ? 'border-red-300 dark:border-red-700 shadow-lg shadow-red-100 dark:shadow-red-900/20'
                                        : 'border-slate-100 dark:border-slate-800'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => !isFiled && handleToggleEvaluation(index)}
                                            disabled={isFiled}
                                            className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                                isFiled ? 'opacity-50 cursor-not-allowed' : ''
                                            } ${
                                                item.wasApplied
                                                    ? 'bg-red-500 border-red-500 scale-110'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-red-400'
                                            }`}
                                        >
                                            {item.wasApplied && (
                                                <span className="material-symbols-outlined text-white text-lg">
                                                    check
                                                </span>
                                            )}
                                        </button>

                                        {/* Conteúdo */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className={`text-base font-bold uppercase ${
                                                        item.wasApplied
                                                            ? 'text-red-700 dark:text-red-400'
                                                            : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                        {item.requirementDescription}
                                                    </h3>
                                                    {item.requirementCode && (
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            #{item.requirementCode}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Badge de Peso */}
                                                <span className={`text-sm font-black px-3 py-1.5 rounded-xl ${
                                                    item.wasApplied
                                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    {item.weight} {item.weight === 1 ? 'ponto' : 'pontos'}
                                                </span>
                                            </div>

                                            {/* Campo de Observação (só aparece quando marcado) */}
                                            {item.wasApplied && (
                                                <div className="mt-4 -mx-6 px-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <Textarea
                                                        placeholder="Descreva o problema observado (opcional)"
                                                        value={item.notes}
                                                        onChange={(e) => handleNotesChange(index, e.target.value)}
                                                        rows={3}
                                                        readOnly={isFiled}
                                                        className={isFiled ? 'opacity-70 cursor-not-allowed' : ''}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resumo e Ações */}
                {requirements.length > 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
                        {/* Resumo */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Requisitos não cumpridos
                                </p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    {appliedCount} <span className="text-sm font-normal text-slate-400">de {evaluations.length}</span>
                                </p>
                            </div>
                            <div className={`text-right px-6 py-4 rounded-2xl ${
                                totalScore > 0
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            }`}>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Pontuação Total
                                </p>
                                <p className={`text-3xl font-black ${
                                    totalScore > 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-green-600 dark:text-green-400'
                                }`}>
                                    {totalScore} {totalScore === 1 ? 'ponto' : 'pontos'}
                                </p>
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="secondary"
                                onClick={onBack}
                                className="flex-1 h-14"
                            >
                                {isFiled ? 'Voltar' : 'Cancelar'}
                            </Button>
                            {!isFiled && (
                                <Button
                                    onClick={handleSave}
                                    loading={saving}
                                    className="flex-1 h-14 text-lg font-black"
                                >
                                    SALVAR
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
