import React, { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { HashRouter, useNavigate } from 'react-router';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/app', () => ({ App: { addListener: jest.fn(), exitApp: jest.fn() } }));

import { useScreenHistory } from './useScreenHistory';
import { fromPath, toPath, type Selection } from '../app/screenRoutes';

let nav: ReturnType<typeof useNavigate>;
let open: (screen: string, sel?: Selection) => void;
let setEnabled: (v: boolean) => void;
const applied: Selection[] = [];

const Harness: React.FC<{ canEnter?: (s: string) => boolean; startEnabled?: boolean }> = ({ canEnter, startEnabled = true }) => {
    const [current, setCurrent] = useState('dashboard');
    const [sel, setSel] = useState<Selection>({});
    const [enabled, setEn] = useState(startEnabled);
    nav = useNavigate();
    setEnabled = setEn;
    open = (s, next) => { if (next) setSel(prev => ({ ...prev, ...next })); setCurrent(s); };
    useScreenHistory<string>({
        screen: current,
        setScreen: setCurrent,
        enabled,
        homeScreen: 'dashboard',
        canEnter,
        selection: sel,
        applySelection: next => { applied.push(next); setSel(prev => ({ ...prev, ...next })); },
        routing: { toPath: (s, x) => toPath(s, x), fromPath: p => fromPath(p) },
    });
    return <div data-testid="state">{`${current}|${sel.visitId ?? ''}|${sel.ovaId ?? ''}|${sel.orderTypeId ?? ''}`}</div>;
};

const now = () => screen.getByTestId('state').textContent;
const hash = () => window.location.hash;
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 20)); });
const back = async () => { await act(async () => { nav(-1); await new Promise(r => setTimeout(r, 20)); }); };

beforeEach(() => {
    applied.length = 0;
    window.history.replaceState(null, '', '#/');
});

describe('rotas com parâmetros', () => {
    it('a URL passa a levar os ids da tela', async () => {
        render(<HashRouter><Harness /></HashRouter>);
        act(() => open('order-visit-execute', { visitId: '12' }));
        await waitFor(() => expect(hash()).toBe('#/visita/12'));
        act(() => open('order-visit-asset-report', { ovaId: '900' }));
        await waitFor(() => expect(hash()).toBe('#/visita-ativo/900'));
    });

    it('voltar restaura os ids DA URL (mesmo com a memória já trocada)', async () => {
        render(<HashRouter><Harness /></HashRouter>);
        act(() => open('order-visit-execute', { visitId: '12' }));
        act(() => open('order-visit-asset-report', { ovaId: '900' }));
        // memória "esquecida": outro ativo selecionado sem passar pela URL
        await settle();
        await back();
        await waitFor(() => expect(now()).toBe('order-visit-execute|12|900|'));
        expect(hash()).toBe('#/visita/12');
    });

    it('trocar de ativo na mesma tela vira nova entrada e voltar traz o ativo anterior', async () => {
        render(<HashRouter><Harness /></HashRouter>);
        act(() => open('order-visit-asset-report', { ovaId: '900' }));
        act(() => open('order-visit-asset-report', { ovaId: '901' }));
        await waitFor(() => expect(hash()).toBe('#/visita-ativo/901'));
        await settle();
        await back();
        await waitFor(() => expect(now()).toBe('order-visit-asset-report||900|'));
        expect(applied.at(-1)).toEqual({ ovaId: '900' });
    });

    it('rota migrada ignora canEnter (a seleção veio da URL)', async () => {
        render(<HashRouter><Harness canEnter={() => false} /></HashRouter>);
        act(() => open('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' }));
        act(() => open('order-visit-asset-report', { ovaId: '900' }));
        await settle();
        await back();
        await waitFor(() => expect(now()).toBe('order-visit-asset-activities||900|5'));
    });

    it('link direto / recarregar: abre a tela da URL em vez da inicial', async () => {
        window.history.replaceState(null, '', '#/visita-ativo/900/atividades/5');
        render(<HashRouter><Harness /></HashRouter>);
        await waitFor(() => expect(now()).toBe('order-visit-asset-activities||900|5'));
        expect(hash()).toBe('#/visita-ativo/900/atividades/5');
        expect(applied[0]).toEqual({ ovaId: '900', orderTypeId: '5' });
    });

    it('link aberto antes do login: a URL fica intacta e a visita abre só depois de logar', async () => {
        window.history.replaceState(null, '', '#/visita/12');
        render(<HashRouter><Harness startEnabled={false} /></HashRouter>);
        await settle();
        expect(hash()).toBe('#/visita/12'); // deslogado: não sobrescreve o hash
        expect(now()).toBe('dashboard|||');
        act(() => setEnabled(true));
        await waitFor(() => expect(now()).toBe('order-visit-execute|12||'));
        expect(hash()).toBe('#/visita/12');
    });

    it('URL desconhecida cai na tela atual (não numa tela em branco)', async () => {
        window.history.replaceState(null, '', '#/qualquer-coisa');
        render(<HashRouter><Harness /></HashRouter>);
        await waitFor(() => expect(hash()).toBe('#/dashboard'));
        expect(now()).toBe('dashboard|||');
    });
});
