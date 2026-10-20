import { parseBrazilDate } from './formatters';

interface NoticeViewWindow {
    isActive: boolean;
    viewStartDate: string;
    viewEndDate: string;
}

interface NoticeVigencia {
    startDate: string;
    endDate: string;
}

/**
 * Datas vindas do banco são `timestamp without time zone` gravados em horário
 * de São Paulo. Sempre interprete-as como esse fuso (parseBrazilDate) e compare
 * com instantes — nunca com `new Date(valor_naive)`, que usa o fuso do aparelho.
 */
const isWithinInterval = (startValue: string, endValue: string, now: Date): boolean => {
    const start = parseBrazilDate(startValue);
    const end = parseBrazilDate(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start <= now && end >= now;
};

export const isNoticeWithinViewWindow = (
    notice: NoticeViewWindow,
    now: Date = new Date()
): boolean => notice.isActive && isWithinInterval(notice.viewStartDate, notice.viewEndDate, now);

export const isNoticeWithinVigencia = (
    notice: NoticeVigencia,
    now: Date = new Date()
): boolean => isWithinInterval(notice.startDate, notice.endDate, now);

export const isNoticeExpired = (
    notice: NoticeVigencia,
    now: Date = new Date()
): boolean => {
    const end = parseBrazilDate(notice.endDate);
    return !Number.isNaN(end.getTime()) && end < now;
};

/**
 * Situação da janela de visualização de um aviso: em curso, ainda não iniciada
 * ou encerrada.
 *
 * Regra do produto: a MO extra é lançada dentro da JANELA DE VISUALIZAÇÃO
 * (view_start_date/view_end_date) — a vigência (start_date/end_date) apenas
 * define a validade do aviso e não libera nem impede lançamento.
 */
export type JanelaStatus = 'active' | 'future' | 'ended';

export const getNoticeJanelaStatus = (
    notice: { viewStartDate: string; viewEndDate: string },
    now: Date = new Date()
): JanelaStatus => {
    if (isWithinInterval(notice.viewStartDate, notice.viewEndDate, now)) return 'active';
    const start = parseBrazilDate(notice.viewStartDate).getTime();
    if (!Number.isNaN(start) && start > now.getTime()) return 'future';
    return 'ended';
};

/** Motivo que impede o lançamento de MO extra no momento. */
export type BloqueioLancamento =
    | 'sem_permissao_edicao'
    | 'sem_aviso'
    | 'escala_encerrada'
    | 'janela_futura'
    | 'janela_encerrada'
    | 'indisponivel';

/**
 * Por que o lançamento de MO extra está bloqueado (null = liberado).
 *
 * Regras: é preciso ter permissão de edição, um aviso selecionado, a escala
 * (escala) selecionada ainda em curso — escalas já encerradas são consulta — e
 * a janela de visualização do aviso em curso.
 *
 * A janela tem prioridade sobre a escala encerrada: um aviso fora da janela
 * não é um problema de escala escolhida, e sim de janela.
 */
export const getBloqueioLancamento = (params: {
    canEdit: boolean;
    hasNotice: boolean;
    isShiftOpen: boolean;
    janelaStatus: JanelaStatus | null;
}): BloqueioLancamento | null => {
    const { canEdit, hasNotice, isShiftOpen, janelaStatus } = params;
    if (canEdit && hasNotice && isShiftOpen && janelaStatus === 'active') return null;
    if (!canEdit) return 'sem_permissao_edicao';
    if (!hasNotice) return 'sem_aviso';
    if (janelaStatus === 'future') return 'janela_futura';
    if (janelaStatus === 'ended') return 'janela_encerrada';
    if (!isShiftOpen) return 'escala_encerrada';
    return 'indisponivel';
};
