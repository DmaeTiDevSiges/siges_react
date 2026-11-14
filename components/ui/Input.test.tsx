import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe.each(['default', 'underline'] as const)('Input (%s) — acessibilidade', variant => {
    it('o rótulo está ligado ao campo', () => {
        render(<Input variant={variant} label="Nome" />);
        expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    });

    it('com erro: o campo fica inválido e o erro é descrito e anunciado', () => {
        render(<Input variant={variant} label="E-mail" error="Informe um e-mail válido" />);
        const input = screen.getByLabelText('E-mail');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Informe um e-mail válido');
        expect(input).toHaveAttribute('aria-describedby', alert.id);
        expect(input).toHaveAccessibleDescription('Informe um e-mail válido');
    });

    it('sem erro: nada de aria-invalid nem aria-describedby', () => {
        render(<Input variant={variant} label="E-mail" />);
        const input = screen.getByLabelText('E-mail');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('usa o id informado para ligar rótulo e erro', () => {
        render(<Input variant={variant} id="cpf" label="CPF" error="Inválido" />);
        expect(screen.getByLabelText('CPF')).toHaveAttribute('id', 'cpf');
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'cpf-error');
    });
});
