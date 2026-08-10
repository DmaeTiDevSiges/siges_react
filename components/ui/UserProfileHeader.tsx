import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { User } from '../../types';
import { toast } from 'sonner';
import { UserAvatar } from './UserAvatar';
import { CompanyAvatar } from './CompanyAvatar';

interface UserProfileHeaderProps {
    currentUser: Partial<User> | null;
    onProfileClick?: () => void;
    onNotificationsClick?: () => void;
    onStatusChange?: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>;
}

type UserStatus = 'available' | 'unavailable' | 'busy';

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
    currentUser,
    onProfileClick,
    onNotificationsClick,
    onStatusChange
}) => {
    if (!currentUser) return null;
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);

    // Mock de notificações não lidas
    const unreadCount = 3;

    // Gerar iniciais para fallback
    const getInitials = (name?: string) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Determinar status atual baseado em isAvailable e ovIdInProgress
    const getCurrentStatus = (): UserStatus => {
        if (currentUser.isAvailable && currentUser.ovIdInProgress) {
            return 'busy';
        }
        return currentUser.isAvailable ? 'available' : 'unavailable';
    };

    const currentStatus = getCurrentStatus();

    // Configuração de cores e textos por status
    const statusConfig = {
        available: {
            color: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
            label: 'Disponível',
            description: 'Aguardando chamados'
        },
        unavailable: {
            color: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]',
            label: 'Indisponível',
            description: 'Não disponível para atendimento'
        },
        busy: {
            color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
            label: 'Em Atividade',
            description: 'Atendimento em andamento'
        }
    };

    // Retorna a opção oposta ao status atual (ignora 'busy' na alternância manual simples por enquanto, ou trata como disponível -> indisponível)
    const getOppositeStatus = (): UserStatus => {
        // Se estiver em atividade, o toggle manual provavelmente pausa (indisponível) ou mantém. 
        // Assumindo que o toggle manual alterna entre Disponível e Indisponível.
        if (currentStatus === 'busy') return 'unavailable';
        return currentStatus === 'available' ? 'unavailable' : 'available';
    };

    const handleStatusClick = () => {
        setShowStatusModal(true);
    };

    const handleStatusChange = async (newStatus: UserStatus) => {
        if (!onStatusChange) return;

        setIsUpdating(true);
        try {
            // A lógica de "Em Atividade" depende do ovIdInProgress, que não é setado aqui manualmente.
            // Aqui alternamos apenas a flag de disponibilidade.
            const isAvailable = newStatus === 'available';
            // Mantém o ovIdInProgress atual se existir, ou zera? 
            // A regra diz: Disponível = isAvailable true e ovId=0. 
            // Se o usuário clicar em "Disponível", a intenção é ficar livre para ovId=0?
            // Por segurança, vamos apenas alternar o isAvailable. O sistema gerencia o ovId.

            await onStatusChange(isAvailable, currentUser.ovIdInProgress || null);
            setShowStatusModal(false);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status. Tente novamente.');
        } finally {
            setIsUpdating(false);
        }
    };

    const oppositeStatus = getOppositeStatus();

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const fetchCompanyLogo = async () => {
            if (currentUser.companyId) {
                const company = await dataService.getCompanyById(currentUser.companyId);
                if (company) {
                    setCompanyLogo(company.logoUrl);
                }
            }
        };
        fetchCompanyLogo();
    }, [currentUser.companyId]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            <div className="sticky top-0 z-20 bg-surface-light dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 rounded-b-[12px]">
                <div className="flex items-center justify-between px-4 py-3 min-h-[60px]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleStatusClick}
                            className="relative hover:opacity-80 transition-opacity"
                        >
                            <UserAvatar
                                src={currentUser.avatarUrl}
                                name={currentUser.nameFull || 'Usuário'}
                                size="md"
                                status={currentStatus}
                                isOvInProgress={currentUser.ovIdInProgress ? true : false}
                                className="border-2 border-white dark:border-card-dark shadow-sm"
                            />
                        </button>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {currentUser.nameShort || currentUser.nameFull || 'Usuário'}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[currentStatus].color}`}></span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {statusConfig[currentStatus].label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Company Avatar */}
                        {companyLogo && (
                            <CompanyAvatar
                                src={companyLogo}
                                name="Empresa"
                                size="md"
                                className="shadow-sm border-2 border-white dark:border-card-dark"
                            />
                        )}

                        {/* Connection Status Indicator - Only shows when offline */}
                        {!isOnline && (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 animate-pulse transition-all" title="Sem conexão com a internet">
                                <span className="material-symbols-outlined text-red-500 text-lg">
                                    signal_wifi_off
                                </span>
                            </div>
                        )}

                        {(currentUser.notificationsAmount || 0) > 0 && (
                            <button
                                onClick={onNotificationsClick}
                                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowStatusModal(false)}
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            {/* Icon & Title */}
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

                            {/* Status Option Button */}
                            <button
                                onClick={() => handleStatusChange(oppositeStatus)}
                                disabled={isUpdating}
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

                            {/* Cancel Button */}
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
        </>
    );
};
