import * as XLSX from 'xlsx';
import { FileUtils } from './FileUtils';

export type MaterialsImportField =
    | 'code'
    | 'description'
    | 'unit'
    | 'priceUnit'
    | 'warehouseCode'
    | 'initialQuantity';

/**
 * Colunas obrigatórias do arquivo de importação de materiais.
 * - `header`: rótulo em português usado no arquivo (modelo CSV/XLSX) e aceito pelo parser.
 * - `field`: nome interno (camelCase) usado no código.
 * - `column`: coluna correspondente na tabela do banco (inglês).
 *
 * Fonte única de verdade: o template gerado e o parser importam desta lista.
 */
export interface MaterialsImportColumn {
    header: string;
    field: MaterialsImportField;
    column: string;
    example: string;
    rule: string;
}

export const MATERIALS_IMPORT_COLUMNS: MaterialsImportColumn[] = [
    {
        header: 'Código',
        field: 'code',
        column: 'materials.code',
        example: 'MAT-001',
        rule: 'Texto único. Não pode já existir na base.'
    },
    {
        header: 'Descrição',
        field: 'description',
        column: 'materials.description',
        example: 'Parafuso M8 x 20',
        rule: 'Texto obrigatório.'
    },
    {
        header: 'Unidade',
        field: 'unit',
        column: 'materials.unit',
        example: 'UN',
        rule: 'Ex.: UN, KG, M2, LITRO.'
    },
    {
        header: 'Preço Unitário',
        field: 'priceUnit',
        column: 'materials.price_unit',
        example: '0,85',
        rule: 'Número maior ou igual a 0. Aceita formato pt-BR (0,85 / 1.234,56) e en-US (0.85).'
    },
    {
        header: 'Almoxarifado',
        field: 'warehouseCode',
        column: 'warehouses.code',
        example: 'ALM01',
        rule: 'Código de almoxarifado disponível para a sua empresa.'
    },
    {
        header: 'Quantidade Inicial',
        field: 'initialQuantity',
        column: 'warehouses_materials.quantity',
        example: '100',
        rule: 'Número inteiro maior ou igual a 0. Aceita formato pt-BR (1.234 = mil duzentos e trinta e quatro).'
    }
];

export const MATERIALS_IMPORT_HEADERS: string[] = MATERIALS_IMPORT_COLUMNS.map(c => c.header);

const FILE_NAME = 'modelo_importacao_materiais';

const buildHeaderAndExampleRows = (): string[][] => [
    [...MATERIALS_IMPORT_HEADERS],
    MATERIALS_IMPORT_COLUMNS.map(c => c.example)
];

const buildInstructionsRows = (): (string | number)[][] => [
    ['Coluna no arquivo', 'Coluna na tabela', 'Exemplo', 'Regra'],
    ...MATERIALS_IMPORT_COLUMNS.map(c => [c.header, c.column, c.example, c.rule]),
    ['', '', '', ''],
    ['Observações', 'Todas as colunas são obrigatórias e a ordem das colunas não importa.', '', ''],
    ['', 'company_id é fixo na importação; provider_company_id vem do usuário logado.', '', ''],
    ['', 'Colunas não reconhecidas ou ausentes impedem a importação.', '', '']
];

const buildWorkbook = (): XLSX.WorkBook => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(buildHeaderAndExampleRows());
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
    return workbook;
};

export const MaterialsImportTemplate = {
    /** Linhas (cabeçalho PT + exemplo) usadas no CSV/XLSX modelo. */
    getRows(): string[][] {
        return buildHeaderAndExampleRows();
    },

    /**
     * Baixa o modelo em CSV (cabeçalhos em português, separador ",", UTF-8 com BOM).
     */
    async downloadCsv(): Promise<void> {
        const workbook = buildWorkbook();
        const csv = XLSX.write(workbook, { bookType: 'csv', type: 'string' }) as string;
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        await FileUtils.downloadFile(blob, `${FILE_NAME}.csv`);
    },

    /**
     * Baixa o modelo em XLSX (abas "Modelo" e "Instruções") — planilha aberta
     * por qualquer office: LibreOffice/Calc, Microsoft Excel, OnlyOffice, WPS etc.
     */
    async downloadXlsx(): Promise<void> {
        const workbook = buildWorkbook();

        const instructions = XLSX.utils.aoa_to_sheet(buildInstructionsRows());
        XLSX.utils.book_append_sheet(workbook, instructions, 'Instruções');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        const blob = new Blob(
            [buffer],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        await FileUtils.downloadFile(blob, `${FILE_NAME}.xlsx`);
    }
};
