import React, { useState, useEffect } from 'react';
import { Tool, UserTool } from '../../types';
import { toolsService } from '../../services/toolsService';
import { toast } from 'sonner';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { ToolForm } from '../../components/tools/ToolForm';
import { usePermissions } from '../../contexts/PermissionsContext';

interface ToolsListProps {
    onAddTool?: () => void;
}

const statusConfig: Record<Tool['status'], { label: string; color: string }> = {
    DISPONIVEL:  { label: 'Disponível',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    EM_USO:      { label: 'Em Uso',        color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
    MANUTENCAO:  { label: 'Manutenção',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    BAIXADA:     { label: 'Baixada',       color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

export const ToolsList: React.FC<ToolsListProps> = () => {
    const { canCreate, canEdit, canDelete } = usePermissions();
    const canEditDelete = canEdit('tools_edit_delete') || canDelete('tools_edit_delete');
    const [tools, setTools] = useState<Tool[]>([]);
    const [userTools, setUserTools] = useState<UserTool[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingTool, setEditingTool] = useState<Tool | null | 'new'>(null);

    const loadTools = async () => {
        setLoading(true);
        try {
            const [toolsData, userToolsData] = await Promise.all([
                toolsService.getTools(),
                toolsService.getUserTools()
            ]);
            setTools(toolsData);
            setUserTools(userToolsData.filter(ut => ut.status === 'USO'));
        } catch (err) {
            toast.error('Erro ao carregar ferramentas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTools(); }, []);

    const userToolsMap = new Map<number, UserTool>();
    userTools.forEach(ut => userToolsMap.set(ut.tool_id, ut));

    const filtered = tools.filter(t => {
        const term = search.toLowerCase();
        return (t.code || '').toLowerCase().includes(term) ||
            t.brand.toLowerCase().includes(term) ||
            t.model.toLowerCase().includes(term) ||
            t.serial_number.toLowerCase().includes(term) ||
            (t.material_code || '').toLowerCase().includes(term) ||
            (t.material_description || '').toLowerCase().includes(term);
    }).sort((a, b) => (a.material_description || '').localeCompare(b.material_description || '', 'pt-BR'));

    if (editingTool !== null) {
        return (
            <ToolForm
                tool={editingTool === 'new' ? undefined : editingTool}
                onSave={() => { setEditingTool(null); loadTools(); toast.success('Ferramenta salva!'); }}
                onCancel={() => setEditingTool(null)}
                onDelete={() => { setEditingTool(null); loadTools(); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                    <SearchInput value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} placeholder="Buscar por marca, modelo ou serial..." />
                </div>
                {canCreate('tools_create_edit_delete') && (
                    <button
                        onClick={() => setEditingTool('new')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    >
                        Nova
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading && <Loading />}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">handyman</span>
                        <p className="text-sm">Nenhuma ferramenta encontrada</p>
                    </div>
                )}
                {!loading && filtered.map(tool => {
                    const cfg = statusConfig[tool.status];
                    const ut = userToolsMap.get(tool.id);
                    return (
                        <div
                            key={tool.id}
                            onClick={canEditDelete ? () => setEditingTool(tool) : undefined}
                            className={`bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all ${canEditDelete ? 'hover:border-primary/30 cursor-pointer' : ''}`}
                        >
                            <div className="flex items-center gap-4 p-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary text-sm truncate">{tool.code || '—'}</p>
                                    {tool.material_code && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            <span className="font-semibold text-slate-500 dark:text-slate-400">{tool.material_code}</span>
                                            {tool.material_description && <span> — {tool.material_description}</span>}
                                            {tool.material_unit && <span className="ml-1 text-slate-400">({tool.material_unit})</span>}
                                        </p>
                                    )}
                                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                        {tool.brand} {tool.model} {tool.serial_number}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                            </div>
                            {tool.status === 'EM_USO' && ut && (
                                <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
                                    {ut.user_avatar ? (
                                        <img src={ut.user_avatar} alt={ut.user_name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-xs text-primary">person</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">{ut.user_name}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                        {new Date(ut.date_start).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
