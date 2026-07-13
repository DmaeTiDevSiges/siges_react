import React, { useState, useEffect, useRef } from 'react';
import { OrderRequestForm, OrderRequestFormRef } from './OrderRequestForm';
import { CauseReason, Order, OrderVisit, SuspendedReason } from '../../types';
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
    const [causeReasons, setCauseReasons] = useState<CauseReason[]>([]);
    const formRef = useRef<OrderRequestFormRef>(null);

    // Approval State
    const [formData, setFormData] = useState({
        statusId: visit?.ovOStatusId ? String(visit.ovOStatusId) : (initialData?.statusId ? String(initialData.statusId) : '8'),
        progress: visit?.progress !== undefined ? visit.progress : (initialData?.progress ? parseInt(String(initialData.progress).replace('%', '')) : 100),
        suspendedReasonId: visit?.ovOSuspendedReasonId ? String(visit.ovOSuspendedReasonId) : '',
        causeReasonId: initialData?.causeReasonId ? String(initialData.causeReasonId) : ''
    });

    useEffect(() => {
        const loadReasons = async () => {
            try {
                const [reasons, causes] = await Promise.all([
                    dataService.getSuspendedReasons(),
                    dataService.getOrderCauseReasons()
                ]);
                setSuspendedReasons(reasons);
                setCauseReasons(causes);
            } catch (err) {
                console.error("Error loading approval reasons", err);
            }
        };
        loadReasons();
    }, []);

    const handleConfirmApproval = async () => {
        if (formData.statusId === '6' && !formData.suspendedReasonId) {
            toast.error("Selecione o motivo da suspensão");
            return;
        }

        if (!formData.causeReasonId) {
            toast.error("Selecione a causa da OS");
            return;
        }

        setIsLoading(true);
        try {
            if (formRef.current) {
                const success = await formRef.current.submit();
                if (!success) {
                    setIsLoading(false);
                    return;
                }
            } else {
                if (onSubmit) {
                    await onSubmit({
                        ...formData,
                    });
                }
            }
        } catch (error) {
            console.error("Error approving", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] relative">
            <div
                className="flex-1 overflow-y-auto no-scrollbar"
            >
                <OrderRequestForm
                    ref={formRef}
                    onBack={onBack}
                    onSubmit={async () => {
                        if (onSubmit) {
                            await onSubmit({
                                ...formData,
                            });
                        }
                    }}
                    initialData={initialData}
                    mode="edit"
                    showCardHeader={true}
                    hideFooter={true}
                />

                <div className="px-4 space-y-4 mt-4">
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

                    <Select
                        label="Causa da OS"
                        required
                        value={formData.causeReasonId}
                        onChange={(e) => setFormData(prev => ({ ...prev, causeReasonId: e.target.value }))}
                        options={causeReasons.map(r => ({ value: String(r.id), label: r.description }))}
                        placeholder="Selecione a causa..."
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

                    <div className="pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        <Button
                            onClick={handleConfirmApproval}
                            loading={isLoading}
                            variant="primary"
                            fullWidth
                        >
                            CONFIRMAR APROVAÇÃO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
