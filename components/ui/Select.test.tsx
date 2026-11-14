import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { computeAccessibleName } from 'dom-accessibility-api';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/haptics', () => ({ Haptics: { impact: jest.fn() }, ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM' } }));

import { Select } from './Select';
import { Modal } from './Modal';
import { __resetDialogStack } from '../../hooks/useDialogA11y';
import { __resetBackHandlers } from '../../utils/backButton';

const OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'a', label: 'Alfa' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gama' },
];

type Props = Partial<React.ComponentProps<typeof Select>> & { initial?: string | string[] };

/** Select controlado, como é usado no app. */
const Harness: React.FC<Props & { spy?: jest.Mock }> = ({ initial, spy, ...rest }) => {
    const [value, setValue] = useState<string | string[]>(initial ?? (rest.multiple ? [] : ''));
    return (
        <Select
            label="Equipe"
            name="team"
            options={OPTIONS}
            value={value}
            onChange={(e: { target: { value: string | string[] } }) => { setValue(e.target.value); spy?.(e); }}
            {...rest}
        />
    );
};

const trigger = () => screen.getByRole('combobox', { name: /Equipe/ });
const search = () => screen.getByLabelText('Filtrar opções...');
/** Texto visível (ignora as <option> do <select> nativo escondido). */
const shown = (label: string) => screen.queryAllByText(label).filter(e => !e.closest('select'));
/** Nome acessível (o que o leitor de tela fala), sem o texto dos ícones. */
const nameOf = (node: Element | null | undefined) => (node ? computeAccessibleName(node) : undefined);
const el = (label: string) => {
    const found = shown(label);
    if (found.length === 0) throw new Error(`Não achei "${label}" visível`);
    return found[0];
};

beforeEach(() => { __resetDialogStack(); __resetBackHandlers(); });

describe('Select — comportamento (já existia e deve continuar igual)', () => {
    it('mostra o texto de seleção: padrão, personalizado, opção escolhida e contagem em múltiplo', () => {
        const { unmount } = render(<Harness />);
        expect(screen.getByText('Selecione...')).toBeInTheDocument();
        unmount();
        const b = render(<Harness placeholder="Escolha a equipe" />);
        expect(screen.getByText('Escolha a equipe')).toBeInTheDocument();
        b.unmount();
        const c = render(<Harness initial="b" />);
        expect(shown('Beta').length).toBeGreaterThan(0);
        c.unmount();
        render(<Harness multiple initial={['a', 'b']} />);
        expect(screen.getByText('2 selecionado(s)')).toBeInTheDocument();
    });

    it('abre ao clicar e lista as opções', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Selecione...'));
        for (const label of ['Alfa', 'Beta', 'Gama']) expect(el(label)).toBeInTheDocument();
        expect(search()).toBeInTheDocument();
    });

    it('escolher uma opção chama onChange com { target: { value, name } } e fecha', () => {
        const spy = jest.fn();
        render(<Harness spy={spy} />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.click(el('Beta'));
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0].target).toEqual({ value: 'b', name: 'team' });
        expect(screen.queryByLabelText('Filtrar opções...')).not.toBeInTheDocument();
    });

    it('múltiplo: marca/desmarca e continua aberto', () => {
        const spy = jest.fn();
        render(<Harness multiple spy={spy} />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.click(el('Alfa'));
        fireEvent.click(el('Gama'));
        expect(spy.mock.calls.at(-1)[0].target.value).toEqual(['a', 'c']);
        expect(screen.getByLabelText('Filtrar opções...')).toBeInTheDocument();
        fireEvent.click(el('Alfa'));
        expect(spy.mock.calls.at(-1)[0].target.value).toEqual(['c']);
    });

    it('filtra pelo texto (sem diferenciar maiúsculas) e mantém SEMPRE a opção de valor vazio', () => {
        const onSearchChange = jest.fn();
        render(<Harness onSearchChange={onSearchChange} />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.change(search(), { target: { value: 'BET' } });
        expect(onSearchChange).toHaveBeenCalledWith('BET');
        expect(el('Beta')).toBeInTheDocument();
        expect(shown('Alfa')).toHaveLength(0);
        expect(el('Todos')).toBeInTheDocument();
        // com a opção vazia presente, a lista nunca fica sem itens
        fireEvent.change(search(), { target: { value: 'zzz' } });
        expect(el('Todos')).toBeInTheDocument();
        expect(screen.queryByText('Nenhum resultado encontrado.')).not.toBeInTheDocument();
    });

    it('sem opção de valor vazio, filtro sem resultado mostra "Nenhum resultado encontrado."', () => {
        render(<Harness options={OPTIONS.slice(1)} />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.change(search(), { target: { value: 'zzz' } });
        expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
    });

    it('desabilitado não abre', () => {
        render(<Harness disabled />);
        fireEvent.click(screen.getByText('Selecione...'));
        expect(screen.queryByLabelText('Filtrar opções...')).not.toBeInTheDocument();
    });

    it('limpável: o botão de limpar devolve "" (ou [] em múltiplo)', () => {
        const spy = jest.fn();
        const { unmount } = render(<Harness clearable initial="a" spy={spy} />);
        fireEvent.click(screen.getByText('close').closest('button')!);
        expect(spy.mock.calls.at(-1)[0].target.value).toBe('');
        unmount();
        render(<Harness clearable multiple initial={['a']} spy={spy} />);
        fireEvent.click(screen.getByText('close').closest('button')!);
        expect(spy.mock.calls.at(-1)[0].target.value).toEqual([]);
    });

    it('Esc no campo de filtro fecha; clicar fora também', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.keyDown(search(), { key: 'Escape' });
        expect(screen.queryByLabelText('Filtrar opções...')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.mouseDown(document.body);
        expect(screen.queryByLabelText('Filtrar opções...')).not.toBeInTheDocument();
    });

    it('mantém um <select> nativo escondido com as opções e o valor (formulários e ref)', () => {
        const { container } = render(<Harness initial="b" />);
        const native = container.querySelector('select')!;
        expect(native.value).toBe('b');
        expect(Array.from(native.options).map(o => o.value)).toEqual(['', 'a', 'b', 'c']);
    });

    it('mostra o erro e o asterisco de obrigatório', () => {
        render(<Harness error="Escolha uma equipe" required />);
        expect(screen.getByText('Escolha uma equipe')).toBeInTheDocument();
        expect(screen.getByText('*')).toBeInTheDocument();
    });
});

describe('Select — acessibilidade (teclado e leitor de tela)', () => {
    it('o campo é um combobox focalizável, com o nome do rótulo e o estado aberto/fechado', () => {
        render(<Harness />);
        const box = trigger();
        expect(box).toHaveAttribute('tabindex', '0');
        expect(box).toHaveAttribute('aria-haspopup', 'listbox');
        expect(box).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(screen.getByText('Selecione...'));
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('sem rótulo, o nome vem do texto mostrado', () => {
        render(<Harness label={undefined} placeholder="Escolha a equipe" />);
        expect(screen.getByRole('combobox', { name: 'Escolha a equipe' })).toBeInTheDocument();
    });

    it('desabilitado: aria-disabled e fora da ordem de Tab', () => {
        render(<Harness disabled />);
        expect(trigger()).toHaveAttribute('aria-disabled', 'true');
        expect(trigger()).toHaveAttribute('tabindex', '-1');
    });

    it('obrigatório e com erro: aria-required, aria-invalid e erro descrito/anunciado', () => {
        render(<Harness required error="Escolha uma equipe" />);
        expect(trigger()).toHaveAttribute('aria-required', 'true');
        expect(trigger()).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma equipe');
        expect(trigger()).toHaveAccessibleDescription('Escolha uma equipe');
    });

    it.each([['Enter'], [' '], ['ArrowDown'], ['ArrowUp']])('a tecla "%s" no campo abre a lista e leva o foco ao filtro', key => {
        render(<Harness />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key });
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(search()).toHaveFocus();
    });

    it('a lista é um listbox de options com aria-selected; em múltiplo, aria-multiselectable', () => {
        const { unmount } = render(<Harness initial="b" />);
        fireEvent.click(el('Beta'));
        const list = screen.getByRole('listbox');
        expect(trigger()).toHaveAttribute('aria-controls', list.id);
        const options = within(list).getAllByRole('option');
        expect(options.map(o => nameOf(o))).toEqual(['Todos', 'Alfa', 'Beta', 'Gama']);
        expect(options.map(o => o.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true', 'false']);
        expect(list).not.toHaveAttribute('aria-multiselectable');
        unmount();
        render(<Harness multiple initial={['a']} />);
        fireEvent.click(screen.getByText('1 selecionado(s)'));
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
        // o ícone de "marcado" não entra no nome da opção
        expect(within(screen.getByRole('listbox')).getAllByRole('option').map(o => nameOf(o))).toEqual(['Todos', 'Alfa', 'Beta', 'Gama']);
    });

    it('setas movem a opção ativa (aria-activedescendant), com Home/End; Enter escolhe', () => {
        const spy = jest.fn();
        render(<Harness spy={spy} />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        const active = () => nameOf(document.getElementById(search().getAttribute('aria-activedescendant') ?? ''));
        expect(active()).toBe('Todos');
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        expect(active()).toBe('Alfa');
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        expect(active()).toBe('Beta');
        fireEvent.keyDown(search(), { key: 'ArrowUp' });
        expect(active()).toBe('Alfa');
        fireEvent.keyDown(search(), { key: 'End' });
        expect(active()).toBe('Gama');
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        expect(active()).toBe('Gama');
        fireEvent.keyDown(search(), { key: 'Home' });
        expect(active()).toBe('Todos');
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'Enter' });
        expect(spy.mock.calls[0][0].target.value).toBe('a');
    });

    it('ao abrir, a opção ativa é a escolhida; ao digitar, volta a ser a primeira que casa', () => {
        render(<Harness initial="b" />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'Enter' });
        const active = () => nameOf(document.getElementById(search().getAttribute('aria-activedescendant') ?? ''));
        expect(active()).toBe('Beta');
        fireEvent.change(search(), { target: { value: 'ga' } });
        expect(active()).toBe('Gama');
    });

    it('Enter escolhe e devolve o foco ao campo (lista fecha)', () => {
        render(<Harness />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'Enter' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
        expect(trigger()).toHaveTextContent('Alfa');
    });

    it('múltiplo: Enter marca e a lista continua aberta', () => {
        const spy = jest.fn();
        render(<Harness multiple spy={spy} />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'ArrowDown' });
        fireEvent.keyDown(search(), { key: 'Enter' });
        expect(spy.mock.calls.at(-1)[0].target.value).toEqual(['a']);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('Esc fecha a lista, devolve o foco ao campo e NÃO fecha o modal que está por baixo', () => {
        const closeModal = jest.fn();
        render(<Modal isOpen onClose={closeModal} title="Filtros"><Harness /></Modal>);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'Enter' });
        fireEvent.keyDown(search(), { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
        expect(closeModal).not.toHaveBeenCalled();
        // com a lista fechada, o próximo Esc é do modal
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(closeModal).toHaveBeenCalledTimes(1);
    });

    it('Tab no filtro fecha a lista e leva o foco de volta ao campo (a lista fica no fim da página)', () => {
        render(<Harness />);
        trigger().focus();
        fireEvent.keyDown(trigger(), { key: 'Enter' });
        fireEvent.keyDown(search(), { key: 'Tab' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(trigger()).toHaveFocus();
    });

    it('escolher com o mouse também devolve o foco ao campo', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Selecione...'));
        fireEvent.click(el('Beta'));
        expect(trigger()).toHaveFocus();
    });

    it('o botão de limpar tem nome, fica FORA do combobox e não abre a lista', () => {
        render(<Harness clearable initial="a" />);
        const clear = screen.getByRole('button', { name: 'Limpar seleção' });
        expect(trigger().contains(clear)).toBe(false);
        fireEvent.click(clear);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('o <select> nativo escondido não é lido em dobro (aria-hidden)', () => {
        const { container } = render(<Harness />);
        expect(container.querySelector('select')).toHaveAttribute('aria-hidden', 'true');
    });

    it('clicar no rótulo leva o foco ao campo', () => {
        render(<Harness />);
        fireEvent.click(el('Equipe'));
        expect(trigger()).toHaveFocus();
    });
});
