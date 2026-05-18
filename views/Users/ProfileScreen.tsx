
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { dataService } from '../../services/dataService';
import { User, Profile, Permission, Vehicle, Company, Team } from '../../types';
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
    const [loading, setLoading] = useState(!initialUser);
    const [saving, setSaving] = useState(false);
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
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<import('../../types').Company[]>([]);
    const [teams, setTeams] = useState<import('../../types').Team[]>([]);
    const [shiftStart, setShiftStart] = useState('08:00');
    const [shiftEnd, setShiftEnd] = useState('18:00');
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
            setShiftStart(initialUser.shiftStart?.slice(0, 5) || '08:00');
            setShiftEnd(initialUser.shiftEnd?.slice(0, 5) || '18:00');

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
                        setShiftStart(currentUserToEdit.shiftStart?.slice(0, 5) || '08:00');
                        setShiftEnd(currentUserToEdit.shiftEnd?.slice(0, 5) || '18:00');

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

            await dataService.updateProfile(user.uuid, {
                nameFull: name,
                nameShort: nameShort,
                email: email,
                mobile: mobileClean,
                avatarUrl: avatarUrl,
                profileId: profileId || undefined,
                teamId: teamId || undefined,
                companyId: companyId || undefined,
                shiftStart: shiftStart,
                shiftEnd: shiftEnd
            });

            if (onUserUpdate) {
                const selectedProfile = profiles.find(p => p.id.toString() === profileId);
                const selectedTeam = teams.find(t => t.id.toString() === teamId);
                const selectedCompany = companies.find(c => c.id.toString() === companyId);

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
                    shiftStart: shiftStart,
                    shiftEnd: shiftEnd
                } as User);
            }

            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Perfil atualizado com sucesso!',
                type: 'success'
            });
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
            await onStatusChange(isAvailable, user.ovIdInProgress || '');

            // Update local user state
            setUser(prev => prev ? { ...prev, isAvailable, ovIdInProgress: user.ovIdInProgress || '' } : null);

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
            <div className="pb-32 space-y-8 relative">
                <div className="relative bg-white dark:bg-card-dark pb-8 pt-10 px-5 rounded-b-4xl shadow-sm border-b border-slate-200 dark:border-slate-800">

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
                            <button
                                onClick={() => setShowCamera(true)}
                                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-dark transition-colors border-2 border-white dark:border-card-dark"
                                title="Capturar Selfie"
                            >
                                <span className="material-symbols-outlined text-sm">photo_camera</span>
                            </button>
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
                                            
                                            await dataService.updateProfile(user.uuid, {
                                                avatarUrl: imgData
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
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white mb-1">142</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Serviços</span>
                        </div>
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-blue-500 mb-1">4.8</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avaliação</span>
                        </div>
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white mb-1">5</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Anos</span>
                        </div>
                    </div>

                    {/* Personal Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">
                            Dados Pessoais
                        </h3>

                        {/* Name Card */}
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isOwner && !isAdmin}
                                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>

                        {/* Short Name Card */}
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">label</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Nome Curto (Apelido)</label>
                                <input
                                    type="text"
                                    value={nameShort}
                                    onChange={(e) => setNameShort(e.target.value)}
                                    disabled={!isOwner && !isAdmin}
                                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Como prefere ser chamado"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">
                            Informações de Contato
                        </h3>

                        {/* Email Card (Editable via simple input for now) */}
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">mail</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!isOwner && !isAdmin}
                                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>

                        {/* Phone Card */}
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">call</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Telefone</label>
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={handleMobileChange}
                                    maxLength={15}
                                    disabled={!isOwner && !isAdmin}
                                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>


                    </div>

                    {/* Organization Section (Admin only or always informative) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">
                            Organização
                        </h3>

                        <div className="space-y-3">
                            {/* Company Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">business</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Empresa</label>
                                    <Select
                                        value={companyId}
                                        onChange={(e) => handleCompanyChange(e.target.value)}
                                        disabled={!isAdmin}
                                        className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                        options={companies.map(c => ({ value: c.id, label: c.name }))}
                                    />
                                </div>
                            </div>
                            {/* Team Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">groups</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Equipe</label>
                                    <Select
                                        value={teamId}
                                        onChange={(e) => setTeamId(e.target.value)}
                                        disabled={!isAdmin}
                                        className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                        options={teams.map(t => ({ value: t.id, label: t.name }))}
                                    />
                                </div>
                            </div>

                            {/* Current Vehicle Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-slate-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">directions_car</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Veículo Atual</label>
                                    {(isOwner || isAdmin) ? (
                                        <Select
                                            value={currentVehicle?.id || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    handleRemoveVehicle();
                                                } else {
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
                                        <span className="text-slate-900 dark:text-white font-medium text-sm">
                                            {currentVehicle ? `${currentVehicle.plates} - ${currentVehicle.description}` : 'Nenhum veículo'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Team Members Card (Expandable) - only for owner or admin */}
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

                                    {/* Expanded Content */}
                                    {isTeamExpanded && (
                                        <div className="p-4 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800/50 animation-slide-down">

                                            {/* Search Bar */}
                                            <div className="relative mt-4">
                                                <input
                                                    type="text"
                                                    value={searchTeamQuery}
                                                    onChange={(e) => setSearchTeamQuery(e.target.value)}
                                                    placeholder="Buscar usuário para adicionar..."
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[20px]">search</span>
                                                {searchingTeam && (
                                                    <Loading size="xs" />
                                                )}
                                            </div>

                                            {/* Search Results */}
                                            {searchResults.length > 0 && (
                                                <div className="space-y-1">
                                                    <div className="text-xs font-semibold text-slate-400 uppercase px-1">Resultados da Busca</div>
                                                    {searchResults.map(result => (
                                                        <div key={result.uuid} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar
                                                                    src={result.avatarUrl}
                                                                    name={result.nameFull || ''}
                                                                    size="xs"
                                                                    status={result.isAvailable ? (result.ovIdInProgress ? 'busy' : 'available') : 'unavailable'}
                                                                    className="w-8 h-8 rounded-full"
                                                                />
                                                                <div className="text-sm">
                                                                    <div className="font-bold text-slate-900 dark:text-white">{result.nameFull}</div>
                                                                    <div className="text-xs text-slate-500">{result.email}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddMember(result)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                                                title="Adicionar à equipe"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Current Members List (Detailed) */}
                                            <div className="space-y-1 pt-2">
                                                <div className="text-xs font-semibold text-slate-400 uppercase px-1 pb-1">Membros Atuais</div>
                                                {teamMembers.length === 0 ? (
                                                    <div className="text-sm text-slate-500 italic px-2">Sua equipe está vazia.</div>
                                                ) : (
                                                    teamMembers.map(member => (
                                                        <div key={member.uuid} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group/member">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar
                                                                    src={member.avatarUrl}
                                                                    name={member.nameFull || member.nameShort || ''}
                                                                    size="xs"
                                                                    status={member.isAvailable ? (member.ovIdInProgress ? 'busy' : 'available') : 'unavailable'}
                                                                    className="w-8 h-8 rounded-full shadow-sm"
                                                                />
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-slate-900 dark:text-white">{member.nameShort || member.nameFull}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMember(member)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                                title="Remover da equipe"
                                                            >
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
                    </div>

                    {/* Shift Management Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">
                            Turno de Trabalho
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Shift Start Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">wb_twilight</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Início</label>
                                    <input
                                        type="time"
                                        value={shiftStart}
                                        onChange={(e) => setShiftStart(e.target.value)}
                                        disabled={!isOwner && !isAdmin}
                                        className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            {/* Shift End Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">bedtime</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Término</label>
                                    <input
                                        type="time"
                                        value={shiftEnd}
                                        onChange={(e) => setShiftEnd(e.target.value)}
                                        disabled={!isOwner && !isAdmin}
                                        className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white font-medium focus:ring-0 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Access Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">
                            Acesso
                        </h3>

                        <div className="space-y-3">
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">assignment_ind</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-0.5">Perfil</label>
                                    <Select
                                        value={profileId}
                                        onChange={(e) => setProfileId(e.target.value)}
                                        disabled={!isAdmin}
                                        className="border-none p-0! h-auto! shadow-none focus:ring-0"
                                        options={profiles.map(p => ({ value: p.id, label: p.description }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-12">
                        <ButtonSave
                            onSave={handleSave}
                            onCancel={onBack}
                            isSaving={saving}
                            saveLabel="Salvar Perfil"
                        />
                    </div>
                </div>
            </div>

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
