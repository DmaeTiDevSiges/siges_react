import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { isUiV2Available } from '../features';
import { useOptionalAuth } from './AuthContext';

/**
 * Chave "Visual novo (beta)" — docs/PLANO_DESIGN_ESTILO_NUBANK.md, seção 5.1.
 *
 * - `v1` = visual atual (padrão). `v2` = redesign.
 * - Com VITE_FEATURE_UI_V2 desligada, fica sempre em v1 e a chave nem aparece.
 * - **Só o super admin (`isAdminSuper`) pode usar o visual novo** (decisão de 14/11/2026, F4 pausada):
 *   para os demais a chave não aparece e o visual é sempre o atual, mesmo que já tenham ligado
 *   a chave antes — a preferência guardada NÃO é apagada (volta se o usuário virar super admin).
 * - Aplica a classe `ui-v2` em <html>; os tokens de index.css só mudam dentro dela,
 *   então desligar a chave devolve o app exatamente ao visual anterior.
 * - Persistência igual ao tema: localStorage + espelho no Preferences nativo
 *   (o WebView pode ter o localStorage apagado).
 */

export type UiVersion = 'v1' | 'v2';

const UI_KEY = 'app_ui_version';
const HIDE_VALUES_KEY = 'app_hide_values';

interface UiVersionContextValue {
    /** A flag de build permite o visual novo (mostrar a chave). */
    available: boolean;
    uiVersion: UiVersion;
    isV2: boolean;
    setUiVersion: (v: UiVersion) => void;
    /** "Ocultar valores" (ícone de olho) — só tem efeito em componentes v2 (HiddenValue). */
    hideValues: boolean;
    toggleHideValues: () => void;
}

const UiVersionContext = createContext<UiVersionContextValue | null>(null);

const readLocal = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const writeLocal = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* sem storage: só a sessão */ }
};

export const UiVersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    /** A flag de build está ligada neste APK. */
    const flag = isUiV2Available();
    const auth = useOptionalAuth();
    /** Flag ligada E usuário logado é super admin: só então a chave aparece e o visual novo vale. */
    const available = flag && auth?.currentUser?.isAdminSuper === true;

    const [uiVersion, setUiVersionState] = useState<UiVersion>(() =>
        flag && readLocal(UI_KEY) === 'v2' ? 'v2' : 'v1'
    );
    const [hideValues, setHideValues] = useState<boolean>(() => readLocal(HIDE_VALUES_KEY) === 'true');

    // Restaura do Preferences nativo quando o localStorage foi apagado.
    useEffect(() => {
        if (!flag || readLocal(UI_KEY)) return;
        Preferences.get({ key: UI_KEY })
            .then(({ value }) => {
                if (value === 'v2' || value === 'v1') setUiVersionState(value);
            })
            .catch(() => {});
    }, [flag]);

    const isV2 = available && uiVersion === 'v2';

    // Classe na raiz — mesmo mecanismo do `dark`.
    useEffect(() => {
        document.documentElement.classList.toggle('ui-v2', isV2);
    }, [isV2]);

    const setUiVersion = useCallback((v: UiVersion) => {
        if (!available) return; // quem não é super admin não troca de visual (nem por código)
        setUiVersionState(v);
        writeLocal(UI_KEY, v);
        Preferences.set({ key: UI_KEY, value: v }).catch(() => {});
    }, [available]);

    const toggleHideValues = useCallback(() => {
        setHideValues(prev => {
            const next = !prev;
            writeLocal(HIDE_VALUES_KEY, String(next));
            return next;
        });
    }, []);

    const value = useMemo<UiVersionContextValue>(() => ({
        available,
        uiVersion: isV2 ? 'v2' : 'v1',
        isV2,
        setUiVersion,
        hideValues,
        toggleHideValues,
    }), [available, isV2, setUiVersion, hideValues, toggleHideValues]);

    return <UiVersionContext.Provider value={value}>{children}</UiVersionContext.Provider>;
};

const FALLBACK: UiVersionContextValue = {
    available: false,
    uiVersion: 'v1',
    isV2: false,
    setUiVersion: () => {},
    hideValues: false,
    toggleHideValues: () => {},
};

/** Fora do provider (testes, telas isoladas) devolve v1 — nunca quebra. */
export const useUiVersion = (): UiVersionContextValue => useContext(UiVersionContext) ?? FALLBACK;
