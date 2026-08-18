import React from 'react';
import { StatusBadge, StatusType } from './StatusBadge';
import { usePermissions } from '../../contexts/PermissionsContext';

interface MaterialPurchaseListItemProps {
    id: string;
    created_at: string;
    status_id: number;
    status_description: string;
    requester_name: string;
    justification: string;
    quantity: number;
    unit: string;
    total_price: number;
    cancel_reason_id?: number;
    cancel_reason_description?: string;
    cancel_reason?: string;
    authorizer_name?: string;
    authorized_at?: string;
    purchase_type?: string;
    purchase_type_id?: string;
    purchase_code?: string;
    warehouse_id?: string;
    unit_price?: number;
    material_code?: string;
    material_description?: string;
    showMaterialInfo?: boolean;
    showActions?: boolean;
    onAuthorize?: (id: string) => void;
    onCancel?: (id: string) => void;
    onComplete?: (id: string, data: { purchase_type_id: string; warehouse_id: string; quantity: number; unit_price: number; justification: string }) => void;
}

const getStatusStyle = (statusId: number): StatusType => {
    switch (statusId) {
        case 1: return 'pending';
        case 2: return 'active';
        case 3: return 'active';
        case 4: return 'inactive';
        default: return 'pending';
    }
};

const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const MaterialPurchaseListItem: React.FC<MaterialPurchaseListItemProps> = ({
    id,
    created_at,
    status_id,
    status_description,
    requester_name,
    justification,
    quantity,
    unit,
    total_price,
    cancel_reason_id,
    cancel_reason_description,
    cancel_reason,
    authorizer_name,
    authorized_at,
    purchase_type,
    purchase_type_id,
    purchase_code,
    warehouse_id,
    unit_price,
    material_code,
    material_description,
    showMaterialInfo = false,
    showActions = false,
    onAuthorize,
    onCancel,
    onComplete,
}) => {
    const { canCreate } = usePermissions();
    const canAuthorize = canCreate('materials_purchases_authorizations');
    const canComplete = canCreate('materials_purchases_complete');

    return (
        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDate(created_at)}</span>
                    {purchase_type && (
                        <>
                            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{purchase_type}</span>
                        </>
                    )}
                    {purchase_code && (
                        <>
                            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{purchase_code}</span>
                        </>
                    )}
                </div>
                <StatusBadge status={getStatusStyle(status_id)} label={status_description} size="sm" />
            </div>

            <div className="px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        {showMaterialInfo && material_code && (
                            <>
                                <span className="text-xs text-slate-500">Material</span>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{material_code} - {material_description}</p>
                            </>
                        )}

                        <span className="text-xs text-slate-500">Solicitante</span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{requester_name || '—'}</p>

                        <span className="text-xs text-slate-500 mt-2 block">Justificativa</span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{justification || '—'}</p>
                    </div>

                    <div className="space-y-1 text-right">
                        <span className="text-xs text-slate-500">Quantidade</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{quantity} {unit || 'un'}</p>

                        <span className="text-xs text-slate-500 mt-2 block">Valor Total</span>
                        <p className="text-sm font-bold text-primary">{formatCurrency(total_price)}</p>
                    </div>
                </div>
            </div>

            {status_id === 4 && (cancel_reason_description || cancel_reason) && (
                <div className="mx-4 mb-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">Motivo do cancelamento</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                        {cancel_reason_description || cancel_reason}
                        {cancel_reason_description && cancel_reason && ` - ${cancel_reason}`}
                    </p>
                </div>
            )}

            {status_id === 2 && authorizer_name && (
                <div className="mx-4 mb-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5">
                    <p className="text-xs text-emerald-500 dark:text-emerald-400">Autorizado por {authorizer_name} em {formatDate(authorized_at)}</p>
                </div>
            )}

            {showActions && (status_id === 1 || status_id === 2) && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    {status_id === 1 && canAuthorize && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCancel?.(id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => onAuthorize?.(id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                                Autorizar
                            </button>
                        </div>
                    )}

                    {status_id === 2 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCancel?.(id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            {canComplete && (
                                <button
                                    onClick={() => onComplete?.(id, {
                                        purchase_type_id: purchase_type_id || '',
                                        warehouse_id: warehouse_id || '',
                                        quantity,
                                        unit_price: unit_price || 0,
                                        justification
                                    })}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                                >
                                    Concluir Entrada no Estoque
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
