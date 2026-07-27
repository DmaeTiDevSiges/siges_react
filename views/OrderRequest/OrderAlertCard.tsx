import React from 'react';
import { AssetAlert } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderAlertCardProps {
    alerts: AssetAlert[];
    selectedIds: string[];
    onToggle: (alertId: string) => void;
    disabled?: boolean;
}

export const OrderAlertCard: React.FC<OrderAlertCardProps> = ({
    alerts,
    selectedIds,
    onToggle,
    disabled = false
}) => {
    if (alerts.length === 0) return null;

    const representative = alerts[0];
    const priorityColor = representative.priorityColor || '#64748b';
    const allLinked = alerts.every(a => !!a.orderId);
    const someSelected = alerts.some(a => selectedIds.includes(a.id));
    const allSelected = alerts.every(a => selectedIds.includes(a.id));

    const formatDate = (dateStr?: string, pattern: string = "dd/MM/yyyy HH:mm 'h'") => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), pattern, { locale: ptBR });
        } catch (e) {
            return '';
        }
    };

    return (
        <div
            className={`group relative bg-white dark:bg-[#0B132B] rounded-3xl border shadow-xl overflow-hidden p-4 flex flex-col border-l-4 transition-all duration-300 ${
                disabled
                    ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800/80'
                    : someSelected
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 hover:shadow-2xl'
                        : 'border-slate-200 dark:border-slate-800/80 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]'
            }`}
            style={{ borderLeftColor: priorityColor }}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox do ativo (marca/desmarca todos) */}
                <div className="pt-1 shrink-0">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) {
                                alerts.forEach(a => {
                                    const isCurrentlySelected = selectedIds.includes(a.id);
                                    if (allSelected ? isCurrentlySelected : !isCurrentlySelected) {
                                        onToggle(a.id);
                                    }
                                });
                            }
                        }}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                            allSelected
                                ? 'bg-blue-600 border-blue-600'
                                : disabled
                                    ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                                    : someSelected
                                        ? 'bg-blue-600/50 border-blue-500'
                                        : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                        }`}>
                        {allSelected && (
                            <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        )}
                        {someSelected && !allSelected && (
                            <span className="material-symbols-outlined text-white text-[14px]">remove</span>
                        )}
                        {disabled && !someSelected && (
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[14px]">link</span>
                        )}
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    {/* Cabeçalho: Código + Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div
                                className="text-white rounded-[10px] px-3 py-1.5 flex items-center shadow-md"
                                style={{ backgroundColor: representative.assetStatusColor || priorityColor }}
                            >
                                <span className="text-[13px] font-bold tracking-tight leading-none">
                                    {representative.assetCode || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 dark:bg-red-600/20 text-red-500 dark:text-red-400 border border-red-500/20">
                                <span className="material-symbols-outlined text-[11px] font-black">error_outline</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                    {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Descrição do Ativo */}
                    <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-snug tracking-wide text-left mb-1">
                        {representative.assetDescription || 'Sem descrição do ativo'}
                    </h3>

                    {/* Setor / Posição */}
                    {(representative.tagName || representative.tagSubName) && (
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left mb-2">
                            {representative.tagName || 'Setor'}{representative.tagSubName ? ` / ${representative.tagSubName}` : ''}
                        </p>
                    )}

                    {/* Lista de alertas */}
                    <div className="space-y-1.5">
                        {alerts.map(alert => {
                            const alertSelected = selectedIds.includes(alert.id);
                            const alertLinked = !!alert.orderId;

                            return (
                                <div
                                    key={alert.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!disabled) onToggle(alert.id);
                                    }}
                                    className={`flex items-start gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                                        disabled
                                            ? 'cursor-not-allowed'
                                            : alertSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400/30'
                                                : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {/* Checkbox individual */}
                                    <div className="pt-0.5 shrink-0">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                            alertSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {alertSelected && (
                                                <span className="material-symbols-outlined text-white text-[10px]">check</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Descrição + Data na mesma linha */}
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug text-left flex-1 min-w-0 truncate">
                                                {alert.description || 'Sem descrição do alerta'}
                                            </p>
                                            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
                                                <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                                                <span className="text-[7px] font-black uppercase tracking-widest">
                                                    {formatDate(alert.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Badges de Prioridade e Tipo */}
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {alert.priorityName && (
                                                <div
                                                    className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm"
                                                    style={{ backgroundColor: alert.priorityColor || '#64748b' }}
                                                >
                                                    {alert.priorityName}
                                                </div>
                                            )}
                                            {alert.orderTypeName && (
                                                <div className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                                    {alert.orderTypeName}
                                                </div>
                                            )}
                                        </div>

                                        {/* OS vinculada */}
                                        {alertLinked && (
                                            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 w-fit">
                                                <span className="material-symbols-outlined text-[9px] font-black">link</span>
                                                <span className="text-[7px] font-black uppercase tracking-widest">
                                                    OS: {alert.orderMask}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
