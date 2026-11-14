import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getClients = jest.fn();
jest.mock('../../../services/dataService', () => ({ dataService: { getClients: (...a: unknown[]) => getClients(...a) } }));
jest.mock('../../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { ClientsList } from './ClientsList';
import { createQueryClient } from '../../../services/core/queryClient';

const renderList = () => render(
    <QueryClientProvider client={createQueryClient()}>
        <ClientsList onSelect={jest.fn()} onAdd={jest.fn()} />
    </QueryClientProvider>,
);

beforeEach(() => { getClients.mockReset(); localStorage.clear(); });

describe('ClientsList (TanStack Query)', () => {
    it('lista os clientes depois de buscar', async () => {
        getClients.mockResolvedValue([{ id: '1', name: 'Cliente Beta', code: 'CB', status: 'active' }]);
        renderList();
        expect(await screen.findByText('Cliente Beta')).toBeInTheDocument();
    });

    it('erro na busca cai na lista vazia', async () => {
        getClients.mockRejectedValue(new Error('falhou'));
        renderList();
        expect(await screen.findByText(/Nenhum|nenhum/, undefined, { timeout: 4000 })).toBeInTheDocument();
    });
});
