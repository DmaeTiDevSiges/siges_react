import { buildUnitStructurePdfRows } from './unitStructurePdfRows';
import type { UnitStructureNode } from '../types';

const node = (
    id: string,
    name: string,
    parentId: string | null,
    sortOrder = 0,
    extra: Partial<UnitStructureNode> = {}
): UnitStructureNode => ({
    id,
    unitId: 'u1',
    assetTagId: null,
    assetTagSubId: null,
    name,
    code: null,
    parentId,
    sortOrder,
    isActive: true,
    isAvailable: null,
    ...extra,
});

describe('buildUnitStructurePdfRows', () => {
    it('achata a hierarquia com profundidade e nome do pai', () => {
        const rows = buildUnitStructurePdfRows([
            node('1', 'Diretoria', null, 0),
            node('2', 'Operações', '1', 0),
            node('3', 'Campo', '2', 0),
            node('4', 'Administrativo', null, 1),
        ]);

        expect(rows.map(r => [r.name, r.depth, r.parentName])).toEqual([
            ['Diretoria', 0, null],
            ['Operações', 1, 'Diretoria'],
            ['Campo', 2, 'Operações'],
            ['Administrativo', 0, null],
        ]);
        expect(rows.find(r => r.name === 'Diretoria')?.subSectors).toBe(1);
    });

    it('mostra setores com dois ou mais pais: primário + alias sob cada pai secundário', () => {
        const rows = buildUnitStructurePdfRows([
            node('1', 'Diretoria', null, 0),
            node('2', 'Operações', '1', 0),
            node('3', 'Comercial', '1', 1),
            node('4', 'Suporte', '3', 0, {
                secondaryLinks: [{ parentId: '2', sortOrder: 1 }],
            }),
        ]);

        // Suporte aparece 2x: sob o pai primário (Comercial) e como alias sob Operações
        const occurrences = rows.filter(r => r.name === 'Suporte');
        expect(occurrences).toHaveLength(2);

        const primary = occurrences.find(r => !r.isAlias);
        expect(primary).toMatchObject({ depth: 2, parentName: 'Comercial', isAlias: false });

        const alias = occurrences.find(r => r.isAlias);
        expect(alias).toMatchObject({
            depth: 2,
            parentName: 'Operações',
            isAlias: true,
            primaryParentName: 'Comercial',
            subSectors: 0,
        });

        // Alias entra logo após os filhos primários de Operações (sortOrder 1)
        const names = rows.map(r => `${r.depth}:${r.name}${r.isAlias ? '*' : ''}`);
        expect(names).toEqual([
            '0:Diretoria',
            '1:Operações',
            '2:Suporte*',
            '1:Comercial',
            '2:Suporte',
        ]);
    });

    it('não duplica alias quando o pai secundário é igual ao primário', () => {
        const rows = buildUnitStructurePdfRows([
            node('1', 'Raiz', null, 0),
            node('2', 'Filho', '1', 0, {
                secondaryLinks: [{ parentId: '1', sortOrder: 0 }],
            }),
        ]);

        expect(rows.filter(r => r.name === 'Filho')).toHaveLength(1);
    });

    it('não entra em loop com ciclo de parent_id e não perde nós', () => {
        const rows = buildUnitStructurePdfRows([
            node('1', 'A', '2'),
            node('2', 'B', '1'),
            node('3', 'C', null),
        ]);

        expect(rows.map(r => r.name).sort()).toEqual(['A', 'B', 'C']);
    });
});
