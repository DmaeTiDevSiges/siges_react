import React, { useState, useEffect, useCallback } from 'react';
import { Department, Team } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { Modal } from '../../components/ui/Modal';
import { IconButton } from '../../components/ui/IconButton';
import { Loading } from '../../components/ui/Loading';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    useDroppable,
    useDraggable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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

interface TeamNode extends Team {
    children: TeamNode[];
}

// ---------- Draggable/Droppable Team Item ----------
interface DraggableTeamItemProps {
    team: TeamNode;
    level: number;
    onSelectTeam?: (team: Team) => void;
    onDeleteTeam?: (teamId: string) => void;
    onSetDeleteModal: (modal: { isOpen: boolean; team: Team | null }) => void;
    activeId: string | null;
    expandedTeams: Set<string>;
    onToggleTeamExpand: (teamId: string) => void;
}

const DraggableTeamItem: React.FC<DraggableTeamItemProps> = ({
    team,
    level,
    onSelectTeam,
    onDeleteTeam,
    onSetDeleteModal,
    activeId,
    expandedTeams,
    onToggleTeamExpand
}) => {
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform,
        transition,
        isDragging
    } = useDraggable({ id: team.id, data: { type: 'team', team } });

    const {
        setNodeRef: setDropRef,
        isOver
    } = useDroppable({
        id: `drop-${team.id}`,
        data: { type: 'team', team },
        disabled: isDragging
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as const,
        opacity: isDragging ? 0.4 : 1,
    };

    const isOverTarget = isOver && activeId !== team.id;
    const indent = level * 24;

    return (
        <div style={{ marginLeft: `${indent}px` }}>
            <div
                ref={(node) => {
                    setDragRef(node);
                    setDropRef(node);
                }}
                style={style}
                className={`
                    relative flex items-center gap-3 p-3 rounded-xl border transition-all group/team
                    ${isOverTarget
                        ? 'bg-primary/5 dark:bg-primary/10 border-primary dark:border-primary'
                        : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50'
                    }
                `}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-none"
                >
                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                </div>

                {/* Expand/Collapse button for children */}
                {team.children.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleTeamExpand(team.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[18px]">
                            {expandedTeams.has(team.id) ? 'expand_more' : 'chevron_right'}
                        </span>
                    </button>
                )}

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
                            onSetDeleteModal({ isOpen: true, team });
                        }}
                        className="absolute right-3 opacity-0 group-hover/team:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all bg-white dark:bg-card-dark shadow-sm border border-slate-100 dark:border-slate-700"
                        title="Remover equipe"
                    >
                        <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
                    </button>
                )}
            </div>

            {/* Render children only if expanded */}
            {team.children.length > 0 && expandedTeams.has(team.id) && (
                <div className="space-y-2 mt-2">
                    {team.children.map(child => (
                        <DraggableTeamItem
                            key={child.id}
                            team={child}
                            level={level + 1}
                            onSelectTeam={onSelectTeam}
                            onDeleteTeam={onDeleteTeam}
                            onSetDeleteModal={onSetDeleteModal}
                            activeId={activeId}
                            expandedTeams={expandedTeams}
                            onToggleTeamExpand={onToggleTeamExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- Drag Overlay Card ----------
const DragOverlayCard: React.FC<{ team: Team }> = ({ team }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-xl border border-primary shadow-lg opacity-90">
        <div className="text-primary">
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>
        <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
        <span className="font-medium text-sm text-slate-900 dark:text-white">{team.name}</span>
    </div>
);

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
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const PAGE_SIZE = 10;
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`dept_expanded_nodes_${companyId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`dept_expanded_teams_${companyId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const [expandedTeamNodes, setExpandedTeamNodes] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`team_nodes_expanded_${companyId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const [deleteTeamModal, setDeleteTeamModal] = useState<{ isOpen: boolean; team: Team | null }>({
        isOpen: false,
        team: null
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

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

    const toggleTeamNodeExpand = (teamId: string) => {
        setExpandedTeamNodes(prev => {
            const newSet = new Set<string>(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            localStorage.setItem(`team_nodes_expanded_${companyId || 'global'}`, JSON.stringify(Array.from(newSet)));
            return newSet;
        });
    };

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const team = allTeams.find(t => t.id === active.id);
        setActiveTeam(team || null);
    }, [allTeams]);

    const handleDragEnd = useCallback(async (event: DragEndEvent, departmentId: string) => {
        const { active, over } = event;
        setActiveTeam(null);
        if (!over || active.id === over.id) return;

        const draggedId = active.id.toString();
        const targetId = over.id.toString().replace('drop-', '');
        if (draggedId === targetId) return;

        const draggedTeam = allTeams.find(t => t.id === draggedId);
        const targetTeam = allTeams.find(t => t.id === targetId);
        if (!draggedTeam || !targetTeam) return;

        const isDescendant = (parentId: string, childId: string): boolean => {
            const children = allTeams.filter(t => t.parentId === parentId);
            for (const child of children) {
                if (child.id === childId) return true;
                if (isDescendant(child.id, childId)) return true;
            }
            return false;
        };
        if (isDescendant(draggedId, targetId)) return;

        const sameParent = draggedTeam.parentId === targetTeam.parentId;
        let newParentId: string | undefined = draggedTeam.parentId;

        if (!sameParent) {
            newParentId = targetId;
        }

        const siblings = allTeams.filter(t => t.id !== draggedId && t.parentId === newParentId && t.departmentId === departmentId);
        const targetIndex = siblings.findIndex(t => t.id === targetId);
        const newSortOrder = targetIndex >= 0 ? targetIndex : siblings.length;

        setAllTeams(prev => prev.map(t =>
            t.id === draggedId
                ? { ...t, parentId: newParentId, sortOrder: newSortOrder }
                : t
        ));

        try {
            await dataService.updateTeam(draggedId, {
                parentId: newParentId,
                sortOrder: newSortOrder
            });
        } catch (error) {
            console.error('Error updating team:', error);
            const data = await dataService.getTeams();
            setAllTeams(data);
        }
    }, [allTeams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptData, teamsData] = await Promise.all([
                    companyId
                        ? dataService.getDepartmentsByCompany(companyId)
                        : dataService.getDepartments(),
                    dataService.getTeams()
                ]);

                setDepartments(deptData);
                setAllTeams(teamsData);

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

    // Build team tree for a department
    const buildTeamTree = (deptTeams: Team[]): TeamNode[] => {
        const map = new Map<string, TeamNode>();
        const roots: TeamNode[] = [];

        deptTeams.forEach(team => {
            map.set(team.id, { ...team, children: [] });
        });

        deptTeams.forEach(team => {
            const node = map.get(team.id)!;
            if (team.parentId && map.has(team.parentId)) {
                map.get(team.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        const sortNodes = (nodes: TeamNode[]) => {
            nodes.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(roots);

        return roots;
    };

    const buildTree = (departments: Department[]): DepartmentNode[] => {
        const map = new Map<string, DepartmentNode>();
        const roots: DepartmentNode[] = [];

        departments.forEach(dept => {
            const teams = allTeams
                .filter(t => t.departmentId === dept.id)
                .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
            map.set(dept.id, {
                ...dept,
                children: [],
                teams,
                teamCount: teams.length
            });
        });

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

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
    );

    const departmentTree = buildTree(filteredDepartments);

    const renderDepartmentNode = (node: DepartmentNode, level: number = 0) => {
        const indent = level * 20;
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const isTeamsExpanded = expandedTeams.has(node.id);
        const teamCount = node.teamCount || 0;
        const teamTree = node.teams ? buildTeamTree(node.teams) : [];

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
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragStart={handleDragStart}
                                        onDragEnd={(event) => handleDragEnd(event, node.id)}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        {teamTree.map(team => (
                                            <DraggableTeamItem
                                                key={team.id}
                                                team={team}
                                                level={0}
                                                onSelectTeam={onSelectTeam}
                                                onDeleteTeam={onDeleteTeam}
                                                onSetDeleteModal={setDeleteTeamModal}
                                                activeId={activeTeam?.id || null}
                                                expandedTeams={expandedTeamNodes}
                                                onToggleTeamExpand={toggleTeamNodeExpand}
                                            />
                                        ))}

                                        <DragOverlay dropAnimation={null}>
                                            {activeTeam ? <DragOverlayCard team={activeTeam} /> : null}
                                        </DragOverlay>
                                    </DndContext>
                                )}

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

                {hasChildren && isExpanded && (
                    <div className="space-y-3 mt-3">
                        {node.children.map(child => renderDepartmentNode(child, level + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando departamentos..." />
            </div>
        );
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
