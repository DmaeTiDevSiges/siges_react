import React, { useEffect, useState } from 'react';
import { dataService } from '../../../services/dataService';
import { Activity, OrderVisitAssetActivity, User } from '../../../types';
import { toast } from 'sonner';
import { Loading } from '../../../components/ui/Loading';


interface OrderVisitAssetActivitiesProps {
    ovAssetId: string;
    orderTypeId: string;
    onBack: () => void;
}

export const OrderVisitAssetActivities: React.FC<OrderVisitAssetActivitiesProps> = ({ ovAssetId, orderTypeId, onBack }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [allActivities, currentSelected, user] = await Promise.all([
                    dataService.getActivitiesByOrderType(orderTypeId),
                    dataService.getOrderVisitAssetActivities(ovAssetId),
                    dataService.getCurrentUser()
                ]);

                setActivities(allActivities);
                setSelectedActivityIds(currentSelected.map(a => a.activityId));
                setCurrentUser(user);
            } catch (error) {
                console.error('Error loading activities:', error);
                toast.error('Erro ao carregar atividades');
            } finally {
                setLoading(false);
            }
        };

        if (ovAssetId && orderTypeId) {
            loadData();
        }
    }, [ovAssetId, orderTypeId]);

    const filteredActivities = (activities || []).filter(activity => {
        if (!activity) return false;
        const desc = activity.description?.toLowerCase() || '';
        const code = activity.code?.toLowerCase() || '';
        const search = (searchTerm || '').toLowerCase();
        return desc.includes(search) || code.includes(search);
    });

    const handleToggleActivity = async (activityId: string) => {
        if (!currentUser) return;

        const isSelected = selectedActivityIds.includes(activityId);
        setSaving(activityId);

        try {
            await dataService.toggleOrderVisitAssetActivity(ovAssetId, activityId, currentUser.id, !isSelected);

            if (isSelected) {
                setSelectedActivityIds(prev => prev.filter(id => id !== activityId));
                toast.success('Atividade removida');
            } else {
                setSelectedActivityIds(prev => [...prev, activityId]);
                toast.success('Atividade adicionada');
            }
        } catch (error) {
            console.error('Error toggling activity:', error);
            toast.error('Erro ao atualizar atividade');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined text-xl">checklist</span>
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        Intervenções Disponíveis
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Selecione as ações realizadas
                    </p>
                </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative group focus-within:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-lg group-focus-within:text-indigo-500 transition-colors">search</span>
                </div>
                <input
                    type="text"
                    placeholder="Pesquisar intervenção por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>

            {activities.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Nenhuma atividade configurada <br /> para este tipo de OS.
                    </p>
                </div>
            ) : filteredActivities.length === 0 ? (
                <div className="p-12 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        Nenhuma intervenção encontrada <br /> para "<span className="text-indigo-500">{searchTerm}</span>"
                    </p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline hover:text-indigo-600 transition-all"
                    >
                        Limpar Filtro
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredActivities.map(activity => {
                        const isSelected = selectedActivityIds.includes(activity.id);
                        const isSaving = saving === activity.id;

                        return (
                            <button
                                key={activity.id}
                                onClick={() => handleToggleActivity(activity.id)}
                                disabled={!!saving}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    } hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70`}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        {activity.code}
                                    </span>
                                    <span className={`text-xs font-black uppercase tracking-wide transition-colors mt-0.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                                        }`}>
                                        {activity.description}
                                    </span>
                                </div>



                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                    {isSaving ? (
                                        <Loading size="xs" />
                                    ) : (
                                        <span className="material-symbols-outlined text-sm font-bold">
                                            {isSelected ? 'done' : 'add'}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Botão de Conclusão / Voltar */}
            <div className="pt-4 pb-12">
                <button
                    onClick={onBack}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-lg group-hover:animate-pulse">description</span>
                    CONTINUAR PREENCHIMENTO DO RELATÓRIO
                </button>
                <p className="text-[9px] text-slate-400 font-bold text-center mt-3 uppercase tracking-tighter">
                    As alterações são salvas automaticamente ao selecionar
                </p>
            </div>
        </div>
    );
};

