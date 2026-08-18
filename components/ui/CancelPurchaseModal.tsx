import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Select } from './Select';
import { dataService } from '../../services/dataService';

interface CancelReason {
    id: number;
    description: string;
    is_available: boolean;
}

interface CancelPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reasonId: number, reasonText?: string) => Promise<void>;
}

export const CancelPurchaseModal: React.FC<CancelPurchaseModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reasonId, setReasonId] = useState<number | ''>('');
    const [reasonText, setReasonText] = useState('');
    const [reasons, setReasons] = useState<CancelReason[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingReasons, setLoadingReasons] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReasonId('');
            setReasonText('');
            loadReasons();
        }
    }, [isOpen]);

    const loadReasons = async () => {
        setLoadingReasons(true);
        try {
            const data = await dataService.getPurchaseCancelReasons();
            setReasons(data);
        } catch (err) {
            console.error('Error loading cancel reasons:', err);
        } finally {
            setLoadingReasons(false);
        }
    };

    const handleConfirm = async () => {
        if (!reasonId) return;
        try {
            setLoading(true);
            await onConfirm(reasonId as number, reasonText.trim() || undefined);
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
            <div className="space-y-4">
                <Select
                    label="Motivo do cancelamento *"
                    value={reasonId.toString()}
                    onChange={(e) => setReasonId(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Selecione o motivo"
                    disabled={loadingReasons}
                >
                    <option value="">{loadingReasons ? 'Carregando...' : 'Selecione...'}</option>
                    {reasons.map(r => (
                        <option key={r.id} value={r.id}>{r.description}</option>
                    ))}
                </Select>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Observação adicional (opcional)
                    </label>
                    <textarea
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Informe uma observação adicional, se necessário..."
                    />
                </div>
            </div>
        </Modal>
    );
};
