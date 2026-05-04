import React, { useState, useEffect } from 'react';
import { Profile, Permission } from '../../types';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { IconButton } from '../../components/ui/IconButton';
import { LoadMore } from '../../components/ui/LoadMore';

interface ProfilesListProps {
    companyId: string;
}

const RESOURCES = [
    { id: 'companies', label: 'Empresas' },
    { id: 'departments', label: 'Departamentos' },
    { id: 'teams', label: 'Equipes' },
    { id: 'users', label: 'Usuários' },
    { id: 'contracts', label: 'Contratos' },
    { id: 'profiles', label: 'Perfis e Permissões' }
];

export const ProfilesList: React.FC<ProfilesListProps> = ({ companyId }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(() => localStorage.getItem('profiles_search') || '');
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    const handleSearchChange = (val: string) => {
        setSearch(val);
        localStorage.setItem('profiles_search', val);
        setVisibleCount(PAGE_SIZE); // Reset visible count on search
    };
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Partial<Permission>[]>([]);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; profile: Profile | null }>({
        isOpen: false,
        profile: null
    });


    useEffect(() => {
        loadProfiles();
    }, [companyId]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await dataService.getCompanyProfiles(companyId);
            setProfiles(data);
        } catch (error) {
            console.error("Failed to load profiles", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        setEditingProfile(null);
        setDescription('');
        setPermissions(RESOURCES.map(r => ({
            resource: r.id,
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false
        })));
        setIsFormOpen(true);
    };

    const handleEdit = (profile: Profile) => {
        setEditingProfile(profile);
        setDescription(profile.description);

        // Ensure all resources exist in the form
        const existingResources = profile.permissions?.map(p => p.resource) || [];
        const missingResources = RESOURCES.filter(r => !existingResources.includes(r.id));

        const currentPerms = [...(profile.permissions || [])];
        missingResources.forEach(r => {
            currentPerms.push({
                resource: r.id,
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                profileId: profile.id
            } as any);
        });

        setPermissions(currentPerms);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!description.trim()) {
            toast.warning('Descrição é obrigatória');
            return;
        }

        try {
            if (editingProfile) {
                await dataService.updateCompanyProfile(editingProfile.id, description, permissions);
            } else {
                await dataService.createCompanyProfile(companyId, description, permissions);
            }
            setIsFormOpen(false);
            loadProfiles();
        } catch (error) {
            console.error("Failed to save profile", error);
            toast.error('Erro ao salvar perfil');
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.profile) return;
        try {
            await dataService.deleteCompanyProfile(deleteModal.profile.id);
            setDeleteModal({ isOpen: false, profile: null });
            loadProfiles();
        } catch (error) {
            console.error("Failed to delete profile", error);
            toast.error('Erro ao excluir perfil');
        }
    };

    const togglePermission = (resourceId: string, field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canSearch') => {
        setPermissions(prev => prev.map(p => {
            if (p.resource === resourceId) {
                return { ...p, [field]: !p[field] };
            }
            return p;
        }));
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando perfis...</div>;

    return (
        <div className="flex flex-col">
            {/* Header & Search */}
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar perfil..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={handleAdd}
                        title="Novo Perfil"
                    />
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar space-y-3"
            >
                {filteredProfiles.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhum perfil encontrado.
                    </div>
                ) : (
                    filteredProfiles.slice(0, visibleCount).map(profile => (
                        <div
                            key={profile.id}
                            className="p-4 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group"
                        >
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{profile.description}</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                                    {profile.permissions?.filter(p => p.canView || p.canCreate || p.canEdit || p.canDelete).length || 0} recursos ativos
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconButton
                                    icon="edit"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(profile)}
                                    title="Editar"
                                />
                                <IconButton
                                    icon="delete"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteModal({ isOpen: true, profile })}
                                    className="text-slate-400 hover:text-red-500"
                                    title="Excluir"
                                />
                            </div>
                        </div>
                    ))
                )}

                <LoadMore
                    current={Math.min(visibleCount, filteredProfiles.length)}
                    total={filteredProfiles.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>

            {/* Form Drawer/Modal Overlay */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-50/95 dark:bg-background-dark/95 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto bg-slate-100 dark:bg-background-dark shadow-2xl overflow-hidden md:my-8 md:rounded-3xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
                            <IconButton
                                icon="close"
                                variant="ghost"
                                size="md"
                                onClick={() => setIsFormOpen(false)}
                                title="Fechar"
                            />
                            <h2 className="text-lg font-bold">{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</h2>
                            <button onClick={handleSave} className="text-primary font-bold px-4">Salvar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            <Input
                                label="Nome do Perfil"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Supervisor, Técnico, Administrativo"
                            />

                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                    Permissões por Recurso
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {RESOURCES.map(res => {
                                        const perm = permissions.find(p => p.resource === res.id);
                                        return (
                                            <div key={res.id} className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-3 uppercase text-xs tracking-widest">{res.label}</span>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <button
                                                        onClick={() => togglePermission(res.id, 'canView')}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${perm?.canView ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        <span className="text-[10px] font-bold">Ver</span>
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(res.id, 'canCreate')}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${perm?.canCreate ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                                        <span className="text-[10px] font-bold">Criar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(res.id, 'canEdit')}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${perm?.canEdit ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        <span className="text-[10px] font-bold">Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(res.id, 'canDelete')}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${perm?.canDelete ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        <span className="text-[10px] font-bold">Excluir</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, profile: null })}
                onConfirm={handleDelete}
                title="Excluir Perfil"
                message={`Tem certeza que deseja excluir o perfil "${deleteModal.profile?.description}"? Esta ação não pode ser desfeita.`}
                type="error"
                confirmLabel="Excluir"
            />

        </div>
    );
};
