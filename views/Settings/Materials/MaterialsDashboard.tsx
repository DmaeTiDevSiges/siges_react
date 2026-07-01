import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dataService } from '../../../services/dataService';
import { Loading } from '../../../components/ui/Loading';
import { CancelPurchaseModal } from '../../../components/ui/CancelPurchaseModal';
import { MaterialPurchaseAuthorizeModal } from './MaterialPurchaseAuthorizeModal';
import { MaterialPurchaseCompleteModal } from './MaterialPurchaseCompleteModal';
import { MaterialPurchaseListItem } from '../../../components/ui/MaterialPurchaseListItem';
import { toast } from 'sonner';

interface MaterialsDashboardProps {
    onBack?: () => void;
    onSelectMaterial?: (material: any) => void;
}

interface DashboardStats {
    pending: number;
    authorized: number;
    completed: number;
    cancelled: number;
    pending_value: number;
    authorized_value: number;
}

interface StockSummary {
    materials_without_stock: number;
    materials_below_min: number;
}

interface MaterialBelowMin {
    material_id: number;
    material_code: string;
    material_description: string;
    material_unit: string;
    warehouse_description: string;
    quantity: number;
    min_stock: number;
    cost_avg: number;
    deficit: number;
    deficit_value: number;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const MaterialsDashboard: React.FC<MaterialsDashboardProps> = ({ onBack, onSelectMaterial }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({ pending: 0, authorized: 0, completed: 0, cancelled: 0, pending_value: 0, authorized_value: 0 });
    const [stockSummary, setStockSummary] = useState<StockSummary>({ materials_without_stock: 0, materials_below_min: 0 });
    const [belowMinStock, setBelowMinStock] = useState<MaterialBelowMin[]>([]);
    const [allPurchases, setAllPurchases] = useState<any[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completePurchase, setCompletePurchase] = useState<{
        id: string;
        purchase_type_id: string;
        warehouse_id: string;
        quantity: number;
        unit_price: number;
        justification: string;
    } | null>(null);
    const [selectedAlerts, setSelectedAlerts] = useState(false);
    const [activePurchases, setActivePurchases] = useState<Record<number, boolean>>({});

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const [purchasesDash, stock, belowMin, recent, activeMap] = await Promise.all([
                dataService.getMaterialPurchasesDashboard(),
                dataService.getMaterialsStockSummary(),
                dataService.getMaterialsBelowMinStock(),
                dataService.getRecentPurchases(20),
                dataService.getActivePurchasesMaterialIds(),
            ]);
            setStats(purchasesDash);
            setStockSummary({ materials_without_stock: stock.materials_without_stock, materials_below_min: stock.materials_below_min });
            setBelowMinStock(belowMin);
            setAllPurchases(recent);
            setActivePurchases(activeMap);
        } catch {
            console.error('Error loading materials dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handleOpenAuthorize = useCallback((id: string) => {
        const purchase = allPurchases.find((p: any) => p.id === id);
        if (purchase) {
            setSelectedPurchaseId(id);
            setSelectedPurchase(purchase);
            setShowAuthorizeModal(true);
        }
    }, [allPurchases]);

    const handleAuthorize = useCallback(async (data: { code: string; purchaseTypeId: string; warehouseId: string; quantity: number; unitPrice: number; justification: string }) => {
        if (!selectedPurchaseId) return;
        await dataService.authorizeMaterialPurchase(selectedPurchaseId, data);
        toast.success('Compra autorizada!');
        setShowAuthorizeModal(false);
        await loadDashboard();
    }, [selectedPurchaseId, loadDashboard]);

    const handleOpenCancel = useCallback((id: string) => {
        setSelectedPurchaseId(id);
        setShowCancelModal(true);
    }, []);

    const handleCancel = useCallback(async (reason: string) => {
        if (!selectedPurchaseId) return;
        await dataService.cancelMaterialPurchase(selectedPurchaseId, reason);
        toast.success('Compra cancelada');
        setShowCancelModal(false);
        await loadDashboard();
    }, [selectedPurchaseId, loadDashboard]);

    const handleOpenComplete = useCallback((id: string, data: {
        purchase_type_id: string;
        warehouse_id: string;
        quantity: number;
        unit_price: number;
        justification: string;
    }) => {
        setCompletePurchase({ id, ...data });
        setShowCompleteModal(true);
    }, []);

    const handleComplete = useCallback(async (data: { warehouseId: string; quantity: number; unitPrice: number }) => {
        if (!completePurchase) return;
        try {
            await dataService.completeMaterialPurchase(completePurchase.id);
            toast.success('Entrada no estoque realizada!');
            setShowCompleteModal(false);
            setCompletePurchase(null);
            await loadDashboard();
        } catch {
            toast.error('Erro ao concluir compra');
        }
    }, [completePurchase, loadDashboard]);

    const filteredPurchases = useMemo(() => {
        return selectedStatus !== null
            ? allPurchases.filter(p => p.status_id === selectedStatus)
            : [];
    }, [allPurchases, selectedStatus]);

    const filteredTotal = useMemo(() => {
        return filteredPurchases.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0);
    }, [filteredPurchases]);

    const belowMinDeficitTotal = useMemo(() => {
        return belowMinStock.reduce((sum, i) => sum + i.deficit_value, 0);
    }, [belowMinStock]);

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <div className="px-4 pt-4 pb-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Compras</h1>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setSelectedStatus(selectedStatus === 1 ? null : 1)}
                        className={`bg-white dark:bg-card-dark rounded-xl p-4 border transition-all text-left ${
                            selectedStatus === 1
                                ? 'border-amber-400 ring-2 ring-amber-400/30'
                                : 'border-slate-100 dark:border-slate-800 hover:border-amber-300'
                        }`}
                    >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pendentes</p>
                        <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                        <p className="text-[10px] text-amber-400 mt-1 font-medium">{formatCurrency(stats.pending_value)}</p>
                    </button>
                    <button
                        onClick={() => setSelectedStatus(selectedStatus === 2 ? null : 2)}
                        className={`bg-white dark:bg-card-dark rounded-xl p-4 border transition-all text-left ${
                            selectedStatus === 2
                                ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                                : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                    >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Autorizadas</p>
                        <p className="text-2xl font-bold text-emerald-500">{stats.authorized}</p>
                        <p className="text-[10px] text-emerald-400 mt-1 font-medium">{formatCurrency(stats.authorized_value)}</p>
                    </button>
                    <button
                        onClick={() => setSelectedAlerts(!selectedAlerts)}
                        className={`bg-white dark:bg-card-dark rounded-xl p-4 border transition-all text-left ${
                            selectedAlerts
                                ? 'border-red-400 ring-2 ring-red-400/30'
                                : 'border-slate-100 dark:border-slate-800 hover:border-red-300'
                        }`}
                    >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Alertas</p>
                        <p className="text-2xl font-bold text-red-500">{stockSummary.materials_below_min}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-red-400">{stockSummary.materials_below_min} abaixo mínimo</span>
                        </div>
                    </button>
                </div>

                {selectedStatus !== null && filteredPurchases.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                {selectedStatus === 1 ? 'Pendentes' : selectedStatus === 2 ? 'Autorizadas' : 'Canceladas'}
                            </h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {filteredPurchases.length} • {formatCurrency(filteredTotal)}
                            </span>
                        </div>
                        {filteredPurchases.map((p: any) => (
                            <div key={p.id} className="cursor-pointer">
                                <MaterialPurchaseListItem
                                    id={p.id}
                                    created_at={p.created_at}
                                    status_id={p.status_id}
                                    status_description={p.status_description}
                                    requester_name={p.requester_name}
                                    justification={p.justification}
                                    quantity={p.quantity}
                                    unit={p.material_unit || 'un'}
                                    total_price={p.total_price}
                                    cancel_reason={p.cancel_reason}
                                    authorizer_name={p.authorizer_name}
                                    authorized_at={p.authorized_at}
                                    purchase_type={p.purchase_type_description}
                                    purchase_type_id={p.purchase_type_id}
                                    purchase_code={p.purchase_code}
                                    warehouse_id={p.warehouse_id}
                                    unit_price={p.unit_price}
                                    showActions={true}
                                    onAuthorize={handleOpenAuthorize}
                                    onCancel={handleOpenCancel}
                                    onComplete={handleOpenComplete}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {selectedStatus !== null && filteredPurchases.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">Nenhuma compra {selectedStatus === 1 ? 'pendente' : selectedStatus === 2 ? 'autorizada' : 'cancelada'} encontrada.</p>
                    </div>
                )}

                {selectedAlerts && belowMinStock.length > 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Estoque Abaixo do Mínimo</h2>
                                <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{belowMinStock.length} itens</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total a comprar: {formatCurrency(belowMinDeficitTotal)}</p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {belowMinStock.map((item, idx) => (
                                <div
                                    key={`${item.material_id}-${item.warehouse_description}-${idx}`}
                                    onClick={() => onSelectMaterial?.({ id: String(item.material_id), code: item.material_code, description: item.material_description })}
                                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.material_description}</p>
                                            {activePurchases[item.material_id] && (
                                                <span className="material-symbols-outlined text-amber-500 text-base" title="Compra em andamento">shopping_cart</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.material_code} • {item.warehouse_description}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-xs text-slate-500">
                                            <span className="font-bold text-red-500">{item.quantity}</span>
                                            <span className="text-slate-400"> / {item.min_stock} {item.material_unit}</span>
                                        </p>
                                        <p className="text-xs font-bold text-primary">{formatCurrency(item.deficit_value)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedAlerts && belowMinStock.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                        <p className="text-sm">Nenhum alerta de estoque no momento.</p>
                    </div>
                )}

                {!selectedAlerts && selectedStatus === null && belowMinStock.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-2 block">check_circle</span>
                        <p className="text-sm">Tudo em ordem! Nenhuma ação necessária.</p>
                    </div>
                )}
            </div>

            <CancelPurchaseModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancel}
            />

            <MaterialPurchaseAuthorizeModal
                isOpen={showAuthorizeModal}
                onClose={() => setShowAuthorizeModal(false)}
                purchase={selectedPurchase ? {
                    id: selectedPurchase.id,
                    purchase_type_id: selectedPurchase.purchase_type_id,
                    warehouse_id: selectedPurchase.warehouse_id,
                    quantity: selectedPurchase.quantity,
                    unit_price: selectedPurchase.unit_price,
                    justification: selectedPurchase.justification
                } : null}
                onConfirm={handleAuthorize}
            />

            <MaterialPurchaseCompleteModal
                isOpen={showCompleteModal}
                onClose={() => { setShowCompleteModal(false); setCompletePurchase(null); }}
                purchase={completePurchase}
                onConfirm={handleComplete}
            />
        </div>
    );
};
