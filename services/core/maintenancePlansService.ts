import { supabase } from '../supabase';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, OrderVisitAssetActivity } from '../../types';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { r2Service } from '../r2Service';

export const maintenancePlansService = {
    // ── Plans ───────────────────────────────────────────────────
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

    async duplicateMaintenancePlan(planId: string, userId: string): Promise<string> {
        console.log('[SVC-DUP] ▶ início — planId:', planId, 'userId:', userId);

        const plan = await this.getMaintenancePlanById(planId);
        if (!plan) {
            console.error('[SVC-DUP] ❌ plano não encontrado para id:', planId);
            throw new Error('Plano não encontrado');
        }
        console.log('[SVC-DUP] plano encontrado:', plan.code, '|', plan.description);

        console.log('[SVC-DUP] criando novo plano...');
        const newPlan = await this.createMaintenancePlan({
            code: `CÓPIA DE ${plan.code}`,
            description: `CÓPIA DE ${plan.description}`,
            assetTypeId: plan.assetTypeId,
            isAvailable: true
        }, userId);
        console.log('[SVC-DUP] ✅ novo plano criado — id:', newPlan.id);

        const sections = await this.getMaintenancePlanSections(planId);
        console.log('[SVC-DUP] seções encontradas:', sections.length);

        for (const section of sections) {
            console.log('[SVC-DUP] criando seção:', section.description);
            const newSection = await this.createMaintenancePlanSection({
                maintenancePlanId: newPlan.id,
                description: section.description,
                orderIndex: section.orderIndex
            }, userId);
            console.log('[SVC-DUP] ✅ seção criada — id:', newSection.id);

            const activities = await this.getMaintenancePlanSectionActivities(section.id);
            console.log('[SVC-DUP] atividades na seção:', activities.length);
            for (const act of activities) {
                console.log('[SVC-DUP] inserindo atividade — activityId:', act.activityId);
                await this.insertSectionActivity(
                    newSection.id, act.activityId, userId,
                    act.orderIndex, act.description, act.commentsDefault
                );
                console.log('[SVC-DUP] ✅ atividade inserida');
            }
        }

        console.log('[SVC-DUP] ✅✅ duplicação concluída — novoId:', newPlan.id);
        return newPlan.id;
    },

    // ── Sections ────────────────────────────────────────────────
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

    // ── Section Activities ──────────────────────────────────────
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

    // Insert simples — usado na duplicação, sem depender de constraint onConflict
    async insertSectionActivity(sectionId: string, activityId: string, userId: string, orderIndex?: number, description?: string, commentsDefault?: string): Promise<MaintenancePlanSectionActivity> {
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
            .insert(payload)
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

    // Upsert — usado na edição interativa para evitar duplicar atividade na mesma seção
    async createMaintenancePlanSectionActivity(sectionId: string, activityId: string, userId: string, orderIndex?: number, description?: string, commentsDefault?: string): Promise<MaintenancePlanSectionActivity> {
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

    // ── Checklist Items ─────────────────────────────────────────
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

    async getGlobalMaintenanceChecklistItems(assetId: string, planId: string, currentOvaId?: string): Promise<OrderVisitAssetActivity[]> {
        try {
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

            const previousOvas = currentOvaId 
                ? ovaRecords.filter(r => r.id.toString() !== currentOvaId.toString())
                : ovaRecords;

            if (previousOvas.length === 0) return [];

            const previousOvaIds = previousOvas.map(r => r.id).slice(0, 50);

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
        let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpeg';
        if (fileExt === 'jpg') fileExt = 'jpeg';

        const uniqueSuffix = Math.random().toString(36).substring(7);
        
        const cleanOvAssetId = String(ovAssetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanActivityId = String(activityId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCompanyId = String(companyId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanAssetId = String(assetId || '').trim().replace(/[^a-zA-Z0-9]/g, '_');

        const fileName = `checklist_${cleanOvAssetId}_${cleanActivityId}_${Date.now()}_${uniqueSuffix}.${fileExt}`;
        
        const folderPath = (cleanCompanyId && cleanAssetId && cleanCompanyId !== 'undefined' && cleanAssetId !== 'undefined') 
            ? `companies/${cleanCompanyId}/assets/${cleanAssetId}` 
            : `checklist/${cleanOvAssetId}/${cleanActivityId}`;
            
        const fullPath = `${folderPath}/${fileName}`.replace(/\s+/g, '_');

        await r2Service.uploadFile(file, fullPath, onProgress);
        return { path: folderPath, filename: fileName };
    },

    async removeChecklistImage(ovAssetId: string, planId: string, activityId: string, fileName: string, userId: string): Promise<OrderVisitAssetActivity | null> {
        const { data: existing, error: fetchError } = await supabase
            .from('orders_visits_assets_activities')
            .select('*')
            .eq('ova_id', parseInt(ovAssetId))
            .eq('maintenance_plan_id', parseInt(planId))
            .eq('activity_id', parseInt(activityId))
            .maybeSingle();

        if (fetchError || !existing) throw fetchError || new Error('Item de checklist não encontrado');

        const currentList: string[] = existing.img_files_names || [];
        const newList = currentList.filter(f => f !== fileName);

        try {
            const folderPath = existing.img_file_path || `checklist/${ovAssetId}/${activityId}`;
            const fullPath = `${folderPath}/${fileName}`.replace(/\/+/g, '/');
            await r2Service.deleteFile(fullPath);
        } catch (r2Error) {
            console.warn('Não foi possível excluir do R2, continuando com atualização do Banco:', r2Error);
        }

        return await this.upsertMaintenanceChecklistItem(ovAssetId, planId, activityId, userId, {
            imgFilesNames: newList
        });
    }
};
