import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { DialogShell } from '../ui/DialogShell';
import { getBrazilDateTimeInputValue } from '../../utils/formatters';
import { validateVisitTimes } from '../../utils/visitTimes';
import type { OrderVisit } from '../../types';

interface EditVisitTimesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { startedAt: string; endedAt: string | null }) => Promise<void>;
    isLoading?: boolean;
    visit: Pick<OrderVisit, 'ovStartedAt' | 'ovEndedAt' | 'ovStatusId'>;
}

const toInput = (value?: string | null) => (value ? getBrazilDateTimeInputValue(value) : '');

export const EditVisitTimesModal: React.FC<EditVisitTimesModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    visit
}) => {
    const isClosed = Number(visit.ovStatusId) === 2;
    const initialStart = toInput(visit.ovStartedAt);
    const initialEnd = isClosed ? toInput(visit.ovEndedAt) : '';
    const [startedAt, setStartedAt] = useState(initialStart);
    const [endedAt, setEndedAt] = useState(initialEnd);

    useEffect(() => {
        if (isOpen) {
            setStartedAt(initialStart);
            setEndedAt(initialEnd);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, visit.ovStartedAt, visit.ovEndedAt, visit.ovStatusId]);

    if (!isOpen) return null;

    const hasChanges = startedAt !== initialStart || (isClosed && endedAt !== initialEnd);

    const handleSave = () => {
        const error = validateVisitTimes({
            startedAt,
            endedAt: isClosed ? endedAt : null,
            isClosed,
            nowInput: getBrazilDateTimeInputValue()
        });
        if (error) {
            toast.error(error);
            return;
        }
        void onConfirm({ startedAt, endedAt: isClosed ? endedAt : null });
    };

    const inputClass = 'w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
    const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-slate-400';

    return (
        <DialogShell label="Editar horários da visita" onClose={() => { if (!isLoading) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pad-safe-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl rounded-[16px]! p-6 border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">
                    Editar horários da visita
                </h2>
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-snug mb-6">
                    Use para registrar o horário real quando o líder esqueceu de iniciar ou encerrar. A situação da OS acompanha a mudança.
                </p>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className={labelClass} htmlFor="edit-visit-start">Data/hora de início</label>
                        <input
                            id="edit-visit-start"
                            aria-label="Data/hora de início"
                            type="datetime-local"
                            value={startedAt}
                            max={getBrazilDateTimeInputValue()}
                            onChange={(e) => setStartedAt(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {isClosed && (
                        <div className="space-y-2">
                            <label className={labelClass} htmlFor="edit-visit-end">Data/hora de fim</label>
                            <input
                                id="edit-visit-end"
                                aria-label="Data/hora de fim"
                                type="datetime-local"
                                value={endedAt}
                                min={startedAt || undefined}
                                max={getBrazilDateTimeInputValue()}
                                onChange={(e) => setEndedAt(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isLoading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </Card>
        </DialogShell>
    );
};
