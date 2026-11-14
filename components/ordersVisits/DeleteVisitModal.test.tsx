import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UiVersionProvider } from '../../contexts/UiVersionContext';
import { DeleteVisitModal } from './DeleteVisitModal';

const renderModal = (props: Partial<React.ComponentProps<typeof DeleteVisitModal>> = {}) => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(
        <UiVersionProvider>
            <DeleteVisitModal isOpen onClose={onClose} onConfirm={onConfirm} {...props} />
        </UiVersionProvider>,
    );
    return { onClose, onConfirm };
};

describe('DeleteVisitModal', () => {
    it('não aparece fechado', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByText('Excluir Visita')).not.toBeInTheDocument();
    });

    it('avisa que fotos e assinaturas serão apagadas', () => {
        renderModal();
        expect(screen.getByText(/serão APAGADAS/i)).toBeInTheDocument();
    });

    it('confirma e volta', async () => {
        const { onConfirm, onClose } = renderModal();
        await userEvent.click(screen.getByRole('button', { name: /excluir definitivamente/i }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('button', { name: /voltar/i }));
        expect(onClose).toHaveBeenCalled();
    });

    it('durante a exclusão mostra "Excluindo..." e bloqueia os botões', () => {
        renderModal({ isLoading: true });
        expect(screen.getByText('Excluindo...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /excluindo/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /voltar/i })).toBeDisabled();
    });
});
