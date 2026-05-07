import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../../services/dataService';
import { getInitials } from '../../utils/formatters';
import { UserNotification } from '../../types';
import { toast } from 'sonner';
import { UserAvatar, UserStatus as AvatarStatus } from '../../components/ui/UserAvatar';
import { Loading } from '../../components/ui/Loading';


interface NotificationsListProps {
    notifications: UserNotification[];
    onNotificationRead: (id: string) => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
    notifications: initialNotifications,
    onNotificationRead
}) => {
    const [localNotifications, setLocalNotifications] = useState<UserNotification[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial sync
    useEffect(() => {
        setLocalNotifications(initialNotifications);
        setPage(0);
        setIsLoadingMore(false);
        setHasMore(initialNotifications.length >= 10);
    }, [initialNotifications]);

    // AUTO-FILL
    useEffect(() => {
        if (hasMore && !isLoadingMore && localNotifications.length > 0) {
            const checkAndLoad = () => {
                const container = scrollContainerRef.current;
                if (container) {
                    // Check if we can scroll. If not, load more if available.
                    // For a whole page, we might want to check window height if it's not a fixed container
                    // But here it will be inside a layout, so let's stick to container or window
                    const isScrollable = container.scrollHeight > container.clientHeight;
                    if (!isScrollable) {
                        loadMore();
                    }
                }
            };
            const timer = setTimeout(checkAndLoad, 300);
            return () => clearTimeout(timer);
        }
    }, [localNotifications.length, hasMore, isLoadingMore]);

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
                    const existingIds = new Set(prev.map(n => n.id));
                    const filteredNew = newData.filter(n => !existingIds.has(n.id));
                    return [...prev, ...filteredNew];
                });
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more notifications:', error);
            toast.error('Erro ao carregar mais notificações');
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + 300;

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
            toast.error('Erro ao marcar como lida');
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
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-6 md:p-8 custom-scrollbar h-full"
        >
            <div className="max-w-2xl mx-auto space-y-4">
                {localNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                        <div className="relative mb-8">
                            <div className="w-[160px] h-[160px] bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-primary/5">
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined text-slate-200 dark:text-slate-700 select-none shrink-0"
                                        style={{ fontSize: '80px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        notifications
                                    </span>
                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center shadow-lg z-10">
                                        <span className="material-symbols-outlined text-white text-lg font-black">check</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-bold text-xl mb-2">
                            Tudo em ordem!
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-[240px] leading-relaxed">
                            No momento você não possui novas notificações para revisar.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {localNotifications.map((notification) => {
                                const styles = getTypeStyles(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className="group relative bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.995]"
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.strip} opacity-70`} />

                                        <div className="p-4 flex gap-5">
                                            <div className="shrink-0">
                                                <div className="relative">
                                                    <UserAvatar
                                                        src={notification.relatedUserAvatarUrl}
                                                        name={notification.relatedUserName || 'Usuário'}
                                                        size="md"
                                                        status={notification.relatedUserIsAvailable
                                                            ? (notification.relatedUserOvIdInProgress && notification.relatedUserOvIdInProgress > 0 ? 'busy' : 'available')
                                                            : 'unavailable'}
                                                        className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md ring-0"
                                                    />
                                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${styles.bg} ${styles.color} rounded-lg flex items-center justify-center border-2 border-white dark:border-slate-800`}>
                                                        <span className="material-symbols-outlined text-[12px] font-black">{styles.icon}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start mb-1.5">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight wrap-break-word">
                                                        {notification.title}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed pr-6">
                                                    {notification.body}
                                                </p>
                                                <div className="flex justify-end mt-3">
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-wider bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                                                        {formatDate(notification.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleRead(notification.id)}
                                                    disabled={loadingId === notification.id}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${loadingId === notification.id
                                                        ? 'bg-slate-100 dark:bg-slate-800 animate-spin'
                                                        : 'text-slate-300 hover:text-green-500 hover:bg-green-500/10 dark:text-slate-600 dark:hover:text-green-400 dark:hover:bg-green-400/10'
                                                        }`}
                                                    title="Marcar como lida"
                                                >
                                                    <span className="material-symbols-outlined text-2xl">
                                                        {loadingId === notification.id ? 'sync' : 'done'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {isLoadingMore && (
                            <div className="flex justify-center py-6">
                                <div className="flex items-center gap-3 text-primary font-bold uppercase text-[10px] tracking-widest">
                                    <Loading size="xs" />
                                    Carregando mais...
                                </div>
                            </div>
                        )}
                        {!hasMore && localNotifications.length > 0 && (
                            <div className="text-center py-8">
                                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                    Fim das notificações
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
