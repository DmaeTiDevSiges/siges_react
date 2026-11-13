import React from 'react';
import { User } from '../../types';
import { UserAvatar } from '../ui/UserAvatar';
import { DataQualityIndicator } from '../ui/DataQualityIndicator';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ConnectionStrip } from '../offline/ConnectionStrip';
import { useUiVersion } from '../../contexts/UiVersionContext';

/**
 * Topo da home no visual novo (v2): bloco na cor da marca com avatar, saudação,
 * ocultar valores e notificações. Substitui o Header só na tela 'dashboard' com a
 * chave ligada (ver Layout). Telas internas continuam com o Header normal.
 */

interface HeroHeaderProps {
    currentUser?: Partial<User> | null;
    onProfileClick?: () => void;
    onNotificationsClick?: () => void;
    /** Ex.: badge de gamificação. */
    userLeftElement?: React.ReactNode;
    /** Ex.: modal de histórico de gamificação. */
    titleRightElement?: React.ReactNode;
}

type UserStatus = 'available' | 'unavailable' | 'busy';

const isTrue = (v: unknown) => v === true || v === 1 || v === 'true';

const getStatus = (u?: Partial<User> | null): UserStatus => {
    if (!u) return 'unavailable';
    if (isTrue(u.isAvailable ?? (u as any).is_available)) return 'available';
    if (isTrue(u.isOvInProgress ?? (u as any).is_ov_in_progress)) return 'busy';
    return 'unavailable';
};

const STATUS_LABEL: Record<UserStatus, string> = {
    available: 'Disponível',
    busy: 'Em atendimento',
    unavailable: 'Indisponível',
};

const STATUS_DOT: Record<UserStatus, string> = {
    available: 'bg-green-400',
    busy: 'bg-amber-300',
    unavailable: 'bg-white/50',
};

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
};

export const HeroHeader: React.FC<HeroHeaderProps> = ({
    currentUser,
    onProfileClick,
    onNotificationsClick,
    userLeftElement,
    titleRightElement,
}) => {
    const { isConnected: rawConnected, isLoading: networkLoading } = useNetworkStatus();
    const isConnected = rawConnected || networkLoading;
    const { hideValues, toggleHideValues } = useUiVersion();

    const status = getStatus(currentUser);
    const firstName = (currentUser?.nameFull || '').trim().split(/\s+/)[0] || '';
    const notifications = currentUser?.notificationsAmount || 0;

    const iconBtn = 'relative w-11 h-11 flex items-center justify-center rounded-full text-on-hero hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

    return (
        <header className="sticky top-0 z-20 bg-hero text-on-hero">
            <div className="px-4 pt-3 pb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {currentUser && (
                            <button
                                type="button"
                                onClick={onProfileClick}
                                className="rounded-full cursor-pointer active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                aria-label="Abrir perfil"
                            >
                                <UserAvatar
                                    src={currentUser.avatarUrl}
                                    name={currentUser.nameFull || 'Usuário'}
                                    size="md"
                                    status={status}
                                    isOvInProgress={currentUser.isOvInProgress}
                                    className="w-12 h-12"
                                />
                            </button>
                        )}
                        {userLeftElement}
                        {titleRightElement}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={toggleHideValues}
                            className={iconBtn}
                            aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
                            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                {hideValues ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={onNotificationsClick}
                            className={iconBtn}
                            aria-label="Notificações"
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            {notifications > 0 && (
                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {notifications > 99 ? '99+' : notifications}
                                </span>
                            )}
                        </button>
                        <span className="ml-1 rounded-full bg-white/90 p-0.5">
                            <DataQualityIndicator size="small" showDetails={false} isConnected={isConnected} />
                        </span>
                    </div>
                </div>

                <h1 className="mt-5 text-title">
                    {greeting()}{firstName ? `, ${firstName}` : ''}
                </h1>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-label">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                    {STATUS_LABEL[status]}
                </div>
            </div>

            <ConnectionStrip isConnected={isConnected} />
        </header>
    );
};
