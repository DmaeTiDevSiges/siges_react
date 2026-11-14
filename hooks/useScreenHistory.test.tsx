import React, { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { HashRouter, useNavigate } from 'react-router';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/app', () => ({ App: { addListener: jest.fn(), exitApp: jest.fn() } }));

import { useScreenHistory } from './useScreenHistory';

type S = 'home' | 'list' | 'detail' | 'report';

let nav: ReturnType<typeof useNavigate>;
let go: (s: S) => void;

const Harness: React.FC<{ enabled?: boolean; canEnter?: (s: S) => boolean }> = ({ enabled = true, canEnter }) => {
    const [current, setCurrent] = useState<S>('home');
    nav = useNavigate();
    go = setCurrent;
    useScreenHistory<S>({ screen: current, setScreen: setCurrent, enabled, homeScreen: 'home', canEnter });
    return <div data-testid="screen">{current}</div>;
};

// HashRouter de verdade (o do app): grava `idx` em window.history, que o hook usa.
beforeEach(() => window.history.replaceState(null, '', '#/'));

const setup = (props: React.ComponentProps<typeof Harness> = {}) =>
    render(<HashRouter><Harness {...props} /></HashRouter>);

const now = () => screen.getByTestId('screen').textContent;
/** Espera a tela virar `expected` (voltar/avançar do histórico é assíncrono no jsdom). */
const expectScreen = (expected: S) => waitFor(() => expect(now()).toBe(expected));
const back = async () => { await act(async () => { nav(-1); await new Promise(r => setTimeout(r, 20)); }); };
const forward = async () => { await act(async () => { nav(1); await new Promise(r => setTimeout(r, 20)); }); };

describe('useScreenHistory', () => {
    it('voltar (history -1) retorna à tela anterior', async () => {
        setup();
        act(() => go('list'));
        act(() => go('detail'));
        await expectScreen('detail');
        await back();
        await expectScreen('list');
        await back();
        await expectScreen('home');
    });

    it('avançar volta à tela seguinte', async () => {
        setup();
        act(() => go('list'));
        await back();
        await forward();
        await expectScreen('list');
    });

    it('navegar para a tela que era a anterior desempilha (seta do cabeçalho)', async () => {
        setup();
        act(() => go('list'));
        act(() => go('detail'));
        act(() => go('list')); // "voltar" feito pelo app: não empilha de novo
        await expectScreen('list');
        await act(async () => { await new Promise(r => setTimeout(r, 20)); }); // deixa o desempilhar terminar
        await back();
        await expectScreen('home'); // histórico: home, list (detail foi descartado do caminho)
    });

    it('trocar de tela depois de voltar abre nova entrada (sem repetir a anterior)', async () => {
        setup();
        act(() => go('list'));
        await back();
        act(() => go('list')); // mesma tela de antes: precisa virar entrada nova
        act(() => go('detail'));
        await back();
        await expectScreen('list');
        await back();
        await expectScreen('home');
    });

    it('voltar para tela que exige seleção perdida cai na tela inicial', async () => {
        let hasSelection = true;
        setup({ canEnter: s => (s === 'report' ? hasSelection : true) });
        act(() => go('report'));
        act(() => go('list'));
        hasSelection = false;
        await back();
        await expectScreen('home');
    });

    it('sem usuário logado (enabled=false) não mexe na URL nem no histórico', async () => {
        setup({ enabled: false });
        act(() => go('list'));
        await back();
        // sem histórico gerado, o voltar não muda a tela
        await expectScreen('list');
    });
});
