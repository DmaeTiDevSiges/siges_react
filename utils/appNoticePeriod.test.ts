import {
  adjustmentsDropData,
  fromDateTimeLocalValue,
  hasPeriodOverlap,
  isShiftOpen,
  pickPeriodsForDate,
  planShiftAdjustments,
  shiftCrossesMidnight,
  suggestNextShiftRange,
  toDateTimeLocalValue,
  validatePeriodWindow,
} from './appNoticePeriod';
import type { NoticeWorkerPeriod } from '../types';

const period = (
  id: number,
  startDate: string,
  endDate: string | null,
  noticeId = 1
): NoticeWorkerPeriod => ({
  id,
  noticeId,
  label: `Período ${id}`,
  startDate,
  endDate,
  positionIndex: 0,
  createdAt: startDate,
  updatedAt: startDate,
});

// Janela de visualização: 20/10/2026 06:00 → 21/10/2026 22:00 (São Paulo)
const WINDOW_START = '2026-10-20T06:00:00';
const WINDOW_END = '2026-10-21T22:00:00';

describe('pickPeriodsForDate — várias escalas no mesmo dia', () => {
  it('devolve TODOS os turnos que intersectam o dia, em ordem cronológica', () => {
    const periods = [
      period(1, '2026-10-20T14:00:00', '2026-10-20T22:00:00'), // tarde
      period(2, '2026-10-20T06:00:00', '2026-10-20T14:00:00'), // manhã (fora de ordem de propósito)
    ];

    const result = pickPeriodsForDate(periods, '2026-10-20', WINDOW_END);

    expect(result.map((p) => p.id)).toEqual([2, 1]);
  });

  it('inclui turno que começa num dia e termina no seguinte', () => {
    const periods = [
      period(1, '2026-10-20T22:00:00', '2026-10-21T06:00:00'), // madrugada
      period(2, '2026-10-20T06:00:00', '2026-10-20T14:00:00'), // manhã do dia 20
    ];

    // No dia 21, só o turno da madrugada intersecta
    expect(pickPeriodsForDate(periods, '2026-10-21', WINDOW_END).map((p) => p.id)).toEqual([1]);
    // No dia 20, ambos
    expect(pickPeriodsForDate(periods, '2026-10-20', WINDOW_END).map((p) => p.id)).toEqual([2, 1]);
  });

  it('exclui turno de outro dia', () => {
    const periods = [period(1, '2026-10-19T06:00:00', '2026-10-19T14:00:00')];
    expect(pickPeriodsForDate(periods, '2026-10-20', WINDOW_END)).toEqual([]);
  });

  it('trata período em aberto como válido até o fim da janela', () => {
    const periods = [period(1, '2026-10-20T06:00:00', null)];
    expect(pickPeriodsForDate(periods, '2026-10-20', WINDOW_END).map((p) => p.id)).toEqual([1]);
    expect(pickPeriodsForDate(periods, '2026-10-21', WINDOW_END).map((p) => p.id)).toEqual([1]);
  });

  it('devolve vazio para data em formato inválido', () => {
    expect(pickPeriodsForDate([period(1, '2026-10-20T06:00:00', null)], '20/10/2026')).toEqual([]);
  });
});

describe('hasPeriodOverlap — turnos não podem se cruzar', () => {
  it('detecta sobreposição parcial', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(
      hasPeriodOverlap(periods, { startDate: '2026-10-20T13:00:00', endDate: '2026-10-20T18:00:00' }, WINDOW_END)
    ).toBe(true);
  });

  it('permite turnos adjacentes (limite compartilhado)', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(
      hasPeriodOverlap(periods, { startDate: '2026-10-20T14:00:00', endDate: '2026-10-20T22:00:00' }, WINDOW_END)
    ).toBe(false);
  });

  it('permite turno totalmente depois', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(
      hasPeriodOverlap(periods, { startDate: '2026-10-20T15:00:00', endDate: '2026-10-20T22:00:00' }, WINDOW_END)
    ).toBe(false);
  });

  it('ignora o próprio período ao editar', () => {
    const periods = [period(7, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(
      hasPeriodOverlap(
        periods,
        { startDate: '2026-10-20T06:00:00', endDate: '2026-10-20T14:00:00' },
        WINDOW_END,
        7
      )
    ).toBe(false);
  });

  it('considera período em aberto até o fim da janela', () => {
    const periods = [period(1, '2026-10-20T06:00:00', null)];
    expect(
      hasPeriodOverlap(periods, { startDate: '2026-10-21T06:00:00', endDate: '2026-10-21T14:00:00' }, WINDOW_END)
    ).toBe(true);
  });

  it('candidato com fim antes do início não é sobreposição', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(
      hasPeriodOverlap(periods, { startDate: '2026-10-20T14:00:00', endDate: '2026-10-20T10:00:00' }, WINDOW_END)
    ).toBe(false);
  });
});

describe('validatePeriodWindow — dentro da janela de visualização', () => {
  it('aceita turno dentro da janela', () => {
    expect(
      validatePeriodWindow(
        { startDate: '2026-10-20T06:00:00', endDate: '2026-10-20T14:00:00' },
        WINDOW_START,
        WINDOW_END
      )
    ).toBeNull();
  });

  it('rejeita início antes da janela', () => {
    expect(
      validatePeriodWindow(
        { startDate: '2026-10-20T05:00:00', endDate: '2026-10-20T14:00:00' },
        WINDOW_START,
        WINDOW_END
      )
    ).toBe('PERIODO_FORA_DA_JANELA');
  });

  it('rejeita fim depois da janela', () => {
    expect(
      validatePeriodWindow(
        { startDate: '2026-10-21T20:00:00', endDate: '2026-10-21T23:00:00' },
        WINDOW_START,
        WINDOW_END
      )
    ).toBe('PERIODO_FORA_DA_JANELA');
  });

  it('aceita turno que encosta exatamente no fim da janela', () => {
    expect(
      validatePeriodWindow(
        { startDate: '2026-10-21T14:00:00', endDate: WINDOW_END },
        WINDOW_START,
        WINDOW_END
      )
    ).toBeNull();
  });

  it('rejeita fim antes do início', () => {
    expect(
      validatePeriodWindow(
        { startDate: '2026-10-20T14:00:00', endDate: '2026-10-20T06:00:00' },
        WINDOW_START,
        WINDOW_END
      )
    ).toBe('PERIODO_INVALIDO');
  });

  it('rejeita fim nulo (turno precisa de janela fechada)', () => {
    expect(
      validatePeriodWindow({ startDate: '2026-10-20T06:00:00', endDate: null }, WINDOW_START, WINDOW_END)
    ).toBe('PERIODO_INVALIDO');
  });
});

describe('toDateTimeLocalValue / fromDateTimeLocalValue', () => {
  it('converte timestamp naive do banco para valor de datetime-local', () => {
    expect(toDateTimeLocalValue('2026-10-20T22:00:00')).toBe('2026-10-20T22:00');
    expect(toDateTimeLocalValue('2026-10-20 06:30:15')).toBe('2026-10-20T06:30');
  });

  it('converte valor de datetime-local de volta para o naive de gravação', () => {
    expect(fromDateTimeLocalValue('2026-10-20T22:00')).toBe('2026-10-20T22:00:00');
  });

  it('devolve string vazia para entrada inválida', () => {
    expect(toDateTimeLocalValue('')).toBe('');
    expect(toDateTimeLocalValue(null)).toBe('');
    expect(fromDateTimeLocalValue('20/10/2026 22:00')).toBe('');
    expect(fromDateTimeLocalValue(undefined)).toBe('');
  });
});

describe('shiftCrossesMidnight — turno com virada de dia', () => {
  it('reconhece virada de dia', () => {
    expect(shiftCrossesMidnight('2026-10-20T22:00:00', '2026-10-21T06:00:00')).toBe(true);
  });

  it('não marca turno no mesmo dia', () => {
    expect(shiftCrossesMidnight('2026-10-20T06:00:00', '2026-10-20T14:00:00')).toBe(false);
  });

  it('não marca quando falta um dos lados', () => {
    expect(shiftCrossesMidnight('', '2026-10-21T06:00:00')).toBe(false);
  });
});

describe('suggestNextShiftRange — primeiro turno cobre a janela', () => {
  it('sem turnos: sugere a JANELA DE VISUALIZAÇÃO inteira', () => {
    expect(suggestNextShiftRange([], WINDOW_START, WINDOW_END)).toEqual({
      start: '2026-10-20T06:00',
      end: '2026-10-21T22:00',
    });
  });

  it('sem turnos e sem janela: devolve vazio (usuário preenche)', () => {
    expect(suggestNextShiftRange([], undefined, undefined)).toEqual({ start: '', end: '' });
  });

  it('com turnos: começa no fim do último e termina no fim da janela', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    expect(suggestNextShiftRange(periods, WINDOW_START, WINDOW_END)).toEqual({
      start: '2026-10-20T14:00',
      end: '2026-10-21T22:00',
    });
  });

  it('com turno noturno: o próximo começa no fim dele, já no dia seguinte', () => {
    const periods = [period(1, '2026-10-20T22:00:00', '2026-10-21T06:00:00')];
    expect(suggestNextShiftRange(periods, WINDOW_START, WINDOW_END)).toEqual({
      start: '2026-10-21T06:00',
      end: '2026-10-21T22:00',
    });
  });

  it('o fim sugerido é sempre o fim da janela, qualquer que seja o último turno', () => {
    const periods = [period(1, '2026-10-19T06:00:00', '2026-10-19T14:00:00')];
    expect(suggestNextShiftRange(periods, WINDOW_START, WINDOW_END).end).toBe('2026-10-21T22:00');
  });

  it('último turno em aberto: começa no início da janela e termina no fim dela', () => {
    const periods = [period(1, '2026-10-20T06:00:00', null)];
    expect(suggestNextShiftRange(periods, WINDOW_START, WINDOW_END)).toEqual({
      start: '2026-10-20T06:00',
      end: '2026-10-21T22:00',
    });
  });
});

describe('turno noturno no dia consultado', () => {
  it('aparece como escala do dia de início E do dia de término', () => {
    const periods = [period(1, '2026-10-20T22:00:00', '2026-10-21T06:00:00')];

    expect(pickPeriodsForDate(periods, '2026-10-20', WINDOW_END).map((p) => p.id)).toEqual([1]);
    expect(pickPeriodsForDate(periods, '2026-10-21', WINDOW_END).map((p) => p.id)).toEqual([1]);
  });

  it('não vaza para além do dia de término', () => {
    const periods = [period(1, '2026-10-20T22:00:00', '2026-10-21T06:00:00')];
    expect(pickPeriodsForDate(periods, '2026-10-22', WINDOW_END)).toEqual([]);
  });
});

describe('primeiro turno = janela inteira', () => {
  it('o intervalo sugerido para o 1º turno é aceito por validatePeriodWindow', () => {
    const suggested = suggestNextShiftRange([], WINDOW_START, WINDOW_END);
    expect(
      validatePeriodWindow(
        {
          startDate: fromDateTimeLocalValue(suggested.start),
          endDate: fromDateTimeLocalValue(suggested.end),
        },
        WINDOW_START,
        WINDOW_END
      )
    ).toBeNull();
  });

  it('o intervalo sugerido para o 1º turno não sobrepõe nada (lista vazia)', () => {
    const suggested = suggestNextShiftRange([], WINDOW_START, WINDOW_END);
    expect(
      hasPeriodOverlap(
        [],
        {
          startDate: fromDateTimeLocalValue(suggested.start),
          endDate: fromDateTimeLocalValue(suggested.end),
        },
        WINDOW_END
      )
    ).toBe(false);
  });

  it('depois do 1º turno (janela inteira), criar outro turno acusa sobreposição', () => {
    const periods = [period(1, fromDateTimeLocalValue('2026-10-20T06:00'), WINDOW_END)];
    expect(
      hasPeriodOverlap(
        periods,
        { startDate: '2026-10-21T06:00:00', endDate: '2026-10-21T14:00:00' },
        WINDOW_END
      )
    ).toBe(true);
  });
});

describe('planShiftAdjustments — encadeamento automático das escalas', () => {
  const cand = (start: string, end: string) => ({ startDate: start, endDate: end });

  it('sem escalas anteriores: nada a ajustar', () => {
    const plan = planShiftAdjustments([], cand('2026-10-20T06:00:00', '2026-10-20T14:00:00'), WINDOW_END);
    expect(plan).toEqual({
      startDate: '2026-10-20T06:00:00',
      removals: [],
      truncations: [],
      startAdjustments: [],
    });
  });

  it('corta a anterior no início da nova (06:00-22:00 + nova 14:00-22:00)', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T22:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T14:00:00', '2026-10-20T22:00:00'), WINDOW_END);

    expect(plan.startDate).toBe('2026-10-20T14:00:00');
    expect(plan.truncations).toEqual([{ id: 1, endDate: '2026-10-20T14:00:00' }]);
    expect(plan.removals).toEqual([]);
  });

  it('escalas que já encostam não são ajustadas', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T14:00:00', '2026-10-20T22:00:00'), WINDOW_END);

    expect(plan.startDate).toBe('2026-10-20T14:00:00');
    expect(plan.truncations).toEqual([]);
    expect(plan.removals).toEqual([]);
  });

  it('ESTICA a nova para trás quando há vão (anterior 06:00-14:00 + nova 16:00-22:00)', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T14:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T16:00:00', '2026-10-20T22:00:00'), WINDOW_END);

    expect(plan.startDate).toBe('2026-10-20T14:00:00');
    expect(plan.truncations).toEqual([]);
    expect(plan.removals).toEqual([]);
  });

  it('remove escala inteiramente engolida pela nova', () => {
    const periods = [period(1, '2026-10-20T08:00:00', '2026-10-20T10:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T06:00:00', '2026-10-20T14:00:00'), WINDOW_END);

    expect(plan.removals).toEqual([1]);
  });

  it('corta no fim da nova o que sobra depois dela (06:00-22:00 + nova 14:00-18:00)', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T22:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T14:00:00', '2026-10-20T18:00:00'), WINDOW_END);

    // A anterior vira 06:00-14:00; o resto (18:00-22:00) é descartado.
    expect(plan.truncations).toEqual([{ id: 1, endDate: '2026-10-20T14:00:00' }]);
    expect(plan.removals).toEqual([]);
  });

  it('fecha escala em aberto no início da nova', () => {
    const periods = [period(1, '2026-10-20T06:00:00', null)];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T14:00:00', '2026-10-20T22:00:00'), WINDOW_END);

    expect(plan.truncations).toEqual([{ id: 1, endDate: '2026-10-20T14:00:00' }]);
  });

  it('escala em aberto é fechada no início da nova (sem esticar)', () => {
    const periods = [period(1, '2026-10-20T06:00:00', null)];
    // A aberta é fechada no início da nova — não há vão a esticar, porque o
    // próprio fechamento já encadeia as duas escalas.
    const plan = planShiftAdjustments(periods, cand('2026-10-21T23:00:00', '2026-10-21T23:30:00'), WINDOW_END);

    expect(plan.startDate).toBe('2026-10-21T23:00:00');
    expect(plan.truncations).toEqual([{ id: 1, endDate: '2026-10-21T23:00:00' }]);
  });

  it('escalas posteriores fora do intervalo da nova não são tocadas', () => {
    const periods = [period(1, '2026-10-21T06:00:00', '2026-10-21T14:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T06:00:00', '2026-10-20T14:00:00'), WINDOW_END);

    expect(plan.truncations).toEqual([]);
    expect(plan.removals).toEqual([]);
  });

  it('ajusta a escala imediatamente anterior, não uma mais antiga', () => {
    const periods = [
      period(1, '2026-10-20T06:00:00', '2026-10-20T12:00:00'),
      period(2, '2026-10-20T12:00:00', '2026-10-20T18:00:00'),
    ];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T16:00:00', '2026-10-20T22:00:00'), WINDOW_END);

    // A #2 (12:00-18:00) é a anterior: invade 16:00 → corta em 16:00
    expect(plan.truncations).toEqual([{ id: 2, endDate: '2026-10-20T16:00:00' }]);
    expect(plan.removals).toEqual([]);
  });

  it('candidato inválido (fim antes do início) não produz ajustes', () => {
    const periods = [period(1, '2026-10-20T06:00:00', '2026-10-20T22:00:00')];
    const plan = planShiftAdjustments(periods, cand('2026-10-20T18:00:00', '2026-10-20T10:00:00'), WINDOW_END);
    expect(plan).toEqual({
      startDate: '2026-10-20T18:00:00',
      removals: [],
      truncations: [],
      startAdjustments: [],
    });
  });
});

describe('adjustmentsDropData', () => {
  it('não avisa em encadeamento simples', () => {
    const plan = planShiftAdjustments(
      [period(1, '2026-10-20T06:00:00', '2026-10-20T22:00:00')],
      { startDate: '2026-10-20T14:00:00', endDate: '2026-10-20T22:00:00' },
      WINDOW_END
    );
    expect(adjustmentsDropData(plan)).toBe(false);
  });

  it('avisa quando uma escala é removida', () => {
    const plan = planShiftAdjustments(
      [period(1, '2026-10-20T08:00:00', '2026-10-20T10:00:00')],
      { startDate: '2026-10-20T06:00:00', endDate: '2026-10-20T14:00:00' },
      WINDOW_END
    );
    expect(adjustmentsDropData(plan)).toBe(true);
  });
});

describe('isShiftOpen — critério de edição (escala em curso)', () => {
  const at = (iso: string) => new Date(iso);

  it('escala em curso é editável', () => {
    const p = { startDate: '2026-10-20T06:00:00', endDate: '2026-10-20T14:00:00' };
    expect(isShiftOpen(p, at('2026-10-20T10:00:00-03:00'))).toBe(true);
  });

  it('escala encerrada não é editável', () => {
    const p = { startDate: '2026-10-20T06:00:00', endDate: '2026-10-20T14:00:00' };
    expect(isShiftOpen(p, at('2026-10-20T15:00:00-03:00'))).toBe(false);
  });

  it('turno noturno continua editável depois da meia-noite', () => {
    const p = { startDate: '2026-10-20T22:00:00', endDate: '2026-10-21T06:00:00' };
    expect(isShiftOpen(p, at('2026-10-21T02:00:00-03:00'))).toBe(true);
    expect(isShiftOpen(p, at('2026-10-21T07:00:00-03:00'))).toBe(false);
  });

  it('escala no futuro é editável (ainda não terminou)', () => {
    const p = { startDate: '2026-10-21T06:00:00', endDate: '2026-10-21T14:00:00' };
    expect(isShiftOpen(p, at('2026-10-20T10:00:00-03:00'))).toBe(true);
  });

  it('escala em aberto vale até o fim da janela', () => {
    const p = { startDate: '2026-10-20T06:00:00', endDate: null };
    expect(isShiftOpen(p, at('2026-10-21T21:00:00-03:00'), WINDOW_END)).toBe(true);
    expect(isShiftOpen(p, at('2026-10-21T23:00:00-03:00'), WINDOW_END)).toBe(false);
  });

  it('sem escala selecionada não é editável', () => {
    expect(isShiftOpen(null, at('2026-10-20T10:00:00-03:00'))).toBe(false);
  });
});
