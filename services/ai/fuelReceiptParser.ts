import { fuelExpenseImportService } from '../orders/fuelExpenseImportService';

/** Dados lidos do comprovante. `null` = não identificado com certeza (nunca inventado). */
export interface FuelReceiptExtraction {
    plate: string | null;
    /** Data do abastecimento em YYYY-MM-DD (a que consta no documento). */
    date: string | null;
    /** Odômetro em Km — presente apenas em cupons de frota que o imprimem. */
    odometer: number | null;
    fuelQuantity: number | null;
    totalValue: number | null;
    station: string | null;
}

/** '1.234,56' | '1234.56' | 'R$ 250,5' => número. Mesma regra do import em lote. */
export const parseReceiptNumber = (value: unknown): number | null => {
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

/** Aceita 'YYYY-MM-DD', 'DD/MM/AAAA', 'DD-MM-AAAA' e trechos com hora. */
export const parseReceiptDate = (value: unknown): string | null => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    let year: number;
    let month: number;
    let day: number;

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
    const br = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(raw);
    if (iso) {
        year = Number(iso[1]);
        month = Number(iso[2]);
        day = Number(iso[3]);
    } else if (br) {
        day = Number(br[1]);
        month = Number(br[2]);
        year = Number(br[3]);
    } else {
        return null;
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

/** Remove hífen/espaços e valida formato de placa brasileira (7 caracteres). */
export const normalizeReceiptPlate = (value: unknown): string | null => {
    const key = fuelExpenseImportService.normalizePlate(value);
    if (!/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(key)) return null;
    return key;
};

/** JSON direto → blocos ```json ``` → primeiro {...}. Padrão aiSsCreationService. */
export const extractFuelReceiptJson = (input: unknown): Record<string, any> | null => {
    if (!input) return null;
    if (typeof input === 'object' && input !== null) return input as Record<string, any>;
    if (typeof input !== 'string') return null;

    let str = input.trim();
    const codeBlockMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) str = codeBlockMatch[1].trim();

    try {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch { /* segue */ }

    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch { /* segue */ }
    }
    return null;
};

const positiveNumber = (value: unknown): number | null => {
    const number = parseReceiptNumber(value);
    return number != null && number > 0 ? number : null;
};

/** Normaliza a resposta crua do modelo em tipos/limites seguros. */
export const normalizeFuelReceiptExtraction = (raw: Record<string, any> | null): FuelReceiptExtraction => {
    if (!raw) {
        return { plate: null, date: null, odometer: null, fuelQuantity: null, totalValue: null, station: null };
    }
    const odometer = positiveNumber(raw.odometer);
    return {
        plate: normalizeReceiptPlate(raw.plate),
        date: parseReceiptDate(raw.date),
        odometer: odometer != null ? Math.round(odometer) : null,
        fuelQuantity: positiveNumber(raw.fuelQuantity),
        totalValue: positiveNumber(raw.totalValue),
        station: String(raw.station ?? '').trim() || null
    };
};
