/**
 * OrderVisitAssetActivities — seleção das atividades realizadas no ativo.
 *
 * Layout por largura do próprio conteúdo (container queries):
 *  - celular: uma coluna;
 *  - desktop: 2 a 3 colunas de cartões.
 * Nos dois: selecionadas no topo (chips), abas Todas/Selecionadas, busca sem
 * acento e barra fixa no rodapé com o total e o botão de continuar.
 * A seleção é marcada na hora e desfeita se o servidor recusar.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../contexts/AuthContext';
import { Activity, OrderVisitAssetView } from '../../../types';
import { Loading } from '../../../components/ui/Loading';
import { SearchInput } from '../../../components/ui/SearchInput';
import { OrderVisitAssetCardDetail } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail';

interface OrderVisitAssetActivitiesProps {
    ovAssetId: string;
    orderTypeId: string;
    onBack: () => void;
}

type Tab = 'all' | 'selected';

/** Minúsculas e sem acento: "Configuração" encontra "CONFIGURACAO". */
const normalize = (value?: string) =>
    (value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const OrderVisitAssetActivities: React.FC<OrderVisitAssetActivitiesProps> = ({ ovAssetId, orderTypeId, onBack }) => {
    const { currentUser: authUser } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [asset, setAsset] = useState<OrderVisitAssetView | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<Tab>('all');

    useEffect(() => {
        if (!ovAssetId || !orderTypeId) return;
        let active = true;

        const loadData = async () => {
            try {
                setLoading(true);
                const [allActivities, currentSelected, user] = await Promise.all([
                    dataService.getActivitiesByOrderType(orderTypeId),
                    dataService.getOrderVisitAssetActivities(ovAssetId),
                    dataService.getCurrentUser().catch(() => null),
                ]);
                if (!active) return;
                setActivities(
                    [...allActivities].sort((a, b) => (a.description || '').localeCompare(b.description || '', 'pt-BR'))
                );
                // Só atividades avulsas: itens da checklist do plano (maintenancePlanId)
                // ficam de fora, igual ao card "Atividades realizadas" do relatório.
                setSelectedIds(currentSelected
                    .filter(a => !a.maintenancePlanId || a.maintenancePlanId === '0')
                    .map(a => a.activityId));
                setUserId(user?.id || authUser?.id || '');
            } catch (error) {
                console.error('Error loading activities:', error);
                toast.error('Erro ao carregar atividades');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadData();
        // Cabeçalho do ativo: só contexto, não bloqueia a tela
        dataService.getOrderVisitAssetById(ovAssetId)
            .then(data => { if (active) setAsset(data); })
            .catch(() => undefined);

        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ovAssetId, orderTypeId]);

    const byId = useMemo(() => new Map(activities.map(a => [a.id, a])), [activities]);
    const selectedActivities = selectedIds.map(id => byId.get(id)).filter(Boolean) as Activity[];

    const search = normalize(searchTerm);
    const visibleActivities = activities.filter(activity => {
        if (tab === 'selected' && !selectedIds.includes(activity.id)) return false;
        if (!search) return true;
        return normalize(activity.description).includes(search) || normalize(activity.code).includes(search);
    });

    const handleToggle = async (activityId: string) => {
        if (pendingIds.includes(activityId)) return;
        const uid = userId || authUser?.id || '';
        if (!uid) {
            toast.error('Não foi possível identificar o usuário. Abra a tela novamente.');
            return;
        }

        const willSelect = !selectedIds.includes(activityId);
        const apply = (select: boolean) =>
            setSelectedIds(prev => (select ? [...prev.filter(id => id !== activityId), activityId] : prev.filter(id => id !== activityId)));

        apply(willSelect);
        setPendingIds(prev => [...prev, activityId]);
        try {
            await dataService.toggleOrderVisitAssetActivity(ovAssetId, activityId, uid, willSelect);
        } catch (error) {
            console.error('Error toggling activity:', error);
            apply(!willSelect);
            toast.error('Erro ao atualizar atividade');
        } finally {
            setPendingIds(prev => prev.filter(id => id !== activityId));
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    const isSaving = pendingIds.length > 0;
    const count = selectedActivities.length;

    return (
        <div className="@container/page min-h-full flex flex-col">
            <div className="flex-1 w-full max-w-md @4xl/page:max-w-6xl mx-auto py-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] space-y-5 animate-in fade-in duration-300">

                <div className="space-y-5 @4xl/page:space-y-0 @4xl/page:grid @4xl/page:grid-cols-[340px_minmax(0,1fr)] @4xl/page:gap-6 @4xl/page:items-start">
                {/* Ativo associado (no desktop: coluna esquerda fixa) */}
                <div className="@4xl/page:sticky @4xl/page:top-4">
                    {asset && <OrderVisitAssetCardDetail asset={asset} />}
                </div>

                <div className="@container min-w-0 space-y-5">
                {/* Busca + abas: lado a lado no desktop */}
                <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center">
                    <SearchInput
                        containerClassName="flex-1"
                        inputMode="search"
                        aria-label="Pesquisar atividade"
                        placeholder="Pesquisar por nome ou código"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm('')}
                        className="text-base"
                    />

                    <div role="tablist" aria-label="Filtro" className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 @2xl:w-80">
                        {([['all', `Todas (${activities.length})`], ['selected', `Selecionadas (${count})`]] as [Tab, string][]).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => setTab(key)}
                                className={`h-10 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${tab === key
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selecionadas (atalho para conferir e remover) */}
                {tab === 'all' && selectedActivities.length > 0 && (
                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 p-3">
                        <p className="px-1 pb-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            Selecionadas
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedActivities.map(activity => (
                                <button
                                    key={activity.id}
                                    type="button"
                                    onClick={() => handleToggle(activity.id)}
                                    disabled={pendingIds.includes(activity.id)}
                                    aria-label={`Remover ${activity.description}`}
                                    className="inline-flex min-h-[36px] max-w-full items-center gap-1 rounded-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 pl-3 pr-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 disabled:opacity-60"
                                >
                                    <span className="truncate">{activity.description}</span>
                                    <span className="material-symbols-outlined text-base shrink-0">close</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista */}
                {activities.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="text-sm font-bold text-slate-500">Nenhuma atividade configurada para este tipo de OS.</p>
                    </div>
                ) : visibleActivities.length === 0 ? (
                    <div className="p-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                            {tab === 'selected' && !search
                                ? 'Nenhuma atividade selecionada ainda.'
                                : <>Nada encontrado para "<span className="text-indigo-500">{searchTerm}</span>".</>}
                        </p>
                        {(search || tab === 'selected') && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); setTab('all'); }}
                                className="mt-3 min-h-[40px] px-4 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                            >
                                Ver todas
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2 @xl:gap-3 @5xl:grid-cols-3">
                        {visibleActivities.map(activity => {
                            const isSelected = selectedIds.includes(activity.id);
                            const isPending = pendingIds.includes(activity.id);
                            return (
                                <button
                                    key={activity.id}
                                    type="button"
                                    onClick={() => handleToggle(activity.id)}
                                    aria-pressed={isSelected}
                                    className={`w-full min-h-[56px] flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${isSelected
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                                        }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-slate-300 dark:border-slate-600 text-transparent'
                                            }`}
                                    >
                                        {isPending
                                            ? <span className="material-symbols-outlined text-base animate-spin text-current">progress_activity</span>
                                            : <span className="material-symbols-outlined text-base font-bold">check</span>}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        {activity.code && (
                                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {activity.code}
                                            </span>
                                        )}
                                        <span className={`block text-sm font-bold uppercase leading-snug ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {activity.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                </div>
                </div>
            </div>

            {/* Barra fixa: voltar + total (celular e desktop) */}
            <div className="sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                <div className="w-full max-w-md @4xl/page:max-w-6xl mx-auto flex flex-row-reverse items-center gap-3">
                    <div className="min-w-0 flex-1 text-right">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {count === 0 ? 'Nenhuma selecionada' : `${count} ${count === 1 ? 'selecionada' : 'selecionadas'}`}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                            <span className={`material-symbols-outlined text-sm ${isSaving ? 'animate-spin' : ''}`}>
                                {isSaving ? 'progress_activity' : 'cloud_done'}
                            </span>
                            {isSaving ? 'Salvando...' : 'Salvo automaticamente'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="shrink-0 h-12 px-5 @4xl/page:px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
};
