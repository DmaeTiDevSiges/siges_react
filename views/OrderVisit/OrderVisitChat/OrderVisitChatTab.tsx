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
}

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
export const OrderVisitChatTab: React.FC<OrderVisitChatTabProps> = ({ visitId }) => {
    const [messages, setMessages] = useState<OrderVisitChatMessage[]>([]);
    const [participants, setParticipants] = useState<OrderVisitChatParticipant[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [newMessage, setNewMessage] = useState('');
    const [isActionItem, setIsActionItem] = useState(false);
    const [infoRequested, setInfoRequested] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Participant Modal states
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<User | null>(null);

    // Keep ref in sync for use in callbacks
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

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
            const [msgs] = await Promise.all([loadMessages(), loadParticipants()]);
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

        // Subscribe to changes in orders_visits_chat (new messages)
        const chatChannel = supabase
            .channel(`public:orders_visits_chat:ov_id=${visitId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders_visits_chat',
                    filter: `ov_id=eq.${visitId}`
                },
                async () => {
                    const msgs = await loadMessages();
                    markUnreadAsRead(msgs);
                }
            )
            .subscribe();

        // Subscribe to changes in orders_visits_chat_reads (read receipts updates)
        const readsChannel = supabase
            .channel(`public:orders_visits_chat_reads:visit_${visitId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders_visits_chat_reads'
                },
                () => {
                    // Reload messages to refresh readBy data
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            chatChannel.unsubscribe();
            readsChannel.unsubscribe();
        };
    }, [visitId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        setIsSending(true);
        try {
            await dataService.sendVisitChatMessage({
                ovId: visitId,
                userId: currentUser.id,
                message: newMessage.trim(),
                isActionItem,
                isResolved: false,
                infoRequested
            });

            setNewMessage('');
            setIsActionItem(false);
            setInfoRequested(false);
            loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Erro ao enviar mensagem');
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleResolve = async (messageId: string, currentStatus: boolean, senderId: string) => {
        if (!currentUser) return;
        
        // Restriction rule: Only the sender of the message can mark it as resolved/unresolved
        if (String(currentUser.id) !== String(senderId)) {
            toast.error('Apenas o criador da ação pode alterar seu status');
            return;
        }

        try {
            await dataService.toggleResolveChatAction(messageId, !currentStatus);
            toast.success(currentStatus ? 'Ação marcada como pendente' : 'Ação marcada como resolvida');
            loadMessages();
        } catch (error) {
            console.error('Error toggling resolve action:', error);
            toast.error('Erro ao atualizar status da ação');
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
                await dataService.removeVisitChatParticipant(visitId, userId);
                toast.success('Participante removido do chat');
            } else {
                await dataService.addVisitChatParticipant(visitId, userId);
                toast.success('Participante adicionado ao chat');
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
        <div className="flex flex-col h-[calc(100vh-170px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header: Chat Participants Manager */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 font-bold">forum</span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Chat da Visita
                    </h3>
                </div>
                <button
                    onClick={openParticipantModal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm font-bold">group</span>
                    <span>Notificar ({participants.length})</span>
                </button>
            </div>

            {/* Chat Messages Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
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
                <div ref={messagesEndRef} />
            </div>

            {/* Footer Form Input */}
            <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 space-y-2.5"
            >
                {/* Options Selection Row */}
                <div className="flex flex-wrap gap-4 px-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActionItem}
                            onChange={(e) => {
                                setIsActionItem(e.target.checked);
                                if (e.target.checked) setInfoRequested(false); // Mutually exclusive helper
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-amber-500 font-bold">warning</span>
                            Ação a ser tomada
                        </span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={infoRequested}
                            onChange={(e) => {
                                setInfoRequested(e.target.checked);
                                if (e.target.checked) setIsActionItem(false); // Mutually exclusive helper
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-sky-500 font-bold">help_center</span>
                            Solicitar info detalhada
                        </span>
                    </label>
                </div>

                {/* Input text and Send button */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={
                            isActionItem
                                ? 'Escreva uma ação/TODO a ser tomada...'
                                : infoRequested
                                ? 'Escreva a informação que deseja solicitar...'
                                : 'Escreva uma mensagem...'
                        }
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400 text-white rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                    >
                        {isSending ? (
                            <Loading size="xs" />
                        ) : (
                            <span className="material-symbols-outlined font-black">send</span>
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
