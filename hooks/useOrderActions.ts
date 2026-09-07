import { Order, User } from '../types';
import { usePermissions } from '../contexts/PermissionsContext';

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

export const useOrderActions = (order: Order | undefined | null, currentUser: User | null) => {
    const { canCreate, canView, canEdit } = usePermissions();

    const actions: OrderAction[] = [];

    if (order && currentUser) {
        const statusId = order.statusId ? Number(order.statusId) : 0;
        const isSS = !order.parentId;
        const canCancelSS = canView('services_requests_cancel');
        const canCancelOS = canCreate('orders_requests_cancel');
        const canAuthorize = canCreate('orders_requests_authorize');
        const canSchedule = canCreate('orders_requests_schedule');
        const canChangeTeam = canCreate('orders_requests_change_team_leader');

        if (statusId === 1 && isSS) {
            actions.push({ id: 'GENERATE_OS', label: 'Gerar OS', description: 'Converter solicitação em OS', icon: 'assignment_add', variant: 'primary' });
            if (canCancelSS) {
                actions.push({ id: 'CANCEL', label: 'Cancelar SS', description: 'Encerrar solicitação', icon: 'cancel', variant: 'danger' });
            }
        }

        if (statusId === 1 && !isSS) {
            if (canAuthorize) {
                actions.push({ id: 'AUTHORIZE', label: 'Autorizar OS', description: 'Aprovar e dar prosseguimento', icon: 'check_circle', variant: 'primary' });
            }
        }

        if (statusId === 2 && !isSS) {
            if (canAuthorize) {
                actions.push({ id: 'AUTHORIZE', label: 'Autorizar OS', description: 'Aprovar e dar prosseguimento', icon: 'check_circle', variant: 'primary' });
            }
        }

        if (statusId === 3 && !isSS) {
            if (canSchedule) {
                actions.push({ id: 'SCHEDULE', label: 'Agendar', description: 'Definir data para execução', icon: 'event', variant: 'default' });
            }
            if (canChangeTeam) {
                actions.push({ id: 'UPDATE_TEAM', label: 'Alterar Equipe', description: 'Modificar equipe responsável', icon: 'groups', variant: 'default' });
            }
        }

        if (statusId === 4 && !isSS) {
            if (canSchedule) {
                actions.push({ id: 'RESCHEDULE', label: 'Reagendar', description: 'Alterar data agendada', icon: 'event_repeat', variant: 'default' });
            }
        }

        if (canEdit('orders_requests_edit')) {
            actions.push({ id: 'EDIT_OS', label: isSS ? 'Editar SS' : 'Editar OS', description: isSS ? 'Alterar dados da solicitação' : 'Alterar dados da ordem de serviço', icon: 'edit_square', variant: 'default' });
        }

        if (!isSS && canCancelOS) {
            actions.push({ id: 'CANCEL', label: 'Cancelar OS', description: 'Encerrar esta solicitação', icon: 'cancel', variant: 'danger' });
        }
    }

    return { actions };
};
