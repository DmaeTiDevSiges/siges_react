
import React, { useState, useEffect, useMemo } from 'react';
import { Profile, Permission, Route, User } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { toast } from 'sonner';

interface ProfilePermissionsScreenProps {
    currentUser?: User | null;
    onBack?: () => void;
}

export const ProfilePermissionsScreen: React.FC<ProfilePermissionsScreenProps> = ({ currentUser, onBack }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialPermissions, setInitialPermissions] = useState<string>('');
    const [showNewProfileModal, setShowNewProfileModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [creatingProfile, setCreatingProfile] = useState(false);
    const [deletingProfile, setDeletingProfile] = useState(false);

    const isSuperAdmin = currentUser?.isAdminSuper;

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            if (!currentUser?.companyId) return;
            try {
                setLoading(true);
                const [profilesData, routesData] = await Promise.all([
                    dataService.getCompanyProfiles(currentUser.companyId),
                    isSuperAdmin ? dataService.getAllRoutesAdmin() : dataService.getAllRoutesForCompanyAdmin()
                ]);
                setProfiles(profilesData);
                setRoutes(routesData);
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [currentUser?.companyId, isSuperAdmin]);

    // Load Permissions when Profile Changes
    useEffect(() => {
        if (!selectedProfileId) {
            setPermissions([]);
            setInitialPermissions('');
            return;
        }

        const loadPermissions = async () => {
            try {
                setLoading(true);
                const perms = await dataService.getProfilePermissions(selectedProfileId);
                setPermissions(perms);
                setInitialPermissions(JSON.stringify(perms));
            } catch (error) {
                console.error('Error loading permissions:', error);
                toast.error('Erro ao carregar permissões');
            } finally {
                setLoading(false);
            }
        };
        loadPermissions();
    }, [selectedProfileId]);

    // Derived data for the table
    const mergedData = useMemo(() => {
        return [...routes]
            .filter(route =>
                route.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
                route.routeKey.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => a.description.localeCompare(b.description))
            .map(route => {
                const perm = permissions.find(p => String(p.routeId) === String(route.id));
                return {
                    route,
                    canView: !!perm?.canView,
                    canCreate: !!perm?.canCreate,
                    canEdit: !!perm?.canEdit,
                    canDelete: !!perm?.canDelete,
                    canSearch: !!perm?.canSearch
                };
            });
    }, [routes, permissions, searchQuery]);

    const handleTogglePermissionSafe = (routeId: string, action: 'view' | 'create' | 'edit' | 'delete' | 'search') => {
        setPermissions(current => {
            const index = current.findIndex(p => String(p.routeId) === String(routeId));
            const newList = [...current];

            if (index >= 0) {
                const item = { ...newList[index] };
                if (action === 'view') item.canView = !item.canView;
                else if (action === 'create') item.canCreate = !item.canCreate;
                else if (action === 'edit') item.canEdit = !item.canEdit;
                else if (action === 'delete') item.canDelete = !item.canDelete;
                else if (action === 'search') item.canSearch = !item.canSearch;
                newList[index] = item;
            } else {
                newList.push({
                    id: '0',
                    profileId: selectedProfileId,
                    routeId: routeId,
                    canView: action === 'view',
                    canCreate: action === 'create',
                    canEdit: action === 'edit',
                    canDelete: action === 'delete',
                    canSearch: action === 'search'
                } as Permission);
            }
            return newList;
        });
    };

    const handleToggleRouteAvailability = async (route: Route) => {
        const newAvailability = !route.isAvailable;
        try {
            await dataService.updateRouteAvailability(route.id, newAvailability);
            setRoutes(prev =>
                prev.map(r => r.id === route.id ? { ...r, isAvailable: newAvailability } : r)
            );
            toast.success(`Rota "${route.description}" ${newAvailability ? 'ativada' : 'desativada'}`);
        } catch (error) {
            console.error('Error toggling route:', error);
            toast.error('Erro ao atualizar rota');
        }
    };

    const handleSave = async () => {
        if (!selectedProfileId) return;
        try {
            setSaving(true);
            await dataService.updateProfilePermissions(selectedProfileId, permissions);
            setInitialPermissions(JSON.stringify(permissions));
            toast.success('Permissões salvas com sucesso!');
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateProfile = async () => {
        if (!newProfileName.trim() || !currentUser?.companyId) return;
        try {
            setCreatingProfile(true);
            await dataService.createCompanyProfile(currentUser.companyId, newProfileName.trim(), []);
            const profilesData = await dataService.getCompanyProfiles(currentUser.companyId);
            setProfiles(profilesData);
            setShowNewProfileModal(false);
            setNewProfileName('');
            toast.success('Perfil criado com sucesso!');
        } catch (error) {
            console.error('Error creating profile:', error);
            toast.error('Erro ao criar perfil');
        } finally {
            setCreatingProfile(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!selectedProfileId) return;
        if (!window.confirm('Tem certeza que deseja excluir este perfil? As permissoes associadas serao removidas.')) return;
        try {
            setDeletingProfile(true);
            await dataService.deleteCompanyProfile(selectedProfileId);
            const profilesData = await dataService.getCompanyProfiles(currentUser!.companyId!);
            setProfiles(profilesData);
            setSelectedProfileId('');
            setPermissions([]);
            setInitialPermissions('');
            toast.success('Perfil excluido com sucesso!');
        } catch (error) {
            console.error('Error deleting profile:', error);
            toast.error('Erro ao excluir perfil');
        } finally {
            setDeletingProfile(false);
        }
    };

    const hasChanges = initialPermissions !== JSON.stringify(permissions);

    if (loading && profiles.length === 0) return <div className="p-8">Carregando...</div>;

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="form-select block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Selecione um perfil...</option>
                        {profiles.map(profile => (
                            <option key={profile.id} value={profile.id}>{profile.description}</option>
                        ))}
                    </select>
                    <div className="w-64">
                        <SearchInput
                            placeholder="Filtrar módulos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => setShowNewProfileModal(true)}
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                        <span className="material-symbols-outlined text-base mr-1">add</span>
                        Novo Perfil
                    </Button>
                    {selectedProfileId && (
                        <Button
                            onClick={handleDeleteProfile}
                            disabled={deletingProfile}
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <span className="material-symbols-outlined text-base mr-1">delete</span>
                            {deletingProfile ? 'Excluindo...' : 'Excluir Perfil'}
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        variant={hasChanges ? "primary" : "ghost"}
                        className={hasChanges ? "shadow-lg shadow-blue-500/40 ring-2 ring-blue-500/20 scale-105" : ""}
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {!selectedProfileId ? (
                    <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center text-gray-500">
                        <span className="material-symbols-outlined text-[48px] mb-4">account_box</span>
                        <p>Selecione um perfil para gerenciar as permissões</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rota / Módulo</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Buscar</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Mostrar</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Criar</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Editar</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Excluir</th>
                                    {isSuperAdmin && (
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Ativa</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {mergedData.map(({ route, canView, canCreate, canEdit, canDelete, canSearch }) => (
                                    <tr key={route.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!route.isAvailable && isSuperAdmin ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {route.icon && <span className="material-symbols-outlined mr-2 text-gray-400">{route.icon}</span>}
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{route.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={canSearch} onChange={() => handleTogglePermissionSafe(String(route.id), 'search')} className="h-4 w-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={canView} onChange={() => handleTogglePermissionSafe(String(route.id), 'view')} className="h-4 w-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={canCreate} onChange={() => handleTogglePermissionSafe(String(route.id), 'create')} className="h-4 w-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={canEdit} onChange={() => handleTogglePermissionSafe(String(route.id), 'edit')} className="h-4 w-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={canDelete} onChange={() => handleTogglePermissionSafe(String(route.id), 'delete')} className="h-4 w-4 cursor-pointer" />
                                        </td>
                                        {isSuperAdmin && (
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleRouteAvailability(route)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                        route.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                        route.isAvailable ? 'translate-x-4.5' : 'translate-x-0.5'
                                                    }`} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Novo Perfil */}
            {showNewProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Novo Perfil</h3>
                        <input
                            type="text"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            placeholder="Nome do perfil..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProfile(); }}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                onClick={() => { setShowNewProfileModal(false); setNewProfileName(''); }}
                                variant="ghost"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateProfile}
                                disabled={!newProfileName.trim() || creatingProfile}
                                variant="primary"
                            >
                                {creatingProfile ? 'Criando...' : 'Criar Perfil'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
