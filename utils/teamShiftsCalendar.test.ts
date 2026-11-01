import { TeamShiftsCalendarEntry } from '../types';
import { getTeamShiftsCalendarWeeks, mapTeamShiftsCalendarEntriesToMonth } from './teamShiftsCalendar';

describe('getTeamShiftsCalendarWeeks', () => {
    it('returns all dates belonging to the selected month, including weekends', () => {
        const weeks = getTeamShiftsCalendarWeeks('2026-11-01');
        const dates = weeks.flat().filter((date): date is string => date !== null);

        expect(weeks).toHaveLength(6);
        expect(dates[0]).toBe('2026-11-01');
        expect(dates[dates.length - 1]).toBe('2026-11-30');
        expect(dates).toContain('2026-11-07');
        expect(dates).toContain('2026-11-08');
    });

    it('includes weekend dates when the month starts on a weekend', () => {
        const weeks = getTeamShiftsCalendarWeeks('2026-08-01');

        expect(weeks[0][5]).toBe('2026-08-01');
        expect(weeks[0][6]).toBe('2026-08-02');
    });

    it('returns no weeks for an invalid month', () => {
        expect(getTeamShiftsCalendarWeeks('2026-13-01')).toEqual([]);
    });
});

describe('mapTeamShiftsCalendarEntriesToMonth', () => {
    it('copies entries to the same day numbers and ignores unavailable days and teams', () => {
        const entries: TeamShiftsCalendarEntry[] = [
            { teamId: '1', date: '2026-01-03', shiftType: 'TN' },
            { teamId: '1', date: '2026-01-31', shiftType: 'TE' },
            { teamId: '2', date: '2026-01-04', shiftType: 'TN' }
        ];

        expect(mapTeamShiftsCalendarEntriesToMonth(entries, '2026-02-01', ['1'])).toEqual([
            { teamId: '1', date: '2026-02-03', shiftType: 'TN' }
        ]);
    });

    it('returns an empty list for an invalid target month', () => {
        expect(mapTeamShiftsCalendarEntriesToMonth([], '2026-13-01', ['1'])).toEqual([]);
    });
});
