/**
 * Testes do grafo DAG da estrutura de setores (pai primário + pais secundários).
 * Executar: npm test -- unitStructureGraph
 */
import {
    buildUnitStructureChildrenMap,
    collectUnitStructureDescendants,
} from './unitStructureGraph';
import { UnitStructureNode } from '../types';

function makeNode(
    id: string,
    parentId: string | null,
    secondaryLinks: Array<{ parentId: string; sortOrder: number }> = []
): UnitStructureNode {
    return {
        id,
        name: id,
        code: id,
        parentId,
        sortOrder: 0,
        isActive: true,
        secondaryLinks,
    } as UnitStructureNode;
}

describe('buildUnitStructureChildrenMap', () => {
    it('registra filhos pelas duas arestas (primária e secundária)', () => {
        const nodes = [
            makeNode('a', null),
            makeNode('b', 'a'),
            makeNode('c', 'a', [{ parentId: 'b', sortOrder: 0 }]),
        ];
        const map = buildUnitStructureChildrenMap(nodes);
        expect(map.get('a')).toEqual(expect.arrayContaining(['b', 'c']));
        expect(map.get('b')).toEqual(expect.arrayContaining(['c']));
        expect(map.has('c')).toBe(false);
    });

    it('não registra nó sem pai e ignora link igual ao pai primário', () => {
        const nodes = [
            makeNode('root', null),
            makeNode('child', 'root', [{ parentId: 'root', sortOrder: 1 }]),
        ];
        const map = buildUnitStructureChildrenMap(nodes);
        expect(map.get('root')).toEqual(expect.arrayContaining(['child']));
    });
});

describe('collectUnitStructureDescendants', () => {
    it('inclui o próprio nó mesmo sem filhos', () => {
        const nodes = [makeNode('a', null)];
        const result = collectUnitStructureDescendants(nodes, 'a');
        expect(result.size).toBe(1);
        expect(result.has('a')).toBe(true);
    });

    it('percorre a subárvore do pai primário', () => {
        const nodes = [
            makeNode('a', null),
            makeNode('b', 'a'),
            makeNode('c', 'b'),
            makeNode('d', null),
        ];
        const resultA = collectUnitStructureDescendants(nodes, 'a');
        expect(resultA.size).toBe(3);
        expect(resultA.has('a')).toBe(true);
        expect(resultA.has('b')).toBe(true);
        expect(resultA.has('c')).toBe(true);
        const resultB = collectUnitStructureDescendants(nodes, 'b');
        expect(resultB.size).toBe(2);
        expect(resultB.has('b')).toBe(true);
        expect(resultB.has('c')).toBe(true);
    });

    it('segue vínculos secundários (DAG): filho de dois pais é descendente de ambos', () => {
        const nodes = [
            makeNode('root', null),
            makeNode('bomba', 'root'),
            makeNode('gerador', 'root'),
            makeNode('gmb', 'bomba', [{ parentId: 'gerador', sortOrder: 0 }]),
        ];
        const resultRoot = collectUnitStructureDescendants(nodes, 'root');
        expect(resultRoot.size).toBe(4);
        expect(resultRoot.has('root')).toBe(true);
        expect(resultRoot.has('bomba')).toBe(true);
        expect(resultRoot.has('gerador')).toBe(true);
        expect(resultRoot.has('gmb')).toBe(true);
        const resultGerador = collectUnitStructureDescendants(nodes, 'gerador');
        expect(resultGerador.size).toBe(2);
        expect(resultGerador.has('gerador')).toBe(true);
        expect(resultGerador.has('gmb')).toBe(true);
        const resultBomba = collectUnitStructureDescendants(nodes, 'bomba');
        expect(resultBomba.size).toBe(2);
        expect(resultBomba.has('bomba')).toBe(true);
        expect(resultBomba.has('gmb')).toBe(true);
    });

    it('não entra em loop em grafo com ciclo sintético', () => {
        const nodes = [
            makeNode('a', 'c', [{ parentId: 'b', sortOrder: 0 }]),
            makeNode('b', 'a'),
            makeNode('c', 'b'),
        ];
        const result = collectUnitStructureDescendants(nodes, 'a');
        expect(result.size).toBe(3);
        expect(result.has('a')).toBe(true);
        expect(result.has('b')).toBe(true);
        expect(result.has('c')).toBe(true);
    });

    it('não mistura nós de outra raiz', () => {
        const nodes = [
            makeNode('a', null),
            makeNode('b', 'a'),
            makeNode('x', null),
            makeNode('y', 'x', [{ parentId: 'a', sortOrder: 0 }]),
        ];
        const resultX = collectUnitStructureDescendants(nodes, 'x');
        expect(resultX.size).toBe(2);
        expect(resultX.has('x')).toBe(true);
        expect(resultX.has('y')).toBe(true);
        const resultA = collectUnitStructureDescendants(nodes, 'a');
        expect(resultA.size).toBe(3);
        expect(resultA.has('a')).toBe(true);
        expect(resultA.has('b')).toBe(true);
        expect(resultA.has('y')).toBe(true);
    });
});