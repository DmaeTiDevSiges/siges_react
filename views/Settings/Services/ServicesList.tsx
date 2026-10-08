import React, { useCallback } from 'react';
import { Service } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SettingsCRUDList } from '../../../components/settings/SettingsCRUDList';

interface ServicesListProps {
    onSelect: (service: Service) => void;
    onAdd: () => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({ onSelect, onAdd }) => {
    const fetchItems = useCallback((status: 'all' | 'active' | 'inactive', search: string) => {
        return dataService.getServices(status, search);
    }, []);

    const handleToggleStatus = useCallback(async (item: Service, newStatus: boolean) => {
        await dataService.updateService(item.id, { isAvailable: newStatus });
    }, []);

    return (
        <SettingsCRUDList<Service>
            titleSingular="Serviço"
            titlePlural="Serviços"
            cacheKey="services-list"
            fetchItems={fetchItems}
            onSelect={onSelect}
            onAdd={onAdd}
            onToggleStatus={handleToggleStatus}
            renderExtra={(service) => (
                <div className="flex items-center justify-between mt-1">
                    {service.unit && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                            {service.unit}
                        </span>
                    )}
                    {service.code && (
                        <span className="text-xs text-slate-400 font-mono">
                            Cód: {service.code}
                        </span>
                    )}
                </div>
            )}
        />
    );
};
