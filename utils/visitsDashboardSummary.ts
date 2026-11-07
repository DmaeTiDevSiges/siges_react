/**
 * Gestão > Visitas — regras de seleção de etapas e resumo (contadores, totais,
 * gráficos, ids de apropriação).
 *
 * A fonte principal é o RPC fn_orders_visits_dashboard_summary (migration
 * 20261114). Estas funções reproduzem as MESMAS regras no navegador e são usadas:
 *   • como fallback, enquanto o RPC não existir no banco;
 *   • nos testes de paridade com o SQL.
 */

export interface VisitsSummaryRow {
    id: string;
    ovProcessingId?: number | null;
    ovCostsStatus?: string | null;
    totalValue?: number | null;
    planLabel?: string | null;
    unitLabel?: string | null;
    ovStartedAt?: string | null;
}

export interface CountTotal {
    count: number;
    total: number;
}

export interface VisitsDashboardSummary {
    all: CountTotal;
    stages: Record<string, CountTotal>;
    costsRejected: CountTotal;
    costsPending: CountTotal;
    selection: { count: number };
    composition: { label: string; value: number }[];
    trend: { day: string; count: number }[];
    units: { label: string; value: number }[];
    appropriationIds: string[];
}

export interface ProcessingSelection {
    /** true = todas as etapas (sem filtro). */
    isAll: boolean;
    /** Valores marcados: ids de etapa ('1'..'n'), 'costs-pending', 'costs-rejected'. */
    selection: string[];
}

export const EMPTY_VISITS_SUMMARY: VisitsDashboardSummary = {
    all: { count: 0, total: 0 },
    stages: {},
    costsRejected: { count: 0, total: 0 },
    costsPending: { count: 0, total: 0 },
    selection: { count: 0 },
    composition: [],
    trend: [],
    units: [],
    appropriationIds: [],
};

const isCostsPending = (costs?: string | null) => !costs || costs === 'pending' || costs === 'waiting';

/**
 * Converte o estado da tela (['all'] ou lista de valores; allStageIds = todos os
 * valores possíveis, incluindo 'all') no par isAll/selection do RPC.
 */
export function toProcessingSelection(selected: string[], allStageIds: string[]): ProcessingSelection {
    const isAll = selected.includes('all') || (allStageIds.length > 0 && selected.length === allStageIds.length);
    return { isAll, selection: selected.filter(v => v !== 'all') };
}

/** A visita entra na lista com as etapas selecionadas? */
export function matchesProcessingSelection(
    row: Pick<VisitsSummaryRow, 'ovProcessingId' | 'ovCostsStatus'>,
    { isAll, selection }: ProcessingSelection
): boolean {
    if (isAll) return true;
    const proc = row.ovProcessingId;
    if (proc != null && selection.includes(String(proc))) return true;
    if (selection.includes('costs-pending') && proc === 5 && isCostsPending(row.ovCostsStatus)) return true;
    if (selection.includes('costs-rejected') && proc === 5 && row.ovCostsStatus === 'rejected') return true;
    return false;
}

/** Visitas usadas nas apropriações (serviços/materiais/veículos/movimentações). */
function matchesAppropriation(row: VisitsSummaryRow, selection: string[]): boolean {
    if (selection.includes('5')) return row.ovCostsStatus === 'approved';
    if (selection.includes('costs-pending')) return isCostsPending(row.ovCostsStatus);
    if (selection.includes('costs-rejected')) return row.ovCostsStatus === 'rejected';
    return true;
}

const sumTotals = (rows: VisitsSummaryRow[]) => rows.reduce((acc, r) => acc + (Number(r.totalValue) || 0), 0);

const groupSum = (rows: VisitsSummaryRow[], label: (r: VisitsSummaryRow) => string) => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(label(r), (map.get(label(r)) || 0) + (Number(r.totalValue) || 0)));
    return Array.from(map.entries())
        .map(([l, value]) => ({ label: l, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};

/**
 * Resumo da tela a partir das linhas JÁ filtradas por período/filtros/busca.
 * Mesmo resultado de fn_orders_visits_dashboard_summary.
 */
export function computeVisitsSummary(base: VisitsSummaryRow[], sel: ProcessingSelection): VisitsDashboardSummary {
    const stages: Record<string, CountTotal> = {};
    base.forEach(r => {
        if (r.ovProcessingId == null) return;
        const key = String(r.ovProcessingId);
        const entry = stages[key] || (stages[key] = { count: 0, total: 0 });
        entry.count += 1;
        if (r.ovProcessingId !== 5 || r.ovCostsStatus === 'approved') entry.total += Number(r.totalValue) || 0;
    });

    const rejected = base.filter(r => r.ovProcessingId === 5 && r.ovCostsStatus === 'rejected');
    const pending = base.filter(r => r.ovProcessingId === 5 && isCostsPending(r.ovCostsStatus));
    const selected = base.filter(r => matchesProcessingSelection(r, sel));

    const daily = new Map<string, number>();
    selected.forEach(r => {
        if (!r.ovStartedAt) return;
        const day = r.ovStartedAt.slice(0, 10);
        daily.set(day, (daily.get(day) || 0) + 1);
    });
    const trend = Array.from(daily.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-10)
        .map(([day, count]) => ({ day, count }));

    return {
        all: { count: base.length, total: sumTotals(base) },
        stages,
        costsRejected: { count: rejected.length, total: sumTotals(rejected) },
        costsPending: { count: pending.length, total: sumTotals(pending) },
        selection: { count: selected.length },
        composition: groupSum(selected, r => r.planLabel || 'Sem Plano'),
        trend,
        units: groupSum(selected, r => r.unitLabel || 'Sem Unidade'),
        appropriationIds: selected
            .filter(r => matchesAppropriation(r, sel.selection))
            .map(r => String(r.id))
            .sort((a, b) => Number(a) - Number(b)),
    };
}

/** Normaliza o JSON do RPC (números podem vir como string/numeric). */
export function normalizeVisitsSummary(raw: any): VisitsDashboardSummary {
    const ct = (v: any): CountTotal => ({ count: Number(v?.count) || 0, total: Number(v?.total) || 0 });
    const stages: Record<string, CountTotal> = {};
    Object.entries(raw?.stages || {}).forEach(([k, v]) => { stages[k] = ct(v); });
    return {
        all: ct(raw?.all),
        stages,
        costsRejected: ct(raw?.costsRejected),
        costsPending: ct(raw?.costsPending),
        selection: { count: Number(raw?.selection?.count) || 0 },
        composition: (raw?.composition || []).map((c: any) => ({ label: String(c.label), value: Number(c.value) || 0 })),
        trend: (raw?.trend || []).map((t: any) => ({ day: String(t.day).slice(0, 10), count: Number(t.count) || 0 })),
        units: (raw?.units || []).map((u: any) => ({ label: String(u.label), value: Number(u.value) || 0 })),
        appropriationIds: (raw?.appropriationIds || []).map((id: any) => String(id)),
    };
}
