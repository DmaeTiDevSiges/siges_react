import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAppNoticesAdmin } from '../../hooks/useAppNotices';
import { AppNoticeForm } from '../../components/appNotices/AppNoticeForm';
import { SystemNotice, CreateSystemNoticeInput, NoticeWorkersSummaryItem } from '../../types';
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

    useEffect(() => {
        loadCategoriesAndSeverities();
    }, []);

    // Total de MO extra por company para os avisos listados (1 query)
    useEffect(() => {
        let cancelled = false;
        const ids = notices.map((notice) => notice.id);
        if (ids.length === 0) {
            setMoExtraByNotice({});
            return;
        }
        dataService
            .getNoticeWorkersSummaryByNotices(ids)
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
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isWithinDates = (notice: SystemNotice) => {
        const nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
        const now = new Date(nowStr);
        const start = new Date(notice.startDate);
        const end = new Date(notice.endDate);
        return start <= now && end >= now;
    };

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
                                const nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
                                const now = new Date(nowStr);
                                const start = new Date(notice.startDate);
                                const end = new Date(notice.endDate);
                                const isActive = notice.isActive && start <= now && end >= now;
                                const isExpired = end < now;
                                
                                if (filterStatus === 'active') return isActive;
                                if (filterStatus === 'inactive') return !notice.isActive;
                                if (filterStatus === 'expired') return isExpired;
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
                                                                        <span
                                                                            key={`mo-extra-${item.companyId}`}
                                                                            className="relative shrink-0"
                                                                            title={`${item.companyName || 'Empresa'}: ${item.total} MO Extra`}
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
                                                                        </span>
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
