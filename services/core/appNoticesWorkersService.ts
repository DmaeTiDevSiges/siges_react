import { supabase } from './supabase';
import { NoticeWorker, NoticeWorkersSummaryItem } from '../../types';
import { getPublicImageUrl } from '../media/imageUtils';

const TABLE = 'cfg_app_notices_workers';

export const appNoticesWorkersService = {
  /**
   * Total de MO extra por company, agregado para vários avisos de uma vez.
   * Retorna apenas companies com soma > 0, ordenado do maior total para o menor.
   */
  async getWorkersSummaryByNotices(
    noticeIds: Array<number | string>
  ): Promise<NoticeWorkersSummaryItem[]> {
    const ids = Array.from(
      new Set(
        (noticeIds || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from(TABLE)
      .select(
        'notice_id, company_id, workers_extra_amount, cfg_companies(id, description, code, img_file_path, img_file_name)'
      )
      .in('notice_id', ids)
      .gt('workers_extra_amount', 0);

    if (error) {
      console.error('Error fetching notice workers summary:', error);
      return [];
    }

    const map = new Map<string, NoticeWorkersSummaryItem>();
    (data || []).forEach((row: any) => {
      const noticeId = Number(row.notice_id);
      const companyId = Number(row.company_id);
      const amount = Number(row.workers_extra_amount) || 0;
      if (!Number.isFinite(noticeId) || !Number.isFinite(companyId) || amount <= 0) return;

      const key = `${noticeId}:${companyId}`;
      const comp = row.cfg_companies;
      const entry = map.get(key) || {
        noticeId,
        companyId,
        companyName: comp?.description,
        companyCode: comp?.code,
        companyLogoUrl: comp?.img_file_name
          ? getPublicImageUrl(comp.img_file_path, comp.img_file_name, { width: 100, height: 100, resize: 'cover' })
          : undefined,
        total: 0,
      };
      entry.total += amount;
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },

  /**
   * Lançamentos de trabalhadores extras de um aviso.
   * `companyId` undefined = todas as companies (super admin).
   * Sem company válida não há escopo → retorna vazio.
   */
  async getWorkersByNotice(
    noticeId: number,
    companyId?: string | number | null
  ): Promise<NoticeWorker[]> {
    if (!noticeId) return [];

    let query = supabase
      .from(TABLE)
      .select('*, units(id, description, description_full, code, address_full), cfg_companies(id, description, code, img_file_path, img_file_name)')
      .eq('notice_id', noticeId)
      .gt('workers_extra_amount', 0);

    if (companyId !== undefined) {
      const id = Number(companyId);
      if (companyId === null || companyId === '' || !Number.isFinite(id) || id <= 0) {
        return [];
      }
      query = query.eq('company_id', id);
    }

    const { data, error } = await query.order('unit_id', { ascending: true });

    if (error) {
      console.error('Error fetching notice workers:', error);
      return [];
    }

    return (data || []).map(this.mapWorker);
  },

  /**
   * Grava (update ou insert) o valor definido para
   * notice + unit + company. Valor mínimo 0.
   */
  async setWorkers(params: {
    noticeId: number;
    companyId: string | number;
    unitId: string | number;
    amount: number;
    userId?: number | null;
  }): Promise<void> {
    const noticeId = Number(params.noticeId);
    const companyId = Number(params.companyId);
    const unitId = Number(params.unitId);
    const amount = Math.max(0, Math.round(Number(params.amount) || 0));
    const userId = params.userId ?? null;

    const match = { notice_id: noticeId, unit_id: unitId, company_id: companyId };

    if (amount <= 0) {
      const { error: deleteError } = await supabase
        .from(TABLE)
        .delete()
        .match(match);

      if (deleteError) {
        console.error('Error deleting notice workers:', deleteError);
        throw deleteError;
      }
      return;
    }

    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({
        workers_extra_amount: amount,
        updated_at: new Date().toISOString(),
        updated_user_id: userId,
      })
      .match(match)
      .select('id');

    if (updateError) {
      console.error('Error updating notice workers:', updateError);
      throw updateError;
    }
    if (updated && updated.length > 0) return;

    const { error: insertError } = await supabase.from(TABLE).insert({
      ...match,
      workers_extra_amount: amount,
      created_user_id: userId,
      updated_user_id: userId,
    });

    if (insertError) {
      // Corrida: outra inserção venceu — tenta o update mais uma vez.
      const { error: retryError } = await supabase
        .from(TABLE)
        .update({
          workers_extra_amount: amount,
          updated_at: new Date().toISOString(),
          updated_user_id: userId,
        })
        .match(match);

      if (retryError) {
        console.error('Error inserting notice workers:', insertError);
        throw retryError;
      }
    }
  },

  mapWorker(row: any): NoticeWorker {
    const comp = row.cfg_companies;
    return {
      id: row.id,
      noticeId: row.notice_id,
      companyId: row.company_id,
      unitId: row.unit_id,
      workersExtraAmount: row.workers_extra_amount ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unitDescription: row.units?.description,
      unitDescriptionFull: row.units?.description_full,
      unitCode: row.units?.code,
      unitAddressFull: row.units?.address_full,
      companyName: comp?.description,
      companyCode: comp?.code,
      companyLogoUrl: comp?.img_file_name
        ? getPublicImageUrl(comp.img_file_path, comp.img_file_name, { width: 100, height: 100, resize: 'cover' })
        : undefined,
    };
  },
};
