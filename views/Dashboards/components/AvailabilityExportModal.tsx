import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { dataService } from '../../../services/dataService';
import { ExcelExportUtils } from '../../../utils/ExcelExportUtils';
import { toast } from 'sonner';
import { RiFileExcel2Fill, RiHistoryLine, RiCalendarCheckLine, RiCalendarEventLine, RiCheckFill, RiCalendarLine } from 'react-icons/ri';
import { formatDateTime, formatDate } from '../../../utils/formatters';
import { Calendar } from '../../../components/ui/Calendar';
import { Select } from '../../../components/ui/Select';

interface AvailabilityExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    unitId: string;
    unitDescription: string;
    assetTagId?: string;
    availableSubTags: { id: string; description: string }[];
}

export const AvailabilityExportModal: React.FC<AvailabilityExportModalProps> = ({
    isOpen,
    onClose,
    unitId,
    unitDescription,
    assetTagId,
    availableSubTags
}) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [activeInput, setActiveInput] = useState<'start' | 'end'>('start');
    const [selectedSubTagId, setSelectedSubTagId] = useState('all');
    const [isExporting, setIsExporting] = useState(false);

    const handleQuickSelect = (type: 'lastMonth' | 'currentMonth' | 'today') => {
        const now = new Date();
        if (type === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'currentMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (type === 'lastMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        }
        setActiveInput('end'); // Auto switch to end date after quick select
    };

    const handleDateChange = (date: string) => {
        if (activeInput === 'start') {
            setStartDate(date);
            if (date > endDate) setEndDate(date);
            setActiveInput('end');
        } else {
            if (date < startDate) {
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const toastId = toast.loading('Buscando dados histórico de disponibilidade...');

            const data = await dataService.getAssetAvailabilityForExport(
                unitId,
                startDate,
                endDate,
                assetTagId,
                selectedSubTagId
            );

            if (!data || data.length === 0) {
                toast.error('Nenhum dado encontrado para exportar.', { id: toastId });
                setIsExporting(false);
                return;
            }

            toast.loading(`Gerando Excel com ${data.length} registros...`, { id: toastId });

            const formattedData = data.map(item => ({
                'Unidade': item.unit_description,
                'Setor': item.tag_description,
                'Sub-Setor': item.tag_sub_description || '-',
                'Data Hora': formatDateTime(item.reported_at),
                'Disponivel': item.is_available ? 'SIM' : 'NÃO',
                'Motivo': item.asset_unavailable_reason_description || '-',
                'Observações': item.comments || '',
                'Distancia (m)': item.unit_reported_distance_m != null ? Math.round(item.unit_reported_distance_m) : '-',
                'Reportado por': item.reported_user_name_short || '-'
            }));

            const filename = `Disponibilidade_${unitDescription.replace(/\s+/g, '_')}_${startDate}_a_${endDate}`;
            await ExcelExportUtils.exportToExcel(formattedData, filename, 'Disponibilidade');

            toast.success('Excel exportado com sucesso!', { id: toastId });
            onClose();
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            toast.error('Ocorreu um erro ao exportar o Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    const subTagOptions = [
        { value: 'all', label: 'TODAS AS POSIÇÕES' },
        ...availableSubTags.map(tag => ({ value: tag.id, label: tag.description }))
    ];

    const formatDisplayDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="INFORMAR PERÍODO"
            maxWidth="md"
        >
            <div className="p-1 space-y-3">
                {/* 1. Positon (Sector) Selection - Now at Top */}
                <Select 
                    label="Filtrar por Posição (Opcional)"
                    options={subTagOptions}
                    value={selectedSubTagId}
                    onChange={(e) => setSelectedSubTagId(e.target.value)}
                    className="rounded-2xl!"
                />

                {/* 2. Quick Select Buttons */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleQuickSelect('lastMonth')}
                        className="flex-1 py-3 px-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl text-[10px] font-black hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-tight flex items-center justify-center gap-1.5 border border-transparent"
                    >
                        <RiHistoryLine size={14} className="opacity-60" />
                        MÊS PASSADO
                    </button>
                    <button 
                        onClick={() => handleQuickSelect('currentMonth')}
                        className="flex-1 py-3 px-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl text-[10px] font-black hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-tight flex items-center justify-center gap-1.5 border border-transparent"
                    >
                        <RiCalendarCheckLine size={14} className="opacity-60" />
                        MÊS ATUAL
                    </button>
                    <button 
                        onClick={() => handleQuickSelect('today')}
                        className="flex-1 py-3 px-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl text-[10px] font-black hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-tight flex items-center justify-center gap-1.5 border border-transparent"
                    >
                        <RiCalendarEventLine size={14} className="opacity-60" />
                        HOJE
                    </button>
                </div>

                {/* 3. Date Input Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setActiveInput('start')}
                        className={`text-left p-4 rounded-2xl border-2 transition-all group ${
                            activeInput === 'start' 
                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeInput === 'start' ? 'text-primary' : 'text-slate-400'}`}>Início</span>
                            <RiCalendarLine className={activeInput === 'start' ? 'text-primary' : 'text-slate-300'} />
                        </div>
                        <div className="text-[15px] font-black text-slate-800 dark:text-white">
                            {formatDisplayDate(startDate)}
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveInput('end')}
                        className={`text-left p-4 rounded-2xl border-2 transition-all group ${
                            activeInput === 'end' 
                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeInput === 'end' ? 'text-primary' : 'text-slate-400'}`}>Fim</span>
                            <RiCalendarLine className={activeInput === 'end' ? 'text-primary' : 'text-slate-300'} />
                        </div>
                        <div className="text-[15px] font-black text-slate-800 dark:text-white">
                            {formatDisplayDate(endDate)}
                        </div>
                    </button>
                </div>

                {/* 4. Calendar View */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-3xl p-4 bg-white dark:bg-slate-900/50">
                    <Calendar 
                        value={activeInput === 'start' ? startDate : endDate}
                        onChange={handleDateChange}
                        rangeStart={startDate}
                        rangeEnd={endDate}
                        className="w-full"
                    />
                </div>

                {/* 5. Footer Action Button */}
                <div className="pt-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
                    >
                        {isExporting ? (
                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RiCheckFill className="text-xl group-hover:scale-110 transition-transform" />
                        )}
                        <span className="uppercase tracking-widest text-[13px]">
                            {isExporting ? 'Processando...' : 'Aplicar Período e Exportar'}
                        </span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
