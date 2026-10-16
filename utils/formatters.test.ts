import { formatDateInBrazil } from './formatters';
import { getBrazilTimestamp } from './dateUtils';

describe('formatDateInBrazil', () => {
    it('formats date-only values without shifting the calendar day', () => {
        expect(formatDateInBrazil('2026-10-12', 'date', 'pt-BR')).toBe('12/10/2026');
    });

    it('interprets timezone-naive timestamps as Sao Paulo wall-clock time', () => {
        expect(
            formatDateInBrazil('2026-10-12 01:30:00', 'time', 'en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23'
            })
        ).toBe('01:30');
    });

    it('converts timestamps with an explicit offset to Sao Paulo time', () => {
        expect(
            formatDateInBrazil('2026-10-12T04:30:00Z', 'time', 'en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23'
            })
        ).toBe('01:30');
    });

    it('creates database timestamps using Sao Paulo wall-clock time', () => {
        expect(getBrazilTimestamp('2026-10-12 01:30:00')).toBe('2026-10-12T01:30:00-03:00');
    });

    it('includes the Sao Paulo time in dateTime format when no components are given', () => {
        expect(
            formatDateInBrazil('2026-10-16T14:30:45Z', 'dateTime', 'sv-SE', { timeZone: 'America/Sao_Paulo' })
        ).toBe('2026-10-16 11:30:45');
        expect(
            formatDateInBrazil('2026-10-16T14:30:45Z', 'dateTime', 'sv-SE', { timeZone: 'America/Sao_Paulo' })
                .replace(' ', 'T')
        ).toBe('2026-10-16T11:30:45');
    });

    it('keeps explicit components in dateTime format', () => {
        expect(
            formatDateInBrazil('2026-10-16T14:30:45Z', 'dateTime', 'pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        ).toBe('16/10, 11:30');
    });
});
