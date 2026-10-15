/**
 * Testes dos helpers de competência do registro de ociosidade.
 * Executar: npm test -- vehicleIdleCompetence
 */
import {
    competenceLabel,
    previousCompetenceMonth,
    toCompetenceClosingInstant,
    toCompetenceMonthStart
} from './vehicleRentalAllocation';

describe('toCompetenceMonthStart', () => {
    it('normaliza YYYY-MM e YYYY-MM-DD para o dia 1', () => {
        expect(toCompetenceMonthStart('2026-10')).toBe('2026-10-01');
        expect(toCompetenceMonthStart('2026-10-15')).toBe('2026-10-01');
    });
});

describe('toCompetenceClosingInstant', () => {
    it('carimba o último instante do mês (outubro tem 31 dias)', () => {
        expect(toCompetenceClosingInstant('2026-10')).toBe('2026-10-31T23:59:00Z');
    });

    it('respeita fevereiro bissexto e meses de 30 dias', () => {
        expect(toCompetenceClosingInstant('2024-02')).toBe('2024-02-29T23:59:00Z');
        expect(toCompetenceClosingInstant('2026-02')).toBe('2026-02-28T23:59:00Z');
        expect(toCompetenceClosingInstant('2026-11')).toBe('2026-11-30T23:59:00Z');
    });

    it('o instante pertence à competência (filtros >= dia 1 e < dia 1 seguinte)', () => {
        const instant = new Date(toCompetenceClosingInstant('2026-10')).getTime();
        expect(instant).toBeGreaterThanOrEqual(new Date('2026-10-01T00:00:00Z').getTime());
        expect(instant).toBeLessThan(new Date('2026-11-01T00:00:00Z').getTime());
    });
});

describe('previousCompetenceMonth', () => {
    it('sugere o mês anterior como competência padrão', () => {
        expect(previousCompetenceMonth('2026-11')).toBe('2026-10');
        expect(previousCompetenceMonth('2026-01')).toBe('2025-12');
    });
});

describe('competenceLabel', () => {
    it('rotula a competência em pt-BR curto', () => {
        expect(competenceLabel('2026-10')).toBe('Out/2026');
        expect(competenceLabel('2026-01-01')).toBe('Jan/2026');
    });
});
