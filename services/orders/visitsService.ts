import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { getPublicImageUrl } from '../imageUtils';
import { formatRelativeTime } from '../../utils/formatters';
import type { Order, User, OrderVisit, OrderVisitTeam, OrderVisitVehicle, OrderVisitService, OrderVisitAssetView, OrderVisitAssetActivity, OrderVisitAssetMaterial, ServiceHistoryItem, Activity, Material, OrderVisitChatMessage, OrderVisitChatParticipant, MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity } from '../../types';
import { ordersService } from './ordersService';

let processingConfigurationsCache: any[] | null = null;
const getProcessingConfigurations = async () => {
    if (processingConfigurationsCache) return processingConfigurationsCache;

    const { data, error } = await supabase
        .from('cfg_orders_visits_processing')
        .select('*');

    if (error || !data) return [];

    processingConfigurationsCache = data;
    return data as { id: number, icon: string, icon_color: string, bg_color: string }[];
};

export const visitsService = {

    // -------------------------------------------------------------------------
    // VISIT QUERIES
    // -------------------------------------------------------------------------

    async getTodayVisitsByCompany(companyId: string): Promise<OrderVisit[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('o_provider_company_id', companyId)
            .or(`ov_status_id.eq.1,and(ov_status_id.eq.2,ov_started_at.gte.${startOfDay},ov_started_at.lte.${endOfDay})`)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching today visits by company:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            // View fields
            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,
            statusIcon: row.ov_status_icon,
            statusColor: row.ov_status_color,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            requestedServices: row.o_requested_services,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
            chatStatus: row.chat_status || 'open',
            chatClosedAt: row.chat_closed_at,
            chatClosedUserId: row.chat_closed_user_id?.toString(),
            chatCreatedUserId: row.chat_created_user_id?.toString()
        })) as OrderVisit[];
    },

    async getVisitsByTeam(teamId: string): Promise<OrderVisit[]> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('o_team_id', teamId)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching visits by team:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
            chatStatus: row.chat_status || 'open',
            chatClosedAt: row.chat_closed_at,
            chatClosedUserId: row.chat_closed_user_id?.toString(),
            chatCreatedUserId: row.chat_created_user_id?.toString()
        })) as OrderVisit[];
    },

    async getVisitsByLeader(leaderId: string): Promise<OrderVisit[]> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('ov_team_leader_id', leaderId)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching visits by leader:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            requestedServices: row.o_requested_services,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
            chatStatus: row.chat_status || 'open',
            chatClosedAt: row.chat_closed_at,
            chatClosedUserId: row.chat_closed_user_id?.toString(),
            chatCreatedUserId: row.chat_created_user_id?.toString()
        })) as OrderVisit[];
    },

    async getVisitsByChatCreator(userId: string): Promise<OrderVisit[]> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('chat_created_user_id', userId)
            .eq('chat_status', 'open')
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching visits by chat creator:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,

            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,

            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            requestedServices: row.o_requested_services,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description,
            chatStatus: row.chat_status || 'open',
            chatClosedAt: row.chat_closed_at,
            chatClosedUserId: row.chat_closed_user_id?.toString(),
            chatCreatedUserId: row.chat_created_user_id?.toString()
        })) as OrderVisit[];
    },

    // -------------------------------------------------------------------------
    // VISIT START
    // -------------------------------------------------------------------------

    async startOrderVisit(order: Order, currentUser: User): Promise<void> {
        const { data, error } = await supabase.rpc('flow_order_visit_create_v2', {
            payload: {
                order_id: Number(order.id),
                user_id: currentUser.id
            }
        });

        if (error) {
            console.error('Error starting visit:', error);
            throw error;
        }

        const result = data as { success: boolean; message: string; visit_id?: number };
        if (!result.success) {
            throw new Error(result.message);
        }

        // Flow Rule: Update Parent SS if this is an OS
        if (order.parentId) {
            await ordersService.updateServiceRequestStatus(order.parentId.toString());
        }
    },

    // -------------------------------------------------------------------------
    // ACTIVE VISIT
    // -------------------------------------------------------------------------

    async getActiveOrderVisit(id: string): Promise<OrderVisit | null> {
        // Fire and forget the sync to update DB in the background without blocking the UI
        visitsService.syncOrderVisitAssetsProcessing(id).catch(e => console.warn('[visitsService] Failed to pre-sync visit assets:', e));

        // Fetch visit data, configs, and assets in parallel
        const [visitResult, configs, assetsResult] = await Promise.all([
            supabase.from('v_orders_visits').select('*').eq('id', id).single(),
            getProcessingConfigurations(),
            supabase.from('orders_visits_assets').select('processing_id, is_filed').eq('ov_id', parseInt(id))
        ]);

        const { data, error } = visitResult;

        if (error || !data) return null;

        // Compute stats dynamically to ensure accurate UI state without waiting for DB updates
        const assets = assetsResult.data || [];
        const stats = {
            ov_assets_amount: assets.length,
            ov_assets_draft_amount: assets.filter(a => Number(a.processing_id) === 1).length,
            ov_assets_reported_amount: assets.filter(a => Number(a.processing_id) === 2).length,
            ov_assets_revised_amount: assets.filter(a => Number(a.processing_id) === 3).length,
            ov_assets_disapproved_amount: assets.filter(a => Number(a.processing_id) === 4).length,
            ov_assets_approved_no_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !a.is_filed).length,
            ov_assets_approved_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !!a.is_filed).length,
        };

        // Find matching config for this visit's processing ID
        const config = configs.find(c => c.id === data.ov_processing_id);

        let orderData: any = null;
        let contractObject: any = null;
        const fetchPromises: PromiseLike<any>[] = [];

        const cId = data.o_contract_id;

        const p1 = supabase.from('v_orders').select('contract_id, provider_department_id').eq('id', data.o_id).single().then(res => { orderData = res.data; });
        fetchPromises.push(p1);

        if (cId) {
            const p2 = supabase.from('contracts').select('object').eq('id', cId).single().then(res => { contractObject = res.data?.object; });
            fetchPromises.push(p2);
        }

        await Promise.all(fetchPromises);

        // Fallback in case o_contract_id was missing but v_orders has it
        if (!cId && orderData?.contract_id) {
            const res = await supabase.from('contracts').select('object').eq('id', orderData.contract_id).single();
            contractObject = res.data?.object;
        }

        return {
            id: data.id?.toString(),
            oId: data.o_id?.toString(),
            ovMask: data.ov_mask,
            ovStatusId: data.ov_status_id,
            ovCreatedAt: data.ov_started_at,
            ovCreatedUserId: data.ov_team_leader_id?.toString(),
            ovStartedAt: data.ov_started_at,
            ovEndedAt: data.ov_ended_at,
            ovTeamLeadId: data.ov_team_leader_id?.toString(),
            ovProcessingId: data.ov_processing_id,
            ovComments: data.ov_comments,
            orderMask: data.o_mask,
            statusDescription: data.ov_status_description,
            processingDescription: data.ov_processing_description,
            teamLeaderName: data.ov_team_leader_name_short,
            unitDescription: data.o_unit_description,
            unitId: data.o_unit_id?.toString(),
            systemDescription: data.o_system_description,
            clientName: data.client_name || data.o_client_name,
            assetTagDescription: data.o_asset_tag_description || data.asset_tag_description,
            assetTagSubDescription: data.asset_tag_sub_description || data.o_asset_tag_sub_description,
            requestedServices: data.o_requested_services,
            progress: data.ov_o_progress ? Math.round(parseFloat(data.ov_o_progress) * 100) : 0,
            ovOStatusId: data.ov_o_status_id,
            ovOStatusDescription: data.ov_o_status_description,
            ovOSuspendedReasonId: data.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: data.ov_o_suspended_reason_description,
            processingIcon: config?.icon,
            processingIconColor: config?.icon_color,
            processingBgColor: config?.bg_color,
            ovDurationHours: data.ov_duration_hours,
            contractId: orderData?.contract_id?.toString() || data.o_contract_id?.toString(),
            servicesValue: data.ov_services_value,
            materialsValue: data.ov_materials_value,
            vehiclesValue: data.ov_vehicles_value,
            totalValue: data.ov_total_value,
            companyId: data.o_provider_company_id?.toString(),
            providerCompanyId: data.o_provider_company_id?.toString(),
            providerDepartmentId: orderData?.provider_department_id?.toString() || data.o_provider_department_id?.toString(),
            isFiled: data.ov_is_filed,
            teamCode: data.o_team_code,
            priorityId: data.o_priority_id?.toString(),
            priorityCode: data.o_priority_code,
            priorityDescription: data.o_priority_description,
            priorityColor: data.o_priority_color,
            oRequesterName: data.o_requester_name,
            oRequesterPhone: data.o_requester_phone,
            contractDescription: data.o_contract_description,
            contractObject: contractObject,
            planDescription: data.o_plan_description || data.plan_description,
            oReasonDescription: data.o_reason_description,
            oCauseDescription: data.o_cause_description,
            observation: data.o_comments || data.ov_comments,
            ovAssetsAmount: stats.ov_assets_amount,
            ovAssetsReportedAmount: stats.ov_assets_reported_amount,
            ovAssetsDraftAmount: stats.ov_assets_draft_amount,
            ovAssetsRevisedAmount: stats.ov_assets_revised_amount,
            ovAssetsDisapprovedAmount: stats.ov_assets_disapproved_amount,
            ovAssetsApprovedNoFiledAmount: stats.ov_assets_approved_no_filed_amount,
            ovAssetsApprovedFiledAmount: stats.ov_assets_approved_filed_amount,
            ovAssetsApprovedAmount: stats.ov_assets_approved_no_filed_amount + stats.ov_assets_approved_filed_amount,
            // Approval audit trail
            reportedAt: data.ov_reported_at,
            reportedUserId: data.ov_reported_user_id?.toString(),
            reportedUserNameShort: data.ov_reported_user_name_short,
            revisedAt: data.ov_revised_at,
            revisedUserId: data.ov_revised_user_id?.toString(),
            revisedUserNameShort: data.ov_revised_user_name_short,
            disapprovedAt: data.ov_disapproved_at,
            disapprovedUserId: data.ov_disapproved_user_id?.toString(),
            disapprovedUserNameShort: data.ov_disapproved_user_name_short,
            approvedAt: data.ov_approved_at,
            approvedUserId: data.ov_approved_user_id?.toString(),
            approvedUserNameShort: data.ov_approved_user_name_short,
            approvedFiledAt: data.ov_approved_filed_at,
            approvedFiledUserId: data.ov_approved_filed_user_id?.toString(),
            approvedFiledUserNameShort: data.ov_approved_filed_user_name_short,
            ovSignatureLeaderPath: data.ov_signature_leader_path,
            ovSignatureLeaderName: data.ov_signature_leader_name,
            ovSignatureLeaderAt: data.ov_signature_leader_at,
            ovSignatureRequesterPath: data.ov_signature_requester_path,
            ovSignatureRequesterName: data.ov_signature_requester_name,
            ovSignatureRequesterAt: data.ov_signature_requester_at,
            chatStatus: data.chat_status || 'open',
            chatClosedAt: data.chat_closed_at,
            chatClosedUserId: data.chat_closed_user_id?.toString(),
            chatCreatedUserId: data.chat_created_user_id?.toString()
        } as OrderVisit;
    },

    // -------------------------------------------------------------------------
    // TEAM MANAGEMENT
    // -------------------------------------------------------------------------

    async getOrderVisitTeam(visitId: string): Promise<OrderVisitTeam[]> {
        // 1. Fetch team links
        const { data: teamLinks, error: teamError } = await supabase
            .from('orders_visits_teams')
            .select('*')
            .eq('ov_id', visitId)
            .order('order_id', { ascending: true });

        if (teamError || !teamLinks || teamLinks.length === 0) return [];

        // 2. Fetch User Details
        const userIds = teamLinks.map((t: any) => t.user_id);
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name_short, img_file_path, img_file_name, is_available')
            .in('id', userIds);

        if (usersError || !users) return [];

        // 3. Merge Data
        const userMap = new Map<any, any>(users.map((u: any) => [u.id, u]));

        return teamLinks.map((item: any) => {
            const user = userMap.get(item.user_id);
            return {
                id: item.id,
                ovId: item.ov_id,
                userId: item.user_id,
                isLeader: item.is_leader,
                orderId: item.order_id,
                userName: user?.name_short,
                userIsAvailable: user?.is_available,
                userAvatarUrl: user?.img_file_path && user?.img_file_name
                    ? getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined
            };
        });
    },

    async getOrdersVisitsTeamsBulk(visitIds: string[]): Promise<Record<string, OrderVisitTeam[]>> {
        if (!visitIds || visitIds.length === 0) return {};

        const numericIds = visitIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (numericIds.length === 0) return {};

        // 1. Fetch team links for all visits
        const { data: teamLinks, error: teamError } = await supabase
            .from('orders_visits_teams')
            .select('*')
            .in('ov_id', numericIds)
            .order('order_id', { ascending: true });

        if (teamError || !teamLinks || teamLinks.length === 0) return {};

        // 2. Fetch all unique users involved
        const userIds = Array.from(new Set(teamLinks.map((t: any) => t.user_id)));
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name_short, img_file_path, img_file_name, is_available')
            .in('id', userIds);

        if (usersError || !users) {
            console.error('Error fetching users for teams bulk:', usersError);
            return {};
        }

        // 3. Merge Data
        const userMap = new Map<any, any>(users.map((u: any) => [u.id, u]));
        const results: Record<string, OrderVisitTeam[]> = {};

        teamLinks.forEach((item: any) => {
            const user = userMap.get(item.user_id);
            const mappedMember: OrderVisitTeam = {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                userId: item.user_id,
                isLeader: item.is_leader,
                orderId: item.order_id,
                userName: user?.name_short,
                userIsAvailable: user?.is_available,
                userAvatarUrl: user?.img_file_path && user?.img_file_name
                    ? getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined
            };

            const ovIdStr = item.ov_id.toString();
            if (!results[ovIdStr]) {
                results[ovIdStr] = [];
            }
            results[ovIdStr].push(mappedMember);
        });

        return results;
    },

    async getProviderCompanyByOvAssetId(ovAssetId: string): Promise<string | null> {
        const { data: ova, error: ovaError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (ovaError || !ova) return null;

        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('o_provider_company_id')
            .eq('id', ova.ov_id)
            .single();

        if (visitError || !visit) return null;

        return visit.o_provider_company_id?.toString() || null;
    },

    async removeTeamMember(visitId: string, userId: string): Promise<void> {
        // 1. Fetch visit status to check if we should update user record
        const { data: visit, error: visitError } = await supabase
            .from('orders_visits')
            .select('ov_status_id')
            .eq('id', parseInt(visitId))
            .single();

        if (visitError || !visit) throw visitError || new Error('Visita não encontrada');

        // 2. Remove from orders_visits_teams
        const { error: teamError } = await supabase
            .from('orders_visits_teams')
            .delete()
            .eq('ov_id', parseInt(visitId))
            .eq('user_id', userId);

        if (teamError) throw teamError;

        // 3. Update user status ONLY if visit is in progress
        if (visit.ov_status_id === 1) {
            const { error: userError } = await supabase
                .from('users')
                .update({
                    is_available: true,
                    is_ov_in_progress: false,
                    ov_id_in_progress: 0,
                    o_id_in_progress: 0,
                    op_id_in_progress: 0,
                    ov_id_in_progress_mask: '0',
                    o_contract_id_in_progress: 0,
                    o_type_id_in_progress: 0,
                    o_type_sub_id_in_progress: 0,
                    ov_in_progress_leader_id: 0,
                    o_plan_id_in_progress: 0,
                    o_asset_tag_id_in_progress: 0,
                    o_unit_id_in_progress: 0,
                    o_unit_type_id_in_progress: 0,
                    o_unit_type_parent_id_in_progress: 0,
                    o_system_id_in_progress: 0,
                    o_system_parent_id_in_progress: 0,
                    o_object_id_in_progress: 0
                })
                .eq('id', userId);

            if (userError) throw userError;
        }
    },

    async addTeamMember(visitId: string, userId: string): Promise<void> {
        // 1. Business Rule: No duplicate members
        const { data: existing, error: checkError } = await supabase
            .from('orders_visits_teams')
            .select('id')
            .eq('ov_id', visitId)
            .eq('user_id', userId)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existing) throw new Error('Usuário já faz parte da equipe desta visita');

        // 2. Fetch Visit and Order Data
        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) throw visitError || new Error('Visita não encontrada');

        const { data: order, error: orderError } = await supabase
            .from('v_orders')
            .select('*')
            .eq('id', visit.o_id)
            .single();

        if (orderError || !order) throw orderError || new Error('Ordem de serviço não encontrada');

        // 3. Insert into orders_visits_teams
        const { error: insertError } = await supabase
            .from('orders_visits_teams')
            .insert({
                ov_id: parseInt(visitId),
                user_id: userId,
                is_leader: false,
                order_id: 0 // Temp
            });

        if (insertError) throw insertError;

        // 4. Update order_id for all non-leaders alphabetically by name_short
        const { data: teamMembers, error: membersError } = await supabase
            .from('orders_visits_teams')
            .select('id, user_id, is_leader')
            .eq('ov_id', visitId)
            .eq('is_leader', false);

        if (membersError) throw membersError;

        const { data: usersInfo, error: usersInfoError } = await supabase
            .from('users')
            .select('id, name_short')
            .in('id', teamMembers.map(m => m.user_id));

        if (usersInfoError) throw usersInfoError;

        const nameMap = new Map<any, any>(usersInfo.map((u: any) => [u.id, u.name_short]));
        const sortedMembers = [...teamMembers].sort((a, b) => {
            const nameA = nameMap.get(a.user_id) || '';
            const nameB = nameMap.get(b.user_id) || '';
            return nameA.localeCompare(nameB, 'pt-BR');
        });

        // Sequential updates for order_id
        for (let i = 0; i < sortedMembers.length; i++) {
            await supabase
                .from('orders_visits_teams')
                .update({ order_id: i + 1 })
                .eq('id', sortedMembers[i].id);
        }

        // 5. Update user record (if status is 1 - Em Andamento)
        if (visit.ov_status_id === 1) {
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    is_available: false,
                    is_ov_in_progress: true,
                    ov_id_in_progress: parseInt(visitId),
                    o_id_in_progress: parseInt(visit.o_id),
                    op_id_in_progress: order.parent_id,
                    ov_id_in_progress_mask: visit.ov_mask,
                    o_contract_id_in_progress: order.contract_id,
                    o_type_id_in_progress: order.type_id,
                    o_type_sub_id_in_progress: order.type_sub_id,
                    ov_in_progress_leader_id: visit.ov_team_leader_id,
                    o_plan_id_in_progress: order.plan_id,
                    o_asset_tag_id_in_progress: order.asset_tag_id,
                    o_unit_id_in_progress: order.unit_id,
                    o_unit_type_id_in_progress: order.unit_type_id,
                    o_unit_type_parent_id_in_progress: order.unit_type_parent_id,
                    o_system_id_in_progress: order.system_id,
                    o_system_parent_id_in_progress: order.system_parent_id,
                    o_object_id_in_progress: order.object_id
                })
                .eq('id', userId);

            if (userUpdateError) throw userUpdateError;
        }
    },

    // -------------------------------------------------------------------------
    // VISIT BY ORDER
    // -------------------------------------------------------------------------

    async getVisitsByOrderId(orderId: string | number): Promise<OrderVisit[]> {
        // Fetch visits and configurations in parallel
        const [visitsResult, configs] = await Promise.all([
            supabase
                .from('v_orders_visits')
                .select('*')
                .eq('o_id', Number(orderId))
                .order('ov_started_at', { ascending: true }),
            getProcessingConfigurations()
        ]);

        const { data, error } = visitsResult;

        if (error || !data) return [];

        return data.map(item => {
            // Find matching config
            const config = configs.find(c => c.id === item.ov_processing_id);

            return {
                id: item.id?.toString(),
                oId: item.o_id?.toString(),
                ovMask: item.ov_mask,
                ovStatusId: item.ov_status_id,
                ovCreatedAt: item.created_at || item.ov_started_at,
                ovCreatedUserId: item.created_user_id?.toString() || item.ov_team_leader_id?.toString(),
                ovUpdatedAt: item.updated_at,
                ovUpdatedUserId: item.updated_user_id?.toString(),
                ovStartedAt: item.ov_started_at,
                ovEndedAt: item.ov_ended_at,
                ovTeamLeadId: item.ov_team_leader_id?.toString(),
                ovProcessingId: item.ov_processing_id,
                ovComments: item.ov_comments,
                orderMask: item.o_mask,
                statusDescription: item.ov_status_description,
                processingDescription: item.ov_processing_description,
                teamLeaderName: item.ov_team_leader_name_short,
                unitDescription: item.o_unit_description,
                unitId: item.o_unit_id?.toString(),
                systemDescription: item.o_system_description,
                clientName: item.o_client_name,
                assetTagDescription: item.o_asset_tag_description,
                assetTagSubDescription: item.o_asset_tag_sub_description,
                requestedServices: item.o_requested_services,
                progress: item.ov_o_progress ? Math.round(parseFloat(item.ov_o_progress) * 100) : 0,
                ovOStatusId: item.ov_o_status_id,
                ovOStatusDescription: item.ov_o_status_description,
                ovOSuspendedReasonId: item.ov_o_suspended_reason_id,
                ovOSuspendedReasonDescription: item.ov_o_suspended_reason_description,
                processingIcon: config?.icon,
                processingIconColor: config?.icon_color,
                processingBgColor: config?.bg_color,
                ovDurationHours: item.ov_duration_hours,
                contractId: item.o_contract_id?.toString(),
                servicesValue: item.ov_services_value,
                materialsValue: item.ov_materials_value,
                vehiclesValue: item.ov_vehicles_value,
                totalValue: item.ov_total_value,
                teamCode: item.o_team_code,
                chatStatus: item.chat_status || 'open',
                chatClosedAt: item.chat_closed_at,
                chatClosedUserId: item.chat_closed_user_id?.toString(),
                chatCreatedUserId: item.chat_created_user_id?.toString()
            } as OrderVisit;
        });
    },

    async getVisitsByParentOrderId(parentId: string | number): Promise<OrderVisit[]> {
        // Fetch visits and configurations in parallel
        const [visitsResult, configs] = await Promise.all([
            supabase
                .from('v_orders_visits')
                .select('*')
                .eq('op_id', Number(parentId))
                .order('ov_started_at', { ascending: true }),
            getProcessingConfigurations()
        ]);

        const { data, error } = visitsResult;

        if (error || !data) return [];

        return data.map(item => {
            // Find matching config
            const config = configs.find(c => c.id === item.ov_processing_id);

            return {
                id: item.id?.toString(),
                oId: item.o_id?.toString(),
                ovMask: item.ov_mask,
                ovStatusId: item.ov_status_id,
                ovCreatedAt: item.created_at || item.ov_started_at,
                ovCreatedUserId: item.created_user_id?.toString() || item.ov_team_leader_id?.toString(),
                ovUpdatedAt: item.updated_at,
                ovUpdatedUserId: item.updated_user_id?.toString(),
                ovStartedAt: item.ov_started_at,
                ovEndedAt: item.ov_ended_at,
                ovTeamLeadId: item.ov_team_leader_id?.toString(),
                ovProcessingId: item.ov_processing_id,
                ovComments: item.ov_comments,
                orderMask: item.o_mask,
                statusDescription: item.ov_status_description,
                processingDescription: item.ov_processing_description,
                teamLeaderName: item.ov_team_leader_name_short,
                unitDescription: item.o_unit_description,
                unitId: item.o_unit_id?.toString(),
                systemDescription: item.o_system_description,
                clientName: item.o_client_name,
                assetTagDescription: item.o_asset_tag_description,
                assetTagSubDescription: item.o_asset_tag_sub_description,
                requestedServices: item.o_requested_services,
                progress: item.ov_o_progress ? Math.round(parseFloat(item.ov_o_progress) * 100) : 0,
                ovOStatusId: item.ov_o_status_id,
                ovOStatusDescription: item.ov_o_status_description,
                ovOSuspendedReasonId: item.ov_o_suspended_reason_id,
                ovOSuspendedReasonDescription: item.ov_o_suspended_reason_description,
                processingIcon: config?.icon,
                processingIconColor: config?.icon_color,
                processingBgColor: config?.bg_color,
                ovDurationHours: item.ov_duration_hours,
                contractId: item.o_contract_id?.toString(),
                servicesValue: item.ov_services_value,
                materialsValue: item.ov_materials_value,
                vehiclesValue: item.ov_vehicles_value,
                totalValue: item.ov_total_value,
                teamCode: item.o_team_code,
                chatStatus: item.chat_status || 'open',
                chatClosedAt: item.chat_closed_at,
                chatClosedUserId: item.chat_closed_user_id?.toString(),
                chatCreatedUserId: item.chat_created_user_id?.toString()
            } as OrderVisit;
        });
    },

    // -------------------------------------------------------------------------
    // ASSET UNAVAILABLE REASONS
    // -------------------------------------------------------------------------

    async getAssetsUnavailableReasons(): Promise<{ id: number, description: string }[]> {
        const { data, error } = await supabase
            .from('cfg_assets_unavailable_reasons')
            .select('id, description')
            .eq('is_available', true)
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching asset unavailable reasons:', error);
            return [];
        }

        return data || [];
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT BY ID
    // -------------------------------------------------------------------------

    async getOrderVisitById(visitId: string): Promise<OrderVisit | null> {
        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();
        if (error) {
            console.error('Error fetching visit by id', error);
            return null;
        }
        return data as OrderVisit;
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT VEHICLES (orders_visits_vehicles)
    // -------------------------------------------------------------------------

    async getOrderVisitVehicles(visitId: string): Promise<OrderVisitVehicle[]> {
        // Usar a view v_orders_visits_vehicles que já tem os dados do veículo incluídos
        const { data, error } = await supabase
            .from('v_orders_visits_vehicles')
            .select('*')
            .eq('ov_id', visitId);

        if (error) {
            console.error('Error fetching order visit vehicles:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            vehicleId: item.vehicle_id.toString(),
            recorderStart: item.recorder_start,
            recorderEnd: item.recorder_end,
            amount: (item.recorder_end && item.recorder_start) ? (item.recorder_end - item.recorder_start) : 0,
            valueUnit: item.value_unit,
            valueTotal: item.value_total,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            // Dados do veículo vêm diretamente da view
            description: item.vehicle_description,
            plates: item.vehicle_plates,
            model: item.vehicle_description, // A view não tem 'model', usar description
            unit: item.unit
        }));
    },

    async addVehicleToOrderVisit(visitId: string, vehicleId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_vehicles')
            .insert({
                ov_id: parseInt(visitId),
                vehicle_id: parseInt(vehicleId),
                created_user_id: parseInt(userId),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error adding vehicle to visit:', error);
            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSETS (orders_visits_assets)
    // -------------------------------------------------------------------------

    async getOrderVisitAssets(visitId: string): Promise<OrderVisitAssetView[]> {
        const { data: viewData, error: viewError } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('ov_id', parseInt(visitId));

        if (viewError) {
            console.error('Error fetching order visit assets from view:', viewError);
            return [];
        }

        // Fetch image data directly from the table to ensure we have the most recent data
        const { data: tableData, error: tableError } = await supabase
            .from('orders_visits_assets')
            .select('id, before_img_files_names, after_img_files_names, before_img_file_path, after_img_file_path')
            .eq('ov_id', parseInt(visitId));

        if (tableError) {
            console.warn('Error fetching image data directly from table:', tableError);
        }

        // Create a map of table data for easy merging
        const tableDataMap = new Map<string, any>((tableData || []).map((t: any) => [t.id.toString(), t]));

        return (viewData || []).map((item: any) => {
            // Merge view data with table data (table data takes precedence for images)
            const tableItem = tableDataMap.get(item.id.toString());
            const mergedItem = tableItem ? { ...item, ...tableItem } : item;

            const oCompanyId = mergedItem.o_company_id || mergedItem.company_id;
            const assetId = mergedItem.asset_id;

            // Helper to ensure we have an array of strings
            const ensureArray = (val: any): string[] => {
                if (Array.isArray(val)) {
                    // Se o banco for text[] e salvamos um JSON string, ele retorna ["[\"img1\",\"img2\"]"]
                    if (val.length === 1 && typeof val[0] === 'string' && val[0].startsWith('[')) {
                        try {
                            const parsed = JSON.parse(val[0]);
                            if (Array.isArray(parsed)) return parsed;
                        } catch (e) {
                            // fallback
                        }
                    }
                    return val;
                }
                if (typeof val === 'string' && val.trim()) {
                    // Handle postgres array format if necessary: {file1,file2}
                    if (val.startsWith('{') && val.endsWith('}')) {
                        return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                    }
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) {
                        return [val];
                    }
                }
                return [];
            };

            const beforeFiles = ensureArray(mergedItem.before_img_files_names);
            const afterFiles = ensureArray(mergedItem.after_img_files_names);

            const initialPhotoUrls = beforeFiles.map((name: string) =>
                getPublicImageUrl(mergedItem.before_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, name));

            const finalPhotoUrls = afterFiles.map((name: string) =>
                getPublicImageUrl(mergedItem.after_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, name));

            return {
                id: item.id.toString(),
                ovId: item.ov_id.toString(),
                assetId: assetId.toString(),
                code: item.code,
                description: item.description,
                brand: item.brand,
                model: item.model,
                serial: item.serial,
                location: item.location,
                beforeUnitDescription: item.before_unit_description,
                afterUnitDescription: item.after_unit_description,
                beforeStatusDescription: item.before_status_description,
                afterStatusDescription: item.after_status_description,
                afterTagDescription: item.after_tag_description,
                beforeTagDescription: item.before_tag_description,
                beforeTagSubDescription: item.before_tag_sub_description,
                afterTagSubDescription: item.after_tag_sub_description,
                beforeComments: item.before_comments,
                afterComments: item.after_comments,
                isMoved: item.is_moved,
                movedComments: item.moved_comments,
                oTeamLeaderNameShort: item.o_team_leader_name_short,
                ovMask: item.ov_mask,
                orderMask: item.o_mask || item.order_mask,
                beforeStatusAt: item.before_status_at,
                createdAt: item.reported_at,
                beforeStatusColor: item.status_color || item.before_status_color,
                clientName: item.client_name,
                beforeClientName: item.before_client_name,
                afterClientName: item.after_client_name,
                processingId: item.processing_id,
                processingDescription: item.processing_description,
                disapprovedNotes: item.disapproved_notes,
                reportedUserNameShort: item.reported_user_name_short,
                activitiesDescription: item.activities_description,
                maintenancePlanId: item.maintenance_plan_id?.toString(),
                maintenancePlanProgress: item.maintenance_plan_progress,
                oContractId: item.o_contract_id?.toString(),
                orderTypeId: item.o_type_id?.toString(),
                imgUrl: initialPhotoUrls[0],
                initialPhotoUrls,
                finalPhotoUrls,
                hasRecorder: item.has_recorder ?? false,
                beforeRecorder: item.before_recorder ?? null,
                afterRecorder: item.after_recorder ?? null,
            };
        });
    },

    async getMovedAssetsByUnitAssetTagId(unitAssetTagId: string): Promise<OrderVisitAssetView[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('before_unit_asset_tag_id', unitAssetTagId)
            .eq('is_moved', true);

        if (error) {
            console.error('Error fetching moved assets by unit_asset_tag_id:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            assetId: item.asset_id.toString(),
            code: item.code,
            description: item.description,
            brand: item.brand,
            model: item.model,
            serial: item.serial,
            location: item.location,
            isMoved: item.is_moved,
            beforeUnitId: item.before_unit_id?.toString(),
            afterUnitId: item.after_unit_id?.toString(),
            beforeUnitAssetTagId: item.before_unit_asset_tag_id?.toString(),
            afterUnitAssetTagId: item.after_unit_asset_tag_id?.toString(),
            beforeStatusId: item.before_status_id?.toString(),
            afterStatusId: item.after_status_id?.toString(),
            beforeUnitDescription: item.before_unit_description,
            afterUnitDescription: item.after_unit_description,
            beforeStatusDescription: item.before_status_description,
            afterStatusDescription: item.after_status_description,
            beforeTagDescription: item.before_tag_description,
            beforeTagSubDescription: item.before_tag_sub_description,
            afterUnitAssetTagDescription: item.after_unit_asset_tag_description,
            beforeStatusAt: item.before_status_at,
            afterStatusAt: item.after_status_at,
            createdAt: item.reported_at,
            beforeStatusColor: item.status_color || item.before_status_color,
            afterStatusColor: item.after_status_color,
            clientName: item.client_name,
            beforeClientName: item.before_client_name,
            afterClientName: item.after_client_name,
            afterLocation: item.after_location,
            processingId: item.processing_id,
            oTeamLeaderNameShort: item.o_team_leader_name_short,
            ovMask: item.ov_mask,
            orderMask: item.order_mask,
            movedComments: item.moved_comments,
            afterTagDescription: item.after_tag_description,
            afterTagSubDescription: item.after_tag_sub_description,
            imgUrl: item.before_img_files_names && item.before_img_files_names.length > 0
                ? getPublicImageUrl(item.before_img_file_path || `companies/${item.o_company_id || item.company_id}/assets/${item.asset_id}`, item.before_img_files_names[0])
                : undefined
        }));
    },

    async getOrderVisitAssetById(id: string): Promise<OrderVisitAssetView | null> {
        // Fetch from view for joined data
        const { data: viewData, error: viewError } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .eq('id', id)
            .single();

        if (viewError || !viewData) {
            console.error('Error fetching order visit asset by id from view:', viewError);
            return null;
        }

        // Fetch image arrays and paths directly from the table to avoid view sync lag/issues
        const { data: tableData, error: tableError } = await supabase
            .from('orders_visits_assets')
            .select('processing_id, disapproved_notes, disapproved_user_id, disapproved_at, before_img_files_names, after_img_files_names, before_img_file_path, after_img_file_path, has_recorder, before_recorder, after_recorder')
            .eq('id', parseInt(id))
            .single();

        if (tableError) {
            console.warn('Error fetching image file names directly from table, using view data if available:', tableError);
        }

        const data = { ...viewData, ...tableData };

        let orderTypeId = data.o_type_id?.toString();
        let contractId = data.o_contract_id?.toString();
        const oCompanyId = data.o_company_id || data.company_id;

        // If o_type_id is not in the asset view, fetch it from the visit view or order
        if ((!orderTypeId || !contractId) && data.o_id) {
            try {
                const { data: orderData } = await supabase
                    .from('v_orders')
                    .select('type_id, contract_id')
                    .eq('id', data.o_id)
                    .single();
                if (orderData) {
                    if (!orderTypeId) orderTypeId = orderData.type_id?.toString();
                    if (!contractId) contractId = orderData.contract_id?.toString();
                }
            } catch (vError) {
                console.warn('Could not fetch order data for orderTypeId/contractId', vError);
            }
        }

        let assetTypeId: string | undefined;
        try {
            const { data: assetData } = await supabase
                .from('assets')
                .select('type_id')
                .eq('id', data.asset_id)
                .single();
            if (assetData) {
                assetTypeId = assetData.type_id?.toString();
            }
        } catch (e) {
            console.warn('Could not fetch type_id from assets', e);
        }

        const ensureArray = (val: any): string[] => {
            if (Array.isArray(val)) {
                if (val.length === 1 && typeof val[0] === 'string' && val[0].startsWith('[')) {
                    try {
                        const parsed = JSON.parse(val[0]);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) {
                        // fallback
                    }
                }
                return val;
            }
            if (typeof val === 'string' && val.trim()) {
                if (val.startsWith('{') && val.endsWith('}')) {
                    return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                }
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    return [val];
                }
            }
            return [];
        };

        const beforeFiles = ensureArray(data.before_img_files_names);
        const afterFiles = ensureArray(data.after_img_files_names);

        return {
            id: data.id.toString(),
            ovId: data.ov_id.toString(),
            assetId: data.asset_id.toString(),
            code: data.code,
            description: data.description,
            brand: data.brand,
            model: data.model,
            serial: data.serial,
            assetTypeId: assetTypeId,
            location: data.location,
            beforeUnitId: data.before_unit_id?.toString(),
            afterUnitId: data.after_unit_id?.toString(),
            beforeUnitAssetTagId: data.before_unit_asset_tag_id?.toString(),
            beforeStatusId: data.before_status_id?.toString(),
            afterStatusId: data.after_status_id?.toString(),
            beforeLocation: data.before_location,
            afterLocation: data.after_location,
            beforePriorityId: data.before_priority_id,
            isMoved: data.is_moved,
            beforeClientId: data.before_client_id?.toString(),
            afterClientId: data.after_client_id?.toString(),
            afterUnitAssetTagId: data.after_unit_asset_tag_id?.toString(),
            isFiled: data.is_filed,
            beforeUnitDescription: data.before_unit_description,
            afterUnitDescription: data.after_unit_description,
            beforeStatusDescription: data.before_status_description,
            afterStatusDescription: data.after_status_description,
            beforeTagDescription: data.before_tag_description,
            beforeTagSubDescription: data.before_tag_sub_description,
            afterUnitAssetTagDescription: data.after_unit_asset_tag_description,
            beforeStatusAt: data.before_status_at,
            createdAt: data.reported_at,
            processingId: data.processing_id,
            disapprovedNotes: data.disapproved_notes,
            // Extended fields for OrderVisitAssetCardDetail
            afterTagDescription: data.after_tag_description,
            afterTagSubDescription: data.after_tag_sub_description,
            afterStatusAt: data.after_status_at,
            afterStatusColor: data.status_color,
            clientName: data.client_name,
            beforeClientName: data.before_client_name || data.client_name,
            afterClientName: data.after_client_name,

            beforeComments: data.before_comments,
            afterComments: data.after_comments,

            oTeamLeaderNameShort: data.o_team_leader_name_short,
            ovMask: data.ov_mask,
            orderMask: data.order_mask,

            oCompanyId: oCompanyId,

            beforeImgFilesNames: beforeFiles,
            afterImgFilesNames: afterFiles,
            initialPhotoUrls: beforeFiles.map((name: string) =>
                getPublicImageUrl(data.before_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, name)
            ),
            finalPhotoUrls: afterFiles.map((name: string) =>
                getPublicImageUrl(data.after_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, name)
            ),
            imgUrl: beforeFiles.length > 0 ?
                getPublicImageUrl(data.before_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, beforeFiles[0]) : undefined,
            afterImgUrl: afterFiles.length > 0 ?
                getPublicImageUrl(data.after_img_file_path || `companies/${oCompanyId}/assets/${data.asset_id}`, afterFiles[0]) : undefined,
            movedComments: data.moved_comments,
            beforeTagId: data.before_tag_id?.toString(),
            afterTagId: data.after_tag_id?.toString(),
            beforeTagSubId: data.before_tag_sub_id?.toString(),
            afterTagSubId: data.after_tag_sub_id?.toString(),
            afterPriorityId: data.after_priority_id,
            clientId: data.client_id?.toString(),
            orderTypeId: orderTypeId,
            oContractId: contractId,
            maintenancePlanId: data.maintenance_plan_id?.toString(),
            hasRecorder: data.has_recorder ?? false,
            beforeRecorder: data.before_recorder ?? null,
            afterRecorder: data.after_recorder ?? null,
        };
    },

    // -------------------------------------------------------------------------
    // ASSET UPDATES
    // -------------------------------------------------------------------------

    async updateOrderVisitAsset(id: string, updates: Partial<{
        before_comments: string;
        after_comments: string;
        has_recorder: boolean;
        before_recorder: number | null;
        after_recorder: number | null;
        is_moved: boolean;
        after_status_id: string;
        after_unit_id: string;
        after_tag_id: string;
        after_tag_sub_id: string;
        after_priority_id: number;
        moved_comments: string;
        after_unit_asset_tag_id: string;
        after_client_id: string;
    }>): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error updating order visit asset:', error);
            throw error;
        }
    },

    async reportedOrderVisitAsset(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                processing_id: 2,
                reported_user_id: userId,
                reported_at: new Date().toISOString(),
                disapproved_user_id: null,
                disapproved_at: null,
                disapproved_notes: null
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error reporting order visit asset:', error);
            throw error;
        }

        // Sync counters
        const visitId = await visitsService.getOrderVisitIdByAssetId(id);
        if (visitId) await visitsService.syncOrderVisitAssetsProcessing(visitId);
    },

    async disapproveOrderVisitAsset(id: string, userId: string, notes: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({
                processing_id: 4,
                disapproved_user_id: userId,
                disapproved_at: new Date().toISOString(),
                disapproved_notes: notes
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error disapproving order visit asset:', error);
            throw error;
        }

        // Sync counters
        const visitId = await visitsService.getOrderVisitIdByAssetId(id);
        if (visitId) await visitsService.syncOrderVisitAssetsProcessing(visitId);
    },

    async updateOrderVisitAssetProcessingStatus(id: string, processingId: number, userId: string): Promise<void> {
        const updates: any = {
            processing_id: processingId
        };

        let shouldApplyMovement = false;
        let assetUpdates: any = null;
        let targetAssetId: number | null = null;

        if (processingId === 5) {
            updates.approved_user_id = userId;
            updates.approved_at = new Date().toISOString();

            // Verificamos a movimentação
            const { data: ovaData } = await supabase
                .from('orders_visits_assets')
                .select('is_moved, asset_id, ov_id, after_status_id, after_unit_id, after_tag_id, after_tag_sub_id, after_unit_asset_tag_id, after_priority_id, moved_comments')
                .eq('id', parseInt(id))
                .single();

            if (ovaData?.is_moved && ovaData?.asset_id) {
                shouldApplyMovement = true;
                targetAssetId = ovaData.asset_id;

                const { data: vVisit } = await supabase
                    .from('v_orders_visits')
                    .select('ov_ended_at')
                    .eq('id', ovaData.ov_id)
                    .single();

                const finalStatusAt = vVisit?.ov_ended_at || new Date().toISOString();
                updates.after_status_at = finalStatusAt;

                assetUpdates = {
                    status_id: ovaData.after_status_id,
                    status_at: finalStatusAt,
                    unit_id: ovaData.after_unit_id,
                    tag_id: ovaData.after_tag_id,
                    tag_sub_id: ovaData.after_tag_sub_id,
                    unit_asset_tag_id: ovaData.after_unit_asset_tag_id,
                    priority_id: ovaData.after_priority_id,
                    comments: ovaData.moved_comments
                };

                // Remove campos null/undefined para não apagar o que não mandamos atualizar
                Object.keys(assetUpdates).forEach(k => {
                    if (assetUpdates[k] === null || assetUpdates[k] === undefined) {
                        delete assetUpdates[k];
                    }
                });
            }
        }

        const { error } = await supabase
            .from('orders_visits_assets')
            .update(updates)
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error updating processing status:', error);
            throw error;
        }

        if (shouldApplyMovement && targetAssetId && assetUpdates && Object.keys(assetUpdates).length > 0) {
            const { error: assetError } = await supabase
                .from('assets')
                .update(assetUpdates)
                .eq('id', targetAssetId);

            if (assetError) {
                console.error('Error applying asset movement updates:', assetError);
                throw assetError;
            }
        }

        // Sync counters
        const visitId = await visitsService.getOrderVisitIdByAssetId(id);
        if (visitId) await visitsService.syncOrderVisitAssetsProcessing(visitId);
    },

    // -------------------------------------------------------------------------
    // PHOTOS
    // -------------------------------------------------------------------------

    async uploadOrderVisitAssetPhoto(ovAssetId: string, file: File, type: 'before' | 'after', onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileExt = file.name.split('.').pop();
        // Add random suffix to prevent duplicate names when uploading multiple files simultaneously
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `${type}_${Date.now()}_${randomSuffix}.${fileExt}`;

        // 1. Fetch current record to get metadata and current lists
        // Note: Fetching from table directly to avoid view lag
        const { data: assetData, error: fetchError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id, asset_id, before_img_files_names, after_img_files_names')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (fetchError || !assetData) throw fetchError || new Error('Asset report not found');

        // Fetch companyId from visit view (o_company_id is a view field, not in the base table)
        let companyId: any = null;
        if (assetData.ov_id) {
            const { data: visitData } = await supabase
                .from('v_orders_visits')
                .select('o_provider_company_id')
                .eq('id', assetData.ov_id)
                .single();
            companyId = visitData?.o_provider_company_id;
        }

        // Fallback: try to get company from the asset record via assets table
        if (!companyId && assetData.asset_id) {
            const { data: assetInfo } = await supabase
                .from('assets')
                .select('company_owner_id')
                .eq('id', assetData.asset_id)
                .single();
            companyId = assetInfo?.company_owner_id;
        }

        if (!companyId) throw new Error('Company ID not found for asset path');

        const column = type === 'before' ? 'before_img_files_names' : 'after_img_files_names';
        const pathColumn = type === 'before' ? 'before_img_file_path' : 'after_img_file_path';

        const assetId = assetData.asset_id;
        const currentList = assetData[column] || [];
        const newList = [...currentList, fileName];

        //  Estrutura ajustada: companies/{companyId}/assets/{assetId}/ (Raiz)
        const folderPath = `companies/${companyId}/assets/${assetId}`;
        const fullPath = `${folderPath}/${fileName}`;

        // 2. Upload to Cloudflare R2
        try {
            await r2Service.uploadFile(file, fullPath, onProgress);
        } catch (uploadError) {
            console.error('Error uploading to R2:', uploadError);
            throw uploadError;
        }

        const { error: dbError } = await supabase
            .from('orders_visits_assets')
            .update({
                [column]: newList,
                [pathColumn]: folderPath,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(ovAssetId));

        if (dbError) {
            console.error('Error updating asset image list:', dbError);
            throw dbError;
        }

        return { path: folderPath, filename: fileName };
    },

    async removeOrderVisitAssetPhoto(ovAssetId: string, type: 'before' | 'after', fileName: string): Promise<void> {
        // 1. Fetch current list
        const column = type === 'before' ? 'before_img_files_names' : 'after_img_files_names';
        const { data: current, error: fetchError } = await supabase
            .from('orders_visits_assets')
            .select(column)
            .eq('id', parseInt(ovAssetId))
            .single();

        if (fetchError || !current) throw fetchError || new Error('Asset report not found');

        // 2. Filter out the specific file
        const currentList: string[] = (current as any)[column] || [];
        const newList = currentList.filter(f => f !== fileName);

        // 3. Update DB
        const pathColumn = type === 'before' ? 'before_img_file_path' : 'after_img_file_path';

        const { error: dbError } = await supabase
            .from('orders_visits_assets')
            .update({
                [column]: newList,
                [pathColumn]: newList.length > 0 ? undefined : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(ovAssetId));

        if (dbError) {
            console.error('Error removing asset photo from list:', dbError);
            throw dbError;
        }
    },

    // -------------------------------------------------------------------------
    // ASSET HELPERS
    // -------------------------------------------------------------------------

    async getOrderVisitIdByAssetId(assetId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('orders_visits_assets')
            .select('ov_id')
            .eq('id', parseInt(assetId))
            .single();

        if (error) {
            console.error('Error fetching ov_id by assetId:', error);
            return null;
        }
        return data?.ov_id?.toString() || null;
    },

    /**
     * Sincroniza todos os contadores de ativos na visita
     * @param visitId ID da visita
     */
    async syncOrderVisitAssetsProcessing(visitId: string): Promise<void> {
        // 1. Get visit is_filed status
        const { data: visit, error: vErr } = await supabase
            .from('orders_visits')
            .select('ov_is_filed')
            .eq('id', parseInt(visitId))
            .single();

        if (vErr || !visit) {
            console.error('Error fetching visit for asset sync:', vErr);
            return;
        }

        // 2. Only process if not filed
        if (visit.ov_is_filed) return;

        // 3. Get all assets for this visit
        const { data: assets, error: aErr } = await supabase
            .from('orders_visits_assets')
            .select('processing_id, is_filed')
            .eq('ov_id', parseInt(visitId));

        if (aErr) {
            console.error('Error fetching assets for counter update:', aErr);
            return;
        }

        // 4. Calculate counters with type safety
        const stats = {
            ov_assets_amount: assets.length,
            ov_assets_draft_amount: assets.filter(a => Number(a.processing_id) === 1).length,
            ov_assets_reported_amount: assets.filter(a => Number(a.processing_id) === 2).length,
            ov_assets_revised_amount: assets.filter(a => Number(a.processing_id) === 3).length,
            ov_assets_disapproved_amount: assets.filter(a => Number(a.processing_id) === 4).length,
            ov_assets_approved_no_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !a.is_filed).length,
            ov_assets_approved_filed_amount: assets.filter(a => Number(a.processing_id) === 5 && !!a.is_filed).length,
        };

        // 5. Update visit
        const { error: uErr } = await supabase
            .from('orders_visits')
            .update(stats)
            .eq('id', parseInt(visitId));

        if (uErr) {
            console.error('Error updating visit assets counters:', uErr);
        }
    },

    /**
     * @deprecated Use syncOrderVisitAssetsProcessing instead
     */
    async updateVisitAssetsAmount(visitId: string): Promise<void> {
        return visitsService.syncOrderVisitAssetsProcessing(visitId);
    },

    async addAssetToOrderVisit(visitId: string, assetId: string, userId: string): Promise<void> {
        // 1. Fetch asset details
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('*')
            .eq('id', assetId)
            .single();

        if (assetError || !asset) {
            console.error('Error fetching asset details:', assetError);
            throw new Error('Asset not found');
        }

        // 2. Fetch order details from v_orders_visits (view) to get o_id and op_id
        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('o_id, op_id')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            console.error('Error fetching visit details:', visitError);
            throw new Error('Visit not found');
        }

        // 3. Prepare payload
        const payload = {
            ov_id: parseInt(visitId),
            asset_id: parseInt(assetId),

            // After values (current asset state at time of insertion)
            after_unit_id: asset.unit_id,
            after_unit_asset_tag_id: asset.unit_asset_tag_id,
            after_tag_id: asset.tag_id,
            after_tag_sub_id: asset.tag_sub_id,
            after_status_id: asset.status_id,
            after_status_at: asset.status_at,
            after_priority_id: asset.priority_id,
            after_client_id: asset.client_id,
            after_location: asset.location,

            // Before values
            before_unit_id: asset.unit_id,
            before_unit_asset_tag_id: asset.unit_asset_tag_id,
            before_tag_id: asset.tag_id,
            before_tag_sub_id: asset.tag_sub_id,
            before_status_id: asset.status_id,
            before_status_at: asset.status_at,
            before_priority_id: asset.priority_id,
            before_client_id: asset.client_id,
            before_location: asset.location,

            is_moved: false,
            processing_id: 1,
            created_user_id: parseInt(userId),
            created_at: new Date().toISOString(),
            o_id: visit.o_id,
            op_id: visit.op_id
        };

        const { error } = await supabase
            .from('orders_visits_assets')
            .insert(payload);

        if (error) {
            console.error('Error adding asset to visit:', error);
            throw error;
        }

        // 4. Update ov_assets_amount in orders_visits
        await visitsService.updateVisitAssetsAmount(visitId);
    },

    async removeAssetFromOrderVisit(ovaId: string): Promise<void> {
        // 1. Fetch current record to get metadata for storage deletion AND visitId
        const { data: ova, error: fetchError } = await supabase
            .from('v_orders_visits_assets')
            .select('o_company_id, asset_id, before_img_files_names, after_img_files_names, ov_id')
            .eq('id', parseInt(ovaId))
            .single();

        if (fetchError || !ova) {
            console.error('Error fetching asset record for removal:', fetchError);
            throw fetchError || new Error('Asset record not found');
        }

        const folderPath = `companies/${ova.o_company_id}/${ova.asset_id}`;

        // 2. Storage Cleanup R2: before_img_files_names
        const beforePhotos = ova.before_img_files_names || [];
        if (beforePhotos.length > 0) {
            const pathsToDel = beforePhotos.map((name: string) => `${folderPath}/${name}`);
            try {
                await r2Service.deleteFiles(pathsToDel);
            } catch (e) {
                console.warn('Could not delete before photos from R2:', e);
            }
        }

        // 3. Storage Cleanup R2: after_img_files_names
        const afterPhotos = ova.after_img_files_names || [];
        if (afterPhotos.length > 0) {
            const pathsToDel = afterPhotos.map((name: string) => `${folderPath}/${name}`);
            try {
                await r2Service.deleteFiles(pathsToDel);
            } catch (e) {
                console.warn('Could not delete after photos from R2:', e);
            }
        }

        // 4. orders_visits_assets_activities
        const { error: actError } = await supabase
            .from('orders_visits_assets_activities')
            .delete()
            .eq('ova_id', parseInt(ovaId));
        if (actError) {
            console.error('Error deleting asset activities:', actError);
            throw actError;
        }

        // 5. orders_visits_assets_materials
        const { error: matError } = await supabase
            .from('orders_visits_assets_materials')
            .delete()
            .eq('ova_id', parseInt(ovaId));
        if (matError) {
            console.error('Error deleting asset materials:', matError);
            throw matError;
        }

        // 6. orders_visits_assets
        const { error: ovaError } = await supabase
            .from('orders_visits_assets')
            .delete()
            .eq('id', parseInt(ovaId));

        if (ovaError) {
            console.error('Error removing asset main record:', ovaError);
            throw ovaError;
        }

        // 7. Update ov_assets_amount in orders_visits
        await visitsService.updateVisitAssetsAmount(ova.ov_id.toString());
    },

    // -------------------------------------------------------------------------
    // VEHICLE UPDATES
    // -------------------------------------------------------------------------

    async removeVehicleFromOrderVisit(visitVehicleId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_vehicles')
            .delete()
            .eq('id', visitVehicleId);

        if (error) {
            console.error('Error removing vehicle from visit:', error);
            throw error;
        }
    },

    /**
     * Troca o ativo de um registro de reporte de visita.
     * Atualiza o ID do ativo e todos os dados cadastrais (before/after) baseados no novo ativo.
     * Mantém os caminhos das fotos originais (para não perder as fotos já tiradas).
     * @param ovaId ID do registro em orders_visits_assets
     * @param newAssetId ID do novo ativo
     * @param userId ID do usuário logado
     */
    async changeOrderVisitAsset(ovaId: string, newAssetId: string, userId: string): Promise<void> {
        // 1. Buscar detalhes do novo ativo (incluindo client_id via join se possível ou via assets)
        const { data: asset, error: assetError } = await supabase
            .from('v_assets')
            .select('*')
            .eq('id', newAssetId)
            .single();

        if (assetError || !asset) {
            console.error('Error fetching new asset details:', assetError);
            throw new Error('Novo ativo não encontrado no sistema.');
        }

        // 2. Buscar o registro atual para pegar o ov_id e asset_id antigo (para atualizar materiais)
        const { data: oldOva, error: oldError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id, asset_id')
            .eq('id', parseInt(ovaId))
            .single();

        if (oldError || !oldOva) {
            throw new Error('Registro de relatório original não encontrado.');
        }

        const oldAssetId = oldOva.asset_id;

        // 3. Preparar o payload de atualização
        // Mantemos before_img_file_path e after_img_file_path para preservar as fotos
        const updates = {
            asset_id: parseInt(newAssetId),

            // Novos dados cadastrais (Origem)
            before_unit_id: asset.unit_id,
            before_tag_id: asset.tag_id,
            before_tag_sub_id: asset.tag_sub_id,
            before_status_id: asset.status_id,
            before_status_at: asset.status_at,
            before_priority_id: asset.priority_id,
            before_unit_asset_tag_id: asset.unit_asset_tag_id,
            before_client_id: asset.client_id, // v_assets mapeia o client_id

            is_moved: false,
            moved_comments: null,

            // Novos dados cadastrais (Destino inicializado igual à origem)
            after_unit_id: asset.unit_id,
            after_tag_id: asset.tag_id,
            after_tag_sub_id: asset.tag_sub_id,
            after_status_id: asset.status_id,
            after_status_at: asset.status_at,
            after_priority_id: asset.priority_id,
            after_unit_asset_tag_id: asset.unit_asset_tag_id,
            after_client_id: asset.client_id,
            after_location: asset.location,

            updated_at: new Date().toISOString(),
            updated_user_id: parseInt(userId)
        };

        const { error: updateError } = await supabase
            .from('orders_visits_assets')
            .update(updates)
            .eq('id', parseInt(ovaId));

        if (updateError) {
            console.error('Error updating orders_visits_assets during swap:', updateError);
            throw updateError;
        }

        // 4. Atualizar materiais vinculados para o novo asset_id (se houver)
        const { error: matError } = await supabase
            .from('orders_visits_assets_materials')
            .update({ asset_id: parseInt(newAssetId) })
            .eq('ov_id', oldOva.ov_id)
            .eq('asset_id', oldAssetId)
            .eq('ova_id', parseInt(ovaId)); // Filtramos por ova_id para ser bem específico se possível

        if (matError) {
            console.error('Error updating materials asset_id during swap:', matError);
            // Não bloqueamos o sucesso total por causa dos materiais, mas logamos
        }
    },

    async updateVehicleKm(visitVehicleId: string, kmInitial?: number | null, kmFinal?: number | null): Promise<void> {
        const dbData: any = {};
        if (kmInitial !== undefined) dbData.recorder_start = kmInitial;
        if (kmFinal !== undefined) dbData.recorder_end = kmFinal;
        dbData.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('orders_visits_vehicles')
            .update(dbData)
            .eq('id', visitVehicleId);

        if (error) {
            console.error('Error updating vehicle km (attempt 1):', error);

            // Fallback: If migration failed, column might still be km_initial
            if (kmInitial !== undefined && error.message?.includes('recorder_start')) {
                const fallbackData: any = { updated_at: new Date().toISOString() };
                fallbackData.km_initial = kmInitial;
                if (kmFinal !== undefined) fallbackData.recorder_end = kmFinal;

                const { error: error2 } = await supabase
                    .from('orders_visits_vehicles')
                    .update(fallbackData)
                    .eq('id', visitVehicleId);

                if (error2) throw error2; // Throw original or new error
                return; // Success on fallback
            }

            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT SERVICES (orders_visits_services)
    // -------------------------------------------------------------------------

    async getOrderVisitServices(visitId: string): Promise<OrderVisitService[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_services')
            .select('*')
            .eq('ov_id', visitId);

        if (error) {
            console.error('Error fetching order visit services:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            ovId: item.ov_id.toString(),
            serviceId: item.service_id?.toString(), // cfg_services.id — used for alreadyAdded filter
            amount: Number(item.amount),
            valueUnit: Number(item.value_unit),
            discount: Number(item.discount || 0),
            valueTotal: Number(item.value_total),
            versionMode: item.version_mode,
            serviceDescription: item.description,
            serviceCode: item.code,
            serviceUnit: item.unit
        }));
    },

    async addServiceToOrderVisit(visitId: string, contractServiceId: string, userId: string, amount: number = 1): Promise<void> {
        // Fetch contract service details: value_unit, discount and the actual cfg_services.id (service_id)
        const { data: cs } = await supabase
            .from('contracts_services')
            .select('value_unit, discount, service_id')
            .eq('id', contractServiceId)
            .single();

        const valueUnit = Number(cs?.value_unit || 0);
        const discount = Number(cs?.discount !== undefined ? cs.discount : 1);
        // service_id must reference cfg_services.id so the view v_orders_visits_services resolves correctly
        const serviceId = cs?.service_id ? parseInt(cs.service_id) : parseInt(contractServiceId);

        const { error } = await supabase
            .from('orders_visits_services')
            .insert({
                ov_id: parseInt(visitId),
                service_id: serviceId,
                amount: amount,
                value_unit: valueUnit,
                discount: discount,
                value_total: amount * valueUnit * (discount || 1),
                created_user_id: parseInt(userId),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error adding service to visit:', error);
            throw error;
        }
    },

    async removeServiceFromOrderVisit(ovServiceId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_services')
            .delete()
            .eq('id', ovServiceId);

        if (error) {
            console.error('Error removing service from visit:', error);
            throw error;
        }
    },

    async updateOrderVisitService(ovServiceId: string, updates: { amount?: number; discount?: number; valueUnit?: number }): Promise<void> {
        // Fetch current values to update total
        const { data: current } = await supabase
            .from('orders_visits_services')
            .select('amount, value_unit, discount')
            .eq('id', ovServiceId)
            .single();

        if (!current) return;

        const newAmount = updates.amount !== undefined ? updates.amount : Number(current.amount);
        const newDiscount = updates.discount !== undefined ? updates.discount : Number(current.discount);
        const newValueUnit = updates.valueUnit !== undefined ? updates.valueUnit : Number(current.value_unit || 0);

        // Calculation: amount * value_unit * discount
        const valueTotal = newAmount * newValueUnit * (newDiscount || 1);

        const dbUpdates: any = {
            amount: newAmount,
            discount: newDiscount,
            value_total: valueTotal,
            updated_at: new Date().toISOString(),
            updated_user_id: undefined // Could be added if needed
        };

        if (updates.valueUnit !== undefined) {
            dbUpdates.value_unit = newValueUnit;
        }

        const { error } = await supabase
            .from('orders_visits_services')
            .update(dbUpdates)
            .eq('id', ovServiceId);

        if (error) {
            console.error('Error updating service:', error);
            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // ORDER VISIT ASSET ACTIVITIES (orders_visits_assets_activities)
    // -------------------------------------------------------------------------

    async getActivitiesByOrderType(orderTypeId: string): Promise<Activity[]> {
        // 1. Fetch bridge table records
        const { data: bridgeData, error: bridgeError } = await supabase
            .from('cfg_orders_types_activities')
            .select('activity_id')
            .eq('o_type_id', parseInt(orderTypeId))
            .eq('is_available', true);

        if (bridgeError || !bridgeData || bridgeData.length === 0) {
            if (bridgeError) console.error('Error fetching activities bridge:', bridgeError);
            return [];
        }

        const activityIds = bridgeData.map(b => b.activity_id);

        // 2. Fetch actual activities
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('cfg_activities')
            .select('*')
            .in('id', activityIds)
            .eq('is_available', true)
            .order('description', { ascending: true });

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
            return [];
        }

        return (activitiesData || []).map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            code: item.code,
            isAvailable: item.is_available
        }));
    },

    async getOrderVisitAssetActivities(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        // 1. Fetch bridge records
        const { data: bridgeData, error: bridgeError } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('is_deleted', false);

        if (bridgeError || !bridgeData || bridgeData.length === 0) {
            if (bridgeError) console.error('Error fetching asset activities bridge:', bridgeError);
            return [];
        }

        const activityIds = bridgeData.map(b => b.activity_id);

        // 2. Fetch activities to get descriptions
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('cfg_activities')
            .select('id, description, code')
            .in('id', activityIds);

        if (activitiesError) {
            console.error('Error fetching activities for descriptions:', activitiesError);
            return bridgeData.map((item: any) => ({
                id: item.id.toString(),
                orderVisitAssetId: item.order_visit_asset_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at
            }));
        }

        const activityMap = new Map<string, any>(activitiesData.map((a: any) => [a.id.toString(), a]));

        return bridgeData.map((item: any) => {
            const activity = activityMap.get(item.activity_id.toString());
            return {
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                activityDescription: activity?.description,
                activityCode: activity?.code,
                maintenancePlanId: item.maintenance_plan_id?.toString()
            };
        });
    },

    async toggleOrderVisitAssetActivity(ovAssetId: string, activityId: string, userId: string, isSelected: boolean): Promise<void> {
        if (isSelected) {
            // Check if it already exists (could be deleted)
            const { data: existing } = await supabase
                .from('orders_visits_assets_activities')
                .select('id')
                .eq('ova_id', parseInt(ovAssetId))
                .eq('activity_id', parseInt(activityId))
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('orders_visits_assets_activities')
                    .update({ is_deleted: false, updated_at: getBrazilTimestamp(), updated_user_id: parseInt(userId) })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('orders_visits_assets_activities')
                    .insert({
                        ova_id: parseInt(ovAssetId),
                        activity_id: parseInt(activityId),
                        created_user_id: parseInt(userId),
                        created_at: getBrazilTimestamp(),
                        is_deleted: false
                    });
            }
        } else {
            await supabase
                .from('orders_visits_assets_activities')
                .update({ is_deleted: true, updated_at: getBrazilTimestamp(), updated_user_id: parseInt(userId) })
                .eq('ova_id', parseInt(ovAssetId))
                .eq('activity_id', parseInt(activityId));
        }
    },

    async getOrderVisitAssetsActivitiesByVisit(visitId: string): Promise<OrderVisitAssetActivity[]> {
        // 1. Get all asset IDs for this visit
        const { data: assets, error: assetsError } = await supabase
            .from('orders_visits_assets')
            .select('id')
            .eq('ov_id', parseInt(visitId));

        if (assetsError || !assets || assets.length === 0) {
            if (assetsError) console.error('Error fetching assets for activities:', assetsError);
            return [];
        }

        const ovaIds = assets.map(a => a.id);

        // 2. Fetch all activities results for these ovaIds (WITHOUT JOINS to avoid PGRST200)
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .in('ova_id', ovaIds)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching activities records:', error);
            return [];
        }

        // 3. Fetch all cfg_activities to manual merge (to bypass broken FKs in cache)
        const activityIds = Array.from(new Set(data.map(item => item.activity_id)));
        const { data: cfgActivities, error: cfgError } = await supabase
            .from('cfg_activities')
            .select('id, description, code')
            .in('id', activityIds);

        const activitiesMap: Record<string, any> = (cfgActivities || []).reduce((acc, curr) => {
            acc[curr.id.toString()] = curr;
            return acc;
        }, {} as any);

        return (data || []).map((item: any) => {
            const activityInfo = activitiesMap[item.activity_id.toString()];
            return {
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                activityDescription: activityInfo?.description,
                activityCode: activityInfo?.code,
                status: item.status,
                comments: item.comments,
                imgFilePath: item.img_file_path,
                imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
                maintenancePlanId: item.maintenance_plan_id?.toString()
            };
        });
    },

    // -------------------------------------------------------------------------
    // MATERIALS BY VISIT
    // -------------------------------------------------------------------------

    async getOrderVisitAssetsMaterialsByVisit(visitId: string): Promise<OrderVisitAssetMaterial[]> {
        // 1. Get all asset IDs for this visit
        const { data: assets, error: assetsError } = await supabase
            .from('orders_visits_assets')
            .select('id')
            .eq('ov_id', parseInt(visitId));

        if (assetsError || !assets || assets.length === 0) {
            if (assetsError) console.error('Error fetching assets for materials:', assetsError);
            return [];
        }

        const ovaIds = assets.map(a => a.id);

        // 2. Fetch materials records (WITHOUT JOINS)
        const { data, error } = await supabase
            .from('orders_visits_assets_materials')
            .select('*')
            .in('ova_id', ovaIds)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching materials records:', error);
            return [];
        }

        // 3. Fetch materials catalog info for manual merge
        const materialIds = Array.from(new Set(data.map(item => item.material_id)));
        const { data: materialsCatalog, error: matError } = await supabase
            .from('materials')
            .select('*')
            .in('id', materialIds);

        const materialsMap: Record<string, any> = (materialsCatalog || []).reduce((acc, curr) => {
            acc[curr.id.toString()] = curr;
            return acc;
        }, {} as any);

        return (data || []).map((item: any) => {
            const matInfo = materialsMap[item.material_id.toString()];
            return {
                id: item.id.toString(),
                ovaId: item.ova_id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                materialId: item.material_id.toString(),
                amount: item.amount,
                valueUnit: item.value_unit,
                discount: item.discount,
                valueTotal: item.value_total,
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                materialDescription: matInfo?.description,
                materialCode: matInfo?.code,
                materialUnit: matInfo?.unit
            };
        });
    },

    // -------------------------------------------------------------------------
    // CLOSE VISIT
    // -------------------------------------------------------------------------

    async closeOrderVisit(
        visitId: string,
        orderId: string,
        statusId: number,
        statusDescription: string,
        suspendedReasonId: string | null,
        progress: number,
        user: User
    ): Promise<void> {
        // 1. Validate Vehicles
        const { data: vehicles, error: vehError } = await supabase
            .from('orders_visits_vehicles')
            .select('*')
            .eq('ov_id', visitId);

        if (vehError) throw vehError;

        if (vehicles && vehicles.length > 0) {
            const hasInvalid = vehicles.some(v =>
                v.recorder_start === null ||
                v.recorder_end === null ||
                Number(v.recorder_start) >= Number(v.recorder_end)
            );

            if (hasInvalid) {
                throw new Error('Existem veículos com apontamento inválido ou incompleto (Km Inicial >= Km Final).');
            }
        }

        const timestamp = getBrazilTimestamp();

        // 2. Update Order Visit
        const visitUpdate: any = {
            ov_ended_at: timestamp,
            ov_status_id: 2, // Encerrada
            ov_o_status_id: statusId,
            ov_o_progress: statusId === 8 ? 1 : (progress / 100)
        };

        if (statusId === 6 && suspendedReasonId) {
            visitUpdate.ov_o_suspended_reason_id = parseInt(suspendedReasonId);
        }

        const { error: visitUpdateError } = await supabase
            .from('orders_visits')
            .update(visitUpdate)
            .eq('id', visitId);
        if (visitUpdateError) throw visitUpdateError;

        // 3. Update Order
        const orderUpdate: any = {
            status_id: statusId,
            status_at: timestamp,
            progress: statusId === 8 ? 1 : (progress / 100)
        };

        if (statusId === 6 && suspendedReasonId) {
            orderUpdate.cause_reason_id = parseInt(suspendedReasonId);
        }

        const { data: order, error: orderUpdateError } = await supabase
            .from('orders')
            .update(orderUpdate)
            .eq('id', orderId)
            .select('parent_id, order_mask, requested_services, client_id, unit_id, asset_tag_id, asset_tag_sub_id')
            .single();

        if (orderUpdateError) throw orderUpdateError;

        // 3.1 Se for uma OS filha, atualiza a situação da SS pai
        if (order && order.parent_id) {
            await ordersService.updateServiceRequestStatus(order.parent_id.toString());
        }

        // 4. Release Team
        const ovId = parseInt(visitId);
        let { data: team } = await supabase
            .from('orders_visits_teams')
            .select('user_id')
            .eq('ov_id', ovId);

        if (!team || team.length === 0) {
            const { data: stuckUsers } = await supabase
                .from('users')
                .select('id')
                .eq('ov_id_in_progress', ovId);

            if (stuckUsers && stuckUsers.length > 0) {
                team = stuckUsers.map(u => ({ user_id: u.id }));
            }
        }

        if (team && team.length > 0) {
            const userIds = team.map(t => t.user_id);
            const { error: usersError } = await supabase
                .from('users')
                .update({
                    is_available: true,
                    ov_in_progress_leader_id: 0,
                    o_contract_id_in_progress: 0,
                    o_type_id_in_progress: 0,
                    o_type_sub_id_in_progress: 0,
                    o_plan_id_in_progress: 0,
                    o_asset_tag_id_in_progress: 0,
                    o_unit_id_in_progress: 0,
                    o_system_id_in_progress: 0,
                    o_system_parent_id_in_progress: 0,
                    o_unit_type_id_in_progress: 0,
                    o_unit_type_parent_id_in_progress: 0,
                    o_object_id_in_progress: 0,
                    ov_id_in_progress: 0,
                    o_id_in_progress: 0,
                    op_id_in_progress: 0,
                    is_ov_in_progress: false,
                    ov_id_in_progress_mask: null,
                    updated_at: timestamp
                })
                .in('id', userIds);

            if (usersError) throw usersError;
        }

        // 5. Notifications
        if (order && order.parent_id) {
            const { data: followers } = await supabase
                .from('orders_followers')
                .select('user_id')
                .eq('o_id', order.parent_id);

            if (followers && followers.length > 0) {
                const [clientRes, unitRes, tagRes, tagSubRes, followerUsersRes] = await Promise.all([
                    supabase.from('v_companies').select('name:description').eq('id', order.client_id).single(),
                    supabase.from('units').select('description').eq('id', order.unit_id).single(),
                    order.asset_tag_id ? supabase.from('cfg_assets_tags').select('description').eq('id', order.asset_tag_id).single() : { data: null },
                    order.asset_tag_sub_id ? supabase.from('cfg_assets_tags_subs').select('description').eq('id', order.asset_tag_sub_id).single() : { data: null },
                    supabase.from('users').select('id, mobile_whatsapp').in('id', followers.map(f => f.user_id))
                ]);

                const clientName = clientRes.data?.name || 'N/A';
                const unitDesc = unitRes.data?.description || 'N/A';
                const assetTag = tagRes.data?.description || '';
                const assetTagSub = tagSubRes.data?.description || '';
                const followerUsers = followerUsersRes.data || [];

                const notifications = followers.map(f => {
                    const fUser = followerUsers.find(u => u.id === f.user_id);
                    return {
                        user_id_to: f.user_id,
                        user_id_from: user.id,
                        title: 'Visita encerrada.',
                        body: `${user.nameShort || user.nameFull} encerrou a visita:\nOS ${order.order_mask}: ${statusDescription}\nCliente: ${clientName}\nUnidade: ${unitDesc}\nSetor/Posição: ${assetTag}${assetTagSub ? '/' + assetTagSub : ''}\nServicos a realizar: ${order.requested_services || ''}`,
                        type: 'Visita encerrada',
                        created_at: timestamp,
                        is_read: false,
                        user_to_whatsapp: fUser?.mobile_whatsapp
                    };
                });

                await supabase.from('users_notifications').insert(notifications);
            }
        }
    },

    // -------------------------------------------------------------------------
    // BULK MERGED
    // -------------------------------------------------------------------------

    async getOrdersVisitsServicesMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_services')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk services:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsMaterialsMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_assets_materials')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk materials:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsVehiclesMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_vehicles')
            .select('*')
            .in('ov_id', ovIds);
        if (error) {
            console.error('Error fetching bulk vehicles:', error);
            return [];
        }
        return data || [];
    },

    async getOrdersVisitsAssetsMovedMerged(ovIds: string[]): Promise<any[]> {
        if (!ovIds.length) return [];
        const { data, error } = await supabase
            .from('v_orders_visits_assets')
            .select('*')
            .in('ov_id', ovIds)
            .eq('is_moved', true);

        if (error) {
            console.error('Error fetching moved assets:', error);
            return [];
        }

        const ensureArray = (val: any): string[] => {
            if (Array.isArray(val)) {
                if (val.length === 1 && typeof val[0] === 'string' && val[0].startsWith('[')) {
                    try {
                        const parsed = JSON.parse(val[0]);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) {
                        // fallback
                    }
                }
                return val;
            }
            if (typeof val === 'string' && val.trim()) {
                if (val.startsWith('{') && val.endsWith('}')) {
                    return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                }
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    return [val];
                }
            }
            return [];
        };

        return (data || []).map((item: any) => {
            const beforeFiles = ensureArray(item.before_img_files_names || item.before_img_file_name);
            const afterFiles = ensureArray(item.after_img_files_names || item.after_img_file_name);
            const oCompanyId = item.o_company_id || item.company_id || '0';
            const assetId = item.asset_id || '0';

            return {
                id: item.id,
                isMoved: item.is_moved,
                assetTypeId: item.asset_type_id,
                assetTypeDescription: item.asset_type_description || 'N/A',
                code: item.code || '',
                description: item.description || '',
                brand: item.brand,
                model: item.model,
                serial: item.serial,
                beforeUnitDescription: item.before_unit_description || '',
                afterUnitDescription: item.after_unit_description || '',
                beforeTagDescription: item.before_tag_description || '',
                afterTagDescription: item.after_tag_description || '',
                beforeTagSubDescription: item.before_tag_sub_description || '',
                afterTagSubDescription: item.after_tag_sub_description || '',
                beforeStatusDescription: item.before_status_description || '',
                afterStatusDescription: item.after_status_description || '',
                beforeStatusAt: item.before_status_at,
                afterStatusAt: item.after_status_at,
                beforeStatusColor: item.status_color || item.before_status_color || '',
                afterStatusColor: item.after_status_color || '',
                beforeClientName: item.before_client_name || '',
                afterClientName: item.after_client_name || '',
                movedComments: item.moved_comments || '',
                ovMask: item.ov_mask || '',
                orderMask: item.o_mask || item.order_mask || '',
                imgUrl: beforeFiles.length > 0 ?
                    getPublicImageUrl(item.before_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, beforeFiles[0]) : undefined,
                afterImgUrl: afterFiles.length > 0 ?
                    getPublicImageUrl(item.after_img_file_path || `companies/${oCompanyId}/assets/${assetId}`, afterFiles[0]) : undefined,
            };
        });
    },

    // -------------------------------------------------------------------------
    // REPORT / REVISE / APPROVE
    // -------------------------------------------------------------------------

    async reportOrderVisit(visitId: string, userId: string): Promise<void> {
        // 1. Verificar se a visita existe e está em rascunho (processing_id = 1) ou rejeitada (4)
        const { data: visit, error: visitError } = await supabase
            .from('orders_visits')
            .select('ov_processing_id')
            .eq('id', visitId)
            .single();

        if (visitError || !visit) {
            throw new Error('Visita não encontrada');
        }

        if (visit.ov_processing_id !== 1 && visit.ov_processing_id !== 4) {
            throw new Error('Apenas visitas em rascunho ou rejeitadas podem ser reportadas');
        }

        // 2. Verificar o status dos ativos baseado no estado da visita
        const { data: assets, error: assetsError } = await supabase
            .from('v_orders_visits_assets')
            .select('processing_id')
            .eq('ov_id', visitId);

        if (assetsError) {
            throw new Error('Erro ao verificar ativos da visita');
        }

        // Se houver ativos, aplicar a regra de validação
        if (assets && assets.length > 0) {
            if (visit.ov_processing_id === 1) {
                // Se a visita for rascunho, TODOS os ativos devem estar reportados (2)
                const hasUnreportedAssets = assets.some((asset: any) => asset.processing_id !== 2);
                if (hasUnreportedAssets) {
                    throw new Error('Todos os ativos devem estar reportados antes de reportar a visita');
                }
            } else if (visit.ov_processing_id === 4) {
                // Se a visita foi rejeitada, NENHUM ativo pode estar rejeitado (4)
                const hasRejectedAssets = assets.some((asset: any) => asset.processing_id === 4);
                if (hasRejectedAssets) {
                    throw new Error('Não é possível reportar a visita enquanto houver ativos rejeitados');
                }
            }
        }

        // 3. Atualizar a visita
        const timestamp = getBrazilTimestamp();
        const { error: updateError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 2,
                ov_reported_user_id: Number(userId),
                ov_reported_at: timestamp
            })
            .eq('id', visitId);

        if (updateError) {
            console.error('Error reporting visit:', updateError);
            throw new Error('Erro ao reportar visita');
        }
    },

    /**
     * Marca uma visita como REVISADA (3), validando que TODOS os seus ativos já estão REVISADOS.
     * Visível/acionável quando: visita está REPORTADA (2) e ovAssetsAmount === ovAssetsRevisedAmount.
     * @param visitId ID da visita
     * @param userId ID do usuário que está marcando como revisada
     */
    async markOrderVisitAsRevised(visitId: string, userId: string): Promise<void> {
        const visitIdNum = parseInt(visitId, 10);

        // 1. Buscar a visita
        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('id, o_id, ov_processing_id, ov_mask, ov_team_leader_id')
            .eq('id', visitIdNum)
            .single();

        if (visitError || !visit) {
            console.error('markOrderVisitAsRevised: visit not found', { visitId, visitError });
            throw new Error('Visita não encontrada');
        }

        // 2. Só é possível revisar uma visita REPORTADA (2)
        if (Number(visit.ov_processing_id) !== 2) {
            throw new Error('Apenas visitas reportadas podem ser marcadas como revisadas');
        }

        // 3. Validar que TODOS os ativos estão com processing_id = 3 (REVISADA).
        const { data: assets, error: assetsError } = await supabase
            .from('v_orders_visits_assets')
            .select('processing_id')
            .eq('ov_id', visitIdNum);

        if (assetsError) {
            console.error('markOrderVisitAsRevised: assets fetch error', assetsError);
            throw new Error('Erro ao verificar ativos da visita');
        }

        const totalAssets = (assets || []).length;
        const revisedAssets = (assets || []).filter((a: any) => Number(a.processing_id) === 3).length;

        if (totalAssets === 0) {
            throw new Error('A visita não possui ativos para revisar');
        }
        if (revisedAssets !== totalAssets) {
            throw new Error(`Todos os ativos precisam estar revisados (${revisedAssets}/${totalAssets} revisados)`);
        }

        // 4. Atualizar a visita para processing_id = 3 (REVISADA)
        const timestamp = getBrazilTimestamp();
        const { error: updateError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 3,
                ov_revised_user_id: Number(userId),
                ov_revised_at: timestamp
            })
            .eq('id', visitIdNum);

        if (updateError) {
            console.error('Error marking visit as revised:', updateError);
            throw new Error('Erro ao marcar visita como revisada');
        }

        // 5. Notificar o líder da equipe
        try {
            if (visit.ov_team_leader_id) {
                const { data: currentUser } = await supabase
                    .from('users')
                    .select('name_short, name_full')
                    .eq('id', userId)
                    .single();

                const reviewerName = currentUser?.name_short || currentUser?.name_full || 'Supervisor';
                const visitMask = visit.ov_mask || 'N/A';

                await supabase.from('users_notifications').insert({
                    user_id_to: visit.ov_team_leader_id,
                    user_id_from: Number(userId),
                    title: 'Visita Revisada',
                    body: `${reviewerName} revisou a visita ${visitMask}. Todos os ativos foram conferidos.`,
                    type: 'Visita Revisada',
                    created_at: timestamp,
                    is_read: false,
                    o_id: visit.o_id
                });
            }
        } catch (notifErr) {
            console.error('Error sending notification for visit revision:', notifErr);
        }
    },

    async updateOrderVisitProcessing(visitId: string, processingId: number, userId: string, extraData?: { statusId: number; progress: number; suspendedReasonId?: number | null }): Promise<void> {
        const timestamp = getBrazilTimestamp();
        const payload: any = {
            ov_processing_id: processingId
        };

        if (processingId === 5) {
            payload.ov_approved_user_id = parseInt(userId);
            payload.ov_approved_at = timestamp;
        }

        if (extraData) {
            payload.ov_o_status_id = extraData.statusId;
            payload.ov_o_progress = extraData.statusId === 8 ? 1 : (extraData.progress / 100);
            payload.ov_o_suspended_reason_id = extraData.statusId === 6 ? (extraData.suspendedReasonId || null) : null;
        }

        const { error } = await supabase
            .from('orders_visits')
            .update(payload)
            .eq('id', parseInt(visitId));

        if (error) {
            console.error('Error updating visit processing:', error);
            throw new Error('Erro ao atualizar processamento da visita');
        }
    },

    async disapproveOrderVisit(visitId: string, userId: string): Promise<void> {
        // 1. Get visit details for notification
        const { data: visit, error: fetchError } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('id', visitId)
            .single();

        if (fetchError || !visit) throw fetchError || new Error('Visita não encontrada');

        const now = getBrazilTimestamp();

        // 2. Update the visit status
        const { error: updateError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 4, // Ajuste / Rejeitado
                ov_disapproved_at: now,
                ov_disapproved_user_id: parseInt(userId)
            })
            .eq('id', parseInt(visitId));

        if (updateError) throw updateError;

        // 3. Send Notification to Team Leader
        try {
            if (visit.ov_team_leader_id) {
                const { data: leaderUser } = await supabase.from('users').select('name_short, mobile_whatsapp').eq('id', visit.ov_team_leader_id).single();
                const { data: currentUser } = await supabase.from('users').select('name_short, name_full').eq('id', userId).single();

                const authorizingUserName = currentUser?.name_short || currentUser?.name_full || 'Supervisor';
                const visitMask = visit.ov_mask || 'N/A';

                await supabase.from('users_notifications').insert({
                    user_id_to: visit.ov_team_leader_id,
                    user_id_from: parseInt(userId),
                    title: 'Visita Rejeitada para Ajuste',
                    body: `${authorizingUserName} rejeitou a visita ${visitMask} para ajustes.\nVerifique os ativos rejeitados no relatório técnico.`,
                    type: 'Visita Rejeitada',
                    created_at: now,
                    is_read: false,
                    o_id: visit.o_id,
                    user_to_whatsapp: leaderUser?.mobile_whatsapp
                });
            }
        } catch (notifErr) {
            console.error('Error sending notification for visit disapproval:', notifErr);
        }
    },

    async checkMovedAssetsForVisit(visitId: string): Promise<number> {
        const { count, error } = await supabase
            .from('orders_visits_assets')
            .select('*', { count: 'exact', head: true })
            .eq('ov_id', parseInt(visitId))
            .eq('is_moved', true);

        if (error) {
            console.error('Error checking moved assets for visit:', error);
            throw new Error('Erro ao verificar ativos movimentados');
        }
        return count || 0;
    },

    async reverseOrderVisitApproval(visitId: string): Promise<void> {
        // 1. Update all assets to processing_id = 2 (Reported)
        const { error: assetsError } = await supabase
            .from('orders_visits_assets')
            .update({ processing_id: 2 })
            .eq('ov_id', parseInt(visitId));

        if (assetsError) {
            console.error('Error reversing assets approval:', assetsError);
            throw new Error('Erro ao reverter aprovação dos ativos');
        }

        // 2. Update visit status to 2 (Reported) and clear approval audit fields
        const { error: visitError } = await supabase
            .from('orders_visits')
            .update({
                ov_processing_id: 2,
                ov_assets_approved_no_filed_amount: 0,
                ov_approved_at: null,
                ov_approved_user_id: null
            })
            .eq('id', parseInt(visitId));

        if (visitError) {
            console.error('Error reversing visit approval:', visitError);
            throw new Error('Erro ao reverter aprovação da visita');
        }

        // 3. Sync counters to be safe
        await visitsService.syncOrderVisitAssetsProcessing(visitId);
    },

    // -------------------------------------------------------------------------
    // TRACKER
    // -------------------------------------------------------------------------

    async getUserTrackerInterval(userId: string): Promise<number | null> {
        const { data, error } = await supabase
            .from('users')
            .select('tracker_interval_seconds')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching tracker interval:', error);
            return null;
        }

        return data?.tracker_interval_seconds ?? null;
    },

    // -------------------------------------------------------------------------
    // PREVENTIVE MAINTENANCE PLANS
    // -------------------------------------------------------------------------

    async getMaintenancePlans(assetTypeId?: string): Promise<MaintenancePlan[]> {
        let query = supabase.from('maintenances_plans').select('*').eq('is_deleted', false);
        if (assetTypeId) {
            query = query.or(`asset_type_id.eq.${assetTypeId},asset_type_id.is.null`);
        }
        const { data, error } = await query.order('description', { ascending: true });
        if (error) {
            console.error('Error fetching maintenance plans:', error);
            return [];
        }
        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            description: item.description,
            assetTypeId: item.asset_type_id?.toString(),
            isAvailable: item.is_available,
            isDeleted: item.is_deleted
        }));
    },

    async getMaintenancePlanById(id: string): Promise<MaintenancePlan | null> {
        const { data, error } = await supabase.from('maintenances_plans').select('*').eq('id', parseInt(id)).single();
        if (error || !data) return null;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async createMaintenancePlan(plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        const { data, error } = await supabase
            .from('maintenances_plans')
            .insert({
                code: plan.code,
                description: plan.description,
                asset_type_id: plan.assetTypeId ? parseInt(plan.assetTypeId) : null,
                is_available: plan.isAvailable !== undefined ? plan.isAvailable : true,
                created_user_id: parseInt(userId)
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async updateMaintenancePlan(id: string, plan: Partial<MaintenancePlan>, userId: string): Promise<MaintenancePlan> {
        const payload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (plan.code !== undefined) payload.code = plan.code;
        if (plan.description !== undefined) payload.description = plan.description;
        if (plan.assetTypeId !== undefined) payload.asset_type_id = plan.assetTypeId ? parseInt(plan.assetTypeId) : null;
        if (plan.isAvailable !== undefined) payload.is_available = plan.isAvailable;

        const { data, error } = await supabase
            .from('maintenances_plans')
            .update(payload)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            code: data.code,
            description: data.description,
            assetTypeId: data.asset_type_id?.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted
        };
    },

    async getMaintenancePlanSections(planId: string): Promise<MaintenancePlanSection[]> {
        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .select('*')
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('is_deleted', false)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id.toString(),
            maintenancePlanId: item.maintenance_plan_id.toString(),
            description: item.description,
            isAvailable: item.is_available,
            isDeleted: item.is_deleted,
            orderIndex: item.order_index
        }));
    },

    async createMaintenancePlanSection(section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        if (!section.maintenancePlanId) throw new Error("maintenancePlanId is required");

        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .insert({
                maintenance_plan_id: parseInt(section.maintenancePlanId),
                description: section.description,
                is_available: section.isAvailable !== undefined ? section.isAvailable : true,
                created_user_id: parseInt(userId),
                order_index: section.orderIndex || 0
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanId: data.maintenance_plan_id.toString(),
            description: data.description,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index
        };
    },

    async updateMaintenancePlanSection(id: string, section: Partial<MaintenancePlanSection>, userId: string): Promise<MaintenancePlanSection> {
        const payload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (section.description !== undefined) payload.description = section.description;
        if (section.isAvailable !== undefined) payload.is_available = section.isAvailable;
        if (section.orderIndex !== undefined) payload.order_index = section.orderIndex;
        if (section.isDeleted !== undefined) {
             payload.is_deleted = section.isDeleted;
             if(section.isDeleted) payload.deleted_user_id = parseInt(userId);
        }

        const { data, error } = await supabase
            .from('maintenances_plans_sections')
            .update(payload)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanId: data.maintenance_plan_id.toString(),
            description: data.description,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index
        };
    },

    async getMaintenancePlanSectionActivities(sectionId: string): Promise<MaintenancePlanSectionActivity[]> {
        const { data, error } = await supabase
            .from('maintenances_plans_sections_activities')
            .select('*, cfg_activities(description, code)')
            .eq('maintenance_plan_section_id', parseInt(sectionId))
            .eq('is_deleted', false)
            .order('order_index', { ascending: true });
        if (error) return [];
        return data.map((item: any) => ({
            id: item.id.toString(),
            maintenancePlanSectionId: item.maintenance_plan_section_id.toString(),
            activityId: item.activity_id.toString(),
            isAvailable: item.is_available,
            isDeleted: item.is_deleted,
            orderIndex: item.order_index,
            description: item.description,
            commentsDefault: item.comments_default,
            activityDescription: item.cfg_activities?.description,
            activityCode: item.cfg_activities?.code
        }));
    },

    async createMaintenancePlanSectionActivity(sectionId: string, activityId: string, userId: string, orderIndex?: number, description?: string, commentsDefault?: string): Promise<MaintenancePlanSectionActivity> {
        // We use upsert to avoid duplicate keys issues if deleted and re-added
        const payload: any = {
            maintenance_plan_section_id: parseInt(sectionId),
            activity_id: parseInt(activityId),
            created_user_id: parseInt(userId),
            is_deleted: false,
            is_available: true,
            order_index: orderIndex || 0,
            description: description,
            comments_default: commentsDefault
        };

        const { data, error } = await supabase
            .from('maintenances_plans_sections_activities')
            .upsert(payload, { onConflict: 'maintenance_plan_section_id,activity_id' })
            .select('*, cfg_activities(description, code)')
            .single();

        if (error) throw error;
        return {
            id: data.id.toString(),
            maintenancePlanSectionId: data.maintenance_plan_section_id.toString(),
            activityId: data.activity_id.toString(),
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            orderIndex: data.order_index,
            description: data.description,
            commentsDefault: data.comments_default,
            activityDescription: data.cfg_activities?.description,
            activityCode: data.cfg_activities?.code
        };
    },

    async updateMaintenancePlanSectionActivity(id: string, payload: Partial<MaintenancePlanSectionActivity>, userId: string): Promise<void> {
        const dbPayload: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (payload.orderIndex !== undefined) dbPayload.order_index = payload.orderIndex;
        if (payload.description !== undefined) dbPayload.description = payload.description;
        if (payload.commentsDefault !== undefined) dbPayload.comments_default = payload.commentsDefault;
        if (payload.isDeleted !== undefined) {
             dbPayload.is_deleted = payload.isDeleted;
             if(payload.isDeleted) dbPayload.deleted_user_id = parseInt(userId);
        }

        const { error } = await supabase
            .from('maintenances_plans_sections_activities')
            .update(dbPayload)
            .eq('id', parseInt(id));

        if (error) throw error;
    },

    async removeMaintenancePlanSectionActivity(sectionActivityId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('maintenances_plans_sections_activities')
            .update({
                is_deleted: true,
                deleted_user_id: parseInt(userId),
                deleted_at: getBrazilTimestamp()
            })
            .eq('id', parseInt(sectionActivityId));

        if (error) throw error;
    },

    // To load checklist for an asset visit (fetch all activities filled out with maintenance_plan_id)
    async getMaintenanceChecklistItemsByVisit(ovAssetId: string): Promise<OrderVisitAssetActivity[]> {
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .not('maintenance_plan_id', 'is', null)
            .neq('maintenance_plan_id', 0)
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching visit checklist items:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            orderVisitAssetId: item.ova_id.toString(),
            activityId: item.activity_id.toString(),
            isDeleted: item.is_deleted,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            maintenancePlanId: item.maintenance_plan_id?.toString(),
            status: item.status,
            imgFilePath: item.img_file_path,
            imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
            comments: item.comments
        }));
    },

    async getMaintenanceChecklistItems(ovAssetId: string, planId: string): Promise<OrderVisitAssetActivity[]> {
        const { data, error } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('is_deleted', false);

        if (error) {
            console.error('Error fetching maintenance checklist items:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            orderVisitAssetId: item.ova_id.toString(),
            activityId: item.activity_id.toString(),
            isDeleted: item.is_deleted,
            createdUserId: item.created_user_id?.toString(),
            createdAt: item.created_at,
            maintenancePlanId: item.maintenance_plan_id?.toString(),
            status: item.status,
            imgFilePath: item.img_file_path,
            imgFilesNames: item.img_files_names,
            comments: item.comments
        }));
    },

    // To load checklist history for an asset across all visits
    async getGlobalMaintenanceChecklistItems(assetId: string, planId: string, currentOvaId?: string): Promise<OrderVisitAssetActivity[]> {
        try {
            // Fetch all OrderVisitAsset records for this asset and plan, ordered by ID DESC (latest first)
            const { data: ovaRecords, error: ovaError } = await supabase
                .from('orders_visits_assets')
                .select('id')
                .eq('asset_id', parseInt(assetId))
                .eq('maintenance_plan_id', parseInt(planId))
                .eq('is_deleted', false)
                .order('id', { ascending: false });

            if (ovaError || !ovaRecords || ovaRecords.length === 0) {
                return [];
            }

            // Exclude current visit
            const previousOvas = currentOvaId
                ? ovaRecords.filter(r => r.id.toString() !== currentOvaId.toString())
                : ovaRecords;

            if (previousOvas.length === 0) return [];

            // Limit to the last 50 visits to avoid huge IN queries
            const previousOvaIds = previousOvas.map(r => r.id).slice(0, 50);

            // Fetch activities for all selected previous OVAs, only where status is filled
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .select('*')
                .in('ova_id', previousOvaIds)
                .eq('maintenance_plan_id', parseInt(planId))
                .not('status', 'is', null)
                .order('ova_id', { ascending: false });

            if (error) {
                console.error('Error fetching global maintenance checklist items:', error);
                return [];
            }

            // Filter to keep only the absolute most recent status for each activity
            const latestActivitiesMap = new Map<number, any>();
            for (const item of data || []) {
                if (!latestActivitiesMap.has(item.activity_id)) {
                    latestActivitiesMap.set(item.activity_id, item);
                }
            }

            return Array.from(latestActivitiesMap.values()).map((item: any) => ({
                id: item.id.toString(),
                orderVisitAssetId: item.ova_id.toString(),
                activityId: item.activity_id.toString(),
                isDeleted: item.is_deleted,
                createdUserId: item.created_user_id?.toString(),
                createdAt: item.created_at,
                maintenancePlanId: item.maintenance_plan_id?.toString(),
                status: item.status,
                imgFilePath: item.img_file_path,
                imgFilesNames: Array.isArray(item.img_files_names) ? item.img_files_names : (typeof item.img_files_names === 'string' ? JSON.parse(item.img_files_names) : []),
                comments: item.comments
            }));
        } catch (error) {
            console.error('Catch in getGlobalMaintenanceChecklistItems:', error);
            return [];
        }
    },

    async updateOrderVisitAssetPlan(ovAssetId: string, planId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({ maintenance_plan_id: planId ? parseInt(planId) : null })
            .eq('id', parseInt(ovAssetId));

        if (error) {
            console.error('Error updating order visit asset plan:', error);
            throw error;
        }
    },

    async updateOrderVisitAssetProgress(ovAssetId: string, progress: number): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets')
            .update({ maintenance_plan_progress: progress })
            .eq('id', parseInt(ovAssetId));

        if (error) {
            console.error('Error updating order visit asset progress:', error);
            throw error;
        }
    },

    async upsertMaintenanceChecklistItem(
        ovAssetId: string,
        planId: string,
        activityId: string,
        userId: string,
        updates: {
            status?: 'OK' | 'NOK' | 'NA' | null,
            comments?: string,
            imgFilePath?: string,
            imgFilesNames?: any
        }
    ): Promise<OrderVisitAssetActivity | null> {
        const dbUpdates: any = {
            updated_user_id: parseInt(userId),
            updated_at: getBrazilTimestamp()
        };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
        if (updates.imgFilePath !== undefined) dbUpdates.img_file_path = updates.imgFilePath;
        if (updates.imgFilesNames !== undefined) dbUpdates.img_files_names = updates.imgFilesNames;

        const { data: existing } = await supabase
            .from('orders_visits_assets_activities')
            .select('id')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId))
            .maybeSingle();

        let resultData = null;

        if (existing) {
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .update({ ...dbUpdates, is_deleted: false })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        } else {
            const { data, error } = await supabase
                .from('orders_visits_assets_activities')
                .insert({
                    ova_id: parseInt(ovAssetId),
                    activity_id: parseInt(activityId),
                    maintenance_plan_id: parseInt(planId),
                    created_user_id: parseInt(userId),
                    created_at: getBrazilTimestamp(),
                    is_deleted: false,
                    ...dbUpdates
                })
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        }

        if (resultData) {
            return {
                id: resultData.id.toString(),
                orderVisitAssetId: resultData.ova_id.toString(),
                activityId: resultData.activity_id.toString(),
                isDeleted: resultData.is_deleted,
                createdUserId: resultData.created_user_id?.toString(),
                createdAt: resultData.created_at,
                maintenancePlanId: resultData.maintenance_plan_id?.toString(),
                status: resultData.status,
                imgFilePath: resultData.img_file_path,
                imgFilesNames: Array.isArray(resultData.img_files_names) ? resultData.img_files_names : (typeof resultData.img_files_names === 'string' ? JSON.parse(resultData.img_files_names) : []),
                comments: resultData.comments
            };
        }
        return null;
    },

    async deleteMaintenanceChecklistItem(ovAssetId: string, planId: string, activityId: string): Promise<void> {
        const { error } = await supabase
            .from('orders_visits_assets_activities')
            .delete()
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId));

        if (error) {
            console.error('Error deleting maintenance checklist item:', error);
            throw error;
        }
    },

    async uploadChecklistImage(ovAssetId: string, activityId: string, file: File, companyId?: string, assetId?: string, onProgress?: (progress: number) => void): Promise<{ path: string; filename: string }> {
        // Ensure file extension is standard
        let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpeg';
        if (fileExt === 'jpg') fileExt = 'jpeg';

        const uniqueSuffix = Math.random().toString(36).substring(7);

        // Ensure no spaces or special characters in IDs and paths
        const cleanOvAssetId = String(ovAssetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanActivityId = String(activityId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCompanyId = String(companyId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanAssetId = String(assetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');

        const fileName = `checklist_${cleanOvAssetId}_${cleanActivityId}_${Date.now()}_${uniqueSuffix}.${fileExt}`;

        // Pattern: companies/{companyId}/assets/{assetId}
        const folderPath = (cleanCompanyId && cleanAssetId && cleanCompanyId !== 'undefined' && cleanAssetId !== 'undefined')
            ? `companies/${cleanCompanyId}/assets/${cleanAssetId}`
            : `checklist/${cleanOvAssetId}/${cleanActivityId}`;

        const fullPath = `${folderPath}/${fileName}`.replace(/\s+/g, '_');

        // We use a new File object if we need to force the MIME type, but r2Service just needs the blob and path
        await r2Service.uploadFile(file, fullPath, onProgress);
        return { path: folderPath, filename: fileName };
    },

    async removeChecklistImage(ovAssetId: string, planId: string, activityId: string, fileName: string, userId: string): Promise<OrderVisitAssetActivity | null> {
        // 1. Fetch current record
        const { data: existing, error: fetchError } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId))
            .maybeSingle();

        if (fetchError || !existing) throw fetchError || new Error('Item de checklist não encontrado');

        // 2. Filter out the specific file
        const currentList: string[] = existing.img_files_names || [];
        const newList = currentList.filter(f => f !== fileName);

        // 3. Try to delete from R2
        try {
            // Replicate the path logic from the component/upload to ensure consistency
            const folderPath = existing.img_file_path || `checklist/${ovAssetId}/${activityId}`;
            const fullPath = `${folderPath}/${fileName}`.replace(/\/+/g, '/');

            await r2Service.deleteFile(fullPath);
        } catch (r2Error) {
            console.warn('Não foi possível excluir do R2, continuando com atualização do Banco:', r2Error);
        }

        // 4. Update DB
        return await visitsService.upsertMaintenanceChecklistItem(ovAssetId, planId, activityId, userId, {
            imgFilesNames: newList
        });
    },

    // -------------------------------------------------------------------------
    // AVAILABILITY
    // -------------------------------------------------------------------------

    async getAssetAvailabilityHistory7Days(unitAssetTagId: string, offsetDays: number = 0): Promise<{ date: string; isAvailable: boolean | null }[]> {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - offsetDays);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // 7 days total inclusive
        startDate.setHours(0, 0, 0, 0);

        // 1. Obter chaves estrangeiras do ativo
        const { data: tagData, error: tagError } = await supabase
            .from('v_units_assets_tags')
            .select('unit_id, asset_tag_id, asset_tag_sub_id')
            .eq('id', parseInt(unitAssetTagId))
            .single();

        if (tagError || !tagData) {
            console.error('Error fetching asset keys:', tagError);
            return [];
        }

        // 2. Buscar histórico usando as chaves
        let query = supabase
            .from('v_assets_available')
            .select('is_available, reported_at')
            .eq('unit_id', tagData.unit_id)
            .eq('asset_tag_id', tagData.asset_tag_id)
            .gte('reported_at', startDate.toISOString())
            .lte('reported_at', endDate.toISOString());

        if (tagData.asset_tag_sub_id != null) {
            query = query.eq('asset_tag_sub_id', tagData.asset_tag_sub_id);
        } else {
            query = query.is('asset_tag_sub_id', null);
        }

        const { data, error } = await query.order('reported_at', { ascending: false });

        if (error) {
            console.error('Error fetching availability history:', error);
            return [];
        }

        // Process in JS: since data is ordered DESC, the first record for a given day is the latest of that day
        const historyMap = new Map<string, boolean>();

        for (const record of (data || [])) {
            const dateStr = String(record.reported_at).substring(0, 10);
            if (!historyMap.has(dateStr)) {
                historyMap.set(dateStr, record.is_available);
            }
        }

        // Build array of exactly 7 days
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            result.push({
                date: dateStr,
                isAvailable: historyMap.has(dateStr) ? historyMap.get(dateStr)! : null
            });
        }

        return result;
    },

    async getAssetAvailabilityForExport(unitId: string, startDate: string, endDate: string, assetTagId?: string, assetTagSubId?: string): Promise<any[]> {
        let query = supabase
            .from('v_assets_available')
            .select('*')
            .eq('unit_id', parseInt(unitId))
            .gte('reported_at', startDate)
            .lte('reported_at', endDate + ' 23:59:59');

        if (assetTagId && assetTagId !== 'all') {
            query = query.eq('asset_tag_id', parseInt(assetTagId));
        }

        if (assetTagSubId && assetTagSubId !== 'all') {
            query = query.eq('asset_tag_sub_id', parseInt(assetTagSubId));
        }

        const { data, error } = await query
            .order('unit_description', { ascending: true })
            .order('tag_description', { ascending: true })
            .order('tag_sub_description', { ascending: true })
            .order('reported_at', { ascending: true });

        if (error) {
            console.error('Error fetching export data:', error);
            return [];
        }

        return data || [];
    },

    // -------------------------------------------------------------------------
    // MANUS INTEGRATION
    // -------------------------------------------------------------------------

    /**
     * Verifica se um contrato usa integração com Manus
     */
    async checkContractUsesManus(contractId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('is_use_manus')
                .eq('id', contractId)
                .single();

            if (error) {
                console.error('Error checking contract Manus flag:', error);
                return false;
            }

            return data?.is_use_manus || false;
        } catch (error) {
            console.error('Error checking contract Manus flag:', error);
            return false;
        }
    },

    /**
     * Busca dados de uma visita no sistema Manus
     */
    async getManusVisitData(visitId: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('manus_visits')
                .select('*')
                .eq('visit_id', visitId)
                .single();

            if (error) {
                console.error('Error fetching Manus visit data:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching Manus visit data:', error);
            return null;
        }
    },

    /**
     * Envia dados de uma visita para o Manus
     */
    async sendVisitToManus(visitId: string, visitData: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('manus_visits')
                .upsert({
                    visit_id: visitId,
                    ...visitData,
                    synced_at: getBrazilTimestamp()
                });

            if (error) {
                console.error('Error sending visit to Manus:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error sending visit to Manus:', error);
            return false;
        }
    },

    /**
     * Atualiza status de sincronização com Manus
     */
    async updateManusSyncStatus(visitId: string, status: string, message?: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('manus_visits')
                .update({
                    sync_status: status,
                    sync_message: message,
                    updated_at: getBrazilTimestamp()
                })
                .eq('visit_id', visitId);

            if (error) {
                console.error('Error updating Manus sync status:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error updating Manus sync status:', error);
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // CHAT
    // -------------------------------------------------------------------------

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

        // Fetch read receipts for all messages of this visit
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
                        userName: read.user?.name_short || read.user?.name_full || 'Usuário',
                        userAvatarUrl: getPublicImageUrl(read.user?.img_file_path, read.user?.img_file_name, { width: 100, height: 100, resize: 'cover' }),
                        readAt: read.read_at
                    });
                }
            }
        }

        return data.map((item: any) => {
            const userName = item.user?.name_short || item.user?.name_full || 'Usuário';
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

        // Trigger notifications to participants
        try {
            await visitsService.sendChatNotifications(
                messageData.ovId!,
                messageData.message!,
                messageData.userId!,
                messageData.isActionItem ? 'action' : (messageData.infoRequested ? 'info' : 'normal'),
                messageData.activeUserIds || []
            );
        } catch (notifErr) {
            console.error('Failed to send chat notifications:', notifErr);
        }

        const userName = data.user?.name_short || data.user?.name_full || 'Usuário';
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
            const userName = item.user?.name_short || item.user?.name_full || 'Usuário';
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
        // 1. Get sender name
        const { data: senderData } = await supabase
            .from('users')
            .select('name_short')
            .eq('id', parseInt(senderId))
            .maybeSingle();

        const senderName = senderData?.name_short || 'Alguém';

        // 2. Get visit details from v_orders_visits (view)
        const { data: visitData } = await supabase
            .from('v_orders_visits')
            .select('ov_mask, o_id, o_provider_company_id, o_unit_id')
            .eq('id', parseInt(visitId))
            .maybeSingle();

        const ovMask = visitData?.ov_mask || '';
        const orderId = visitData?.o_id?.toString();
        const companyId = visitData?.o_provider_company_id?.toString();
        const unitId = visitData?.o_unit_id?.toString();

        // 3. Get extra participants from orders_visits_chat_participants
        const { data: participants, error: partError } = await supabase
            .from('orders_visits_chat_participants')
            .select('user_id')
            .eq('ov_id', parseInt(visitId));

        if (partError || !participants) return;

        const activeUserIdSet = new Set(activeUserIds.map(uid => uid.toString()));

        // 4. Collect user IDs to notify, excluding the sender and users active in this visit chat
        const userIdsToNotify = [...new Set(participants
            .map((p: any) => p.user_id.toString())
            .filter((uid: string) => uid !== senderId.toString() && !activeUserIdSet.has(uid)))];

        if (userIdsToNotify.length === 0) return;

        // 5. Create notifications objects
        let prefix = '';
        if (type === 'action') prefix = '⚠️ [Ação Pendente] ';
        else if (type === 'info') prefix = 'ℹ️ [Pedido de Informação] ';

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

        // 6. Insert notifications
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
    },

    async fileOrderVisit(visitId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('orders_visits')
                .update({
                    ov_is_filed: true,
                    ov_approved_filed_user_id: userId,
                    ov_approved_filed_at: getBrazilTimestamp()
                })
                .eq('id', visitId);

            if (error) throw error;
        } catch (error) {
            console.error('[visitsService] Error filing order visit:', error);
            throw error;
        }
    },

    async deleteOrderVisitSignature(visitId: string, type: 'leader' | 'requester'): Promise<void> {
        try {
            const updateData: any = {};
            if (type === 'leader') {
                updateData.ov_signature_leader_path = null;
                updateData.ov_signature_leader_name = null;
                updateData.ov_signature_leader_at = null;
            } else {
                updateData.ov_signature_requester_path = null;
                updateData.ov_signature_requester_name = null;
                updateData.ov_signature_requester_at = null;
            }

            const { error } = await supabase
                .from('orders_visits')
                .update(updateData)
                .eq('id', visitId);

            if (error) throw error;
        } catch (error) {
            console.error('[visitsService] Error deleting signature:', error);
            throw error;
        }
    }

};
