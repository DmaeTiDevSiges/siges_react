import React, { useState, useEffect } from 'react';
import { Contract, User, ContractManager } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { ContractServicesList } from './Services/ContractServicesList';
import { ContractEvaluationsTab } from './Evaluations/ContractEvaluationsTab';
import { Loading } from '../../components/ui/Loading';
import { TabsBar } from '../../components/ui/TabsBar';


interface ContractDetailsProps {
    contract: Contract;
    onEdit: () => void;
    onDelete?: () => void;
}

// Sub-component for individual search result rows to manage internal state
const UserSearchRow: React.FC<{ 
    user: any; 
    onAdd: (userId: string, role: string) => void 
}> = ({ user, onAdd }) => {
    const [role, setRole] = React.useState('viewer');

    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151e2e] rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} alt={user.nameShort} size="sm" shape="circle" fallbackIcon="person" />
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {user.nameShort || user.nameFull}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="appearance-none px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all pr-8 relative"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='C19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '12px'
                    }}
                >
                    <option value="viewer">VIEWER</option>
                    <option value="manager">MANAGER</option>
                </select>
                <button
                    onClick={() => onAdd(user.id, role)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95 group"
                    title="Adicionar Gestor"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">person_add</span>
                </button>
            </div>
        </div>
    );
};

export const ContractDetails: React.FC<ContractDetailsProps> = ({
    contract,
    onEdit,
    onDelete
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [activeTab, setActiveTab] = useState<'gestores' | 'servicos' | 'avaliacoes' | null>(null);
    const [managers, setManagers] = useState<ContractManager[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Load managers when tab changes to gestores
    useEffect(() => {
        if (activeTab === 'gestores') {
            loadManagers();
            loadAllUsers();
        }
    }, [activeTab, contract.id]);

    const loadManagers = async () => {
        try {
            setLoading(true);
            const data = await dataService.getContractManagers(contract.id);
            setManagers(data);
        } catch (error) {
            console.error('Error loading managers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllUsers = async () => {
        try {
            const data = await dataService.getUsers();
            setAllUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleAddManager = async (userId: string, role: string = 'viewer') => {
        try {
            await dataService.addContractManager(contract.id, userId, role);
            await loadManagers();
            setSearchQuery('');
        } catch (error) {
            console.error('Error adding manager:', error);
            toast.error('Erro ao adicionar gestor');
        }
    };

    const handleUpdateManagerRole = async (managerId: string, currentRole: string) => {
        const newRole = currentRole === 'manager' ? 'viewer' : 'manager';
        try {
            await dataService.addContractManager(contract.id, managerId, newRole);
            await loadManagers();
            toast.success(`Perfil alterado para ${newRole.toUpperCase()}`);
        } catch (error) {
            console.error('Error updating manager role:', error);
            toast.error('Erro ao atualizar perfil');
        }
    };

    const handleRemoveManager = async (userId: string) => {
        if (!confirm('Deseja remover este gestor do contrato?')) return;

        try {
            await dataService.removeContractManager(contract.id, userId);
            await loadManagers();
        } catch (error) {
            console.error('Error removing manager:', error);
            toast.error('Erro ao remover gestor');
        }
    };

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = searchQuery === '' ||
            user.nameFull?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.nameShort?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        // Don't show users who are already managers
        const isNotManager = !managers.some(m => String(m.managerId) === String(user.id));

        return matchesSearch && isNotManager;
    });

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };


    return (
        <div className="flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Main Card */}
            <div className="relative flex flex-col p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">

                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={contract.logoUrl}
                            alt={contract.providerCompanyName}
                            size="md"
                            shape="rounded"
                        />
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                {contract.providerCompanyName}
                            </h3>
                            {contract.providerDepartmentName && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                    {contract.providerDepartmentName}
                                </p>
                            )}
                            <p className="text-xs text-primary font-bold">{contract.code}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {/* Context Menu Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300"
                            >
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
                                        <button
                                            onClick={() => { setShowMenu(false); onEdit(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar
                                        </button>
                                        {onDelete && (
                                            <button
                                                onClick={() => { setShowMenu(false); onDelete(); }}
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
                        <StatusBadge
                            status={contract.isAvailable ? 'active' : 'inactive'}
                            label={contract.isAvailable ? 'Ativo' : 'Inativo'}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Department and Client Grid */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Departamento Responsável</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                            {contract.clientDepartmentName || 'Não informado'}
                        </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Cliente</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                            {contract.clientName || 'Não informado'}
                        </p>
                    </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Início</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {formatDate(contract.dateStart)}
                        </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Término</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {formatDate(contract.dateEnd)}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-0.5">Descrição</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                        {contract.description || 'Sem descrição'}
                    </p>
                </div>

                {/* Footer / Value */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">R$</span>
                        {(contract.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

            </div>

            {/* Action Buttons Section */}
            <div className="mt-4">
                <TabsBar tabs={['Gestores', 'Serviços', 'Avaliações']} activeTab={
                    activeTab === 'gestores' ? 'Gestores' : 
                    activeTab === 'avaliacoes' ? 'Avaliações' : 'Serviços'
                } onTabChange={(tab) => setActiveTab(
                    tab === 'Gestores' ? 'gestores' : 
                    tab === 'Avaliações' ? 'avaliacoes' : 'servicos'
                )} />
            </div>

            {/* Services Tab Content */}
            {activeTab === 'servicos' && (
                <ContractServicesList contractId={contract.id} />
            )}

            {/* Evaluations Tab Content */}
            {activeTab === 'avaliacoes' && (
                <ContractEvaluationsTab contractId={contract.id} />
            )}

            {/* Managers Tab Content */}
            {activeTab === 'gestores' && (
                <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Search and Add Header */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar usuário para adicionar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />

                        {/* Search Results Section */}
                        {searchQuery && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pl-1">
                                    Resultados da busca
                                </h3>
                                <div className="space-y-2">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <UserSearchRow 
                                                key={user.id} 
                                                user={user} 
                                                onAdd={handleAddManager} 
                                            />
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-slate-500 text-sm italic">
                                            Nenhum usuário encontrado
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Members List */}
                    <div>

                        {loading && managers.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Loading size="xs" />
                            </div>
                        ) : managers.length > 0 ? (
                            <div className="space-y-3">
                                {managers.map(manager => (
                                    <div key={manager.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={manager.managerAvatarUrl} alt={manager.managerName} size="sm" shape="circle" fallbackIcon="person" />
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                        {manager.managerName}
                                                    </p>
                                                    <button
                                                        onClick={() => handleUpdateManagerRole(manager.managerId, manager.role || 'viewer')}
                                                        className="w-fit text-[10px] font-black uppercase tracking-widest mt-0.5 px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                                        title="Clique para alternar perfil"
                                                    >
                                                        {manager.role || 'viewer'}
                                                    </button>
                                                </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveManager(manager.managerId)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                Nenhum gestor vinculado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
