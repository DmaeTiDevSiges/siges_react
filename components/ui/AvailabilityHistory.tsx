import React from 'react';
import { IconButton } from './IconButton';

interface AvailabilityHistoryProps {
    history: { date: string; isAvailable: boolean | null }[];
    loading: boolean;
    onOffsetChange?: (direction: 'prev' | 'next') => void;
    offsetDays?: number;
}

export const AvailabilityHistory: React.FC<AvailabilityHistoryProps> = ({ 
    history, 
    loading, 
    onOffsetChange,
    offsetDays = 0
}) => {
    if (!history.length && !loading) return null;

    const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    const summary = {
        available: history.filter(h => h.isAvailable === true).length,
        unavailable: history.filter(h => h.isAvailable === false).length,
        noData: history.filter(h => h.isAvailable === null).length,
    };

    return (
        <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                {onOffsetChange ? (
                    <IconButton 
                        icon="chevron_left" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onOffsetChange('prev')}
                        disabled={loading}
                        className="text-slate-400 hover:text-primary disabled:opacity-30"
                    />
                ) : <div className="w-8" />}
                
                <h4 className="text-[10px] font-black tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase text-center flex items-center gap-2">
                    {offsetDays === 0 ? 'Histórico (Últimos 7 dias)' : 'Histórico (Período Anterior)'}
                    {loading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin"></div>}
                </h4>

                {onOffsetChange ? (
                    <IconButton 
                        icon="chevron_right" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onOffsetChange('next')}
                        disabled={offsetDays === 0 || loading}
                        className={`text-slate-400 hover:text-primary ${offsetDays === 0 ? 'opacity-20 cursor-not-allowed' : 'disabled:opacity-30'}`}
                    />
                ) : <div className="w-8" />}
            </div>
            
            <div className="relative">
                <div className={`flex justify-between items-end gap-1 mb-5 px-1 transition-opacity duration-300 ${loading ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                    {(history.length > 0 ? history : Array(7).fill({ date: '2000-01-01', isAvailable: null })).map((day, idx) => {
                        const dateObj = new Date(day.date + 'T12:00:00');
                        const dayName = daysOfWeek[dateObj.getDay()];
                        const dateStr = day.date === '2000-01-01' ? '--/--' : `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                        
                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 group" title={day.date === '2000-01-01' ? '' : `${dayName}, ${dateStr}`}>
                                <span className="text-[8px] font-black text-slate-400 uppercase">{dayName}</span>
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{dateStr}</span>
                                <div className="relative mt-1">
                                    <div className={`w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-125 ${
                                        day.isAvailable === true ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 
                                        day.isAvailable === false ? 'bg-red-500 shadow-md shadow-red-500/30' : 
                                        'bg-slate-200 dark:bg-slate-700'
                                    }`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center items-center gap-3 text-[10px] font-black tracking-tight text-slate-500 dark:text-slate-400 uppercase pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{summary.available} Disp</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{summary.unavailable} Indisp</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>{summary.noData} Sem reg</span>
            </div>
        </div>
    );
};
