import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Modal } from './Modal';

export interface TreeFilterOption {
    value: string;
    label: string;
    parentId?: string;
}

interface TreeNode extends TreeFilterOption {
    children: TreeNode[];
}

export const buildTree = (options: TreeFilterOption[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    options.forEach(opt => {
        map.set(opt.value, { ...opt, children: [] });
    });

    options.forEach(opt => {
        const node = map.get(opt.value)!;
        if (opt.parentId && map.has(opt.parentId)) {
            map.get(opt.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

const collectAllParentValues = (nodes: TreeNode[]): Set<string> => {
    const result = new Set<string>();
    const walk = (list: TreeNode[]) => {
        for (const node of list) {
            if (node.children.length > 0) {
                result.add(node.value);
                walk(node.children);
            }
        }
    };
    walk(nodes);
    return result;
};

const collectDescendantValues = (node: TreeNode): string[] => {
    const result: string[] = [];
    const walk = (list: TreeNode[]) => {
        for (const child of list) {
            result.push(child.value);
            walk(child.children);
        }
    };
    walk(node.children);
    return result;
};

const findNode = (nodes: TreeNode[], value: string): TreeNode | null => {
    for (const node of nodes) {
        if (node.value === value) return node;
        const found = findNode(node.children, value);
        if (found) return found;
    }
    return null;
};

interface TreeFilterRowProps {
    node: TreeNode;
    level: number;
    selected: boolean;
    expanded: boolean;
    childCount: number;
    onToggleExpand: (value: string) => void;
    onToggle: (value: string) => void;
}

// Linha memoizada: só re-renderiza quando as próprias props mudam (seleção/
// expansão da linha), evitando re-render da árvore inteira a cada clique.
const TreeFilterRow = React.memo(({
    node,
    level,
    selected,
    expanded,
    childCount,
    onToggleExpand,
    onToggle
}: TreeFilterRowProps) => {
    const hasChildren = node.children.length > 0;
    const indent = level * 20;

    return (
        <label
            className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected ? 'bg-primary/5' : ''}`}
            style={{ paddingLeft: `${8 + indent}px` }}
        >
            {hasChildren ? (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onToggleExpand(node.value); }}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                    <span className="material-symbols-outlined text-slate-500 text-[16px]">
                        {expanded ? 'expand_more' : 'chevron_right'}
                    </span>
                </button>
            ) : level > 0 ? (
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <div className="w-2 h-px bg-slate-300 dark:bg-slate-600" />
                </div>
            ) : (
                <div className="w-5 shrink-0" />
            )}

            <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${selected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}
                onClick={(e) => { e.preventDefault(); onToggle(node.value); }}
            >
                {selected && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
            </div>

            <input
                type="checkbox"
                className="hidden"
                checked={selected}
                onChange={() => onToggle(node.value)}
            />

            <span className={`text-[13px] font-medium leading-tight ${selected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                {node.label}
            </span>

            {hasChildren && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                    {childCount}
                </span>
            )}
        </label>
    );
});
TreeFilterRow.displayName = 'TreeFilterRow';

interface VisibleRow {
    node: TreeNode;
    level: number;
    selected: boolean;
    expanded: boolean;
    childCount: number;
}

export const TreeFilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    label: string;
    title?: string;
    options: TreeFilterOption[];
    value: string[];
    onConfirm: (values: string[]) => void;
}> = ({ isOpen, onClose, label, title, options, value, onConfirm }) => {
    const [search, setSearch] = useState('');
    const [tempValue, setTempValue] = useState<string[]>(value);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [confirming, setConfirming] = useState(false);
    const wasOpenRef = useRef(false);
    const confirmTimeoutRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (confirmTimeoutRef.current !== null) window.clearTimeout(confirmTimeoutRef.current);
    }, []);

    const tree = useMemo(() => buildTree(options), [options]);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const query = search.toLowerCase().trim();
        return options.filter(opt => opt.label.toLowerCase().includes(query));
    }, [options, search]);

    const filteredTree = useMemo(() => buildTree(filteredOptions), [filteredOptions]);

    const selectedSet = useMemo(() => new Set(tempValue), [tempValue]);
    const searchActive = search.trim().length > 0;

    // Linhas visíveis achatadas (nó + nível + estado). A partir daqui cada linha
    // é memoizada e só re-renderiza se a própria seleção/expansão mudar.
    const visibleRows = useMemo(() => {
        const rows: VisibleRow[] = [];
        const matches = new Set(filteredOptions.map(o => o.value));
        const walk = (nodes: TreeNode[], level: number) => {
            for (const node of nodes) {
                const hasChildren = node.children.length > 0;
                const shownChildren = searchActive
                    ? node.children.filter(child => matches.has(child.value))
                    : node.children;
                const expanded = expandedNodes.has(node.value);
                rows.push({
                    node,
                    level,
                    selected: selectedSet.has(node.value),
                    expanded,
                    childCount: shownChildren.length
                });
                if (hasChildren && expanded && shownChildren.length > 0) {
                    walk(shownChildren, level + 1);
                }
            }
        };
        walk(filteredTree, 0);
        return rows;
    }, [filteredTree, expandedNodes, selectedSet, searchActive, filteredOptions]);

    // Reset (seleção/busca/expansão) apenas na transição fechado → aberto.
    // Deps de identidade (value/options) não podem re disparar o reset, senão
    // re-renders do componente pai apagam o rascunho do usuário.
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setTempValue(Array.isArray(value) ? [...value] : []);
            setSearch('');
            setConfirming(false);
            setExpandedNodes(collectAllParentValues(buildTree(options)));
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, value, options]);

    const toggleExpand = useCallback((val: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(val)) next.delete(val);
            else next.add(val);
            return next;
        });
    }, []);

    const handleToggle = useCallback((val: string) => {
        setTempValue(prev => {
            const isCurrentlySelected = prev.includes(val);
            const node = findNode(tree, val);
            const descendantValues = node ? collectDescendantValues(node) : [];
            const toToggle = new Set([val, ...descendantValues]);

            if (isCurrentlySelected) {
                return prev.filter(v => !toToggle.has(v));
            } else {
                return [...prev, ...descendantValues.filter(v => !prev.includes(v)), val];
            }
        });
    }, [tree]);

    const handleConfirm = useCallback(() => {
        if (confirming) return;
        setConfirming(true);
        confirmTimeoutRef.current = window.setTimeout(() => {
            confirmTimeoutRef.current = null;
            onConfirm(tempValue);
            setConfirming(false);
        }, 450);
    }, [confirming, tempValue, onConfirm]);

    // Bloqueia fechamento (Cancelar/X/backdrop) enquanto a animação de confirmação roda.
    const safeClose = useCallback(() => {
        if (confirming) return;
        onClose();
    }, [confirming, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={safeClose} title={title || `Filtrar por ${label}`} maxWidth="md">
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder={`Pesquisar ${label}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        autoFocus
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-0.5">
                    {visibleRows.length > 0 ? (
                        visibleRows.map(row => (
                            <TreeFilterRow
                                key={row.node.value}
                                node={row.node}
                                level={row.level}
                                selected={row.selected}
                                expanded={row.expanded}
                                childCount={row.childCount}
                                onToggleExpand={toggleExpand}
                                onToggle={handleToggle}
                            />
                        ))
                    ) : (
                        <div className="py-10 text-center flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                            <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={safeClose}
                        disabled={confirming}
                        className="flex-1 py-3 items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirming}
                        className={`flex-1 py-3 rounded-xl font-bold font-['Inter'] shadow-lg transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed disabled:active:scale-100 ${
                            confirming
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
                        }`}
                    >
                        {confirming ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] animate-success-pop">check_circle</span>
                                <span>Confirmado ({tempValue.length})</span>
                            </span>
                        ) : (
                            `Confirmar (${tempValue.length})`
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
