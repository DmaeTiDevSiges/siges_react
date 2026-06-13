import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Company, User } from '../types';
import { getInitials } from '../utils/formatters';

interface UsersTeamsLeadersByCompanyIdProps {
    companyId: string;
    onUserClick?: (userId: string) => void;
    pinnedUserIds?: Set<string>;
    className?: string;
}

export const UsersTeamsLeadersByCompanyId: React.FC<UsersTeamsLeadersByCompanyIdProps> = ({ 
    companyId, 
    onUserClick, 
    pinnedUserIds = new Set(),
    className = ''
}) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [leaders, setLeaders] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [companyData, leadersData] = await Promise.all([
                    dataService.getCompanyById(companyId),
                    dataService.getLeadersByCompany(companyId)
                ]);
                
                setCompany(companyData);
                setLeaders(leadersData);
            } catch (error) {
                console.error("Erro ao carregar dados da empresa e líderes:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (companyId) {
            loadData();
        }
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
        <div className={`bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-white/10 w-fit max-w-full ${className}`}>
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Company avatar/logo */}
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-700 border border-white/20">
                        {company.logoUrl && !company.logoUrl.includes('placeholder') ? (
                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-white/70 text-sm flex items-center justify-center w-full h-full">apartment</span>
                        )}
                    </div>
                    <span className="text-[11px] font-bold text-white/90 truncate uppercase">{company.name}</span>
                </div>
                <span className="material-symbols-outlined text-white/50 text-sm">location_on</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
                {leaders.length === 0 ? (
                    <div className="text-[10px] text-white/50 italic py-2">Nenhum líder encontrado</div>
                ) : (
                    leaders.map(tech => {
                        const hasAvatar = tech.avatarUrl && !tech.avatarUrl.includes('noImageUser.png');
                        const initials = getInitials(tech.nameShort || tech.nameFull || '');
                        const isPinned = pinnedUserIds.has(tech.id);

                        const statusBorderColors = {
                            available: '#22C55E', // Green
                            busy: '#EF4444',      // Red
                            unavailable: '#64748B' // Grey
                        };
                        
                        let userStatus: 'available' | 'busy' | 'unavailable' = 'unavailable';
                        if (tech.isAvailable) {
                            if (tech.ovIdInProgress && Number(tech.ovIdInProgress) > 0) {
                                userStatus = 'busy';
                            } else {
                                userStatus = 'available';
                            }
                        }

                        const statusColor = statusBorderColors[userStatus];

                        return (
                            <button
                                key={tech.id}
                                title={`${tech.nameShort || 'Técnico'} — ${userStatus === 'busy' ? 'Em atividade' : userStatus === 'available' ? 'Disponível' : 'Indisponível'}`}
                                onClick={() => onUserClick?.(tech.id)}
                                className="shrink-0 flex flex-col items-center gap-1 transition-all cursor-pointer group"
                            >
                                {/* Wrapper com a borda de status — separado do overflow-hidden para não clipar a borda */}
                                <div
                                    className={`rounded-full transition-all ${
                                        isPinned ? 'p-[5px] scale-110' : 'p-[2.5px] group-hover:scale-105'
                                    }`}
                                    style={{
                                        background: statusColor,
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                                        {hasAvatar ? (
                                            <img src={tech.avatarUrl} alt={tech.nameShort} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-300">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[8px] font-semibold text-white/70 dark:text-white/50 truncate max-w-[42px]">
                                    {(tech.nameShort || '').split(' ')[0]}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};
