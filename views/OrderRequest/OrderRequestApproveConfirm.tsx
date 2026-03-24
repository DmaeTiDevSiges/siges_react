import React, { useState, useEffect, useRef } from 'react';
import { OrderRequestForm } from './OrderRequestForm';
import { Order, OrderVisit, SuspendedReason } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { toast } from 'sonner';

interface OrderRequestApproveConfirmProps {
    onBack: () => void;
    onSubmit?: (data: any) => void;
    initialData?: Partial<Order>;
    visit?: OrderVisit;
}

export const OrderRequestApproveConfirm: React.FC<OrderRequestApproveConfirmProps> = ({ onBack, onSubmit, initialData, visit }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suspendedReasons, setSuspendedReasons] = useState<SuspendedReason[]>([]);

    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Approval State
    const [formData, setFormData] = useState({
        statusId: visit?.ovOStatusId ? String(visit.ovOStatusId) : (initialData?.statusId ? String(initialData.statusId) : '8'),
        progress: visit?.progress !== undefined ? visit.progress : (initialData?.progress ? parseInt(String(initialData.progress).replace('%', '')) : 100),
        suspendedReasonId: visit?.ovOSuspendedReasonId ? String(visit.ovOSuspendedReasonId) : (initialData?.causeReasonId ? String(initialData.causeReasonId) : '')
    });

    useEffect(() => {
        const loadReasons = async () => {
            try {
                const reasons = await dataService.getSuspendedReasons();
                setSuspendedReasons(reasons);
            } catch (err) {
                console.error("Error loading suspension reasons", err);
            }
        };
        loadReasons();
    }, []);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px buffer

        if (isAtBottom && !hasReadToBottom) {
            setHasReadToBottom(true);
        }
    };

    const handleConfirmApproval = async () => {
        if (formData.statusId === '6' && !formData.suspendedReasonId) {
            toast.error("Selecione o motivo da suspensão");
            return;
        }

        setIsLoading(true);
        try {
            if (onSubmit) {
                await onSubmit({
                    ...formData,
                });
            }
        } catch (error) {
            console.error("Error approving", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] relative">
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto no-scrollbar pb-32"
            >
                <OrderRequestForm
                    onBack={onBack}
                    initialData={initialData}
                    mode="edit"
                    showCardHeader={true}
                    hideFooter={true}
                />

                <div className="px-4 space-y-4 mt-4 pb-32">
                    <Select
                        label="Situação"
                        required
                        value={formData.statusId}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                statusId: newStatus,
                                progress: newStatus === '8' ? 100 : (prev.progress === 100 ? 50 : prev.progress)
                            }));
                        }}
                        options={[
                            { value: '8', label: 'Concluída' },
                            { value: '6', label: 'Suspensa' }
                        ]}
                    />

                    {formData.statusId === '6' && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <Select
                                label="Motivo da Suspensão"
                                required
                                value={formData.suspendedReasonId}
                                onChange={(e) => setFormData(prev => ({ ...prev, suspendedReasonId: e.target.value }))}
                                options={suspendedReasons.map(r => ({ value: String(r.id), label: r.description }))}
                                placeholder="Selecione o motivo..."
                            />
                        </div>
                    )}

                    {formData.statusId !== '8' && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Progresso
                                </label>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {formData.progress}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={formData.progress}
                                onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:accent-indigo-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50 dark:bg-[#0f172a] z-100 border-none">
                <div className="flex max-w-lg mx-auto w-full">
                    <Button
                        onClick={handleConfirmApproval}
                        loading={isLoading}
                        disabled={!hasReadToBottom}
                        className={`w-full ${hasReadToBottom ? 'bg-primary hover:bg-primary/90' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'} text-white uppercase tracking-widest font-black text-xs h-12 shadow-none border-none`}
                    >
                        {hasReadToBottom ? 'CONFIRMAR APROVAÇÃO' : 'ROLE ATÉ O FINAL'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
