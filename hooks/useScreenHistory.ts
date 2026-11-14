import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { registerBackHandler, runBackHandlers } from '../utils/backButton';

/**
 * Ponte tela ⇄ URL (etapa 1 do PLANO_MELHORIAS_FRONTEND.md).
 *
 * O `currentScreen` do App continua sendo a fonte de verdade; aqui cada troca
 * de tela vira uma entrada no histórico (`#/<tela>`), então:
 *   - voltar do navegador/Electron volta à tela anterior;
 *   - quando o app navega para a tela que era a anterior no histórico (ex.: a
 *     seta do cabeçalho), a entrada é desempilhada em vez de empilhar de novo;
 *   - voltar para entrada sem tela conhecida ou que exige seleção perdida
 *     (`canEnter`) cai em `homeScreen` em vez de tela em branco.
 * Botão voltar do Android (antes fechava o app em qualquer tela), em ordem:
 *   1. tratadores "por cima" (utils/backButton: modal, painel, passo de fluxo);
 *   2. `logicalBack` — o mesmo voltar da seta do cabeçalho (handleBack do App);
 *   3. histórico (-1); 4. tela inicial; 5. sair do app (já na tela inicial).
 * Os ids selecionados (ativo, visita...) ainda ficam em memória; conforme cada
 * fluxo migrar para rotas com parâmetros, eles passam para a URL.
 *
 * Só age com `enabled` (usuário logado): antes disso o `#` pode trazer o token
 * de recuperação de senha do Supabase e não pode ser sobrescrito.
 */

interface Options<S extends string> {
    screen: S;
    setScreen: (screen: S) => void;
    enabled: boolean;
    /** Tela raiz: destino de fallback e onde o voltar do Android sai do app. */
    homeScreen: S;
    /** false = esta tela não abre sem uma seleção que se perdeu (ex.: ativo). */
    canEnter?: (screen: S) => boolean;
    /** Voltar "de verdade" da tela atual (seta do cabeçalho). true = tratou. */
    logicalBack?: () => boolean;
}

interface EntryState { screen?: string }

const pathOf = (screen: string) => `/${screen}`;
/** Posição da entrada atual no histórico (o react-router grava `idx` no history.state). */
const historyIdx = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0;

export const useScreenHistory = <S extends string>({ screen, setScreen, enabled, homeScreen, canEnter, logicalBack }: Options<S>): void => {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();
    // Tela que acabou de vir de um POP (voltar/avançar): não vira nova entrada.
    const fromPop = useRef<string | null>(null);
    // O próprio hook chamou navigate(-1): o POP resultante já está tratado.
    const selfPop = useRef(false);
    const synced = useRef(false);
    // Telas por posição do histórico (só nesta sessão; após recarregar, vazio).
    const stack = useRef<string[]>([]);

    const latest = useRef({ screen, setScreen, homeScreen, canEnter, logicalBack, navigate });
    latest.current = { screen, setScreen, homeScreen, canEnter, logicalBack, navigate };

    // Tela → URL
    useEffect(() => {
        if (!enabled) return;
        if (fromPop.current === screen) { fromPop.current = null; return; }
        const path = pathOf(screen);
        const state: EntryState = { screen };
        if (!synced.current) {
            synced.current = true;
            stack.current = [];
            stack.current[historyIdx()] = screen;
            navigate(path, { replace: true, state });
            return;
        }
        if (location.pathname === path) return;
        const idx = historyIdx();
        if (idx > 0 && stack.current[idx - 1] === screen) {
            // Voltou para a tela anterior: desempilha.
            selfPop.current = true;
            navigate(-1);
            return;
        }
        stack.current = stack.current.slice(0, idx + 1);
        stack.current[idx + 1] = screen;
        navigate(path, { state });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen, enabled]);

    // URL → tela (só voltar/avançar)
    useEffect(() => {
        // 'default' = entrada inicial (ainda sem nossa marca); o efeito acima a sincroniza.
        if (!enabled || navigationType !== 'POP' || !synced.current || location.key === 'default') return;
        if (selfPop.current) { selfPop.current = false; return; }
        const { screen: current, setScreen: set, homeScreen: home, canEnter: allowed, navigate: go } = latest.current;
        const target = (location.state as EntryState | null)?.screen as S | undefined;
        if (!target) {
            // Entrada que não é nossa (ex.: URL digitada): volta a refletir a tela atual.
            go(pathOf(current), { replace: true, state: { screen: current } });
            return;
        }
        if (target === current) return;
        if (allowed && !allowed(target)) {
            if (home !== current) { fromPop.current = home; set(home); }
            stack.current[historyIdx()] = home;
            go(pathOf(home), { replace: true, state: { screen: home } });
            return;
        }
        stack.current[historyIdx()] = target;
        fromPop.current = target;
        set(target);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    // Botão voltar do Android
    useEffect(() => {
        if (!enabled || !Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        const unregister = registerBackHandler(() => {
            const { screen: current, setScreen: set, homeScreen: home, navigate: go, logicalBack: back } = latest.current;
            if (back?.()) return true;
            if (historyIdx() > 0) { go(-1); return true; }
            if (current !== home) { set(home); return true; }
            return false;
        });
        CapApp.addListener('backButton', () => {
            if (!runBackHandlers()) CapApp.exitApp().catch(() => undefined);
        }).then(h => { remove = () => h.remove(); }).catch(() => undefined);
        return () => { unregister(); remove?.(); };
    }, [enabled]);
};
