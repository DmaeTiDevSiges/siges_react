import { act, renderHook } from '@testing-library/react';

const mockData = { changeOrderVisitAsset: jest.fn() };
const mockToast = { error: jest.fn(), success: jest.fn() };
jest.mock('../services/dataService', () => ({
    dataService: { changeOrderVisitAsset: (...a: unknown[]) => mockData.changeOrderVisitAsset(...a) },
}));
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a) } }));

import { useReportSwap } from './useReportSwap';

const setup = () => {
    const reload = jest.fn();
    const hook = renderHook(() => useReportSwap('900', '7', reload));
    return { ...hook, reload };
};

beforeEach(() => {
    mockData.changeOrderVisitAsset.mockReset().mockResolvedValue(undefined);
    Object.values(mockToast).forEach(m => m.mockReset());
});

describe('useReportSwap', () => {
    it('confirmar: troca na visita, avisa, fecha a página e recarrega', async () => {
        const { result, reload } = setup();
        act(() => result.current.setShowSwapPage(true));
        await act(async () => { await result.current.handleSwapAsset({ id: 'NOVO' } as never); });
        expect(mockData.changeOrderVisitAsset).toHaveBeenCalledWith('900', 'NOVO', '7');
        expect(mockToast.success).toHaveBeenCalledWith('Ativo alterado com sucesso!');
        expect(result.current.showSwapPage).toBe(false);
        expect(reload).toHaveBeenCalledTimes(1);
        expect(result.current.isSwapping).toBe(false);
    });

    it('falha: mostra o motivo ou o texto padrão, mantém a página e não recarrega', async () => {
        mockData.changeOrderVisitAsset.mockRejectedValueOnce(new Error('já está na visita')).mockRejectedValueOnce({});
        const { result, reload } = setup();
        act(() => result.current.setShowSwapPage(true));
        await act(async () => { await result.current.handleSwapAsset({ id: 'NOVO' } as never); });
        expect(mockToast.error).toHaveBeenLastCalledWith('já está na visita');
        await act(async () => { await result.current.handleSwapAsset({ id: 'NOVO' } as never); });
        expect(mockToast.error).toHaveBeenLastCalledWith('Erro ao trocar ativo');
        expect(result.current.showSwapPage).toBe(true);
        expect(result.current.isSwapping).toBe(false);
        expect(reload).not.toHaveBeenCalled();
    });
});
