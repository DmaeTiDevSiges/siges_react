import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getContracts = jest.fn();
jest.mock('../../services/dataService', () => ({ dataService: { getContracts: (...a: unknown[]) => getContracts(...a) } }));
jest.mock('../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { ContractsList } from './ContractsList';
import { createQueryClient } from '../../services/core/queryClient';

const contract = (id: string, over: Record<string, unknown> = {}) => ({
    id, code: `CT-${id}`, providerCompanyName: `Prestadora ${id}`, clientCompanyId: 'A', isAvailable: true, totalValue: 10, ...over,
});

const renderList = (companyId?: string) => render(
    <QueryClientProvider client={createQueryClient()}>
        <ContractsList companyId={companyId} onSelect={jest.fn()} onAdd={jest.fn()} />
    </QueryClientProvider>,
);

beforeEach(() => getContracts.mockReset());

describe('ContractsList (TanStack Query)', () => {
    it('mostra "Carregando" e depois os contratos', async () => {
        getContracts.mockResolvedValue([contract('1')]);
        renderList();
        expect(screen.getByText(/Carregando contratos/)).toBeInTheDocument();
        expect(await screen.findByText('Prestadora 1')).toBeInTheDocument();
    });

    it('filtra pela empresa cliente quando companyId é informado', async () => {
        getContracts.mockResolvedValue([contract('1'), contract('2', { clientCompanyId: 'B' })]);
        renderList('B');
        expect(await screen.findByText('Prestadora 2')).toBeInTheDocument();
        expect(screen.queryByText('Prestadora 1')).not.toBeInTheDocument();
    });

    it('erro na busca cai na lista vazia, sem travar em "Carregando"', async () => {
        getContracts.mockRejectedValue(new Error('falhou'));
        renderList();
        await waitFor(() => expect(screen.queryByText(/Carregando contratos/)).not.toBeInTheDocument(), { timeout: 4000 });
        expect(screen.getByText('Nenhum contrato encontrado.')).toBeInTheDocument();
    });
});
