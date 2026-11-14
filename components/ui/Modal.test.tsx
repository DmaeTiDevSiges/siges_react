import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/haptics', () => ({ Haptics: { impact: jest.fn() }, ImpactStyle: { Light: 'LIGHT' } }));

import { Modal } from './Modal';
import { BottomSheet } from './BottomSheet';
import { __resetBackHandlers, registerBackHandler, runBackHandlers } from '../../utils/backButton';
import { __resetDialogStack } from '../../hooks/useDialogA11y';

beforeEach(() => { __resetBackHandlers(); __resetDialogStack(); });

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

describe('Modal — teclado e foco', () => {
    it('Esc fecha o modal aberto', () => {
        const onClose = jest.fn();
        render(<Modal isOpen onClose={onClose} title="Confirmar" />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('com um modal dentro de outro, Esc fecha só o de cima', () => {
        const closeBottom = jest.fn();
        const closeTop = jest.fn();
        render(<><Modal isOpen onClose={closeBottom} title="Baixo" /><Modal isOpen onClose={closeTop} title="Cima" /></>);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(closeTop).toHaveBeenCalledTimes(1);
        expect(closeBottom).not.toHaveBeenCalled();
    });

    it('o foco entra no diálogo ao abrir e volta ao botão que abriu ao fechar', () => {
        const App = () => {
            const [open, setOpen] = React.useState(false);
            return <><button onClick={() => setOpen(true)}>abrir</button><Modal isOpen={open} onClose={() => setOpen(false)} title="Confirmar" /></>;
        };
        render(<App />);
        const opener = screen.getByRole('button', { name: 'abrir' });
        opener.focus();
        fireEvent.click(opener);
        expect(screen.getByRole('dialog', { name: 'Confirmar' })).toHaveFocus();
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(opener).toHaveFocus();
    });

    it('o Tab fica dentro do modal: do último volta ao primeiro (o "Fechar" do cabeçalho), sem escapar para a página', () => {
        render(<><button>fora</button><Modal isOpen onClose={jest.fn()} title="Confirmar"><button>um</button><button>dois</button></Modal></>);
        const dialog = screen.getByRole('dialog', { name: 'Confirmar' });
        const dois = screen.getByRole('button', { name: 'dois' });
        dois.focus();
        fireEvent.keyDown(dois, { key: 'Tab' });
        expect(dialog.contains(document.activeElement)).toBe(true);
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }));
    });
});

describe('BottomSheet — teclado', () => {
    it('Esc fecha a folha aberta', () => {
        const onClose = jest.fn();
        render(<BottomSheet isOpen onClose={onClose}><p>conteúdo</p></BottomSheet>);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
