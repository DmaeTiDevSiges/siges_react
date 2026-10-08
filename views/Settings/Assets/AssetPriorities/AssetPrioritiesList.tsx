import React, { useCallback } from 'react';
import { AssetPriority } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface AssetPrioritiesListProps {
    onSelect: (item: AssetPriority) => void;
    onAdd: () => void;
}

export const AssetPrioritiesList: React.FC<AssetPrioritiesListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getAssetPriorities(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: AssetPriority, newStatus: boolean) => {
        await dataService.updateAssetPriority(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<AssetPriority>
            titleSingular="Prioridade de Ativo"
            titlePlural="Prioridades de Ativo"
            cacheKey="asset-priorities"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
        />
    );
};
