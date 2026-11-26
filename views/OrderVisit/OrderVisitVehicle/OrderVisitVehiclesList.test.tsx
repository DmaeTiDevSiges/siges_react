import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderVisitVehiclesList } from './OrderVisitVehiclesList';
import { dataService } from '../../../services/dataService';

jest.mock('../../../services/dataService', () => ({
    dataService: {
        getOrderVisitVehicles: jest.fn(),
        getRentalContracts: jest.fn(),
        getPreviousVehicleOdometer: jest.fn(),
        getCurrentUser: jest.fn(),
        updateVehicleKm: jest.fn(),
    },
    competenceLabel: (m: string) => m,
    previousCompetenceMonth: (m: string) => m,
}));
jest.mock('../../../contexts/PermissionsContext', () => ({
    usePermissions: () => ({ canView: () => true }),
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), warning: jest.fn(), success: jest.fn() } }));

const svc = dataService as unknown as Record<string, jest.Mock>;

const renderList = async () => {
    render(<OrderVisitVehiclesList visitId="1" />);
    const inicio = await screen.findByLabelText('INÍCIO') as HTMLInputElement;
    const fim = screen.getByLabelText('FIM') as HTMLInputElement;
    return { inicio, fim };
};

const digitar = (input: HTMLInputElement, value: string) => {
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
};

describe('OrderVisitVehiclesList - quilometragem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        svc.getOrderVisitVehicles.mockResolvedValue([
            { id: '10', vehicleId: '5', plates: 'ABC1D23', recorderStart: 1000, recorderEnd: 1020, valueUnit: 1, valueTotal: 20 },
        ]);
        svc.getRentalContracts.mockResolvedValue([]);
        svc.getPreviousVehicleOdometer.mockResolvedValue(990);
        svc.getCurrentUser.mockResolvedValue({ id: '1' });
        svc.updateVehicleKm.mockResolvedValue(undefined);
    });

    it.each([
        ['FIM', '1100', [undefined, 1100]],
        ['INÍCIO', '990', [990, undefined]],
    ] as const)('alterar %s com diferença acima de 50 km só grava após confirmar', async (campo, valor, args) => {
        // INÍCIO: o fim 1060 faz o novo início 990 passar de 50 km
        svc.getOrderVisitVehicles.mockResolvedValue([
            { id: '10', vehicleId: '5', plates: 'ABC1D23', recorderStart: 1000, recorderEnd: 1045, valueUnit: 1, valueTotal: 45 },
        ]);
        const { inicio, fim } = await renderList();
        digitar(campo === 'FIM' ? fim : inicio, valor);

        expect(screen.getByText('Confirmar quilometragem')).toBeTruthy();
        expect(svc.updateVehicleKm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
        await waitFor(() => expect(svc.updateVehicleKm).toHaveBeenCalledWith('10', ...args));
    });

    it('"Corrigir" volta ao valor original sem gravar', async () => {
        const { fim } = await renderList();
        digitar(fim, '1100');
        fireEvent.click(screen.getByRole('button', { name: 'Corrigir' }));

        expect(fim.value).toBe('1020');
        expect(svc.updateVehicleKm).not.toHaveBeenCalled();
    });

    it('Início abaixo do lançamento anterior mantém o valor original', async () => {
        const { inicio } = await renderList();
        digitar(inicio, '900');

        expect(inicio.value).toBe('1000');
        expect(svc.updateVehicleKm).not.toHaveBeenCalled();
    });

    it('Fim menor que o Início mantém o valor original', async () => {
        const { fim } = await renderList();
        digitar(fim, '500');

        expect(fim.value).toBe('1020');
        expect(svc.updateVehicleKm).not.toHaveBeenCalled();
    });

    it('erro ao salvar devolve o valor original', async () => {
        svc.updateVehicleKm.mockRejectedValue(new Error('sem contrato'));
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { fim } = await renderList();
        digitar(fim, '1030');

        await waitFor(() => expect(fim.value).toBe('1020'));
    });

    it('sair do campo sem alterar não grava nem pede confirmação', async () => {
        const { inicio, fim } = await renderList();
        digitar(inicio, '1000');
        digitar(fim, '1020');

        expect(svc.updateVehicleKm).not.toHaveBeenCalled();
        expect(screen.queryByText('Confirmar quilometragem')).toBeNull();
    });
});
