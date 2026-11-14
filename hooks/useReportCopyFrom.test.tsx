import { act, renderHook } from '@testing-library/react';

const mockData = { copyOrderVisitAssetReport: jest.fn() };
const mockToast = { error: jest.fn(), success: jest.fn() };
const mockOnline = { value: true };
jest.mock('../services/dataService', () => ({
    dataService: { copyOrderVisitAssetReport: (...a: unknown[]) => mockData.copyOrderVisitAssetReport(...a) },
}));
jest.mock('../services/offline/offlineConfig', () => ({ isOnline: () => mockOnline.value }));
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a) } }));

import { useReportCopyFrom } from './useReportCopyFrom';

const asset = { id: '900' } as never;
const source = { id: '901', code: 'B-2' } as never;

const setup = (over: { flushSave?: jest.Mock; asset?: unknown } = {}) => {
    const flushSave = over.flushSave ?? jest.fn().mockResolvedValue(undefined);
    const reload = jest.fn().mockResolvedValue(undefined);
    const hook = renderHook(() => useReportCopyFrom((over.asset === undefined ? asset : over.asset) as never, '7', flushSave, reload));
    return { ...hook, flushSave, reload };
};

beforeEach(() => {
    mockOnline.value = true;
    mockData.copyOrderVisitAssetReport.mockReset().mockResolvedValue({ activities: 3, materials: 2 });
    Object.values(mockToast).forEach(m => m.mockReset());
});

describe('useReportCopyFrom', () => {
    it('abrir a escolha exige internet', () => {
        mockOnline.value = false;
        const { result } = setup();
        act(() => result.current.openCopyFrom());
        expect(mockToast.error).toHaveBeenCalledWith('Copiar de outro ativo precisa de internet.');
        expect(result.current.showCopyFromModal).toBe(false);
        mockOnline.value = true;
        act(() => result.current.openCopyFrom());
        expect(result.current.showCopyFromModal).toBe(true);
    });

    it('confirmar: grava o pendente, copia, avisa com as contagens, limpa a origem e recarrega (nesta ordem)', async () => {
        const order: string[] = [];
        const flushSave = jest.fn(async () => { order.push('flush'); });
        mockData.copyOrderVisitAssetReport.mockImplementation(async () => { order.push('copy'); return { activities: 3, materials: 2 }; });
        const { result, reload } = setup({ flushSave });
        reload.mockImplementation(async () => { order.push('reload'); });
        act(() => result.current.setCopySource(source));
        await act(async () => { await result.current.handleCopyFromConfirm(); });
        expect(order).toEqual(['flush', 'copy', 'reload']);
        expect(mockData.copyOrderVisitAssetReport).toHaveBeenCalledWith('900', '901', '7');
        expect(mockToast.success).toHaveBeenCalledWith('Relatório copiado de B-2: 3 atividade(s) e 2 material(is). Inclua as fotos.');
        expect(result.current.copySource).toBeNull();
        expect(result.current.isCopying).toBe(false);
    });

    it('origem sem código usa "outro ativo" no aviso', async () => {
        const { result } = setup();
        act(() => result.current.setCopySource({ id: '901' } as never));
        await act(async () => { await result.current.handleCopyFromConfirm(); });
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Relatório copiado de outro ativo:'));
    });

    it('falha ao gravar o pendente não impede a cópia', async () => {
        const { result } = setup({ flushSave: jest.fn().mockRejectedValue(new Error('x')) });
        act(() => result.current.setCopySource(source));
        await act(async () => { await result.current.handleCopyFromConfirm(); });
        expect(mockData.copyOrderVisitAssetReport).toHaveBeenCalled();
    });

    it('sem internet no confirmar, sem origem ou sem ativo: não copia', async () => {
        const off = setup();
        act(() => off.result.current.setCopySource(source));
        mockOnline.value = false;
        await act(async () => { await off.result.current.handleCopyFromConfirm(); });
        expect(mockToast.error).toHaveBeenCalledWith('Copiar de outro ativo precisa de internet.');
        mockOnline.value = true;
        const none = setup();
        await act(async () => { await none.result.current.handleCopyFromConfirm(); });
        const noAsset = setup({ asset: null });
        act(() => noAsset.result.current.setCopySource(source));
        await act(async () => { await noAsset.result.current.handleCopyFromConfirm(); });
        expect(mockData.copyOrderVisitAssetReport).not.toHaveBeenCalled();
    });

    it('falha: mostra o motivo ou o texto padrão, mantém a origem e não recarrega', async () => {
        mockData.copyOrderVisitAssetReport.mockRejectedValueOnce(new Error('origem vazia')).mockRejectedValueOnce({});
        const { result, reload } = setup();
        act(() => result.current.setCopySource(source));
        await act(async () => { await result.current.handleCopyFromConfirm(); });
        expect(mockToast.error).toHaveBeenLastCalledWith('origem vazia');
        await act(async () => { await result.current.handleCopyFromConfirm(); });
        expect(mockToast.error).toHaveBeenLastCalledWith('Erro ao copiar o relatório.');
        expect(result.current.copySource).toBe(source);
        expect(result.current.isCopying).toBe(false);
        expect(reload).not.toHaveBeenCalled();
    });
});
