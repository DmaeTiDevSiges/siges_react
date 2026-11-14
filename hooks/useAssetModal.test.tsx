import { renderHook, act, waitFor } from '@testing-library/react';

const mockToast = { error: jest.fn(), success: jest.fn() };
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a) } }));
const mockInsert = jest.fn();
jest.mock('../services/core/supabase', () => ({ supabase: { from: () => ({ insert: (...a: unknown[]) => mockInsert(...a) }) } }));
const svc = {
    getUnitAssetTagItemById: jest.fn(),
    getActiveOrdersByAssetTagId: jest.fn(),
    getAssetAvailabilityHistory7Days: jest.fn(),
    getOrderTypes: jest.fn(),
    getPriorities: jest.fn(),
    createServiceRequest: jest.fn(),
    completeServiceOrder: jest.fn(),
};
jest.mock('../services/dataService', () => ({ dataService: new Proxy({}, { get: (_t, n: string) => (svc as Record<string, jest.Mock>)[n] }) }));

import { useAssetModal } from './useAssetModal';

const user = { id: '5' } as never;
const detail = { id: 9, client_id: 1, unit_id: 2, asset_tag_tag_sub_description: 'Bomba', last_asset_unavailable_reason_description: 'Sem energia', last_comments: 'queimou' };

const setup = (loadDashboardData = jest.fn().mockResolvedValue(undefined)) => ({
    loadDashboardData,
    ...renderHook(() => useAssetModal(user, '77', loadDashboardData)),
});

beforeEach(() => {
    jest.clearAllMocks();
    svc.getUnitAssetTagItemById.mockResolvedValue(detail);
    svc.getActiveOrdersByAssetTagId.mockResolvedValue([{ id: 100 }, { id: 101 }]);
    svc.getAssetAvailabilityHistory7Days.mockResolvedValue([{ date: '2026-11-10', isAvailable: true }]);
    svc.getOrderTypes.mockResolvedValue([{ id: 1, description: 'Corretiva' }]);
    svc.getPriorities.mockResolvedValue([{ id: 2, description: 'Alta' }]);
    svc.createServiceRequest.mockResolvedValue({ id: '300' });
    svc.completeServiceOrder.mockResolvedValue(true);
});

const open = async (r: ReturnType<typeof setup>) => {
    act(() => r.result.current.setSelectedAssetForModal({ id: 9 }));
    await waitFor(() => expect(r.result.current.modalData).toEqual(detail));
};

describe('useAssetModal — carga do modal', () => {
    it('ao escolher um ativo busca detalhe, OS ativas e histórico de 7 dias', async () => {
        const r = setup();
        await open(r);
        expect(svc.getUnitAssetTagItemById).toHaveBeenCalledWith(9);
        expect(svc.getAssetAvailabilityHistory7Days).toHaveBeenCalledWith(9, 0);
        await waitFor(() => expect(r.result.current.activeOrdersForModal).toHaveLength(2));
        await waitFor(() => expect(r.result.current.history7Days).toHaveLength(1));
        expect(r.result.current.modalLoading).toBe(false);
    });

    it('mudar o deslocamento do histórico rebusca com o novo offset', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.setHistoryOffset(7));
        await waitFor(() => expect(svc.getAssetAvailabilityHistory7Days).toHaveBeenLastCalledWith(9, 7));
    });

    it('fechar (null) limpa tudo', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.setSelectedAssetForModal(null));
        await waitFor(() => expect(r.result.current.modalData).toBeNull());
        expect(r.result.current.activeOrdersForModal).toEqual([]);
        expect(r.result.current.historyOffset).toBe(0);
    });

    it('erro no detalhe deixa o modal sem dados e sem carregar', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        svc.getUnitAssetTagItemById.mockRejectedValue(new Error('x'));
        const r = setup();
        act(() => r.result.current.setSelectedAssetForModal({ id: 9 }));
        await waitFor(() => expect(r.result.current.modalLoading).toBe(false));
        expect(r.result.current.modalData).toBeNull();
    });

    it('trocar a OS visível zera a avaliação em andamento', async () => {
        const r = setup();
        await open(r);
        act(() => { r.result.current.setRatingOrderId(100); r.result.current.setSelectedRating(4); });
        act(() => r.result.current.setCurrentOrderIndex(1));
        await waitFor(() => expect(r.result.current.ratingOrderId).toBeNull());
        expect(r.result.current.selectedRating).toBe(0);
    });
});

describe('useAssetModal — formulário de SS', () => {
    it('abrir pré-preenche o problema com o setor, o motivo e o comentário e carrega tipos/prioridades', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.openSSForm());
        expect(r.result.current.showSSForm).toBe(true);
        expect(r.result.current.ssFormStep).toBe(1);
        expect(r.result.current.ssFormData.requestedServices).toBe('Bomba: Sem energia queimou');
        await waitFor(() => expect(r.result.current.orderTypes).toHaveLength(1));
        expect(r.result.current.priorities).toHaveLength(1);
    });

    it('passos: exige tipo no 1º e descrição no 3º; prioridade é opcional', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.openSSForm());
        act(() => r.result.current.handleSSFormNext());
        expect(mockToast.error).toHaveBeenCalledWith('Selecione o Tipo de OS');
        expect(r.result.current.ssFormStep).toBe(1);
        act(() => r.result.current.setSsFormData(d => ({ ...d, orderTypeId: '1' })));
        act(() => r.result.current.handleSSFormNext());
        expect(r.result.current.ssFormStep).toBe(2);
        act(() => r.result.current.handleSSFormNext());
        expect(r.result.current.ssFormStep).toBe(3);
        act(() => r.result.current.setSsFormData(d => ({ ...d, requestedServices: '' })));
        act(() => r.result.current.handleSSFormNext());
        expect(mockToast.error).toHaveBeenCalledWith('Descreva o problema');
        expect(r.result.current.ssFormStep).toBe(3);
    });

    it('enviar cria a SS, segue o pedido quando marcado, fecha o formulário e recarrega painel e OS', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.openSSForm());
        act(() => r.result.current.setSsFormData(d => ({ ...d, orderTypeId: '1', receiveNotifications: true })));
        await act(async () => { await r.result.current.handleSSFormSubmit(); });
        expect(svc.createServiceRequest).toHaveBeenCalledWith(expect.objectContaining({ clientId: '1', unitId: '2', typeId: '1', unitAssetTagId: '9' }));
        expect(mockInsert).toHaveBeenCalledWith({ o_id: 300, user_id: 5 });
        expect(mockToast.success).toHaveBeenCalled();
        expect(r.result.current.showSSForm).toBe(false);
        expect(r.loadDashboardData).toHaveBeenCalledWith('77', true);
        expect(r.result.current.ssFormLoading).toBe(false);
    });

    it('sem campos obrigatórios não envia', async () => {
        const r = setup();
        await open(r);
        act(() => r.result.current.openSSForm());
        act(() => r.result.current.setSsFormData(d => ({ ...d, requestedServices: '' })));
        await act(async () => { await r.result.current.handleSSFormSubmit(); });
        expect(mockToast.error).toHaveBeenCalledWith('Preencha os campos obrigatórios');
        expect(svc.createServiceRequest).not.toHaveBeenCalled();
    });

    it('falha ao criar avisa e libera o botão', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        svc.createServiceRequest.mockRejectedValue(new Error('x'));
        const r = setup();
        await open(r);
        act(() => r.result.current.openSSForm());
        act(() => r.result.current.setSsFormData(d => ({ ...d, orderTypeId: '1' })));
        await act(async () => { await r.result.current.handleSSFormSubmit(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao criar solicitação. Tente novamente.');
        expect(r.result.current.ssFormLoading).toBe(false);
        expect(r.result.current.showSSForm).toBe(true);
    });
});

describe('useAssetModal — concluir OS', () => {
    it('conclui, recarrega as OS e o painel e limpa a avaliação', async () => {
        const r = setup();
        await open(r);
        act(() => { r.result.current.setRatingOrderId(100); r.result.current.setSelectedRating(5); });
        await act(async () => { await r.result.current.handleCompleteOrder(100, 5); });
        expect(svc.completeServiceOrder).toHaveBeenCalledWith(100, '5');
        expect(r.loadDashboardData).toHaveBeenCalledWith('77', true);
        expect(r.result.current.ratingOrderId).toBeNull();
        expect(r.result.current.completingOrderId).toBeNull();
    });

    it('resposta sem sucesso avisa e mantém a avaliação aberta', async () => {
        svc.completeServiceOrder.mockResolvedValue(false);
        const r = setup();
        await open(r);
        act(() => r.result.current.setRatingOrderId(100));
        await act(async () => { await r.result.current.handleCompleteOrder(100); });
        expect(mockToast.error).toHaveBeenCalledWith('Ocorreu um erro ao concluir o serviço.');
        expect(r.result.current.ratingOrderId).toBe(100);
        expect(r.result.current.completingOrderId).toBeNull();
    });
});
