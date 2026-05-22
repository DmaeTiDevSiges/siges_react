import React, { useEffect, useState } from 'react';
import { AssetAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssetsAlertsProps {
    onSelectAsset?: (assetId: string) => void;
}

export const AssetsAlerts: React.FC<AssetsAlertsProps> = ({ onSelectAsset }) => {
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dataService.getAllActiveAssetAlerts();
            setAlerts(data);
        } catch (err: any) {
            console.error('Failed to load asset alerts', err);
            setError('Erro ao carregar alertas de ativos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loading size="md" text="Carregando alertas..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
                <span className="material-icons-outlined text-red-400 text-4xl">error_outline</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{error}</p>
                <button
                    onClick={loadAlerts}
                    className="text-sm font-bold text-primary px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className="px-4 pt-4 pb-6">

            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <span className="material-icons-outlined text-slate-300 dark:text-slate-600 text-5xl">check_circle</span>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Nenhum alerta ativo</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[240px]">
                        Todos os ativos estão sem alertas pendentes no momento.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            onClick={() => alert.assetId && onSelectAsset?.(alert.assetId)}
                            className={`rounded-2xl border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-row ${onSelectAsset && alert.assetId ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] transition-all' : ''}`}
                        >
                            {/* Priority stripe */}
                            <div
                                className="w-1.5 flex-shrink-0 rounded-l-2xl"
                                style={{ backgroundColor: alert.priorityColor || '#ef4444' }}
                            />

                            <div className="p-4 flex-1 min-w-0 relative">
                                {/* Header info + Badges (Client, Unit, Tags + Category Tags in Top-Right) */}
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="min-w-0 flex-1 pr-24">
                                        {/* Cliente (Top Line) */}
                                        {alert.clientName && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                                                {alert.clientName}
                                            </p>
                                        )}
                                        
                                        {/* Unidade (Main Title Line) */}
                                        {alert.unitDescription && (
                                            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                                                {alert.unitDescription}
                                            </h3>
                                        )}

                                        {/* Setor / SubSetor (Bottom Line) */}
                                        {(alert.tagName || alert.tagSubName) && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5 mb-2">
                                                {[alert.tagName, alert.tagSubName].filter(Boolean).join(' / ')}
                                            </p>
                                        )}

                                        {/* Ativo (Badge/Pill below info stack) */}
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 max-w-full">
                                            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 shrink-0">{alert.assetCode}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                            <span className="truncate">{alert.assetDescription || 'Ativo'}</span>
                                        </div>
                                    </div>

                                    {/* Right Badges (Priority, OrderType) - Positioned absolutely to the top-right of the card */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 shrink-0">
                                        {alert.priorityName && (
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap"
                                                style={{
                                                    backgroundColor: alert.priorityColor ? `${alert.priorityColor}18` : '#fee2e2',
                                                    color: alert.priorityColor || '#ef4444',
                                                    borderColor: alert.priorityColor ? `${alert.priorityColor}40` : '#fecaca',
                                                }}
                                            >
                                                {alert.priorityName}
                                            </span>
                                        )}
                                        {alert.orderTypeName && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 whitespace-nowrap">
                                                {alert.orderTypeName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description + Date */}
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed min-w-0 flex-1">
                                        {alert.description}
                                    </p>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap mt-1 shrink-0">
                                        {alert.createdAt
                                            ? format(new Date(alert.createdAt), "dd/MM/yy", { locale: ptBR })
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
