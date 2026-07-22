import { supabase } from '../supabase';
import { OrderVisitChatMessage, OrderVisitChatParticipant } from '../../types';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { getPublicImageUrl } from '../imageUtils';

export const visitChatService = {
    async getVisitChatMessages(visitId: string): Promise<OrderVisitChatMessage[]> {
        const { data, error } = await supabase
            .from('orders_visits_chat')
            .select(`
                *,
                user:users!user_id (
                    name_short,
                    name_full,
                    img_file_path,
                    img_file_name
                )
            `)
            .eq('ov_id', parseInt(visitId))
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching visit chat messages:', error);
            return [];
        }

        const messageIds = data.map((item: any) => item.id);
        let readsMap: Record<string, { userId: string; userName: string; userAvatarUrl?: string; readAt: string }[]> = {};

        if (messageIds.length > 0) {
            const { data: readsData } = await supabase
                .from('orders_visits_chat_reads')
                .select(`
                    chat_id,
                    user_id,
                    read_at,
                    user:users!user_id (
                        name_short,
                        name_full,
                        img_file_path,
                        img_file_name
                    )
                `)
                .in('chat_id', messageIds);

            if (readsData) {
                for (const read of readsData as any[]) {
                    const chatId = read.chat_id.toString();
                    if (!readsMap[chatId]) readsMap[chatId] = [];
                    readsMap[chatId].push({
                        userId: read.user_id.toString(),
                        userName: read.user?.name_short || read.user?.name_full || 'Usuario',
                        userAvatarUrl: getPublicImageUrl(read.user?.img_file_path, read.user?.img_file_name, { width: 100, height: 100, resize: 'cover' }),
                        readAt: read.read_at
                    });
                }
            }
        }

        return data.map((item: any) => {
            const userName = item.user?.name_short || item.user?.name_full || 'Usuario';
            const userAvatarUrl = getPublicImageUrl(item.user?.img_file_path, item.user?.img_file_name, { width: 100, height: 100, resize: 'cover' });

            return {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                userId: item.user_id.toString(),
                message: item.message,
                isActionItem: item.is_action_item,
                isResolved: item.is_resolved,
                infoRequested: item.info_requested,
                createdAt: item.created_at,
                userName,
                userAvatarUrl,
                readBy: readsMap[item.id.toString()] || []
            };
        });
    },

    async sendVisitChatMessage(messageData: Partial<OrderVisitChatMessage> & { activeUserIds?: string[] }): Promise<OrderVisitChatMessage | null> {
        const { data, error } = await supabase
            .from('orders_visits_chat')
            .insert({
                ov_id: parseInt(messageData.ovId!),
                user_id: parseInt(messageData.userId!),
                message: messageData.message!,
                is_action_item: messageData.isActionItem || false,
                is_resolved: messageData.isResolved || false,
                info_requested: messageData.infoRequested || false,
                created_at: getBrazilTimestamp()
            })
            .select(`
                *,
                user:users!user_id (
                    name_short,
                    name_full,
                    img_file_path,
                    img_file_name
                )
            `)
            .single();

        if (error) {
            console.error('Error sending visit chat message:', error);
            throw error;
        }

        // Ensure the sender becomes the chat creator on first message
        try {
            await this.ensureChatCreator(messageData.ovId!, messageData.userId!);
        } catch (creatorErr) {
            console.error('Failed to ensure chat creator:', creatorErr);
        }

        try {
            await this.sendChatNotifications(
                messageData.ovId!,
                messageData.message!,
                messageData.userId!,
                messageData.isActionItem ? 'action' : (messageData.infoRequested ? 'info' : 'normal'),
                messageData.activeUserIds || []
            );
        } catch (notifErr) {
            console.error('Failed to send chat notifications:', notifErr);
        }

        const userName = data.user?.name_short || data.user?.name_full || 'Usuario';
        const userAvatarUrl = getPublicImageUrl(data.user?.img_file_path, data.user?.img_file_name, { width: 100, height: 100, resize: 'cover' });

        return {
            id: data.id.toString(),
            ovId: data.ov_id.toString(),
            userId: data.user_id.toString(),
            message: data.message,
            isActionItem: data.is_action_item,
            isResolved: data.is_resolved,
            infoRequested: data.info_requested,
            createdAt: data.created_at,
            userName,
            userAvatarUrl
        };
    },

    async toggleResolveChatAction(messageId: string, isResolved: boolean): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_chat')
            .update({ is_resolved: isResolved })
            .eq('id', parseInt(messageId));

        if (error) {
            console.error('Error toggling resolve chat action:', error);
            throw error;
        }
    },

    async getVisitChatParticipants(visitId: string): Promise<OrderVisitChatParticipant[]> {
        const { data, error } = await supabase
            .from('orders_visits_chat_participants')
            .select(`
                *,
                user:users!user_id (
                    name_short,
                    name_full,
                    email,
                    img_file_path,
                    img_file_name
                )
            `)
            .eq('ov_id', parseInt(visitId));

        if (error) {
            console.error('Error fetching chat participants:', error);
            return [];
        }

        return data.map((item: any) => {
            const userName = item.user?.name_short || item.user?.name_full || 'Usuario';
            const userAvatarUrl = getPublicImageUrl(item.user?.img_file_path, item.user?.img_file_name, { width: 100, height: 100, resize: 'cover' });

            return {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                userId: item.user_id.toString(),
                createdAt: item.created_at,
                userName,
                userAvatarUrl,
                userEmail: item.user?.email
            };
        });
    },

    async addVisitChatParticipant(visitId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_chat_participants')
            .upsert(
                {
                    ov_id: parseInt(visitId),
                    user_id: parseInt(userId),
                    created_at: getBrazilTimestamp()
                },
                { onConflict: 'ov_id,user_id', ignoreDuplicates: true }
            );

        if (error) {
            console.error('Error adding chat participant:', error);
            throw error;
        }
    },

    async removeVisitChatParticipant(visitId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_chat_participants')
            .delete()
            .eq('ov_id', parseInt(visitId))
            .eq('user_id', parseInt(userId));

        if (error) {
            console.error('Error removing chat participant:', error);
            throw error;
        }
    },

    async sendChatNotifications(
        visitId: string,
        message: string,
        senderId: string,
        type: 'action' | 'info' | 'normal',
        activeUserIds: string[] = []
    ): Promise<void> {
        const { data: senderData } = await supabase
            .from('users')
            .select('name_short')
            .eq('id', parseInt(senderId))
            .maybeSingle();

        const senderName = senderData?.name_short || 'Alguem';

        const { data: visitData } = await supabase
            .from('v_orders_visits')
            .select('ov_mask, o_id, o_provider_company_id, o_unit_id')
            .eq('id', parseInt(visitId))
            .maybeSingle();

        const ovMask = visitData?.ov_mask || '';
        const orderId = visitData?.o_id?.toString();
        const companyId = visitData?.o_provider_company_id?.toString();
        const unitId = visitData?.o_unit_id?.toString();

        const { data: participants, error: partError } = await supabase
            .from('orders_visits_chat_participants')
            .select('user_id')
            .eq('ov_id', parseInt(visitId));

        if (partError || !participants) return;

        const activeUserIdSet = new Set(activeUserIds.map(uid => uid.toString()));

        const userIdsToNotify = [...new Set(participants
            .map((p: any) => p.user_id.toString())
            .filter((uid: string) => uid !== senderId.toString() && !activeUserIdSet.has(uid)))];

        if (userIdsToNotify.length === 0) return;

        let prefix = '';
        if (type === 'action') prefix = '[Acao Pendente] ';
        else if (type === 'info') prefix = '[Pedido de Informacao] ';

        const notifications = userIdsToNotify.map((uid: string) => ({
            user_id_to: parseInt(uid),
            user_id_from: parseInt(senderId),
            title: `Nova mensagem na Visita ${ovMask || visitId}`,
            body: `${prefix}${senderName}: ${message}`,
            type: 'visit_chat',
            is_read: false,
            created_at: getBrazilTimestamp(),
            ov_id: parseInt(visitId),
            o_id: orderId ? parseInt(orderId) : null,
            company_id: companyId ? parseInt(companyId) : null,
            table_id: unitId ? parseInt(unitId) : null,
            user_from_name_short: senderName,
            page_target: 'visit'
        }));

        const { error: notifInsertError } = await supabase
            .from('users_notifications')
            .insert(notifications);

        if (notifInsertError) {
            console.error('Error inserting chat notifications:', notifInsertError);
        }
    },

    // -------------------------------------------------------------------------
    // CHAT STATUS (open / closed)
    // -------------------------------------------------------------------------

    async getVisitChatStatus(visitId: string): Promise<{ chatStatus: string; chatCreatedUserId: string | null; chatClosedAt: string | null; chatClosedUserId: string | null }> {
        const { data, error } = await supabase
            .from('orders_visits')
            .select('chat_status, chat_created_user_id, chat_closed_at, chat_closed_user_id')
            .eq('id', parseInt(visitId))
            .single();

        if (error || !data) {
            return { chatStatus: 'open', chatCreatedUserId: null, chatClosedAt: null, chatClosedUserId: null };
        }

        let creatorId = data.chat_created_user_id?.toString() || null;

        // Fallback: if no creator set yet, find the first message sender and set it
        if (!creatorId) {
            const { data: firstMsg } = await supabase
                .from('orders_visits_chat')
                .select('user_id')
                .eq('ov_id', parseInt(visitId))
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (firstMsg?.user_id) {
                creatorId = firstMsg.user_id.toString();
                // Auto-set the creator in the background
                await supabase
                    .from('orders_visits')
                    .update({ chat_created_user_id: firstMsg.user_id })
                    .eq('id', parseInt(visitId));
            }
        }

        return {
            chatStatus: data.chat_status || 'open',
            chatCreatedUserId: creatorId,
            chatClosedAt: data.chat_closed_at || null,
            chatClosedUserId: data.chat_closed_user_id?.toString() || null
        };
    },

    async ensureChatCreator(visitId: string, userId: string): Promise<void> {
        console.log('[ensureChatCreator] visitId:', visitId, 'userId:', userId);
        const { data, error: fetchError } = await supabase
            .from('orders_visits')
            .select('chat_created_user_id')
            .eq('id', parseInt(visitId))
            .single();

        console.log('[ensureChatCreator] current creator:', data?.chat_created_user_id);

        if (fetchError || !data) return;

        if (!data.chat_created_user_id) {
            console.log('[ensureChatCreator] setting creator to:', userId);
            const { error } = await supabase
                .from('orders_visits')
                .update({ chat_created_user_id: parseInt(userId) })
                .eq('id', parseInt(visitId));

            if (error) {
                console.error('[ensureChatCreator] Error:', error);
            } else {
                console.log('[ensureChatCreator] Creator set successfully');
            }
        }
    },

    async closeVisitChat(visitId: string, userId: string): Promise<void> {
        console.log('[closeVisitChat] visitId:', visitId, 'userId:', userId);
        const { data, error: fetchError } = await supabase
            .from('orders_visits')
            .select('chat_created_user_id, chat_status')
            .eq('id', parseInt(visitId))
            .single();

        console.log('[closeVisitChat] DB data:', data, 'fetchError:', fetchError);

        if (fetchError || !data) {
            throw new Error('Visita nao encontrada');
        }

        let creatorId = data.chat_created_user_id?.toString() || null;

        // Fallback: if no creator set, find first message sender
        if (!creatorId) {
            const { data: firstMsg } = await supabase
                .from('orders_visits_chat')
                .select('user_id')
                .eq('ov_id', parseInt(visitId))
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (firstMsg?.user_id) {
                creatorId = firstMsg.user_id.toString();
                await supabase
                    .from('orders_visits')
                    .update({ chat_created_user_id: firstMsg.user_id })
                    .eq('id', parseInt(visitId));
            }
        }

        console.log('[closeVisitChat] final creatorId:', creatorId, 'match:', String(creatorId) === String(userId));

        if (!creatorId || String(creatorId) !== String(userId)) {
            throw new Error('Somente o criador da conversa pode encerrar');
        }

        const { error } = await supabase
            .from('orders_visits')
            .update({
                chat_status: 'closed',
                chat_closed_at: getBrazilTimestamp(),
                chat_closed_user_id: parseInt(userId)
            })
            .eq('id', parseInt(visitId));

        if (error) {
            console.error('Error closing visit chat:', error);
            throw error;
        }
    },

    async reopenVisitChat(visitId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits')
            .update({
                chat_status: 'open',
                chat_created_user_id: parseInt(userId),
                chat_closed_at: null,
                chat_closed_user_id: null
            })
            .eq('id', parseInt(visitId));

        if (error) {
            console.error('Error reopening visit chat:', error);
            throw error;
        }
    },

    async markVisitChatMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
        if (!messageIds.length || !userId) return;

        const rows = messageIds.map(chatId => ({
            chat_id: parseInt(chatId),
            user_id: parseInt(userId),
            read_at: getBrazilTimestamp()
        }));

        const { error } = await supabase
            .from('orders_visits_chat_reads')
            .upsert(rows, { onConflict: 'chat_id,user_id', ignoreDuplicates: true });

        if (error) {
            console.error('Error marking chat messages as read:', error);
        }
    }
};
