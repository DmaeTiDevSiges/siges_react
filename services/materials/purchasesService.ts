import { supabase } from '../supabase';
import { usersService } from '../users/usersService';
import { getBrazilTimestamp } from '../../utils/dateUtils';

export const purchasesService = {
    async getCancelReasons(): Promise<{ id: number; description: string; is_available: boolean }[]> {
        const { data, error } = await supabase
            .from('cfg_materials_purchases_cancel_reasons')
            .select('*')
            .eq('is_available', true)
            .order('description');

        if (error) {
            console.error('Error fetching purchase cancel reasons:', error);
            return [];
        }
        return data || [];
    },

    async createMaterialPurchase(data: { materialId: string; purchaseTypeId?: string; warehouseId?: string; quantity: number; unitPrice: number; justification: string; code?: string }): Promise<any> {
        const currentUser = await usersService.getCurrentUser();
        const totalPrice = data.quantity * data.unitPrice;

        const insertData: any = {
            material_id: parseInt(data.materialId),
            quantity: data.quantity,
            unit_price: data.unitPrice,
            total_price: totalPrice,
            justification: data.justification,
            status_id: 1,
            requester_user_id: currentUser?.id ? parseInt(currentUser.id) : 0,
            created_user_id: currentUser?.id ? parseInt(currentUser.id) : undefined,
            created_at: getBrazilTimestamp()
        };

        if (data.purchaseTypeId) {
            insertData.purchase_type_id = parseInt(data.purchaseTypeId);
        }

        if (data.warehouseId) {
            insertData.warehouse_id = parseInt(data.warehouseId);
        }

        if (data.code) {
            insertData.code = data.code;
        }

        const { data: result, error } = await supabase
            .from('materials_purchases')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Error creating material purchase:', error);
            throw error;
        }
        return result;
    },

    async getMaterialPurchases(materialId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_materials_purchases')
            .select('*')
            .eq('material_id', parseInt(materialId))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching material purchases:', error);
            return [];
        }
        return data || [];
    },

    async getMaterialPurchasesDashboard(): Promise<{ pending: number; authorized: number; completed: number; cancelled: number; pending_value: number; authorized_value: number }> {
        const { data, error } = await supabase
            .from('materials_purchases')
            .select('status_id, total_price')
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching purchases dashboard:', error);
            return { pending: 0, authorized: 0, completed: 0, cancelled: 0, pending_value: 0, authorized_value: 0 };
        }

        const counts = { pending: 0, authorized: 0, completed: 0, cancelled: 0, pending_value: 0, authorized_value: 0 };
        for (const row of data || []) {
            const statusId = (row as any).status_id;
            const totalPrice = (row as any).total_price || 0;
            if (statusId === 1) { counts.pending++; counts.pending_value += totalPrice; }
            else if (statusId === 2) { counts.authorized++; counts.authorized_value += totalPrice; }
            else if (statusId === 3) counts.completed++;
            else if (statusId === 4) counts.cancelled++;
        }
        return counts;
    },

    async getMaterialPurchasesAll(): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_materials_purchases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all material purchases:', error);
            return [];
        }
        return data || [];
    },

    async getActivePurchasesMaterialIds(): Promise<Record<number, { hasPending: boolean; hasAuthorized: boolean }>> {
        const { data, error } = await supabase
            .from('materials_purchases')
            .select('material_id, status_id')
            .in('status_id', [1, 2])
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching active purchases:', error);
            return {};
        }
        const map: Record<number, { hasPending: boolean; hasAuthorized: boolean }> = {};
        for (const row of data || []) {
            if (!map[row.material_id]) {
                map[row.material_id] = { hasPending: false, hasAuthorized: false };
            }
            if (row.status_id === 1) map[row.material_id].hasPending = true;
            if (row.status_id === 2) map[row.material_id].hasAuthorized = true;
        }
        return map;
    },

    async authorizeMaterialPurchase(id: string, data: { code: string; purchaseTypeId: string; warehouseId: string; quantity: number; unitPrice: number; justification: string }): Promise<void> {
        const currentUser = await usersService.getCurrentUser();

        const { data: purchase, error: fetchError } = await supabase
            .from('materials_purchases')
            .select('material_id, requester_user_id')
            .eq('id', parseInt(id))
            .single();

        if (fetchError || !purchase) {
            console.error('Error fetching purchase:', fetchError);
            throw fetchError;
        }

        const { data: materialData } = await supabase
            .from('materials')
            .select('description, code')
            .eq('id', purchase.material_id)
            .single();

        const totalPrice = data.quantity * data.unitPrice;

        const updateData: any = {
            status_id: 2,
            code: data.code,
            purchase_type_id: parseInt(data.purchaseTypeId),
            warehouse_id: parseInt(data.warehouseId),
            quantity: data.quantity,
            unit_price: data.unitPrice,
            total_price: totalPrice,
            justification: data.justification,
            authorizer_user_id: currentUser?.id ? parseInt(currentUser.id) : undefined,
            authorized_at: getBrazilTimestamp(),
            updated_at: getBrazilTimestamp()
        };

        const { error } = await supabase
            .from('materials_purchases')
            .update(updateData)
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error authorizing purchase:', error);
            throw error;
        }

        try {
            const materialDesc = materialData?.description || 'Material';
            const materialCode = materialData?.code || '';
            const totalPriceFormatted = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const timestamp = getBrazilTimestamp();

            await supabase.from('users_notifications').insert({
                user_id_to: purchase.requester_user_id,
                user_id_from: currentUser?.id ? parseInt(currentUser.id) : null,
                title: 'Compra Aprovada',
                body: `Sua solicitação de compra do material ${materialCode ? materialCode + ' - ' : ''}${materialDesc} foi aprovada.\nQuantidade: ${data.quantity}\nValor Total: ${totalPriceFormatted}`,
                type: 'Compra Aprovada',
                material_id: purchase.material_id,
                created_at: timestamp,
                is_read: false
            });
        } catch (notifErr) {
            console.error('Error sending purchase authorization notification:', notifErr);
        }
    },

    async cancelMaterialPurchase(id: string, cancelReasonId: number, cancelReasonText?: string): Promise<void> {
        const currentUser = await usersService.getCurrentUser();

        const { data: purchase, error: fetchError } = await supabase
            .from('materials_purchases')
            .select('material_id, requester_user_id')
            .eq('id', parseInt(id))
            .single();

        if (fetchError || !purchase) {
            console.error('Error fetching purchase:', fetchError);
            throw fetchError;
        }

        const { data: materialData } = await supabase
            .from('materials')
            .select('description, code')
            .eq('id', purchase.material_id)
            .single();

        const { data: reasonData } = await supabase
            .from('cfg_materials_purchases_cancel_reasons')
            .select('description')
            .eq('id', cancelReasonId)
            .single();

        const reasonDescription = reasonData?.description || 'Não informado';

        const updateData: any = {
            status_id: 4,
            cancel_reason_id: cancelReasonId,
            updated_at: getBrazilTimestamp()
        };

        if (cancelReasonText) {
            updateData.cancel_reason = cancelReasonText;
        }

        const { error } = await supabase
            .from('materials_purchases')
            .update(updateData)
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error cancelling purchase:', error);
            throw error;
        }

        try {
            const materialDesc = materialData?.description || 'Material';
            const materialCode = materialData?.code || '';
            const cancellerName = currentUser?.nameShort || currentUser?.nameFull || 'Administrador';
            const timestamp = getBrazilTimestamp();
            const reasonBody = cancelReasonText
                ? `${reasonDescription} - ${cancelReasonText}`
                : reasonDescription;

            await supabase.from('users_notifications').insert({
                user_id_to: purchase.requester_user_id,
                user_id_from: currentUser?.id ? parseInt(currentUser.id) : null,
                title: 'Compra Cancelada',
                body: `Sua solicitação de compra do material ${materialCode ? materialCode + ' - ' : ''}${materialDesc} foi cancelada por ${cancellerName}.\nMotivo: ${reasonBody}`,
                type: 'Compra Cancelada',
                material_id: purchase.material_id,
                created_at: timestamp,
                is_read: false
            });
        } catch (notifErr) {
            console.error('Error sending purchase cancellation notification:', notifErr);
        }
    },

    async completeMaterialPurchase(id: string): Promise<void> {
        const currentUser = await usersService.getCurrentUser();

        const { data: purchase, error: fetchError } = await supabase
            .from('materials_purchases')
            .select('material_id, quantity, unit_price, requester_user_id')
            .eq('id', parseInt(id))
            .single();

        if (fetchError || !purchase) {
            console.error('Error fetching purchase:', fetchError);
            throw fetchError;
        }

        const { data: materialData } = await supabase
            .from('materials')
            .select('description, code')
            .eq('id', (purchase as any).material_id)
            .single();

        const { error: updateError } = await supabase
            .from('materials_purchases')
            .update({
                status_id: 3,
                concluded_at: getBrazilTimestamp(),
                updated_at: getBrazilTimestamp()
            })
            .eq('id', parseInt(id));

        if (updateError) {
            console.error('Error completing purchase:', updateError);
            throw updateError;
        }

        const materialId = (purchase as any).material_id;
        const quantity = (purchase as any).quantity;
        const unitPrice = (purchase as any).unit_price;

        const { data: existing } = await supabase
            .from('warehouses_materials')
            .select('id, quantity')
            .eq('material_id', materialId)
            .limit(1)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('warehouses_materials')
                .update({
                    quantity: existing.quantity + quantity,
                    cost_avg: unitPrice,
                    updated_at: getBrazilTimestamp()
                })
                .eq('id', existing.id);
        }

        await supabase
            .from('materials')
            .update({ price_unit: unitPrice })
            .eq('id', materialId);

        try {
            const materialDesc = materialData?.description || 'Material';
            const materialCode = materialData?.code || '';
            const completerName = currentUser?.nameShort || currentUser?.nameFull || 'Administrador';
            const totalPrice = quantity * unitPrice;
            const totalPriceFormatted = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const timestamp = getBrazilTimestamp();

            await supabase.from('users_notifications').insert({
                user_id_to: purchase.requester_user_id,
                user_id_from: currentUser?.id ? parseInt(currentUser.id) : null,
                title: 'Compra Concluída',
                body: `Sua solicitação de compra do material ${materialCode ? materialCode + ' - ' : ''}${materialDesc} foi concluída por ${completerName}.\nQuantidade: ${quantity}\nValor Total: ${totalPriceFormatted}`,
                type: 'Compra Concluída',
                material_id: purchase.material_id,
                created_at: timestamp,
                is_read: false
            });
        } catch (notifErr) {
            console.error('Error sending purchase completion notification:', notifErr);
        }
    },

    async getRecentPurchases(limit = 5): Promise<any[]> {
        const { data, error } = await supabase
            .from('v_materials_purchases')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent purchases:', error);
            return [];
        }
        return data || [];
    }
};
