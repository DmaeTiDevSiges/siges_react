import React, { useCallback } from 'react';
import { OrderObject } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface OrderObjectsListProps {
    onSelect: (object: OrderObject) => void;
    onAdd: () => void;
}

export const OrderObjectsList: React.FC<OrderObjectsListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getOrderObjects(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: OrderObject, newStatus: boolean) => {
        await dataService.updateOrderObject(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<OrderObject>
            titleSingular="Objeto de OS"
            titlePlural="Objetos de OS"
            cacheKey="order-objects"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
        />
    );
};
