import React from 'react';
import { Loading } from '../../../components/ui/Loading';
import { formatCurrency } from '../../../utils/formatters';

export const AppropriationTable: React.FC<{ items: any[] }> = ({ items }) => {
    if (!items.length) {
        return (
            <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-3xl">inbox</span>
                </div>
                <div>
                    <p className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Sem Registros</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-tighter mt-1">Apropriação não disponível para estes filtros</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto no-scrollbar min-w-full">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/50">
                        <th className="px-5 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                        <th className="px-5 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Unid</th>
                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Vlr Unit</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">A/D</th>
                        <th className="px-5 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Qtd</th>
                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Vlr Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                    {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-5 py-3.5">
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-primary border border-slate-200 dark:border-slate-700/50">{item.code}</span>
                            </td>
                            <td className="px-5 py-3.5">
                                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white transition-colors line-clamp-1">{item.description}</p>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{item.unit || item.material_unit || '-'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">{formatCurrency(item.value_unit || 0)}</span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className={`text-[10px] font-black ${item.discount < 1 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {item.discount?.toFixed(3) || '1.000'}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                                <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px] font-black text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50">
                                    {item.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                                <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{formatCurrency(item.value_total || 0)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export interface AppropriationSectionProps {
    title: string;
    icon: string;
    items: any[];
    isExpanded: boolean;
    onToggle: () => void;
    total: number;
    loading?: boolean;
}

export const AppropriationSection: React.FC<AppropriationSectionProps> = ({
    title,
    icon,
    items,
    isExpanded,
    onToggle,
    total,
    loading
}) => {
    return (
        <div className="flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none transition-all duration-300">
            <div
                onClick={onToggle}
                className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.99] group ${isExpanded ? 'bg-primary/10 dark:bg-primary/20 border-b border-primary/20' : 'bg-transparent'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary'}`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">{title}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Resumo Consolidado</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[9px] font-bold text-primary">{items.length} itens</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    {loading && (
                        <div className="flex items-center mr-2">
                            <Loading size="xs" />
                        </div>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none mb-1">Total {title}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[16px] font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                {formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-primary/10 dark:bg-primary/20 text-primary rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-0 border-t border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/40">
                    <AppropriationTable items={items} />
                </div>
            </div>
        </div>
    );
};
