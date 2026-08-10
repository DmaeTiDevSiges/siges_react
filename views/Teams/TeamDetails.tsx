import React, { useState } from 'react';
import { Team } from '../../types';
import { Button } from '../../components/ui/Button';
import { TabsBar } from '../../components/ui/TabsBar';

interface TeamDetailsProps {
    team: Team;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({ team, onEdit, onDelete }) => {
    const [activeTab, setActiveTab] = useState('Membros');
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex flex-col">
            <div className="relative flex p-4 flex-col gap-4 items-center pt-6">

                {/* Context Menu Button */}
                {(onEdit || onDelete) && (
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onEdit();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onDelete();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="relative mt-4">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-full h-32 w-32 shadow-lg border-4 border-surface-light dark:border-surface-dark flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[64px]">
                            groups
                        </span>
                    </div>

                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                    <h1 className="text-slate-900 dark:text-white text-[22px] font-bold tracking-tight text-center">
                        {team.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wide">
                        {team.code}
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {team.departmentName && `${team.departmentName}`}
                        {team.companyName && ` • ${team.companyName}`}
                    </p>
                </div>
            </div>

            <div className="px-4 py-6">
                <TabsBar tabs={['Membros', 'Histórico']} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {activeTab === 'Membros' && (
                <div className="flex flex-col px-4 pb-8">
                    <div className="text-center py-10 text-slate-500">
                        Membros em desenvolvimento...
                    </div>
                </div>
            )}

            {activeTab === 'Histórico' && (
                <div className="flex flex-col px-4 pb-8">
                    <div className="text-center py-10 text-slate-500">
                        Histórico em desenvolvimento...
                    </div>
                </div>
            )}
        </div>
    );
};
