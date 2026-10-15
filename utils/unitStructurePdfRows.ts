import type { UnitStructureNode } from '../types';

/**
 * Linha do PDF do organograma da unidade (uma ocorrência de setor).
 */
export interface UnitStructurePdfRow {
    name: string;
    code?: string | null;
    /** profundidade na hierarquia (0 = nível principal) */
    depth: number;
    /** nome do setor pai nesta ocorrência (null = nível principal) */
    parentName?: string | null;
    /** null = sem registro de disponibilidade */
    isAvailable: boolean | null;
    /** quantidade de setores subordinados diretamente */
    subSectors: number;
    /** ocorrência como vínculo secundário (referência sob outro pai) */
    isAlias?: boolean;
    /** nome do pai primário real (quando isAlias) */
    primaryParentName?: string | null;
}

/**
 * Achata a hierarquia de setores em linhas ordenadas (DFS com guarda de ciclo).
 * Setores com dois ou mais pais (vínculos secundários em `secondaryLinks`)
 * aparecem também como ocorrência (alias) sob cada pai secundário, além do
 * pai primário — espelhando o comportamento do organograma na tela.
 */
export const buildUnitStructurePdfRows = (nodes: UnitStructureNode[]): UnitStructurePdfRow[] => {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const childrenOf = new Map<string | null, UnitStructureNode[]>();

    nodes.forEach(n => {
        const key = n.parentId && n.parentId !== n.id && byId.has(n.parentId) ? n.parentId : null;
        const list = childrenOf.get(key) || [];
        list.push(n);
        childrenOf.set(key, list);
    });

    // Aliases: ocorrências sob um pai secundário (além do pai primário)
    const aliasesOf = new Map<string, Array<{ node: UnitStructureNode; sortOrder: number; primaryParentName: string | null }>>();
    nodes.forEach(n => {
        (n.secondaryLinks || []).forEach(link => {
            if (!link?.parentId) return;
            const host = byId.get(link.parentId);
            if (!host || host.id === n.id || host.id === n.parentId) return;
            const list = aliasesOf.get(host.id) || [];
            list.push({
                node: n,
                sortOrder: typeof link.sortOrder === 'number' ? link.sortOrder : n.sortOrder,
                primaryParentName: n.parentId ? byId.get(n.parentId)?.name ?? null : null,
            });
            aliasesOf.set(host.id, list);
        });
    });

    // Entradas de um pai: filhos primários + aliases, ordenadas juntas
    type Entry = {
        node: UnitStructureNode;
        sortOrder: number;
        isAlias: boolean;
        primaryParentName?: string | null;
    };
    const entriesOf = (parentId: string | null): Entry[] => {
        const entries: Entry[] = [
            ...(childrenOf.get(parentId) || []).map(c => ({ node: c, sortOrder: c.sortOrder, isAlias: false })),
            ...(parentId !== null ? aliasesOf.get(parentId) || [] : []).map(a => ({
                node: a.node,
                sortOrder: a.sortOrder,
                isAlias: true,
                primaryParentName: a.primaryParentName,
            })),
        ];
        entries.sort((a, b) => a.sortOrder - b.sortOrder || a.node.name.localeCompare(b.node.name));
        return entries;
    };

    const rows: UnitStructurePdfRow[] = [];
    const visited = new Set<string>();

    const walk = (parentId: string | null, depth: number, parentName: string | null) => {
        entriesOf(parentId).forEach(entry => {
            const { node: n, isAlias, primaryParentName } = entry;

            // Alias: ocorrência como referência (sem descer nos filhos — eles
            // aparecem apenas sob o pai primário, evitando duplicidade).
            if (isAlias) {
                rows.push({
                    name: n.name,
                    code: n.code,
                    depth,
                    parentName,
                    isAvailable: n.isAvailable ?? null,
                    subSectors: 0,
                    isAlias: true,
                    primaryParentName,
                });
                return;
            }

            if (visited.has(n.id)) return;
            visited.add(n.id);
            rows.push({
                name: n.name,
                code: n.code,
                depth,
                parentName,
                isAvailable: n.isAvailable ?? null,
                subSectors: entriesOf(n.id).filter(e => !e.isAlias).length,
                isAlias: false,
            });
            walk(n.id, depth + 1, n.name);
        });
    };

    walk(null, 0, null);
    // Órfãos/ciclos (pai fora do conjunto ou laço de parent_id) — nada pode
    // ficar de fora do relatório. Enraizados aqui sem duplicar aliases.
    nodes.forEach(n => {
        if (visited.has(n.id)) return;
        visited.add(n.id);
        rows.push({
            name: n.name,
            code: n.code,
            depth: 0,
            parentName: null,
            isAvailable: n.isAvailable ?? null,
            subSectors: entriesOf(n.id).filter(e => !e.isAlias).length,
            isAlias: false,
        });
        walk(n.id, 1, n.name);
    });

    return rows;
};
