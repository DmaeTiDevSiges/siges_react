import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/dataService';
import { OrderVisit, User, OrderFilters, OrderVisitTeam } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { DashboardOrdersVisitsAdminListItem } from '../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import { Calendar } from '../../components/ui/Calendar';

interface DashboardOrdersVisitsAdminScreenProps {
    currentUser: User;
    onSelectVisit: (visit: OrderVisit) => void;
    currentFilters?: OrderFilters;
    onFiltersChange?: (filters: OrderFilters) => void;
}

interface VisitStats {
    avaliacao: number;
    autorizadas: number;
    agendadas: number;
    execucao: number;
    suspensas: number;
}

// Extend OrderVisit type locally to include filter fields if they are missing in the main type
interface OrderVisitExtended extends OrderVisit {
    systemId?: string;
    systemParentId?: string;
    unitTypeId?: string;
    unitTypeParentId?: string;
    orderObjectId?: string;
    orderTypeId?: string;
    orderTypeSubId?: string;
    contractId?: string;
    planId?: string;
    teamId?: string;
    parentId?: number | null;
    o_plan_description?: string;
}

// Helper Components

interface StatCardProps {
    icon: string;
    label: string;
    count: number;
    totalValue?: number;
    color: string;
    active?: boolean;
    onClick?: () => void;
    styleColor?: string;
}

// Helper Component for Animated Count
const AnimatedCount: React.FC<{ value: number; active?: boolean; color?: string }> = ({ value, active, color }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (value !== displayValue) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    return (
        <span
            className={`text-xl font-black transition-all duration-300 ${isAnimating ? 'scale-125 text-primary brightness-150' : 'scale-100'} ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}
            style={!isAnimating && color && !active ? { color } : undefined}
        >
            {displayValue}
        </span>
    );
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, totalValue, color, active, onClick, styleColor }) => {
    // Helper to get translucent background from HEX or tailwind
    const getIconBgStyle = () => {
        if (styleColor) return { backgroundColor: `${styleColor} 1A` }; // 10% opacity
        return undefined;
    };

    const iconBgClass = !styleColor ? (color.includes('text-') ? color.replace('text-', 'bg-') + '/10' : 'bg-slate-900/50') : '';

    return (
        <div
            onClick={onClick}
            className={`backdrop-blur-sm p-4 rounded-[16px] border shadow-sm transition-all cursor-pointer group flex-1 min-w-[160px] lg:min-w-[180px] shrink-0 ${active
                ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconBgClass}`}
                    style={getIconBgStyle()}
                >
                    <span
                        className={`material-symbols-outlined text-[20px] ${!styleColor ? color : ''}`}
                        style={styleColor ? { color: styleColor } : undefined}
                    >
                        {icon}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <AnimatedCount value={count} active={active} color={styleColor} />
                    {totalValue !== undefined && (
                        <span className={`text-[10px] font-black mt-0.5 ${active ? 'text-primary/70' : 'text-slate-400'}`}>
                            {formatCurrency(totalValue)}
                        </span>
                    )}
                </div>
            </div>
            <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{label}</p>
        </div>
    );
};

interface VisitCardProps {
    visit: OrderVisit;
    onClick: () => void;
    formatDate: (date?: string) => string;
    getStatusColor: (statusId: number) => string;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onClick, formatDate, getStatusColor }) => (
    <div
        onClick={onClick}
        className="group relative bg-slate-100/5 dark:bg-slate-800/40 rounded-[16px] p-5 hover:bg-slate-200/10 dark:hover:bg-slate-800/60 transition-all cursor-pointer border border-slate-200 dark:border-white/5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 flex flex-col h-full active:scale-[0.98]"
    >
        {/* Header - Prominent Badge like Order Card */}
        <div className="flex justify-between items-start mb-4">
            <div className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white ${getStatusColor(visit.ovStatusId)}`}>
                <span className="text-[18px] font-black leading-none tracking-tight">{visit.ovMask}</span>
                <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">{visit.statusDescription}</span>
                    <span className="text-[9px] font-black opacity-80">{visit.ovStatusId}</span>
                </div>
            </div>
            {/* Action Icon */}
            <button className="text-slate-400 hover:text-yellow-400 transition-colors shrink-0">
                <span className="material-symbols-outlined">star</span>
            </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
            {visit.clientName && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none truncate">{visit.clientName}</p>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                {visit.unitDescription}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 leading-none truncate">
                {visit.orderMask} • {visit.teamCode || 'Sem equipe'}
            </p>

            {/* Description Box */}
            <div className="relative mb-4 group/desc">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight line-clamp-2 pr-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    {visit.requestedServices || 'Sem descrição'}
                </p>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 group-hover/desc:translate-x-1 transition-transform">chevron_right</span>
            </div>
        </div>

        {/* Footer Info Info Grid */}
        <div className="grid grid-cols-2 gap-y-1 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-0">
                <span className="material-symbols-outlined text-sm shrink-0">person</span>
                <span className="truncate">{visit.teamLeaderName || 'Sem líder'}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">
                {formatDate(visit.ovStartedAt)}
            </div>
        </div>

        {/* Progress Section */}
        <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(var(--color-primary),0.5)]"
                    style={{ width: `${visit.progress || 0}% ` }}
                />
            </div>
            <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">
                {visit.progress || 0}%
            </span>
        </div>

        {/* Bottom Processing Badge */}
        <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="material-symbols-outlined text-xl text-primary">engineering</span>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">
                    {(visit as any).processingDescription || 'PROCESSAMENTO'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    EM ANDAMENTO
                </span>
            </div>
        </div>
    </div>
);

/**
 * Compact Filter Select Wrapper
 */
const FilterSelect: React.FC<{
    label: string;
    value: string | string[];
    onClick: () => void;
    onClear: () => void;
    disabled?: boolean;
}> = ({ label, value, onClick, onClear, disabled }) => {
    const count = Array.isArray(value) ? value.length : (value ? 1 : 0);

    return (
        <div className={`relative flex items-center flex-1 min-w-[110px] h-[42px] transition-opacity shrink-0 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden transition-all ${count > 0 ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div
                    onClick={onClick}
                    className="flex-1 px-3 flex flex-col justify-center border-r border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-0"
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none mb-0.5">{label}</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold ${count > 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                            {count > 0 ? `${count} ${count === 1 ? 'Item' : 'Itens'}` : 'Todos'}
                        </span>
                    </div>
                </div>

                {count > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="px-3 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const AppropriationTable: React.FC<{ items: any[] }> = ({ items }) => {
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

interface AppropriationSectionProps {
    title: string;
    icon: string;
    items: any[];
    isExpanded: boolean;
    onToggle: () => void;
    total: number;
    loading?: boolean;
}

const AppropriationSection: React.FC<AppropriationSectionProps> = ({
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
            {/* Header Bar - Styled like the 'financialTotals' bar */}
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
                        <span className="material-symbols-outlined animate-spin text-sm text-primary/50">
                            autorenew
                        </span>
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

            {/* Content Table */}
            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-0 border-t border-slate-200 dark:border-slate-700/30 bg-white dark:bg-slate-900/40">
                    <AppropriationTable items={items} />
                </div>
            </div>
        </div>
    );
};

/**
 * Operational Units Table Section Component
 */
const UnitsPowerElectricTable: React.FC<{ items: any[]; unitsOrders?: Record<string, any[]> }> = ({ items, unitsOrders = {} }) => {
    return (
        <div className="w-full bg-[#0a0f1e] dark:bg-[#0a0f1e] rounded-[24px] overflow-hidden border border-slate-800 shadow-2xl">
            {/* Table Header */}
            <div className="px-6 py-6 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-sm font-black text-white tracking-tight">
                    Unidades Operacionais
                </h3>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">UC</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">OS</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NF</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor R$</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Situação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {items?.map((item, idx) => {
                            const availableOrders = unitsOrders[item.id?.toString()] || [];

                            return (
                                <tr key={item.id || idx} className="hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-6 border-r border-slate-800/30">
                                        <span className="text-sm font-black text-white uppercase tracking-tight block group-hover:text-primary transition-colors">
                                            {item.description_full || item.description || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-800/30">
                                        <span className="text-[12px] font-bold text-slate-400 font-mono">
                                            {item.installation_code_power_supply || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-800/30 min-w-[200px]">
                                        <div className="relative group/os">
                                            <select
                                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-[11px] font-black text-white appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none uppercase tracking-tighter pr-10"
                                                value={item.selected_os_id || ""}
                                                onChange={(e) => {
                                                    // This would typically update state in the parent or emit an event
                                                    console.log('Selected OS:', e.target.value, 'for unit:', item.id);
                                                }}
                                            >
                                                <option value="" className="bg-[#0a0f1e] text-slate-500">SELECIONE OS</option>
                                                {availableOrders.map((os: any) => (
                                                    <option key={os.id} value={os.id} className="bg-[#0a0f1e] py-2">
                                                        {os.order_mask} - {os.type_description}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lg">expand_more</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-800/30">
                                        <span className="text-[12px] font-bold text-slate-400 font-mono">
                                            {item.nf || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-800/30">
                                        <span className="text-sm font-black text-primary font-mono tracking-tighter">
                                            {item.valor_rs || ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-800/30">
                                        <div className="flex items-center gap-4">
                                            <button className="text-slate-500 hover:text-white transition-colors" title="Detalhes">
                                                <span className="material-symbols-outlined text-lg">search</span>
                                            </button>
                                            <button className="text-slate-500 hover:text-white transition-colors" title="Anexar NF">
                                                <span className="material-symbols-outlined text-lg">upload</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.situacao ? (
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.situacao.toLowerCase().includes('pendente')
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : item.situacao.toLowerCase().includes('processamento')
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                {item.situacao}
                                            </span>
                                        ) : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InvoicesTable: React.FC<{ items: any[] }> = ({ items }) => {
    return (
        <div className="w-full bg-[#0a0f1e] dark:bg-[#0a0f1e] rounded-[24px] overflow-hidden border border-slate-800 shadow-2xl">
            {/* Table Header */}
            <div className="px-6 py-6 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-sm font-black text-white tracking-tight">
                    Notas Fiscais Disponíveis
                </h3>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NFE ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor (R$)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {[
                            { id: '#99201', status: 'Emitida', date: '12/10/2023', val: '14.250,00' },
                            { id: '#99185', status: 'Processando', date: '15/10/2023', val: '8.400,00' },
                            { id: '#99142', status: 'Emitida', date: '08/10/2023', val: '22.100,50' },
                            { id: '#99098', status: 'Emitida', date: '01/10/2023', val: '5.750,00' }
                        ].map((invoice, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="px-6 py-5">
                                    <span className="text-sm font-black text-primary uppercase tracking-tight hover:underline cursor-pointer">
                                        {invoice.id}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${invoice.status === 'Emitida' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                                        <span className={`px-4 py-1.5 rounded-full bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border border-slate-700 ${invoice.status === 'Emitida' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[12px] font-bold text-slate-400 font-mono italic opacity-80">{invoice.date}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-sm font-black text-white font-mono tracking-tighter">{invoice.val}</span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button className="w-9 h-9 rounded-xl bg-slate-800/50 flex border border-slate-700 items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="px-6 py-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/10">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    Mostrando <span className="text-slate-300">1 a 4</span> de <span className="text-slate-300">156</span> resultados
                </span>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-slate-800/50 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all border border-slate-700">Anterior</button>
                    <button className="w-10 h-10 bg-primary rounded-xl text-[11px] font-black text-white flex items-center justify-center border border-primary/50 shadow-lg shadow-primary/20">1</button>
                    <button className="w-10 h-10 bg-slate-800/50 rounded-xl text-[11px] font-black text-slate-400 flex items-center justify-center hover:text-white transition-all border border-slate-700">2</button>
                    <button className="w-10 h-10 bg-slate-800/50 rounded-xl text-[11px] font-black text-slate-400 flex items-center justify-center hover:text-white transition-all border border-slate-700">3</button>
                    <button className="px-4 py-2 bg-[#1a1f2e] rounded-xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700/50">Próximo</button>
                </div>
            </div>
        </div>
    );
};

// --- CHART HELPERS (SVG BASED) ---

const InsightsDoughnut: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="relative flex items-center justify-center">
            <svg viewBox="-1 -1 2 2" className="w-32 h-32 -rotate-90 transform group-hover:scale-105 transition-transform duration-500">
                {data.map((slice, i) => {
                    if (total === 0) return null;
                    const percent = slice.value / total;
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += percent;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');
                    return <path key={i} d={pathData} fill={slice.color} className="opacity-80 hover:opacity-100 transition-opacity cursor-help" />;
                })}
                <circle cx="0" cy="0" r="0.75" fill="currentColor" className="text-white dark:text-slate-800" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5">Total</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(total).split(',')[0]}</span>
            </div>
        </div>
    );
};

const InsightsBar: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex flex-col gap-3 w-full">
            {data.slice(0, 5).map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 group/bar">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase truncate pr-4">{item.label}</span>
                        <span className="text-[10px] font-black text-slate-400 font-mono italic">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const InsightsTrend: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    if (data.length === 0) return null;

    // Build SVG points for an Area Chart with internal padding
    const width = 300;
    const height = 100;
    const paddingX = 12; // Prevents labels on extremes from being cut
    const paddingY = 22; // Space for labels above points

    // Calculate internal width available for data
    const chartWidth = width - (paddingX * 2);
    const chartHeight = height - paddingY;

    const stepX = chartWidth / (data.length - 1 || 1);
    const points = data.map((d, i) => `${paddingX + (i * stepX)},${height - (d.value / maxVal) * chartHeight}`).join(' ');

    const areaPath = `M ${paddingX},${height} L ${points} L ${width - paddingX},${height} Z`;
    const linePath = `M ${points}`;

    return (
        <div className="w-full flex flex-col gap-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
                <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Background */}
                <path d={areaPath} fill="url(#trendGradient)" className="transition-all duration-700" />

                {/* Trend Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-primary transition-all duration-700"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {data.map((d, i) => {
                    const x = paddingX + (i * stepX);
                    const y = height - (d.value / maxVal) * chartHeight;

                    return (
                        <g key={i} className="group/point">
                            {/* Value Label with High-Contrast Halo */}
                            <text
                                x={x}
                                y={y - 10}
                                textAnchor="middle"
                                className="text-[10px] font-black fill-slate-900 dark:fill-white select-none pointer-events-none transition-all duration-300 group-hover/point:scale-125"
                                stroke="white"
                                strokeWidth="3"
                                style={{
                                    paintOrder: 'stroke',
                                    strokeOpacity: 0.9,
                                    // In Dark Mode, we use the card's background color (#020617 or similar) for the stroke
                                    // This creates a much cleaner "cut-out" effect than generic white/gray
                                }}
                                // Conditional stroke for Dark Mode using inline style since standard Tailwind doesn't support stroke-color variants as easily in all SVG environments
                                data-dark-stroke="#0f172a"
                            >
                                {d.value}
                            </text>

                            {/* Custom CSS to handle the dark mode stroke properly */}
                            <style>{`
                                .dark [data-dark-stroke="#0f172a"] {
                                    stroke: #0f172a !important;
                                    stroke-width: 4px;
                                }
                            `}</style>

                            {/* Point */}
                            <circle
                                cx={x}
                                cy={y}
                                r={i === data.length - 1 ? 4.5 : 2.5}
                                className="fill-primary transition-all duration-300 group-hover/point:r-5"
                            />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest pt-1 px-1 border-t border-slate-100 dark:border-slate-800/50">
                <span>{data[0]?.label}</span>
                <span>{data[Math.floor(data.length / 2)]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
            </div>
        </div>
    );
};

export const DashboardUnitsPowerElectric: React.FC<DashboardOrdersVisitsAdminScreenProps> = ({ currentUser, onSelectVisit, currentFilters, onFiltersChange }) => {
    // Advanced Filters State
    const [advancedFilters, setAdvancedFilters] = useState<OrderFilters>(() => {
        if (currentFilters) return currentFilters;
        try {
            const saved = localStorage.getItem('advancedDashboardFilters');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Sync from Parent (Prop) -> Local State
    useEffect(() => {
        if (currentFilters) {
            setAdvancedFilters(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(currentFilters)) {
                    return currentFilters;
                }
                return prev;
            });
        }
    }, [currentFilters]);

    // Sync from Local State -> Parent (Callback)
    useEffect(() => {
        if (onFiltersChange) {
            onFiltersChange(advancedFilters);
        }
        localStorage.setItem('advancedDashboardFilters', JSON.stringify(advancedFilters));
    }, [advancedFilters, onFiltersChange]);
    const [visits, setVisits] = useState<OrderVisitExtended[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
    const [unitsOrders, setUnitsOrders] = useState<Record<string, any[]>>({});

    // Date Range Filter State
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    // Date Range Filter State with persistence
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const savedStart = localStorage.getItem('dashboard_admin_date_start');
        const savedEnd = localStorage.getItem('dashboard_admin_date_end');
        return {
            start: savedStart || todayStr,
            end: savedEnd || todayStr
        };
    });

    // Update persistence when dateRange changes
    useEffect(() => {
        localStorage.setItem('dashboard_admin_date_start', dateRange.start);
        localStorage.setItem('dashboard_admin_date_end', dateRange.end);
    }, [dateRange]);



    // Dynamic Stats and Processing Stages
    const [processingStages, setProcessingStages] = useState<{ id: number, description: string, icon: string, icon_color: string, bg_color: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visitTeams, setVisitTeams] = useState<Record<string, OrderVisitTeam[]>>({});
    const [appropriationData, setAppropriationData] = useState<{
        services: any[];
        materials: any[];
        vehicles: any[];
    }>({
        services: [],
        materials: [],
        vehicles: []
    });
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        services: false,
        materials: false,
        vehicles: false
    });
    const [isFetchingAppropriation, setIsFetchingAppropriation] = useState(false);

    // Pagination/Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(20);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    // Advanced Filters State (Managed above)
    const [filterOptions, setFilterOptions] = useState({
        systems: [] as any[],
        subSystems: [] as any[],
        unitTypes: [] as any[],
        units: [] as any[],
        orderObjects: [] as any[],
        orderTypes: [] as any[],
        contracts: [] as any[],
        plans: [] as any[],
        teams: [] as any[]
    });
    const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);

    // Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        filterKey: keyof OrderFilters;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        filterKey: 'orderTypeId',
        label: '',
        options: [],
        currentValue: []
    });
    const [selectionSearch, setSelectionSearch] = useState('');

     useEffect(() => {
         loadData();
         loadFilterOptions();
 
         const handleRefresh = () => loadData();
         window.addEventListener('refresh_dashboard', handleRefresh);
 
         // Realtime updates
         const orderSub = dataService.subscribeToOrders(() => {
             loadData();
         });
         const visitSub = dataService.subscribeToVisits(() => {
             loadData();
         });
 
         return () => {
             window.removeEventListener('refresh_dashboard', handleRefresh);
             orderSub.unsubscribe();
             visitSub.unsubscribe();
         };
     }, []);

    const loadFilterOptions = async () => {
        try {
            const results = await Promise.allSettled([
                dataService.getSystemsParent(),
                dataService.getUnitTypesParent(),
                dataService.getOrdersObjects(),
                dataService.getOrderTypes(),
                dataService.getPlans(),
                dataService.getManagedContracts(currentUser.id.toString()),
                dataService.getTeams()
            ]);

            const getVal = (res: any) => (res.status === 'fulfilled' ? res.value : []);

            setFilterOptions(prev => ({
                ...prev,
                systems: getVal(results[0]),
                unitTypes: getVal(results[1]),
                orderObjects: getVal(results[2]),
                orderTypes: getVal(results[3]),
                plans: getVal(results[4]),
                contracts: getVal(results[5]),
                teams: getVal(results[6])
            }));
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 2. Load processing stages
            const stages = await dataService.getProcessingConfigurations();
            setProcessingStages(stages);

            // 3. Load all visits from v_orders_visits via dataService
            const data = await dataService.getOrdersVisitsView();

            const mappedVisits: OrderVisitExtended[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                oId: row.o_id?.toString(),
                ovMask: row.ov_mask,
                ovStatusId: row.ov_status_id,
                ovProcessingId: row.ov_processing_id,
                ovCreatedAt: row.ov_created_at,
                ovCreatedUserId: row.ov_created_user_id?.toString(),
                ovTeamLeadId: row.ov_team_leader_id?.toString(),
                ovStartedAt: row.ov_started_at,
                ovEndedAt: row.ov_ended_at,
                unitDescription: row.o_unit_description,
                systemDescription: row.o_system_description,
                clientName: row.o_client_name,
                teamLeaderName: row.ov_team_leader_name_short,
                statusDescription: row.ov_status_description,
                processingDescription: row.ov_processing_description,
                unitId: row.o_unit_id?.toString(),
                orderMask: row.o_mask,
                teamCode: row.o_team_code,
                requestedServices: row.o_requested_services,
                progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
                ovDurationHours: row.ov_duration_hours ? parseFloat(row.ov_duration_hours) : 0,

                // Value fields
                servicesValue: row.ov_services_value ? parseFloat(row.ov_services_value) : 0,
                materialsValue: row.ov_materials_value ? parseFloat(row.ov_materials_value) : 0,
                vehiclesValue: row.ov_vehicles_value ? parseFloat(row.ov_vehicles_value) : 0,
                totalValue: row.ov_total_value ? parseFloat(row.ov_total_value) : 0,

                // Filter fields mapping
                systemId: row.o_system_id?.toString(),
                systemParentId: row.o_system_parent_id?.toString(),
                unitTypeId: row.o_unit_type_id?.toString(),
                unitTypeParentId: row.o_unit_type_parent_id?.toString(),
                orderObjectId: row.o_object_id?.toString(),
                orderTypeId: row.o_type_id?.toString(),
                orderTypeSubId: row.o_type_sub_id?.toString(),
                contractId: row.o_contract_id?.toString(),
                planId: row.o_plan_id?.toString(),
                teamId: row.o_team_id?.toString(),
                companyId: row.o_company_id?.toString(),
                parentId: row.o_parent_id ? Number(row.o_parent_id) : null,
                o_plan_description: row.o_plan_description || row.plan_description,
                priorityId: row.o_priority_id?.toString(),
                priorityCode: row.o_priority_code,
                priorityColor: row.o_priority_color,
                ovAssetsAmount: row.ov_assets_amount,
                ovAssetsReportedAmount: row.ov_assets_reported_amount,
                ovAssetsDraftAmount: row.ov_assets_draft_amount,
                ovAssetsRevisedAmount: row.ov_assets_revised_amount,
                ovAssetsDisapprovedAmount: row.ov_assets_disapproved_amount,
                ovAssetsApprovedNoFiledAmount: row.ov_assets_approved_no_filed_amount,
                ovAssetsApprovedFiledAmount: row.ov_assets_approved_filed_amount
            }));

            setVisits(mappedVisits);

            // 4. Load units based on filters
            const filteredUnitsData = await dataService.getFilteredUnits({
                systemParentId: advancedFilters.systemParentId,
                systemId: advancedFilters.systemId,
                unitTypeParentId: advancedFilters.unitTypeParentId,
                unitTypeId: advancedFilters.unitTypeId,
                search: searchQuery
            });
            setFilteredUnits(filteredUnitsData);

            // 5. Load teams for all visible visits
            loadTeamsForVisits(mappedVisits);

            // 6. Reload orders for these units (will be handled by useEffect below)
        } catch (error) {
            console.error('Error loading visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTeamsForVisits = async (visitsToLoad: OrderVisitExtended[]) => {
        try {
            if (!visitsToLoad.length) return;
            const visitIds = visitsToLoad.map(v => v.id);
            const teamResults = await dataService.getOrdersVisitsTeamsBulk(visitIds);
            setVisitTeams(prev => ({ ...prev, ...teamResults }));
        } catch (error) {
            console.error('Error loading visit teams:', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateDisplay = (dateString?: string) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    };

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 1: return 'bg-yellow-500';
            case 2: return 'bg-blue-500';
            case 3: return 'bg-green-500';
            case 4: return 'bg-purple-500';
            case 7: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Filter Logic
    const handleSystemChange = async (systemId: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, systemParentId: systemId, systemId: [] }));
        if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
            const ids = Array.isArray(systemId) ? systemId : [systemId];
            const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
            setFilterOptions(prev => ({ ...prev, subSystems: results.flat() }));
        } else {
            setFilterOptions(prev => ({ ...prev, subSystems: [] }));
        }
    };

    const handleParentUnitTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, unitTypeParentId: id, unitTypeId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
            setUnitSubTypes(results.flat());
        } else {
            setUnitSubTypes([]);
        }
    };

    const handleOrderTypeChange = async (id: string | string[]) => {
        setAdvancedFilters(prev => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
        if (id && (Array.isArray(id) ? id.length > 0 : true)) {
            const ids = Array.isArray(id) ? id : [id];
            const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
            setOrderSubTypes(results.flat());
        } else {
            setOrderSubTypes([]);
        }
    };

    const openSelectionModal = (key: keyof OrderFilters, label: string, options: { value: string; label: string }[]) => {
        const value = advancedFilters[key];
        const currentValue = Array.isArray(value)
            ? (value as any[]).map(String)
            : (value !== undefined && value !== null ? [String(value)] : []);
        setSelectionModal({
            isOpen: true,
            filterKey: key,
            label,
            options,
            currentValue
        });
        setSelectionSearch('');
    };

    const handleModalConfirm = (value: string[]) => {
        const key = selectionModal.filterKey;
        const finalValue = value; // Keep purely as string array

        if (key === 'systemParentId') {
            handleSystemChange(finalValue);
        } else if (key === 'unitTypeParentId') {
            handleParentUnitTypeChange(finalValue);
        } else if (key === 'orderTypeId') {
            handleOrderTypeChange(finalValue);
        } else {
            setAdvancedFilters(prev => ({ ...prev, [key]: finalValue }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    };

    // -------------------------------------------------------------------------
    // REACTIVE FILTERING LOGIC
    // -------------------------------------------------------------------------

    // 1. Base Filter (Search + Advanced Filters) - Used to calculate CARD COUNTS
    const baseFilteredVisits = useMemo(() => {
        return visits.filter(visit => {
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matches = (
                    visit.ovMask?.toLowerCase().includes(query) ||
                    visit.unitDescription?.toLowerCase().includes(query) ||
                    visit.clientName?.toLowerCase().includes(query) ||
                    visit.orderMask?.toLowerCase().includes(query) ||
                    visit.teamLeaderName?.toLowerCase().includes(query)
                );
                if (!matches) return false;
            }

            // Date Range Filter
            if (dateRange.start || dateRange.end) {
                const visitDateStr = visit.ovStartedAt || visit.ovCreatedAt;
                if (visitDateStr) {
                    const visitDate = new Date(visitDateStr);

                    if (dateRange.start) {
                        const [y, m, d] = dateRange.start.split('-').map(Number);
                        const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
                        if (visitDate < startDate) return false;
                    }

                    if (dateRange.end) {
                        const [y, m, d] = dateRange.end.split('-').map(Number);
                        const endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                        if (visitDate > endDate) return false;
                    }
                } else if (dateRange.start) {
                    // If no date at all, filter out if we have a range
                    return false;
                }
            }

            // Advanced Filters helper
            const checkFilter = (filterKey: keyof OrderFilters, visitKey: keyof OrderVisitExtended) => {
                const filterValue = (advancedFilters as any)[filterKey];
                if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

                const visitValue = (visit as any)[visitKey]?.toString();
                if (!visitValue) return false;

                if (Array.isArray(filterValue)) {
                    return filterValue.map(String).includes(visitValue);
                }
                return String(filterValue) === visitValue;
            };

            if (!checkFilter('systemParentId', 'systemParentId')) return false;
            if (!checkFilter('systemId', 'systemId')) return false;
            if (!checkFilter('unitTypeParentId', 'unitTypeParentId')) return false;
            if (!checkFilter('unitTypeId', 'unitTypeId')) return false;
            if (!checkFilter('orderObjectId', 'orderObjectId')) return false;
            if (!checkFilter('orderTypeId', 'orderTypeId')) return false;
            if (!checkFilter('orderTypeSubId', 'orderTypeSubId')) return false;
            if (!checkFilter('contractId', 'contractId')) return false;
            if (!checkFilter('orderPlanId', 'planId')) return false;
            if (!checkFilter('orderTeamId', 'teamId')) return false;

            // Global Filter: parent_id > 0 (removed as it was too restrictive for this dashboard)
            // if (!(visit.parentId && visit.parentId > 0)) return false;

            return true;
        });
    }, [visits, searchQuery, advancedFilters, dateRange]);

    // 2. Dynamic Stats - Calculated directly from Base Filter
    const stats = useMemo(() => {
        const newStats: Record<number, { count: number; total: number }> = {};
        processingStages.forEach(stage => {
            const filtered = baseFilteredVisits.filter(v => v.ovProcessingId === stage.id);
            newStats[stage.id] = {
                count: filtered.length,
                total: filtered.reduce((acc, v) => acc + (v.totalValue || 0), 0)
            };
        });
        return newStats;
    }, [baseFilteredVisits, processingStages]);

    // 3. Final Filtered List - Base Filter + Active Card Filter
    const filteredVisits = useMemo(() => {
        return baseFilteredVisits
            .filter(visit => {
                if (activeFilter !== 'all') {
                    if (visit.ovProcessingId !== parseInt(activeFilter)) return false;
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = a.ovStartedAt ? new Date(a.ovStartedAt).getTime() : 0;
                const dateB = b.ovStartedAt ? new Date(b.ovStartedAt).getTime() : 0;
                return dateA - dateB; // Oldest first (Ascending)
            });
    }, [baseFilteredVisits, activeFilter]);

    // 4. Global Financial Totals - Sum of all visits in the filtered list
    const financialTotals = useMemo(() => {
        return {
            services: appropriationData.services.reduce((acc, i) => acc + (i.value_total || 0), 0),
            materials: appropriationData.materials.reduce((acc, i) => acc + (i.value_total || 0), 0),
            vehicles: appropriationData.vehicles.reduce((acc, i) => acc + (i.value_total || 0), 0)
        };
    }, [appropriationData]);

    const totalSumValue = financialTotals.services + financialTotals.materials + financialTotals.vehicles;

    // --- PRE-CALCULATE INSIGHT DATA ---
    const insightData = useMemo(() => {
        // 1. Composition by Plan
        const planMap = new Map();
        filteredVisits.forEach(v => {
            const plan = v.o_plan_description || 'Sem Plano';
            planMap.set(plan, (planMap.get(plan) || 0) + (v.totalValue || 0));
        });

        const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#64748b', '#f43f5e', '#ec4899', '#8b5cf6'];
        const composition = Array.from(planMap.entries())
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length]
            }))
            .sort((a, b) => b.value - a.value);

        const totalComposition = composition.reduce((acc, c) => acc + c.value, 0);

        // 2. Daily Trend (Visits per day)
        const dailyMap = new Map();
        filteredVisits.forEach(v => {
            if (!v.ovStartedAt) return;
            const day = v.ovStartedAt.split('T')[0];
            dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        });
        const trend = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-10) // Last 10 days found
            .map(([day, count]) => ({
                label: day.split('-').slice(1).reverse().join('/'),
                value: count
            }));

        // 3. Top 3 Units by Value
        const unitMap = new Map();
        filteredVisits.forEach(v => {
            const unit = v.unitDescription || 'Sem Unidade';
            unitMap.set(unit, (unitMap.get(unit) || 0) + (v.totalValue || 0));
        });
        const units = Array.from(unitMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);

        return { composition, trend, units, totalComposition };
    }, [financialTotals, filteredVisits]);

    // 4. Visible Slice for Infinite Scroll
    const displayedVisits = useMemo(() => {
        return filteredVisits.slice(0, visibleCount);
    }, [filteredVisits, visibleCount]);

    // Fetch Appropriation Data when filtered visits change
    useEffect(() => {
        if (!loading && filteredVisits.length > 0) {
            fetchAppropriationData();
        } else if (filteredVisits.length === 0) {
            setAppropriationData({ services: [], materials: [], vehicles: [] });
        }
    }, [filteredVisits, loading]);

    const fetchAppropriationData = async () => {
        try {
            setIsFetchingAppropriation(true);
            const ovIds = filteredVisits.map(v => v.id);
            if (!ovIds.length) return;

            const [servicesRaw, materialsRaw, vehiclesRaw] = await Promise.all([
                dataService.getOrdersVisitsServicesMerged(ovIds),
                dataService.getOrdersVisitsMaterialsMerged(ovIds),
                dataService.getOrdersVisitsVehiclesMerged(ovIds)
            ]);

            // Aggregate helper - Groups by: description, code, unit value, and discount
            const aggregate = (items: any[], codeKey: string, descKey: string) => {
                const map = new Map<string, any>();
                items.forEach(item => {
                    const code = item[codeKey] || 'N/A';
                    const desc = item[descKey] || item.description || 'Sem descrição';
                    const valueUnit = Number(item.value_unit || 0).toFixed(2);
                    const discount = Number(item.discount || 1).toFixed(3);

                    // Group by: code + description + unit value + discount
                    const key = `${code}_${desc}_${valueUnit}_${discount}`;

                    if (map.has(key)) {
                        const existing = map.get(key);
                        existing.amount = (existing.amount || 0) + Number(item.amount || 0);
                        existing.value_total = (existing.value_total || 0) + Number(item.value_total || 0);
                    } else {
                        map.set(key, {
                            ...item,
                            code,
                            description: desc,
                            amount: Number(item.amount || 0),
                            value_total: Number(item.value_total || 0),
                            value_unit: Number(item.value_unit || 0),
                            discount: Number(item.discount || 1)
                        });
                    }
                });
                return Array.from(map.values()).sort((a, b) =>
                    (a.description || '').localeCompare(b.description || '', 'pt-BR')
                );
            };

            setAppropriationData({
                services: aggregate(servicesRaw, 'code', 'description'),
                materials: aggregate(materialsRaw, 'material_code', 'material_description'),
                vehicles: aggregate(vehiclesRaw, 'code', 'vehicle_description')
            });
        } catch (error) {
            console.error('Error fetching appropriation data:', error);
        } finally {
            setIsFetchingAppropriation(false);
        }
    };

    // Reset pagination when filters change
    useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, searchQuery, advancedFilters, dateRange]);

    // Load orders for all filtered units
    useEffect(() => {
        const loadUnitsOrders = async () => {
            if (filteredUnits.length === 0) {
                setUnitsOrders({});
                return;
            }

            const ordersMap: Record<string, any[]> = {};
            // Fetch for each unit - potentially optimize with a single query if many units
            await Promise.all(filteredUnits.map(async (unit) => {
                const orders = await dataService.getOpenOrdersByUnit(unit.id.toString(), {
                    orderObjectId: advancedFilters.orderObjectId,
                    orderTypeId: advancedFilters.orderTypeId,
                    orderTypeSubId: advancedFilters.orderTypeSubId,
                    contractId: advancedFilters.contractId,
                    planId: advancedFilters.orderPlanId,
                    teamId: advancedFilters.orderTeamId
                });
                ordersMap[unit.id.toString()] = orders;
            }));

            setUnitsOrders(ordersMap);
        };

        loadUnitsOrders();
    }, [filteredUnits, advancedFilters]);

    // Setup Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredVisits.length) {
                    setVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [filteredVisits.length, visibleCount]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white animate-in fade-in duration-500 relative">

            {/* Horizontal Filter Bar */}
            <div className="z-30 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <div className="flex flex-col p-3 gap-1">
                    {/* Filters Row (Scrollable) */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-1">
                        <FilterSelect
                            label="SISTEMA"
                            value={advancedFilters.systemParentId || []}
                            onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterOptions.systems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleSystemChange([])}
                        />
                        <FilterSelect
                            label="SUB-SISTEMA"
                            value={advancedFilters.systemId || []}
                            onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterOptions.subSystems.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, systemId: [] }))}
                            disabled={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)}
                        />
                        <FilterSelect
                            label="TIPO UNIDADE"
                            value={advancedFilters.unitTypeParentId || []}
                            onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterOptions.unitTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleParentUnitTypeChange([])}
                        />
                        <FilterSelect
                            label="SUB-TIPO UNIDADE"
                            value={advancedFilters.unitTypeId || []}
                            onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, unitTypeId: [] }))}
                            disabled={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)}
                        />
                        <FilterSelect
                            label="FINALIDADE"
                            value={advancedFilters.orderObjectId || []}
                            onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterOptions.orderObjects.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, orderObjectId: [] }))}
                        />
                        <FilterSelect
                            label="TIPO OS"
                            value={advancedFilters.orderTypeId || []}
                            onClick={() => openSelectionModal('orderTypeId', 'TIPO OS', filterOptions.orderTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => handleOrderTypeChange([])}
                        />
                        <FilterSelect
                            label="SUB-TIPO OS"
                            value={advancedFilters.orderTypeSubId || []}
                            onClick={() => openSelectionModal('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, orderTypeSubId: [] }))}
                            disabled={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)}
                        />
                        <FilterSelect
                            label="CONTRATO"
                            value={advancedFilters.contractId || []}
                            onClick={() => openSelectionModal('contractId', 'CONTRATO', filterOptions.contracts.map(opt => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, contractId: [] }))}
                        />
                        <FilterSelect
                            label="PLANO"
                            value={advancedFilters.orderPlanId || []}
                            onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterOptions.plans.map(opt => ({ value: String(opt.id), label: opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, orderPlanId: [] }))}
                        />
                        <FilterSelect
                            label="EQUIPE"
                            value={advancedFilters.orderTeamId || []}
                            onClick={() => openSelectionModal('orderTeamId', 'EQUIPE', filterOptions.teams.map(opt => ({ value: String(opt.id), label: opt.name || opt.description })))}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, orderTeamId: [] }))}
                        />
                    </div>

                    {/* Action Row (Date Inputs + Buttons) */}
                    <div className="flex items-center justify-between gap-3 pb-1 pt-0 mt-0">
                        {/* Date Range Inputs */}
                        {/* Date Range Selector Button */}
                        <div className="relative group flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm hover:shadow-md cursor-pointer">
                            <input
                                type="month"
                                value={dateRange.start ? dateRange.start.substring(0, 7) : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        const start = `${val}-01`;
                                        const [y, m] = val.split('-');
                                        const end = new Date(parseInt(y), parseInt(m), 0).toISOString().split('T')[0];
                                        setDateRange({ start, end });
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                            </div>
                            <div className="flex flex-col pointer-events-none">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-0.5">Competência</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 capitalize">
                                        {(() => {
                                            if (!dateRange.start) return 'Selecionar';
                                            const [year, month] = dateRange.start.split('-');
                                            if (!year || !month) return 'Selecionar';
                                            const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                                            const monthName = d.toLocaleString('pt-BR', { month: 'short' });
                                            // Capitalize first letter
                                            return `${monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', '')} ${year}`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 text-lg group-hover:text-primary transition-colors ml-2 pointer-events-none">expand_more</span>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Clear all shortcut */}
                            {(Object.values(advancedFilters).some(v => Array.isArray(v) && v.length > 0)) && (
                                <button
                                    onClick={() => { setAdvancedFilters({}); setUnitSubTypes([]); setOrderSubTypes([]); }}
                                    className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 group active:scale-95"
                                    title="Limpar todos os filtros"
                                >
                                    <span className="material-symbols-outlined text-xl group-hover:rotate-[-10deg]">filter_alt_off</span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Limpar Filtros</span>
                                </button>
                            )}
                            <button
                                onClick={loadData}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
                            >
                                <span className="material-symbols-outlined text-xl">filter_list</span>
                                <span className="text-[13px] uppercase tracking-wide">FILTRAR</span>
                            </button>
                        </div>
                    </div>
                </div>    {/* Action Row */}

            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                {/* Tables Grid Section */}
                <div className="flex flex-col gap-8">
                    {/* Operational Units Table */}
                    <UnitsPowerElectricTable
                        items={filteredUnits}
                        unitsOrders={unitsOrders}
                    />

                    {/* Invoices Table */}
                    <InvoicesTable items={[]} />
                </div>

                {/* Removed Original Results Section */}
            </div>

            {/* Selection Modal for Filters */}
            <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                <div className="flex flex-col gap-4 text-slate-800 dark:text-gray-100">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder={`Pesquisar ${selectionModal.label}...`}
                            value={selectionSearch}
                            onChange={(e) => setSelectionSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
                        {selectionModal.options
                            .filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase()))
                            .map(opt => {
                                const isSelected = selectionModal.currentValue.includes(opt.value);
                                return (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => {
                                                const newVal = isSelected
                                                    ? selectionModal.currentValue.filter(v => v !== opt.value)
                                                    : [...selectionModal.currentValue, opt.value];
                                                setSelectionModal(prev => ({ ...prev, currentValue: newVal }));
                                            }}
                                        />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        {selectionModal.options.filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase())).length === 0 && (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => handleModalConfirm(selectionModal.currentValue)}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm"
                        >
                            Confirmar ({selectionModal.currentValue.length})
                        </button>
                    </div>
                </div>
            </Modal>


        </div>
    );
};


