import { sortAssetsBySectorPosition, sortBySectorPositionDescription } from './assetReportSort';

describe('sortAssetsBySectorPosition', () => {
    it('ordena por setor, depois posição, depois código', () => {
        const rows = [
            { tagName: 'GER.ENERGIA', tagSubName: 'GERADOR', code: '3' },
            { tagName: 'BOMBEAMENTO', tagSubName: 'GMB 10', code: '1' },
            { tagName: 'BOMBEAMENTO', tagSubName: 'GMB 2', code: '9' },
            { tagName: 'BOMBEAMENTO', tagSubName: 'GMB 2', code: '10' },
            { tagName: 'BOMBEAMENTO', tagSubName: 'GMB 2', code: '2' },
        ];
        expect(sortAssetsBySectorPosition(rows).map(r => `${r.tagName}|${r.tagSubName}|${r.code}`)).toEqual([
            'BOMBEAMENTO|GMB 2|2',
            'BOMBEAMENTO|GMB 2|9',
            'BOMBEAMENTO|GMB 2|10',
            'BOMBEAMENTO|GMB 10|1',
            'GER.ENERGIA|GERADOR|3',
        ]);
    });

    it('sem setor ou sem posição vai para o fim do grupo', () => {
        const rows = [
            { tagName: '', tagSubName: '', code: '1' },
            { tagName: 'UNIDADE', tagSubName: '', code: '2' },
            { tagName: 'UNIDADE', tagSubName: 'QGBT', code: '3' },
        ];
        expect(sortAssetsBySectorPosition(rows).map(r => r.code)).toEqual(['3', '2', '1']);
    });

    it('ignora maiúsculas/acentos e não altera o array original', () => {
        const rows = [{ tagName: 'Ônibus', code: '1' }, { tagName: 'automação', code: '2' }];
        const sorted = sortAssetsBySectorPosition(rows);
        expect(sorted.map(r => r.code)).toEqual(['2', '1']);
        expect(rows[0].code).toBe('1');
    });
});

describe('sortBySectorPositionDescription', () => {
    it('setor → posição → descrição, lendo os campos por seletor', () => {
        const rows = [
            { id: 'a', setor: 'BOMBEAMENTO', pos: 'GMB 01', desc: 'MOTOR WEG' },
            { id: 'b', setor: 'BOMBEAMENTO', pos: 'GMB 01', desc: 'BOMBA CENTRIFUGA' },
            { id: 'c', setor: 'AUTOMACAO', pos: 'PAINEL', desc: 'CLP' },
            { id: 'd', setor: 'BOMBEAMENTO', pos: 'GMB 10', desc: 'BOMBA' },
            { id: 'e', setor: 'BOMBEAMENTO', pos: 'GMB 2', desc: 'BOMBA' },
        ];
        const sorted = sortBySectorPositionDescription(rows, r => ({ tagName: r.setor, tagSubName: r.pos, description: r.desc }));
        expect(sorted.map(r => r.id)).toEqual(['c', 'b', 'a', 'e', 'd']);
    });
});
