import {
    extractFuelReceiptJson,
    normalizeFuelReceiptExtraction,
    normalizeReceiptPlate,
    parseReceiptDate,
    parseReceiptNumber
} from './fuelReceiptParser';

describe('parseReceiptNumber', () => {
    it('aceita números pt-BR com vírgula e milhar', () => {
        expect(parseReceiptNumber('250,50')).toBe(250.5);
        expect(parseReceiptNumber('1.234,56')).toBe(1234.56);
        expect(parseReceiptNumber('R$ 42,50')).toBe(42.5);
    });

    it('aceita números en/ISO com ponto', () => {
        expect(parseReceiptNumber('250.50')).toBe(250.5);
        expect(parseReceiptNumber('1234.56')).toBe(1234.56);
    });

    it('aceita número já tipado', () => {
        expect(parseReceiptNumber(42.5)).toBe(42.5);
        expect(parseReceiptNumber(NaN)).toBeNull();
    });

    it('rejeita texto inválido e vazio', () => {
        expect(parseReceiptNumber('abc')).toBeNull();
        expect(parseReceiptNumber('')).toBeNull();
        expect(parseReceiptNumber(null)).toBeNull();
        expect(parseReceiptNumber(undefined)).toBeNull();
    });
});

describe('parseReceiptDate', () => {
    it('aceita ISO YYYY-MM-DD', () => {
        expect(parseReceiptDate('2026-10-15')).toBe('2026-10-15');
    });

    it('aceita DD/MM/AAAA e DD-MM-AAAA, com ou sem hora', () => {
        expect(parseReceiptDate('15/10/2026')).toBe('2026-10-15');
        expect(parseReceiptDate('15-10-2026')).toBe('2026-10-15');
        expect(parseReceiptDate('15/10/2026 14:33')).toBe('2026-10-15');
    });

    it('rejeita datas impossíveis e lixo', () => {
        expect(parseReceiptDate('32/10/2026')).toBeNull();
        expect(parseReceiptDate('15/13/2026')).toBeNull();
        expect(parseReceiptDate('2026-02-30')).toBeNull();
        expect(parseReceiptDate('amanhã')).toBeNull();
        expect(parseReceiptDate(null)).toBeNull();
    });
});

describe('normalizeReceiptPlate', () => {
    it('normaliza placa antiga e Mercosul com hífen', () => {
        expect(normalizeReceiptPlate('ABC-1234')).toBe('ABC1234');
        expect(normalizeReceiptPlate('abc1d23')).toBe('ABC1D23');
        expect(normalizeReceiptPlate(' ABC 1234 ')).toBe('ABC1234');
    });

    it('rejeita placas fora do padrão brasileiro', () => {
        expect(normalizeReceiptPlate('AB')).toBeNull();
        expect(normalizeReceiptPlate('ABC123')).toBeNull();
        expect(normalizeReceiptPlate('1234567')).toBeNull();
        expect(normalizeReceiptPlate(null)).toBeNull();
    });
});

describe('extractFuelReceiptJson', () => {
    it('aceita JSON puro', () => {
        expect(extractFuelReceiptJson('{"plate":"ABC1234"}')).toEqual({ plate: 'ABC1234' });
    });

    it('aceita JSON em bloco markdown', () => {
        const input = '```json\n{"plate":"ABC1234","totalValue":250.5}\n```';
        expect(extractFuelReceiptJson(input)).toEqual({ plate: 'ABC1234', totalValue: 250.5 });
    });

    it('extrai o primeiro objeto quando há texto ao redor', () => {
        const input = 'Segue leitura: {"plate":"ABC1234"} — espero que ajude!';
        expect(extractFuelReceiptJson(input)).toEqual({ plate: 'ABC1234' });
    });

    it('retorna null para entradas sem JSON', () => {
        expect(extractFuelReceiptJson('não li nada')).toBeNull();
        expect(extractFuelReceiptJson(null)).toBeNull();
        expect(extractFuelReceiptJson('{"broken":')).toBeNull();
    });
});

describe('normalizeFuelReceiptExtraction', () => {
    it('normaliza a resposta crua do modelo', () => {
        const result = normalizeFuelReceiptExtraction({
            plate: 'ABC-1234',
            date: '15/10/2026',
            odometer: 125480.4,
            fuelQuantity: '42,50',
            totalValue: 'R$ 250,50',
            station: '  Posto Ipiranga  '
        });
        expect(result).toEqual({
            plate: 'ABC1234',
            date: '2026-10-15',
            odometer: 125480,
            fuelQuantity: 42.5,
            totalValue: 250.5,
            station: 'Posto Ipiranga'
        });
    });

    it('retorna null quando o modelo não identificou nada (ou não for comprovante)', () => {
        expect(normalizeFuelReceiptExtraction({
            plate: null,
            date: null,
            odometer: null,
            fuelQuantity: null,
            totalValue: null,
            station: null
        })).toEqual({
            plate: null,
            date: null,
            odometer: null,
            fuelQuantity: null,
            totalValue: null,
            station: null
        });
        expect(normalizeFuelReceiptExtraction(null)).toEqual({
            plate: null,
            date: null,
            odometer: null,
            fuelQuantity: null,
            totalValue: null,
            station: null
        });
    });

    it('descarta valores não positivos e placas inválidas', () => {
        const result = normalizeFuelReceiptExtraction({
            plate: 'XYZ',
            date: 'invalida',
            odometer: -5,
            fuelQuantity: 0,
            totalValue: -1,
            station: ''
        });
        expect(result).toEqual({
            plate: null,
            date: null,
            odometer: null,
            fuelQuantity: null,
            totalValue: null,
            station: null
        });
    });
});
