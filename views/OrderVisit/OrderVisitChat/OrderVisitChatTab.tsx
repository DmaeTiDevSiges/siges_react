import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataService } from '../../../services/dataService';
import { supabase } from '../../../services/supabase';
import { OrderVisitChatMessage, OrderVisitChatParticipant, User } from '../../../types';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { toast } from 'sonner';

interface OrderVisitChatTabProps {
    visitId: string;
    onChatEntered?: (visitId: string) => void;
}

type TypingUser = {
    userId: string;
    userName: string;
    userAvatarUrl?: string;
};

// --- Read Receipt Indicator Component ---
const ReadReceiptIndicator: React.FC<{
    message: OrderVisitChatMessage;
    isMe: boolean;
    participantCount: number;
}> = ({ message, isMe, participantCount }) => {
    const [showReaders, setShowReaders] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const readers = message.readBy || [];
    const hasReaders = readers.length > 0;
    // All participants (except the sender) have read it
    const allRead = participantCount > 0 && readers.length >= participantCount;

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowReaders(false);
            }
        };
        if (showReaders) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showReaders]);

    if (!isMe) return null;

    return (
        <div className="relative inline-flex items-center" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setShowReaders(prev => !prev)}
                className="flex items-center gap-0.5 ml-1 cursor-pointer hover:opacity-80 transition-opacity"
                title={hasReaders ? `Visualizado por ${readers.length}` : 'Enviado'}
            >
                {/* Double check icon */}
                <span
                    className={`material-symbols-outlined text-[14px] font-bold ${
                        hasReaders
                            ? (allRead ? 'text-sky-400' : 'text-sky-400')
                            : 'text-white/40'
                    }`}
                >
                    done_all
                </span>
                {hasReaders && (
                    <span className="text-[9px] font-black text-sky-400 ml-0.5">
                        {readers.length}
                    </span>
                )}
            </button>

            {/* Popover with readers list */}
            {showReaders && (
                <div className="absolute bottom-full right-0 mb-2 z-50 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Visualizado por
                        </p>
                    </div>
                    {readers.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-2xl">visibility_off</span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Ninguém visualizou ainda</p>
                        </div>
                    ) : (
                        <div className="max-h-40 overflow-y-auto no-scrollbar">
                            {readers.map((reader, idx) => (
                                <div
                                    key={`${reader.userId}-${idx}`}
                                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <UserAvatar
                                        src={reader.userAvatarUrl}
                                        name={reader.userName}
                                        size="xs"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                            {reader.userName}
                                        </p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500">
                                            {new Date(reader.readAt).toLocaleString('pt-BR', {
                                                day: '2-digit', month: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-sky-400 text-[14px]">done_all</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Main Chat Tab Component ---
export const OrderVisitChatTab: React.FC<OrderVisitChatTabProps> = ({ visitId, onChatEntered }) => {
    const [messages, setMessages] = useState<OrderVisitChatMessage[]>([]);
    const [participants, setParticipants] = useState<OrderVisitChatParticipant[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [newMessage, setNewMessage] = useState('');
    const [isActionItem, setIsActionItem] = useState(false);
    const [infoRequested, setInfoRequested] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [activeUserIds, setActiveUserIds] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const activeUserIdsRef = useRef<string[]>([]);

    // Chat status state
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('open');
    const [chatCreatedUserId, setChatCreatedUserId] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Participant Modal states
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<User | null>(null);
    const participantsRef = useRef<OrderVisitChatParticipant[]>([]);
    const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const isChannelSubscribedRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const remoteTypingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Keep refs in sync for use in callbacks
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    const buildPresencePayload = useCallback((user: User, isTyping = false) => ({
        user_id: user.id,
        user_name: user.nameShort || user.nameFull || 'Usuario',
        user_avatar_url: user.avatarUrl || '',
        typing: isTyping
    }), []);

    const publishTypingStatus = useCallback((isTyping: boolean) => {
        const user = currentUserRef.current;
        const channel = chatChannelRef.current;
        if (!user?.id || !channel) return;

        void channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: buildPresencePayload(user, isTyping)
        });
    }, [buildPresencePayload]);

    const loadMessages = useCallback(async () => {
        try {
            const data = await dataService.getVisitChatMessages(visitId);
            setMessages(data);
            return data;
        } catch (error) {
            console.error('Error loading chat messages:', error);
            return [];
        }
    }, [visitId]);

    const loadParticipants = async () => {
        try {
            const data = await dataService.getVisitChatParticipants(visitId);
            setParticipants(data);
        } catch (error) {
            console.error('Error loading chat participants:', error);
        }
    };

    // Auto-mark messages as read
    const markUnreadAsRead = useCallback(async (msgs: OrderVisitChatMessage[]) => {
        const user = currentUserRef.current;
        if (!user) return;

        const unreadFromOthers = msgs.filter(m => {
            const isFromMe = String(m.userId) === String(user.id);
            if (isFromMe) return false;
            const alreadyRead = (m.readBy || []).some(r => String(r.userId) === String(user.id));
            return !alreadyRead;
        });

        if (unreadFromOthers.length === 0) return;

        try {
            await dataService.markVisitChatMessagesAsRead(
                unreadFromOthers.map(m => m.id),
                user.id
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, []);

    const loadPageData = async () => {
        setLoading(true);
        try {
            const user = await dataService.getCurrentUser();
            setCurrentUser(user);
            currentUserRef.current = user;

            // Registrar presença se o canal de presence já estiver pronto
            // (resolve a race condition: user carrega depois do subscribe)
            if (chatChannelRef.current && user?.id) {
                chatChannelRef.current.track(buildPresencePayload(user));
            }

            const [msgs] = await Promise.all([loadMessages(), loadParticipants()]);

            // Load chat status
            try {
                const statusData = await dataService.getVisitChatStatus(visitId);
                setChatStatus(statusData.chatStatus as 'open' | 'closed');
                setChatCreatedUserId(statusData.chatCreatedUserId);
            } catch (err) {
                console.error('Error loading chat status:', err);
            }

            // Auto-mark as read after initial load
            if (msgs.length > 0) {
                markUnreadAsRead(msgs);
            }
        } catch (error) {
            console.error('Error loading page data:', error);
            toast.error('Erro ao carregar dados do chat');
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Realtime subscriptions
    useEffect(() => {
        loadPageData();
        // Notify parent that the user entered the chat so related notifications can be cleared
        onChatEntered?.(visitId);

        // ─── Canal 1: postgres_changes para mensagens (DEDICADO, sem presence) ───
        isChannelSubscribedRef.current = false;
        const messagesChannel = supabase
            .channel(`chat_msgs_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders_visits_chat',
                    filter: `ov_id=eq.${visitId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new;
                        const senderId = newMsg.user_id.toString();
                        const user = currentUserRef.current;
                        
                        let userName = 'Usuário';
                        let userAvatarUrl = '';

                        if (user && String(senderId) === String(user.id)) {
                            userName = user.nameShort || user.nameFull || 'Você';
                            userAvatarUrl = user.avatarUrl || '';
                        } else {
                            const pList = participantsRef.current;
                            const participant = pList.find(p => String(p.userId) === String(senderId));
                            if (participant) {
                                userName = participant.userName;
                                userAvatarUrl = participant.userAvatarUrl || '';
                            } else {
                                // Fallback: busca rápida do Supabase
                                const { data: userData } = await supabase
                                    .from('users')
                                    .select('name_short, name_full, img_file_path, img_file_name')
                                    .eq('id', parseInt(senderId))
                                    .maybeSingle();
                                    
                                if (userData) {
                                    userName = userData.name_short || userData.name_full || 'Usuário';
                                    userAvatarUrl = dataService.getPublicImageUrl(userData.img_file_path, userData.img_file_name, { width: 100, height: 100, resize: 'cover' });
                                }
                            }
                        }

                        const formattedMsg: OrderVisitChatMessage = {
                            id: newMsg.id.toString(),
                            ovId: newMsg.ov_id.toString(),
                            userId: senderId,
                            message: newMsg.message,
                            isActionItem: newMsg.is_action_item,
                            isResolved: newMsg.is_resolved,
                            infoRequested: newMsg.info_requested,
                            createdAt: newMsg.created_at,
                            userName,
                            userAvatarUrl,
                            readBy: []
                        };

                        setMessages(prev => {
                            if (prev.some(m => m.id === formattedMsg.id)) return prev;
                            const updated = [...prev, formattedMsg];
                            // Auto-marcar como lida se a mensagem não for nossa
                            markUnreadAsRead(updated);
                            return updated;
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg = payload.new;
                        setMessages(prev => prev.map(m => {
                            if (m.id === updatedMsg.id.toString()) {
                                return {
                                    ...m,
                                    isResolved: updatedMsg.is_resolved,
                                    isActionItem: updatedMsg.is_action_item,
                                    infoRequested: updatedMsg.info_requested,
                                    message: updatedMsg.message
                                };
                            }
                            return m;
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedMsg = payload.old;
                        setMessages(prev => prev.filter(m => m.id !== deletedMsg.id.toString()));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    isChannelSubscribedRef.current = true;
                } else {
                    isChannelSubscribedRef.current = false;
                }
            });

        // ─── Canal 2: Presence (DEDICADO, sem postgres_changes) ───
        const presenceChannel = supabase
            .channel(`chat_presence_${visitId}`)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                const userId = payload?.user_id?.toString();
                const user = currentUserRef.current;
                if (!userId || String(userId) === String(user?.id)) return;

                if (remoteTypingTimeoutsRef.current[userId]) {
                    clearTimeout(remoteTypingTimeoutsRef.current[userId]);
                    delete remoteTypingTimeoutsRef.current[userId];
                }

                if (!payload.typing) {
                    setTypingUsers(prev => prev.filter(item => item.userId !== userId));
                    return;
                }

                const participant = participantsRef.current.find(item => String(item.userId) === userId);
                const typingUser: TypingUser = {
                    userId,
                    userName: payload.user_name || participant?.userName || 'Usuario',
                    userAvatarUrl: payload.user_avatar_url || participant?.userAvatarUrl || undefined
                };

                setTypingUsers(prev => {
                    const withoutCurrent = prev.filter(item => item.userId !== userId);
                    return [...withoutCurrent, typingUser];
                });

                remoteTypingTimeoutsRef.current[userId] = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(item => item.userId !== userId));
                    delete remoteTypingTimeoutsRef.current[userId];
                }, 2500);
            })
            .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState();
                const presences = Object.values(presenceState).flat() as any[];
                const ids = presences
                    .map((p: any) => p.user_id?.toString())
                    .filter(Boolean);
                setActiveUserIds(ids);
                activeUserIdsRef.current = ids;
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    chatChannelRef.current = presenceChannel;
                    // Registrar presença assim que o canal estiver pronto
                    const user = currentUserRef.current;
                    if (user?.id) {
                        await presenceChannel.track(buildPresencePayload(user));
                    }
                }
            });

        // ─── Canal 3: postgres_changes para read receipts ───
        const readsChannel = supabase
            .channel(`chat_reads_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders_visits_chat_reads'
                },
                (payload) => {
                    const newRead = payload.new;
                    const chatId = newRead.chat_id.toString();
                    const readerId = newRead.user_id.toString();
                    const user = currentUserRef.current;

                    setMessages(prev => {
                        return prev.map(msg => {
                            if (msg.id === chatId) {
                                const alreadyRead = (msg.readBy || []).some(r => String(r.userId) === String(readerId));
                                if (alreadyRead) return msg;

                                // Obter informações do leitor
                                let rName = 'Usuário';
                                let rAvatar = '';

                                if (user && String(readerId) === String(user.id)) {
                                    rName = user.nameShort || user.nameFull || 'Você';
                                    rAvatar = user.avatarUrl || '';
                                } else {
                                    const pList = participantsRef.current;
                                    const participant = pList.find(p => String(p.userId) === String(readerId));
                                    if (participant) {
                                        rName = participant.userName;
                                        rAvatar = participant.userAvatarUrl || '';
                                    }
                                }

                                const newReader = {
                                    userId: readerId,
                                    userName: rName,
                                    userAvatarUrl: rAvatar || undefined,
                                    readAt: newRead.read_at
                                };

                                return {
                                    ...msg,
                                    readBy: [...(msg.readBy || []), newReader]
                                };
                            }
                            return msg;
                        });
                    });
                }
            )
            .subscribe();

        // ─── Canal 4: postgres_changes para chat_status (orders_visits) ───
        const chatStatusChannel = supabase
            .channel(`chat_status_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders_visits',
                    filter: `id=eq.${visitId}`
                },
                (payload) => {
                    const updated = payload.new as any;
                    if (updated?.chat_status) {
                        setChatStatus(updated.chat_status);
                    }
                    if (updated?.chat_created_user_id) {
                        setChatCreatedUserId(updated.chat_created_user_id.toString());
                    }
                }
            )
            .subscribe();

        // ─── Polling de fallback (5s) — garante atualização mesmo se realtime falhar ───
        const pollInterval = setInterval(async () => {
            const data = await dataService.getVisitChatMessages(visitId);
            setMessages(prev => {
                // Só atualiza se houver mensagens novas (evita re-render desnecessário)
                if (data.length !== prev.length) {
                    markUnreadAsRead(data);
                    return data;
                }
                return prev;
            });
        }, 5000);

        return () => {
            isChannelSubscribedRef.current = false;
            chatChannelRef.current = null;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            Object.values(remoteTypingTimeoutsRef.current).forEach(clearTimeout);
            remoteTypingTimeoutsRef.current = {};
            clearInterval(pollInterval);
            messagesChannel.unsubscribe();
            presenceChannel.unsubscribe();
            readsChannel.unsubscribe();
            chatStatusChannel.unsubscribe();
        };
    }, [visitId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers.length]);

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMessage(value);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        publishTypingStatus(value.trim().length > 0);

        typingTimeoutRef.current = setTimeout(() => {
            publishTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 1800);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if (!messageText || !currentUser || isSending) return;

        if (participants.length === 0) {
            toast.warning('Adicione pelo menos um usuário a ser notificado utilizando o botão "Notificar" antes de enviar uma mensagem.');
            return;
        }

        setIsSending(true);
        publishTypingStatus(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        
        // Atualização otimista: limpa os inputs imediatamente para sensação instantânea
        setNewMessage('');
        setIsActionItem(false);
        setInfoRequested(false);

        try {
            const currentActiveUserIds = activeUserIdsRef.current;
            const sentMsg = await dataService.sendVisitChatMessage({
                ovId: visitId,
                userId: currentUser.id,
                message: messageText,
                isActionItem: false,
                isResolved: false,
                infoRequested: false,
                activeUserIds: [...new Set([...currentActiveUserIds, currentUser.id.toString()])]
            });

            if (sentMsg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === sentMsg.id)) return prev;
                    const updated = [...prev, sentMsg];
                    return updated;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Erro ao enviar mensagem');
            // Restaura o texto digitado no input em caso de erro
            setNewMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleResolve = async (messageId: string, currentStatus: boolean, senderId: string) => {
        if (!currentUser) return;
        
        // Restriction rule: Only the sender of the message can mark it as resolved/unresolved
        if (String(currentUser.id) !== String(senderId)) {
            toast.error('Apenas o criador da acao pode alterar seu status');
            return;
        }

        try {
            await dataService.toggleResolveChatAction(messageId, !currentStatus);
            toast.success(currentStatus ? 'Acao marcada como pendente' : 'Acao marcada como resolvida');
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    return {
                        ...m,
                        isResolved: !currentStatus
                    };
                }
                return m;
            }));
        } catch (error) {
            console.error('Error toggling resolve action:', error);
            toast.error('Erro ao atualizar status da acao');
        }
    };

    const handleCloseChat = async () => {
        if (!currentUser) return;

        setIsUpdatingStatus(true);
        try {
            await dataService.closeVisitChat(visitId, currentUser.id);
            setChatStatus('closed');
            toast.success('Conversa encerrada');
        } catch (error: any) {
            console.error('Error closing chat:', error);
            toast.error(error.message || 'Erro ao encerrar conversa');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleReopenChat = async () => {
        if (!currentUser) return;

        setIsUpdatingStatus(true);
        try {
            await dataService.reopenVisitChat(visitId, currentUser.id);
            setChatStatus('open');
            setChatCreatedUserId(currentUser.id);
            toast.success('Conversa reaberta');
        } catch (error) {
            console.error('Error reopening chat:', error);
            toast.error('Erro ao reabrir conversa');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openParticipantModal = async () => {
        setIsParticipantModalOpen(true);
        try {
            const users = await dataService.getUsers();
            // Sort by short name
            const activeUsers = users
                .filter(u => String(u.statusId) === '2')
                .sort((a, b) => (a.nameShort || '').localeCompare(b.nameShort || '', 'pt-BR'));
            setAllUsers(activeUsers);
        } catch (error) {
            console.error('Error loading users for modal:', error);
        }
    };

    const handleToggleParticipant = async (userId: string) => {
        setUpdatingParticipantId(userId);
        const isParticipant = participants.some(p => String(p.userId) === String(userId));
        try {
            if (isParticipant) {
                // Não permitir remover o próprio usuário logado da lista
                if (currentUser && String(userId) === String(currentUser.id)) {
                    toast.warning('Você não pode se remover do chat.');
                    return;
                }
                await dataService.removeVisitChatParticipant(visitId, userId);
                toast.success('Participante removido do chat');
            } else {
                await dataService.addVisitChatParticipant(visitId, userId);
                toast.success('Participante adicionado ao chat');

                // Garantir que o usuário logado também seja participante (upsert ignora duplicata)
                if (currentUser && String(userId) !== String(currentUser.id)) {
                    const isSelfParticipant = participants.some(p => String(p.userId) === String(currentUser.id));
                    if (!isSelfParticipant) {
                        await dataService.addVisitChatParticipant(visitId, currentUser.id);
                    }
                }
            }
            await loadParticipants();
        } catch (error) {
            console.error('Error updating participant:', error);
            toast.error('Erro ao atualizar participantes');
        } finally {
            setUpdatingParticipantId(null);
        }
    };

    const filteredUsers = allUsers.filter(u => {
        // Exclui o próprio usuário logado da lista e exige que o status do usuário seja 2 (ativo)
        if (String(u.id) === String(currentUser?.id) || u.statusId !== 2) {
            return false;
        }

        const query = searchQuery.toLowerCase();
        return (
            (u.nameShort || '').toLowerCase().includes(query) ||
            (u.nameFull || '').toLowerCase().includes(query) ||
            (u.email || '').toLowerCase().includes(query)
        );
    });

    // Count of participants excluding the current user (for "all read" logic)
    const otherParticipantCount = participants.filter(
        p => String(p.userId) !== String(currentUser?.id)
    ).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loading size="md" />
                <p className="text-slate-500 font-bold mt-2">Carregando conversas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header: Chat Participants Manager */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 font-bold">forum</span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Chat da Visita
                    </h3>
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        chatStatus === 'open'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${chatStatus === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {chatStatus === 'open' ? 'Aberta' : 'Encerrada'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Close / Reopen Button */}
                    {chatStatus === 'open' && currentUser && (
                        <button
                            onClick={handleCloseChat}
                            disabled={isUpdatingStatus}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">lock</span>
                            <span>Encerrar</span>
                        </button>
                    )}
                    {chatStatus === 'closed' && currentUser && (
                        <button
                            onClick={handleReopenChat}
                            disabled={isUpdatingStatus}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
                            <span>Reabrir</span>
                        </button>
                    )}
                    <button
                        onClick={openParticipantModal}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm ${
                            participants.length <= 1
                                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 animate-pulse'
                                : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm font-bold">group</span>
                        <span>Notificar ({Math.max(0, participants.length - 1)})</span>
                    </button>
                </div>
            </div>

            {/* Chat Messages Panel */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-12">
                        <span className="material-symbols-outlined text-5xl mb-2">chat_bubble_outline</span>
                        <p className="text-sm font-bold">Nenhuma conversa registrada para esta visita.</p>
                        <p className="text-xs text-center px-6 mt-1 opacity-80">
                            Envie perguntas, registre tarefas pendentes (ações) ou solicite informações detalhadas.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = String(msg.userId) === String(currentUser?.id);
                        
                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                            >
                                {/* User Avatar */}
                                <div className="shrink-0">
                                    <UserAvatar
                                        src={msg.userAvatarUrl}
                                        name={msg.userName || 'Usuário'}
                                        size="sm"
                                    />
                                </div>

                                {/* Message Content Card */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 px-1">
                                        <span>{msg.userName}</span>
                                        <span>•</span>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    
                                    <div
                                        className={`rounded-2xl p-3.5 shadow-md border ${
                                            isMe
                                                ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-tl-none'
                                        } ${msg.isActionItem && msg.isResolved ? 'opacity-65' : ''}`}
                                    >
                                        {/* Message Badges */}
                                        <div className="flex flex-wrap gap-1.5 mb-2 justify-start">
                                            {msg.isActionItem && (
                                                <div
                                                    onClick={() => handleToggleResolve(msg.id, msg.isResolved, msg.userId)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-sm ${
                                                        msg.isResolved
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {msg.isResolved ? 'task_alt' : 'warning'}
                                                    </span>
                                                    <span>{msg.isResolved ? 'Ação Resolvida' : 'Ação Pendente'}</span>
                                                </div>
                                            )}
                                            {msg.infoRequested && (
                                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">help_center</span>
                                                    <span>Info Solicitada</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Text message */}
                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.isActionItem && msg.isResolved ? 'line-through decoration-slate-400/60' : ''}`}>
                                            {msg.message}
                                        </p>

                                        {/* Read Receipt Indicator — only for sender's own messages */}
                                        {isMe && (
                                            <div className="flex justify-end mt-1.5 -mb-1">
                                                <ReadReceiptIndicator
                                                    message={msg}
                                                    isMe={isMe}
                                                    participantCount={otherParticipantCount}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {typingUsers.length > 0 && (
                    <div className="flex gap-3 max-w-[85%] mr-auto text-left">
                        <div className="shrink-0">
                            <UserAvatar
                                src={typingUsers[0].userAvatarUrl}
                                name={typingUsers[0].userName}
                                size="sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-1">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].userName} esta digitando`
                                    : `${typingUsers.length} pessoas estao digitando`}
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-none p-3.5 shadow-md border bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5">
                                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:120ms]" />
                                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:240ms]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer Form Input */}
            <form
                onSubmit={handleSendMessage}
                className="shrink-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5"
            >
                {/* Input text and Send button */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleMessageChange}
                        onBlur={() => publishTypingStatus(false)}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 overflow-hidden
                            ${isSending
                                ? 'bg-indigo-500 cursor-not-allowed scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:shadow-none disabled:text-slate-400'
                            }`}
                    >
                        {isSending ? (
                            <>
                                {/* Anel giratório */}
                                <svg
                                    className="animate-spin w-5 h-5 text-white/90"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                {/* Halo pulsante */}
                                <span className="absolute inset-0 rounded-2xl animate-ping bg-indigo-400/30 pointer-events-none" />
                            </>
                        ) : (
                            <span className="material-symbols-outlined font-black text-[20px] text-white">send</span>
                        )}
                    </button>
                </div>
            </form>

            {/* Modal: Chat Participants Manager */}
            <Modal
                isOpen={isParticipantModalOpen}
                onClose={() => {
                    setIsParticipantModalOpen(false);
                    setSearchQuery('');
                }}
                title="Participantes do Chat"
                maxWidth="sm"
            >
                <div className="p-4 flex flex-col h-[60vh] max-h-[500px]">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Os participantes selecionados abaixo receberão uma notificação automática na central de notificações a cada nova mensagem deste chat.
                    </p>

                    {/* Search Field */}
                    <div className="relative mb-3 shrink-0">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar usuário..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                    </div>

                    {/* Users list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-6">Nenhum usuário encontrado.</p>
                        ) : (
                            filteredUsers.map((usr) => {
                                const isParticipant = participants.some(p => String(p.userId) === String(usr.id));
                                const isUpdating = updatingParticipantId === usr.id;
                                
                                return (
                                    <div
                                        key={usr.id}
                                        onClick={() => !isUpdating && handleToggleParticipant(usr.id)}
                                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <UserAvatar
                                                src={usr.avatarUrl}
                                                name={usr.nameShort || usr.nameFull || 'Membro'}
                                                size="sm"
                                            />
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                    {usr.nameShort || usr.nameFull}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    {usr.email}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {isUpdating ? (
                                                <Loading size="xs" />
                                            ) : (
                                                <span className={`material-symbols-outlined text-lg font-bold ${
                                                    isParticipant
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-300 dark:text-slate-700'
                                                }`}>
                                                    {isParticipant ? 'check_box' : 'check_box_outline_blank'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
