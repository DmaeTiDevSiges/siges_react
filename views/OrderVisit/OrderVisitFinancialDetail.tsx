import React from 'react';
import { OrderVisit } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface OrderVisitFinancialDetailProps {
    visit: OrderVisit;
}

export const OrderVisitFinancialDetail: React.FC<OrderVisitFinancialDetailProps> = ({ visit }) => {
    const items = [
        {
            label: 'Serviços',
            value: visit.servicesValue || 0,
            icon: 'construction',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10'
        },
        {
            label: 'Materiais',
            value: visit.materialsValue || 0,
            icon: 'inventory_2',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            label: 'Transporte',
            value: visit.vehiclesValue || 0,
            icon: 'local_shipping',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Total Highlight */}
            <div className="bg-slate-900 dark:bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <p className="text-indigo-200 dark:text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        Total Geral da Visita
                    </p>
                    <h2 className="text-4xl font-black mb-1">
                        {formatCurrency(visit.totalValue || 0)}
                    </h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full mt-4 backdrop-blur-md">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Valores calculados automaticamente</span>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -ml-16 -mb-16 blur-3xl" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-900 rounded-2xl px-6 border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm h-[80px]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`${item.bgColor} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-0.5">
                                    {item.label}
                                </p>
                                <p className="text-slate-900 dark:text-white text-lg font-black">
                                    {formatCurrency(item.value)}
                                </p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined ${item.color} opacity-20 text-4xl`}>
                            {item.icon}
                        </span>
                    </div>
                ))}
            </div>

            {/* Info Message */}
            <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl p-4 flex gap-4 items-start border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <p className="text-indigo-900/70 dark:text-indigo-200/50 text-[13px] font-medium leading-relaxed">
                    Os valores acima representam o consolidado de todos os lançamentos realizados nesta visita.
                    Para detalhes, consulte as abas de <strong>Serviços</strong> e <strong>Transporte</strong>.
                </p>
            </div>
        </div>
    );
};
