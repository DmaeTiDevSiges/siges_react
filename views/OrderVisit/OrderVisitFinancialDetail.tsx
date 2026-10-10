import React, { useState, useEffect } from 'react';
import { OrderVisit, User } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { isFinancialApprovalEnabled, isVehicleRentalEnabled, type VisitCostsStatus } from '../../features';
import { dataService } from '../../services/dataService';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

interface OrderVisitFinancialDetailProps {
    visit: OrderVisit;
    onVisitUpdated?: () => void;
    /** Indica se o usuário atual pode aprovar financeiramente (contratante/gestor do contrato) */
    isApprover?: boolean;
    currentUser?: User | null;
}

export const OrderVisitFinancialDetail: React.FC<OrderVisitFinancialDetailProps> = ({ visit, onVisitUpdated, isApprover = false, currentUser }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showZeroCostModal, setShowZeroCostModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const costsStatus = visit.ovCostsStatus as VisitCostsStatus | null;

    // Subdivisão do card Transporte: Km (odômetro) × Rateio R$/km ×
    // Rateio de Aluguel × Rateio de Despesas. A soma total continua
    // vindo de visit.vehiclesValue.
    const [transportSplit, setTransportSplit] = useState<{ km: number; rate: number; rental: number; variable: number } | null>(null);

    useEffect(() => {
        if (!isVehicleRentalEnabled() || !visit.id) {
            setTransportSplit(null);
            return;
        }
        let cancelled = false;
        dataService.getOrderVisitVehicles(visit.id)
            .then(rows => {
                if (cancelled) return;
                const km = rows
                    .filter(r => r.costType === 'odometer')
                    .reduce((sum, r) => sum + (r.valueTotal || 0), 0);
                // Linha de Km convertida para o componente R$/km
                const rate = rows
                    .filter(r => r.costType === 'rate')
                    .reduce((sum, r) => sum + (r.valueTotal || 0), 0);
                const rental = rows
                    .filter(r => r.costType === 'rental')
                    .reduce((sum, r) => sum + (r.valueTotal || 0), 0);
                const variable = rows
                    .filter(r => r.costType === 'variable')
                    .reduce((sum, r) => sum + (r.valueTotal || 0), 0);
                setTransportSplit({ km, rate, rental, variable });
            })
            .catch(error => {
                console.error('Error loading transport split:', error);
            });
        return () => { cancelled = true; };
    }, [visit.id, visit.vehiclesValue]);

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

    // Quem envia custos (contratada): visita aprovada tecnicamente e custos ainda não enviados ou rejeitados
    // Botão "Enviar/Reenviar para Aprovação" aparece quando costsStatus é null, pending ou rejected
    const canSubmitCosts = isFinancialApprovalEnabled() && 
                            visit.ovProcessingId === 5 && 
                            (costsStatus === null || costsStatus === 'pending' || costsStatus === 'rejected');
    // Quem já enviou e está aguardando a aprovação da contratante (não é aprovador)
    const isAwaitingApproval = isFinancialApprovalEnabled() && 
                                costsStatus === 'waiting' &&
                                !isApprover;
    // Quem pode aprovar financeiramente (contratante): apenas quando waiting
    const canApproveFinancial = isFinancialApprovalEnabled() && 
                                costsStatus === 'waiting' &&
                                isApprover;

    const totalValue = (visit.servicesValue || 0) + (visit.materialsValue || 0) + (visit.vehiclesValue || 0);
    const isRejected = isFinancialApprovalEnabled() && costsStatus === 'rejected';

    const handleSubmitCosts = async () => {
        if (!visit.id) return;
        
        // Sempre abre modal de confirmação
        setShowZeroCostModal(true);
    };

    const confirmSubmitCosts = async () => {
        if (!visit.id || !currentUser?.id) return;
        
        setShowZeroCostModal(false);
        setIsLoading(true);
        try {
            await dataService.submitVisitCosts(visit.id, currentUser.id);
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
        if (!visit.id || !currentUser?.id) return;
        
        setIsLoading(true);
        try {
            await dataService.approveVisitFinancial(visit.id, currentUser.id);
            onVisitUpdated?.();
        } catch (error) {
            console.error('Error approving financial:', error);
            alert('Erro ao aprovar financeiramente. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectFinancial = async () => {
        if (!visit.id || !rejectionReason.trim() || !currentUser?.id) return;
        
        setIsLoading(true);
        try {
            await dataService.rejectVisitFinancial(visit.id, currentUser.id, rejectionReason);
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
            <div className={`rounded-2xl p-8 text-white shadow-xl relative overflow-hidden transition-all duration-300 ${
                isRejected
                    ? 'bg-red-600 dark:bg-red-600 shadow-red-600/30'
                    : 'bg-slate-900 dark:bg-indigo-600 shadow-indigo-500/20'
            }`}>
                <div className="relative z-10 text-center">
                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${
                        isRejected ? 'text-red-100' : 'text-indigo-200 dark:text-indigo-100'
                    }`}>
                        Total Geral da Visita
                    </p>
                    <h2 className="text-4xl font-black mb-4">
                        {formatCurrency(visit.totalValue || 0)}
                    </h2>

                    {isFinancialApprovalEnabled() && canSubmitCosts && (
                        <button
                            onClick={handleSubmitCosts}
                            disabled={isLoading}
                            className={`w-full px-4 py-3 font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm mt-2 ${
                                isRejected
                                    ? 'bg-white text-red-600 hover:bg-red-50 disabled:bg-white/50'
                                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
                            }`}
                        >
                            {isLoading ? 'Enviando...' : (costsStatus === 'rejected' ? 'Reenviar para Aprovação' : 'Enviar para Aprovação')}
                        </button>
                    )}

                    {isAwaitingApproval && (
                        <button
                            disabled
                            className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg animate-pulse">hourglass_top</span>
                            Aguardando Aprovação
                        </button>
                    )}

                    {canApproveFinancial && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-colors"
                            >
                                REJEITAR
                            </button>
                            <button
                                onClick={handleApproveFinancial}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-colors"
                            >
                                {isLoading ? 'Processando...' : 'APROVAR'}
                            </button>
                        </div>
                    )}

                    {isFinancialApprovalEnabled() && costsStatus === 'approved' && visit.ovCostsApprovedAt && (
                        <p className="text-indigo-200 dark:text-indigo-100 text-xs font-medium mt-2">
                            Aprovado por {visit.ovCostsApprovedUserNameShort || '...'} em {new Date(visit.ovCostsApprovedAt).toLocaleDateString('pt-BR')} {new Date(visit.ovCostsApprovedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                        </p>
                    )}

                    {isRejected && (
                        <div className="mt-4 flex flex-col items-center gap-2.5">
                            {visit.ovCostsRejectionReason && (
                                <div className="w-full bg-black/20 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-left">
                                    <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-black uppercase tracking-wider mb-1">
                                        <span className="material-symbols-outlined text-[16px]">error</span>
                                        <span>Motivo da Rejeição:</span>
                                    </div>
                                    <p className="text-sm font-semibold text-white leading-relaxed break-words">
                                        {visit.ovCostsRejectionReason}
                                    </p>
                                </div>
                            )}
                            {visit.ovCostsRejectedAt && (
                                <p className="text-white/80 text-xs font-medium">
                                    Rejeitado por <span className="font-bold">{visit.ovCostsRejectedUserNameShort || '...'}</span> em {new Date(visit.ovCostsRejectedAt).toLocaleDateString('pt-BR')} {new Date(visit.ovCostsRejectedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full -ml-16 -mb-16 blur-3xl ${
                    isRejected ? 'bg-red-400/20' : 'bg-indigo-500/20'
                }`} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => {
                    // Subdivisão Km × Rateio R$/km × Rateio Aluguel × Despesas,
                    // exibida abaixo do valor em fontes menores
                    const splitLines = item.label === 'Transporte' && transportSplit
                        ? [
                            { label: 'Km', value: transportSplit.km, cls: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
                            { label: 'Rateio R$/km', value: transportSplit.rate, cls: 'text-blue-500 dark:text-blue-400', dot: 'bg-blue-500' },
                            { label: 'Rateio Aluguel', value: transportSplit.rental, cls: 'text-indigo-500 dark:text-indigo-400', dot: 'bg-indigo-500' },
                            { label: 'Rateio Despesas', value: transportSplit.variable, cls: 'text-amber-500 dark:text-amber-400', dot: 'bg-amber-500' }
                        ].filter(line => line.value > 0)
                        : [];
                    const hasSplit = splitLines.length > 0;
                    return (
                        <div
                            key={index}
                            className={`bg-white dark:bg-slate-900 rounded-2xl px-6 border border-slate-100 dark:border-white/5 flex items-center shadow-sm ${hasSplit ? 'min-h-[80px] py-3' : 'h-[80px]'
                                }`}
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

                                    {hasSplit && (
                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                            {splitLines.map(line => (
                                                <p
                                                    key={line.label}
                                                    className={`flex items-center gap-1.5 text-[10px] font-bold ${line.cls}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${line.dot}`} />
                                                    {line.label} · {formatCurrency(line.value)}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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

            {/* Submit Costs Confirmation Modal */}
            <Modal
                isOpen={showZeroCostModal}
                onClose={() => setShowZeroCostModal(false)}
                title={costsStatus === 'rejected' ? 'Reenviar para Aprovação' : 'Enviar para Aprovação'}
                maxWidth="sm"
                draggable
            >
                <div className="flex flex-col gap-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-500">send</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {costsStatus === 'rejected'
                                ? 'Confirma o reenvio dos custos corrigidos desta visita para aprovação financeira?'
                                : 'Confirma o envio dos custos desta visita para aprovação financeira?'}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Total</span>
                        <p className="text-slate-900 dark:text-white font-black text-2xl">
                            {formatCurrency(totalValue)}
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => setShowZeroCostModal(false)}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmSubmitCosts}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors text-sm shadow-md"
                        >
                            {isLoading ? 'Enviando...' : (costsStatus === 'rejected' ? 'Confirmar Reenvio' : 'Confirmar Envio')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                }}
                title="Motivo da Rejeição"
                maxWidth="sm"
                type="error"
                draggable
            >
                <div className="flex flex-col gap-4 py-2">
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] uppercase font-black text-red-500 dark:text-red-400 tracking-widest mb-1">Atenção</p>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            Informe detalhadamente o motivo pelo qual os custos desta visita estão sendo rejeitados.
                        </p>
                    </div>

                    <Textarea
                        label="Justificativa da Rejeição"
                        placeholder="Descreva o motivo da rejeição dos custos..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        required
                        disabled={isLoading}
                    />

                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => {
                                setShowRejectModal(false);
                                setRejectionReason('');
                            }}
                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleRejectFinancial}
                            disabled={!rejectionReason.trim() || isLoading}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm"
                        >
                            {isLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
