import { supabase } from './supabase';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { resolveNoticeSystemParentIds } from '../../utils/appNoticeSystemScope';

import { appNoticesWorkersService } from './appNoticesWorkersService';
import {
  SystemNotice,
  SystemNoticeCategory,
  SystemNoticeSeverity,
  CreateSystemNoticeInput,
  NoticeFilters,
} from '../../types';

export const appNoticesService = {
  async getCategories(): Promise<SystemNoticeCategory[]> {
    const { data, error } = await supabase
      .from('cfg_app_notices_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data.map(this.mapCategory);
  },

  async getSeverities(): Promise<SystemNoticeSeverity[]> {
    const { data, error } = await supabase
      .from('cfg_app_notices_severities')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching severities:', error);
      return [];
    }

    return data.map(this.mapSeverity);
  },

  async getActiveNotices(dashboard?: string): Promise<SystemNotice[]> {
    const now = getBrazilTimestamp();

    let query = supabase
      .from('v_app_notices')
      .select('*')
      .eq('is_active', true)
      .lte('view_start_date', now)
      .gte('view_end_date', now);

    if (dashboard) {
      query = query.contains('dashboards', [dashboard]);
    }

    query = query
      .order('severity_id', { ascending: true })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active notices:', error);
      return [];
    }

    return data.map(this.mapNotice);
  },

  async listNotices(filters: NoticeFilters = {}): Promise<{ notices: SystemNotice[]; total: number }> {
    const { categoryId, severityId, isActive, startDate, endDate, search, page = 0, pageSize = 20 } = filters;

    let query = supabase
      .from('v_app_notices')
      .select('*', { count: 'exact' });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (severityId) {
      query = query.eq('severity_id', severityId);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing notices:', error);
      return { notices: [], total: 0 };
    }

    return {
      notices: data.map(this.mapNotice),
      total: count || 0,
    };
  },

  async getNoticeById(id: number): Promise<SystemNotice | null> {
    const { data, error } = await supabase
      .from('v_app_notices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching notice:', error);
      return null;
    }

    return this.mapNotice(data);
  },

  /**
   * Id inteiro (`public.users.id`) do usuário autenticado.
   * `supabase.auth.getUser()` devolve o UUID do auth — gravar `parseInt(uuid)`
   * em created_user_id/updated_user_id apontava para outro usuário (ou nulo).
   */
  async getCurrentUserId(): Promise<number | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('uuid', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching current user id:', error);
      return null;
    }

    return data?.id ?? null;
  },

  async createNotice(input: CreateSystemNoticeInput): Promise<SystemNotice> {
    const currentUserId = await this.getCurrentUserId();
    if (currentUserId === null) {
      throw new Error('CURRENT_USER_NOT_FOUND');
    }

    const { data, error } = await supabase
      .from('cfg_app_notices')
      .insert({
        title: input.title,
        message: input.message,
        category_id: input.categoryId,
        severity_id: input.severityId,
        start_date: input.startDate,
        end_date: input.endDate,
        view_start_date: input.viewStartDate,
        view_end_date: input.viewEndDate,
        dashboards: input.dashboards,
        system_parent_ids: input.systemParentIds,
        created_user_id: currentUserId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notice:', error);
      throw error;
    }

    return this.getNoticeById(data.id) as Promise<SystemNotice>;
  },

  async updateNotice(id: number, data: Partial<SystemNotice>): Promise<SystemNotice> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.severityId !== undefined) updateData.severity_id = data.severityId;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.viewStartDate !== undefined) updateData.view_start_date = data.viewStartDate;
    if (data.viewEndDate !== undefined) updateData.view_end_date = data.viewEndDate;
    if (data.dashboards !== undefined) updateData.dashboards = data.dashboards;
    if (data.systemParentIds !== undefined) updateData.system_parent_ids = data.systemParentIds;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    await this.applyNoticeUpdate(id, updateData);

    return this.getNoticeById(id) as Promise<SystemNotice>;
  },

  async deleteNotice(id: number): Promise<void> {
    // Bloqueia exclusão de aviso com MO extra lançada (total > 0)
    const summary = await appNoticesWorkersService.getWorkersSummaryByNotices([id]);
    const totalWorkers = summary.reduce((sum, item) => sum + item.total, 0);
    if (totalWorkers > 0) {
      throw new Error('MO_EXTRA_EXISTS');
    }

    const { error } = await supabase
      .from('cfg_app_notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notice:', error);
      throw error;
    }
  },

  async toggleNoticeActive(id: number, isActive: boolean): Promise<void> {
    await this.applyNoticeUpdate(id, { is_active: isActive });
  },

  /**
   * Grava a alteração registrando o usuário autenticado em `updated_user_id`.
   * Sem a migration 20261006 (coluna updated_user_id) o update é refito sem
   * ela para não quebrar a edição do aviso.
   */
  async applyNoticeUpdate(id: number, payload: Record<string, any>): Promise<void> {
    const data: Record<string, any> = { ...payload };
    const currentUserId = await this.getCurrentUserId();
    if (currentUserId !== null) data.updated_user_id = currentUserId;

    // `.select(...)` permite detectar update bloqueado por RLS (0 linhas,
    // sem erro) e confirmar que `system_parent_ids` foi realmente gravado.
    // Sem isso a tela fechava como se tivesse salvo.
    const { data: updatedRows, error } = await supabase
      .from('cfg_app_notices')
      .update(data)
      .eq('id', id)
      .select('id, system_parent_ids');

    if (!error) {
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('NOTICE_UPDATE_NO_ROWS');
      }
      this.assertSystemParentIdsApplied(data, updatedRows[0]);
      return;
    }

    // 42703 = undefined_column (coluna updated_user_id ainda não existe)
    if (error.code === '42703' && 'updated_user_id' in data) {
      console.warn(
        'Coluna updated_user_id ausente — aplique a migration 20261006_add_updated_user_to_cfg_app_notices.sql',
        error
      );
      delete data.updated_user_id;
      const { data: retryRows, error: retryError } = await supabase
        .from('cfg_app_notices')
        .update(data)
        .eq('id', id)
        .select('id, system_parent_ids');
      if (retryError) {
        console.error('Error updating notice:', retryError);
        throw retryError;
      }
      if (!retryRows || retryRows.length === 0) {
        throw new Error('NOTICE_UPDATE_NO_ROWS');
      }
      this.assertSystemParentIdsApplied(data, retryRows[0]);
      return;
    }

    console.error('Error updating notice:', error);
    throw error;
  },

  /**
   * Sanidade pós-update: garante que o array gravado é o enviado. Protege
   * contra updates silenciosamente ignorados (RLS/trigger) sem depender do
   * reload da lista.
   */
  assertSystemParentIdsApplied(
    payload: Record<string, any>,
    updatedRow: Record<string, any> | null | undefined
  ): void {
    if (!Array.isArray(payload.system_parent_ids)) return;
    const expected = resolveNoticeSystemParentIds(payload.system_parent_ids).sort((a, b) => a - b);
    const actual = resolveNoticeSystemParentIds(updatedRow?.system_parent_ids).sort((a, b) => a - b);
    const same =
      expected.length === actual.length &&
      expected.every((id, index) => id === actual[index]);
    if (!same) {
      throw new Error('NOTICE_UPDATE_NOT_APPLIED');
    }
  },

  /** Incrementa o contador de visualizações do aviso (RPC atômica no banco). */
  async incrementViewCount(id: number): Promise<number> {
    const { data, error } = await supabase.rpc('increment_notice_view_count', {
      p_notice_id: id,
    });

    if (error) {
      console.error('Error incrementing notice view count:', error);
      return 0;
    }

    return data ?? 0;
  },

  mapCategory(row: any): SystemNoticeCategory {
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      color: row.color,
      icon: row.icon,
      orderIndex: row.order_index,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  },

  mapSeverity(row: any): SystemNoticeSeverity {
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      color: row.color,
      icon: row.icon,
      orderIndex: row.order_index,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  },

  mapNotice(row: any): SystemNotice {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      categoryId: row.category_id,
      severityId: row.severity_id,
      startDate: row.start_date,
      endDate: row.end_date,
      viewStartDate: row.view_start_date,
      viewEndDate: row.view_end_date,
      dashboards: row.dashboards || [],
      systemParentIds: resolveNoticeSystemParentIds(row.system_parent_ids),
      systemParentNames: row.system_parent_names || [],
      createdBy: row.created_user_id,
      viewCount: row.view_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      categoryCode: row.category_code,
      categoryLabel: row.category_label,
      categoryColor: row.category_color,
      categoryIcon: row.category_icon,
      severityCode: row.severity_code,
      severityLabel: row.severity_label,
      severityColor: row.severity_color,
      severityIcon: row.severity_icon,
      creatorName: row.creator_name,
      creatorNameShort: row.creator_name_short || row.creator_name,
      updatedBy: row.updated_user_id,
      updatedByName: row.updated_by_name,
      updatedByNameShort: row.updated_by_name_short || row.updated_by_name,
    };
  },
};
