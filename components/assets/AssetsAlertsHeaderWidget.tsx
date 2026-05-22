import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { AssetAlert } from '../../types';

interface AssetsAlertsHeaderWidgetProps {
    onNavigate?: (screen: string) => void;
}

export const AssetsAlertsHeaderWidget: React.FC<AssetsAlertsHeaderWidgetProps> = ({ onNavigate }) => {
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await dataService.getAllActiveAssetAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to load asset alerts', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />;

    if (alerts.length === 0) return null;

    return (
        <button
            onClick={() => onNavigate?.('assets-alerts')}
            className="flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/40 active:scale-95 transition-all"
            title="Ver alertas de ativos"
        >
            <span className="material-symbols-outlined text-[14px] mr-1">notifications</span>
            {alerts.length}
        </button>
    );
};
