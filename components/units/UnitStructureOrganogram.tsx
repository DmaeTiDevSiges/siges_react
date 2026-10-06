import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    DragOverEvent,
    pointerWithin,
    MeasuringStrategy,
    CollisionDetection
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/core/supabase';
import { UnitStructureNode } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../ui/Loading';
import { UnitStructureLinkDialog } from './UnitStructureLinkDialog';
import { collectUnitStructureDescendants } from '../../utils/unitStructureGraph';

interface UnitStructureOrganogramProps {
    unitId: string;
    /** chave para forçar recarga externa (ex: após criar setor no UnitView) */
    refreshKey?: number;
    onStructureChanged?: () => void;
}

interface TreeNode extends UnitStructureNode {
    children: TreeNode[];
    depth: number;
    /** Ocorrência como alias sob um pai secundário (referência, não o nó primário) */
    isAlias?: boolean;
    /** Aliases deste nó (ocorrências sob ele como pai secundário) */
    aliases?: TreeNode[];
    /** Nome do pai primário real do alias (para o tooltip/legenda) */
    aliasPrimaryParentName?: string;
}

const ROOT_DROP_ID = 'structure-make-root';

/**
 * Colisão por posição do ponteiro (pointerWithin) com prioridade:
 * cards de setor (drop-) > gaps de reordenação (gap-) > zona "nível principal".
 * Quando a zona inferior e um gap se sobrepõem visualmente, o drop resolve
 * sempre para o alvo mais específico.
 */
const treeCollisionDetection: CollisionDetection = (args) => {
    const collisions = pointerWithin(args);
    if (collisions.length <= 1) return collisions;
    const rank = (id: unknown) => {
        const s = String(id);
        if (s.startsWith('drop-')) return 0;
        if (s.startsWith('gap-')) return 1;
        return 2;
    };
    return [...collisions].sort((a, b) => rank(a.id) - rank(b.id));
};

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
    /** Mostra o handle de arrasto (apenas usuários que podem interagir) */
    canDrag?: boolean;
    /** Permite abrir o diálogo de vínculos secundários (super admin + edição) */
    canManageLinks?: boolean;
    onManageLinks?: (node: TreeNode) => void;
}

const NodeCard: React.FC<OrganogramNodeCardProps> = ({
    node,
    collapsed,
    hasChildren,
    isDragActive,
    isOverThis,
    isInvalidTarget,
    isOverlay,
    onToggle,
    dragHandleProps,
    canDrag = true,
    canManageLinks,
    onManageLinks
}) => {
    const linkCount = node.secondaryLinks?.length ?? 0;
    return (
        <div
            className={`
                flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 bg-white dark:bg-card-dark px-2 py-2 sm:px-3 sm:py-2.5
                shadow-sm transition-all select-none
                ${isOverlay ? 'rotate-2 shadow-2xl shadow-primary/30 border-primary w-56' : ''}
                ${isOverThis && !isInvalidTarget ? 'border-primary ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10 scale-[1.02]' : ''}
                ${isInvalidTarget ? 'opacity-40 grayscale' : ''}
                ${isDragActive && !isOverlay && !isOverThis && !isInvalidTarget ? 'opacity-50' : ''}
                ${!isOverlay && !isOverThis ? 'border-slate-200 dark:border-slate-800' : ''}
            `}
        >
            {/* Drag handle (somente quem pode interagir — super admin) */}
            {canDrag && (
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-primary transition-colors touch-none shrink-0"
                    title="Arraste para reorganizar"
                >
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">drag_indicator</span>
                </div>
            )}

            {/* Expand/collapse */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                disabled={!hasChildren}
                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-md transition-all shrink-0
                    ${hasChildren
                        ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'opacity-0 pointer-events-none'}`}
                title={collapsed ? 'Expandir' : 'Recolher'}
            >
                <span className={`material-symbols-outlined text-[16px] sm:text-[18px] transition-transform ${collapsed ? '' : 'rotate-90'}`}>
                    chevron_right
                </span>
            </button>

            {/* Availability: thumb up/down (cinza quando sem registro) */}
            {node.isAvailable === null ? (
                <span
                    className="w-2 h-2 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600"
                    title="Sem registro"
                />
            ) : (
                <span
                    className={`shrink-0 leading-none ${node.isAvailable ? 'text-emerald-500' : 'text-red-500'}`}
                    title={node.isAvailable ? 'Disponível' : 'Indisponível'}
                >
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] [font-variation-settings:'FILL'_1]">
                        {node.isAvailable ? 'thumb_up' : 'thumb_down'}
                    </span>
                </span>
            )}

            {/* Under availability cascade: state is driven by the cascade root ancestor */}
            {node.cascadeParentId && (
                <span
                    className="text-amber-500 shrink-0"
                    title="Estado dirigido pela indisponibilidade de um setor pai — informe a disponibilidade pelo pai para liberar"
                >
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                </span>
            )}

            {/* Name + code */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2 sm:truncate">
                    {node.name}
                </p>
                {node.code && (
                    <p className="hidden sm:block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {node.code}
                    </p>
                )}
            </div>

            {/* Children count (primários + aliases) */}
            {hasChildren && (
                <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {node.children.length + (node.aliases?.length ?? 0)}
                </span>
            )}

            {/* Vínculos secundários: badge + botão de gerenciar */}
            {linkCount > 0 && (
                <span
                    className="shrink-0 inline-flex items-center justify-center gap-0.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-black text-black dark:text-amber-400"
                    title="Aparece também sob outros setores (pai secundário)"
                >
                    <span className="material-symbols-outlined text-[12px]">link</span>
                    {linkCount}
                </span>
            )}
            {canManageLinks && (
                <button
                    onClick={(e) => { e.stopPropagation(); onManageLinks?.(node); }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Vincular a outro setor (pai secundário)"
                >
                    <span className="material-symbols-outlined text-[16px]">add_link</span>
                </button>
            )}
        </div>
    );
};

const DraggableNode: React.FC<{
    node: TreeNode;
    collapsed: boolean;
    invalidTargets: Set<string>;
    onToggle: (nodeId: string) => void;
    dragging: boolean;
    hidden: boolean;
    canDrag: boolean;
    canManageLinks?: boolean;
    onManageLinks?: (node: TreeNode) => void;
}> = ({ node, collapsed, invalidTargets, onToggle, dragging, hidden, canDrag, canManageLinks, onManageLinks }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: node.id,
        data: { type: 'sector', node },
        disabled: !canDrag
    });

    const isInvalid = invalidTargets.has(node.id);

    // Descendentes do nó arrastado (evita ciclo) e nós ocultos (subárvore
    // recolhida — ficam montados p/ animar expand/collapse, mas com rect
    // sobreposto ao conteúdo seguinte) ficam desabilitados como alvo de drop.
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop-${node.id}`,
        data: { type: 'sector', node },
        disabled: isInvalid || hidden || !canDrag
    });

    return (
        <div ref={setDropRef}>
            <div ref={setNodeRef} {...(canDrag ? attributes : {})} className={isDragging ? 'opacity-30' : ''}>
                <NodeCard
                    node={node}
                    collapsed={collapsed}
                    hasChildren={node.children.length > 0 || (node.aliases?.length ?? 0) > 0}
                    isDragActive={dragging && !isDragging}
                    isOverThis={isOver}
                    isInvalidTarget={isInvalid}
                    onToggle={onToggle}
                    canDrag={canDrag}
                    dragHandleProps={canDrag ? listeners : undefined}
                    canManageLinks={canManageLinks}
                    onManageLinks={onManageLinks}
                />
            </div>
        </div>
    );
};

// ---------- Alias card (ocorrência estática sob um pai secundário) ----------
/**
 * Representa o MESMO nó do banco renderizado sob um segundo pai (DAG).
 * Não é draggable nem droppable: evita ids do dnd-kit duplicados e mantém o
 * drag como "trocar pai primário" (a gestão de vínculos é pelo diálogo).
 */
const AliasCard: React.FC<{
    alias: TreeNode;
    primaryParentName: string | null;
    canManageLinks?: boolean;
    onUnlink?: (nodeId: string, parentId: string) => void;
    busy?: boolean;
}> = ({ alias, primaryParentName, canManageLinks, onUnlink, busy }) => (
    <div
        className="flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-900/10 px-2 py-2 sm:px-3 sm:py-2.5 select-none"
        title={
            primaryParentName
                ? `Referência — o setor é filho de "${primaryParentName}" e aparece aqui por vínculo secundário.`
                : 'Referência — vínculo secundário.'
        }
    >
        <span className="text-amber-500 shrink-0" title="Vínculo secundário (referência)">
            <span className="material-symbols-outlined text-[18px]">link</span>
        </span>

        {/* Availability: thumb up/down (mesmo estado do nó original) */}
        {alias.isAvailable === null ? (
            <span
                className="w-2 h-2 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600"
                title="Sem registro"
            />
        ) : (
            <span
                className={`shrink-0 leading-none ${alias.isAvailable ? 'text-emerald-500' : 'text-red-500'}`}
                title={alias.isAvailable ? 'Disponível' : 'Indisponível'}
            >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] [font-variation-settings:'FILL'_1]">
                    {alias.isAvailable ? 'thumb_up' : 'thumb_down'}
                </span>
            </span>
        )}

        {alias.cascadeParentId && (
            <span
                className="text-amber-500 shrink-0"
                title="Estado dirigido pela indisponibilidade de um setor pai — informe a disponibilidade pelo pai para liberar"
            >
                <span className="material-symbols-outlined text-[16px]">lock</span>
            </span>
        )}

        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-tight line-clamp-2 sm:truncate">
                {alias.name}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/80 truncate">
                referência {primaryParentName ? `· filho de ${primaryParentName}` : ''}
            </p>
        </div>

        {canManageLinks && (
            <button
                onClick={(e) => { e.stopPropagation(); onUnlink?.(alias.id, alias.parentId ?? ''); }}
                disabled={busy || !alias.parentId}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-amber-500/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                title="Remover vínculo secundário"
            >
                <span className="material-symbols-outlined text-[16px]">
                    {busy ? 'progress_activity' : 'link_off'}
                </span>
            </button>
        )}
    </div>
);

// ---------- FLIP: deslize suave das branches quando a estrutura muda ----------
interface FlipPos { x: number; y: number; h: number; }

const FLIP_TRANSITION = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Envolve uma branch inteira (card + subárvore) e a anima de Old → New via
 * transform (padrão FLIP). O registry de posições sobrevive ao remount da
 * branch movida, então o próprio card desliza da posição antiga para a nova.
 * Um timer pós-commit re-medeia silenciosamente (as transições de grid do
 * expand/collapse não deixam o registry defasado).
 */
const FlipWrapper: React.FC<{
    nodeId: string;
    flipSignal: unknown;
    containerRef: { current: HTMLDivElement | null };
    rects: { current: Map<string, FlipPos> };
    animate: boolean;
    children: React.ReactNode;
}> = ({ nodeId, flipSignal, containerRef, rects, animate, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        const container = containerRef.current;
        if (!el || !container) return;

        // Posições relativas ao container: imunes a scroll entre commits
        const r = el.getBoundingClientRect();
        const c = container.getBoundingClientRect();
        const pos: FlipPos = { x: r.left - c.left, y: r.top - c.top, h: r.height };
        const prev = rects.current.get(nodeId);
        rects.current.set(nodeId, pos);

        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (!prev) return;
        const moved = Math.abs(prev.x - pos.x) > 1 || Math.abs(prev.y - pos.y) > 1;
        // Não anima branches ocultas (subárvore recolhida)
        if (!moved || !animate || prev.h < 2 || pos.h < 2) return;
        if ((window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) ?? false) return;

        const dx = prev.x - pos.x;
        const dy = prev.y - pos.y;
        el.style.transition = 'none';
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        void el.getBoundingClientRect(); // força reflow antes de animar
        el.style.transition = FLIP_TRANSITION;
        el.style.transform = 'translate3d(0, 0, 0)';

        // Limpa estilos inline + re-medeia após transições (grid 300ms)
        timerRef.current = window.setTimeout(() => {
            el.style.transition = '';
            el.style.transform = '';
            const r2 = el.getBoundingClientRect();
            const c2 = containerRef.current?.getBoundingClientRect();
            if (c2) rects.current.set(nodeId, { x: r2.left - c2.left, y: r2.top - c2.top, h: r2.height });
            timerRef.current = null;
        }, 360);
    }, [flipSignal, nodeId, containerRef, rects, animate]);

    useEffect(() => () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    }, []);

    return <div ref={ref}>{children}</div>;
};

// ---------- Recursive tree branch ----------
const TreeBranch: React.FC<{
    node: TreeNode;
    collapsedIds: Set<string>;
    invalidTargets: Set<string>;
    onToggle: (nodeId: string) => void;
    dragging: boolean;
    hidden: boolean;
    flipSignal: unknown;
    containerRef: { current: HTMLDivElement | null };
    rects: { current: Map<string, FlipPos> };
    canDrag: boolean;
    canManageLinks?: boolean;
    onManageLinks?: (node: TreeNode) => void;
    onUnlinkAlias?: (childId: string, parentId: string) => void;
    aliasBusyId?: string | null;
}> = ({ node, collapsedIds, invalidTargets, onToggle, dragging, hidden, flipSignal, containerRef, rects, canDrag, canManageLinks, onManageLinks, onUnlinkAlias, aliasBusyId }) => {
    const collapsed = collapsedIds.has(node.id);
    const aliasCount = node.aliases?.length ?? 0;
    const hasBody = node.children.length > 0 || aliasCount > 0;

    return (
        <FlipWrapper
            nodeId={node.id}
            flipSignal={flipSignal}
            containerRef={containerRef}
            rects={rects}
            animate={!hidden}
        >
            <div>
                <DraggableNode
                    node={node}
                    collapsed={collapsed}
                    invalidTargets={invalidTargets}
                    onToggle={onToggle}
                    dragging={dragging}
                    hidden={hidden}
                    canDrag={canDrag}
                    canManageLinks={canManageLinks}
                    onManageLinks={onManageLinks}
                />

                {/* Subárvore sempre montada: grid-rows 0fr→1fr anima o expand/collapse;
                    oculta fica com rect sobreposto, por isso droppables desabilitados. */}
                {hasBody && (
                    <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
                    >
                        <div className="min-h-0 overflow-hidden">
                            <div
                                className={`ml-2 pl-2 sm:ml-4 sm:pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2 mt-2 relative transition-opacity duration-300 motion-reduce:transition-none ${collapsed ? 'opacity-0' : 'opacity-100'}`}
                            >
                                {/* Connector stub */}
                                <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-transparent" />
                                <div className="space-y-2">
                                    {dragging && !collapsed && <ReorderGap parentId={node.id} index={0} />}
                                    {node.children.map((child, i) => (
                                        <React.Fragment key={child.id}>
                                            <TreeBranch
                                                node={child}
                                                collapsedIds={collapsedIds}
                                                invalidTargets={invalidTargets}
                                                onToggle={onToggle}
                                                dragging={dragging && !collapsed}
                                                hidden={hidden || collapsed}
                                                flipSignal={flipSignal}
                                                containerRef={containerRef}
                                                rects={rects}
                                                canDrag={canDrag}
                                                canManageLinks={canManageLinks}
                                                onManageLinks={onManageLinks}
                                                onUnlinkAlias={onUnlinkAlias}
                                                aliasBusyId={aliasBusyId}
                                            />
                                            {dragging && !collapsed && <ReorderGap parentId={node.id} index={i + 1} />}
                                        </React.Fragment>
                                    ))}
                                    {/* Aliases: mesmos nós renderizados por vínculo secundário
                                        (sem gaps — não são alvo de drag; reordenação é via diálogo) */}
                                    {!collapsed && aliasCount > 0 && (
                                        <div className="space-y-2 pt-1">
                                            {(node.aliases || []).map(alias => (
                                                <AliasCard
                                                    key={`alias-${alias.id}`}
                                                    alias={alias}
                                                    primaryParentName={alias.aliasPrimaryParentName ?? null}
                                                    canManageLinks={canManageLinks}
                                                    busy={aliasBusyId === alias.id}
                                                    onUnlink={(childId) => onUnlinkAlias?.(childId, node.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </FlipWrapper>
    );
};

// ---------- Main component ----------
export const UnitStructureOrganogram: React.FC<UnitStructureOrganogramProps> = ({
    unitId,
    refreshKey = 0,
    onStructureChanged
}) => {
    const { currentUser } = useAuth();
    // Apenas usuários com is_admin_super interagem no organograma (arrastar,
    // reordenar, mover para o nível principal, vincular/desvincular).
    // Demais usuários apenas visualizam (expandir/recolher continua liberado).
    const canInteract = currentUser?.isAdminSuper === true;

    const [nodes, setNodes] = useState<UnitStructureNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeNode, setActiveNode] = useState<UnitStructureNode | null>(null);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [overNodeId, setOverNodeId] = useState<string | null>(null);

    // Diálogo de vínculos secundários (pai adicional)
    const [linkNode, setLinkNode] = useState<UnitStructureNode | null>(null);
    const [aliasBusyId, setAliasBusyId] = useState<string | null>(null);

    const nodesRef = useRef<UnitStructureNode[]>([]);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);

    // Host fixo para o DragOverlay via portal (imune a ancestrais com transform)
    const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setOverlayHost(document.body);
    }, []);

    // FLIP: refs de medição relativas ao container + sinal de mudança
    // (estrutura OU expand/collapse disparam re-medição das branches)
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRectsRef = useRef<Map<string, FlipPos>>(new Map());
    const flipSignal = useMemo(() => ({ nodes, collapsedIds }), [nodes, collapsedIds]);

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

    // Realtime: qualquer mudança em cfg_units_assets_tags desta unidade (disponibilidade
    // last_is_available, cascata, reparent, reordenação) refaz o fetch do organograma.
    useEffect(() => {
        if (!unitId) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const channel = supabase
            .channel(`unit-structure-${unitId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cfg_units_assets_tags',
                    filter: `unit_id=eq.${unitId}`
                },
                () => {
                    // Cascata atualiza várias linhas em rajada — debounce do refetch
                    clearTimeout(timer);
                    timer = setTimeout(fetchNodes, 250);
                }
            )
            .subscribe();
        return () => {
            clearTimeout(timer);
            supabase.removeChannel(channel);
        };
    }, [unitId, fetchNodes]);

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

        // Aliases: cada nó com vínculos secundários é renderizado também sob
        // cada pai secundário (cópia estática — o nó real continua com o pai
        // primário). Evita duplicidade: link igual ao pai primário é ignorado.
        byId.forEach(node => {
            (node.secondaryLinks || []).forEach(link => {
                const host = byId.get(link.parentId);
                if (!host || host.id === node.id || host.id === node.parentId) return;
                const alias: TreeNode = {
                    ...node,
                    children: [],
                    depth: (host.depth ?? 0) + 1,
                    isAlias: true,
                    sortOrder: link.sortOrder,
                    aliasPrimaryParentName: node.parentId
                        ? byId.get(node.parentId)?.name ?? null
                        : 'nível principal',
                };
                if (!host.aliases) host.aliases = [];
                host.aliases.push(alias);
            });
        });
        byId.forEach(node => {
            if (node.aliases) {
                node.aliases.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
            }
        });

        return roots;
    }, [nodes]);

    const treeRef = useRef<TreeNode[]>([]);
    useEffect(() => { treeRef.current = tree; }, [tree]);

    /**
     * Self + todos os descendentes no DAG (cycle guard): percorre o pai
     * primário (parent_id) E os vínculos secundários (secondaryLinks).
     */
    const collectDescendantIds = useCallback((nodeId: string): Set<string> => {
        return collectUnitStructureDescendants(nodesRef.current, nodeId);
    }, []);

    const invalidTargets = useMemo(() => {
        if (!activeNode || !canInteract) return new Set<string>();
        return collectDescendantIds(activeNode.id);
    }, [activeNode, canInteract, collectDescendantIds]);

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
        // Anexa no fim do grupo alvo (max + 1 — robusto contra sort_order com buracos)
        const nextSortOrder = nodes
            .filter(n => (n.parentId ?? null) === newParentId)
            .reduce((max, n) => Math.max(max, n.sortOrder), -1) + 1;

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

    // ---------- Reorder (drag entre dois setores do mesmo nível) ----------
    const reorderToGap = useCallback(async (draggedId: string, parentId: string | null, gapIndex: number) => {
        const dragged = nodesRef.current.find(n => n.id === draggedId);
        if (!dragged) return;

        // Nunca reordenar para dentro da própria subárvore
        if (parentId && collectDescendantIds(draggedId).has(parentId)) {
            toast.error('Não é possível mover um setor para dentro de si mesmo ou de seus filhos.');
            return;
        }

        // Grupo alvo na ordem atual (mesmo critério da árvore: sort_order, nome)
        const group = nodesRef.current
            .filter(n => (n.parentId ?? null) === parentId)
            .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

        const draggedIdx = group.findIndex(n => n.id === draggedId);
        // O gap é renderizado na ordem COM o arrastado; ao removê-lo, o índice
        // de inserção recua 1 quando o gap está abaixo da posição original.
        const insertAt = draggedIdx >= 0 && draggedIdx < gapIndex ? gapIndex - 1 : gapIndex;
        const nextOrder = group.filter(n => n.id !== draggedId);
        nextOrder.splice(Math.min(Math.max(insertAt, 0), nextOrder.length), 0, dragged);

        // No-op: sequência de ids idêntica
        if (nextOrder.length === group.length && nextOrder.every((n, i) => n.id === group[i].id)) return;

        const parentChanged = (dragged.parentId ?? null) !== parentId;
        const previous = nodes;

        const orderMap = new Map<string, number>();
        nextOrder.forEach((n, i) => { if (n.sortOrder !== i) orderMap.set(n.id, i); });
        if (parentChanged) orderMap.set(draggedId, insertAt);
        if (orderMap.size === 0 && !parentChanged) return;

        // Optimistic update
        setNodes(prev => prev.map(n => {
            if (n.id === draggedId && parentChanged) return { ...n, parentId, sortOrder: insertAt };
            const so = orderMap.get(n.id);
            return so !== undefined ? { ...n, sortOrder: so } : n;
        }));

        try {
            if (parentChanged) {
                await dataService.updateUnitStructureParent(draggedId, parentId, insertAt);
            }
            const items = [...orderMap.entries()]
                .filter(([id]) => !(parentChanged && id === draggedId))
                .map(([id, sortOrder]) => ({ id, sortOrder }));
            if (items.length > 0) {
                await dataService.updateUnitStructureOrder(items);
            }
            toast.success(`"${dragged.name}" reordenado.`);
            onStructureChanged?.();
        } catch (err) {
            console.error('Error reordering sector:', err);
            setNodes(previous); // rollback
            toast.error('Erro ao reordenar setor. Tente novamente.');
        }
    }, [nodes, collectDescendantIds, onStructureChanged]);

    // ---------- Vínculos secundários (DAG) ----------
    const handleUnlinkAlias = useCallback(async (childId: string, parentId: string) => {
        if (!parentId) return;
        setAliasBusyId(childId);
        try {
            await dataService.unlinkUnitStructureNode(childId, parentId);
            setNodes(prev => prev.map(n => n.id === childId
                ? { ...n, secondaryLinks: (n.secondaryLinks || []).filter(l => l.parentId !== parentId) }
                : n));
            toast.success('Vínculo secundário removido.');
            onStructureChanged?.();
        } catch (err) {
            console.error('Error unlinking secondary parent:', err);
            toast.error('Erro ao remover vínculo. Tente novamente.');
        } finally {
            setAliasBusyId(null);
        }
    }, [onStructureChanged]);

    // ---------- DnD handlers ----------
    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!canInteract) return;
        const data = event.active.data.current;
        if (data?.type === 'sector') setActiveNode(data.node as UnitStructureNode);
    }, [canInteract]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const overData = event.over?.data.current;
        setOverNodeId(overData?.type === 'sector' ? String(event.over!.id).replace('drop-', '') : null);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setOverNodeId(null);
        const dragged = activeNode;
        setActiveNode(null);
        if (!dragged || !canInteract) return;

        const { over } = event;
        if (!over) return;

        const overData = over.data.current;
        if (overData?.type === 'root') {
            reParent(dragged.id, null);
        } else if (overData?.type === 'sector') {
            const targetId = String(over.id).replace('drop-', '');
            if (targetId === dragged.id) return;
            reParent(dragged.id, targetId);
        } else if (overData?.type === 'gap') {
            reorderToGap(dragged.id, overData.parentId ?? null, overData.index ?? 0);
        }
    }, [activeNode, canInteract, reParent, reorderToGap]);

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loading size="md" text="Carregando estrutura..." overlay={false} />
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
                    Adicione setores à unidade para montar o organograma.
                </p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={canInteract ? sensors : []}
            collisionDetection={pointerWithin}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => { setActiveNode(null); setOverNodeId(null); }}
        >
            <div className="relative" ref={containerRef}>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 pb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500 [font-variation-settings:'FILL'_1]">thumb_up</span> Disponível
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px] text-red-500 [font-variation-settings:'FILL'_1]">thumb_down</span> Indisponível
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Sem registro
                    </span>
                    {canInteract && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/70 uppercase tracking-wider ml-auto">
                            <span className="material-symbols-outlined text-[14px]">drag_pan</span>
                            Arraste para reorganizar
                        </span>
                    )}
                </div>

                {/* Tree */}
                <div className="space-y-2">
                    {canInteract && activeNode && <ReorderGap parentId={null} index={0} />}
                    {tree.map((rootNode, i) => (
                        <React.Fragment key={rootNode.id}>
                            <TreeBranch
                                node={rootNode}
                                collapsedIds={collapsedIds}
                                invalidTargets={invalidTargets}
                                onToggle={toggleCollapse}
                                dragging={canInteract && !!activeNode}
                                hidden={false}
                                flipSignal={flipSignal}
                                containerRef={containerRef}
                                rects={nodeRectsRef}
                                canDrag={canInteract}
                                canManageLinks={canInteract}
                                onManageLinks={setLinkNode}
                                onUnlinkAlias={handleUnlinkAlias}
                                aliasBusyId={aliasBusyId}
                            />
                            {canInteract && activeNode && <ReorderGap parentId={null} index={i + 1} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Drop zone: make root — sempre montada p/ o dnd-kit registrar o rect
                    antes do drag começar (montar durante o drag causa corrida de registro). */}
                {canInteract && <MakeRootDropZone dragging={!!activeNode} />}
            </div>

            {/* Drag overlay via portal: DragOverlay usa position:fixed, que vira
                relativo ao ancestral mais próximo com transform (ex.: container
                com translate/transition no UnitView) — portar para document.body
                mantém o card colado ao cursor. */}
            {overlayHost
                && createPortal(
                    <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
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
                    </DragOverlay>,
                    overlayHost
                )}

            {/* Diálogo de vínculos secundários (pai adicional) */}
            {linkNode && (
                <UnitStructureLinkDialog
                    isOpen
                    unitId={unitId}
                    node={linkNode}
                    nodes={nodes}
                    onClose={() => setLinkNode(null)}
                    onChanged={() => {
                        fetchNodes();
                        onStructureChanged?.();
                    }}
                />
            )}
        </DndContext>
    );
};

// ---------- "Move to root" drop zone ----------
// Sempre montada; realçada apenas durante o drag. No mobile fica acima do
// BottomNav fixo (z-40 + bottom-28) para o toque não cair no nav.
const MakeRootDropZone: React.FC<{ dragging: boolean }> = ({ dragging }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: ROOT_DROP_ID,
        data: { type: 'root' }
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                sticky bottom-28 md:bottom-6 mt-4 mx-auto w-full max-w-sm rounded-xl border-2 border-dashed px-4 py-3
                flex items-center justify-center gap-2 backdrop-blur-md transition-all z-40
                ${dragging
                    ? (isOver
                        ? 'border-primary bg-primary/15 text-primary scale-[1.02] shadow-lg shadow-primary/20'
                        : 'border-primary/50 bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400')
                    : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 text-slate-400/80 dark:text-slate-500/80'}
            `}
        >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            <span className="text-[11px] font-black uppercase tracking-widest">
                Solte aqui para nível principal
            </span>
        </div>
    );
};

// ---------- Gap de reordenação (visível apenas durante o drag) ----------
// Soltar o setor num gap = inseri-lo naquela posição do grupo (mesmo nível).
const ReorderGap: React.FC<{ parentId: string | null; index: number }> = ({ parentId, index }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `gap-${parentId ?? 'root'}-${index}`,
        data: { type: 'gap', parentId, index }
    });

    return (
        <div ref={setNodeRef} className="relative h-4 flex items-center" aria-hidden="true">
            <div
                className={`h-[3px] w-full rounded-full transition-all duration-150 ${
                    isOver
                        ? 'bg-primary shadow-md shadow-primary/40'
                        : 'bg-slate-200/80 dark:bg-slate-800/80 opacity-70'
                }`}
            />
        </div>
    );
};
