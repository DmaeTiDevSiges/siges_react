import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Company, User } from '../types';
import { getInitials } from '../utils/formatters';

const getRelativeTimeShort = (isoString?: string): string => {
    if (!isoString) return '·';
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff) || diff < 0) return 'agora';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
};

interface UsersTeamsLeadersByCompanyIdProps {
    companyId: string;
    onUserClick?: (userId: string) => void;
    pinnedUserIds?: Set<string>;
    className?: string;
    titleContent?: React.ReactNode;
}

export const UsersTeamsLeadersByCompanyId: React.FC<UsersTeamsLeadersByCompanyIdProps> = ({ 
    companyId, 
    onUserClick, 
    pinnedUserIds = new Set(),
    className = '',
    titleContent
}) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [leaders, setLeaders] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadData = async (showLoading = true) => {
            if (showLoading) setIsLoading(true);
            try {
                const [companyData, leadersData] = await Promise.all([
                    dataService.getCompanyById(companyId),
                    dataService.getLeadersByCompany(companyId)
                ]);
                
                if (!cancelled) {
                    setCompany(companyData);
                    setLeaders(leadersData);
                }
            } catch (error) {
                console.error("Erro ao carregar dados da empresa e líderes:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        if (companyId) {
            loadData();

            // Realtime subscription for user changes (availability, visits, etc.)
            const userSub = dataService.subscribeToUsers(() => {
                dataService.clearMetadataCache();
                loadData(false);
            });

            // Realtime subscription for visit changes (affects leader availability)
            const visitSub = dataService.subscribeToOrdersVisits(() => {
                dataService.clearMetadataCache();
                loadData(false);
            });

            // Periodic polling fallback (every 30s) in case Realtime is not enabled
            const pollingInterval = setInterval(() => {
                loadData(false);
            }, 30000);

            return () => {
                cancelled = true;
                userSub.unsubscribe();
                visitSub.unsubscribe();
                clearInterval(pollingInterval);
            };
        }

        return () => { cancelled = true; };
    }, [companyId]);

    if (isLoading) {
        return (
            <div className={`bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl px-3 py-2 animate-pulse w-fit max-w-full ${className}`}>
                <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-2"></div>
                <div className="flex gap-2 pb-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full bg-slate-700"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!company) {
        return null;
    }

    return (
        <div className={`bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl px-3 shadow-lg border border-white/10 w-fit max-w-full ${className}`}>
            {titleContent && (
                <div className="flex items-center justify-between gap-2 py-1.5 px-0.5 select-none w-full">
                    {titleContent}
                </div>
            )}
            <div className="flex items-center gap-2 py-1 px-0.5 overflow-x-auto no-scrollbar">
                {/* Avatares dos técnicos */}
                {leaders.length === 0 ? (
                    <div className="text-[10px] text-white/50 italic px-1">Nenhum líder encontrado</div>
                ) : (
                    leaders.map(tech => {
                        const hasAvatar = tech.avatarUrl && !tech.avatarUrl.includes('noImageUser.png');
                        const initials = getInitials(tech.nameShort || tech.nameFull || '');
                        const isPinned = pinnedUserIds.has(tech.id);

                        const statusBorderColors = {
                            available: '#22C55E',
                            busy: '#EF4444',
                            unavailable: '#64748B'
                        };

                        let userStatus: 'available' | 'busy' | 'unavailable' = 'unavailable';
                        if (tech.isAvailable) {
                            userStatus = (tech.ovIdInProgress && Number(tech.ovIdInProgress) > 0) ? 'busy' : 'available';
                        }

                        const statusColor = statusBorderColors[userStatus];

                        return (
                            <button
                                key={tech.id}
                                title={`${tech.nameShort || 'Técnico'} — ${userStatus === 'busy' ? 'Em atividade' : userStatus === 'available' ? 'Disponível' : 'Indisponível'}`}
                                onClick={() => onUserClick?.(tech.id)}
                                className="shrink-0 flex flex-col items-center gap-0.5 transition-all cursor-pointer group py-1"
                            >
                                {/* Borda de status separada do overflow-hidden */}
                                <div
                                    className={`rounded-full transition-all ${
                                        isPinned ? 'p-[5px] scale-110' : 'p-[2.5px] group-hover:scale-105'
                                    }`}
                                    style={{ background: statusColor }}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                                        {hasAvatar ? (
                                            <img src={tech.avatarUrl} alt={tech.nameShort} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[7px] font-semibold text-white/70 truncate max-w-[36px] leading-tight">
                                        {(tech.nameShort || '').split(' ')[0]}
                                    </span>
                                    <span className="text-[6px] text-white/40 font-medium leading-none mt-0.5">
                                        {getRelativeTimeShort(tech.trackerHeartbeatAt)}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};
