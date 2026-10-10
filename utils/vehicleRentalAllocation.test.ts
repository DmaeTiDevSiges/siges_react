/**
 * Testes do helper puro do rateio de aluguel veicular.
 * Executar: npm test -- vehicleRentalAllocation
 */
import {
    RentalContractCandidate,
    RentalKmLine,
    computeAllocations,
    computeCostPerKm,
    computeIdle,
    computeUtilization,
    dedupeAllocations,
    normalizeMonth,
    pickContract,
    sumKm,
    summarizeVehicles
} from './vehicleRentalAllocation';

const MONTH = '2026-09-01';

const contract = (over: Partial<RentalContractCandidate> = {}): RentalContractCandidate => ({
    id: '10',
    vehicleId: '1',
    monthlyValue: 6000,
    startDate: '2026-01-01',
    endDate: null,
    active: true,
    ...over
});

const line = (over: Partial<RentalKmLine> = {}): RentalKmLine => ({
    ovvId: '101',
    ovId: '1',
    vehicleId: '1',
    km: 150,
    ...over
});

describe('normalizeMonth', () => {
    it('normaliza qualquer formato para o 1º dia do mês', () => {
        expect(normalizeMonth('2026-09')).toBe('2026-09-01');
        expect(normalizeMonth('2026-09-17')).toBe('2026-09-01');
        expect(normalizeMonth('2026-10')).toBe('2026-10-01');
    });
});

describe('pickContract (vigência)', () => {
    it('escolhe o contrato vigente na competência', () => {
        const { contract: c, conflict } = pickContract([contract()], '1', MONTH);
        expect(c?.id).toBe('10');
        expect(conflict).toBe(false);
    });

    it('ignora contrato ainda não iniciado e encerrado antes do mês', () => {
        const notStarted = contract({ id: '11', startDate: '2026-10-01' });
        const expired = contract({ id: '12', startDate: '2026-01-01', endDate: '2026-08-31' });
        const { contract: c } = pickContract([notStarted, expired], '1', MONTH);
        expect(c).toBeNull();
    });

    it('aceita contrato que termina no 1º dia do mês (vigência abrange o mês)', () => {
        const { contract: c } = pickContract(
            [contract({ endDate: '2026-09-01' })],
            '1',
            MONTH
        );
        expect(c?.id).toBe('10');
    });

    it('dois contratos sobrepostos ⇒ vence o mais recente e sinaliza conflito', () => {
        const older = contract({ id: '10', startDate: '2026-01-01', monthlyValue: 5000 });
        const newer = contract({ id: '20', startDate: '2026-09-01', monthlyValue: 7000 });
        const { contract: c, conflict } = pickContract([older, newer], '1', MONTH);
        expect(c?.id).toBe('20');
        expect(c?.monthlyValue).toBe(7000);
        expect(conflict).toBe(true);
    });

    it('só considera contratos do veículo pedido', () => {
        const other = contract({ id: '99', vehicleId: '2', monthlyValue: 9999 });
        const { contract: c } = pickContract([other, contract()], '1', MONTH);
        expect(c?.id).toBe('10');
    });

    it('contrato inativo não é escolhido', () => {
        const { contract: c } = pickContract([contract({ active: false })], '1', MONTH);
        expect(c).toBeNull();
    });
});

describe('computeCostPerKm', () => {
    it('custo/km = aluguel ÷ total_km', () => {
        expect(computeCostPerKm(6000, 3000)).toBe(2);
    });

    it('total_km = 0 ⇒ null (sem rateio, tudo ociosidade)', () => {
        expect(computeCostPerKm(6000, 0)).toBeNull();
        expect(computeCostPerKm(3000, -10)).toBeNull();
    });
});

describe('computeAllocations', () => {
    it('rateio proporcional ao Km: 150 km × 2 = R$ 300', () => {
        const allocations = computeAllocations(
            [line({ ovvId: '1', km: 150 }), line({ ovvId: '2', km: 1250 })],
            2
        );
        expect(allocations.map(a => a.value)).toEqual([300, 2500]);
        expect(allocations[0].costComponent).toBe('RENTAL');
    });

    it('linhas com km 0 não recebem rateio', () => {
        const allocations = computeAllocations([line({ ovvId: '3', km: 0 })], 2);
        expect(allocations).toHaveLength(0);
    });

    it('custo/km null ⇒ nenhuma alocação', () => {
        expect(computeAllocations([line()], null)).toHaveLength(0);
    });

    it('é idempotente: repetir a mesma linha não duplica', () => {
        const lines = [line({ ovvId: '1' }), line({ ovvId: '1' })];
        const first = computeAllocations(lines, 2);
        const second = computeAllocations(lines, 2);
        expect(first).toHaveLength(1);
        expect(dedupeAllocations(first, second)).toHaveLength(0);
    });

    it('cost_component distinto não colide (RENTAL x VARIABLE)', () => {
        const lines = [line({ ovvId: '1' })];
        const rental = computeAllocations(lines, 2, 'RENTAL');
        const variable = computeAllocations(lines, 2, 'VARIABLE');
        expect(dedupeAllocations(rental, variable)).toHaveLength(1);
    });
});

describe('ociosidade e utilização', () => {
    it('rateio total igual ao aluguel ⇒ ociosidade 0 e utilização 100%', () => {
        const allocations = computeAllocations(
            [line({ ovvId: '1', km: 150 }), line({ ovvId: '2', km: 2850 })],
            2
        );
        expect(computeIdle(6000, allocations)).toBe(0);
        expect(computeUtilization(6000, 6000)).toBe(1);
    });

    it('sem Km ⇒ aluguel integralmente ocioso', () => {
        expect(computeIdle(3000, computeAllocations([line({ km: 0 })], null))).toBe(3000);
        expect(computeUtilization(3000, 0)).toBe(0);
    });

    it('rateio menor que o aluguel gera ociosidade', () => {
        const allocations = computeAllocations([line({ ovvId: '1', km: 100 })], 2);
        expect(computeIdle(6000, allocations)).toBe(5800);
    });
});

describe('summarizeVehicles (2 veículos)', () => {
    it('resume cada veículo separadamente, com Km e ociosidade próprios', () => {
        const contracts = [
            contract({ id: '10', vehicleId: '1', monthlyValue: 6000 }),
            contract({ id: '11', vehicleId: '2', monthlyValue: 3000, startDate: '2026-01-01' })
        ];
        const lines: RentalKmLine[] = [
            line({ ovvId: '1', vehicleId: '1', km: 150 }),
            line({ ovvId: '2', vehicleId: '1', km: 2850 }),
            line({ ovvId: '3', vehicleId: '2', km: 400 })
        ];

        const rows = summarizeVehicles(contracts, lines, MONTH);
        expect(rows).toHaveLength(2);

        const v1 = rows.find(r => r.vehicleId === '1')!;
        const v2 = rows.find(r => r.vehicleId === '2')!;

        expect(v1.totalKm).toBe(3000);
        expect(v1.costPerKm).toBe(2);
        expect(v1.allocatedValue).toBe(6000);
        expect(v1.idleValue).toBe(0);

        expect(v2.totalKm).toBe(400);
        expect(v2.costPerKm).toBe(7.5);
        expect(v2.allocatedValue).toBe(3000);
        expect(v2.idleValue).toBe(0);
        expect(v2.hasConflict).toBe(false);
    });

    it('veículo com Km e sem contrato: aluguel 0 ⇒ rateio 0 e utilização nula (mesmo comportamento da RPC)', () => {
        const rows = summarizeVehicles([], [line({ ovvId: '1', km: 500 })], MONTH);
        expect(rows[0].contractValue).toBe(0);
        expect(rows[0].costPerKm).toBe(0);
        expect(rows[0].allocatedValue).toBe(0);
        expect(rows[0].idleValue).toBe(0);
        expect(rows[0].utilization).toBeNull();
    });
});

describe('contrato com custo zero (aluguel = 0)', () => {
    it('aluguel 0 com Km ⇒ custo/km 0, rateio 0, ociosidade 0 e utilização nula', () => {
        const rows = summarizeVehicles(
            [contract({ monthlyValue: 0 })],
            [line({ ovvId: '1', km: 150 }), line({ ovvId: '2', km: 350 })],
            MONTH
        );
        expect(rows[0].contractValue).toBe(0);
        expect(rows[0].costPerKm).toBe(0);
        expect(rows[0].allocatedValue).toBe(0);
        expect(rows[0].idleValue).toBe(0);
        expect(rows[0].utilization).toBeNull();
    });

    it('aluguel 0 sem Km ⇒ custo/km null (nada a alocar)', () => {
        const rows = summarizeVehicles([contract({ monthlyValue: 0 })], [], MONTH);
        expect(rows[0].costPerKm).toBeNull();
        expect(rows[0].allocatedValue).toBe(0);
        expect(rows[0].idleValue).toBe(0);
    });
});

describe('sumKm', () => {
    it('soma apenas Km positivos', () => {
        expect(sumKm([line({ km: 150 }), line({ ovvId: '2', km: 0 }), line({ ovvId: '3', km: -5 })]))
            .toBe(150);
    });
});
