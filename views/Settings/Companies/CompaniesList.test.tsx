import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getCompanies = jest.fn();
jest.mock('../../../services/dataService', () => ({ dataService: { getCompanies: (...a: unknown[]) => getCompanies(...a) } }));
jest.mock('../../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { CompaniesList } from './CompaniesList';
import { createQueryClient } from '../../../services/core/queryClient';

const renderList = () => render(
    <QueryClientProvider client={createQueryClient()}>
        <CompaniesList onSelect={jest.fn()} onAdd={jest.fn()} />
    </QueryClientProvider>,
);

beforeEach(() => { getCompanies.mockReset(); localStorage.clear(); });

describe('CompaniesList (TanStack Query)', () => {
    it('mostra "Carregando" e depois as empresas', async () => {
        getCompanies.mockResolvedValue([{ id: '1', name: 'Alfa Ltda', status: 'active', category: 'Elétrica', contractCount: 2 }]);
        renderList();
        expect(screen.getByText(/Carregando empresas/)).toBeInTheDocument();
        expect(await screen.findByText('Alfa Ltda')).toBeInTheDocument();
    });

    it('erro na busca não trava em "Carregando": cai na lista vazia', async () => {
        getCompanies.mockRejectedValue(new Error('falhou'));
        renderList();
        await waitFor(() => expect(screen.queryByText(/Carregando empresas/)).not.toBeInTheDocument(), { timeout: 4000 });
    });
});
