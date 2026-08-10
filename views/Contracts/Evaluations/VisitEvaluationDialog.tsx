import React, { useState, useEffect } from 'react';
import { ContractEvaluationRequirement, OrderVisitEvaluation } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Textarea';
import { Loading } from '../../../components/ui/Loading';

interface VisitEvaluationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ovId: string;
    contractId: string;
    userId: string;
    mode: 'rejection' | 'approval';
    onSaved?: () => void;
}

interface EvaluationItem {
    contractEvaluationId: string;
    requirementDescription: string;
    requirementCode?: string;
    weight: number;
    wasApplied: boolean;
    notes: string;
}

export const VisitEvaluationDialog: React.FC<VisitEvaluationDialogProps> = ({
    isOpen,
    onClose,
    ovId,
    contractId,
    userId,
    mode,
    onSaved
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [requirements, setRequirements] = useState<ContractEvaluationRequirement[]>([]);
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [existingEvaluations, setExistingEvaluations] = useState<OrderVisitEvaluation[]>([]);

    useEffect(() => {
        if (isOpen && contractId) {
            loadRequirements();
        }
    }, [isOpen, contractId]);

    useEffect(() => {
        if (isOpen && ovId) {
            loadExistingEvaluations();
        }
    }, [isOpen, ovId]);

    const loadRequirements = async () => {
        try {
            setLoading(true);
            const data = await dataService.getContractEvaluationRequirements(contractId);
            setRequirements(data);
        } catch (error) {
            console.error('Error loading requirements:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExistingEvaluations = async () => {
        try {
            const data = await dataService.getVisitEvaluations(ovId);
            setExistingEvaluations(data);
        } catch (error) {
            console.error('Error loading existing evaluations:', error);
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
        try {
            setSaving(true);
            await dataService.saveVisitEvaluations(
                ovId,
                evaluations.map(e => ({
                    contractEvaluationId: e.contractEvaluationId,
                    wasApplied: e.wasApplied,
                    notes: e.notes,
                })),
                userId
            );
            toast.success('Avaliações salvas com sucesso');

            // Recalcular score do líder se a visita estiver encerrada
            try {
                const visitData = await dataService.getOrderVisitById(ovId);
                if (visitData?.ovStatusId === 2 && visitData?.ovTeamLeadId && visitData?.ovEndedAt) {
                    const endDate = new Date(visitData.ovEndedAt);
                    const year = endDate.getFullYear();
                    const month = endDate.getMonth() + 1;
                    dataService.recalculateLeaderScore(visitData.ovTeamLeadId, year, month).catch(() => {});
                }
            } catch (_) {
                // Erro silencioso - recálculo é opcional
            }

            onSaved?.();
            onClose();
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

    const title = mode === 'rejection' ? 'Avaliar na Rejeição' : 'Avaliar na Aprovação';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="md"
        >
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loading size="sm" />
                </div>
            ) : requirements.length === 0 ? (
                <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                        rate_review
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Nenhum requisito vinculado a este contrato
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {mode === 'rejection'
                            ? 'Marque os requisitos que NÃO foram cumpridos. Eles receberão a penalidade definida.'
                            : 'Revise os requisitos marcados. Você pode desmarcar penalidades da rejeição anterior.'}
                    </p>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {evaluations.map((item, index) => (
                            <div
                                key={item.contractEvaluationId}
                                className={`p-4 rounded-xl border transition-all ${
                                    item.wasApplied
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-800'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleEvaluation(index)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    item.wasApplied
                                                        ? 'bg-red-500 border-red-500'
                                                        : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                            >
                                                {item.wasApplied && (
                                                    <span className="material-symbols-outlined text-white text-sm">
                                                        check
                                                    </span>
                                                )}
                                            </button>
                                            <span className={`text-sm font-bold uppercase ${
                                                item.wasApplied
                                                    ? 'text-red-700 dark:text-red-400'
                                                    : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {item.requirementDescription}
                                            </span>
                                        </div>
                                        {item.requirementCode && (
                                            <span className="text-[10px] text-slate-400 font-mono ml-7">
                                                #{item.requirementCode}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        item.wasApplied
                                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        {item.weight} ptos
                                    </span>
                                </div>

                                {item.wasApplied && (
                                    <div className="mt-3 ml-7">
                                        <Textarea
                                            placeholder="Observação (opcional)"
                                            value={item.notes}
                                            onChange={(e) => handleNotesChange(index, e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className={`p-4 rounded-xl ${
                        totalScore < 0
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                Pontuação Total:
                            </span>
                            <span className={`text-lg font-black ${
                                totalScore < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                            }`}>
                                {totalScore} ptos
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {evaluations.filter(e => e.wasApplied).length} de {evaluations.length} requisitos não cumpridos
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            className="flex-1"
                        >
                            Salvar Avaliação
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
