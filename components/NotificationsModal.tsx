import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { IconButton } from './ui/IconButton';
import { dataService } from '../services/dataService';
import { getInitials } from '../utils/formatters';
import { UserNotification } from '../types';
import { UserAvatar, UserStatus as AvatarStatus } from './ui/UserAvatar';
import { Loading } from './ui/Loading';


interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: UserNotification[]; // initial set from App
    onNotificationRead: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose,
    notifications: initialNotifications,
    onNotificationRead
}) => {
    const [localNotifications, setLocalNotifications] = useState<UserNotification[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sync with initial notifications ONLY when modal opens to avoid resets when App updates
    useEffect(() => {
        if (isOpen) {
            setLocalNotifications(initialNotifications);
            setPage(0);
            setIsLoadingMore(false);
            // If we have at least 10, there might be more
            setHasMore(initialNotifications.length >= 10);
        }
    }, [isOpen]); // Only trigger on isOpen change

    // AUTO-FILL: If the content doesn't fill the container and we have more, load more immediately
    useEffect(() => {
        if (isOpen && hasMore && !isLoadingMore && localNotifications.length > 0) {
            const checkAndLoad = () => {
                const container = scrollContainerRef.current;
                if (container && container.scrollHeight <= container.clientHeight) {
                    loadMore();
                }
            };
            // Small timeout to allow DOM to settle
            const timer = setTimeout(checkAndLoad, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localNotifications.length, hasMore, isLoadingMore]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const newData = await dataService.getNotifications(nextPage, 10);

            if (newData.length < 10) {
                setHasMore(false);
            }

            if (newData.length > 0) {
                setLocalNotifications(prev => {
                    // Filter out any duplicates that might have been added by real-time
                    const existingIds = new Set(prev.map(n => n.id));
                    const filteredNew = newData.filter(n => !existingIds.has(n.id));
                    return [...prev, ...filteredNew];
                });
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more notifications:', error);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Increase threshold to 200px for better UX
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + 200;

        if (isNearBottom && !isLoadingMore && hasMore && localNotifications.length > 0) {
            loadMore();
        }
    };

    const handleRead = async (id: string) => {
        setLoadingId(id);
        try {
            await dataService.markNotificationAsRead(id);
            setLocalNotifications(prev => prev.filter(n => n.id !== id));
            onNotificationRead(id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        } finally {
            setLoadingId(null);
        }
    };


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Agora';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)}h`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'profile_photo_change':
                return {
                    icon: 'person',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    strip: 'bg-blue-500'
                };
            case 'system':
                return {
                    icon: 'settings',
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    strip: 'bg-amber-500'
                };
            case 'alert':
                return {
                    icon: 'warning',
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    strip: 'bg-red-500'
                };
            default:
                return {
                    icon: 'notifications',
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                    border: 'border-primary/20',
                    strip: 'bg-primary'
                };
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Notificações"
        >
            <div className="flex flex-col -mt-2">
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar"
                >
                    {localNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="relative mb-6">
                                <div className="w-[280px] h-[280px] bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                                    <div className="relative">
                                        <span
                                            className="material-symbols-outlined text-slate-300 dark:text-slate-600 select-none shrink-0"
                                            style={{ fontSize: '64px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            notifications
                                        </span>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-card-dark flex items-center justify-center shadow-md z-10">
                                            <span className="material-symbols-outlined text-white text-[12px] font-black">check</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-bold text-base mb-1">
                                Tudo em ordem!
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-[200px] leading-relaxed">
                                Você não tem novas notificações no momento.
                            </p>
                        </div>
                    ) : (
                        localNotifications.map((notification) => {
                            const styles = getTypeStyles(notification.type);
                            return (
                                <div
                                    key={notification.id}
                                    className="group relative bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
                                >
                                    {/* Accent Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.strip} opacity-70`} />

                                    <div className="p-4 flex gap-4">
                                        {/* Avatar or Icon */}
                                        <div className="shrink-0">
                                            {notification.relatedUserAvatarUrl || notification.relatedUserName ? (
                                                <UserAvatar
                                                    src={notification.relatedUserAvatarUrl}
                                                    name={notification.relatedUserName || ''}
                                                    size="md"
                                                    status={
                                                        notification.relatedUserIsAvailable
                                                            ? (notification.relatedUserOvIdInProgress && notification.relatedUserOvIdInProgress > 0 ? 'busy' : 'available')
                                                            : 'unavailable'
                                                    }
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.color} flex items-center justify-center font-bold border border-transparent shadow-sm transition-transform group-hover:scale-110`}>
                                                    <span className="material-symbols-outlined text-2xl">{styles.icon}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start mb-1">
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight wrap-break-word">
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pr-4">
                                                {notification.body}
                                            </p>
                                            <div className="flex justify-end mt-2">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-wider bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded-md">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleRead(notification.id)}
                                                disabled={loadingId === notification.id}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loadingId === notification.id
                                                    ? 'bg-slate-100 dark:bg-slate-800 animate-spin'
                                                    : 'text-slate-300 hover:text-green-500 hover:bg-green-500/10 dark:text-slate-600 dark:hover:text-green-400 dark:hover:bg-green-400/10'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {loadingId === notification.id ? 'sync' : 'done'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isLoadingMore && (
                        <div className="flex justify-center py-4">
                            <Loading size="xs" />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
