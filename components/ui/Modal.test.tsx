import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/haptics', () => ({ Haptics: { impact: jest.fn() }, ImpactStyle: { Light: 'LIGHT' } }));

import { Modal } from './Modal';
import { __resetBackHandlers, registerBackHandler, runBackHandlers } from '../../utils/backButton';

beforeEach(() => __resetBackHandlers());

describe('Modal e o botão voltar do Android', () => {
    it('aberto: o voltar fecha o modal e não chega ao tratador de baixo (a tela)', () => {
        const screenBack = jest.fn();
        registerBackHandler(screenBack);
        const onClose = jest.fn();
        render(<Modal isOpen onClose={onClose} title="Confirmar" />);
        expect(screen.getByText('Confirmar')).toBeInTheDocument();
        expect(runBackHandlers()).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screenBack).not.toHaveBeenCalled();
    });

    it('fechado: o voltar fica com a tela', () => {
        const screenBack = jest.fn();
        registerBackHandler(screenBack);
        const onClose = jest.fn();
        render(<Modal isOpen={false} onClose={onClose} title="Confirmar" />);
        runBackHandlers();
        expect(onClose).not.toHaveBeenCalled();
        expect(screenBack).toHaveBeenCalledTimes(1);
    });

    it('ao fechar, devolve o voltar à tela', () => {
        const screenBack = jest.fn();
        registerBackHandler(screenBack);
        const { rerender } = render(<Modal isOpen onClose={jest.fn()} title="Confirmar" />);
        rerender(<Modal isOpen={false} onClose={jest.fn()} title="Confirmar" />);
        runBackHandlers();
        expect(screenBack).toHaveBeenCalledTimes(1);
    });
});
