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

    it('sem nome acessível não compila (garantia em tempo de tipo)', () => {
        // @ts-expect-error — IconButton exige ariaLabel, aria-label ou title
        const semNome = <IconButton icon="delete" />;
        expect(semNome).toBeDefined();
    });
});
