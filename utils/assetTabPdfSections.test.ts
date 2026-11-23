import { buildAlertsSections, buildComponentsSections, buildLoansSections, buildManualsSections, buildActivitiesSections, formatAttributeDisplayValue } from './assetTabPdfSections';
import type { AssetAttribute } from '../types';

describe('assetTabPdfSections', () => {
    it('alertas: aberto/resolvido e linhas com o nº de colunas', () => {
        const [s] = buildAlertsSections([
            { id: '1', assetId: 'a', isDone: false, isDeleted: false, description: 'Vazamento', priorityName: 'Alta' },
            { id: '2', assetId: 'a', isDone: true, isDeleted: false, resolvedAt: '2026-10-01T10:00:00' },
        ] as any);
        expect(s.rows).toHaveLength(2);
        s.rows.forEach(r => expect(r).toHaveLength(s.columns.length));
        expect(s.rows[0][4]).toBe('Aberto');
        expect(s.rows[1][4]).toMatch(/^Resolvido em /);
    });

    it('empréstimos: traduz tipo e situação', () => {
        const [s] = buildLoansSections([{ id: '1', assetId: 'a', recordType: 'loan', borrowerName: 'João', status: 'pending', computedStatus: 'overdue', createdAt: '2026-10-01T10:00:00', isDeleted: false }] as any);
        expect(s.rows[0][0]).toBe('Empréstimo');
        expect(s.rows[0][6]).toBe('Atrasado');
    });

    it('manuais: uma linha por arquivo e linha única quando sem arquivos', () => {
        const [s] = buildManualsSections([
            { id: '1', code: 'M1', description: 'Manual A', files: [{ docFileName: 'a.pdf', fileType: 'pdf' }, { docFileName: 'b.png', fileType: 'image' }] as any },
            { id: '2', description: 'Manual B', files: [] },
        ]);
        expect(s.rows).toHaveLength(3);
        expect(s.rows[0][0]).toBe('M1 - Manual A');
        expect(s.rows[2][1]).toBe('Sem arquivos');
    });

    it('componentes: original sim/não', () => {
        const [s] = buildComponentsSections([{ id: '1', assetId: 'a', materialId: 'm', amount: 2, isOriginal: false, materialCode: 'X' }]);
        expect(s.rows[0][2]).toBe('2');
        expect(s.rows[0][7]).toBe('Não');
    });

    it('atividades: sem dados no ano não gera linhas nem rodapé problemático', () => {
        const [s] = buildActivitiesSections([], 2026);
        expect(s.rows).toHaveLength(0);
        expect(s.columns).toHaveLength(15);
    });

    it('atributo select usa o rótulo da opção', () => {
        const attr = { id: '1', fieldKey: 'k', label: 'K', dataType: 'select', selectOptions: [{ value: 'a', label: 'Alfa' }] } as unknown as AssetAttribute;
        expect(formatAttributeDisplayValue(attr, 'a')).toBe('Alfa');
        expect(formatAttributeDisplayValue(attr, undefined)).toBe('-');
    });
});
