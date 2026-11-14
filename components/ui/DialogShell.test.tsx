import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DialogShell } from './DialogShell';
import { __resetDialogStack } from '../../hooks/useDialogA11y';
import { __resetBackHandlers, registerBackHandler, runBackHandlers } from '../../utils/backButton';

beforeEach(() => { __resetDialogStack(); __resetBackHandlers(); });

describe('DialogShell', () => {
    it('é um diálogo nomeado, mantém a classe e recebe o foco', () => {
        render(<DialogShell label="Novo perfil" onClose={jest.fn()} className="fixed inset-0 z-50"><button>ok</button></DialogShell>);
        const d = screen.getByRole('dialog', { name: 'Novo perfil' });
        expect(d).toHaveClass('fixed', 'inset-0', 'z-50', 'outline-none');
        expect(d).toHaveAttribute('aria-modal', 'true');
        expect(d).toHaveFocus();
    });

    it('Esc e o voltar do Android fecham', () => {
        const onClose = jest.fn();
        render(<DialogShell label="A" onClose={onClose} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(runBackHandlers()).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('o voltar do Android não chega à tela de baixo enquanto aberto', () => {
        const screenBack = jest.fn();
        registerBackHandler(screenBack);
        render(<DialogShell label="A" onClose={jest.fn()} />);
        runBackHandlers();
        expect(screenBack).not.toHaveBeenCalled();
    });

    it('closeOnEscape=false: Esc não fecha (formulários), mas o voltar fecha', () => {
        const onClose = jest.fn();
        render(<DialogShell label="A" onClose={onClose} closeOnEscape={false} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
        runBackHandlers();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('repassa onClick e demais atributos (cliques no fundo continuam funcionando)', () => {
        const onClick = jest.fn();
        render(<DialogShell label="A" onClose={jest.fn()} onClick={onClick} data-x="1" />);
        fireEvent.click(screen.getByRole('dialog'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('dialog')).toHaveAttribute('data-x', '1');
    });

    it('ao desmontar, devolve o foco a quem abriu e libera o voltar', () => {
        const App = () => {
            const [open, setOpen] = React.useState(false);
            return <><button onClick={() => setOpen(true)}>abrir</button>{open && <DialogShell label="A" onClose={() => setOpen(false)} />}</>;
        };
        render(<App />);
        const opener = screen.getByRole('button', { name: 'abrir' });
        opener.focus();
        fireEvent.click(opener);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });
});
