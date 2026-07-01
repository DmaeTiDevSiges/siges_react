import React, { useState, useEffect } from 'react';
import { dataService } from '../../../services/dataService';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { toast } from 'sonner';

interface MaterialPurchaseCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchase: {
        id: string;
        purchase_type_id: string;
        warehouse_id: string;
        quantity: number;
        unit_price: number;
        justification: string;
    } | null;
    onConfirm: (data: {
        warehouseId: string;
        quantity: number;
        unitPrice: number;
    }) => Promise<void>;
}

export const MaterialPurchaseCompleteModal: React.FC<MaterialPurchaseCompleteModalProps> = ({
    isOpen,
    onClose,
    purchase,
    onConfirm
}) => {
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouses, setWarehouses] = useState<{ id: string; code: string; description: string }[]>([]);
    const [saving, setSaving] = useState(false);

    const totalPrice = quantity * unitPrice;

    useEffect(() => {
        if (isOpen && purchase) {
            setQuantity(purchase.quantity);
            setUnitPrice(purchase.unit_price);
            setWarehouseId(purchase.warehouse_id);
            loadWarehouses();
        }
    }, [isOpen, purchase]);

    const loadWarehouses = async () => {
        try {
            const wh = await dataService.getWarehouses();
            setWarehouses(wh);
        } catch {
            setWarehouses([]);
        }
    };

    const handleConfirm = async () => {
        if (!warehouseId) {
            toast.error('Selecione um almoxarifado');
            return;
        }
        if (quantity <= 0) {
            toast.error('Informe uma quantidade válida');
            return;
        }
        if (unitPrice <= 0) {
            toast.error('Informe o valor unitário');
            return;
        }

        try {
            setSaving(true);
            await onConfirm({
                warehouseId,
                quantity,
                unitPrice
            });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleConfirm}
            title="Concluir Entrada no Estoque"
            confirmLabel={saving ? 'Concluindo...' : 'Confirmar Entrada'}
            confirmLoading={saving}
            type="info"
            maxWidth="sm"
            hideCancelButton
        >
            <div className="space-y-4">
                <Select
                    label="Almoxarifado *"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    placeholder="Selecione o almoxarifado"
                >
                    <option value="">Selecione...</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.description}</option>
                    ))}
                </Select>

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Quantidade *"
                        type="number"
                        placeholder="0"
                        value={quantity.toString()}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Valor Unitário (R$) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Valor Total</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</p>
                </div>
            </div>
        </Modal>
    );
};
