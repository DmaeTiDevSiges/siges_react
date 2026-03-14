import React, { useState } from 'react';
import { ActionMenu } from '../ui/ActionMenu';
import { useOrderActions, OrderActionType } from '../../hooks/useOrderActions';
import { Order } from '../../types';
import { AuthorizeOrderModal } from './modals/AuthorizeOrderModal';
import { ScheduleOrderModal } from './modals/ScheduleOrderModal';
import { CancelOrderModal } from './modals/CancelOrderModal';
import { UpdateTeamModal } from './modals/UpdateTeamModal';
import { useAuth } from '../../contexts/AuthContext';

interface OrderActionManagerProps {
    order: Order;
    onSuccess?: () => void;
    className?: string;
}

/**
 * Component that coordinates the ActionMenu and its associated Modals
 */
export const OrderActionManager: React.FC<OrderActionManagerProps> = ({
    order,
    onSuccess,
    className
}) => {
    const { currentUser } = useAuth();
    const { actions } = useOrderActions(order, currentUser);

    const [activeModal, setActiveModal] = useState<OrderActionType | null>(null);

    const handleAction = (actionId: string) => {
        const type = actionId as OrderActionType;
        if (type === 'DETAILS') {
            // Details are usually handled by the card click or a specific button
            return;
        }
        setActiveModal(type);
    };

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        setActiveModal(null);
    };

    if (actions.length === 0) return null;

    return (
        <div className={className}>
            <ActionMenu actions={actions} onAction={handleAction} />

            {/* Authorization / Generation Modals */}
            {(activeModal === 'GENERATE_OS' || activeModal === 'AUTHORIZE') && (
                <AuthorizeOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Scheduling Modals */}
            {(activeModal === 'SCHEDULE' || activeModal === 'RESCHEDULE') && (
                <ScheduleOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Cancellation Modal */}
            {activeModal === 'CANCEL' && (
                <CancelOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Team Management Modal */}
            {activeModal === 'UPDATE_TEAM' && (
                <UpdateTeamModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};
