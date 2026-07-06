import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from './Modal';

interface TreeFilterOption {
    value: string;
    label: string;
    parentId?: string;
}

interface TreeNode extends TreeFilterOption {
    children: TreeNode[];
}

const buildTree = (options: TreeFilterOption[]): TreeNode[] => {
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

const countDescendants = (node: TreeNode): number => {
    let count = node.children.length;
    for (const child of node.children) {
        count += countDescendants(child);
    }
    return count;
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

export const TreeFilterSelect: React.FC<{
    label: string;
    value: string | string[];
    options: TreeFilterOption[];
    onChange: (values: string[]) => void;
    onClear: () => void;
    disabled?: boolean;
    required?: boolean;
}> = ({ label, value, options, onChange, onClear, disabled, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tempValue, setTempValue] = useState<string[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const normalizedValue = Array.isArray(value) ? value : (value ? [value] : []);
    const count = normalizedValue.length;
    const isEmpty = count === 0;
    const showRequiredError = required && isEmpty;

    const tree = useMemo(() => buildTree(options), [options]);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const query = search.toLowerCase().trim();
        return options.filter(opt => opt.label.toLowerCase().includes(query));
    }, [options, search]);

    const filteredTree = useMemo(() => buildTree(filteredOptions), [filteredOptions]);

    const matchingNodeValues = useMemo(() => {
        if (!search.trim()) return new Set(options.map(o => o.value));
        return new Set(filteredOptions.map(o => o.value));
    }, [options, filteredOptions, search]);

    const toggleExpand = useCallback((val: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(val)) next.delete(val);
            else next.add(val);
            return next;
        });
    }, []);

    const handleOpen = useCallback(() => {
        setTempValue([...normalizedValue]);
        setIsOpen(true);
        setSearch('');
        setExpandedNodes(collectAllParentValues(tree));
    }, [normalizedValue, tree]);

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
        onChange(tempValue);
        setIsOpen(false);
    }, [tempValue, onChange]);

    const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
        const isExpanded = expandedNodes.has(node.value);
        const hasChildren = node.children.length > 0;
        const isSelected = tempValue.includes(node.value);
        const indent = level * 20;

        const visibleChildren = search.trim()
            ? node.children.filter(child => matchingNodeValues.has(child.value))
            : node.children;

        return (
            <React.Fragment key={node.value}>
                <label
                    className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                    style={{ paddingLeft: `${8 + indent}px` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); toggleExpand(node.value); }}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">
                                {isExpanded ? 'expand_more' : 'chevron_right'}
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
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}
                        onClick={(e) => { e.preventDefault(); handleToggle(node.value); }}
                    >
                        {isSelected && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                    </div>

                    <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => handleToggle(node.value)}
                    />

                    <span className={`text-[13px] font-medium leading-tight ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                        {node.label}
                    </span>

                    {hasChildren && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                            {visibleChildren.length}
                        </span>
                    )}
                </label>

                {hasChildren && isExpanded && (
                    <div>
                        {visibleChildren.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    return (
        <>
            <div className={`relative flex items-center w-auto shrink-0 min-w-[110px] h-[42px] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className={`flex items-stretch h-full w-full bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden transition-all ${
                    showRequiredError
                        ? 'border-red-400 ring-1 ring-red-400/30'
                        : count > 0
                            ? 'border-primary ring-1 ring-primary/20'
                            : 'border-slate-200 dark:border-slate-700'
                }`}>
                    <div
                        onClick={handleOpen}
                        className="flex-1 px-3 flex flex-col justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none whitespace-nowrap">{label}</span>
                            {required && <span className="text-red-500 text-[10px] font-black leading-none">*</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold whitespace-nowrap truncate max-w-[120px] ${
                                showRequiredError
                                    ? 'text-red-400'
                                    : count > 0
                                        ? 'text-primary'
                                        : 'text-slate-500 dark:text-slate-400'
                            }`}>
                                {count > 0
                                    ? `${count} ${count === 1 ? 'item' : 'itens'}`
                                    : (required ? 'Obrigatório' : 'Todos')}
                            </span>
                        </div>
                    </div>

                    {count > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="px-3 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l border-slate-100 dark:border-slate-700/50"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Filtrar por ${label}`} maxWidth="md">
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
                        {filteredTree.length > 0 ? (
                            filteredTree.map(node => renderTreeNode(node, 0))
                        ) : (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-3 items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold font-['Inter'] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-sm cursor-pointer"
                        >
                            Confirmar ({tempValue.length})
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
