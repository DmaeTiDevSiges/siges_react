import { TeamShiftsCalendarEntry } from '../types';

export const getTeamShiftsCalendarWeeks = (monthRef: string): Array<Array<string | null>> => {
    const [year, month] = monthRef.split('-').map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return [];

    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const lastOfMonth = new Date(Date.UTC(year, month, 0));
    const monday = new Date(Date.UTC(year, month - 1, 1 - ((firstOfMonth.getUTCDay() + 6) % 7)));
    const weeks: Array<Array<string | null>> = [];

    while (monday <= lastOfMonth) {
        const weekDays = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setUTCDate(date.getUTCDate() + index);
            if (date.getUTCMonth() !== month - 1) return null;

            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${String(month).padStart(2, '0')}-${day}`;
        });
        if (weekDays.some(Boolean)) weeks.push(weekDays);
        monday.setUTCDate(monday.getUTCDate() + 7);
    }

    return weeks;
};

export const mapTeamShiftsCalendarEntriesToMonth = (
    entries: TeamShiftsCalendarEntry[],
    targetMonthRef: string,
    teamIds: string[]
): TeamShiftsCalendarEntry[] => {
    const [year, month] = targetMonthRef.split('-').map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return [];

    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const allowedTeamIds = new Set(teamIds);

    return entries.flatMap(entry => {
        const match = /^\d{4}-\d{2}-(\d{2})$/.exec(entry.date);
        const day = match ? Number(match[1]) : 0;
        if (!allowedTeamIds.has(entry.teamId) || day < 1 || day > lastDay) return [];

        return [{
            ...entry,
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }];
    });
};
