import { supabase } from './supabase';
import { getBrazilNaiveTimestamp, getBrazilTimestamp } from '../../utils/dateUtils';
import {
  formatDateInBrazil,
  getBrazilDateInputValue,
  parseBrazilDate,
} from '../../utils/formatters';
import { findOpenPeriod, pickPeriodForDate, pickPeriodForNow, planShiftAdjustments, validatePeriodWindow } from '../../utils/appNoticePeriod';
import { noticeAppliesToUnitSystemParent } from '../../utils/appNoticeSystemScope';

import { NoticeWorker, NoticeWorkerPeriod, NoticeWorkersSummaryItem, NoticeWorkersSummaryOptions } from '../../types';
import { getPublicImageUrl } from '../media/imageUtils';

const TABLE = 'cfg_app_notices_workers';
const PERIODS_TABLE = 'cfg_app_notices_workers_periods';
const NOTICE_TABLE = 'cfg_app_notices';

interface NoticeRow {
  id: number;
  start_date: string;
  end_date: string;
  view_start_date: string;
  view_end_date: string;
}

export const appNoticesWorkersService = {
  // ── Períodos ─────────────────────────────────────────────────────────────

  /** Períodos do aviso, do mais antigo para o mais recente. */
  async getPeriodsByNotice(noticeId: number): Promise<NoticeWorkerPeriod[]> {
    if (!noticeId) return [];
    const { data, error } = await supabase
      .from(PERIODS_TABLE)
      .select('*')
      .eq('notice_id', Number(noticeId))
      .order('period_start', { ascending: true });

    if (error) {
      console.error('Error fetching notice worker periods:', error);
      return [];
    }
    return (data || []).map(this.mapPeriod);
  },

  /**
   * Período de uma DATA (dia em São Paulo, `YYYY-MM-DD`): o de maior
   * period_start que intersecta o dia. Dias sem lançamento carregam a
   * escala do período anterior (cadeia contínua).
   */
  async getPeriodForDate(noticeId: number, dateISO: string): Promise<NoticeWorkerPeriod | null> {
    if (!noticeId || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO || '')) return null;
    const periods = await this.getPeriodsByNotice(noticeId);
    if (periods.length === 0) return null;
    // Fim efetivo do último período em aberto = fim da janela de visualização
    const { data: noticeRow } = await supabase
      .from(NOTICE_TABLE)
      .select('id, start_date, end_date, view_start_date, view_end_date')
      .eq('id', Number(noticeId))
      .single();
    const windowEndDate = noticeRow?.view_end_date ?? undefined;
    return pickPeriodForDate(periods, dateISO, windowEndDate);
  },

  /** Período vigente no momento (ou null se nada cobre `now`). */
  async getCurrentPeriod(noticeId: number, now: Date = new Date()): Promise<NoticeWorkerPeriod | null> {
    if (!noticeId) return null;
    const periods = await this.getPeriodsByNotice(noticeId);
    if (periods.length === 0) return null;
    const { data: noticeRow } = await supabase
      .from(NOTICE_TABLE)
      .select('id, start_date, end_date, view_start_date, view_end_date')
      .eq('id', Number(noticeId))
      .single();
    const windowEndDate = noticeRow?.view_end_date ?? undefined;
    return pickPeriodForNow(periods, now, windowEndDate);
  },

  /**
   * Máquina de períodos para uma gravação:
   * 1. Window ended → closes the open period at view_end_date and blocks (WINDOW_ENDED).
   * 1b. Window not yet started: blocks (WINDOW_NOT_STARTED).
   * 2. Sem períodos → cria o inicial no instante do lançamento (em aberto).
   * 3. Mesmo dia SP do aberto → edita o período atual.
   * 4. Outro dia → fecha o aberto em `now` e abre um novo (`end(p) = start(p+1)`).
   */
  async resolvePeriodForWrite(
    noticeId: number,
    options: { now?: Date; userId?: number | null } = {}
  ): Promise<NoticeWorkerPeriod> {
    const now = options.now ?? new Date();
    const userId = options.userId ?? null;

    const { data: noticeRow, error: noticeError } = await supabase
      .from(NOTICE_TABLE)
      .select('id, start_date, end_date, view_start_date, view_end_date')
      .eq('id', Number(noticeId))
      .single();

    if (noticeError || !noticeRow) {
      console.error('Error fetching notice for period write:', noticeError);
      throw new Error('NOTICE_NOT_FOUND');
    }

    const periods = await this.getPeriodsByNotice(noticeId);
    const open = findOpenPeriod(periods);

    // 1) Vigência encerrada: fecha o aberto definitivamente e bloquea gravação
    const windowEnd = parseBrazilDate(noticeRow.view_end_date);
    if (!Number.isNaN(windowEnd.getTime()) && windowEnd.getTime() < now.getTime()) {
      if (open) await this.closePeriodAt(open.id, noticeRow.view_end_date);
      throw new Error('WINDOW_ENDED');
    }

    // 1b) Vigência ainda não iniciada: não abre período no futuro
    const windowStart = parseBrazilDate(noticeRow.view_start_date);
    if (!Number.isNaN(windowStart.getTime()) && windowStart.getTime() > now.getTime()) {
      throw new Error('WINDOW_NOT_STARTED');
    }

    // 2) Primeiro lançamento da notice
    if (!open) {
      return this.openNewPeriod(noticeRow, getBrazilNaiveTimestamp(now), periods.length, userId);
    }

    // 3) Mesmo dia (São Paulo) do período aberto → edita o atual
    const todayKey = getBrazilDateInputValue(now);
    if (getBrazilDateInputValue(open.startDate) === todayKey) {
      return open;
    }

    // 4) Virada de dia: anterior encerra no instante do novo lançamento
    const closed = await this.closePeriodAt(open.id, getBrazilNaiveTimestamp(now));
    if (!closed) {
      // Outro processo fechou e já deve ter aberto o novo — reusa
      const refetched = await this.fetchOpenPeriod(noticeId);
      if (refetched) return refetched;
    }
    return this.openNewPeriod(noticeRow, getBrazilNaiveTimestamp(now), periods.length + 1, userId);
  },

  /**
   * Cria um TURNO (escala) explícito dentro da janela de visualização do aviso.
   *
   * Encadeia automaticamente com as escalas existentes (regras de negócio):
   * - se a nova sobrepõe a anterior, o fim da anterior é cortado no início da
   *   nova (o tempo que sobra depois do fim da nova é descartado);
   * - se há vão entre o fim da anterior e o início da nova, a nova é esticada
   *   para trás até o fim da anterior (cadeia contínua);
   * - escala em aberto (`period_end` nulo) é fechada no início da nova;
   * - escala inteiramente engolida pela nova é REMOVIDA — mas só quando não
   *   tem lançamentos de MO extra (apagar em cascata perderia dados); com
   *   lançamentos, a criação é bloqueada com `PERIODO_ENGOLIDO_COM_LANCAMENTOS`.
   *
   * Erros tipados: `NOTICE_NOT_FOUND`, `PERIODO_INVALIDO`,
   * `PERIODO_FORA_DA_JANELA`, `PERIODO_ENGOLIDO_COM_LANCAMENTOS`.
   */
  async createPeriod(params: {
    noticeId: number;
    startDate: string;
    endDate: string;
    userId?: number | null;
  }): Promise<NoticeWorkerPeriod> {
    const noticeId = this.parseRequiredId(params.noticeId, 'NOTICE_NOT_FOUND');

    const { data: noticeRow, error: noticeError } = await supabase
      .from(NOTICE_TABLE)
      .select('id, start_date, end_date, view_start_date, view_end_date')
      .eq('id', noticeId)
      .single();

    if (noticeError || !noticeRow) {
      console.error('Error fetching notice for period creation:', noticeError);
      throw new Error('NOTICE_NOT_FOUND');
    }

    const periods = await this.getPeriodsByNotice(noticeId);

    // Planeja o encadeamento ANTES de validar a janela: o início efetivo pode
    // recuar (esticar) para cobrir o vão deixado pela escala anterior.
    const plan = planShiftAdjustments(
      periods,
      { startDate: params.startDate, endDate: params.endDate },
      noticeRow.view_end_date
    );

    // Valida janela + coerência do intervalo efetivo (o banco também valida)
    const windowIssue = validatePeriodWindow(
      { startDate: plan.startDate, endDate: params.endDate },
      noticeRow.view_start_date,
      noticeRow.view_end_date
    );
    if (windowIssue) throw new Error(windowIssue);

    // Remover escala apaga os lançamentos em cascata (FK ON DELETE CASCADE).
    // Com lançamentos, bloqueia em vez de perder dados.
    if (plan.removals.length > 0) {
      const { count } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .in('workers_period_id', plan.removals);

      if ((count ?? 0) > 0) {
        throw new Error('PERIODO_ENGOLIDO_COM_LANCAMENTOS');
      }
    }

    // Aplica os ajustes nas escalas existentes (cortes/fechamentos, reposicionamentos e remoções).
    // Guarda o estado anterior dos ajustes para desfazer caso o INSERT falhe —
    // não há transação, então a compensação evita deixar escalas cortadas/movidas sem
    // a escala nova que as substituiria.
    const originalEnds = new Map<number, string | null>();
    plan.truncations.forEach((t) => {
      const current = periods.find((p) => p.id === t.id);
      originalEnds.set(t.id, current?.endDate ?? null);
    });

    const originalStarts = new Map<number, string>();
    plan.startAdjustments?.forEach((s) => {
      const current = periods.find((p) => p.id === s.id);
      if (current?.startDate) {
        originalStarts.set(s.id, current.startDate);
      }
    });

    const originalLabels = new Map<number, string>();
    plan.truncations.forEach((t) => {
      const current = periods.find((p) => p.id === t.id);
      if (current?.label) originalLabels.set(t.id, current.label);
    });
    plan.startAdjustments?.forEach((s) => {
      const current = periods.find((p) => p.id === s.id);
      if (current?.label && !originalLabels.has(s.id)) originalLabels.set(s.id, current.label);
    });

    for (const truncation of plan.truncations) {
      const current = periods.find((p) => p.id === truncation.id);
      if (!current) continue;
      let newLabel = this.buildPeriodLabel(current.startDate, truncation.endDate);
      let { error: truncError } = await supabase
        .from(PERIODS_TABLE)
        .update({ period_end: truncation.endDate, label: newLabel, updated_at: new Date().toISOString() })
        .eq('id', truncation.id);
      if (truncError?.code === '23505') {
        newLabel = `${newLabel} (${truncation.id})`;
        ({ error: truncError } = await supabase
          .from(PERIODS_TABLE)
          .update({ period_end: truncation.endDate, label: newLabel, updated_at: new Date().toISOString() })
          .eq('id', truncation.id));
      }
      if (truncError) {
        console.error('Error truncating notice worker period:', truncError);
        throw truncError;
      }
    }

    if (plan.startAdjustments?.length) {
      for (const startAdj of plan.startAdjustments) {
        const current = periods.find((p) => p.id === startAdj.id);
        if (!current) continue;
        let newLabel = this.buildPeriodLabel(startAdj.startDate, current.endDate);
        let { error: startError } = await supabase
          .from(PERIODS_TABLE)
          .update({ period_start: startAdj.startDate, label: newLabel, updated_at: new Date().toISOString() })
          .eq('id', startAdj.id);
        if (startError?.code === '23505') {
          newLabel = `${newLabel} (${startAdj.id})`;
          ({ error: startError } = await supabase
            .from(PERIODS_TABLE)
            .update({ period_start: startAdj.startDate, label: newLabel, updated_at: new Date().toISOString() })
            .eq('id', startAdj.id));
        }
        if (startError) {
          console.error('Error moving notice worker period start:', startError);
          throw startError;
        }
      }
    }

    if (plan.removals.length > 0) {
      const { error: removeError } = await supabase
        .from(PERIODS_TABLE)
        .delete()
        .in('id', plan.removals);
      if (removeError) {
        console.error('Error removing notice worker period:', removeError);
        throw removeError;
      }
    }

    const remaining = periods.filter((p) => !plan.removals.includes(p.id));

    try {
      return await this.openNewPeriod(
        noticeRow,
        plan.startDate,
        remaining.length,
        params.userId ?? null,
        params.endDate
      );
    } catch (insertError) {
      // Desfaz os cortes e reposicionamentos: sem a escala nova, os ajustes deixariam
      // a cadeia inconsistente.
      await Promise.all([
        ...plan.truncations.map((t) =>
          supabase
            .from(PERIODS_TABLE)
            .update({ period_end: originalEnds.get(t.id) ?? null, label: originalLabels.get(t.id), updated_at: new Date().toISOString() })
            .eq('id', t.id)
        ),
        ...(plan.startAdjustments?.map((s) =>
          supabase
            .from(PERIODS_TABLE)
            .update({ period_start: originalStarts.get(s.id) ?? s.startDate, label: originalLabels.get(s.id), updated_at: new Date().toISOString() })
            .eq('id', s.id)
        ) ?? []),
      ]).catch((rollbackError) => {
        console.error('Error rolling back notice worker period adjustments:', rollbackError);
      });
      throw insertError;
    }
  },

  /** Fecha um período (`period_end IS NULL`) na data/hora indicada. */
  async closePeriodAt(periodId: number, endISO: string): Promise<boolean> {
    if (!periodId) return false;
    const { data, error } = await supabase
      .from(PERIODS_TABLE)
      .update({ period_end: endISO, updated_at: new Date().toISOString() })
      .eq('id', Number(periodId))
      .is('period_end', null)
      .select('id');

    if (error) {
      console.error('Error closing notice worker period:', error);
      return false;
    }
    return (data || []).length > 0;
  },

  async fetchOpenPeriod(noticeId: number): Promise<NoticeWorkerPeriod | null> {
    const { data } = await supabase
      .from(PERIODS_TABLE)
      .select('*')
      .eq('notice_id', Number(noticeId))
      .is('period_end', null)
      .order('period_start', { ascending: false })
      .limit(1);
    const row = (data || [])[0];
    return row ? this.mapPeriod(row) : null;
  },

  /**
   * Abre um novo período.
   *
   * Sem `endISO` → período em ABERTO (`period_end = null`), que vale até o fim
   * da janela. Com `endISO` → TURNO fechado com fim explícito (usado para
   * várias escalas no mesmo dia).
   *
   * Conflito de label (notice_id, label) → tenta novamente com sufixo; o
   * label é derivado do início, então a colisão só ocorre em corrida.
   */
  async openNewPeriod(
    noticeRow: NoticeRow,
    startISO: string,
    positionIndex: number,
    userId?: number | null,
    endISO?: string | null
  ): Promise<NoticeWorkerPeriod> {
    const label = this.buildPeriodLabel(startISO, endISO);
    const payload: Record<string, any> = {
      notice_id: noticeRow.id,
      label,
      period_start: startISO,
      period_end: endISO ?? null,
      position_index: positionIndex,
      updated_at: new Date().toISOString(),
    };
    if (userId != null) {
      payload.created_user_id = userId;
      payload.updated_user_id = userId;
    }

    const { data, error } = await supabase
      .from(PERIODS_TABLE)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Corrida de label: outro processo inseriu o mesmo rótulo → sufixo
        const retry = await supabase
          .from(PERIODS_TABLE)
          .insert({ ...payload, label: `${label} (${Date.now() % 10000})` })
          .select('*')
          .single();
        if (!retry.error) return this.mapPeriod(retry.data);

        // Índice parcial (notice + period_end IS NULL) vencido por outro processo
        const existing = await this.fetchOpenPeriod(noticeRow.id);
        if (existing) return existing;
      }
      console.error('Error opening notice worker period:', error);
      throw error;
    }
    return this.mapPeriod(data);
  },

  /**
   * Rótulo do período/escala.
   * Em aberto: "Período 20/10/2026 09:41h".
   * Escala fechada: "20/10/2026 06:00h às 14:00h" (data também no fim quando a
   * escala cruza a meia-noite, para o intervalo não ficar ambíguo).
   */
  buildPeriodLabel(startISO: string, endISO?: string | null): string {
    const fmt = (value: string, withDate: boolean) =>
      formatDateInBrazil(value, 'dateTime', 'pt-BR', {
        ...(withDate ? { day: '2-digit', month: '2-digit', year: 'numeric' } : {}),
        hour: '2-digit',
        minute: '2-digit',
      });

    if (!endISO) return `Período ${fmt(startISO, true)}`;

    const startDay = getBrazilDateInputValue(startISO);
    const endDay = getBrazilDateInputValue(endISO);
    const crossesMidnight = startDay !== endDay;

    return crossesMidnight
      ? `${fmt(startISO, true)} às ${fmt(endISO, true)}`
      : `${fmt(startISO, true)} às ${fmt(endISO, false)}`;
  },

  mapPeriod(row: any): NoticeWorkerPeriod {
    return {
      id: row.id,
      noticeId: row.notice_id,
      label: row.label,
      startDate: row.period_start,
      endDate: row.period_end ?? null,
      positionIndex: row.position_index ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  // ── Validação de IDs ────────────────────────────────────────────────────

  /**
   * Converte um ID obrigatório em número finito e positivo.
   * Lança `errorCode` quando o valor está ausente ou não é numérico — evita
   * que `Number(undefined)` vire `NaN` e a gravação perca o vínculo.
   */
  parseRequiredId(value: string | number | null | undefined, errorCode: string): number {
    const id = Number(value);
    if (value === null || value === undefined || value === '' || !Number.isFinite(id) || id <= 0) {
      throw new Error(errorCode);
    }
    return id;
  },

  /** Converte um ID opcional; devolve `null` quando ausente/inválido. */
  parseOptionalId(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : null;
  },

  // ── Lançamentos ─────────────────────────────────────────────────────────

  /**
   * Total de MO extra por company, agregado para vários avisos de uma vez.
   * Retorna apenas companies com soma > 0, ordenado do maior total para o menor.
   * `onlyCurrent` = soma somente o período vigente de cada aviso (escala do momento).
   */
  async getWorkersSummaryByNotices(
    noticeIds: Array<number | string>,
    options: NoticeWorkersSummaryOptions = {}
  ): Promise<NoticeWorkersSummaryItem[]> {
    const ids = Array.from(
      new Set(
        (noticeIds || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
    if (ids.length === 0) return [];

    let scopedIds = ids;
    if (options.onlyCurrent) {
      scopedIds = await this.getCurrentPeriodIdsByNotice(ids);
      if (scopedIds.length === 0) return [];
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select(
        'notice_id, company_id, workers_extra_amount, units(system_parent_id), cfg_app_notices(system_parent_ids), cfg_companies(id, description, code, img_file_path, img_file_name)'
      )
      .in('notice_id', scopedIds)
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

      // Exibição: ignora lançamentos de unidades fora dos sistemas do aviso.
      // A checagem de exclusão usa o total bruto (opção desligada).
      if (
        options.respectNoticeSystemScope &&
        !noticeAppliesToUnitSystemParent(
          row.cfg_app_notices?.system_parent_ids,
          row.units?.system_parent_id
        )
      ) {
        return;
      }

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
   * IDs dos períodos vigentes (ak contém "now") de vários avisos, em lote.
   * Avisos sem período cobrindo o momento ficam fora da lista.
   */
  async getCurrentPeriodIdsByNotice(noticeIds: number[]): Promise<number[]> {
    if (noticeIds.length === 0) return [];
    const nowISO = getBrazilTimestamp();
    const now = new Date();

    const { data, error } = await supabase
      .from(PERIODS_TABLE)
      .select('id, notice_id, period_start, period_end, cfg_app_notices(id, view_end_date)')
      .in('notice_id', noticeIds)
      .order('period_start', { ascending: true });

    if (error) {
      console.error('Error fetching current periods by notice:', error);
      return [];
    }

    // fim efetivo por notice: period_end (COALESCE) cai em notice.view_end_date
    const windowEndById = new Map<number, string>();
    (data || []).forEach((row: any) => {
      const end = row.cfg_app_notices?.view_end_date;
      if (end && !windowEndById.has(Number(row.notice_id))) {
        windowEndById.set(Number(row.notice_id), end);
      }
    });

    const effectiveEndMs = (row: any): number => {
      if (row.period_end) return parseBrazilDate(row.period_end).getTime();
      const windowEnd = windowEndById.get(Number(row.notice_id));
      return windowEnd ? parseBrazilDate(windowEnd).getTime() : Number.POSITIVE_INFINITY;
    };

    const byNotice = new Map<number, any>();
    (data || []).forEach((row: any) => {
      const start = parseBrazilDate(row.period_start).getTime();
      if (Number.isNaN(start) || start > now.getTime()) return;
      if (effectiveEndMs(row) <= now.getTime()) return;
      const current = byNotice.get(Number(row.notice_id));
      if (!current || start >= parseBrazilDate(current.period_start).getTime()) {
        byNotice.set(Number(row.notice_id), row);
      }
    });

    return Array.from(byNotice.values()).map((row: any) => Number(row.id));
  },

  /**
   * Lançamentos de trabalhadores extras de um aviso.
   * `companyId` undefined = todas as companies (super admin).
   * `periodId` = restringe a um período específico (escala do momento/dia).
   * Sem company válida não há escopo → retorna vazio.
   */
  async getWorkersByNotice(
    noticeId: number,
    companyId?: string | number | null,
    periodId?: number | null
  ): Promise<NoticeWorker[]> {
    if (!noticeId) return [];

    let query = supabase
      .from(TABLE)
      .select(
        '*, units(id, description, description_full, code, address_full, system_parent_id), cfg_companies(id, description, code, img_file_path, img_file_name), cfg_app_notices_workers_periods(id, label, period_start, period_end)'
      )
      .eq('notice_id', noticeId)
      .gt('workers_extra_amount', 0);

    if (companyId !== undefined) {
      const id = Number(companyId);
      if (companyId === null || companyId === '' || !Number.isFinite(id) || id <= 0) {
        // Sem company válida não há escopo: avisa (em vez de sumir em silêncio)
        console.warn(
          `[MO Extra] company inválida ao listar lançamentos (notice ${noticeId}, company ${String(companyId)})`
        );
        return [];
      }
      query = query.eq('company_id', id);
    }
    if (periodId !== undefined && periodId !== null) {
      query = query.eq('workers_period_id', Number(periodId));
    }

    const { data, error } = await query.order('unit_id', { ascending: true });

    if (error) {
      console.error('Error fetching notice workers:', error);
      return [];
    }

    return (data || []).map(this.mapWorker);
  },

  /** Lançamentos da escala de uma DATA (São Paulo, `YYYY-MM-DD`). */
  async getWorkersForDate(
    noticeId: number,
    dateISO: string,
    companyId?: string | number | null
  ): Promise<NoticeWorker[]> {
    const period = await this.getPeriodForDate(noticeId, dateISO);
    if (!period) return [];
    return this.getWorkersByNotice(noticeId, companyId, period.id);
  },

  /**
   * Grava (update ou insert) o valor definido para
   * notice + unit + company (+ período). Valor mínimo 0.
   *
   * Sem `periodId`: aplica a máquina de períodos (mesmo dia edita o período
   * atual; virada de dia fecha o anterior e abre um novo no instante).
   *
   * IDs inválidos (`undefined`, `null`, texto não numérico) lançam erro
   * tipado em vez de virar `NaN` — um `company_id`/`unit_id` NaN era
   * enviado como `null` ao PostgREST e o lançamento não era vinculado.
   */
  async setWorkers(params: {
    noticeId: number;
    companyId: string | number;
    unitId: string | number;
    amount: number;
    userId?: number | null;
    periodId?: number;
  }): Promise<void> {
    const noticeId = this.parseRequiredId(params.noticeId, 'NOTICE_NOT_FOUND');
    const companyId = this.parseRequiredId(params.companyId, 'COMPANY_NOT_DEFINED');
    const unitId = this.parseRequiredId(params.unitId, 'UNIT_NOT_DEFINED');
    const amount = Math.max(0, Math.round(Number(params.amount) || 0));
    const userId = this.parseOptionalId(params.userId);

    let periodId = params.periodId;
    if (periodId === undefined) {
      const period = await this.resolvePeriodForWrite(noticeId, { userId });
      periodId = period.id;
    }

    const match = {
      notice_id: noticeId,
      unit_id: unitId,
      company_id: companyId,
      workers_period_id: periodId!,
    };

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
    const period = row.cfg_app_notices_workers_periods;
    return {
      id: row.id,
      noticeId: row.notice_id,
      companyId: row.company_id,
      unitId: row.unit_id,
      workersExtraAmount: row.workers_extra_amount ?? 0,
      workersPeriodId: row.workers_period_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unitDescription: row.units?.description,
      unitDescriptionFull: row.units?.description_full,
      unitCode: row.units?.code,
      unitAddressFull: row.units?.address_full,
      unitSystemParentId: row.units?.system_parent_id ?? null,
      companyName: comp?.description,
      companyCode: comp?.code,
      companyLogoUrl: comp?.img_file_name
        ? getPublicImageUrl(comp.img_file_path, comp.img_file_name, { width: 100, height: 100, resize: 'cover' })
        : undefined,
      periodLabel: period?.label,
      periodStartDate: period?.period_start,
      periodEndDate: period?.period_end ?? null,
    };
  },
};
