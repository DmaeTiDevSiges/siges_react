import React, { useState } from 'react';
import { Modal } from './Modal';
import { formatDateTime } from '../../utils/formatters';
import { RiCloseLine, RiCheckFill, RiCloseCircleFill, RiInformationLine, RiSearchLine } from 'react-icons/ri';
import { Input } from './Input';

interface AvailabilityDataViewProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    unitDescription: string;
    assetTagDescription?: string;
    startDate: string;
    endDate: string;
}

export const AvailabilityDataView: React.FC<AvailabilityDataViewProps> = ({
    isOpen,
    onClose,
    data,
    unitDescription,
    assetTagDescription,
    startDate,
    endDate
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item => {
        const search = searchTerm.toLowerCase();
        return (
            (item.tag_description || '').toLowerCase().includes(search) ||
            (item.tag_sub_description || '').toLowerCase().includes(search) ||
            (item.asset_unavailable_reason_description || '').toLowerCase().includes(search) ||
            (item.reported_user_name_short || '').toLowerCase().includes(search) ||
            (item.comments || '').toLowerCase().includes(search)
        );
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col text-left gap-0.5">
                    <span className="text-[14px] font-black uppercase tracking-widest text-slate-800 dark:text-white leading-tight">
                        DISPONIBILIDADE DE SETOR
                    </span>
                    {assetTagDescription && (
                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">
                            {assetTagDescription}
                        </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        {unitDescription}
                    </span>
                    <span className="text-[10px] font-medium text-primary uppercase mt-1">
                        {startDate} a {endDate}
                    </span>
                </div>
            }
            maxWidth="5xl"
        >
            <div className="flex flex-col h-[75vh]">
                {/* Search Bar */}
                <div className="px-4 pb-4">
                    <Input 
                        placeholder="Filtrar dados (Setor, Responsável, Motivo...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<RiSearchLine className="text-slate-400" />}
                        className="rounded-2xl!"
                    />
                </div>

                <div className="flex-1 overflow-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Setor / Sub-Setor</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Data Hora</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Disponível</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Observações</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Dist. (m)</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Responsável</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">
                                                {item.tag_description}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500 uppercase">
                                                {item.tag_sub_description || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[12px] font-black text-slate-600 dark:text-slate-400 tracking-tight">
                                            {formatDateTime(item.reported_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.is_available ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                                                <RiCheckFill size={14} />
                                                SIM
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg w-fit">
                                                <RiCloseCircleFill size={14} />
                                                NÃO
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                                            {item.asset_unavailable_reason_description || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[12px] font-medium text-slate-500 italic max-w-[200px] truncate block" title={item.comments}>
                                            {item.comments || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-[12px] font-black text-slate-800 dark:text-white">
                                            {item.unit_reported_distance_m != null ? Math.round(item.unit_reported_distance_m) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                            {item.reported_user_name_short || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredData.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-20 gap-3">
                            <RiInformationLine size={48} className="text-slate-300" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                {searchTerm ? 'Nenhum resultado para a busca' : 'Nenhum registro encontrado'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="py-6 px-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Registros: {filteredData.length} de {data.length}</span>
                </div>
            </div>
        </Modal>
    );
};
