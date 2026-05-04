import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { dataService } from '../../../services/dataService';
import { Order } from '../../../types';
import { toast } from 'sonner';

interface ScheduleOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onSuccess?: () => void;
}

export const ScheduleOrderModal: React.FC<ScheduleOrderModalProps> = ({
    isOpen,
    onClose,
    order,
    onSuccess
}) => {
    const [scheduledAt, setScheduledAt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // If already has a date, pre-fill it (need to format for datetime-local)
            if (order.requestedAt) {
                try {
                    const date = new Date(order.requestedAt);
                    // Adjust to local time before formatting
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    setScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`);
                } catch (e) {
                    setScheduledAt('');
                }
            } else {
                setScheduledAt('');
            }
        }
    }, [isOpen, order]);

    const handleConfirm = async () => {
        if (!scheduledAt) {
            toast.error('Por favor, selecione a data e hora');
            return;
        }

        setIsSaving(true);
        try {
            // Use the local datetime-local string (YYYY-MM-DDTHH:mm) directly.
            // We append :00 for seconds to match the database format standard.
            const localDateTime = scheduledAt.length === 16 ? `${scheduledAt}:00` : scheduledAt;
            await dataService.scheduleOrder(order.id, localDateTime);

            toast.success(order.statusId === 4 ? 'OS reagendada com sucesso' : 'OS agendada com sucesso');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error scheduling order:', error);
            toast.error('Erro ao agendar ordem');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={order.statusId === 4 ? "REAGENDAMENTO OS" : "AGENDAMENTO OS"}
            maxWidth="sm"
        >
            <div className="flex flex-col gap-6 py-2">
                <div className="bg-blue-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                    <h2 className="text-3xl font-black text-white tracking-tight mb-1">{order.orderMask}</h2>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
                            OS {order.typeCode}/{order.typeSubCode}/{order.objectCode}
                        </span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {order.priorityCode}
                        </span>
                    </div>
                </div>

                <Input
                    type="datetime-local"
                    label="Data e Hora Agendada"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    leftIcon={<span className="material-symbols-outlined text-[20px] text-slate-400">calendar_month</span>}
                />

                <div className="flex flex-col mt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className={`
                            w-full py-4 rounded-2xl bg-primary text-white font-bold transition-all shadow-lg active:scale-95
                            ${isSaving ? 'opacity-50 grayscale' : 'hover:bg-primary-dark'}
                        `}
                    >
                        {isSaving ? 'Processando...' : (order.statusId === 4 ? 'Confirmar Reagendamento' : 'Confirmar Agendamento')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
