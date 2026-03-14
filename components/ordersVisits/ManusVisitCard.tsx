import React from 'react';
import { ManusVisit } from '../../types/manus';

interface ManusVisitCardProps {
    visit: ManusVisit;
    onVerify: () => void;
    onImport: () => void;
}

export const ManusVisitCard: React.FC<ManusVisitCardProps> = ({ visit, onVerify, onImport }) => {
    const totalValue = visit.InvoiceServicesValue + visit.InvoiceVehiclesValue + visit.InvoiceMaterialValue;

    const formatManusDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            // Suporte para o novo formato ISO vindo do processamento (yyyy-mm-ddThh:mm:ss-03:00)
            if (dateStr.includes('T')) {
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes} h`;
            }

            // Fallback para o formato antigo (yyyy-mm-dd hh:mm)
            const [datePart, timePart] = dateStr.split(' ');
            if (datePart && timePart) {
                const [year, month, day] = datePart.split('-');
                return `${day}/${month}/${year} ${timePart} h`;
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    };

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return '0,00 h';
        try {
            const startDate = new Date(start.replace(' ', 'T'));
            const endDate = new Date(end.replace(' ', 'T'));
            const diffMs = endDate.getTime() - startDate.getTime();
            const diffHrs = diffMs / (1000 * 60 * 60);
            return `${diffHrs.toFixed(2).replace('.', ',')} h`;
        } catch (e) {
            return '0,00 h';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            {/* Edge accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
            
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">OS MANUS</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{visit.OrderMask}</span>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">SITUAÇÃO</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {visit.ProcessStatus}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">INÍCIO</span>
                    <span className="whitespace-nowrap">{formatManusDate(visit.OrderVisitStartedDate)}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">DUR</span>
                    <span className="font-bold">{calculateDuration(visit.OrderVisitStartedDate, visit.OrderVisitFinishedDate)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-400">TÉRMINO</span>
                    <span className="whitespace-nowrap">{formatManusDate(visit.OrderVisitFinishedDate)}</span>
                </div>
                
                <div className="flex flex-col col-span-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Equipe</span>
                    <span className="font-medium">{visit.OrderVisitLeaderNameShort} {visit.OrderVisitTeam && `- ${visit.OrderVisitTeam}`}</span>
                </div>
                <div className="flex justify-between items-end col-span-3 mt-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">APROVADOR</span>
                        <span className="text-xs">{visit.AgreeUserName}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-400">VALOR TOTAL</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {visit._importStatus === 'error' && visit._importMessage && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-500/20">
                    <span className="font-bold">Atenção:</span> {visit._importMessage}
                </div>
            )}

            {visit._importStatus === 'success' && (
                <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded border border-emerald-100 dark:border-emerald-500/20 flex gap-2 items-center">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="font-bold">Visita importada com sucesso!</span>
                </div>
            )}

            <div className="mt-2 flex w-full">
                {(!visit._importStatus || visit._importStatus === 'error') && (
                    <button 
                        onClick={onVerify}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors"
                    >
                        Verificar Sincronização
                    </button>
                )}
                {visit._importStatus === 'verifying' && (
                    <button disabled className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs font-bold uppercase rounded-xl flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                        Verificando...
                    </button>
                )}
                {visit._importStatus === 'ready' && (
                    <button 
                        onClick={onImport}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        Confirmar Importação
                    </button>
                )}
                {visit._importStatus === 'importing' && (
                    <button disabled className="w-full py-2 bg-indigo-400 text-white text-xs font-bold uppercase rounded-xl flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Importando...
                    </button>
                )}
            </div>
        </div>
    );
};
