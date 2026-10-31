import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogItem, AuditLogFilters, AuditOperation, AUDIT_OPERATIONS, AUDITED_TABLES } from '../../../types';
import { dataService } from '../../../services/dataService';
import { formatDateInBrazil } from '../../../utils/formatters';
import { Select } from '../../../components/ui/Select';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { Calendar } from '../../../components/ui/Calendar';
import { toast } from 'sonner';

interface AuditLogListProps {
    onBack?: () => void;
}

const tableLabel = (tableName: string) =>
    AUDITED_TABLES.find(t => t.key === tableName)?.label || tableName;

const opConfig = (op: AuditOperation) =>
    AUDIT_OPERATIONS.find(o => o.key === op) || { key: op, label: op, icon: 'change_history', color: 'text-slate-500' };

const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value === '' ? '—' : value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const toDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getCurrentMonthRange = () => {
    const now = new Date();
    return {
        start: toDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
};

const getPreviousMonthRange = () => {
    const now = new Date();
    return {
        start: toDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: toDateString(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
};

const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return year && month && day ? `${day}/${month}/${year}` : dateString;
};

export const AuditLogList: React.FC<AuditLogListProps> = () => {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTable, setFilterTable] = useState('');
    const [filterOperation, setFilterOperation] = useState<'' | AuditOperation>('');
    const [dateRange, setDateRange] = useState(getCurrentMonthRange);
    const [tempDateRange, setTempDateRange] = useState(dateRange);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end'>('start');
    const [page, setPage] = useState(0);
    const [detailLog, setDetailLog] = useState<AuditLogItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const pageSize = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const filters: AuditLogFilters = {
                search: search || undefined,
                tableName: filterTable || undefined,
                operation: filterOperation || undefined,
                dateFrom: dateRange.start || undefined,
                dateTo: dateRange.end || undefined,
                page,
                pageSize,
            };
            const result = await dataService.listAuditLogs(filters);
            setLogs(result.logs);
            setTotal(result.total);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    }, [search, filterTable, filterOperation, dateRange, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleOpenDetail = async (log: AuditLogItem) => {
        setDetailLoading(true);
        setDetailLog(log);
        try {
            const full = await dataService.getAuditLogById(log.id);
            if (full) setDetailLog(full);
        } catch (err) {
            console.error('Error fetching audit log detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const totalPages = Math.ceil(total / pageSize);
    const todayStr = toDateString(new Date());
    const currentMonthRange = getCurrentMonthRange();
    const previousMonthRange = getPreviousMonthRange();

    const handleDateModalOpen = () => {
        setTempDateRange(dateRange);
        setActiveDateInput('start');
        setIsDateModalOpen(true);
    };

    const handleDateModalApply = () => {
        const start = tempDateRange.start || todayStr;
        const end = tempDateRange.end || todayStr;

        if (start > end) {
            toast.error('A data inicial deve ser menor ou igual à final');
            return;
        }

        setDateRange({ start, end });
        setPage(0);
        setIsDateModalOpen(false);
    };

    const diffRows = (() => {
        if (!detailLog) return [];
        const oldData = detailLog.dataOld || {};
        const newData = detailLog.dataNew || {};
        const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).sort();
        return keys
            .map(key => ({
                key,
                oldValue: formatValue(oldData[key]),
                newValue: formatValue(newData[key]),
                changed: JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]),
            }))
            .filter(row => detailLog.operation !== 'UPDATE' || row.changed);
    })();

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Buscar por tabela ou registro..."
                        />
                    </div>
                    <Select
                        value={filterTable}
                        onChange={(e) => { setFilterTable(e.target.value); setPage(0); }}
                        options={[
                            { value: '', label: 'Todas as tabelas' },
                            ...AUDITED_TABLES.map(t => ({ value: t.key, label: t.label }))
                        ]}
                        placeholder="Todas as tabelas"
                    />
                    <Select
                        value={filterOperation}
                        onChange={(e) => { setFilterOperation(e.target.value as '' | AuditOperation); setPage(0); }}
                        options={[
                            { value: '', label: 'Todas as operações' },
                            ...AUDIT_OPERATIONS.map(o => ({ value: o.key, label: o.label }))
                        ]}
                        placeholder="Todas as operações"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDateModalOpen}
                        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                        <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        </span>
                        <span className="flex flex-col items-start">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1">Período</span>
                            <span className="flex items-center gap-2 text-[12px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                                {dateRange.start && dateRange.end
                                    ? <>{formatDateDisplay(dateRange.start)} <span className="text-slate-300 dark:text-slate-600">-</span> {formatDateDisplay(dateRange.end)}</>
                                    : 'Todo o período'}
                            </span>
                        </span>
                        <span className="material-symbols-outlined text-slate-300 text-lg group-hover:text-primary transition-colors shrink-0">edit_calendar</span>
                    </button>
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => { setDateRange({ start: '', end: '' }); setPage(0); }}
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            Limpar período
                        </button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                title="INFORMAR PERÍODO"
                maxWidth="sm"
                draggable
            >
                <div className="flex flex-col gap-4 px-2 pb-2 -mt-4">
                    <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 justify-start sm:justify-center items-center snap-x snap-mandatory px-2">
                        {[
                            { label: 'Mês Passado', icon: 'calendar_month', range: previousMonthRange },
                            { label: 'Mês Atual', icon: 'calendar_today', range: currentMonthRange },
                            { label: 'Hoje', icon: 'today', range: { start: todayStr, end: todayStr } },
                        ].map(({ label, icon, range }) => {
                            const isSelected = tempDateRange.start === range.start && tempDateRange.end === range.end;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                        setTempDateRange(range);
                                        setActiveDateInput('start');
                                    }}
                                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all snap-center ${isSelected
                                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-black'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-primary' : ''}`}>{icon}</span>
                                    <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(['start', 'end'] as const).map((field) => (
                            <button
                                key={field}
                                type="button"
                                onClick={() => setActiveDateInput(field)}
                                className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${activeDateInput === field
                                    ? 'border-primary bg-primary/5'
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                    }`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeDateInput === field ? 'text-primary' : 'text-slate-400'}`}>
                                    {field === 'start' ? 'Início' : 'Fim'}
                                </span>
                                <span className={`text-sm font-bold ${tempDateRange[field] ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                                    {formatDateDisplay(tempDateRange[field]) || 'Selecionar'}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 shadow-sm">
                        <Calendar
                            value={tempDateRange[activeDateInput]}
                            onChange={(date) => {
                                setTempDateRange(prev => ({ ...prev, [activeDateInput]: date }));
                                if (activeDateInput === 'start') setActiveDateInput('end');
                            }}
                            rangeStart={tempDateRange.start}
                            rangeEnd={tempDateRange.end}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleDateModalApply}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            Aplicar Período
                        </button>
                    </div>
                </div>
            </Modal>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loading size="md" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">manage_search</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum registro de auditoria encontrado</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => {
                        const op = opConfig(log.operation);
                        return (
                            <button
                                key={log.id}
                                onClick={() => handleOpenDetail(log)}
                                className="w-full text-left bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 p-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-xl shrink-0 ${op.color}`}>
                                        {op.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${op.color} bg-slate-50 dark:bg-slate-800`}>
                                                {op.label}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {tableLabel(log.tableName)}
                                            </h3>
                                            {log.recordId && (
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    #{log.recordId}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold flex-wrap">
                                            <span>{log.userName || 'Sistema / sem sessão'}</span>
                                            <span>{formatDateInBrazil(log.createdAt, 'dateTime')}</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-lg text-slate-300 dark:text-slate-600 shrink-0">chevron_right</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            )}

            <Modal
                isOpen={!!detailLog}
                onClose={() => setDetailLog(null)}
                title={`Auditoria #${detailLog?.id ?? ''}`}
                maxWidth="2xl"
                hideCancelButton
                cancelLabel="Fechar"
            >
                {detailLoading ? (
                    <div className="flex justify-center py-8">
                        <Loading size="md" />
                    </div>
                ) : detailLog ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tabela</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{tableLabel(detailLog.tableName)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operação</p>
                                <p className={`font-semibold ${opConfig(detailLog.operation).color}`}>
                                    {opConfig(detailLog.operation).label}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registro</p>
                                <p className="font-semibold text-slate-900 dark:text-white">#{detailLog.recordId || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data/Hora</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {formatDateInBrazil(detailLog.createdAt, 'dateTime')}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Usuário</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {detailLog.userName || 'Sistema / sem sessão'}
                                    {detailLog.userId != null && (
                                        <span className="ml-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 normal-case">
                                            #{detailLog.userId}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                {detailLog.operation === 'UPDATE' ? 'Campos alterados' : 'Dados do registro'}
                            </p>
                            {diffRows.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    Nenhum campo exibível para esta operação.
                                </p>
                            ) : (
                                <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                <th className="text-left font-bold px-3 py-2">Campo</th>
                                                {detailLog.operation !== 'INSERT' && (
                                                    <th className="text-left font-bold px-3 py-2 w-2/5">Antes</th>
                                                )}
                                                {detailLog.operation !== 'DELETE' && (
                                                    <th className={`text-left font-bold px-3 py-2 ${detailLog.operation === 'UPDATE' ? 'w-2/5' : ''}`}>
                                                        Depois
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {diffRows.map((row) => (
                                                <tr key={row.key} className="border-t border-slate-100 dark:border-slate-800 align-top">
                                                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.key}</td>
                                                    {detailLog.operation !== 'INSERT' && (
                                                        <td className="px-3 py-2 text-red-600/80 dark:text-red-400/80 break-words">{row.oldValue}</td>
                                                    )}
                                                    {detailLog.operation !== 'DELETE' && (
                                                        <td className={`px-3 py-2 break-words ${detailLog.operation === 'UPDATE' && row.changed
                                                            ? 'text-green-600/80 dark:text-green-400/80 font-semibold'
                                                            : 'text-slate-700 dark:text-slate-300'
                                                        }`}>
                                                            {row.newValue}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};
