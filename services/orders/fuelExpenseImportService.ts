import * as XLSX from 'xlsx';

export interface FuelExpenseImportRow {
    line: number;
    date: string;
    referenceMonth: string;
    plate: string;
    odometer: number;
    fuelQuantity: number;
    totalValue: number;
}

export interface FuelExpenseImportError {
    line: number;
    message: string;
}

export interface FuelExpenseParseResult {
    rows: FuelExpenseImportRow[];
    errors: FuelExpenseImportError[];
}

const REQUIRED_HEADERS = [
    'data do abastecimento',
    'placa',
    'odometro (km)',
    'quantidade (l)',
    'valor total (r$)'
];

const normalizeHeader = (value: unknown): string => String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const isBlankRow = (row: unknown[]): boolean =>
    row.every(cell => String(cell ?? '').trim() === '');

const parseNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const cleaned = raw
        .replace(/R\$|US\$|\$|€|£/gi, '')
        .replace(/[\s\u00A0\u202F]/g, '');
    if (!/^-?[\d.,]+$/.test(cleaned)) return null;

    let normalized = cleaned;
    if (cleaned.includes(',') && cleaned.includes('.')) {
        normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
            ? cleaned.replace(/\./g, '').replace(/,/g, '.')
            : cleaned.replace(/,/g, '');
    } else if (cleaned.includes(',')) {
        normalized = cleaned.replace(',', '.');
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        normalized = cleaned.replace(/\./g, '');
    }

    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
};

const parseDate = (value: unknown): string | null => {
    let year: number;
    let month: number;
    let day: number;

    if (typeof value === 'number') {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (!parsed) return null;
        ({ y: year, m: month, d: day } = parsed);
    } else {
        const raw = String(value ?? '').trim();
        let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
        if (match) {
            day = Number(match[1]);
            month = Number(match[2]);
            year = Number(match[3]);
        } else {
            match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
            if (!match) return null;
            year = Number(match[1]);
            month = Number(match[2]);
            day = Number(match[3]);
        }
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        !Number.isInteger(year) ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
    ) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const plateKey = (value: unknown): string =>
    String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export const fuelExpenseImportService = {
    async parseFile(file: File): Promise<FuelExpenseParseResult> {
        let table: unknown[][];
        try {
            const buffer = await file.arrayBuffer();
            let workbook: XLSX.WorkBook;
            if (/\.(csv|txt)$/i.test(file.name)) {
                const bytes = new Uint8Array(buffer);
                const utf8 = new TextDecoder('utf-8').decode(bytes);
                const text = utf8.includes('\uFFFD')
                    ? new TextDecoder('windows-1252').decode(bytes)
                    : utf8;
                workbook = XLSX.read(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text, {
                    type: 'string',
                    raw: true
                });
            } else {
                workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
            }
            const sheetName = workbook.SheetNames[0];
            if (!sheetName || !workbook.Sheets[sheetName]) {
                return { rows: [], errors: [{ line: 1, message: 'Arquivo sem planilha.' }] };
            }
            table = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1,
                defval: '',
                blankrows: false,
                raw: true
            });
        } catch {
            return {
                rows: [],
                errors: [{ line: 1, message: 'Não foi possível ler o arquivo. Use um .csv, .xls ou .xlsx válido.' }]
            };
        }

        if (table.length === 0) return { rows: [], errors: [{ line: 1, message: 'Arquivo vazio.' }] };

        const errors: FuelExpenseImportError[] = [];
        const headers = table[0].map(normalizeHeader);
        const headerIndexes = REQUIRED_HEADERS.map(header => headers.indexOf(header));
        const missingHeaders = REQUIRED_HEADERS.filter((_, index) => headerIndexes[index] < 0);
        if (missingHeaders.length) {
            return {
                rows: [],
                errors: [{
                    line: 1,
                    message: `Coluna(s) obrigatória(s) ausente(s): ${missingHeaders.join(', ')}. Baixe e use o modelo.`
                }]
            };
        }

        const rows: FuelExpenseImportRow[] = [];
        table.slice(1).forEach((cells, index) => {
            const line = index + 2;
            if (isBlankRow(cells)) return;
            const values = headerIndexes.map(column => cells[column]);
            const [dateValue, plateValue, odometerValue, quantityValue, totalValueValue] = values;
            const date = parseDate(dateValue);
            const plate = String(plateValue ?? '').trim().toUpperCase();
            const odometer = parseNumber(odometerValue);
            const fuelQuantity = parseNumber(quantityValue);
            const totalValue = parseNumber(totalValueValue);
            const rowErrors: string[] = [];

            if (!date) rowErrors.push('Data do abastecimento inválida (use DD/MM/AAAA).');
            if (!plateKey(plate)) rowErrors.push('Informe a placa do veículo.');
            if (odometer == null || !Number.isInteger(odometer) || odometer <= 0) {
                rowErrors.push('Odômetro deve ser um número inteiro maior que zero.');
            }
            if (fuelQuantity == null || fuelQuantity <= 0) rowErrors.push('Quantidade deve ser maior que zero.');
            if (totalValue == null || totalValue <= 0) rowErrors.push('Valor total deve ser maior que zero.');

            if (rowErrors.length) {
                errors.push({ line, message: rowErrors.join(' ') });
                return;
            }

            rows.push({
                line,
                date: date!,
                referenceMonth: date!.slice(0, 7),
                plate,
                odometer: odometer!,
                fuelQuantity: fuelQuantity!,
                totalValue: totalValue!
            });
        });

        if (rows.length === 0 && errors.length === 0) {
            errors.push({ line: 1, message: 'Nenhuma linha preenchida encontrada no arquivo.' });
        }
        return { rows, errors };
    },

    normalizePlate: plateKey
};
