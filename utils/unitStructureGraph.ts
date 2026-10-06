import { UnitStructureNode } from '../types';

/**
 * Grafo da estrutura de setores em DAG: cada nó tem um pai primário
 * (parent_id — usado em layout/reorder/rateio) e pais secundários
 * (cfg_units_assets_tags_links — ocorrências como "alias" sob outro setor).
 *
 * Funções puras, sem rede/banco, para validação de ciclo e coleta de
 * subárvore usadas pelo serviço e pela UI.
 */

/** Monta o mapa filhos → pai(s) percorrendo as duas arestas do DAG. */
export function buildUnitStructureChildrenMap(
    nodes: UnitStructureNode[]
): Map<string, string[]> {
    const childrenOf = new Map<string, string[]>();
    const push = (parent: string, child: string) => {
        if (!childrenOf.has(parent)) childrenOf.set(parent, []);
        childrenOf.get(parent)!.push(child);
    };
    nodes.forEach(n => {
        if (n.parentId) push(n.parentId, n.id);
        (n.secondaryLinks || []).forEach(l => push(l.parentId, n.id));
    });
    return childrenOf;
}

/**
 * Descendentes de um nó no DAG: percorre pai primário (parent_id) E
 * vínculos secundários. Inclui o próprio nó. Guard de ciclo: cada nó é
 * visitado no máximo uma vez (Set de resultado).
 */
export function collectUnitStructureDescendants(
    nodes: UnitStructureNode[],
    nodeId: string
): Set<string> {
    const childrenOf = buildUnitStructureChildrenMap(nodes);

    const result = new Set<string>([nodeId]);
    const stack = [nodeId];
    while (stack.length > 0) {
        const current = stack.pop()!;
        (childrenOf.get(current) || []).forEach(child => {
            if (!result.has(child)) {
                result.add(child);
                stack.push(child);
            }
        });
    }
    return result;
}
