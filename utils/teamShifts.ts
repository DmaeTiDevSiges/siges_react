import { getBrazilDateInputValue, parseBrazilDate } from './formatters';

export const calculateIdlePercent = (approvedVisitMinutes: number, availableMinutes: number): number => {
    if (!Number.isFinite(availableMinutes) || availableMinutes <= 0) return 0;

    const usedMinutes = Math.min(Math.max(0, approvedVisitMinutes), availableMinutes);
    const idlePercent = (1 - usedMinutes / availableMinutes) * 100;
    return Math.round(Math.max(0, Math.min(100, idlePercent)) * 10) / 10;
};

export const getApprovedVisitMinutesByDate = (
    visits: ReadonlyArray<{ ovStartedAt?: string; ovEndedAt?: string }>
): Map<string, number> => {
    const minutesByDate = new Map<string, number>();

    visits.forEach(visit => {
        if (!visit.ovStartedAt || !visit.ovEndedAt) return;

        const start = parseBrazilDate(visit.ovStartedAt).getTime();
        const end = parseBrazilDate(visit.ovEndedAt).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;

        let date = getBrazilDateInputValue(start);
        const endDate = getBrazilDateInputValue(end - 1);
        while (date <= endDate) {
            const nextDate = new Date(`${date}T00:00:00Z`);
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            const nextDateKey = nextDate.toISOString().slice(0, 10);
            const dayStart = parseBrazilDate(`${date}T00:00:00`).getTime();
            const dayEnd = parseBrazilDate(`${nextDateKey}T00:00:00`).getTime();
            const overlapMinutes = Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart)) / 60000;

            if (overlapMinutes > 0) {
                minutesByDate.set(date, (minutesByDate.get(date) ?? 0) + overlapMinutes);
            }
            date = nextDateKey;
        }
    });

    minutesByDate.forEach((minutes, date) => {
        minutesByDate.set(date, Math.round(minutes));
    });
    return minutesByDate;
};
