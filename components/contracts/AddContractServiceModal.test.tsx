import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UiVersionProvider } from '../../contexts/UiVersionContext';
import { AddContractServiceModal } from './AddContractServiceModal';

const mockGetServices = jest.fn();
const mockAddContractService = jest.fn();
jest.mock('../../services/dataService', () => ({
    dataService: {
        getServices: (...args: unknown[]) => mockGetServices(...args),
        addContractService: (...args: unknown[]) => mockAddContractService(...args),
    },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const SERVICES = [
    { id: '10', description: 'AUXILIAR ELETRO-MECANICA - H', code: '#1.1.4.3.', unit: 'H' },
    { id: '11', description: 'AUXILIAR ELETRO-MECANICA - HE', code: '#1.1.4.4.', unit: 'H' },
];

const renderModal = (props: Partial<React.ComponentProps<typeof AddContractServiceModal>> = {}) => {
    const onClose = jest.fn();
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(
        <UiVersionProvider>
            <AddContractServiceModal
                isOpen
                contractId="7"
                existingServiceIds={[]}
                onClose={onClose}
                onSaved={onSaved}
                {...props}
            />
        </UiVersionProvider>,
    );
    return { onClose, onSaved };
};

const searchAndPick = async (query: string, name: RegExp) => {
    await userEvent.type(screen.getByRole('textbox', { name: /buscar serviço/i }), query);
    await userEvent.click(await screen.findByRole('button', { name }));
};

describe('AddContractServiceModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServices.mockResolvedValue(SERVICES);
        mockAddContractService.mockResolvedValue(undefined);
    });

    it('não aparece fechado', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByText('Adicionar Serviço')).not.toBeInTheDocument();
    });

    it('sem serviço escolhido, o botão Adicionar fica desabilitado e não mostra os valores', () => {
        renderModal();
        expect(screen.getByRole('button', { name: /^adicionar ao contrato$/i })).toBeDisabled();
        expect(screen.queryByLabelText(/valor unitário/i)).not.toBeInTheDocument();
    });

    it('busca serviços ativos pelo texto digitado', async () => {
        renderModal();
        await userEvent.type(screen.getByRole('textbox', { name: /buscar serviço/i }), 'auxiliar');
        await waitFor(() => expect(mockGetServices).toHaveBeenCalledWith('active', 'auxiliar'));
        expect(await screen.findByText('AUXILIAR ELETRO-MECANICA - H')).toBeInTheDocument();
    });

    it('não oferece serviços que já estão no contrato', async () => {
        renderModal({ existingServiceIds: ['10'] });
        await userEvent.type(screen.getByRole('textbox', { name: /buscar serviço/i }), 'auxiliar');
        expect(await screen.findByText('AUXILIAR ELETRO-MECANICA - HE')).toBeInTheDocument();
        expect(screen.queryByText('AUXILIAR ELETRO-MECANICA - H')).not.toBeInTheDocument();
    });

    it('escolhido o serviço, pede valor, desconto e quantidade (desconto começa em 1,0000)', async () => {
        renderModal();
        await searchAndPick('aux', /#1\.1\.4\.3\./);
        expect(screen.getByLabelText(/valor unitário/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/acréscimo\/desconto/i)).toHaveValue('1,0000');
        expect(screen.getByLabelText(/qte prevista/i)).toBeInTheDocument();
    });

    it('calcula o total previsto e salva com os valores informados', async () => {
        const { onSaved, onClose } = renderModal();
        await searchAndPick('aux', /#1\.1\.4\.3\./);

        await userEvent.type(screen.getByLabelText(/valor unitário/i), '4749'); // R$ 47,49
        await userEvent.type(screen.getByLabelText(/qte prevista/i), '1000'); // 10,00

        expect(screen.getByTestId('total-previsto')).toHaveTextContent('474,90');

        await userEvent.click(screen.getByRole('button', { name: /^adicionar ao contrato$/i }));

        await waitFor(() =>
            expect(mockAddContractService).toHaveBeenCalledWith({
                contractId: '7',
                serviceId: '10',
                valueUnit: 47.49,
                discount: 1,
                amount: 10,
            }),
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalled();
    });

    it('se salvar falhar, mantém o formulário aberto e não chama onSaved', async () => {
        mockAddContractService.mockRejectedValue(new Error('falhou'));
        const { onSaved, onClose } = renderModal();
        await searchAndPick('aux', /#1\.1\.4\.3\./);

        await userEvent.click(screen.getByRole('button', { name: /^adicionar ao contrato$/i }));

        await waitFor(() => expect(mockAddContractService).toHaveBeenCalled());
        expect(onSaved).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByLabelText(/valor unitário/i)).toBeInTheDocument();
    });

    it('"Trocar serviço" volta para a busca', async () => {
        renderModal();
        await searchAndPick('aux', /#1\.1\.4\.3\./);
        await userEvent.click(screen.getByRole('button', { name: /trocar serviço/i }));
        expect(screen.getByRole('textbox', { name: /buscar serviço/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/valor unitário/i)).not.toBeInTheDocument();
    });
});
