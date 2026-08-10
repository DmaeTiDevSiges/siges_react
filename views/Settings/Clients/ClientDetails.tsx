import React, { useState } from 'react';
import { Client } from '../../../types';
import { ActionIcon } from '../../../components/ui/ActionIcon';

interface ClientDetailsProps {
    client: Client;
    onEdit: () => void;
    onDelete?: () => void;
    onViewUnits?: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({
    client,
    onEdit,
    onDelete,
    onViewUnits
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex flex-col">
            {/* Top Row: Name and Menu */}
            <div className="flex items-center justify-between px-4 pt-6 pb-0">
                <h1 className="text-slate-900 dark:text-white text-[22px] font-bold tracking-tight truncate pr-4">
                    {client.name}
                </h1>

                {(onEdit || onDelete) && (
                    <div className="relative shrink-0">
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
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
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
            </div>

            {/* Second Row: Image and Details */}
            <div className="flex px-4 pt-1 pb-4 flex-row gap-5 items-start w-full">
                <div className="relative shrink-0">
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-xl h-24 w-24 shadow-md border-2 border-surface-light dark:border-surface-dark"
                        style={{ backgroundImage: `url(${client.logoUrl})` }}
                    />

                </div>

                <div className="flex flex-col items-start justify-between h-24 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700">
                            {client.code}
                        </span>
                    </div>

                    {client.mobile && (
                        <div className="text-[13px] text-slate-600 dark:text-slate-300">
                            <span className="font-semibold leading-none">{client.mobile}</span>
                        </div>
                    )}

                    {client.email && (
                        <div className="text-[13px] text-slate-600 dark:text-slate-300 truncate">
                            <span className="truncate leading-none">{client.email}</span>
                        </div>
                    )}

                    <div className="text-[13px] text-slate-600 dark:text-slate-300 leading-tight truncate">
                        {client.address || 'Sem endereço cadastrado'}
                    </div>
                </div>
            </div>


            <div className="px-4 mt-6">
                <button
                    onClick={onViewUnits}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[28px]">location_on</span>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-900 dark:text-white">Gerenciar Unidades</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ver e cadastrar endereços deste cliente</p>
                        </div>
                    </div>
                    <div className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </div>
                </button>
            </div>
        </div>
    );
};
