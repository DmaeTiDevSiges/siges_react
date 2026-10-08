import React, { useCallback } from 'react';
import { AssetStatus } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface AssetStatusesListProps {
    onSelect: (item: AssetStatus) => void;
    onAdd: () => void;
}

export const AssetStatusesList: React.FC<AssetStatusesListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getAssetStatuses(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: AssetStatus, newStatus: boolean) => {
        await dataService.updateAssetStatus(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<AssetStatus>
            titleSingular="Status de Ativo"
            titlePlural="Status de Ativo"
            cacheKey="asset-statuses"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
            renderExtra={(item) => (
                <div className="flex items-center gap-2 mt-1">
                    {item.color && (
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                    )}
                    {item.color && (
                        <span className="text-xs text-slate-500 font-mono">
                            {item.color}
                        </span>
                    )}
                </div>
            )}
        />
    );
};
