import React, { memo } from 'react';
import { AssetAlert } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '../../components/ui/Avatar';
import { dataService } from '../../services/dataService';

interface AssetAlertGroupCardProps {
    alerts: AssetAlert[];
    onClick?: () => void;
    onSelectOrder?: (orderId: string) => void;
}

// Movida para fora do componente: não é recriada a cada render
const formatDate = (dateStr?: string, pattern: string = "dd/MM/yyyy HH:mm 'h'") => {
    if (!dateStr) return '';
    try {
        return format(new Date(dateStr), pattern, { locale: ptBR });
    } catch (e) {
        return '';
    }
};

export const AssetAlertGroupCard = memo<AssetAlertGroupCardProps>(({ alerts, onClick, onSelectOrder }) => {
    if (alerts.length === 0) return null;

    const representative = alerts[0];
    const priorityColor = representative.priorityColor || '#64748b';
    const openCount = alerts.filter(a => !a.isDone).length;
    const resolvedCount = alerts.filter(a => a.isDone).length;

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl overflow-hidden p-5 flex flex-col transition-all duration-300 ${
                onClick
                    ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]'
                    : ''
            }`}
        >
            {/* Cabeçalho do Ativo */}
            <div className="flex items-stretch justify-between gap-3 mb-4">
                <div
                    className="text-white rounded-[12px] px-4 py-2.5 flex items-center shadow-md shrink-0"
                    style={{ backgroundColor: representative.assetStatusColor || priorityColor }}
                >
                    <div className="flex flex-col text-left justify-center">
                        <span className="text-[16px] font-bold tracking-tight leading-none mb-1">
                            {representative.assetCode || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1.5 leading-none text-[9.5px] font-bold opacity-95 tracking-wide">
                            <span>{representative.assetStatusName || 'N/A'}</span>
                            <span>{formatDate(representative.createdAt, "dd/MM/yyyy")}</span>
                        </div>
                    </div>
                </div>

                <Avatar
                    src={dataService.getPublicImageUrl('', '', { width: 100, height: 100, resize: 'cover' })}
                    alt={representative.assetDescription || 'Ativo'}
                    size="sm"
                    className="border border-slate-200 dark:border-slate-800 shrink-0"
                />
            </div>

            {/* Descrição do Ativo */}
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase leading-snug tracking-wide text-left mb-4">
                {representative.assetDescription || 'Sem descrição do ativo'}
            </h3>

            {/* Grade Técnica */}
            <div className="grid grid-cols-2 gap-4 text-left mb-3">
                <div className="flex flex-col gap-[2px]">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Unidade</span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                        {representative.clientName || '(Sem cliente)'}
                    </span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                        {representative.unitDescription || '(Sem unidade)'}
                    </span>
                </div>
                <div className="flex flex-col gap-[2px]">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Setor - Posição</span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                        {[representative.tagName, representative.tagSubName].filter(Boolean).join(' > ') || 'SEM TAG'}
                    </span>
                </div>
            </div>

            {/* Contador de alertas */}
            <div className="flex items-center gap-2 mb-3">
                {openCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 dark:bg-red-600/20 text-red-500 dark:text-red-400 border border-red-500/20">
                        <span className="material-symbols-outlined text-[11px] font-black">error_outline</span>
                        <span className="text-[8px] font-black uppercase tracking-widest">
                            {openCount} aberto{openCount > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
                {resolvedCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[11px] font-black">check_circle</span>
                        <span className="text-[8px] font-black uppercase tracking-widest">
                            {resolvedCount} resolvido{resolvedCount > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Lista de alertas */}
            <div className="space-y-1.5">
                {alerts.map(alert => {
                    const alertColor = alert.priorityColor || '#64748b';

                    return (
                        <div
                            key={alert.id}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5"
                        >
                            {/* Bolinha de prioridade */}
                            <div className="pt-1.5 shrink-0">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: alertColor }}
                                />
                            </div>

                            {/* Descrição + Badges */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[12px] font-bold leading-snug text-left ${alert.isDone ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {alert.description || 'Sem descrição do alerta'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {alert.priorityName && (
                                        <div
                                            className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm"
                                            style={{ backgroundColor: alertColor }}
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
                                {alert.orderId && onSelectOrder && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSelectOrder(alert.orderId!); }}
                                        className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 w-fit hover:bg-blue-600/20 dark:hover:bg-blue-600/30 transition-colors cursor-pointer"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">OS: {alert.orderMask}</span>
                                    </button>
                                )}
                            </div>

                            {/* Data + Status à direita, topo */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">
                                        {formatDate(alert.createdAt)}
                                    </span>
                                </div>
                                {alert.isDone ? (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <span className="material-symbols-outlined text-[10px] font-black">check_circle</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Resolvido</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/10 dark:bg-red-600/20 text-red-500 dark:text-red-400 border border-red-500/20">
                                        <span className="material-symbols-outlined text-[10px] font-black">error_outline</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Aberto</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>


        </div>
    );
});

AssetAlertGroupCard.displayName = 'AssetAlertGroupCard';
