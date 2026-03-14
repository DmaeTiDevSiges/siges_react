import React, {
    useState,
    useEffect,
    useRef
} from 'react';
import { OrderSubType, OrderType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { IconButton } from '../../../../components/ui/IconButton';
import { Select } from '../../../../components/ui/Select';

interface OrderSubTypesListProps {
    onSelect: (orderSubType: OrderSubType) => void;
    onAdd: () => void;
}

interface OrderSubTypeNode extends OrderSubType {
    children: OrderSubTypeNode[];
}

let listCache: {
    subTypes: OrderSubType[];
    search: string;
    filter: 'all' | 'active' | 'inactive';
    expandedNodes: string[];
    timestamp: number;
} | null = null;

export const OrderSubTypesList: React.FC<OrderSubTypesListProps> = ({ onSelect, onAdd }) => {
    const [subTypes, setSubTypes] = useState<OrderSubType[]>(listCache?.subTypes || []);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>(listCache?.filter || 'all');
    const [search, setSearch] = useState(listCache?.search || '');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(listCache?.expandedNodes || []));
    const [isLoading, setIsLoading] = useState(!listCache);

    const stateRef = useRef({ subTypes, search, filter, expandedNodes });
    useEffect(() => {
        stateRef.current = { subTypes, search, filter, expandedNodes };
    }, [subTypes, search, filter, expandedNodes]);

    useEffect(() => {
        return () => {
            if (stateRef.current.subTypes.length > 0) {
                listCache = {
                    subTypes: stateRef.current.subTypes,
                    search: stateRef.current.search,
                    filter: stateRef.current.filter,
                    expandedNodes: Array.from(stateRef.current.expandedNodes),
                    timestamp: Date.now()
                };
            }
        };
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!listCache && subTypes.length === 0) setIsLoading(true);
            try {
                const subsData = await dataService.getOrderSubTypes(filter, search);
                setSubTypes(subsData);

                if (search) {
                    setExpandedNodes(new Set(subsData.map(s => s.id)));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [filter, search]);

    const buildTree = (items: OrderSubType[]): OrderSubTypeNode[] => {
        const itemMap = new Map<string, OrderSubTypeNode>();
        const roots: OrderSubTypeNode[] = [];

        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        items.forEach(item => {
            const node = itemMap.get(item.id)!;
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    const renderNode = (node: OrderSubTypeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const indent = level * 12;

        return (
            <React.Fragment key={node.id}>
                <div
                    onClick={() => onSelect(node)}
                    className="bg-white dark:bg-surface-dark rounded-xl p-3 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-4 mb-3"
                    style={{ marginLeft: `${indent}px` }}
                >
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                        {hasChildren ? (
                            <button
                                onClick={(e) => toggleExpand(node.id, e)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                    {isExpanded ? 'expand_more' : 'chevron_right'}
                                </span>
                            </button>
                        ) : level > 0 ? (
                            <div className="flex justify-center w-5">
                                <span className="material-symbols-outlined text-slate-300 text-[16px]">subdirectory_arrow_right</span>
                            </div>
                        ) : null}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                    {node.code} - {node.description}
                                </h3>
                                <div
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const newStatus = !node.isAvailable;
                                        setSubTypes(prev => prev.map(p =>
                                            p.id === node.id ? { ...p, isAvailable: newStatus } : p
                                        ));
                                        try {
                                            await dataService.updateOrderSubType(node.id, { isAvailable: newStatus });
                                        } catch (error) {
                                            console.error('Error updating status:', error);
                                            setSubTypes(prev => prev.map(p =>
                                                p.id === node.id ? { ...p, isAvailable: !newStatus } : p
                                            ));
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <StatusBadge status={node.isAvailable ? 'active' : 'inactive'} size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">
                        chevron_right
                    </span>
                </div>
                {isExpanded && node.children.map(child => renderNode(child, level + 1))}
            </React.Fragment>
        );
    };

    const treeData = buildTree(subTypes);

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar sub-tipos de OS..."
                        />
                    </div>
                    <IconButton
                        icon="add"
                        variant="primary"
                        size="lg"
                        onClick={onAdd}
                        title="Novo Sub-Tipo de OS"
                    />
                </div>

                <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 shrink-0">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'active', label: 'Ativos' },
                            { id: 'inactive', label: 'Inativos' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === f.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500">Carregando sub-tipos...</p>
                    </div>
                ) : treeData.length > 0 ? (
                    treeData.map(node => renderNode(node))
                ) : (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">category</span>
                        <p className="text-slate-500">Nenhum sub-tipo encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
