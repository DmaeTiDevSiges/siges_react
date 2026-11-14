import React from 'react';
import { formatDateInBrazil } from '../../../utils/formatters';
import { Loading } from '../../../components/ui/Loading';
import type { UserTool } from '../../../types';

interface ProfileToolsTabProps {
    loading: boolean;
    tools: UserTool[];
}

/** Aba "Ferramentas" do perfil (JSX movido do ProfileScreen sem alteração). */
export const ProfileToolsTab: React.FC<ProfileToolsTabProps> = ({ loading: toolsLoading, tools: userTools }) => (
    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {toolsLoading ? (
            <div className="flex items-center justify-center py-16">
                <Loading size="sm" />
            </div>
        ) : userTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl text-slate-400">construction</span>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma ferramenta</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Este usuário não possui ferramentas sob responsabilidade.</p>
            </div>
        ) : (
            <div className="flex flex-col">
                {userTools.map((tool) => (
                    <div key={tool.id} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 first:border-t-0">
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-primary text-sm truncate">{tool.tool_code || '—'}</p>
                            {tool.tool_material_code && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">{tool.tool_material_code}</span>
                                    {tool.tool_material_description && <span> — {tool.tool_material_description}</span>}
                                    {tool.tool_material_unit && <span className="ml-1 text-slate-400">({tool.tool_material_unit})</span>}
                                </p>
                            )}
                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                {tool.tool_brand} {tool.tool_model} {tool.tool_serial}
                            </p>
                        </div>
                        <div className="shrink-0 text-xs text-slate-400">
                            {tool.date_start ? formatDateInBrazil(tool.date_start, 'date', 'pt-BR') : '—'}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);
