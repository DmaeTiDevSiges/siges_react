
import React from 'react';
import { IconButton } from '../ui/IconButton';
import { User } from '../../types';
import { useState } from 'react';
import { getInitials } from '../../utils/formatters';
import { toast } from 'sonner';
import { Avatar } from '../ui/Avatar';
import { CompanyAvatar } from '../ui/CompanyAvatar';
import { UserAvatar } from '../ui/UserAvatar';
import { DataQualityIndicator } from '../ui/DataQualityIndicator';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useNotificationArrival } from '../../hooks/useNotificationArrival';
import { ConnectionStrip } from '../offline/ConnectionStrip';

interface HeaderProps {
    title: string;
    onMenuClick?: () => void;
    showBackButton?: boolean;
    onBackClick?: () => void;
    currentUser?: Partial<User> | null;
    onStatusChange?: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>;
    onNotificationsClick?: () => void;
    onProfileClick?: () => void;
    subtitle?: string;
    rightAction?: React.ReactNode;
    userLeftElement?: React.ReactNode;
    tabNavigation?: React.ReactNode;
    hideBorder?: boolean;
    titleRightElement?: React.ReactNode;
}

type UserStatus = 'available' | 'unavailable' | 'busy';

export const Header: React.FC<HeaderProps> = ({
    title,
    onMenuClick,
    showBackButton,
    onBackClick,
    currentUser,
    onStatusChange,
    onNotificationsClick,
    onProfileClick,
    subtitle,
    rightAction,
    userLeftElement,
    tabNavigation,
    hideBorder,
    titleRightElement
}) => {
    const { isConnected: rawConnected, isLoading: networkLoading } = useNetworkStatus();
    // Antes do networkService inicializar o estado é "desconectado": não pinta de vermelho na abertura.
    const isConnected = rawConnected || networkLoading;
    const arrival = useNotificationArrival();

    // Determinar status atual baseado em isAvailable e isOvInProgress
    const getCurrentStatus = (): UserStatus => {
        if (!currentUser) return 'unavailable';

        // available: is_available = true
        const isAvailable = currentUser.isAvailable || (currentUser as any).is_available;
        if (isAvailable === true || isAvailable === 1 || isAvailable === 'true') {
            return 'available';
        }

        // busy: is_available = false e is_ov_in_progress = true
        const isInProgress = currentUser.isOvInProgress || (currentUser as any).is_ov_in_progress;
        if (isInProgress === true || isInProgress === 1 || isInProgress === 'true') {
            return 'busy';
        }

        // unavailable: is_available = false e is_ov_in_progress = false
        return 'unavailable';
    };

    const currentStatus = getCurrentStatus();



    return (
        <header className={`flex flex-col bg-surface-light dark:bg-card-dark sticky top-0 z-20 ${!isConnected ? 'border-b-2 border-red-500' : hideBorder ? '' : 'border-b border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center px-4 py-2.5 justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {showBackButton && (
                    <IconButton
                        icon="arrow_back"
                        onClick={onBackClick}
                        variant="ghost"
                        size="sm"
                        className="mr-1 mt-1 text-slate-700 dark:text-slate-300"
                    />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                    {!tabNavigation ? (
                        <>
                            <div className="flex items-center gap-2">
                                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight truncate">
                                    {title}
                                </h1>
                                {titleRightElement}
                            </div>
                            {subtitle && (
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                            <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono leading-none mt-0.5 select-all">
                                SIGES v{__BUILD_ID__}
                            </span>
                        </>
                    ) : (
                        tabNavigation
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {currentUser && (
                    <>
                        <button
                            onClick={onProfileClick}
                            className="relative hover:opacity-80 transition-opacity active:scale-95"
                        >
                            <UserAvatar
                                src={currentUser.avatarUrl}
                                name={currentUser.nameFull || 'Usuário'}
                                size="md"
                                status={currentStatus}
                                isOvInProgress={currentUser.isOvInProgress}
                                className="shadow-sm w-[48px] h-[48px]"
                            />
                        </button>
                        {userLeftElement}

                        {(currentUser.notificationsAmount || 0) > 0 && (
                            <button
                                onClick={onNotificationsClick}
                                className="relative flex items-center justify-center w-[44px] h-[44px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                {/* Chegada de notificação: avatar do remetente no lugar do logo por 3 s */}
                                <img
                                    key={arrival?.avatarUrl ? `logo-${arrival.key}` : 'logo'}
                                    src="/siges_logo.png"
                                    alt="Siges"
                                    className={`w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity ${arrival?.avatarUrl ? 'animate-notif-logo-out' : ''}`}
                                />
                                {arrival?.avatarUrl && (
                                    <img
                                        key={`avatar-${arrival.key}`}
                                        src={arrival.avatarUrl}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-0 w-full h-full rounded-full object-cover ring-2 ring-primary pointer-events-none animate-notif-avatar"
                                    />
                                )}
                                <span className="sr-only" aria-live="polite">{arrival ? 'Nova notificação' : ''}</span>
                                <span
                                    key={arrival && !arrival.avatarUrl ? `badge-${arrival.key}` : 'badge'}
                                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-background-dark px-1 ${arrival && !arrival.avatarUrl ? 'animate-notif-badge' : ''}`}
                                >
                                    {currentUser.notificationsAmount}
                                </span>
                            </button>
                        )}
                    </>
                )}

                {rightAction}

                {/* Indicador de qualidade de dados */}
                <DataQualityIndicator
                    size="small"
                    showDetails={false}
                    className="mr-2"
                    isConnected={isConnected}
                />

                {onMenuClick && (
                    <IconButton
                        icon="menu"
                        onClick={onMenuClick}
                        className="text-slate-900 dark:text-white"
                    />
                )}
            </div>
          </div>

            {/* Modo offline: faixa de conexão / fila (some quando online e fila vazia) */}
            <ConnectionStrip isConnected={isConnected} />
        </header>
    );
};
