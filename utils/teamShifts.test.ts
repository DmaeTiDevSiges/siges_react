import { calculateIdlePercent, getApprovedVisitMinutesByDate } from './teamShifts';

describe('calculateIdlePercent', () => {
    it('recalculates idleness when available shifts change', () => {
        expect(calculateIdlePercent(240, 600)).toBe(60);
        expect(calculateIdlePercent(240, 1200)).toBe(80);
    });

    describe('getApprovedVisitMinutesByDate', () => {
        it('sums approved visit durations for each day', () => {
            const minutesByDate = getApprovedVisitMinutesByDate([
                { ovStartedAt: '2026-03-10T08:00:00', ovEndedAt: '2026-03-10T10:00:00' },
                { ovStartedAt: '2026-03-10T13:00:00', ovEndedAt: '2026-03-10T14:30:00' }
            ]);

            expect(minutesByDate.get('2026-03-10')).toBe(210);
        });

        it('splits a visit crossing midnight between both days', () => {
            const minutesByDate = getApprovedVisitMinutesByDate([
                { ovStartedAt: '2026-03-10T23:00:00', ovEndedAt: '2026-03-11T01:00:00' }
            ]);

            expect(minutesByDate.get('2026-03-10')).toBe(60);
            expect(minutesByDate.get('2026-03-11')).toBe(60);
        });

        it('ignores visits without valid positive durations', () => {
            const minutesByDate = getApprovedVisitMinutesByDate([
                { ovStartedAt: 'invalid', ovEndedAt: '2026-03-10T10:00:00' },
                { ovStartedAt: '2026-03-10T10:00:00', ovEndedAt: '2026-03-10T09:00:00' }
            ]);

            expect(minutesByDate.size).toBe(0);
        });
    });

    it('caps approved visit time at available time', () => {
        expect(calculateIdlePercent(800, 600)).toBe(0);
    });

    it('returns zero when no shift time is available', () => {
        expect(calculateIdlePercent(0, 0)).toBe(0);
    });
});
