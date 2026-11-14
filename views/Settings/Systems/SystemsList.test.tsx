import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

const getSystems = jest.fn();
jest.mock('../../../services/dataService', () => ({ dataService: { getSystems: (...a: unknown[]) => getSystems(...a) } }));
jest.mock('../../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { SystemsList } from './SystemsList';
import { createQueryClient } from '../../../services/core/queryClient';

const systems = [
    { id: '1', code: 'ELE', description: 'Elétrica', isAvailable: true },
    { id: '2', parentId: '1', code: 'ELE-01', description: 'Quadros', isAvailable: true },
];

beforeEach(() => { getSystems.mockReset().mockResolvedValue(systems); });

describe('SystemsList (árvore)', () => {
    const renderList = () => render(
        <QueryClientProvider client={createQueryClient()}>
            <SystemsList onSelect={jest.fn()} onAdd={jest.fn()} />
        </QueryClientProvider>,
    );

    it('abre com tudo expandido (filhos visíveis)', async () => {
        renderList();
        expect(await screen.findByText('Elétrica')).toBeInTheDocument();
        expect(screen.getByText('Quadros')).toBeInTheDocument();
    });

    it('recolher esconde os filhos e expandir mostra de novo', async () => {
        renderList();
        await screen.findByText('Elétrica');
        const toggle = () => screen.getAllByRole('button').find(b => /expand_more|chevron_right/.test(b.textContent ?? ''))!;
        fireEvent.click(toggle());
        expect(screen.queryByText('Quadros')).not.toBeInTheDocument();
        fireEvent.click(toggle());
        expect(screen.getByText('Quadros')).toBeInTheDocument();
    });
});
