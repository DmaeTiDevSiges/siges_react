import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DateRangePicker, getPeriodShortcuts, type DateRange } from './DateRangePicker';

describe('getPeriodShortcuts', () => {
    it('Mês passado, Mês atual e Hoje a partir de uma data', () => {
        const s = getPeriodShortcuts(new Date(2026, 10, 21)); // 21/11/2026
        expect(s.map(x => x.label)).toEqual(['Mês passado', 'Mês atual', 'Hoje']);
        expect(s[0].range).toEqual({ start: '2026-10-01', end: '2026-10-31' });
        expect(s[1].range).toEqual({ start: '2026-11-01', end: '2026-11-30' });
        expect(s[2].range).toEqual({ start: '2026-11-21', end: '2026-11-21' });
    });

    it('janeiro: o mês passado é dezembro do ano anterior', () => {
        const s = getPeriodShortcuts(new Date(2027, 0, 5));
        expect(s[0].range).toEqual({ start: '2026-12-01', end: '2026-12-31' });
    });
});

const Harness: React.FC<{ initial: DateRange; spy?: (r: DateRange) => void }> = ({ initial, spy }) => {
    const [range, setRange] = useState(initial);
    return <DateRangePicker value={range} onChange={r => { spy?.(r); setRange(r); }} />;
};

describe('DateRangePicker', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 10, 21, 10, 0, 0));
    });
    afterEach(() => jest.useRealTimers());

    it('os três atalhos ficam numa grade de 3 colunas, sem rolagem horizontal', () => {
        render(<Harness initial={{ start: '2026-11-21', end: '2026-11-21' }} />);
        const group = screen.getByRole('group', { name: 'Atalhos de período' });
        expect(group.className).toMatch(/grid-cols-3/);
        expect(group.className).not.toMatch(/overflow-x/);
        expect(screen.getAllByRole('button', { name: /Mês passado|Mês atual|Hoje/ })).toHaveLength(3);
    });

    it('clicar num atalho troca o período e marca o atalho como selecionado', () => {
        const spy = jest.fn();
        render(<Harness initial={{ start: '2026-11-21', end: '2026-11-21' }} spy={spy} />);
        expect(screen.getByRole('button', { name: /Hoje/ })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: /Mês atual/ }));
        expect(spy).toHaveBeenLastCalledWith({ start: '2026-11-01', end: '2026-11-30' });
        expect(screen.getByRole('button', { name: /Mês atual/ })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /Hoje/ })).toHaveAttribute('aria-pressed', 'false');
    });

    it('mostra Início e Fim como dd/mm/aaaa e o campo ativo começa em Início', () => {
        render(<Harness initial={{ start: '2026-11-03', end: '2026-11-09' }} />);
        const inicio = screen.getByRole('button', { name: /Início/ });
        const fim = screen.getByRole('button', { name: /Fim/ });
        expect(inicio).toHaveTextContent('03/11/2026');
        expect(fim).toHaveTextContent('09/11/2026');
        expect(inicio).toHaveAttribute('aria-pressed', 'true');
        expect(fim).toHaveAttribute('aria-pressed', 'false');
    });

    it('escolher o início passa o foco para o Fim; escolher o fim grava só o fim', () => {
        const spy = jest.fn();
        render(<Harness initial={{ start: '2026-11-03', end: '2026-11-09' }} spy={spy} />);
        fireEvent.click(screen.getByRole('button', { name: '5' }));
        expect(spy).toHaveBeenLastCalledWith({ start: '2026-11-05', end: '2026-11-09' });
        expect(screen.getByRole('button', { name: /Fim/ })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: '12' }));
        expect(spy).toHaveBeenLastCalledWith({ start: '2026-11-05', end: '2026-11-12' });
    });

    it('os campos aceitam clique para trocar o campo ativo', () => {
        render(<Harness initial={{ start: '2026-11-03', end: '2026-11-09' }} />);
        fireEvent.click(screen.getByRole('button', { name: /Fim/ }));
        expect(screen.getByRole('button', { name: /Fim/ })).toHaveAttribute('aria-pressed', 'true');
        act(() => undefined);
    });

    it('data vazia aparece como "Selecionar"', () => {
        render(<Harness initial={{ start: '', end: '' }} />);
        expect(screen.getByRole('button', { name: /Início/ })).toHaveTextContent('Selecionar');
    });

    it('os campos truncam a data em vez de estourar (min-w-0)', () => {
        render(<Harness initial={{ start: '2026-11-03', end: '2026-11-09' }} />);
        expect(screen.getByRole('button', { name: /Início/ }).className).toMatch(/min-w-0/);
        expect(screen.getByText('03/11/2026').className).toMatch(/truncate/);
    });
});
