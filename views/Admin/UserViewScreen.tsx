import React, { useState, useEffect } from 'react';
import { User, Team, Profile as ProfileType } from '../../types';
import { dataService } from '../../services/dataService';
import { UserAvatar, UserStatus as AvatarStatus } from '../../components/ui/UserAvatar';
import { IconButton } from '../../components/ui/IconButton';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface UserViewScreenProps {
    user: User;
    onBack: () => void;
    onEdit: (user: User) => void;
}

export const UserViewScreen: React.FC<UserViewScreenProps> = ({ user, onBack, onEdit }) => {
    const userStatus: AvatarStatus = user.isAvailable
        ? (user.ovIdInProgress && Number(user.ovIdInProgress) > 0 ? 'busy' : 'available')
        : 'unavailable';

    return (
        <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark pb-20">
            {/* Header / Cover Area */}
            <div className="bg-white dark:bg-card-dark px-4 pt-4 pb-8 rounded-b-[32px] shadow-sm border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-end items-start mb-6">
                    <button
                        onClick={() => onEdit(user)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                        Editar
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-100 dark:ring-slate-700">
                            <UserAvatar
                                src={user.avatarUrl}
                                name={user.nameFull || ''}
                                size="xl"
                                status={userStatus}
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {user.nameFull || 'Sem nome'}
                    </h2>
                    <div className="flex items-center gap-2 mb-2">
                        <StatusBadge
                            status={
                                user.statusName === 'Ativo' ? 'active' :
                                    user.statusName === 'Analise' ? 'pending' :
                                        'inactive'
                            }
                            label={user.statusName || 'Desconhecido'}
                            size="sm"
                        />
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-sm font-medium text-primary dark:text-blue-400">
                            {user.profileName || 'Sem Perfil'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user.teamName || 'Sem Equipe'}
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="px-4 mt-6 space-y-4">
                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
                        Informações de Contato
                    </h3>
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 shadow-sm overflow-hidden">
                        <InfoRow
                            icon="mail"
                            label="E-mail"
                            value={user.email}
                        />
                        <InfoRow
                            icon="call"
                            label="Telefone"
                            value={user.mobileMask || user.mobile || user.phone || 'Não informado'}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
                        Organização
                    </h3>
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 shadow-sm overflow-hidden">
                        <InfoRow
                            icon="business"
                            label="Empresa"
                            value={user.companyName || 'N/A'}
                        />
                        <InfoRow
                            icon="groups"
                            label="Equipe"
                            value={user.teamName || 'N/A'}
                        />
                        <InfoRow
                            icon="badge"
                            label="Perfil / Cargo"
                            value={user.profileName || 'N/A'}
                        />
                        <InfoRow
                            icon="supervisor_account"
                            label="Líder"
                            value={user.isTeamLeader ? 'Sim' : 'Não'}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
                        Outros Dados
                    </h3>
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 shadow-sm overflow-hidden">
                         <InfoRow
                            icon="directions_car"
                            label="Veículo Atual"
                            value={user.vehicleId ? 'Vinculado' : 'Sem veículo'}
                        />
                        <InfoRow
                            icon="calendar_today"
                            label="Membro desde"
                            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</div>
        </div>
    </div>
);
