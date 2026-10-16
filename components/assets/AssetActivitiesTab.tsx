import React, { useEffect, useMemo, useState } from 'react';
import { dataService } from '../../services/dataService';
import { Loading } from '../ui/Loading';
import {
    ACTIVITY_MONTH_LABELS,
    buildAssetActivityMatrix,
    getAvailableYears,
    getBrazilCurrentYear,
} from '../../utils/assetActivityMatrix';
import type { AssetActivityEntry } from '../../types';

interface AssetActivitiesTabProps {
    assetId: string;
    onError?: (message: string) => void;
}

/**
 * Aba "Atividades" do Detalhe do Ativo.
 *
 * Cruza os meses do ano selecionado com a quantidade de atividades executadas
 * neste ativo em visitas aprovadas. A primeira coluna traz Unidade, Setor e
 * Posição conforme registrados em `v_orders_visits_assets`
 * (before_unit_description, before_tag_description, before_tag_sub_description).
 */
export const AssetActivitiesTab: React.FC<AssetActivitiesTabProps> = ({ assetId, onError }) => {
    const [entries, setEntries] = useState<AssetActivityEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number>(() => getBrazilCurrentYear());

    useEffect(() => {
        let isActive = true;

        const loadActivities = async () => {
            if (!assetId) return;
            setIsLoading(true);
            try {
                const data = await dataService.getApprovedAssetActivities(assetId);
                if (!isActive) return;
                setEntries(data);

                const currentYear = getBrazilCurrentYear();
                const years = getAvailableYears(data);
                setSelectedYear(years.includes(currentYear) ? currentYear : years[0] ?? currentYear);
            } catch (error) {
                if (!isActive) return;
                console.error('Error loading asset activities:', error);
                setEntries([]);
                onError?.('Não foi possível carregar as atividades deste ativo.');
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        loadActivities();

        return () => { isActive = false; };
    }, [assetId]);

    const availableYears = useMemo(() => getAvailableYears(entries), [entries]);
    const matrix = useMemo(() => buildAssetActivityMatrix(entries, selectedYear), [entries, selectedYear]);

    if (isLoading) {
        return (
            <section className="flex items-center justify-center py-16">
                <Loading size="md" text="Carregando atividades..." />
            </section>
        );
    }

    const cellClass = (value: number) =>
        `px-2 py-3 text-center text-[12px] font-black tabular-nums ${
            value === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-white'
        }`;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Atividades por mês</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                        Visitas aprovadas · quantidade por mês
                    </span>
                </div>

                {availableYears.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {availableYears.map((year) => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    selectedYear === year
                                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {matrix.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 bg-white dark:bg-card-dark rounded-[16px] border border-slate-200 dark:border-slate-800 text-center px-6">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[40px]">event_busy</span>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Nenhuma atividade em visitas aprovadas em {selectedYear}.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                        As atividades aparecem aqui depois que a visita em que foram executadas é aprovada.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-card-dark rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full border-collapse min-w-[1180px]">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Unidade / Setor / Posição
                                    </th>
                                    <th className="sticky left-[200px] z-30 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[240px] min-w-[240px] border-r border-slate-200 dark:border-slate-800">
                                        Atividade
                                    </th>
                                    {ACTIVITY_MONTH_LABELS.map((month) => (
                                        <th key={month} className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[52px] min-w-[52px]">
                                            {month}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-primary w-[64px] min-w-[64px] bg-primary/5">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {matrix.rows.map((row) => (
                                    <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="sticky left-0 z-20 bg-white dark:bg-card-dark px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[12px] font-black text-slate-800 dark:text-white uppercase leading-tight">
                                                    {row.unitDescription || 'Unidade não informada'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">
                                                    {row.tagDescription || 'Setor não informado'}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase leading-tight">
                                                    {row.tagSubDescription || 'Posição não informada'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="sticky left-[200px] z-20 bg-white dark:bg-card-dark px-4 py-3 w-[240px] min-w-[240px] border-r border-slate-100 dark:border-slate-800">
                                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                                {row.activityDescription}
                                            </span>
                                        </td>
                                        {row.months.map((value, index) => (
                                            <td key={index} className={cellClass(value)}>{value}</td>
                                        ))}
                                        <td className="px-3 py-3 text-center text-[13px] font-black text-primary bg-primary/5 tabular-nums">
                                            {row.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                <tr>
                                    <td className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Total do ano</td>
                                    <td className="sticky left-[200px] z-30 bg-slate-50 dark:bg-slate-900 px-4 py-3 border-r border-slate-200 dark:border-slate-800" />
                                    {matrix.monthTotals.map((value, index) => (
                                        <td
                                            key={index}
                                            className={`px-2 py-3 text-center text-[12px] font-black tabular-nums ${
                                                value === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {value}
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 text-center text-[13px] font-black text-primary bg-primary/5 tabular-nums">
                                        {matrix.total}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};
