import React, { useState } from 'react';
import { OrderVisit } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { isFinancialApprovalEnabled, VISIT_COSTS_STATUS_CONFIG, type VisitCostsStatus } from '../../features';
import { dataService } from '../../services/dataService';
import { OrderVisitFinancialStatus } from '../../components/ordersVisits/OrderVisitFinancialStatus';

interface OrderVisitFinancialDetailProps {
    visit: OrderVisit;
    onVisitUpdated?: () => void;
    /** Indica se o usuário atual pode aprovar financeiramente (contratante/gestor do contrato) */
    isApprover?: boolean;
}

export const OrderVisitFinancialDetail: React.FC<OrderVisitFinancialDetailProps> = ({ visit, onVisitUpdated, isApprover = false }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const items = [
        {
            label: 'Serviços',
            value: visit.servicesValue || 0,
            icon: 'construction',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10'
        },
        {
            label: 'Materiais',
            value: visit.materialsValue || 0,
            icon: 'inventory_2',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            label: 'Transporte',
            value: visit.vehiclesValue || 0,
            icon: 'local_shipping',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10'
        }
    ];

    const costsStatus = (visit as any).ov_costs_status as VisitCostsStatus | null;
    // Quem envia custos (contratada): visita aprovada tecnicamente e custos ainda não enviados
    const canSubmitCosts = isFinancialApprovalEnabled() && 
                           visit.ovProcessingId === 5 && 
                           (!costsStatus || costsStatus === 'pending' || costsStatus === 'rejected');
    // Quem já enviou e está aguardando a aprovação da contratante (não é aprovador)
    const isAwaitingApproval = isFinancialApprovalEnabled() && 
                               costsStatus === 'submitted' &&
                               !isApprover;
    // Quem pode aprovar financeiramente (contratante): custos enviados
    const canApproveFinancial = isFinancialApprovalEnabled() && 
                                costsStatus === 'submitted' &&
                                isApprover;

    const handleSubmitCosts = async () => {
        if (!visit.id) return;
        
        setIsLoading(true);
        try {
            await dataService.submitVisitCosts(visit.id, visit.ovCreatedUserId || '');
            onVisitUpdated?.();
        } catch (error: any) {
            console.error('Error submitting costs:', error);
            const msg = error?.message || error?.details || JSON.stringify(error);
            alert(`Erro ao enviar custos: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveFinancial = async () => {
        if (!visit.id) return;
        
        setIsLoading(true);
        try {
            await dataService.approveVisitFinancial(visit.id, visit.ovCreatedUserId || '');
            onVisitUpdated?.();
        } catch (error) {
            console.error('Error approving financial:', error);
            alert('Erro ao aprovar financeiramente. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectFinancial = async () => {
        if (!visit.id || !rejectionReason.trim()) return;
        
        setIsLoading(true);
        try {
            await dataService.rejectVisitFinancial(visit.id, visit.ovCreatedUserId || '', rejectionReason);
            setShowRejectModal(false);
            setRejectionReason('');
            onVisitUpdated?.();
        } catch (error) {
            console.error('Error rejecting financial:', error);
            alert('Erro ao rejeitar custos. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Total Highlight */}
            <div className="bg-slate-900 dark:bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <p className="text-indigo-200 dark:text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        Total Geral da Visita
                    </p>
                    <h2 className="text-4xl font-black mb-1">
                        {formatCurrency(visit.totalValue || 0)}
                    </h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full mt-4 backdrop-blur-md">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Valores calculados automaticamente</span>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -ml-16 -mb-16 blur-3xl" />
            </div>

            {/* Financial Status (Feature Flag) */}
            {isFinancialApprovalEnabled() && costsStatus && (
                <OrderVisitFinancialStatus
                    costsStatus={costsStatus}
                    submittedAt={(visit as any).ov_costs_submitted_at}
                    approvedAt={(visit as any).ov_costs_approved_at}
                    rejectedAt={(visit as any).ov_costs_rejected_at}
                    rejectionReason={(visit as any).ov_costs_rejection_reason}
                />
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-900 rounded-2xl px-6 border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm h-[80px]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`${item.bgColor} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-0.5">
                                    {item.label}
                                </p>
                                <p className="text-slate-900 dark:text-white text-lg font-black">
                                    {formatCurrency(item.value)}
                                </p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined ${item.color} opacity-20 text-4xl`}>
                            {item.icon}
                        </span>
                    </div>
                ))}
            </div>

            {/* Financial Approval Actions (Feature Flag) */}
            {isFinancialApprovalEnabled() && (canSubmitCosts || canApproveFinancial || isAwaitingApproval) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                        Aprovação Financeira
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                        {isAwaitingApproval && (
                            <button
                                disabled
                                className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg animate-pulse">hourglass_top</span>
                                Aguardando Aprovação
                            </button>
                        )}

                        {canSubmitCosts && (
                            <button
                                onClick={handleSubmitCosts}
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors"
                            >
                                {isLoading ? 'Enviando...' : 'Enviar para Aprovação'}
                            </button>
                        )}
                        
                        {canApproveFinancial && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApproveFinancial}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-colors"
                                >
                                    {isLoading ? 'Processando...' : 'Aprovar'}
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-colors"
                                >
                                    Rejeitar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Message */}
            <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl p-4 flex gap-4 items-start border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <p className="text-indigo-900/70 dark:text-indigo-200/50 text-[13px] font-medium leading-relaxed">
                    Os valores acima representam o consolidado de todos os lançamentos realizados nesta visita.
                    Para detalhes, consulte as abas de <strong>Serviços</strong> e <strong>Transporte</strong>.
                </p>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Motivo da Rejeição
                        </h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Descreva o motivo da rejeição dos custos..."
                            className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRejectFinancial}
                                disabled={!rejectionReason.trim() || isLoading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-colors"
                            >
                                {isLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
