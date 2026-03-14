import React, { useState, useEffect } from 'react';

interface CalendarProps {
    value?: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    rangeStart?: string;
    rangeEnd?: string;
    className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ value, onChange, rangeStart, rangeEnd, className }) => {
    // Current view state (Year/Month)
    // Default to value provided, or current date
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        return new Date();
    });

    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            setViewDate(new Date(y, m - 1, d));
        }
    }, [value]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-11

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${year}-${mm}-${dd}`;
        onChange(dateStr);
    };

    // Helper: Compare YYYY-MM-DD strings
    const toDateStr = (y: number, m: number, d: number) => {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        return value === toDateStr(year, month, day);
    };

    const isInRange = (day: number) => {
        if (!rangeStart || !rangeEnd) return false;
        const current = toDateStr(year, month, day);
        return current >= rangeStart && current <= rangeEnd;
    };

    const isRangeStart = (day: number) => {
        if (!rangeStart) return false;
        return rangeStart === toDateStr(year, month, day);
    };

    const isRangeEnd = (day: number) => {
        if (!rangeEnd) return false;
        return rangeEnd === toDateStr(year, month, day);
    };

    return (
        <div className={`flex flex-col select-none ${className || ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {monthNames[month]} <span className="text-slate-400 font-normal ml-1">{year}</span>
                </div>
                <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {/* Weekdays */}
                {weekDays.map((d, i) => (
                    <div key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide py-2">
                        {d}
                    </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const inRange = isInRange(day);
                    const rangeS = isRangeStart(day);
                    const rangeE = isRangeEnd(day);
                    const today = isToday(day);

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`
                                relative h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                ${selected || rangeS || rangeE
                                    ? 'bg-primary text-white shadow-md shadow-primary/30 z-10'
                                    : inRange
                                        ? 'bg-primary/10 text-primary rounded-none' // Connected look? Rounded-none needs care with first/last
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }
                                ${(rangeS && rangeEnd) ? 'rounded-r-none pr-3' : ''}
                                ${(rangeE && rangeStart) ? 'rounded-l-none pl-3' : ''}
                                ${inRange && !rangeS && !rangeE ? 'rounded-none w-[110%] -ml-[5%]' : ''} 
                                ${today && !selected && !inRange ? 'ring-1 ring-primary/50 text-primary' : ''}
                            `}
                        >
                            <span className="relative z-20">{day}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
