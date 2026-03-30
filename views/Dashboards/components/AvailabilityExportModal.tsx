import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { dataService } from '../../../services/dataService';
import { ExcelExportUtils } from '../../../utils/ExcelExportUtils';
import { toast } from 'sonner';
import { RiFileExcel2Fill, RiHistoryLine, RiCalendarCheckLine, RiCalendarEventLine, RiCheckFill, RiCalendarLine } from 'react-icons/ri';
import { formatDateTime, formatDate } from '../../../utils/formatters';
import { Calendar } from '../../../components/ui/Calendar';
import { Select } from '../../../components/ui/Select';
import { pdf } from '@react-pdf/renderer';
import { AvailabilityReportDocument } from '../../../components/reports/AvailabilityReportDocument';
import { getLogoBase64 } from '../../../utils/PdfImageUtils';
import { FileUtils } from '../../../utils/FileUtils';
import { FaFilePdf } from 'react-icons/fa';
import { useEffect } from 'react';
import { AvailabilityDataView } from '../../../components/ui/AvailabilityDataView';
import { RiWindowFill } from 'react-icons/ri';

interface AvailabilityExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    unitId: string;
    unitDescription: string;
    assetTagId?: string;
    assetTagDescription?: string;
    availableSubTags: { id: string; description: string }[];
}

export const AvailabilityExportModal: React.FC<AvailabilityExportModalProps> = ({
    isOpen,
    onClose,
    unitId,
    unitDescription,
    assetTagId,
    assetTagDescription,
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
    const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | 'tela' | null>(null);
    const [lastExportedFormat, setLastExportedFormat] = useState<'excel' | 'pdf' | 'tela' | null>(null);
    const [hoveredFormat, setHoveredFormat] = useState<'excel' | 'pdf' | 'tela' | null>(null);
    const [showDataView, setShowDataView] = useState(false);
    const [fetchedData, setFetchedData] = useState<any[]>([]);

    // Reset generated states when filters change
    useEffect(() => {
        setLastExportedFormat(null);
    }, [startDate, endDate, selectedSubTagId]);

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

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            setIsExporting(format);
            const toastId = toast.loading(`Buscando dados histórico de disponibilidade para ${format.toUpperCase()}...`);

            const data = await dataService.getAssetAvailabilityForExport(
                unitId,
                startDate,
                endDate,
                assetTagId,
                selectedSubTagId
            );

            if (!data || data.length === 0) {
                toast.error('Nenhum dado encontrado para exportar.', { id: toastId });
                setIsExporting(null);
                return;
            }

            const filename = `Disponibilidade_${unitDescription.replace(/\s+/g, '_')}_${startDate}_a_${endDate}`;

            if (format === 'excel') {
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

                await ExcelExportUtils.exportToExcel(formattedData, filename, 'Disponibilidade');
                setLastExportedFormat('excel');
                toast.success('Excel exportado com sucesso!', { id: toastId });
            } else {
                toast.loading(`Gerando PDF com ${data.length} registros...`, { id: toastId });

                const logoBase64 = await getLogoBase64();
                const doc = (
                    <AvailabilityReportDocument 
                        availability={data} 
                        logoBase64={logoBase64} 
                        unitDescription={unitDescription}
                        startDate={formatDisplayDate(startDate)}
                        endDate={formatDisplayDate(endDate)}
                    />
                );
                
                const blob = await pdf(doc).toBlob();
                await FileUtils.downloadFile(blob, `${filename}.pdf`);
                
                setLastExportedFormat('pdf');
                toast.success('PDF exportado com sucesso!', { id: toastId });
            }
        } catch (error) {
            console.error(`Erro ao exportar ${format}:`, error);
            toast.error(`Ocorreu um erro ao exportar o ${format.toUpperCase()}.`);
        } finally {
            setIsExporting(null);
        }
    };
    

    const handleShowOnScreen = async () => {
        try {
            setIsExporting('tela');
            const toastId = toast.loading(`Buscando dados histórico de disponibilidade para exibir em TELA...`);

            const data = await dataService.getAssetAvailabilityForExport(
                unitId,
                startDate,
                endDate,
                assetTagId,
                selectedSubTagId
            );

            if (!data || data.length === 0) {
                toast.error('Nenhum dado encontrado para exibir.', { id: toastId });
                setIsExporting(null);
                return;
            }

            setFetchedData(data);
            setShowDataView(true);
            setLastExportedFormat('tela');
            toast.success('Dados carregados com sucesso!', { id: toastId });
        } catch (error) {
            console.error(`Erro ao buscar dados para tela:`, error);
            toast.error(`Ocorreu um erro ao buscar os dados.`);
        } finally {
            setIsExporting(null);
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

                 {/* 5. Footer Action Buttons */}
                <div className="pt-2 grid grid-cols-3 gap-2" onMouseLeave={() => setHoveredFormat(null)}>
                    <button
                        onClick={handleShowOnScreen}
                        onMouseEnter={() => setHoveredFormat('tela')}
                        disabled={!!isExporting}
                        className={`w-full py-4.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.98] font-black uppercase tracking-widest text-[11px] ${
                            (hoveredFormat === 'tela' || (hoveredFormat === null && lastExportedFormat === 'tela'))
                            ? 'bg-[#2563EB] text-white shadow-blue-600/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                        }`}
                    >
                        {isExporting === 'tela' ? (
                            <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <RiWindowFill size={20} className={(hoveredFormat === 'tela' || (hoveredFormat === null && lastExportedFormat === 'tela')) ? 'text-white' : 'text-slate-400'} />
                        )}
                        <span>TELA</span>
                    </button>

                    <button
                        onClick={() => handleExport('excel')}
                        onMouseEnter={() => setHoveredFormat('excel')}
                        disabled={!!isExporting}
                        className={`w-full py-4.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.98] font-black uppercase tracking-widest text-[11px] ${
                            (hoveredFormat === 'excel' || (hoveredFormat === null && lastExportedFormat === 'excel'))
                            ? 'bg-[#2563EB] text-white shadow-blue-600/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                        }`}
                    >
                        {isExporting === 'excel' ? (
                            <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <RiFileExcel2Fill size={20} className={(hoveredFormat === 'excel' || (hoveredFormat === null && lastExportedFormat === 'excel')) ? 'text-white' : 'text-slate-400'} />
                        )}
                        <span>EXCEL</span>
                    </button>

                    <button
                        onClick={() => handleExport('pdf')}
                        onMouseEnter={() => setHoveredFormat('pdf')}
                        disabled={!!isExporting}
                        className={`w-full py-4.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all active:scale-[0.98] font-black uppercase tracking-widest text-[11px] ${
                            (hoveredFormat === 'pdf' || (hoveredFormat === null && lastExportedFormat === 'pdf'))
                            ? 'bg-[#2563EB] text-white shadow-blue-600/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                        }`}
                    >
                        {isExporting === 'pdf' ? (
                            <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaFilePdf size={20} className={(hoveredFormat === 'pdf' || (hoveredFormat === null && lastExportedFormat === 'pdf')) ? 'text-white' : 'text-slate-400'} />
                        )}
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* Modal de visualização de dados em tela */}
            <AvailabilityDataView 
                isOpen={showDataView}
                onClose={() => setShowDataView(false)}
                data={fetchedData}
                unitDescription={unitDescription}
                assetTagDescription={assetTagDescription}
                startDate={formatDisplayDate(startDate)}
                endDate={formatDisplayDate(endDate)}
            />
        </Modal>
    );
};
