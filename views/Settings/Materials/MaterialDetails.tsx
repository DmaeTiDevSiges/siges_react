import React, { useState, useEffect } from 'react';
import { Material } from '../../../types';
import { dataService } from '../../../services/dataService';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { Loading } from '../../../components/ui/Loading';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { toast } from 'sonner';
import { MaterialPurchasesTab } from './MaterialPurchasesTab';
import { MaterialPurchaseFormModal } from './MaterialPurchaseFormModal';

interface MaterialDetailsProps {
    material: Material;
    onEdit: () => void;
    onDelete?: () => void;
    onUpdate?: (material: Material) => void;
    defaultTab?: 'almoxarifados' | 'compras';
}

interface WarehouseStock {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_description: string;
    quantity: number;
    min_stock: number;
    cost_avg: number;
}


export const MaterialDetails: React.FC<MaterialDetailsProps> = ({
    material,
    onEdit,
    onDelete,
    onUpdate,
    defaultTab = 'almoxarifados'
}) => {
    const { canCreate, canEdit, canDelete } = usePermissions();
    const [showMenu, setShowMenu] = useState(false);
    const [stocks, setStocks] = useState<WarehouseStock[]>([]);
    const [loadingStocks, setLoadingStocks] = useState(true);
    const [statuses, setStatuses] = useState<{ id: number; code: string; description: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'almoxarifados' | 'compras'>(defaultTab);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [purchasesRefreshKey, setPurchasesRefreshKey] = useState(0);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStock, setEditingStock] = useState<WarehouseStock | null>(null);
    const [warehouses, setWarehouses] = useState<{ id: string; code: string; description: string }[]>([]);
    const [warehouseId, setWarehouseId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [minStock, setMinStock] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const canEditDelete = canEdit('materials_create_edit_delete') || canDelete('materials_create_edit_delete');

    const usedWarehouseIds = stocks.map(s => s.warehouse_id);
    const availableWarehouses = warehouses.filter(w => !usedWarehouseIds.includes(w.id));

    const loadStocks = async () => {
        try {
            setLoadingStocks(true);
            const data = await dataService.getWarehouseMaterials(material.id);
            setStocks(data);
        } catch {
            setStocks([]);
        } finally {
            setLoadingStocks(false);
        }
    };

    useEffect(() => {
        loadStocks();
        dataService.getMaterialsStatuses().then(setStatuses).catch(() => setStatuses([]));
    }, [material.id]);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const handleOpenAddModal = async () => {
        try {
            const wh = await dataService.getWarehouses();
            setWarehouses(wh);
        } catch {
            setWarehouses([]);
        }
        setWarehouseId('');
        setQuantity(0);
        setMinStock(0);
        setShowAddModal(true);
    };

    const handleSaveStock = async () => {
        if (!warehouseId) {
            toast.error('Selecione um almoxarifado');
            return;
        }
        try {
            setIsSaving(true);
            await dataService.createWarehouseMaterial({
                warehouseId,
                materialId: material.id,
                quantity,
                minStock
            });
            toast.success('Estoque cadastrado com sucesso!');
            setShowAddModal(false);
            onUpdate?.(material);
            await loadStocks();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao cadastrar estoque');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEditModal = (stock: WarehouseStock) => {
        setEditingStock(stock);
        setQuantity(stock.quantity);
        setMinStock(stock.min_stock);
        setShowEditModal(true);
    };

    const handleUpdateStock = async () => {
        if (!editingStock) return;
        try {
            setIsSaving(true);
            await dataService.updateWarehouseMaterial(editingStock.warehouse_id, material.id, {
                quantity,
                minStock
            });
            toast.success('Estoque atualizado com sucesso!');
            setShowEditModal(false);
            setEditingStock(null);
            onUpdate?.(material);
            await loadStocks();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao atualizar estoque');
        } finally {
            setIsSaving(false);
        }
    };

    const statusLabel = material.statusDescription || statuses.find(s => s.id === material.statusId)?.description || (material.isAvailable ? 'Ativo' : 'Inativo');

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 pt-6 pb-0">
                <h1 className="text-slate-900 dark:text-white text-[22px] font-bold tracking-tight truncate pr-4 flex-1 min-w-0">
                    {material.description}
                </h1>

                {material.unit && (
                    <span className="text-slate-500 dark:text-slate-400 text-[22px] font-bold tracking-tight shrink-0 mr-2">
                        {material.unit}
                    </span>
                )}

                {canEditDelete && (
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
                                    {canEdit('materials_create_edit_delete') && (
                                        <button
                                            onClick={() => { setShowMenu(false); onEdit(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="px-4 pt-2 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700">
                        {material.code}
                    </span>
                    <StatusBadge
                        status={statusLabel.toLowerCase().includes('ativo') && !statusLabel.toLowerCase().includes('inativo') ? 'active' : 'inactive'}
                        label={statusLabel}
                        size="sm"
                    />
                </div>

                <div className="mt-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Preço Unitário</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {material.priceUnit > 0 ? material.priceUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 mt-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('almoxarifados')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeTab === 'almoxarifados'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Almoxarifados
                        </button>
                        <button
                            onClick={() => setActiveTab('compras')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeTab === 'compras'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Compras
                        </button>
                    </div>
                    {activeTab === 'almoxarifados' && canCreate('warehouses_create_edit_delete') && (
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Almoxarifado
                        </button>
                    )}
                    {activeTab === 'compras' && canCreate('materials_purchases_create') && (
                        <button
                            onClick={() => setShowPurchaseForm(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Compra
                        </button>
                    )}
                </div>

                {activeTab === 'almoxarifados' && (
                    <>
                        {loadingStocks && <Loading />}

                        {!loadingStocks && stocks.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                <p className="text-sm mb-3">Nenhum estoque registrado</p>
                                {canCreate('warehouses_create_edit_delete') && (
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Cadastrar no almoxarifado
                                    </button>
                                )}
                            </div>
                        )}

                        {!loadingStocks && stocks.map((s) => (
                            <div
                                key={s.warehouse_id}
                                className="bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-2"
                            >
                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.warehouse_description}</p>
                                        <div className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>Mín: <strong>{s.min_stock}</strong></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-lg font-black ${s.quantity < s.min_stock ? 'text-red-500' : 'text-primary'}`}>{s.quantity}</p>
                                        {canEdit('materials_create_edit_delete') && (
                                            <button
                                                onClick={() => handleOpenEditModal(s)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
                                                title="Editar estoque"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {activeTab === 'compras' && (
                    <MaterialPurchasesTab material={material} onAddPurchase={() => setShowPurchaseForm(true)} refreshKey={purchasesRefreshKey} />
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onConfirm={availableWarehouses.length > 0 ? handleSaveStock : undefined}
                title={availableWarehouses.length === 0 ? 'Adicionar no Almoxarifado' : 'Adicionar Estoque'}
                confirmLabel={isSaving ? 'Salvando...' : 'Salvar'}
                cancelLabel={availableWarehouses.length === 0 ? 'Fechar' : 'Cancelar'}
                type="info"
                maxWidth="sm"
                confirmLoading={isSaving}
                hideCancelButton={availableWarehouses.length === 0}
            >
                {availableWarehouses.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">warehouse</span>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhum almoxarifado disponível</p>
                        <p className="text-xs">Todos os almoxarifados já possuem estoque deste material ou não existem almoxarifados cadastrados para sua empresa.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Select
                            label="Almoxarifado"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            required
                        >
                            <option value="">Selecione o almoxarifado</option>
                            {availableWarehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.description}</option>
                            ))}
                        </Select>

                        <Input
                            label="Quantidade Inicial"
                            type="number"
                            placeholder="0"
                            value={quantity.toString()}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        />

                        <Input
                            label="Estoque Mínimo"
                            type="number"
                            placeholder="0"
                            value={minStock.toString()}
                            onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingStock(null); }}
                onConfirm={handleUpdateStock}
                title="Editar Estoque"
                confirmLabel={isSaving ? 'Salvando...' : 'Salvar'}
                cancelLabel="Cancelar"
                type="info"
                maxWidth="sm"
                confirmLoading={isSaving}
            >
                {editingStock && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Almoxarifado</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{editingStock.warehouse_description}</p>
                        </div>

                        <Input
                            label="Quantidade"
                            type="number"
                            placeholder="0"
                            value={quantity.toString()}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        />

                        <Input
                            label="Estoque Mínimo"
                            type="number"
                            placeholder="0"
                            value={minStock.toString()}
                            onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                        />
                    </div>
                )}
            </Modal>

            <MaterialPurchaseFormModal
                isOpen={showPurchaseForm}
                onClose={() => setShowPurchaseForm(false)}
                material={material}
                onCreated={() => setPurchasesRefreshKey(k => k + 1)}
            />
        </div>
    );
};
