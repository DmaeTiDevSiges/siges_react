import { useMemo } from 'react';
import { Order, User } from '../types';

export type OrderActionType =
    | 'GENERATE_OS'
    | 'CANCEL'
    | 'AUTHORIZE'
    | 'SCHEDULE'
    | 'RESCHEDULE'
    | 'UPDATE_TEAM'
    | 'EDIT_OS'
    | 'DETAILS';

export interface OrderAction {
    id: OrderActionType;
    label: string;
    description: string;
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
            availableActions.push({ id: 'GENERATE_OS', label: 'Gerar OS', description: 'Converter solicitação em OS', icon: 'assignment_add', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }

        // 1b. OS Não Programada (edge case - OS criada mas não autorizada ainda)
        if (statusId === 1 && !isSS) {
            availableActions.push({ id: 'AUTHORIZE', label: 'Autorizar', description: 'Aprovar e dar prosseguimento', icon: 'check_circle', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }

        // 2. OS Em Avaliação (SS tem status 2 mas não possui ações no fluxo)
        if (statusId === 2 && !isSS) {
            availableActions.push({ id: 'AUTHORIZE', label: 'Autorizar', description: 'Aprovar e dar prosseguimento', icon: 'check_circle', variant: 'primary' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }

        // 3. OS Autorizada
        if (statusId === 3 && !isSS) {
            availableActions.push({ id: 'SCHEDULE', label: 'Agendar', description: 'Definir data para execução', icon: 'event', variant: 'default' });
            availableActions.push({ id: 'UPDATE_TEAM', label: 'Alterar Equipe', description: 'Modificar equipe responsável', icon: 'groups', variant: 'default' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }

        // 4. OS Agendada
        if (statusId === 4 && !isSS) {
            availableActions.push({ id: 'RESCHEDULE', label: 'Reagendar', description: 'Alterar data agendada', icon: 'event_repeat', variant: 'default' });
            availableActions.push({ id: 'CANCEL', label: 'Cancelar', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }

        // Note: For statuses 5, 6, 7 e 8, no actions are available as per flow.

        // Editar OS - available for super admins on OS items regardless of status
        if (!isSS && currentUser.isAdminSuper) {
            availableActions.push({ id: 'EDIT_OS', label: 'Editar OS', description: 'Alterar dados da ordem de serviço', icon: 'edit_square', variant: 'default' });
        }

        return availableActions;
    }, [order, currentUser]);

    return { actions };
};
