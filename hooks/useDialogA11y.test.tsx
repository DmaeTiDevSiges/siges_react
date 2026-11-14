import React, { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { __resetDialogStack, useDialogA11y } from './useDialogA11y';

const Dialog: React.FC<{ label: string; open: boolean; onClose: () => void; children?: React.ReactNode }> = ({ label, open, onClose, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    useDialogA11y(open, onClose, ref);
    return open ? <div ref={ref} tabIndex={-1} role="dialog" aria-label={label}>{children}</div> : null;
};

const esc = (target: Element = document.body) => fireEvent.keyDown(target, { key: 'Escape' });
const tab = (shift = false) => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab', shiftKey: shift });

beforeEach(() => __resetDialogStack());

describe('Esc', () => {
    it('fecha o diálogo aberto', () => {
        const onClose = jest.fn();
        render(<Dialog label="A" open onClose={onClose} />);
        esc();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('fechado, não reage', () => {
        const onClose = jest.fn();
        render(<Dialog label="A" open={false} onClose={onClose} />);
        esc();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('com dois empilhados, só o de cima fecha; ao fechar, o de baixo volta a responder', () => {
        const closeBottom = jest.fn();
        const closeTop = jest.fn();
        const App = () => {
            const [top, setTop] = useState(true);
            return (
                <>
                    <Dialog label="baixo" open onClose={closeBottom} />
                    <Dialog label="cima" open={top} onClose={() => { closeTop(); setTop(false); }} />
                </>
            );
        };
        render(<App />);
        esc();
        expect(closeTop).toHaveBeenCalledTimes(1);
        expect(closeBottom).not.toHaveBeenCalled();
        esc();
        expect(closeBottom).toHaveBeenCalledTimes(1);
    });

    it('não age se outro código já tratou o Esc (defaultPrevented) nem durante composição de texto', () => {
        const onClose = jest.fn();
        render(<Dialog label="A" open onClose={onClose} />);
        const prevented = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
        prevented.preventDefault();
        document.dispatchEvent(prevented);
        const composing = new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true });
        document.dispatchEvent(composing);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closeOnEscape: false consome o Esc (não fecha este nem o de baixo), mas segue com foco e Tab', () => {
        const closeBottom = jest.fn();
        const closeTop = jest.fn();
        const Top: React.FC = () => {
            const ref = useRef<HTMLDivElement>(null);
            useDialogA11y(true, closeTop, ref, { closeOnEscape: false });
            return <div ref={ref} tabIndex={-1} role="dialog" aria-label="editor"><button>x</button></div>;
        };
        render(<><Dialog label="baixo" open onClose={closeBottom} /><Top /></>);
        esc();
        expect(closeTop).not.toHaveBeenCalled();
        expect(closeBottom).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'editor' })).toHaveFocus();
    });

    it('usa o onClose mais recente', () => {
        const first = jest.fn();
        const second = jest.fn();
        const { rerender } = render(<Dialog label="A" open onClose={first} />);
        rerender(<Dialog label="A" open onClose={second} />);
        esc();
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

describe('foco', () => {
    it('ao abrir, o foco vai para o diálogo; ao fechar, volta para quem abriu', () => {
        const App = () => {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <button onClick={() => setOpen(true)}>abrir</button>
                    <Dialog label="A" open={open} onClose={() => setOpen(false)}><button>dentro</button></Dialog>
                </>
            );
        };
        render(<App />);
        const opener = screen.getByRole('button', { name: 'abrir' });
        opener.focus();
        fireEvent.click(opener);
        expect(screen.getByRole('dialog', { name: 'A' })).toHaveFocus();
        esc();
        expect(opener).toHaveFocus();
    });

    it('prefere o elemento com data-autofocus', () => {
        render(<Dialog label="A" open onClose={jest.fn()}><button>um</button><button data-autofocus>principal</button></Dialog>);
        expect(screen.getByRole('button', { name: 'principal' })).toHaveFocus();
    });

    it('não rouba o foco de um campo que já foi focado ao abrir (autoFocus)', () => {
        render(<Dialog label="A" open onClose={jest.fn()}><input aria-label="nome" autoFocus /></Dialog>);
        expect(screen.getByLabelText('nome')).toHaveFocus();
    });
});

describe('Tab preso dentro', () => {
    const setup = () => {
        render(
            <>
                <button>fora</button>
                <Dialog label="A" open onClose={jest.fn()}>
                    <button>primeiro</button>
                    <button disabled>desabilitado</button>
                    <button>último</button>
                </Dialog>
            </>,
        );
        return { first: screen.getByRole('button', { name: 'primeiro' }), last: screen.getByRole('button', { name: 'último' }) };
    };

    it('Tab no último volta ao primeiro (ignora o desabilitado)', () => {
        const { first, last } = setup();
        last.focus();
        tab();
        expect(first).toHaveFocus();
    });

    it('Shift+Tab no primeiro vai ao último', () => {
        const { first, last } = setup();
        first.focus();
        tab(true);
        expect(last).toHaveFocus();
    });

    it('com o foco no próprio diálogo, Tab vai ao primeiro e Shift+Tab ao último', () => {
        const { first, last } = setup();
        screen.getByRole('dialog').focus();
        tab();
        expect(first).toHaveFocus();
        screen.getByRole('dialog').focus();
        tab(true);
        expect(last).toHaveFocus();
    });

    it('se o foco escapou para fora, Tab traz de volta ao primeiro', () => {
        const { first } = setup();
        screen.getByRole('button', { name: 'fora' }).focus();
        tab();
        expect(first).toHaveFocus();
    });

    it('sem nada focável dentro, o foco fica no diálogo', () => {
        render(<Dialog label="A" open onClose={jest.fn()}><p>só texto</p></Dialog>);
        tab();
        expect(screen.getByRole('dialog')).toHaveFocus();
    });
});
