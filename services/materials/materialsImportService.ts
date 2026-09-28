import * as XLSX from 'xlsx';
import { supabase } from '../core/supabase';
import { usersService } from '../users/usersService';
import { warehouseService } from './warehouseService';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { MATERIALS_IMPORT_COLUMNS, MaterialsImportField } from '../../utils/MaterialsImportTemplate';

export interface MaterialsImportRow {
    line: number;
    code: string;
    description: string;
    unit: string;
    priceUnit: number | null;
    warehouseCode: string;
    initialQuantity: number | null;
}

export interface MaterialsImportError {
    line: number;
    field?: MaterialsImportField | string;
    message: string;
}

export interface MaterialsParseResult {
    rows: MaterialsImportRow[];
    errors: MaterialsImportError[];
}

export interface MaterialsValidationResult {
    valid: MaterialsImportRow[];
    errors: MaterialsImportError[];
}

export interface MaterialsImportResult {
    materialsCreated: number;
    stocksCreated: number;
    /** Linhas que não puderam ser importadas (duplicidade ou falha de gravação). */
    rejected: number;
    rejectedRows: MaterialsImportError[];
    stockError?: string;
}

/** Callback de progresso: (registros processados, registros totais). */
export type MaterialsImportProgress = (processed: number, total: number) => void;

export interface MaterialsValidationContext {
    existingCodes: Set<string>;
    warehouseByCode: Map<string, string>;
}

/**
 * company_id fixo gravado na importação (igual a createMaterial).
 * A duplicidade (company_id, code) é checada sempre contra esta empresa;
 * provider_company_id vem do usuário logado.
 */
export const MATERIALS_IMPORT_COMPANY_ID = 1;

/** Tamanho do lote de INSERT — cada lote reporta o progresso da importação. */
const IMPORT_BATCH_SIZE = 25;

/** Normaliza um cabeçalho para comparação: trim, minúsculas, sem acento, espaços colapsados. */
const normalizeHeader = (value: unknown): string =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');

const HEADER_TO_COLUMN = new Map<string, { field: MaterialsImportField; header: string }>(
    MATERIALS_IMPORT_COLUMNS.map(c => [normalizeHeader(c.header), { field: c.field, header: c.header }])
);

/**
 * Converte valor de planilha em número, priorizando o formato pt-BR:
 * "0,85", "1.234,56", "1.234.567,89", "R$ 1.234,56", "1 234,56".
 * Também aceita en-US ("1,234.56") — o separador mais à direita é o decimal.
 * Sem separador decimal, ponto em grupos de 3 dígitos é milhar ("1.234" → 1234).
 */
const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const raw = String(value ?? '').trim();
    if (!raw) return null;

    // remove apenas moeda e espaço (inclusive NBSP): "R$ 1.234,56" → "1.234,56".
    // NÃO remove letras/barras: valores ilegíveis (ex.: data "1/1/03" que o
    // SheetJS infere) devem ser rejeitados, não virar número.
    const cleaned = raw
        .replace(/R\$|US\$|\$|€|£/gi, '')
        .replace(/[\s\u00A0\u202F]/g, '');
    if (!/^-?\d*[\d.,]+$/.test(cleaned)) return null;

    let normalized = cleaned;
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    if (hasComma && hasDot) {
        // O último separador encontrado é o decimal: "1.234,56" vs "1,234.56"
        normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
            ? cleaned.replace(/\./g, '').replace(/,/g, '.')
            : cleaned.replace(/,/g, '');
    } else if (hasComma) {
        // vírgula é decimal em pt-BR ("10,25"); várias vírgulas só em en-US ("1,234,567")
        normalized = cleaned.split(',').length > 2
            ? cleaned.replace(/,/g, '')
            : cleaned.replace(',', '.');
    } else if (hasDot) {
        // "1.234" / "12.345.678" em pt-BR são milhar; "0.85" permanece decimal
        normalized = /^-?\d{1,3}(\.\d{3})+$/.test(cleaned)
            ? cleaned.replace(/\./g, '')
            : cleaned;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const isBlankRow = (row: unknown[]): boolean =>
    row.every(cell => String(cell ?? '').trim() === '');

export const materialsImportService = {
    /**
     * Lê o arquivo (CSV/XLSX) e converte para linhas internas usando os
     * cabeçalhos em português de MATERIALS_IMPORT_COLUMNS.
     * Cabeçalhos fora do modelo (inclusive em inglês) são rejeitados.
     */
    async parseMaterialsCsv(file: File): Promise<MaterialsParseResult> {
        const errors: MaterialsImportError[] = [];
        let table: unknown[][] = [];

        try {
            const buffer = await file.arrayBuffer();
            let workbook: XLSX.WorkBook;

            if (/\.(csv|txt)$/i.test(file.name)) {
                // CSV: decodifica os bytes de forma explícita para não depender do
                // codepage que o XLSX infere (UTF-8 com/sem BOM ou Windows-1252)
                const bytes = new Uint8Array(buffer);
                const utf8 = new TextDecoder('utf-8').decode(bytes);
                const text = utf8.includes('\uFFFD')
                    ? new TextDecoder('windows-1252').decode(bytes)
                    : utf8;
                workbook = XLSX.read(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text, {
                    type: 'string'
                });
            } else {
                workbook = XLSX.read(buffer, { type: 'array' });
            }

            const sheetName = workbook.SheetNames[0];
            if (!sheetName || !workbook.Sheets[sheetName]) {
                return { rows: [], errors: [{ line: 1, message: 'Arquivo sem planilha.' }] };
            }
            // raw: false preserva o texto formatado (ex.: "0,5" não vira 5)
            table = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1,
                defval: '',
                blankrows: false,
                raw: false
            });
        } catch {
            return {
                rows: [],
                errors: [{ line: 1, message: 'Não foi possível ler o arquivo. Use um arquivo .csv, .xls ou .xlsx válido.' }]
            };
        }

        if (table.length === 0) {
            return { rows: [], errors: [{ line: 1, message: 'Arquivo vazio.' }] };
        }

        const headerRow = table[0].map(cell => String(cell ?? ''));
        const dataRows = table.slice(1);

        // Mapeia cada coluna do cabeçalho para um campo interno
        const fieldByIndex: (MaterialsImportField | null)[] = headerRow.map((header, index) => {
            const text = header.trim();
            if (!text) {
                // Coluna sem cabeçalho só é erro se houver dados abaixo dela
                const hasData = dataRows.some(row => String(row[index] ?? '').trim() !== '');
                if (hasData) {
                    errors.push({ line: 1, message: `Coluna ${index + 1} sem cabeçalho.` });
                }
                return null;
            }

            const match = HEADER_TO_COLUMN.get(normalizeHeader(text));
            if (!match) {
                errors.push({ line: 1, message: `Coluna não reconhecida: "${text}". Use o modelo para importar.` });
                return null;
            }
            return match.field;
        });

        // Colunas obrigatórias ausentes
        const present = new Set(fieldByIndex.filter(Boolean));
        const missing = MATERIALS_IMPORT_COLUMNS.filter(c => !present.has(c.field));
        if (missing.length > 0) {
            errors.push({
                line: 1,
                message: `Coluna(s) obrigatória(s) ausente(s): ${missing.map(m => m.header).join(', ')}.`
            });
        }

        if (errors.length > 0) {
            return { rows: [], errors };
        }

        const indexOfField = (field: MaterialsImportField): number => fieldByIndex.indexOf(field);
        const readCell = (row: unknown[], field: MaterialsImportField): unknown => {
            const index = indexOfField(field);
            return index >= 0 ? row[index] : '';
        };

        const rows: MaterialsImportRow[] = [];

        for (let r = 0; r < dataRows.length; r++) {
            const dataRow = dataRows[r];
            if (isBlankRow(dataRow)) continue;

            const line = r + 2; // +2: cabeçalho na linha 1 e índice 0-based

            rows.push({
                line,
                code: String(readCell(dataRow, 'code') ?? '').trim(),
                description: String(readCell(dataRow, 'description') ?? '').trim(),
                unit: String(readCell(dataRow, 'unit') ?? '').trim(),
                priceUnit: toNumber(readCell(dataRow, 'priceUnit')),
                warehouseCode: String(readCell(dataRow, 'warehouseCode') ?? '').trim(),
                initialQuantity: toNumber(readCell(dataRow, 'initialQuantity'))
            });
        }

        if (rows.length === 0) {
            errors.push({ line: 1, message: 'Nenhuma linha de dados encontrada no arquivo.' });
        }

        return { rows, errors };
    },

    /**
     * Busca os códigos informados que já existem em materials (não deletados).
     * A duplicidade é avaliada pelo par (company_id, code) — na importação o
     * company_id é sempre MATERIALS_IMPORT_COMPANY_ID.
     */
    async getExistingCodes(codes: string[], companyId?: string): Promise<Set<string>> {
        const unique = [...new Set(codes.filter(Boolean))];
        if (unique.length === 0) return new Set();

        let query = supabase
            .from('materials')
            .select('code')
            .in('code', unique)
            .eq('is_deleted', false);

        if (companyId) {
            query = query.eq('company_id', parseInt(companyId));
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Set((data || []).map((item: { code: string }) => item.code));
    },

    /**
     * Carrega o mapa code → id dos almoxarifados DO USUÁRIO LOGADO
     * (warehouses.company_id = company_id do usuário). O filtro é obrigatório:
     * o mesmo código de almoxarifado pode existir em empresas diferentes, então
     * sem empresa vinculada a importação é bloqueada.
     */
    async loadWarehouseCodeMap(userCompanyId?: string): Promise<Map<string, string>> {
        if (!userCompanyId) {
            throw new Error('Usuário logado sem empresa vinculada: não é possível validar os almoxarifados.');
        }

        const warehouses = await warehouseService.getWarehouses(userCompanyId);
        const map = new Map<string, string>();
        for (const warehouse of warehouses) {
            if (!map.has(warehouse.code)) {
                map.set(warehouse.code, warehouse.id);
            }
        }
        return map;
    },

    /** Valida as linhas parseadas: obrigatórios, duplicados, estoque e numéricos. */
    validateMaterialsRows(
        rows: MaterialsImportRow[],
        ctx: MaterialsValidationContext
    ): MaterialsValidationResult {
        const errors: MaterialsImportError[] = [];
        const valid: MaterialsImportRow[] = [];
        const seenCodes = new Set<string>();

        for (const row of rows) {
            const rowErrors: MaterialsImportError[] = [];

            if (!row.code) {
                rowErrors.push({ line: row.line, field: 'code', message: 'Código obrigatório.' });
            } else {
                if (ctx.existingCodes.has(row.code)) {
                    rowErrors.push({ line: row.line, field: 'code', message: `Código "${row.code}" já existe nesta empresa.` });
                }
                if (seenCodes.has(row.code)) {
                    rowErrors.push({ line: row.line, field: 'code', message: `Código "${row.code}" repetido no arquivo.` });
                }
                seenCodes.add(row.code);
            }

            if (!row.description) {
                rowErrors.push({ line: row.line, field: 'description', message: 'Descrição obrigatória.' });
            }

            if (!row.unit) {
                rowErrors.push({ line: row.line, field: 'unit', message: 'Unidade obrigatória.' });
            }

            if (row.priceUnit === null || !Number.isFinite(row.priceUnit) || row.priceUnit < 0) {
                rowErrors.push({ line: row.line, field: 'priceUnit', message: 'Preço Unitário inválido (informe um número maior ou igual a 0).' });
            }

            if (!row.warehouseCode) {
                rowErrors.push({ line: row.line, field: 'warehouseCode', message: 'Almoxarifado obrigatório.' });
            } else if (!ctx.warehouseByCode.has(row.warehouseCode)) {
                rowErrors.push({
                    line: row.line,
                    field: 'warehouseCode',
                    message: `Almoxarifado "${row.warehouseCode}" não encontrado para a sua empresa.`
                });
            }

            if (
                row.initialQuantity === null ||
                !Number.isInteger(row.initialQuantity) ||
                row.initialQuantity < 0
            ) {
                rowErrors.push({
                    line: row.line,
                    field: 'initialQuantity',
                    message: 'Quantidade Inicial inválida (informe um inteiro maior ou igual a 0).'
                });
            }

            if (rowErrors.length === 0) {
                valid.push(row);
            } else {
                errors.push(...rowErrors);
            }
        }

        return { valid, errors };
    },

    /**
     * Importa as linhas validadas em lotes de IMPORT_BATCH_SIZE:
     *  1) INSERT em materials SEM informar id (trigger first_free_id atribui);
     *  2) INSERT em warehouses_materials com os ids retornados;
     *  3) reporta o progresso a cada lote via onProgress(processados, total).
     *
     * Linhas indeferidas (duplicidade ou falha de gravação) são acumuladas em
     * `rejectedRows` e NÃO interrompem a importação das demais.
     */
    async importMaterials(
        rows: MaterialsImportRow[],
        warehouseByCode: Map<string, string>,
        onProgress?: MaterialsImportProgress
    ): Promise<MaterialsImportResult> {
        const result: MaterialsImportResult = {
            materialsCreated: 0,
            stocksCreated: 0,
            rejected: 0,
            rejectedRows: []
        };

        if (rows.length === 0) {
            return result;
        }

        const total = rows.length;
        onProgress?.(0, total);

        const currentUser = await usersService.getCurrentUser();
        const now = getBrazilTimestamp();

        // 1) Duplicidade dentro do arquivo → 2ª ocorrência em diante é indeferida
        const seenCodes = new Set<string>();
        const firstOccurrences: MaterialsImportRow[] = [];
        for (const row of rows) {
            if (seenCodes.has(row.code)) {
                result.rejectedRows.push({
                    line: row.line,
                    field: 'code',
                    message: `Código "${row.code}" repetido no arquivo.`
                });
            } else {
                seenCodes.add(row.code);
                firstOccurrences.push(row);
            }
        }

        // 2) Duplicidade (company_id, code) já gravada → indeferida
        const existing = await materialsImportService.getExistingCodes(
            firstOccurrences.map(row => row.code),
            String(MATERIALS_IMPORT_COMPANY_ID)
        );
        const pending = firstOccurrences.filter(row => {
            if (existing.has(row.code)) {
                result.rejectedRows.push({
                    line: row.line,
                    field: 'code',
                    message: `Código "${row.code}" já existe nesta empresa.`
                });
                return false;
            }
            return true;
        });

        // Registros já contabilizados (indeferidos na triagem) entram no progresso
        let processed = total - pending.length;
        onProgress?.(processed, total);

        const rowByCode = new Map(rows.map(row => [row.code, row]));

        const buildPayload = (row: MaterialsImportRow) => ({
            code: row.code,
            description: row.description,
            unit: row.unit,
            price_unit: row.priceUnit ?? 0,
            status_id: 1,
            type_id: 1,
            // company_id fixo da importação; provider é a empresa do usuário logado
            company_id: MATERIALS_IMPORT_COMPANY_ID,
            provider_company_id: currentUser?.companyId ? parseInt(currentUser.companyId) : null,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            created_at: now,
            is_deleted: false
        });

        const markRejected = (row: MaterialsImportRow, message: string) => {
            result.rejectedRows.push({ line: row.line, field: 'code', message });
        };

        // 3) Inserts em lotes — um erro em um registro NÃO cancela a importação:
        //    se o lote falhar, refaz registro a registro e indefere apenas o problemático.
        for (let i = 0; i < pending.length; i += IMPORT_BATCH_SIZE) {
            const batch = pending.slice(i, i + IMPORT_BATCH_SIZE);

            const { data, error } = await supabase
                .from('materials')
                .insert(batch.map(buildPayload))
                .select('id, code');

            const created = ((error ? [] : data || []) as { id: number | string; code: string }[]);
            const batchFailed = Boolean(error);

            if (batchFailed) {
                // Retomada 1 a 1: falha de um registro não derruba os demais
                for (const row of batch) {
                    const single = await supabase
                        .from('materials')
                        .insert([buildPayload(row)])
                        .select('id, code');

                    if (single.error) {
                        markRejected(row, `Falha ao gravar: ${single.error.message}`);
                    } else {
                        const singleCreated = (single.data || []) as { id: number | string; code: string }[];
                        created.push(...singleCreated);
                        result.materialsCreated += singleCreated.length;
                    }

                    processed += 1;
                    onProgress?.(Math.min(processed, total), total);
                }
            } else {
                result.materialsCreated += created.length;
            }

            // Estoque inicial dos materiais criados neste lote
            const stockPayloads = created
                .map(material => {
                    const row = rowByCode.get(material.code);
                    if (!row) return null;
                    const warehouseId = warehouseByCode.get(row.warehouseCode);
                    if (!warehouseId) return null;
                    return {
                        warehouse_id: parseInt(warehouseId),
                        material_id: parseInt(String(material.id)),
                        quantity: row.initialQuantity ?? 0,
                        min_stock: 0,
                        cost_avg: row.priceUnit ?? 0
                    };
                })
                .filter((payload): payload is NonNullable<typeof payload> => payload !== null);

            if (stockPayloads.length > 0) {
                const { error: stockError } = await supabase
                    .from('warehouses_materials')
                    .insert(stockPayloads);

                if (stockError) {
                    // Mesma regra: tenta 1 a 1 e segue com os próximos registros.
                    // O material já criado permanece importado mesmo se o estoque falhar.
                    let stockFailed = 0;
                    const stockMessages: string[] = [];

                    for (const payload of stockPayloads) {
                        const single = await supabase.from('warehouses_materials').insert([payload]);
                        if (single.error) {
                            stockFailed += 1;
                            if (!stockMessages.includes(single.error.message)) {
                                stockMessages.push(single.error.message);
                            }
                        } else {
                            result.stocksCreated += 1;
                        }
                    }

                    if (stockFailed > 0) {
                        result.stockError = `${stockFailed} registro(s) de estoque não gravado(s): ${stockMessages.join('; ')}`;
                    }
                } else {
                    result.stocksCreated += stockPayloads.length;
                }
            }

            if (!batchFailed) {
                processed += batch.length;
                onProgress?.(Math.min(processed, total), total);
            }
        }

        result.rejected = result.rejectedRows.length;
        onProgress?.(total, total);

        return result;
    }
};
