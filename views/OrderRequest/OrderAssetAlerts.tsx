import React from 'react';
import { AssetAlert } from '../../types';
import { AssetAlertListItem } from '../Assets/AssetAlertListItem';

interface OrderAssetAlertsProps {
    alerts: AssetAlert[];
}

export const OrderAssetAlerts: React.FC<OrderAssetAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Alertas Vinculados ({alerts.length})</h3>
            </div>
            {alerts.map(alert => (
                <AssetAlertListItem
                    key={alert.id}
                    alert={alert}
                />
            ))}
        </div>
    );
};
