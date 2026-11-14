import { renderHook, act } from '@testing-library/react';

const mockToast = { error: jest.fn(), success: jest.fn(), loading: jest.fn((..._a: unknown[]) => 'tid') };
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a), loading: (...a: unknown[]) => mockToast.loading(...a) } }));
const mockExport = jest.fn();
const mockFormat = jest.fn((rows: unknown[]) => rows);
jest.mock('../utils/ExcelExportUtils', () => ({ ExcelExportUtils: { formatDataForExport: (...a: unknown[]) => mockFormat(...(a as [unknown[]])), exportToExcel: (...a: unknown[]) => mockExport(...a) } }));
jest.mock('../utils/FileUtils', () => ({ FileUtils: { downloadFile: jest.fn() } }));
jest.mock('../utils/PdfImageUtils', () => ({ getLogoBase64: jest.fn() }));
jest.mock('@react-pdf/renderer', () => ({ pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }) }));
jest.mock('../components/reports/AssetMovementsDocument', () => ({ AssetMovementsDocument: () => null }));

import { useMovedAssetsExport, buildMovementExcelRows, buildMovementPdfRows } from './useMovedAssetsExport';
import { FileUtils } from '../utils/FileUtils';

const asset = {
    code: 'A1', description: 'Bomba',
    beforeClientName: 'Cli', beforeUnitDescription: 'U1', beforeTagDescription: 'Setor', beforeTagSubDescription: 'Pos', beforeStatusDescription: 'Ativo',
    afterClientName: 'Cli2', afterUnitDescription: 'U2', afterTagDescription: 'Setor2', movedComments: 'obs',
};

beforeEach(() => jest.clearAllMocks());

describe('montagem das linhas', () => {
    it('Excel: junta cliente-unidade e setor > posição; vazios viram texto vazio', () => {
        const [row] = buildMovementExcelRows([asset]);
        expect(row).toMatchObject({
            code: 'A1', beforeClientUnit: 'Cli - U1', beforeSector: 'Setor > Pos', afterClientUnit: 'Cli2 - U2',
            afterSector: 'Setor2', beforeDate: '', comments: 'obs',
        });
        expect(buildMovementExcelRows([{}])[0]).toMatchObject({ code: '', beforeClientUnit: ' - ', beforeSector: '' });
    });

    it('PDF: cliente e unidade em campos separados', () => {
        const [row] = buildMovementPdfRows([asset]);
        expect(row).toMatchObject({ beforeClientName: 'Cli', beforeUnitDescription: 'U1', afterClientName: 'Cli2', beforeSector: 'Setor > Pos' });
    });
});

describe('useMovedAssetsExport', () => {
    it('sem movimentações avisa e não exporta', async () => {
        const { result } = renderHook(() => useMovedAssetsExport([]));
        await act(async () => { await result.current.handleExportExcel(); await result.current.handleExportPDF(); });
        expect(mockToast.error).toHaveBeenCalledTimes(2);
        expect(mockToast.error).toHaveBeenCalledWith('Nenhuma movimentação para exportar.');
        expect(mockExport).not.toHaveBeenCalled();
    });

    it('Excel exporta com o mapeamento de colunas e avisa o sucesso', async () => {
        const { result } = renderHook(() => useMovedAssetsExport([asset]));
        await act(async () => { await result.current.handleExportExcel(); });
        expect(mockFormat).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ code: 'Código' }));
        expect(mockExport).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^movimentacoes_ativos_/), 'Movimentações');
        expect(mockToast.success).toHaveBeenCalledWith('Excel exportado com sucesso!', { id: 'tid' });
        expect(result.current.isExportingExcel).toBe(false);
    });

    it('PDF baixa o arquivo .pdf', async () => {
        const { result } = renderHook(() => useMovedAssetsExport([asset]));
        await act(async () => { await result.current.handleExportPDF(); });
        expect(FileUtils.downloadFile).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/^movimentacoes_ativos_.*\.pdf$/));
        expect(result.current.isExportingPDF).toBe(false);
    });

    it('falha ao exportar avisa e libera o botão', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockExport.mockRejectedValueOnce(new Error('x'));
        const { result } = renderHook(() => useMovedAssetsExport([asset]));
        await act(async () => { await result.current.handleExportExcel(); });
        expect(mockToast.error).toHaveBeenCalledWith('Ocorreu um erro ao exportar o Excel.');
        expect(result.current.isExportingExcel).toBe(false);
    });
});
