import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import { UnitStructureNode } from '../../types';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Loading } from '../ui/Loading';

interface UnitStructureOrganogramProps {
    unitId: string;
    /** chave para forçar recarga externa (ex: após criar setor no UnitView) */
    refreshKey?: number;
    onStructureChanged?: () => void;
}

interface TreeNode extends UnitStructureNode {
    children: TreeNode[];
    depth: number;
}

const ROOT_DROP_ID = 'structure-make-root';

// ---------- Node card (draggable + droppable) ----------
interface OrganogramNodeCardProps {
    node: TreeNode;
    collapsed: boolean;
    hasChildren: boolean;
    isDragActive: boolean;
    isOverThis: boolean;
    isInvalidTarget: boolean;
    isOverlay?: boolean;
    onToggle: (nodeId: string) => void;
    dragHandleProps?: Record<string, any>;
}

const NodeCard: React.FC<OrganogramNodeCardProps> = ({
    node,
    collapsed,
    hasChildren,
    isOverThis,
    isInvalidTarget,
    isOverlay,
    onToggle,
    dragHandleProps
}) => {
    return (
        <div
            className={`
                flex items-center gap-2 rounded-xl border-2 bg-white dark:bg-card-dark px-3 py-2.5
                shadow-sm transition-all select-none
                ${isOverlay ? 'rotate-2 shadow-2xl shadow-primary/30 border-primary w-56' : ''}
                ${isOverThis && !isInvalidTarget ? 'border-primary ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10 scale-[1.02]' : ''}
                ${isInvalidTarget ? 'opacity-40 grayscale' : ''}
                ${!isOverlay && !isOverThis ? 'border-slate-200 dark:border-slate-800' : ''}
            `}
        >
            {/* Drag handle */}
            <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-primary transition-colors touch-none"
                title="Arraste para reorganizar"
            >
                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
            </div>

            {/* Expand/collapse */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                disabled={!hasChildren}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-all
                    ${hasChildren
                        ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'opacity-0 pointer-events-none'}`}
                title={collapsed ? 'Expandir' : 'Recolher'}
            >
                <span className={`material-symbols-outlined text-[18px] transition-transform ${collapsed ? '' : 'rotate-90'}`}>
                    chevron_right
                </span>
            </button>

            {/* Availability dot */}
            <span
                className={`w-2 h-2 rounded-full shrink-0 ${node.isAvailable === false
                    ? 'bg-red-500'
                    : node.isAvailable === true
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-600'}`}
                title={node.isAvailable === false ? 'Indisponível' : node.isAvailable === true ? 'Disponível' : 'Sem registro'}
            />

            {/* Name + code */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                    {node.name}
                </p>
                {node.code && (
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {node.code}
                    </p>
                )}
            </div>

            {/* Children count */}
            {hasChildren && (
                <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {node.children.length}
                </span>
            )}
        </div>
    );
};

const DraggableNode: React.FC<{
    node: TreeNode;
    collapsed: boolean;
    invalidTargets: Set<string>;
    onToggle: (nodeId: string) => void;
}> = ({ node, collapsed, invalidTargets, onToggle }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: node.id,
        data: { type: 'sector', node }
    });

    const isInvalid = invalidTargets.has(node.id);

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop-${node.id}`,
        data: { type: 'sector', node }
    });

    return (
        <div ref={setDropRef}>
            <div ref={setNodeRef} {...attributes} className={isDragging ? 'opacity-30' : ''}>
                <NodeCard
                    node={node}
                    collapsed={collapsed}
                    hasChildren={node.children.length > 0}
                    isDragActive={false}
                    isOverThis={isOver}
                    isInvalidTarget={isInvalid}
                    onToggle={onToggle}
                    dragHandleProps={listeners}
                />
            </div>
        </div>
    );
};

// ---------- Recursive tree branch ----------
const TreeBranch: React.FC<{
    node: TreeNode;
    collapsedIds: Set<string>;
    invalidTargets: Set<string>;
    onToggle: (nodeId: string) => void;
}> = ({ node, collapsedIds, invalidTargets, onToggle }) => {
    const collapsed = collapsedIds.has(node.id);
    const children = collapsed ? [] : node.children;

    return (
        <div>
            <DraggableNode
                node={node}
                collapsed={collapsed}
                invalidTargets={invalidTargets}
                onToggle={onToggle}
            />

            {children.length > 0 && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2 mt-2 relative">
                    {/* Connector stub */}
                    <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-transparent" />
                    <div className="space-y-2">
                        {children.map(child => (
                            <TreeBranch
                                key={child.id}
                                node={child}
                                collapsedIds={collapsedIds}
                                invalidTargets={invalidTargets}
                                onToggle={onToggle}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------- Main component ----------
export const UnitStructureOrganogram: React.FC<UnitStructureOrganogramProps> = ({
    unitId,
    refreshKey = 0,
    onStructureChanged
}) => {
    const { canEdit } = usePermissions();
    const canReparent = canEdit('units_assets_tags');

    const [nodes, setNodes] = useState<UnitStructureNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeNode, setActiveNode] = useState<UnitStructureNode | null>(null);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [overNodeId, setOverNodeId] = useState<string | null>(null);

    const nodesRef = useRef<UnitStructureNode[]>([]);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // ---------- Data ----------
    const fetchNodes = useCallback(async () => {
        if (!unitId) return;
        try {
            setError(null);
            const data = await dataService.getUnitStructureNodes(unitId);
            setNodes(data);
        } catch (err) {
            console.error('Error loading unit structure:', err);
            setError('Erro ao carregar a estrutura da unidade.');
        } finally {
            setLoading(false);
        }
    }, [unitId]);

    useEffect(() => { fetchNodes(); }, [fetchNodes, refreshKey]);

    // Persist collapsed state per unit
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`unit_structure_collapsed_${unitId}`);
            if (saved) setCollapsedIds(new Set(JSON.parse(saved)));
        } catch { /* ignore */ }
    }, [unitId]);

    const toggleCollapse = useCallback((nodeId: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
            try { localStorage.setItem(`unit_structure_collapsed_${unitId}`, JSON.stringify([...next])); } catch { /* ignore */ }
            return next;
        });
    }, [unitId]);

    // ---------- Tree building ----------
    const tree = useMemo(() => {
        const byId = new Map<string, TreeNode>();
        nodes.forEach(n => byId.set(n.id, { ...n, children: [], depth: 0 }));

        const roots: TreeNode[] = [];
        byId.forEach(node => {
            const parent = node.parentId ? byId.get(node.parentId) : undefined;
            if (parent && parent.id !== node.id) {
                parent.children.push(node);
                node.depth = parent.depth + 1; // shallow; depth recomputed below
            } else {
                roots.push(node);
            }
        });

        const sortRecursive = (list: TreeNode[]) => {
            list.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
            list.forEach(n => { n.children.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name)); sortRecursive(n.children); });
        };
        const recomputeDepth = (list: TreeNode[], depth: number) => {
            list.forEach(n => { n.depth = depth; recomputeDepth(n.children, depth + 1); });
        };
        sortRecursive(roots);
        recomputeDepth(roots, 0);
        return roots;
    }, [nodes]);

    const treeRef = useRef<TreeNode[]>([]);
    useEffect(() => { treeRef.current = tree; }, [tree]);

    /** Self + all descendants of a node (cycle guard) */
    const collectDescendantIds = useCallback((nodeId: string): Set<string> => {
        const result = new Set<string>([nodeId]);
        const walk = (id: string) => {
            nodesRef.current.forEach(n => {
                if (n.parentId === id && !result.has(n.id)) {
                    result.add(n.id);
                    walk(n.id);
                }
            });
        };
        walk(nodeId);
        return result;
    }, []);

    const invalidTargets = useMemo(() => {
        if (!activeNode || !canReparent) return new Set<string>();
        return collectDescendantIds(activeNode.id);
    }, [activeNode, canReparent, collectDescendantIds]);

    // ---------- Re-parent ----------
    const reParent = useCallback(async (draggedId: string, newParentId: string | null) => {
        const dragged = nodesRef.current.find(n => n.id === draggedId);
        if (!dragged) return;
        if ((dragged.parentId ?? null) === newParentId) return; // no-op

        // Cycle guard (redundant with UI, belt & suspenders)
        if (newParentId && collectDescendantIds(draggedId).has(newParentId)) {
            toast.error('Não é possível mover um setor para dentro de si mesmo ou de seus filhos.');
            return;
        }

        const previous = nodes;
        const nextSortOrder = nodes.filter(n => (n.parentId ?? null) === newParentId).length;

        // Optimistic update
        setNodes(prev => prev.map(n => n.id === draggedId ? { ...n, parentId: newParentId, sortOrder: nextSortOrder } : n));

        try {
            await dataService.updateUnitStructureParent(draggedId, newParentId, nextSortOrder);
            const parentLabel = newParentId
                ? (nodesRef.current.find(n => n.id === newParentId)?.name || 'setor selecionado')
                : 'nível principal';
            toast.success(`"${dragged.name}" movido para ${newParentId ? parentLabel : 'o nível principal'}.`);
            // Auto-expand new parent so the moved node is visible
            if (newParentId) {
                setCollapsedIds(prev => {
                    const next = new Set(prev);
                    next.delete(newParentId);
                    try { localStorage.setItem(`unit_structure_collapsed_${unitId}`, JSON.stringify([...next])); } catch { /* ignore */ }
                    return next;
                });
            }
            onStructureChanged?.();
        } catch (err) {
            console.error('Error re-parenting sector:', err);
            setNodes(previous); // rollback
            toast.error('Erro ao mover setor. Tente novamente.');
        }
    }, [nodes, collectDescendantIds, onStructureChanged, unitId]);

    // ---------- DnD handlers ----------
    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!canReparent) return;
        const data = event.active.data.current;
        if (data?.type === 'sector') setActiveNode(data.node as UnitStructureNode);
    }, [canReparent]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const overData = event.over?.data.current;
        setOverNodeId(overData?.type === 'sector' ? String(event.over!.id).replace('drop-', '') : null);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setOverNodeId(null);
        const dragged = activeNode;
        setActiveNode(null);
        if (!dragged || !canReparent) return;

        const { over } = event;
        if (!over) return;

        const overData = over.data.current;
        if (overData?.type === 'root') {
            reParent(dragged.id, null);
        } else if (overData?.type === 'sector') {
            const targetId = String(over.id).replace('drop-', '');
            if (targetId === dragged.id) return;
            reParent(dragged.id, targetId);
        }
    }, [activeNode, canReparent, reParent]);

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loading size="md" text="Carregando estrutura..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
                <button
                    onClick={fetchNodes}
                    className="mt-3 text-sm font-bold text-primary hover:underline"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="text-center py-10">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">account_tree</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Nenhum setor atribuído a esta unidade.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Use "Novo Setor" na aba Setores da unidade para começar.
                </p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={canReparent ? sensors : []}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => { setActiveNode(null); setOverNodeId(null); }}
        >
            <div className="relative">
                {/* Legend */}
                <div className="flex items-center gap-4 px-1 pb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disponível
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Indisponível
                    </span>
                    {canReparent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/70 uppercase tracking-wider ml-auto">
                            <span className="material-symbols-outlined text-[14px]">drag_pan</span>
                            Arraste para reorganizar
                        </span>
                    )}
                </div>

                {/* Tree */}
                <div className="space-y-2">
                    {tree.map(rootNode => (
                        <TreeBranch
                            key={rootNode.id}
                            node={rootNode}
                            collapsedIds={collapsedIds}
                            invalidTargets={invalidTargets}
                            onToggle={toggleCollapse}
                        />
                    ))}
                </div>

                {/* Drop zone: make root */}
                {canReparent && activeNode && <MakeRootDropZone />}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeNode ? (
                    <NodeCard
                        node={{ ...activeNode, children: [], depth: 0 }}
                        collapsed={false}
                        hasChildren={false}
                        isDragActive={true}
                        isOverThis={false}
                        isInvalidTarget={false}
                        isOverlay={true}
                        onToggle={() => { }}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// ---------- "Move to root" drop zone (appears while dragging) ----------
const MakeRootDropZone: React.FC = () => {
    const { setNodeRef, isOver } = useDroppable({
        id: ROOT_DROP_ID,
        data: { type: 'root' }
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                sticky bottom-4 mt-4 mx-auto w-full max-w-sm rounded-xl border-2 border-dashed px-4 py-3
                flex items-center justify-center gap-2 backdrop-blur-md transition-all z-30
                ${isOver
                    ? 'border-primary bg-primary/15 text-primary scale-[1.02]'
                    : 'border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-400 dark:text-slate-500'}
            `}
        >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            <span className="text-[11px] font-black uppercase tracking-widest">
                Solte aqui para nível principal
            </span>
        </div>
    );
};
