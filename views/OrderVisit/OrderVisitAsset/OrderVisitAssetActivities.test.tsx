import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// dataService/useAuth/toast: o teste cobre só o comportamento da tela.
const mockData = {
    getActivitiesByOrderType: jest.fn(),
    getOrderVisitAssetActivities: jest.fn(),
    getCurrentUser: jest.fn(),
    getOrderVisitAssetById: jest.fn(),
    toggleOrderVisitAssetActivity: jest.fn(),
};
jest.mock('../../../services/dataService', () => ({ dataService: mockData }));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { id: '7' } }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail', () => ({
    OrderVisitAssetCardDetail: () => null,
}));

import { toast } from 'sonner';
import { OrderVisitAssetActivities } from './OrderVisitAssetActivities';

const ACTIVITIES = [
    { id: '1', code: 'A1', description: 'Configuração do painel' },
    { id: '2', code: 'A2', description: 'Limpeza geral' },
    { id: '3', code: 'A3', description: 'Troca de filtro' },
];

const setup = async (selected: any[] = []) => {
    mockData.getActivitiesByOrderType.mockResolvedValue(ACTIVITIES);
    mockData.getOrderVisitAssetActivities.mockResolvedValue(selected);
    mockData.getCurrentUser.mockResolvedValue({ id: '7' });
    mockData.getOrderVisitAssetById.mockResolvedValue(null);
    mockData.toggleOrderVisitAssetActivity.mockResolvedValue(undefined);
    const onBack = jest.fn();
    render(<OrderVisitAssetActivities ovAssetId="900" orderTypeId="5" onBack={onBack} />);
    await screen.findByText('Limpeza geral');
    return { onBack };
};

beforeEach(() => jest.clearAllMocks());

describe('OrderVisitAssetActivities', () => {
    it('lista as atividades do tipo de OS em ordem alfabética', async () => {
        await setup();
        expect(mockData.getActivitiesByOrderType).toHaveBeenCalledWith('5');
        const names = screen.getAllByRole('button', { pressed: false }).map(b => b.textContent);
        expect(names[0]).toContain('Configuração do painel');
        expect(names[1]).toContain('Limpeza geral');
        expect(names[2]).toContain('Troca de filtro');
    });

    it('a busca ignora acento e maiúsculas', async () => {
        await setup();
        await userEvent.type(screen.getByLabelText('Pesquisar atividade'), 'CONFIGURACAO');
        expect(screen.getByText('Configuração do painel')).toBeInTheDocument();
        expect(screen.queryByText('Limpeza geral')).not.toBeInTheDocument();
    });

    it('marca a atividade na hora e salva no servidor', async () => {
        await setup();
        await userEvent.click(screen.getByText('Limpeza geral'));
        expect(mockData.toggleOrderVisitAssetActivity).toHaveBeenCalledWith('900', '2', '7', true);
        expect(await screen.findByText('1 selecionada')).toBeInTheDocument();
    });

    it('desfaz a marcação e avisa quando o servidor recusa', async () => {
        await setup();
        mockData.toggleOrderVisitAssetActivity.mockRejectedValue(new Error('falhou'));
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        await userEvent.click(screen.getByText('Limpeza geral'));
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar atividade'));
        expect(screen.getByText('Nenhuma selecionada')).toBeInTheDocument();
    });

    it('já mostra as atividades avulsas selecionadas e ignora as do plano', async () => {
        await setup([
            { activityId: '3', maintenancePlanId: undefined },
            { activityId: '1', maintenancePlanId: '12' },
        ]);
        expect(screen.getByText('1 selecionada')).toBeInTheDocument();
        expect(screen.getByLabelText('Remover Troca de filtro')).toBeInTheDocument();
    });

    it('sem atividades configuradas mostra o aviso', async () => {
        mockData.getActivitiesByOrderType.mockResolvedValue([]);
        mockData.getOrderVisitAssetActivities.mockResolvedValue([]);
        mockData.getCurrentUser.mockResolvedValue({ id: '7' });
        mockData.getOrderVisitAssetById.mockResolvedValue(null);
        render(<OrderVisitAssetActivities ovAssetId="900" orderTypeId="5" onBack={jest.fn()} />);
        expect(await screen.findByText(/Nenhuma atividade configurada/)).toBeInTheDocument();
    });

    it('Voltar chama onBack', async () => {
        const { onBack } = await setup();
        await userEvent.click(screen.getByRole('button', { name: /voltar/i }));
        expect(onBack).toHaveBeenCalled();
    });
});
