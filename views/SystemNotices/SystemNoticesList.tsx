import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useSystemNoticesAdmin } from '../../hooks/useSystemNotices';
import { SystemNoticeForm } from '../../components/SystemNoticeForm';
import { SystemNotice, CreateSystemNoticeInput, NoticeCategory, NoticeSeverity, DASHBOARD_OPTIONS } from '../../types';
import { systemNoticesService } from '../../services/core/systemNoticesService';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { toast } from 'sonner';

interface SystemNoticesListProps {
    onBack?: () => void;
}

export const SystemNoticesList: React.FC<SystemNoticesListProps> = ({ onBack }) => {
    const { canCreate, canEdit, canDelete } = usePermissions();
    const { notices, total, loading, fetchNotices, createNotice, updateNotice, deleteNotice, toggleActive } = useSystemNoticesAdmin();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<SystemNotice | null>(null);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<{ id: number; code: string; label: string; color: string }[]>([]);
    const [severities, setSeverities] = useState<{ id: number; code: string; label: string; color: string }[]>([]);
    const [filterCategory, setFilterCategory] = useState<number | undefined>();
    const [filterSeverity, setFilterSeverity] = useState<number | undefined>();
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadCategoriesAndSeverities();
    }, []);

    useEffect(() => {
        fetchNotices({
            search,
            categoryId: filterCategory,
            severityId: filterSeverity,
        });
    }, [search, filterCategory, filterSeverity, filterStatus]);

    const loadCategoriesAndSeverities = async () => {
        const [cats, sevs] = await Promise.all([
            systemNoticesService.getCategories(),
            systemNoticesService.getSeverities(),
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
        setDeletingId(id);
    };

    const confirmDelete = async () => {
        if (deletingId === null) return;
        try {
            await deleteNotice(deletingId);
            toast.success('Aviso excluído com sucesso!');
        } catch (error) {
            toast.error('Erro ao excluir aviso');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (notice: SystemNotice) => {
        try {
            await toggleActive(notice.id, !notice.isActive);
            toast.success(notice.isActive ? 'Aviso desativado' : 'Aviso ativado');
        } catch (error) {
            toast.error('Erro ao alterar status');
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

    const isNoticeActive = (notice: SystemNotice) => {
        const nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
        const now = new Date(nowStr);
        const start = new Date(notice.startDate);
        const end = new Date(notice.endDate);
        return notice.isActive && start <= now && end >= now;
    };

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
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'expired')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                        <option value="all">Todos status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                        <option value="expired">Expirados</option>
                    </select>
                    <select
                        value={filterCategory || ''}
                        onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : undefined)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                        <option value="">Todas categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterSeverity || ''}
                        onChange={(e) => setFilterSeverity(e.target.value ? Number(e.target.value) : undefined)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                        <option value="">Todas severidades</option>
                        {severities.map(sev => (
                            <option key={sev.id} value={sev.id}>{sev.label}</option>
                        ))}
                    </select>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{total} aviso(s)</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" />
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
                            const active = isNoticeActive(notice);
                            return (
                                <div
                                    key={notice.id}
                                    className={`bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden transition-all ${
                                        active 
                                            ? 'border-slate-200 dark:border-slate-700' 
                                            : 'border-slate-100 dark:border-slate-800 opacity-60'
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
                                                    {active && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                                                            Ativo
                                                        </span>
                                                    )}
                                                </div>
                                                
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

                                                    {/* Dashboard badges */}
                                                    {notice.dashboards?.map((d) => {
                                                        const opt = DASHBOARD_OPTIONS.find((o) => o.key === d);
                                                        return (
                                                            <span key={d} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                                {opt?.label || d}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {canEdit('system_notices') && (
                                                    <button
                                                        onClick={() => handleToggleActive(notice)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            notice.isActive 
                                                                ? 'text-green-500 hover:bg-green-500/10' 
                                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        }`}
                                                        title={notice.isActive ? 'Desativar' : 'Ativar'}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {notice.isActive ? 'toggle_on' : 'toggle_off'}
                                                        </span>
                                                    </button>
                                                )}
                                                {canEdit('system_notices') && (
                                                    <button
                                                        onClick={() => openEditForm(notice)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                )}
                                                {canDelete('system_notices') && (
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
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                {formatDate(notice.startDate)} - {formatDate(notice.endDate)}
                                            </span>
                                            {notice.creatorName && (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    Por: {notice.creatorName}
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
            {canCreate('system_notices') && (
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="fixed bottom-24 right-6 z-40 flex items-center justify-center h-14 w-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-105 active:scale-95"
                    title="Novo Aviso"
                >
                    <span className="material-symbols-outlined text-28">add</span>
                </button>
            )}

            {/* Form Modal */}
            <SystemNoticeForm
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
