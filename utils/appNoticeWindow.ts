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
