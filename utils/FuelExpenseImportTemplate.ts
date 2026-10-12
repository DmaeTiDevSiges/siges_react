import * as XLSX from 'xlsx';
import { FileUtils } from './FileUtils';

const FILE_NAME = 'modelo_importacao_abastecimentos';

const columns = [
    { header: 'Data do Abastecimento', example: '15/10/2026', rule: 'Data no formato DD/MM/AAAA.' },
    { header: 'Placa', example: 'ABC1D23', rule: 'Placa de um veículo disponível da sua empresa.' },
    { header: 'Odômetro (Km)', example: '125480', rule: 'Número inteiro maior que zero.' },
    { header: 'Quantidade (L)', example: '42,50', rule: 'Número maior que zero; aceita formato pt-BR.' },
    { header: 'Valor Total (R$)', example: '250,00', rule: 'Número maior que zero; aceita formato pt-BR.' }
];

const buildWorkbook = (): XLSX.WorkBook => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
        columns.map(column => column.header),
        columns.map(column => column.example)
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');

    const instructions = XLSX.utils.aoa_to_sheet([
        ['Coluna', 'Exemplo', 'Regra'],
        ...columns.map(column => [column.header, column.example, column.rule]),
        ['', '', ''],
        ['Observações', '', 'A carga em lote não exige fotos.'],
        ['', '', 'As linhas importadas ficam vinculadas ao usuário atual.'],
        ['', '', 'Competências alocadas ou fechadas não aceitam novos lançamentos.']
    ]);
    XLSX.utils.book_append_sheet(workbook, instructions, 'Instruções');
    return workbook;
};

export const FuelExpenseImportTemplate = {
    async downloadXlsx(): Promise<void> {
        const buffer = XLSX.write(buildWorkbook(), { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        const blob = new Blob(
            [buffer],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        await FileUtils.downloadFile(blob, `${FILE_NAME}.xlsx`);
    },

    async downloadCsv(): Promise<void> {
        const worksheet = XLSX.utils.aoa_to_sheet([
            columns.map(column => column.header),
            columns.map(column => column.example)
        ]);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        await FileUtils.downloadFile(blob, `${FILE_NAME}.csv`);
    }
};
