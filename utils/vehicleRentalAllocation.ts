// Rateio de aluguel veicular — helper puro de prévia/cálculo.
// Espelha as fórmulas das RPCs (fc_vehicle_rental_summary / _calculate /
// _allocate) para testar a matemática sem tocar no banco.

export type RentalCostComponent = 'RENTAL' | 'VARIABLE';

export interface RentalContractCandidate {
    id: string;
    vehicleId: string;
    monthlyValue: number;
    startDate: string; // 'YYYY-MM-DD'
    endDate?: string | null;
    active?: boolean;
    isDeleted?: boolean;
}

export interface RentalKmLine {
    ovvId: string; // linha de odômetro (orders_visits_vehicles.id)
    ovId: string;  // visita (orders_visits.id)
    vehicleId: string;
    km: number;
}

export interface RentalAllocationPreview {
    ovvId: string;
    ovId: string;
    vehicleId: string;
    km: number;
    rate: number;
    value: number;
    costComponent: RentalCostComponent;
}

export interface RentalVehicleSummary {
    vehicleId: string;
    contractId?: string;
    contractValue: number;
    hasConflict: boolean;
    totalKm: number;
    costPerKm: number | null;
    allocatedValue: number;
    idleValue: number;
    utilization: number | null;
}

const round = (value: number, digits: number): number => {
    const factor = Math.pow(10, digits);
    return Math.round((value + Number.EPSILON) * factor) / factor;
};

/** '2026-09', '2026-09-15' ou Date → '2026-09-01' */
export const normalizeMonth = (month: string | Date): string => {
    const iso = month instanceof Date
        ? month.toISOString().slice(0, 10)
        : month.slice(0, 10);
    return `${iso.slice(0, 7)}-01`;
};

const monthEnd = (monthStart: string): string => {
    const [y, m] = monthStart.split('-').map(Number);
    const end = new Date(Date.UTC(y, m, 0)); // último dia do mês
    return end.toISOString().slice(0, 10);
};

const cmpIdDesc = (a: string, b: string): number => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
    return b.localeCompare(a);
};

/**
 * Contrato vigente do veículo na competência: mais de um contrato vigente
 * no mês ⇒ o mais recente (maior start_date, depois maior id) vence e o
 * conflito fica sinalizado — mesma regra da RPC fc_vehicle_rental_contract.
 */
export function pickContract(
    contracts: RentalContractCandidate[],
    vehicleId: string,
    month: string | Date
): { contract: RentalContractCandidate | null; conflict: boolean } {
    const start = normalizeMonth(month);
    const end = monthEnd(start);

    const eligible = contracts
        .filter(c =>
            c.vehicleId === vehicleId &&
            c.active !== false &&
            !c.isDeleted &&
            c.startDate <= end &&
            (!c.endDate || c.endDate >= start)
        )
        .sort((a, b) => {
            if (a.startDate !== b.startDate) return a.startDate < b.startDate ? 1 : -1;
            return cmpIdDesc(a.id, b.id);
        });

    if (!eligible.length) return { contract: null, conflict: false };
    return { contract: eligible[0], conflict: eligible.length > 1 };
}

/** aluguel ÷ total_km — total_km = 0 ⇒ null (tudo vira ociosidade). */
export function computeCostPerKm(monthlyValue: number, totalKm: number): number | null {
    if (!totalKm || totalKm <= 0) return null;
    return round(monthlyValue / totalKm, 6);
}

/** Soma dos Km válidos (linha com km > 0). */
export function sumKm(lines: RentalKmLine[]): number {
    return lines.reduce((acc, line) => acc + (line.km > 0 ? line.km : 0), 0);
}

/**
 * Rateio visita a visita: km × custo/km. Linhas sem Km não recebem rateio e
 * duplicatas (mesmo ovvId + costComponent) são ignoradas — é o que garante a
 * idempotência do allocate no helper.
 */
export function computeAllocations(
    lines: RentalKmLine[],
    costPerKm: number | null,
    costComponent: RentalCostComponent = 'RENTAL'
): RentalAllocationPreview[] {
    if (costPerKm == null) return [];

    const seen = new Set<string>();
    const result: RentalAllocationPreview[] = [];

    for (const line of lines) {
        if (!(line.km > 0)) continue;
        const key = `${line.ovvId}|${costComponent}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
            ovvId: line.ovvId,
            ovId: line.ovId,
            vehicleId: line.vehicleId,
            km: line.km,
            rate: costPerKm,
            value: round(line.km * costPerKm, 2),
            costComponent
        });
    }

    return result;
}

/** Re-execução do allocate: remove linhas já alocadas (chave composta). */
export function dedupeAllocations(
    existing: { ovvId: string; costComponent: RentalCostComponent }[],
    incoming: RentalAllocationPreview[]
): RentalAllocationPreview[] {
    const seen = new Set(existing.map(e => `${e.ovvId}|${e.costComponent}`));
    return incoming.filter(a => {
        const key = `${a.ovvId}|${a.costComponent}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** ociosidade = aluguel − Σ rateios */
export function computeIdle(monthlyValue: number, allocations: RentalAllocationPreview[]): number {
    const allocated = allocations.reduce((acc, a) => acc + a.value, 0);
    return round(monthlyValue - allocated, 2);
}

/** taxa de utilização = apropriado ÷ aluguel */
export function computeUtilization(monthlyValue: number, allocatedValue: number): number | null {
    if (!monthlyValue) return null;
    return round(allocatedValue / monthlyValue, 4);
}

/** Resumo por veículo (uma linha por veículo, como a tela de Apuração). */
export function summarizeVehicles(
    contracts: RentalContractCandidate[],
    lines: RentalKmLine[],
    month: string | Date
): RentalVehicleSummary[] {
    const vehicleIds = Array.from(new Set([
        ...contracts.map(c => c.vehicleId),
        ...lines.map(l => l.vehicleId)
    ]));

    return vehicleIds.map(vehicleId => {
        const { contract, conflict } = pickContract(contracts, vehicleId, month);
        const vehicleLines = lines.filter(l => l.vehicleId === vehicleId);
        const totalKm = sumKm(vehicleLines);
        const contractValue = contract ? contract.monthlyValue : 0;
        const costPerKm = computeCostPerKm(contractValue, totalKm);
        const allocations = computeAllocations(vehicleLines, costPerKm);
        const allocatedValue = round(allocations.reduce((acc, a) => acc + a.value, 0), 2);

        return {
            vehicleId,
            contractId: contract?.id,
            contractValue,
            hasConflict: conflict,
            totalKm,
            costPerKm,
            allocatedValue,
            idleValue: computeIdle(contractValue, allocations),
            utilization: computeUtilization(contractValue, allocatedValue)
        };
    });
}
