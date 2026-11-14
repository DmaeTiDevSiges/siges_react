import { act, renderHook, waitFor } from '@testing-library/react';

const mockData = { getOrderVisitAssets: jest.fn() };
const mockToast = { info: jest.fn(), error: jest.fn() };
jest.mock('../services/dataService', () => ({
    dataService: { getOrderVisitAssets: (...a: unknown[]) => mockData.getOrderVisitAssets(...a) },
}));
jest.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => mockToast.info(...a), error: (...a: unknown[]) => mockToast.error(...a) } }));

import { useReportAssetNavigation, type ReportAssetNavigationParams } from './useReportAssetNavigation';

const sib = (id: string, code: string, tag = '', description = '') => ({ id, code, description, beforeTagDescription: tag, beforeTagSubDescription: '' });
const rootRef = { current: { scrollIntoView: jest.fn() } } as never;

const params = (over: Partial<ReportAssetNavigationParams> = {}): ReportAssetNavigationParams => ({
    assetId: '900', asset: { id: '900', ovId: '33' } as never, onNavigateAsset: jest.fn(), readOnly: false, isReadOnly: false,
    uploadingCount: 0, flushSave: jest.fn().mockResolvedValue(undefined), onApproved: jest.fn(), onBack: jest.fn(), rootRef, ...over,
});

const setup = async (p: ReportAssetNavigationParams, list = [sib('899', 'A'), sib('900', 'B'), sib('901', 'C')]) => {
    mockData.getOrderVisitAssets.mockResolvedValue(list);
    const hook = renderHook(() => useReportAssetNavigation(p));
    await waitFor(() => expect(hook.result.current.visitSiblings.length).toBeGreaterThan(0));
    return hook;
};

beforeEach(() => {
    jest.useRealTimers();
    mockData.getOrderVisitAssets.mockReset();
    Object.values(mockToast).forEach(m => m.mockReset());
    window.scrollTo = jest.fn() as never;
});

describe('lista e posição', () => {
    it('busca os ativos da visita e acha anterior/próximo pelo id', async () => {
        const { result } = await setup(params());
        expect(mockData.getOrderVisitAssets).toHaveBeenCalledWith('33');
        expect(result.current.siblingIndex).toBe(1);
        expect(result.current.prevSibling).toMatchObject({ id: '899' });
        expect(result.current.nextSibling).toMatchObject({ id: '901' });
    });

    it('ordena pela mesma regra da lista (setor, depois descrição)', async () => {
        const { result } = await setup(params(), [sib('901', 'C', 'Z'), sib('900', 'B', 'A'), sib('899', 'A', 'A', 'aaa')]);
        expect(result.current.visitSiblings.map(a => a.id).sort()).toEqual(['899', '900', '901']);
        expect(result.current.visitSiblings[result.current.visitSiblings.length - 1].id).toBe('901');
    });

    it('não busca sem onNavigateAsset, em somente leitura ou sem visita', () => {
        renderHook(() => useReportAssetNavigation(params({ onNavigateAsset: undefined })));
        renderHook(() => useReportAssetNavigation(params({ readOnly: true })));
        renderHook(() => useReportAssetNavigation(params({ asset: { id: '900' } as never })));
        expect(mockData.getOrderVisitAssets).not.toHaveBeenCalled();
    });

    it('lista que falha: vazia, sem aviso', async () => {
        mockData.getOrderVisitAssets.mockRejectedValue(new Error('x'));
        const { result } = renderHook(() => useReportAssetNavigation(params()));
        await act(async () => { await Promise.resolve(); });
        expect(result.current.visitSiblings).toEqual([]);
        expect(result.current.siblingIndex).toBe(-1);
        expect(mockToast.error).not.toHaveBeenCalled();
    });
});

describe('goToSibling', () => {
    it('grava o pendente e abre o vizinho', async () => {
        const p = params();
        const { result } = await setup(p);
        await act(async () => { await result.current.goToSibling(result.current.nextSibling); });
        expect(p.flushSave).toHaveBeenCalled();
        expect(p.onNavigateAsset).toHaveBeenCalledWith(expect.objectContaining({ id: '901' }));
        expect(result.current.isNavigating).toBe(true);
    });

    it('somente leitura não grava; sem destino ou com fotos subindo não navega', async () => {
        const ro = params({ isReadOnly: true });
        const a = await setup(ro);
        await act(async () => { await a.result.current.goToSibling(a.result.current.nextSibling); });
        expect(ro.flushSave).not.toHaveBeenCalled();
        expect(ro.onNavigateAsset).toHaveBeenCalledTimes(1);

        const up = params({ uploadingCount: 2 });
        const b = await setup(up);
        await act(async () => { await b.result.current.goToSibling(b.result.current.nextSibling); });
        expect(mockToast.info).toHaveBeenCalledWith('Aguarde o envio das fotos antes de trocar de ativo.');
        expect(up.onNavigateAsset).not.toHaveBeenCalled();
        await act(async () => { await b.result.current.goToSibling(null); });
        expect(up.onNavigateAsset).not.toHaveBeenCalled();
    });

    it('falha ao gravar: avisa, não navega e destrava', async () => {
        const p = params({ flushSave: jest.fn().mockRejectedValue(new Error('x')) });
        const { result } = await setup(p);
        await act(async () => { await result.current.goToSibling(result.current.nextSibling); });
        expect(mockToast.error).toHaveBeenCalledWith('Não foi possível salvar as alterações deste ativo. Tente novamente.');
        expect(p.onNavigateAsset).not.toHaveBeenCalled();
        expect(result.current.isNavigating).toBe(false);
    });

    it('já navegando: ignora o segundo clique', async () => {
        const p = params();
        const { result } = await setup(p);
        await act(async () => { await result.current.goToSibling(result.current.nextSibling); });
        await act(async () => { await result.current.goToSibling(result.current.prevSibling); });
        expect(p.onNavigateAsset).toHaveBeenCalledTimes(1);
    });
});

describe('advanceAfterAction', () => {
    it('com próximo ativo: mostra o aviso e abre o vizinho depois de 1,8 s (volta ao topo)', async () => {
        const p = params();
        const { result } = await setup(p);
        jest.useFakeTimers();
        act(() => result.current.advanceAfterAction());
        expect(result.current.advancingTo).toMatchObject({ id: '901' });
        expect(p.onNavigateAsset).not.toHaveBeenCalled();
        expect(p.onApproved).not.toHaveBeenCalled();
        act(() => { jest.advanceTimersByTime(1799); });
        expect(p.onNavigateAsset).not.toHaveBeenCalled();
        act(() => { jest.advanceTimersByTime(1); });
        expect(p.onNavigateAsset).toHaveBeenCalledWith(expect.objectContaining({ id: '901' }));
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
        expect(result.current.advancingTo).toBeNull();
    });

    it('no último ativo: volta por onApproved (ou onBack se não houver)', async () => {
        const last = params();
        const a = await setup(last, [sib('899', 'A'), sib('900', 'B')]);
        act(() => a.result.current.advanceAfterAction());
        expect(last.onApproved).toHaveBeenCalledTimes(1);
        expect(last.onBack).not.toHaveBeenCalled();

        const noApproved = params({ onApproved: undefined });
        const b = await setup(noApproved, [sib('899', 'A'), sib('900', 'B')]);
        act(() => b.result.current.advanceAfterAction());
        expect(noApproved.onBack).toHaveBeenCalledTimes(1);
    });

    it('sem lista de ativos: volta direto', () => {
        const p = params({ onNavigateAsset: undefined });
        const { result } = renderHook(() => useReportAssetNavigation(p));
        act(() => result.current.advanceAfterAction());
        expect(p.onApproved).toHaveBeenCalledTimes(1);
    });
});
