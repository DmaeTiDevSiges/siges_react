import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import type { OrderVisit, OrderVisitTeam, User } from '../types';

/**
 * "Adicionar membro à equipe da visita" (OrderVisitCardDetail, visual atual e novo):
 * carrega os usuários que podem entrar e cuida da escolha e do envio.
 *
 * Pode entrar: ativo (status 2), do mesmo departamento prestador da OS, que não seja o
 * líder da visita nem já esteja na equipe; em ordem alfabética (pt-BR).
 */
export const useVisitTeamAdd = (
    visit: OrderVisit,
    team: OrderVisitTeam[],
    onAddTeamMember?: (userId: string) => void | Promise<void>,
) => {
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (onAddTeamMember) loadAvailableUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onAddTeamMember, team]);

    const loadAvailableUsers = async () => {
        try {
            const users = await dataService.getUsers();
            const teamUserIds = new Set(team.map(m => m.userId));
            const filtered = users.filter(u =>
                String(u.statusId) === '2' &&
                String(u.id) !== String(visit.ovTeamLeadId) &&
                String(u.departmentId) === String(visit.providerDepartmentId) &&
                !teamUserIds.has(u.id)
            ).sort((a, b) => (a.nameShort || '').localeCompare(b.nameShort || '', 'pt-BR'));

            setAvailableUsers(filtered);
        } catch (error) {
            console.error('Error loading available users:', error);
        }
    };

    const handleAddClick = async () => {
        if (!selectedUserId) {
            toast.error('Selecione um usuário');
            return;
        }

        setIsAdding(true);
        try {
            if (onAddTeamMember) {
                await onAddTeamMember(selectedUserId);
                setSelectedUserId('');
            }
        } finally {
            setIsAdding(false);
        }
    };

    return { availableUsers, selectedUserId, setSelectedUserId, isAdding, handleAddClick };
};
