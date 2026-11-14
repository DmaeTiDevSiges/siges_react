import React from 'react';
import { render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea — acessibilidade', () => {
    it('o rótulo está ligado ao campo', () => {
        render(<Textarea label="Observações" />);
        expect(screen.getByLabelText('Observações')).toBeInTheDocument();
    });

    it('com erro: inválido, descrito e anunciado', () => {
        render(<Textarea label="Observações" error="Campo obrigatório" />);
        const field = screen.getByLabelText('Observações');
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório');
        expect(field).toHaveAccessibleDescription('Campo obrigatório');
    });

    it('sem erro: sem aria-invalid, aria-describedby nem alerta', () => {
        render(<Textarea label="Observações" />);
        const field = screen.getByLabelText('Observações');
        expect(field).not.toHaveAttribute('aria-invalid');
        expect(field).not.toHaveAttribute('aria-describedby');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
