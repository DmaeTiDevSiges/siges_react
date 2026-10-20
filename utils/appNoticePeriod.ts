import {
  addBrazilCalendarDays,
  getBrazilDateInputValue,
  parseBrazilDate,
} from './formatters';

import type { NoticeWorkerPeriod } from '../types';

/**
 * Utilitários do modelo de períodos de MO extra por aviso.
 * Regras (mesmas do service/banco):
 * - `period_end === null` = período em aberto (vigente), que vale até o
 *   fim da JANELA DE VISUALIZAÇÃO do aviso (`view_end_date`);
 * - a cadeia é contínua (end(p) = start(p+1) e o último termina na janela);
 * - todas as comparações usam horário de São Paulo (parseBrazilDate),
 *   nunca o fuso do aparelho (regra de fuso do AGENTS.md).
 */

const effectiveEnd = (
  period: Pick<NoticeWorkerPeriod, 'endDate'>,
  windowEndDate?: string
): number => {
  if (period.endDate) return parseBrazilDate(period.endDate).getTime();
  if (windowEndDate) return parseBrazilDate(windowEndDate).getTime();
  // Sem janela conhecida, o período em aberto vale indefinidamente
  return Number.POSITIVE_INFINITY;
};

/**
 * A escala (turno) ainda está em curso no instante `now`?
 *
 * Diferente de `pickPeriodForNow` (que exige já ter começado), aqui basta não
 * ter TERMINADO — é o critério de edição: escala passada é consulta, escala em
 * curso ou futura pode receber lançamento. Período em aberto vale até o fim da
 * janela de visualização.
 */
export const isShiftOpen = (
  period: Pick<NoticeWorkerPeriod, 'startDate' | 'endDate'> | null | undefined,
  now: Date = new Date(),
  windowEndDate?: string
): boolean => {
  if (!period) return false;
  const start = parseBrazilDate(period.startDate).getTime();
  if (Number.isNaN(start)) return false;
  return effectiveEnd(period, windowEndDate) > now.getTime();
};

/**
 * Período que contém o instante `now` (SP): o de maior start <= now com fim
 * efetivo > now. Como a cadeia é contínua, devolver o último candidato
 * equivale a devolver o período vigente do momento.
 */
export const pickPeriodForNow = (
  periods: NoticeWorkerPeriod[],
  now: Date = new Date(),
  windowEndDate?: string
): NoticeWorkerPeriod | null => {
  const instant = now.getTime();
  let picked: NoticeWorkerPeriod | null = null;
  periods.forEach((period) => {
    const start = parseBrazilDate(period.startDate);
    if (Number.isNaN(start.getTime())) return;
    if (start.getTime() > instant) return;
    if (effectiveEnd(period, windowEndDate) <= instant) return;
    if (!picked || start.getTime() >= parseBrazilDate(picked.startDate).getTime()) {
      picked = period;
    }
  });
  return picked;
};

/**
 * Período de uma DATA (dia em São Paulo, `YYYY-MM-DD`): o de maior
 * period_start que intersecta o dia [00:00, 00:00+1). Dias sem lançamento
 * carregam a escala do período anterior (cadeia contínua).
 */
export const pickPeriodForDate = (
  periods: NoticeWorkerPeriod[],
  dateISO: string,
  windowEndDate?: string
): NoticeWorkerPeriod | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  const dayStart = parseBrazilDate(`${dateISO}T00:00:00`).getTime();
  const dayEnd = parseBrazilDate(`${addBrazilCalendarDays(dateISO, 1)}T00:00:00`).getTime();
  if (Number.isNaN(dayStart) || Number.isNaN(dayEnd)) return null;

  let picked: NoticeWorkerPeriod | null = null;
  periods.forEach((period) => {
    const start = parseBrazilDate(period.startDate);
    if (Number.isNaN(start.getTime()) || start.getTime() >= dayEnd) return;
    if (effectiveEnd(period, windowEndDate) <= dayStart) return;
    if (!picked || start.getTime() >= parseBrazilDate(picked.startDate).getTime()) {
      picked = period;
    }
  });
  return picked;
};

/** O período em aberto (vigente), se houver. */
export const findOpenPeriod = (
  periods: NoticeWorkerPeriod[]
): NoticeWorkerPeriod | null => {
  const open = periods.find((p) => p.endDate === null);
  return open || null;
};

/** Fim efetivo em ms de um período (para comparação de sobreposição). */
const endMs = (period: NoticeWorkerPeriod, windowEndDate?: string): number => {
  if (period.endDate) return parseBrazilDate(period.endDate).getTime();
  if (windowEndDate) return parseBrazilDate(windowEndDate).getTime();
  return Number.POSITIVE_INFINITY;
};

/**
 * Escalas de uma DATA (São Paulo, `YYYY-MM-DD`), da mais cedo para a mais
 * tarde. Diferente de `pickPeriodForDate`, devolve TODAS as escalas que
 * intersectam o dia — é o que permite várias escalas no mesmo dia.
 */
export const pickPeriodsForDate = (
  periods: NoticeWorkerPeriod[],
  dateISO: string,
  windowEndDate?: string
): NoticeWorkerPeriod[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return [];
  const dayStart = parseBrazilDate(`${dateISO}T00:00:00`).getTime();
  const dayEnd = parseBrazilDate(`${addBrazilCalendarDays(dateISO, 1)}T00:00:00`).getTime();
  if (Number.isNaN(dayStart) || Number.isNaN(dayEnd)) return [];

  return periods
    .filter((period) => {
      const start = parseBrazilDate(period.startDate).getTime();
      if (Number.isNaN(start) || start >= dayEnd) return false;
      // Intersecta o dia se não termina antes (ou exatamente no) seu início
      return endMs(period, windowEndDate) > dayStart;
    })
    .sort(
      (a, b) =>
        parseBrazilDate(a.startDate).getTime() - parseBrazilDate(b.startDate).getTime()
    );
};

/**
 * Há sobreposição com algum período existente?
 *
 * Compara por INSTANTE (início/fim), não por dia: duas escalas no mesmo dia são
 * válidos desde que não se cruzem (ex.: 06:00-14:00 e 14:00-22:00 — o limite
 * compartilhado é permitido). `excludePeriodId` ignora o próprio período ao
 * editar.
 */
export const hasPeriodOverlap = (
  periods: NoticeWorkerPeriod[],
  candidate: { startDate: string; endDate: string | null },
  windowEndDate?: string,
  excludePeriodId?: number
): boolean => {
  const start = parseBrazilDate(candidate.startDate).getTime();
  const end = candidate.endDate
    ? parseBrazilDate(candidate.endDate).getTime()
    : windowEndDate
      ? parseBrazilDate(windowEndDate).getTime()
      : Number.POSITIVE_INFINITY;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return false;

  return periods.some((period) => {
    if (excludePeriodId !== undefined && period.id === excludePeriodId) return false;
    const pStart = parseBrazilDate(period.startDate).getTime();
    const pEnd = endMs(period, windowEndDate);
    if (Number.isNaN(pStart) || Number.isNaN(pEnd)) return false;
    // Sobreposição de intervalos semiabertos [start, end)
    return start < pEnd && pStart < end;
  });
};

/**
 * Ajustes a aplicar nas escalas existentes quando uma nova escala é criada.
 *
 * Regras de negócio (definidas pelo usuário):
 * - o fim da escala anterior é ajustado para o início da nova (encadeamento);
 * - escala que invade o intervalo da nova é CORTADA no início da nova — o que
 *   sobra depois do fim da nova é descartado;
 * - escala totalmente engolida pela nova é REMOVIDA;
 * - escala em aberto (`endDate === null`, modelo antigo) é FECHADA no início
 *   da nova;
 * - se há vão entre o fim da anterior e o início da nova, a nova é ESTICADA
 *   para trás até o fim da anterior (cadeia contínua).
 */
export interface ShiftAdjustments {
  /** Início efetivo da nova escala (esticado para trás para cobrir o vão). */
  startDate: string;
  /** Escalas a remover por estarem inteiramente contidas na nova. */
  removals: number[];
  /** Escalas a ter o fim ajustado (fechar/cortar) no início da nova. */
  truncations: { id: number; endDate: string }[];
  /**
   * Escalas POSTERIORES que passam a começar exatamente no fim da nova — é o
   * que mantém a cadeia contínua quando a escala nasce fora de ordem
   * cronológica (no meio ou antes das existentes).
   */
  startAdjustments: { id: number; startDate: string }[];
}

export const planShiftAdjustments = (
  periods: NoticeWorkerPeriod[],
  candidate: { startDate: string; endDate: string },
  windowEndDate?: string
): ShiftAdjustments => {
  const candStart = parseBrazilDate(candidate.startDate).getTime();
  const candEnd = parseBrazilDate(candidate.endDate).getTime();

  const result: ShiftAdjustments = {
    startDate: candidate.startDate,
    removals: [],
    truncations: [],
    startAdjustments: [],
  };
  if (Number.isNaN(candStart) || Number.isNaN(candEnd) || candEnd <= candStart) return result;

  // Escalas ANTERIORES à nova (começam antes dela), da mais recente para a
  // mais antiga — é a mais recente que define onde a nova começa.
  const previous = periods
    .filter((p) => {
      const pStart = parseBrazilDate(p.startDate).getTime();
      return !Number.isNaN(pStart) && pStart < candStart;
    })
    .sort(
      (a, b) =>
        parseBrazilDate(b.startDate).getTime() - parseBrazilDate(a.startDate).getTime()
    );

  if (previous.length > 0) {
    const last = previous[0];
    const lastEnd = endMs(last, windowEndDate);

    if (last.endDate === null) {
      // Escala em aberto (modelo antigo): é FECHADA no início da nova. Não há
      // vão a esticar — o próprio fechamento já encadeia as duas.
      result.truncations.push({ id: last.id, endDate: candidate.startDate });
    } else if (lastEnd < candStart) {
      // Vão entre duas escalas fechadas → estica a nova para trás até o fim
      // da anterior, mantendo a cadeia contínua.
      result.startDate = last.endDate;
    } else if (lastEnd > candStart) {
      // A anterior invade o intervalo da nova → corta no início da nova.
      result.truncations.push({ id: last.id, endDate: candidate.startDate });
    }
    // lastEnd === candStart → já encostam, nada a ajustar.
  }

  // Escalas que se sobrepõem ao intervalo efetivo da nova: engolidas somem,
  // as que sobram depois do fim da nova são cortadas no início da nova.
  const effectiveStart = parseBrazilDate(result.startDate).getTime();
  periods.forEach((p) => {
    const pStart = parseBrazilDate(p.startDate).getTime();
    if (Number.isNaN(pStart) || pStart < effectiveStart) return;
    const pEnd = endMs(p, windowEndDate);
    if (Number.isNaN(pEnd) || pEnd <= effectiveStart) return;

    if (pStart >= effectiveStart && pEnd <= candEnd) {
      // Totalmente contida na nova: o banco exige fim > início, então só
      // resta REMOVER. Se tiver lançamentos, o service bloqueia antes
      // (remover apagaria os lançamentos em cascata).
      result.removals.push(p.id);
    } else if (pStart < candEnd && pEnd > candEnd) {
      // Começa dentro da nova e termina depois dela → o excedente é
      // descartado (o que sobra depois do fim da nova).
      result.truncations.push({ id: p.id, endDate: candidate.endDate });
    }
  });

  // Cadeia contínua também nas escalas POSTERIORES: qualquer escala que comece
  // dentro de [início efetivo, fim] da nova passa a começar no fim da nova.
  // Covers the case where a shift is created OUT OF ORDER (mid-chain): without
  // this, subsequent shifts become disconnected (previous.end ≠ next.start).
  const removedIds = new Set(result.removals);
  periods.forEach((p) => {
    if (removedIds.has(p.id)) return;
    const pStart = parseBrazilDate(p.startDate).getTime();
    if (Number.isNaN(pStart)) return;
    // Só as que nascem DENTRO do intervalo da nova (as que começam depois do
    // fim da nova já encostam naturalmente ou foram cortadas acima).
    if (pStart <= effectiveStart || pStart >= candEnd) return;
    // Se já encosta no fim da nova, nada a fazer.
    if (pStart === candEnd) return;

    result.startAdjustments.push({ id: p.id, startDate: candidate.endDate });
  });

  return result;
};

/**
 * Houve perda de dados (escala removida ou tempo descartado) que merece aviso
 * ao usuário? Encadeamento simples — fechar a anterior no início da nova — não
 * conta, porque é o comportamento esperado.
 */
export const adjustmentsDropData = (adjustments: ShiftAdjustments): boolean =>
  adjustments.removals.length > 0 ||
  adjustments.truncations.some((t) => t.endDate !== adjustments.startDate);


export const validatePeriodWindow = (
  candidate: { startDate: string; endDate: string | null },
  windowStartDate?: string,
  windowEndDate?: string
): 'PERIODO_FORA_DA_JANELA' | 'PERIODO_INVALIDO' | null => {
  const start = parseBrazilDate(candidate.startDate).getTime();
  const end = candidate.endDate ? parseBrazilDate(candidate.endDate).getTime() : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 'PERIODO_INVALIDO';

  if (windowStartDate) {
    const wStart = parseBrazilDate(windowStartDate).getTime();
    if (!Number.isNaN(wStart) && start < wStart) return 'PERIODO_FORA_DA_JANELA';
  }
  if (windowEndDate) {
    const wEnd = parseBrazilDate(windowEndDate).getTime();
    if (!Number.isNaN(wEnd) && end > wEnd) return 'PERIODO_FORA_DA_JANELA';
  }
  return null;
};

/** Data/hora legível em São Paulo: "20/10/2026 09:41h" (meia-noite não vira 24h). */
const formatSpInstant = (value: string): string => {
  const d = parseBrazilDate(value);
  if (Number.isNaN(d.getTime())) return 'data inválida';
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const map = new Map(parts.map((p) => [p.type, p.value]));
  return `${map.get('day')}/${map.get('month')}/${map.get('year')} ${map.get('hour')}:${map.get('minute')}h`;
};

/** Descrição legível para badge do período vigente / consulta. */
export const describePeriod = (
  period: NoticeWorkerPeriod,
  windowEndDate?: string
): string => {
  if (period.endDate === null) {
    const until = windowEndDate
      ? `vale até o fim da janela de visualização (${formatSpInstant(windowEndDate)})`
      : 'em aberto';
    return `desde ${formatSpInstant(period.startDate)} · ${until}`;
  }
  return `${formatSpInstant(period.startDate)} — ${formatSpInstant(period.endDate)}`;
};

/** Dia atual do app em São Paulo como `YYYY-MM-DD` (atalho para as telas). */
export const getTodayInputValue = (): string => getBrazilDateInputValue();

/**
 * Converte um timestamp naive do banco (`YYYY-MM-DDTHH:mm:ss`) no valor aceito
 * por `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`). O valor é o mesmo
 * horário de São Paulo — não há conversão de fuso, só de formato.
 */
export const toDateTimeLocalValue = (naiveTimestamp?: string | null): string => {
  if (!naiveTimestamp) return '';
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(naiveTimestamp);
  return match ? `${match[1]}T${match[2]}` : '';
};

/**
 * Converte o valor de `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`) no
 * timestamp naive a gravar (`YYYY-MM-DDTHH:mm:00`).
 */
export const fromDateTimeLocalValue = (inputValue?: string | null): string => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(inputValue || '');
  return match ? `${match[1]}T${match[2]}:00` : '';
};

/** A escala termina em dia posterior ao de início? */
export const shiftCrossesMidnight = (
  startNaive: string,
  endNaive: string
): boolean => {
  if (!startNaive || !endNaive) return false;
  return getBrazilDateInputValue(startNaive) !== getBrazilDateInputValue(endNaive);
};

/**
 * Suggested range for creating the NEXT shift.
 *
 * Rules (defined by user):
 * - End is ALWAYS the view window end date (`windowEndDate`)
 * - No shifts yet: start is the view window start date (`windowStartDate`),
 *   so the shift covers the entire window
 * - With existing shifts: start is the END of the previous shift (chaining),
 *   and falls back to window start when the last shift is open
 */
export const suggestNextShiftRange = (
  periods: NoticeWorkerPeriod[],
  windowStartDate?: string,
  windowEndDate?: string
): { start: string; end: string } => {
  const windowStart = toDateTimeLocalValue(windowStartDate);
  const windowEnd = toDateTimeLocalValue(windowEndDate);

  // Primeira escala da notice: a janela inteira
  if (periods.length === 0) {
    return { start: windowStart, end: windowEnd };
  }

  const sorted = [...periods].sort(
    (a, b) => parseBrazilDate(a.startDate).getTime() - parseBrazilDate(b.startDate).getTime()
  );
  const last = sorted[sorted.length - 1];

  // Último aberto (modelo antigo): vale até o fim da janela, então não há fim
  // de escala anterior em que encostar — a nova escala começa no início dela.
  if (!last.endDate) {
    return { start: windowStart, end: windowEnd };
  }

  return { start: toDateTimeLocalValue(last.endDate), end: windowEnd };
};

/**
 * Sugere o horário de início de uma NOVA escala num dia (formato `HH:mm`).
 * Mantido para usos que só precisam do horário; `suggestNextShiftRange` é o
 * caminho principal (datas completas).
 */
export const suggestNextShiftStart = (
  dayPeriods: NoticeWorkerPeriod[],
  dateISO: string,
  fallbackHour = '06:00'
): string => {
  if (dayPeriods.length === 0) return fallbackHour;

  // Última escala do dia por início; se estiver aberta, usa o horário padrão
  const sorted = [...dayPeriods].sort(
    (a, b) => parseBrazilDate(a.startDate).getTime() - parseBrazilDate(b.startDate).getTime()
  );
  const last = sorted[sorted.length - 1];

  if (!last.endDate) {
    return fallbackHour;
  }
  // Escala que termina em outro dia: a madrugada do dia consultado já foi
  // coberta por ela, então a nova escala começa no horário padrão.
  if (getBrazilDateInputValue(last.endDate) !== dateISO) return fallbackHour;

  const end = parseBrazilDate(last.endDate);
  if (Number.isNaN(end.getTime())) return fallbackHour;
  const hh = String(end.getHours()).padStart(2, '0');
  const mm = String(end.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
