import { useMemo } from 'react';
import { Order, User } from '../types';

export type OrderActionType =
    | 'GENERATE_OS'
    | 'CANCEL'
    | 'AUTHORIZE'
    | 'SCHEDULE'
    | 'RESCHEDULE'
    | 'UPDATE_TEAM'
    | 'DETAILS';

export interface OrderAction {
    id: OrderActionType;
    label: string;
    icon: string;
    variant: 'default' | 'danger' | 'primary';
}

/**
 * Hook to determine available actions for an order based on current status and type
 */
export const useOrderActions = (order: Order | undefined | null, currentUser: User | null) => {
    const actions = useMemo(() => {
        if (!order || !currentUser) return [];

        const availableActions: OrderAction[] = [];
        const statusId = order.statusId ? Number(order.statusId) : 0;
        const isSS = !order.parentId;

        // 1. SS Não Programada
        if (statusId === 1 && isSS) {
            availableActions.push({ id: 'GENERATE_OS', label: 'Gerar OS', icon: 'list_alt', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', icon: 'cancel', variant: 'danger' });
        }

        // 1b. OS Não Programada (edge case - OS criada mas não autorizada ainda)
        if (statusId === 1 && !isSS) {
            availableActions.push({ id: 'AUTHORIZE', label: 'Autorizar', icon: 'check_circle', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', icon: 'cancel', variant: 'danger' });
        }

        // 2. OS Em Avaliação (SS tem status 2 mas não possui ações no fluxo)
        if (statusId === 2 && !isSS) {
            availableActions.push({ id: 'AUTHORIZE', label: 'Autorizar', icon: 'check_circle', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', icon: 'cancel', variant: 'danger' });
        }

        // 3. OS Autorizada
        if (statusId === 3 && !isSS) {
            availableActions.push({ id: 'SCHEDULE', label: 'Agendar', icon: 'event', variant: 'default' });
            availableActions.push({ id: 'UPDATE_TEAM', label: 'Alterar Equipe', icon: 'groups', variant: 'default' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', icon: 'cancel', variant: 'danger' });
        }

        // 4. OS Agendada
        if (statusId === 4 && !isSS) {
            availableActions.push({ id: 'RESCHEDULE', label: 'Reagendar', icon: 'event_repeat', variant: 'default' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', icon: 'cancel', variant: 'danger' });
        }

        // Note: For statuses 5, 6, 7 e 8, no actions are available as per flow.

        return availableActions;
    }, [order, currentUser]);

    return { actions };
};
