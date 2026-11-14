import {
    computeMoExtraByUnit, computeMoExtraSummary, computeSectorPercentage, computeSectorsStats, computeUnitsRows, filterByUnitTypes,
} from './unitsAssetsTagsDashboard';

const row = (over: Record<string, unknown> = {}) => ({
    id: 1, unit_id: 10, unit_description: 'Unidade A', tag_description: 'Água', tag_sub_description: 'Bomba 1',
    last_is_available: true, last_asset_available_rate: 1, last_reported_at: '2026-11-10T10:00:00',
    asset_tag_id: 5, ...over,
});

describe('filterByUnitTypes', () => {
    const rows = [{ id: 1, units: { unit_type_parent_id: 3 } }, { id: 2, units: { unit_type_parent_id: 4 } }, { id: 3 }];
    it('sem filtro devolve tudo', () => expect(filterByUnitTypes(rows, [])).toBe(rows));
    it('filtra pelo tipo pai da unidade (comparando como texto)', () => {
        expect(filterByUnitTypes(rows, ['3']).map(r => r.id)).toEqual([1]);
        expect(filterByUnitTypes(rows, ['3', '4']).map(r => r.id)).toEqual([1, 2]);
    });
});

describe('computeMoExtraByUnit', () => {
    const workers = [
        { unitId: 1, workersExtraAmount: 2, noticeId: 20, noticeTitle: 'B', companyName: 'Emp1' },
        { unitId: 1, workersExtraAmount: 3, noticeId: 10, noticeTitle: 'A', companyName: 'Emp2' },
        { unitId: 1, workersExtraAmount: 1, noticeId: 10, noticeTitle: 'A', companyName: 'Emp1' },
        { unitId: 2, workersExtraAmount: 0, noticeId: 10, companyName: 'Emp1' },
        { unitId: 0, workersExtraAmount: 5, noticeId: 10, companyName: 'Emp1' },
    ];

    it('soma por unidade, agrupa por aviso e ignora quantidade zero ou unidade inválida', () => {
        const map = computeMoExtraByUnit(workers, []);
        expect([...map.keys()]).toEqual([1]);
        const u1 = map.get(1)!;
        expect(u1.total).toBe(6);
        expect(u1.companies).toHaveLength(3);
        expect(u1.notices.find(n => n.noticeId === 10)).toMatchObject({ total: 4, title: 'A' });
    });

    it('ordena os avisos pela ordem dos avisos ativos; sem ordem, pelo id', () => {
        expect(computeMoExtraByUnit(workers, [{ id: 20 }, { id: 10 }]).get(1)!.notices.map(n => n.noticeId)).toEqual([20, 10]);
        expect(computeMoExtraByUnit(workers, undefined).get(1)!.notices.map(n => n.noticeId)).toEqual([10, 20]);
    });
});

describe('computeMoExtraSummary', () => {
    const workers = [
        { unitId: 1, workersExtraAmount: 2, companyId: 'e1', companyName: 'Emp1' },
        { unitId: 2, workersExtraAmount: 5, companyId: 'e1', companyName: 'Emp1' },
        { unitId: 2, workersExtraAmount: 1, companyId: 'e2', companyName: 'Emp2' },
        { unitId: 9, workersExtraAmount: 7, companyId: 'e3', companyName: 'Fora' },
    ];
    it('considera só as unidades visíveis, soma por empresa e ordena do maior para o menor', () => {
        const r = computeMoExtraSummary(workers, new Set([1, 2]));
        expect(r.total).toBe(8);
        expect(r.companies.map(c => [c.name, c.amount])).toEqual([['Emp1', 7], ['Emp2', 1]]);
    });
    it('sem unidades visíveis zera', () => {
        expect(computeMoExtraSummary(workers, new Set())).toEqual({ total: 0, companies: [] });
    });
});

describe('computeSectorsStats', () => {
    const viewRow = { asset_tag_description: 'Água', flow_rate_is_visible: true, pct_flow_rate_available_fraction: 0.75, flow_rate_unit: 'L/s' };

    it('com a view agregada usa a fração dela, em %', () => {
        const [s] = computeSectorsStats([row(), row({ id: 2, last_is_available: false })], [viewRow], []);
        expect(s).toMatchObject({ name: 'Água', flow: { visible: true, percentage: 75, unit: 'L/s' }, general: { visible: false } });
    });

    it('setor sem visibilidade específica usa o % geral por contagem de disponíveis', () => {
        const [s] = computeSectorsStats(
            [row(), row({ id: 2, last_is_available: false })],
            [{ asset_tag_description: 'Água' }],
            [],
        );
        expect(s.general).toMatchObject({ visible: true, percentage: 50 });
    });

    it('com tipo de unidade filtrado, o % vira a média da taxa das unidades visíveis e some setor sem linhas', () => {
        const rows = [row({ last_asset_available_rate: 0.5 }), row({ id: 2, unit_id: 11, last_asset_available_rate: 1 })];
        const stats = computeSectorsStats(rows, [viewRow, { asset_tag_description: 'Outro', flow_rate_is_visible: true }], ['3']);
        expect(stats.map(s => s.name)).toEqual(['Água']);
        expect(stats[0].flow.percentage).toBe(75);
    });

    it('guarda o relato mais recente do setor', () => {
        const [s] = computeSectorsStats(
            [row({ last_reported_at: '2026-11-01T00:00:00', unit_description: 'Velha' }), row({ id: 2, last_reported_at: '2026-11-09T00:00:00', unit_description: 'Nova' })],
            [viewRow], [],
        );
        expect(s.latestUnit).toBe('Nova');
    });

    it('sem dados da view, agrega só pelas linhas, ordenado por nome', () => {
        const stats = computeSectorsStats([row({ tag_description: 'Zeta' }), row({ id: 2, tag_description: 'Alfa' })], [], []);
        expect(stats.map(s => s.name)).toEqual(['Alfa', 'Zeta']);
    });
});

describe('computeUnitsRows', () => {
    const rows = [
        row({ id: 1, unit_id: 10, unit_description: 'Beta', last_asset_available_rate: 0.2 }),
        row({ id: 2, unit_id: 11, unit_description: 'Alfa', last_asset_available_rate: 1 }),
        row({ id: 3, unit_id: 11, unit_description: 'Alfa', tag_description: 'Outro setor', tag_sub_description: 'Ignorado' }),
    ];

    it('só leva ao ativo do setor selecionado e calcula o % da unidade (limitado a 0–100)', () => {
        const r = computeUnitsRows(rows, 'Água', 'alfabetica', '');
        expect(r.map(u => [u.description, u.percentage, u.assets.length])).toEqual([['Alfa', 100, 1], ['Beta', 20, 1]]);
    });

    it('ordena por disponibilidade (menor primeiro) ou em ordem alfabética', () => {
        expect(computeUnitsRows(rows, 'Água', 'disponibilidade', '').map(u => u.description)).toEqual(['Beta', 'Alfa']);
    });

    it('busca ignora maiúsculas e acentos de caixa pt-BR', () => {
        expect(computeUnitsRows(rows, 'Água', 'alfabetica', '  ALF ').map(u => u.description)).toEqual(['Alfa']);
    });

    it('o valor exibido segue a visibilidade (vazão, depois potência)', () => {
        const [u] = computeUnitsRows([row({ flow_rate_is_visible: true, flow_rate_max: 12, flow_rate_unit: 'L/s' })], 'Água', 'alfabetica', '');
        expect(u.assets[0]).toMatchObject({ value: 12, unit: 'L/s' });
        const [p] = computeUnitsRows([row({ power_is_visible: true, power_max: 30, power_unit: 'kW' })], 'Água', 'alfabetica', '');
        expect(p.assets[0]).toMatchObject({ value: 30, unit: 'kW' });
    });
});

describe('computeSectorPercentage', () => {
    it('sem resumo é 0', () => expect(computeSectorPercentage(null)).toBe(0));
    it('usa a 1ª métrica visível: vazão, potência, pressão, geral', () => {
        const base = { flow: { visible: false, percentage: 1 }, power: { visible: false, percentage: 2 }, pressure: { visible: false, percentage: 3 }, general: { percentage: 4 } };
        expect(computeSectorPercentage({ ...base, flow: { visible: true, percentage: 1 } })).toBe(1);
        expect(computeSectorPercentage({ ...base, power: { visible: true, percentage: 2 } })).toBe(2);
        expect(computeSectorPercentage({ ...base, pressure: { visible: true, percentage: 3 } })).toBe(3);
        expect(computeSectorPercentage(base)).toBe(4);
    });
});
