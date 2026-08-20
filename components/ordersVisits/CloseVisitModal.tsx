import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { SuspendedReason, CauseReason } from '../../types';

interface CloseVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { statusId: number; suspendedReasonId?: number; causeReasonId: number; progress: number }) => Promise<void>;
    isLoading?: boolean;
    visit?: any; // To check signatures
}

export const CloseVisitModal: React.FC<CloseVisitModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    visit
}) => {
    const [statusType, setStatusType] = useState<'concluded' | 'suspended' | null>(null);
    const [suspendedReasonId, setSuspendedReasonId] = useState<string>('');
    const [causeReasonId, setCauseReasonId] = useState<string>('');
    const [progress, setProgress] = useState<number>(50); // Inicia no meio
    const [reasons, setReasons] = useState<SuspendedReason[]>([]);
    const [causeReasons, setCauseReasons] = useState<CauseReason[]>([]);
    const [loadingReasons, setLoadingReasons] = useState(false);

    useEffect(() => {
        if (isOpen && !statusType) {
            loadCauseReasons();
        }
    }, [isOpen, statusType]);

    useEffect(() => {
        if (isOpen && statusType === 'suspended') {
            loadReasons();
        }
    }, [isOpen, statusType]);

    useEffect(() => {
        if (!isOpen) {
            setStatusType(null);
            setSuspendedReasonId('');
            setCauseReasonId('');
            setProgress(50);
        }
    }, [isOpen]);

    const loadReasons = async () => {
        setLoadingReasons(true);
        try {
            const data = await dataService.getSuspendedReasons();
            setReasons(data);
        } catch (error) {
            console.error('Failed to load reasons', error);
            toast.error('Erro ao carregar motivos');
        } finally {
            setLoadingReasons(false);
        }
    };

    const loadCauseReasons = async () => {
        try {
            const data = await dataService.getOrderCauseReasons();
            setCauseReasons(data);
        } catch (error) {
            console.error('Failed to load cause reasons', error);
            toast.error('Erro ao carregar causas');
        }
    };

    const handleConfirm = () => {
        if (!statusType) return;

        if (!causeReasonId) {
            toast.error('Selecione a causa da OS');
            return;
        }

        if (statusType === 'concluded') {
            onConfirm({
                statusId: 8, // Concluida
                causeReasonId: Number(causeReasonId),
                progress: 100
            });
        } else {
            if (!suspendedReasonId) {
                toast.error('Selecione um motivo de suspensão');
                return;
            }
            if (progress <= 0 || progress >= 100) {
                toast.error('Progresso deve ser entre 1 e 99 para suspensão');
                return;
            }
            onConfirm({
                statusId: 6, // Suspensa
                suspendedReasonId: Number(suspendedReasonId),
                causeReasonId: Number(causeReasonId),
                progress: Number(progress)
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl rounded-[16px]! p-6 border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">
                    Encerrar Visita
                </h2>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-bold mb-3 uppercase tracking-widest">
                    Informe a situação da OS
                </p>

                <div className="space-y-6">
                    {/* Status Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setStatusType('suspended')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${statusType === 'suspended'
                                ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10'
                                : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-3xl">pause_circle</span>
                            <span className="font-bold uppercase text-xs tracking-widest">Suspensa</span>
                        </button>

                        <button
                            onClick={() => setStatusType('concluded')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${statusType === 'concluded'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                                : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                            <span className="font-bold uppercase text-xs tracking-widest">Concluída</span>
                        </button>
                    </div>

                    {/* Signature Status Summary (Optional Reminder) */}
                    {statusType === 'concluded' && visit && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-3 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assinaturas Coletadas</h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] ${visit.ovSignatureLeaderPath ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {visit.ovSignatureLeaderPath ? 'check_circle' : 'pending'}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Líder da Equipe</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${visit.ovSignatureLeaderPath ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {visit.ovSignatureLeaderPath ? 'OK' : 'PENDENTE'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] ${visit.ovSignatureRequesterPath ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {visit.ovSignatureRequesterPath ? 'check_circle' : 'pending'}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Requisitante</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${visit.ovSignatureRequesterPath ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {visit.ovSignatureRequesterPath ? 'OK' : 'PENDENTE'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {statusType === 'suspended' && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div>
                                {loadingReasons ? (
                                    <div className="text-center p-2 text-slate-400 text-sm">Carregando motivos...</div>
                                ) : (
                                    <Select
                                        label="Motivo da Suspensão"
                                        required
                                        value={suspendedReasonId}
                                        onChange={(e) => setSuspendedReasonId(e.target.value)}
                                        options={reasons.map(r => ({ value: String(r.id), label: r.description }))}
                                        placeholder="Selecione um motivo..."
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Progresso da OS (%)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="99"
                                        value={progress}
                                        onChange={(e) => setProgress(Number(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                                    />
                                    <span className="font-black text-indigo-600 w-12 text-right">{progress}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Causa da OS */}
                    {statusType && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                            <Select
                                label="Causa da OS"
                                required
                                value={causeReasonId}
                                onChange={(e) => setCauseReasonId(e.target.value)}
                                options={causeReasons.map(r => ({ value: String(r.id), label: r.description }))}
                                placeholder="Selecione a causa..."
                            />
                        </div>
                    )}

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!statusType || isLoading}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
