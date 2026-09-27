import React, { useEffect, useState } from 'react';
import { OrderStatusLogItem } from '../../types';
import { dataService } from '../../services/dataService';
import { getStatusConfig } from '../../utils/formatters';
import { Loading } from '../ui/Loading';

interface OrderStatusHistoryTimelineProps {
    orderId: string;
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

/**
 * Consumidor do log global (Parte 1): lista as linhas de orders_statuses_logs
 * da OS/SS, da situação mais recente para a mais antiga.
 * Cada linha guarda o estado resultante (semântica NEW).
 */
export const OrderStatusHistoryTimeline: React.FC<OrderStatusHistoryTimelineProps> = ({ orderId }) => {
    const [items, setItems] = useState<OrderStatusLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        dataService.getOrderStatusHistory(orderId)
            .then(data => { if (!cancelled) setItems(data); })
            .catch(err => console.error('Error fetching order status history:', err))
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, [orderId]);

    if (isLoading) {
        return (
            <div className="py-20 text-center space-y-4">
                <Loading size="md" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                    CARREGANDO SITUAÇÕES...
                </p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-slate-300 text-4xl">history</span>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        Sem histórico de situações
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Nenhuma mudança de situação registrada para esta ordem.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Histórico de Situações
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {items.length} {items.length === 1 ? 'registro' : 'registros'}
                </span>
            </div>

            <div className="relative space-y-6 pl-8 before:absolute before:inset-y-2 before:left-[7px] before:w-0.5 before:bg-linear-to-b before:from-slate-200 before:to-transparent dark:before:from-slate-700">
                {items.map((item, index) => {
                    const config = getStatusConfig(item.statusId);
                    const isCurrent = index === 0;
                    const statusAt = formatDateTime(item.statusAt);
                    const createdAt = formatDateTime(item.createdAt);
                    const showRecorded = !!createdAt && createdAt !== statusAt;
                    // cfg_orders_statuses.background_color pode ser classe Tailwind ou hex
                    const bgHex = item.statusBgColor?.startsWith('#') ? item.statusBgColor : undefined;

                    return (
                        <div key={item.id} className="relative">
                            {/* Dot */}
                            <span
                                className={`absolute -left-8 top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-background-dark ${bgHex ? '' : config.barColor}`}
                                style={bgHex ? { backgroundColor: bgHex } : undefined}
                            />

                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200 dark:hover:border-white/10">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color} ${config.bgColor}`}
                                    >
                                        <span className="material-symbols-outlined text-[13px]">
                                            {item.statusIcon || config.icon}
                                        </span>
                                        {item.statusName || config.label}
                                    </span>

                                    {isCurrent && (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            Atual
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                        {statusAt ? `Situação em vigor desde ${statusAt}` : 'Situação registrada'}
                                    </p>
                                    {showRecorded && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                            Gravado em {createdAt}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-white/5 flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] text-slate-400">
                                            {item.userName ? 'person' : 'smart_toy'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                            {item.userName || 'Sistema'}
                                        </span>
                                    </span>

                                    {item.orderParentId && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            SS {item.orderParentId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
