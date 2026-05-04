import { useState } from 'react';
import { User } from '../types';

type UserStatus = 'available' | 'unavailable' | 'busy';

interface StatusConfig {
    color: string;
    label: string;
    description: string;
}

const statusConfig: Record<UserStatus, StatusConfig> = {
    available: {
        color: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
        label: 'Disponível',
        description: 'Aguardando chamados'
    },
    unavailable: {
        color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        label: 'Indisponível',
        description: 'Fora de serviço'
    },
    busy: {
        color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
        label: 'Em Atendimento',
        description: 'Atendendo chamado'
    }
};

/**
 * Custom hook for managing user status modal
 * @param currentUser - Current user object
 * @param onStatusChange - Callback function when status changes
 * @returns Status modal state and handlers
 */
export const useStatusModal = (
    currentUser: Partial<User> | null | undefined,
    onStatusChange?: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>
) => {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    /**
     * Determine current user status
     */
    const getCurrentStatus = (): UserStatus => {
        if (!currentUser) return 'unavailable';
        if (currentUser.isAvailable && (currentUser.ovIdInProgress && Number(currentUser.ovIdInProgress) > 0)) {
            return 'busy';
        }
        return currentUser.isAvailable ? 'available' : 'unavailable';
    };

    const currentStatus = getCurrentStatus();

    /**
     * Handle status change
     */
    const handleStatusChange = async (newStatus: UserStatus) => {
        if (!onStatusChange) return;

        setIsUpdating(true);
        try {
            let isAvailable = false;
            let ovIdInProgress = '0';

            switch (newStatus) {
                case 'available':
                    isAvailable = true;
                    ovIdInProgress = '0';
                    break;
                case 'unavailable':
                    isAvailable = false;
                    ovIdInProgress = '0';
                    break;
                case 'busy':
                    isAvailable = true;
                    ovIdInProgress = currentUser?.ovIdInProgress || '1';
                    break;
            }

            await onStatusChange(isAvailable, ovIdInProgress);
            setShowStatusModal(false);
        } catch (error) {
            console.error('Error changing status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        showStatusModal,
        setShowStatusModal,
        isUpdating,
        currentStatus,
        statusConfig,
        handleStatusChange
    };
};
