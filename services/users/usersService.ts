import { supabase } from '../supabase';
import { User, UserStatus, Permission, Team, Department, Vehicle } from '../../types';
import { getPublicImageUrl } from '../imageUtils';
import { r2Service } from '../r2Service';
import { getBrazilTimestamp } from '../../utils/dateUtils';

let currentUserPromise: Promise<User | null> | null = null;

export const usersService = {
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                cfg_users_statuses (
                     id,
                     description
                ),
                cfg_profiles (
                    description
                ),
                cfg_teams (
                    description,
                    company_id,
                    department_id
                )
            `)
            .order('name_full');

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        // Manually fetch companies to avoid potential Relation error if FK is missing
        const { data: companies } = await supabase.from('cfg_companies').select('id, description, code, img_file_path, img_file_name');
        const companyMap = new Map<any, { name: string; logoUrl: string | undefined }>((companies || []).map((c: any) => [c.id, {
            name: c.description,
            logoUrl: getPublicImageUrl(c.img_file_path, c.img_file_name, { width: 100, height: 100, resize: 'contain' })
        }]));

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            mobileMask: item.mobile_mask,
            phone: item.phone,
            avatarUrl: getPublicImageUrl(item.img_file_path, item.img_file_name || 'noImageUser.png', { width: 70, height: 70, resize: 'cover' }),

            companyId: (item.company_id || item.cfg_teams?.company_id)?.toString(),
            departmentId: item.cfg_teams?.department_id?.toString(),
            name: item.name_full,
            createdAt: item.created_at,
            teamId: item.team_id?.toString(),
            teamName: item.cfg_teams?.description,
            companyName: companyMap.get(item.company_id || item.cfg_teams?.company_id)?.name || 'N/A',
            companyLogoUrl: companyMap.get(item.company_id || item.cfg_teams?.company_id)?.logoUrl,
            vehicleId: item.vehicle_id?.toString(),
            isTeamLeader: item.is_team_leader,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async getDepartments(): Promise<Department[]> {
        const { data, error } = await supabase
            .from('cfg_departments')
            .select(`*`);

        if (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            parentId: item.parent_id?.toString(),
            companyName: item.cfg_companies?.description || 'Desconhecida'
        })) as Department[];
    },

    async getDepartmentsByCompany(companyId: string): Promise<Department[]> {
        const { data, error } = await supabase
            .from('cfg_departments')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching departments by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            parentId: item.parent_id?.toString()
        })) as Department[];
    },

    async createDepartment(department: Partial<Department>): Promise<Department> {
        const dbData = {
            company_id: department.companyId,
            description: department.name,
            code: department.code,
            is_available: department.status === 'active',
            parent_id: department.parentId || null
        };

        const { data, error } = await supabase
            .from('cfg_departments')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...department,
            id: data.id.toString()
        } as Department;
    },

    async updateDepartment(id: string, department: Partial<Department>): Promise<Department> {
        const dbData = {
            description: department.name,
            code: department.code,
            is_available: department.status === 'active',
            parent_id: department.parentId || null
        };

        const { data, error } = await supabase
            .from('cfg_departments')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...department,
            id: data.id.toString()
        } as Department;
    },

    async deleteDepartment(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getTeams(companyId?: string, departmentId?: string): Promise<Team[]> {
        let query = supabase.from('cfg_teams').select('*').eq('is_available', 'true');
        if (companyId) query = query.eq('company_id', companyId);
        if (departmentId) query = query.eq('department_id', departmentId);

        const { data, error } = await query.order('description');
        if (error) { console.error('Error fetching teams:', error); return []; }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id?.toString(),
            parentId: item.parent_id?.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive',
            companyId: item.company_id?.toString()
        })) as Team[];
    },

    async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
        const { data, error } = await supabase
            .from('cfg_teams')
            .select('*')
            .eq('department_id', departmentId);

        if (error) {
            console.error('Error fetching teams by department:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id.toString(),
            parentId: item.parent_id?.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive'
        })) as Team[];
    },

    async createTeam(team: Partial<Team>): Promise<Team> {
        let companyId = team.companyId;

        // If companyId is missing but departmentId is present, fetch it from department
        if (!companyId && team.departmentId) {
            const { data: dept } = await supabase
                .from('cfg_departments')
                .select('company_id')
                .eq('id', team.departmentId)
                .single();
            if (dept) companyId = dept.company_id.toString();
        }

        const dbData = {
            department_id: team.departmentId,
            company_id: companyId,
            description: team.name,
            code: team.code,
            is_available: true
        };

        const { data, error } = await supabase
            .from('cfg_teams')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...team,
            id: data.id.toString()
        } as Team;
    },

    async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
        const dbData = {
            description: team.name,
            code: team.code,
            is_available: team.status === 'active'
        };

        const { data, error } = await supabase
            .from('cfg_teams')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...team,
            id: data.id.toString()
        } as Team;
    },

    async deleteTeam(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_teams')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getUsersByCompany(companyId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                cfg_users_statuses (
                     id,
                     description
                ),
                cfg_profiles (
                    description
                ),
                cfg_teams!inner (
                    description,
                    company_id
                )
            `)
            .eq('cfg_teams.company_id', companyId)
            .order('name_full');

        if (error) {
            console.error('Error fetching users by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            latitude: item.latitude,
            longitude: item.longitude,
            trackerHeartbeatAt: item.tracker_heartbeat_at,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            mobileMask: item.mobile_mask,
            phone: item.phone,

            // Avatar logic
            avatarUrl: item.img_file_name
                ? getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,

            companyId: item.cfg_teams?.company_id?.toString(),
            name: item.name_full,
            createdAt: item.created_at,
            teamId: item.team_id?.toString(),
            teamName: item.cfg_teams?.description,
            vehicleId: item.vehicle_id?.toString(),
            isAvailable: item.is_available,
            shiftStart: item.shift_start,
            shiftEnd: item.shift_end,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async getTeamsByCompany(companyId: string): Promise<Team[]> {
        const { data, error } = await supabase
            .from('cfg_teams')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching teams by company:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            departmentId: item.department_id.toString(),
            parentId: item.parent_id?.toString(),
            name: item.description,
            code: item.code,
            status: item.is_available ? 'active' : 'inactive'
        })) as Team[];
    },

    async getTeamMembers(teamId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching team members:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            nameFull: item.name_full,
            nameShort: item.name_short,
            email: item.email,
            avatarUrl: item.img_file_name
                ? getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async searchUsers(query: string, companyId: string, excludeTeamId?: string): Promise<User[]> {
        let queryBuilder = supabase
            .from('users')
            .select(`
                *,
                cfg_teams!inner (
                    company_id
                )       
            `)
            .eq('cfg_teams.company_id', companyId)
            .ilike('name_full', `%${query}%`)
            .order('name_full');

        if (excludeTeamId) {
            queryBuilder = queryBuilder.neq('team_id', excludeTeamId);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            console.error('Error searching users:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            nameFull: item.name_full,
            nameShort: item.name_short,
            email: item.email,
            avatarUrl: item.img_file_name
                ? getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'cover' })
                : undefined,
            teamId: item.team_id?.toString(),
            isAvailable: item.is_available,
            shiftStart: item.shift_start,
            shiftEnd: item.shift_end,
            ovIdInProgress: item.ov_id_in_progress
        })) as User[];
    },

    async searchVehicles(query: string, companyId?: string): Promise<Vehicle[]> {
        let q = supabase
            .from('v_vehicles')
            .select('*')
            .eq('is_available', 'true')
            .or(`description.ilike.%${query}%,plates.ilike.%${query}%`)
            .limit(10);

        if (companyId) {
            q = q.eq('company_id', companyId);
        }

        const { data, error } = await q;

        if (error) {
            console.error('Error searching vehicles:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            plates: item.plates,
            model: item.model,
            brand: item.brand,
            color: item.color,
            year: item.year,
            isAvailable: item.is_available
        })) as Vehicle[];
    },

    async getVehicle(id: string): Promise<Vehicle | null> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching vehicle:', error);
            return null;
        }

        return {
            id: data.id.toString(),
            description: data.description,
            plates: data.plates,
            model: data.model,
            brand: data.brand,
            color: data.color,
            year: data.year,
            isAvailable: data.is_available
        } as Vehicle;
    },

    async updateUserVehicle(userId: string, vehicleId: string | null): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ vehicle_id: vehicleId ? parseInt(vehicleId) : null })
            .eq('uuid', userId);

        if (error) {
            console.error('Error updating user vehicle:', error);
            throw error;
        }
    },

    async addUserToTeam(userId: string, newTeamId: string): Promise<void> {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('team_id')
            .eq('uuid', userId)
            .single();

        if (fetchError) throw fetchError;

        const oldTeamId = user.team_id;

        const { error: updateError } = await supabase
            .from('users')
            .update({
                team_id_previous: oldTeamId,
                team_id: parseInt(newTeamId)
            })
            .eq('uuid', userId);

        if (updateError) throw updateError;
    },

    async removeUserFromTeam(userId: string): Promise<void> {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('team_id_previous')
            .eq('uuid', userId)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from('users')
            .update({ team_id: user.team_id_previous })
            .eq('uuid', userId);

        if (error) throw error;
    },

    async updateUserTeam(userId: string, teamId: string | null): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ team_id: teamId ? parseInt(teamId) : null })
            .eq('uuid', userId);

        if (error) {
            console.error('Error updating user team:', error);
            throw error;
        }
    },

    async createUser(user: Partial<User>, password: string): Promise<void> {
        const { createClient } = await import('@supabase/supabase-js');

        const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: user.email!,
            password: password,
            options: {
                data: {
                    name: user.nameFull
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Usuário não criado no Auth");

        const updateData = {
            name_full: user.nameFull,
            name_short: user.nameShort,
            mobile: user.mobile,
            team_id: (user.teamId && user.teamId !== '') ? parseInt(user.teamId) : null,
            company_id: (user.companyId && user.companyId !== '') ? parseInt(user.companyId) : null,
            profile_id: (user.profileId && user.profileId !== '') ? parseInt(user.profileId) : null,
            status_id: 1,
            img_file_path: 'settings/images',
            img_file_name: 'noImageUser.png',
            shift_start: '08:00:00',
            shift_end: '18:00:00'
        };

        const mobileClean = user.mobile?.replace(/\D/g, '') || '';
        if (mobileClean.length >= 10 && mobileClean.length <= 11) {
            (updateData as any).mobile_full = '55' + mobileClean;
            (updateData as any).mobile_mask = user.phone || user.mobile || null;
            (updateData as any).mobile_whatsapp = ('55' + mobileClean).slice(0, 4) + ('55' + mobileClean).slice(5) + '@s.whatsapp.net';
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('uuid', authData.user.id);

        if (updateError) {
            console.error("Error updating user profile", updateError);
            throw updateError;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        if (currentUserPromise) return currentUserPromise;

        currentUserPromise = (async () => {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

                if (authError || !authUser) {
                    if (authError) {
                        const status = authError.status;
                        const isNetworkError = !status || status === 0 || 
                                               authError.message?.toLowerCase().includes('fetch') ||
                                               authError.message?.toLowerCase().includes('network') ||
                                               authError.message?.toLowerCase().includes('timeout') ||
                                               authError.message?.toLowerCase().includes('load failed') ||
                                               authError.message?.toLowerCase().includes('connection');

                        if (isNetworkError) {
                            console.warn('[getCurrentUser] Erro de rede/conexão detectado durante a validação da sessão. Ignorando signOut e propagando o erro:', authError);
                            throw authError; 
                        }

                        console.warn('[getCurrentUser] Erro de autenticação (sessão pode estar expirada):', authError);
                    }
                    return null;
                }

                const { data, error } = await supabase
                    .from('users')
                    .select(`
                        *,
                        cfg_users_statuses (
                             id,
                             description
                        ),
                        cfg_profiles!left (
                            description
                        ),
                        cfg_teams!left (
                            description,
                            company_id,
                            department_id
                        )
                    `)
                    .eq('uuid', authUser.id)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        console.error('Error fetching current user:', error);
                    }
                    return null;
                }

                let company: any = null;
                const teamCompanyId = data.cfg_teams?.company_id;

                if (teamCompanyId) {
                    const { data: companyData } = await supabase
                        .from('cfg_companies')
                        .select('id, description, img_file_path, img_file_name')
                        .eq('id', teamCompanyId)
                        .single();
                    company = companyData;
                }

                let permissions: Permission[] = [];
                if (data.profile_id) {
                    const { data: permsData, error: permsError } = await supabase
                        .rpc('fc_get_user_permissions', { p_user_id: data.id });

                    if (!permsError && permsData) {
                        permissions = permsData.map((item: any) => ({
                            id: '',
                            profileId: data.profile_id.toString(),
                            routeId: item.route_id?.toString(),
                            routeKey: item.route_key,
                            routePath: item.route_path,
                            routeDescription: item.route_description,
                            canView: item.can_view,
                            canCreate: item.can_create,
                            canEdit: !!item.can_edit,
                            canDelete: !!item.can_delete,
                            canSearch: item.can_search !== undefined ? !!item.can_search : true
                        }));
                    }
                }

                return {
                    id: data.id.toString(),
                    uuid: data.uuid,
                    email: data.email,
                    nameFull: data.name_full,
                    nameShort: data.name_short,
                    mobile: data.mobile,
                    mobileMask: data.mobile_mask,
                    phone: data.phone,
                    statusId: data.status_id,
                    statusName: data.cfg_users_statuses?.description || 'Desconhecido',
                    profileId: data.profile_id?.toString(),
                    profileName: data.cfg_profiles?.description,
                    avatarUrl: data.img_file_name
                        ? getPublicImageUrl(data.img_file_path, data.img_file_name, { width: 400, height: 400, resize: 'cover' })
                        : undefined,

                    companyId: company?.id?.toString(),
                    companyName: company?.description,
                    companyLogoUrl: company
                        ? getPublicImageUrl(company.img_file_path, company.img_file_name, { width: 400, height: 400, resize: 'contain' })
                        : undefined,
                    teamId: data.team_id?.toString(),
                    teamName: data.cfg_teams?.description,
                    departmentId: data.cfg_teams?.department_id?.toString(),
                    isAdminSuper: data.is_admin_super,
                    notificationsAmount: data.notifications_amount || 0,
                    createdAt: data.created_at,
                    vehicleId: data.vehicle_id?.toString(),
                    isTeamLeader: data.is_team_leader,
                    isAvailable: data.is_available,
                    isOvInProgress: data.is_ov_in_progress,
                    ovIdInProgress: data.ov_id_in_progress?.toString(),
                    oIdInProgress: data.o_id_in_progress?.toString(),
                    opIdInProgress: data.op_id_in_progress?.toString(),
                    ovIdInProgressMask: data.ov_id_in_progress_mask,
                    ovInProgressLeaderId: data.ov_in_progress_leader_id,
                    oContractIdInProgress: data.o_contract_id_in_progress,
                    oTypeIdInProgress: data.o_type_id_in_progress,
                    oTypeSubIdInProgress: data.o_type_sub_id_in_progress,
                    oPlanIdInProgress: data.o_plan_id_in_progress,
                    oAssetTagIdInProgress: data.o_asset_tag_id_in_progress,
                    oUnitIdInProgress: data.o_unit_id_in_progress,
                    oSystemIdInProgress: data.o_system_id_in_progress,
                    oSystemParentIdInProgress: data.o_system_parent_id_in_progress,
                    oUnitTypeIdInProgress: data.o_unit_type_id_in_progress,
                    oUnitTypeParentIdInProgress: data.o_unit_type_parent_id_in_progress,
                    oObjectIdInProgress: data.o_object_id_in_progress,
                    ovIdInProgressBigInt: data.ov_id_in_progress,
                    oIdInProgressBigInt: data.o_id_in_progress,
                    opIdInProgressBigInt: data.op_id_in_progress,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    shiftStart: data.shift_start,
                    shiftEnd: data.shift_end,
                    trackerIntervalSeconds: data.tracker_interval_seconds ?? null,
                    permissions: permissions
                } as User;
            } catch (error) {
                currentUserPromise = null;
                throw error;
            }
        })().finally(() => {
            currentUserPromise = null;
        });

        return currentUserPromise;
    },

    async updateProfile(userUuid: string, user: Partial<User>, onProgress?: (progress: number) => void): Promise<void> {
        const mobileClean = user.mobile?.replace(/\D/g, '') || '';
        let mobileFull: string | null = null;
        let mobileMask: string | null = null;
        let mobileWhatsapp: string | null = null;

        if (mobileClean.length >= 10 && mobileClean.length <= 11) {
            mobileFull = '55' + mobileClean;
            mobileMask = user.phone || user.mobile || null;
            mobileWhatsapp = mobileFull.slice(0, 4) + mobileFull.slice(5) + '@s.whatsapp.net';
        }

        const updateData: any = {
            name_full: user.nameFull,
            name_short: user.nameShort,
            mobile: user.mobile,
            phone: user.phone,
            profile_id: (user.profileId && user.profileId !== '') ? parseInt(user.profileId) : undefined,
            team_id: (user.teamId && user.teamId !== '') ? parseInt(user.teamId) : undefined,
            company_id: (user.companyId && user.companyId !== '') ? parseInt(user.companyId) : undefined,
            shift_start: user.shiftStart,
            shift_end: user.shiftEnd
        };

        if (mobileFull) updateData.mobile_full = mobileFull;
        if (mobileMask) updateData.mobile_mask = mobileMask;
        if (mobileWhatsapp) updateData.mobile_whatsapp = mobileWhatsapp;

        if (user.statusId !== undefined) {
            updateData.status_id = user.statusId;
        }

        if (user.isTeamLeader !== undefined) {
            updateData.is_team_leader = user.isTeamLeader;
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('uuid', userUuid);

        if (updateError) throw updateError;

        if (user.email) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.id === userUuid) {
                const { error: emailError } = await supabase.auth.updateUser({ email: user.email });
                if (emailError) throw emailError;
            } else {
                const { error: dbEmailError } = await supabase
                    .from('users')
                    .update({ email: user.email })
                    .eq('uuid', userUuid);
                if (dbEmailError) throw dbEmailError;
            }
        }

        if (user.avatarUrl && user.avatarUrl.startsWith('data:')) {
            try {
                const { data: dbUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id, img_file_path, img_file_name')
                    .eq('uuid', userUuid)
                    .single();

                if (fetchError || !dbUser) throw new Error("Usuário não encontrado para upload de imagem");

                const userId = dbUser.id;
                const oldPath = dbUser.img_file_path;
                const oldName = dbUser.img_file_name;
                const oldFullFile = (oldPath && oldName) ? `${oldPath}/${oldName}` : null;

                const res = await fetch(user.avatarUrl);
                const blob = await res.blob();

                const { path, filename } = await usersService.uploadUserAvatar(userId, blob, onProgress);

                const { error: dbUpdateError } = await supabase
                    .from('users')
                    .update({
                        img_file_path: path,
                        img_file_name: filename
                    })
                    .eq('id', userId);

                if (dbUpdateError) throw dbUpdateError;

                if (oldFullFile && !oldFullFile.includes('settings/images')) {
                    try {
                        const { r2Service } = await import('../r2Service');
                        await r2Service.deleteFile(oldFullFile);
                    } catch (delError) {
                        console.warn("Could not delete old avatar from R2:", delError);
                    }
                }
            } catch (err) {
                console.error("Failed to process profile image update", err);
                throw err;
            }
        }
    },

    async updateUserStatus(userId: string, statusId: number): Promise<string> {
        const { error } = await supabase
            .from('users')
            .update({ status_id: statusId })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user status:', error);
            throw error;
        }

        const { data: statusData } = await supabase
            .from('cfg_users_statuses')
            .select('description')
            .eq('id', statusId)
            .single();

        return statusData?.description || 'Desconhecido';
    },

    async getUserStatuses(): Promise<UserStatus[]> {
        const { data, error } = await supabase
            .from('cfg_users_statuses')
            .select('*')
            .order('description');
            
        if (error) {
            console.error('Error fetching user statuses:', error);
            throw error;
        }
        
        return data as UserStatus[];
    },

    async updateUserAvailability(userId: string, isAvailable: boolean, ovIdInProgress: string | null | undefined): Promise<void> {
        const parsedOvId = ovIdInProgress ? Number(ovIdInProgress) : null;
        const payload: { is_available: boolean; ov_id_in_progress: number | null } = {
            is_available: isAvailable,
            ov_id_in_progress: Number.isInteger(parsedOvId) && parsedOvId! > 0 ? parsedOvId : null
        };

        const { error } = await supabase
            .from('users')
            .update(payload)
            .eq('id', userId);

        if (error) {
            console.error('Error updating user availability:', error);
            throw error;
        }
    },
    
    async getTeamLeader(teamId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('team_id', teamId)
            .eq('is_team_leader', true)
            .limit(1)
            .maybeSingle();
            
        if (error) {
            console.error('Error fetching team leader:', error);
            return null;
        }
        
        if (!data) return null;
        
        return {
            id: data.id.toString(),
            uuid: data.uuid,
            nameFull: data.name_full,
            email: data.email
        } as User;
    },

    async uploadUserAvatar(userId: string, file: File | Blob, onProgress?: (progress: number) => void): Promise<{ path: string, filename: string }> {
        const fileExt = (file as File).name ? (file as File).name.split('.').pop() : 'jpg';
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const folderPath = `users/${userId}/avatar`;
        const fullPath = `${folderPath}/${fileName}`;

        console.log('👤 Uploading user avatar to R2:', { folderPath, fileName, fullPath });

        try {
            await r2Service.uploadFile(file as any, fullPath, onProgress);
            return { path: folderPath, filename: fileName };
        } catch (uploadError) {
            console.error('❌ Error uploading user avatar to R2:', uploadError);
            throw uploadError;
        }
    },

    async updateLastOnline(userId: string): Promise<void> {
        try {
            await supabase
                .from('users')
                .update({ last_online: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            console.error('Error updating last_online:', error);
        }
    },

    async updateUserLocation(
        userId: string,
        latitude: number,
        longitude: number,
        accuracy: number | null = null
    ): Promise<void> {
        try {
            const now = getBrazilTimestamp();
            const updatePayload: Record<string, any> = {
                latitude,
                longitude,
                tracker_heartbeat_at: now,
                tracked_at: now,
            };
            if (accuracy !== null) {
                updatePayload.tracker_accuracy = accuracy;
            }
            const { error } = await supabase
                .from('users')
                .update(updatePayload)
                .eq('id', userId);
            if (error) {
                console.error('[usersService] Error updating user location:', error);
            }
        } catch (error) {
            console.error('[usersService] Exception updating user location:', error);
        }
    },

    async signIn(email: string, password: string): Promise<void> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
            try {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('uuid')
                    .eq('email', email)
                    .single();

                if (existingUser && existingUser.uuid !== data.user.id) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ uuid: data.user.id })
                        .eq('email', email);

                    if (updateError) {
                        console.error('Error syncing UUID:', updateError);
                    }
                }
            } catch (syncError) {
                console.error('Failed to sync user UUID:', syncError);
            }
        }
    },

    subscribeToAuthChanges(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },

    async signOut(): Promise<void> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error signing out from Supabase:', error);
        } catch (e) {
            console.error('Unexpected error during sign out:', e);
        } finally {
            localStorage.clear();
            window.location.href = '/';
        }
    },

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
    },

    async updatePassword(password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },

    async getActiveUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name_short, is_available, is_ov_in_progress, img_file_path, img_file_name, team_id, ov_id_in_progress')
            .eq('is_ov_in_progress', true)
            .order('name_short');

        if (error) {
            console.error('Error fetching active users:', error);
            return [];
        }

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

    async getUserPermissions(userId: string): Promise<Permission[]> {
        console.log(`[usersService] Fetching perms for user:`, userId);
        const { data, error } = await supabase
            .rpc('fc_get_user_permissions', { p_user_id: parseInt(userId) });

        if (error) {
            console.error('Error fetching user permissions:', error);
            return [];
        }

        console.log(`[usersService] RPC returned ${data?.length || 0} permissions`);

        return data.map((item: any) => ({
            id: '0',
            profileId: '0',
            routeId: item.route_id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            routeDescription: item.route_description,
            canView: !!item.can_view,
            canCreate: !!item.can_create,
            canEdit: !!item.can_edit,
            canDelete: !!item.can_delete,
            canSearch: !!item.can_search
        })) as Permission[];
    },

    async getProfilePermissions(profileId: string): Promise<Permission[]> {
        const { data, error } = await supabase
            .rpc('fc_get_profile_permissions', { p_profile_id: parseInt(profileId) });

        if (error) {
            console.error('Error fetching profile permissions:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.permission_id?.toString() || '0',
            profileId: profileId,
            routeId: item.route_id.toString(),
            routeKey: item.route_key,
            routePath: item.route_path,
            routeDescription: item.route_description,
            canView: !!item.can_view,
            canCreate: !!item.can_create,
            canEdit: !!item.can_edit,
            canDelete: !!item.can_delete,
            canSearch: item.can_search !== undefined ? !!item.can_search : true
        })) as Permission[];
    },

    async updateProfilePermissions(profileId: string, permissions: any[]): Promise<void> {
        console.log(`[usersService] Updating permissions for profile ${profileId}`, permissions);
        const routesJson = permissions.map(p => ({
            route_id: parseInt(p.routeId),
            can_view: !!p.canView,
            can_create: !!p.canCreate,
            can_edit: !!p.canEdit,
            can_delete: !!p.canDelete,
            can_search: p.canSearch !== undefined ? !!p.canSearch : true
        }));

        const { error } = await supabase
            .rpc('fc_update_profile_routes', {
                p_profile_id: parseInt(profileId),
                p_routes: routesJson
            });

        if (error) {
            console.error('Error updating profile permissions:', error);
            throw error;
        }
    },

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
    }
};
