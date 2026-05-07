import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { toast } from 'sonner';

/**
 * Custom hook to manage order follow/favorite functionality
 * Provides optimistic updates and automatic synchronization
 */
export const useOrderFollow = (userId?: string) => {
    const [followedOrderIds, setFollowedOrderIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load followed orders when userId changes
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            dataService.getFollowedOrderIds(userId)
                .then(setFollowedOrderIds)
                .catch(err => {
                    console.error('Error loading followed orders:', err);
                    setFollowedOrderIds([]);
                })
                .finally(() => setIsLoading(false));
        } else {
            setFollowedOrderIds([]);
            setIsLoading(false);
        }
    }, [userId]);

    /**
     * Check if an order is followed
     */
    const isOrderFollowed = useCallback((orderId: string): boolean => {
        return followedOrderIds.includes(orderId);
    }, [followedOrderIds]);

    /**
     * Toggle follow status for an order
     * Uses optimistic updates for better UX
     */
    const toggleFollow = useCallback(async (orderId: string, showToast: boolean = true): Promise<boolean> => {
        if (!userId) {
            if (showToast) {
                toast.error('Usuário não autenticado');
            }
            return false;
        }

        // Optimistic update
        const isCurrentlyFollowed = followedOrderIds.includes(orderId);
        const newStatus = !isCurrentlyFollowed;

        setFollowedOrderIds(prev =>
            newStatus ? [...prev, orderId] : prev.filter(id => id !== orderId)
        );

        try {
            // API Call
            const confirmedStatus = await dataService.toggleOrderFollow(orderId, userId);

            // Revert if mismatch (rare but safe)
            if (confirmedStatus !== newStatus) {
                setFollowedOrderIds(prev =>
                    confirmedStatus ? [...prev, orderId] : prev.filter(id => id !== orderId)
                );
                if (showToast) {
                    toast.error('Erro ao atualizar favoritos');
                }
                return confirmedStatus;
            }

            // Success feedback
            if (showToast) {
                if (confirmedStatus) {
                    toast.success('SS adicionada aos favoritos');
                } else {
                    toast.success('SS removida dos favoritos');
                }
            }

            return confirmedStatus;
        } catch (error) {
            // Revert on error
            setFollowedOrderIds(prev =>
                isCurrentlyFollowed ? [...prev, orderId] : prev.filter(id => id !== orderId)
            );

            if (showToast) {
                toast.error('Erro ao atualizar favoritos');
            }
            console.error('Error toggling follow:', error);
            return isCurrentlyFollowed;
        }
    }, [userId, followedOrderIds]);

    /**
     * Manually refresh the followed orders list
     */
    const refresh = useCallback(async () => {
        if (userId) {
            setIsLoading(true);
            try {
                const ids = await dataService.getFollowedOrderIds(userId);
                setFollowedOrderIds(ids);
            } catch (err) {
                console.error('Error refreshing followed orders:', err);
            } finally {
                setIsLoading(false);
            }
        }
    }, [userId]);

    return {
        followedOrderIds,
        isOrderFollowed,
        toggleFollow,
        refresh,
        isLoading
    };
};
