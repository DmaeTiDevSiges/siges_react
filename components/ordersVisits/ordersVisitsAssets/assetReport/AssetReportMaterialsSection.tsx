/**
 * Materiais utilizados no ativo (com custo para quem tem orders_visits_costs).
 */
import React from 'react';
import { OrderVisitAssetMaterial } from '../../../../types';
import { ButtonNew } from '../../../ui/ButtonNew';
import { ReportEmptyState, ReportSection } from './assetReportShared';

const brl = (value?: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
    id: string;
    className?: string;
    materials: OrderVisitAssetMaterial[];
    isReadOnly: boolean;
    canRemove: boolean;
    showCosts: boolean;
    removingMaterialId: string | null;
    onAdd: () => void;
    onRemove: (material: OrderVisitAssetMaterial) => void;
}

export const AssetReportMaterialsSection: React.FC<Props> = ({ id, className, materials, isReadOnly, canRemove, showCosts, removingMaterialId, onAdd, onRemove }) => {
    const total = materials.reduce((sum, item) => sum + (item.valueTotal || 0), 0);

    return (
        <ReportSection
            id={id}
            className={className}
            icon="inventory_2"
            title="Materiais utilizados"
            summary={`${materials.length} material(is)${showCosts && materials.length ? ` · ${brl(total)}` : ''}`}
            action={!isReadOnly && <ButtonNew onClick={onAdd} aria-label="Adicionar material" title="Adicionar material" />}
        >
            {materials.length > 0 ? (
                <>
                    <div className="space-y-2">
                        {materials.map((item) => {
                            const isRemoving = removingMaterialId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-all ${isRemoving ? 'opacity-50 pointer-events-none scale-[0.98]' : ''}`}
                                >
                                    <div className="flex min-w-0 flex-col items-start gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                            {item.materialCode}
                                        </span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                            {item.materialDescription}
                                        </span>
                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                            {item.amount} {item.materialUnit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {showCosts && (
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{brl(item.valueTotal)}</span>
                                        )}
                                        {canRemove && (
                                            <button
                                                type="button"
                                                onClick={() => onRemove(item)}
                                                disabled={isRemoving}
                                                aria-label={`Remover material ${item.materialDescription}`}
                                                title="Remover material"
                                                className="w-10 h-10 border-l border-slate-200 dark:border-slate-700 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-center disabled:cursor-not-allowed"
                                            >
                                                <span className={`material-symbols-outlined text-base ${isRemoving ? 'animate-spin' : ''}`}>
                                                    {isRemoving ? 'progress_activity' : 'delete'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {showCosts && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</span>
                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{brl(total)}</span>
                        </div>
                    )}
                </>
            ) : (
                <ReportEmptyState>Nenhum material registrado.</ReportEmptyState>
            )}
        </ReportSection>
    );
};
