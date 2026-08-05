import { supabase } from '../supabase';
import { AppTip, CreateAppTipInput, AppTipFilters, AppTipTargetMode } from '../../types';

export const appTipsService = {
    async getActiveTipsForScreen(
        screenKey: string,
        userId: number,
        userCompanyId?: number | null,
        userDepartmentId?: number | null,
        userProfileId?: number | null,
    ): Promise<AppTip[]> {
        console.log('[appTipsService] getActiveTipsForScreen called with:', { screenKey, userId, userCompanyId, userDepartmentId, userProfileId });
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const { data, error } = await supabase
            .from('cfg_app_tips')
            .select('*')
            .eq('is_active', true)
            .or(`screen_target.eq.${screenKey},screen_target.eq.*`)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('priority', { ascending: true });

        if (error) {
            console.error('[appTipsService] Error fetching active tips:', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        const { data: dismissed } = await supabase
            .from('cfg_app_tips_dismissals')
            .select('tip_id')
            .eq('user_id', userId);

        const dismissedIds = new Set((dismissed || []).map((d: any) => d.tip_id));

        let tips = data
            .filter((tip: any) => !dismissedIds.has(tip.id))
            .map(this.mapTip);

        console.log('[appTipsService] Tips after dismiss filter:', tips.map(t => ({ id: t.id, title: t.title, targetMode: t.targetMode })));

        const filteredTipIds = tips
            .filter(t => t.targetMode === 'filtered')
            .map(t => Number(t.id));

        console.log('[appTipsService] filteredTipIds:', filteredTipIds);

        if (filteredTipIds.length > 0) {
            const [companiesResult, departmentsResult, profilesResult] = await Promise.all([
                supabase
                    .from('cfg_app_tips_companies')
                    .select('tip_id, company_id')
                    .in('tip_id', filteredTipIds),
                supabase
                    .from('cfg_app_tips_departments')
                    .select('tip_id, department_id')
                    .in('tip_id', filteredTipIds),
                supabase
                    .from('cfg_app_tips_profiles')
                    .select('tip_id, profile_id')
                    .in('tip_id', filteredTipIds),
            ]);

            const tipCompanyMap = new Map<number, Set<number>>();
            const tipDepartmentMap = new Map<number, Set<number>>();
            const tipProfileMap = new Map<number, Set<number>>();

            for (const row of companiesResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipCompanyMap.has(tipId)) tipCompanyMap.set(tipId, new Set());
                tipCompanyMap.get(tipId)!.add(Number(row.company_id));
            }
            for (const row of departmentsResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipDepartmentMap.has(tipId)) tipDepartmentMap.set(tipId, new Set());
                tipDepartmentMap.get(tipId)!.add(Number(row.department_id));
            }
            for (const row of profilesResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipProfileMap.has(tipId)) tipProfileMap.set(tipId, new Set());
                tipProfileMap.get(tipId)!.add(Number(row.profile_id));
            }

            console.log('[appTipsService] tipProfileMap:', Array.from(tipProfileMap.entries()).map(([k, v]) => ({ tipId: k, profiles: Array.from(v) })));
            console.log('[appTipsService] Filtering with userCompanyId:', userCompanyId, 'userDepartmentId:', userDepartmentId, 'userProfileId:', userProfileId);

            tips = tips.filter(tip => {
                if (tip.targetMode === 'all') return true;

                const tipId = Number(tip.id);
                const companies = tipCompanyMap.get(tipId);
                const departments = tipDepartmentMap.get(tipId);
                const profiles = tipProfileMap.get(tipId);

                const hasCompanyFilter = !!(companies && companies.size > 0);
                const hasDeptFilter = !!(departments && departments.size > 0);
                const hasProfileFilter = !!(profiles && profiles.size > 0);

                const hasNoFilters = !hasCompanyFilter && !hasDeptFilter && !hasProfileFilter;

                // AND logic: each configured dimension must match
                // If companies are configured, user must be in one of them
                if (hasCompanyFilter && !(userCompanyId && companies!.has(userCompanyId))) return false;
                // If departments are configured, user must be in one of them
                if (hasDeptFilter && !(userDepartmentId && departments!.has(userDepartmentId))) return false;
                // If profiles are configured, user must have one of them
                if (hasProfileFilter && !(userProfileId && profiles!.has(userProfileId))) return false;

                // If no filters at all on a 'filtered' tip, don't show (misconfigured)
                if (hasNoFilters) return false;

                console.log('[appTipsService] FILTER PASS:', {
                    tipId, tipTitle: tip.title,
                    hasCompanyFilter, hasDeptFilter, hasProfileFilter,
                    userCompanyId, userDepartmentId, userProfileId,
                });

                return true;
            });
        }

        return tips;
    },

    async getUndismissedCount(
        userId: number,
        userCompanyId?: number | null,
        userDepartmentId?: number | null,
        userProfileId?: number | null,
    ): Promise<number> {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const { data, error } = await supabase
            .from('cfg_app_tips')
            .select('id, target_mode')
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`);

        if (error || !data) return 0;

        const { data: dismissed } = await supabase
            .from('cfg_app_tips_dismissals')
            .select('tip_id')
            .eq('user_id', userId);

        const dismissedIds = new Set((dismissed || []).map((d: any) => d.tip_id));
        let tips = data.filter((tip: any) => !dismissedIds.has(tip.id));

        const filteredTipIds = tips
            .filter((t: any) => t.target_mode === 'filtered')
            .map((t: any) => Number(t.id));

        if (filteredTipIds.length > 0) {
            const [companiesResult, departmentsResult, profilesResult] = await Promise.all([
                supabase.from('cfg_app_tips_companies').select('tip_id, company_id').in('tip_id', filteredTipIds),
                supabase.from('cfg_app_tips_departments').select('tip_id, department_id').in('tip_id', filteredTipIds),
                supabase.from('cfg_app_tips_profiles').select('tip_id, profile_id').in('tip_id', filteredTipIds),
            ]);

            const tipCompanyMap = new Map<number, Set<number>>();
            const tipDepartmentMap = new Map<number, Set<number>>();
            const tipProfileMap = new Map<number, Set<number>>();

            for (const row of companiesResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipCompanyMap.has(tipId)) tipCompanyMap.set(tipId, new Set());
                tipCompanyMap.get(tipId)!.add(Number(row.company_id));
            }
            for (const row of departmentsResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipDepartmentMap.has(tipId)) tipDepartmentMap.set(tipId, new Set());
                tipDepartmentMap.get(tipId)!.add(Number(row.department_id));
            }
            for (const row of profilesResult.data || []) {
                const tipId = Number(row.tip_id);
                if (!tipProfileMap.has(tipId)) tipProfileMap.set(tipId, new Set());
                tipProfileMap.get(tipId)!.add(Number(row.profile_id));
            }

            tips = tips.filter((tip: any) => {
                if (tip.target_mode !== 'filtered') return true;

                const tipId = Number(tip.id);
                const companies = tipCompanyMap.get(tipId);
                const departments = tipDepartmentMap.get(tipId);
                const profiles = tipProfileMap.get(tipId);

                const hasCompanyFilter = !!(companies && companies.size > 0);
                const hasDeptFilter = !!(departments && departments.size > 0);
                const hasProfileFilter = !!(profiles && profiles.size > 0);
                const hasNoFilters = !hasCompanyFilter && !hasDeptFilter && !hasProfileFilter;

                if (hasNoFilters) return false;

                // AND logic: each configured dimension must match
                if (hasCompanyFilter && !(userCompanyId && companies!.has(userCompanyId))) return false;
                if (hasDeptFilter && !(userDepartmentId && departments!.has(userDepartmentId))) return false;
                if (hasProfileFilter && !(userProfileId && profiles!.has(userProfileId))) return false;

                return true;
            });
        }

        return tips.length;
    },

    async dismissTip(tipId: number, userId: number): Promise<void> {
        const { error } = await supabase
            .from('cfg_app_tips_dismissals')
            .insert({ tip_id: Number(tipId), user_id: userId });

        if (error) {
            console.error('[appTipsService] Error dismissing tip:', error);
            throw error;
        }
    },

    async resetDismissals(tipId: number): Promise<void> {
        const { error } = await supabase
            .from('cfg_app_tips_dismissals')
            .delete()
            .eq('tip_id', tipId);

        if (error) {
            console.error('[appTipsService] Error resetting dismissals:', error);
            throw error;
        }
    },

    // ---------------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------------

    async listTips(filters?: AppTipFilters): Promise<{ tips: AppTip[]; total: number }> {
        let query = supabase
            .from('cfg_app_tips')
            .select('*', { count: 'exact' })
            .order('priority', { ascending: true });

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
        }
        if (filters?.screenTarget) {
            query = query.eq('screen_target', filters.screenTarget);
        }
        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive);
        }
        if (filters?.targetMode) {
            query = query.eq('target_mode', filters.targetMode);
        }

        const page = filters?.page || 0;
        const pageSize = filters?.pageSize || 20;
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[appTipsService] Error listing tips:', error);
            return { tips: [], total: 0 };
        }

        const tips = (data || []).map(this.mapTip);

        const tipIds = tips.filter(t => t.targetMode === 'filtered').map(t => t.id);
        if (tipIds.length > 0) {
            const [companiesResult, departmentsResult, profilesResult] = await Promise.all([
                supabase
                    .from('cfg_app_tips_companies')
                    .select('tip_id, company_id')
                    .in('tip_id', tipIds),
                supabase
                    .from('cfg_app_tips_departments')
                    .select('tip_id, department_id')
                    .in('tip_id', tipIds),
                supabase
                    .from('cfg_app_tips_profiles')
                    .select('tip_id, profile_id')
                    .in('tip_id', tipIds),
            ]);

            const tipCompanyMap = new Map<number, number[]>();
            const tipDepartmentMap = new Map<number, number[]>();
            const tipProfileMap = new Map<number, number[]>();

            for (const row of companiesResult.data || []) {
                if (!tipCompanyMap.has(row.tip_id)) tipCompanyMap.set(row.tip_id, []);
                tipCompanyMap.get(row.tip_id)!.push(row.company_id);
            }
            for (const row of departmentsResult.data || []) {
                if (!tipDepartmentMap.has(row.tip_id)) tipDepartmentMap.set(row.tip_id, []);
                tipDepartmentMap.get(row.tip_id)!.push(row.department_id);
            }
            for (const row of profilesResult.data || []) {
                if (!tipProfileMap.has(row.tip_id)) tipProfileMap.set(row.tip_id, []);
                tipProfileMap.get(row.tip_id)!.push(row.profile_id);
            }

            for (const tip of tips) {
                if (tip.targetMode === 'filtered') {
                    tip.companyIds = tipCompanyMap.get(tip.id) || [];
                    tip.departmentIds = tipDepartmentMap.get(tip.id) || [];
                    tip.profileIds = tipProfileMap.get(tip.id) || [];
                }
            }
        }

        return { tips, total: count || 0 };
    },

    async getTipById(id: string): Promise<AppTip | null> {
        const { data, error } = await supabase
            .from('cfg_app_tips')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        const tip = this.mapTip(data);

        if (tip.targetMode === 'filtered') {
            const [companiesResult, departmentsResult, profilesResult] = await Promise.all([
                supabase
                    .from('cfg_app_tips_companies')
                    .select('company_id')
                    .eq('tip_id', tip.id),
                supabase
                    .from('cfg_app_tips_departments')
                    .select('department_id')
                    .eq('tip_id', tip.id),
                supabase
                    .from('cfg_app_tips_profiles')
                    .select('profile_id')
                    .eq('tip_id', tip.id),
            ]);

            tip.companyIds = (companiesResult.data || []).map((r: any) => r.company_id);
            tip.departmentIds = (departmentsResult.data || []).map((r: any) => r.department_id);
            tip.profileIds = (profilesResult.data || []).map((r: any) => r.profile_id);
        }

        return tip;
    },

    async createTip(input: CreateAppTipInput): Promise<AppTip> {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        let createdBy: number | undefined;
        if (authUser) {
            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('uuid', authUser.id)
                .single();
            createdBy = userData?.id;
        }

        const targetMode = input.targetMode || 'all';

        const { data, error } = await supabase
            .from('cfg_app_tips')
            .insert({
                title: input.title,
                body: input.body,
                icon: input.icon || 'lightbulb',
                screen_target: input.screenTarget,
                target_mode: targetMode,
                priority: input.priority || 0,
                start_date: input.startDate || null,
                end_date: input.endDate || null,
                created_by: createdBy || null,
            })
            .select()
            .single();

        if (error) throw error;

        if (targetMode === 'filtered') {
            await this.saveTipTargeting(data.id, input);
        }

        return this.mapTip(data);
    },

    async updateTip(id: string, data: Partial<CreateAppTipInput & { isActive: boolean }>): Promise<AppTip> {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.body !== undefined) updateData.body = data.body;
        if (data.icon !== undefined) updateData.icon = data.icon;
        if (data.screenTarget !== undefined) updateData.screen_target = data.screenTarget;
        if (data.targetMode !== undefined) updateData.target_mode = data.targetMode;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.startDate !== undefined) updateData.start_date = data.startDate || null;
        if (data.endDate !== undefined) updateData.end_date = data.endDate || null;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        const { data: result, error } = await supabase
            .from('cfg_app_tips')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data.targetMode !== undefined || data.companyIds !== undefined || data.departmentIds !== undefined || data.profileIds !== undefined) {
            const tipId = Number(id);
            const targetMode = data.targetMode || result.target_mode;

            await Promise.all([
                supabase.from('cfg_app_tips_companies').delete().eq('tip_id', tipId),
                supabase.from('cfg_app_tips_departments').delete().eq('tip_id', tipId),
                supabase.from('cfg_app_tips_profiles').delete().eq('tip_id', tipId),
            ]);

            if (targetMode === 'filtered') {
                await this.saveTipTargeting(tipId, data as CreateAppTipInput);
            }
        }

        return this.mapTip(result);
    },

    async deleteTip(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_app_tips')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleTipActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('cfg_app_tips')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    // ---------------------------------------------------------------------------
    // Targeting helpers
    // ---------------------------------------------------------------------------

    async saveTipTargeting(tipId: number, input: CreateAppTipInput): Promise<void> {
        const inserts: Promise<any>[] = [];

        if (input.companyIds && input.companyIds.length > 0) {
            inserts.push(
                supabase.from('cfg_app_tips_companies').insert(
                    input.companyIds.map(companyId => ({ tip_id: tipId, company_id: companyId }))
                )
            );
        }
        if (input.departmentIds && input.departmentIds.length > 0) {
            inserts.push(
                supabase.from('cfg_app_tips_departments').insert(
                    input.departmentIds.map(departmentId => ({ tip_id: tipId, department_id: departmentId }))
                )
            );
        }
        if (input.profileIds && input.profileIds.length > 0) {
            inserts.push(
                supabase.from('cfg_app_tips_profiles').insert(
                    input.profileIds.map(profileId => ({ tip_id: tipId, profile_id: profileId }))
                )
            );
        }

        if (inserts.length > 0) {
            const results = await Promise.all(inserts);
            for (const result of results) {
                if (result.error) {
                    console.error('[appTipsService] Error saving tip targeting:', result.error);
                    throw result.error;
                }
            }
        }
    },

    // ---------------------------------------------------------------------------
    // Mapper
    // ---------------------------------------------------------------------------

    mapTip(row: any): AppTip {
        return {
            id: Number(row.id),
            title: row.title,
            body: row.body,
            icon: row.icon,
            screenTarget: row.screen_target,
            targetMode: row.target_mode || 'all',
            priority: row.priority,
            startDate: row.start_date,
            endDate: row.end_date,
            isActive: row.is_active,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
};
