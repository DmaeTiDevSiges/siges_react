import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { dataService } from '../../../services/dataService';
import { Order } from '../../../types';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onSuccess?: () => void;
}

/**
 * Modal to handle order cancellation with reason and metadata
 */
export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    isOpen,
    onClose,
    order,
    onSuccess
}) => {
    const { currentUser } = useAuth();
    const [reasons, setReasons] = useState<any[]>([]);
    const [selectedReasonId, setSelectedReasonId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingVisits, setIsCheckingVisits] = useState(false);
    const [canCancel, setCanCancel] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadReasons();
            checkVisits();
            setSelectedReasonId('');
        }
    }, [isOpen, order]);

    const loadReasons = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getCancelReasons();
            setReasons(data);
        } catch (error) {
            console.error('Error loading cancel reasons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkVisits = async () => {
        // Business Rule: Can only cancel OS (Status 3 or 4) if it has no active visits
        if (order.statusId === 3 || order.statusId === 4) {
            setIsCheckingVisits(true);
            try {
                const hasVisits = await dataService.hasActiveVisits(order.id);
                setCanCancel(!hasVisits);
            } catch (error) {
                console.error('Error checking visits:', error);
                setCanCancel(true);
            } finally {
                setIsCheckingVisits(false);
            }
        } else {
            setCanCancel(true);
        }
    };

    const handleConfirm = async () => {
        if (!selectedReasonId) {
            toast.error('Por favor, selecione o motivo do cancelamento');
            return;
        }

        if (!currentUser) {
            toast.error('Usuário não autenticado');
            return;
        }

        setIsSaving(true);
        try {
            await dataService.cancelOrder(
                order.id,
                selectedReasonId,
                currentUser.id,
                currentUser.teamId || ''
            );
            toast.success('Serviço cancelado com sucesso');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Erro ao cancelar serviço');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Cancelar OS"
            maxWidth="sm"
            type="error"
        >
            <div className="flex flex-col gap-6 py-2">
                <div className="w-full bg-[#3B82F6] rounded-2xl p-6 shadow-lg shadow-blue-500/30 flex flex-col justify-center">
                    <h3 className="text-4xl font-bold text-white tracking-tight mb-3">{order.orderMask}</h3>
                    <div className="flex items-end justify-between w-full">
                        <span className="text-white/90 text-[11px] font-bold uppercase tracking-wider">
                            OS {[order.typeCode, order.typeSubCode, order.objectCode].filter(Boolean).join('/')}
                        </span>
                        <span className="text-white text-[11px] font-bold uppercase tracking-wider">
                            {order.priorityCode}
                        </span>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <p className="text-[10px] uppercase font-black text-red-500 dark:text-red-400 tracking-widest mb-1">Atenção</p>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {order.parentId
                            ? `Você está cancelando a OS ${order.orderMask}.`
                            : `Você está cancelando a SS ${order.orderMask}.`
                        } Esta ação não pode ser desfeita.
                    </p>
                </div>

                {!canCancel && !isCheckingVisits && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex gap-3 items-start transform animate-in slide-in-from-top-2 duration-300">
                        <span className="material-symbols-outlined text-amber-500 shrink-0">warning</span>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-tight">
                            Não é possível cancelar uma ordem que possui visitas ativas (is_deleted = false).
                        </p>
                    </div>
                )}

                <Select
                    label="Motivo do Cancelamento"
                    options={reasons.map(r => ({ value: r.id.toString(), label: r.description }))}
                    value={selectedReasonId}
                    onChange={(e) => setSelectedReasonId(e.target.value)}
                    placeholder="Selecione um motivo..."
                    disabled={!canCancel || isSaving || isLoading || isCheckingVisits}
                    required
                    leftIcon={<span className="material-symbols-outlined text-[20px]">report_problem</span>}
                />

                <div className="flex flex-col gap-3 mt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={!canCancel || isSaving || isLoading || isCheckingVisits || !selectedReasonId}
                        className={`
                            w-full py-4 rounded-2xl bg-red-500 text-white font-bold transition-all shadow-lg active:scale-95
                            ${(!canCancel || isSaving || isLoading || isCheckingVisits || !selectedReasonId) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-red-600'}
                        `}
                    >
                        {isSaving ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </button>

                </div>
            </div>
        </Modal>
    );
};
