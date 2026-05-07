import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { IconButton } from '../../components/ui/IconButton';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { UserAvatar, UserStatus as AvatarStatus } from '../../components/ui/UserAvatar';

interface UsersListProps {
    companyId: string;
    onAddUser?: () => void;
    onSelectUser?: (user: User) => void;
}

export const UsersList: React.FC<UsersListProps> = ({ companyId, onAddUser, onSelectUser }) => {
    const [search, setSearch] = useState(() => localStorage.getItem('users_search') || '');

    const handleSearchChangeLocal = (val: string) => {
        setSearch(val);
        localStorage.setItem('users_search', val);
    };
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    const [activeFilter, setActiveFilter] = useState(() => {
        return localStorage.getItem('users_filter') || 'Todos';
    });

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        localStorage.setItem('users_filter', filter);
    };

    // Status Modal State
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        user: User | null;
        nextStatusId: number | null;
        message: string;
        title: string;
    }>({
        isOpen: false,
        user: null,
        nextStatusId: null,
        message: '',
        title: ''
    });


    useEffect(() => {
        const fetchUsers = async () => {
            if (!companyId) return;
            try {
                const data = await dataService.getUsersByCompany(companyId);
                setUsers(data);
            } catch (error) {
                console.error('Failed to load users', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();

        // Subscribe to real-time updates for THIS company's users
        const subscription = dataService.subscribeToUsers((payload) => {
            // We could be more surgical, but re-fetching ensures we get all derived data
            fetchUsers();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [companyId]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.nameFull?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (u.nameShort && u.nameShort.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (activeFilter === 'Todos') return true;
        if (activeFilter === 'Ativos') return u.statusName === 'Ativo';
        if (activeFilter === 'Em Análise') return u.statusName === 'Analise'; // Database description is 'Analise'
        if (activeFilter === 'Inativos') return u.statusName === 'Inativo';

        return true;
    });

    const handleConfirmStatus = async () => {
        const { user, nextStatusId } = statusModal;
        if (!user || !nextStatusId) return;

        try {
            const newStatusName = await dataService.updateUserStatus(user.id, nextStatusId);
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, statusName: newStatusName, statusId: nextStatusId } : u
            ));
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error('Erro ao atualizar status.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando usuários..." />
            </div>
        );
    }

    const filters = ['Todos', 'Ativos', 'Em Análise', 'Inativos'];

    return (
        <div className="flex flex-col">
            <div className="px-4 pb-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark pt-0">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar usuário..."
                            value={search}
                            onChange={(e) => handleSearchChangeLocal(e.target.value)}
                        />
                    </div>
                    {onAddUser && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAddUser}
                            title="Adicionar Usuário"
                        />
                    )}
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhum usuário encontrado.
                    </div>
                ) : (
                    filteredUsers.slice(0, visibleCount).map(user => {
                        const userStatus: AvatarStatus = user.isAvailable
                            ? (user.ovIdInProgress && Number(user.ovIdInProgress) > 0 ? 'busy' : 'available')
                            : 'unavailable';

                        return (
                            <div
                                key={user.id}
                                onClick={() => onSelectUser?.(user)}
                                className={`group flex items-center p-4 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all ${onSelectUser ? 'hover:border-primary/50 cursor-pointer' : ''}`}
                            >
                                <UserAvatar
                                    src={user.avatarUrl}
                                    name={user.nameFull || ''}
                                    size="md"
                                    status={userStatus}
                                    className="mr-4 shrink-0"
                                />

                                {/* Info Center */}
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                            {user.nameFull || 'Sem nome'}
                                        </h3>
                                        <div
                                            onClick={async (e) => {
                                                e.stopPropagation();

                                                const currentStatus = user.statusName;
                                                let nextStatusId: number | null = null;
                                                let message = "";
                                                let title = "Alterar Status";

                                                if (currentStatus === 'Analise') {
                                                    nextStatusId = 2; // Ativo
                                                    title = "Ativar Usuário";
                                                    message = `Deseja ativar o acesso de ${user.nameFull}?`;
                                                } else if (currentStatus === 'Ativo') {
                                                    nextStatusId = 3; // Inativo
                                                    title = "Desativar Usuário";
                                                    message = `Deseja suspender o acesso de ${user.nameFull}?`;
                                                } else if (currentStatus === 'Inativo') {
                                                    nextStatusId = 2; // Ativo
                                                    title = "Reativar Usuário";
                                                    message = `Deseja restaurar o acesso de ${user.nameFull}?`;
                                                }

                                                if (nextStatusId) {
                                                    setStatusModal({
                                                        isOpen: true,
                                                        user,
                                                        nextStatusId,
                                                        message,
                                                        title
                                                    });
                                                }
                                            }}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <StatusBadge
                                                status={
                                                    user.statusName === 'Ativo' ? 'active' :
                                                        user.statusName === 'Analise' ? 'pending' :
                                                            'inactive'
                                                }
                                                label={user.statusName === 'Analise' ? 'Em Análise' : user.statusName || 'Desconhecido'}
                                                size="sm"
                                            />
                                        </div>

                                    </div>
                                    {user.nameShort && (
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                                            {user.nameShort} {user.teamName && <span className="text-slate-400 dark:text-slate-500 font-normal"> • {user.teamName}</span>}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Chevron Right */}
                                <div className="ml-2 flex items-center shrink-0">
                                    {onSelectUser && (
                                        <div className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                <LoadMore
                    current={Math.min(visibleCount, filteredUsers.length)}
                    total={filteredUsers.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>

            <Modal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmStatus}
                title={statusModal.title}
                message={statusModal.message}
                type={statusModal.nextStatusId === 3 ? 'warning' : 'info'}
                confirmLabel={statusModal.nextStatusId === 3 ? 'Desativar' : 'Confirmar'}
            />

        </div>
    );
};
