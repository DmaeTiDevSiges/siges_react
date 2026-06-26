import React, { useState, useEffect, useCallback } from 'react';
import { UserTool } from '../../types';
import { toolsService } from '../../services/toolsService';
import { toast } from 'sonner';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';

export const ResponsibleToolsView: React.FC = () => {
    const [userTools, setUserTools] = useState<UserTool[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const loadUserTools = useCallback(async () => {
        setLoading(true);
        try {
            const data = await toolsService.getUserTools();
            setUserTools(data.filter(ut => ut.status === 'USO'));
        } catch {
            toast.error('Erro ao carregar ferramentas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUserTools(); }, [loadUserTools]);

    const grouped = userTools.reduce<Record<string, { userName: string; userAvatar?: string; items: UserTool[] }>>((acc, ut) => {
        const key = String(ut.user_id);
        if (!acc[key]) acc[key] = { userName: ut.user_name || `Usuário #${ut.user_id}`, userAvatar: ut.user_avatar, items: [] };
        acc[key].items.push(ut);
        return acc;
    }, {});

    const filteredGroups = Object.entries(grouped).filter(([, { userName, items }]) =>
        userName.toLowerCase().includes(search.toLowerCase()) ||
        items.some(i => `${i.tool_brand} ${i.tool_model} ${i.tool_serial}`.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center p-4 gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                    <SearchInput value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} placeholder="Buscar por responsável ou ferramenta..." />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && <Loading />}
                {!loading && filteredGroups.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">manage_accounts</span>
                        <p className="text-sm">Nenhuma ferramenta vinculada encontrada</p>
                    </div>
                )}
                {!loading && filteredGroups.map(([userId, { userName, userAvatar, items }]) => (
                    <div key={userId} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                        {/* User Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800">
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-base text-primary">person</span>
                                </div>
                            )}
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{userName}</p>
                            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{items.length} ferramenta(s)</span>
                        </div>
                        {/* Tool Items */}
                        {items.map(ut => (
                            <div key={ut.id} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary text-sm truncate">{ut.tool_code || '—'}</p>
                                    {ut.tool_material_code && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                            <span className="font-semibold text-slate-500 dark:text-slate-400">{ut.tool_material_code}</span>
                                            {ut.tool_material_description && <span> — {ut.tool_material_description}</span>}
                                            {ut.tool_material_unit && <span className="ml-1 text-slate-400">({ut.tool_material_unit})</span>}
                                        </p>
                                    )}
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                        {ut.tool_brand} {ut.tool_model} {ut.tool_serial}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
                                    {new Date(ut.date_start).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
