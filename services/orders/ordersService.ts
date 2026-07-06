import { supabase } from '../supabase';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { r2Service } from '../r2Service';
import type { Order, User, OrderFilters, SuspendedReason, CauseReason, ServiceHistoryItem } from '../../types';
import { getPublicImageUrl } from '../imageUtils';
import { usersService } from '../users/usersService';

const ordersMetadataCache = {
    companies: null as any[] | null,
    companiesTimestamp: 0,
    leaders: null as Map<string, any> | null,
    leadersTimestamp: 0,
    units: null as Map<string, any> | null,
    unitsTimestamp: 0,
    CACHE_DURATION: 5 * 60 * 1000
};

export const ordersService = {
    /**
     * Get Active Orders (SS/OS) by unit asset tag ID
     */
    async getActiveOrdersByAssetTagId(unitAssetTagId: string | number): Promise<any[]> {
        if (!unitAssetTagId) return [];
        
        try {
            const numericId = typeof unitAssetTagId === 'string' ? parseInt(unitAssetTagId) : unitAssetTagId;
            console.log('Querying active orders for ID:', numericId);
            
            const { data, error } = await supabase
                .from('v_orders')
                .select('id, order_mask, status_id, status_description, status_at, requested_services, requested_at, unit_asset_tag_id, unit_asset_tag_has_order, parent_id')
                .eq('unit_asset_tag_id', numericId)
                .eq('unit_asset_tag_has_order', true)
                .or('parent_id.eq.0,parent_id.is.null')
                .not('status_id', 'in', '(7,8)')
                .order('requested_at', { ascending: false });

            if (error) {
                console.error('Error fetching active orders:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Exception in getActiveOrdersByAssetTagId:', error);
            return [];
        }
    },
    
    /**
     * Mark a Service Order (SS) as completed (status 8)
     */
    async completeServiceOrder(orderId: string | number, userId?: string | number, rating: number = 0): Promise<boolean> {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
            if (isNaN(numericId)) return false;

            const now = getBrazilTimestamp();
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status_id: 8, 
                    status_at: now,
                    updated_at: now,
                    unit_asset_tag_has_order: false,
                    unit_asset_tag_no_has_order_user_id: userId || null,
                    unit_asset_tag_no_has_order_at: now,
                    rating: rating || null
                })
                .eq('id', numericId);

            if (error) {
                console.error('Error completing service order:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Exception in completeServiceOrder:', error);
            return false;
        }
    },

    /**
     * Cancel Service Request (Order)
     */
    async cancelServiceOrder(orderId: string | number, userId: string | number): Promise<boolean> {
        try {
            const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
            if (isNaN(numericId)) return false;

            const now = getBrazilTimestamp();
            const { error } = await supabase
                .from('orders')
                .update({
                    status_id: 7,
                    status_at: now,
                    updated_at: now,
                    unit_asset_tag_has_order: false,
                    unit_asset_tag_no_has_order_user_id: userId,
                    unit_asset_tag_no_has_order_at: now
                })
                .eq('id', numericId);

            if (error) {
                console.error('Error cancelling service order:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Exception in cancelServiceOrder:', error);
            return false;
        }
    },

    async updateOrderStatus(orderId: string, statusId: number): Promise<void> {
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', orderId).single();
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: statusId,
                status_at: getBrazilTimestamp()
            })
            .eq('id', orderId);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },

    async updateServiceRequestStatus(serviceRequestId: string): Promise<void> {
        const id = Number(serviceRequestId);
        const { data: childOrders, error } = await supabase
            .from('orders')
            .select('status_id, status_at')
            .eq('parent_id', id)
            .eq('is_deleted', false);

        if (error) {
            console.error('Erro ao buscar OS filhas:', error);
            throw error;
        }

        if (!childOrders || childOrders.length === 0) return;

        const { data: statusesData, error: statusError } = await supabase
            .from('cfg_orders_statuses')
            .select('id, priority_level');

        if (statusError) {
            console.error('Erro ao buscar cfg_orders_statuses:', statusError);
            return;
        }

        const priorityMap = new Map<number, number>();
        statusesData?.forEach((s: any) => priorityMap.set(s.id, s.priority_level));

        const ordersWithPriority = childOrders.map((os: any) => ({
            ...os,
            priority_level: priorityMap.get(os.status_id) || 0
        }));

        const maxPriority = Math.max(...ordersWithPriority.map((os: any) => os.priority_level));

        const targetOrder = ordersWithPriority
            .filter((os: any) => os.priority_level === maxPriority)
            .sort((a: any, b: any) => new Date(b.status_at).getTime() - new Date(a.status_at).getTime())[0];

        if (!targetOrder) return;

        const { data: ssData } = await supabase
            .from('orders')
            .select('status_id, status_at')
            .eq('id', id)
            .single();

        if (!ssData) return;

        await supabase
            .from('orders')
            .update({
                status_id: targetOrder.status_id,
                status_at: targetOrder.status_at,
                updated_at: getBrazilTimestamp() 
            })
            .eq('id', id);
    },

    async updateOrderFiles(orderId: string, filenames: string[]): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({
                img_files_names: filenames
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    async updateOrderImage(orderId: string, path: string, filename: string): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({
                img_file_path: path,
                img_file_name: filename
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    async uploadOrderImage(companyId: string, orderId: string, file: File, onProgress?: (progress: number) => void): Promise<{ path: string; filename: string }> {
        const fileExt = file.name.split('.').pop();
        const uniqueSuffix = Math.random().toString(36).substring(7);
        const fileName = `${Date.now()}-${uniqueSuffix}.${fileExt}`;
        const folderPath = `companies/${companyId}/orders/${orderId}/images`;
        const fullPath = `${folderPath}/${fileName}`;

        await r2Service.uploadFile(file, fullPath, onProgress);

        return { path: folderPath, filename: fileName };
    },

    async copyImagesFromOrderToOrder(srcCompanyId: string, srcOrderId: string, destCompanyId: string, destOrderId: string, files: string[]): Promise<void> {
        const srcFolder = `companies/${srcCompanyId}/orders/${srcOrderId}/images`;
        const destFolder = `companies/${destCompanyId}/orders/${destOrderId}/images`;

        if (r2Service.isR2Configured()) {
            const promises = files.map(filename => {
                return r2Service.copyFile(`${srcFolder}/${filename}`, `${destFolder}/${filename}`);
            });
            await Promise.all(promises);
        } else {
            const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
            const promises = files.map(filename => {
                return supabase.storage.from(bucketName).copy(
                    `${srcFolder}/${filename}`,
                    `${destFolder}/${filename}`
                );
            });
            await Promise.all(promises);
        }
    },

    async createServiceRequest(order: Partial<Order>): Promise<Order> {
        // Passo 1 & 2: Validar dados obrigatórios
        if (!order.clientId || !order.unitId || !order.typeId || !order.requestedServices) {
            throw new Error('Dados obrigatórios faltando: clientId, unitId, typeId, requestedServices');
        }

        const currentUser = await usersService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Usuário não autenticado');
        }

        const { data: userTeam, error: teamError } = await supabase
            .from('cfg_teams')
            .select('company_id, department_id')
            .eq('id', currentUser.teamId)
            .single();

        const { data: unitData, error: unitError } = await supabase
            .from('units')
            .select('description, description_full, system_parent_id, system_id, unit_type_parent_id, unit_type_id, latitude, longitude')
            .eq('id', order.unitId)
            .single();

        const { data: orderTypeData, error: typeError } = await supabase
            .from('cfg_orders_types')
            .select('description, code')
            .eq('id', order.typeId)
            .single();

        let priorityData: any = null;
        if (order.priorityId) {
            const { data } = await supabase
                .from('cfg_orders_priorities')
                .select('description, code')
                .eq('id', order.priorityId)
                .single();
            priorityData = data;
        }

        let assetTagData: any = null;
        if (order.unitAssetTagId) {
            const { data } = await supabase
                .from('cfg_units_assets_tags')
                .select('asset_tag_id, asset_tag_sub_id')
                .eq('id', order.unitAssetTagId)
                .single();
            assetTagData = data;
        }

        const finalAssetTagId = assetTagData?.asset_tag_id || (order.assetTagId ? parseInt(order.assetTagId) : null);
        const finalAssetTagSubId = assetTagData?.asset_tag_sub_id || (order.assetTagSubId ? parseInt(order.assetTagSubId) : null);

        const currentYear = new Date().getFullYear();

        const { data: counterData, error: counterFetchError } = await supabase
            .from('cfg_orders_counter')
            .select('id, counter')
            .eq('year', currentYear)
            .maybeSingle();

        let newCounter: number;
        if (!counterData) {
            const { data: newCounterData } = await supabase
                .from('cfg_orders_counter')
                .insert({ year: currentYear, counter: 1 })
                .select('counter')
                .single();
            newCounter = newCounterData!.counter;
        } else {
            const { data: updatedCounterData } = await supabase
                .from('cfg_orders_counter')
                .update({ counter: counterData.counter + 1 })
                .eq('id', counterData.id)
                .select('counter')
                .single();
            newCounter = updatedCounterData!.counter;
        }

        const orderMask = `${newCounter}.0.${currentYear}`;

        const dbData: any = {
            plan_id: null,
            object_id: null,
            parent_id: null,
            type_sub_id: null,
            team_leader_id: null,
            status_id: 1,
            counter_child: 0,
            team_id: null,
            contract_id: null,
            provider_company_id: null,
            counter_parent: newCounter,
            order_mask: orderMask,
            year: currentYear,
            unit_asset_tag_has_order: true,

            company_id: userTeam?.company_id || null,
            department_id: userTeam?.department_id || null,
            requester_name: currentUser.nameShort || currentUser.nameFull,
            requester_team_id: currentUser.teamId ? parseInt(currentUser.teamId) : null,
            requester_phone: currentUser.mobileMask || currentUser.mobile || null,
            created_user_id: parseInt(currentUser.id),

            client_id: parseInt(order.clientId),
            unit_id: parseInt(order.unitId),
            unit_asset_tag_id: order.unitAssetTagId ? parseInt(order.unitAssetTagId) : null,
            type_id: parseInt(order.typeId),
            priority_id: order.priorityId ? parseInt(order.priorityId) : null,
            requested_services: order.requestedServices,

            system_parent_id: unitData?.system_parent_id || null,
            system_id: unitData?.system_id || null,
            unit_type_parent_id: unitData?.unit_type_parent_id || null,
            unit_type_id: unitData?.unit_type_id || null,
            unit_latitude: unitData?.latitude || null,
            unit_longitude: unitData?.longitude || null,

            asset_tag_id: finalAssetTagId,
            asset_tag_sub_id: finalAssetTagSubId,

            status_at: getBrazilTimestamp(),
            requested_at: getBrazilTimestamp(),
            created_at: getBrazilTimestamp()
        };

        if (order.images && Array.isArray(order.images)) {
            if (order.images.length > 4) {
                throw new Error('Máximo de 4 imagens permitido');
            }
            dbData.img_files_names = order.images;
        }

        const { data, error } = await supabase
            .from('orders')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        const createdId = data.id.toString();
        const folderPath = `companies/${dbData.company_id}/orders/${createdId}/images`;
        
        await supabase
            .from('orders')
            .update({ img_file_path: folderPath })
            .eq('id', createdId);

        if (order.isNotifying) {
            await supabase
                .from('orders_followers')
                .insert({
                    o_id: parseInt(createdId),
                    user_id: parseInt(currentUser.id)
                });
        }

        let fullOrder = await this.getOrderById(createdId);
        if (!fullOrder) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            fullOrder = await this.getOrderById(createdId);
        }

        if (!fullOrder) {
            return {
                id: createdId,
                orderMask: orderMask,
                clientId: dbData.client_id?.toString(),
                unitId: dbData.unit_id?.toString(),
                unitDescription: unitData?.description,
                unitDescriptionFull: unitData?.description_full,
                typeId: dbData.type_id?.toString(),
                typeCode: orderTypeData?.code,
                typeDescription: orderTypeData?.description,
                requestedServices: dbData.requested_services,
                priorityId: dbData.priority_id?.toString(),
                priorityDescription: priorityData?.description,
                requesterName: dbData.requester_name,
                requesterPhone: dbData.requester_phone,
                requestedAt: dbData.requested_at,
                createdAt: dbData.created_at,
                statusId: dbData.status_id,
                statusAt: dbData.status_at,
                progress: '0%',
                images: dbData.img_files_names || [],
                imgFilePath: folderPath
            } as any;
        }

        return fullOrder;
    },

    async createOrder(order: Partial<Order>): Promise<Order> {
        if (!order.clientId || !order.unitId || !order.typeId || !order.requestedServices) {
            throw new Error('Dados obrigatórios faltando: client_id, unit_id, type_id, requested_services');
        }

        const currentUser = await usersService.getCurrentUser();
        if (!currentUser) throw new Error('Usuário não autenticado');

        const { data: userTeam } = await supabase
            .from('cfg_teams')
            .select('company_id, department_id')
            .eq('id', currentUser.teamId)
            .single();

        let dbData: any = {};
        let orderMask = '';

        if (order.parentId) {
            const parentId = parseInt(order.parentId.toString());
            const { data: parentOrder, error: parentError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', parentId)
                .single();

            if (parentError || !parentOrder) throw new Error('Solicitação de Serviço (SS) pai não encontrada');

            let providerCompanyId = null;
            let providerDepartmentId = null;
            if (order.contractId) {
                const { data: contractData } = await supabase
                    .from('contracts')
                    .select('provider_company_id, provider_department_id')
                    .eq('id', order.contractId)
                    .single();

                if (contractData) {
                    providerCompanyId = contractData.provider_company_id;
                    providerDepartmentId = contractData.provider_department_id;
                }
            }

            const { count, error: countError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('parent_id', parentId);

            if (countError) throw new Error('Erro ao contar ordens filhas');

            const childCounter = (count || 0) + 1;
            const currentYear = parentOrder.year;

            orderMask = `${parentOrder.counter_parent}.${childCounter}.${currentYear}`;

            dbData = {
                parent_id: parentId,
                client_id: parentOrder.client_id,
                unit_id: parentOrder.unit_id,
                unit_asset_tag_id: order.unitAssetTagId ? parseInt(order.unitAssetTagId) : parentOrder.unit_asset_tag_id,
                system_parent_id: parentOrder.system_parent_id,
                system_id: parentOrder.system_id,
                unit_type_parent_id: parentOrder.unit_type_parent_id,
                unit_type_id: parentOrder.unit_type_id,
                unit_latitude: parentOrder.unit_latitude,
                unit_longitude: parentOrder.unit_longitude,
                asset_tag_id: order.assetTagId ? parseInt(order.assetTagId) : parentOrder.asset_tag_id,
                asset_tag_sub_id: order.assetTagSubId ? parseInt(order.assetTagSubId) : parentOrder.asset_tag_sub_id,
                counter_parent: parentOrder.counter_parent,
                counter_child: childCounter,
                year: currentYear,
                company_id: parentOrder.company_id, 

                type_id: parseInt(order.typeId),
                type_sub_id: order.typeSubId ? parseInt(order.typeSubId) : null,
                object_id: order.objectId ? parseInt(order.objectId) : null,
                priority_id: order.priorityId ? parseInt(order.priorityId) : null,
                team_id: order.teamId ? parseInt(order.teamId) : null,
                contract_id: order.contractId ? parseInt(order.contractId) : null,
                plan_id: order.planId ? parseInt(order.planId) : null,
                requested_services: order.requestedServices,

                provider_company_id: providerCompanyId,
                provider_department_id: providerDepartmentId,

                department_id: userTeam?.department_id || null,
                requester_name: currentUser.nameShort || currentUser.nameFull,
                requester_team_id: currentUser.teamId ? parseInt(currentUser.teamId) : null,
                requester_phone: currentUser.mobileMask || currentUser.mobile || null,
                created_user_id: parseInt(currentUser.id),

                order_mask: orderMask,
                status_id: 2, 
                unit_asset_tag_has_order: false,
                status_at: getBrazilTimestamp(),
                requested_at: getBrazilTimestamp(), 
                created_at: getBrazilTimestamp()
            };
        } else {
            throw new Error("Não é possível criar uma nova OS sem uma SS");
        }

        if (order.images && Array.isArray(order.images)) {
            dbData.img_files_names = order.images;
        }

        const { data, error: insertError } = await supabase
            .from('orders')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        if (dbData.parent_id) {
            await this.updateServiceRequestStatus(dbData.parent_id.toString());
        }

        const insertedOrder = data as any;
        const folderPath = `companies/${insertedOrder.company_id}/orders/${insertedOrder.id}/images`;
        await supabase
            .from('orders')
            .update({ img_file_path: folderPath })
            .eq('id', insertedOrder.id);

        let fullOrder = await this.getOrderById(insertedOrder.id);
        if (!fullOrder) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            fullOrder = await this.getOrderById(insertedOrder.id);
        }

        if (!fullOrder) {
            return {
                ...insertedOrder,
                id: insertedOrder.id.toString(),
                companyId: insertedOrder.company_id?.toString(),
                imgFilePath: folderPath
            } as any;
        }

        return fullOrder;
    },

    async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
        const dbData: any = {
            updated_at: getBrazilTimestamp()
        };

        if (order.typeId !== undefined) dbData.type_id = order.typeId ? parseInt(order.typeId) : null;
        if (order.typeSubId !== undefined) dbData.type_sub_id = order.typeSubId ? parseInt(order.typeSubId) : null;
        if (order.objectId !== undefined) dbData.object_id = order.objectId ? parseInt(order.objectId) : null;
        if (order.priorityId !== undefined) dbData.priority_id = order.priorityId ? parseInt(order.priorityId) : null;
        if (order.teamId !== undefined) dbData.team_id = order.teamId ? parseInt(order.teamId) : null;
        if (order.contractId !== undefined) dbData.contract_id = order.contractId ? parseInt(order.contractId) : null;
        if (order.planId !== undefined) dbData.plan_id = order.planId ? parseInt(order.planId) : null;
        if (order.requestedServices !== undefined) dbData.requested_services = order.requestedServices;
        if (order.clientId !== undefined) dbData.client_id = order.clientId ? parseInt(order.clientId) : null;
        if (order.unitId !== undefined) dbData.unit_id = order.unitId ? parseInt(order.unitId) : null;

        if (order.unitAssetTagId !== undefined) {
            const newUnitAssetTagId = order.unitAssetTagId ? parseInt(order.unitAssetTagId) : null;
            dbData.unit_asset_tag_id = newUnitAssetTagId;

            if (newUnitAssetTagId) {
                const { data: tagData, error: assetTagError } = await supabase
                    .from('cfg_units_assets_tags')
                    .select('asset_tag_id, asset_tag_sub_id')
                    .eq('id', newUnitAssetTagId)
                    .single();

                if (!assetTagError && tagData) {
                    dbData.asset_tag_id = tagData.asset_tag_id ?? null;
                    dbData.asset_tag_sub_id = tagData.asset_tag_sub_id ?? null;
                }
            } else {
                dbData.asset_tag_id = null;
                dbData.asset_tag_sub_id = null;
            }
        }

        if (order.assetTagId !== undefined && order.unitAssetTagId === undefined) dbData.asset_tag_id = order.assetTagId ? parseInt(order.assetTagId) : null;
        if (order.assetTagSubId !== undefined && order.unitAssetTagId === undefined) dbData.asset_tag_sub_id = order.assetTagSubId ? parseInt(order.assetTagSubId) : null;
        if (order.statusId !== undefined) dbData.status_id = order.statusId;
        if (order.statusAt !== undefined) dbData.status_at = order.statusAt;
        if (order.causeReasonId !== undefined) dbData.cause_reason_id = order.causeReasonId;

        if (order.progress !== undefined) {
            const p = parseFloat(String(order.progress).replace('%', ''));
            dbData.progress = isNaN(p) ? 0 : p / 100;
        }

        if (order.images !== undefined) dbData.img_files_names = order.images;

        const { data, error } = await supabase
            .from('orders')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (order.contractId) {
            const { data: contractData } = await supabase
                .from('contracts')
                .select('provider_company_id, provider_department_id')
                .eq('id', order.contractId)
                .single();

            if (contractData) {
                await supabase
                    .from('orders')
                    .update({
                        provider_company_id: contractData.provider_company_id,
                        provider_department_id: contractData.provider_department_id
                    })
                    .eq('id', id);
            }
        }

        if (data && data.parent_id) {
            await this.updateServiceRequestStatus(data.parent_id.toString());
        }

        let fullOrder = await this.getOrderById(id);

        if (!fullOrder) {
            await new Promise(resolve => setTimeout(resolve, 500));
            fullOrder = await this.getOrderById(id);
        }

        if (!fullOrder) {
            const updatedData = data as any;
            return {
                ...updatedData,
                id: updatedData.id.toString(),
                companyId: updatedData.company_id?.toString()
            } as Order;
        }

        return fullOrder;
    },

    async getParentOrder(parentId: string | number): Promise<Order | null> {
        const fullOrder = await this.getOrderById(parentId.toString());
        if (fullOrder) return fullOrder;

        const { data, error } = await supabase
            .from('v_orders_parent')
            .select('*')
            .eq('id', parentId)
            .single();

        if (error) {
            console.error('Error fetching parent order from v_orders_parent:', error);
            return null;
        }

        return {
            id: data.id?.toString(),
            orderMask: data.order_mask,
            clientId: data.client_id?.toString(),
            typeId: data.type_id?.toString(),
            typeCode: data.type_code,
            typeSubId: data.type_sub_id?.toString(),
            objectId: data.object_id?.toString(),
            contractId: data.contract_id?.toString(),
            planId: data.plan_id?.toString(),
            priorityId: data.priority_id?.toString(),
            typeDescription: data.type_description,
            unitId: data.unit_id?.toString(),
            unitAssetTagId: data.unit_asset_tag_id?.toString(),
            assetTagId: data.asset_tag_id?.toString(),
            assetTagSubId: data.asset_tag_sub_id?.toString(),
            systemId: data.system_id?.toString(),
            teamId: data.team_id?.toString(),
            unitDescription: data.unit_description,
            unitAssetTagDescription: data.asset_tag_description,
            assetTagDescription: data.asset_tag_description,
            unitAssetTagSubDescription: data.asset_tag_sub_description,
            assetTagSubDescription: data.asset_tag_sub_description,
            requesterName: data.requester_name,
            requesterTeamCode: data.requester_team_code,
            requesterPhone: data.requester_phone,
            requestedAt: data.requested_at,
            requestedServices: data.requested_services,
            statusId: data.status_id,
            statusAt: data.status_at,
            statusDescription: data.status_description,
            statusColor: data.status_color,
            statusIcon: data.status_icon,
            statusBackgroundColor: data.status_background_color,
            imgFilesNames: data.img_files_names || [],
            imgFilePath: data.img_file_path,
            clientName: data.client_name,
            companyId: data.company_id?.toString(),
            priorityCode: data.priority_code,
            teamLeaderId: data.team_leader_id?.toString()
        } as Order;
    },

    async getChildOrders(parentId: string | number): Promise<Order[]> {
        try {
            const pid = typeof parentId === 'string' && !isNaN(Number(parentId)) ? Number(parentId) : parentId;

            const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
            const companyMap = new Map<any, any>((companies || []).map((c: any) => [c.id, c]));

            const { data, error } = await supabase
                .from('v_orders')
                .select('*')
                .eq('parent_id', pid)
                .order('requested_at', { ascending: false });

            if (error) throw error;

            const orderIds = (data || []).map((o: any) => o.id);
            let statusMap: Record<string, string> = {};

            if (orderIds.length > 0) {
                const { data: statusData } = await supabase
                    .from('orders')
                    .select('id, status_at')
                    .in('id', orderIds);

                if (statusData) {
                    statusData.forEach((s: any) => {
                        statusMap[s.id] = s.status_at;
                    });
                }
            }

            return (data || []).map((row: any) => {
                const providerCompanyIdStr = row.provider_company_id?.toString();
                const providerCompany = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;
                const providerLogoUrl = getPublicImageUrl(
                    row.provider_company_img_file_path || row.provider_company_img_path || providerCompany?.img_file_path,
                    row.provider_company_img_file_name || row.provider_company_img_name || providerCompany?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                );

                return {
                    id: row.id.toString(),
                    type: 'OS',
                    orderMask: row.order_mask,
                    clientId: row.client_id,
                    clientName: row.client_name,
                    companyId: row.company_id,
                    unitId: row.unit_id,
                    departmentId: row.department_id,
                    providerDepartmentId: row.provider_department_id,
                    typeId: row.type_id?.toString(),
                    typeCode: row.type_code,
                    typeSubId: row.type_sub_id?.toString(),
                    typeSubCode: row.type_sub_code,
                    objectId: row.object_id?.toString(),
                    objectCode: row.object_code,
                    priorityId: row.priority_id?.toString(),
                    priorityCode: row.priority_code,
                    statusId: row.status_id,
                    statusAt: statusMap[row.id] || row.status_at,
                    statusDescription: row.status_description,
                    statusIcon: row.status_icon,
                    iconColor: row.icon_color,
                    statusBackgroundColor: row.status_background_color,
                    requestedServices: row.requested_services,
                    requesterName: row.requester_name,
                    requesterTeamCode: row.team_code,
                    requesterPhone: row.requester_phone,
                    requestedAt: row.requested_at,
                    progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                    providerCompanyName: row.provider_company_description || row.provider_company_name || providerCompany?.description,
                    providerLogo: providerLogoUrl,
                    unitDescription: row.unit_description,
                    unitAssetTagDescription: row.unit_asset_tag_description || row.asset_tag_description,
                    unitAssetTagSubDescription: row.unit_asset_tag_sub_description || row.asset_tag_sub_description,
                    assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                    assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                    teamCode: row.team_code,
                    teamLeaderNameShort: row.team_leader_name_short,
                    parentId: row.parent_id,
                    imgFilePath: row.img_file_path,
                    imgFileName: row.img_file_name,
                    imgFilesNames: row.img_files_names
                } as Order;
            });
        } catch (error) {
            console.error('Error fetching child orders:', error);
            return [];
        }
    },

    _mapOrder(
        item: any,
        companyMap?: Map<string, any>,
        realStatusMap?: Record<string, string>,
        leaderMap?: Map<string, any>,
        unitMap?: Map<string, any>
    ): Order {
        if (!item) return {} as Order;

        let statusName = item.status_description || item.status_name || item.status_code || item.o_status_description || item.status;
        let progressStr = item.progress ? `${item.progress}% ` : '0%';
        let iconColor = item.icon_color || (item.status_color || 'text-slate-500');
        if (iconColor && !iconColor.startsWith('text-') && !iconColor.startsWith('#')) {
            iconColor = `text-${iconColor}`;
        }
        let bgColor = item.background_color || 'transparent';
        if (bgColor !== 'transparent' && !bgColor.startsWith('bg-') && !bgColor.startsWith('#')) {
            bgColor = `bg-${bgColor}`;
        }
        let borderClass = (item.status_color || 'text-slate-500').replace('text-', 'border-l-');
        let statusIcon = item.status_icon || 'task_alt';

        switch (item.status_id) {
            case 1: if (!item.status_color) borderClass = 'border-l-orange-500'; break;
            case 2: if (!item.status_color) borderClass = 'border-l-yellow-500'; break;
        }

        const providerCompanyIdStr = item.provider_company_id?.toString();
        const company = providerCompanyIdStr ? companyMap?.get(providerCompanyIdStr) : null;

        let providerLogoUrl = company?.signedUrl;

        if (!providerLogoUrl) {
            const providerImgPath = item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path;
            const providerImgName = item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name;
            providerLogoUrl = getPublicImageUrl(providerImgPath, providerImgName, { width: 100, height: 100, resize: 'contain' });
        }

        const leaderLoc = item.team_leader_id ? leaderMap?.get(item.team_leader_id.toString()) : null;
        const unitInfo = item.unit_id ? unitMap?.get(item.unit_id.toString()) : null;

        return {
            id: item.id?.toString(),
            orderMask: item.order_mask,
            typeId: item.type_id?.toString(),
            typeSubId: item.type_sub_id?.toString(),
            objectId: item.object_id?.toString(),
            contractId: item.contract_id?.toString(),
            planId: item.plan_id?.toString(),
            clientId: item.client_id?.toString(),
            departmentId: item.department_id?.toString(),
            unitAssetTagId: item.unit_asset_tag_id?.toString(),
            assetTagId: item.asset_tag_id?.toString(),
            assetTagSubId: item.asset_tag_sub_id?.toString(),
            requestedServices: item.requested_services,
            requestedAt: item.requested_at,
            date: item.requested_at,
            createdAt: item.created_at,
            statusId: Number(item.status_id),
            statusName: statusName,
            statusDescription: statusName,
            status: statusName,
            statusAt: realStatusMap ? realStatusMap[item.id?.toString()] : item.status_at,
            progress: (() => {
                const p = parseFloat(String(item.progress || '0').replace('%', ''));
                return isNaN(p) ? '0%' : `${Math.round(p * 100)}%`;
            })(),
            statusIcon: item.status_icon || statusIcon,
            iconColor: iconColor,
            statusBackgroundColor: bgColor,
            borderColor: borderClass,
            statusColor: item.status_color,
            parentId: item.parent_id ? Number(item.parent_id) : null,
            unitId: item.unit_id?.toString(),
            unitDescription: item.unit_description,
            unitDescriptionFull: item.description_full || item.unit_description_full,
            typeDescription: item.type_description,
            unitAssetTagDescription: item.asset_tag_description || item.unit_asset_tag_description,
            assetTagDescription: item.asset_tag_description || item.unit_asset_tag_description,
            unitAssetTagSubDescription: item.asset_tag_sub_description || item.unit_asset_tag_sub_description,
            assetTagSubDescription: item.asset_tag_sub_description || item.unit_asset_tag_sub_description,
            typeCode: item.type_code,
            typeSubCode: item.type_sub_code,
            typeSubDescription: item.type_sub_description,
            providerCompanyId: item.provider_company_id?.toString(),
            providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
            providerCompanyDescription: item.provider_company_description,
            requesterName: item.requester_name,
            requesterTeamId: item.requester_team_id?.toString(),
            requesterTeamCode: item.requester_team_code,
            requesterTeamDescription: item.requester_team_description,
            requesterPhone: item.requester_phone,
            systemDescription: item.system_description,
            systemId: item.system_id?.toString(),
            providerLogo: providerLogoUrl,
            providerCompanyImgFilePath: item.provider_company_img_file_path,
            providerCompanyImgFileName: item.provider_company_img_file_name,
            priorityId: item.priority_id?.toString(),
            priorityName: item.priority_description,
            priorityDescription: item.priority_description,
            priorityCode: item.priority_code,
            priorityColor: item.priority_color,
            objectCode: item.object_code,
            objectDescription: item.object_description,
            causeReasonDescription: item.cause_reason_description || 'N/I',
            createdUserId: item.created_user_id?.toString(),
            teamId: item.team_id?.toString(),
            teamCode: item.team_code,
            teamDescription: item.team_description,
            teamLeaderId: item.team_leader_id?.toString(),
            teamLeaderNameShort: item.team_leader_name_short,
            updatedDate: item.updated_at,
            contractDescription: item.contract_description,
            planDescription: item.plan_description,
            clientName: item.client_name,
            unitLatitude: item.unit_latitude,
            unitLongitude: item.unit_longitude,
            unitAvatarUrl: unitInfo?.avatarUrl,
            imgFilePath: item.img_file_path,
            imgFileName: item.img_file_name,
            imgFilesNames: item.img_files_names,
            companyId: item.company_id?.toString(),
            ovCounter: item.ov_counter
        } as Order;
    },

    async getOrdersObjects(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_objects').select('*').order('description');
        if (error) { console.error('Error fetching order objects:', error); return []; }
        return data || [];
    },

    async getPlans(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_plans').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching plans:', error); return []; }
        return data || [];
    },

    async getCancelReasons(): Promise<any[]> {
        const { data, error } = await supabase.from('cfg_orders_cancel_reasons').select('*').eq('is_available', 'true').order('description');
        if (error) { console.error('Error fetching cancel reasons:', error); return []; }
        return data || [];
    },

    async getSuspendedReasons(): Promise<SuspendedReason[]> {
        const { data, error } = await supabase
            .from('cfg_orders_suspended_reasons')
            .select('id, description')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');
        if (error) { console.error('Error fetching suspended reasons:', error); return []; }
        return data || [];
    },

    async getOrderCauseReasons(): Promise<CauseReason[]> {
        const { data, error } = await supabase
            .from('v_orders_causes_reasons')
            .select('id, description')
            .eq('is_availabe', true)
            .order('description');
        if (error) { console.error('Error fetching order cause reasons:', error); return []; }
        return data || [];
    },

    async getOpenOrdersByUnit(unitId: string, filters: {
        orderObjectId?: string | string[];
        orderTypeId?: string | string[];
        orderTypeSubId?: string | string[];
        contractId?: string | string[];
        planId?: string | string[];
        teamId?: string | string[];
    }): Promise<any[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .eq('unit_id', unitId)
            .in('status_id', [2, 3, 4, 5])
            .not('parent_id', 'is', null);

        if (filters.orderObjectId) {
            if (Array.isArray(filters.orderObjectId)) query = query.in('object_id', filters.orderObjectId);
            else query = query.eq('object_id', filters.orderObjectId);
        }
        if (filters.orderTypeId) {
            if (Array.isArray(filters.orderTypeId)) query = query.in('type_id', filters.orderTypeId);
            else query = query.eq('type_id', filters.orderTypeId);
        }
        if (filters.orderTypeSubId) {
            if (Array.isArray(filters.orderTypeSubId)) query = query.in('type_sub_id', filters.orderTypeSubId);
            else query = query.eq('type_sub_id', filters.orderTypeSubId);
        }
        if (filters.contractId) {
            if (Array.isArray(filters.contractId)) query = query.in('contract_id', filters.contractId);
            else query = query.eq('contract_id', filters.contractId);
        }
        if (filters.planId) {
            if (Array.isArray(filters.planId)) query = query.in('plan_id', filters.planId);
            else query = query.eq('plan_id', filters.planId);
        }
        if (filters.teamId) {
            if (Array.isArray(filters.teamId)) query = query.in('team_id', filters.teamId);
            else query = query.eq('team_id', filters.teamId);
        }

        const { data, error } = await query;
        if (error) { console.error('Error fetching open orders by unit:', error); return []; }
        return data || [];
    },

    async getOrderByMask(mask: string): Promise<Order | null> {
        const result = await this.getOrdersFilters({ orderMask: mask, useGeneralView: true, pageSize: 1 });
        return result.data?.[0] || null;
    },

    async getOrderById(id: string | number): Promise<Order | null> {
        const { data } = await this.getOrdersFilters({ id: [id.toString()], useGeneralView: true });
        return data.length > 0 ? data[0] : null;
    },

    async getFollowedOrderIds(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('orders_followers')
            .select('o_id')
            .eq('user_id', parseInt(userId));
        if (error) { console.error('Error fetching followed orders:', error); return []; }
        return data.map((row: any) => row.o_id.toString());
    },

    async toggleOrderFollow(orderId: string, userId: string): Promise<boolean> {
        const oId = parseInt(orderId);
        const uId = parseInt(userId);

        const { data: existing } = await supabase
            .from('orders_followers')
            .select('id')
            .eq('o_id', oId)
            .eq('user_id', uId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('orders_followers')
                .delete()
                .eq('o_id', oId)
                .eq('user_id', uId);
            if (error) { console.error('Error removing follower:', error); return true; }
            return false;
        } else {
            const { error } = await supabase
                .from('orders_followers')
                .insert([{ o_id: oId, user_id: uId }]);
            if (error) { console.error('Error adding follower:', error); return false; }
            return true;
        }
    },

    async getOrdersFilters(filters?: OrderFilters & { page?: number; pageSize?: number }): Promise<{ data: Order[]; hasMore: boolean; total: number }> {
        const page = filters?.page ?? 0;
        const pageSize = filters?.pageSize ?? 20;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const viewName = 'v_orders';

        let query = supabase
            .from(viewName)
            .select('*', { count: 'exact' });

        if (!filters?.useGeneralView) {
            query = query.not('status_id', 'in', '(7,8)');
        }

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (val === null) { query = query.is(column, null); return; }
                if (val === undefined || val === '') return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('id', filters.id);
            applyFilter('order_mask', filters.orderMask);
            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('unit_asset_tag_id', filters.unitAssetTagId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('asset_tag_sub_id', filters.assetTagSubId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('requester_team_id', filters.requesterTeamId);
            applyFilter('priority_id', filters.priorityId);
            if (filters.parentId !== undefined) {
                if (filters.parentId === null) {
                    query = query.or('parent_id.eq.0,parent_id.is.null');
                } else {
                    applyFilter('parent_id', filters.parentId);
                }
            }

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }

            if (filters.activeFilter === 'SS') {
                query = query.is('parent_id', null);
            } else if (filters.activeFilter === 'OS') {
                query = query.not('parent_id', 'is', null);
            } else if (filters.activeFilter === '2023') {
                query = query.eq('year', 2023);
            } else if (filters.activeFilter === 'Alta Prioridade') {
                query = query.in('priority_id', [4, 5]);
            }

            if (filters.statusId) {
                query = query.eq('status_id', filters.statusId);
            }

            if (filters.period) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const fifteenDaysAgo = new Date(today);
                fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                if (filters.period === 'Hoje') {
                    query = query.gte('requested_at', today.toISOString());
                } else if (filters.period === 'Ontem') {
                    query = query.gte('requested_at', yesterday.toISOString()).lt('requested_at', today.toISOString());
                } else if (filters.period === '2-7 dias') {
                    query = query.gte('requested_at', sevenDaysAgo.toISOString()).lt('requested_at', yesterday.toISOString());
                } else if (filters.period === '8-15 dias') {
                    query = query.gte('requested_at', fifteenDaysAgo.toISOString()).lt('requested_at', sevenDaysAgo.toISOString());
                } else if (filters.period === '16-30 dias') {
                    query = query.gte('requested_at', thirtyDaysAgo.toISOString()).lt('requested_at', fifteenDaysAgo.toISOString());
                } else if (filters.period === '> 30 dias') {
                    query = query.lt('requested_at', thirtyDaysAgo.toISOString());
                }
            }

            // Filtro por range de datas customizado (usado no histórico)
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                if (!isNaN(fromDate.getTime())) {
                    query = query.gte('requested_at', fromDate.toISOString());
                }
            }
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                toDate.setHours(23, 59, 59, 999); // fim do dia
                if (!isNaN(toDate.getTime())) {
                    query = query.lte('requested_at', toDate.toISOString());
                }
            }
        }

        query = query.order('requested_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
            if (error.code === 'PGRST103') {
                return { data: [], hasMore: false, total: 0 };
            }
            console.error('Error fetching filtered orders:', error);
            throw error;
        }

        const total = count || 0;
        const hasMore = to < total - 1;

        const now = Date.now();
        let companiesWithUrls: any[] = [];

        if (ordersMetadataCache.companies && (now - ordersMetadataCache.companiesTimestamp) < ordersMetadataCache.CACHE_DURATION) {
            companiesWithUrls = ordersMetadataCache.companies;
        } else {
            const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');

            const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';

            const validCompanies = (companies || []).filter((c: any) => c.img_file_path && c.img_file_name);
            let pathsToSign: string[] = [];
            let pathToCompanyMap: Record<string, any[]> = {};

            validCompanies.forEach((c: any) => {
                let cleanPath = c.img_file_path.replace(/^\/+|\/+$/g, '');
                let cleanName = c.img_file_name.replace(/^\/+|\/+$/g, '');
                if (cleanPath.startsWith(`${bucket}/`)) {
                    cleanPath = cleanPath.substring(bucket.length + 1);
                }
                const fullPath = `${cleanPath}/${cleanName}`;
                pathsToSign.push(fullPath);
                if (!pathToCompanyMap[fullPath]) pathToCompanyMap[fullPath] = [];
                pathToCompanyMap[fullPath].push(c);
            });

            companiesWithUrls = [...(companies || [])];

            if (pathsToSign.length > 0) {
                try {
                    const { data: signedData, error } = await supabase.storage
                        .from(bucket)
                        .createSignedUrls(pathsToSign, 3600);

                    if (!error && signedData) {
                        signedData.forEach((item) => {
                            if (item.path && item.signedUrl) {
                                let sUrl = item.signedUrl;
                                if (sUrl.includes('siges-mao.com.br')) {
                                    sUrl = sUrl.replace('siges-mao.com.br', 'vps.supabase.siges-app.com.br');
                                } else if (sUrl.includes('siges-app.com.br') && !sUrl.includes('vps.')) {
                                    sUrl = sUrl.replace('supabase.siges-app.com.br', 'vps.supabase.siges-app.com.br');
                                }
                                const comps = pathToCompanyMap[item.path];
                                if (comps) {
                                    comps.forEach(comp => { comp.signedUrl = sUrl; });
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Batch sign failed', e);
                }
            }

            companiesWithUrls = companiesWithUrls.map((c: any) => {
                if (c.img_file_path && c.img_file_name && !c.signedUrl) {
                    const publicUrl = getPublicImageUrl(c.img_file_path, c.img_file_name);
                    return { ...c, signedUrl: publicUrl };
                }
                return c;
            });

            ordersMetadataCache.companies = companiesWithUrls;
            ordersMetadataCache.companiesTimestamp = now;
        }

        const companyMap = new Map((companiesWithUrls || []).map((c: any) => [c.id?.toString(), c]));

        const orderIds = (data || []).map((o: any) => o.id);
        let realStatusMap: Record<string, string> = {};

        if (orderIds.length > 0) {
            const { data: realStatusData } = await supabase
                .from('orders')
                .select('id, status_at')
                .in('id', orderIds);

            if (realStatusData) {
                realStatusData.forEach((s: any) => {
                    realStatusMap[s.id.toString()] = s.status_at;
                });
            }
        }

        const teamLeaderIds = Array.from(new Set((data || []).map((o: any) => o.team_leader_id).filter(Boolean)));
        let leaderMap = new Map<string, { latitude: number; longitude: number; avatarUrl?: string; isAvailable?: boolean; ovIdInProgress?: number }>();

        if (teamLeaderIds.length > 0) {
            if (!ordersMetadataCache.leaders) {
                ordersMetadataCache.leaders = new Map();
                ordersMetadataCache.leadersTimestamp = now;
            }

            const currentLeadersCache = ordersMetadataCache.leaders;
            const idsToFetch = teamLeaderIds.filter(id => !currentLeadersCache.has(id.toString()));

            if (idsToFetch.length > 0) {
                try {
                    const { data: leaders, error: leaderError } = await supabase
                        .from('users')
                        .select('id, latitude, longitude, img_file_path, img_file_name, is_available, ov_id_in_progress')
                        .in('id', idsToFetch);

                    if (!leaderError && leaders) {
                        leaders.forEach((l: any) => {
                            const avatarUrl = getPublicImageUrl(
                                l.img_file_path,
                                l.img_file_name || 'noImageUser.png',
                                { width: 100, height: 100, resize: 'cover' }
                            );
                            const leaderData = {
                                latitude: l.latitude,
                                longitude: l.longitude,
                                avatarUrl,
                                isAvailable: l.is_available,
                                ovIdInProgress: l.ov_id_in_progress
                            };
                            currentLeadersCache.set(l.id.toString(), leaderData);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching team leader locations:', error);
                }
            }

            teamLeaderIds.forEach(id => {
                const cached = currentLeadersCache.get(id.toString());
                if (cached && cached.latitude && cached.longitude) {
                    leaderMap.set(id.toString(), cached);
                }
            });
        }

        const unitIds = Array.from(new Set((data || []).map((o: any) => o.unit_id).filter(Boolean)));
        let unitMap = new Map<string, { avatarUrl?: string }>();

        if (unitIds.length > 0) {
            if (!ordersMetadataCache.units) {
                ordersMetadataCache.units = new Map();
                ordersMetadataCache.unitsTimestamp = now;
            }

            const currentUnitsCache = ordersMetadataCache.units;
            const idsToFetch = unitIds.filter(id => !currentUnitsCache.has(id.toString()));

            if (idsToFetch.length > 0) {
                try {
                    const { data: units, error: unitError } = await supabase
                        .from('units')
                        .select('id, img_file_path, img_file_name')
                        .in('id', idsToFetch);

                    if (!unitError && units) {
                        units.forEach((u: any) => {
                            if (u.img_file_path) {
                                const avatarUrl = getPublicImageUrl(
                                    u.img_file_path,
                                    u.img_file_name,
                                    { width: 100, height: 100, resize: 'cover' }
                                );
                                if (avatarUrl) {
                                    currentUnitsCache.set(u.id.toString(), { avatarUrl });
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching unit images:', error);
                }
            }

            unitIds.forEach(id => {
                const cached = currentUnitsCache.get(id.toString());
                if (cached) {
                    unitMap.set(id.toString(), cached);
                }
            });
        }

        const orders = (data || []).map((item: any) => this._mapOrder(item, companyMap, realStatusMap, leaderMap, unitMap));

        return { data: orders, hasMore, total };
    },

    async getOrdersForCalendar(filters?: { unitId?: string; statusId?: number }): Promise<any[]> {
        let query = supabase
            .from('v_orders')
            .select('id, order_mask, requested_at, status_id, status_description, status_color, status_icon, unit_description, type_description, requested_services')
            .not('status_id', 'in', '(7,8)');

        if (filters?.unitId) {
            query = query.eq('unit_id', filters.unitId);
        }
        if (filters?.statusId) {
            query = query.eq('status_id', filters.statusId);
        }

        const { data, error } = await query.order('requested_at', { ascending: true });

        if (error) {
            console.error('Error fetching orders for calendar:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            title: `${item.order_mask} - ${item.type_description || ''}`,
            start: item.requested_at,
            color: item.status_color || 'blue',
            statusId: item.status_id,
            statusDescription: item.status_description,
        }));
    },

    subscribeToOrders: (callback: (payload: any) => void) => {
        const channelId = `orders-changes-${Math.random().toString(36).substring(2)}`;
        return supabase
            .channel(channelId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                callback(payload);
            })
            .subscribe((status, err) => {
                if (err) console.error('orders subscription error:', err);
                if (status === 'CHANNEL_ERROR') {
                    console.warn('Verifique se a tabela "orders" tem Realtime habilitado no Supabase.');
                }
            });
    },

    subscribeToVisits: (callback: (payload: any) => void) => {
        const channelId = `visits-changes-${Math.random().toString(36).substring(2)}`;
        return supabase
            .channel(channelId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_visits' }, (payload) => {
                callback(payload);
            })
            .subscribe((status, err) => {
                if (err) console.error('visits subscription error:', err);
                if (status === 'CHANNEL_ERROR') {
                    console.warn('Verifique se a tabela "orders_visits" tem Realtime habilitado no Supabase.');
                }
            });
    },

    async hasActiveVisits(orderId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('orders_visits')
            .select('*', { count: 'exact', head: true })
            .eq('o_id', orderId)
            .eq('is_deleted', false);
        if (error) return false;
        return (count || 0) > 0;
    },

    async getAvailableTeamMembers(teamId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name_full, name_short, is_team_leader')
            .eq('team_id', teamId)
            .order('name_short');
        if (error) { console.error('Error fetching available team members:', error); return []; }
        return data.map((u: any) => ({
            id: u.id.toString(),
            nameFull: u.name_full,
            nameShort: u.name_short,
            isTeamLeader: u.is_team_leader
        })) as User[];
    },

    async getActiveUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name_short, is_available, is_ov_in_progress, img_file_path, img_file_name, team_id, ov_id_in_progress')
            .eq('is_ov_in_progress', true)
            .order('name_short');
        if (error) { console.error('Error fetching active users:', error); return []; }
        return data.map((item: any) => ({
            id: item.id.toString(),
            nameShort: item.name_short,
            isAvailable: item.is_available,
            isOvInProgress: item.is_ov_in_progress,
            ovIdInProgress: item.ov_id_in_progress,
            teamId: item.team_id?.toString(),
            avatarUrl: item.img_file_name
                ? getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 100, height: 100, resize: 'cover' })
                : undefined,
        })) as User[];
    },

    async authorizeOrder(orderId: string, teamId: string, planId?: string, teamLeaderId?: string): Promise<void> {
        const [{ data: { user: authUser } }, { data: order }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('v_orders').select('*').eq('id', orderId).single()
        ]);

        if (!order) throw new Error("Ordem de serviço não encontrada");

        let authorizingUserId = '';
        let authorizingUserName = 'Alguém';
        if (authUser) {
            const { data: userData } = await supabase
                .from('users')
                .select('id, name_short, name_full')
                .eq('uuid', authUser.id)
                .single();
            if (userData) {
                authorizingUserId = userData.id.toString();
                authorizingUserName = userData.name_short || userData.name_full || 'Alguém';
            }
        }

        const now = getBrazilTimestamp();
        const updateData: any = {
            status_id: 3,
            status_at: now,
            team_id: teamId ? Number(teamId) : null,
            plan_id: planId ? Number(planId) : null
        };

        if (teamLeaderId && teamLeaderId !== "") {
            updateData.team_leader_id = Number(teamLeaderId);
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) throw updateError;

        if (order.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }

        try {
            const { data: orderData } = await supabase
                .from('orders')
                .select('client_id, unit_id, asset_tag_id, asset_tag_sub_id, order_mask, requested_services')
                .eq('id', orderId)
                .single();

            const unitDesc = order.unit_description || 'N/A';
            const clientDesc = order.client_name || 'N/A';

            const { data: followers } = await supabase
                .from('orders_followers')
                .select('user_id')
                .eq('o_id', orderId);

            if (followers && followers.length > 0) {
                const { data: followerUsers } = await supabase
                    .from('users')
                    .select('id, mobile_whatsapp')
                    .in('id', followers.map(f => f.user_id));

                const notifications = followers.map(f => {
                    const fUser = (followerUsers || []).find((u: any) => u.id === f.user_id);
                    return {
                        user_id_to: f.user_id,
                        user_id_from: authorizingUserId ? parseInt(authorizingUserId) : null,
                        title: 'Ordem Autorizada.',
                        body: `${authorizingUserName} autorizou a OS ${order.order_mask}.\nCliente: ${clientDesc}\nUnidade: ${unitDesc}\nSetor: ${order.asset_tag_description || ''}`,
                        type: 'Ordem Autorizada',
                        created_at: now,
                        is_read: false,
                        o_id: orderId,
                        user_to_whatsapp: fUser?.mobile_whatsapp
                    };
                });

                await supabase.from('users_notifications').insert(notifications);
            }
        } catch (notifErr) {
            console.error('Error sending authorization notification:', notifErr);
        }
    },

    async getDashboardStats(
        filters?: OrderFilters,
        ssFiltersOverride?: OrderFilters,
        osFiltersOverride?: OrderFilters
    ): Promise<{
        ssCounts: { today: number; yesterday: number; sevenDays: number; fifteenDays: number; between16And30: number; moreThan30: number };
        osCounts: Record<number, number>;
        ssSectorCounts?: Array<{ id: string, label: string, count: number }>;
        osSectorCounts?: Array<{ id: string, label: string, count: number }>;
    }> {
        let ssUnscheduledQuery = supabase.from('v_orders')
            .select('requested_at, asset_tag_id, unit_asset_tag_id, asset_tag_description')
            .eq('status_id', 1)
            .is('parent_id', null);

        let osQuery = supabase.from('v_orders')
            .select('status_id, parent_id, asset_tag_id, asset_tag_description')
            .not('status_id', 'in', '(7,8)')
            .not('parent_id', 'is', null);

        const applyFiltersToQuery = (query: any, f: OrderFilters) => {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', f.systemParentId);
            applyFilter('system_id', f.systemId);
            applyFilter('unit_type_parent_id', f.unitTypeParentId);
            applyFilter('unit_type_id', f.unitTypeId);
            applyFilter('unit_id', f.unitId);
            applyFilter('asset_tag_id', f.assetTagId);
            applyFilter('object_id', f.orderObjectId);
            applyFilter('type_id', f.orderTypeId);
            applyFilter('type_sub_id', f.orderTypeSubId);
            applyFilter('contract_id', f.contractId);
            applyFilter('plan_id', f.orderPlanId);
            applyFilter('team_id', f.orderTeamId);
            applyFilter('priority_id', f.priorityId);

            if (f.search) {
                const s = `%${f.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
            return query;
        };

        if (filters) {
            ssUnscheduledQuery = applyFiltersToQuery(ssUnscheduledQuery, ssFiltersOverride || filters);
            osQuery = applyFiltersToQuery(osQuery, osFiltersOverride || filters);
        }

        const [ssUnscheduledRes, osRes] = await Promise.all([ssUnscheduledQuery, osQuery]);

        if (ssUnscheduledRes.error || osRes.error) {
            console.error('Error fetching dashboard stats:', ssUnscheduledRes.error || osRes.error);
            return {
                ssCounts: { today: 0, yesterday: 0, sevenDays: 0, fifteenDays: 0, between16And30: 0, moreThan30: 0 },
                osCounts: {}
            };
        }

        const ssDataList = ssUnscheduledRes.data || [];
        const osDataList = osRes.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const parseDate = (d: string) => d ? new Date(d) : null;

        const ssCounts = {
            today: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= today; }).length,
            yesterday: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= yesterday && d < today; }).length,
            sevenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= sevenDaysAgo && d < yesterday; }).length,
            fifteenDays: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= fifteenDaysAgo && d < sevenDaysAgo; }).length,
            between16And30: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d >= thirtyDaysAgo && d < fifteenDaysAgo; }).length,
            moreThan30: ssDataList.filter((o: any) => { const d = parseDate(o.requested_at); return d && d < thirtyDaysAgo; }).length
        };

        const osCounts: Record<number, number> = {};
        osDataList.forEach((o: any) => {
            if (o.parent_id && o.status_id) {
                osCounts[o.status_id] = (osCounts[o.status_id] || 0) + 1;
            }
        });

        const ssSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        const periodFilter = ssFiltersOverride?.period || filters?.period;
        let sectorDataList = ssDataList;
        if (periodFilter) {
            sectorDataList = ssDataList.filter((o: any) => {
                const d = parseDate(o.requested_at);
                if (!d) return false;
                if (periodFilter === 'Hoje') return d >= today;
                if (periodFilter === 'Ontem') return d >= yesterday && d < today;
                if (periodFilter === '2-7 dias') return d >= sevenDaysAgo && d < yesterday;
                if (periodFilter === '8-15 dias') return d >= fifteenDaysAgo && d < sevenDaysAgo;
                if (periodFilter === '16-30 dias') return d >= thirtyDaysAgo && d < fifteenDaysAgo;
                if (periodFilter === '> 30 dias') return d < thirtyDaysAgo;
                return true;
            });
        }

        sectorDataList.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!ssSectorMap[id]) {
                ssSectorMap[id] = { id, label, count: 0 };
            }
            ssSectorMap[id].count += 1;
        });
        const ssSectorCounts = Object.values(ssSectorMap).sort((a, b) => b.count - a.count);

        const osStatusFilter = osFiltersOverride?.statusId;
        let osSectorCountSource = osDataList;
        if (osStatusFilter) {
            const statusIdNum = Array.isArray(osStatusFilter) ? Number(osStatusFilter[0]) : Number(osStatusFilter);
            if (!Number.isNaN(statusIdNum)) {
                osSectorCountSource = osDataList.filter((o: any) => o.status_id === statusIdNum);
            }
        }

        const osSectorMap: Record<string, { id: string, label: string, count: number }> = {};
        osSectorCountSource.forEach((o: any) => {
            const id = o.asset_tag_id ? o.asset_tag_id.toString() : 'null';
            const label = o.asset_tag_description || 'Sem Setor';
            if (!osSectorMap[id]) {
                osSectorMap[id] = { id, label, count: 0 };
            }
            osSectorMap[id].count += 1;
        });
        const osSectorCounts = Object.values(osSectorMap).sort((a, b) => b.count - a.count);

        return { ssCounts, osCounts, ssSectorCounts, osSectorCounts };
    },

    async getUnscheduledSS(filters?: OrderFilters): Promise<Order[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .eq('status_id', 1)
            .is('parent_id', null);

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('priority_id', filters.priorityId);

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
        }

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) { console.error('Error fetching unscheduled SS:', error); return []; }

        let filteredData = data || [];

        if (filters?.period) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            const fifteenDaysAgo = new Date(today);
            fifteenDaysAgo.setDate(today.getDate() - 15);
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const parseDate = (d: string) => d ? new Date(d) : null;

            filteredData = filteredData.filter((item: any) => {
                const itemDate = parseDate(item.requested_at);
                if (!itemDate) return false;
                if (filters.period === 'Hoje') return itemDate >= today;
                if (filters.period === 'Ontem') return itemDate >= yesterday && itemDate < today;
                if (filters.period === '2-7 dias') return itemDate >= sevenDaysAgo && itemDate < yesterday;
                if (filters.period === '8-15 dias') return itemDate >= fifteenDaysAgo && itemDate < sevenDaysAgo;
                if (filters.period === '16-30 dias') return itemDate >= thirtyDaysAgo && itemDate < fifteenDaysAgo;
                if (filters.period === '> 30 dias') return itemDate < thirtyDaysAgo;
                return true;
            });
        }

        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map<string, any>((companies || []).map((c: any) => [c.id?.toString(), c]));

        return filteredData.map((item: any) => {
            const providerCompanyIdStr = item.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            return {
                id: item.id.toString(),
                orderMask: item.order_mask,
                typeId: item.type_id?.toString(),
                typeSubId: item.type_sub_id?.toString(),
                objectId: item.object_id?.toString(),
                contractId: item.contract_id?.toString(),
                planId: item.plan_id?.toString(),
                unitId: item.unit_id?.toString(),
                clientId: item.client_id?.toString(),
                departmentId: item.department_id?.toString(),
                unitAssetTagId: item.unit_asset_tag_id?.toString(),
                assetTagId: item.asset_tag_id?.toString(),
                systemId: item.system_id?.toString(),
                teamId: item.team_id?.toString(),
                typeCode: item.type_code,
                unitDescription: item.unit_description,
                title: item.unit_description,
                requestedServices: item.requested_services,
                requestedAt: item.requested_at,
                createdAt: item.created_at,
                statusAt: item.status_at,
                statusDescription: item.status_description,
                statusIcon: item.status_icon,
                iconColor: item.icon_color,
                statusBackgroundColor: item.background_color,
                statusColor: item.status_color,
                priorityId: item.priority_id?.toString(),
                priorityDescription: item.priority_description,
                priorityCode: item.priority_code,
                priorityColor: item.priority_color,
                typeDescription: item.type_description,
                typeName: item.type_description,
                typeIcon: item.type_icon,
                typeColor: item.type_color,
                requesterName: item.requester_name,
                requesterTeamCode: item.requester_team_code,
                requesterPhone: item.requester_phone,
                phone: item.requester_phone,
                clientName: item.client_name,
                contractDescription: item.contract_description,
                planDescription: item.plan_description,
                progress: item.progress ? `${Math.round(parseFloat(String(item.progress)) * 100)}%` : '0%',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                imgFilesNames: item.img_files_names,
                companyId: item.company_id?.toString(),
                causeReasonDescription: item.cause_reason_description,
                providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
                providerLogo: getPublicImageUrl(
                    item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path,
                    item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                ),
                unitLatitude: item.unit_latitude,
                unitLongitude: item.unit_longitude,
                teamLeaderLatitude: item.team_leader_latitude,
                teamLeaderLongitude: item.team_leader_longitude,
                assetTagDescription: item.asset_tag_description,
                unitAssetTagDescription: item.asset_tag_description,
                assetTagSubDescription: item.asset_tag_sub_description,
                unitAssetTagSubDescription: item.asset_tag_sub_description,
                teamCode: item.team_code,
                teamDescription: item.team_description,
                team: item.team_code || item.team_description,
                systemDescription: item.system_description,
                system: item.system_description,
                statusId: item.status_id ? Number(item.status_id) : 1,
                parentId: item.parent_id ? Number(item.parent_id) : null,
                ovCounter: item.ov_counter
            } as Order;
        });
    },

    async getOpenOS(filters?: OrderFilters): Promise<Order[]> {
        let query = supabase
            .from('v_orders')
            .select('*')
            .not('status_id', 'in', '(7,8)')
            .not('parent_id', 'is', null);

        if (filters) {
            const applyFilter = (column: string, val: any) => {
                if (!val) return;
                if (Array.isArray(val)) {
                    const filteredVal = val.filter((v: any) =>
                        v !== null && v !== undefined && v !== '' &&
                        String(v).toLowerCase() !== 'null' &&
                        String(v).toLowerCase() !== 'undefined'
                    );
                    if (filteredVal.length > 0) query = query.in(column, filteredVal);
                } else {
                    query = query.eq(column, val);
                }
            };

            applyFilter('system_parent_id', filters.systemParentId);
            applyFilter('system_id', filters.systemId);
            applyFilter('unit_type_parent_id', filters.unitTypeParentId);
            applyFilter('unit_type_id', filters.unitTypeId);
            applyFilter('unit_id', filters.unitId);
            applyFilter('asset_tag_id', filters.assetTagId);
            applyFilter('object_id', filters.orderObjectId);
            applyFilter('type_id', filters.orderTypeId);
            applyFilter('type_sub_id', filters.orderTypeSubId);
            applyFilter('contract_id', filters.contractId);
            applyFilter('plan_id', filters.orderPlanId);
            applyFilter('team_id', filters.orderTeamId);
            applyFilter('priority_id', filters.priorityId);
            applyFilter('status_id', filters.statusId);

            if (filters.search) {
                const s = `%${filters.search}%`;
                query = query.or(`order_mask.ilike.${s}, unit_description.ilike.${s}, unit_description_full.ilike.${s}, type_description.ilike.${s}, requested_services.ilike.${s}`);
            }
        }

        const { data, error } = await query.order('requested_at', { ascending: false });
        if (error) { console.error('Error fetching open OS:', error); return []; }

        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map<string, any>((companies || []).map((c: any) => [c.id?.toString(), c]));

        return (data || []).map((item: any) => {
            const providerCompanyIdStr = item.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            return {
                id: item.id.toString(),
                orderMask: item.order_mask,
                typeId: item.type_id?.toString(),
                typeSubId: item.type_sub_id?.toString(),
                objectId: item.object_id?.toString(),
                contractId: item.contract_id?.toString(),
                planId: item.plan_id?.toString(),
                unitId: item.unit_id?.toString(),
                clientId: item.client_id?.toString(),
                departmentId: item.department_id?.toString(),
                unitAssetTagId: item.unit_asset_tag_id?.toString(),
                assetTagId: item.asset_tag_id?.toString(),
                systemId: item.system_id?.toString(),
                teamId: item.team_id?.toString(),
                typeCode: item.type_code,
                typeSubCode: item.type_sub_code,
                objectCode: item.object_code,
                unitDescription: item.unit_description,
                title: item.unit_description,
                requestedServices: item.requested_services,
                requestedAt: item.requested_at,
                createdAt: item.created_at,
                statusAt: item.status_at,
                statusDescription: item.status_description,
                statusIcon: item.status_icon,
                iconColor: item.icon_color,
                statusBackgroundColor: item.background_color,
                statusColor: item.status_color,
                priorityId: item.priority_id?.toString(),
                priorityDescription: item.priority_description,
                priorityCode: item.priority_code,
                priorityColor: item.priority_color,
                typeDescription: item.type_description,
                typeName: item.type_description,
                typeIcon: item.type_icon,
                typeColor: item.type_color,
                requesterName: item.requester_name,
                requesterNameShort: item.requester_name_short,
                requesterTeamCode: item.requester_team_code,
                requesterPhone: item.requester_phone,
                phone: item.requester_phone,
                clientName: item.client_name,
                contractDescription: item.contract_description,
                planDescription: item.plan_description,
                progress: item.progress ? `${Math.round(parseFloat(String(item.progress)) * 100)}%` : '0%',
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                imgFilesNames: item.img_files_names,
                companyId: item.company_id?.toString(),
                causeReasonDescription: item.cause_reason_description,
                providerCompanyName: item.provider_company_description || item.provider_company_name || company?.description,
                providerLogo: getPublicImageUrl(
                    item.provider_company_img_file_path || item.provider_company_img_path || company?.img_file_path,
                    item.provider_company_img_file_name || item.provider_company_img_name || company?.img_file_name,
                    { width: 100, height: 100, resize: 'contain' }
                ),
                unitLatitude: item.unit_latitude,
                unitLongitude: item.unit_longitude,
                teamLeaderLatitude: item.team_leader_latitude,
                teamLeaderLongitude: item.team_leader_longitude,
                teamLeaderNameShort: item.team_leader_name_short,
                assetTagDescription: item.asset_tag_description,
                unitAssetTagDescription: item.asset_tag_description,
                assetTagSubDescription: item.asset_tag_sub_description,
                unitAssetTagSubDescription: item.asset_tag_sub_description,
                teamCode: item.team_code,
                teamDescription: item.team_description,
                team: item.team_code || item.team_description,
                systemDescription: item.system_description,
                system: item.system_description,
                statusId: item.status_id ? Number(item.status_id) : 1,
                parentId: item.parent_id ? Number(item.parent_id) : null,
                ovCounter: item.ov_counter
            } as Order;
        });
    },

    async getOrdersByTeam(teamId: string): Promise<Order[]> {
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map<string, any>((companies || []).map((c: any) => [c.id?.toString(), c]));

        const { data, error } = await supabase
            .from('v_orders')
            .select('*')
            .eq('team_id', teamId);

        if (error) { console.error('Error fetching orders by team:', error); return []; }

        return (data || []).map((row: any) => {
            const providerCompanyIdStr = row.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            const providerLogoUrl = getPublicImageUrl(
                row.provider_company_img_file_path || row.provider_company_img_path || company?.img_file_path,
                row.provider_company_img_file_name || row.provider_company_img_name || company?.img_file_name,
                { width: 100, height: 100, resize: 'contain' }
            );

            return {
                id: row.id.toString(),
                uid: row.o_uid,
                orderMask: row.order_mask,
                clientId: row.client_id,
                companyId: row.company_id,
                unitId: row.unit_id,
                departmentId: row.department_id,
                providerDepartmentId: row.provider_department_id,
                typeId: row.type_id,
                typeCode: row.type_code,
                typeSubId: row.type_sub_id,
                typeSubCode: row.type_sub_code,
                objectId: row.object_id,
                objectCode: row.object_code,
                priorityId: row.priority_id,
                priorityCode: row.priority_code,
                teamId: row.team_id,
                contractId: row.contract_id,
                planId: row.plan_id,
                statusId: row.status_id,
                statusAt: row.status_at,
                requesterName: row.requester_name,
                requesterPhone: row.requester_phone,
                requestedAt: row.requested_at,
                requestedServices: row.requested_services,
                totalValue: row.total_value,
                systemId: row.system_id,
                unitLatitude: row.unit_latitude,
                unitLongitude: row.unit_longitude,
                teamCode: row.team_code,
                statusName: row.status_name,
                statusDescription: row.status_description,
                statusIcon: row.status_icon,
                iconColor: row.icon_color,
                statusBackgroundColor: row.status_background_color,
                progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                unitDescription: row.unit_description,
                unitDescriptionFull: row.unit_description_full,
                typeDescription: row.type_description,
                priorityDescription: row.priority_description,
                priorityColor: row.priority_color,
                assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                unitAssetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                unitAssetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                providerCompanyName: row.provider_company_description || row.provider_company_name || company?.description,
                providerLogo: providerLogoUrl,
                parentId: row.parent_id,
                teamLeaderId: row.team_leader_id?.toString(),
                teamLeaderNameShort: row.team_leader_name_short,
                ovCounter: row.ov_counter,
                imgFilePath: row.img_file_path,
                imgFileName: row.img_file_name,
                imgFilesNames: row.img_files_names
            } as Order;
        });
    },

    async getOrdersByLeader(leaderId: string): Promise<Order[]> {
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, img_file_path, img_file_name');
        const companyMap = new Map<string, any>((companies || []).map((c: any) => [c.id?.toString(), c]));

        const { data, error } = await supabase
            .from('v_orders')
            .select('*')
            .eq('team_leader_id', leaderId);

        if (error) { console.error('Error fetching orders by leader:', error); return []; }

        return (data || []).map((row: any) => {
            const providerCompanyIdStr = row.provider_company_id?.toString();
            const company = providerCompanyIdStr ? companyMap.get(providerCompanyIdStr) : null;

            const providerLogoUrl = getPublicImageUrl(
                row.provider_company_img_file_path || row.provider_company_img_path || company?.img_file_path,
                row.provider_company_img_file_name || row.provider_company_img_name || company?.img_file_name,
                { width: 100, height: 100, resize: 'contain' }
            );

            return {
                id: row.id.toString(),
                uid: row.o_uid,
                orderMask: row.order_mask,
                clientId: row.client_id,
                companyId: row.company_id,
                unitId: row.unit_id,
                departmentId: row.department_id,
                providerDepartmentId: row.provider_department_id,
                typeId: row.type_id,
                typeCode: row.type_code,
                typeSubId: row.type_sub_id,
                typeSubCode: row.type_sub_code,
                objectId: row.object_id,
                objectCode: row.object_code,
                priorityId: row.priority_id,
                priorityCode: row.priority_code,
                teamId: row.team_id,
                contractId: row.contract_id,
                planId: row.plan_id,
                statusId: row.status_id,
                statusAt: row.status_at,
                requesterName: row.requester_name,
                requesterPhone: row.requester_phone,
                requestedAt: row.requested_at,
                requestedServices: row.requested_services,
                totalValue: row.total_value,
                systemId: row.system_id,
                unitLatitude: row.unit_latitude,
                unitLongitude: row.unit_longitude,
                teamCode: row.team_code,
                statusName: row.status_name,
                statusDescription: row.status_description,
                statusIcon: row.status_icon,
                iconColor: row.icon_color,
                statusBackgroundColor: row.status_background_color,
                progress: row.progress ? `${Math.round(parseFloat(String(row.progress)) * 100)}%` : '0%',
                unitDescription: row.unit_description,
                unitDescriptionFull: row.unit_description_full,
                typeDescription: row.type_description,
                priorityDescription: row.priority_description,
                priorityColor: row.priority_color,
                assetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                unitAssetTagDescription: row.asset_tag_description || row.unit_asset_tag_description,
                assetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                unitAssetTagSubDescription: row.asset_tag_sub_description || row.unit_asset_tag_sub_description,
                providerCompanyName: row.provider_company_description || row.provider_company_name || company?.description,
                providerLogo: providerLogoUrl,
                parentId: row.parent_id,
                teamLeaderId: row.team_leader_id?.toString(),
                teamLeaderNameShort: row.team_leader_name_short,
                ovCounter: row.ov_counter,
                imgFilePath: row.img_file_path,
                imgFileName: row.img_file_name,
                imgFilesNames: row.img_files_names
            } as Order;
        });
    },
    async cancelOrder(orderId: string, reasonId: string, userId: string, teamId: string): Promise<void> {
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', orderId).single();
        const now = getBrazilTimestamp();
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 7,
                status_at: now,
                canceled_user_id: userId,
                canceled_team_id: teamId,
                canceled_at: now,
                cancel_reason_id: reasonId,
                unit_asset_tag_has_order: false,
                unit_asset_tag_no_has_order_user_id: userId,
                unit_asset_tag_no_has_order_at: now
            })
            .eq('id', orderId);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },

    async scheduleOrder(orderId: string, date: string): Promise<void> {
        const id = Number(orderId);
        const { data: order } = await supabase.from('orders').select('parent_id').eq('id', id).maybeSingle();

        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 4,
                status_at: date
            })
            .eq('id', id);

        if (error) throw error;

        if (order?.parent_id) {
            await this.updateServiceRequestStatus(order.parent_id.toString());
        }
    },

    async updateOrderTeam(orderId: string, teamId: string, teamLeaderId?: string): Promise<void> {
        const updateData: any = {
            team_id: teamId ? Number(teamId) : null
        };

        if (teamLeaderId && teamLeaderId !== "") {
            updateData.team_leader_id = Number(teamLeaderId);
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) throw error;
    },

    async getOrdersVisitsAssetsWithProvider(filters?: {
        assetId?: string;
        orderId?: string;
        ovId?: string;
    }): Promise<any[]> {
        let query = supabase
            .from('orders_visits_assets')
            .select(`
            *,
            ov: orders_visits!orders_visits_assets_ov_id_fkey(
                    *,
                o: orders!orders_visits_o_id_fkey(
                    id,
                    provider_company_id,
                    order_mask,
                    status_id,
                    created_at,
                    cfg_companies!orders_provider_company_id_fkey(
                        id,
                        description,
                        code
                    )
                )
            )
                `);

        if (filters?.assetId) query = query.eq('asset_id', filters.assetId);
        if (filters?.ovId) query = query.eq('ov_id', filters.ovId);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders visits assets with provider:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            assetId: item.asset_id?.toString(),
            ovId: item.ov_id?.toString(),
            visit: {
                id: item.ov?.id?.toString(),
                oId: item.ov?.o?.id?.toString(),
                visitDate: item.ov?.visit_date,
                status: item.ov?.status,
            },
            order: {
                id: item.ov?.o?.id?.toString(),
                providerCompanyId: item.ov?.o?.provider_company_id?.toString(),
                orderMask: item.ov?.o?.order_mask,
                statusId: item.ov?.o?.status_id,
                createdAt: item.ov?.o?.created_at,
                providerCompany: item.ov?.o?.cfg_companies ? {
                    id: item.ov?.o?.cfg_companies?.id?.toString(),
                    name: item.ov?.o?.cfg_companies?.description,
                    code: item.ov?.o?.cfg_companies?.code,
                } : null
            }
        }));
    },

    async getServiceOrderHistory(orderId: string | number): Promise<ServiceHistoryItem[]> {
        const history: ServiceHistoryItem[] = [];
        const orderIdInt = typeof orderId === 'number' ? orderId : parseInt(orderId);

        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select(`
                    id, created_at, parent_id,
                    status:cfg_orders_statuses(description, color),
                    user:users(name_short, name_full)
                `)
                .eq('id', orderIdInt)
                .single();

            if (order && !orderError) {
                const typeLabel = order.parent_id ? 'OS' : 'SS';
                const statusInfo = Array.isArray(order.status) ? (order.status[0] as any) : (order.status as any);
                const userInfo = Array.isArray(order.user) ? (order.user[0] as any) : (order.user as any);

                history.push({
                    id: `creation-${order.id}`,
                    title: `${typeLabel} Criada`,
                    date: order.created_at,
                    type: 'created',
                    userName: userInfo?.name_short || userInfo?.name_full,
                    description: `Solicitação registrada com status inicial: ${statusInfo?.description || 'Aberto'}`,
                    statusName: statusInfo?.description,
                    statusColor: statusInfo?.color
                });
            } else if (orderError) {
                console.warn('History: Could not fetch order details:', orderError);
            }

            const { data: visits, error: visitsError } = await supabase
                .from('v_orders_visits')
                .select('id, ov_mask, ov_started_at, ov_ended_at, ov_team_leader_name_short, ov_status_description')
                .eq('o_id', orderIdInt)
                .order('ov_started_at', { ascending: true });

            if (visitsError) {
                console.warn('History: Error fetching visits:', visitsError);
            }

            if (visits && visits.length > 0) {
                for (const visit of visits) {
                    if (visit.ov_started_at) {
                        history.push({
                            id: `v-start-${visit.id}`,
                            title: 'Visita Iniciada',
                            date: visit.ov_started_at,
                            type: 'visit_started',
                            visitMask: visit.ov_mask,
                            userName: visit.ov_team_leader_name_short,
                            description: 'A equipe técnica iniciou os trabalhos na unidade.'
                        });
                    }

                    if (visit.ov_ended_at) {
                        history.push({
                            id: `v-end-${visit.id}`,
                            title: 'Visita Finalizada',
                            date: visit.ov_ended_at,
                            type: 'visit_ended',
                            visitMask: visit.ov_mask,
                            userName: visit.ov_team_leader_name_short,
                            description: `Visita encerrada com status final: ${visit.ov_status_description || 'Concluída'}`
                        });
                    }

                    const { data: activities } = await supabase
                        .from('orders_visits_assets_activities')
                        .select(`
                            id,
                            created_at,
                            activity:cfg_activities(description, code),
                            ova:orders_visits_assets!ova_id!inner(
                                asset:assets(code, description)
                            ),
                            user:users(name_short, name_full)
                        `)
                        .eq('ova.ov_id', visit.id)
                        .eq('is_deleted', false);

                    if (activities && activities.length > 0) {
                        activities.forEach((act: any) => {
                            const actUserInfo = Array.isArray(act.user) ? act.user[0] : act.user;
                            const activityInfo = Array.isArray(act.activity) ? act.activity[0] : act.activity;
                            const assetInfo = act.ova?.asset;

                            history.push({
                                id: `act-${act.id}`,
                                title: 'Intervenção Realizada',
                                date: act.created_at,
                                type: 'intervention',
                                description: activityInfo?.description,
                                userName: actUserInfo?.name_short || actUserInfo?.name_full,
                                assetCode: assetInfo?.code,
                                assetDescription: assetInfo?.description,
                                visitMask: visit.ov_mask
                            });
                        });
                    }

                    const { data: materials } = await supabase
                        .from('orders_visits_assets_materials')
                        .select(`
                            id,
                            created_at,
                            amount,
                            material:materials(description, code, unit),
                            ova:orders_visits_assets!ova_id!inner(
                                asset:assets(code, description)
                            ),
                            user:users(name_short, name_full)
                        `)
                        .eq('ova.ov_id', visit.id)
                        .eq('is_deleted', false);

                    if (materials && materials.length > 0) {
                        materials.forEach((mat: any) => {
                            const matUserInfo = Array.isArray(mat.user) ? mat.user[0] : mat.user;
                            const materialInfo = Array.isArray(mat.material) ? mat.material[0] : mat.material;
                            const assetInfo = mat.ova?.asset;

                            history.push({
                                id: `mat-${mat.id}`,
                                title: 'Material Utilizado',
                                date: mat.created_at,
                                type: 'material',
                                description: `${mat.amount} ${materialInfo?.unit || 'un'} x ${materialInfo?.description}`,
                                userName: matUserInfo?.name_short || matUserInfo?.name_full,
                                assetCode: assetInfo?.code,
                                assetDescription: assetInfo?.description,
                                visitMask: visit.ov_mask
                            });
                        });
                    }
                }
            }

            return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        } catch (error) {
            console.error('Error fetching service order history:', error);
        }

        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

};
