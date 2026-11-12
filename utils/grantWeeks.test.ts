import { buildYearWeeks, isLastWeekOfMonth, monthWeekCounts, toBrazilDay, weekIndexOf } from './grantWeeks';

describe('buildYearWeeks', () => {
    it('2026: começa na segunda 29/12/2025 e cobre até 31/12/2026', () => {
        const weeks = buildYearWeeks(2026); // 01/01/2026 é quinta
        expect(weeks[0].start).toBe('2025-12-29');
        expect(weeks[0].month).toBe(0);
        expect(weeks[0].label).toBe('01');
        const last = weeks[weeks.length - 1];
        expect(last.start <= '2026-12-31' && last.end >= '2026-12-31').toBe(true);
        expect(weeks).toHaveLength(53);
    });

    it('semanas são consecutivas, de segunda a domingo', () => {
        const weeks = buildYearWeeks(2027);
        weeks.forEach((w, i) => {
            expect(new Date(`${w.start}T00:00:00Z`).getUTCDay()).toBe(1);
            expect(new Date(`${w.end}T00:00:00Z`).getUTCDay()).toBe(0);
            if (i > 0) expect(w.index).toBe(weeks[i - 1].index + 1);
        });
    });

    it('todo mês tem 4 ou 5 semanas e o total bate', () => {
        for (const year of [2024, 2025, 2026, 2027, 2028]) {
            const weeks = buildYearWeeks(year);
            const counts = monthWeekCounts(weeks);
            counts.forEach(c => expect(c === 4 || c === 5).toBe(true));
            expect(counts.reduce((a, b) => a + b, 0)).toBe(weeks.length);
        }
    });

    it('marca a última semana de cada mês', () => {
        const weeks = buildYearWeeks(2026);
        expect(weeks.filter((_, i) => isLastWeekOfMonth(weeks, i))).toHaveLength(12);
    });
});

describe('weekIndexOf', () => {
    const weeks = buildYearWeeks(2026);
    it('dias da mesma semana caem na mesma coluna (sem o "S4" de 10 dias)', () => {
        expect(weekIndexOf('2026-06-22', weeks)).toBe(weekIndexOf('2026-06-28', weeks));
        expect(weekIndexOf('2026-06-29', weeks)).toBe(weekIndexOf('2026-06-22', weeks) + 1);
    });
    it('fora do ano: -1 antes, length depois', () => {
        expect(weekIndexOf('2025-12-01', weeks)).toBe(-1);
        expect(weekIndexOf('2027-02-01', weeks)).toBe(weeks.length);
        expect(weekIndexOf('2025-12-30', weeks)).toBe(0); // mesma semana de 01/01/2026
    });
});

describe('toBrazilDay', () => {
    it('timestamp sem offset = horário de São Paulo, usa a data como está', () => {
        expect(toBrazilDay('2026-06-01 23:30:00')).toBe('2026-06-01');
        expect(toBrazilDay('2026-06-01')).toBe('2026-06-01');
    });
    it('instante UTC é convertido para o dia em São Paulo', () => {
        expect(toBrazilDay('2026-06-02T01:30:00Z')).toBe('2026-06-01');
    });
    it('vazio ou inválido', () => {
        expect(toBrazilDay('')).toBeNull();
        expect(toBrazilDay(null)).toBeNull();
        expect(toBrazilDay('abc')).toBeNull();
    });
});
