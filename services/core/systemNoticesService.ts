import { supabase } from '../supabase';
import {
  SystemNotice,
  SystemNoticeCategory,
  SystemNoticeSeverity,
  CreateSystemNoticeInput,
  NoticeFilters,
} from '../../types';

export const systemNoticesService = {
  async getCategories(): Promise<SystemNoticeCategory[]> {
    const { data, error } = await supabase
      .from('system_notice_categories')
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
      .from('system_notice_severities')
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
    const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
    
    let query = supabase
      .from('v_system_notices')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

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
      .from('v_system_notices')
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
      .from('v_system_notices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching notice:', error);
      return null;
    }

    return this.mapNotice(data);
  },

  async createNotice(input: CreateSystemNoticeInput): Promise<SystemNotice> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('system_notices')
      .insert({
        title: input.title,
        message: input.message,
        category_id: input.categoryId,
        severity_id: input.severityId,
        start_date: input.startDate,
        end_date: input.endDate,
        dashboards: input.dashboards,
        created_by: user?.id || null,
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
    if (data.dashboards !== undefined) updateData.dashboards = data.dashboards;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { error } = await supabase
      .from('system_notices')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating notice:', error);
      throw error;
    }

    return this.getNoticeById(id) as Promise<SystemNotice>;
  },

  async deleteNotice(id: number): Promise<void> {
    const { error } = await supabase
      .from('system_notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notice:', error);
      throw error;
    }
  },

  async toggleNoticeActive(id: number, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('system_notices')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('Error toggling notice:', error);
      throw error;
    }
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
      dashboards: row.dashboards || [],
      createdBy: row.created_by,
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
    };
  },
};
