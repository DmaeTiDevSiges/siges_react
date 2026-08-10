import { useState, useEffect } from 'react';
import { UserNotification } from '../types';
import { dataService } from '../services/dataService';

/**
 * Custom hook for managing notifications
 * @returns Notifications state and handlers
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    /**
     * Load notifications from service
     */
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await dataService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mark notification as read
     */
    const markAsRead = async (id: string) => {
        try {
            // TODO: Implement markAsRead in dataService
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = async () => {
        try {
            // TODO: Implement markAllAsRead in dataService
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    /**
     * Delete notification
     */
    const deleteNotification = async (id: string) => {
        try {
            // TODO: Implement deleteNotification in dataService
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
};
