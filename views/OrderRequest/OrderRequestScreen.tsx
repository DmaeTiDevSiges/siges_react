import React from 'react';
import { OrderRequestForm } from './OrderRequestForm';
import { Order } from '../../types';

interface OrderRequestPageProps {
    onBack: () => void;
    onSubmit?: (data: Order) => void;
    initialData?: Partial<Order>;
    mode?: 'create' | 'edit';
}

export const OrderRequestPage: React.FC<OrderRequestPageProps> = ({ onBack, onSubmit, initialData, mode }) => {
    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 safe-area-bottom">
            <OrderRequestForm onBack={onBack} onSubmit={onSubmit} initialData={initialData} mode={mode} />
        </div>
    );
};
