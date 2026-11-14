/**
 * Testes de caracterização do painel do líder ("Meu Painel"): registram o que
 * a tela faz HOJE com os dados (busca, programação do dia, ranking, tempo real,
 * falhas), para a migração ao TanStack Query provar que nada mudou.
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const mockData = {
    getOrdersByLeader: jest.fn(),
    getVisitsByLeader: jest.fn(),
    getOpenChatVisitsForUser: jest.fn(),
    getMyDaySchedule: jest.fn(),
    getOrderById: jest.fn(),
    getTeamRanking: jest.fn(),
    getFuelExpensesByUser: jest.fn(),
};
let ordersCb: () => void = () => undefined;
let visitsCb: () => void = () => undefined;
const ordersChannel = { name: 'orders-channel' };
const visitsChannel = { name: 'visits-channel' };
const removeChannel = jest.fn();
let fuelEnabled = false;

jest.mock('../../services/dataService', () => ({
    dataService: {
        getOrdersByLeader: (...a: unknown[]) => mockData.getOrdersByLeader(...a),
        getVisitsByLeader: (...a: unknown[]) => mockData.getVisitsByLeader(...a),
        getOpenChatVisitsForUser: (...a: unknown[]) => mockData.getOpenChatVisitsForUser(...a),
        getMyDaySchedule: (...a: unknown[]) => mockData.getMyDaySchedule(...a),
        getOrderById: (...a: unknown[]) => mockData.getOrderById(...a),
        getTeamRanking: (...a: unknown[]) => mockData.getTeamRanking(...a),
        getFuelExpensesByUser: (...a: unknown[]) => mockData.getFuelExpensesByUser(...a),
        subscribeToOrders: (cb: () => void) => { ordersCb = cb; return ordersChannel; },
        subscribeToVisits: (cb: () => void) => { visitsCb = cb; return visitsChannel; },
    },
}));
jest.mock('../../services/core/supabase', () => ({ supabase: { removeChannel: (...a: unknown[]) => removeChannel(...a) } }));
jest.mock('../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));
jest.mock('../../features', () => ({ isVehicleRentalEnabled: () => fuelEnabled }));
jest.mock('../../utils/backButton', () => ({ registerBackHandler: () => () => undefined }));
jest.mock('../../contexts/PermissionsContext', () => ({
    usePermissions: () => ({ canCreate: () => true, canView: () => fuelEnabled, loading: false }),
}));
jest.mock('../../contexts/UiVersionContext', () => ({ useUiVersion: () => ({ isV2: false }) }));
jest.mock('../Vehicles/FuelExpenseScreen', () => ({ FuelExpenseScreen: () => null }));
jest.mock('../../components/ai/AIContextualBar', () => ({ AIContextualBar: () => null }));
jest.mock('../../components/ordersVisits/OrderVisitProcessingButton', () => ({ getProcessingStatus: jest.fn() }));
jest.mock('../../components/ordersVisits/OrderVisitCardListItem', () => ({ OrderVisitCardListItem: () => <div /> }));
jest.mock('../../components/orderRequests/OrderRequestCardDetail', () => ({
    OrderCardDetail: ({ order }: { order: { id: string } }) => <div data-testid="os">OS {order.id}</div>,
}));
jest.mock('../../components/ui/UserServicesPanel', () => ({
    UserServicesPanel: (p: Record<string, number>) => (
        <div data-testid="svc">{`prog=${p.programadasCount} aut=${p.autorizadosCount} age=${p.agendadasCount} sus=${p.suspensosCount}`}</div>
    ),
}));
jest.mock('../../components/ui/UserVisitsPanel', () => ({
    UserVisitsPanel: (p: Record<string, number>) => (
        <div data-testid="vis">{`rasc=${p.rascunhoCount} rep=${p.reportadasCount} chat=${p.chatPendentesCount}`}</div>
    ),
}));

import { DashboardScreen } from './DashboardOrdersUserScreen';
import { createQueryClient } from '../../services/core/queryClient';

const leader = { id: 7, teamId: 'T1', departmentId: 'D1', teamIsEvaluable: false } as never;
const evaluable = { id: 7, teamId: 'T1', departmentId: 'D1', teamIsEvaluable: true } as never;

const renderScreen = (currentUser: unknown = leader, onGamificationChange = jest.fn()) => {
    const utils = render(
        <QueryClientProvider client={createQueryClient()}>
            <DashboardScreen currentUser={currentUser as never} onGamificationChange={onGamificationChange} />
        </QueryClientProvider>,
    );
    return { ...utils, onGamificationChange };
};

const svc = () => screen.getByTestId('svc').textContent;

beforeEach(() => {
    Object.values(mockData).forEach(m => m.mockReset());
    removeChannel.mockReset();
    mockData.getOrdersByLeader.mockResolvedValue([]);
    mockData.getVisitsByLeader.mockResolvedValue([]);
    mockData.getOpenChatVisitsForUser.mockResolvedValue([]);
    mockData.getMyDaySchedule.mockResolvedValue([]);
    mockData.getOrderById.mockResolvedValue(null);
    mockData.getTeamRanking.mockResolvedValue([]);
    mockData.getFuelExpensesByUser.mockResolvedValue([]);
    localStorage.clear();
    fuelEnabled = false;
});

describe('DashboardOrdersUserScreen — dados do painel do líder', () => {
    it('busca pelo id do líder e conta/lista as OS por status', async () => {
        mockData.getOrdersByLeader.mockResolvedValue([
            { id: '1', statusId: 3 }, { id: '2', statusId: 3 }, { id: '3', statusId: 4 }, { id: '4', statusId: 6 },
        ]);
        mockData.getVisitsByLeader.mockResolvedValue([
            { id: 'v1', ovProcessingId: 1 }, { id: 'v2', ovProcessingId: 2 },
        ]);
        renderScreen();
        expect(await screen.findByText('OS 1')).toBeInTheDocument();
        expect(screen.getByText('OS 2')).toBeInTheDocument();
        expect(screen.queryByText('OS 3')).not.toBeInTheDocument();
        expect(svc()).toBe('prog=0 aut=2 age=1 sus=1');
        expect(mockData.getOrdersByLeader).toHaveBeenCalledWith('7');
        expect(mockData.getVisitsByLeader).toHaveBeenCalledWith('7');
        expect(mockData.getOpenChatVisitsForUser).toHaveBeenCalledWith('7');
    });

    it('programadas de hoje: OS de outro líder é buscada à parte e entra na contagem', async () => {
        mockData.getOrdersByLeader.mockResolvedValue([{ id: '1', statusId: 3 }]);
        mockData.getMyDaySchedule.mockResolvedValue([
            { orderId: '1', position: 1 }, { orderId: '99', position: 2 },
        ]);
        mockData.getOrderById.mockResolvedValue({ id: '99', statusId: 3 });
        renderScreen();
        await waitFor(() => expect(svc()).toContain('prog=2'));
        expect(mockData.getOrderById).toHaveBeenCalledTimes(1);
        expect(mockData.getOrderById).toHaveBeenCalledWith('99');
    });

    it('falha na programação do dia não derruba o painel (segue sem programadas)', async () => {
        mockData.getOrdersByLeader.mockResolvedValue([{ id: '1', statusId: 3 }]);
        mockData.getMyDaySchedule.mockRejectedValue(new Error('sem rede'));
        renderScreen();
        expect(await screen.findByText('OS 1')).toBeInTheDocument();
        expect(svc()).toBe('prog=0 aut=1 age=0 sus=0');
    });

    it('falha numa das buscas principais: nada é atualizado, e o painel não fica preso no carregando', async () => {
        mockData.getOrdersByLeader.mockResolvedValue([{ id: '1', statusId: 3 }]);
        mockData.getVisitsByLeader.mockRejectedValue(new Error('falhou'));
        renderScreen();
        await waitFor(() => expect(screen.queryByRole('status', { name: 'Carregando serviços' })).not.toBeInTheDocument(), { timeout: 4000 });
        expect(svc()).toBe('prog=0 aut=0 age=0 sus=0');
        expect(screen.queryByText('OS 1')).not.toBeInTheDocument();
    });

    it('sem usuário não busca nada', async () => {
        renderScreen(null);
        await act(async () => { await Promise.resolve(); });
        expect(mockData.getOrdersByLeader).not.toHaveBeenCalled();
    });
});

describe('DashboardOrdersUserScreen — ranking da equipe (cabeçalho do app)', () => {
    it('equipe avaliável: informa posição e variação em relação ao período anterior', async () => {
        mockData.getTeamRanking
            .mockResolvedValueOnce([{ teamId: 'T1', position: 2 }, { teamId: 'T9', position: 1 }])
            .mockResolvedValueOnce([{ teamId: 'T1', position: 4 }]);
        const { onGamificationChange } = renderScreen(evaluable);
        await waitFor(() => expect(onGamificationChange).toHaveBeenCalledWith({ position: 2, positionChange: 2 }));
        expect(mockData.getTeamRanking).toHaveBeenCalledTimes(2);
        expect(mockData.getTeamRanking.mock.calls[0][0]).toBe('D1');
    });

    it('equipe sem posição no período anterior: variação indefinida', async () => {
        mockData.getTeamRanking
            .mockResolvedValueOnce([{ teamId: 'T1', position: 3 }])
            .mockResolvedValueOnce([]);
        const { onGamificationChange } = renderScreen(evaluable);
        await waitFor(() => expect(onGamificationChange).toHaveBeenCalledWith({ position: 3, positionChange: undefined }));
    });

    it('falha só no ranking: OS e visitas aparecem normalmente', async () => {
        mockData.getOrdersByLeader.mockResolvedValue([{ id: '1', statusId: 3 }]);
        mockData.getTeamRanking.mockRejectedValue(new Error('ranking fora do ar'));
        const { onGamificationChange } = renderScreen(evaluable);
        expect(await screen.findByText('OS 1')).toBeInTheDocument();
        expect(onGamificationChange).toHaveBeenLastCalledWith(null);
    });

    it('equipe não avaliável: não busca ranking e informa null', async () => {
        const { onGamificationChange } = renderScreen(leader);
        await screen.findByTestId('svc');
        await waitFor(() => expect(mockData.getOrdersByLeader).toHaveBeenCalled());
        expect(mockData.getTeamRanking).not.toHaveBeenCalled();
        expect(onGamificationChange).toHaveBeenLastCalledWith(null);
    });
});

describe('DashboardOrdersUserScreen — tempo real e atualização', () => {
    it('mudança em OS ou visita rebusca em silêncio (sem voltar ao esqueleto)', async () => {
        mockData.getOrdersByLeader.mockResolvedValueOnce([{ id: '1', statusId: 3 }]);
        renderScreen();
        await screen.findByText('OS 1');

        mockData.getOrdersByLeader.mockResolvedValueOnce([{ id: '1', statusId: 3 }, { id: '5', statusId: 3 }]);
        await act(async () => { ordersCb(); });
        expect(await screen.findByText('OS 5')).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: 'Carregando serviços' })).not.toBeInTheDocument();

        await act(async () => { visitsCb(); });
        await waitFor(() => expect(mockData.getOrdersByLeader).toHaveBeenCalledTimes(3));
    });

    it('o evento refresh_dashboard também rebusca', async () => {
        renderScreen();
        await waitFor(() => expect(mockData.getOrdersByLeader).toHaveBeenCalledTimes(1));
        await act(async () => { window.dispatchEvent(new CustomEvent('refresh_dashboard')); });
        await waitFor(() => expect(mockData.getOrdersByLeader).toHaveBeenCalledTimes(2));
    });

    it('ao sair da tela, encerra os dois canais em tempo real com removeChannel', async () => {
        const { unmount } = renderScreen();
        await screen.findByTestId('svc');
        unmount();
        expect(removeChannel).toHaveBeenCalledWith(ordersChannel);
        expect(removeChannel).toHaveBeenCalledWith(visitsChannel);
        expect(removeChannel).toHaveBeenCalledTimes(2);
    });
});

describe('DashboardOrdersUserScreen — abastecimentos', () => {
    it('sem a funcionalidade de locação/abastecimento: não busca abastecimentos', async () => {
        renderScreen();
        await screen.findByTestId('svc');
        await waitFor(() => expect(mockData.getOrdersByLeader).toHaveBeenCalled());
        expect(mockData.getFuelExpensesByUser).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Abastecimentos' })).not.toBeInTheDocument();
    });

    it('com a funcionalidade: busca pelo id do usuário e mostra a aba', async () => {
        fuelEnabled = true;
        mockData.getFuelExpensesByUser.mockResolvedValue([{ id: 'f1', value: 100, createdAt: new Date().toISOString() }]);
        renderScreen();
        await waitFor(() => expect(mockData.getFuelExpensesByUser).toHaveBeenCalledWith('7'));
        expect(await screen.findByText('Abastecimentos')).toBeInTheDocument();
    });
});
