/**
 * Atividades realizadas no ativo (fora do plano de manutenção).
 */
import React from 'react';
import { OrderVisitAssetActivity } from '../../../../types';
import { ButtonNew } from '../../../ui/ButtonNew';
import { ReportEmptyState, ReportSection } from './assetReportShared';

interface Props {
    id: string;
    className?: string;
    activities: OrderVisitAssetActivity[];
    isReadOnly: boolean;
    canRemove: boolean;
    removingActivityId: string | null;
    onAdd: () => void;
    onRemove: (activityId: string) => void;
}

export const AssetReportActivitiesSection: React.FC<Props> = ({ id, className, activities, isReadOnly, canRemove, removingActivityId, onAdd, onRemove }) => (
    <ReportSection
        id={id}
        className={className}
        icon="build"
        title="Atividades realizadas"
        required
        status={isReadOnly ? undefined : activities.length > 0 ? 'done' : undefined}
        summary={`${activities.length} atividade(s)`}
        action={!isReadOnly && <ButtonNew onClick={onAdd} aria-label="Adicionar atividade" title="Adicionar atividade" />}
    >
        {activities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {activities.map((act) => {
                    const isRemoving = removingActivityId === act.activityId;
                    return (
                        <div
                            key={act.id}
                            className={`min-h-[40px] pl-3 ${canRemove ? 'pr-1' : 'pr-4'} py-1bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 transition-all ${isRemoving ? 'opacity-50 pointer-events-none scale-95' : ''}`}
                        >
                            <span className="material-symbols-outlined text-sm text-emerald-500">done</span>
                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide leading-tight py-1">
                                {act.activityDescription}
                            </span>
                            {canRemove && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(act.activityId)}
                                    disabled={isRemoving}
                                    aria-label={`Remover atividade ${act.activityDescription}`}
                                    title="Remover atividade"
                                    className="w-9 h-9 shrink-0 border-l border-emerald-200 dark:border-emerald-500/30 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-center disabled:cursor-not-allowed"
                                >
                                    <span className={`material-symbols-outlined text-base ${isRemoving ? 'animate-spin' : ''}`}>
                                        {isRemoving ? 'progress_activity' : 'delete'}
                                    </span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <ReportEmptyState>Nenhuma atividade selecionada.</ReportEmptyState>
        )}
    </ReportSection>
);
