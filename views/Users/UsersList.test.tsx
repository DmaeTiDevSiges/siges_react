import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getUsersByCompany = jest.fn();
const unsubscribe = jest.fn();
let liveCallback: (() => void) | null = null;
jest.mock('../../services/dataService', () => ({
    dataService: {
        getUsersByCompany: (...a: unknown[]) => getUsersByCompany(...a),
        subscribeToUsersThrottled: (cb: () => void) => { liveCallback = cb; return { unsubscribe }; },
    },
}));
jest.mock('../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { UsersList } from './UsersList';
import { createQueryClient } from '../../services/core/queryClient';

const user = (id: string, nameFull: string) => ({ id, nameFull, email: `${id}@x.com`, statusName: 'Ativo' });

const renderList = (companyId = '1') => render(
    <QueryClientProvider client={createQueryClient()}>
        <UsersList companyId={companyId} />
    </QueryClientProvider>,
);

beforeEach(() => { getUsersByCompany.mockReset(); unsubscribe.mockReset(); liveCallback = null; localStorage.clear(); });

describe('UsersList (TanStack Query)', () => {
    it('mostra "Carregando" e depois os usuários da empresa', async () => {
        getUsersByCompany.mockResolvedValue([user('a', 'Ana Souza')]);
        renderList('7');
        expect(screen.getByText(/Carregando usuários/)).toBeInTheDocument();
        expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
        expect(getUsersByCompany).toHaveBeenCalledWith('7');
    });

    it('mudança em tempo real rebusca sem voltar ao "Carregando"', async () => {
        getUsersByCompany.mockResolvedValueOnce([user('a', 'Ana Souza')]).mockResolvedValue([user('a', 'Ana Souza'), user('b', 'Bruno Lima')]);
        renderList();
        await screen.findByText('Ana Souza');
        await act(async () => { liveCallback?.(); });
        expect(await screen.findByText('Bruno Lima')).toBeInTheDocument();
        expect(screen.queryByText(/Carregando usuários/)).not.toBeInTheDocument();
    });

    it('ao sair da tela encerra a assinatura em tempo real', async () => {
        getUsersByCompany.mockResolvedValue([]);
        const { unmount } = renderList();
        await waitFor(() => expect(liveCallback).not.toBeNull());
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });
});
