import React, { useState, useEffect } from 'react';
import { Material } from '../../../types';
import { dataService } from '../../../services/dataService';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { Loading } from '../../../components/ui/Loading';
import { CancelPurchaseModal } from '../../../components/ui/CancelPurchaseModal';
import { MaterialPurchaseAuthorizeModal } from './MaterialPurchaseAuthorizeModal';
import { MaterialPurchaseCompleteModal } from './MaterialPurchaseCompleteModal';
import { MaterialPurchaseListItem } from '../../../components/ui/MaterialPurchaseListItem';
import { toast } from 'sonner';

interface MaterialPurchasesTabProps {
    material: Material;
    onAddPurchase?: () => void;
    refreshKey?: number;
}

interface Purchase {
    id: string;
    code: string;
    purchase_code: string;
    material_id: string;
    material_code: string;
    material_description: string;
    purchase_type_id: string;
    warehouse_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    justification: string;
    status_id: number;
    status_code: string;
    status_description: string;
    requester_name: string;
    authorizer_name: string;
    authorized_at: string;
    cancel_reason_id: number | null;
    cancel_reason_description: string | null;
    cancel_reason: string;
    concluded_at: string;
    created_at: string;
    purchase_type_description: string;
}

export const MaterialPurchasesTab: React.FC<MaterialPurchasesTabProps> = ({ material, onAddPurchase, refreshKey }) => {
    const { canCreate } = usePermissions();
    const canCreatePurchase = canCreate('materials_purchases_create');
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
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

    const loadPurchases = async () => {
        try {
            setLoading(true);
            const data = await dataService.getMaterialPurchases(material.id);
            setPurchases(data);
        } catch {
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases();
    }, [material.id, refreshKey]);

    const handleOpenAuthorize = (id: string) => {
        const purchase = purchases.find(p => p.id === id);
        if (purchase) {
            setSelectedPurchaseId(id);
            setSelectedPurchase(purchase);
            setShowAuthorizeModal(true);
        }
    };

    const handleAuthorize = async (data: { code: string; purchaseTypeId: string; warehouseId: string; quantity: number; unitPrice: number; justification: string }) => {
        if (!selectedPurchaseId) return;
        await dataService.authorizeMaterialPurchase(selectedPurchaseId, data);
        toast.success('Compra autorizada!');
        setShowAuthorizeModal(false);
        await loadPurchases();
    };

    const handleOpenCancel = (id: string) => {
        setSelectedPurchaseId(id);
        setShowCancelModal(true);
    };

    const handleCancel = async (reasonId: number, reasonText?: string) => {
        if (!selectedPurchaseId) return;
        await dataService.cancelMaterialPurchase(selectedPurchaseId, reasonId, reasonText);
        toast.success('Compra cancelada');
        setShowCancelModal(false);
        await loadPurchases();
    };

    const handleOpenComplete = (id: string, data: {
        purchase_type_id: string;
        warehouse_id: string;
        quantity: number;
        unit_price: number;
        justification: string;
    }) => {
        setCompletePurchase({ id, ...data });
        setShowCompleteModal(true);
    };

    const handleComplete = async (data: { warehouseId: string; quantity: number; unitPrice: number }) => {
        if (!completePurchase) return;
        try {
            await dataService.completeMaterialPurchase(completePurchase.id);
            toast.success('Entrada no estoque realizada!');
            setShowCompleteModal(false);
            setCompletePurchase(null);
            await loadPurchases();
        } catch {
            toast.error('Erro ao concluir compra');
        }
    };

    if (loading) return <Loading />;

    return (
        <div>
            {purchases.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 block">shopping_cart</span>
                    <p className="text-sm mb-3">Nenhuma compra registrada</p>
                    {onAddPurchase && canCreatePurchase && (
                        <button
                            onClick={onAddPurchase}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Adicionar compra
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {purchases.map(p => (
                        <MaterialPurchaseListItem
                            key={p.id}
                            id={p.id}
                            created_at={p.created_at}
                            status_id={p.status_id}
                            status_description={p.status_description}
                            requester_name={p.requester_name}
                            justification={p.justification}
                            quantity={p.quantity}
                            unit={material.unit || 'un'}
                            total_price={p.total_price}
                            cancel_reason_id={p.cancel_reason_id}
                            cancel_reason_description={p.cancel_reason_description}
                            cancel_reason={p.cancel_reason}
                            authorizer_name={p.authorizer_name}
                            authorized_at={p.authorized_at}
                            purchase_type={p.purchase_type_description}
                            purchase_type_id={p.purchase_type_id}
                            purchase_code={p.purchase_code}
                            warehouse_id={p.warehouse_id}
                            unit_price={p.unit_price}
                            showMaterialInfo={false}
                            showActions={true}
                            onAuthorize={handleOpenAuthorize}
                            onCancel={handleOpenCancel}
                            onComplete={handleOpenComplete}
                        />
                    ))}
                </div>
            )}

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
