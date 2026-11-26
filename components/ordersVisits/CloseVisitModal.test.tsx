import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CloseVisitModal } from './CloseVisitModal';

jest.mock('../../services/dataService', () => ({
    dataService: {
        getSuspendedReasons: async () => [{ id: 3, description: 'Falta de material' }],
        getOrderCauseReasons: async () => [{ id: 11, description: 'Desgaste' }],
    },
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

const initialValues = { statusId: 6, suspendedReasonId: 3, causeReasonId: 11, progress: 40 };

const renderReview = async (props: Partial<React.ComponentProps<typeof CloseVisitModal>> = {}) => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(
        <CloseVisitModal isOpen mode="review" initialValues={initialValues} onClose={onClose} onConfirm={onConfirm}
            visit={{ isManualVisitStartEnd: true }} {...props} />,
    );
    await screen.findByRole('option', { name: 'Desgaste', hidden: true }).catch(() => undefined);
    return { onClose, onConfirm };
};

describe('CloseVisitModal em revisão', () => {
    it('abre preenchido e confirma os dados atuais', async () => {
        const { onConfirm } = await renderReview();

        expect(screen.getByText('Marcar como Revisada')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ ...initialValues, endedAt: undefined }));
    });

    it('não tem cancelar, data de encerramento nem fecha com Esc', async () => {
        const { onClose } = await renderReview();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /Cancelar|Fechar/ })).toBeNull();
        expect(screen.queryByLabelText('Data/hora de encerramento')).toBeNull();
    });

    it('depois de uma falha oferece Fechar', async () => {
        const { onClose } = await renderReview({ saveFailed: true });

        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('encerramento continua com Cancelar', () => {
        render(<CloseVisitModal isOpen onClose={jest.fn()} onConfirm={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
});
