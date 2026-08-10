import React, { useState, useEffect } from 'react';
import { Material } from '../../../types';
import { dataService } from '../../../services/dataService';
import { supabase } from '../../../services/supabase';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { toast } from 'sonner';

interface WarehouseOption {
    id: string;
    code: string;
    description: string;
}

interface MaterialPurchaseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: Material;
    onCreated: () => void;
    /** Almoxarifados já associados ao material. Se não fornecido, carrega do servidor. */
    warehouseOptions?: WarehouseOption[];
}

export const MaterialPurchaseFormModal: React.FC<MaterialPurchaseFormModalProps> = ({
    isOpen,
    onClose,
    material,
    onCreated,
    warehouseOptions
}) => {
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(material.priceUnit || 0);
    const [justification, setJustification] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [purchaseTypeId, setPurchaseTypeId] = useState('');
    const [purchaseTypes, setPurchaseTypes] = useState<{ id: string; code: string; description: string }[]>([]);
    const [saving, setSaving] = useState(false);

    const totalPrice = quantity * unitPrice;

    useEffect(() => {
        if (isOpen) {
            loadWarehouses();
            loadPurchaseTypes();
        }
    }, [isOpen, warehouseOptions]);

    const loadWarehouses = async () => {
        // Se almoxarifados associados foram passados via prop, usa-os diretamente
        if (warehouseOptions && warehouseOptions.length > 0) {
            setWarehouses(warehouseOptions);
            return;
        }
        // Caso contrário, carrega os almoxarifados associados ao material do servidor
        try {
            const stocks = await dataService.getWarehouseMaterials(material.id);
            setWarehouses(stocks.map(s => ({
                id: s.warehouse_id,
                code: s.warehouse_code,
                description: s.warehouse_description
            })));
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

    const handleSave = async () => {
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
            await dataService.createMaterialPurchase({
                materialId: material.id,
                purchaseTypeId,
                warehouseId,
                quantity,
                unitPrice,
                justification: justification.trim()
            });
            toast.success('Solicitação de compra criada!');
            onCreated();
            onClose();
            setQuantity(1);
            setUnitPrice(material.priceUnit || 0);
            setJustification('');
            setWarehouseId('');
            setPurchaseTypeId('');
        } catch {
            toast.error('Erro ao criar solicitação');
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
            onConfirm={handleSave}
            title="Nova Solicitação de Compra"
            confirmLabel={saving ? 'Salvando...' : 'Salvar'}
            confirmLoading={saving}
            type="info"
            maxWidth="sm"
        >
            <div className="space-y-4">
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
                    disabled={warehouses.length === 0}
                >
                    <option value="">{warehouses.length === 0 ? 'Nenhum almoxarifado associado' : 'Selecione...'}</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.description}</option>
                    ))}
                </Select>
                {warehouses.length === 0 && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 -mt-2">
                        Este material não está associado a nenhum almoxarifado. Cadastre-o na aba <strong>Almoxarifados</strong> primeiro.
                    </p>
                )}

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
