import React, { useState, useEffect, useCallback } from 'react';
import { UserTool, ToolMovement } from '../../types';
import { toolsService } from '../../services/toolsService';
import { toast } from 'sonner';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { IconButton } from '../../components/ui/IconButton';
import { ReturnToolForm } from '../../components/tools/ReturnToolForm';
import { TransferToolForm } from '../../components/tools/TransferToolForm';
import { AssignToolForm } from '../../components/tools/AssignToolForm';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ResponsibleToolsPDFButton } from '../../components/reports/ResponsibleToolsPDFButton';

interface UserToolsViewProps {
    companyId: string;
}

type ActionMode = null | 'assign' | { action: 'return' | 'transfer'; userTool: UserTool };

interface ListItem {
    id: string;
    type: 'USO' | 'BAIXA';
    user_id: number;
    user_name: string;
    user_avatar?: string;
    tool_id: number;
    tool_code?: string;
    tool_brand?: string;
    tool_model?: string;
    tool_serial?: string;
    tool_material_code?: string;
    tool_material_description?: string;
    tool_material_unit?: string;
    date: string;
    userTool?: UserTool;
}

const movTypeConfig: Record<ToolMovement['movement_type'], { label: string; icon: string; color: string }> = {
    INCLUSAO:     { label: 'Inclusão',     icon: 'add_circle',    color: 'text-emerald-500' },
    TRANSFERENCIA:{ label: 'Transferência',icon: 'swap_horiz',    color: 'text-sky-500' },
    BAIXA:        { label: 'Baixa',        icon: 'remove_circle', color: 'text-rose-500' },
};

export const UserToolsView: React.FC<UserToolsViewProps> = ({ companyId }) => {
    const { canView } = usePermissions();
    const canMovements = canView('tools_movements');
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionMode, setActionMode] = useState<ActionMode>(null);
    const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; toolId?: number; toolName?: string; toolCode?: string; toolMaterial?: string; toolBrand?: string; toolModel?: string }>({ isOpen: false });
    const [movements, setMovements] = useState<ToolMovement[]>([]);
    const [movLoading, setMovLoading] = useState(false);

    const loadUserTools = useCallback(async () => {
        setLoading(true);
        try {
            const [toolsData, movData] = await Promise.all([
                toolsService.getUserTools(),
                toolsService.getToolMovements()
            ]);

            const usoItems: ListItem[] = toolsData
                .filter(ut => ut.status === 'USO')
                .map(ut => ({
                    id: `uso-${ut.id}`,
                    type: 'USO' as const,
                    user_id: ut.user_id,
                    user_name: ut.user_name || `Usuário #${ut.user_id}`,
                    user_avatar: ut.user_avatar,
                    tool_id: ut.tool_id,
                    tool_code: ut.tool_code,
                    tool_brand: ut.tool_brand,
                    tool_model: ut.tool_model,
                    tool_serial: ut.tool_serial,
                    tool_material_code: ut.tool_material_code,
                    tool_material_description: ut.tool_material_description,
                    tool_material_unit: ut.tool_material_unit,
                    date: ut.date_start,
                    userTool: ut,
                }));

            const baixaItems: ListItem[] = movData
                .filter(m => m.movement_type === 'BAIXA')
                .map(m => ({
                    id: `baixa-${m.id}`,
                    type: 'BAIXA' as const,
                    user_id: m.from_user_id || 0,
                    user_name: m.from_user_name || `Usuário #${m.from_user_id}`,
                    user_avatar: m.from_user_avatar,
                    tool_id: m.tool_id,
                    tool_code: m.tool_code,
                    tool_brand: m.tool_brand,
                    tool_model: m.tool_model,
                    tool_serial: m.tool_serial,
                    tool_material_code: m.tool_material_code,
                    tool_material_description: m.tool_material_description,
                    tool_material_unit: m.tool_material_unit,
                    date: m.created_at,
                }));

            setListItems([...usoItems, ...baixaItems]);
        } catch {
            toast.error('Erro ao carregar movimentações');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUserTools(); }, [loadUserTools]);

    const openHistory = async (item: ListItem) => {
        setHistoryModal({
            isOpen: true,
            toolId: item.tool_id,
            toolName: `${item.tool_brand} ${item.tool_model}`,
            toolCode: item.tool_code,
            toolMaterial: item.tool_material_code && item.tool_material_description
                ? `${item.tool_material_code} — ${item.tool_material_description}${item.tool_material_unit ? ` (${item.tool_material_unit})` : ''}`
                : undefined,
            toolBrand: item.tool_brand,
            toolModel: item.tool_model,
        });
        setMovLoading(true);
        try {
            const data = await toolsService.getToolMovements(item.tool_id);
            setMovements(data);
        } catch {
            toast.error('Erro ao carregar histórico');
        } finally {
            setMovLoading(false);
        }
    };

    const handleActionSave = () => {
        setActionMode(null);
        loadUserTools();
        toast.success('Operação realizada com sucesso!');
    };

    if (actionMode === 'assign') {
        return (
            <div className="flex flex-col h-full">
                <AssignToolForm
                    companyId={companyId}
                    onSave={handleActionSave}
                    onCancel={() => setActionMode(null)}
                />
            </div>
        );
    }

    if (actionMode && typeof actionMode === 'object') {
        return (
            <div className="flex flex-col h-full">
                {actionMode.action === 'return' ? (
                    <ReturnToolForm
                        userTool={actionMode.userTool}
                        onSave={handleActionSave}
                        onCancel={() => setActionMode(null)}
                    />
                ) : (
                    <TransferToolForm
                        userTool={actionMode.userTool}
                        companyId={companyId}
                        onSave={handleActionSave}
                        onCancel={() => setActionMode(null)}
                    />
                )}
            </div>
        );
    }

    const grouped = listItems.reduce<Record<string, { userName: string; userAvatar?: string; items: ListItem[] }>>((acc, item) => {
        const key = String(item.user_id);
        if (!acc[key]) acc[key] = { userName: item.user_name, userAvatar: item.user_avatar, items: [] };
        if (!acc[key].userAvatar && item.user_avatar) acc[key].userAvatar = item.user_avatar;
        acc[key].items.push(item);
        return acc;
    }, {});

    Object.values(grouped).forEach(g => {
        g.items.sort((a, b) => (a.tool_material_description || '').localeCompare(b.tool_material_description || '', 'pt-BR'));
    });

    const matchItem = (i: ListItem, term: string) =>
        (i.tool_code || '').toLowerCase().includes(term) ||
        (i.tool_brand || '').toLowerCase().includes(term) ||
        (i.tool_model || '').toLowerCase().includes(term) ||
        (i.tool_serial || '').toLowerCase().includes(term) ||
        (i.tool_material_code || '').toLowerCase().includes(term) ||
        (i.tool_material_description || '').toLowerCase().includes(term);

    const filteredGroups = Object.entries(grouped)
        .map(([userId, group]) => {
            const nameMatch = group.userName.toLowerCase().includes(search.toLowerCase());
            const filteredItems = nameMatch
                ? group.items
                : group.items.filter(i => matchItem(i, search.toLowerCase()));
            return { userId, group: { ...group, items: filteredItems }, nameMatch };
        })
        .filter(({ nameMatch, group }) => !nameMatch || group.items.length > 0)
        .filter(({ group }) => group.items.length > 0)
        .map(({ userId, group }) => [userId, group] as [string, { userName: string; userAvatar?: string; items: ListItem[] }]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                    <SearchInput value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} placeholder="Buscar por Responsável ou ferramenta..." />
                </div>
                {canMovements && (
                    <button
                        onClick={() => setActionMode('assign')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Vincular
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && <Loading />}
                {!loading && filteredGroups.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">manage_accounts</span>
                        <p className="text-sm">Nenhum vínculo ativo encontrado</p>
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
                            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 mr-2">{items.length} ferramenta(s)</span>
                            <ResponsibleToolsPDFButton
                                userName={userName}
                                items={items.filter(i => i.userTool).map(i => i.userTool!)}
                            />
                        </div>
                        {/* Tool Items */}
                        {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary text-sm truncate">{item.tool_code || '—'}</p>
                                    {item.tool_material_code && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                            <span className="font-semibold text-slate-500 dark:text-slate-400">{item.tool_material_code}</span>
                                            {item.tool_material_description && <span> — {item.tool_material_description}</span>}
                                            {item.tool_material_unit && <span className="ml-1 text-slate-400">({item.tool_material_unit})</span>}
                                        </p>
                                    )}
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                        {item.tool_brand} {item.tool_model} {item.tool_serial}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <p className="text-xs text-slate-400 hidden sm:block">
                                        {new Date(item.date).toLocaleDateString('pt-BR')}
                                    </p>
                                    {item.type === 'USO' && item.userTool && canMovements && (
                                        <div className="flex items-center gap-1">
                                            <IconButton
                                                icon="history"
                                                title="Histórico"
                                                onClick={() => openHistory(item)}
                                            />
                                            <IconButton
                                                icon="swap_horiz"
                                                title="Transferir"
                                                onClick={() => setActionMode({ action: 'transfer', userTool: item.userTool! })}
                                            />
                                            <IconButton
                                                icon="remove_circle_outline"
                                                title="Baixar"
                                                onClick={() => setActionMode({ action: 'return', userTool: item.userTool! })}
                                            />
                                        </div>
                                    )}
                                    {item.type === 'BAIXA' && (
                                        <span className="text-xs font-medium text-rose-500">Baixa</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* History Modal */}
            {historyModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="relative p-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="pr-10">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Rastreamento</p>
                                <h3 className="font-bold text-slate-800 dark:text-white">{historyModal.toolName}</h3>
                                {historyModal.toolCode && (
                                    <p className="text-xs text-primary font-semibold mt-0.5">{historyModal.toolCode}</p>
                                )}
                                {historyModal.toolMaterial && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{historyModal.toolMaterial}</p>
                                )}
                            </div>
                            <button onClick={() => setHistoryModal({ isOpen: false })} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:opacity-80">
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            {movLoading && <Loading />}
                            {!movLoading && movements.length === 0 && (
                                <p className="text-center text-sm text-slate-400 py-8">Sem movimentações registradas</p>
                            )}
                            {!movLoading && movements.length > 0 && (
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                                    <div className="space-y-5">
                                        {movements.map(mov => {
                                            const cfg = movTypeConfig[mov.movement_type];
                                            return (
                                                <div key={mov.id} className="flex gap-4 pl-10 relative">
                                                    <div className={`absolute left-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-current flex items-center justify-center ${cfg.color}`}>
                                                        <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{cfg.label}</p>
                                                        {mov.from_user_name && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">De: {mov.from_user_name}</p>
                                                        )}
                                                        {mov.to_user_name && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Para: {mov.to_user_name}</p>
                                                        )}
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(mov.created_at).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
