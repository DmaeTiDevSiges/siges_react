import React, { useState, useEffect, useCallback } from 'react';
import { Team } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Loading';
import { LoadMore } from '../../components/ui/LoadMore';
import { IconButton } from '../../components/ui/IconButton';
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

interface TeamsListProps {
    departmentId?: string;
    onSelect?: (team: Team) => void;
    onAddTeam?: () => void;
}

interface TeamNode extends Team {
    children: TeamNode[];
}

// ---------- Sortable/Droppable Team Item ----------
interface DraggableTeamItemProps {
    team: TeamNode;
    level: number;
    onSelect?: (team: Team) => void;
    onDragOverTeam: (overId: string | null) => void;
    overId: string | null;
    activeId: string | null;
    expandedTeams: Set<string>;
    onToggleTeamExpand: (teamId: string) => void;
}

const DraggableTeamItem: React.FC<DraggableTeamItemProps> = ({
    team,
    level,
    onSelect,
    onDragOverTeam,
    overId,
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
                    group flex items-center p-4 bg-white dark:bg-card-dark rounded-2xl border shadow-sm transition-all
                    ${isOverTarget
                        ? 'border-primary dark:border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-100 dark:border-slate-800'
                    }
                    ${onSelect ? 'hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer' : ''}
                `}
                onClick={() => onSelect?.(team)}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="mr-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-none"
                    onClick={(e) => e.stopPropagation()}
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
                        className="mr-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[18px]">
                            {expandedTeams.has(team.id) ? 'expand_more' : 'chevron_right'}
                        </span>
                    </button>
                )}

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
                        {level > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_right</span>
                                sub-equipe
                            </span>
                        )}
                    </div>
                </div>

                {onSelect && (
                    <div className="ml-2 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </div>
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
                            onSelect={onSelect}
                            onDragOverTeam={onDragOverTeam}
                            overId={overId}
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

// ---------- Overlay Card ----------
const DragOverlayCard: React.FC<{ team: Team }> = ({ team }) => (
    <div className="flex items-center p-4 bg-white dark:bg-card-dark rounded-2xl border border-primary shadow-lg opacity-90">
        <div className="mr-2 text-primary">
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>
        <span className="material-symbols-outlined text-primary text-[20px] mr-2">groups</span>
        <span className="font-semibold text-slate-900 dark:text-white">{team.name}</span>
    </div>
);

// ---------- Main Component ----------
export const TeamsList: React.FC<TeamsListProps> = ({ departmentId, onSelect, onAddTeam }) => {
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [expandedTeamNodes, setExpandedTeamNodes] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`team_nodes_expanded_${departmentId || 'global'}`);
        return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    });
    const PAGE_SIZE = 10;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const toggleTeamNodeExpand = (teamId: string) => {
        setExpandedTeamNodes(prev => {
            const newSet = new Set<string>(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            localStorage.setItem(`team_nodes_expanded_${departmentId || 'global'}`, JSON.stringify(Array.from(newSet)));
            return newSet;
        });
    };

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

    // Build tree from flat list
    const buildTree = (list: Team[]): TeamNode[] => {
        const map = new Map<string, TeamNode>();
        const roots: TeamNode[] = [];

        list.forEach(team => {
            map.set(team.id, { ...team, children: [] });
        });

        list.forEach(team => {
            const node = map.get(team.id)!;
            if (team.parentId && map.has(team.parentId)) {
                map.get(team.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Sort children by sortOrder
        const sortNodes = (nodes: TeamNode[]) => {
            nodes.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(roots);

        return roots;
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );

    const teamTree = buildTree(filteredTeams);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const team = teams.find(t => t.id === active.id);
        setActiveTeam(team || null);
    }, [teams]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { over } = event;
        if (over) {
            const overTeamId = over.id.toString().replace('drop-', '');
            setOverId(overTeamId);
        } else {
            setOverId(null);
        }
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTeam(null);
        setOverId(null);

        if (!over || active.id === over.id) return;

        const draggedId = active.id.toString();
        const targetId = over.id.toString().replace('drop-', '');

        if (draggedId === targetId) return;

        // Check if target is a descendant of dragged (prevent circular)
        const isDescendant = (parentId: string, childId: string): boolean => {
            const children = teams.filter(t => t.parentId === parentId);
            for (const child of children) {
                if (child.id === childId) return true;
                if (isDescendant(child.id, childId)) return true;
            }
            return false;
        };

        if (isDescendant(draggedId, targetId)) return;

        const draggedTeam = teams.find(t => t.id === draggedId);
        if (!draggedTeam) return;

        // Determine new parentId and sortOrder
        const targetTeam = teams.find(t => t.id === targetId);
        const sameParent = draggedTeam.parentId === targetTeam?.parentId;

        let newParentId: string | null = null;

        // If dropped on a different team, make it a child of that team
        if (targetTeam && !sameParent) {
            newParentId = targetId;
        } else if (targetTeam && sameParent) {
            // Same parent: reorder
            newParentId = draggedTeam.parentId || null;
        } else {
            newParentId = draggedTeam.parentId || null;
        }

        // Compute new sort order
        const siblings = teams.filter(t =>
            t.id !== draggedId && t.parentId === newParentId
        );
        const targetIndex = siblings.findIndex(t => t.id === targetId);
        const newSortOrder = targetIndex >= 0 ? targetIndex : siblings.length;

        // Optimistic update
        setTeams(prev => {
            const updated = prev.map(t =>
                t.id === draggedId
                    ? { ...t, parentId: newParentId || undefined, sortOrder: newSortOrder }
                    : t
            );
            return updated;
        });

        // Persist
        try {
            await dataService.updateTeam(draggedId, {
                parentId: newParentId || undefined,
                sortOrder: newSortOrder
            });
        } catch (error) {
            console.error('Error updating team:', error);
            // Reload on error
            const data = departmentId
                ? await dataService.getTeamsByDepartment(departmentId)
                : await dataService.getTeams();
            setTeams(data);
        }
    }, [teams, departmentId]);

    const handleDragOverTeam = useCallback((overTeamId: string | null) => {
        setOverId(overTeamId);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando equipes..." />
            </div>
        );
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

            <div className="flex flex-col gap-2 px-4 pb-32 overflow-y-auto no-scrollbar">
                {filteredTeams.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhuma equipe encontrada.
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        {teamTree.slice(0, visibleCount).map(team => (
                            <DraggableTeamItem
                                key={team.id}
                                team={team}
                                level={0}
                                onSelect={onSelect}
                                onDragOverTeam={handleDragOverTeam}
                                overId={overId}
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

                <LoadMore
                    current={Math.min(visibleCount, teamTree.length)}
                    total={teamTree.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
};
