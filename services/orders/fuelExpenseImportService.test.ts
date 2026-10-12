import * as XLSX from 'xlsx';
import { fuelExpenseImportService } from './fuelExpenseImportService';
import { FuelExpenseImportTemplate } from '../../utils/FuelExpenseImportTemplate';
import { FileUtils } from '../../utils/FileUtils';

jest.mock('../../utils/FileUtils', () => ({
    FileUtils: { downloadFile: jest.fn() }
}));

const fileOf = (content: string): File =>
    ({
        name: 'abastecimentos.csv',
        arrayBuffer: async () => new TextEncoder().encode(content).buffer as ArrayBuffer
    }) as unknown as File;

const csvOf = (rows: (string | number)[][]): string =>
    XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));

describe('FuelExpenseImportTemplate', () => {
    it('gera modelo XLSX aceito pelo parser', async () => {
        const downloadFileMock = FileUtils.downloadFile as jest.Mock;
        await FuelExpenseImportTemplate.downloadXlsx();

        const [blob, fileName] = downloadFileMock.mock.calls[0];
        expect(fileName).toBe('modelo_importacao_abastecimentos.xlsx');
        const result = await fuelExpenseImportService.parseFile({
            name: fileName,
            arrayBuffer: () => blob.arrayBuffer()
        } as File);

        expect(result.errors).toEqual([]);
        expect(result.rows).toEqual([{
            line: 2,
            date: '2026-10-15',
            referenceMonth: '2026-10',
            plate: 'ABC1D23',
            odometer: 125480,
            fuelQuantity: 42.5,
            totalValue: 250
        }]);
    });

    it('gera modelo CSV com os cabeçalhos esperados', async () => {
        const downloadFileMock = FileUtils.downloadFile as jest.Mock;
        downloadFileMock.mockClear();
        await FuelExpenseImportTemplate.downloadCsv();

        const [blob, fileName] = downloadFileMock.mock.calls[0];
        expect(fileName).toBe('modelo_importacao_abastecimentos.csv');
        const csv = await blob.text();
        expect(csv.split('\n')[0]).toContain(
            'Data do Abastecimento,Placa,Odômetro (Km),Quantidade (L),Valor Total (R$)'
        );
    });
});

describe('fuelExpenseImportService.parseFile', () => {
    it('converte valores pt-BR, competência e linha de origem', async () => {
        const result = await fuelExpenseImportService.parseFile(fileOf(csvOf([
            ['Data do Abastecimento', 'Placa', 'Odômetro (Km)', 'Quantidade (L)', 'Valor Total (R$)'],
            ['01/09/2026', 'abc-1d23', '125.480', '42,50', '1.234,56']
        ])));

        expect(result.errors).toEqual([]);
        expect(result.rows).toEqual([{
            line: 2,
            date: '2026-09-01',
            referenceMonth: '2026-09',
            plate: 'ABC-1D23',
            odometer: 125480,
            fuelQuantity: 42.5,
            totalValue: 1234.56
        }]);
    });

    it('reports invalid values while keeping other valid rows', async () => {
        const result = await fuelExpenseImportService.parseFile(fileOf(csvOf([
            ['Data do Abastecimento', 'Placa', 'Odômetro (Km)', 'Quantidade (L)', 'Valor Total (R$)'],
            ['31/02/2026', 'ABC1D23', '100', '20', '50'],
            ['01/03/2026', 'ABC1D23', '101', '20', '50']
        ])));

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].line).toBe(3);
        expect(result.errors).toEqual([
            { line: 2, message: 'Data do abastecimento inválida (use DD/MM/AAAA).' }
        ]);
    });

    it('rejects files missing required columns', async () => {
        const result = await fuelExpenseImportService.parseFile(fileOf(csvOf([
            ['Placa', 'Valor Total (R$)'],
            ['ABC1D23', '50']
        ])));

        expect(result.rows).toEqual([]);
        expect(result.errors[0].message).toContain('data do abastecimento');
    });
});
