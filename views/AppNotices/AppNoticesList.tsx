import React, { useState, useEffect, useCallback } from 'react';
import { formatDateInBrazil } from '../../utils/formatters';

import { usePermissions } from '../../contexts/PermissionsContext';
import { useAppNoticesAdmin } from '../../hooks/useAppNotices';
import { AppNoticeForm } from '../../components/appNotices/AppNoticeForm';
import { isNoticeExpired, isNoticeWithinVigencia } from '../../utils/appNoticeWindow';
import {
    SystemNotice,
    CreateSystemNoticeInput,
    NoticeWorkersSummaryItem,
    NoticeWorker,
    NoticeWorkerPeriod,
} from '../../types';
import { appNoticesService } from '../../services/core/appNoticesService';
import { dataService } from '../../services/dataService';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { toast } from 'sonner';

interface AppNoticesListProps {
    onBack?: () => void;
}

export const AppNoticesList: React.FC<AppNoticesListProps> = ({ onBack }) => {
    const { canView, canSearch, canCreate, canEdit, canDelete } = usePermissions();
    const { notices, total, loading, fetchNotices, createNotice, updateNotice, deleteNotice, toggleActive } = useAppNoticesAdmin();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<SystemNotice | null>(null);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<{ id: number; code: string; label: string; color: string }[]>([]);
    const [severities, setSeverities] = useState<{ id: number; code: string; label: string; color: string }[]>([]);
    const [filterCategory, setFilterCategory] = useState<number | undefined>();
    const [filterSeverity, setFilterSeverity] = useState<number | undefined>();
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [moExtraByNotice, setMoExtraByNotice] = useState<Record<number, NoticeWorkersSummaryItem[]>>({});
    // Ativar/desativar: resposta imediata (otimista) + destaque temporário do card
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [flash, setFlash] = useState<{ id: number; active: boolean } | null>(null);
    // Notice id whose MO Extra breakdown is expanded inline in the card
    const [expandedMoExtraNoticeId, setExpandedMoExtraNoticeId] = useState<number | null>(null);

    useEffect(() => {
        loadCategoriesAndSeverities();
    }, []);

    // MO extra por company para os avisos listados (1 query em lote):
    // considera todas as escalas (soma total)
    useEffect(() => {
        let cancelled = false;
        const ids = notices.map((notice) => notice.id);
        if (ids.length === 0) {
            setMoExtraByNotice({});
            return;
        }
        dataService
            .getNoticeWorkersSummaryByNotices(ids, { onlyCurrent: false })
            .then((items) => {
                if (cancelled) return;
                const map: Record<number, NoticeWorkersSummaryItem[]> = {};
                items.forEach((item) => {
                    if (!map[item.noticeId]) map[item.noticeId] = [];
                    map[item.noticeId].push(item);
                });
                setMoExtraByNotice(map);
            })
            .catch((error) => {
                console.error('Error loading notice workers summary:', error);
                if (!cancelled) setMoExtraByNotice({});
            });
        return () => {
            cancelled = true;
        };
    }, [notices]);

    useEffect(() => {
        fetchNotices({
            search,
            categoryId: filterCategory,
            severityId: filterSeverity,
        });
    }, [search, filterCategory, filterSeverity, filterStatus]);

    const loadCategoriesAndSeverities = async () => {
        const [cats, sevs] = await Promise.all([
            appNoticesService.getCategories(),
            appNoticesService.getSeverities(),
        ]);
        setCategories(cats);
        setSeverities(sevs);
    };

    const handleCreate = async (input: CreateSystemNoticeInput) => {
        try {
            await createNotice(input);
            toast.success('Aviso criado com sucesso!');
            setIsFormOpen(false);
        } catch (error) {
            toast.error('Erro ao criar aviso');
        }
    };

    const handleEdit = async (input: CreateSystemNoticeInput) => {
        if (!editingNotice) return;
        try {
            await updateNotice(editingNotice.id, input as Partial<SystemNotice>);
            toast.success('Aviso atualizado com sucesso!');
            setIsFormOpen(false);
            setEditingNotice(null);
        } catch (error) {
            toast.error('Erro ao atualizar aviso');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const summary = await dataService.getNoticeWorkersSummaryByNotices([id]);
            const totalWorkers = summary.reduce((sum, item) => sum + item.total, 0);
            if (totalWorkers > 0) {
                toast.error('Não é possível excluir: este aviso possui MO extra lançada');
                return;
            }
        } catch (error) {
            // Falha na checagem não bloqueia: o service repete a validação na exclusão
            console.error('Error checking notice workers before delete:', error);
        }
        setDeletingId(id);
    };

    const confirmDelete = async () => {
        if (deletingId === null) return;
        try {
            await deleteNotice(deletingId);
            toast.success('Aviso excluído com sucesso!');
        } catch (error) {
            if (error instanceof Error && error.message === 'MO_EXTRA_EXISTS') {
                toast.error('Não é possível excluir: este aviso possui MO extra lançada');
            } else {
                toast.error('Erro ao excluir aviso');
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (notice: SystemNotice) => {
        if (togglingId !== null) return;
        const nextActive = !notice.isActive;
        // Resposta imediata: o card/ícone já vira enquanto a gravação acontece
        setTogglingId(notice.id);
        try {
            await toggleActive(notice.id, nextActive);
            setFlash({ id: notice.id, active: nextActive });
            window.setTimeout(() => {
                setFlash((current) => (current && current.id === notice.id ? null : current));
            }, 800);
            toast.success(nextActive ? 'Aviso ativado' : 'Aviso desativado');
        } catch (error) {
            toast.error('Erro ao alterar status');
        } finally {
            setTogglingId(null);
        }
    };

    const openEditForm = (notice: SystemNotice) => {
        setEditingNotice(notice);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingNotice(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return formatDateInBrazil(date, 'date', 'pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        return formatDateInBrazil(dateString, 'dateTime', 'pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Vigência (start/end_date) é gravada em horário de São Paulo: a comparação
    // fica no util para não depender do fuso do aparelho nem de string de data.
    const isWithinDates = (notice: SystemNotice) => isNoticeWithinVigencia(notice);

    if (!canView('app_notices') || !canSearch('app_notices')) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-background-light dark:bg-background-dark p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[40px] text-slate-400 dark:text-slate-600">lock</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">Acesso Negado</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Você não tem permissão para acessar os avisos.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark border-b border-slate-100 dark:border-slate-800">
                {/* Search */}
                <div className="mb-3">
                    <SearchInput
                        placeholder="Buscar avisos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'expired')}
                        options={[
                            { value: 'all', label: 'Todos status' },
                            { value: 'active', label: 'Ativos' },
                            { value: 'inactive', label: 'Inativos' },
                            { value: 'expired', label: 'Expirados' }
                        ]}
                        placeholder="Todos status"
                    />
                    <Select
                        value={filterCategory?.toString() || ''}
                        onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : undefined)}
                        options={[
                            { value: '', label: 'Todas categorias' },
                            ...categories.map(cat => ({ value: cat.id.toString(), label: cat.label }))
                        ]}
                        placeholder="Todas categorias"
                    />
                    <Select
                        value={filterSeverity?.toString() || ''}
                        onChange={(e) => setFilterSeverity(e.target.value ? Number(e.target.value) : undefined)}
                        options={[
                            { value: '', label: 'Todas severidades' },
                            ...severities.map(sev => ({ value: sev.id.toString(), label: sev.label }))
                        ]}
                        placeholder="Todas severidades"
                    />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{total} aviso(s)</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" overlay={false} />
                    </div>
                ) : notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum aviso</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {search ? 'Nenhum aviso encontrado para esta busca' : 'Nenhum aviso cadastrado'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notices
                            .filter((notice) => {
                                if (filterStatus === 'all') return true;
                                if (filterStatus === 'active') return notice.isActive && isWithinDates(notice);
                                if (filterStatus === 'inactive') return !notice.isActive;
                                if (filterStatus === 'expired') return isNoticeExpired(notice);
                                return true;
                            })
                            .map((notice) => {
                            // Resposta imediata ao ativar/desativar: enquanto a
                            // gravação não volta, o card já mostra o novo estado.
                            const isActiveNow = togglingId === notice.id ? !notice.isActive : notice.isActive;
                            const active = isActiveNow && isWithinDates(notice);
                            const isFlashing = flash?.id === notice.id;
                            return (
                                <div
                                    key={notice.id}
                                    className={`bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${
                                        active 
                                            ? 'border-slate-200 dark:border-slate-700' 
                                            : 'border-slate-100 dark:border-slate-800 opacity-60'
                                    } ${
                                        isFlashing
                                            ? flash.active
                                                ? 'ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/10'
                                                : 'ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                                            : ''
                                    }`}
                                >
                                    {/* Color strip based on category */}
                                    <div 
                                        className="h-1.5"
                                        style={{ backgroundColor: notice.categoryColor || '#6B7280' }}
                                    />
                                    
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                        {notice.title}
                                                    </h3>
                                                    <span
                                                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 rounded-full transition-all duration-300 ease-out ${
                                                            active ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                                                        }`}
                                                    >
                                                        Ativo
                                                    </span>
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                                        title="Visualizações"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                                                        {notice.viewCount ?? 0}
                                                    </span>
                                                </div>

                                                {/* Vigência (destaque abaixo do título) */}
                                                <p className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-500">calendar_month</span>
                                                    Vigência: {formatDate(notice.startDate)} - {formatDate(notice.endDate)}
                                                </p>

                                                {/* Janela de visualização (ticker) */}
                                                <p className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-500">visibility</span>
                                                    Visualização: {formatDate(notice.viewStartDate)} - {formatDate(notice.viewEndDate)}
                                                </p>

                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                                    {notice.message}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* Category badge */}
                                                    <span 
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                                                        style={{ 
                                                            backgroundColor: `${notice.categoryColor}20`,
                                                            color: notice.categoryColor 
                                                        }}
                                                    >
                                                        {notice.categoryLabel}
                                                    </span>
                                                    
                                                    {/* Severity badge */}
                                                    <span 
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                                                        style={{ 
                                                            backgroundColor: `${notice.severityColor}20`,
                                                            color: notice.severityColor 
                                                        }}
                                                    >
                                                        {notice.severityLabel}
                                                    </span>

                                                    {/* MO Extra: avatar da company + contador */}
                                                    {(() => {
                                                        const items = moExtraByNotice[notice.id];
                                                        if (!items || items.length === 0) return null;
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5" title="MO Extra">
                                                                <span className="material-symbols-outlined text-[15px] text-amber-500">engineering</span>
                                                                <span className="flex items-center -space-x-2">
                                                                    {items.map((item) => (
                                                                        <button
                                                                            type="button"
                                                                            key={`mo-extra-${item.companyId}`}
                                                                            className="relative shrink-0"
                                                                            title={`${item.companyName || 'Empresa'}: ${item.total} MO Extra (ver por escala)`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setExpandedMoExtraNoticeId((current) =>
                                                                                    current === notice.id ? null : notice.id
                                                                                );
                                                                            }}
                                                                        >
                                                                            {item.companyLogoUrl ? (
                                                                                <img
                                                                                    src={item.companyLogoUrl}
                                                                                    alt={item.companyName || ''}
                                                                                    className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 object-cover bg-slate-100 dark:bg-slate-700"
                                                                                />
                                                                            ) : (
                                                                                <span className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 bg-amber-500/20 flex items-center justify-center">
                                                                                    <span className="text-[13px] font-black text-black dark:text-amber-400 uppercase leading-none">
                                                                                        {(item.companyName || '?')[0]}
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                            <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-0.5 rounded-full bg-amber-500 border-[1.5px] border-white dark:border-slate-800 flex items-center justify-center">
                                                                                <span className="text-[9px] font-black text-black leading-none">{item.total}</span>
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </span>
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {canEdit('app_notices') && (
                                                    <button
                                                        onClick={() => handleToggleActive(notice)}
                                                        disabled={togglingId === notice.id}
                                                        className={`p-2 rounded-lg transition-all duration-300 ease-out ${
                                                            isActiveNow 
                                                                ? 'text-green-500 hover:bg-green-500/10' 
                                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        } ${togglingId === notice.id ? 'scale-90' : 'scale-100'}`}
                                                        title={isActiveNow ? 'Desativar' : 'Ativar'}
                                                    >
                                                        <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ease-out ${isFlashing ? 'scale-125' : 'scale-100'}`}>
                                                            {isActiveNow ? 'toggle_on' : 'toggle_off'}
                                                        </span>
                                                    </button>
                                                )}
                                                {canEdit('app_notices') && (
                                                    <button
                                                        onClick={() => openEditForm(notice)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                )}
                                                {canDelete('app_notices') && (
                                                    <button
                                                        onClick={() => handleDelete(notice.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                            {(notice.creatorName || notice.creatorNameShort) && (
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500"
                                                    title={`Criado em ${formatDate(notice.createdAt)}`}
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">person_add</span>
                                                    Criado: {notice.creatorNameShort || notice.creatorName}
                                                    {notice.createdAt && <> · {formatDateTime(notice.createdAt)}</>}
                                                </span>
                                            )}
                                            {(notice.updatedByName || notice.updatedByNameShort) && (
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500"
                                                    title={`Última alteração em ${formatDate(notice.updatedAt)}`}
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">edit_note</span>
                                                    Alterado: {notice.updatedByNameShort || notice.updatedByName}
                                                    {notice.updatedAt && <> · {formatDateTime(notice.updatedAt)}</>}
                                                </span>
                                            )}
                                        </div>

                                        {/* MO Extra: inline breakdown by shift × unit */}
                                        <MoExtraDetailSection
                                            open={expandedMoExtraNoticeId === notice.id}
                                            noticeId={notice.id}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB */}
            {canCreate('app_notices') && (
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="fixed bottom-24 right-6 z-40 flex items-center justify-center h-14 w-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-105 active:scale-95"
                    title="Novo Aviso"
                >
                    <span className="material-symbols-outlined text-28">add</span>
                </button>
            )}

            {/* Form Modal */}
            <AppNoticeForm
                isOpen={isFormOpen}
                onClose={closeForm}
                onSave={editingNotice ? handleEdit : handleCreate}
                notice={editingNotice}
            />

            {/* Delete Confirmation Modal */}
            {deletingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-500">delete</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Excluir aviso?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Inline collapsible breakdown of MO Extra for a notice card, opened by
 * clicking a company avatar badge.
 * Groups every launch by `companyId → periodId → unitId` and renders one
 * block per shift with the unit amounts and totals.
 */
const MoExtraDetailSection: React.FC<{
    open: boolean;
    noticeId: number;
}> = ({ open, noticeId }) => {
    const [loading, setLoading] = useState(false);
    const [workers, setWorkers] = useState<NoticeWorker[]>([]);
    const [periods, setPeriods] = useState<NoticeWorkerPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    useEffect(() => {
        if (!open || !noticeId) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const [periodsList, workersList] = await Promise.all([
                    dataService.getNoticeWorkerPeriods(noticeId),
                    dataService.getNoticeWorkers(noticeId, undefined, undefined),
                ]);
                if (cancelled) return;
                setPeriods(periodsList);
                setWorkers(workersList);
            } catch {
                if (!cancelled) {
                    setPeriods([]);
                    setWorkers([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [open, noticeId]);

    // companyId → periodId → unitId → amount
    const grouped = React.useMemo(() => {
        const map = new Map<number, Map<number, Map<number, number>>>();
        workers.forEach((w) => {
            const cid = Number(w.companyId);
            const pid = Number(w.workersPeriodId);
            const uid = Number(w.unitId);
            const amount = Number(w.workersExtraAmount) || 0;
            if (!cid || !pid || !uid || amount <= 0) return;
            if (!map.has(cid)) map.set(cid, new Map());
            const byPeriod = map.get(cid)!;
            if (!byPeriod.has(pid)) byPeriod.set(pid, new Map());
            byPeriod.get(pid)!.set(uid, amount);
        });
        return map;
    }, [workers]);

    const periodMap = React.useMemo(() => {
        const m = new Map<number, NoticeWorkerPeriod>();
        periods.forEach((p) => m.set(Number(p.id), p));
        return m;
    }, [periods]);

    const unitInfo = React.useMemo(() => {
        const m = new Map<number, { title: string; subtitle?: string }>();
        workers.forEach((w) => {
            const uid = Number(w.unitId);
            if (m.has(uid)) return;
            const title =
                w.unitDescriptionFull || w.unitDescription || w.unitCode || `Unidade ${uid}`;
            const subtitleParts: string[] = [];
            if (w.unitCode && w.unitCode !== title) subtitleParts.push(`Cód. ${w.unitCode}`);
            if (w.unitAddressFull) subtitleParts.push(w.unitAddressFull);
            m.set(uid, {
                title,
                subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
            });
        });
        return m;
    }, [workers]);

    const companyTotals = React.useMemo(() => {
        const m = new Map<number, number>();
        grouped.forEach((byPeriod, cid) => {
            let total = 0;
            byPeriod.forEach((byUnit) => byUnit.forEach((v) => (total += v)));
            m.set(cid, total);
        });
        return m;
    }, [grouped]);

    const totals = React.useMemo(() => {
        let workersTotal = 0;
        const unitIds = new Set<number>();
        grouped.forEach((byPeriod) => {
            byPeriod.forEach((byUnit) => {
                byUnit.forEach((amount, uid) => {
                    workersTotal += amount;
                    unitIds.add(uid);
                });
            });
        });
        return { units: unitIds.size, workers: workersTotal };
    }, [grouped]);

    const sortedPeriods = React.useMemo(
        () =>
            [...periods].sort((a, b) =>
                String(a.startDate || '').localeCompare(String(b.startDate || ''))
            ),
        [periods]
    );

    // Total MO per shift (across every company)
    const periodTotals = React.useMemo(() => {
        const m = new Map<number, number>();
        grouped.forEach((byPeriod) => {
            byPeriod.forEach((byUnit, pid) => {
                let total = 0;
                byUnit.forEach((v) => (total += v));
                m.set(pid, total);
            });
        });
        return m;
    }, [grouped]);

    // Default to the latest shift that already has launches
    useEffect(() => {
        if (!open || sortedPeriods.length === 0) return;
        setSelectedPeriodId((previous) => {
            if (previous != null && sortedPeriods.some((p) => Number(p.id) === previous)) {
                return previous;
            }
            const withData = sortedPeriods.filter((p) => periodTotals.has(Number(p.id)));
            const pool = withData.length > 0 ? withData : sortedPeriods;
            return Number(pool[pool.length - 1].id);
        });
    }, [open, sortedPeriods, periodTotals]);

    // Units / total for the selected shift
    const selectedTotals = React.useMemo(() => {
        const unitIds = new Set<number>();
        let total = 0;
        let companies = 0;
        if (selectedPeriodId != null) {
            grouped.forEach((byPeriod) => {
                const byUnit = byPeriod.get(selectedPeriodId);
                if (!byUnit) return;
                companies += 1;
                byUnit.forEach((amount, uid) => {
                    unitIds.add(uid);
                    total += amount;
                });
            });
        }
        return { units: unitIds.size, total, companies };
    }, [grouped, selectedPeriodId]);

    const selectedPeriod =
        selectedPeriodId != null ? periodMap.get(selectedPeriodId) : undefined;

    const formatShiftRange = (period?: NoticeWorkerPeriod) => {
        if (!period) return '';
        const start = formatDateInBrazil(period.startDate, 'dateTime', 'pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        if (!period.endDate) return `${start} · em aberto`;
        const end = formatDateInBrazil(period.endDate, 'dateTime', 'pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${start} → ${end}`;
    };

    return (
        <div
            className="mt-3 border-t border-slate-100 dark:border-slate-700/50 pt-3"
            hidden={!open}
        >
            {/* Section header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">
                        engineering
                    </span>
                    <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate">
                        MO Extra por escala
                    </p>
                </div>
                {!loading && grouped.size > 0 && (
                    <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-tight">
                        {totals.units} unid. · {totals.workers} MO
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <span className="animate-spin material-symbols-outlined text-[18px] text-primary">
                        progress_activity
                    </span>
                    <span>Carregando lançamentos...</span>
                </div>
            ) : sortedPeriods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-5 text-center">
                    <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600">
                        calendar_month
                    </span>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                        Nenhuma escala criada para este aviso.
                    </p>
                </div>
            ) : (
                <>
                    {/* Shift tags (horizontal scroll, same as the MO Extra form) */}
                    <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar w-full max-w-full min-w-0 pb-1 mb-2 scroll-smooth">
                        {sortedPeriods.map((period) => {
                            const pid = Number(period.id);
                            const isSelected = pid === selectedPeriodId;
                            const total = periodTotals.get(pid) || 0;
                            return (
                                <button
                                    key={pid}
                                    type="button"
                                    onClick={() => setSelectedPeriodId(pid)}
                                    className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight border transition-colors ${
                                        isSelected
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                    title={formatShiftRange(period)}
                                >
                                    <span className="material-symbols-outlined text-[13px]">
                                        schedule
                                    </span>
                                    <span>{period.label}</span>
                                    <span
                                        className={`rounded px-1 py-0.5 text-[10px] font-black leading-none ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-primary/10 text-primary'
                                        }`}
                                    >
                                        {total}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary tiles for the selected shift */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                            <p className="text-[10px] font-black text-primary uppercase tracking-tight truncate">
                                Unidades{selectedPeriod ? ` · ${selectedPeriod.label}` : ''}
                            </p>
                            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                {selectedTotals.units}
                            </p>
                        </div>
                        <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                            <p className="text-[10px] font-black text-primary uppercase tracking-tight truncate">
                                MO Extra{selectedPeriod ? ` · ${selectedPeriod.label}` : ''}
                            </p>
                            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                {selectedTotals.total}
                            </p>
                        </div>
                    </div>

                    {/* Companies + units of the selected shift */}
                    {selectedTotals.companies === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-5 text-center">
                            <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600">
                                groups
                            </span>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                Nenhuma unidade lançada nesta escala.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Array.from(grouped.entries())
                                .filter(
                                    ([, byPeriod]) =>
                                        selectedPeriodId != null && byPeriod.has(selectedPeriodId)
                                )
                                .map(([cid, byPeriod]) => {
                                    const company = workers.find(
                                        (w) => Number(w.companyId) === cid
                                    );
                                    const byUnit = byPeriod.get(selectedPeriodId as number)!;
                                    const totalCompany = Array.from(byUnit.values()).reduce(
                                        (acc, v) => acc + v,
                                        0
                                    );
                                    return (
                                        <div
                                            key={cid}
                                            className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-800/20"
                                        >
                                            {/* Company header */}
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800">
                                                {company?.companyLogoUrl ? (
                                                    <img
                                                        src={company.companyLogoUrl}
                                                        alt={company.companyName || ''}
                                                        className="w-8 h-8 rounded-full object-cover bg-white border border-slate-100 dark:border-slate-700"
                                                    />
                                                ) : (
                                                    <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-black text-black dark:text-amber-400 uppercase">
                                                        {(company?.companyName || '?')[0]}
                                                    </span>
                                                )}
                                                <p className="flex-1 min-w-0 text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {company?.companyName || `Empresa ${cid}`}
                                                </p>
                                                <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight">
                                                    {totalCompany} MO
                                                </span>
                                            </div>

                                            {/* Units */}
                                            <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {Array.from(byUnit.entries()).map(
                                                    ([uid, amount]) => {
                                                        const info = unitInfo.get(uid);
                                                        return (
                                                            <div
                                                                key={`${cid}-${uid}`}
                                                                className="bg-white dark:bg-card-dark rounded-[12px] border border-slate-100 dark:border-slate-800 shadow-sm px-3 py-2 flex items-start gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                                                                    apartment
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p
                                                                        className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2"
                                                                        title={info?.title || `Unidade ${uid}`}
                                                                    >
                                                                        {info?.title || `Unidade ${uid}`}
                                                                    </p>
                                                                    {info?.subtitle && (
                                                                        <p
                                                                            className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-2"
                                                                            title={info.subtitle}
                                                                        >
                                                                            {info.subtitle}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <span className="shrink-0 min-w-[24px] text-center rounded-lg bg-amber-500/15 px-1.5 py-0.5 text-xs font-black text-amber-700 dark:text-amber-300">
                                                                    {amount}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
