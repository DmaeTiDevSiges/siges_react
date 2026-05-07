import React from 'react';

interface TimelineItemProps {
    title: string;
    date: string;
    icon: string;
    active?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ title, date, icon, active }) => {
    return (
        <div className="relative flex gap-4 mb-6 last:mb-0">
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-4 ring-background-light dark:ring-background-dark ${active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <div className="flex flex-col pt-1">
                <p className="text-slate-900 dark:text-white font-medium text-sm">{title}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{date}</p>
            </div>
        </div>
    );
};
