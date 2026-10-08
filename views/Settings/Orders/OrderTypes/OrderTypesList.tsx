import React, { useCallback } from 'react';
import { OrderType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SettingsCRUDList } from '../../../../components/settings/SettingsCRUDList';

interface OrderTypesListProps {
    onSelect: (orderType: OrderType) => void;
    onAdd: () => void;
}

export const OrderTypesList: React.FC<OrderTypesListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getOrderTypes(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: OrderType, newStatus: boolean) => {
        await dataService.updateOrderType(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<OrderType>
            titleSingular="Tipo de OS"
            titlePlural="Tipos de OS"
            cacheKey="order-types"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
            renderExtra={(item) => (
                <div className="flex items-center gap-2 mt-1">
                    {item.code && (
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                            {item.code}
                        </span>
                    )}
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {item.departmentName || 'Departamento Desconhecido'}
                    </span>
                </div>
            )}
        />
    );
};
