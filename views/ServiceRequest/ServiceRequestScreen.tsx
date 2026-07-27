import React from 'react';
import { ServiceRequestForm } from './ServiceRequestForm';
import { Order } from '../../types';

interface ServiceRequestPageProps {
    onBack: () => void;
    onSubmit?: (data: Order) => void;
    initialData?: Partial<Order>;
    onSelectOrder?: (order: Order) => void;
}

export const ServiceRequestPage: React.FC<ServiceRequestPageProps> = ({ onBack, onSubmit, initialData, onSelectOrder }) => {
    return (
        <div className="h-full w-full bg-background-light dark:bg-background-dark safe-area-bottom">
            <ServiceRequestForm onBack={onBack} onSubmit={onSubmit} initialData={initialData} onSelectOrder={onSelectOrder} />
        </div>
    );
};
