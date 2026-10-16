import {
    buildAssetActivityMatrix,
    getAvailableYears,
    getBrazilYearMonth,
} from './assetActivityMatrix';
import type { AssetActivityEntry } from '../types';

const entry = (overrides: Partial<AssetActivityEntry> = {}): AssetActivityEntry => ({
    ovAssetId: '1',
    ovId: '10',
    unitDescription: 'UNIDADE A',
    tagDescription: 'SETOR 1',
    tagSubDescription: 'POSIÇÃO A',
    activityId: '7',
    activityDescription: 'Troca de filtro',
    date: '2026-03-15 10:00:00',
    ...overrides,
});

describe('getBrazilYearMonth', () => {
    it('interpreta timestamp sem fuso como horário de São Paulo', () => {
        expect(getBrazilYearMonth('2026-03-01 00:30:00')).toEqual({ year: 2026, month: 2 });
    });

    it('converte timestamp com offset para o dia/mês de São Paulo', () => {
        // 01/03 00:30 UTC ainda é 28/02 em São Paulo.
        expect(getBrazilYearMonth('2026-03-01T00:30:00Z')).toEqual({ year: 2026, month: 1 });
    });

    it('devolve null para data ausente ou inválida', () => {
        expect(getBrazilYearMonth(null)).toBeNull();
        expect(getBrazilYearMonth(undefined)).toBeNull();
        expect(getBrazilYearMonth('')).toBeNull();
        expect(getBrazilYearMonth('invalid')).toBeNull();
    });
});

describe('getAvailableYears', () => {
    it('lista os anos das atividades em ordem decrescente', () => {
        const years = getAvailableYears([
            entry({ date: '2024-05-10 08:00:00' }),
            entry({ date: '2026-01-10 08:00:00' }),
        ], new Date('2025-06-01T12:00:00-03:00'));

        expect(years).toEqual([2026, 2025, 2024]);
    });

    it('inclui o ano corrente mesmo sem atividades', () => {
        expect(getAvailableYears([], new Date('2026-10-16T12:00:00-03:00'))).toEqual([2026]);
    });

    it('não repete anos', () => {
        const years = getAvailableYears([
            entry({ date: '2026-02-10 08:00:00' }),
            entry({ date: '2026-09-10 08:00:00' }),
        ], new Date('2026-10-16T12:00:00-03:00'));

        expect(years).toEqual([2026]);
    });
});

describe('buildAssetActivityMatrix', () => {
    it('soma a quantidade de atividades por mês do ano selecionado', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2026-01-05 09:00:00' }),
            entry({ date: '2026-01-20 09:00:00', ovAssetId: '2', ovId: '11' }),
            entry({ date: '2026-12-31 23:30:00', ovAssetId: '3', ovId: '12' }),
        ], 2026);

        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].months[0]).toBe(2);   // Janeiro
        expect(matrix.rows[0].months[11]).toBe(1);  // Dezembro
        expect(matrix.rows[0].months[5]).toBe(0);   // Junho
        expect(matrix.rows[0].total).toBe(3);
        expect(matrix.monthTotals[0]).toBe(2);
        expect(matrix.monthTotals[11]).toBe(1);
        expect(matrix.total).toBe(3);
    });

    it('ignora atividades de outros anos', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2025-03-10 09:00:00' }),
            entry({ date: '2026-03-10 09:00:00' }),
        ], 2026);

        expect(matrix.total).toBe(1);
        expect(matrix.rows[0].months[2]).toBe(1);
    });

    it('separa linhas por Unidade, Setor, Posição e Atividade', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2026-04-02 09:00:00' }),
            entry({ date: '2026-04-03 09:00:00', unitDescription: 'UNIDADE B' }),
            entry({ date: '2026-04-04 09:00:00', tagDescription: 'SETOR 2' }),
            entry({ date: '2026-04-05 09:00:00', tagSubDescription: 'POSIÇÃO B' }),
            entry({ date: '2026-04-06 09:00:00', activityId: '8', activityDescription: 'Limpeza' }),
        ], 2026);

        expect(matrix.rows).toHaveLength(5);
        matrix.rows.forEach(row => expect(row.total).toBe(1));
        expect(matrix.monthTotals[3]).toBe(5);
    });

    it('normaliza espaços das descrições vindas do banco', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2026-05-02 09:00:00', unitDescription: 'EBAP 04  ', tagDescription: ' BOMBEAMENTO' }),
            entry({ date: '2026-05-20 09:00:00', unitDescription: 'EBAP 04', tagDescription: 'BOMBEAMENTO ' }),
        ], 2026);

        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].unitDescription).toBe('EBAP 04');
        expect(matrix.rows[0].tagDescription).toBe('BOMBEAMENTO');
        expect(matrix.rows[0].months[4]).toBe(2);
    });

    it('agrupa pela mesma combinação mesmo em visitas diferentes', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2026-07-02 09:00:00', ovId: '10', ovAssetId: '1' }),
            entry({ date: '2026-07-30 09:00:00', ovId: '11', ovAssetId: '2' }),
        ], 2026);

        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].months[6]).toBe(2);
    });

    it('usa o mês de São Paulo para datas com offset explícito', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: '2026-03-01T00:30:00Z' }), // 28/02 21:30 BRT
        ], 2026);

        expect(matrix.rows[0].months[2]).toBe(0);
        expect(matrix.rows[0].months[1]).toBe(1);
    });

    it('ignora atividades sem data válida', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ date: null }),
            entry({ date: 'invalid' }),
        ], 2026);

        expect(matrix.rows).toHaveLength(0);
        expect(matrix.total).toBe(0);
        expect(matrix.monthTotals).toEqual(new Array(12).fill(0));
    });

    it('ordena as linhas por Unidade, Setor, Posição e Atividade', () => {
        const matrix = buildAssetActivityMatrix([
            entry({ unitDescription: 'UNIDADE B', tagDescription: 'A', tagSubDescription: 'A', activityId: '1', activityDescription: 'Z' }),
            entry({ unitDescription: 'UNIDADE A', tagDescription: 'B', tagSubDescription: 'A', activityId: '2', activityDescription: 'A' }),
            entry({ unitDescription: 'UNIDADE A', tagDescription: 'A', tagSubDescription: 'A', activityId: '3', activityDescription: 'M' }),
        ], 2026);

        expect(matrix.rows.map(r => [r.unitDescription, r.tagDescription])).toEqual([
            ['UNIDADE A', 'A'],
            ['UNIDADE A', 'B'],
            ['UNIDADE B', 'A'],
        ]);
    });

    it('devolve matriz vazia quando não há atividades no ano', () => {
        const matrix = buildAssetActivityMatrix([], 2026);

        expect(matrix.rows).toHaveLength(0);
        expect(matrix.total).toBe(0);
        expect(matrix.monthTotals).toHaveLength(12);
    });
});
