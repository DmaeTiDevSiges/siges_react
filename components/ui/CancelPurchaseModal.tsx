import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface CancelPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export const CancelPurchaseModal: React.FC<CancelPurchaseModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!reason.trim()) return;
        try {
            setLoading(true);
            await onConfirm(reason.trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleConfirm}
            title="CANCELAR COMPRA"
            confirmLabel={loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            confirmLoading={loading}
            type="warning"
            maxWidth="sm"
            hideCancelButton
        >
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Motivo do cancelamento *
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Informe o motivo..."
                />
            </div>
        </Modal>
    );
};
