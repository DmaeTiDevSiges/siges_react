import { act, renderHook, waitFor } from '@testing-library/react';

const mockData = { getAssetAlerts: jest.fn(), updateAssetAlert: jest.fn() };
const mockToast = { error: jest.fn() };
jest.mock('../services/dataService', () => ({
    dataService: {
        getAssetAlerts: (...a: unknown[]) => mockData.getAssetAlerts(...a),
        updateAssetAlert: (...a: unknown[]) => mockData.updateAssetAlert(...a),
    },
}));
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a) } }));

import { useReportAlerts } from './useReportAlerts';

const asset = { id: '900', assetId: '55' } as never;
const alerts = [
    { id: 'L1', isDeleted: false, isDone: false, ovaId: null },
    { id: 'L2', isDeleted: false, isDone: true, ovaId: '900' },
    { id: 'L3', isDeleted: false, isDone: true, ovaId: '777' },
    { id: 'L4', isDeleted: true, isDone: false, ovaId: null },
];
const ids = (list: { id: string }[]) => list.map(a => a.id);

const setup = async (a: unknown = asset) => {
    const hook = renderHook(() => useReportAlerts(a as never, '7'));
    await waitFor(() => expect(hook.result.current.alerts.length).toBeGreaterThan(0));
    return hook;
};

beforeEach(() => {
    mockData.getAssetAlerts.mockReset().mockResolvedValue(alerts);
    mockData.updateAssetAlert.mockReset().mockResolvedValue(undefined);
    mockToast.error.mockReset();
});

describe('useReportAlerts', () => {
    it('carrega só os visíveis (em aberto ou concluídos NESTE ativo) e marca os concluídos aqui', async () => {
        const { result } = await setup();
        expect(mockData.getAssetAlerts).toHaveBeenCalledWith('55');
        expect(ids(result.current.alerts)).toEqual(['L1', 'L2']);
        expect(result.current.completedAlertIds).toEqual(['L2']);
    });

    it('sem ativo carregado: lista vazia e nenhuma busca', async () => {
        const { result } = renderHook(() => useReportAlerts(null, '7'));
        await act(async () => { await Promise.resolve(); });
        expect(result.current.alerts).toEqual([]);
        expect(mockData.getAssetAlerts).not.toHaveBeenCalled();
    });

    it('erro ao carregar: lista vazia, sem estourar', async () => {
        mockData.getAssetAlerts.mockRejectedValue(new Error('x'));
        const { result } = renderHook(() => useReportAlerts(asset, '7'));
        await act(async () => { await Promise.resolve(); });
        expect(result.current.alerts).toEqual([]);
        expect(result.current.completedAlertIds).toEqual([]);
    });

    it('marcar: atualiza na hora e grava com ativo e usuário', async () => {
        const { result } = await setup();
        await act(async () => { await result.current.toggleCompletedAlert('L1'); });
        expect(mockData.updateAssetAlert).toHaveBeenCalledWith('L1', { isDone: true, updatedUserId: '7', ovaId: '900' });
        expect(result.current.completedAlertIds).toEqual(['L2', 'L1']);
        expect(result.current.alerts.find(a => a.id === 'L1')).toMatchObject({ isDone: true, ovaId: '900' });
        expect(result.current.updatingAlertId).toBeNull();
    });

    it('desmarcar: grava ovaId nulo', async () => {
        const { result } = await setup();
        await act(async () => { await result.current.toggleCompletedAlert('L2'); });
        expect(mockData.updateAssetAlert).toHaveBeenCalledWith('L2', { isDone: false, updatedUserId: '7', ovaId: null });
        expect(result.current.completedAlertIds).toEqual([]);
    });

    it('falha ao gravar: desfaz, avisa e não lança', async () => {
        mockData.updateAssetAlert.mockRejectedValue(new Error('x'));
        const { result } = await setup();
        await act(async () => { await result.current.toggleCompletedAlert('L1'); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao atualizar status do alerta.');
        expect(result.current.completedAlertIds).toEqual(['L2']);
        expect(result.current.alerts.find(a => a.id === 'L1')).toMatchObject({ isDone: false, ovaId: null });
        expect(result.current.updatingAlertId).toBeNull();
    });

    it('alerta que não existe na lista é ignorado', async () => {
        const { result } = await setup();
        await act(async () => { await result.current.toggleCompletedAlert('NAO-EXISTE'); });
        expect(mockData.updateAssetAlert).not.toHaveBeenCalled();
    });

    it('concluir pendentes: grava só o que difere do banco e tira da lista o não marcado', async () => {
        const { result } = await setup();
        // sem mudança: nada a gravar, lista intacta
        await act(async () => { await result.current.completeSelectedAlerts(); });
        expect(mockData.updateAssetAlert).not.toHaveBeenCalled();
        expect(ids(result.current.alerts)).toEqual(['L1', 'L2']);
    });

    it('concluir pendentes é quase sempre um no-op: marcar/desmarcar já grava na hora, então nada difere do banco (a lista não é mexida)', async () => {
        const { result } = await setup();
        await act(async () => { await result.current.toggleCompletedAlert('L2'); });
        mockData.updateAssetAlert.mockClear();
        await act(async () => { await result.current.completeSelectedAlerts(); });
        expect(mockData.updateAssetAlert).not.toHaveBeenCalled();
        expect(ids(result.current.alerts)).toEqual(['L1', 'L2']);
    });

    it('atualizar depois de criar um alerta: fecha a janela e recarrega', async () => {
        const { result } = await setup();
        act(() => { result.current.setIsAddingAlert(true); result.current.setAlertInitialDescription('texto'); });
        expect(result.current.isAddingAlert).toBe(true);
        mockData.getAssetAlerts.mockResolvedValue([...alerts, { id: 'L5', isDeleted: false, isDone: false, ovaId: null }]);
        await act(async () => { await result.current.refreshAlerts(); });
        expect(result.current.isAddingAlert).toBe(false);
        expect(ids(result.current.alerts)).toEqual(['L1', 'L2', 'L5']);
    });
});
