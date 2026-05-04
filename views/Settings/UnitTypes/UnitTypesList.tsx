import React, { useState, useEffect } from 'react';
import { UnitType } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadMore } from '../../../components/ui/LoadMore';

interface UnitTypesListProps {
    onSelect?: (unitType: UnitType) => void;
    onAdd?: (parentId?: string) => void;
}

interface UnitTypeNode extends UnitType {
    children: UnitTypeNode[];
}

export const UnitTypesList: React.FC<UnitTypesListProps> = ({ onSelect, onAdd }) => {
    const [search, setSearch] = useState('');
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchUnitTypes = async () => {
            try {
                const data = await dataService.getUnitTypes();
                setUnitTypes(data);
                // Expand all by default
                setExpandedNodes(new Set(data.map(ut => ut.id)));
            } catch (error) {
                console.error('Failed to load unit types', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUnitTypes();
    }, []);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    const buildTree = (list: UnitType[]): UnitTypeNode[] => {
        const map = new Map<string, UnitTypeNode>();
        const roots: UnitTypeNode[] = [];

        list.forEach(item => {
            map.set(item.id, { ...item, children: [] });
        });

        list.forEach(item => {
            const node = map.get(item.id)!;
            if (item.parentId && map.has(item.parentId)) {
                map.get(item.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    const filteredTypes = unitTypes.filter(ut =>
        ut.description.toLowerCase().includes(search.toLowerCase()) ||
        ut.code.toLowerCase().includes(search.toLowerCase())
    );

    const tree = buildTree(filteredTypes);

    const renderNode = (node: UnitTypeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children.length > 0;
        const indent = level * 24;

        return (
            <React.Fragment key={node.id}>
                <div
                    className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all mb-3 overflow-hidden"
                    style={{ marginLeft: `${indent}px`, maxWidth: `calc(100% - ${indent}px)` }}
                >
                    <div
                        onClick={() => onSelect?.(node)}
                        className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center">
                                {hasChildren ? (
                                    <button
                                        onClick={(e) => toggleExpand(node.id, e)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors -ml-2 mr-1"
                                    >
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                            {isExpanded ? 'expand_more' : 'chevron_right'}
                                        </span>
                                    </button>
                                ) : level > 0 ? (
                                    <div className="ml-1 mr-3 flex items-center">
                                        <div className="h-px w-4 bg-slate-300 dark:bg-slate-600" />
                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">subdirectory_arrow_right</span>
                                    </div>
                                ) : null}

                                <span className={`material-symbols-outlined text-primary ${level > 0 && !hasChildren ? 'text-[18px]' : 'text-[22px]'}`}>
                                    {level === 0 ? 'account_tree' : 'badge'}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {node.description}
                                    </h3>
                                    <StatusBadge status={node.isAvailable ? 'active' : 'inactive'} size="sm" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="material-symbols-outlined text-[14px] text-slate-400">badge</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{node.code || '---'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-2 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                        </div>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="flex flex-col">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando tipos...</div>;

    return (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar tipo/sub-tipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {onAdd && (
                        <button
                            onClick={() => onAdd()}
                            className="flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                            title="Adicionar Tipo"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 pb-32 overflow-y-auto no-scrollbar">
                {tree.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search ? 'Nenhum tipo encontrado para esta busca' : 'Nenhum tipo cadastrado'}
                    </div>
                ) : (
                    tree.slice(0, visibleCount).map(root => renderNode(root))
                )}

                <LoadMore
                    current={Math.min(visibleCount, tree.length)}
                    total={tree.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
};
