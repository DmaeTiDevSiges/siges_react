
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { dataService } from '../../services/dataService';
import { toolsService } from '../../services/toolsService';
import { User, Profile, Permission, Vehicle, Company, Team, UserStatus as OrganizationStatus, UserTool } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { FaceDetectionCamera } from '../../components/ui/FaceDetectionCamera';
import { UserAvatar, UserStatus as AvatarStatus } from '../../components/ui/UserAvatar';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { ImageEditorModal } from '../../components/ui/ImageEditorModal';
import { Loading } from '../../components/ui/Loading';




interface ProfileScreenProps {
    user?: User | null;
    onBack: () => void;
    onMenuClick?: () => void;
    onThemeToggle?: () => void;
    isDarkMode?: boolean;
    onUserUpdate?: (user: User) => void;
    onStatusChange?: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>;
}

type UserStatus = 'available' | 'unavailable' | 'busy';

const statusConfig = {
    available: {
        color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        label: 'Disponível',
        description: 'Aguardando chamados'
    },
    unavailable: {
        color: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]',
        label: 'Indisponível',
        description: 'Não disponível para atendimento'
    },
    busy: {
        color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        label: 'Em Atividade',
        description: 'Visita em andamento'
    }
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user: initialUser, onBack, onMenuClick, onThemeToggle, isDarkMode, onUserUpdate, onStatusChange }) => {
    const [user, setUser] = useState<User | null>(initialUser || null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(!initialUser);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Form state
    const [name, setName] = useState('');
    const [nameShort, setNameShort] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [profileId, setProfileId] = useState('');
    const [teamId, setTeamId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [isTeamLeader, setIsTeamLeader] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<import('../../types').Company[]>([]);
    const [teams, setTeams] = useState<import('../../types').Team[]>([]);
    const [shiftStart, setShiftStart] = useState('08:00');
    const [shiftEnd, setShiftEnd] = useState('18:00');
    const [statusId, setStatusId] = useState<string>('');
    const [userStatuses, setUserStatuses] = useState<OrganizationStatus[]>([]);
    const [currentUser, setCurrentLoggedUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialUser?.avatarUrl || user?.avatarUrl);
    const [showCamera, setShowCamera] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<File | string | null>(null);

    // Team Management State
    const [isTeamExpanded, setIsTeamExpanded] = useState(false);
    const [searchTeamQuery, setSearchTeamQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searchingTeam, setSearchingTeam] = useState(false);

    // Vehicle Management State
    const [searchVehicleQuery, setSearchVehicleQuery] = useState('');
    const [searchVehicleResults, setSearchVehicleResults] = useState<Vehicle[]>([]);
    const [searchingVehicle, setSearchingVehicle] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Tab navigation state
    const [activeTab, setActiveTab] = useState<'personal' | 'org' | 'schedule' | 'access' | 'tools'>('personal');
    const [userTools, setUserTools] = useState<UserTool[]>([]);
    const [toolsLoading, setToolsLoading] = useState(false);
    const [toolsLoaded, setToolsLoaded] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);

    useEffect(() => {
        const loadLoggedUserAndPermissions = async () => {
            try {
                const loggedUser = await dataService.getCurrentUser();
                setCurrentLoggedUser(loggedUser);
                const isUserAdmin = !!(loggedUser?.isAdminSuper || loggedUser?.isAdmin);
                setIsAdmin(isUserAdmin);
                // Profile owner: viewing own profile or no initialUser passed
                const profileUuid = initialUser?.uuid;
                const loggedUuid = loggedUser?.uuid;
                const owner = !profileUuid || profileUuid === loggedUuid;
                setIsOwner(owner);
                
                if (isUserAdmin) {
                    const allCompanies = await dataService.getCompanies();
                    setCompanies(allCompanies);
                } else {
                    const cid = initialUser?.companyId || loggedUser?.companyId;
                    if (cid) {
                        const comp = await dataService.getCompanyById(cid);
                        if (comp) setCompanies([comp]);
                    }
                }

                dataService.getUserStatuses().then(setUserStatuses).catch(console.error);
            } catch (error) {
                console.error("Error loading logged user permissions", error);
            }
        };

        loadLoggedUserAndPermissions();

        if (initialUser) {
            setUser(initialUser);
            setName(initialUser.nameFull || '');
            setNameShort(initialUser.nameShort || '');
            setEmail(initialUser.email || '');
            setMobile(formatPhone(initialUser.mobile || ''));
            setAvatarUrl(initialUser.avatarUrl);
            setProfileId(initialUser.profileId || '');
            setTeamId(initialUser.teamId || '');
            setCompanyId(initialUser.companyId || '');
            setIsTeamLeader(!!initialUser.isTeamLeader);
            setShiftStart(initialUser.shiftStart?.slice(0, 5) || '08:00');
            setShiftEnd(initialUser.shiftEnd?.slice(0, 5) || '18:00');
            setStatusId(initialUser.statusId?.toString() || '');

            // Load profiles and teams for current user's company
            if (initialUser.companyId) {
                dataService.getCompanyProfiles(initialUser.companyId).then(setProfiles).catch(console.error);
                dataService.getTeamsByCompany(initialUser.companyId).then(setTeams).catch(console.error);
            }
            // Load team members if user has a team
            if (initialUser.teamId) {
                // Filter out current user from the list
                dataService.getTeamMembers(initialUser.teamId)
                    .then(members => setTeamMembers(members.filter(m => m.uuid !== initialUser.uuid)))
                    .catch(console.error);
            }

            setLoading(false);
        } else {
            const loadUserToEdit = async () => {
                try {
                    const currentUserToEdit = await dataService.getCurrentUser();
                    if (currentUserToEdit) {
                        setUser(currentUserToEdit);
                        setName(currentUserToEdit.nameFull || '');
                        setNameShort(currentUserToEdit.nameShort || '');
                        setEmail(currentUserToEdit.email || '');
                        setMobile(formatPhone(currentUserToEdit.mobile || ''));
                        setAvatarUrl(currentUserToEdit.avatarUrl);
                        setProfileId(currentUserToEdit.profileId || '');
                        setTeamId(currentUserToEdit.teamId || '');
                        setIsTeamLeader(!!currentUserToEdit.isTeamLeader);
                        setShiftStart(currentUserToEdit.shiftStart?.slice(0, 5) || '08:00');
                        setShiftEnd(currentUserToEdit.shiftEnd?.slice(0, 5) || '18:00');
                        setStatusId(currentUserToEdit.statusId?.toString() || '');

                        if (currentUserToEdit.companyId) {
                            setCompanyId(currentUserToEdit.companyId);
                            const [profilesData, teamsData] = await Promise.all([
                                dataService.getCompanyProfiles(currentUserToEdit.companyId),
                                dataService.getTeamsByCompany(currentUserToEdit.companyId)
                            ]);
                            setProfiles(profilesData);
                            setTeams(teamsData);
                        }
                        if (currentUserToEdit.teamId) {
                            const members = await dataService.getTeamMembers(currentUserToEdit.teamId);
                            setTeamMembers(members.filter(m => m.uuid !== currentUserToEdit.uuid));
                        }
                    }
                } catch (error) {
                    console.error("Error loading profile to edit", error);
                } finally {
                    setLoading(false);
                }
            };
            loadUserToEdit();
        }

        const subscription = dataService.subscribeToUsers(() => {
            // Recarrega os dados se necessário
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [initialUser]);

    // Fetch initial vehicle details if user has one (assuming dataService can fetch it or it's in user object if we extend user)
    // The user object currently has vehicle_id. We might need to fetch the vehicle details.
    useEffect(() => {
        const fetchVehicle = async () => {
            if (user?.vehicleId) {
                try {
                    const vehicle = await dataService.getVehicle(user.vehicleId);
                    setCurrentVehicle(vehicle);
                } catch (error) {
                    console.error("Error fetching vehicle", error);
                }
            } else {
                setCurrentVehicle(null);
            }
        };
        fetchVehicle();
    }, [user?.vehicleId]);

    const formatPhone = (val: string) => {
        let clean = val.replace(/\D/g, '');
        if (clean.length > 11) clean = clean.slice(0, 11);
        let formatted = clean;
        if (clean.length > 2) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        if (clean.length > 7) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        return formatted;
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMobile(formatPhone(e.target.value));
    };

    const handleCompanyChange = async (newCompanyId: string) => {
        setCompanyId(newCompanyId);
        setProfileId('');
        setTeamId('');
        if (newCompanyId) {
            try {
                const [profilesData, teamsData] = await Promise.all([
                    dataService.getCompanyProfiles(newCompanyId),
                    dataService.getTeamsByCompany(newCompanyId)
                ]);
                setProfiles(profilesData);
                setTeams(teamsData);
            } catch (error) {
                console.error("Error loading company data", error);
            }
        } else {
            setProfiles([]);
            setTeams([]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!user?.uuid) return;
        setSaving(true);
        try {
            const mobileClean = mobile.replace(/\D/g, '');
            if (mobileClean.length > 0 && mobileClean.length < 10) {
                setModal({
                    isOpen: true,
                    title: 'Atenção',
                    message: 'Número de celular inválido (mínimo com DDD).',
                    type: 'warning'
                });
                setSaving(false);
                return;
            }

            setUploadProgress(0);
            await dataService.updateProfile(user.uuid, {
                nameFull: name,
                nameShort: nameShort,
                email: email,
                mobile: mobileClean,
                phone: mobile,
                avatarUrl: avatarUrl,
                profileId: profileId || undefined,
                teamId: teamId || undefined,
                companyId: companyId || undefined,
                isTeamLeader,
                shiftStart: shiftStart,
                shiftEnd: shiftEnd,
                statusId: statusId ? parseInt(statusId) : undefined
            }, (progress) => {
                setUploadProgress(progress);
            });

            if (onUserUpdate) {
                const selectedProfile = profiles.find(p => p.id.toString() === profileId);
                const selectedTeam = teams.find(t => t.id.toString() === teamId);
                const selectedCompany = companies.find(c => c.id.toString() === companyId);
                const selectedStatus = userStatuses.find(s => s.id.toString() === statusId);

                onUserUpdate({
                    ...user,
                    nameFull: name,
                    nameShort: nameShort,
                    email: email,
                    mobile: mobileClean,
                    avatarUrl: avatarUrl,
                    profileId: profileId || undefined,
                    profileName: selectedProfile?.description || user.profileName,
                    teamId: teamId || undefined,
                    teamName: selectedTeam?.name || user.teamName,
                    companyId: companyId || undefined,
                    companyName: selectedCompany?.name || user.companyName,
                    isTeamLeader,
                    shiftStart: shiftStart,
                    shiftEnd: shiftEnd,
                    statusId: statusId ? parseInt(statusId) : undefined,
                    statusName: selectedStatus?.description || user.statusName
                } as User);
            }

            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Perfil atualizado com sucesso!',
                type: 'success'
            });
            setTimeout(() => onBack(), 1500);
        } catch (error) {
            console.error("Error updating profile", error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Erro ao atualizar perfil.',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            await dataService.signOut();
        } catch (error) {
            setLoggingOut(false);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Falha ao sair do aplicativo. Tente novamente.',
                type: 'error'
            });
        }
    };

    // Team Management Handlers
    const toggleTeamExpand = () => {
        setIsTeamExpanded(!isTeamExpanded);
        setSearchTeamQuery('');
        setSearchResults([]);
    };

    const handleTabChange = (tab: 'personal' | 'org' | 'schedule' | 'access' | 'tools') => {
        setActiveTab(tab);
        if (tab === 'tools' && !toolsLoaded && user?.id) {
            setToolsLoading(true);
            toolsService.getUserTools(parseInt(user.id))
                .then(tools => {
                    setUserTools(tools.filter(t => t.status === 'USO'));
                    setToolsLoaded(true);
                })
                .catch(console.error)
                .finally(() => setToolsLoading(false));
        }
    };



    // UseEffect for debouncing vehicle search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchVehicleQuery.length >= 2 && user?.companyId) {
                setSearchingVehicle(true);
                try {
                    const results = await dataService.searchVehicles(searchVehicleQuery, user.companyId);
                    setSearchVehicleResults(results);
                } catch (e) { console.error(e) }
                setSearchingVehicle(false);
            } else {
                setSearchVehicleResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchVehicleQuery, user?.companyId]);

    const handleSelectVehicle = async (vehicle: Vehicle) => {
        if (!user?.uuid) return;
        try {
            await dataService.updateUserVehicle(user.uuid, vehicle.id);
            setCurrentVehicle(vehicle);
            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Veículo atualizado com sucesso!',
                type: 'success'
            });
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Falha ao atualizar veículo.',
                type: 'error'
            });
        }
    };

    const handleRemoveVehicle = async () => {
        if (!user?.uuid) return;
        try {
            await dataService.updateUserVehicle(user.uuid, null);
            setCurrentVehicle(null);
            if (user) user.vehicleId = undefined; // Update local user state
            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Veículo removido com sucesso!',
                type: 'success'
            });
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Falha ao remover veículo.',
                type: 'error'
            });
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTeamQuery.length >= 3 && isTeamExpanded && user?.companyId) {
                handleSearchTeam();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTeamQuery, isTeamExpanded]);

    const handleSearchTeam = async () => {
        if (!user?.companyId) return;
        setSearchingTeam(true);
        try {
            // Search users in same company, excluding current team members
            // Note: dataService.searchUsers is generic. We filter client side for better experience or update service in future.
            // But we can pass 'excludeTeamId' to service if we implemented it, or filter here.
            // Let's assume we filter here for now to match 'other members' requirement.
            const results = await dataService.searchUsers(searchTeamQuery, user.companyId, user.teamId);

            // Filter out self and existing members
            const filtered = results.filter(u =>
                u.uuid !== user.uuid &&
                !teamMembers.some(member => member.uuid === u.uuid)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error("Error searching team members", error);
        } finally {
            setSearchingTeam(false);
        }
    };

    const handleAddMember = async (targetUser: User) => {
        if (!user?.teamId || !targetUser.uuid) return;
        try {
            await dataService.addUserToTeam(targetUser.uuid, user.teamId);

            // Refresh logic
            const updatedMembers = await dataService.getTeamMembers(user.teamId);
            setTeamMembers(updatedMembers.filter(m => m.uuid !== user.uuid));

            // Clear from search results
            setSearchResults(prev => prev.filter(u => u.uuid !== targetUser.uuid));

            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: `${targetUser.nameShort || targetUser.nameFull} adicionado à equipe.`,
                type: 'success'
            });
        } catch (error) {
            console.error("Error adding member", error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Não foi possível adicionar o membro.',
                type: 'error'
            });
        }
    };

    const handleRemoveMember = async (targetUser: User) => {
        if (!user?.teamId || !targetUser.uuid) return;
        if (!window.confirm(`Remover ${targetUser.nameShort || targetUser.nameFull} da equipe?`)) return;

        try {
            await dataService.removeUserFromTeam(targetUser.uuid);

            // Refresh logic
            const updatedMembers = await dataService.getTeamMembers(user.teamId);
            setTeamMembers(updatedMembers.filter(m => m.uuid !== user.uuid));

            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Membro removido da equipe.',
                type: 'success'
            });
        } catch (error) {
            console.error("Error removing member", error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Não foi possível remover o membro.',
                type: 'error'
            });
        }
    };

    const getCurrentStatus = (): UserStatus => {
        if (!user) return 'unavailable';

        const isAvailable = user.isAvailable || (user as any).is_available;
        if (isAvailable === true || isAvailable === 1 || isAvailable === 'true') {
            return 'available';
        }

        const isInProgress = user.isOvInProgress || (user as any).is_ov_in_progress;
        if (isInProgress === true || isInProgress === 1 || isInProgress === 'true') {
            return 'busy';
        }

        return 'unavailable';
    };

    const currentStatus = getCurrentStatus();

    const getOppositeStatus = (): UserStatus => {
        return currentStatus === 'available' ? 'unavailable' : 'available';
    };

    const oppositeStatus = getOppositeStatus();

    const handleStatusChange = async (newStatus: UserStatus) => {
        if (!onStatusChange || !user?.uuid) return;

        const isInProgress = user.isOvInProgress || (user as any).is_ov_in_progress;
        if (newStatus === 'unavailable' && (isInProgress === true || isInProgress === 1 || isInProgress === 'true')) {
            setShowStatusModal(false);
            setModal({
                isOpen: true,
                title: 'Ação Bloqueada',
                message: 'Você não pode ficar Indisponível enquanto possui uma visita em aberto.',
                type: 'error'
            });
            return;
        }

        setIsUpdatingStatus(true);
        try {
            const isAvailable = newStatus === 'available';
            await onStatusChange(isAvailable, user.ovIdInProgress || null);

            // Update local user state
            setUser(prev => prev ? { ...prev, isAvailable, ovIdInProgress: user.ovIdInProgress || undefined } : null);

            setShowStatusModal(false);
            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: `Status atualizado para ${statusConfig[newStatus].label}`,
                type: 'success'
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Erro ao atualizar status. Tente novamente.',
                type: 'error'
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Perfil" onMenuClick={onMenuClick} showBackButton onBackClick={onBack}>
                <div className="flex items-center justify-center h-full">
                    <Loading size="sm" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Perfil"
            onMenuClick={onMenuClick}
            showBackButton={true}
            showUserHeader={false}
            onBackClick={onBack}
            currentUser={user}
            rightAction={
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onThemeToggle?.()}
                        className="w-[34px] h-[34px] flex items-center justify-center rounded-full text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Alternar Tema"
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-[34px] h-[34px] flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Sair"
                    >
                        <span className={`material-symbols-outlined text-[24px] ${loggingOut ? 'animate-spin' : ''}`}>
                            {loggingOut ? 'progress_activity' : 'logout'}
                        </span>
                    </button>
                </div>
            }
        >
            <div className="pb-24 space-y-8 relative">
                {saving && (
                    <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                        <div 
                            className={`h-full bg-primary ${uploadProgress === 0 ? 'animate-loading-bar w-[40%]' : 'transition-all duration-300 ease-out'}`}
                            style={uploadProgress > 0 ? { width: `${uploadProgress}%` } : undefined}
                        />
                    </div>
                )}
                <div className="relative bg-white dark:bg-card-dark pb-8 pt-10 px-5 rounded-b-4xl shadow-sm border-b border-slate-200 dark:border-slate-800">
                    {(isOwner || isAdmin) && !isEditing && (
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => setShowContextMenu(!showContextMenu)}
                                className="w-[34px] h-[34px] flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                                title="Opções"
                            >
                                <span className="material-symbols-outlined text-[24px]">more_vert</span>
                            </button>

                            {showContextMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowContextMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 z-20 py-1">
                                        <button
                                            onClick={() => {
                                                setShowContextMenu(false);
                                                setIsEditing(true);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar Perfil
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-card-dark shadow-lg ring-1 ring-slate-100 dark:ring-slate-700 overflow-hidden aspect-square">
                                <UserAvatar
                                    src={avatarUrl}
                                    name={user?.nameFull || ''}
                                    size="xl"
                                    status={currentStatus}
                                    className="w-full h-full"
                                />
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-dark transition-colors border-2 border-white dark:border-card-dark"
                                    title="Capturar Selfie"
                                >
                                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                                </button>
                            )}
                        </div>

                        {showCamera && (
                            <FaceDetectionCamera
                                onCapture={async (img) => {
                                    setEditingImage(img);
                                    setIsEditorOpen(true);
                                    setShowCamera(false);
                                }}
                                onCancel={() => setShowCamera(false)}
                            />
                        )}

                        <ImageEditorModal
                            isOpen={isEditorOpen}
                            imageFile={editingImage || ''}
                            preventAnnotation={true}
                            onClose={() => {
                                setIsEditorOpen(false);
                                setEditingImage(null);
                            }}
                            onSave={async (file) => {
                                setIsEditorOpen(false);
                                setEditingImage(null);
                                
                                // Process the edited file
                                if (user?.uuid) {
                                    try {
                                        setSaving(true);
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                            const imgData = reader.result as string;
                                            setAvatarUrl(imgData);
                                            
                                            setUploadProgress(0);
                                            await dataService.updateProfile(user.uuid, {
                                                avatarUrl: imgData
                                            }, (progress) => {
                                                setUploadProgress(progress);
                                            });
                                            
                                            if (onUserUpdate) {
                                                onUserUpdate({
                                                    ...user,
                                                    avatarUrl: imgData
                                                } as User);
                                            }
                                            
                                            setModal({
                                                isOpen: true,
                                                title: 'Sucesso',
                                                message: 'Avatar atualizado com sucesso!',
                                                type: 'success'
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    } catch (error) {
                                        console.error("Error updating avatar", error);
                                        setModal({
                                            isOpen: true,
                                            title: 'Erro',
                                            message: 'Falha ao atualizar avatar no servidor.',
                                            type: 'error'
                                        });
                                    } finally {
                                        setSaving(false);
                                    }
                                }
                            }}
                        />

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            {user?.nameFull || 'Nome do Usuário'}
                        </h2>

                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-semibold mb-2">
                            {user?.profileName || 'Cargo/Função'}
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {user?.teamName || 'Empresa / Equipe'}
                        </p>

                        <button
                            onClick={() => {
                                if (currentStatus === 'busy') {
                                    setModal({
                                        isOpen: true,
                                        title: 'Atenção',
                                        message: 'Você não pode alterar sua disponibilidade enquanto estiver com uma visita em andamento.',
                                        type: 'warning'
                                    });
                                    return;
                                }
                                setShowStatusModal(true);
                            }}
                            className={`mt-6 inline-flex items-center justify-center py-4 px-6 rounded-2xl transition-colors border group ${currentStatus === 'busy'
                                ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 cursor-not-allowed opacity-80'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3" id="availability-button">
                                <span className={`w-3 h-3 rounded-full ${statusConfig[currentStatus].color}`}></span>
                                <div className="text-left">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Estou</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                                        {statusConfig[currentStatus].label}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="px-5 space-y-8">


                    {/* Tab Navigation */}
                    <div className="sticky top-0 z-10 -mx-5 px-5 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800">
                        <div className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
                            {([
                                { id: 'personal' as const, icon: 'person', label: 'Dados' },
                                { id: 'org' as const, icon: 'business', label: 'Organização' },
                                { id: 'schedule' as const, icon: 'schedule', label: 'Jornada' },
                                { id: 'access' as const, icon: 'shield_person', label: 'Acesso' },
                                { id: 'tools' as const, icon: 'construction', label: 'Ferramentas' },
                            ]).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 py-3.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="pt-2">

                        {/* ── Dados Pessoais ── */}
                        {activeTab === 'personal' && (
                            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                                            Nome Completo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                                            Nome Curto (Apelido)
                                        </label>
                                        <input
                                            type="text"
                                            value={nameShort}
                                            onChange={(e) => setNameShort(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            placeholder="Como prefere ser chamado"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                                            E-mail <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                                            Telefone / Celular
                                        </label>
                                        <input
                                            type="tel"
                                            value={mobile}
                                            onChange={handleMobileChange}
                                            maxLength={15}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Organização ── */}
                        {activeTab === 'org' && (
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Empresa</label>
                                            <Select
                                                value={companyId}
                                                onChange={(e) => handleCompanyChange(e.target.value)}
                                                disabled={!isEditing || !isAdmin}
                                                className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                                options={companies.map(c => ({ value: c.id, label: c.name }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Equipe</label>
                                            <Select
                                                value={teamId}
                                                onChange={(e) => setTeamId(e.target.value)}
                                                disabled={!isEditing || !isAdmin}
                                                className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                                options={teams.map(t => ({ value: t.id, label: t.name }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Líder de Equipe</label>
                                            <div className="flex items-center justify-between h-10">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{isTeamLeader ? 'Sim' : 'Não'}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { if (isEditing && isAdmin) setIsTeamLeader(prev => !prev); }}
                                                    disabled={!isEditing || !isAdmin}
                                                    className={`relative h-7 w-12 rounded-full transition-colors ${isTeamLeader ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'} ${(!isEditing || !isAdmin) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    aria-pressed={isTeamLeader}
                                                    aria-label="Definir usuário como líder"
                                                >
                                                    <span className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isTeamLeader ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Veículo Atual</label>
                                            {(isEditing && (isOwner || isAdmin)) ? (
                                                <Select
                                                    value={currentVehicle?.id || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') { handleRemoveVehicle(); }
                                                        else {
                                                            const v = searchVehicleResults.find(vr => vr.id === val) || (currentVehicle?.id === val ? currentVehicle : null);
                                                            if (v) handleSelectVehicle(v);
                                                        }
                                                    }}
                                                    onSearchChange={(val) => setSearchVehicleQuery(val)}
                                                    className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                                    placeholder="Selecione um veículo..."
                                                    options={[
                                                        { value: '', label: 'Nenhum / Remover veículo' },
                                                        ...(currentVehicle && !searchVehicleResults.find(v => v.id === currentVehicle.id)
                                                            ? [{ value: currentVehicle.id, label: `${currentVehicle.plates} - ${currentVehicle.description}` }]
                                                            : []),
                                                        ...searchVehicleResults.map(v => ({ value: v.id, label: `${v.plates} - ${v.description}` }))
                                                    ]}
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {currentVehicle ? `${currentVehicle.plates} - ${currentVehicle.description}` : 'Nenhum veículo'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members Expandable */}
                                {(isOwner || isAdmin) && (
                                    <div className={`w-full bg-white dark:bg-card-dark rounded-2xl shadow-sm border transition-all ${isTeamExpanded ? 'border-primary ring-1 ring-primary' : 'border-slate-100 dark:border-slate-800'}`}>
                                        <button
                                            onClick={toggleTeamExpand}
                                            className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined">groups</span>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">MINHA EQUIPE</label>
                                                <div className="text-slate-900 dark:text-white font-bold text-sm truncate">
                                                    {teamMembers.length > 0
                                                        ? teamMembers.map(m => m.nameShort || m.nameFull?.split(' ')[0]).join(', ')
                                                        : 'Nenhum integrante'}
                                                </div>
                                            </div>
                                            <span className={`material-symbols-outlined text-slate-300 transition-transform duration-300 ${isTeamExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>
                                        {isTeamExpanded && (
                                            <div className="p-4 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800/50 animation-slide-down">
                                                <div className="relative mt-4">
                                                    <input
                                                        type="text"
                                                        value={searchTeamQuery}
                                                        onChange={(e) => setSearchTeamQuery(e.target.value)}
                                                        placeholder="Buscar usuário para adicionar..."
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[20px]">search</span>
                                                    {searchingTeam && <Loading size="xs" />}
                                                </div>
                                                {searchResults.length > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-semibold text-slate-400 uppercase px-1">Resultados da Busca</div>
                                                        {searchResults.map(result => (
                                                            <div key={result.uuid} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                                                <div className="flex items-center gap-3">
                                                                    <UserAvatar src={result.avatarUrl} name={result.nameFull || ''} size="xs" status={result.isAvailable ? (result.ovIdInProgress ? 'busy' : 'available') : 'unavailable'} className="w-8 h-8 rounded-full" />
                                                                    <div className="text-sm">
                                                                        <div className="font-bold text-slate-900 dark:text-white">{result.nameFull}</div>
                                                                        <div className="text-xs text-slate-500">{result.email}</div>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleAddMember(result)} className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Adicionar à equipe">
                                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="space-y-1 pt-2">
                                                    <div className="text-xs font-semibold text-slate-400 uppercase px-1 pb-1">Membros Atuais</div>
                                                    {teamMembers.length === 0 ? (
                                                        <div className="text-sm text-slate-500 italic px-2">Sua equipe está vazia.</div>
                                                    ) : (
                                                        teamMembers.map(member => (
                                                            <div key={member.uuid} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <UserAvatar src={member.avatarUrl} name={member.nameFull || member.nameShort || ''} size="xs" status={member.isAvailable ? (member.ovIdInProgress ? 'busy' : 'available') : 'unavailable'} className="w-8 h-8 rounded-full shadow-sm" />
                                                                    <div className="text-sm">
                                                                        <div className="font-medium text-slate-900 dark:text-white">{member.nameShort || member.nameFull}</div>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleRemoveMember(member)} className="w-8 h-8 flex items-center justify-center rounded-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Remover da equipe">
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Jornada ── */}
                        {activeTab === 'schedule' && (
                            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                                            <span className="material-symbols-outlined text-amber-500 text-[14px]">wb_twilight</span>
                                            Início do Turno
                                        </label>
                                        <input
                                            type="time"
                                            value={shiftStart}
                                            onChange={(e) => setShiftStart(e.target.value)}
                                            disabled={!isOwner && !isAdmin}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                                            <span className="material-symbols-outlined text-indigo-500 text-[14px]">bedtime</span>
                                            Término do Turno
                                        </label>
                                        <input
                                            type="time"
                                            value={shiftEnd}
                                            onChange={(e) => setShiftEnd(e.target.value)}
                                            disabled={!isOwner && !isAdmin}
                                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Acesso ── */}
                        {activeTab === 'access' && (
                            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Perfil de Acesso</label>
                                        <Select
                                            value={profileId}
                                            onChange={(e) => setProfileId(e.target.value)}
                                            disabled={!isAdmin}
                                            className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                            options={profiles.map(p => ({ value: p.id, label: p.description }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Situação / Status</label>
                                        <Select
                                            value={statusId}
                                            onChange={(e) => setStatusId(e.target.value)}
                                            disabled={!isAdmin}
                                            className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                            options={userStatuses.map(s => ({ value: s.id.toString(), label: s.description }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Ferramentas ── */}
                        {activeTab === 'tools' && (
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
                                                    {tool.date_start ? new Date(tool.date_start).toLocaleDateString('pt-BR') : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Form Footer */}
            {isEditing && (
                <div className="mt-8 mb-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <ButtonSave
                        onSave={async () => {
                            await handleSave();
                            setIsEditing(false);
                        }}
                        onCancel={() => setIsEditing(false)}
                        isSaving={saving}
                        saveLabel="Salvar Perfil"
                    />
                </div>
            )}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowStatusModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary">
                                        info
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                    Confirme sua nova Situação
                                </h3>
                            </div>

                            <button
                                onClick={() => handleStatusChange(oppositeStatus)}
                                disabled={isUpdatingStatus}
                                className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                            >
                                <div className={`w-4 h-4 ${statusConfig[oppositeStatus].color} rounded-full`}></div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                        {statusConfig[oppositeStatus].label}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {statusConfig[oppositeStatus].description}
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="w-full py-3 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

interface ProfileMenuItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon, title, subtitle, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
    >
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl">{icon}</span>
            <div>
                <span className={`font-medium block text-left ${variant === 'danger'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-700 dark:text-slate-200'
                    }`}>{title}</span>
                {subtitle && <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{subtitle}</span>}
            </div>
        </div>
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
    </button>
);
