export const calculateIdlePercent = (approvedVisitMinutes: number, availableMinutes: number): number => {
    if (!Number.isFinite(availableMinutes) || availableMinutes <= 0) return 0;

    const usedMinutes = Math.min(Math.max(0, approvedVisitMinutes), availableMinutes);
    const idlePercent = (1 - usedMinutes / availableMinutes) * 100;
    return Math.round(Math.max(0, Math.min(100, idlePercent)) * 10) / 10;
};
