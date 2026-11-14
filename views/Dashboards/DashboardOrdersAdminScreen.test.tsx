import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getOrdersByTeam = jest.fn();
const getVisitsByTeam = jest.fn();
let fireOrders: () => void = () => undefined;
const unsubscribe = jest.fn();

jest.mock('../../services/dataService', () => ({
    dataService: {
        getOrdersByTeam: (...a: unknown[]) => getOrdersByTeam(...a),
        getVisitsByTeam: (...a: unknown[]) => getVisitsByTeam(...a),
        subscribeToOrders: (cb: () => void) => { fireOrders = cb; return { unsubscribe }; },
        subscribeToVisits: () => ({ unsubscribe }),
    },
}));
jest.mock('../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));
jest.mock('../../components/orderRequests/OrderRequestCardDetail', () => ({
    OrderCardDetail: ({ order }: { order: { id: string } }) => <div data-testid="os">OS {order.id}</div>,
}));
jest.mock('../../components/ordersVisits/OrderVisitCardListItem', () => ({
    OrderVisitCardListItem: () => <div />,
}));

import { DashboardScreen } from './DashboardOrdersAdminScreen';
import { createQueryClient } from '../../services/core/queryClient';

const user = { id: '1', teamId: '9' } as never;
const renderScreen = (currentUser = user) => render(
    <QueryClientProvider client={createQueryClient()}>
        <DashboardScreen currentUser={currentUser} />
    </QueryClientProvider>,
);

beforeEach(() => {
    getOrdersByTeam.mockReset();
    getVisitsByTeam.mockReset().mockResolvedValue([]);
    unsubscribe.mockReset();
    localStorage.clear();
});

describe('DashboardOrdersAdminScreen (TanStack Query)', () => {
    it('busca as OS da equipe e lista as autorizadas (status 3)', async () => {
        getOrdersByTeam.mockResolvedValue([{ id: '10', statusId: 3 }, { id: '11', statusId: 4 }]);
        renderScreen();
        expect(await screen.findByText('OS 10')).toBeInTheDocument();
        expect(screen.queryByText('OS 11')).not.toBeInTheDocument();
        expect(getOrdersByTeam).toHaveBeenCalledWith('9');
    });

    it('mudança em tempo real rebusca em segundo plano, sem voltar ao "Sincronizando"', async () => {
        getOrdersByTeam.mockResolvedValueOnce([{ id: '10', statusId: 3 }]);
        renderScreen();
        await screen.findByText('OS 10');

        getOrdersByTeam.mockResolvedValueOnce([{ id: '10', statusId: 3 }, { id: '12', statusId: 3 }]);
        await act(async () => { fireOrders(); });
        expect(await screen.findByText('OS 12')).toBeInTheDocument();
        expect(screen.queryByText(/Sincronizando/)).not.toBeInTheDocument();
        expect(getOrdersByTeam).toHaveBeenCalledTimes(2);
    });

    it('o evento refresh_dashboard também rebusca', async () => {
        getOrdersByTeam.mockResolvedValue([{ id: '10', statusId: 3 }]);
        renderScreen();
        await screen.findByText('OS 10');
        await act(async () => { window.dispatchEvent(new CustomEvent('refresh_dashboard')); });
        expect(getOrdersByTeam).toHaveBeenCalledTimes(2);
    });

    it('sem equipe não busca nada nem fica preso em "Sincronizando"', async () => {
        renderScreen({ id: '1' } as never);
        expect(getOrdersByTeam).not.toHaveBeenCalled();
        expect(screen.queryByText(/Sincronizando/)).not.toBeInTheDocument();
    });

    it('ao sair da tela cancela as assinaturas em tempo real', async () => {
        getOrdersByTeam.mockResolvedValue([]);
        const { unmount } = renderScreen();
        await act(async () => { await Promise.resolve(); });
        unmount();
        expect(unsubscribe).toHaveBeenCalledTimes(2);
    });
});
