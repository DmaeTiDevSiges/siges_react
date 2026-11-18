import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSelectionContent } from './FilterSelectionContent';

const options = [
    { value: '1', label: 'Contrato A' },
    { value: '2', label: 'Contrato B' },
];

describe('FilterSelectionContent — confirmar com todas marcadas', () => {
    it('devolve [] por padrão ("nada = todos")', () => {
        const onConfirm = jest.fn();
        render(<FilterSelectionContent label="CONTRATO" options={options} initialValue={[]} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('CONFIRMAR'));
        expect(onConfirm).toHaveBeenCalledWith([]);
    });

    it('com keepFullSelection devolve a lista completa de ids', () => {
        const onConfirm = jest.fn();
        render(<FilterSelectionContent label="CONTRATO" options={options} initialValue={[]} onConfirm={onConfirm} keepFullSelection />);
        fireEvent.click(screen.getByText('CONFIRMAR'));
        expect(onConfirm).toHaveBeenCalledWith(['1', '2']);
    });

    it('com keepFullSelection, desmarcar tudo continua devolvendo [] (validação do dashboard barra)', () => {
        const onConfirm = jest.fn();
        render(<FilterSelectionContent label="CONTRATO" options={options} initialValue={[]} onConfirm={onConfirm} keepFullSelection />);
        fireEvent.click(screen.getByLabelText(/Selecionar ou desmarcar todas/i));
        fireEvent.click(screen.getByText('CONFIRMAR'));
        expect(onConfirm).toHaveBeenCalledWith([]);
    });
});
