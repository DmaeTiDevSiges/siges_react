import React, { useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/SearchInput';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import { UnitStructureNode } from '../../types';
import { collectUnitStructureDescendants } from '../../utils/unitStructureGraph';

interface UnitStructureLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    unitId: string;
    /** Nó que está sendo gerenciado (pode ganhar/perder pais secundários) */
    node: UnitStructureNode | null;
    /** Lista completa de nós da unidade (para listar candidatos) */
    nodes: UnitStructureNode[];
    /** Chamado após criar/remover vínculo (para o organograma refazer o fetch) */
    onChanged?: () => void;
}

/**
 * Diálogo "Vincular a outro setor" do organograma.
 *
 * Um setor filho pode ter dois ou mais pais: o pai primário (parent_id, usado
 * no layout/reorder) e pais secundários (cfg_units_assets_tags_links), que
 * aparecem como aliases (referências) sob cada pai secundário.
 *
 * Regras exibidas ao usuário:
 * - não lista o próprio nó nem o pai primário (já é pai);
 * - não lista descendentes (criaria ciclo — validado também no serviço);
 * - vínculos existentes podem ser removidos.
 */
export const UnitStructureLinkDialog: React.FC<UnitStructureLinkDialogProps> = ({
    isOpen,
    onClose,
    unitId,
    node: nodeProp,
    nodes,
    onChanged,
}) => {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Nó atualizado a partir da lista fresca (fetch após cada vínculo mantém
    // o diálogo em dia sem precisar remontá-lo).
    const currentNode = useMemo(
        () => (nodeProp ? nodes.find(n => n.id === nodeProp.id) ?? nodeProp : null),
        [nodes, nodeProp]
    );

    const secondaryLinkIds = useMemo(
        () => new Set((currentNode?.secondaryLinks || []).map(l => l.parentId)),
        [currentNode]
    );

    // Candidatos: mesmo unitId, ativos, ≠ nó, ≠ pai primário, sem vínculo,
    // e não descendentes do nó (ciclo). Descendentes são calculados aqui para
    // exibição; o serviço revalida antes de inserir.
    const candidates = useMemo(() => {
        if (!currentNode) return [];
        const descendants = collectUnitStructureDescendants(nodes, currentNode.id);
        return nodes
            .filter(n =>
                n.id !== currentNode.id &&
                n.isActive &&
                n.parentId !== currentNode.id &&
                n.id !== currentNode.parentId &&
                !secondaryLinkIds.has(n.id) &&
                !descendants.has(n.id)
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [nodes, currentNode, secondaryLinkIds]);

    // Filtro por texto (nome ou código), sem diferenciar maiúsculas/acentos
    const filteredCandidates = useMemo(() => {
        const q = search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!q) return candidates;
        return candidates.filter(c => {
            const haystack = `${c.name} ${c.code || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return haystack.includes(q);
        });
    }, [candidates, search]);

    const linkedParents = useMemo(() => {
        if (!currentNode) return [];
        return (currentNode.secondaryLinks || [])
            .map(l => ({ ...l, parentNode: nodes.find(n => n.id === l.parentId) }))
            .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.parentNode?.name || '').localeCompare(b.parentNode?.name || ''));
    }, [nodes, currentNode]);

    if (!currentNode) return null;

    const node = currentNode;

    const handleLink = async (parentId: string) => {
        setBusyId(parentId);
        try {
            await dataService.linkUnitStructureNode(unitId, node.id, parentId);
            toast.success(`"${node.name}" vinculado a "${nodes.find(n => n.id === parentId)?.name || 'setor'}".`);
            onChanged?.();
        } catch (err: any) {
            console.error('Error linking sector:', err);
            toast.error(err?.message || 'Erro ao vincular setor.');
        } finally {
            setBusyId(null);
        }
    };

    const handleUnlink = async (parentId: string) => {
        setBusyId(parentId);
        try {
            await dataService.unlinkUnitStructureNode(node.id, parentId);
            toast.success('Vínculo removido.');
            onChanged?.();
        } catch (err: any) {
            console.error('Error unlinking sector:', err);
            toast.error(err?.message || 'Erro ao remover vínculo.');
        } finally {
            setBusyId(null);
        }
    };

    const sectionTitle = 'text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2';
    const rowClass = 'flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_link</span>
                    SETOR PAI SECUNDARIO
                </span>
            }
            maxWidth="md"
        >
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                O setor <strong className="text-slate-700 dark:text-slate-200">"{node.name}"</strong> continuará
                sob o pai primário{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                    {node.parentId
                        ? nodes.find(n => n.id === node.parentId)?.name || '—'
                        : 'nível principal'}
                </strong>{' '}
                e também aparecerá como referência sob os pais vinculados abaixo. A disponibilidade segue a
                regra OR: o setor fica indisponível em cascata apenas quando{' '}
                <strong className="text-slate-700 dark:text-slate-200">todos</strong> os pais estiverem
                indisponíveis.
            </p>

            {/* Vínculos atuais */}
            <div className="mb-5">
                <p className={sectionTitle}>Pais vinculados ({linkedParents.length})</p>
                {linkedParents.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                        Nenhum vínculo secundário. Use a lista abaixo para adicionar.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {linkedParents.map(link => (
                            <div key={link.parentId} className={rowClass}>
                                <span className="flex-1 min-w-0 text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                    {link.parentNode?.name || `Setor ${link.parentId}`}
                                </span>
                                <button
                                    onClick={() => handleUnlink(link.parentId)}
                                    disabled={busyId === link.parentId}
                                    title="Remover vínculo"
                                    aria-label="Remover vínculo"
                                    className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">link_off</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Candidatos */}
            <div>
                <p className={sectionTitle}>Adicionar como pai secundário</p>

                {candidates.length > 0 && (
                    <SearchInput
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                        placeholder="Filtrar setores..."
                        containerClassName="mb-3"
                    />
                )}

                {candidates.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                        Nenhum setor disponível para vínculo (setores já vinculados, o pai primário e os
                        descendentes não aparecem aqui).
                    </p>
                ) : filteredCandidates.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                        Nenhum setor encontrado para "{search.trim()}".
                    </p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredCandidates.map(candidate => (
                            <div key={candidate.id} className={rowClass}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                                        {candidate.name}
                                    </p>
                                    {candidate.code && (
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            {candidate.code}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleLink(candidate.id)}
                                    disabled={busyId === candidate.id}
                                    title="Vincular setor"
                                    aria-label="Vincular setor"
                                    className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {busyId === candidate.id ? 'progress_activity' : 'add_link'}
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
