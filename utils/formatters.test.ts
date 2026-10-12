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
});
