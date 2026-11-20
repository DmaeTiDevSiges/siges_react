import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockToast = { error: jest.fn() };
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a) } }));

import { EditVisitTimesModal } from './EditVisitTimesModal';

const closedVisit = { ovStatusId: 2, ovStartedAt: '2026-11-10T09:00:00', ovEndedAt: '2026-11-10T11:00:00' } as never;
const openVisit = { ovStatusId: 1, ovStartedAt: '2026-11-10T09:00:00', ovEndedAt: null } as never;

const setup = (over: Partial<React.ComponentProps<typeof EditVisitTimesModal>> = {}) => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<EditVisitTimesModal isOpen onClose={onClose} onConfirm={onConfirm} visit={closedVisit} {...over} />);
    return { onConfirm, onClose };
};

const startInput = () => screen.getByLabelText('Data/hora de início') as HTMLInputElement;
const endInput = () => screen.getByLabelText('Data/hora de fim') as HTMLInputElement;
const save = () => screen.getByRole('button', { name: /salvar/i });

beforeEach(() => mockToast.error.mockReset());

describe('EditVisitTimesModal', () => {
    it('abre com início e fim atuais da visita encerrada', () => {
        setup();
        expect(startInput().value).toBe('2026-11-10T09:00');
        expect(endInput().value).toBe('2026-11-10T11:00');
    });

    it('visita aberta: sem campo de fim e confirma com endedAt null', async () => {
        const { onConfirm } = setup({ visit: openVisit });
        expect(screen.queryByLabelText('Data/hora de fim')).not.toBeInTheDocument();
        fireEvent.change(startInput(), { target: { value: '2026-11-10T08:30' } });
        fireEvent.click(save());
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ startedAt: '2026-11-10T08:30', endedAt: null }));
    });

    it('encerrada é decidida por ov_ended_at: status 2 sem fim é tratada como aberta', async () => {
        const inconsistent = { ovStatusId: 2, ovStartedAt: '2026-11-10T09:00:00', ovEndedAt: null } as never;
        const { onConfirm } = setup({ visit: inconsistent });
        expect(screen.queryByLabelText('Data/hora de fim')).not.toBeInTheDocument();
        fireEvent.change(startInput(), { target: { value: '2026-11-10T08:30' } });
        fireEvent.click(save());
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ startedAt: '2026-11-10T08:30', endedAt: null }));
    });

    it('sem alteração o botão Salvar fica desabilitado', () => {
        setup();
        expect(save()).toBeDisabled();
    });

    it('fim anterior ao início: mostra erro e não confirma', () => {
        const { onConfirm } = setup();
        fireEvent.change(endInput(), { target: { value: '2026-11-10T08:00' } });
        fireEvent.click(save());
        expect(mockToast.error).toHaveBeenCalledWith('O fim não pode ser anterior ao início');
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('caso válido confirma com os dois horários', async () => {
        const { onConfirm } = setup();
        fireEvent.change(startInput(), { target: { value: '2026-11-10T08:30' } });
        fireEvent.click(save());
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ startedAt: '2026-11-10T08:30', endedAt: '2026-11-10T11:00' }));
    });

    it('isLoading desabilita e mostra "Salvando..."', () => {
        setup({ isLoading: true });
        expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    });
});
