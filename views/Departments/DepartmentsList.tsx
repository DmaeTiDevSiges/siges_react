import React, { useState, useEffect } from 'react';
import { Department, Team } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { Modal } from '../../components/ui/Modal';
import { IconButton } from '../../components/ui/IconButton';

interface DepartmentsListProps {
    companyId?: string;
    onSelect?: (department: Department) => void;
    onAddDepartment?: () => void;
    onSelectTeam?: (team: Team) => void;
    onAddTeam?: (departmentId: string) => void;
    onDeleteTeam?: (teamId: string) => void;
}

interface DepartmentNode extends Department {
    children: DepartmentNode[];
    teams?: Team[];
    teamCount?: number;
}

export const DepartmentsList: React.FC<DepartmentsListProps> = ({
    companyId,
    onSelect,
    onAddDepartment,
    onSelectTeam,
    onAddTeam,
    onDeleteTeam
}) => {
    const [search, setSearch] = useState(() => localStorage.getItem(`dept_search_${companyId || 'global'}`) || '');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`dept_expanded_nodes_${companyId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`dept_expanded_teams_${companyId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const [deleteTeamModal, setDeleteTeamModal] = useState<{ isOpen: boolean; team: Team | null }>({
        isOpen: false,
        team: null
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        localStorage.setItem(`dept_search_${companyId || 'global'}`, val);
    };

    const updateExpandedNodes = (newSet: Set<string>) => {
        setExpandedNodes(newSet);
        localStorage.setItem(`dept_expanded_nodes_${companyId || 'global'}`, JSON.stringify(Array.from(newSet)));
    };

    const updateExpandedTeams = (newSet: Set<string>) => {
        setExpandedTeams(newSet);
        localStorage.setItem(`dept_expanded_teams_${companyId || 'global'}`, JSON.stringify(Array.from(newSet)));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data for companyId:', companyId);
                const [deptData, teamsData] = await Promise.all([
                    companyId
                        ? dataService.getDepartmentsByCompany(companyId)
                        : dataService.getDepartments(),
                    dataService.getTeams()
                ]);

                console.log('Departments loaded:', deptData);
                console.log('Teams loaded:', teamsData);

                setDepartments(deptData);
                setAllTeams(teamsData);

                // Auto-expand all department nodes initially IF NO SAVED STATE
                if (!localStorage.getItem(`dept_expanded_nodes_${companyId || 'global'}`)) {
                    const allIds = new Set<string>(deptData.map(d => d.id));
                    updateExpandedNodes(allIds);
                }
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId]);

    // Toggle expand/collapse for sub-departments
    const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set<string>(expandedNodes);
        if (newSet.has(nodeId)) {
            newSet.delete(nodeId);
        } else {
            newSet.add(nodeId);
        }
        updateExpandedNodes(newSet);
    };

    // Toggle expand/collapse for teams section
    const toggleTeamsExpand = (deptId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set<string>(expandedTeams);
        if (newSet.has(deptId)) {
            newSet.delete(deptId);
        } else {
            newSet.add(deptId);
        }
        updateExpandedTeams(newSet);
    };

    // Build tree structure
    const buildTree = (departments: Department[]): DepartmentNode[] => {
        const map = new Map<string, DepartmentNode>();
        const roots: DepartmentNode[] = [];

        // Initialize all nodes with team count
        departments.forEach(dept => {
            const teams = allTeams.filter(t => t.departmentId === dept.id);
            map.set(dept.id, {
                ...dept,
                children: [],
                teams,
                teamCount: teams.length
            });
        });

        // Build relationships
        departments.forEach(dept => {
            const node = map.get(dept.id)!;
            if (dept.parentId && map.has(dept.parentId)) {
                map.get(dept.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    // Filter departments based on search
    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
    );

    const departmentTree = buildTree(filteredDepartments);

    // Recursive render function
    const renderDepartmentNode = (node: DepartmentNode, level: number = 0) => {
        const indent = level * 20;
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const isTeamsExpanded = expandedTeams.has(node.id);
        const teamCount = node.teamCount || 0;

        return (
            <React.Fragment key={node.id}>
                <div
                    className={`group bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all`}
                    style={{ marginLeft: `${indent}px` }}
                >
                    {/* Department Header */}
                    <div
                        onClick={() => onSelect?.(node)}
                        className={`flex items-center p-4 ${onSelect ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer rounded-2xl' : ''}`}
                    >
                        {/* Expand/Collapse button for sub-departments */}
                        {hasChildren && (
                            <button
                                onClick={(e) => toggleExpand(node.id, e)}
                                className="mr-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[20px]">
                                    {isExpanded ? 'expand_more' : 'chevron_right'}
                                </span>
                            </button>
                        )}

                        {level > 0 && !hasChildren && (
                            <div className="mr-3 flex items-center">
                                <div className="h-px w-4 bg-slate-300 dark:bg-slate-600" />
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">subdirectory_arrow_right</span>
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    {node.name}
                                </h3>
                                <StatusBadge status={node.status} size="sm" />
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[16px]">badge</span>
                                    <span>{node.code}</span>
                                    <span>•</span>
                                    <button
                                        onClick={(e) => toggleTeamsExpand(node.id, e)}
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                        <span>{teamCount} Equipe{teamCount !== 1 ? 's' : ''}</span>
                                        <span className="material-symbols-outlined text-[16px]">
                                            {isTeamsExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                    {node.companyName && (
                                        <>
                                            <span>•</span>
                                            <span>{node.companyName}</span>
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

                    {/* Teams Section (Expandable) */}
                    {isTeamsExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl">
                            <div className="p-4 space-y-2">
                                {teamCount === 0 ? (
                                    <div className="text-center py-4 text-slate-400 text-sm">
                                        Nenhuma equipe neste departamento
                                    </div>
                                ) : (
                                    node.teams?.map(team => (
                                        <div
                                            key={team.id}
                                            className="relative flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all group/team"
                                        >
                                            <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectTeam?.(team);
                                                }}
                                            >
                                                <div className="font-medium text-sm text-slate-900 dark:text-white">
                                                    {team.name}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {team.code}
                                                </div>
                                            </div>
                                            <StatusBadge status={team.status} size="sm" />
                                            {onDeleteTeam && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTeamModal({ isOpen: true, team });
                                                    }}
                                                    className="absolute right-3 opacity-0 group-hover/team:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all bg-white dark:bg-card-dark shadow-sm border border-slate-100 dark:border-slate-700"
                                                    title="Remover equipe"
                                                >
                                                    <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}

                                {/* Add Team Button */}
                                {onAddTeam && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddTeam(node.id);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-slate-600 dark:text-slate-400 hover:text-primary"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                        <span className="text-sm font-medium">Adicionar Equipe</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Render sub-departments only if expanded */}
                {hasChildren && isExpanded && (
                    <div className="space-y-3 mt-3">
                        {node.children.map(child => renderDepartmentNode(child, level + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando departamentos...</div>;
    }

    return (
        <div className="flex flex-col">
            <div className="px-4 pb-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark pt-0">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar departamento..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    {onAddDepartment && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAddDepartment}
                            title="Adicionar Departamento"
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
                {departmentTree.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhum departamento encontrado.
                    </div>
                ) : (
                    departmentTree.slice(0, visibleCount).map(node => renderDepartmentNode(node))
                )}

                <LoadMore
                    current={Math.min(visibleCount, departmentTree.length)}
                    total={departmentTree.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>

            <Modal
                isOpen={deleteTeamModal.isOpen}
                onClose={() => setDeleteTeamModal({ isOpen: false, team: null })}
                onConfirm={() => {
                    if (deleteTeamModal.team && onDeleteTeam) {
                        onDeleteTeam(deleteTeamModal.team.id);
                    }
                }}
                title="Remover Equipe"
                message={`Deseja realmente remover a equipe "${deleteTeamModal.team?.name}"?`}
                type="warning"
                confirmLabel="Remover"
            />
        </div>
    );
};
