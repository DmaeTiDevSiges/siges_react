import React, { useState, useEffect } from 'react';
import { dataService } from '../../../services/dataService';
import { supabase } from '../../../services/supabase';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { toast } from 'sonner';

interface MaterialPurchaseAuthorizeModalProps {
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
        code: string;
        purchaseTypeId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
        justification: string;
    }) => Promise<void>;
}

export const MaterialPurchaseAuthorizeModal: React.FC<MaterialPurchaseAuthorizeModalProps> = ({
    isOpen,
    onClose,
    purchase,
    onConfirm
}) => {
    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [justification, setJustification] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouses, setWarehouses] = useState<{ id: string; code: string; description: string }[]>([]);
    const [purchaseTypeId, setPurchaseTypeId] = useState('');
    const [purchaseTypes, setPurchaseTypes] = useState<{ id: string; code: string; description: string }[]>([]);
    const [saving, setSaving] = useState(false);

    const totalPrice = quantity * unitPrice;

    useEffect(() => {
        if (isOpen && purchase) {
            setCode('');
            setQuantity(purchase.quantity);
            setUnitPrice(purchase.unit_price);
            setJustification(purchase.justification);
            setWarehouseId(purchase.warehouse_id);
            setPurchaseTypeId(purchase.purchase_type_id);
            loadWarehouses();
            loadPurchaseTypes();
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

    const loadPurchaseTypes = async () => {
        try {
            const { data } = await supabase.from('cfg_materials_purchases_types').select('id, code, description').eq('is_available', true);
            setPurchaseTypes(data || []);
        } catch {
            setPurchaseTypes([]);
        }
    };

    const handleConfirm = async () => {
        if (!code.trim()) {
            toast.error('Informe o código de autorização');
            return;
        }
        if (!purchaseTypeId) {
            toast.error('Selecione o tipo de solicitação');
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
        if (!justification.trim()) {
            toast.error('Informe a justificativa');
            return;
        }
        if (!warehouseId) {
            toast.error('Selecione um almoxarifado');
            return;
        }

        try {
            setSaving(true);
            await onConfirm({
                code: code.trim(),
                purchaseTypeId,
                warehouseId,
                quantity,
                unitPrice,
                justification: justification.trim()
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
            title="Autorizar Compra"
            confirmLabel={saving ? 'Autorizando...' : 'Confirmar Autorização'}
            confirmLoading={saving}
            type="info"
            maxWidth="sm"
            hideCancelButton
        >
            <div className="space-y-4">
                <Input
                    label="Código *"
                    type="text"
                    placeholder="Informe o código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />

                <Select
                    label="Tipo Solicitação *"
                    value={purchaseTypeId}
                    onChange={(e) => setPurchaseTypeId(e.target.value)}
                    placeholder="Selecione o tipo"
                >
                    <option value="">Selecione...</option>
                    {purchaseTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.description}</option>
                    ))}
                </Select>

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
                    <p className="text-xs text-slate-500">Valor Total Estimado</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Justificativa *</label>
                    <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Descreva o motivo da compra..."
                    />
                </div>
            </div>
        </Modal>
    );
};
