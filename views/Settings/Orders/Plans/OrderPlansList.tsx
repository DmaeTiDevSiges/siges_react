import React, { useCallback } from 'react';
import { OrderPlan } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface OrderPlansListProps {
    onSelect: (plan: OrderPlan) => void;
    onAdd: () => void;
}

export const OrderPlansList: React.FC<OrderPlansListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getOrderPlans(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: OrderPlan, newStatus: boolean) => {
        await dataService.updateOrderPlan(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<OrderPlan>
            titleSingular="Plano de OS"
            titlePlural="Planos de OS"
            cacheKey="order-plans"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
        />
    );
};
