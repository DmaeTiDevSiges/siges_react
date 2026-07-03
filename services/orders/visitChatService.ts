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
