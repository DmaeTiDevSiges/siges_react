import { calculateIdlePercent } from './teamShifts';

describe('calculateIdlePercent', () => {
    it('recalculates idleness when available shifts change', () => {
        expect(calculateIdlePercent(240, 600)).toBe(60);
        expect(calculateIdlePercent(240, 1200)).toBe(80);
    });

    it('caps approved visit time at available time', () => {
        expect(calculateIdlePercent(800, 600)).toBe(0);
    });

    it('returns zero when no shift time is available', () => {
        expect(calculateIdlePercent(0, 0)).toBe(0);
    });
});
