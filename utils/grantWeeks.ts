import { formatDateInBrazil } from './formatters';

/**
 * Semanas reais (segunda a domingo) do Cronograma (Gestão > Cronograma).
 *
 * A grade vai da segunda-feira da semana de 1º/jan ao domingo da semana de 31/dez, então
 * todo dia do ano cai numa coluna (53 ou 54 semanas). Cada semana pertence ao mês da sua
 * quinta-feira (regra ISO), limitado ao ano: a semana de 29/12–04/01 fica em JAN.
 */
export interface GrantWeek {
    index: number;
    /** Segunda-feira (YYYY-MM-DD). */
    start: string;
    /** Domingo (YYYY-MM-DD). */
    end: string;
    /** 0..11 — mês do cabeçalho. */
    month: number;
    /** Dia exibido no cabeçalho: 1º dia da semana dentro do ano ("01", "05", ...). */
    label: string;
}

const DAY_MS = 86_400_000;
const utcOf = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
};
const isoOf = (utc: number) => new Date(utc).toISOString().slice(0, 10);

export const buildYearWeeks = (year: number): GrantWeek[] => {
    const jan1 = Date.UTC(year, 0, 1);
    const dec31 = Date.UTC(year, 11, 31);
    const weekdayJan1 = (new Date(jan1).getUTCDay() + 6) % 7; // 0 = segunda
    const weeks: GrantWeek[] = [];
    for (let monday = jan1 - weekdayJan1 * DAY_MS, index = 0; monday <= dec31; monday += 7 * DAY_MS, index++) {
        const thursday = new Date(monday + 3 * DAY_MS);
        const month = thursday.getUTCFullYear() < year ? 0 : thursday.getUTCFullYear() > year ? 11 : thursday.getUTCMonth();
        const firstDayInYear = new Date(Math.max(monday, jan1));
        weeks.push({
            index,
            start: isoOf(monday),
            end: isoOf(monday + 6 * DAY_MS),
            month,
            label: String(firstDayInYear.getUTCDate()).padStart(2, '0'),
        });
    }
    return weeks;
};

/**
 * Dia (YYYY-MM-DD) no fuso de São Paulo. Timestamp sem offset já é horário de São Paulo
 * (usa a data como está); com Z/offset é um instante e é convertido.
 */
export const toBrazilDay = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const naive = /^(\d{4}-\d{2}-\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.exec(value.trim());
    if (naive) return naive[1];
    const formatted = formatDateInBrazil(value, 'date', 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return /^\d{4}-\d{2}-\d{2}$/.test(formatted) ? formatted : null;
};

/** Índice da semana do dia; -1 = antes da grade (ano anterior), weeks.length = depois (ano seguinte). */
export const weekIndexOf = (day: string, weeks: GrantWeek[]): number => {
    if (weeks.length === 0) return -1;
    const offset = Math.floor((utcOf(day) - utcOf(weeks[0].start)) / (7 * DAY_MS));
    if (offset < 0) return -1;
    if (offset >= weeks.length) return weeks.length;
    return offset;
};

/** Quantas semanas cada mês ocupa no cabeçalho (sempre os 12 meses, na ordem). */
export const monthWeekCounts = (weeks: GrantWeek[]): number[] => {
    const counts = new Array(12).fill(0);
    weeks.forEach(w => { counts[w.month] += 1; });
    return counts;
};

/** Última semana de cada mês (para a borda mais grossa entre meses). */
export const isLastWeekOfMonth = (weeks: GrantWeek[], index: number) =>
    index === weeks.length - 1 || weeks[index + 1].month !== weeks[index].month;
