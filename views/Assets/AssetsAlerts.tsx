import React, { useEffect, useState } from 'react';
import { AssetAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { AssetsAlertsPDFButton } from '../../components/reports/AssetsAlertsPDFButton';
import { AssetAlertListItem } from './AssetAlertListItem';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssetsAlertsProps {
    onSelectAsset?: (assetId: string) => void;
}

export const AssetsAlerts: React.FC<AssetsAlertsProps> = ({ onSelectAsset }) => {
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alertFilter, setAlertFilter] = useState<'abertos' | 'resolvidos' | 'todos'>('abertos');

    const filteredAlerts = alerts.filter(alert => {
        if (alertFilter === 'abertos') return !alert.isDone;
        if (alertFilter === 'resolvidos') return alert.isDone;
        return true;
    });

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dataService.getAllAssetAlerts();
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

            {/* Header: Filtros e Ações */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                
                {/* Filtros de Alertas */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {[
                        { value: 'abertos', label: 'Abertos', activeClass: 'bg-red-600 text-white shadow-md shadow-red-600/20' },
                        { value: 'resolvidos', label: 'Resolvidos', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' },
                        { value: 'todos', label: 'Todos', activeClass: 'bg-blue-500 text-white shadow-md shadow-blue-500/10' }
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setAlertFilter(f.value as 'abertos' | 'resolvidos' | 'todos')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                                alertFilter === f.value
                                    ? f.activeClass
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Botão PDF */}
                <AssetsAlertsPDFButton alerts={filteredAlerts} filterName={alertFilter} />
            </div>

            {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <span className="material-icons-outlined text-slate-300 dark:text-slate-600 text-5xl">check_circle</span>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                        {alertFilter === 'abertos' ? 'Nenhum alerta em aberto' : alertFilter === 'resolvidos' ? 'Nenhum alerta resolvido' : 'Nenhum alerta ativo'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[240px]">
                        {alertFilter === 'abertos' 
                            ? 'Todos os ativos estão sem alertas pendentes no momento.' 
                            : alertFilter === 'resolvidos' 
                                ? 'Não há registros de alertas resolvidos.' 
                                : 'Não existem alertas registrados no momento.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAlerts.map((alert) => (
                        <AssetAlertListItem
                            key={alert.id}
                            alert={alert}
                            onClick={() => alert.assetId && onSelectAsset?.(alert.assetId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
