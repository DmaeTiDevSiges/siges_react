/**
 * Notificar Seguidores na Alteração de Situação de OS
 * 
 * Category: notifications
 * Version: 1.2.0
 * Description: Notificar os usuários que seguem uma Ordem de Serviço quando houver alteração em sua situação (status).
 * 
 * ATTENTION: This code was automatically generated from a .flow file
 * Use as REFERENCE for implementation. Adapt as necessary.
 * 
 * Source file: flows/notifications/followers-orders-status-changed.flow
 */

import { supabase } from '@/services/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface OrderStatusChangeInput {
    orderId: string | number;
    newStatusId: number;
    oldStatusId: number;
    updatedByUserId: string | number;
}

export interface OrderStatusChangeResult {
    success: boolean;
    message?: string;
    notificationsSent?: number;
}

export interface NotificationData {
    user_id_to: string | number;
    user_id_from: string | number;
    title: string;
    body: string;
    type: string;
    user_to_whatsapp?: string;
    created_at: string;
    is_read: boolean;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main function: Notificar Seguidores na Alteração de Situação de OS
 * 
 * This function implements the flow described in natural language.
 * Review each step and adapt according to your project's architecture.
 */
export async function notifyFollowersOnOrderStatusChange(
    input: OrderStatusChangeInput
): Promise<OrderStatusChangeResult> {
    try {
        // Condition: OLD.status_id != NEW.status_id OR (OLD = 4 AND NEW = 4)
        const isAgendadaReentry = input.oldStatusId === 4 && input.newStatusId === 4;

        if (input.newStatusId === input.oldStatusId && !isAgendadaReentry) {
            return {
                success: true,
                message: 'No status change detected',
                notificationsSent: 0
            };
        }

        // ========================================================================
        // STEP 1: Identify Followers
        // ========================================================================
        // When: Status change detected
        // Action: Query orders_followers for user_id associated with o_id

        const { data: followers, error: followersError } = await supabase
            .from('orders_followers')
            .select('user_id')
            .eq('o_id', input.orderId);

        if (followersError) {
            throw new Error(`Error fetching followers: ${followersError.message}`);
        }

        if (!followers || followers.length === 0) {
            return {
                success: true,
                message: 'No followers to notify',
                notificationsSent: 0
            };
        }

        // ========================================================================
        // STEP 2: Collect Order and User Data
        // ========================================================================
        // Action: Fetch OS details (mask, client, unit, services) and status name

        // Fetch Order Details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                o_mask,
                requested_services,
                unit:units(description_full),
                client:clients(name_full),
                status:cfg_orders_statuses(description)
            `)
            .eq('id', input.orderId)
            .single();

        if (orderError) {
            throw new Error(`Error fetching order details: ${orderError.message}`);
        }

        // Fetch User Name who changed the status
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('name_short')
            .eq('id', input.updatedByUserId)
            .single();

        if (userError) {
            console.warn('Could not fetch user name for notification');
        }

        // ========================================================================
        // STEP 3: Generate Notifications
        // ========================================================================
        // Action: Insert records into users_notifications for each follower

        const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const notificationsCreated = 0;

        for (const follower of followers) {
            // Fetch WhatsApp from user
            const { data: followerProfile } = await supabase
                .from('users')
                .select('mobile_whatsapp')
                .eq('id', follower.user_id)
                .single();

            const clientData = Array.isArray(order.client) ? order.client[0] : order.client;
            const unitData = Array.isArray(order.unit) ? order.unit[0] : order.unit;
            const statusData = Array.isArray(order.status) ? order.status[0] : order.status;

            const body = `OS ${order.o_mask}\n` +
                `Cliente: ${clientData?.name_full || 'N/A'}\n` +
                `Unidade: ${unitData?.description_full || 'N/A'}\n` +
                `Serviços a realizar: ${order.requested_services || 'N/A'}\n` +
                `Situação: ${statusData?.description || 'N/A'}\n` +
                `Data hora: ${timestamp}\n` +
                `Usuário: ${user?.name_short || 'N/A'}`;

            const notificationData: NotificationData = {
                user_id_to: follower.user_id,
                user_id_from: input.updatedByUserId,
                title: `Atualização Situação OS ${order.o_mask}`,
                body: body,
                type: 'order_status_change',
                user_to_whatsapp: followerProfile?.mobile_whatsapp,
                created_at: new Date().toISOString(),
                is_read: false
            };

            const { error: notifyError } = await supabase
                .from('users_notifications')
                .insert(notificationData);

            if (notifyError) {
                console.error(`Error creating notification for follower ${follower.user_id}:`, notifyError.message);
            }
        }

        return {
            success: true,
            message: 'Notifications sent to followers',
            notificationsSent: followers.length
        };

    } catch (error) {
        console.error('Error in notifyFollowersOnOrderStatusChange flow:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
