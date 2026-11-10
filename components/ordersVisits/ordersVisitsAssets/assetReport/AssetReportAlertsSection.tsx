/**
 * Alertas do ativo resolvidos nesta visita.
 */
import React from 'react';
import { AssetAlert } from '../../../../types';
import { ReportAddButton, ReportEmptyState, ReportSection } from './assetReportShared';

interface Props {
    id: string;
    className?: string;
    alerts: AssetAlert[];
    completedAlertIds: string[];
    updatingAlertId: string | null;
    disabled: boolean;
    onToggle: (alertId: string) => void;
    onAdd?: () => void;
}

export const AssetReportAlertsSection: React.FC<Props> = ({ id, className, alerts, completedAlertIds, updatingAlertId, disabled, onToggle, onAdd }) => (
    <ReportSection
        id={id}
        className={className}
        icon="notifications"
        title="Alertas resolvidos"
        summary={`${completedAlertIds.length} de ${alerts.length} resolvido(s)`}
        action={onAdd && <ReportAddButton onClick={onAdd} label="Novo alerta" icon="add_alert" />}
    >
        {alerts.length > 0 ? (
            <div className="space-y-3">
                {alerts.map(alert => {
                    const checked = completedAlertIds.includes(alert.id);
                    return (
                        <label
                            key={alert.id}
                            className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${checked
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'
                                }`}
                        >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                                {alert.description || 'Alerta sem descrição.'}
                            </span>
                            <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled || updatingAlertId === alert.id}
                                onChange={() => onToggle(alert.id)}
                                className="h-6 w-6 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                            />
                        </label>
                    );
                })}
            </div>
        ) : (
            <ReportEmptyState>Nenhum alerta em aberto para este ativo.</ReportEmptyState>
        )}
    </ReportSection>
);
