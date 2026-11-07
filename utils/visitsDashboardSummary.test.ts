import { computeVisitsSummary, matchesProcessingSelection, toProcessingSelection, normalizeVisitsSummary, VisitsSummaryRow } from './visitsDashboardSummary';

const rows: VisitsSummaryRow[] = [
    { id: '1', ovProcessingId: 1, ovCostsStatus: null, totalValue: 100, planLabel: 'Preventiva', unitLabel: 'EBAP 01', ovStartedAt: '2026-11-02T08:00:00' },
    { id: '2', ovProcessingId: 5, ovCostsStatus: 'approved', totalValue: 200, planLabel: 'Corretiva', unitLabel: 'EBAP 01', ovStartedAt: '2026-11-02T09:00:00' },
    { id: '3', ovProcessingId: 5, ovCostsStatus: 'pending', totalValue: 50, planLabel: '', unitLabel: null, ovStartedAt: '2026-11-03T09:00:00' },
    { id: '4', ovProcessingId: 5, ovCostsStatus: 'rejected', totalValue: 30, planLabel: 'Corretiva', unitLabel: 'ETA', ovStartedAt: null },
    { id: '5', ovProcessingId: 5, ovCostsStatus: null, totalValue: null, planLabel: 'Corretiva', unitLabel: 'ETA', ovStartedAt: '2026-11-04T09:00:00' },
];

describe('visitsDashboardSummary', () => {
    it('toProcessingSelection: "all" ou todas as etapas marcadas = sem filtro', () => {
        const all = ['all', '1', '5', 'costs-rejected', 'costs-pending'];
        expect(toProcessingSelection(['all'], all)).toEqual({ isAll: true, selection: [] });
        expect(toProcessingSelection(all, all).isAll).toBe(true);
        expect(toProcessingSelection(['1', 'costs-pending'], all)).toEqual({ isAll: false, selection: ['1', 'costs-pending'] });
    });

    it('seleção: custos pendentes/rejeitados valem só para a etapa 5', () => {
        const sel = { isAll: false, selection: ['costs-pending'] };
        expect(matchesProcessingSelection({ ovProcessingId: 5, ovCostsStatus: null }, sel)).toBe(true);
        expect(matchesProcessingSelection({ ovProcessingId: 5, ovCostsStatus: 'waiting' }, sel)).toBe(true);
        expect(matchesProcessingSelection({ ovProcessingId: 5, ovCostsStatus: 'approved' }, sel)).toBe(false);
        expect(matchesProcessingSelection({ ovProcessingId: 1, ovCostsStatus: null }, sel)).toBe(false);
    });

    it('etapa 5: conta todas, mas soma só custos aprovados', () => {
        const s = computeVisitsSummary(rows, { isAll: true, selection: [] });
        expect(s.stages['5']).toEqual({ count: 4, total: 200 });
        expect(s.stages['1']).toEqual({ count: 1, total: 100 });
        expect(s.all).toEqual({ count: 5, total: 380 });
        expect(s.costsPending).toEqual({ count: 2, total: 50 });
        expect(s.costsRejected).toEqual({ count: 1, total: 30 });
    });

    it('apropriação: etapa 5 marcada usa só custos aprovados', () => {
        expect(computeVisitsSummary(rows, { isAll: false, selection: ['5'] }).appropriationIds).toEqual(['2']);
        expect(computeVisitsSummary(rows, { isAll: false, selection: ['costs-pending'] }).appropriationIds).toEqual(['3', '5']);
        expect(computeVisitsSummary(rows, { isAll: true, selection: [] }).appropriationIds).toEqual(['1', '2', '3', '4', '5']);
    });

    it('gráficos: plano vazio = "Sem Plano", unidade nula = "Sem Unidade", tendência por dia', () => {
        const s = computeVisitsSummary(rows, { isAll: true, selection: [] });
        expect(s.composition.find(c => c.label === 'Sem Plano')?.value).toBe(50);
        expect(s.units.find(u => u.label === 'Sem Unidade')?.value).toBe(50);
        expect(s.trend).toEqual([
            { day: '2026-11-02', count: 2 },
            { day: '2026-11-03', count: 1 },
            { day: '2026-11-04', count: 1 },
        ]);
    });

    it('normaliza o JSON do RPC (numeric como string)', () => {
        const n = normalizeVisitsSummary({ all: { count: '2', total: '10.5' }, stages: { '5': { count: 1, total: '3' } }, appropriationIds: [7, 8] });
        expect(n.all).toEqual({ count: 2, total: 10.5 });
        expect(n.stages['5']).toEqual({ count: 1, total: 3 });
        expect(n.appropriationIds).toEqual(['7', '8']);
    });
});
