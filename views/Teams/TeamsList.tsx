import React, { useState, useEffect } from 'react';
import { Team } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { IconButton } from '../../components/ui/IconButton';

interface TeamsListProps {
    departmentId?: string;
    onSelect?: (team: Team) => void;
    onAddTeam?: () => void;
}

export const TeamsList: React.FC<TeamsListProps> = ({ departmentId, onSelect, onAddTeam }) => {
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const data = departmentId
                    ? await dataService.getTeamsByDepartment(departmentId)
                    : await dataService.getTeams();
                setTeams(data);
            } catch (error) {
                console.error('Failed to load teams', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, [departmentId]);

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando equipes...</div>;
    }

    return (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar equipe..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {onAddTeam && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAddTeam}
                            title="Adicionar Equipe"
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
                {filteredTeams.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhuma equipe encontrada.
                    </div>
                ) : (
                    filteredTeams.slice(0, visibleCount).map(team => (
                        <div
                            key={team.id}
                            onClick={() => onSelect?.(team)}
                            className={`group flex items-center p-4 bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all ${onSelect ? 'hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer' : ''}`}
                        >
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                            {team.name}
                                        </h3>
                                    </div>
                                    <StatusBadge status={team.status} size="sm" />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[16px]">badge</span>
                                        <span>{team.code}</span>
                                        {team.departmentName && (
                                            <>
                                                <span>•</span>
                                                <span>{team.departmentName}</span>
                                            </>
                                        )}
                                        {team.companyName && (
                                            <>
                                                <span>•</span>
                                                <span>{team.companyName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {onSelect && (
                                <div className="ml-2 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                                </div>
                            )}
                        </div>
                    ))
                )}

                <LoadMore
                    current={Math.min(visibleCount, filteredTeams.length)}
                    total={filteredTeams.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
};
