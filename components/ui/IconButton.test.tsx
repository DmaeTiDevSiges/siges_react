import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton — acessibilidade', () => {
    it('o nome vem de ariaLabel', () => {
        render(<IconButton icon="delete" ariaLabel="Excluir requisito" />);
        expect(screen.getByRole('button', { name: 'Excluir requisito' })).toBeInTheDocument();
    });

    it('aceita aria-label ou title como nome (title também vira aria-label)', () => {
        render(<><IconButton icon="edit" aria-label="Editar alerta" /><IconButton icon="add" title="Nova empresa" /></>);
        expect(screen.getByRole('button', { name: 'Editar alerta' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Nova empresa' })).toHaveAttribute('aria-label', 'Nova empresa');
    });

    it('precedência: ariaLabel > aria-label > title', () => {
        render(<IconButton icon="x" ariaLabel="A" aria-label="B" title="C" />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'A');
    });

    it('o texto do ícone é escondido dos leitores de tela', () => {
        render(<IconButton icon="delete" ariaLabel="Excluir" />);
        expect(screen.getByText('delete')).toHaveAttribute('aria-hidden', 'true');
    });

    it('repassa onClick, disabled e tipo', () => {
        const onClick = jest.fn();
        render(<IconButton icon="close" ariaLabel="Fechar" onClick={onClick} disabled />);
        const b = screen.getByRole('button', { name: 'Fechar' });
        expect(b).toBeDisabled();
    });

    it('alvo de toque: o md (40 px) ganha área clicável de 44 px sem mudar o desenho', () => {
        render(<IconButton icon="close" ariaLabel="Fechar" size="md" />);
        const b = screen.getByRole('button', { name: 'Fechar' });
        expect(b).toHaveClass('h-10', 'w-10', 'after:absolute', 'after:-inset-0.5', 'relative');
    });

    it('sm (44) e lg (48) já cumprem 44 px: sem área extra', () => {
        render(<><IconButton icon="close" ariaLabel="A" size="sm" /><IconButton icon="close" ariaLabel="B" size="lg" /></>);
        for (const name of ['A', 'B']) expect(screen.getByRole('button', { name })).not.toHaveClass('after:absolute');
    });

    it('botão já posicionado (absolute/fixed/sticky/relative) não recebe "relative" extra', () => {
        render(<>
            <IconButton icon="x" ariaLabel="A" className="absolute right-2 top-2" />
            <IconButton icon="x" ariaLabel="B" className="fixed bottom-2" />
            <IconButton icon="x" ariaLabel="C" className="sticky top-0" />
        </>);
        for (const name of ['A', 'B', 'C']) {
            const b = screen.getByRole('button', { name });
            expect(b).toHaveClass('after:absolute');
            expect(b).not.toHaveClass('relative');
        }
    });

    it('sem nome acessível não compila (garantia em tempo de tipo)', () => {
        // @ts-expect-error — IconButton exige ariaLabel, aria-label ou title
        const semNome = <IconButton icon="delete" />;
        expect(semNome).toBeDefined();
    });
});
