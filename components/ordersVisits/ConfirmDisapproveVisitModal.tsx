import React from 'react';
import { Card } from '../ui/Card';

interface ConfirmDisapproveVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isLoading?: boolean;
}

export const ConfirmDisapproveVisitModal: React.FC<ConfirmDisapproveVisitModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => onClose()}>
            <div onClick={e => e.stopPropagation()}>
                <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl rounded-[24px]! overflow-hidden border border-rose-100/50 dark:border-rose-900/20">
                    <div className="relative p-6 pt-10">
                        {/* Background Icon Decor */}
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-[0.05] dark:opacity-[0.1] pointer-events-none">
                            <span className="material-symbols-outlined text-[160px] text-rose-600">report</span>
                        </div>

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-20 h-20 rounded-[24px] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-6 ring-8 ring-rose-50/50 dark:ring-rose-500/5">
                                <span className="material-symbols-outlined text-rose-500 text-4xl">rule_folder</span>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                                Confirmar Rejeição
                            </h2>

                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-[280px]">
                                Esta visita possui <span className="text-rose-500">itens REJEITADOS</span>. Deseja confirmar a rejeição total da visita para ajustes?
                            </p>

                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-8" />

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[2px] text-sm rounded-2xl shadow-xl shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                            <span>Confirmar Rejeição</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="w-full py-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-black uppercase tracking-[2px] text-xs transition-all"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
