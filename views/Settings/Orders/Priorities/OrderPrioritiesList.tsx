import React, { useCallback } from 'react';
import { Priority } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface PrioritiesListProps {
    onSelect: (priority: Priority) => void;
    onAdd: () => void;
}

export const PrioritiesList: React.FC<PrioritiesListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getPriorities(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: Priority, newStatus: boolean) => {
        await dataService.updatePriority(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<Priority>
            titleSingular="Prioridade"
            titlePlural="Prioridades"
            cacheKey="order-priorities"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
        />
    );
};
