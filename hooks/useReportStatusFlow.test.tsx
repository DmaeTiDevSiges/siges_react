import { act, renderHook } from '@testing-library/react';

const mockData = {
    reportedOrderVisitAsset: jest.fn(),
    updateOrderVisitAssetProcessingStatus: jest.fn(),
    disapproveOrderVisitAsset: jest.fn(),
};
const mockToast = { info: jest.fn(), error: jest.fn(), success: jest.fn() };
jest.mock('../services/dataService', () => ({
    dataService: new Proxy({}, { get: (_t, name: string) => (...a: unknown[]) => (mockData as Record<string, jest.Mock>)[name](...a) }),
}));
jest.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => mockToast.info(...a), error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a) } }));

import { useReportStatusFlow, type ReportStatusFlowParams } from './useReportStatusFlow';

const calls: string[] = [];
const track = <T,>(name: string, impl?: () => T) => jest.fn(() => { calls.push(name); return impl ? impl() : (undefined as T); });

const params = (over: Partial<ReportStatusFlowParams> = {}): ReportStatusFlowParams => ({
    assetId: '900', currentUserId: '7',
    asset: { id: '900', processingId: 2 } as never,
    setAsset: jest.fn(), localEditMode: null, setLocalEditMode: jest.fn(), setIsUpdatingStatus: jest.fn(),
    validateReport: jest.fn(() => true),
    hasMaintenancePlan: false, maintenanceProgress: 0, isMoved: false,
    initialCondition: 'antes', finalCondition: 'depois',
    stage: track('stage') as never, flushSave: track('flushSave', () => Promise.resolve()) as never,
    completeSelectedAlerts: track('alerts', () => Promise.resolve()) as never,
    releaseMyLock: track('release', () => Promise.resolve()) as never,
    advanceAfterAction: track('advance'), onBack: track('back'),
    ...over,
});
const run = (p: ReportStatusFlowParams) => renderHook(() => useReportStatusFlow(p));

beforeEach(() => {
    calls.length = 0;
    Object.values(mockData).forEach(m => m.mockReset().mockResolvedValue(undefined));
    Object.values(mockToast).forEach(m => m.mockReset());
});

describe('reportar', () => {
    it('validação barra: nenhuma janela abre', () => {
        const { result } = run(params({ validateReport: jest.fn(() => false) }));
        act(() => result.current.handleReportClick());
        expect(result.current.showReportConfirmModal).toBe(false);
        expect(result.current.showIncompletePlanConfirmModal).toBe(false);
    });

    it('com plano abaixo de 100%: abre a confirmação do plano incompleto', () => {
        const { result } = run(params({ hasMaintenancePlan: true, maintenanceProgress: 80 }));
        act(() => result.current.handleReportClick());
        expect(result.current.showIncompletePlanConfirmModal).toBe(true);
        expect(result.current.showReportConfirmModal).toBe(false);
    });

    it('plano completo ou sem plano: abre direto a confirmação do reporte (verbo "reportar")', () => {
        const validate = jest.fn(() => true);
        const { result } = run(params({ hasMaintenancePlan: true, maintenanceProgress: 100, validateReport: validate }));
        act(() => result.current.handleReportClick());
        expect(validate).toHaveBeenCalledWith('reportar');
        expect(result.current.showReportConfirmModal).toBe(true);
    });

    it('confirmar: textos → grava pendente → alertas → reporta → solta a trava → avança, NESTA ordem', async () => {
        const p = params();
        (p.stage as jest.Mock).mockImplementation(fields => { calls.push('stage'); expect(fields).toEqual({ before_comments: 'antes', after_comments: 'depois' }); });
        mockData.reportedOrderVisitAsset.mockImplementation(async () => { calls.push('reported'); });
        const { result } = run(p);
        act(() => result.current.setShowReportConfirmModal(true));
        await act(async () => { await result.current.handleConfirmReport(); });
        expect(calls).toEqual(['stage', 'flushSave', 'alerts', 'reported', 'release', 'advance']);
        expect(mockData.reportedOrderVisitAsset).toHaveBeenCalledWith('900', '7');
        expect(mockToast.success).toHaveBeenCalledWith('Relatório reportado com sucesso!');
        expect(result.current.showReportConfirmModal).toBe(false);
        expect(p.setIsUpdatingStatus).toHaveBeenNthCalledWith(1, true);
        expect(p.setIsUpdatingStatus).toHaveBeenLastCalledWith(false);
    });

    it('falha ao gravar o pendente: para ali (sem reportar, sem aviso, janela continua)', async () => {
        const p = params({ flushSave: jest.fn(() => Promise.reject(new Error('x'))) });
        const { result } = run(p);
        act(() => result.current.setShowReportConfirmModal(true));
        await act(async () => { await result.current.handleConfirmReport(); });
        expect(mockData.reportedOrderVisitAsset).not.toHaveBeenCalled();
        expect(mockToast.error).not.toHaveBeenCalled();
        expect(result.current.showReportConfirmModal).toBe(true);
        expect(p.setIsUpdatingStatus).toHaveBeenLastCalledWith(false);
    });

    it('falha ao reportar: avisa; não solta a trava nem avança', async () => {
        mockData.reportedOrderVisitAsset.mockRejectedValue(new Error('x'));
        const { result } = run(params());
        await act(async () => { await result.current.handleConfirmReport(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao reportar');
        expect(calls).not.toContain('release');
        expect(calls).not.toContain('advance');
    });
});

describe('revisar e aprovar', () => {
    it('revisão: otimista (Revisado) → sai do modo de edição → grava → avança', async () => {
        const p = params({ localEditMode: 'review' });
        const { result } = run(p);
        await act(async () => { await result.current.handleConfirmApproval(); });
        expect(p.setAsset).toHaveBeenCalledWith(expect.any(Function));
        const update = (p.setAsset as jest.Mock).mock.calls[0][0];
        expect(update({ id: '900', processingId: 2 })).toMatchObject({ processingId: 3, processingDescription: 'Revisado' });
        expect(p.setLocalEditMode).toHaveBeenCalledWith(null);
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 3, '7');
        expect(mockToast.success).toHaveBeenCalledWith('Processamento alterado para Revisado');
        expect(calls).toEqual(['advance']);
    });

    it('aprovação: grava Aprovado (5)', async () => {
        const { result } = run(params({ localEditMode: 'approval' }));
        await act(async () => { await result.current.handleConfirmApproval(); });
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 5, '7');
    });

    it('falha ao gravar: restaura o ativo anterior, avisa e não avança', async () => {
        mockData.updateOrderVisitAssetProcessingStatus.mockRejectedValue(new Error('x'));
        const previous = { id: '900', processingId: 2 } as never;
        const p = params({ localEditMode: 'review', asset: previous });
        const { result } = run(p);
        await act(async () => { await result.current.handleConfirmApproval(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao confirmar processamento');
        expect((p.setAsset as jest.Mock).mock.calls.at(-1)[0]).toBe(previous);
        expect(calls).not.toContain('advance');
    });

    it('confirmar edição: validação barra (verbo "confirmar") → nada é gravado', async () => {
        const validate = jest.fn(() => false);
        const { result } = run(params({ localEditMode: 'review', validateReport: validate }));
        await act(async () => { await result.current.handleConfirmEdit(); });
        expect(validate).toHaveBeenCalledWith('confirmar');
        expect(calls).not.toContain('flushSave');
        expect(mockData.updateOrderVisitAssetProcessingStatus).not.toHaveBeenCalled();
    });

    it('confirmar edição: grava o pendente primeiro; se falhar, para', async () => {
        const { result } = run(params({ localEditMode: 'review', flushSave: jest.fn(() => Promise.reject(new Error('x'))) }));
        await act(async () => { await result.current.handleConfirmEdit(); });
        expect(mockData.updateOrderVisitAssetProcessingStatus).not.toHaveBeenCalled();
    });

    it('aprovar ativo movido: abre a confirmação em vez de gravar; revisar ativo movido grava direto', async () => {
        const approve = run(params({ localEditMode: 'approval', isMoved: true }));
        await act(async () => { await approve.result.current.handleConfirmEdit(); });
        expect(approve.result.current.showApproveMovedModal).toBe(true);
        expect(mockData.updateOrderVisitAssetProcessingStatus).not.toHaveBeenCalled();

        const review = run(params({ localEditMode: 'review', isMoved: true }));
        await act(async () => { await review.result.current.handleConfirmEdit(); });
        expect(review.result.current.showApproveMovedModal).toBe(false);
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 3, '7');
    });
});

describe('reverter e rejeitar', () => {
    it('reverter para rascunho: grava (1), avisa e SEMPRE volta (mesmo se falhar)', async () => {
        const ok = run(params());
        await act(async () => { await ok.result.current.handleRevertDraft(); });
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 1, '7');
        expect(mockToast.info).toHaveBeenCalledWith('Relatório do ativo revertido para Rascunho');
        expect(calls).toEqual(['back']);

        calls.length = 0;
        mockData.updateOrderVisitAssetProcessingStatus.mockRejectedValue(new Error('x'));
        const bad = run(params());
        await act(async () => { await bad.result.current.handleRevertDraft(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao retornar para rascunho');
        expect(calls).toEqual(['back']);
    });

    it('rejeitar: grava com o motivo, marca Rejeitado e limpa a janela', async () => {
        const p = params();
        const { result } = run(p);
        act(() => { result.current.setShowRejectionModal(true); result.current.setRejectionNotes('foto escura'); });
        await act(async () => { await result.current.handleConfirmRejection(); });
        expect(mockData.disapproveOrderVisitAsset).toHaveBeenCalledWith('900', '7', 'foto escura');
        expect(p.setAsset).toHaveBeenCalledWith(expect.objectContaining({ processingId: 4, processingDescription: 'Rejeitado', disapprovedNotes: 'foto escura' }));
        expect(result.current.showRejectionModal).toBe(false);
        expect(result.current.rejectionNotes).toBe('');
        expect(mockToast.success).toHaveBeenCalledWith('Relatório Rejeitado');
    });

    it('rejeitar com falha: avisa e mantém a janela e o motivo', async () => {
        mockData.disapproveOrderVisitAsset.mockRejectedValue(new Error('x'));
        const { result } = run(params());
        act(() => { result.current.setShowRejectionModal(true); result.current.setRejectionNotes('motivo'); });
        await act(async () => { await result.current.handleConfirmRejection(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao rejeitar');
        expect(result.current.showRejectionModal).toBe(true);
        expect(result.current.rejectionNotes).toBe('motivo');
    });

    it('rejeitar sem ativo carregado não faz nada', async () => {
        const { result } = run(params({ asset: null }));
        await act(async () => { await result.current.handleConfirmRejection(); });
        expect(mockData.disapproveOrderVisitAsset).not.toHaveBeenCalled();
    });
});
