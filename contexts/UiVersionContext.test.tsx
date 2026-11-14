import React from 'react';
import { act, render, screen } from '@testing-library/react';

const mockFlag = { on: true };
const mockAuth: { user: { isAdminSuper?: boolean } | null | 'sem-provider' } = { user: null };
jest.mock('../features', () => ({ isUiV2Available: () => mockFlag.on }));
jest.mock('@capacitor/preferences', () => ({ Preferences: { get: jest.fn().mockResolvedValue({ value: null }), set: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('./AuthContext', () => ({
    useOptionalAuth: () => (mockAuth.user === 'sem-provider' ? undefined : { currentUser: mockAuth.user }),
}));

import { UiVersionProvider, useUiVersion } from './UiVersionContext';

let api: ReturnType<typeof useUiVersion>;
const Probe = () => {
    api = useUiVersion();
    return <div data-testid="probe">{`${api.available}|${api.isV2}|${api.uiVersion}`}</div>;
};
const mount = () => render(<UiVersionProvider><Probe /></UiVersionProvider>);
const state = () => screen.getByTestId('probe').textContent;

beforeEach(() => {
    mockFlag.on = true;
    mockAuth.user = null;
    localStorage.clear();
    document.documentElement.classList.remove('ui-v2');
});

describe('UiVersionContext — visual novo só para o super admin', () => {
    it('super admin com a chave ligada antes: usa o visual novo e a classe ui-v2 fica no <html>', () => {
        localStorage.setItem('app_ui_version', 'v2');
        mockAuth.user = { isAdminSuper: true };
        mount();
        expect(state()).toBe('true|true|v2');
        expect(document.documentElement.classList.contains('ui-v2')).toBe(true);
    });

    it('usuário comum que já tinha ligado a chave volta ao visual atual, sem opção, e a preferência guardada não é apagada', () => {
        localStorage.setItem('app_ui_version', 'v2');
        mockAuth.user = { isAdminSuper: false };
        mount();
        expect(state()).toBe('false|false|v1');
        expect(document.documentElement.classList.contains('ui-v2')).toBe(false);
        expect(localStorage.getItem('app_ui_version')).toBe('v2');
    });

    it('usuário sem a propriedade isAdminSuper também fica no visual atual', () => {
        localStorage.setItem('app_ui_version', 'v2');
        mockAuth.user = {};
        mount();
        expect(state()).toBe('false|false|v1');
    });

    it('sem usuário logado (ou fora do provider de autenticação): visual atual', () => {
        localStorage.setItem('app_ui_version', 'v2');
        mount();
        expect(state()).toBe('false|false|v1');
        mockAuth.user = 'sem-provider';
        mount();
        expect(screen.getAllByTestId('probe')[1].textContent).toBe('false|false|v1');
    });

    it('com a flag de build desligada nem o super admin vê a chave ou o visual novo', () => {
        mockFlag.on = false;
        localStorage.setItem('app_ui_version', 'v2');
        mockAuth.user = { isAdminSuper: true };
        mount();
        expect(state()).toBe('false|false|v1');
    });

    it('super admin liga e desliga pela chave e a escolha é guardada', () => {
        mockAuth.user = { isAdminSuper: true };
        mount();
        expect(state()).toBe('true|false|v1');
        act(() => api.setUiVersion('v2'));
        expect(state()).toBe('true|true|v2');
        expect(localStorage.getItem('app_ui_version')).toBe('v2');
        act(() => api.setUiVersion('v1'));
        expect(state()).toBe('true|false|v1');
        expect(localStorage.getItem('app_ui_version')).toBe('v1');
    });

    it('usuário comum não consegue ligar nem por código: setUiVersion não faz nada', () => {
        mockAuth.user = { isAdminSuper: false };
        mount();
        act(() => api.setUiVersion('v2'));
        expect(state()).toBe('false|false|v1');
        expect(localStorage.getItem('app_ui_version')).toBeNull();
    });

    it('a escolha do super admin volta quando ele entra de novo; outro usuário no mesmo aparelho não herda o visual novo', () => {
        localStorage.setItem('app_ui_version', 'v2');
        mockAuth.user = null;
        const { rerender } = mount();
        expect(state()).toBe('false|false|v1');
        mockAuth.user = { isAdminSuper: true };
        rerender(<UiVersionProvider><Probe /></UiVersionProvider>);
        expect(state()).toBe('true|true|v2');
        mockAuth.user = { isAdminSuper: false };
        rerender(<UiVersionProvider><Probe /></UiVersionProvider>);
        expect(state()).toBe('false|false|v1');
        expect(document.documentElement.classList.contains('ui-v2')).toBe(false);
    });
});
