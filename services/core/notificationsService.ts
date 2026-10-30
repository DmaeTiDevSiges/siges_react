import { supabase } from './supabase';
import { UserNotification } from '../../types';
import { getPublicImageUrl } from '../media/imageUtils';
import { getBrazilNaiveTimestamp } from '../../utils/dateUtils';

export const notificationsService = {
    async getNotificationsCount(authUserId?: string): Promise<number> {
        let userId = authUserId;
        if (!userId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return 0;
            userId = authUser.id;
        }

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', userId)
            .single();

        if (!userData) return 0;

        const { count, error } = await supabase
            .from('users_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id_to', userData.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching notifications count:', error);
            return 0;
        }

        return count || 0;
    },

    async getNotifications(page = 0, pageSize = 20, authUserId?: string): Promise<UserNotification[]> {
        let userId = authUserId;
        if (!userId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return [];
            userId = authUser.id;
        }

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', userId)
            .single();

        if (!userData) return [];

        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('users_notifications')
            .select(`
                *,
                related_user:user_id_from (
                    name_full,
                    img_file_path,
                    img_file_name,
                    is_available,
                    ov_id_in_progress
                )
            `)
            .eq('user_id_to', userData.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data.map((item: any) => {
            const avatarUrl = getPublicImageUrl(
                item.related_user?.img_file_path,
                item.related_user?.img_file_name || 'noImageUser.png',
                { width: 70, height: 70, resize: 'cover' }
            );

            return {
                id: item.id.toString(),
                userIdTo: item.user_id_to?.toString(),
                userIdFrom: item.user_id_from?.toString(),
                title: item.title,
                body: item.body,
                type: item.type,
                isRead: item.is_read,
                createdAt: item.created_at,
                readAt: item.read_at,
                tableId: item.table_id?.toString(),
                materialId: item.material_id?.toString(),
                imgUrl: item.img_url,
                orderId: item.o_id?.toString(),
                ovId: item.ov_id?.toString(),
                activityId: item.activity_id?.toString(),
                companyId: item.company_id?.toString(),
                tokenFcm: item.token_fcm,
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                userFromNameShort: item.user_from_name_short,
                pageTarget: item.page_target,
                versionMode: item.version_mode,
                userToWhatsapp: item.user_to_whatsapp,
                relatedUserName: item.related_user?.name_full,
                relatedUserAvatarUrl: avatarUrl,
                relatedUserIsAvailable: item.related_user?.is_available,
                relatedUserOvIdInProgress: item.related_user?.ov_id_in_progress
            };
        });
    },

    async markNotificationAsRead(id: string): Promise<void> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) throw new Error('Invalid notification ID');

        const { error } = await supabase
            .from('users_notifications')
            .delete()
            .eq('id', numericId);

        if (error) throw error;
    },

    async deleteNotification(id: string): Promise<void> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) throw new Error('Invalid notification ID');

        const { error } = await supabase
            .from('users_notifications')
            .delete()
            .eq('id', numericId);

        if (error) throw error;
    },

    async deleteVisitChatNotifications(ovId: string): Promise<void> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUser.id)
            .single();

        if (!userData) return;

        const numericOvId = parseInt(ovId, 10);
        if (isNaN(numericOvId)) return;

        const { error } = await supabase
            .from('users_notifications')
            .delete()
            .eq('type', 'visit_chat')
            .eq('ov_id', numericOvId)
            .eq('user_id_to', userData.id);

        if (error) throw error;
    },

    async clearAllNotifications(): Promise<void> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('uuid', authUser.id)
            .single();

        if (!userData) return;

        const { error } = await supabase
            .from('users_notifications')
            .delete()
            .eq('user_id_to', userData.id)
            .eq('is_read', false);

        if (error) throw error;
    },

    /**
     * Lembrete mensal de lançamento de turnos (aba OCIOSIDADE) — 1× por mês.
     * Envia notificação para todos os usuários is_admin_super quando ainda não
     * existe a notificação do mês (guard por type + mês no título).
     * Chamado pela tela quando faltam ≤ 3 dias para o fim do mês e não há
     * lançamentos. Falhas são engolidas (nunca quebram a tela).
     */
    async ensureMonthlyShiftsReminder(monthKey: string, title: string, body: string): Promise<void> {
        try {
            const marker = `(${monthKey})`;
            const { data: existing, error: existingError } = await supabase
                .from('users_notifications')
                .select('id')
                .eq('type', 'Lembrete de Turnos')
                .like('title', `%${marker}%`)
                .limit(1);

            if (existingError) return;
            if (existing && existing.length > 0) return;

            const { data: admins, error: adminsError } = await supabase
                .from('users')
                .select('id')
                .eq('is_admin_super', true);

            if (adminsError || !admins || admins.length === 0) return;

            const rows = admins.map(admin => ({
                user_id_to: admin.id,
                user_id_from: null,
                title: `${title} ${marker}`,
                body,
                type: 'Lembrete de Turnos',
                created_at: getBrazilNaiveTimestamp(),
                is_read: false
            }));

            const { error: insertError } = await supabase.from('users_notifications').insert(rows);
            if (insertError) console.error('Error inserting shifts reminder notifications:', insertError);
        } catch (error) {
            console.error('Error ensuring monthly shifts reminder:', error);
        }
    }
};
