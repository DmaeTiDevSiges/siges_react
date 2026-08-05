import React, { useState, useEffect, useCallback } from 'react';
import { AppTip, CreateAppTipInput, AppTipFilters, APP_TIP_SCREEN_TARGETS, APP_TIP_TARGET_MODES, AppTipTargetMode } from '../../../types';
import { dataService } from '../../../services/dataService';
import { AppTipForm } from '../../../components/AppTipForm';
import { Select } from '../../../components/ui/Select';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { toast } from 'sonner';

interface AppTipsListProps {
    onBack?: () => void;
}

export const AppTipsList: React.FC<AppTipsListProps> = ({ onBack }) => {
    const [tips, setTips] = useState<AppTip[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterScreen, setFilterScreen] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterTargetMode, setFilterTargetMode] = useState<string>('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<AppTip | null>(null);
    const [deletingTip, setDeletingTip] = useState<AppTip | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const fetchTips = useCallback(async () => {
        setLoading(true);
        try {
            const filters: AppTipFilters = {
                search: search || undefined,
                screenTarget: filterScreen || undefined,
                isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
                targetMode: (filterTargetMode as AppTipTargetMode) || undefined,
                page,
                pageSize,
            };
            const result = await dataService.listAppTips(filters);
            setTips(result.tips);
            setTotal(result.total);
        } catch (err) {
            console.error('Error fetching tips:', err);
            toast.error('Erro ao carregar dicas');
        } finally {
            setLoading(false);
        }
    }, [search, filterScreen, filterStatus, filterTargetMode, page]);

    useEffect(() => {
        fetchTips();
    }, [fetchTips]);

    const handleCreate = async (input: CreateAppTipInput) => {
        try {
            await dataService.createAppTip(input);
            toast.success('Dica criada com sucesso!');
            setIsFormOpen(false);
            fetchTips();
        } catch {
            toast.error('Erro ao criar dica');
        }
    };

    const handleEdit = async (input: CreateAppTipInput) => {
        if (!editingTip) return;
        try {
            await dataService.updateAppTip(String(editingTip.id), input);
            toast.success('Dica atualizada com sucesso!');
            setIsFormOpen(false);
            setEditingTip(null);
            fetchTips();
        } catch {
            toast.error('Erro ao atualizar dica');
        }
    };

    const handleDelete = async () => {
        if (!deletingTip) return;
        try {
            await dataService.deleteAppTip(String(deletingTip.id));
            toast.success('Dica excluída com sucesso!');
            setDeletingTip(null);
            fetchTips();
        } catch {
            toast.error('Erro ao excluir dica');
        }
    };

    const handleToggleActive = async (tip: AppTip) => {
        try {
            await dataService.toggleAppTipActive(String(tip.id), !tip.isActive);
            toast.success(tip.isActive ? 'Dica desativada' : 'Dica ativada');
            fetchTips();
        } catch {
            toast.error('Erro ao alterar status');
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    const getTargetingBadges = (tip: AppTip) => {
        if (tip.targetMode === 'all') return null;
        const badges: string[] = [];
        if (tip.companyIds && tip.companyIds.length > 0) {
            badges.push(`${tip.companyIds.length} empresa(s)`);
        }
        if (tip.departmentIds && tip.departmentIds.length > 0) {
            badges.push(`${tip.departmentIds.length} depto(s)`);
        }
        if (tip.profileIds && tip.profileIds.length > 0) {
            badges.push(`${tip.profileIds.length} perfil(is)`);
        }
        return badges;
    };

    return (
        <>
            <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar dicas..."
                        />
                    </div>
                    <Select
                        value={filterScreen}
                        onChange={(e) => { setFilterScreen(e.target.value); setPage(0); }}
                        options={[
                            { value: '', label: 'Todas as telas' },
                            ...APP_TIP_SCREEN_TARGETS.filter(t => t.key !== '*').map(t => ({ value: t.key, label: t.label }))
                        ]}
                        placeholder="Todas as telas"
                    />
                    <Select
                        value={filterTargetMode}
                        onChange={(e) => { setFilterTargetMode(e.target.value); setPage(0); }}
                        options={[
                            { value: '', label: 'Todos os públicos' },
                            ...APP_TIP_TARGET_MODES.map(t => ({ value: t.key, label: t.label }))
                        ]}
                        placeholder="Todos os públicos"
                    />
                    <Select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value as any); setPage(0); }}
                        options={[
                            { value: 'all', label: 'Todas' },
                            { value: 'active', label: 'Ativas' },
                            { value: 'inactive', label: 'Inativas' }
                        ]}
                        placeholder="Todas"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" />
                    </div>
                ) : tips.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">tips_and_updates</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma dica encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tips.map((tip) => {
                            const targetingBadges = getTargetingBadges(tip);
                            return (
                                <div
                                    key={tip.id}
                                    className={`bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 p-4 transition-opacity ${!tip.isActive ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary text-xl">{tip.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{tip.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    tip.isActive
                                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {tip.isActive ? 'Ativa' : 'Inativa'}
                                                </span>
                                                {tip.targetMode === 'filtered' && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                                        Filtrada
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{tip.body}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold flex-wrap">
                                                <span>{APP_TIP_SCREEN_TARGETS.find(t => t.key === tip.screenTarget)?.label || tip.screenTarget}</span>
                                                <span>Prioridade: {tip.priority}</span>
                                            </div>
                                            {targetingBadges && targetingBadges.length > 0 && (
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {targetingBadges.map((badge, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                            <span className="material-symbols-outlined text-[10px]">group</span>
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleToggleActive(tip)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                title={tip.isActive ? 'Desativar' : 'Ativar'}
                                            >
                                                <span className="material-symbols-outlined text-lg text-slate-400">
                                                    {tip.isActive ? 'visibility' : 'visibility_off'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => { setEditingTip(tip); setIsFormOpen(true); }}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg text-slate-400">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setDeletingTip(tip)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
            </div>

            {/* FAB */}
            <button
                onClick={() => { setEditingTip(null); setIsFormOpen(true); }}
                className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center z-50"
            >
                <span className="material-symbols-outlined text-2xl">add</span>
            </button>

            <AppTipForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingTip(null); }}
                onSave={editingTip ? handleEdit : handleCreate}
                initialTip={editingTip}
            />

            <Modal
                isOpen={!!deletingTip}
                onClose={() => setDeletingTip(null)}
                onConfirm={handleDelete}
                title="Excluir Dica"
                message={`Deseja realmente excluir a dica "${deletingTip?.title}"?`}
                type="warning"
                confirmLabel="Excluir"
            />
        </>
    );
};
